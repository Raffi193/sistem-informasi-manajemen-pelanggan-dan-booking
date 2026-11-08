"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Aplikasi gagal dimuat:", error);
  }, [error]);

  return (
    <html lang="id">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          background: "#f8fafc",
          color: "#0f172a",
        }}
      >
        <main
          style={{
            width: "100%",
            maxWidth: "440px",
            borderRadius: "24px",
            border: "1px solid #e2e8f0",
            background: "#ffffff",
            padding: "32px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#2563eb",
            }}
          >
            Terjadi kesalahan
          </p>
          <h1 style={{ margin: "12px 0 0", fontSize: "24px" }}>
            Aplikasi tidak dapat dimuat
          </h1>
          <p
            style={{
              margin: "12px 0 0",
              fontSize: "14px",
              lineHeight: 1.6,
              color: "#475569",
            }}
          >
            Silakan muat ulang halaman. Jika masalah berlanjut, hubungi admin
            lewat WhatsApp 082182944995.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "24px",
              border: 0,
              borderRadius: "999px",
              background: "#2563eb",
              color: "#ffffff",
              padding: "12px 24px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Coba lagi
          </button>
        </main>
      </body>
    </html>
  );
}
