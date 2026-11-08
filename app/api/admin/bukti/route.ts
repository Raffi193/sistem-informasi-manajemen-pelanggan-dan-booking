import { NextResponse } from "next/server";
import { isAdminClaims } from "@/lib/auth";
import { createAdminClient, isServiceConfigured } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "bukti-pembayaran";

/**
 * Menampilkan file bukti pembayaran hanya untuk admin yang sudah login.
 * File diambil lewat service role agar bucket tetap privat.
 */
export async function GET(request: Request) {
  if (!isServiceConfigured) {
    return new NextResponse("Belum dikonfigurasi", { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (
    !user ||
    !isAdminClaims({
      email: user.email,
      app_metadata: user.app_metadata,
    })
  ) {
    return new NextResponse("Tidak diizinkan", { status: 401 });
  }

  const path = new URL(request.url).searchParams.get("path") ?? "";

  if (!path || path.startsWith("/") || path.includes("..")) {
    return new NextResponse("Path tidak valid", { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(BUCKET).download(path);

  if (error || !data) {
    return new NextResponse("File tidak ditemukan", { status: 404 });
  }

  const filename = path.split("/").pop() ?? "bukti";
  const headers = new Headers({
    "Content-Type": data.type || "application/octet-stream",
    "Content-Disposition": `inline; filename="${filename.replace(/"/g, "")}"`,
    "Cache-Control": "private, no-store",
  });

  return new NextResponse(data, { headers });
}
