-- ============================================================================
-- LPK CV. Fathan — Seed Data Awal
-- Jalankan SETELAH migrasi 0001–0007 di Supabase > SQL Editor.
-- Catatan: data paket mengacu brosur mitra (perlu konfirmasi final);
-- nama instruktur selain Rahmawati adalah placeholder untuk dilengkapi.
-- ============================================================================

-- Paket kursus (dari brosur mitra)
insert into public.paket (nama, transmisi, jumlah_pertemuan, harga, keterangan) values
  ('Paket Matic Bisa', 'matic', 3, 800000, null),
  ('Paket Manual Bisa', 'manual', 4, 800000, null),
  ('Paket Manual Lancar', 'manual', 5, 900000, null),
  ('Paket Matic Lancar', 'matic', 4, 900000, null),
  ('Paket Kombinasi', 'kombinasi', 6, 1100000, '4 manual + 2 matic. Opsi +SIM Rp1.900.000.'),
  ('Paket Manual Private Full Day', 'manual', 7, 1200000, null),
  ('Paket Matic Full Day', 'matic', 6, 1200000, null);

-- Kendaraan: 1 matic + 5 manual (jenis Avanza) — data dari PPD, perlu konfirmasi plat
insert into public.kendaraan (nama, plat, transmisi) values
  ('Avanza Manual 1', null, 'manual'),
  ('Avanza Manual 2', null, 'manual'),
  ('Avanza Manual 3', null, 'manual'),
  ('Avanza Manual 4', null, 'manual'),
  ('Avanza Manual 5', null, 'manual'),
  ('Mobil Matic 1', null, 'matic');

-- Instruktur: 4 orang (hanya Rahmawati yang terkonfirmasi di PPD)
insert into public.instruktur (nama, no_wa) values
  ('Rahmawati', null),
  ('Instruktur 2 (placeholder)', null),
  ('Instruktur 3 (placeholder)', null),
  ('Instruktur 4 (placeholder)', null);

-- ----------------------------------------------------------------------------
-- Template jam latihan dibuat otomatis oleh migrasi 0007_slot_template.sql.
-- Tidak ada lagi pembuatan slot per tanggal dari seed ini.
-- ----------------------------------------------------------------------------
