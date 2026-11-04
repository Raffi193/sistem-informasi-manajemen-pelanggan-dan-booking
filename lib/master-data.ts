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

export const SLOT_STATUS_OPTIONS = [
  { value: "tersedia", label: "Tersedia" },
  { value: "penuh", label: "Penuh" },
  { value: "ditutup", label: "Ditutup" },
] as const;

export type SlotStatus = (typeof SLOT_STATUS_OPTIONS)[number]["value"];

export function isSlotStatus(value: string): value is SlotStatus {
  return SLOT_STATUS_OPTIONS.some((option) => option.value === value);
}

export const SLOT_SESI_OPTIONS = [
  { value: "reguler", label: "Reguler" },
  { value: "malam", label: "Malam" },
] as const;

export type SlotSesi = (typeof SLOT_SESI_OPTIONS)[number]["value"];

export function isSlotSesi(value: string): value is SlotSesi {
  return SLOT_SESI_OPTIONS.some((option) => option.value === value);
}

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
  status_aktif: boolean;
};

export type SlotRow = {
  id: string;
  tanggal: string;
  jam_mulai: string;
  jam_selesai: string;
  sesi: string;
  kendaraan_id: string | null;
  instruktur_id: string | null;
  status: SlotStatus;
  kendaraan_nama: string | null;
  kendaraan_plat: string | null;
  instruktur_nama: string | null;
};

export type MasterData = {
  paket: PaketRow[];
  kendaraan: KendaraanRow[];
  instruktur: InstrukturRow[];
  slot: SlotRow[];
};
