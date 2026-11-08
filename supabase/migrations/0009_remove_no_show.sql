-- ============================================================================
-- LPK CV. Fathan — Hapus fitur no-show (Migrasi 0009)
-- Jalankan manual di Supabase > SQL Editor setelah 0008_slot_template_management.sql.
--
-- Perubahan:
--   1. Booking lama berstatus no_show dikonversi menjadi batal.
--   2. Semua overload RPC lama yang menyentuh status booking dihapus.
--   3. Enum status_booking dibuat ulang tanpa nilai no_show.
--   4. Kolom booking.sisa_jam (kompensasi no-show) dihapus.
--   5. RPC yang bergantung pada status booking dibuat ulang.
--   6. create_booking & submit_bukti hanya boleh dipanggil service_role.
--
-- Catatan penting:
--   - Index parsial idx_booking_jadwal memakai predicate status. Index ini
--     harus dihapus sebelum tipe enum diubah, lalu dibuat ulang setelahnya.
--   - Kolom status diubah ke text terlebih dahulu agar tidak ada dependency
--     enum lama yang tersisa saat tipe lama dihapus.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. Konversi data lama
-- ----------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname in ('status_booking', 'status_booking_new')
      and t.typnamespace = 'public'::regnamespace
      and e.enumlabel = 'no_show'
  ) then
    update public.booking
    set status = 'batal'
    where status::text = 'no_show';
  end if;
end;
$$;

-- ----------------------------------------------------------------------------
-- 2. Lepas semua RPC/overload yang bergantung pada enum status booking
--
-- Jangan hanya drop signature tertentu. Overload lama (mis. create_booking
-- 5/6 argumen) dapat tertinggal dan menyebabkan error:
--   operator does not exist: status_booking_new <> status_booking
-- ----------------------------------------------------------------------------
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prokind = 'f'
      and p.proname in (
        'create_booking',
        'get_jadwal_tersedia',
        'get_booking_status',
        'submit_bukti',
        'mark_no_show'
      )
  loop
    execute format('drop function if exists %s', r.signature);
  end loop;
end;
$$;

-- ----------------------------------------------------------------------------
-- 3. Enum status_booking tanpa no_show
-- ----------------------------------------------------------------------------
-- Index parsial ini memakai predicate status dan akan gagal di-rebuild jika
-- tipe enum berubah. Hapus dulu, buat ulang setelah enum baru selesai.
drop index if exists public.idx_booking_jadwal;
drop index if exists public.idx_booking_status;

alter table public.booking
  alter column status drop default;

-- Ubah ke text dulu supaya kolom tidak lagi bergantung pada enum lama.
alter table public.booking
  alter column status type text
  using status::text;

-- Hapus tipe baru dari percobaan migrasi sebelumnya (jika ada) dan tipe lama.
drop type if exists public.status_booking_new;
drop type if exists public.status_booking;

create type public.status_booking as enum (
  'menunggu_pembayaran',
  'menunggu_verifikasi',
  'disetujui',
  'ditolak',
  'selesai',
  'batal'
);

alter table public.booking
  alter column status type public.status_booking
  using status::public.status_booking;

alter table public.booking
  alter column status set default 'menunggu_pembayaran';

create index if not exists idx_booking_status
  on public.booking (status);

create index if not exists idx_booking_jadwal
  on public.booking (tanggal_latihan, slot_template_id)
  where status not in ('ditolak', 'batal');

-- ----------------------------------------------------------------------------
-- 4. Hapus kolom kompensasi no-show
-- ----------------------------------------------------------------------------
alter table public.booking
  drop column if exists sisa_jam;

