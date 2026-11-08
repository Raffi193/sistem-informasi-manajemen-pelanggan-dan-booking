"use server";

import { revalidatePath } from "next/cache";
import { isAdminClaims } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (
    !user ||
    !isAdminClaims({ email: user.email, app_metadata: user.app_metadata })
  ) {
    throw new Error("Tidak diizinkan.");
  }

  return supabase;
}

function refreshAdmin(customerId?: string | null) {
  revalidatePath("/admin/booking");
  revalidatePath("/admin/customer");
  revalidatePath("/admin/laporan");
  revalidatePath("/admin/analitik");
  revalidatePath("/admin");

  if (customerId) {
    revalidatePath(`/admin/customer/${customerId}`);
  }
}

async function updateCustomerStatus(
  supabase: Awaited<ReturnType<typeof createClient>>,
  customerId: string | null | undefined,
  status: "aktif" | "selesai",
) {
  if (!customerId) return;

  const { error } = await supabase
    .from("customer")
    .update({ status })
    .eq("id", customerId);

  if (error) {
    console.error("updateCustomerStatus gagal:", error.message);
  }
}

/**
 * Setujui atau tolak bukti pembayaran.
 * - Setuju: booking menjadi `disetujui`, pembayaran `terverifikasi`.
 * - Tolak: booking menjadi `ditolak`, pembayaran `ditolak`, kuota jadwal
 *   otomatis terbuka karena status ditolak tidak dihitung sebagai pemakaian.
 */
export async function verifyBookingAction(formData: FormData) {
  const supabase = await requireAdmin();

  const bookingId = String(formData.get("booking_id") ?? "");
  const decision = String(formData.get("decision") ?? "");

  if (!bookingId || (decision !== "approve" && decision !== "reject")) {
    return;
  }

  const { data: booking } = await supabase
    .from("booking")
    .select("id,status,slot_template_id,tanggal_latihan,customer_id")
    .eq("id", bookingId)
    .maybeSingle();

  // Hanya booking yang sedang menunggu verifikasi yang boleh diproses.
  if (!booking || booking.status !== "menunggu_verifikasi") {
    return;
  }

  if (decision === "approve") {
    await supabase
      .from("booking")
      .update({ status: "disetujui" })
      .eq("id", bookingId);

    await supabase
      .from("pembayaran")
      .update({ status_verifikasi: "terverifikasi" })
      .eq("booking_id", bookingId)
      .eq("status_verifikasi", "menunggu");

    // Booking disetujui berarti customer sedang aktif menjalani kursus.
    await updateCustomerStatus(supabase, booking.customer_id, "aktif");
  } else {
    // Simpan informasi jadwal asal di catatan agar riwayat tetap terbaca.
    let catatan = "Ditolak admin.";
    if (booking.slot_template_id && booking.tanggal_latihan) {
      const { data: jadwal } = await supabase
        .from("slot_template")
        .select("jam_mulai,jam_selesai")
        .eq("id", booking.slot_template_id)
        .maybeSingle();

      if (jadwal) {
        catatan = `Ditolak admin. Jadwal asal: ${booking.tanggal_latihan} ${jadwal.jam_mulai.slice(0, 5)}–${jadwal.jam_selesai.slice(0, 5)}.`;
      }
    }

    // Jadwal tidak perlu dilepas dari booking. Kapasitas dihitung dari status
    // booking, sehingga status `ditolak` otomatis membebaskan kuota.
    await supabase
      .from("booking")
      .update({ status: "ditolak", catatan })
      .eq("id", bookingId);

    await supabase
      .from("pembayaran")
      .update({ status_verifikasi: "ditolak" })
      .eq("booking_id", bookingId)
      .eq("status_verifikasi", "menunggu");

    // Booking ditolak hanya mengubah status booking. Status customer tidak
    // dijadikan "batal" karena customer tetap bisa melakukan booking lain.
  }

  refreshAdmin(booking.customer_id);
}

/** Tandai booking yang sudah disetujui sebagai selesai. */
export async function markSelesaiAction(formData: FormData) {
  const supabase = await requireAdmin();
  const bookingId = String(formData.get("booking_id") ?? "");

  if (!bookingId) return;

  const { data: booking } = await supabase
    .from("booking")
    .select("id,status,customer_id")
    .eq("id", bookingId)
    .maybeSingle();

  if (!booking || booking.status !== "disetujui") return;

  const { error } = await supabase
    .from("booking")
    .update({ status: "selesai" })
    .eq("id", bookingId)
    .eq("status", "disetujui");

  if (error) {
    console.error("markSelesaiAction gagal:", error.message);
    return;
  }

  // Masa kursus selesai, jadi status customer menjadi selesai.
  await updateCustomerStatus(supabase, booking.customer_id, "selesai");
  refreshAdmin(booking.customer_id);
}
