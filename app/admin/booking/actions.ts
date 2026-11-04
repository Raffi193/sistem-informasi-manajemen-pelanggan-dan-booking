"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Tidak diizinkan.");
  }

  return supabase;
}

function refreshAdmin() {
  revalidatePath("/admin/booking");
  revalidatePath("/admin");
}

/**
 * Setujui atau tolak bukti pembayaran.
 * - Setuju: booking menjadi `disetujui`, pembayaran `terverifikasi`.
 * - Tolak: booking menjadi `ditolak`, pembayaran `ditolak`, slot dibebaskan.
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
    .select("id,status,slot_id")
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
  } else {
    const slotId = booking.slot_id;

    // Simpan informasi slot asal di catatan sebelum dilepas, agar riwayat
    // tetap terbaca meskipun slot sudah bisa dipesan ulang.
    let catatan = "Ditolak admin.";
    if (slotId) {
      const { data: slot } = await supabase
        .from("slot")
        .select("tanggal,jam_mulai,jam_selesai")
        .eq("id", slotId)
        .maybeSingle();

      if (slot) {
        catatan = `Ditolak admin. Slot asal: ${slot.tanggal} ${slot.jam_mulai.slice(0, 5)}–${slot.jam_selesai.slice(0, 5)}.`;
      }
    }

    // Lepas slot dari booking agar slot bisa dipesan ulang. Constraint unik
    // pada booking.slot_id akan menahan pemakaian ulang bila tidak dilepas.
    await supabase
      .from("booking")
      .update({ status: "ditolak", slot_id: null, catatan })
      .eq("id", bookingId);

    if (slotId) {
      await supabase
        .from("slot")
        .update({ status: "tersedia" })
        .eq("id", slotId);
    }

    await supabase
      .from("pembayaran")
      .update({ status_verifikasi: "ditolak" })
      .eq("booking_id", bookingId)
      .eq("status_verifikasi", "menunggu");
  }

  refreshAdmin();
}

/** Tandai booking yang sudah disetujui sebagai selesai. */
export async function markSelesaiAction(formData: FormData) {
  const supabase = await requireAdmin();
  const bookingId = String(formData.get("booking_id") ?? "");

  if (!bookingId) return;

  await supabase
    .from("booking")
    .update({ status: "selesai" })
    .eq("id", bookingId)
    .eq("status", "disetujui");

  refreshAdmin();
}

/**
 * Tandai booking sebagai no-show.
 * - Tanpa konfirmasi: sesi hangus (sisa_jam = 0).
 * - Dengan konfirmasi: kompensasi 1 jam (sisa_jam = 1).
 */
export async function markNoShowAction(formData: FormData) {
  const supabase = await requireAdmin();
  const bookingId = String(formData.get("booking_id") ?? "");
  const konfirmasi = formData.get("konfirmasi") === "ya";

  if (!bookingId) return;

  const { data: booking } = await supabase
    .from("booking")
    .select("id,status")
    .eq("id", bookingId)
    .maybeSingle();

  if (!booking || booking.status !== "disetujui") return;

  const { error } = await supabase.rpc("mark_no_show", {
    p_booking_id: bookingId,
    p_konfirmasi: konfirmasi,
  });

  if (error) {
    console.error("mark_no_show gagal:", error.message);
    return;
  }

  refreshAdmin();
}
