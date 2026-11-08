"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Halaman gagal dirender:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary/30 px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border border-border bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          Terjadi kesalahan
        </p>
        <h1 className="mt-3 font-display text-2xl font-bold">
          Halaman tidak dapat dimuat
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Silakan coba lagi. Jika masalah berlanjut, hubungi admin lewat
          WhatsApp 082182944995.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Coba lagi
        </button>
      </div>
    </main>
  );
}
