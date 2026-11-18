import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Cek Status Booking",
  description:
    "Pantau status booking kursus mengemudi Anda menggunakan kode booking dan nomor WhatsApp yang terdaftar.",
  path: "/status",
  noIndex: true,
});

export default function StatusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
