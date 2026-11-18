-- Verifikasi project Supabase Singapore setelah migrasi.
-- Jalankan bagian per bagian di SQL Editor.

-- 1. Status booking harus 6 nilai, tanpa no_show.
select e.enumlabel, e.enumsortorder
from pg_enum e
join pg_type t on t.oid = e.enumtypid
where t.typname = 'status_booking'
order by e.enumsortorder;

-- 2. Kolom booking final.
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'booking'
order by ordinal_position;

-- 3. biaya_tambahan harus ada; sisa_jam harus sudah hilang.
select
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'booking'
      and column_name = 'biaya_tambahan'
  ) as has_biaya_tambahan,
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'booking'
      and column_name = 'sisa_jam'
  ) as has_sisa_jam;

-- 4. Constraint jadwal booking.
select conname, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.booking'::regclass
  and conname = 'booking_jadwal_check';

-- 5. RLS harus aktif di tabel utama.
select relname, relrowsecurity
from pg_class
where relnamespace = 'public'::regnamespace
  and relname in (
    'paket',
    'kendaraan',
    'instruktur',
    'slot',
    'slot_template',
    'customer',
    'booking',
    'pembayaran',
    'follow_up'
  )
order by relname;

-- 6. Policy admin dan policy baca publik.
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 7. Function yang harus ada.
select proname, pg_get_function_identity_arguments(oid) as args
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in (
    'create_booking',
    'submit_bukti',
    'get_jadwal_tersedia',
    'get_booking_status',
    'is_admin'
  )
order by proname;

-- 8. mark_no_show harus tidak ada.
select count(*) as mark_no_show_count
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname = 'mark_no_show';

-- 9. Grant function penting.
select routine_name, grantee, privilege_type
from information_schema.routine_privileges
where routine_schema = 'public'
  and routine_name in (
    'create_booking',
    'submit_bukti',
    'get_jadwal_tersedia',
    'get_booking_status',
    'is_admin'
  )
order by routine_name, grantee, privilege_type;

-- 10. Bucket storage.
select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
where id in ('bukti-pembayaran', 'instruktur')
order by id;

-- 11. Jumlah object storage per bucket.
select bucket_id, count(*) as jumlah_file
from storage.objects
group by bucket_id
order by bucket_id;

-- 12. Jumlah data per tabel.
select 'paket' as table_name, count(*) as jumlah from public.paket
union all
select 'kendaraan', count(*) from public.kendaraan
union all
select 'instruktur', count(*) from public.instruktur
union all
select 'slot', count(*) from public.slot
union all
select 'slot_template', count(*) from public.slot_template
union all
select 'customer', count(*) from public.customer
union all
select 'booking', count(*) from public.booking
union all
select 'pembayaran', count(*) from public.pembayaran
union all
select 'follow_up', count(*) from public.follow_up
order by table_name;

-- 13. Tidak boleh ada booking no_show.
select count(*) as no_show_rows
from public.booking
where status::text = 'no_show';

-- 14. Admin role.
select id, email, raw_app_meta_data ->> 'role' as role
from auth.users
where email = 'adminfathan@gmail.com';
