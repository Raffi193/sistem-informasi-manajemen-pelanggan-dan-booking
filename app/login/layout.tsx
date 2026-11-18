import type { Metadata } from "next";
import { ForceLightTheme } from "@/components/force-light-theme";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Masuk Admin",
  description: "Halaman masuk khusus admin LPK CV. Fathan.",
  path: "/login",
  noIndex: true,
});

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <ForceLightTheme />
    </>
  );
}
