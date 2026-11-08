import Link from "next/link";
import { connection } from "next/server";
import { AdminPageHeader } from "@/components/admin-page-header";
import {
  AgeDistributionChart,
  BookingTrendChart,
  CustomerTrendChart,
  HourPopularityChart,
  PackagePopularityChart,
  StatusDonutChart,
} from "@/components/analytics-charts";
import {
  ANALYTICS_PERIODS,
  buildAnalyticsData,
  lastMonthKeys,
  monthKeysFromDates,
  monthLongLabel,
  parseAnalyticsPeriod,
  type AnalyticsBooking,
  type AnalyticsCustomer,
  type AnalyticsPackage,
  type AnalyticsSlotTemplate,
} from "@/lib/analytics";
import { startOfDayIso, todayInJakarta } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const instant = false;

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ periode?: string }>;
}) {
  await connection();

  const params = await searchParams;
  const period = parseAnalyticsPeriod(params.periode);
  const today = todayInJakarta();
  const periodMonths =
    period === "all" ? null : lastMonthKeys(Number(period), today);
  const startIso = periodMonths?.[0]
    ? startOfDayIso(`${periodMonths[0]}-01`)
    : null;

  const supabase = await createClient();

  const bookingsQuery = startIso
    ? supabase
        .from("booking")
        .select(
          "tgl_booking,status,tanggal_latihan,paket_id,slot_template_id",
        )
        .gte("tgl_booking", startIso)
    : supabase
        .from("booking")
        .select(
          "tgl_booking,status,tanggal_latihan,paket_id,slot_template_id",
        );

  const customersQuery = startIso
    ? supabase
        .from("customer")
        .select("created_at,tanggal_lahir")
        .gte("created_at", startIso)
    : supabase.from("customer").select("created_at,tanggal_lahir");

  const [bookingsRes, customersRes, packagesRes, templatesRes] =
    await Promise.all([
      bookingsQuery,
      customersQuery,
      supabase.from("paket").select("id,nama"),
      supabase
        .from("slot_template")
        .select("id,jam_mulai,jam_selesai"),
    ]);

  const queryErrors = [
    bookingsRes.error,
    customersRes.error,
    packagesRes.error,
    templatesRes.error,
  ].filter(Boolean);

  const bookings = (bookingsRes.data ?? []) as unknown as AnalyticsBooking[];
  const customers = (customersRes.data ?? []) as unknown as AnalyticsCustomer[];
  const packages = (packagesRes.data ?? []) as unknown as AnalyticsPackage[];
  const templates = (templatesRes.data ?? []) as unknown as AnalyticsSlotTemplate[];

  const months =
    periodMonths ??
    monthKeysFromDates(
      [
        ...bookings.map((booking) => booking.tgl_booking),
        ...customers.map((customer) => customer.created_at),
      ],
      today,
    );
  const firstMonth = months[0];
  const lastMonth = months[months.length - 1];
  const periodRangeLabel =
    firstMonth && lastMonth
      ? firstMonth === lastMonth
        ? monthLongLabel(firstMonth)
        : `${monthLongLabel(firstMonth)} – ${monthLongLabel(lastMonth)}`
      : "Belum ada data";

  const analytics = buildAnalyticsData({
    bookings,
    customers,
    packages,
    templates,
    months,
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Dashboard Analitik"
        description="Tren booking, pertumbuhan customer, popularitas paket, dan karakteristik pelanggan."
        action={
          <Link
            href="/admin/laporan"
            className="rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Lihat laporan →
          </Link>
        }
      />

      <section className="rounded-2xl border border-border bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">
              Periode analitik
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {period === "all"
                ? months.length > 0
                  ? `Semua data · ${periodRangeLabel}`
                  : "Semua data"
                : periodRangeLabel}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {ANALYTICS_PERIODS.map((value) => {
              const active = period === value;
              const label = value === "all" ? "Semua" : `${value} bulan`;

              return (
                <Link
                  key={value}
                  href={`/admin/analitik?periode=${value}`}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-white text-foreground hover:bg-secondary",
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {queryErrors.length > 0 && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          Sebagian data analitik gagal dimuat. Coba muat ulang halaman.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <KpiCard
          label="Total Booking"
          value={analytics.kpis.totalBookings}
          hint={period === "all" ? "Semua periode" : `${period} bulan terakhir`}
          accent
        />
        <KpiCard
          label="Pendaftar Baru"
          value={analytics.kpis.newCustomers}
          hint="Customer yang mendaftar"
        />
        <KpiCard
          label="Disetujui"
          value={analytics.kpis.approvedBookings}
          hint="Booking aktif menjalani kursus"
        />
        <KpiCard
          label="Selesai"
          value={analytics.kpis.completedBookings}
          hint="Masa latihan customer tuntas"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <BookingTrendChart data={analytics.bookingTrend} />
        <StatusDonutChart data={analytics.statusDistribution} />
        <CustomerTrendChart data={analytics.customerTrend} />
        <PackagePopularityChart data={analytics.packagePopularity} />
        <HourPopularityChart data={analytics.hourPopularity} />
        <AgeDistributionChart data={analytics.ageDistribution} />
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  hint,
  accent = false,
}: {
  label: string;
  value: number | string;
  hint: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 sm:p-5",
        accent ? "border-primary/30 bg-primary/5" : "border-border bg-white",
      )}
    >
      <p className="text-xs font-medium text-muted-foreground sm:text-sm">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 font-display text-3xl font-bold",
          accent ? "text-primary" : "text-foreground",
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
