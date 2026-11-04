"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/action-state";
import { isValidWa, normalizeWa } from "@/lib/crm";
import { isValidDateInput } from "@/lib/date";
import {
  isSlotSesi,
  isSlotStatus,
  isTransmisi,
  type SlotStatus,
} from "@/lib/master-data";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;

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

function refreshMaster() {
  revalidatePath("/admin/master");
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/booking");
}

function normalizeTime(value: string) {
  return value.length === 5 ? `${value}:00` : value;
}

function readStatusAktif(formData: FormData) {
  return formData.get("status_aktif") === "on";
}

function actionError(message: string): ActionState {
  return { status: "error", message };
}

export async function savePaketAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await requireAdmin();

  const id = field(formData, "id");
  const nama = field(formData, "nama");
  const transmisi = field(formData, "transmisi");
  const jumlahPertemuan = Number(field(formData, "jumlah_pertemuan"));
  const harga = Number(field(formData, "harga"));
  const keterangan = field(formData, "keterangan");
  const statusAktif = readStatusAktif(formData);
  const isEdit = Boolean(id);
  const fieldErrors: Record<string, string> = {};

  if (isEdit && !UUID_RE.test(id)) {
    return { status: "error", message: "Paket tidak ditemukan." };
  }

  if (nama.length < 2) {
    fieldErrors.nama = "Nama paket minimal 2 karakter.";
  } else if (nama.length > 100) {
    fieldErrors.nama = "Nama paket maksimal 100 karakter.";
  }

  if (!isTransmisi(transmisi)) {
    fieldErrors.transmisi = "Pilih transmisi yang valid.";
  }

  if (
    !Number.isInteger(jumlahPertemuan) ||
    jumlahPertemuan < 1 ||
    jumlahPertemuan > 100
  ) {
    fieldErrors.jumlah_pertemuan = "Jumlah pertemuan harus 1–100.";
  }

  if (!Number.isInteger(harga) || harga < 10_000 || harga > 100_000_000) {
    fieldErrors.harga = "Harga harus antara Rp 10.000 dan Rp 100.000.000.";
  }

  if (keterangan.length > 1000) {
    fieldErrors.keterangan = "Keterangan maksimal 1.000 karakter.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Periksa kembali data paket.",
      fieldErrors,
    };
  }

  const payload = {
    nama,
    transmisi,
    jumlah_pertemuan: jumlahPertemuan,
    harga,
    keterangan: keterangan || null,
    status_aktif: statusAktif,
  };

  const query = isEdit
    ? supabase.from("paket").update(payload).eq("id", id)
    : supabase.from("paket").insert(payload);
  const { error } = await query;

  if (error) {
    console.error("savePaketAction gagal:", error.message);
    return {
      status: "error",
      message: "Gagal menyimpan paket. Coba lagi.",
    };
  }

  refreshMaster();
  return {
    status: "success",
    message: isEdit
      ? "Paket berhasil diperbarui."
      : "Paket berhasil ditambahkan.",
  };
}

export async function saveKendaraanAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await requireAdmin();

  const id = field(formData, "id");
  const nama = field(formData, "nama");
  const plat = field(formData, "plat").toUpperCase();
  const transmisi = field(formData, "transmisi");
  const statusAktif = readStatusAktif(formData);
  const isEdit = Boolean(id);
  const fieldErrors: Record<string, string> = {};

  if (isEdit && !UUID_RE.test(id)) {
    return { status: "error", message: "Kendaraan tidak ditemukan." };
  }

  if (nama.length < 2) {
    fieldErrors.nama = "Nama kendaraan minimal 2 karakter.";
  } else if (nama.length > 100) {
    fieldErrors.nama = "Nama kendaraan maksimal 100 karakter.";
  }

  if (plat.length > 20) {
    fieldErrors.plat = "Nomor plat maksimal 20 karakter.";
  }

  if (!isTransmisi(transmisi)) {
    fieldErrors.transmisi = "Pilih transmisi yang valid.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Periksa kembali data kendaraan.",
      fieldErrors,
    };
  }

  const payload = {
    nama,
    plat: plat || null,
    transmisi,
    status_aktif: statusAktif,
  };

  const query = isEdit
    ? supabase.from("kendaraan").update(payload).eq("id", id)
    : supabase.from("kendaraan").insert(payload);
  const { error } = await query;

  if (error) {
    console.error("saveKendaraanAction gagal:", error.message);
    return {
      status: "error",
      message: "Gagal menyimpan kendaraan. Coba lagi.",
    };
  }

  refreshMaster();
  return {
    status: "success",
    message: isEdit
      ? "Kendaraan berhasil diperbarui."
      : "Kendaraan berhasil ditambahkan.",
  };
}

