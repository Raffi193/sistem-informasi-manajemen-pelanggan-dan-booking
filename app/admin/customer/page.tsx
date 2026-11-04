import Link from "next/link";
import { connection } from "next/server";
import { AdminPageHeader } from "@/components/admin-page-header";
import { CustomerStatusBadge } from "@/components/customer-status-badge";
import { FollowUpTypeBadge } from "@/components/follow-up-type-badge";
import {
  CUSTOMER_STATUSES,
  isCustomerStatus,
  isFollowUpStale,
  normalizeWa,
  waLink,
} from "@/lib/crm";
import {
  dateInJakarta,
  formatTanggal,
  isValidDateInput,
  todayInJakarta,
} from "@/lib/date";
import { many } from "@/lib/embed";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const instant = false;

const fieldBaseClass =
  "mt-1.5 w-full min-w-0 rounded-xl border border-input bg-white py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30";
const fieldClass = `${fieldBaseClass} px-3`;
const searchFieldClass = `${fieldBaseClass} px-3.5`;

type FollowUpLite = {
  id: string;
  jenis: string | null;
  catatan: string | null;
  tgl: string;
};

type CustomerRow = {
  id: string;
  nama: string;
  no_wa: string;
  alamat: string | null;
  status: string;
  created_at: string;
  follow_up: FollowUpLite[] | FollowUpLite | null;
};

type EnrichedCustomer = CustomerRow & {
  followUps: FollowUpLite[];
  lastFollowUp: FollowUpLite | null;
  followUpCount: number;
  stale: boolean;
};

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
      "id,nama,no_wa,alamat,status,created_at,follow_up(id,jenis,catatan,tgl)",
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
      followUps,
      lastFollowUp,
      followUpCount: followUps.length,
      stale: isFollowUpStale(lastFollowUp?.tgl ?? null, today),
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

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Customer & follow-up"
        description="Cari customer, perbarui data, dan catat riwayat komunikasi."
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

      {!error && (
        <section className="overflow-hidden rounded-2xl border border-border bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-4">
            <h2 className="font-display font-bold">Daftar customer</h2>
            <p className="text-sm text-muted-foreground">
              {filtered.length} dari {customers.length} customer
            </p>
          </div>

          {filtered.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="font-display font-bold">Tidak ada customer</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {activeFilters
                  ? "Coba ubah filter atau kata pencarian."
                  : "Customer akan muncul otomatis setelah booking pertama."}
              </p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto xl:block">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3 font-medium">Customer</th>
                      <th className="px-5 py-3 font-medium">Kontak</th>
                      <th className="px-5 py-3 font-medium">Terdaftar</th>
                      <th className="px-5 py-3 font-medium">Follow-up</th>
                      <th className="px-5 py-3 font-medium">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((customer) => (
                      <tr key={customer.id} className="align-top">
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              href={`/admin/customer/${customer.id}`}
                              className="font-medium text-foreground hover:text-primary hover:underline"
                            >
                              {customer.nama}
                            </Link>
                            <CustomerStatusBadge status={customer.status} />
                          </div>
                          <p
                            className="mt-1 max-w-[280px] truncate text-xs text-muted-foreground"
                            title={customer.alamat ?? undefined}
                          >
                            {customer.alamat || "Alamat belum diisi"}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <a
                            href={waLink(
                              customer.no_wa,
                              `Halo ${customer.nama}, kami dari LPK CV. Fathan.`,
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-primary hover:underline"
                          >
                            {customer.no_wa}
                          </a>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">
                          {formatTanggal(customer.created_at)}
                        </td>
                        <td className="px-5 py-4">
                          <FollowUpCell customer={customer} />
                        </td>
                        <td className="px-5 py-4">
                          <Link
                            href={`/admin/customer/${customer.id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            Detail
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-border xl:hidden">
                {filtered.map((customer) => (
                  <div key={customer.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={`/admin/customer/${customer.id}`}
                          className="font-display font-bold text-foreground"
                        >
                          {customer.nama}
                        </Link>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {customer.no_wa}
                        </p>
                      </div>
                      <CustomerStatusBadge status={customer.status} />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Terdaftar {formatTanggal(customer.created_at)}
                    </p>
                    <div className="mt-3">
                      <FollowUpCell customer={customer} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link
                        href={`/admin/customer/${customer.id}`}
                        className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                      >
                        Detail
                      </Link>
                      <a
                        href={waLink(
                          customer.no_wa,
                          `Halo ${customer.nama}, kami dari LPK CV. Fathan.`,
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground"
                      >
                        Chat WA
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}

function FollowUpCell({ customer }: { customer: EnrichedCustomer }) {
  if (!customer.lastFollowUp) {
    return (
      <div>
        <p className="text-xs font-medium text-amber-700">Belum ada follow-up</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Catat komunikasi pertama dari halaman detail.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "text-xs font-medium",
            customer.stale ? "text-amber-700" : "text-muted-foreground",
          )}
        >
          {formatTanggal(customer.lastFollowUp.tgl)}
        </span>
        <FollowUpTypeBadge jenis={customer.lastFollowUp.jenis} />
        {customer.stale && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
            Perlu follow-up
          </span>
        )}
      </div>
      <p
        className="mt-1 line-clamp-1 text-xs text-muted-foreground"
        title={customer.lastFollowUp.catatan ?? undefined}
      >
        {customer.followUpCount} catatan
        {customer.lastFollowUp.catatan
          ? ` · ${customer.lastFollowUp.catatan}`
          : ""}
      </p>
    </div>
  );
}
