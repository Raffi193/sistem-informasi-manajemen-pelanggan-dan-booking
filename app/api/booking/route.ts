import { NextResponse } from "next/server";
import { createAdminClient, isServiceConfigured } from "@/lib/supabase/admin";
import { isValidDateInput, todayInJakarta } from "@/lib/date";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Satu-satunya pintu masuk pembuatan booking.
 *
 * create_booking di database hanya di-grant ke service_role, sehingga client
 * tidak bisa memanggil RPC langsung dan melewati validasi/rate limit ini.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limited = rateLimit(`booking:${ip}`, 5, 10 * 60 * 1000);

  if (!limited.ok) {
    return NextResponse.json(
      {
        error: "RATE_LIMIT",
        message: "Terlalu banyak percobaan booking. Coba lagi beberapa menit.",
      },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfter) },
      },
    );
  }

  if (!isServiceConfigured) {
    return fail("Sistem booking belum dikonfigurasi di server.", 503);
  }

  if (!request.headers.get("content-type")?.includes("application/json")) {
    return fail("Format permintaan tidak valid.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("Data booking tidak valid.");
  }

  if (!body || typeof body !== "object") {
    return fail("Data booking tidak valid.");
  }

  const input = body as Record<string, unknown>;
  const nama = String(input.nama ?? "").trim();
  const noWa = String(input.no_wa ?? "").replace(/\D/g, "");
  const tanggalLahir = String(input.tanggal_lahir ?? "").trim();
  const alamat = String(input.alamat ?? "").trim();
  const paketId = String(input.paket_id ?? "").trim();
  const slotTemplateId = String(input.slot_template_id ?? "").trim();
  const tanggalLatihan = String(input.tanggal_latihan ?? "").trim();
  const today = todayInJakarta();

  if (nama.length < 2 || nama.length > 100) {
    return fail("Nama lengkap harus 2–100 karakter.");
  }
  if (!/^08\d{8,11}$/.test(noWa)) {
    return fail("Nomor WhatsApp tidak valid.");
  }
  if (!isValidDateInput(tanggalLahir) || tanggalLahir >= today) {
    return fail("Tanggal lahir tidak valid.");
  }
  if (!alamat || alamat.length > 500) {
    return fail("Alamat wajib diisi dan maksimal 500 karakter.");
  }
  if (!UUID_RE.test(paketId) || !UUID_RE.test(slotTemplateId)) {
    return fail("Paket atau jadwal tidak valid.");
  }
  if (!isValidDateInput(tanggalLatihan) || tanggalLatihan < today) {
    return fail("Tanggal latihan tidak valid.");
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("create_booking", {
    p_nama: nama,
    p_no_wa: noWa,
    p_tanggal_lahir: tanggalLahir,
    p_alamat: alamat,
    p_paket_id: paketId,
    p_slot_template_id: slotTemplateId,
    p_tanggal_latihan: tanggalLatihan,
  });

  if (error) {
    console.error("create_booking gagal:", error.message);
    return NextResponse.json({ error: error.message }, { status: 409 });
  }

  return NextResponse.json(data);
}
