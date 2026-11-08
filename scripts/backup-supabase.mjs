// Backup tabel utama Supabase ke file JSON lokal.
// Pemakaian: node scripts/backup-supabase.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

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
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diisi.");
  process.exit(1);
}

const tables = [
  "paket",
  "kendaraan",
  "instruktur",
  "slot",
  "customer",
  "booking",
  "pembayaran",
  "follow_up",
  "slot_template",
];

async function main() {
  const output = {
    exported_at: new Date().toISOString(),
    project: url,
    tables: {},
  };

  for (const table of tables) {
    const response = await fetch(`${url}/rest/v1/${table}?select=*`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });

    if (!response.ok) {
      throw new Error(`${table}: ${response.status} ${await response.text()}`);
    }

    output.tables[table] = await response.json();
    console.log(`${table}: ${output.tables[table].length} baris`);
  }

  mkdirSync("backups", { recursive: true });
  const filename = join(
    "backups",
    `supabase-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
  );
  writeFileSync(filename, JSON.stringify(output, null, 2));
  console.log(`Backup disimpan: ${filename}`);
}

main().catch((error) => {
  console.error("Backup gagal:", error.message);
  process.exit(1);
});
