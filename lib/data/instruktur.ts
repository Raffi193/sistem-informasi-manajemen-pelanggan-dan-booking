import { createClient } from "@supabase/supabase-js";
import { cacheLife } from "next/cache";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/config";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";

export type InstrukturPublik = {
  id: string;
  nama: string;
  foto_url: string | null;
  sertifikat_url: string | null;
};

/**
 * Instruktur aktif untuk landing page.
 *
 * Memakai anon client tanpa cookie agar halaman tetap bisa diprerender,
 * lalu di-cache karena data master jarang berubah.
 */
export async function getInstrukturAktif(): Promise<InstrukturPublik[]> {
  "use cache";
  cacheLife("hours");

  if (!isSupabaseConfigured) return [];

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from("instruktur")
    .select("id,nama,foto_url,sertifikat_url")
    .eq("status_aktif", true)
    .order("nama", { ascending: true });

  if (error) {
    console.error("Gagal memuat instruktur publik:", error.message);
    return [];
  }

  return (data ?? []) as InstrukturPublik[];
}
