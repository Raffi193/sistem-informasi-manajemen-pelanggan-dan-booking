import { calculateAge, dateInJakarta, todayInJakarta } from "@/lib/date";
import { formatJam } from "@/lib/format";

export const ANALYTICS_PERIODS = ["6", "12", "all"] as const;
export type AnalyticsPeriod = (typeof ANALYTICS_PERIODS)[number];

export function parseAnalyticsPeriod(
  value: string | undefined,
): AnalyticsPeriod {
  return value === "6" || value === "all" ? value : "12";
}

export const ANALYTICS_STATUS_ORDER = [
  "menunggu_pembayaran",
  "menunggu_verifikasi",
  "disetujui",
  "ditolak",
  "selesai",
  "batal",
] as const;

export type AnalyticsStatus = (typeof ANALYTICS_STATUS_ORDER)[number];

const STATUS_LABELS: Record<AnalyticsStatus, string> = {
  menunggu_pembayaran: "Menunggu Pembayaran",
  menunggu_verifikasi: "Menunggu Verifikasi",
  disetujui: "Disetujui",
  ditolak: "Ditolak",
  selesai: "Selesai",
  batal: "Batal",
};

const STATUS_COLORS: Record<AnalyticsStatus, string> = {
  menunggu_pembayaran: "#f59e0b",
  menunggu_verifikasi: "#3b82f6",
  disetujui: "#22c55e",
  ditolak: "#ef4444",
  selesai: "#1d4ed8",
  batal: "#94a3b8",
};

export const AGE_BUCKETS = [
  "≤20",
  "21–30",
  "31–40",
  "41–50",
  "51+",
  "Tidak diketahui",
] as const;

export type AgeBucket = (typeof AGE_BUCKETS)[number];

export type AnalyticsBooking = {
  tgl_booking: string;
  status: string;
  tanggal_latihan: string | null;
  paket_id: string | null;
  slot_template_id: string | null;
};

export type AnalyticsCustomer = {
  created_at: string;
  tanggal_lahir: string | null;
};

export type AnalyticsPackage = {
  id: string;
  nama: string;
};

export type AnalyticsSlotTemplate = {
  id: string;
  jam_mulai: string;
  jam_selesai: string;
};

export type MonthlyBookingPoint = {
  month: string;
  label: string;
  fullLabel: string;
  total: number;
  approved: number;
  completed: number;
};

export type MonthlyCustomerPoint = {
  month: string;
  label: string;
  fullLabel: string;
  total: number;
};

export type PackagePopularityPoint = {
  id: string;
  name: string;
  count: number;
};

export type StatusDistributionPoint = {
  status: AnalyticsStatus;
  label: string;
  color: string;
  count: number;
};

export type HourPopularityPoint = {
  id: string;
  label: string;
  count: number;
};

export type AgeDistributionPoint = {
  range: AgeBucket;
  count: number;
};

export type AnalyticsKpis = {
  totalBookings: number;
  newCustomers: number;
  approvedBookings: number;
  completedBookings: number;
};

export type AnalyticsData = {
  bookingTrend: MonthlyBookingPoint[];
  customerTrend: MonthlyCustomerPoint[];
  packagePopularity: PackagePopularityPoint[];
  statusDistribution: StatusDistributionPoint[];
  hourPopularity: HourPopularityPoint[];
  ageDistribution: AgeDistributionPoint[];
  kpis: AnalyticsKpis;
};

/** Daftar bulan terakhir, termasuk bulan berjalan, dalam format YYYY-MM. */
export function lastMonthKeys(
  count: number,
  today = todayInJakarta(),
): string[] {
  const [year, month] = today.split("-").map(Number);
  const startDate = new Date(Date.UTC(year, month - count, 1));

  return monthKeysBetween(
    startDate.toISOString().slice(0, 7),
    today.slice(0, 7),
  );
}

