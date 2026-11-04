import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Masuk Admin — LPK CV. Fathan",
  description: "Halaman masuk khusus admin LPK CV. Fathan.",
  robots: { index: false, follow: false },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
