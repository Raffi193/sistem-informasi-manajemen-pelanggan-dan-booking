import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import { createPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema } from "@/lib/seo/schema";

export const metadata: Metadata = createPageMetadata({
  title: "Booking Kursus Mengemudi Palembang",
  description:
    "Pilih paket kursus mengemudi manual atau matic di Palembang, tentukan jadwal, isi biodata, dan booking online bersama LPK CV. Fathan.",
  path: "/booking",
});

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Beranda", path: "/" },
          { name: "Booking Kursus", path: "/booking" },
        ])}
      />
      {children}
    </>
  );
}