/** Daftar bulan dari startMonth sampai endMonth, inklusif. */
export function monthKeysBetween(
  startMonth: string,
  endMonth: string,
): string[] {
  const [startYear, startMonthNumber] = startMonth.split("-").map(Number);
  const [endYear, endMonthNumber] = endMonth.split("-").map(Number);
  const monthCount =
    (endYear - startYear) * 12 + (endMonthNumber - startMonthNumber);

  if (monthCount < 0) return [];

  return Array.from({ length: monthCount + 1 }, (_, index) => {
    const date = new Date(
      Date.UTC(startYear, startMonthNumber - 1 + index, 1),
    );
    return date.toISOString().slice(0, 7);
  });
}

/**
 * Rentang bulan dari data paling awal sampai bulan berjalan.
 * Dipakai untuk periode "Semua" agar tren tetap terisi bulan kosong.
 */
export function monthKeysFromDates(
  dates: readonly (string | null | undefined)[],
  today = todayInJakarta(),
): string[] {
  const monthKeys = dates
    .filter((date): date is string => Boolean(date))
    .map((date) => dateInJakarta(date).slice(0, 7))
    .filter((month) => /^\d{4}-\d{2}$/.test(month));

  if (monthKeys.length === 0) return [];

  const currentMonth = today.slice(0, 7);
  const startMonth = monthKeys.reduce((min, month) =>
    month < min ? month : min,
  );
  const latestMonth = monthKeys.reduce((max, month) =>
    month > max ? month : max,
  );
  const endMonth = latestMonth > currentMonth ? latestMonth : currentMonth;

  return monthKeysBetween(startMonth, endMonth);
}

export function monthLabel(month: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  }).format(new Date(`${month}-01T00:00:00Z`));
}

