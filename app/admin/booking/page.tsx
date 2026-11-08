import Link from "next/link";
import { connection } from "next/server";
import { AdminPageHeader } from "@/components/admin-page-header";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { StatusBadge, type StatusValue } from "@/components/status-badge";
import { calculateAge, formatTanggal } from "@/lib/date";
import { one, type Embed } from "@/lib/embed";
import { formatJam, formatRupiah } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { markSelesaiAction, verifyBookingAction } from "./actions";

export const instant = false;

type PaymentRow = {
  id: string;
  jenis: string;
  jumlah: number;
  bukti_file: string | null;
  status_verifikasi: string;
  created_at: string;
};

type BookingRow = {
  id: string;
  kode_booking: string;
  status: StatusValue;
  tgl_booking: string;
  tanggal_latihan: string | null;
  biaya_tambahan: number;
  catatan: string | null;
  customer: Embed<{
    nama: string;
    no_wa: string;
    tanggal_lahir: string | null;
  }>;
  paket: Embed<{ nama: string; harga: number }>;
  slot_template: Embed<{ jam_mulai: string; jam_selesai: string }>;
  pembayaran: PaymentRow[] | PaymentRow | null;
};

const FILTERS = [
  { key: "", label: "Semua" },
  { key: "menunggu_pembayaran", label: "Menunggu bayar" },
  { key: "menunggu_verifikasi", label: "Perlu verifikasi" },
  { key: "disetujui", label: "Disetujui" },
  { key: "ditolak", label: "Ditolak" },
  { key: "selesai", label: "Selesai" },
] as const;

function latestPayment(value: BookingRow["pembayaran"]): PaymentRow | null {
  if (!value) return null;
  const list = Array.isArray(value) ? value : [value];
  if (list.length === 0) return null;
  return [...list].sort((a, b) =>
    a.created_at < b.created_at ? 1 : -1,
  )[0];
}

const VERIFIKASI_LABEL: Record<string, string> = {
  menunggu: "Menunggu",
  terverifikasi: "Terverifikasi",
  ditolak: "Ditolak",
};

