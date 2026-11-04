import Link from "next/link";
import { connection } from "next/server";
import { AdminPageHeader } from "@/components/admin-page-header";
import { CustomerStatusBadge } from "@/components/customer-status-badge";
import { FollowUpTypeBadge } from "@/components/follow-up-type-badge";
import {
  BOOKING_STATUSES,
  StatusBadge,
  type StatusValue,
} from "@/components/status-badge";
import { countValues } from "@/lib/count";
import {
  CUSTOMER_STATUSES,
  CUSTOMER_STATUS_VALUES,
  FOLLOW_UP_TYPE_VALUES,
  FOLLOW_UP_TYPES,
} from "@/lib/crm";
import {
  addDays,
  endOfDayIso,
  firstDayOfMonth,
  formatTanggal,
  isValidDateInput,
  previousMonthRange,
  startOfDayIso,
  todayInJakarta,
} from "@/lib/date";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const instant = false;

type ReportBooking = {
  status: StatusValue;
  customer_id: string | null;
};

type ReportCustomer = { status: string };
type ReportFollowUp = { jenis: string | null };

export default async function LaporanPage({
  searchParams,
}: {
  searchParams: Promise<{ dari?: string; sampai?: string }>;
}) {
  await connection();

  const params = await searchParams;
  const today = todayInJakarta();
  const defaultDari = firstDayOfMonth(today);
  const dariInput = isValidDateInput(params.dari) ? params.dari : defaultDari;
  const sampaiInput = isValidDateInput(params.sampai) ? params.sampai : today;
  const rangeError = dariInput > sampaiInput;
  const dari = rangeError ? defaultDari : dariInput;
  const sampai = rangeError ? today : sampaiInput;
  const startIso = startOfDayIso(dari);
  const endIso = endOfDayIso(sampai);

  const supabase = await createClient();

  // Tiga query data mentah lebih cepat daripada belasan query count terpisah.
  const [bookingsRes, newCustomersRes, followUpsRes] = await Promise.all([
    supabase
      .from("booking")
      .select("status,customer_id")
      .gte("tgl_booking", startIso)
      .lte("tgl_booking", endIso),
    supabase
      .from("customer")
      .select("status")
      .gte("created_at", startIso)
      .lte("created_at", endIso),
    supabase
      .from("follow_up")
      .select("jenis")
      .gte("tgl", dari)
      .lte("tgl", sampai),
  ]);

  const queryErrors = [
    bookingsRes.error,
    newCustomersRes.error,
    followUpsRes.error,
  ].filter(Boolean);

  const bookingRows = (bookingsRes.data ?? []) as unknown as ReportBooking[];
  const newCustomers = (newCustomersRes.data ?? []) as unknown as ReportCustomer[];
  const followUps = (followUpsRes.data ?? []) as unknown as ReportFollowUp[];
  const followUpTypes = followUps
    .map((row) => row.jenis)
    .filter((jenis): jenis is string => Boolean(jenis));

  const bookingCounts = countValues(
    BOOKING_STATUSES,
    bookingRows.map((row) => row.status),
  );
  const customerStatusCounts = countValues(
    CUSTOMER_STATUS_VALUES,
    newCustomers.map((row) => row.status),
  );
  const followUpCounts = countValues(FOLLOW_UP_TYPE_VALUES, followUpTypes);

  const totalBooking = bookingRows.length;
  const totalNewCustomers = newCustomers.length;
  const totalFollowUp = followUpTypes.length;
  const customersWhoBooked = new Set(
    bookingRows
      .map((row) => row.customer_id)
      .filter((id): id is string => Boolean(id)),
  ).size;

  const previous = previousMonthRange(today);
  const presets = [
    { label: "Bulan ini", dari: defaultDari, sampai: today },
    {
      label: "30 hari terakhir",
      dari: addDays(today, -29),
      sampai: today,
    },
    { label: "Bulan lalu", dari: previous.dari, sampai: previous.sampai },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Laporan"
        description="Ringkasan booking, customer, dan follow-up per periode."
        action={
          <Link
            href="/admin/customer"
            className="rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Customer &amp; follow-up →
          </Link>
        }
      />

      <section className="rounded-2xl border border-border bg-white p-4">
        <form
          method="get"
          action="/admin/laporan"
          className="grid gap-3 sm:flex sm:flex-wrap sm:items-end"
        >
          <label className="block sm:w-auto">
            <span className="text-xs font-medium text-muted-foreground">
              Dari
            </span>
            <input
              type="date"
              name="dari"
              defaultValue={dari}
              className="mt-1.5 block w-full rounded-xl border border-input bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 sm:w-auto"
            />
          </label>
          <label className="block sm:w-auto">
            <span className="text-xs font-medium text-muted-foreground">
              Sampai
            </span>
            <input
              type="date"
              name="sampai"
              defaultValue={sampai}
              className="mt-1.5 block w-full rounded-xl border border-input bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 sm:w-auto"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
          >
            Terapkan
          </button>
        </form>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <span className="text-xs text-muted-foreground">Cepat:</span>
          {presets.map((preset) => {
            const active = preset.dari === dari && preset.sampai === sampai;
            return (
              <Link
                key={preset.label}
                href={`/admin/laporan?dari=${preset.dari}&sampai=${preset.sampai}`}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                {preset.label}
              </Link>
            );
          })}
          <span className="w-full text-xs text-muted-foreground sm:ml-auto sm:w-auto">
            Periode: {formatTanggal(dari)} – {formatTanggal(sampai)}
          </span>
        </div>
      </section>

      {rangeError && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          Rentang tanggal tidak valid. Menampilkan bulan berjalan.
        </p>
      )}

      {queryErrors.length > 0 && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          Sebagian data laporan gagal dimuat. Coba muat ulang halaman.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
        <ReportStat label="Total booking" value={totalBooking} accent />
        <ReportStat label="Disetujui" value={bookingCounts.disetujui} />
        <ReportStat label="Selesai" value={bookingCounts.selesai} />
        <ReportStat label="Customer baru" value={totalNewCustomers} />
        <ReportStat label="Customer yang booking" value={customersWhoBooked} />
        <ReportStat label="Total follow-up" value={totalFollowUp} />
      </div>

      {totalBooking === 0 && totalNewCustomers === 0 && totalFollowUp === 0 && (
        <p className="rounded-2xl border border-dashed border-border bg-white px-5 py-8 text-center text-sm text-muted-foreground">
          Belum ada aktivitas pada periode ini. Coba pilih periode lain.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <ReportTable
          title="Booking per status"
          description={`${totalBooking} booking pada periode ini`}
          total={totalBooking}
        >
          {BOOKING_STATUSES.map((status) => (
            <ReportRow
              key={status}
              label={<StatusBadge status={status} />}
              value={bookingCounts[status]}
              total={totalBooking}
            />
          ))}
        </ReportTable>

        <ReportTable
          title="Customer baru per status"
          description={`${totalNewCustomers} customer terdaftar pada periode ini`}
          total={totalNewCustomers}
        >
          {CUSTOMER_STATUSES.map((status) => (
            <ReportRow
              key={status.value}
              label={<CustomerStatusBadge status={status.value} />}
              value={customerStatusCounts[status.value]}
              total={totalNewCustomers}
            />
          ))}
        </ReportTable>

        <ReportTable
          title="Follow-up per jenis"
          description={`${totalFollowUp} follow-up tercatat pada periode ini`}
          total={totalFollowUp}
          className="lg:col-span-2"
        >
          {FOLLOW_UP_TYPES.map((type) => (
            <ReportRow
              key={type.value}
              label={<FollowUpTypeBadge jenis={type.value} />}
              value={followUpCounts[type.value]}
              total={totalFollowUp}
            />
          ))}
        </ReportTable>
      </div>
    </div>
  );
}

function ReportStat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "card-lift rounded-2xl border p-4 sm:p-5",
        accent
          ? "border-primary/30 bg-primary/5"
          : "border-border bg-white",
      )}
    >
      <p className="text-sm text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-2 font-display text-3xl font-bold",
          accent ? "text-primary" : "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function ReportTable({
  title,
  description,
  total,
  children,
  className,
}: {
  title: string;
  description: string;
  total: number;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-white p-5",
        className,
      )}
    >
      <h2 className="font-display font-bold">{title}</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      <div className="mt-4 space-y-3">
        {total === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            Belum ada data pada periode ini.
          </p>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

function ReportRow({
  label,
  value,
  total,
}: {
  label: React.ReactNode;
  value: number;
  total: number;
}) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>{label}</div>
        <p className="text-sm font-medium text-foreground">
          {value}
          <span className="ml-1.5 text-xs font-normal text-muted-foreground">
            ({percentage}%)
          </span>
        </p>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
