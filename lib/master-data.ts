export const TRANSMISI_OPTIONS = [
  { value: "manual", label: "Manual" },
  { value: "matic", label: "Matic" },
  { value: "kombinasi", label: "Kombinasi" },
] as const;

export type Transmisi = (typeof TRANSMISI_OPTIONS)[number]["value"];

export function isTransmisi(value: string): value is Transmisi {
  return TRANSMISI_OPTIONS.some((option) => option.value === value);
}

export function transmisiLabel(value: string): string {
  return (
    TRANSMISI_OPTIONS.find((option) => option.value === value)?.label ?? value
  );
}

export const SLOT_CAPACITY_MAX = 4;

export type PaketRow = {
  id: string;
  nama: string;
  transmisi: Transmisi;
  jumlah_pertemuan: number;
  harga: number;
  keterangan: string | null;
  status_aktif: boolean;
};

export type KendaraanRow = {
  id: string;
  nama: string;
  plat: string | null;
  transmisi: Transmisi;
  status_aktif: boolean;
};

export type InstrukturRow = {
  id: string;
  nama: string;
  no_wa: string | null;
  foto_url: string | null;
  sertifikat_url: string | null;
  status_aktif: boolean;
};

export type SlotTemplateRow = {
  id: string;
  urutan: number;
  jam_mulai: string;
  jam_selesai: string;
  kapasitas: number;
  status_aktif: boolean;
};

export type MasterData = {
  paket: PaketRow[];
  kendaraan: KendaraanRow[];
  instruktur: InstrukturRow[];
  slotTemplate: SlotTemplateRow[];
};
