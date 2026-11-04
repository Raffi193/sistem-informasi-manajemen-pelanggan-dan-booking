import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./config";

const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();

/**
 * Service role hanya boleh dipakai di server (route handler / server action).
 * Jangan pernah mengimpor file ini dari Client Component.
 */
export const isServiceConfigured =
  /^https?:\/\/.+/i.test(supabaseUrl) && serviceKey.length > 0;

export function createAdminClient() {
  if (!isServiceConfigured) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY belum diatur di .env.local");
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
