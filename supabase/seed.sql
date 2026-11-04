-- ============================================================================
-- LPK CV. Fathan — Seed Data Awal
-- Jalankan SETELAH 0001 & 0002 di Supabase > SQL Editor.
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
-- Slot contoh untuk 7 hari ke depan.
-- Mengikuti pola nyata mitra: 5 sesi reguler (08–18) + 1 kelas malam,
-- dengan jumlah slot bervariasi per jendela (mencerminkan ketersediaan
-- kendaraan & instruktur). Catatan: untuk setup awal; jalankan sekali saja.
-- ----------------------------------------------------------------------------
with w(jam_mulai, jam_selesai, sesi) as (
  values
    ('08:00'::time, '10:00'::time, 'reguler'),
    ('08:00'::time, '10:00'::time, 'reguler'),
    ('10:00'::time, '12:00'::time, 'reguler'),
    ('10:00'::time, '12:00'::time, 'reguler'),
    ('12:00'::time, '14:00'::time, 'reguler'),
    ('14:00'::time, '16:00'::time, 'reguler'),
    ('14:00'::time, '16:00'::time, 'reguler'),
    ('16:00'::time, '18:00'::time, 'reguler'),
    ('18:00'::time, '20:00'::time, 'malam')
),
days(d) as (
  select generate_series(current_date, current_date + interval '6 days', interval '1 day')::date
),
kend as (
  select id, row_number() over (order by nama) rn, count(*) over () total
  from public.kendaraan
),
ins as (
  select id, row_number() over (order by nama) rn, count(*) over () total
  from public.instruktur
),
rows as (
  select d, w.jam_mulai, w.jam_selesai, w.sesi, row_number() over () rn
  from days cross join w
)
insert into public.slot (tanggal, jam_mulai, jam_selesai, sesi, kendaraan_id, instruktur_id)
select r.d, r.jam_mulai, r.jam_selesai, r.sesi, kend.id, ins.id
from rows r
join kend on kend.rn = ((r.rn - 1) % kend.total) + 1
join ins  on ins.rn  = ((r.rn - 1) % ins.total) + 1;
