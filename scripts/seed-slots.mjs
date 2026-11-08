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

const templates = [
  { urutan: 1, jam_mulai: "08:00", jam_selesai: "10:00", kapasitas: 4 },
  { urutan: 2, jam_mulai: "10:00", jam_selesai: "12:00", kapasitas: 4 },
  { urutan: 3, jam_mulai: "12:00", jam_selesai: "14:00", kapasitas: 4 },
  { urutan: 4, jam_mulai: "14:00", jam_selesai: "16:00", kapasitas: 4 },
  { urutan: 5, jam_mulai: "16:00", jam_selesai: "18:00", kapasitas: 4 },
];

const { error } = await supabase.from("slot_template").upsert(templates, {
  onConflict: "jam_mulai,jam_selesai",
  ignoreDuplicates: true,
});

if (error) {
  console.error("Gagal menyiapkan template jadwal:", error);
  process.exit(1);
}

console.log("Template 5 jam latihan siap dipakai.");
