// Hapus data demo (prefix DEMO + nomor WhatsApp 62890000...) sebelum production.
// Pemakaian: node scripts/cleanup-demo.mjs
//
// Script ini hanya menghapus data demo. Data asli tidak disentuh.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((line) => line && !line.trim().startsWith("#") && line.includes("="))
    .map((line) => {
      const index = line.indexOf("=");
      return [
        line.slice(0, index).trim(),
        line.slice(index + 1).trim().replace(/^"|"$/g, ""),
      ];
    }),
);

const url = env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/rest\/v1\/?$/, "").replace(
  /\/$/,
  "",
);
const supabase = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function fail(message, error) {
  console.error(message, error?.message ?? "");
  process.exit(1);
}

async function main() {
  const { count: bookingsBefore, error: countBookingsError } = await supabase
    .from("booking")
    .select("id", { count: "exact", head: true })
    .like("kode_booking", "DEMO%");

  if (countBookingsError) fail("Gagal menghitung booking demo:", countBookingsError);

  const { count: customersBefore, error: countCustomersError } = await supabase
    .from("customer")
    .select("id", { count: "exact", head: true })
    .like("no_wa", "62890000%");

  if (countCustomersError) fail("Gagal menghitung customer demo:", countCustomersError);

  console.log(`Booking demo: ${bookingsBefore ?? 0}`);
  console.log(`Customer demo: ${customersBefore ?? 0}`);

  if ((bookingsBefore ?? 0) === 0 && (customersBefore ?? 0) === 0) {
    console.log("Tidak ada data demo. Selesai.");
    return;
  }

  // Pembayaran dan follow_up ikut terhapus lewat ON DELETE CASCADE.
  const { error: deleteBookingsError } = await supabase
    .from("booking")
    .delete()
    .like("kode_booking", "DEMO%");

  if (deleteBookingsError) fail("Gagal menghapus booking demo:", deleteBookingsError);

  const { error: deleteCustomersError } = await supabase
    .from("customer")
    .delete()
    .like("no_wa", "62890000%");

  if (deleteCustomersError) fail("Gagal menghapus customer demo:", deleteCustomersError);

  console.log("Data demo berhasil dihapus.");
}

main().catch((error) => {
  console.error("Cleanup demo gagal:", error);
  process.exit(1);
});
