-- ============================================================================
-- LPK CV. Fathan — Hardening akses admin (Migrasi 0010)
-- Jalankan setelah 0009_remove_no_show.sql.
--
-- Perubahan:
--   1. Hanya user dengan app_metadata.role = 'admin' yang dianggap admin.
--   2. Semua policy "authenticated" yang sebelumnya using (true) diganti
--      dengan public.is_admin().
--   3. Policy baca publik tetap tersedia untuk anon + authenticated.
--
-- Penting:
--   - Set metadata admin lewat Supabase Admin API / dashboard:
--       app_metadata: { "role": "admin" }
--   - Matikan "Allow new users to sign up" di Authentication > Providers >
--     Email. Tanpa ini, user baru tetap bisa mendaftar dan mencoba mengakses
--     area admin, meskipun policy di bawah akan menolaknya.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. Helper: apakah JWT saat ini memiliki role admin?
-- ----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 2. Policy baca publik
-- ----------------------------------------------------------------------------
drop policy if exists "paket_read" on public.paket;
create policy "paket_read" on public.paket
  for select to anon, authenticated
  using (status_aktif = true);

drop policy if exists "slot_read" on public.slot;
create policy "slot_read" on public.slot
  for select to anon, authenticated
  using (status <> 'ditutup');

drop policy if exists "instruktur_read" on public.instruktur;
create policy "instruktur_read" on public.instruktur
  for select to anon, authenticated
  using (status_aktif = true);

drop policy if exists "slot_template_read" on public.slot_template;
create policy "slot_template_read" on public.slot_template
  for select to anon, authenticated
  using (status_aktif = true);

-- ----------------------------------------------------------------------------
-- 3. Policy admin
-- ----------------------------------------------------------------------------
drop policy if exists "paket_admin" on public.paket;
create policy "paket_admin" on public.paket
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "slot_admin" on public.slot;
create policy "slot_admin" on public.slot
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "kendaraan_admin" on public.kendaraan;
create policy "kendaraan_admin" on public.kendaraan
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "instruktur_admin" on public.instruktur;
create policy "instruktur_admin" on public.instruktur
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "customer_admin" on public.customer;
create policy "customer_admin" on public.customer
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "booking_admin" on public.booking;
create policy "booking_admin" on public.booking
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "pembayaran_admin" on public.pembayaran;
create policy "pembayaran_admin" on public.pembayaran
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "follow_up_admin" on public.follow_up;
create policy "follow_up_admin" on public.follow_up
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "slot_template_admin" on public.slot_template;
create policy "slot_template_admin" on public.slot_template
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

commit;
