"use client";

import { useActionState, useEffect, useState } from "react";
import { Trash2, TriangleAlert } from "lucide-react";

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
import { initialActionState, type ActionState } from "@/lib/action-state";
import { cn } from "@/lib/utils";

type DeleteAction = (
  state: ActionState,
  formData: FormData,
) => Promise<ActionState>;

const triggerClass =
  "inline-flex size-8 items-center justify-center rounded-full border border-border bg-white text-muted-foreground transition-colors hover:bg-destructive/5 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/30";

const confirmClass =
  "inline-flex items-center justify-center gap-2 rounded-full bg-destructive px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/30 disabled:cursor-not-allowed disabled:opacity-60";

export function DeleteMasterDataButton({
  id,
  entityLabel,
  description,
  action,
  triggerClassName,
}: {
  id: string;
  entityLabel: string;
  description: string;
  action: DeleteAction;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        type="button"
        aria-label={`Hapus ${entityLabel}`}
        title={`Hapus ${entityLabel}`}
        className={cn(triggerClass, triggerClassName)}
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </AlertDialogTrigger>

      {open && (
        <DeleteDialogContent
          id={id}
          entityLabel={entityLabel}
          description={description}
          action={action}
          onSuccess={() => setOpen(false)}
        />
      )}
    </AlertDialog>
  );
}

function DeleteDialogContent({
  id,
  entityLabel,
  description,
  action,
  onSuccess,
}: {
  id: string;
  entityLabel: string;
  description: string;
  action: DeleteAction;
  onSuccess: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    action,
    initialActionState,
  );

  useEffect(() => {
    if (state.status === "success") onSuccess();
  }, [onSuccess, state.status]);

  return (
    <AlertDialogContent>
      <form action={formAction} className="space-y-4" noValidate>
        <AlertDialogHeader>
          <AlertDialogMedia className="rounded-full bg-destructive/10 text-destructive">
            <TriangleAlert aria-hidden="true" />
          </AlertDialogMedia>
          <AlertDialogTitle>Hapus {entityLabel}?</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {state.status === "error" && state.message && (
          <p
            role="alert"
            className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          >
            {state.message}
          </p>
        )}

        <input type="hidden" name="id" value={id} />

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
            {pending ? "Menghapus…" : "Hapus"}
          </button>
        </AlertDialogFooter>
      </form>
    </AlertDialogContent>
  );
}
