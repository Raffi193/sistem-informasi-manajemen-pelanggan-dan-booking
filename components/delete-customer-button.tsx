"use client";

import { useActionState } from "react";
import { Trash2, TriangleAlert } from "lucide-react";

import { deleteCustomerAction } from "@/app/admin/customer/actions";
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

const triggerBase =
  "inline-flex items-center justify-center gap-2 border border-destructive/40 font-medium text-destructive transition-colors hover:bg-destructive/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/30";

const triggerClass = {
  full: `${triggerBase} rounded-full px-5 py-2.5 text-sm`,
  compact: `${triggerBase} rounded-full px-4 py-2 text-sm`,
  icon: `${triggerBase} size-8 rounded-full`,
};

const confirmClass =
  "inline-flex items-center justify-center gap-2 rounded-full bg-destructive px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/30 disabled:cursor-not-allowed disabled:opacity-60";

export function DeleteCustomerButton({
  customerId,
  customerName,
  returnTo = "/admin/customer",
  variant = "full",
}: {
  customerId: string;
  customerName: string;
  returnTo?: string;
  variant?: keyof typeof triggerClass;
}) {
  const [state, formAction, pending] = useActionState(
    deleteCustomerAction,
    initialActionState,
  );
  const isIcon = variant === "icon";

  return (
    <AlertDialog>
      <AlertDialogTrigger
        type="button"
        className={triggerClass[variant]}
        aria-label={isIcon ? "Hapus customer" : undefined}
        title={isIcon ? "Hapus customer" : undefined}
      >
        <Trash2 className="size-4" aria-hidden="true" />
        {!isIcon && (variant === "compact" ? "Hapus" : "Hapus customer")}
      </AlertDialogTrigger>

      <AlertDialogContent>
        <form action={formAction} className="space-y-4" noValidate>
          <AlertDialogHeader>
            <AlertDialogMedia className="rounded-full bg-destructive/10 text-destructive">
              <TriangleAlert aria-hidden="true" />
            </AlertDialogMedia>
            <AlertDialogTitle>Hapus customer?</AlertDialogTitle>
            <AlertDialogDescription>
              Customer {customerName} beserta seluruh booking, pembayaran, dan
              follow-up akan dihapus permanen. Kuota jadwal yang terpakai akan
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

          <input type="hidden" name="customer_id" value={customerId} />
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
              {pending ? "Menghapus…" : "Ya, hapus customer"}
            </button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
