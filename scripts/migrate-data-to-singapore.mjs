import { createClient } from "@supabase/supabase-js";

const OLD_URL = process.env.OLD_SUPABASE_URL;
const OLD_KEY = process.env.OLD_SERVICE_ROLE_KEY;
const NEW_URL = process.env.NEW_SUPABASE_URL;
const NEW_KEY = process.env.NEW_SERVICE_ROLE_KEY;
const CONFIRM = process.env.CONFIRM_RESET_NEW === "YES";

if (!OLD_URL || !OLD_KEY || !NEW_URL || !NEW_KEY) {
  console.error(
    "Set OLD_SUPABASE_URL, OLD_SERVICE_ROLE_KEY, NEW_SUPABASE_URL, dan NEW_SERVICE_ROLE_KEY.",
  );
  process.exit(1);
}

const oldClient = createClient(OLD_URL, OLD_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const newClient = createClient(NEW_URL, NEW_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Urutan insert mengikuti foreign key. Delete memakai urutan terbalik.
const TABLES = [
  "paket",
  "kendaraan",
  "instruktur",
  "slot",
  "slot_template",
  "customer",
  "booking",
  "pembayaran",
  "follow_up",
];

// Kolom final setelah migrasi 0011. Kolom lama seperti sisa_jam sengaja
// tidak dibawa karena sudah dihapus dari schema baru.
const COLUMNS = {
  paket: [
    "id",
    "nama",
    "transmisi",
    "jumlah_pertemuan",
    "harga",
    "keterangan",
    "status_aktif",
    "created_at",
  ],
  kendaraan: ["id", "nama", "plat", "transmisi", "status_aktif"],
  instruktur: [
    "id",
    "nama",
    "no_wa",
    "status_aktif",
    "foto_url",
    "sertifikat_url",
  ],
  slot: [
    "id",
    "tanggal",
    "jam_mulai",
    "jam_selesai",
    "sesi",
    "kendaraan_id",
    "instruktur_id",
    "status",
  ],
  slot_template: [
    "id",
    "urutan",
    "jam_mulai",
    "jam_selesai",
    "kapasitas",
    "status_aktif",
    "created_at",
  ],
  customer: [
    "id",
    "nama",
    "no_wa",
    "alamat",
    "status",
    "created_at",
    "tanggal_lahir",
  ],
  booking: [
    "id",
    "kode_booking",
    "customer_id",
    "paket_id",
    "slot_id",
    "status",
    "tgl_booking",
    "catatan",
    "slot_template_id",
    "tanggal_latihan",
    "biaya_tambahan",
  ],
  pembayaran: [
    "id",
    "booking_id",
    "jenis",
    "jumlah",
    "metode",
    "bukti_file",
    "status_verifikasi",
    "created_at",
  ],
  follow_up: ["id", "customer_id", "jenis", "catatan", "tgl"],
};

const PAGE_SIZE = 1000;
const INSERT_BATCH_SIZE = 500;
const ZERO_UUID = "00000000-0000-0000-0000-000000000000";

async function fetchAll(table) {
  const rows = [];
  let from = 0;

  while (true) {
    const { data, error } = await oldClient
      .from(table)
      .select("*")
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      throw new Error(`Gagal membaca ${table}: ${error.message}`);
    }

    const page = data ?? [];
    rows.push(...page);

    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return rows;
}

function normalizeTime(value) {
  return typeof value === "string" ? value.slice(0, 5) : "";
}

function sanitizeRows(table, rows, slotTemplateById) {
  return rows.map((row) => {
    const clean = {};

    for (const column of COLUMNS[table] ?? []) {
      if (row[column] !== undefined) {
        clean[column] = row[column];
      }
    }

    if (table === "booking") {
      // Status no_show sudah dihapus dari schema baru.
      if (clean.status === "no_show") clean.status = "batal";

      // Kedua kolom jadwal harus null atau terisi bersama.
      if (!clean.slot_template_id || !clean.tanggal_latihan) {
        clean.slot_template_id = null;
        clean.tanggal_latihan = null;
      }

      if (clean.biaya_tambahan === undefined || clean.biaya_tambahan === null) {
        const template = clean.slot_template_id
          ? slotTemplateById.get(clean.slot_template_id)
          : null;
        clean.biaya_tambahan =
          template && normalizeTime(template.jam_mulai) >= "18:00" ? 20000 : 0;
      }
    }

    return clean;
  });
}

async function clearTable(table) {
  const { error } = await newClient
    .from(table)
    .delete()
    .neq("id", ZERO_UUID);

  if (error) {
    throw new Error(`Gagal mengosongkan ${table}: ${error.message}`);
  }
}

async function insertRows(table, rows) {
  for (let index = 0; index < rows.length; index += INSERT_BATCH_SIZE) {
    const batch = rows.slice(index, index + INSERT_BATCH_SIZE);
    const { error } = await newClient.from(table).insert(batch);

    if (error) {
      throw new Error(`Gagal insert ${table}: ${error.message}`);
    }

    console.log(`  ${table}: ${index + batch.length}/${rows.length}`);
  }
}

async function countRows(table) {
  const { count, error } = await newClient
    .from(table)
    .select("*", { count: "exact", head: true });

  if (error) {
    throw new Error(`Gagal menghitung ${table}: ${error.message}`);
  }

  return count ?? 0;
}

async function main() {
  console.log("Membaca data dari project lama...");
  const dump = {};

  for (const table of TABLES) {
    const rows = await fetchAll(table);
    const slotTemplateById = new Map(
      (dump.slot_template ?? []).map((row) => [row.id, row]),
    );
    dump[table] = sanitizeRows(table, rows, slotTemplateById);
    console.log(`${table}: ${dump[table].length} baris`);
  }

  if (!CONFIRM) {
    console.log("\nDRY RUN selesai. Tidak ada data baru yang diubah.");
    console.log(
      "Set CONFIRM_RESET_NEW=YES untuk mengosongkan tabel baru lalu import.",
    );
    return;
  }

  console.log("\nMengosongkan tabel project baru...");
  for (const table of [...TABLES].reverse()) {
    await clearTable(table);
    console.log(`  ${table}: dikosongkan`);
  }

  console.log("\nMengimpor data ke project baru...");
  for (const table of TABLES) {
    await insertRows(table, dump[table]);
  }

  console.log("\nVerifikasi jumlah baris...");
  let failed = false;
  for (const table of TABLES) {
    const expected = dump[table].length;
    const actual = await countRows(table);
    const ok = actual === expected;
    console.log(`${ok ? "OK" : "MISMATCH"} ${table}: ${actual}/${expected}`);
    if (!ok) failed = true;
  }

  if (failed) {
    throw new Error("Jumlah baris tidak sama. Periksa data sebelum production.");
  }

  console.log("\nMigrasi data selesai.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});