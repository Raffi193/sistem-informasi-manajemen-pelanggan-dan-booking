import Link from "next/link";
import { connection } from "next/server";
import {
  ArrowRight,
  BarChart3,
  CalendarCheck,
  Car,
  CheckCircle2,
  Clock3,
  Database,
  FileText,
  GraduationCap,
  Package,
  Users,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin-page-header";
import {
  BOOKING_STATUSES,
  StatusBadge,
  type StatusValue,
} from "@/components/status-badge";
import { countValues } from "@/lib/count";
import { formatTanggal } from "@/lib/date";
import { one, type Embed } from "@/lib/embed";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

type BookingRow = {
  id: string;
  kode_booking: string;
  status: StatusValue;
  tgl_booking: string;
  customer: Embed<{ nama: string; no_wa: string }>;
};

// Halaman admin selalu dirender saat request (sesi cookie).
export const instant = false;

export default async function AdminDashboardPage() {
  // Pastikan render terjadi saat request: query Supabase memakai sesi cookie.
  await connection();
  const supabase = await createClient();

  // Semua query berjalan paralel. Status booking diambil sekali lalu dihitung
  // di memori, bukan tujuh query count terpisah.
  const [
    bookingsRes,
    statusesRes,
    customerRes,
    paketRes,
    kendaraanRes,
    instrukturRes,
    slotTemplateRes,
  ] = await Promise.all([
    supabase
      .from("booking")
      .select("id,kode_booking,status,tgl_booking,customer:customer_id(nama,no_wa)")
      .order("tgl_booking", { ascending: false })
      .limit(8),
    supabase.from("booking").select("status"),
    supabase.from("customer").select("*", { count: "exact", head: true }),
    supabase
      .from("paket")
      .select("*", { count: "exact", head: true })
      .eq("status_aktif", true),
    supabase.from("kendaraan").select("*", { count: "exact", head: true }),
    supabase.from("instruktur").select("*", { count: "exact", head: true }),
    supabase
      .from("slot_template")
      .select("*", { count: "exact", head: true })
      .eq("status_aktif", true),
  ]);

  const bookings = (bookingsRes.data ?? []) as unknown as BookingRow[];
  const statusRows = (statusesRes.data ?? []) as { status: StatusValue }[];
  const statusCounts = countValues(
    BOOKING_STATUSES,
    statusRows.map((row) => row.status),
  );
  const totalBooking = statusRows.length;

  const stats: {
    label: string;
    value: number;
    accent: boolean;
    href?: string;
    icon: typeof CalendarCheck;
  }[] = [
    {
      label: "Total Booking Tercatat",
      value: totalBooking,
      accent: false,
      icon: CalendarCheck,
    },
    {
      label: "Booking Menunggu Verifikasi",
      value: statusCounts.menunggu_verifikasi,
      accent: true,
      href: "/admin/booking?status=menunggu_verifikasi",
      icon: Clock3,
    },
    {
      label: "Booking Disetujui",
      value: statusCounts.disetujui,
      accent: false,
      icon: CheckCircle2,
    },
    {
      label: "Daftar Customer",
      value: customerRes.count ?? 0,
      accent: false,
      href: "/admin/customer",
      icon: Users,
    },
    {
      label: "Jadwal Kursus Aktif",
      value: slotTemplateRes.count ?? 0,
      accent: false,
      href: "/admin/master",
      icon: CalendarCheck,
    },
    {
      label: "Paket Aktif",
      value: paketRes.count ?? 0,
      accent: false,
      icon: Package,
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Dashboard"
        description="Ringkasan operasional LPK CV. Fathan."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/analitik"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <BarChart3 className="size-4" aria-hidden="true" />
              Lihat analitik
            </Link>
            <Link
              href="/admin/laporan"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              <FileText className="size-4" aria-hidden="true" />
              Lihat laporan
            </Link>
          </div>
        }
      />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {stats.map((stat) => {
          const cardClass = cn(
            "card-lift rounded-2xl border p-4 sm:p-5",
            stat.accent
              ? "border-primary/30 bg-primary/5"
              : "border-border bg-white",
            stat.href && "transition-colors hover:border-primary/60",
          );
          const content = (
            <>
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <stat.icon
                  className={cn(
                    "size-5 shrink-0",
                    stat.accent ? "text-primary" : "text-muted-foreground/60",
                  )}
                  aria-hidden="true"
                />
              </div>
              <p
                className={cn(
                  "mt-2 font-display text-3xl font-bold",
                  stat.accent ? "text-primary" : "text-foreground",
                )}
              >
                {stat.value}
              </p>
              {stat.href && (
                <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary">
                  Lihat daftar
                  <ArrowRight className="size-3" aria-hidden="true" />
                </p>
              )}
            </>
          );

          return stat.href ? (
            <Link key={stat.label} href={stat.href} className={cardClass}>
              {content}
            </Link>
          ) : (
            <div key={stat.label} className={cardClass}>
              {content}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-border bg-white p-4 sm:p-5">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Car className="size-4" aria-hidden="true" />
            Jumlah Kendaraan
          </p>
          <p className="mt-1 font-display text-2xl font-bold">
            {kendaraanRes.count ?? 0}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-white p-4 sm:p-5">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <GraduationCap className="size-4" aria-hidden="true" />
            Jumlah Instruktur
          </p>
          <p className="mt-1 font-display text-2xl font-bold">
            {instrukturRes.count ?? 0}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        <div className="flex flex-col gap-2 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <h2 className="flex items-center gap-2 font-display font-bold">
            <CalendarCheck className="size-4 text-primary" aria-hidden="true" />
            Booking terbaru
          </h2>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/booking"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Lihat semua
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
            <Link
              href="/admin/master"
              className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground hover:underline"
            >
              <Database className="size-3.5" aria-hidden="true" />
              Master data
            </Link>
          </div>
        </div>

        {bookings.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">
            Belum ada booking masuk.
          </p>
        ) : (
          <>
            <div className="divide-y divide-border md:hidden">
              {bookings.map((booking) => {
                const customer = one(booking.customer);
                return (
                  <div key={booking.id} className="px-4 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-mono text-sm font-semibold">
                        {booking.kode_booking}
                      </p>
                      <StatusBadge status={booking.status} />
                    </div>
                    <p className="mt-2 text-sm font-medium">
                      {customer?.nama ?? "-"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {customer?.no_wa ?? "-"}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatTanggal(booking.tgl_booking, true)}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-medium">Kode</th>
                    <th className="px-5 py-3 font-medium">Pelanggan</th>
                    <th className="px-5 py-3 font-medium">Tanggal</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {bookings.map((booking) => {
                    const customer = one(booking.customer);
                    return (
                      <tr key={booking.id}>
                        <td className="px-5 py-3 font-mono font-semibold">
                          {booking.kode_booking}
                        </td>
                        <td className="px-5 py-3">
                          <p className="font-medium">{customer?.nama ?? "-"}</p>
                          <p className="text-xs text-muted-foreground">
                            {customer?.no_wa ?? "-"}
                          </p>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {formatTanggal(booking.tgl_booking, true)}
                        </td>
                        <td className="px-5 py-3">
                          <StatusBadge status={booking.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
