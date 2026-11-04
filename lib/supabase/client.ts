import { createBrowserClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "./config";

/**
 * Supabase client untuk browser (Client Components).
 * Menggunakan anon/publishable key — aman untuk operasi publik/guest.
 */
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
