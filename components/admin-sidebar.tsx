"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { AdminLogoutButton } from "@/components/admin-logout-button";
import { AdminNav } from "@/components/admin-nav";
import { BrandLogo } from "@/components/brand-logo";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "fathan-admin-sidebar-collapsed";

export function AdminSidebar({ email }: { email: string }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "1") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCollapsed(true);
      }
    } catch {
      // localStorage bisa diblokir browser; abaikan.
    }
  }, []);

  function toggleSidebar() {
    setCollapsed((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // Abaikan jika localStorage tidak tersedia.
      }
      return next;
    });
  }

  return (
    <aside
      className={cn(
        "hidden shrink-0 transition-[width] duration-200 md:block",
        collapsed ? "w-20" : "w-60",
      )}
    >
      <div className="sticky top-6 rounded-2xl border border-border bg-white p-3">
        <div
          className={cn(
            "flex",
            collapsed
              ? "flex-col items-center gap-2"
              : "items-center justify-between gap-2",
          )}
        >
          <Link
            href="/admin"
            aria-label="Dashboard admin"
            className={cn(
              "flex min-w-0 items-center",
              collapsed && "justify-center",
            )}
          >
            <BrandLogo size={32}>
              {!collapsed && (
                <span className="min-w-0">
                  <span className="block font-display text-sm font-bold leading-tight">
                    Panel Admin
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    LPK CV. Fathan
                  </span>
                </span>
              )}
            </BrandLogo>
          </Link>

          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={collapsed ? "Perluas sidebar" : "Perkecil sidebar"}
            aria-expanded={!collapsed}
            title={collapsed ? "Perluas sidebar" : "Perkecil sidebar"}
            className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            {collapsed ? (
              <ChevronRight className="size-4" aria-hidden="true" />
            ) : (
              <ChevronLeft className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>

        <AdminNav collapsed={collapsed} />

        <div className="mt-5 border-t border-border pt-4">
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <span
                title={email}
                className="flex size-8 items-center justify-center rounded-full bg-secondary text-muted-foreground"
              >
                <UserRound className="size-4" aria-hidden="true" />
                <span className="sr-only">{email}</span>
              </span>
              <AdminLogoutButton variant="icon" />
            </div>
          ) : (
            <>
              <p
                className="truncate px-3 text-xs text-muted-foreground"
                title={email}
              >
                {email}
              </p>
              <div className="mt-2">
                <AdminLogoutButton variant="desktop" />
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}