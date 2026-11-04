import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-6 py-24">
        <div className="animate-page-in max-w-md text-center">
          <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-primary">
            Halaman 404
          </p>
          <h1 className="mt-4 font-display text-3xl font-bold leading-tight tracking-tight md:text-4xl">
            Halaman tidak ditemukan
          </h1>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            Maaf, halaman yang Anda cari tidak tersedia atau sudah dipindahkan.
            Silakan kembali ke beranda atau langsung lakukan booking.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Kembali ke Beranda
            </Link>
            <Link
              href="/booking"
              className="rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              Booking Sekarang
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
