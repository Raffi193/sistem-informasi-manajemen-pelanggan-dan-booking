export const INSTRUKTUR_BUCKET = "instruktur";
export const MAX_INSTRUKTUR_MEDIA_BYTES = 4 * 1024 * 1024;

export const FOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
export const SERTIFIKAT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

export const MEDIA_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export type InstructorMediaKind = "foto" | "sertifikat";

export function mediaExtension(type: string) {
  return MEDIA_EXTENSIONS[type] ?? "bin";
}

export function isInstructorMediaKind(value: string): value is InstructorMediaKind {
  return value === "foto" || value === "sertifikat";
}

export function isValidInstructorMediaPath(
  kind: InstructorMediaKind,
  path: string,
) {
  if (!path || path.length > 300) return false;
  if (path.startsWith("/") || path.includes("..") || path.includes("\\")) {
    return false;
  }

  return path.startsWith(`${kind}/`);
}

export function storagePathFromPublicUrl(url: string | null) {
  if (!url) return null;

  const marker = `/storage/v1/object/public/${INSTRUKTUR_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index < 0) return null;

  try {
    return decodeURIComponent(url.slice(index + marker.length));
  } catch {
    return null;
  }
}
