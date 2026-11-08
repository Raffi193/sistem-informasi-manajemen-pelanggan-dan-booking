import { createBrowserClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "./config";
import { getAuthCookieOptions } from "./cookie-options";

/**
 * Supabase client untuk browser (Client Components).
 * Menggunakan anon/publishable key — aman untuk operasi publik/guest.
 */
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: getAuthCookieOptions(),
  });
}
