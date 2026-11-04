"use client";

import { useId, useState } from "react";
import Image from "next/image";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Landmark,
  QrCode,
} from "lucide-react";
import { PAYMENT } from "@/lib/payment";

export function PaymentInstructions({
  kodeBooking,
}: {
  kodeBooking?: string;
}) {
  const headingId = useId();
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [qrError, setQrError] = useState(false);

  async function copyAccountNumber() {
    try {
      if (!navigator.clipboard) {
        throw new Error("Clipboard tidak tersedia.");
      }
      await navigator.clipboard.writeText(
        PAYMENT.bank.accountNumber.replace(/\s/g, ""),
      );
      setCopied(true);
      setCopyError(false);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
      setCopyError(true);
      window.setTimeout(() => setCopyError(false), 3000);
    }
  }

  return (
    <section aria-labelledby={headingId} className="text-left">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id={headingId} className="font-display text-lg font-bold">
            Pembayaran DP
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pilih salah satu metode pembayaran di bawah ini.
          </p>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {PAYMENT.dpLabel}
        </span>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <article className="flex h-full flex-col rounded-2xl border border-border bg-white p-5">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <QrCode className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="font-display font-bold">QRIS</h3>
              <p className="text-xs text-muted-foreground">
                Scan atau simpan gambarnya
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-1 flex-col items-center">
            {qrError ? (
              <div className="flex aspect-square w-full max-w-[240px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-secondary/40 p-4 text-center">
                <QrCode
                  className="size-8 text-muted-foreground"
                  aria-hidden="true"
                />
                <p className="mt-2 text-sm font-medium">
                  Gambar QRIS belum tersedia
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Gunakan transfer bank atau hubungi admin.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-white p-3">
                <Image
                  src={PAYMENT.qris.imagePath}
                  alt={`QRIS ${PAYMENT.qris.merchantName}`}
                  width={512}
                  height={512}
                  unoptimized
                  className="mx-auto h-auto w-full max-w-[240px]"
                  onError={() => setQrError(true)}
                />
              </div>
            )}

            <p className="mt-3 text-center text-sm font-medium">
              {PAYMENT.qris.merchantName}
            </p>
            <p className="mt-1 text-center text-xs leading-relaxed text-muted-foreground">
              QRIS statis. Masukkan nominal DP di aplikasi pembayaran.
            </p>

            {!qrError && (
              <div className="mt-4 flex w-full flex-col gap-2 sm:flex-row">
                <a
                  href={PAYMENT.qris.imagePath}
                  download={PAYMENT.qris.downloadName}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <Download className="size-4" aria-hidden="true" />
                  Unduh QRIS
                </a>
                <a
                  href={PAYMENT.qris.imagePath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                >
                  <ExternalLink className="size-4" aria-hidden="true" />
                  Buka gambar
                </a>
              </div>
            )}
          </div>
        </article>

        <article className="flex h-full flex-col rounded-2xl border border-border bg-white p-5">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Landmark className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="font-display font-bold">Transfer Bank</h3>
              <p className="text-xs text-muted-foreground">
                Transfer sesuai nominal DP
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-1 flex-col gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Bank
              </p>
              <p className="mt-1 font-display text-xl font-bold">
                {PAYMENT.bank.bankName}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Nomor rekening
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <code className="min-w-0 flex-1 break-all rounded-lg border border-border bg-secondary/60 px-3 py-2 font-mono text-base font-semibold tracking-wider">
                  {PAYMENT.bank.accountNumber}
                </code>
                <button
                  type="button"
                  onClick={copyAccountNumber}
                  aria-label={
                    copied ? "Nomor rekening tersalin" : "Salin nomor rekening"
                  }
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  {copied ? (
                    <Check className="size-3.5" aria-hidden="true" />
                  ) : (
                    <Copy className="size-3.5" aria-hidden="true" />
                  )}
                  {copied ? "Tersalin" : "Salin"}
                </button>
              </div>
              <p
                role="status"
                aria-live="polite"
                className={`mt-1 min-h-4 text-xs ${
                  copyError ? "text-destructive" : "text-green-700"
                }`}
              >
                {copied
                  ? "Nomor rekening tersalin."
                  : copyError
                    ? "Gagal menyalin. Silakan salin manual."
                    : ""}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Atas nama
              </p>
              <p className="mt-1 text-sm font-semibold">
                {PAYMENT.bank.accountHolder}
              </p>
            </div>

            {kodeBooking && (
              <div className="rounded-xl bg-primary/5 px-3 py-2.5">
                <p className="text-xs font-medium text-primary">
                  Berita transfer
                </p>
                <p className="mt-0.5 font-mono text-sm font-semibold tracking-wider">
                  {kodeBooking}
                </p>
              </div>
            )}

            <p className="mt-auto rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-900">
              Pastikan nama penerima sesuai. Simpan bukti transfer untuk
              diunggah.
            </p>
          </div>
        </article>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        {PAYMENT.note}
      </p>
    </section>
  );
}
