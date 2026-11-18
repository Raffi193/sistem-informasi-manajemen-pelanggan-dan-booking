import "./load-migration-env.mjs";
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

const MASTER_TABLES = ["paket", "kendaraan", "instruktur", "slot_template"];
const TRANSACTION_TABLES = [
  "slot",
  "customer",
  "booking",
  "pembayaran",
  "follow_up",
];
const DELETE_ORDER = [
  "follow_up",
  "pembayaran",
  "booking",
  "customer",
  "slot",
];
const INSERT_ORDER = ["slot", "customer", "booking", "pembayaran", "follow_up"];

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
  slot_template: [
    "id",
    "urutan",
    "jam_mulai",
    "jam_selesai",
    "kapasitas",
    "status_aktif",
    "created_at",
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

function pick(row, table) {
  const clean = {};
  for (const column of COLUMNS[table] ?? []) {
    if (row[column] !== undefined) clean[column] = row[column];
  }
  return clean;
}

function normalizeName(value) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeTime(value) {
  return typeof value === "string" ? value.slice(0, 5) : "";
}

function templateKey(row) {
  return `${normalizeTime(row.jam_mulai)}-${normalizeTime(row.jam_selesai)}`;
}

async function fetchAll(client, table) {
  const rows = [];
  let from = 0;

  while (true) {
    const { data, error } = await client
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

function buildMap(oldRows, newRows, oldKey, newKey, label, required = true) {
  const newByKey = new Map();

  for (const row of newRows) {
    const key = newKey(row);
    if (!newByKey.has(key)) newByKey.set(key, row.id);
  }

  const map = new Map();
  const missing = [];

  for (const row of oldRows) {
    const key = oldKey(row);
    const newId = newByKey.get(key);

    if (newId) {
      map.set(row.id, newId);
    } else {
      missing.push(key);
    }
  }

  if (required && missing.length > 0) {
    throw new Error(
      `Mapping ${label} gagal. Tidak ditemukan di project baru: ${missing.join(", ")}`,
    );
  }

  console.log(
    `Mapping ${label}: ${map.size}/${oldRows.length}${missing.length ? `, dilewati: ${missing.length}` : ""}`,
  );

  return map;
}

function mapSlot(row, maps) {
  const clean = pick(row, "slot");

  if (clean.kendaraan_id) {
    clean.kendaraan_id = maps.kendaraan.get(clean.kendaraan_id) ?? null;
  }
  if (clean.instruktur_id) {
    clean.instruktur_id = maps.instruktur.get(clean.instruktur_id) ?? null;
  }

  return clean;
}

function mapBooking(row, maps, oldTemplatesById) {
  const clean = pick(row, "booking");

  if (clean.paket_id) {
    const mapped = maps.paket.get(clean.paket_id);
    if (!mapped) {
      throw new Error(`Paket ${clean.paket_id} tidak ditemukan di project baru.`);
    }
    clean.paket_id = mapped;
  }

  if (clean.slot_template_id) {
    const mapped = maps.slotTemplate.get(clean.slot_template_id);
    if (!mapped) {
      throw new Error(
        `Slot template ${clean.slot_template_id} tidak ditemukan di project baru.`,
      );
    }
    clean.slot_template_id = mapped;
  }

  if (!clean.slot_template_id || !clean.tanggal_latihan) {
    clean.slot_template_id = null;
    clean.tanggal_latihan = null;
  }

  if (clean.status === "no_show") clean.status = "batal";

  if (clean.biaya_tambahan === undefined || clean.biaya_tambahan === null) {
    const oldTemplate = row.slot_template_id
      ? oldTemplatesById.get(row.slot_template_id)
      : null;
    clean.biaya_tambahan =
      oldTemplate && normalizeTime(oldTemplate.jam_mulai) >= "18:00"
        ? 20000
        : 0;
  }

  return clean;
}

async function main() {
  console.log("Membaca data dari project lama...");
  const old = {};

  for (const table of [...MASTER_TABLES, ...TRANSACTION_TABLES]) {
    old[table] = await fetchAll(oldClient, table);
    console.log(`${table}: ${old[table].length} baris`);
  }

  console.log("\nMembaca master data project baru...");
  const fresh = {};

  for (const table of MASTER_TABLES) {
    fresh[table] = await fetchAll(newClient, table);
    console.log(`${table}: ${fresh[table].length} baris`);
  }

  if (fresh.paket.length === 0 || fresh.slot_template.length === 0) {
    throw new Error(
      "Master data project baru masih kosong. Isi paket dan slot_template terlebih dahulu.",
    );
  }

  console.log("\nMenyiapkan mapping foreign key...");
  const maps = {
    paket: buildMap(
      old.paket,
      fresh.paket,
      (row) => normalizeName(row.nama),
      (row) => normalizeName(row.nama),
      "paket",
    ),
    kendaraan: buildMap(
      old.kendaraan,
      fresh.kendaraan,
      (row) => normalizeName(row.nama),
      (row) => normalizeName(row.nama),
      "kendaraan",
    ),
    instruktur: buildMap(
      old.instruktur,
      fresh.instruktur,
      (row) => normalizeName(row.nama),
      (row) => normalizeName(row.nama),
      "instruktur",
      false,
    ),
    slotTemplate: buildMap(
      old.slot_template,
      fresh.slot_template,
      templateKey,
      templateKey,
      "slot_template",
    ),
  };

  const oldTemplatesById = new Map(
    old.slot_template.map((row) => [row.id, row]),
  );

  const mapped = {
    slot: old.slot.map((row) => mapSlot(row, maps)),
    customer: old.customer.map((row) => pick(row, "customer")),
    booking: old.booking.map((row) => mapBooking(row, maps, oldTemplatesById)),
    pembayaran: old.pembayaran.map((row) => pick(row, "pembayaran")),
    follow_up: old.follow_up.map((row) => pick(row, "follow_up")),
  };

  console.log("\nData yang akan diimpor:");
  for (const table of INSERT_ORDER) {
    console.log(`${table}: ${mapped[table].length} baris`);
  }

  if (!CONFIRM) {
    console.log("\nDRY RUN selesai. Master data project baru tidak diubah.");
    console.log(
      "Set CONFIRM_RESET_NEW=YES untuk mengosongkan tabel transaksi baru lalu import.",
    );
    return;
  }

  console.log("\nMengosongkan tabel transaksi project baru...");
  for (const table of DELETE_ORDER) {
    await clearTable(table);
    console.log(`  ${table}: dikosongkan`);
  }

  console.log("\nMengimpor data transaksi ke project baru...");
  for (const table of INSERT_ORDER) {
    await insertRows(table, mapped[table]);
  }

  console.log("\nVerifikasi jumlah baris transaksi...");
  let failed = false;
  for (const table of INSERT_ORDER) {
    const expected = mapped[table].length;
    const actual = await countRows(table);
    const ok = actual === expected;
    console.log(`${ok ? "OK" : "MISMATCH"} ${table}: ${actual}/${expected}`);
    if (!ok) failed = true;
  }

  if (failed) {
    throw new Error("Jumlah baris tidak sama. Periksa data sebelum production.");
  }

  console.log("\nMigrasi data selesai. Master data project baru tetap dipertahankan.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});