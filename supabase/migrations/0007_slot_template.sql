-- ============================================================================
-- LPK CV. Fathan — Template Jadwal & Kapasitas (Migrasi 0007)
-- Jalankan di Supabase > SQL Editor setelah migrasi 0001–0006.
--
-- Perubahan:
--   1. Template 5 jam latihan tetap per hari (Senin–Minggu).
--   2. Kapasitas maksimal 4 booking per tanggal + jam.
--   3. Booking menyimpan tanggal latihan dan template jam.
--   4. Backfill booking lama dari tabel slot.
--   5. RPC create_booking, get_jadwal_tersedia, dan get_booking_status.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Template jadwal
-- ----------------------------------------------------------------------------
create table if not exists public.slot_template (
  id uuid primary key default gen_random_uuid(),
  urutan smallint not null,
  jam_mulai time not null,
  jam_selesai time not null,
  kapasitas smallint not null default 4 check (kapasitas between 1 and 4),
  status_aktif boolean not null default true,
  created_at timestamptz not null default now(),
  check (jam_selesai > jam_mulai),
  unique (jam_mulai, jam_selesai)
);

insert into public.slot_template (urutan, jam_mulai, jam_selesai, kapasitas)
values
  (1, '08:00'::time, '10:00'::time, 4),
  (2, '10:00'::time, '12:00'::time, 4),
  (3, '12:00'::time, '14:00'::time, 4),
  (4, '14:00'::time, '16:00'::time, 4),
  (5, '16:00'::time, '18:00'::time, 4)
on conflict (jam_mulai, jam_selesai) do nothing;

-- Slot lama di luar 5 jam default (mis. 18:00–20:00) tetap disimpan sebagai
-- template nonaktif agar riwayat booking lama tidak kehilangan jadwal.
insert into public.slot_template (
  urutan,
  jam_mulai,
  jam_selesai,
  kapasitas,
  status_aktif
)
select
  (100 + row_number() over (order by s.jam_mulai, s.jam_selesai))::smallint,
  s.jam_mulai,
  s.jam_selesai,
  4,
  false
from (
  select distinct jam_mulai, jam_selesai
  from public.slot
) s
where not exists (
  select 1
  from public.slot_template st
  where st.jam_mulai = s.jam_mulai
    and st.jam_selesai = s.jam_selesai
)
on conflict (jam_mulai, jam_selesai) do nothing;

-- ----------------------------------------------------------------------------
-- 2. Kolom jadwal pada booking
-- ----------------------------------------------------------------------------
alter table public.booking
  add column if not exists slot_template_id uuid references public.slot_template (id),
  add column if not exists tanggal_latihan date;

update public.booking b
set
  slot_template_id = st.id,
  tanggal_latihan = s.tanggal
from public.slot s
join public.slot_template st
  on st.jam_mulai = s.jam_mulai
  and st.jam_selesai = s.jam_selesai
where b.slot_id = s.id
  and b.slot_template_id is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'booking_jadwal_check'
      and conrelid = 'public.booking'::regclass
  ) then
    alter table public.booking
      add constraint booking_jadwal_check
      check (
        (slot_template_id is null and tanggal_latihan is null)
        or (slot_template_id is not null and tanggal_latihan is not null)
      );
  end if;
end;
$$;

create index if not exists idx_booking_jadwal
  on public.booking (tanggal_latihan, slot_template_id)
  where status not in ('ditolak', 'batal');

-- ----------------------------------------------------------------------------
-- 3. RLS template jadwal
-- ----------------------------------------------------------------------------
alter table public.slot_template enable row level security;

drop policy if exists "slot_template_read" on public.slot_template;
create policy "slot_template_read" on public.slot_template
  for select to anon using (status_aktif = true);

drop policy if exists "slot_template_admin" on public.slot_template;
create policy "slot_template_admin" on public.slot_template
  for all to authenticated using (true) with check (true);

grant select on public.slot_template to anon;
grant select, insert, update, delete on public.slot_template to authenticated;

-- ----------------------------------------------------------------------------
-- 4. create_booking dengan template + tanggal
-- ----------------------------------------------------------------------------
drop function if exists public.create_booking(text, text, text, uuid, uuid);
drop function if exists public.create_booking(text, text, date, text, uuid, uuid);

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
    and urutan <= 5
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

grant execute on function public.create_booking(
  text,
  text,
  date,
  text,
  uuid,
  uuid,
  date
) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 5. Ketersediaan jadwal per tanggal
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
    and st.urutan <= 5
  group by
    st.id,
    st.urutan,
    st.jam_mulai,
    st.jam_selesai,
    st.kapasitas
  order by st.urutan, st.jam_mulai;
$$;

grant execute on function public.get_jadwal_tersedia(date) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 6. Status booking menyertakan jadwal awal
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
    'sisa_jam', v_booking.sisa_jam,
    'tanggal_latihan', v_booking.tanggal_latihan,
    'jam_mulai', v_jam_mulai,
    'jam_selesai', v_jam_selesai
  );
end;
$$;

grant execute on function public.get_booking_status(text, text) to anon, authenticated;
