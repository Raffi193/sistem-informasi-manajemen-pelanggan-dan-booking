type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export type RateLimitResult =
  | { ok: true; remaining: number; resetAt: number }
  | { ok: false; retryAfter: number; resetAt: number };

/**
 * Rate limit in-memory sederhana.
 *
 * Catatan: di Vercel, memori tidak dibagi antar instance. Ini bukan pengganti
 * Vercel Firewall / WAF, tetapi mencegah penyalahgunaan berulang dari satu
 * instance. Untuk produksi dengan trafik tinggi, gunakan Upstash Redis atau
 * Vercel Firewall.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  if (buckets.size > 5000) cleanupRateLimits();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { ok: true, remaining: limit - 1, resetAt };
  }

  if (current.count >= limit) {
    return {
      ok: false,
      retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
      resetAt: current.resetAt,
    };
  }

  current.count += 1;
  return {
    ok: true,
    remaining: limit - current.count,
    resetAt: current.resetAt,
  };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

// Bersihkan entri kedaluwarsa agar Map tidak tumbuh tanpa batas.
export function cleanupRateLimits() {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}