export async function saveInstrukturAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await requireAdmin();

  const id = field(formData, "id");
  const nama = field(formData, "nama");
  const noWa = normalizeWa(field(formData, "no_wa"));
  const statusAktif = readStatusAktif(formData);
  const isEdit = Boolean(id);
  const fieldErrors: Record<string, string> = {};

  if (isEdit && !UUID_RE.test(id)) {
    return { status: "error", message: "Instruktur tidak ditemukan." };
  }

  if (nama.length < 2) {
    fieldErrors.nama = "Nama instruktur minimal 2 karakter.";
  } else if (nama.length > 100) {
    fieldErrors.nama = "Nama instruktur maksimal 100 karakter.";
  }

  if (noWa && !isValidWa(noWa)) {
    fieldErrors.no_wa = "Gunakan nomor WhatsApp yang valid, mis. 081234567890.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Periksa kembali data instruktur.",
      fieldErrors,
    };
  }

  const payload = {
    nama,
    no_wa: noWa || null,
    status_aktif: statusAktif,
  };

  const query = isEdit
    ? supabase.from("instruktur").update(payload).eq("id", id)
    : supabase.from("instruktur").insert(payload);
  const { error } = await query;

  if (error) {
    console.error("saveInstrukturAction gagal:", error.message);
    return {
      status: "error",
      message: "Gagal menyimpan instruktur. Coba lagi.",
    };
  }

  refreshMaster();
  return {
    status: "success",
    message: isEdit
      ? "Instruktur berhasil diperbarui."
      : "Instruktur berhasil ditambahkan.",
  };
}

export async function saveSlotAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await requireAdmin();

  const id = field(formData, "id");
  const tanggal = field(formData, "tanggal");
  const jamMulai = field(formData, "jam_mulai");
  const jamSelesai = field(formData, "jam_selesai");
  const sesi = field(formData, "sesi");
  const kendaraanId = field(formData, "kendaraan_id");
  const instrukturId = field(formData, "instruktur_id");
  const status = field(formData, "status");
  const isEdit = Boolean(id);
  const fieldErrors: Record<string, string> = {};

  if (isEdit && !UUID_RE.test(id)) {
    return { status: "error", message: "Slot tidak ditemukan." };
  }

  if (!isValidDateInput(tanggal)) {
    fieldErrors.tanggal = "Isi tanggal yang valid.";
  }

  if (!TIME_RE.test(jamMulai)) {
    fieldErrors.jam_mulai = "Isi jam mulai yang valid.";
  }

  if (!TIME_RE.test(jamSelesai)) {
    fieldErrors.jam_selesai = "Isi jam selesai yang valid.";
  }

  if (
    !fieldErrors.jam_mulai &&
    !fieldErrors.jam_selesai &&
    jamMulai >= jamSelesai
  ) {
    fieldErrors.jam_selesai = "Jam selesai harus setelah jam mulai.";
  }

  if (!isSlotSesi(sesi)) {
    fieldErrors.sesi = "Pilih sesi yang valid.";
  }

  if (!isSlotStatus(status)) {
    fieldErrors.status = "Pilih status slot yang valid.";
  }

  if (kendaraanId && !UUID_RE.test(kendaraanId)) {
    fieldErrors.kendaraan_id = "Kendaraan yang dipilih tidak valid.";
  }

  if (instrukturId && !UUID_RE.test(instrukturId)) {
    fieldErrors.instruktur_id = "Instruktur yang dipilih tidak valid.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Periksa kembali data slot.",
      fieldErrors,
    };
  }

  if (isEdit) {
    const { data: booking, error: bookingError } = await supabase
      .from("booking")
      .select("id")
      .eq("slot_id", id)
      .maybeSingle();

    if (bookingError) {
      console.error("saveSlotAction cek booking gagal:", bookingError.message);
      return {
        status: "error",
        message: "Gagal memeriksa keterkaitan slot. Coba lagi.",
      };
    }

    if (booking && status === "tersedia") {
      return {
        status: "error",
        message: "Slot sudah memiliki booking dan tidak dapat dibuka kembali.",
        fieldErrors: {
          status: "Slot ini sudah dipakai booking. Pilih status penuh atau ditutup.",
        },
      };
    }
  }

  const payload = {
    tanggal,
    jam_mulai: normalizeTime(jamMulai),
    jam_selesai: normalizeTime(jamSelesai),
    sesi,
    kendaraan_id: kendaraanId || null,
    instruktur_id: instrukturId || null,
    status: status as SlotStatus,
  };

  const query = isEdit
    ? supabase.from("slot").update(payload).eq("id", id)
    : supabase.from("slot").insert(payload);
  const { error } = await query;

  if (error) {
    console.error("saveSlotAction gagal:", error.message);

    if (error.code === "23503") {
      return {
        status: "error",
        message: "Kendaraan atau instruktur yang dipilih tidak ditemukan.",
      };
    }

    return {
      status: "error",
      message: "Gagal menyimpan slot. Coba lagi.",
    };
  }

  refreshMaster();
  return {
    status: "success",
    message: isEdit
      ? "Slot berhasil diperbarui."
      : "Slot berhasil ditambahkan.",
  };
}

