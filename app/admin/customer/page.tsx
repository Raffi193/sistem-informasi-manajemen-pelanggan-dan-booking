import Link from "next/link";
import { connection } from "next/server";
import { AdminPageHeader } from "@/components/admin-page-header";
import {
  CustomerList,
  type CustomerListItem,
  type FollowUpLite,
} from "@/components/customer-list";
import {
  CUSTOMER_STATUSES,
  isCustomerStatus,
  isFollowUpStale,
  normalizeWa,
} from "@/lib/crm";
import {
  calculateAge,
  dateInJakarta,
  isValidDateInput,
  todayInJakarta,
} from "@/lib/date";
import { many } from "@/lib/embed";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

const fieldBaseClass =
  "mt-1.5 w-full min-w-0 rounded-xl border border-input bg-white py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30";
const fieldClass = `${fieldBaseClass} px-3`;
const searchFieldClass = `${fieldBaseClass} px-3.5`;

type CustomerRow = {
  id: string;
  nama: string;
  no_wa: string;
  alamat: string | null;
  tanggal_lahir: string | null;
  status: string;
  created_at: string;
  follow_up: FollowUpLite[] | FollowUpLite | null;
};

type EnrichedCustomer = CustomerListItem;

export default async function CustomerPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    dari?: string;
    sampai?: string;
    followup?: string;
  }>;
}) {
  await connection();

  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const status = isCustomerStatus(params.status ?? "")
    ? (params.status ?? "")
    : "";
  const dari = isValidDateInput(params.dari) ? params.dari : "";
  const sampai = isValidDateInput(params.sampai) ? params.sampai : "";
  const followup =
    params.followup === "belum" || params.followup === "lama"
      ? params.followup
      : "";

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customer")
    .select(
      "id,nama,no_wa,alamat,tanggal_lahir,status,created_at,follow_up(id,jenis,catatan,tgl)",
    )
    .order("created_at", { ascending: false });

  const today = todayInJakarta();
  const customers: EnrichedCustomer[] = (
    (data ?? []) as unknown as CustomerRow[]
  ).map((customer) => {
    const followUps = many(customer.follow_up).sort((a, b) =>
      a.tgl === b.tgl ? a.id.localeCompare(b.id) : a.tgl < b.tgl ? 1 : -1,
    );
    const lastFollowUp = followUps[0] ?? null;

    return {
      ...customer,
      lastFollowUp,
      followUpCount: followUps.length,
      stale: isFollowUpStale(lastFollowUp?.tgl ?? null, today),
      umur: calculateAge(customer.tanggal_lahir, today),
    };
  });

  const needle = q.toLowerCase();
  const waNeedle = normalizeWa(q);
  const invalidRange = Boolean(dari && sampai && dari > sampai);
  const filtered = customers.filter((customer) => {
    if (status && customer.status !== status) return false;

    if (dari || sampai) {
      const createdDate = dateInJakarta(customer.created_at);
      if (dari && createdDate < dari) return false;
      if (sampai && createdDate > sampai) return false;
    }

    if (followup === "belum" && customer.followUpCount > 0) return false;
    if (
      followup === "lama" &&
      (!customer.lastFollowUp || !customer.stale)
    ) {
      return false;
    }

    if (!needle) return true;

    const matchesText = [customer.nama, customer.no_wa, customer.alamat].some(
      (value) => value?.toLowerCase().includes(needle),
    );

    return (
      matchesText ||
      (waNeedle.length >= 4 && customer.no_wa.includes(waNeedle))
    );
  });

  const activeFilters = Boolean(q || status || dari || sampai || followup);
  const returnParams = new URLSearchParams();
  if (q) returnParams.set("q", q);
  if (status) returnParams.set("status", status);
  if (dari) returnParams.set("dari", dari);
  if (sampai) returnParams.set("sampai", sampai);
  if (followup) returnParams.set("followup", followup);
  const returnQuery = returnParams.toString();
  const returnTo = returnQuery
    ? `/admin/customer?${returnQuery}`
    : "/admin/customer";

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Customer & follow-up"
        description="Cari customer, lihat data dari booking, dan catat riwayat komunikasi."
        action={
          <Link
            href="/admin/laporan"
            className="rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Lihat laporan →
          </Link>
        }
      />

      <form
        method="get"
        action="/admin/customer"
        className="min-w-0 rounded-2xl border border-border bg-white p-4"
      >
        <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-12">
          <label className="block min-w-0 xl:col-span-4">
            <span className="text-xs font-medium text-muted-foreground">
              Cari customer
            </span>
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Nama / WhatsApp"
              className={searchFieldClass}
            />
          </label>

          <label className="block min-w-0 xl:col-span-2">
            <span className="text-xs font-medium text-muted-foreground">
              Status
            </span>
            <select
              name="status"
              defaultValue={status}
              className={fieldClass}
            >
              <option value="">Semua status</option>
              {CUSTOMER_STATUSES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block min-w-0 xl:col-span-2">
            <span className="text-xs font-medium text-muted-foreground">
              Terdaftar dari
            </span>
            <input
              type="date"
              name="dari"
              defaultValue={dari}
              className={fieldClass}
            />
          </label>

          <label className="block min-w-0 xl:col-span-2">
            <span className="text-xs font-medium text-muted-foreground">
              Sampai
            </span>
            <input
              type="date"
              name="sampai"
              defaultValue={sampai}
              className={fieldClass}
            />
          </label>

          <label className="block min-w-0 xl:col-span-2">
            <span className="text-xs font-medium text-muted-foreground">
              Follow-up
            </span>
            <select
              name="followup"
              defaultValue={followup}
              className={fieldClass}
            >
              <option value="">Semua</option>
              <option value="belum">Belum pernah</option>
              <option value="lama">Lebih dari 7 hari</option>
            </select>
          </label>

          <div className="flex min-w-0 items-end gap-2 md:col-span-2 xl:col-span-12 xl:justify-end">
            <button
              type="submit"
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Terapkan
            </button>
            {activeFilters && (
              <Link
                href="/admin/customer"
                className="rounded-full border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                Reset
              </Link>
            )}
          </div>
        </div>
      </form>

      {invalidRange && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          Tanggal “dari” tidak boleh lebih besar dari tanggal “sampai”.
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          Gagal memuat data customer. Coba muat ulang halaman.
        </p>
      )}

      {!error && filtered.length === 0 && (
        <section className="overflow-hidden rounded-2xl border border-border bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-4">
            <h2 className="font-display font-bold">Daftar customer</h2>
            <p className="text-sm text-muted-foreground">
              {filtered.length} dari {customers.length} customer
            </p>
          </div>
          <div className="px-5 py-12 text-center">
            <p className="font-display font-bold">Tidak ada customer</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {activeFilters
                ? "Coba ubah filter atau kata pencarian."
                : "Customer akan muncul otomatis setelah booking pertama."}
            </p>
          </div>
        </section>
      )}

      {!error && filtered.length > 0 && (
        <CustomerList
          customers={filtered}
          totalCount={customers.length}
          returnTo={returnTo}
        />
      )}
    </div>
  );
}
