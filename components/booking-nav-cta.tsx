"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * CTA Booking di navbar. Disembunyikan saat pengguna sudah berada di
 * halaman booking, atau tepat setelah tombol diklik.
 */
export function BookingNavCta() {
  const pathname = usePathname();
  const [navigating, setNavigating] = useState(false);

  if (navigating || pathname.startsWith("/booking")) return null;

  return (
    <Link
      href="/booking"
      onNavigate={() => setNavigating(true)}
      className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
    >
      Booking
    </Link>
  );
}
