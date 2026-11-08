/**
 * Opsi cookie auth Supabase.
 *
 * `secure` hanya boleh aktif di HTTPS. Kalau dipaksa aktif saat `npm start`
 * di http://localhost, browser tidak menyimpan cookie sesi sehingga login
 * admin seolah-olah berhasil tetapi langsung terlempar lagi ke halaman login.
 */
export function getAuthCookieOptions() {
  const secure =
    typeof window !== "undefined"
      ? window.location.protocol === "https:"
      : process.env.NODE_ENV === "production" && process.env.VERCEL === "1";

  return {
    path: "/",
    sameSite: "lax" as const,
    secure,
    maxAge: 60 * 60 * 24 * 7,
  };
}
