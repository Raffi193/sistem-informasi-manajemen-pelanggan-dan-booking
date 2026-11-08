"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { CustomerStatusBadge } from "@/components/customer-status-badge";
import { DeleteCustomerButton } from "@/components/delete-customer-button";
import { DeleteSelectedCustomersButton } from "@/components/delete-selected-customers-button";
import { FollowUpTypeBadge } from "@/components/follow-up-type-badge";
import { waLink } from "@/lib/crm";
import { formatTanggal } from "@/lib/date";
import { cn } from "@/lib/utils";

export type FollowUpLite = {
  id: string;
  jenis: string | null;
  catatan: string | null;
  tgl: string;
};

export type CustomerListItem = {
  id: string;
  nama: string;
  no_wa: string;
  alamat: string | null;
  status: string;
  created_at: string;
  lastFollowUp: FollowUpLite | null;
  followUpCount: number;
  stale: boolean;
  umur: number | null;
};

export function CustomerList({
  customers,
  totalCount,
  returnTo,
}: {
  customers: CustomerListItem[];
  totalCount: number;
  returnTo: string;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const selectAllRef = useRef<HTMLInputElement>(null);

  const selectedCustomers = customers.filter((customer) =>
    selectedIds.has(customer.id),
  );
  const selectedCount = selectedCustomers.length;
  const allSelected =
    customers.length > 0 && selectedCount === customers.length;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate =
        selectedCount > 0 && !allSelected;
    }
  }, [allSelected, selectedCount]);

  function toggleAll(checked: boolean) {
    setSelectedIds(
      checked ? new Set(customers.map((customer) => customer.id)) : new Set(),
    );
  }

  function toggleOne(customerId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (next.has(customerId)) {
        next.delete(customerId);
      } else {
        next.add(customerId);
      }

      return next;
    });
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-4">
        <h2 className="font-display font-bold">Daftar customer</h2>
        <p className="text-sm text-muted-foreground">
          {customers.length} dari {totalCount} customer
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-secondary/20 px-5 py-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input
            ref={selectAllRef}
            type="checkbox"
            checked={allSelected}
            onChange={(event) => toggleAll(event.target.checked)}
            className="size-4 accent-primary"
          />
          Pilih semua
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <span
            aria-live="polite"
            className="text-xs text-muted-foreground"
          >
            {selectedCount} dipilih
          </span>
          {selectedCount > 0 && (
            <>
              <DeleteSelectedCustomersButton
                customerIds={selectedCustomers.map((customer) => customer.id)}
                returnTo={returnTo}
              />
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                Bersihkan
              </button>
            </>
          )}
        </div>
      </div>

      <div className="hidden overflow-x-auto xl:block">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="w-12 px-4 py-3">
                <span className="sr-only">Pilih</span>
              </th>
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Kontak</th>
              <th className="px-5 py-3 font-medium">Umur</th>
              <th className="px-5 py-3 font-medium">Terdaftar</th>
              <th className="px-5 py-3 font-medium">Follow-up</th>
              <th className="px-5 py-3 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {customers.map((customer) => {
              const selected = selectedIds.has(customer.id);

              return (
                <tr
                  key={customer.id}
                  className={cn("align-top", selected && "bg-primary/5")}
                >
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleOne(customer.id)}
                      aria-label={`Pilih ${customer.nama}`}
                      className="size-4 accent-primary"
                    />
                  </td>
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
                    {customer.umur !== null
                      ? `${customer.umur} tahun`
                      : "-"}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">
                    {formatTanggal(customer.created_at)}
                  </td>
                  <td className="px-5 py-4">
                    <FollowUpCell customer={customer} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/customer/${customer.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        Detail
                      </Link>
                      <DeleteCustomerButton
                        customerId={customer.id}
                        customerName={customer.nama}
                        returnTo={returnTo}
                        variant="icon"
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-border xl:hidden">
        {customers.map((customer) => {
          const selected = selectedIds.has(customer.id);

          return (
            <div
              key={customer.id}
              className={cn("p-4", selected && "bg-primary/5")}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => toggleOne(customer.id)}
                  aria-label={`Pilih ${customer.nama}`}
                  className="mt-1 size-4 shrink-0 accent-primary"
                />
                <div className="min-w-0 flex-1">
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
                    {" · "}
                    Umur{" "}
                    {customer.umur !== null
                      ? `${customer.umur} tahun`
                      : "belum diisi"}
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
                    <DeleteCustomerButton
                      customerId={customer.id}
                      customerName={customer.nama}
                      returnTo={returnTo}
                      variant="compact"
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function FollowUpCell({ customer }: { customer: CustomerListItem }) {
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
