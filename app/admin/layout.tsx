import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { AdminLogoutButton } from "@/components/admin-logout-button";
import { AdminNav } from "@/components/admin-nav";
import { AdminSessionGuard } from "@/components/admin-session-guard";
import { ForceLightTheme } from "@/components/force-light-theme";
import { AdminSidebar } from "@/components/admin-sidebar";
import { BrandLogo } from "@/components/brand-logo";
import { PageTransition } from "@/components/page-transition";
import { isAdminClaims } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Panel Admin",
  robots: { index: false, follow: false },
};

// Area admin bergantung pada sesi (cookie), jadi memang tidak di-prerender.
export const instant = false;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Tandai render sebagai request-time agar operasi sesi tidak dianggap
  // bagian dari prerender.
  await connection();

  const supabase = await createClient();
  // getClaims memverifikasi JWT di server. Untuk kunci signing asimetris,
  // verifikasi berjalan lokal sehingga perpindahan tab admin lebih cepat.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  // Pertahanan berlapis: proxy sudah menjaga, tetapi tetap diverifikasi di sini.
  if (!claims) redirect("/login");

  let isAdmin = isAdminClaims(claims);
  if (!isAdmin) {
    // JWT lama bisa belum memuat app_metadata.role yang baru di-set.
    const {
      data: { user },
    } = await supabase.auth.getUser();
    isAdmin = isAdminClaims({
      email: user?.email,
      app_metadata: user?.app_metadata,
    });
  }

  if (!isAdmin) redirect("/login?error=not-admin");

  const email = typeof claims.email === "string" ? claims.email : "Admin";

  return (
    <div className="min-h-screen bg-secondary/40">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:flex-row">
        {/* Bar atas (mobile) */}
        <header className="rounded-2xl border border-border bg-white px-4 py-3 md:hidden">
          <div className="flex items-center justify-between">
            <Link href="/admin" className="flex items-center">
              <BrandLogo size={32}>
                <span className="font-display font-bold">Panel Admin</span>
              </BrandLogo>
            </Link>
            <AdminLogoutButton variant="mobile" />
          </div>
          <AdminNav />
        </header>

        {/* Sidebar (desktop) */}
        <AdminSidebar email={email} />

        <main className="min-w-0 flex-1">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
      <AdminSessionGuard />
      <ForceLightTheme />
    </div>
  );
}