export function monthLongLabel(month: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${month}-01T00:00:00Z`));
}

function isCountedBooking(status: string) {
  return status !== "ditolak" && status !== "batal";
}

function isValidStatus(value: string): value is AnalyticsStatus {
  return ANALYTICS_STATUS_ORDER.includes(value as AnalyticsStatus);
}

function ageBucket(age: number | null): AgeBucket {
  if (age === null) return "Tidak diketahui";
  if (age <= 20) return "≤20";
  if (age <= 30) return "21–30";
  if (age <= 40) return "31–40";
  if (age <= 50) return "41–50";
  return "51+";
}

export function buildBookingTrend(
  bookings: readonly AnalyticsBooking[],
  months: readonly string[],
): MonthlyBookingPoint[] {
  const buckets = new Map<
    string,
    { total: number; approved: number; completed: number }
  >(
    months.map(
      (
        month,
      ): [string, { total: number; approved: number; completed: number }] => [
        month,
        { total: 0, approved: 0, completed: 0 },
      ],
    ),
  );

  for (const booking of bookings) {
    const month = dateInJakarta(booking.tgl_booking).slice(0, 7);
    const bucket = buckets.get(month);
    if (!bucket) continue;

    bucket.total += 1;
    if (booking.status === "disetujui") bucket.approved += 1;
    if (booking.status === "selesai") bucket.completed += 1;
  }

  return months.map((month) => {
    const bucket =
      buckets.get(month) ?? { total: 0, approved: 0, completed: 0 };
    return {
      month,
      label: monthLabel(month),
      fullLabel: monthLongLabel(month),
      ...bucket,
    };
  });
}

export function buildCustomerTrend(
  customers: readonly AnalyticsCustomer[],
  months: readonly string[],
): MonthlyCustomerPoint[] {
  const buckets = new Map<string, number>(
    months.map((month): [string, number] => [month, 0]),
  );

  for (const customer of customers) {
    const month = dateInJakarta(customer.created_at).slice(0, 7);
    if (!buckets.has(month)) continue;
    buckets.set(month, (buckets.get(month) ?? 0) + 1);
  }

  return months.map((month) => ({
    month,
    label: monthLabel(month),
    fullLabel: monthLongLabel(month),
    total: buckets.get(month) ?? 0,
  }));
}

export function buildPackagePopularity(
  bookings: readonly AnalyticsBooking[],
  packages: readonly AnalyticsPackage[],
): PackagePopularityPoint[] {
  const packageNames = new Map(
    packages.map((paket) => [paket.id, paket.nama] as const),
  );
  const counts = new Map<string, number>();

  for (const booking of bookings) {
    if (!isCountedBooking(booking.status)) continue;
    const key = booking.paket_id ?? "tanpa-paket";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const sorted = [...counts.entries()]
    .map(([id, count]) => ({
      id,
      name: packageNames.get(id) ?? "Paket tidak tersedia",
      count,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  if (sorted.length <= 6) return sorted;

  const top = sorted.slice(0, 5);
  const rest = sorted.slice(5);

  return [
    ...top,
    {
      id: "paket-lainnya",
      name: `Paket lainnya (${rest.length})`,
      count: rest.reduce((total, item) => total + item.count, 0),
    },
  ];
}

export function buildStatusDistribution(
  bookings: readonly AnalyticsBooking[],
): StatusDistributionPoint[] {
  const counts = new Map<AnalyticsStatus, number>(
    ANALYTICS_STATUS_ORDER.map((status) => [status, 0] as const),
  );

  for (const booking of bookings) {
    if (!isValidStatus(booking.status)) continue;
    counts.set(booking.status, (counts.get(booking.status) ?? 0) + 1);
  }

  return ANALYTICS_STATUS_ORDER.map((status) => ({
    status,
    label: STATUS_LABELS[status],
    color: STATUS_COLORS[status],
    count: counts.get(status) ?? 0,
  }));
}

export function buildHourPopularity(
  bookings: readonly AnalyticsBooking[],
  templates: readonly AnalyticsSlotTemplate[],
): HourPopularityPoint[] {
  const templateById = new Map(
    templates.map((template) => [template.id, template] as const),
  );
  const counts = new Map<string, number>();

  for (const booking of bookings) {
    if (!isCountedBooking(booking.status) || !booking.slot_template_id) {
      continue;
    }

    counts.set(
      booking.slot_template_id,
      (counts.get(booking.slot_template_id) ?? 0) + 1,
    );
  }

  return [...counts.entries()]
    .map(([id, count]) => {
      const template = templateById.get(id);
      return {
        id,
        label: template
          ? `${formatJam(template.jam_mulai)}–${formatJam(template.jam_selesai)}`
          : "Jam tidak tersedia",
        start: template?.jam_mulai ?? "99:99",
        count,
      };
    })
    .sort((a, b) => a.start.localeCompare(b.start))
    .map(({ id, label, count }) => ({ id, label, count }));
}

export function buildAgeDistribution(
  customers: readonly AnalyticsCustomer[],
): AgeDistributionPoint[] {
  const counts = new Map<AgeBucket, number>(
    AGE_BUCKETS.map((bucket) => [bucket, 0] as const),
  );

  for (const customer of customers) {
    const age = calculateAge(
      customer.tanggal_lahir,
      dateInJakarta(customer.created_at),
    );
    const bucket = ageBucket(age);
    counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
  }

  return AGE_BUCKETS.map((range) => ({
    range,
    count: counts.get(range) ?? 0,
  }));
}

export function summarizeAnalytics(
  bookings: readonly AnalyticsBooking[],
  customers: readonly AnalyticsCustomer[],
): AnalyticsKpis {
  const totalBookings = bookings.length;
  const approvedBookings = bookings.filter(
    (booking) => booking.status === "disetujui",
  ).length;
  const completedBookings = bookings.filter(
    (booking) => booking.status === "selesai",
  ).length;

  return {
    totalBookings,
    newCustomers: customers.length,
    approvedBookings,
    completedBookings,
  };
}

export function buildAnalyticsData({
  bookings,
  customers,
  packages,
  templates,
  months,
}: {
  bookings: readonly AnalyticsBooking[];
  customers: readonly AnalyticsCustomer[];
  packages: readonly AnalyticsPackage[];
  templates: readonly AnalyticsSlotTemplate[];
  months: readonly string[];
}): AnalyticsData {
  return {
    bookingTrend: buildBookingTrend(bookings, months),
    customerTrend: buildCustomerTrend(customers, months),
    packagePopularity: buildPackagePopularity(bookings, packages),
    statusDistribution: buildStatusDistribution(bookings),
    hourPopularity: buildHourPopularity(bookings, templates),
    ageDistribution: buildAgeDistribution(customers),
    kpis: summarizeAnalytics(bookings, customers),
  };
}
