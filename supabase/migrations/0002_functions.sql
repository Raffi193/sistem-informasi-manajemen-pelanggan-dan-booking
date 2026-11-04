-- ============================================================================
-- LPK CV. Fathan — Function RPC (Migrasi 0002)
-- Dipanggil dari aplikasi untuk operasi aman (security definer = bypass RLS).
-- Jalankan SETELAH 0001_schema.sql di Supabase > SQL Editor.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- create_booking: booking atomic anti double-booking (BR-01, BR-02, BR-04)
-- ----------------------------------------------------------------------------
create or replace function public.create_booking(
  p_nama text,
  p_no_wa text,
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

  -- Simpan/update customer berdasarkan no_wa (anti duplikat)
  insert into public.customer (nama, no_wa, alamat, status)
  values (p_nama, p_no_wa, p_alamat, 'calon')
  on conflict (no_wa) do update set nama = excluded.nama
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

-- ----------------------------------------------------------------------------
-- get_booking_status: cek status tanpa login (hanya jika no_wa cocok)
-- ----------------------------------------------------------------------------
create or replace function public.get_booking_status(
  p_kode text,
  p_no_wa text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.booking%rowtype;
begin
  select b.* into v_booking
  from public.booking b
  join public.customer c on c.id = b.customer_id
  where b.kode_booking = upper(trim(p_kode))
    and c.no_wa = trim(p_no_wa);

  if not found then
    return null;
  end if;

  return json_build_object(
    'kode_booking', v_booking.kode_booking,
    'status', v_booking.status,
    'tgl_booking', v_booking.tgl_booking,
    'sisa_jam', v_booking.sisa_jam
  );
end;
$$;

-- ----------------------------------------------------------------------------
-- submit_bukti: sisipkan pembayaran (bukti bayar) bila kode + no_wa valid
-- ----------------------------------------------------------------------------
create or replace function public.submit_bukti(
  p_kode text,
  p_no_wa text,
  p_jenis text,
  p_jumlah int,
  p_bukti_file text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.booking%rowtype;
  v_id uuid;
begin
  select b.* into v_booking
  from public.booking b
  join public.customer c on c.id = b.customer_id
  where b.kode_booking = upper(trim(p_kode))
    and c.no_wa = trim(p_no_wa);

  if not found then
    raise exception 'BOOKING_TIDAK_DITEMUKAN';
  end if;

  insert into public.pembayaran (booking_id, jenis, jumlah, bukti_file, status_verifikasi)
  values (v_booking.id, p_jenis::public.jenis_pembayaran, p_jumlah, p_bukti_file, 'menunggu')
  returning id into v_id;

  update public.booking set status = 'menunggu_verifikasi' where id = v_booking.id;

  return json_build_object('pembayaran_id', v_id);
end;
$$;

-- ----------------------------------------------------------------------------
-- mark_no_show: terapkan aturan kompensasi (BR-06) — hanya admin
-- ----------------------------------------------------------------------------
create or replace function public.mark_no_show(
  p_booking_id uuid,
  p_konfirmasi boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_konfirmasi then
    -- Dengan konfirmasi -> kompensasi 1 jam
    update public.booking set status = 'no_show', sisa_jam = 1 where id = p_booking_id;
  else
    -- Tanpa konfirmasi -> sesi hangus
    update public.booking set status = 'no_show', sisa_jam = 0 where id = p_booking_id;
  end if;
end;
$$;

-- ----------------------------------------------------------------------------
-- Grant eksekusi
-- ----------------------------------------------------------------------------
grant execute on function public.create_booking(text, text, text, uuid, uuid) to anon, authenticated;
grant execute on function public.get_booking_status(text, text) to anon, authenticated;
grant execute on function public.submit_bukti(text, text, text, int, text) to anon, authenticated;
grant execute on function public.mark_no_show(uuid, boolean) to authenticated;
