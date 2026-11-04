import Image from "next/image";
import Link from "next/link";
import { FaqAccordion } from "@/components/faq-accordion";
import { Parallax } from "@/components/parallax";
import { Reveal } from "@/components/reveal";
import { SiteHeader } from "@/components/site-header";
import { TextReveal } from "@/components/text-reveal";
import { getPaketAktif } from "@/lib/data/paket";
import { formatRupiah } from "@/lib/format";

const steps = [
  {
    title: "Pilih paket",
    desc: "Tentukan paket manual, matic, atau kombinasi sesuai kebutuhan Anda.",
  },
  {
    title: "Pilih jadwal",
    desc: "Lihat slot yang tersedia secara real-time dan pilih waktu yang sesuai.",
  },
  {
    title: "Booking & bayar DP",
    desc: "Isi biodata sekali, bayar DP, lalu unggah bukti pembayaran.",
  },
];

const keunggulan = [
  {
    title: "Cek slot real-time",
    desc: "Lihat jadwal yang tersedia langsung dari website, tanpa menunggu balasan admin.",
  },
  {
    title: "Isi data sekali",
    desc: "Biodata cukup diisi satu kali dan dipakai ulang oleh admin — tanpa input berulang.",
  },
  {
    title: "Verifikasi transparan",
    desc: "Unggah bukti pembayaran dan pantau status booking Anda kapan saja.",
  },
];

const labelTransmisi = (transmisi: string) =>
  transmisi === "kombinasi"
    ? "Manual + Matic"
    : transmisi === "matic"
      ? "Matic"
      : "Manual";

export default async function Home() {
  const paketList = await getPaketAktif();

  return (
    <>
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
            <h1 className="font-display text-4xl font-medium leading-[1.14] tracking-tight text-foreground sm:text-5xl md:text-7xl">
              <TextReveal text="Belajar mengemudi jadi" />
              <span className="block text-primary">
                <TextReveal text="lebih mudah" delay={220} />
              </span>
            </h1>
            <p
              className="animate-fade-up mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground"
              style={{ animationDelay: "120ms" }}
            >
              Pilih paket, lihat slot yang tersedia, dan booking jadwal kursus
              langsung dari website, tanpa bolak-balik konfirmasi ke admin.
            </p>
            <div
              className="animate-fade-up mt-9 flex flex-wrap items-center justify-center gap-3"
              style={{ animationDelay: "240ms" }}
            >
              <Link
                href="/booking"
                className="rounded-full bg-primary px-7 py-3 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Booking Sekarang
              </Link>
              <Link
                href="#paket"
                className="rounded-full border border-border bg-white px-7 py-3 text-base font-medium text-foreground transition-colors hover:bg-secondary"
              >
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
                  <div className="card-lift h-full rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 p-8">
                    <h3 className="font-display text-xl font-bold text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                      {item.desc}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
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
                  <div className="card-lift h-full rounded-2xl border border-border bg-white p-7">
                    <span className="font-display text-sm font-bold text-primary">
                      0{i + 1}
                    </span>
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
                    href="https://wa.me/6282182944995"
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

        {/* Lokasi & Jam — info dunia nyata yang mudah dipahami */}
        <section id="lokasi" className="overflow-x-clip px-4 pb-24">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-5 md:grid-cols-2">
              <Reveal variant="left" className="h-full">
                <div className="card-lift h-full rounded-3xl border border-border bg-white p-8">
                  <h2 className="font-display text-2xl font-bold tracking-tight">
                    Jam kursus
                  </h2>
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
                  <h2 className="font-display text-2xl font-bold tracking-tight">
                    Lokasi kami
                  </h2>
                  <p className="mt-6 text-[15px] leading-relaxed text-muted-foreground">
                    Jl. Gub H. Bastari, 8 Ulu, Kecamatan Seberang Ulu I,
                    Kota Palembang
                  </p>
                  <p className="mt-2 text-[15px] text-muted-foreground">
                    WhatsApp:{" "}
                    <span className="font-medium text-foreground">082182944995</span>
                  </p>
                  <a
                    href="https://maps.app.goo.gl/sGxegFiEczvHDA4w8"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-block rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                  >
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
              <h2 className="font-display text-3xl font-bold leading-tight tracking-tight md:text-4xl">
                Pertanyaan yang sering diajukan
              </h2>
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
              <h2 className="font-display text-3xl font-bold leading-tight text-white md:text-4xl">
                Siap mulai belajar mengemudi?
              </h2>
              <p className="mx-auto mt-3 max-w-md text-blue-100">
                Booking jadwal kursus Anda hari ini bersama instruktur berpengalaman
                LPK CV. Fathan.
              </p>
              <Link
                href="/booking"
                className="mt-8 inline-block rounded-full bg-white px-7 py-3 text-base font-medium text-primary transition-colors hover:bg-blue-50"
              >
                Booking Sekarang
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
              <span className="font-display font-bold text-amber-500 text-lg">LPK CV. Fathan</span>
              <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                Kursus mengemudi mobil manual &amp; matic di Palembang.
              </p>
            </div>
            <nav className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-muted-foreground">
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
            </nav>
          </div>
          <p className="mt-8 text-sm text-muted-foreground">
            Jl. Gub H. Bastari, 8 Ulu, Seberang Ulu I, Palembang · WhatsApp: 082182944995
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
