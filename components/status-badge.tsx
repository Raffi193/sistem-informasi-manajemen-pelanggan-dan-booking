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
  | "batal"
  | "no_show";

/** Urutan status booking yang dipakai dashboard dan laporan. */
export const BOOKING_STATUSES = [
  "menunggu_pembayaran",
  "menunggu_verifikasi",
  "disetujui",
  "ditolak",
  "selesai",
  "batal",
  "no_show",
] as const satisfies readonly StatusValue[];

const styles: Record<StatusValue, string> = {
  tersedia: "bg-green-100 text-green-700 ring-green-600/20",
  penuh: "bg-red-100 text-red-700 ring-red-600/20",
  ditutup: "bg-slate-100 text-slate-500 ring-slate-500/20",
  menunggu_pembayaran: "bg-amber-100 text-amber-700 ring-amber-600/20",
  menunggu_verifikasi: "bg-blue-100 text-blue-700 ring-blue-600/20",
  disetujui: "bg-green-100 text-green-700 ring-green-600/20",
  ditolak: "bg-red-100 text-red-700 ring-red-600/20",
  selesai: "bg-blue-100 text-blue-800 ring-blue-600/20",
  batal: "bg-slate-100 text-slate-500 ring-slate-500/20",
  no_show: "bg-red-100 text-red-700 ring-red-600/20",
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
  no_show: "Tidak Hadir",
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
