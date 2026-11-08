"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { BuktiUpload } from "@/components/bukti-upload";
import { PaymentInstructions } from "@/components/payment-instructions";
import { Spinner } from "@/components/spinner";
import { StatusBadge, type StatusValue } from "@/components/status-badge";
import { formatTanggal } from "@/lib/date";
import { formatJam } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";

type BookingStatus = {
  kode_booking: string;
  status: StatusValue;
  tgl_booking: string;
  tanggal_latihan: string | null;
  jam_mulai: string | null;
  jam_selesai: string | null;
};

const STATUS_DESC: Record<string, string> = {
  menunggu_pembayaran:
    "Silakan selesaikan pembayaran DP, lalu unggah bukti pembayaran di halaman ini atau kirim ke WhatsApp admin.",
  menunggu_verifikasi:
    "Pembayaran Anda sedang diperiksa oleh admin. Mohon tunggu konfirmasi.",
  disetujui:
    "Booking Anda sudah disetujui. Sampai jumpa pada jadwal kursus Anda!",
  ditolak:
    "Booking Anda tidak dapat diproses. Hubungi admin untuk informasi lebih lanjut, atau buat booking baru dengan jadwal lain.",
  selesai: "Kursus Anda sudah selesai. Terima kasih telah belajar bersama kami!",
  batal: "Booking ini telah dibatalkan.",
};

export default function StatusPage() {
  const supabase = useMemo(
    () => (isSupabaseConfigured ? createClient() : null),
    [],
  );
  const [kode, setKode] = useState("");
  const [noWa, setNoWa] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BookingStatus | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    setNotFound(false);
    setError(null);
    if (!kode.trim() || !noWa.trim()) {
      setError("Masukkan kode booking dan nomor WhatsApp Anda.");
      return;
    }
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase.rpc("get_booking_status", {
      p_kode: kode.trim(),
      p_no_wa: noWa.replace(/\D/g, ""),
    });
    setLoading(false);
    if (error) {
      setError("Terjadi kesalahan saat memeriksa status. Silakan coba lagi.");
      return;
    }
    if (!data) {
      setNotFound(true);
      return;
    }
    setResult(data as BookingStatus);
  }

  if (!supabase) {
    return (
      <>
        <SiteHeader />
        <main className="flex flex-1 items-center justify-center px-6 py-24">
          <div className="max-w-md text-center">
            <h1 className="font-display text-2xl font-bold">Fitur belum terhubung</h1>
            <p className="mt-3 text-muted-foreground">
              Cek status online belum aktif karena database belum terhubung. Untuk
              menanyakan status booking, hubungi admin lewat WhatsApp.
            </p>
            <a
              href="https://wa.me/6282182944995"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Hubungi Admin
            </a>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
        <div className="animate-fade-up text-center">
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            Cek status booking
          </h1>
          <p className="mt-2 text-muted-foreground">
            Masukkan kode booking dan nomor WhatsApp Anda.
          </p>
        </div>

        <form
          onSubmit={handleCheck}
          className="animate-fade-up mt-8 space-y-5"
          style={{ animationDelay: "100ms" }}
        >
          <label className="block">
            <span className="text-sm font-medium text-foreground">Kode booking</span>
            <input
              type="text"
              value={kode}
              onChange={(e) => setKode(e.target.value)}
              placeholder="Contoh: A1B2C3D4"
              className="mt-2 w-full rounded-xl border border-input bg-white px-4 py-3 font-mono uppercase tracking-widest outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">Nomor WhatsApp</span>
            <input
              type="tel"
              inputMode="numeric"
              value={noWa}
              onChange={(e) => setNoWa(e.target.value)}
              placeholder="081234567890"
              className="mt-2 w-full rounded-xl border border-input bg-white px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
          </label>
          {error && (
            <p className="animate-fade-in rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <Spinner className="size-4" />}
            {loading ? "Memeriksa…" : "Cek Status"}
          </button>
        </form>

        {/* Hasil */}
        {notFound && (
          <div className="animate-fade-up mt-8 rounded-2xl border border-amber-300 bg-amber-50 p-5 sm:p-6">
            <h2 className="font-semibold text-amber-900">Booking tidak ditemukan</h2>
            <ul className="mt-3 space-y-2 text-sm text-amber-800">
              <li>• Pastikan kode booking ditulis lengkap dan benar (8 karakter).</li>
              <li>• Gunakan nomor WhatsApp yang sama seperti saat booking.</li>
              <li>
                • Masih tidak ketemu? Hubungi admin lewat WhatsApp{" "}
                <span className="font-medium">082182944995</span>.
              </li>
            </ul>
          </div>
        )}

        {result && (
          <div className="animate-blur-in mt-8 rounded-2xl border border-border bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">Kode booking</p>
                <p className="font-mono text-lg font-bold tracking-widest sm:text-xl">
                  {result.kode_booking}
                </p>
              </div>
              <StatusBadge status={result.status} />
            </div>
            <p className="animate-fade-in mt-4 text-sm leading-relaxed text-muted-foreground">
              {STATUS_DESC[result.status]}
            </p>

            {result.tanggal_latihan && result.jam_mulai && result.jam_selesai && (
              <div className="mt-4 rounded-xl border border-border bg-secondary/40 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Jadwal awal
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {formatTanggal(result.tanggal_latihan)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatJam(result.jam_mulai)}–{formatJam(result.jam_selesai)}
                </p>
              </div>
            )}

            {result.status === "menunggu_pembayaran" && (
              <>
                <div className="mt-6 border-t border-border pt-6">
                  <PaymentInstructions kodeBooking={result.kode_booking} />
                </div>

                <div className="mt-6 border-t border-border pt-6">
                  <h3 className="font-display font-bold">
                    Unggah bukti pembayaran
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Punya bukti transfer? Unggah di sini agar admin bisa
                    memverifikasi lebih cepat.
                  </p>
                  <div className="mt-4">
                    <BuktiUpload
                      kode={result.kode_booking}
                      noWa={noWa.replace(/\D/g, "")}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {(result.status === "menunggu_pembayaran" ||
                result.status === "ditolak") && (
                <a
                  href="https://wa.me/6282182944995"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={
                    result.status === "ditolak"
                      ? "rounded-full bg-primary px-5 py-2.5 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90"
                      : "rounded-full border border-border px-5 py-2.5 text-center text-sm font-medium text-foreground hover:bg-secondary"
                  }
                >
                  {result.status === "ditolak"
                    ? "Hubungi Admin"
                    : "Kirim via WhatsApp"}
                </a>
              )}
              <Link
                href="/booking"
                className="rounded-full border border-border px-5 py-2.5 text-center text-sm font-medium text-foreground hover:bg-secondary"
              >
                Kembali ke Booking
              </Link>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
