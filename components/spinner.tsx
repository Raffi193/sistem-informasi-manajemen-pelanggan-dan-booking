import { cn } from "@/lib/utils";

/**
 * Indikator loading ringan. Ukuran mengikuti className agar bisa dipakai
 * inline di tombol maupun sebagai status halaman.
 */
export function Spinner({
  className,
  label,
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center", className)}
      role={label ? "status" : undefined}
      aria-hidden={label ? undefined : true}
    >
      <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
      {label && <span className="sr-only">{label}</span>}
    </span>
  );
}
