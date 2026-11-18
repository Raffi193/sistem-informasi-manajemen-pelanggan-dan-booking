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

export function AdminNav() {
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
            className={cn(
              "flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-colors md:text-sm",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <item.icon className="size-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{item.label}</span>
            <PendingIndicator />
          </Link>
        );
      })}
      <Link
        href="/"
        className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground md:mt-1 md:text-sm"
      >
        <ExternalLink className="size-4 shrink-0" aria-hidden="true" />
        Lihat Situs
      </Link>
    </nav>
  );
}
