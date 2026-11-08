-- ============================================================================
-- Preflight read-only untuk 0009_remove_no_show.sql
-- Jalankan di Supabase SQL Editor sebelum migrasi jika ingin memeriksa state.
-- File ini TIDAK mengubah data.
-- ============================================================================

-- 1. Enum yang ada
select t.typname as enum_name, e.enumlabel as value
from pg_type t
join pg_enum e on e.enumtypid = t.oid
join pg_namespace n on n.oid = t.typnamespace
where n.nspname = 'public'
  and t.typname in ('status_booking', 'status_booking_new')
order by t.typname, e.enumsortorder;

-- 2. Tipe kolom booking.status dan keberadaan sisa_jam/biaya_tambahan
select column_name, data_type, udt_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'booking'
  and column_name in ('status', 'sisa_jam', 'biaya_tambahan')
order by column_name;

-- 3. Index yang menyentuh kolom status (termasuk partial index)
select indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'booking'
  and indexdef ilike '%status%'
order by indexname;

-- 4. Semua overload RPC terkait
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
order by signature::text;

-- 5. Booking berstatus no_show (harus 0 setelah migrasi)
select count(*) as no_show_rows
from public.booking
where status::text = 'no_show';
