"use client";

import { useActionState } from "react";
import { Trash2, TriangleAlert } from "lucide-react";

import { deleteCustomersAction } from "@/app/admin/customer/actions";
import { Spinner } from "@/components/spinner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { initialActionState } from "@/lib/action-state";

const confirmClass =
  "inline-flex items-center justify-center gap-2 rounded-full bg-destructive px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/30 disabled:cursor-not-allowed disabled:opacity-60";

export function DeleteSelectedCustomersButton({
  customerIds,
  returnTo,
}: {
  customerIds: string[];
  returnTo: string;
}) {
  const [state, formAction, pending] = useActionState(
    deleteCustomersAction,
    initialActionState,
  );
  const count = customerIds.length;

  return (
    <AlertDialog>
      <AlertDialogTrigger
        type="button"
        disabled={count === 0}
        className="inline-flex items-center gap-2 rounded-full bg-destructive px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/30 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Trash2 className="size-4" aria-hidden="true" />
        Hapus terpilih
      </AlertDialogTrigger>

      <AlertDialogContent>
        <form action={formAction} className="space-y-4" noValidate>
          <AlertDialogHeader>
            <AlertDialogMedia className="rounded-full bg-destructive/10 text-destructive">
              <TriangleAlert aria-hidden="true" />
            </AlertDialogMedia>
            <AlertDialogTitle>
              Hapus {count} customer terpilih?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Seluruh booking, pembayaran, dan follow-up milik customer yang
              dipilih akan dihapus permanen. Kuota jadwal yang terpakai akan
              terbuka kembali. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {state.status === "error" && state.message && (
            <p
              role="alert"
              className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            >
              {state.message}
            </p>
          )}

          {customerIds.map((customerId) => (
            <input
              key={customerId}
              type="hidden"
              name="customer_ids"
              value={customerId}
            />
          ))}
          <input type="hidden" name="return_to" value={returnTo} />

          <AlertDialogFooter className="mx-0 mb-0 mt-2 rounded-none border-t bg-transparent p-0 pt-4">
            <AlertDialogCancel
              type="button"
              disabled={pending}
              className="h-auto rounded-full px-5 py-2.5"
            >
              Batal
            </AlertDialogCancel>
            <button
              type="submit"
              disabled={pending}
              className={confirmClass}
              aria-busy={pending}
            >
              {pending ? (
                <Spinner className="size-4" />
              ) : (
                <Trash2 className="size-4" aria-hidden="true" />
              )}
              {pending ? "Menghapus…" : "Ya, hapus terpilih"}
            </button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
