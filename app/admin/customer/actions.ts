"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/action-state";
import {
  isCustomerStatus,
  isFollowUpType,
  isValidWa,
  normalizeWa,
} from "@/lib/crm";
import { isValidDateInput } from "@/lib/date";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function refreshCustomer(customerId: string) {
  revalidatePath("/admin/customer");
  revalidatePath(`/admin/customer/${customerId}`);
  revalidatePath("/admin/booking");
  revalidatePath("/admin/laporan");
  revalidatePath("/admin");
}

export async function updateCustomerAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await requireAdmin();

  const id = field(formData, "id");
  const nama = field(formData, "nama");
  const noWa = normalizeWa(field(formData, "no_wa"));
  const alamat = field(formData, "alamat");
  const status = field(formData, "status");
  const fieldErrors: Record<string, string> = {};

  if (!UUID_RE.test(id)) {
    return { status: "error", message: "Customer tidak ditemukan." };
  }

  if (nama.length < 2) {
    fieldErrors.nama = "Nama minimal 2 karakter.";
  } else if (nama.length > 100) {
    fieldErrors.nama = "Nama maksimal 100 karakter.";
  }

  if (!isValidWa(noWa)) {
    fieldErrors.no_wa = "Gunakan nomor WhatsApp yang valid, mis. 081234567890.";
  }

  if (alamat.length > 500) {
    fieldErrors.alamat = "Alamat maksimal 500 karakter.";
  }

  if (!isCustomerStatus(status)) {
    fieldErrors.status = "Pilih status customer yang valid.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Periksa kembali data customer.",
      fieldErrors,
    };
  }

  const { data: duplicate } = await supabase
    .from("customer")
    .select("id")
    .eq("no_wa", noWa)
    .neq("id", id)
    .maybeSingle();

  if (duplicate) {
    return {
      status: "error",
      message: "Nomor WhatsApp sudah digunakan customer lain.",
      fieldErrors: {
        no_wa: "Nomor WhatsApp sudah terdaftar pada customer lain.",
      },
    };
  }

  const { error } = await supabase
    .from("customer")
    .update({
      nama,
      no_wa: noWa,
      alamat: alamat || null,
      status,
    })
    .eq("id", id);

  if (error) {
    console.error("updateCustomerAction gagal:", error.message);

    if (error.code === "23505") {
      return {
        status: "error",
        message: "Nomor WhatsApp sudah digunakan customer lain.",
        fieldErrors: {
          no_wa: "Nomor WhatsApp sudah terdaftar pada customer lain.",
        },
      };
    }

    return {
      status: "error",
      message: "Gagal menyimpan data customer. Coba lagi.",
    };
  }

  refreshCustomer(id);
  return { status: "success", message: "Data customer berhasil disimpan." };
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

  refreshCustomer(customerId);
  return { status: "success", message: "Follow-up berhasil dicatat." };
}
