"use client";

import { useActionState } from "react";
import { updateCustomerAction } from "@/app/admin/customer/actions";
import { Spinner } from "@/components/spinner";
import { initialActionState } from "@/lib/action-state";
import {
  CUSTOMER_STATUSES,
  type CustomerStatusValue,
} from "@/lib/crm";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-input bg-white px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30";

export function CustomerForm({
  customer,
}: {
  customer: {
    id: string;
    nama: string;
    no_wa: string;
    alamat: string | null;
    status: CustomerStatusValue;
  };
}) {
  const [state, formAction, pending] = useActionState(
    updateCustomerAction,
    initialActionState,
  );
  const fieldErrors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.status === "success" && (
        <p
          role="status"
          className="rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800"
        >
          {state.message}
        </p>
      )}

      {state.status === "error" && state.message && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {state.message}
        </p>
      )}

      <label htmlFor="customer-nama" className="block">
        <span className="text-sm font-medium text-foreground">Nama lengkap</span>
        <input
          id="customer-nama"
          name="nama"
          type="text"
          autoComplete="name"
          defaultValue={customer.nama}
          aria-invalid={fieldErrors.nama ? true : undefined}
          aria-describedby={fieldErrors.nama ? "customer-nama-error" : undefined}
          className={inputClass}
        />
        {fieldErrors.nama && (
          <p id="customer-nama-error" className="mt-1.5 text-sm text-destructive">
            {fieldErrors.nama}
          </p>
        )}
      </label>

      <label htmlFor="customer-no-wa" className="block">
        <span className="text-sm font-medium text-foreground">
          Nomor WhatsApp
        </span>
        <input
          id="customer-no-wa"
          name="no_wa"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          defaultValue={customer.no_wa}
          aria-invalid={fieldErrors.no_wa ? true : undefined}
          aria-describedby={
            fieldErrors.no_wa ? "customer-no-wa-error" : "customer-no-wa-hint"
          }
          className={inputClass}
        />
        {fieldErrors.no_wa ? (
          <p
            id="customer-no-wa-error"
            className="mt-1.5 text-sm text-destructive"
          >
            {fieldErrors.no_wa}
          </p>
        ) : (
          <span
            id="customer-no-wa-hint"
            className="mt-1 block text-xs text-muted-foreground"
          >
            Nomor ini menjadi identitas unik customer. Format 08… atau +62…
            diterima.
          </span>
        )}
      </label>

      <label htmlFor="customer-alamat" className="block">
        <span className="text-sm font-medium text-foreground">
          Alamat <span className="font-normal text-muted-foreground">(opsional)</span>
        </span>
        <textarea
          id="customer-alamat"
          name="alamat"
          rows={3}
          defaultValue={customer.alamat ?? ""}
          aria-invalid={fieldErrors.alamat ? true : undefined}
          className={inputClass}
        />
        {fieldErrors.alamat && (
          <p className="mt-1.5 text-sm text-destructive">{fieldErrors.alamat}</p>
        )}
      </label>

      <div>
        <span className="text-sm font-medium text-foreground">Status customer</span>
        <div className="mt-1.5">
          <select
            id="customer-status"
            name="status"
            defaultValue={customer.status}
            aria-invalid={fieldErrors.status ? true : undefined}
            className="min-w-40 rounded-xl border border-input bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
          >
            {CUSTOMER_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
        {fieldErrors.status && (
          <p className="mt-1.5 text-sm text-destructive">{fieldErrors.status}</p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          Status ini dipakai untuk filter CRM dan laporan customer.
        </p>
      </div>

      <input type="hidden" name="id" value={customer.id} />

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending && <Spinner className="size-4" />}
        {pending ? "Menyimpan…" : "Simpan perubahan"}
      </button>
    </form>
  );
}
