-- ============================================================================
-- LPK CV. Fathan — Storage Bukti Pembayaran (Migrasi 0003)
-- Jalankan di Supabase > SQL Editor (cukup sekali).
--
-- Bucket bersifat PRIVAT. Aplikasi mengunggah dan membaca file lewat
-- route server yang memakai service role, sehingga tidak ada akses
-- langsung dari browser/anon. Tidak perlu policy storage.objects.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'bukti-pembayaran',
  'bukti-pembayaran',
  false,
  4194304, -- 4 MB (aman untuk batas body Vercel)
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do nothing;
