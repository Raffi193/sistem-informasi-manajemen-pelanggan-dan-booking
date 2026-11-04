import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Booking Jadwal Kursus — LPK CV. Fathan",
  description:
    "Pilih paket dan jadwal kursus mengemudi, isi biodata, lalu booking langsung dari website.",
};

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
