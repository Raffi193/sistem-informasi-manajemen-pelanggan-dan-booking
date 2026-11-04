import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.trim().startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")];
    }),
);

const url = env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
const supabase = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const { data: kendaraan, error: e1 } = await supabase.from("kendaraan").select("id").order("nama");
const { data: instruktur, error: e2 } = await supabase.from("instruktur").select("id").order("nama");
if (e1 || e2) {
  console.error("Gagal ambil master:", e1 ?? e2);
  process.exit(1);
}
if (!kendaraan?.length || !instruktur?.length) {
  console.error("Master kendaraan/instruktur kosong.");
  process.exit(1);
}

const windows = [
  ["08:00", "10:00", "reguler"],
  ["08:00", "10:00", "reguler"],
  ["10:00", "12:00", "reguler"],
  ["10:00", "12:00", "reguler"],
  ["12:00", "14:00", "reguler"],
  ["14:00", "16:00", "reguler"],
  ["14:00", "16:00", "reguler"],
  ["16:00", "18:00", "reguler"],
  ["18:00", "20:00", "malam"],
];

const pad = (n) => String(n).padStart(2, "0");
const now = new Date();
const slots = [];
let rn = 0;

for (let d = 0; d < 7; d++) {
  const dt = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d);
  const tanggal = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
  for (const [mulai, selesai, sesi] of windows) {
    slots.push({
      tanggal,
      jam_mulai: mulai,
      jam_selesai: selesai,
      sesi,
      kendaraan_id: kendaraan[rn % kendaraan.length].id,
      instruktur_id: instruktur[rn % instruktur.length].id,
      status: "tersedia",
    });
    rn++;
  }
}

const { data: exist } = await supabase.from("slot").select("id").limit(1);
if (exist && exist.length > 0) {
  console.log("Slot sudah ada — tidak menambah (hindari duplikat).");
  process.exit(0);
}

const { error } = await supabase.from("slot").insert(slots);
if (error) {
  console.error("Gagal insert slot:", error);
  process.exit(1);
}
console.log(`Berhasil menyisipkan ${slots.length} slot untuk 7 hari ke depan.`);