export async function deletePaketAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await requireAdmin();
  const id = field(formData, "id");

  if (!UUID_RE.test(id)) {
    return { status: "error", message: "Paket tidak ditemukan." };
  }

  const { count, error: countError } = await supabase
    .from("booking")
    .select("id", { count: "exact", head: true })
    .eq("paket_id", id);

  if (countError) {
    console.error("deletePaketAction cek booking gagal:", countError.message);
    return {
      status: "error",
      message: "Gagal memeriksa keterkaitan paket. Coba lagi.",
    };
  }

  if ((count ?? 0) > 0) {
    return actionError(
      "Paket sudah dipakai pada booking. Nonaktifkan paket agar tidak muncul di halaman booking.",
    );
  }

  const { error } = await supabase.from("paket").delete().eq("id", id);

  if (error) {
    console.error("deletePaketAction gagal:", error.message);
    return {
      status: "error",
      message: "Gagal menghapus paket. Coba lagi.",
    };
  }

  refreshMaster();
  return { status: "success", message: "Paket berhasil dihapus." };
}

export async function deleteKendaraanAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await requireAdmin();
  const id = field(formData, "id");

  if (!UUID_RE.test(id)) {
    return { status: "error", message: "Kendaraan tidak ditemukan." };
  }

  const { count, error: countError } = await supabase
    .from("slot")
    .select("id", { count: "exact", head: true })
    .eq("kendaraan_id", id);

  if (countError) {
    console.error(
      "deleteKendaraanAction cek slot gagal:",
      countError.message,
    );
    return {
      status: "error",
      message: "Gagal memeriksa keterkaitan kendaraan. Coba lagi.",
    };
  }

  if ((count ?? 0) > 0) {
    return actionError(
      "Kendaraan masih dipakai pada slot jadwal. Lepaskan dari slot terlebih dahulu.",
    );
  }

  const { error } = await supabase.from("kendaraan").delete().eq("id", id);

  if (error) {
    console.error("deleteKendaraanAction gagal:", error.message);
    return {
      status: "error",
      message: "Gagal menghapus kendaraan. Coba lagi.",
    };
  }

  refreshMaster();
  return { status: "success", message: "Kendaraan berhasil dihapus." };
}

export async function deleteInstrukturAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await requireAdmin();
  const id = field(formData, "id");

  if (!UUID_RE.test(id)) {
    return { status: "error", message: "Instruktur tidak ditemukan." };
  }

  const { count, error: countError } = await supabase
    .from("slot")
    .select("id", { count: "exact", head: true })
    .eq("instruktur_id", id);

  if (countError) {
    console.error(
      "deleteInstrukturAction cek slot gagal:",
      countError.message,
    );
    return {
      status: "error",
      message: "Gagal memeriksa keterkaitan instruktur. Coba lagi.",
    };
  }

  if ((count ?? 0) > 0) {
    return actionError(
      "Instruktur masih dipakai pada slot jadwal. Lepaskan dari slot terlebih dahulu.",
    );
  }

  const { error } = await supabase.from("instruktur").delete().eq("id", id);

  if (error) {
    console.error("deleteInstrukturAction gagal:", error.message);
    return {
      status: "error",
      message: "Gagal menghapus instruktur. Coba lagi.",
    };
  }

  refreshMaster();
  return { status: "success", message: "Instruktur berhasil dihapus." };
}

export async function deleteSlotAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await requireAdmin();
  const id = field(formData, "id");

  if (!UUID_RE.test(id)) {
    return { status: "error", message: "Slot tidak ditemukan." };
  }

  const { count, error: countError } = await supabase
    .from("booking")
    .select("id", { count: "exact", head: true })
    .eq("slot_id", id);

  if (countError) {
    console.error("deleteSlotAction cek booking gagal:", countError.message);
    return {
      status: "error",
      message: "Gagal memeriksa keterkaitan slot. Coba lagi.",
    };
  }

  if ((count ?? 0) > 0) {
    return actionError(
      "Slot sudah memiliki booking. Batalkan booking atau tutup slot sebagai gantinya.",
    );
  }

  const { error } = await supabase.from("slot").delete().eq("id", id);

  if (error) {
    console.error("deleteSlotAction gagal:", error.message);
    return {
      status: "error",
      message: "Gagal menghapus slot. Coba lagi.",
    };
  }

  refreshMaster();
  return { status: "success", message: "Slot berhasil dihapus." };
}
