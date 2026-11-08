"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdminClaims } from "@/lib/auth";
import {
  createAdminClient,
  isServiceConfigured,
} from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/action-state";
import { isFollowUpType } from "@/lib/crm";
import { isValidDateInput } from "@/lib/date";

const BUKTI_BUCKET = "bukti-pembayaran";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function refreshCustomers(customerIds: string[]) {
  revalidatePath("/admin/customer");
  revalidatePath("/admin/booking");
  revalidatePath("/admin/laporan");
  revalidatePath("/admin/analitik");
  revalidatePath("/admin");

  for (const customerId of customerIds) {
    revalidatePath(`/admin/customer/${customerId}`);
  }
}

function safeReturnTo(value: string) {
  return value === "/admin/customer" || value.startsWith("/admin/customer?")
    ? value
    : "/admin/customer";
}

export async function createFollowUpAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await requireAdmin();

  const customerId = field(formData, "customer_id");
  const jenis = field(formData, "jenis");
  const tgl = field(formData, "tgl");
  const catatan = field(formData, "catatan");
  const fieldErrors: Record<string, string> = {};

  if (!UUID_RE.test(customerId)) {
    return { status: "error", message: "Customer tidak ditemukan." };
  }

  if (!isFollowUpType(jenis)) {
    fieldErrors.jenis = "Pilih jenis follow-up yang valid.";
  }

  if (!isValidDateInput(tgl)) {
    fieldErrors.tgl = "Isi tanggal follow-up yang valid.";
  }

  if (catatan.length < 3) {
    fieldErrors.catatan = "Catatan minimal 3 karakter.";
  } else if (catatan.length > 2000) {
    fieldErrors.catatan = "Catatan maksimal 2.000 karakter.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Periksa kembali data follow-up.",
      fieldErrors,
    };
  }

  const { error } = await supabase.from("follow_up").insert({
    customer_id: customerId,
    jenis,
    catatan,
    tgl,
  });

  if (error) {
    console.error("createFollowUpAction gagal:", error.message);
    return {
      status: "error",
      message: "Gagal menyimpan follow-up. Coba lagi.",
    };
  }

  refreshCustomers([customerId]);
  return { status: "success", message: "Follow-up berhasil dicatat." };
}

type DeleteResult =
  | { ok: true; deleted: number }
  | { ok: false; message: string };

/**
 * Hapus satu atau beberapa customer beserta booking, pembayaran, dan
 * follow-up terkait. Kuota jadwal otomatis terbuka karena booking ikut
 * terhapus. Bukti pembayaran di Storage juga dibersihkan bila service role
 * tersedia.
 */
async function deleteCustomers(
  supabase: Awaited<ReturnType<typeof createClient>>,
  customerIds: string[],
): Promise<DeleteResult> {
  const { data: bookings, error: bookingError } = await supabase
    .from("booking")
    .select("id")
    .in("customer_id", customerIds);

  if (bookingError) {
    console.error("deleteCustomers ambil booking gagal:", bookingError.message);
    return {
      ok: false,
      message: "Gagal memeriksa data booking customer. Coba lagi.",
    };
  }

  const bookingIds = (bookings ?? []).map((booking) => booking.id);

  let proofPaths: string[] = [];
  if (bookingIds.length > 0) {
    const { data: payments, error: paymentError } = await supabase
      .from("pembayaran")
      .select("bukti_file")
      .in("booking_id", bookingIds);

    if (paymentError) {
      console.error(
        "deleteCustomers ambil pembayaran gagal:",
        paymentError.message,
      );
      return {
        ok: false,
        message: "Gagal memeriksa bukti pembayaran customer. Coba lagi.",
      };
    }

    proofPaths = (payments ?? [])
      .map((payment) => payment.bukti_file)
      .filter((path): path is string => Boolean(path));
  }

  // Booking dan follow-up ikut terhapus lewat on delete cascade.
  const { data: deleted, error: deleteError } = await supabase
    .from("customer")
    .delete()
    .in("id", customerIds)
    .select("id");

  if (deleteError) {
    console.error("deleteCustomers gagal:", deleteError.message);
    return {
      ok: false,
      message: "Gagal menghapus customer. Coba lagi.",
    };
  }

  if (!deleted || deleted.length === 0) {
    return { ok: false, message: "Customer tidak ditemukan." };
  }

  if (proofPaths.length > 0 && isServiceConfigured) {
    const { error: storageError } = await createAdminClient()
      .storage.from(BUKTI_BUCKET)
      .remove(proofPaths);

    if (storageError) {
      console.error("deleteCustomers hapus bukti gagal:", storageError.message);
    }
  }

  return { ok: true, deleted: deleted.length };
}

/** Hapus satu customer dari halaman detail atau daftar customer. */
export async function deleteCustomerAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await requireAdmin();
  const customerId = field(formData, "customer_id");
  const returnTo = safeReturnTo(field(formData, "return_to"));

  if (!UUID_RE.test(customerId)) {
    return { status: "error", message: "Customer tidak ditemukan." };
  }

  const result = await deleteCustomers(supabase, [customerId]);

  if (!result.ok) {
    return { status: "error", message: result.message };
  }

  refreshCustomers([customerId]);
  redirect(returnTo);
}

/** Hapus beberapa customer sekaligus dari daftar customer. */
export async function deleteCustomersAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await requireAdmin();
  const returnTo = safeReturnTo(field(formData, "return_to"));
  const customerIds = Array.from(
    new Set(
      formData
        .getAll("customer_ids")
        .map((value) => String(value).trim())
        .filter(Boolean),
    ),
  );

  if (customerIds.length === 0) {
    return { status: "error", message: "Pilih minimal satu customer." };
  }

  if (customerIds.some((customerId) => !UUID_RE.test(customerId))) {
    return {
      status: "error",
      message: "Ada data customer yang tidak valid. Muat ulang halaman.",
    };
  }

  const result = await deleteCustomers(supabase, customerIds);

  if (!result.ok) {
    return { status: "error", message: result.message };
  }

  refreshCustomers(customerIds);
  redirect(returnTo);
}
