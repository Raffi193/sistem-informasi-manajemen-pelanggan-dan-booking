import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cek Status Booking — LPK CV. Fathan",
  description:
    "Pantau status booking kursus mengemudi Anda menggunakan kode booking dan nomor WhatsApp.",
};

export default function StatusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
