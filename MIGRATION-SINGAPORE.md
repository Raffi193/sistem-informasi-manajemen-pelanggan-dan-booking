# Migrasi Supabase ke Region Singapore

Region project Supabase **tidak bisa diubah langsung**. Project baru di Singapore harus dibuat, lalu data dipindahkan.

## 1. Yang harus disiapkan

- Project lama tetap aktif.
- Project baru sudah dibuat di region **Southeast Asia (Singapore)**.
- Service role key project lama.
- Service role key project baru.
- URL project lama.
- URL project baru.

Jangan commit service role key ke Git.

## 2. Jalankan migrasi database di project baru

Buka SQL Editor project baru, lalu jalankan berurutan:

```text
0001_schema.sql
0002_functions.sql
0003_storage.sql
0004_crm_reports.sql
0005_customer_instructor_profile.sql
0006_instruktur_media_storage.sql
0007_slot_template.sql
0008_slot_template_management.sql
0009_remove_no_show.sql
0010_admin_rls.sql
0011_booking_night_surcharge.sql
```

## 3. Set environment variable untuk script

PowerShell:

```powershell
$env:OLD_SUPABASE_URL="https://PROJECT-LAMA.supabase.co"
$env:OLD_SERVICE_ROLE_KEY="service-role-key-lama"
$env:NEW_SUPABASE_URL="https://PROJECT-BARU.supabase.co"
$env:NEW_SERVICE_ROLE_KEY="service-role-key-baru"
```

## 4. Cek data tanpa mengubah apa pun

```powershell
node scripts/migrate-data-to-singapore.mjs
```

Script akan membaca semua tabel dan menampilkan jumlah baris. Tidak ada data baru yang diubah.

## 5. Import data ke project baru

```powershell
$env:CONFIRM_RESET_NEW="YES"
node scripts/migrate-data-to-singapore.mjs
```

Script akan:

- Mengosongkan tabel baru.
- Mengimpor data lama.
- Mengubah status `no_show` menjadi `batal`.
- Membuang kolom lama `sisa_jam`.
- Mengisi `biaya_tambahan` dari slot malam.
- Membandingkan jumlah baris lama dan baru.

Jangan jalankan ini jika project baru sudah berisi data production lain.

## 6. Migrasi file Storage

Cek daftar file:

```powershell
node scripts/migrate-storage-to-singapore.mjs
```

Salin file:

```powershell
$env:CONFIRM_UPLOAD="YES"
node scripts/migrate-storage-to-singapore.mjs
```

Script menyalin bucket:

- `bukti-pembayaran`
- `instruktur`

## 7. Buat admin baru di project baru

Di Supabase Dashboard project baru:

1. Authentication → Users → Add user.
2. Email: `adminfathan@gmail.com`
3. Buat password baru yang kuat.
4. Jalankan SQL:

```sql
update auth.users
set
  raw_app_meta_data =
    coalesce(raw_app_meta_data, '{}'::jsonb)
    || '{"role":"admin"}'::jsonb,
  updated_at = now()
where email = 'adminfathan@gmail.com';
```

5. Logout dari aplikasi, lalu login ulang.

## 8. Nonaktifkan signup

Authentication → Providers → Email:

- **Enable email provider**: tetap ON.
- **Secure email change**: tetap ON.
- **Allow new users to sign up**: OFF.

Verifikasi:

```bash
curl -s "https://PROJECT-BARU.supabase.co/auth/v1/settings" \
  -H "apikey: ANON_KEY_BARU"
```

Pastikan:

```json
"disable_signup": true
```

## 9. Verifikasi database

Buka `scripts/verify-singapore-migration.sql`, lalu jalankan query di SQL Editor project baru.

Yang harus benar:

- `status_booking` hanya 6 nilai, tanpa `no_show`.
- `booking.biaya_tambahan` ada.
- `booking.sisa_jam` tidak ada.
- `mark_no_show` tidak ada.
- RLS aktif di tabel utama.
- Function `create_booking`, `submit_bukti`, `get_jadwal_tersedia`, `get_booking_status`, `is_admin` ada.
- `submit_bukti` dan `create_booking` hanya bisa dipanggil service role.
- Bucket `bukti-pembayaran` dan `instruktur` ada.
- Jumlah data lama dan baru sama.

## 10. Ganti environment Vercel

Ganti:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

Lalu redeploy Preview.

## 11. Smoke test

- Login admin.
- Dashboard.
- Booking baru.
- Upload bukti pembayaran.
- Verifikasi pembayaran.
- Customer CRUD.
- Master data.
- Laporan.
- Analitik.
- Cek status booking.
- Pastikan file bukti dan foto instruktur tampil.

## 12. Setelah production aman

- Promote deployment.
- Simpan project lama minimal beberapa hari.
- Setelah yakin, pause/delete project lama.

## Rollback

Jika ada masalah:

1. Kembalikan environment Vercel ke project lama.
2. Redeploy.
3. Jangan hapus project lama sampai project baru benar-benar stabil.
