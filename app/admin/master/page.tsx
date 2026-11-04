import { connection } from "next/server";
import { AdminPageHeader } from "@/components/admin-page-header";
import { MasterDataManager } from "@/components/master-data-manager";
import { one, type Embed } from "@/lib/embed";
import {
  type InstrukturRow,
  type KendaraanRow,
  type MasterData,
  type PaketRow,
  type SlotRow,
  type SlotStatus,
} from "@/lib/master-data";
import { createClient } from "@/lib/supabase/server";

type SlotQueryRow = {
  id: string;
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
  sesi: string;
  kendaraan_id: string | null;
  instruktur_id: string | null;
  status: SlotStatus;
  kendaraan: Embed<{ nama: string; plat: string | null }>;
  instruktur: Embed<{ nama: string }>;
};

// Halaman master data selalu dirender saat request (sesi cookie).
export const instant = false;

export default async function MasterDataPage() {
  await connection();

  const supabase = await createClient();

  const [paketRes, kendaraanRes, instrukturRes, slotRes] = await Promise.all([
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
      .select("id,nama,no_wa,status_aktif")
      .order("nama", { ascending: true }),
    supabase
      .from("slot")
      .select(
        "id,tanggal,jam_mulai,jam_selesai,sesi,kendaraan_id,instruktur_id,status,kendaraan:kendaraan_id (nama, plat),instruktur:instruktur_id (nama)",
      )
      .order("tanggal", { ascending: false })
      .order("jam_mulai", { ascending: true })
      .limit(200),
  ]);

  const slotRows = (slotRes.data ?? []) as unknown as SlotQueryRow[];
  const slot: SlotRow[] = slotRows.map((row) => {
    const kendaraan = one(row.kendaraan);
    const instruktur = one(row.instruktur);

    return {
      id: row.id,
      tanggal: row.tanggal,
      jam_mulai: row.jam_mulai,
      jam_selesai: row.jam_selesai,
      sesi: row.sesi,
      kendaraan_id: row.kendaraan_id,
      instruktur_id: row.instruktur_id,
      status: row.status,
      kendaraan_nama: kendaraan?.nama ?? null,
      kendaraan_plat: kendaraan?.plat ?? null,
      instruktur_nama: instruktur?.nama ?? null,
    };
  });

  const data: MasterData = {
    paket: (paketRes.data ?? []) as PaketRow[],
    kendaraan: (kendaraanRes.data ?? []) as KendaraanRow[],
    instruktur: (instrukturRes.data ?? []) as InstrukturRow[],
    slot,
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Master Data"
        description="Kelola paket, kendaraan, instruktur, dan slot jadwal. Perubahan langsung tersedia di halaman booking."
      />

      <MasterDataManager data={data} />
    </div>
  );
}
