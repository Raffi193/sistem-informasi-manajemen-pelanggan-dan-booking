-- ============================================================================
-- LPK CV. Fathan — Biaya kelas malam (Migrasi 0011)
-- Jalankan setelah 0010_admin_rls.sql.
--
-- Perubahan:
--   1. booking.biaya_tambahan menyimpan surcharge kelas malam.
--   2. get_jadwal_tersedia mengembalikan biaya_tambahan per slot.
--   3. create_booking menghitung dan menyimpan biaya_tambahan.
--
-- Aturan: slot yang mulai pukul 18:00 atau setelahnya dikenakan Rp20.000.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. Kolom biaya tambahan
-- ----------------------------------------------------------------------------
alter table public.booking
  add column if not exists biaya_tambahan int not null default 0;

-- Backfill booking lama yang memakai slot malam.
update public.booking b
set biaya_tambahan = 20000
from public.slot_template st
where b.slot_template_id = st.id
  and st.jam_mulai >= time '18:00'
  and b.biaya_tambahan = 0;

-- ----------------------------------------------------------------------------
-- 2. get_jadwal_tersedia + biaya_tambahan
--    Return type berubah, jadi function lama harus di-drop lebih dulu.
-- ----------------------------------------------------------------------------
drop function if exists public.get_jadwal_tersedia(date);

create function public.get_jadwal_tersedia(p_tanggal date)
returns table (
  slot_template_id uuid,
  urutan smallint,
  jam_mulai time,
  jam_selesai time,
  kapasitas smallint,
  biaya_tambahan int,
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
    case when st.jam_mulai >= time '18:00' then 20000 else 0 end as biaya_tambahan,
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
-- 3. create_booking + biaya_tambahan
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
  v_harga int;
  v_biaya_tambahan int;
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

  select harga
  into v_harga
  from public.paket
  where id = p_paket_id
    and status_aktif = true;

  if not found then
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

  v_biaya_tambahan := case
    when v_slot_template.jam_mulai >= time '18:00' then 20000
    else 0
  end;

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
    biaya_tambahan,
    tgl_booking
  )
  values (
    v_kode,
    v_customer_id,
    p_paket_id,
    p_slot_template_id,
    p_tanggal_latihan,
    'menunggu_pembayaran',
    v_biaya_tambahan,
    now()
  )
  returning id into v_booking_id;

  return json_build_object(
    'booking_id', v_booking_id,
    'kode_booking', v_kode,
    'tanggal_latihan', p_tanggal_latihan,
    'jam_mulai', v_slot_template.jam_mulai,
    'jam_selesai', v_slot_template.jam_selesai,
    'biaya_tambahan', v_biaya_tambahan,
    'total_biaya', v_harga + v_biaya_tambahan
  );
end;
$$;

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

commit;
