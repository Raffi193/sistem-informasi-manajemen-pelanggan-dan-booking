import Link from "next/link";
import { BookingNavCta } from "@/components/booking-nav-cta";
import { MobileMenu } from "@/components/mobile-menu";

const navItems = [
  { href: "/#cara-kerja", label: "Cara Kerja" },
  { href: "/#keunggulan", label: "Keunggulan" },
  { href: "/#paket", label: "Paket" },
  { href: "/status", label: "Cek Status" },
];

export function SiteHeader() {
  return (
    <header className="animate-fade-down sticky top-4 z-50 px-4">
      <div className="mx-auto max-w-6xl">
        <nav className="flex items-center justify-between gap-3 rounded-full border border-border bg-white/80 py-2 pl-4 pr-2 shadow-sm backdrop-blur-md md:pl-6">
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary font-display text-sm font-bold text-primary-foreground">
              F
            </span>
            <span className="whitespace-nowrap text-base font-semibold tracking-tight sm:text-[20px]">
              <span className="sm:hidden">Fathan</span>
              <span className="hidden sm:inline">Fathan Driving School</span>
            </span>
          </Link>

          <div className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <MobileMenu items={navItems} />
            <BookingNavCta />
          </div>
        </nav>
      </div>
    </header>
  );
}
