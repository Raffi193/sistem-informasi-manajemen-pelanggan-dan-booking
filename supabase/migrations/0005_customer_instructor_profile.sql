-- ============================================================================
-- LPK CV. Fathan — Profil Customer & Media Instruktur (Migrasi 0005)
-- Jalankan di Supabase > SQL Editor. Migrasi 0004 bersifat opsional.
--
-- Perubahan:
--   1. customer.tanggal_lahir
--   2. instruktur.foto_url & instruktur.sertifikat_url
--   3. akses baca instruktur aktif untuk halaman publik
--   4. create_booking menerima tanggal lahir dan mewajibkan alamat
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Profil customer
-- ----------------------------------------------------------------------------
alter table public.customer
  add column if not exists tanggal_lahir date;

-- ----------------------------------------------------------------------------
-- 2. Media instruktur
-- ----------------------------------------------------------------------------
alter table public.instruktur
  add column if not exists foto_url text;

alter table public.instruktur
  add column if not exists sertifikat_url text;

-- ----------------------------------------------------------------------------
-- 3. Instruktur aktif boleh dibaca publik (landing page)
-- ----------------------------------------------------------------------------
drop policy if exists "instruktur_read" on public.instruktur;

create policy "instruktur_read" on public.instruktur
  for select to anon using (status_aktif = true);

-- ----------------------------------------------------------------------------
-- 4. create_booking versi baru (overload 6 parameter)
--
--    Fungsi lama 5 parameter sengaja DIPERTAHANKAN sementara supaya server
--    yang masih memakai build lama tetap bisa melayani booking selama
--    deployment. Setelah server baru aktif, fungsi lama boleh dihapus dengan:
--
--      drop function if exists public.create_booking(text, text, text, uuid, uuid);
-- ----------------------------------------------------------------------------
create or replace function public.create_booking(
  p_nama text,
  p_no_wa text,
  p_tanggal_lahir date,
  p_alamat text,
  p_paket_id uuid,
  p_slot_id uuid
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slot public.slot%rowtype;
  v_customer_id uuid;
  v_booking_id uuid;
  v_kode text;
begin
  if nullif(btrim(coalesce(p_nama, '')), '') is null then
    raise exception 'NAMA_WAJIB';
  end if;

  if nullif(btrim(coalesce(p_no_wa, '')), '') is null then
    raise exception 'NO_WA_WAJIB';
  end if;

  if p_tanggal_lahir is null then
    raise exception 'TANGGAL_LAHIR_WAJIB';
  end if;

  if p_tanggal_lahir >= current_date then
    raise exception 'TANGGAL_LAHIR_TIDAK_VALID';
  end if;

  if nullif(btrim(coalesce(p_alamat, '')), '') is null then
    raise exception 'ALAMAT_WAJIB';
  end if;

  if char_length(btrim(p_alamat)) > 500 then
    raise exception 'ALAMAT_TERLALU_PANJANG';
  end if;

  -- Kunci baris slot agar dua request bersamaan tidak memesan slot yang sama
  select * into v_slot
  from public.slot
  where id = p_slot_id
  for update;

  if not found then
    raise exception 'SLOT_TIDAK_DITEMUKAN';
  end if;

  if v_slot.status <> 'tersedia' then
    raise exception 'SLOT_PENUH';
  end if;

  -- Simpan/update customer berdasarkan no_wa (identitas unik)
  insert into public.customer (nama, no_wa, alamat, tanggal_lahir, status)
  values (
    btrim(p_nama),
    btrim(p_no_wa),
    btrim(p_alamat),
    p_tanggal_lahir,
    'calon'
  )
  on conflict (no_wa) do update
    set nama = excluded.nama,
        alamat = excluded.alamat,
        tanggal_lahir = excluded.tanggal_lahir
  returning id into v_customer_id;

  v_kode := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.booking (kode_booking, customer_id, paket_id, slot_id, status, tgl_booking)
  values (v_kode, v_customer_id, p_paket_id, p_slot_id, 'menunggu_pembayaran', now())
  returning id into v_booking_id;

  update public.slot set status = 'penuh' where id = p_slot_id;

  return json_build_object(
    'booking_id', v_booking_id,
    'kode_booking', v_kode
  );
end;
$$;

grant execute on function public.create_booking(
  text,
  text,
  date,
  text,
  uuid,
  uuid
) to anon, authenticated;
