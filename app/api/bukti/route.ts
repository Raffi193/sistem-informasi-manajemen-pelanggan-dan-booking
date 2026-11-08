import { NextResponse } from "next/server";
import { createAdminClient, isServiceConfigured } from "@/lib/supabase/admin";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const BUCKET = "bukti-pembayaran";
const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function extensionFor(type: string) {
  if (type === "application/pdf") return "pdf";
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

/**
 * Unggah bukti pembayaran oleh guest.
 * Validasi identitas memakai kombinasi kode booking + nomor WhatsApp.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limited = rateLimit(`bukti:${ip}`, 10, 15 * 60 * 1000);

  if (!limited.ok) {
    return NextResponse.json(
      {
        error:
          "Terlalu banyak unggahan. Coba lagi beberapa menit atau kirim bukti lewat WhatsApp admin.",
      },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfter) },
      },
    );
  }

  if (!isServiceConfigured) {
    return fail("Unggah bukti belum dikonfigurasi di server.", 503);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("Data unggahan tidak valid.");
  }

  const kode = String(form.get("kode") ?? "").trim().toUpperCase();
  const noWa = String(form.get("no_wa") ?? "").replace(/\D/g, "");
  const jenis = String(form.get("jenis") ?? "dp");
  const jumlah = Number(form.get("jumlah") ?? 0);
  const file = form.get("file");

  if (!/^[A-Z0-9]{8}$/.test(kode)) {
    return fail("Kode booking tidak valid.");
  }
  if (!/^08\d{8,11}$/.test(noWa)) {
    return fail("Nomor WhatsApp tidak valid.");
  }
  if (jenis !== "dp" && jenis !== "pelunasan") {
    return fail("Jenis pembayaran tidak valid.");
  }
  if (!Number.isInteger(jumlah) || jumlah < 1000 || jumlah > 10_000_000) {
    return fail("Nominal transfer minimal Rp 1.000 dan maksimal Rp 10.000.000.");
  }
  if (!(file instanceof File) || file.size === 0) {
    return fail("Pilih file bukti pembayaran terlebih dahulu.");
  }
  if (file.size > MAX_BYTES) {
    return fail("Ukuran file maksimal 4 MB.");
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return fail("Format file harus JPG, PNG, WEBP, atau PDF.");
  }

  const admin = createAdminClient();

  const { data: booking, error: findError } = await admin
    .from("booking")
    .select("id,status,customer:customer_id(no_wa)")
    .eq("kode_booking", kode)
    .maybeSingle();

  if (findError) {
    console.error("Cek booking gagal:", findError.message);
    return fail("Gagal memeriksa booking. Coba lagi.", 500);
  }

  const customer = Array.isArray(booking?.customer)
    ? booking.customer[0]
    : booking?.customer;

  if (!booking || !customer || customer.no_wa !== noWa) {
    return fail(
      "Booking tidak ditemukan. Periksa kembali kode booking dan nomor WhatsApp.",
      404,
    );
  }

  if (booking.status === "menunggu_verifikasi") {
    return fail(
      "Bukti pembayaran sudah diunggah dan sedang menunggu verifikasi admin.",
      409,
    );
  }
  if (booking.status !== "menunggu_pembayaran") {
    return fail(
      "Booking ini tidak dapat menerima bukti pembayaran lagi. Silakan hubungi admin.",
      409,
    );
  }

  const path = `${booking.id}/${Date.now()}-${crypto.randomUUID()}.${extensionFor(file.type)}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: false });

  if (uploadError) {
    console.error("Upload bukti gagal:", uploadError.message);
    return fail("Gagal mengunggah file. Coba lagi.", 500);
  }

  const { data: rpc, error: rpcError } = await admin.rpc("submit_bukti", {
    p_kode: kode,
    p_no_wa: noWa,
    p_jenis: jenis,
    p_jumlah: jumlah,
    p_bukti_file: path,
  });

  if (rpcError) {
    await admin.storage.from(BUCKET).remove([path]);
    console.error("submit_bukti gagal:", rpcError.message);
    return fail("Gagal menyimpan bukti pembayaran. Coba lagi.", 500);
  }

  return NextResponse.json({
    ok: true,
    pembayaran_id: (rpc as { pembayaran_id?: string } | null)?.pembayaran_id,
  });
}
