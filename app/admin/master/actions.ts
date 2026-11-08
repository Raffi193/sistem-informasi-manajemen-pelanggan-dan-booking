"use server";

import { revalidatePath } from "next/cache";
import { isAdminClaims } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  createAdminClient,
  isServiceConfigured,
} from "@/lib/supabase/admin";
import type { ActionState } from "@/lib/action-state";
import { isValidWa, normalizeWa } from "@/lib/crm";
import { isTransmisi, SLOT_CAPACITY_MAX } from "@/lib/master-data";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/;

const INSTRUKTUR_BUCKET = "instruktur";
const MAX_INSTRUKTUR_MEDIA_BYTES = 4 * 1024 * 1024;
// Vercel membatasi body request serverless sekitar 4,5 MB. Batasi total
// foto + sertifikat agar multipart tidak melewati batas platform.
const MAX_INSTRUKTUR_TOTAL_BYTES = 4 * 1024 * 1024;
const FOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const SERTIFIKAT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);
const MEDIA_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

type AdminClient = ReturnType<typeof createAdminClient>;

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

function normalizeTime(value: string) {
  const match = TIME_RE.exec(value);
  return match ? `${match[1]}:${match[2]}` : null;
}

function refreshMaster() {
  revalidatePath("/admin/master");
  revalidatePath("/admin/analitik");
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/booking");
}

function readFile(formData: FormData, key: string) {
  const value = formData.get(key);
  return value instanceof File && value.size > 0 ? value : null;
}

function readChecked(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function mediaExtension(type: string) {
  return MEDIA_EXTENSIONS[type] ?? "bin";
}

function storagePathFromPublicUrl(url: string | null) {
  if (!url) return null;

  const marker = `/storage/v1/object/public/${INSTRUKTUR_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index < 0) return null;

  return decodeURIComponent(url.slice(index + marker.length));
}

async function uploadInstructorMedia(
  admin: AdminClient,
  file: File,
  kind: "foto" | "sertifikat",
) {
  const path = `${kind}/${Date.now()}-${crypto.randomUUID()}.${mediaExtension(file.type)}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error } = await admin.storage
    .from(INSTRUKTUR_BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: false });

  if (error) throw new Error(error.message);

  const { data } = admin.storage.from(INSTRUKTUR_BUCKET).getPublicUrl(path);
  return { path, url: data.publicUrl };
}

