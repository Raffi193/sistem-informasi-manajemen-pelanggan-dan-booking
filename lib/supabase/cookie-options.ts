/**
 * Opsi cookie auth Supabase.
 *
 * `secure` hanya boleh aktif di HTTPS. Kalau dipaksa aktif saat `npm start`
 * di http://localhost, browser tidak menyimpan cookie sesi sehingga login
 * admin seolah-olah berhasil tetapi langsung terlempar lagi ke halaman login.
 *
 * Cookie sengaja dibuat sebagai session cookie (tanpa maxAge) agar sesi admin
 * berakhir saat browser ditutup, bukan tersimpan selama berhari-hari.
 */
export function getAuthCookieOptions() {
  const secure =
    typeof window !== "undefined"
      ? window.location.protocol === "https:"
      : process.env.NODE_ENV === "production" && process.env.VERCEL === "1";

  // Sengaja tanpa maxAge/expires: cookie menjadi session cookie dan
  // dihapus browser saat semua tab/jendela browser ditutup.
  return {
    path: "/",
    sameSite: "lax" as const,
    secure,
  };
}
