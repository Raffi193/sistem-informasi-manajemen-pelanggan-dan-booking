"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { BuktiUpload } from "@/components/bukti-upload";
import { PaymentInstructions } from "@/components/payment-instructions";
import { Spinner } from "@/components/spinner";
import { formatTanggal, todayInJakarta } from "@/lib/date";
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

type JadwalSlot = {
  slot_template_id: string;
  urutan: number;
  jam_mulai: string;
  jam_selesai: string;
  kapasitas: number;
  biaya_tambahan: number;
  terpakai: number;
  sisa: number;
  tersedia: boolean;
};

type BookingResult = {
  kode_booking: string;
  biaya_tambahan?: number;
  total_biaya?: number;
};

const STEPS = ["Paket", "Jadwal", "Biodata"];

export default function BookingPage() {
  const supabase = useMemo(
    () => (isSupabaseConfigured ? createClient() : null),
    [],
  );

  const [step, setStep] = useState(1);
  const [paketList, setPaketList] = useState<Paket[]>([]);
  const [jadwalList, setJadwalList] = useState<JadwalSlot[]>([]);
  const [paketId, setPaketId] = useState("");
  const [slotTemplateId, setSlotTemplateId] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [today, setToday] = useState("");
  const [nama, setNama] = useState("");
  const [tanggalLahir, setTanggalLahir] = useState("");
  const [noWa, setNoWa] = useState("");
  const [alamat, setAlamat] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hint, setHint] = useState<string | null>(null);
  const [loadingPaket, setLoadingPaket] = useState(isSupabaseConfigured);
  const [loadingSlot, setLoadingSlot] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<BookingResult | null>(null);
  const [copied, setCopied] = useState(false);

  const selectedPaket = paketList.find((p) => p.id === paketId) ?? null;
  const selectedJadwal =
    jadwalList.find((item) => item.slot_template_id === slotTemplateId) ?? null;
  const biayaTambahan = selectedJadwal?.biaya_tambahan ?? 0;
  const totalBiaya = (selectedPaket?.harga ?? 0) + biayaTambahan;

  // Inisialisasi tanggal hari ini di sisi klien (hindari `new Date()` saat prerender)
  useEffect(() => {
    const t = todayInJakarta();
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

  // Ambil jadwal dan sisa kapasitas saat tanggal berubah.
  useEffect(() => {
    if (!supabase || !tanggal) return;
    let active = true;

    supabase
      .rpc("get_jadwal_tersedia", { p_tanggal: tanggal })
      .then(({ data, error }) => {
        if (!active) return;
        setJadwalList(
          error ? [] : ((data ?? []) as unknown as JadwalSlot[]),
        );
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
    if (step === 2 && (!slotTemplateId || !selectedJadwal?.tersedia)) {
      setHint("Pilih salah satu jam yang masih tersedia.");
      return;
    }
    setHint(null);
    setErrors({});
    setStep((s) => Math.min(3, s + 1));
  }

  function validateBiodata() {
    const e: Record<string, string> = {};
    if (!nama.trim()) e.nama = "Nama lengkap wajib diisi.";
    if (!tanggalLahir) {
      e.tanggalLahir = "Tanggal lahir wajib diisi.";
    } else if (today && tanggalLahir > today) {
      e.tanggalLahir = "Tanggal lahir tidak boleh di masa depan.";
    }
    const wa = noWa.replace(/\D/g, "");
    if (!wa) e.noWa = "Nomor WhatsApp wajib diisi.";
    else if (!/^08\d{8,11}$/.test(wa))
      e.noWa =
        "Nomor WhatsApp tidak valid. Gunakan format yang benar, contoh: 081234567890.";
    if (!alamat.trim()) {
      e.alamat = "Alamat wajib diisi.";
    } else if (alamat.trim().length > 500) {
      e.alamat = "Alamat maksimal 500 karakter.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!supabase) return;
    if (!validateBiodata()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: nama.trim(),
          no_wa: noWa.replace(/\D/g, ""),
          tanggal_lahir: tanggalLahir,
          alamat: alamat.trim(),
          paket_id: paketId,
          slot_template_id: slotTemplateId,
          tanggal_latihan: tanggal,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
        kode_booking?: string;
        biaya_tambahan?: number;
        total_biaya?: number;
      };

      if (!response.ok) {
        const message = String(payload.error ?? "");

        if (response.status === 429 || message === "RATE_LIMIT") {
          setSubmitError(
            payload.message ??
              "Terlalu banyak percobaan booking. Coba lagi beberapa menit.",
          );
        } else if (message.includes("SLOT_PENUH")) {
          setSubmitError(
            "Maaf, jam yang Anda pilih baru saja penuh. Silakan kembali dan pilih jam lain.",
          );
        } else if (message.includes("TANGGAL_TIDAK_VALID")) {
          setSubmitError(
            "Tanggal latihan tidak valid. Pilih tanggal hari ini atau setelahnya.",
          );
        } else if (message.includes("SLOT_TIDAK_DITEMUKAN")) {
          setSubmitError(
            "Jadwal yang dipilih tidak tersedia lagi. Silakan pilih jam lain.",
          );
        } else if (message.includes("PAKET_TIDAK_DITEMUKAN")) {
          setSubmitError(
            "Paket yang dipilih tidak tersedia lagi. Silakan pilih paket lain.",
          );
        } else if (message.includes("TANGGAL_LAHIR_WAJIB")) {
          setSubmitError("Tanggal lahir wajib diisi.");
        } else if (message.includes("TANGGAL_LAHIR_TIDAK_VALID")) {
          setSubmitError("Tanggal lahir tidak valid. Periksa kembali.");
        } else if (message.includes("ALAMAT_WAJIB")) {
          setSubmitError("Alamat wajib diisi.");
        } else if (message.includes("ALAMAT_TERLALU_PANJANG")) {
          setSubmitError("Alamat terlalu panjang. Maksimal 500 karakter.");
        } else {
          setSubmitError(
            payload.message ??
              "Booking belum berhasil diproses. Coba lagi, atau hubungi admin lewat WhatsApp 082182944995.",
          );
        }
        return;
      }

      setResult(payload as BookingResult);
    } catch {
      setSubmitError(
        "Koneksi terputus. Periksa jaringan Anda lalu coba lagi, atau hubungi admin lewat WhatsApp 082182944995.",
      );
    } finally {
      setSubmitting(false);
    }
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
            <h1 className="mt-5 font-display text-3xl font-bold leading-tight">Booking berhasil, lakukan pembayaran DP sekarang!</h1>
            <p className="mt-2 text-muted-foreground">
              Simpan kode booking Anda. Gunakan untuk cek status kapan saja.
            </p>
            {typeof result.total_biaya === "number" && (
              <p className="mt-2 text-sm text-muted-foreground">
                Total biaya paket:{" "}
                <strong className="text-foreground">
                  {formatRupiah(result.total_biaya)}
                </strong>
                {result.biaya_tambahan
                  ? ` (termasuk biaya kelas malam ${formatRupiah(result.biaya_tambahan)})`
                  : ""}
              </p>
            )}

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
            <h2 className="font-display text-xl font-bold">Pilih jadwal mulai latihan</h2>
            <label className="mt-6 block">
              <span className="text-sm font-medium text-foreground">Tanggal</span>
              <input
                type="date"
                value={tanggal}
                min={today}
                onChange={(e) => {
                  const value = e.target.value;
                  setTanggal(value);
                  setSlotTemplateId("");
                  setJadwalList([]);
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
            ) : jadwalList.length === 0 ? (
              <p className="mt-3 rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                Belum ada jadwal aktif. Hubungi admin lewat WhatsApp{" "}
                <span className="font-medium">082182944995</span>.
              </p>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {jadwalList.map((item, index) => {
                  const selected = slotTemplateId === item.slot_template_id;
                  return (
                    <button
                      key={item.slot_template_id}
                      type="button"
                      onClick={() => {
                        if (!item.tersedia) return;
                        setSlotTemplateId(item.slot_template_id);
                        setHint(null);
                      }}
                      disabled={!item.tersedia}
                      aria-pressed={selected}
                      className={`animate-fade-up rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                        selected
                          ? "border-primary bg-primary text-white"
                          : item.tersedia
                            ? "border-border bg-white hover:border-primary/50"
                            : "cursor-not-allowed border-border bg-muted text-muted-foreground"
                      }`}
                      style={{ animationDelay: `${index * 45}ms` }}
                    >
                      {formatJam(item.jam_mulai)}–{formatJam(item.jam_selesai)}
                      <span
                        className={`block text-xs ${
                          selected
                            ? "text-blue-100"
                            : "text-muted-foreground"
                        }`}
                      >
                        {item.tersedia
                          ? `Sisa ${item.sisa} dari ${item.kapasitas}`
                          : "Penuh"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Jadwal ini adalah jadwal awal, jadwal pertemuan berikutnya dapat
              diatur dengan admin.
            </p>
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
                  Tanggal lahir <span className="text-destructive">*</span>
                </span>
                <input
                  type="date"
                  value={tanggalLahir}
                  max={today || undefined}
                  autoComplete="bday"
                  onChange={(e) => {
                    setTanggalLahir(e.target.value);
                    setErrors((prev) => ({ ...prev, tanggalLahir: "" }));
                  }}
                  aria-invalid={errors.tanggalLahir ? true : undefined}
                  aria-describedby={
                    errors.tanggalLahir ? "tanggal-lahir-error" : undefined
                  }
                  className={`mt-2 w-full rounded-xl border bg-white px-4 py-3 outline-none focus:ring-2 ${
                    errors.tanggalLahir
                      ? "border-destructive focus:border-destructive focus:ring-destructive/30"
                      : "border-input focus:border-primary focus:ring-primary/30"
                  }`}
                />
                {errors.tanggalLahir ? (
                  <p
                    id="tanggal-lahir-error"
                    className="mt-1.5 text-sm text-destructive"
                  >
                    {errors.tanggalLahir}
                  </p>
                ) : (
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Sesuai dokumen identitas Anda.
                  </p>
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
                  Alamat <span className="text-destructive">*</span>
                </span>
                <textarea
                  value={alamat}
                  onChange={(e) => {
                    setAlamat(e.target.value);
                    setErrors((prev) => ({ ...prev, alamat: "" }));
                  }}
                  rows={3}
                  maxLength={500}
                  autoComplete="street-address"
                  placeholder="Alamat tempat tinggal / penjemputan"
                  aria-invalid={errors.alamat ? true : undefined}
                  aria-describedby={errors.alamat ? "alamat-error" : undefined}
                  className={`mt-2 w-full rounded-xl border bg-white px-4 py-3 outline-none focus:ring-2 ${
                    errors.alamat
                      ? "border-destructive focus:border-destructive focus:ring-destructive/30"
                      : "border-input focus:border-primary focus:ring-primary/30"
                  }`}
                />
                {errors.alamat && (
                  <p id="alamat-error" className="mt-1.5 text-sm text-destructive">
                    {errors.alamat}
                  </p>
                )}
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
                  <dt className="shrink-0 text-muted-foreground">Jadwal awal</dt>
                  <dd className="min-w-0 text-right font-medium text-foreground">
                    {selectedJadwal && tanggal ? (
                      <>
                        <span className="block">
                          {formatTanggal(tanggal)}
                        </span>
                        <span className="block">
                          {formatJam(selectedJadwal.jam_mulai)}–
                          {formatJam(selectedJadwal.jam_selesai)}
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
                {biayaTambahan > 0 && (
                  <div className="flex items-center justify-between gap-4">
                    <dt className="shrink-0 text-muted-foreground">
                      Biaya kelas malam
                    </dt>
                    <dd className="min-w-0 text-right font-medium text-foreground">
                      {formatRupiah(biayaTambahan)}
                    </dd>
                  </div>
                )}
                <div className="flex items-center justify-between gap-4 border-t border-border pt-3">
                  <dt className="shrink-0 font-medium text-foreground">
                    Total biaya
                  </dt>
                  <dd className="min-w-0 text-right font-display text-lg font-bold text-foreground">
                    {selectedPaket ? formatRupiah(totalBiaya) : "-"}
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