async function removeInstructorMedia(
  admin: AdminClient,
  paths: Array<string | null>,
) {
  const uniquePaths = [...new Set(paths.filter((path): path is string => Boolean(path)))];
  if (uniquePaths.length === 0) return;

  const { error } = await admin.storage
    .from(INSTRUKTUR_BUCKET)
    .remove(uniquePaths);

  if (error) {
    console.error("Hapus media instruktur gagal:", error.message);
  }
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
  const foto = readFile(formData, "foto");
  const sertifikat = readFile(formData, "sertifikat");
  const hapusFoto = readChecked(formData, "hapus_foto");
  const hapusSertifikat = readChecked(formData, "hapus_sertifikat");
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

  if (foto) {
    if (foto.size > MAX_INSTRUKTUR_MEDIA_BYTES) {
      fieldErrors.foto = "Ukuran foto maksimal 4 MB.";
    } else if (!FOTO_TYPES.has(foto.type)) {
      fieldErrors.foto = "Format foto harus JPG, PNG, atau WEBP.";
    }
  }

  if (sertifikat) {
    if (sertifikat.size > MAX_INSTRUKTUR_MEDIA_BYTES) {
      fieldErrors.sertifikat = "Ukuran sertifikat maksimal 4 MB.";
    } else if (!SERTIFIKAT_TYPES.has(sertifikat.type)) {
      fieldErrors.sertifikat =
        "Format sertifikat harus JPG, PNG, WEBP, atau PDF.";
    }
  }

  const totalMediaBytes = (foto?.size ?? 0) + (sertifikat?.size ?? 0);
  if (totalMediaBytes > MAX_INSTRUKTUR_TOTAL_BYTES) {
    const message =
      "Total ukuran foto dan sertifikat maksimal 4 MB. Unggah satu file terlebih dahulu, lalu edit lagi untuk file kedua.";
    if (foto) fieldErrors.foto = message;
    if (sertifikat) fieldErrors.sertifikat = message;
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Periksa kembali data instruktur.",
      fieldErrors,
    };
  }

  const needsStorage = Boolean(
    foto || sertifikat || hapusFoto || hapusSertifikat,
  );

  if (needsStorage && !isServiceConfigured) {
    return actionError("Upload media belum dikonfigurasi di server.");
  }

  const storage = needsStorage ? createAdminClient() : null;

  let oldFotoUrl: string | null = null;
  let oldSertifikatUrl: string | null = null;

  if (isEdit) {
    const { data: current, error: currentError } = await supabase
      .from("instruktur")
      .select("foto_url,sertifikat_url")
      .eq("id", id)
      .maybeSingle();

    if (currentError) {
      console.error("Ambil media instruktur gagal:", currentError.message);
      return actionError("Gagal memuat data instruktur. Coba lagi.");
    }

    if (!current) {
      return actionError("Instruktur tidak ditemukan.");
    }

    oldFotoUrl = current.foto_url;
    oldSertifikatUrl = current.sertifikat_url;
  }

  const uploadedPaths: string[] = [];
  let fotoUrl = oldFotoUrl;
  let sertifikatUrl = oldSertifikatUrl;

  try {
    if (foto) {
      if (!storage) throw new Error("Storage belum dikonfigurasi.");
      const uploaded = await uploadInstructorMedia(storage, foto, "foto");
      uploadedPaths.push(uploaded.path);
      fotoUrl = uploaded.url;
    } else if (hapusFoto) {
      fotoUrl = null;
    }

    if (sertifikat) {
      if (!storage) throw new Error("Storage belum dikonfigurasi.");
      const uploaded = await uploadInstructorMedia(
        storage,
        sertifikat,
        "sertifikat",
      );
      uploadedPaths.push(uploaded.path);
      sertifikatUrl = uploaded.url;
    } else if (hapusSertifikat) {
      sertifikatUrl = null;
    }
  } catch (error) {
    if (storage) await removeInstructorMedia(storage, uploadedPaths);
    console.error("Upload media instruktur gagal:", error);
    return actionError("Gagal mengunggah media. Coba lagi.");
  }

  const payload = {
    nama,
    no_wa: noWa || null,
    foto_url: fotoUrl,
    sertifikat_url: sertifikatUrl,
    status_aktif: statusAktif,
  };

  const query = isEdit
    ? supabase.from("instruktur").update(payload).eq("id", id)
    : supabase.from("instruktur").insert(payload);
  const { error } = await query;

  if (error) {
    if (storage) await removeInstructorMedia(storage, uploadedPaths);
    console.error("saveInstrukturAction gagal:", error.message);
    return {
      status: "error",
      message: "Gagal menyimpan instruktur. Coba lagi.",
    };
  }

  if (storage) {
    await removeInstructorMedia(storage, [
      foto || hapusFoto ? storagePathFromPublicUrl(oldFotoUrl) : null,
      sertifikat || hapusSertifikat
        ? storagePathFromPublicUrl(oldSertifikatUrl)
        : null,
    ]);
  }

  refreshMaster();
  return {
    status: "success",
    message: isEdit
      ? "Instruktur berhasil diperbarui."
      : "Instruktur berhasil ditambahkan.",
  };
}

