"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/spinner";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";

export default function LoginPage() {
  const supabase = useMemo(
    () => (isSupabaseConfigured ? createClient() : null),
    [],
  );
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "not-admin") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError("Akun ini tidak memiliki akses admin.");
    }
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Isi email dan kata sandi terlebih dahulu.");
      return;
    }
    if (!supabase) {
      setError("Sistem login belum terhubung ke database.");
      return;
    }

    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (signInError) {
      setError(
        signInError.message.toLowerCase().includes("invalid")
          ? "Email atau kata sandi salah. Periksa kembali."
          : "Gagal masuk. Coba lagi beberapa saat lagi.",
      );
      return;
    }

    const next = new URLSearchParams(window.location.search).get("next");
    router.replace(next && next.startsWith("/admin") ? next : "/admin");
    router.refresh();
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.14),transparent_60%)]"
      />

      <div className="animate-page-in w-full max-w-sm">
        <Link href="/" className="mx-auto flex w-fit items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-full bg-primary font-display text-base font-bold text-primary-foreground">
            F
          </span>
          <span className="font-display text-lg font-bold tracking-tight">
            Fathan Driving School
          </span>
        </Link>

        <div
          className="animate-fade-up mt-8 rounded-3xl border border-border bg-white p-7 shadow-sm"
          style={{ animationDelay: "80ms" }}
        >
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Masuk Admin
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Khusus pengelola LPK CV. Fathan.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <label className="block">
              <span className="text-sm font-medium text-foreground">Email</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="mt-1.5 w-full rounded-xl border border-input bg-white px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-foreground">
                Kata sandi
              </span>
              <div className="relative mt-1.5">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-input bg-white px-4 py-3 pr-20 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={
                    showPassword
                      ? "Sembunyikan kata sandi"
                      : "Tampilkan kata sandi"
                  }
                  className="absolute inset-y-0 right-0 px-4 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? "Sembunyikan" : "Lihat"}
                </button>
              </div>
            </label>

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
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && <Spinner className="size-4" />}
              {loading ? "Memproses…" : "Masuk"}
            </button>
          </form>
        </div>

        <Link
          href="/"
          className="mt-6 block text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Kembali ke beranda
        </Link>
      </div>
    </main>
  );
}
