// Utilitas: seed data demo untuk Dashboard Analitik.
// Pemakaian: node scripts/seed-demo.mjs
//
// Data demo memakai prefix:
//   - kode_booking: DEMO0001 ... DEMO0050
//   - no_wa:        628900000001 ... 628900000050
//
// Script ini aman dijalankan berulang: data demo lama dihapus lebih dulu,
// sedangkan data asli tidak disentuh.
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

const DEMO_COUNT = 50;
const DEMO_CODE_PREFIX = "DEMO";
const DEMO_WA_PREFIX = "62890000";

const firstNames = [
  "Andi",
  "Budi",
  "Citra",
  "Dewi",
  "Eko",
  "Fajar",
  "Gita",
  "Hana",
  "Indra",
  "Jihan",
];

const lastNames = [
  "Pratama",
  "Wijaya",
  "Saputra",
  "Lestari",
  "Nugroho",
  "Maharani",
  "Firmansyah",
  "Permata",
  "Hidayat",
  "Anggraini",
];

const statusPattern = [
  "selesai",
  "disetujui",
  "menunggu_verifikasi",
  "menunggu_pembayaran",
  "selesai",
  "batal",
  "ditolak",
  "selesai",
  "disetujui",
  "batal",
];

const packagePattern = [0, 1, 2, 3, 0, 4, 1, 5, 6, 2];
const slotPattern = [0, 1, 2, 1, 3, 4, 0, 2, 1, 3];

