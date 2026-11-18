import Image from "next/image";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { FaqAccordion } from "@/components/faq-accordion";
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  Clock3,
  CreditCard,
  HelpCircle,
  Lock,
  MapPin,
  MessageCircle,
  Package,
  SearchCheck,
  Sparkles,
} from "lucide-react";
import { InstructorCarousel } from "@/components/instructor-carousel";
import { Parallax } from "@/components/parallax";
import { Reveal } from "@/components/reveal";
import { JsonLd } from "@/components/seo/json-ld";
import { SiteHeader } from "@/components/site-header";
import { TextReveal } from "@/components/text-reveal";
import { faqs } from "@/lib/content/faq";
import { getInstrukturAktif } from "@/lib/data/instruktur";
import { getPaketAktif } from "@/lib/data/paket";
import { formatRupiah } from "@/lib/format";
import {
  SITE_ADDRESS,
  SITE_MAPS_URL,
  SITE_PHONE_DISPLAY,
  SITE_WHATSAPP_URL,
} from "@/lib/seo/site";
import {
  courseSchema,
  faqPageSchema,
  organizationSchema,
  webPageSchema,
  websiteSchema,
} from "@/lib/seo/schema";

const steps = [
  {
    title: "Pilih paket",
    desc: "Tentukan paket manual, matic, atau kombinasi sesuai kebutuhan Anda.",
    icon: Package,
  },
  {
    title: "Pilih jadwal",
    desc: "Lihat slot dan sisa kuota secara real-time, lalu pilih waktu yang pas.",
    icon: CalendarClock,
  },
  {
    title: "Booking & bayar DP",
    desc: "Isi biodata sekali, bayar DP, lalu unggah bukti pembayaran.",
    icon: CreditCard,
  },
];

const keunggulan = [
  {
    title: "Cek jadwal real-time",
    desc: "Lihat slot yang tersedia langsung dari website, tanpa menunggu balasan admin.",
    icon: SearchCheck,
  },
  {
    title: "Isi data sekali",
    desc: "Biodata cukup diisi satu kali dan dipakai ulang oleh admin tanpa input berulang.",
    icon: BadgeCheck,
  },
  {
    title: "Verifikasi transparan",
    desc: "Unggah bukti pembayaran dan pantau status booking kapan saja dari website.",
    icon: CheckCircle2,
  },
] as const;

const labelTransmisi = (transmisi: string) =>
  transmisi === "kombinasi"
    ? "Manual + Matic"
    : transmisi === "matic"
      ? "Matic"
      : "Manual";

