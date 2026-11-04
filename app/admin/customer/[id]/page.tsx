import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { CustomerForm } from "@/components/customer-form";
import { CustomerStatusBadge } from "@/components/customer-status-badge";
import { FollowUpForm } from "@/components/follow-up-form";
import { FollowUpTypeBadge } from "@/components/follow-up-type-badge";
import { StatusBadge, type StatusValue } from "@/components/status-badge";
import {
  isCustomerStatus,
  type CustomerStatusValue,
  waLink,
} from "@/lib/crm";
import { formatTanggal, todayInJakarta } from "@/lib/date";
import { one, type Embed } from "@/lib/embed";
import { formatJam, formatRupiah } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

type CustomerRow = {
  id: string;
  nama: string;
  no_wa: string;
  alamat: string | null;
  status: string;
  created_at: string;
};

type BookingRow = {
  id: string;
  kode_booking: string;
  status: StatusValue;
  tgl_booking: string;
  catatan: string | null;
  paket: Embed<{ nama: string; harga: number }>;
  slot: Embed<{ tanggal: string; jam_mulai: string; jam_selesai: string }>;
};

type FollowUpRow = {
  id: string;
  jenis: string | null;
  catatan: string | null;
  tgl: string;
};

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();

  const { id } = await params;
  const supabase = await createClient();

  // Ketiga query tidak saling bergantung, jadi jalankan bersamaan.
  const [customerRes, bookingsRes, followUpsRes] = await Promise.all([
    supabase
      .from("customer")
      .select("id,nama,no_wa,alamat,status,created_at")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("booking")
      .select(
        "id,kode_booking,status,tgl_booking,catatan,paket:paket_id(nama,harga),slot:slot_id(tanggal,jam_mulai,jam_selesai)",
      )
      .eq("customer_id", id)
      .order("tgl_booking", { ascending: false }),
    supabase
      .from("follow_up")
      .select("id,jenis,catatan,tgl")
      .eq("customer_id", id)
      .order("tgl", { ascending: false }),
  ]);

  const { data: customer, error } = customerRes;

  if (error || !customer) {
    notFound();
  }

  const customerRow = customer as CustomerRow;
  const status = isCustomerStatus(customerRow.status)
    ? customerRow.status
    : ("calon" as CustomerStatusValue);
  const bookings = (bookingsRes.data ?? []) as unknown as BookingRow[];
  const followUps = (followUpsRes.data ?? []) as FollowUpRow[];
  const today = todayInJakarta();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/customer"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Kembali ke daftar customer
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
              {customerRow.nama}
            </h1>
            <CustomerStatusBadge status={status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="block sm:inline">
              Terdaftar {formatTanggal(customerRow.created_at, true)}
            </span>
            <span className="hidden sm:inline" aria-hidden>
              {" "}
              ·{" "}
            </span>
            <span className="block sm:inline">
              {followUps.length} follow-up · {bookings.length} booking
            </span>
          </p>
        </div>

        <a
          href={waLink(
            customerRow.no_wa,
            `Halo ${customerRow.nama}, kami dari LPK CV. Fathan. Ada yang bisa kami bantu terkait kursus mengemudi Anda?`,
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
        >
          Chat WhatsApp
        </a>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-white p-5">
          <h2 className="font-display font-bold">Data customer</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Perbarui identitas dan status CRM customer.
          </p>
          <div className="mt-5">
            <CustomerForm
              customer={{
                id: customerRow.id,
                nama: customerRow.nama,
                no_wa: customerRow.no_wa,
                alamat: customerRow.alamat,
                status,
              }}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-white p-5">
          <h2 className="font-display font-bold">Catat follow-up</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Simpan hasil komunikasi supaya tidak terlewat.
          </p>
          <div className="mt-5">
            <FollowUpForm customerId={customerRow.id} today={today} />
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="overflow-hidden rounded-2xl border border-border bg-white">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-display font-bold">Riwayat booking</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Semua booking yang terhubung dengan customer ini.
            </p>
          </div>

          {bookings.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              Belum ada booking.
            </p>
          ) : (
            <>
              <div className="divide-y divide-border md:hidden">
                {bookings.map((booking) => {
                  const paket = one(booking.paket);
                  const slot = one(booking.slot);

                  return (
                    <div key={booking.id} className="p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-mono text-sm font-semibold">
                          {booking.kode_booking}
                        </p>
                        <StatusBadge status={booking.status} />
                      </div>
                      <p className="mt-2 text-sm font-medium">
                        {paket?.nama ?? "-"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {paket ? formatRupiah(paket.harga) : "-"}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {slot
                          ? `${formatTanggal(slot.tanggal)} · ${formatJam(
                              slot.jam_mulai,
                            )}–${formatJam(slot.jam_selesai)}`
                          : "-"}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3 font-medium">Kode</th>
                      <th className="px-5 py-3 font-medium">Paket</th>
                      <th className="px-5 py-3 font-medium">Jadwal</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {bookings.map((booking) => {
                      const paket = one(booking.paket);
                      const slot = one(booking.slot);

                      return (
                        <tr key={booking.id}>
                          <td className="whitespace-nowrap px-5 py-3 font-mono font-semibold">
                            {booking.kode_booking}
                          </td>
                          <td className="px-5 py-3">
                            <p className="font-medium">{paket?.nama ?? "-"}</p>
                            <p className="text-xs text-muted-foreground">
                              {paket ? formatRupiah(paket.harga) : "-"}
                            </p>
                          </td>
                          <td className="px-5 py-3 text-muted-foreground">
                            {slot
                              ? `${formatTanggal(slot.tanggal)} · ${formatJam(
                                  slot.jam_mulai,
                                )}–${formatJam(slot.jam_selesai)}`
                              : "-"}
                          </td>
                          <td className="px-5 py-3">
                            <StatusBadge status={booking.status} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-white p-5">
          <h2 className="font-display font-bold">Timeline follow-up</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Riwayat komunikasi terbaru ada di atas.
          </p>

          {followUps.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-border p-6 text-center">
              <p className="text-sm font-medium text-foreground">
                Belum ada follow-up
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Gunakan form di atas untuk mencatat komunikasi pertama.
              </p>
            </div>
          ) : (
            <ol className="mt-5 space-y-4">
              {followUps.map((followUp) => (
                <li
                  key={followUp.id}
                  className="border-l-2 border-primary/30 pl-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <time className="text-xs font-semibold text-foreground">
                      {formatTanggal(followUp.tgl)}
                    </time>
                    <FollowUpTypeBadge jenis={followUp.jenis} />
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                    {followUp.catatan || "Tidak ada catatan."}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
