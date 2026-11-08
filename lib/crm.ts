export const CUSTOMER_STATUSES = [
  {
    value: "calon",
    label: "Calon",
    className: "bg-amber-100 text-amber-700 ring-amber-600/20",
  },
  {
    value: "aktif",
    label: "Aktif",
    className: "bg-blue-100 text-blue-700 ring-blue-600/20",
  },
  {
    value: "selesai",
    label: "Selesai",
    className: "bg-green-100 text-green-700 ring-green-600/20",
  },
  {
    value: "batal",
    label: "Batal",
    className: "bg-slate-100 text-slate-500 ring-slate-500/20",
  },
] as const;

export type CustomerStatusValue = (typeof CUSTOMER_STATUSES)[number]["value"];

export const CUSTOMER_STATUS_VALUES = CUSTOMER_STATUSES.map(
  (status) => status.value,
) as CustomerStatusValue[];

export function isCustomerStatus(value: string): value is CustomerStatusValue {
  return CUSTOMER_STATUSES.some((status) => status.value === value);
}

export function customerStatusLabel(value: string): string {
  return (
    CUSTOMER_STATUSES.find((status) => status.value === value)?.label ?? value
  );
}

export const FOLLOW_UP_TYPES = [
  {
    value: "whatsapp",
    label: "WhatsApp",
    className: "bg-green-100 text-green-700 ring-green-600/20",
  },
  {
    value: "telepon",
    label: "Telepon",
    className: "bg-blue-100 text-blue-700 ring-blue-600/20",
  },
  {
    value: "lainnya",
    label: "Lainnya",
    className: "bg-slate-100 text-slate-600 ring-slate-500/20",
  },
] as const;

export type FollowUpType = (typeof FOLLOW_UP_TYPES)[number]["value"];

export const FOLLOW_UP_TYPE_VALUES = FOLLOW_UP_TYPES.map(
  (type) => type.value,
) as FollowUpType[];

export function isFollowUpType(value: string): value is FollowUpType {
  return FOLLOW_UP_TYPES.some((type) => type.value === value);
}

export function followUpLabel(value: string | null): string {
  return (
    FOLLOW_UP_TYPES.find((type) => type.value === value)?.label ?? "Lainnya"
  );
}

export function followUpClassName(value: string | null): string {
  return (
    FOLLOW_UP_TYPES.find((type) => type.value === value)?.className ??
    "bg-slate-100 text-slate-600 ring-slate-500/20"
  );
}

/**
 * Normalisasi nomor WhatsApp ke format lokal 08xxxxxxxxxx.
 * Menerima 08..., +62..., 62..., atau 8... (tanpa awalan 0).
 */
export function normalizeWa(value: string): string {
  let digits = value.replace(/\D/g, "");

  if (digits.startsWith("62")) {
    digits = `0${digits.slice(2)}`;
  } else if (digits.startsWith("8")) {
    digits = `0${digits}`;
  }

  return digits;
}

export function isValidWa(value: string): boolean {
  return /^08\d{8,11}$/.test(normalizeWa(value));
}

export function waLink(noWa: string, message?: string): string {
  const normalized = normalizeWa(noWa);
  const number = `62${normalized.slice(1)}`;
  const query = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${number}${query}`;
}

export function isFollowUpStale(
  tgl: string | null,
  today: string,
  days = 7,
): boolean {
  if (!tgl) return true;

  const [year, month, day] = today.split("-").map(Number);
  const cutoff = new Date(Date.UTC(year, month - 1, day - days))
    .toISOString()
    .slice(0, 10);

  return tgl < cutoff;
}