export default async function AdminBookingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await connection();

  const { status = "", q = "" } = await searchParams;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("booking")
    .select(
      `
      id,
      kode_booking,
      status,
      tgl_booking,
      tanggal_latihan,
      biaya_tambahan,
      catatan,
      customer:customer_id (nama, no_wa, tanggal_lahir),
      paket:paket_id (nama, harga),
      slot_template:slot_template_id (jam_mulai, jam_selesai),
      pembayaran (id, jenis, jumlah, bukti_file, status_verifikasi, created_at)
    `,
    )
    .order("tgl_booking", { ascending: false });

  const bookings = (data ?? []) as unknown as BookingRow[];
  const needle = q.trim().toLowerCase();

  const filtered = bookings.filter((booking) => {
    if (status && booking.status !== status) return false;
    if (!needle) return true;

    const customer = one(booking.customer);
    return [booking.kode_booking, customer?.nama, customer?.no_wa].some(
      (value) => value?.toLowerCase().includes(needle),
    );
  });

  const counts = bookings.reduce<Record<string, number>>((acc, booking) => {
    acc[booking.status] = (acc[booking.status] ?? 0) + 1;
    return acc;
  }, {});

  function hrefFor(key: string) {
    const params = new URLSearchParams();
    if (key) params.set("status", key);
    if (q) params.set("q", q);
    const query = params.toString();
    return query ? `/admin/booking?${query}` : "/admin/booking";
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Booking & verifikasi"
        description="Periksa bukti pembayaran, lalu setujui atau tolak booking."
        action={
          counts.menunggu_verifikasi > 0 ? (
            <p className="rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              {counts.menunggu_verifikasi} perlu diverifikasi
            </p>
          ) : undefined
        }
      />

      <form
        method="get"
        action="/admin/booking"
        className="flex flex-wrap gap-2"
      >
        {status && <input type="hidden" name="status" value={status} />}
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Cari kode / nama / WA"
          className="min-w-0 flex-1 rounded-xl border border-input bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
        />
        <button
          type="submit"
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Cari
        </button>
        {(status || q) && (
          <Link
            href="/admin/booking"
            className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Reset
          </Link>
        )}
      </form>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => {
          const active = filter.key === status;
          const count = filter.key
            ? (counts[filter.key] ?? 0)
            : bookings.length;
          return (
            <Link
              key={filter.key || "semua"}
              href={hrefFor(filter.key)}
              aria-current={active ? "page" : undefined}
              className={
                active
                  ? "rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                  : "rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              }
            >
              {filter.label}
              <span className={active ? "ml-1.5 text-primary-foreground/80" : "ml-1.5 text-muted-foreground"}>
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      {error && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Gagal memuat data booking. Coba muat ulang halaman.
        </p>
      )}

      {!error && filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-white p-10 text-center">
          <p className="font-display font-bold">Tidak ada booking</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {status || q
              ? "Coba ubah filter atau kata pencarian."
              : "Booking baru akan muncul di sini."}
          </p>
        </div>
      )}

      <div className="space-y-4">
        {filtered.map((booking) => {
          const customer = one(booking.customer);
          const paket = one(booking.paket);
          const jadwal = one(booking.slot_template);
          const payment = latestPayment(booking.pembayaran);
          const umur = calculateAge(customer?.tanggal_lahir);
          const proofPath = payment?.bukti_file ?? null;
          const proofUrl = proofPath
            ? `/api/admin/bukti?path=${encodeURIComponent(proofPath)}`
            : null;
          const isImage = proofPath
            ? /\.(jpe?g|png|webp)$/i.test(proofPath)
            : false;

          return (
            <article
              key={booking.id}
              className="card-lift rounded-2xl border border-border bg-white p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-mono text-lg font-bold tracking-widest">
                      {booking.kode_booking}
                    </p>
                    <StatusBadge status={booking.status} />
                  </div>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {customer?.nama ?? "-"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {customer?.no_wa ?? "-"}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Dibooking {formatTanggal(booking.tgl_booking, true)}
                </p>
              </div>

              <div className="mt-4 grid gap-4 border-t border-border pt-4 md:grid-cols-[170px_1fr]">
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Bukti pembayaran
                  </p>
                  {proofUrl && isImage ? (
                    <a
                      href={proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={proofUrl}
                        alt={`Bukti pembayaran ${booking.kode_booking}`}
                        loading="lazy"
                        className="h-32 w-full rounded-xl border border-border object-cover"
                      />
                      <span className="mt-1 block text-xs font-medium text-primary hover:underline">
                        Buka ukuran penuh
                      </span>
                    </a>
                  ) : proofUrl ? (
                    <a
                      href={proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary"
                    >
                      Lihat bukti (PDF)
                    </a>
                  ) : (
                    <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                      Belum ada bukti
                    </p>
                  )}
                </div>

                <div className="min-w-0">
                  <dl className="grid gap-x-4 gap-y-1.5 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-muted-foreground">Paket</dt>
                      <dd className="font-medium text-foreground">
                        {paket?.nama ?? "-"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Jadwal awal</dt>
                      <dd className="font-medium text-foreground">
                        {booking.tanggal_latihan && jadwal
                          ? `${formatTanggal(booking.tanggal_latihan)} · ${formatJam(jadwal.jam_mulai)}–${formatJam(jadwal.jam_selesai)}`
                          : "-"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Umur</dt>
                      <dd className="font-medium text-foreground">
                        {umur !== null ? `${umur} tahun` : "-"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Nominal</dt>
                      <dd className="font-medium text-foreground">
                        {payment ? formatRupiah(payment.jumlah) : "-"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">
                        Biaya kelas malam
                      </dt>
                      <dd className="font-medium text-foreground">
                        {booking.biaya_tambahan > 0
                          ? formatRupiah(booking.biaya_tambahan)
                          : "-"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Total paket</dt>
                      <dd className="font-medium text-foreground">
                        {paket
                          ? formatRupiah(paket.harga + booking.biaya_tambahan)
                          : "-"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Verifikasi</dt>
                      <dd className="font-medium text-foreground">
                        {payment
                          ? (VERIFIKASI_LABEL[payment.status_verifikasi] ??
                            payment.status_verifikasi)
                          : "-"}
                      </dd>
                    </div>
                  </dl>

                  {booking.catatan && (
                    <p className="mt-3 rounded-lg bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
                      {booking.catatan}
                    </p>
                  )}

                  {booking.status === "menunggu_verifikasi" && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <form action={verifyBookingAction}>
                        <input
                          type="hidden"
                          name="booking_id"
                          value={booking.id}
                        />
                        <input type="hidden" name="decision" value="approve" />
                        <button
                          type="submit"
                          className="rounded-full bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
                        >
                          Setujui
                        </button>
                      </form>
                      <form action={verifyBookingAction}>
                        <input
                          type="hidden"
                          name="booking_id"
                          value={booking.id}
                        />
                        <input type="hidden" name="decision" value="reject" />
                        <ConfirmSubmit
                          title="Tolak booking ini?"
                          message={`Booking ${booking.kode_booking} akan ditolak, kuota jadwal dibebaskan, dan pembayaran ditandai ditolak. Tindakan ini tidak dapat dibatalkan.`}
                          confirmLabel="Ya, tolak booking"
                          className="rounded-full border border-destructive/40 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/5"
                        >
                          Tolak
                        </ConfirmSubmit>
                      </form>
                    </div>
                  )}

                  {booking.status === "disetujui" && (
                    <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-start">
                      <form action={markSelesaiAction} className="md:shrink-0">
                        <input
                          type="hidden"
                          name="booking_id"
                          value={booking.id}
                        />
                        <button
                          type="submit"
                          className="w-full rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary md:w-auto"
                        >
                          Tandai selesai
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