function fail(message, error) {
  console.error(message, error?.message ?? "");
  process.exit(1);
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function jakartaDate(date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const get = (type) => parts.find((part) => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function addDays(date, days) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function customerStatusForBooking(status) {
  if (status === "selesai") return "selesai";
  if (status === "disetujui") return "aktif";
  if (status === "batal") return "batal";
  return "calon";
}

function buildTrainingDate(status, bookingDate, index) {
  const offset = status === "selesai" ? 1 : 7 + (index % 5);

  return addDays(bookingDate, offset);
}

function reserveTrainingSlot(
  trainingDate,
  preferredSlotIndex,
  usage,
  templateCount,
) {
  let candidateDate = trainingDate;
  let slotIndex = preferredSlotIndex % templateCount;

  for (let attempt = 0; attempt < 100; attempt += 1) {
    const key = `${jakartaDate(candidateDate)}|${slotIndex}`;
    const used = usage.get(key) ?? 0;

    if (used < 4) {
      usage.set(key, used + 1);
      return {
        tanggalLatihan: jakartaDate(candidateDate),
        slotIndex,
      };
    }

    slotIndex = (slotIndex + 1) % templateCount;

    if (slotIndex === preferredSlotIndex % templateCount) {
      candidateDate = addDays(candidateDate, 1);
    }
  }

  throw new Error("Tidak menemukan jadwal dengan kapasitas tersisa.");
}

async function main() {
  const { data: packages, error: packagesError } = await supabase
    .from("paket")
    .select("id,nama,harga")
    .eq("status_aktif", true)
    .order("harga", { ascending: true });

  if (packagesError) fail("Gagal membaca paket:", packagesError);
  if (!packages?.length) fail("Tidak ada paket aktif untuk dipakai seed.");

  const { data: templates, error: templatesError } = await supabase
    .from("slot_template")
    .select("id,jam_mulai,jam_selesai,urutan")
    .eq("status_aktif", true)
    .order("jam_mulai", { ascending: true });

  if (templatesError) fail("Gagal membaca template jadwal:", templatesError);
  if (!templates?.length) {
    fail("Tidak ada template jadwal aktif untuk dipakai seed.");
  }

  // Hanya pakai lima slot reguler pertama agar data demo konsisten dengan
  // pilihan jadwal yang tampil di halaman booking.
  const usableTemplates = templates.slice(0, 5);

  console.log("Menghapus data demo lama...");
  const { error: deleteBookingsError } = await supabase
    .from("booking")
    .delete()
    .like("kode_booking", `${DEMO_CODE_PREFIX}%`);

  if (deleteBookingsError) {
    fail("Gagal menghapus booking demo lama:", deleteBookingsError);
  }

  const { error: deleteCustomersError } = await supabase
    .from("customer")
    .delete()
    .like("no_wa", `${DEMO_WA_PREFIX}%`);

  if (deleteCustomersError) {
    fail("Gagal menghapus customer demo lama:", deleteCustomersError);
  }

  const end = new Date();
  end.setUTCHours(9, 0, 0, 0);
  end.setUTCDate(end.getUTCDate() - 1);

  const start = new Date(end);
  start.setUTCMonth(start.getUTCMonth() - 23);
  start.setUTCDate(1);
  start.setUTCHours(1, 0, 0, 0);

  const span = end.getTime() - start.getTime();
  const usage = new Map();
  const customers = [];
  const bookingDrafts = [];

  for (let index = 0; index < DEMO_COUNT; index += 1) {
    const status = statusPattern[index % statusPattern.length];
    const paket = packages[packagePattern[index % packagePattern.length] % packages.length];
    const bookingDate = new Date(
      start.getTime() + Math.round((span * index) / (DEMO_COUNT - 1)),
    );
    bookingDate.setUTCHours(bookingDate.getUTCHours() + (index % 5));

    const name = `${firstNames[index % firstNames.length]} ${
      lastNames[Math.floor(index / firstNames.length) % lastNames.length]
    }`;
    const noWa = `${DEMO_WA_PREFIX}${String(index + 1).padStart(6, "0")}`;

    const birthYear = 1968 + ((index * 7) % 40);
    const birthMonth = ((index * 5) % 12) + 1;
    const birthDay = ((index * 3) % 28) + 1;
    const tanggalLahir =
      index % 11 === 0
        ? null
        : `${birthYear}-${pad(birthMonth)}-${pad(birthDay)}`;

    customers.push({
      nama: name,
      no_wa: noWa,
      alamat: `Jl. Demo Raya No. ${index + 1}, Jakarta`,
      status: customerStatusForBooking(status),
      created_at: bookingDate.toISOString(),
      tanggal_lahir: tanggalLahir,
    });

    const preferredSlotIndex =
      slotPattern[index % slotPattern.length] % usableTemplates.length;
    const trainingDate = buildTrainingDate(status, bookingDate, index);
    const reserved = reserveTrainingSlot(
      trainingDate,
      preferredSlotIndex,
      usage,
      usableTemplates.length,
    );

    bookingDrafts.push({
      kode_booking: `${DEMO_CODE_PREFIX}${String(index + 1).padStart(4, "0")}`,
      no_wa: noWa,
      paket,
      status,
      bookingDate,
      tanggal_latihan: reserved.tanggalLatihan,
      slot_template_id: usableTemplates[reserved.slotIndex].id,
    });
  }

  console.log(`Menyisipkan ${customers.length} customer demo...`);
  const { data: insertedCustomers, error: customersError } = await supabase
    .from("customer")
    .insert(customers)
    .select("id,no_wa");

  if (customersError) fail("Gagal menyisipkan customer demo:", customersError);

  const customerIdByWa = new Map(
    (insertedCustomers ?? []).map((customer) => [customer.no_wa, customer.id]),
  );
  const templateById = new Map(
    usableTemplates.map((template) => [template.id, template]),
  );

  const bookings = bookingDrafts.map((draft) => {
    const template = templateById.get(draft.slot_template_id);
    const biayaTambahan =
      template && template.jam_mulai.slice(0, 5) >= "18:00" ? 20000 : 0;

    return {
      kode_booking: draft.kode_booking,
      customer_id: customerIdByWa.get(draft.no_wa),
      paket_id: draft.paket.id,
      slot_template_id: draft.slot_template_id,
      tanggal_latihan: draft.tanggal_latihan,
      status: draft.status,
      biaya_tambahan: biayaTambahan,
      tgl_booking: draft.bookingDate.toISOString(),
    };
  });

  console.log(`Menyisipkan ${bookings.length} booking demo...`);
  const { data: insertedBookings, error: bookingsError } = await supabase
    .from("booking")
    .insert(bookings)
    .select("id,kode_booking,status,paket_id,tgl_booking");

  if (bookingsError) fail("Gagal menyisipkan booking demo:", bookingsError);

  const packageById = new Map(packages.map((paket) => [paket.id, paket]));
  const payments = [];

  for (const booking of insertedBookings ?? []) {
    const paket = packageById.get(booking.paket_id);
    const harga = paket?.harga ?? 0;
    const dp = Math.round(harga / 2);
    const createdAt = new Date(
      new Date(booking.tgl_booking).getTime() + 60 * 60 * 1000,
    ).toISOString();

    if (booking.status === "menunggu_verifikasi") {
      payments.push({
        booking_id: booking.id,
        jenis: "dp",
        jumlah: dp,
        metode: "transfer",
        bukti_file: null,
        status_verifikasi: "menunggu",
        created_at: createdAt,
      });
    }

    if (booking.status === "disetujui") {
      payments.push({
        booking_id: booking.id,
        jenis: "dp",
        jumlah: dp,
        metode: "transfer",
        bukti_file: null,
        status_verifikasi: "terverifikasi",
        created_at: createdAt,
      });
    }

    if (booking.status === "selesai") {
      payments.push(
        {
          booking_id: booking.id,
          jenis: "dp",
          jumlah: dp,
          metode: "transfer",
          bukti_file: null,
          status_verifikasi: "terverifikasi",
          created_at: createdAt,
        },
        {
          booking_id: booking.id,
          jenis: "pelunasan",
          jumlah: harga - dp,
          metode: "transfer",
          bukti_file: null,
          status_verifikasi: "terverifikasi",
          created_at: new Date(
            new Date(createdAt).getTime() + 60 * 60 * 1000,
          ).toISOString(),
        },
      );
    }
  }

  if (payments.length > 0) {
    console.log(`Menyisipkan ${payments.length} pembayaran demo...`);
    const { error: paymentsError } = await supabase
      .from("pembayaran")
      .insert(payments);

    if (paymentsError) fail("Gagal menyisipkan pembayaran demo:", paymentsError);
  }

  const statusCounts = (insertedBookings ?? []).reduce((result, booking) => {
    result[booking.status] = (result[booking.status] ?? 0) + 1;
    return result;
  }, {});

  console.log("\nSeed demo selesai.");
  console.log(`- Customer : ${insertedCustomers?.length ?? 0}`);
  console.log(`- Booking  : ${insertedBookings?.length ?? 0}`);
  console.log(`- Pembayaran: ${payments.length}`);
  console.log("- Status booking:", statusCounts);
  console.log(
    `- Rentang booking: ${jakartaDate(start)} s/d ${jakartaDate(end)}`,
  );
}

main().catch((error) => {
  console.error("Seed demo gagal:", error);
  process.exit(1);
});
