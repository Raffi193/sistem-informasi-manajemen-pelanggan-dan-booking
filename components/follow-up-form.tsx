"use client";

import { useActionState, useEffect, useRef } from "react";
import { createFollowUpAction } from "@/app/admin/customer/actions";
import { Spinner } from "@/components/spinner";
import { initialActionState } from "@/lib/action-state";
import { FOLLOW_UP_TYPES } from "@/lib/crm";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-input bg-white px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30";

export function FollowUpForm({
  customerId,
  today,
}: {
  customerId: string;
  today: string;
}) {
  const [state, formAction, pending] = useActionState(
    createFollowUpAction,
    initialActionState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const fieldErrors = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4" noValidate>
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

      <div className="grid gap-4 sm:grid-cols-2">
        <label htmlFor="follow-up-jenis" className="block">
          <span className="text-sm font-medium text-foreground">
            Jenis follow-up
          </span>
          <select
            id="follow-up-jenis"
            name="jenis"
            defaultValue="whatsapp"
            aria-invalid={fieldErrors.jenis ? true : undefined}
            className={inputClass}
          >
            {FOLLOW_UP_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {fieldErrors.jenis && (
            <p className="mt-1.5 text-sm text-destructive">{fieldErrors.jenis}</p>
          )}
        </label>

        <label htmlFor="follow-up-tgl" className="block">
          <span className="text-sm font-medium text-foreground">Tanggal</span>
          <input
            id="follow-up-tgl"
            name="tgl"
            type="date"
            defaultValue={today}
            aria-invalid={fieldErrors.tgl ? true : undefined}
            className={inputClass}
          />
          {fieldErrors.tgl && (
            <p className="mt-1.5 text-sm text-destructive">{fieldErrors.tgl}</p>
          )}
        </label>
      </div>

      <label htmlFor="follow-up-catatan" className="block">
        <span className="text-sm font-medium text-foreground">Catatan</span>
        <textarea
          id="follow-up-catatan"
          name="catatan"
          rows={4}
          placeholder="Contoh: Sudah dihubungi, minta jadwal sore minggu depan."
          aria-invalid={fieldErrors.catatan ? true : undefined}
          className={inputClass}
        />
        {fieldErrors.catatan ? (
          <p className="mt-1.5 text-sm text-destructive">
            {fieldErrors.catatan}
          </p>
        ) : (
          <span className="mt-1 block text-xs text-muted-foreground">
            Catatan ini hanya terlihat oleh admin.
          </span>
        )}
      </label>

      <input type="hidden" name="customer_id" value={customerId} />

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending && <Spinner className="size-4" />}
        {pending ? "Menyimpan…" : "Catat follow-up"}
      </button>
    </form>
  );
}