export async function saveSlotTemplateAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await requireAdmin();

  const id = field(formData, "id");
  const jamMulai = normalizeTime(field(formData, "jam_mulai"));
  const jamSelesai = normalizeTime(field(formData, "jam_selesai"));
  const kapasitas = Number(field(formData, "kapasitas"));
  const statusAktif = readChecked(formData, "status_aktif");
  const isEdit = Boolean(id);
  const fieldErrors: Record<string, string> = {};

  if (isEdit && !UUID_RE.test(id)) {
    return { status: "error", message: "Jadwal tidak ditemukan." };
  }

  if (!jamMulai) {
    fieldErrors.jam_mulai = "Jam mulai tidak valid.";
  }

  if (!jamSelesai) {
    fieldErrors.jam_selesai = "Jam selesai tidak valid.";
  }

  if (jamMulai && jamSelesai && jamMulai >= jamSelesai) {
    fieldErrors.jam_selesai = "Jam selesai harus setelah jam mulai.";
  }

  if (
    !Number.isInteger(kapasitas) ||
    kapasitas < 1 ||
    kapasitas > SLOT_CAPACITY_MAX
  ) {
    fieldErrors.kapasitas = `Isi kapasitas 1–${SLOT_CAPACITY_MAX} orang.`;
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Periksa kembali jadwal latihan.",
      fieldErrors,
    };
  }

  const jamMulaiValue = jamMulai as string;
  const jamSelesaiValue = jamSelesai as string;

  let duplicateQuery = supabase
    .from("slot_template")
    .select("id")
    .eq("jam_mulai", jamMulaiValue)
    .eq("jam_selesai", jamSelesaiValue);

  if (isEdit) {
    duplicateQuery = duplicateQuery.neq("id", id);
  }

  const { data: duplicate, error: duplicateError } =
    await duplicateQuery.maybeSingle();

  if (duplicateError) {
    console.error(
      "saveSlotTemplateAction cek duplikat gagal:",
      duplicateError.message,
    );
    return {
      status: "error",
      message: "Gagal memeriksa jadwal. Coba lagi.",
    };
  }

  if (duplicate) {
    return {
      status: "error",
      message: "Jam latihan tersebut sudah ada.",
      fieldErrors: {
        jam_mulai: "Gunakan jam yang belum terdaftar.",
      },
    };
  }

  const payload = {
    jam_mulai: jamMulaiValue,
    jam_selesai: jamSelesaiValue,
    kapasitas,
    status_aktif: statusAktif,
  };

  const query = isEdit
    ? supabase.from("slot_template").update(payload).eq("id", id)
    : supabase.from("slot_template").insert({ ...payload, urutan: 0 });
  const { data: saved, error } = await query.select("id").maybeSingle();

  if (error) {
    console.error("saveSlotTemplateAction gagal:", error.message);

    if (error.code === "23505") {
      return {
        status: "error",
        message: "Jam latihan tersebut sudah ada.",
        fieldErrors: {
          jam_mulai: "Gunakan jam yang belum terdaftar.",
        },
      };
    }

    return {
      status: "error",
      message: "Gagal menyimpan jadwal latihan. Coba lagi.",
    };
  }

  if (!saved) {
    return { status: "error", message: "Jadwal tidak ditemukan." };
  }

  refreshMaster();
  return {
    status: "success",
    message: isEdit
      ? "Jadwal latihan berhasil diperbarui."
      : "Jadwal latihan berhasil ditambahkan.",
  };
}

export async function deleteSlotTemplateAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await requireAdmin();
  const id = field(formData, "id");

  if (!UUID_RE.test(id)) {
    return { status: "error", message: "Jadwal tidak ditemukan." };
  }

  const { count, error: countError } = await supabase
    .from("booking")
    .select("id", { count: "exact", head: true })
    .eq("slot_template_id", id);

  if (countError) {
    console.error(
      "deleteSlotTemplateAction cek booking gagal:",
      countError.message,
    );
    return {
      status: "error",
      message: "Gagal memeriksa keterkaitan jadwal. Coba lagi.",
    };
  }

  if ((count ?? 0) > 0) {
    return actionError(
      "Jam latihan sudah dipakai booking. Nonaktifkan jam ini agar tidak muncul di halaman booking.",
    );
  }

  const { error } = await supabase.from("slot_template").delete().eq("id", id);

  if (error) {
    console.error("deleteSlotTemplateAction gagal:", error.message);

    if (error.code === "23503") {
      return actionError(
        "Jam latihan sudah dipakai booking sehingga tidak dapat dihapus.",
      );
    }

    return {
      status: "error",
      message: "Gagal menghapus jadwal latihan. Coba lagi.",
    };
  }

  refreshMaster();
  return { status: "success", message: "Jadwal latihan berhasil dihapus." };
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
