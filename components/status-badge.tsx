import { cn } from "@/lib/utils";

export type StatusValue =
  | "tersedia"
  | "penuh"
  | "ditutup"
  | "menunggu_pembayaran"
  | "menunggu_verifikasi"
  | "disetujui"
  | "ditolak"
  | "selesai"
  | "batal";

/** Urutan status booking yang dipakai dashboard dan laporan. */
export const BOOKING_STATUSES = [
  "menunggu_pembayaran",
  "menunggu_verifikasi",
  "disetujui",
  "ditolak",
  "selesai",
  "batal",
] as const satisfies readonly StatusValue[];

const styles: Record<StatusValue, string> = {
  tersedia:
    "bg-green-100 text-green-700 ring-green-600/20 dark:bg-green-950/40 dark:text-green-300 dark:ring-green-500/30",
  penuh:
    "bg-red-100 text-red-700 ring-red-600/20 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-500/30",
  ditutup:
    "bg-slate-100 text-slate-500 ring-slate-500/20 dark:bg-slate-800/60 dark:text-slate-300 dark:ring-slate-500/30",
  menunggu_pembayaran:
    "bg-amber-100 text-amber-700 ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-500/30",
  menunggu_verifikasi:
    "bg-blue-100 text-blue-700 ring-blue-600/20 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-500/30",
  disetujui:
    "bg-green-100 text-green-700 ring-green-600/20 dark:bg-green-950/40 dark:text-green-300 dark:ring-green-500/30",
  ditolak:
    "bg-red-100 text-red-700 ring-red-600/20 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-500/30",
  selesai:
    "bg-blue-100 text-blue-800 ring-blue-600/20 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-500/30",
  batal:
    "bg-slate-100 text-slate-500 ring-slate-500/20 dark:bg-slate-800/60 dark:text-slate-300 dark:ring-slate-500/30",
};

const labels: Record<StatusValue, string> = {
  tersedia: "Tersedia",
  penuh: "Penuh",
  ditutup: "Ditutup",
  menunggu_pembayaran: "Menunggu Pembayaran",
  menunggu_verifikasi: "Menunggu Verifikasi",
  disetujui: "Disetujui",
  ditolak: "Ditolak",
  selesai: "Selesai",
  batal: "Batal",
};

/**
 * Badge status — satu sumber kebenaran pemetaan status -> warna (konsisten).
 */
export function StatusBadge({
  status,
  className,
}: {
  status: StatusValue;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        styles[status],
        className,
      )}
    >
      {labels[status] ?? status}
    </span>
  );
}
