# Deployment Production — LPK CV. Fathan

Checklist ini untuk deploy manual ke Vercel setelah hardening.

## 1. Backup

Sebelum menjalankan migrasi destruktif, backup database:

```bash
node scripts/backup-supabase.mjs
```

File backup tersimpan di `backups/` (di-ignore Git). Untuk restore, gunakan
Supabase Dashboard > Database > Backups atau `psql` dengan file SQL/JSON yang
sesuai.

## 2. Jalankan migrasi berurutan

Buka Supabase > SQL Editor, lalu jalankan:

1. `supabase/migrations/0009_remove_no_show.sql`
2. `supabase/migrations/0010_admin_rls.sql`
3. `supabase/migrations/0011_booking_night_surcharge.sql`

`0009` sudah menangani:

- konversi `no_show` menjadi `batal`;
- drop semua overload RPC lama;
- drop index parsial `idx_booking_jadwal` sebelum mengganti enum;
- pembuatan ulang enum tanpa `no_show`;
- penghapusan `booking.sisa_jam`;
- `create_booking` dan `submit_bukti` hanya untuk `service_role`.

Setelah migrasi, verifikasi:

```sql
select enum_range(null::public.status_booking);
select count(*) from public.booking where status::text = 'no_show';
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'booking'
  and column_name in ('sisa_jam', 'biaya_tambahan');
select proname
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('mark_no_show', 'submit_bukti', 'create_booking');
```

## 3. Admin role

Admin ditentukan oleh `app_metadata.role = "admin"` pada user Supabase Auth.
Untuk user admin yang sudah ada:

- Supabase Dashboard > Authentication > Users > pilih user > Edit
  `app_metadata`:

```json
{ "role": "admin" }
```

Atau lewat Admin API:

```bash
curl -X PUT "https://<project-ref>.supabase.co/auth/v1/admin/users/<user-id>" \
  -H "apikey: <service-role-key>" \
  -H "Authorization: Bearer <service-role-key>" \
  -H "Content-Type: application/json" \
  -d '{"app_metadata":{"role":"admin"}}'
```

`ADMIN_EMAILS` hanya fallback. Isi di Vercel jika perlu.

## 4. Matikan signup

Supabase Dashboard > Authentication > Providers > Email:

- Nonaktifkan **Allow new users to sign up**.
- Pastikan email confirmation tetap aktif.

Cek:

```bash
curl "https://<project-ref>.supabase.co/auth/v1/settings" \
  -H "apikey: <anon-key>"
```

`disable_signup` harus `true`.

## 5. Bersihkan data demo

Data demo 50 booking/customer sudah dihapus untuk production. Jika perlu
mengulang:

```bash
npm run cleanup:demo
```

Jangan jalankan `npm run seed:demo` di production.

## 6. Environment Variables Vercel

Set di Vercel Project Settings > Environment Variables:

| Name | Environment |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview (server only) |
| `NEXT_PUBLIC_WA_ADMIN` | Production, Preview |
| `ADMIN_EMAILS` | Production (opsional, fallback) |

Jangan pernah menaruh `SUPABASE_SERVICE_ROLE_KEY` di variabel `NEXT_PUBLIC_*`.

## 7. Deploy

1. Commit dan push semua perubahan.
2. Import repo di Vercel.
3. Deploy **Preview** terlebih dahulu.
4. Smoke test preview:
   - `/`, `/booking`, `/status`, `/login` → 200
   - `/admin` tanpa login → redirect login
   - login admin → dashboard
   - booking baru → kode booking muncul
   - upload bukti → status berubah ke menunggu verifikasi
   - admin setujui/tolak → status sesuai
   - `/admin/analitik` tampil
5. Promote ke Production.

## 8. Setelah deploy

- Ganti placeholder rekening di `lib/payment.ts`.
- Ganti nama/foto/sertifikat instruktur di menu Master Data.
- Konfirmasi harga paket dengan client.
- Pastikan QRIS statis `public/payment/qris.png` benar.
- Aktifkan Vercel Firewall / rate limit tambahan untuk `/api/booking` dan
  `/api/bukti` bila trafik meningkat.
- Pantau Vercel Functions logs dan Supabase logs.

## 9. Rollback

- Vercel: Deployments > pilih deployment sebelumnya > **Instant Rollback**.
- Database: restore backup Supabase sebelum migrasi.
- Jika migrasi 0009 gagal, jangan jalankan ulang sebelum menjalankan query
  diagnostik di `supabase/migrations/0009_remove_no_show.sql` (bagian komentar).