-- ----------------------------------------------------------------------------
-- 5. create_booking (versi 0008, tanpa perubahan perilaku)
-- ----------------------------------------------------------------------------
create or replace function public.create_booking(
  p_nama text,
  p_no_wa text,
  p_tanggal_lahir date,
  p_alamat text,
  p_paket_id uuid,
  p_slot_template_id uuid,
  p_tanggal_latihan date
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slot_template public.slot_template%rowtype;
  v_customer_id uuid;
  v_booking_id uuid;
  v_kode text;
  v_terpakai int;
  v_today date := (now() at time zone 'Asia/Jakarta')::date;
begin
  if nullif(btrim(coalesce(p_nama, '')), '') is null then
    raise exception 'NAMA_WAJIB';
  end if;

  if nullif(btrim(coalesce(p_no_wa, '')), '') is null then
    raise exception 'NO_WA_WAJIB';
  end if;

  if p_tanggal_lahir is null then
    raise exception 'TANGGAL_LAHIR_WAJIB';
  end if;

  if p_tanggal_lahir >= v_today then
    raise exception 'TANGGAL_LAHIR_TIDAK_VALID';
  end if;

  if nullif(btrim(coalesce(p_alamat, '')), '') is null then
    raise exception 'ALAMAT_WAJIB';
  end if;

  if char_length(btrim(p_alamat)) > 500 then
    raise exception 'ALAMAT_TERLALU_PANJANG';
  end if;

  if p_tanggal_latihan is null or p_tanggal_latihan < v_today then
    raise exception 'TANGGAL_TIDAK_VALID';
  end if;

  if not exists (
    select 1
    from public.paket
    where id = p_paket_id
      and status_aktif = true
  ) then
    raise exception 'PAKET_TIDAK_DITEMUKAN';
  end if;

  select *
  into v_slot_template
  from public.slot_template
  where id = p_slot_template_id
    and status_aktif = true
  for share;

  if not found then
    raise exception 'SLOT_TIDAK_DITEMUKAN';
  end if;

  -- Kunci per tanggal + template agar dua request bersamaan tidak dapat
  -- melewati kapasitas 4.
  perform pg_advisory_xact_lock(
    hashtext(p_tanggal_latihan::text || ':' || p_slot_template_id::text)::bigint
  );

  select count(*)::int
  into v_terpakai
  from public.booking
  where slot_template_id = p_slot_template_id
    and tanggal_latihan = p_tanggal_latihan
    and status not in ('ditolak', 'batal');

  if v_terpakai >= v_slot_template.kapasitas then
    raise exception 'SLOT_PENUH';
  end if;

  insert into public.customer (nama, no_wa, alamat, tanggal_lahir, status)
  values (
    btrim(p_nama),
    btrim(p_no_wa),
    btrim(p_alamat),
    p_tanggal_lahir,
    'calon'
  )
  on conflict (no_wa) do update
    set nama = excluded.nama,
        alamat = excluded.alamat,
        tanggal_lahir = excluded.tanggal_lahir
  returning id into v_customer_id;

  v_kode := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.booking (
    kode_booking,
    customer_id,
    paket_id,
    slot_template_id,
    tanggal_latihan,
    status,
    tgl_booking
  )
  values (
    v_kode,
    v_customer_id,
    p_paket_id,
    p_slot_template_id,
    p_tanggal_latihan,
    'menunggu_pembayaran',
    now()
  )
  returning id into v_booking_id;

  return json_build_object(
    'booking_id', v_booking_id,
    'kode_booking', v_kode,
    'tanggal_latihan', p_tanggal_latihan,
    'jam_mulai', v_slot_template.jam_mulai,
    'jam_selesai', v_slot_template.jam_selesai
  );
end;
$$;

-- Hanya route server /api/booking yang boleh membuat booking.
revoke all on function public.create_booking(
  text,
  text,
  date,
  text,
  uuid,
  uuid,
  date
) from public, anon, authenticated;
grant execute on function public.create_booking(
  text,
  text,
  date,
  text,
  uuid,
  uuid,
  date
) to service_role;

-- ----------------------------------------------------------------------------
-- 6. get_jadwal_tersedia (versi 0008)
-- ----------------------------------------------------------------------------
create or replace function public.get_jadwal_tersedia(p_tanggal date)
returns table (
  slot_template_id uuid,
  urutan smallint,
  jam_mulai time,
  jam_selesai time,
  kapasitas smallint,
  terpakai int,
  sisa int,
  tersedia boolean
)
language sql
security definer
set search_path = public
stable
as $$
  select
    st.id,
    st.urutan,
    st.jam_mulai,
    st.jam_selesai,
    st.kapasitas,
    (count(b.id) filter (where b.status not in ('ditolak', 'batal')))::int as terpakai,
    greatest(
      st.kapasitas
        - (count(b.id) filter (where b.status not in ('ditolak', 'batal')))::int,
      0
    )::int as sisa,
    (
      st.kapasitas
        - (count(b.id) filter (where b.status not in ('ditolak', 'batal')))::int
    ) > 0 as tersedia
  from public.slot_template st
  left join public.booking b
    on b.slot_template_id = st.id
    and b.tanggal_latihan = p_tanggal
  where st.status_aktif = true
  group by
    st.id,
    st.urutan,
    st.jam_mulai,
    st.jam_selesai,
    st.kapasitas
  order by st.jam_mulai, st.jam_selesai;
$$;

revoke all on function public.get_jadwal_tersedia(date) from public;
grant execute on function public.get_jadwal_tersedia(date) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 7. get_booking_status (versi 0007 tanpa sisa_jam)
-- ----------------------------------------------------------------------------
create or replace function public.get_booking_status(
  p_kode text,
  p_no_wa text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.booking%rowtype;
  v_jam_mulai time;
  v_jam_selesai time;
begin
  select b.* into v_booking
  from public.booking b
  join public.customer c on c.id = b.customer_id
  where b.kode_booking = upper(trim(p_kode))
    and c.no_wa = trim(p_no_wa);

  if not found then
    return null;
  end if;

  if v_booking.slot_template_id is not null then
    select jam_mulai, jam_selesai
    into v_jam_mulai, v_jam_selesai
    from public.slot_template
    where id = v_booking.slot_template_id;
  end if;

  return json_build_object(
    'kode_booking', v_booking.kode_booking,
    'status', v_booking.status,
    'tgl_booking', v_booking.tgl_booking,
    'tanggal_latihan', v_booking.tanggal_latihan,
    'jam_mulai', v_jam_mulai,
    'jam_selesai', v_jam_selesai
  );
end;
$$;

revoke all on function public.get_booking_status(text, text) from public;
grant execute on function public.get_booking_status(text, text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 8. submit_bukti (versi 0002, tanpa perubahan perilaku)
-- ----------------------------------------------------------------------------
create or replace function public.submit_bukti(
  p_kode text,
  p_no_wa text,
  p_jenis text,
  p_jumlah int,
  p_bukti_file text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.booking%rowtype;
  v_id uuid;
begin
  select b.* into v_booking
  from public.booking b
  join public.customer c on c.id = b.customer_id
  where b.kode_booking = upper(trim(p_kode))
    and c.no_wa = trim(p_no_wa);

  if not found then
    raise exception 'BOOKING_TIDAK_DITEMUKAN';
  end if;

  insert into public.pembayaran (booking_id, jenis, jumlah, bukti_file, status_verifikasi)
  values (v_booking.id, p_jenis::public.jenis_pembayaran, p_jumlah, p_bukti_file, 'menunggu')
  returning id into v_id;

  update public.booking set status = 'menunggu_verifikasi' where id = v_booking.id;

  return json_build_object('pembayaran_id', v_id);
end;
$$;

-- submit_bukti hanya dipanggil dari /api/bukti memakai service role.
-- Jangan pernah grant ke anon/authenticated.
revoke all on function public.submit_bukti(text, text, text, int, text)
  from public, anon, authenticated;
grant execute on function public.submit_bukti(text, text, text, int, text)
  to service_role;

commit;
