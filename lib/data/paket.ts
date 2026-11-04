import { createClient } from "@supabase/supabase-js";
import { cacheLife } from "next/cache";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/config";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";

export type PaketPublik = {
  id: string;
  nama: string;
  transmisi: string;
  jumlah_pertemuan: number;
  harga: number;
  keterangan: string | null;
};

/**
 * Paket aktif untuk halaman publik (landing).
 *
 * Sengaja memakai anon client tanpa cookie agar halaman tetap bisa
 * diprerender, lalu hasilnya di-cache beberapa jam karena data master
 * jarang berubah.
 */
export async function getPaketAktif(): Promise<PaketPublik[]> {
  "use cache";
  cacheLife("hours");

  if (!isSupabaseConfigured) return [];

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from("paket")
    .select("id,nama,transmisi,jumlah_pertemuan,harga,keterangan")
    .eq("status_aktif", true)
    .order("harga", { ascending: true })
    .order("nama", { ascending: true });

  if (error) {
    console.error("Gagal memuat paket publik:", error.message);
    return [];
  }

  return (data ?? []) as PaketPublik[];
}
