-- ============================================================================
-- LPK CV. Fathan — Skema Database (Migrasi 0001)
-- Sistem Informasi Manajemen Pelanggan & Booking Kursus Mengemudi
-- Jalankan di: Supabase > SQL Editor
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- Enum
-- ----------------------------------------------------------------------------
create type status_customer as enum ('calon', 'aktif', 'selesai', 'batal');
create type status_slot as enum ('tersedia', 'penuh', 'ditutup');
create type status_booking as enum (
  'menunggu_pembayaran',
  'menunggu_verifikasi',
  'disetujui',
  'ditolak',
  'selesai',
  'batal',
  'no_show'
);
create type jenis_pembayaran as enum ('dp', 'pelunasan');
create type status_verifikasi as enum ('menunggu', 'terverifikasi', 'ditolak');
create type transmisi as enum ('manual', 'matic', 'kombinasi');

-- ----------------------------------------------------------------------------
-- Tabel Master
-- ----------------------------------------------------------------------------
create table public.paket (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  transmisi transmisi not null,
  jumlah_pertemuan int not null,
  harga int not null,
  keterangan text,
  status_aktif boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.kendaraan (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  plat text,
  transmisi transmisi not null,
  status_aktif boolean not null default true
);

create table public.instruktur (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  no_wa text,
  status_aktif boolean not null default true
);

-- ----------------------------------------------------------------------------
-- Tabel Transaksi
-- ----------------------------------------------------------------------------
create table public.slot (
  id uuid primary key default gen_random_uuid(),
  tanggal date not null,
  jam_mulai time not null,
  jam_selesai time not null,
  sesi text not null default 'reguler',          -- 'reguler' | 'malam'
  kendaraan_id uuid references public.kendaraan (id) on delete set null,
  instruktur_id uuid references public.instruktur (id) on delete set null,
  status status_slot not null default 'tersedia'
);

create table public.customer (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  no_wa text not null unique,                    -- identitas unik customer (BR-04)
  alamat text,
  status status_customer not null default 'calon',
  created_at timestamptz not null default now()
);

create table public.booking (
  id uuid primary key default gen_random_uuid(),
  kode_booking text not null unique,
  customer_id uuid references public.customer (id) on delete cascade,
  paket_id uuid references public.paket (id) on delete set null,
  slot_id uuid references public.slot (id) on delete set null unique, -- 1 slot = 1 booking
  status status_booking not null default 'menunggu_pembayaran',
  tgl_booking timestamptz not null default now(),
  sisa_jam numeric not null default 2,           -- utk kompensasi no-show (BR-06)
  catatan text
);

create table public.pembayaran (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.booking (id) on delete cascade,
  jenis jenis_pembayaran not null,
  jumlah int not null,
  metode text,
  bukti_file text,                               -- path file di Storage (bucket privat)
  status_verifikasi status_verifikasi not null default 'menunggu',
  created_at timestamptz not null default now()
);

create table public.follow_up (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customer (id) on delete cascade,
  jenis text,
  catatan text,
  tgl date not null default now()
);

-- ----------------------------------------------------------------------------
-- Index
-- ----------------------------------------------------------------------------
create index idx_slot_tanggal on public.slot (tanggal);
create index idx_booking_status on public.booking (status);
create index idx_booking_customer on public.booking (customer_id);

-- ----------------------------------------------------------------------------
-- Row Level Security (RLS)
-- ----------------------------------------------------------------------------
alter table public.paket enable row level security;
alter table public.kendaraan enable row level security;
alter table public.instruktur enable row level security;
alter table public.slot enable row level security;
alter table public.customer enable row level security;
alter table public.booking enable row level security;
alter table public.pembayaran enable row level security;
alter table public.follow_up enable row level security;

-- Paket: anon hanya lihat paket aktif; admin (authenticated) akses penuh
create policy "paket_read" on public.paket
  for select to anon using (status_aktif = true);
create policy "paket_admin" on public.paket
  for all to authenticated using (true) with check (true);

-- Slot: anon lihat selain 'ditutup'; admin akses penuh
create policy "slot_read" on public.slot
  for select to anon using (status <> 'ditutup');
create policy "slot_admin" on public.slot
  for all to authenticated using (true) with check (true);

-- Kendaraan & Instruktur: hanya admin
create policy "kendaraan_admin" on public.kendaraan
  for all to authenticated using (true) with check (true);
create policy "instruktur_admin" on public.instruktur
  for all to authenticated using (true) with check (true);

-- Customer, Booking, Pembayaran, Follow-up:
--   - anon TIDAK punya akses langsung (hanya lewat function security definer)
--   - admin (authenticated) akses penuh
create policy "customer_admin" on public.customer
  for all to authenticated using (true) with check (true);
create policy "booking_admin" on public.booking
  for all to authenticated using (true) with check (true);
create policy "pembayaran_admin" on public.pembayaran
  for all to authenticated using (true) with check (true);
create policy "follow_up_admin" on public.follow_up
  for all to authenticated using (true) with check (true);
