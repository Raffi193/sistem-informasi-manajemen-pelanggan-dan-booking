import { NextResponse } from "next/server";
import { isAdminClaims } from "@/lib/auth";
import {
  FOTO_TYPES,
  INSTRUKTUR_BUCKET,
  MAX_INSTRUKTUR_MEDIA_BYTES,
  SERTIFIKAT_TYPES,
  isInstructorMediaKind,
  isValidInstructorMediaPath,
  mediaExtension,
} from "@/lib/instructor-media";
import { createAdminClient, isServiceConfigured } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (
    !user ||
    !isAdminClaims({ email: user.email, app_metadata: user.app_metadata })
  ) {
    return null;
  }

  return user;
}

export async function POST(request: Request) {
  if (!isServiceConfigured) {
    return fail("Upload media belum dikonfigurasi di server.", 503);
  }

  if (!(await requireAdmin())) {
    return fail("Tidak diizinkan.", 401);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return fail("Data upload tidak valid.", 400);
  }

  const kindValue = String(formData.get("kind") ?? "");
  const file = formData.get("file");

  if (!isInstructorMediaKind(kindValue)) {
    return fail("Jenis media tidak valid.", 400);
  }

  if (!(file instanceof File) || file.size === 0) {
    return fail("File belum dipilih.", 400);
  }

  if (file.size > MAX_INSTRUKTUR_MEDIA_BYTES) {
    return fail("Ukuran file maksimal 4 MB.", 413);
  }

  const allowedTypes =
    kindValue === "foto" ? FOTO_TYPES : SERTIFIKAT_TYPES;

  if (!allowedTypes.has(file.type)) {
    return fail(
      kindValue === "foto"
        ? "Format foto harus JPG, PNG, atau WEBP."
        : "Format sertifikat harus JPG, PNG, WEBP, atau PDF.",
      415,
    );
  }

  const admin = createAdminClient();
  const path = `${kindValue}/${Date.now()}-${crypto.randomUUID()}.${mediaExtension(file.type)}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error } = await admin.storage
    .from(INSTRUKTUR_BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: false });

  if (error) {
    console.error("Upload media instruktur gagal:", error.message);
    return fail("Gagal mengunggah media. Coba lagi.", 500);
  }

  const { data } = admin.storage.from(INSTRUKTUR_BUCKET).getPublicUrl(path);

  return NextResponse.json(
    { path, url: data.publicUrl },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function DELETE(request: Request) {
  if (!isServiceConfigured) {
    return fail("Upload media belum dikonfigurasi di server.", 503);
  }

  if (!(await requireAdmin())) {
    return fail("Tidak diizinkan.", 401);
  }

  const path = new URL(request.url).searchParams.get("path") ?? "";
  const kind = path.split("/")[0];

  if (
    !isInstructorMediaKind(kind) ||
    !isValidInstructorMediaPath(kind, path)
  ) {
    return fail("Path media tidak valid.", 400);
  }

  const admin = createAdminClient();
  const { error } = await admin.storage.from(INSTRUKTUR_BUCKET).remove([path]);

  if (error) {
    console.error("Hapus media instruktur gagal:", error.message);
    return fail("Gagal menghapus media. Coba lagi.", 500);
  }

  return NextResponse.json({ ok: true });
}
