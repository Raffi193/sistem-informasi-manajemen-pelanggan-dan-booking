import { createBrowserClient } from "@supabase/ssr";
import { getAuthCookieOptions } from "./cookie-options";
import { supabaseAnonKey, supabaseUrl } from "./config";

function readBrowserCookies() {
  if (typeof document === "undefined") return [];

  return document.cookie
    .split("; ")
    .filter(Boolean)
    .map((cookie) => {
      const separator = cookie.indexOf("=");
      const name = separator === -1 ? cookie : cookie.slice(0, separator);
      const rawValue = separator === -1 ? "" : cookie.slice(separator + 1);

      try {
        return { name, value: decodeURIComponent(rawValue) };
      } catch {
        return { name, value: rawValue };
      }
    });
}

function writeBrowserCookie(
  name: string,
  value: string,
  options: Record<string, unknown>,
) {
  if (typeof document === "undefined") return;

  const parts = [`${name}=${encodeURIComponent(value)}`];
  const path = typeof options.path === "string" ? options.path : "/";
  parts.push(`Path=${path}`);

  if (typeof options.domain === "string") {
    parts.push(`Domain=${options.domain}`);
  }

  if (options.sameSite) {
    const sameSite =
      options.sameSite === true ? "Strict" : String(options.sameSite);
    parts.push(
      `SameSite=${sameSite.charAt(0).toUpperCase()}${sameSite
        .slice(1)
        .toLowerCase()}`,
    );
  }

  if (options.secure) parts.push("Secure");

  if (options.maxAge === 0) {
    parts.push("Max-Age=0", "Expires=Thu, 01 Jan 1970 00:00:00 GMT");
  }

  document.cookie = parts.join("; ");
}

/**
 * Supabase client untuk browser (Client Components).
 * Menggunakan anon/publishable key — aman untuk operasi publik/guest.
 *
 * Cookie auth ditulis sebagai session cookie agar sesi admin tidak
 * tersimpan permanen setelah browser ditutup.
 */
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: getAuthCookieOptions(),
    cookies: {
      getAll() {
        return readBrowserCookies();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          const sessionOptions = { ...options };
          delete sessionOptions.maxAge;
          delete sessionOptions.expires;
          if (options.maxAge === 0) sessionOptions.maxAge = 0;

          writeBrowserCookie(name, value, sessionOptions);
        });
      },
    },
  });
}