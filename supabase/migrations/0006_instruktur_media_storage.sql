-- ============================================================================
-- LPK CV. Fathan — Storage Media Instruktur (Migrasi 0006)
--
-- Bucket ini bersifat PUBLIK karena foto dan sertifikat ditampilkan di
-- landing page. Unggah/hapus file dilakukan dari server action admin
-- memakai service role, sehingga tidak perlu policy storage.objects.
--
-- Catatan: bucket `instruktur` sudah dibuat melalui Storage API. Migrasi ini
-- membuat konfigurasi yang sama dapat direproduksi saat setup database baru.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'instruktur',
  'instruktur',
  true,
  4194304, -- 4 MB
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
