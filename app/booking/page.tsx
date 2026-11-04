"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { BuktiUpload } from "@/components/bukti-upload";
import { PaymentInstructions } from "@/components/payment-instructions";
import { Spinner } from "@/components/spinner";
import { formatTanggal } from "@/lib/date";
import { formatJam, formatRupiah } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";

type Paket = {
  id: string;
  nama: string;
  transmisi: string;
  jumlah_pertemuan: number;
  harga: number;
  keterangan: string | null;
};

type Slot = {
  id: string;
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
  sesi: string;
};

const STEPS = ["Paket", "Jadwal", "Biodata"];

function todayISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

export default function BookingPage() {
  const supabase = useMemo(
    () => (isSupabaseConfigured ? createClient() : null),
    [],
  );

  const [step, setStep] = useState(1);
  const [paketList, setPaketList] = useState<Paket[]>([]);
  const [slotList, setSlotList] = useState<Slot[]>([]);
  const [paketId, setPaketId] = useState("");
  const [slotId, setSlotId] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [today, setToday] = useState("");
  const [nama, setNama] = useState("");
  const [noWa, setNoWa] = useState("");
  const [alamat, setAlamat] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hint, setHint] = useState<string | null>(null);
  const [loadingPaket, setLoadingPaket] = useState(isSupabaseConfigured);
  const [loadingSlot, setLoadingSlot] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<{ kode_booking: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const selectedPaket = paketList.find((p) => p.id === paketId) ?? null;
  const selectedSlot = slotList.find((s) => s.id === slotId) ?? null;

  // Inisialisasi tanggal hari ini di sisi klien (hindari `new Date()` saat prerender)
  useEffect(() => {
    const t = todayISO();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToday(t);
    setTanggal(t);
  }, []);

  // Ambil daftar paket
  useEffect(() => {
    if (!supabase) return;
    supabase
      .from("paket")
      .select("*")
      .eq("status_aktif", true)
      .order("harga", { ascending: true })
      .then(({ data }) => {
        const list = (data ?? []) as Paket[];
        setPaketList(list);

        // Dukungan tautan dari landing: /booking?paket=<id>
        const requested = new URLSearchParams(window.location.search).get(
          "paket",
        );
        if (requested && list.some((p) => p.id === requested)) {
          setPaketId(requested);
          setHint(null);
        }

        setLoadingPaket(false);
      });
  }, [supabase]);

  // Ambil slot saat tanggal berubah
  useEffect(() => {
    if (!supabase || !tanggal) return;
    let active = true;

    supabase
      .from("slot")
      .select("*")
      .eq("tanggal", tanggal)
      .eq("status", "tersedia")
      .order("jam_mulai", { ascending: true })
      .then(({ data }) => {
        if (!active) return;
        setSlotList(data ?? []);
        setLoadingSlot(false);
      });

    return () => {
      active = false;
    };
  }, [supabase, tanggal]);

  function goNext() {
    if (step === 1 && !paketId) {
      setHint("Pilih salah satu paket terlebih dahulu.");
      return;
    }
    if (step === 2 && !slotId) {
      setHint("Pilih salah satu jam yang tersedia.");
      return;
    }
    setHint(null);
    setErrors({});
    setStep((s) => Math.min(3, s + 1));
  }

  function validateBiodata() {
    const e: Record<string, string> = {};
    if (!nama.trim()) e.nama = "Nama lengkap wajib diisi.";
    const wa = noWa.replace(/\D/g, "");
    if (!wa) e.noWa = "Nomor WhatsApp wajib diisi.";
    else if (!/^08\d{8,11}$/.test(wa))
      e.noWa =
        "Nomor WhatsApp tidak valid. Gunakan format yang benar, contoh: 081234567890.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!supabase) return;
    if (!validateBiodata()) return;
    setSubmitting(true);
    setSubmitError(null);
    const { data, error } = await supabase.rpc("create_booking", {
      p_nama: nama.trim(),
      p_no_wa: noWa.replace(/\D/g, ""),
      p_alamat: alamat.trim(),
      p_paket_id: paketId,
      p_slot_id: slotId,
    });
    setSubmitting(false);
    if (error) {
      if (error.message.includes("SLOT_PENUH")) {
        setSubmitError(
          "Maaf, slot yang Anda pilih baru saja terisi. Silakan kembali dan pilih jam lain.",
        );
      } else {
        setSubmitError(
          "Booking belum berhasil diproses. Coba lagi, atau hubungi admin lewat WhatsApp 082182944995.",
        );
      }
      return;
    }
    setResult(data as { kode_booking: string });
  }

  function copyKode() {
    if (!result) return;
    navigator.clipboard?.writeText(result.kode_booking);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ---- Kondisi: Supabase belum terhubung ----
  if (!supabase) {
    return (
      <>
        <SiteHeader />
        <main className="flex flex-1 items-center justify-center px-6 py-24">
          <div className="max-w-md text-center">
            <h1 className="font-display text-2xl font-bold">Fitur belum terhubung</h1>
            <p className="mt-3 text-muted-foreground">
              Sistem booking online belum diaktifkan karena database belum
              terhubung. Sementara itu, Anda bisa booking langsung lewat admin.
            </p>
            <a
              href="https://wa.me/6282182944995"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Booking via WhatsApp
            </a>
          </div>
        </main>
      </>
    );
  }

  // ---- Kondisi: sukses ----
  if (result) {
    return (
      <>
        <SiteHeader />
        <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 sm:py-16">
          <div className="animate-page-in w-full max-w-2xl text-center">
            <span className="animate-zoom-in mx-auto flex size-14 items-center justify-center rounded-full bg-green-100 text-2xl text-green-600">
              ✓
            </span>
            <h1 className="mt-5 font-display text-3xl font-bold leading-tight">Booking berhasil!</h1>
            <p className="mt-2 text-muted-foreground">
              Simpan kode booking Anda. Gunakan untuk cek status kapan saja.
            </p>

            <div className="animate-fade-up mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row" style={{ animationDelay: "100ms" }}>
              <code className="w-full max-w-xs rounded-xl border border-border bg-secondary px-4 py-3 font-mono text-xl font-bold tracking-[0.18em] sm:w-auto sm:px-6 sm:text-2xl sm:tracking-widest">
                {result.kode_booking}
              </code>
              <button
                onClick={copyKode}
                className="w-full rounded-full border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary sm:w-auto sm:py-2"
              >
                {copied ? "Tersalin ✓" : "Salin"}
              </button>
            </div>

            <div
              className="animate-fade-up mt-8 rounded-2xl border border-border bg-white p-5 text-left sm:p-6"
              style={{ animationDelay: "180ms" }}
            >
              <PaymentInstructions kodeBooking={result.kode_booking} />

              <div className="mt-6 border-t border-border pt-6">
                <h3 className="font-display font-bold">Unggah bukti pembayaran</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Foto atau PDF bukti transfer. Bisa juga kirim ke WhatsApp{" "}
                  <a
                    href="https://wa.me/6282182944995"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-foreground underline-offset-2 hover:underline"
                  >
                    082182944995
                  </a>
                  . Setelah diunggah, status booking berubah menjadi{" "}
                  <strong>Menunggu verifikasi</strong>.
                </p>
                <div className="mt-4">
                  <BuktiUpload
                    kode={result.kode_booking}
                    noWa={noWa.replace(/\D/g, "")}
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/status"
                className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Cek Status Booking
              </Link>
              <Link
                href="/"
                className="rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground hover:bg-secondary"
              >
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  // ---- Form utama ----
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-12">
        <div className="animate-fade-up text-center">
          <h1 className="font-display text-3xl font-bold leading-tight tracking-tight md:text-4xl">
            Booking jadwal kursus
          </h1>
          <p className="mt-2 text-muted-foreground">
            Isi tiga langkah singkat di bawah ini.
          </p>
        </div>

        {/* Progress — visibility of system status */}
        <div
          className="animate-fade-in mt-8 flex items-center justify-center gap-1.5 sm:gap-2"
          style={{ animationDelay: "120ms" }}
        >
          {STEPS.map((label, i) => {
            const n = i + 1;
            const active = step === n;
            const done = step > n;
            return (
              <div
                key={label}
                className="flex items-center gap-1.5 sm:gap-2"
              >
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold sm:size-8 sm:text-sm ${
                    active
                      ? "bg-primary text-white"
                      : done
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {n}
                </span>
                <span
                  className={`whitespace-nowrap text-xs sm:text-sm ${
                    active ? "font-semibold text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {label}
                </span>
                {n < STEPS.length && (
                  <span className="h-px w-3 bg-border sm:w-10" />
                )}
              </div>
            );
          })}
        </div>

        {/* Step 1 — Pilih Paket */}
        {step === 1 && (
          <section className="animate-page-in mt-10">
            <h2 className="font-display text-xl font-bold">Pilih paket kursus</h2>
            {loadingPaket ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />
                ))}
              </div>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {paketList.map((paket, index) => {
                  const selected = paketId === paket.id;
                  return (
                    <div
                      key={paket.id}
                      className="animate-fade-up h-full"
                      style={{ animationDelay: `${index * 55}ms` }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setPaketId(paket.id);
                          setHint(null);
                        }}
                        aria-pressed={selected}
                        className={`card-lift h-full w-full rounded-2xl border p-5 text-left ${
                          selected
                            ? "border-primary ring-2 ring-primary/30"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium capitalize text-primary">
                              {paket.transmisi}
                            </p>
                            <p className="mt-1 break-words font-display font-bold">
                              {paket.nama}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {paket.jumlah_pertemuan}× pertemuan
                            </p>
                          </div>
                          <span
                            className={`mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border text-xs ${
                              selected
                                ? "border-primary bg-primary text-white"
                                : "border-border"
                            }`}
                          >
                            {selected ? "✓" : ""}
                          </span>
                        </div>
                        <p className="mt-3 font-semibold">{formatRupiah(paket.harga)}</p>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Step 2 — Pilih Jadwal */}
        {step === 2 && (
          <section className="animate-page-in mt-10">
            <h2 className="font-display text-xl font-bold">Pilih jadwal</h2>
            <label className="mt-6 block">
              <span className="text-sm font-medium text-foreground">Tanggal</span>
              <input
                type="date"
                value={tanggal}
                min={today}
                onChange={(e) => {
                  const value = e.target.value;
                  setTanggal(value);
                  setSlotId("");
                  setSlotList([]);
                  setLoadingSlot(Boolean(value));
                }}
                className="mt-2 w-full rounded-xl border border-input bg-white px-4 py-3 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
            </label>

            <p className="mt-6 text-sm font-medium text-foreground">Jam tersedia</p>
            {loadingSlot ? (
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
                ))}
              </div>
            ) : slotList.length === 0 ? (
              <p className="mt-3 rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                Belum ada slot tersedia pada tanggal ini. Coba tanggal lain.
              </p>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {slotList.map((slot, index) => {
                  const selected = slotId === slot.id;
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => {
                        setSlotId(slot.id);
                        setHint(null);
                      }}
                      aria-pressed={selected}
                      className={`animate-fade-up rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                        selected
                          ? "border-primary bg-primary text-white"
                          : "border-border bg-white hover:border-primary/50"
                      }`}
                      style={{ animationDelay: `${index * 45}ms` }}
                    >
                      {formatJam(slot.jam_mulai)}–{formatJam(slot.jam_selesai)}
                      <span
                        className={`block text-xs ${
                          selected ? "text-blue-100" : "text-muted-foreground"
                        }`}
                      >
                        {slot.sesi === "malam" ? "Kelas malam" : "Reguler"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Step 3 — Biodata & Konfirmasi */}
        {step === 3 && (
          <section className="animate-page-in mt-10">
            <h2 className="font-display text-xl font-bold">Isi biodata Anda</h2>

            <div className="mt-6 space-y-5">
              <label className="block">
                <span className="text-sm font-medium text-foreground">
                  Nama lengkap <span className="text-destructive">*</span>
                </span>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className={`mt-2 w-full rounded-xl border bg-white px-4 py-3 outline-none focus:ring-2 ${
                    errors.nama
                      ? "border-destructive focus:border-destructive focus:ring-destructive/30"
                      : "border-input focus:border-primary focus:ring-primary/30"
                  }`}
                />
                {errors.nama && (
                  <p className="mt-1.5 text-sm text-destructive">{errors.nama}</p>
                )}
              </label>

              <label className="block">
                <span className="text-sm font-medium text-foreground">
                  Nomor WhatsApp <span className="text-destructive">*</span>
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={noWa}
                  onChange={(e) => setNoWa(e.target.value)}
                  placeholder="081234567890"
                  className={`mt-2 w-full rounded-xl border bg-white px-4 py-3 outline-none focus:ring-2 ${
                    errors.noWa
                      ? "border-destructive focus:border-destructive focus:ring-destructive/30"
                      : "border-input focus:border-primary focus:ring-primary/30"
                  }`}
                />
                {errors.noWa ? (
                  <p className="mt-1.5 text-sm text-destructive">{errors.noWa}</p>
                ) : (
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Dipakai untuk konfirmasi jadwal oleh admin.
                  </p>
                )}
              </label>

              <label className="block">
                <span className="text-sm font-medium text-foreground">
                  Alamat <span className="text-muted-foreground">(opsional)</span>
                </span>
                <textarea
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  rows={2}
                  placeholder="Alamat tempat tinggal / penjemputan"
                  className="mt-2 w-full rounded-xl border border-input bg-white px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                />
              </label>
            </div>

            {/* Ringkasan — recognition, bukan recall */}
            <div className="mt-8 rounded-2xl border border-border bg-secondary/50 p-5 sm:p-6">
              <h3 className="font-display font-bold">Ringkasan booking</h3>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <dt className="shrink-0 text-muted-foreground">Paket</dt>
                  <dd className="min-w-0 text-right font-medium text-foreground">
                    <span className="block break-words">
                      {selectedPaket?.nama ?? "-"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="mt-1 text-xs font-medium text-primary hover:underline"
                    >
                      Ubah
                    </button>
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="shrink-0 text-muted-foreground">Jadwal</dt>
                  <dd className="min-w-0 text-right font-medium text-foreground">
                    {selectedSlot ? (
                      <>
                        <span className="block">
                          {formatTanggal(selectedSlot.tanggal)}
                        </span>
                        <span className="block">
                          {formatJam(selectedSlot.jam_mulai)}–
                          {formatJam(selectedSlot.jam_selesai)}
                        </span>
                      </>
                    ) : (
                      <span className="block">-</span>
                    )}
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="mt-1 text-xs font-medium text-primary hover:underline"
                    >
                      Ubah
                    </button>
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="shrink-0 text-muted-foreground">Harga paket</dt>
                  <dd className="min-w-0 text-right font-medium text-foreground">
                    {selectedPaket ? formatRupiah(selectedPaket.harga) : "-"}
                  </dd>
                </div>
              </dl>
            </div>
          </section>
        )}

        {/* Hint / error */}
        {hint && (
          <p className="animate-fade-in mt-6 text-center text-sm font-medium text-destructive">
            {hint}
          </p>
        )}
        {submitError && (
          <p className="animate-fade-in mt-6 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {submitError}
          </p>
        )}

        {/* Navigasi — user control & freedom */}
        <div className="mt-10 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => {
                setStep((s) => s - 1);
                setHint(null);
                setSubmitError(null);
              }}
              className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              ← Kembali
            </button>
          ) : (
            <Link
              href="/"
              className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              ← Beranda
            </Link>
          )}

          {step < 3 ? (
            <button
              onClick={goNext}
              className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Lanjut →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && <Spinner className="size-4" />}
              {submitting ? "Memproses…" : "Buat Booking"}
            </button>
          )}
        </div>
      </main>
    </>
  );
}
