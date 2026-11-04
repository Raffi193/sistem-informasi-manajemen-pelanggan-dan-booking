"use client";

import { useRef, type ReactNode } from "react";
import { TriangleAlert } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/**
 * Tombol submit yang meminta konfirmasi sebelum menjalankan server action.
 * Dipakai untuk aksi yang sulit dibatalkan (mis. menolak booking).
 */
export function ConfirmSubmit({
  title = "Konfirmasi tindakan",
  message,
  confirmLabel = "Ya, lanjutkan",
  cancelLabel = "Batal",
  className,
  children,
}: {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  className?: string;
  children: ReactNode;
}) {
  const formRef = useRef<HTMLFormElement | null>(null);

  return (
    <AlertDialog>
      <AlertDialogTrigger
        type="button"
        className={className}
        onClick={(event) => {
          formRef.current = event.currentTarget.form;
        }}
      >
        {children}
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="rounded-full bg-destructive/10 text-destructive">
            <TriangleAlert aria-hidden="true" />
          </AlertDialogMedia>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            className="bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/30"
            onClick={() => formRef.current?.requestSubmit()}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
