"use client";

import { useActionState } from "react";
import { Save, X } from "lucide-react";
import { Spinner } from "@/components/spinner";
import { initialActionState } from "@/lib/action-state";
import { CUSTOMER_STATUSES } from "@/lib/crm";
import type { ActionState } from "@/lib/action-state";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-input bg-white px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30";

export type CustomerFormCustomer = {
  id: string;
  nama: string;
  no_wa: string;
  alamat: string | null;
  tanggal_lahir: string | null;
  status: string;
};

export function CustomerForm({
  mode,
  customer,
  action,
  cancelHref = "/admin/customer",
}: {
  mode: "create" | "edit";
  customer?: CustomerFormCustomer;
  action: (
    previousState: ActionState,
    formData: FormData,
  ) => Promise<ActionState>;
  cancelHref?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const fieldErrors = state.fieldErrors ?? {};
  const isEdit = mode === "edit";

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {state.status === "error" && state.message && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {state.message}
        </p>
      )}

      {customer?.id && (
        <input type="hidden" name="customer_id" value={customer.id} />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label htmlFor="customer-nama" className="block sm:col-span-2">
          <span className="text-sm font-medium text-foreground">Nama</span>
          <input
            id="customer-nama"
            name="nama"
            type="text"
            defaultValue={customer?.nama ?? ""}
            maxLength={120}
            aria-invalid={fieldErrors.nama ? true : undefined}
            className={inputClass}
          />
          {fieldErrors.nama && (
            <p className="mt-1.5 text-sm text-destructive">{fieldErrors.nama}</p>
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
            defaultValue={customer?.no_wa ?? ""}
            placeholder="08xxxxxxxxxx"
            aria-invalid={fieldErrors.no_wa ? true : undefined}
            className={inputClass}
          />
          {fieldErrors.no_wa ? (
            <p className="mt-1.5 text-sm text-destructive">
              {fieldErrors.no_wa}
            </p>
          ) : (
            <span className="mt-1 block text-xs text-muted-foreground">
              Format 08xxxxxxxxxx. Nomor duplikat tidak diizinkan.
            </span>
          )}
        </label>

        <label htmlFor="customer-status" className="block">
          <span className="text-sm font-medium text-foreground">
            Status CRM
          </span>
          <select
            id="customer-status"
            name="status"
            defaultValue={customer?.status ?? "calon"}
            aria-invalid={fieldErrors.status ? true : undefined}
            className={inputClass}
          >
            {CUSTOMER_STATUSES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          {fieldErrors.status && (
            <p className="mt-1.5 text-sm text-destructive">
              {fieldErrors.status}
            </p>
          )}
        </label>

        <label htmlFor="customer-tanggal-lahir" className="block">
          <span className="text-sm font-medium text-foreground">
            Tanggal lahir
          </span>
          <input
            id="customer-tanggal-lahir"
            name="tanggal_lahir"
            type="date"
            defaultValue={customer?.tanggal_lahir ?? ""}
            aria-invalid={fieldErrors.tanggal_lahir ? true : undefined}
            className={inputClass}
          />
          {fieldErrors.tanggal_lahir && (
            <p className="mt-1.5 text-sm text-destructive">
              {fieldErrors.tanggal_lahir}
            </p>
          )}
        </label>

        <label htmlFor="customer-alamat" className="block sm:col-span-2">
          <span className="text-sm font-medium text-foreground">Alamat</span>
          <textarea
            id="customer-alamat"
            name="alamat"
            defaultValue={customer?.alamat ?? ""}
            rows={4}
            maxLength={500}
            aria-invalid={fieldErrors.alamat ? true : undefined}
            className={inputClass}
          />
          {fieldErrors.alamat ? (
            <p className="mt-1.5 text-sm text-destructive">
              {fieldErrors.alamat}
            </p>
          ) : (
            <span className="mt-1 block text-xs text-muted-foreground">
              Maksimal 500 karakter.
            </span>
          )}
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? (
            <Spinner className="size-4" />
          ) : (
            <Save className="size-4" aria-hidden="true" />
          )}
          {pending
            ? "Menyimpan…"
            : isEdit
              ? "Simpan perubahan"
              : "Tambah customer"}
        </button>
        <a
          href={cancelHref}
          className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
        >
          <X className="size-4" aria-hidden="true" />
          Batal
        </a>
      </div>
    </form>
  );
}