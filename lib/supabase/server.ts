import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAnonKey, supabaseUrl } from "./config";
import { getAuthCookieOptions } from "./cookie-options";

/**
 * Supabase client untuk Server Components / Server Actions / Route Handlers.
 * Mengelola cookie sesi (login admin) secara aman di server.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: getAuthCookieOptions(),
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Supabase memaksa maxAge panjang. Hapus lifetime agar cookie
            // menjadi session cookie, kecuali untuk operasi hapus (maxAge 0).
            const sessionOptions = { ...options };
            delete sessionOptions.maxAge;
            delete sessionOptions.expires;
            if (options.maxAge === 0) sessionOptions.maxAge = 0;

            cookieStore.set(name, value, sessionOptions);
          });
        } catch {
          // Dipanggil dari Server Component — aman untuk diabaikan.
          // Middleware akan tetap menyetel cookie saat refresh.
        }
      },
    },
  });
}
