"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Spinner } from "@/components/spinner";
import { formatRupiah } from "@/lib/format";

const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];
const WA_NUMBER = "6282182944995";

export function BuktiUpload({
  kode,
  noWa,
  defaultJumlah = 100000,
}: {
  kode: string;
  noWa: string;
  defaultJumlah?: number;
}) {
  const fileId = useId();
  const jumlahId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [jumlah, setJumlah] = useState(String(defaultJumlah));
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const nominalValue = Number(jumlah);
  const nominalError =
    jumlah !== "" && Number.isFinite(nominalValue)
      ? nominalValue < 1000
        ? "Minimal transfer Rp 1.000."
        : nominalValue > 10_000_000
          ? "Maksimal transfer Rp 10.000.000."
          : null
      : null;

  const preview = useMemo(() => {
    if (!file || !file.type.startsWith("image/")) return null;
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const waLink = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(
    `Halo admin, saya sudah mengunggah bukti pembayaran untuk kode booking ${kode}. Mohon diverifikasi. Terima kasih.`,
  )}`;

  function pilihFile(next: File | null) {
    setError(null);
    setSuccess(false);
    if (!next) {
      setFile(null);
      return;
    }
    if (!ALLOWED_TYPES.includes(next.type)) {
      setError("Format file harus JPG, PNG, WEBP, atau PDF.");
      return;
    }
    if (next.size > MAX_BYTES) {
      setError("Ukuran file maksimal 4 MB. Kompres atau kecilkan file dulu.");
      return;
    }
    setFile(next);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!file) {
      setError("Pilih file bukti pembayaran terlebih dahulu.");
      return;
    }

    const nominal = Number(jumlah);
    if (!jumlah || !Number.isFinite(nominal)) {
      setError("Isi nominal transfer terlebih dahulu.");
      return;
    }
    if (nominal < 1000 || nominal > 10_000_000) {
      return; // pesan inline di bawah input sudah tampil
    }

    setUploading(true);
    const form = new FormData();
    form.set("kode", kode);
    form.set("no_wa", noWa);
    form.set("jenis", "dp");
    form.set("jumlah", String(nominal));
    form.set("file", file);

    try {
      const res = await fetch("/api/bukti", { method: "POST", body: form });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Gagal mengunggah bukti. Coba lagi.");
        return;
      }
      setSuccess(true);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch {
      setError("Koneksi bermasalah. Periksa internet Anda lalu coba lagi.");
    } finally {
      setUploading(false);
    }
  }

  if (success) {
    return (
      <div
        role="status"
        className="animate-page-in rounded-xl border border-green-300 bg-green-50 p-4 sm:p-5"
      >
        <p className="font-semibold text-green-900">
          Bukti pembayaran berhasil diunggah
        </p>
        <p className="mt-1 text-sm leading-relaxed text-green-800">
          Status booking Anda sekarang <strong>Menunggu verifikasi</strong>.
          Admin akan memeriksa bukti pembayaran. Anda juga bisa mengirim
          konfirmasi lewat WhatsApp.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-green-700 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-800"
          >
            Konfirmasi via WhatsApp
          </a>
          <Link
            href="/status"
            className="rounded-full border border-green-300 bg-white px-5 py-2.5 text-sm font-medium text-green-800 transition-colors hover:bg-green-100"
          >
            Cek Status Booking
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label htmlFor={jumlahId} className="block">
        <span className="text-sm font-medium text-foreground">
          Nominal transfer (Rp)
        </span>
        <input
          id={jumlahId}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          value={jumlah}
          onChange={(event) => {
            setJumlah(event.target.value.replace(/\D/g, ""));
            setError(null);
          }}
          placeholder="Contoh: 150000"
          aria-invalid={nominalError ? true : undefined}
          aria-describedby={`${jumlahId}-hint${nominalError ? ` ${jumlahId}-error` : ""}`}
          className={`mt-1.5 w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none focus:ring-2 ${
            nominalError
              ? "border-destructive focus:border-destructive focus:ring-destructive/30"
              : "border-input focus:border-primary focus:ring-primary/30"
          }`}
        />
        {nominalError && (
          <p
            id={`${jumlahId}-error`}
            className="mt-1.5 text-sm text-destructive"
          >
            {nominalError}
          </p>
        )}
        <span
          id={`${jumlahId}-hint`}
          className="mt-1 block text-xs text-muted-foreground"
        >
          Sesuai jumlah DP yang Anda transfer, mis. {formatRupiah(100000)}.
        </span>
      </label>

      <div>
        <label
          htmlFor={fileId}
          className="block text-sm font-medium text-foreground"
        >
          File bukti pembayaran
        </label>
        <input
          ref={inputRef}
          id={fileId}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={(event) => pilihFile(event.target.files?.[0] ?? null)}
          className="mt-1.5 block w-full min-w-0 cursor-pointer rounded-xl border border-input bg-white px-3 py-2.5 text-xs file:mr-2 file:rounded-full file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-[11px] file:font-medium file:text-primary hover:file:bg-primary/20 sm:px-4 sm:py-3 sm:text-sm sm:file:mr-3 sm:file:px-4 sm:file:text-xs"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          JPG, PNG, WEBP, atau PDF. Maksimal 4 MB.
        </p>
      </div>

      {file && (
        <div className="rounded-xl border border-border bg-secondary/40 p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="min-w-0 truncate text-sm text-foreground" title={file.name}>
              {file.name}
            </p>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="shrink-0 text-xs font-medium text-destructive hover:underline"
            >
              Hapus
            </button>
          </div>
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Pratinjau bukti pembayaran"
              className="animate-fade-in mt-3 max-h-48 w-auto max-w-full rounded-lg border border-border object-contain"
            />
          )}
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={uploading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {uploading && <Spinner className="size-4" />}
        {uploading ? "Mengunggah…" : "Unggah Bukti Pembayaran"}
      </button>
    </form>
  );
}
