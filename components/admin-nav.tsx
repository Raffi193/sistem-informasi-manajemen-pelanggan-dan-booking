"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarCheck,
  Database,
  ExternalLink,
  FileText,
  LayoutDashboard,
  Users,
} from "lucide-react";
import { Spinner } from "@/components/spinner";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/analitik", label: "Dashboard Analitik", icon: BarChart3 },
  { href: "/admin/booking", label: "Booking & Verifikasi", icon: CalendarCheck },
  { href: "/admin/customer", label: "Customer & Follow-up", icon: Users },
  { href: "/admin/laporan", label: "Laporan", icon: FileText },
  { href: "/admin/master", label: "Master Data", icon: Database },
];

function PendingIndicator() {
  const { pending } = useLinkStatus();

  return (
    <span
      aria-hidden
      className={cn(
        "ml-auto flex size-3.5 shrink-0 items-center justify-center opacity-0 transition-opacity duration-150",
        pending && "opacity-100",
      )}
    >
      <Spinner className="size-3.5" />
    </span>
  );
}

export function AdminNav({ collapsed = false }: { collapsed?: boolean }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi admin"
      className="mt-4 flex flex-wrap gap-1 md:block md:space-y-1"
    >
      {items.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            aria-label={collapsed ? item.label : undefined}
            title={collapsed ? item.label : undefined}
            className={cn(
              "flex items-center rounded-xl text-xs font-medium transition-colors md:text-sm",
              collapsed
                ? "justify-center px-2 py-2.5"
                : "gap-2 px-3 py-2",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <item.icon
              className={collapsed ? "size-5 shrink-0" : "size-4 shrink-0"}
              aria-hidden="true"
            />
            {!collapsed && <span className="truncate">{item.label}</span>}
            {!collapsed && <PendingIndicator />}
          </Link>
        );
      })}
      <Link
        href="/"
        aria-label={collapsed ? "Lihat Situs" : undefined}
        title={collapsed ? "Lihat Situs" : undefined}
        className={cn(
          "flex items-center rounded-xl text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground md:mt-1 md:text-sm",
          collapsed
            ? "justify-center px-2 py-2.5"
            : "gap-2 px-3 py-2",
        )}
      >
        <ExternalLink
          className={collapsed ? "size-5 shrink-0" : "size-4 shrink-0"}
          aria-hidden="true"
        />
        {!collapsed && "Lihat Situs"}
      </Link>
    </nav>
  );
}
