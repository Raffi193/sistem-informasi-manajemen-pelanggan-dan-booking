/**
 * Konfigurasi Supabase yang dipakai bersama oleh client & server.
 *
 * Catatan: `NEXT_PUBLIC_SUPABASE_URL` harus berupa URL project
 * (mis. https://xxxx.supabase.co) TANPA path `/rest/v1`.
 * Di sini kita tetap menormalkannya agar aman bila terlanjur
 * disalin lengkap dengan `/rest/v1`.
 */
const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabaseUrl = rawUrl
  .trim()
  .replace(/\/rest\/v1\/?$/, "")
  .replace(/\/+$/, "");

export const supabaseAnonKey = rawKey.trim();

/**
 * Dianggap terkonfigurasi bila URL valid dan key berbentuk:
 * - JWT lama (`eyJ...`), atau
 * - format API key baru Supabase (`sb_publishable_...`).
 */
export const isSupabaseConfigured =
  /^https?:\/\/.+/i.test(supabaseUrl) &&
  (/^eyJ[A-Za-z0-9_-]+\./.test(supabaseAnonKey) ||
    /^sb_publishable_/.test(supabaseAnonKey));
