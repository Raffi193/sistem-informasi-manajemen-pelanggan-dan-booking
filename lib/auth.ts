type AdminClaims =
  | {
      email?: unknown;
      app_metadata?: unknown;
    }
  | null
  | undefined;

/**
 * Admin ditentukan oleh app_metadata.role = "admin".
 *
 * ADMIN_EMAILS hanya fallback operasional (mis. saat metadata belum di-set).
 * Jangan mengandalkan email saja untuk produksi.
 */
export function isAdminClaims(claims: AdminClaims): boolean {
  if (!claims) return false;

  const metadata = claims.app_metadata;
  if (
    metadata &&
    typeof metadata === "object" &&
    "role" in metadata &&
    metadata.role === "admin"
  ) {
    return true;
  }

  const email =
    typeof claims.email === "string" ? claims.email.trim().toLowerCase() : "";
  if (!email) return false;

  const allowed = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return allowed.includes(email);
}
