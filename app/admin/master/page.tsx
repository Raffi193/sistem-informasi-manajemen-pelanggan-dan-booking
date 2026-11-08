import { connection } from "next/server";
import { AdminPageHeader } from "@/components/admin-page-header";
import { MasterDataManager } from "@/components/master-data-manager";
import {
  type InstrukturRow,
  type KendaraanRow,
  type MasterData,
  type PaketRow,
  type SlotTemplateRow,
} from "@/lib/master-data";
import { createClient } from "@/lib/supabase/server";

// Halaman master data selalu dirender saat request (sesi cookie).
export const instant = false;

export default async function MasterDataPage() {
  await connection();

  const supabase = await createClient();

  const [paketRes, kendaraanRes, instrukturRes, slotTemplateRes] =
    await Promise.all([
      supabase
        .from("paket")
        .select(
          "id,nama,transmisi,jumlah_pertemuan,harga,keterangan,status_aktif",
        )
        .order("harga", { ascending: true }),
      supabase
        .from("kendaraan")
        .select("id,nama,plat,transmisi,status_aktif")
        .order("nama", { ascending: true }),
      supabase
        .from("instruktur")
        .select("id,nama,no_wa,foto_url,sertifikat_url,status_aktif")
        .order("nama", { ascending: true }),
      supabase
        .from("slot_template")
        .select("id,urutan,jam_mulai,jam_selesai,kapasitas,status_aktif")
        .order("jam_mulai", { ascending: true })
        .order("jam_selesai", { ascending: true }),
    ]);

  const data: MasterData = {
    paket: (paketRes.data ?? []) as PaketRow[],
    kendaraan: (kendaraanRes.data ?? []) as KendaraanRow[],
    instruktur: (instrukturRes.data ?? []) as InstrukturRow[],
    slotTemplate: (slotTemplateRes.data ?? []) as SlotTemplateRow[],
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Master Data"
        description="Kelola paket, kendaraan, instruktur, dan jadwal kursus. Perubahan langsung tersedia di halaman booking."
      />

      <MasterDataManager data={data} />
    </div>
  );
}
