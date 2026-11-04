"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Animasi masuk yang ringan saat pindah halaman. Key berbasis pathname
 * membuat konten di-remount, sementara perubahan search params tidak
 * memicu animasi ulang.
 */
export function PageTransition({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <div key={pathname} className={cn("animate-page-in", className)}>
      {children}
    </div>
  );
}