export default async function Home() {
  const [paketList, instrukturList] = await Promise.all([
    getPaketAktif(),
    getInstrukturAktif(),
  ]);

  return (
    <>
      <JsonLd
        data={[
          organizationSchema(paketList),
          courseSchema(paketList),
          websiteSchema(),
          webPageSchema(),
          faqPageSchema(faqs),
        ]}
      />
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          {/* Glow lembut — kesan modern/futuristik tanpa mengganggu baca */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.14),transparent_60%)]"
          />
          <div className="mx-auto max-w-4xl px-6 pb-14 pt-20 text-center md:pt-34">
            <h1 className="font-display text-3xl font-medium leading-[1.14] tracking-tight text-foreground sm:text-5xl md:text-7xl">
              <TextReveal text="Kursus mengemudi di Palembang jadi" />
              <span className="block text-primary">
                <TextReveal text="lebih mudah" delay={220} />
              </span>
            </h1>
            <p
              className="animate-fade-up mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground"
              style={{ animationDelay: "120ms" }}
            >
              Pilih paket favorit, cek slot real-time, dan amankan jadwal kursus
              Anda langsung dari website—tanpa bolak-balik konfirmasi ke admin.
            </p>
            <div
              className="animate-fade-up mt-9 flex flex-wrap items-center justify-center gap-3"
              style={{ animationDelay: "240ms" }}
            >
              <Link
                href="/booking"
                className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-base font-medium text-primary-foreground transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-lg"
              >
                <CalendarCheck
                  className="size-4 transition-transform duration-300 group-hover:scale-110"
                  aria-hidden="true"
                />
                Booking Sekarang
                <ArrowRight
                  className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
              <Link
                href="#paket"
                className="group inline-flex items-center gap-2 rounded-full border border-border bg-white px-7 py-3 text-base font-medium text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:bg-secondary hover:shadow-md"
              >
                <Package
                  className="size-4 transition-transform duration-300 group-hover:scale-110"
                  aria-hidden="true"
                />
                Lihat Paket
              </Link>
            </div>
          </div>

          {/* Banner gambar */}
          <div
            className="animate-blur-in mx-auto max-w-6xl px-4 pb-20"
            style={{ animationDelay: "360ms" }}
          >
            <div className="overflow-hidden rounded-3xl border border-border shadow-sm">
              <Parallax speed={0.03} maxOffset={16}>
                <Image
                  src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1800&q=80"
                  alt="Mobil melaju di jalan raya saat sesi kursus mengemudi"
                  width={1800}
                  height={600}
                  priority
                  sizes="(max-width: 1152px) 100vw, 1152px"
                  className="h-64 w-full scale-[1.04] object-cover md:h-80 lg:h-100"
                />
              </Parallax>
            </div>
          </div>
        </section>

        {/* Keunggulan */}
        <section id="keunggulan" className="px-4 pb-20">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-5 md:grid-cols-3">
              {keunggulan.map((item, index) => (
                <Reveal key={item.title} delay={index * 90} className="h-full">
                  <div className="card-lift group h-full rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                    <div className="flex items-center gap-3">
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/70 text-primary shadow-sm transition-transform duration-300 group-hover:scale-110">
                        <item.icon className="size-5" aria-hidden="true" />
                      </span>
                      <h3 className="font-display text-xl font-bold text-foreground">
                        {item.title}
                      </h3>
                    </div>
                    <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
                      {item.desc}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Tentang — konten informatif untuk pengguna dan mesin pencari */}
        <section id="tentang" className="px-4 pb-20">
          <div className="mx-auto max-w-3xl">
            <Reveal>
              <h2 className="font-display text-3xl font-bold leading-tight tracking-tight md:text-4xl">
                Kursus Mengemudi Manual &amp; Matic di Palembang
              </h2>
              <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-muted-foreground">
                <p>
                  LPK CV. Fathan membantu Anda belajar mengemudi mobil manual
                  maupun matic di Palembang, mulai dari pemula yang belum pernah
                  memegang setir hingga pengemudi yang ingin lebih percaya diri
                  di jalan raya.
                </p>
                <p>
                  Pilih paket sesuai kebutuhan, tentukan jadwal yang tersedia,
                  lalu lakukan booking langsung dari website. Instruktur
                  bersertifikat mendampingi setiap sesi latihan di area
                  Palembang dan sekitarnya dengan pendekatan yang sabar dan
                  praktis.
                </p>
              </div>
              <ul className="mt-6 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                <li className="flex gap-2">
                  <CheckCircle2
                    className="mt-0.5 size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  Instruktur bersertifikat dan berpengalaman
                </li>
                <li className="flex gap-2">
                  <CheckCircle2
                    className="mt-0.5 size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  Mobil manual dan matic
                </li>
                <li className="flex gap-2">
                  <CheckCircle2
                    className="mt-0.5 size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  Jadwal fleksibel, termasuk kelas malam
                </li>
                <li className="flex gap-2">
                  <CheckCircle2
                    className="mt-0.5 size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  Antar-jemput sesuai paket
                </li>
                <li className="flex gap-2">
                  <CheckCircle2
                    className="mt-0.5 size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  Booking online dan cek status kapan saja
                </li>
              </ul>
            </Reveal>
          </div>
        </section>

        {/* Cara kerja */}
        <section id="cara-kerja" className="px-4 pb-20">
          <div className="mx-auto max-w-6xl">
            <Reveal className="mb-10 text-center">
              <h2 className="font-display text-3xl font-bold leading-tight tracking-tight md:text-4xl">
                Cara kerja
              </h2>
              <p className="mt-3 text-muted-foreground">
                Tiga langkah untuk mulai belajar mengemudi.
              </p>
            </Reveal>
            <div className="grid gap-5 md:grid-cols-3">
              {steps.map((step, i) => (
                <Reveal key={step.title} delay={i * 90} className="h-full">
                  <div className="card-lift group h-full rounded-2xl border border-border bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-display text-sm font-bold text-primary">
                        0{i + 1}
                      </span>
                      <step.icon
                        className="size-5 text-primary/70 transition-transform duration-300 group-hover:scale-110 group-hover:text-primary"
                        aria-hidden="true"
                      />
                    </div>
                    <h3 className="mt-3 font-display text-lg font-bold text-foreground">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                      {step.desc}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Paket */}
        <section id="paket" className="px-4 pb-24">
          <div className="mx-auto max-w-6xl">
            <Reveal className="mb-10 text-center">
              <h2 className="font-display text-3xl font-bold leading-tight tracking-tight md:text-4xl">
                Paket kursus
              </h2>
              <p className="mt-3 text-muted-foreground">
                DP Rp100.000–200.000 untuk mengunci jadwal.
              </p>
            </Reveal>
            {paketList.length === 0 ? (
              <Reveal>
                <div className="rounded-2xl border border-dashed border-border bg-white p-10 text-center">
                  <p className="font-display text-lg font-bold text-foreground">
                    Paket belum dapat dimuat
                  </p>
                  <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                    Silakan muat ulang halaman, atau hubungi kami lewat WhatsApp
                    untuk info paket terbaru.
                  </p>
                  <a
                    href={SITE_WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Hubungi via WhatsApp
                  </a>
                </div>
              </Reveal>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {paketList.map((paket, index) => (
                  <Reveal
                    key={paket.id}
                    variant="zoom"
                    delay={index * 80}
                    className="h-full"
                  >
                    <div className="card-lift flex h-full flex-col rounded-2xl border border-border bg-white p-6">
                      <p className="text-sm font-medium text-primary">
                        {labelTransmisi(paket.transmisi)}
                      </p>
                      <h3 className="mt-2 font-display text-lg font-bold leading-snug text-foreground">
                        {paket.nama}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {paket.jumlah_pertemuan}× pertemuan
                      </p>
                      {paket.keterangan && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {paket.keterangan}
                        </p>
                      )}
                      <div className="mt-auto flex items-center justify-between pt-6">
                        <span className="text-lg font-semibold text-foreground">
                          {formatRupiah(paket.harga)}
                        </span>
                        <Link
                          href={`/booking?paket=${paket.id}`}
                          className="rounded-full border border-border px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                        >
                          Pilih
                        </Link>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Instruktur */}
        {instrukturList.length > 0 && (
          <section id="instruktur" className="px-4 pb-24">
            <div className="mx-auto max-w-6xl">
              <Reveal className="mb-10 text-center">
                <h2 className="font-display text-3xl font-bold leading-tight tracking-tight md:text-4xl">
                  Instruktur berpengalaman
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
                  Belajar langsung bersama instruktur bersertifikat LPK CV.
                  Fathan.
                </p>
              </Reveal>
              <Reveal variant="zoom">
                <InstructorCarousel instrukturList={instrukturList} />
              </Reveal>
            </div>
          </section>
        )}

        {/* Lokasi & Jam — info dunia nyata yang mudah dipahami */}
        <section id="lokasi" className="overflow-x-clip px-4 pb-24">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-5 md:grid-cols-2">
              <Reveal variant="left" className="h-full">
                <div className="card-lift h-full rounded-3xl border border-border bg-white p-8">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Clock3 className="size-5" aria-hidden="true" />
                    </span>
                    <h2 className="font-display text-2xl font-bold tracking-tight">
                      Jam kursus
                    </h2>
                  </div>
                  <dl className="mt-6 space-y-4 text-[15px]">
                    <div className="flex items-baseline justify-between gap-4">
                      <dt className="text-muted-foreground">Setiap hari</dt>
                      <dd className="font-medium text-foreground">08.00–18.00 (5 sesi)</dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-4">
                      <dt className="text-muted-foreground">Kelas malam</dt>
                      <dd className="font-medium text-foreground">18.00–20.00</dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-4">
                      <dt className="text-muted-foreground">Tambahan biaya malam</dt>
                      <dd className="font-medium text-foreground">Rp20.000</dd>
                    </div>
                  </dl>
                </div>
              </Reveal>

              <Reveal variant="right" delay={100} className="h-full">
                <div className="card-lift h-full rounded-3xl border border-border bg-white p-8">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <MapPin className="size-5" aria-hidden="true" />
                    </span>
                    <h2 className="font-display text-2xl font-bold tracking-tight">
                      Lokasi kami
                    </h2>
                  </div>
                  <p className="mt-6 text-[15px] leading-relaxed text-muted-foreground">
                    {SITE_ADDRESS.streetAddress}, Kota{" "}
                    {SITE_ADDRESS.addressLocality} {SITE_ADDRESS.postalCode}
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-[15px] text-muted-foreground">
                    <MessageCircle
                      className="size-4 text-primary"
                      aria-hidden="true"
                    />
                    WhatsApp:{" "}
                    <a
                      href={SITE_WHATSAPP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-foreground transition-colors hover:text-primary"
                    >
                      {SITE_PHONE_DISPLAY}
                    </a>
                  </p>
                  <a
                    href={SITE_MAPS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group mt-6 inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:bg-secondary hover:shadow-md"
                  >
                    <MapPin
                      className="size-4 transition-transform duration-300 group-hover:scale-110"
                      aria-hidden="true"
                    />
                    Buka di Google Maps
                  </a>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* FAQ — Help & documentation */}
        <section id="faq" className="px-4 pb-24">
          <div className="mx-auto max-w-3xl">
            <Reveal className="mb-8 text-center">
              <div className="flex items-center justify-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <HelpCircle className="size-5" aria-hidden="true" />
                </span>
                <h2 className="font-display text-3xl font-bold leading-tight tracking-tight md:text-4xl">
                  Pertanyaan yang sering diajukan
                </h2>
              </div>
              <p className="mt-3 text-muted-foreground">
                Belum menemukan jawaban? Hubungi kami lewat WhatsApp.
              </p>
            </Reveal>
            <FaqAccordion />
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 pb-24">
          <div className="mx-auto max-w-6xl">
            <Reveal
              variant="zoom"
              className="overflow-hidden rounded-3xl bg-primary px-8 py-16 text-center"
            >
              <div className="flex items-center justify-center gap-3">
                <Sparkles className="size-6 text-white/90" aria-hidden="true" />
                <h2 className="font-display text-3xl font-bold leading-tight text-white md:text-4xl">
                  Siap mulai belajar mengemudi?
                </h2>
              </div>
              <p className="mx-auto mt-3 max-w-md text-blue-100">
                Amankan jadwal kursus Anda hari ini bersama instruktur berpengalaman
                LPK CV. Fathan.
              </p>
              <Link
                href="/booking"
                className="group mt-8 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-base font-medium text-primary transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-50 hover:shadow-lg"
              >
                <CalendarCheck
                  className="size-4 transition-transform duration-300 group-hover:scale-110"
                  aria-hidden="true"
                />
                Booking Sekarang
                <ArrowRight
                  className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            </Reveal>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-white">
        <div className="mx-auto max-w-6xl px-6 py-10 pb-24 md:pb-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <BrandLogo size={40}>
                <span className="font-display font-bold text-black text-lg">LPK CV. Fathan</span>
              </BrandLogo>
              <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                Kursus mengemudi mobil manual &amp; matic di Palembang.
              </p>
            </div>
            <nav className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
              <Link href="/booking" className="transition-colors hover:text-foreground">
                Booking
              </Link>
              <Link href="/status" className="transition-colors hover:text-foreground">
                Cek Status
              </Link>
              <Link href="#faq" className="transition-colors hover:text-foreground">
                Bantuan
              </Link>
              <Link href="#paket" className="transition-colors hover:text-foreground">
                Paket
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 transition-colors hover:text-foreground"
                aria-label="Login admin"
              >
                <Lock className="size-4" aria-hidden="true" />
                Login Admin
              </Link>
            </nav>
          </div>
          <p className="mt-8 text-sm text-muted-foreground">
            {SITE_ADDRESS.streetAddress}, {SITE_ADDRESS.addressLocality}{" "}
            {SITE_ADDRESS.postalCode} · WhatsApp: {SITE_PHONE_DISPLAY}
          </p>
        </div>
      </footer>

      {/* CTA melayang di mobile — efisiensi & visibilitas aksi utama */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 p-3 backdrop-blur md:hidden">
        <Link
          href="/booking"
          className="block rounded-full bg-primary py-3 text-center text-sm font-medium text-primary-foreground transition-transform active:scale-[0.99]"
        >
          Booking Sekarang
        </Link>
      </div>
    </>
  );
}
