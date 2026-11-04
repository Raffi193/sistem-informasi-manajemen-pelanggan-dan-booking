-- ============================================================================
-- LPK CV. Fathan — CRM & Laporan (Migrasi 0004)
-- Tambahan index untuk filter customer, follow-up, dan laporan per periode.
-- Jalankan di Supabase > SQL Editor setelah migrasi 0001–0003.
-- ============================================================================

-- Waktu pencatatan follow-up (tgl tetap dipakai untuk tanggal aktivitas).
alter table public.follow_up
  add column if not exists created_at timestamptz not null default now();

create index if not exists idx_customer_status on public.customer (status);
create index if not exists idx_customer_created_at on public.customer (created_at);
create index if not exists idx_follow_up_customer_tgl
  on public.follow_up (customer_id, tgl desc);
create index if not exists idx_follow_up_jenis_tgl
  on public.follow_up (jenis, tgl);
create index if not exists idx_booking_tgl_booking on public.booking (tgl_booking);
