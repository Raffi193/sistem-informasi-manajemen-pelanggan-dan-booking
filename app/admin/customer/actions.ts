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
import {
  isCustomerStatus,
  isFollowUpType,
  isValidWa,
  normalizeWa,
} from "@/lib/crm";
import { isValidDateInput, todayInJakarta } from "@/lib/date";

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

type CustomerFormValues = {
  nama: string;
  noWa: string;
  noWaNormalized: string;
  alamat: string;
  tanggalLahir: string;
  status: string;
};

function validateCustomerForm(formData: FormData) {
  const nama = field(formData, "nama");
  const noWaRaw = field(formData, "no_wa");
  const noWaNormalized = normalizeWa(noWaRaw);
  const alamat = field(formData, "alamat");
  const tanggalLahir = field(formData, "tanggal_lahir");
  const status = field(formData, "status");
  const fieldErrors: Record<string, string> = {};

  if (nama.length < 2) {
    fieldErrors.nama = "Nama minimal 2 karakter.";
  } else if (nama.length > 120) {
    fieldErrors.nama = "Nama maksimal 120 karakter.";
  }

  if (!isValidWa(noWaRaw)) {
    fieldErrors.no_wa = "Nomor WhatsApp tidak valid. Gunakan format 08xxxxxxxxxx.";
  }

  if (alamat.length > 500) {
    fieldErrors.alamat = "Alamat maksimal 500 karakter.";
  }

  if (tanggalLahir && !isValidDateInput(tanggalLahir)) {
    fieldErrors.tanggal_lahir = "Tanggal lahir tidak valid.";
  } else if (tanggalLahir && tanggalLahir > todayInJakarta()) {
    fieldErrors.tanggal_lahir = "Tanggal lahir tidak boleh di masa depan.";
  }

  if (!isCustomerStatus(status)) {
    fieldErrors.status = "Pilih status customer yang valid.";
  }

  const values: CustomerFormValues = {
    nama,
    noWa: noWaRaw,
    noWaNormalized,
    alamat,
    tanggalLahir,
    status,
  };

  return { values, fieldErrors };
}

async function findCustomerByWa(
  supabase: Awaited<ReturnType<typeof createClient>>,
  noWa: string,
  excludeId?: string,
) {
  let query = supabase
    .from("customer")
    .select("id")
    .eq("no_wa", noWa)
    .limit(1);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    console.error("findCustomerByWa gagal:", error.message);
    return { exists: false, failed: true };
  }

  return { exists: Boolean(data), failed: false };
}

export async function createCustomerAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await requireAdmin();
  const { values, fieldErrors } = validateCustomerForm(formData);

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Periksa kembali data customer.",
      fieldErrors,
    };
  }

  const duplicate = await findCustomerByWa(supabase, values.noWaNormalized);
  if (duplicate.failed) {
    return {
      status: "error",
      message: "Gagal memeriksa nomor WhatsApp. Coba lagi.",
    };
  }
  if (duplicate.exists) {
    return {
      status: "error",
      message: "Nomor WhatsApp sudah terdaftar untuk customer lain.",
      fieldErrors: { no_wa: "Nomor WhatsApp sudah digunakan." },
    };
  }

  const { data, error } = await supabase
    .from("customer")
    .insert({
      nama: values.nama,
      no_wa: values.noWaNormalized,
      alamat: values.alamat || null,
      tanggal_lahir: values.tanggalLahir || null,
      status: values.status,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("createCustomerAction gagal:", error?.message);
    if (error?.code === "23505") {
      return {
        status: "error",
        message: "Nomor WhatsApp sudah terdaftar.",
        fieldErrors: { no_wa: "Nomor WhatsApp sudah digunakan." },
      };
    }
    return {
      status: "error",
      message: "Gagal menambahkan customer. Coba lagi.",
    };
  }

  refreshCustomers([]);
  redirect(`/admin/customer/${data.id}?created=1`);
}

export async function updateCustomerAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await requireAdmin();
  const customerId = field(formData, "customer_id");

  if (!UUID_RE.test(customerId)) {
    return { status: "error", message: "Customer tidak ditemukan." };
  }

  const { values, fieldErrors } = validateCustomerForm(formData);
  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Periksa kembali data customer.",
      fieldErrors,
    };
  }

  const duplicate = await findCustomerByWa(
    supabase,
    values.noWaNormalized,
    customerId,
  );
  if (duplicate.failed) {
    return {
      status: "error",
      message: "Gagal memeriksa nomor WhatsApp. Coba lagi.",
    };
  }
  if (duplicate.exists) {
    return {
      status: "error",
      message: "Nomor WhatsApp sudah digunakan customer lain.",
      fieldErrors: { no_wa: "Nomor WhatsApp sudah digunakan." },
    };
  }

  const { data, error } = await supabase
    .from("customer")
    .update({
      nama: values.nama,
      no_wa: values.noWaNormalized,
      alamat: values.alamat || null,
      tanggal_lahir: values.tanggalLahir || null,
      status: values.status,
    })
    .eq("id", customerId)
    .select("id")
    .single();

  if (error || !data) {
    console.error("updateCustomerAction gagal:", error?.message);
    if (error?.code === "23505") {
      return {
        status: "error",
        message: "Nomor WhatsApp sudah digunakan customer lain.",
        fieldErrors: { no_wa: "Nomor WhatsApp sudah digunakan." },
      };
    }
    return {
      status: "error",
      message: "Gagal memperbarui customer. Coba lagi.",
    };
  }

  refreshCustomers([customerId]);
  redirect(`/admin/customer/${customerId}?updated=1`);
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
