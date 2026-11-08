export const JAKARTA_TIME_ZONE = "Asia/Jakarta";

function jakartaParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: JAKARTA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const pick = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    year: pick("year"),
    month: pick("month"),
    day: pick("day"),
  };
}

/** Tanggal hari ini di Asia/Jakarta dalam format YYYY-MM-DD. */
export function todayInJakarta(): string {
  const { year, month, day } = jakartaParts(new Date());
  return `${year}-${month}-${day}`;
}

/** Tanggal (YYYY-MM-DD) dari sebuah timestamp, dikonversi ke Asia/Jakarta. */
export function dateInJakarta(iso: string): string {
  const { year, month, day } = jakartaParts(new Date(iso));
  return `${year}-${month}-${day}`;
}

export function isValidDateInput(value: string | null | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/**
 * Hitung umur dari tanggal lahir (YYYY-MM-DD) berdasarkan tanggal hari ini
 * di Asia/Jakarta. Mengembalikan `null` jika tanggal tidak valid atau di masa depan.
 */
export function calculateAge(
  tanggalLahir: string | null | undefined,
  today = todayInJakarta(),
): number | null {
  if (!isValidDateInput(tanggalLahir) || !isValidDateInput(today)) {
    return null;
  }

  const [birthYear, birthMonth, birthDay] = tanggalLahir.split("-").map(Number);
  const [todayYear, todayMonth, todayDay] = today.split("-").map(Number);

  if (
    birthYear > todayYear ||
    (birthYear === todayYear && birthMonth > todayMonth) ||
    (birthYear === todayYear &&
      birthMonth === todayMonth &&
      birthDay > todayDay)
  ) {
    return null;
  }

  let age = todayYear - birthYear;

  if (
    todayMonth < birthMonth ||
    (todayMonth === birthMonth && todayDay < birthDay)
  ) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

export function addDays(value: string, days: number): string {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function firstDayOfMonth(value: string): string {
  return `${value.slice(0, 7)}-01`;
}

export function previousMonthRange(value: string) {
  const [year, month] = value.split("-").map(Number);
  const previousMonth = month === 1 ? 12 : month - 1;
  const previousYear = month === 1 ? year - 1 : year;
  const lastDay = new Date(Date.UTC(previousYear, previousMonth, 0)).getUTCDate();
  const monthText = String(previousMonth).padStart(2, "0");

  return {
    dari: `${previousYear}-${monthText}-01`,
    sampai: `${previousYear}-${monthText}-${String(lastDay).padStart(2, "0")}`,
  };
}

export function startOfDayIso(value: string): string {
  return `${value}T00:00:00+07:00`;
}

export function endOfDayIso(value: string): string {
  return `${value}T23:59:59.999+07:00`;
}

/** Format tanggal ISO / YYYY-MM-DD ke format Indonesia. */
export function formatTanggal(value: string, withTime = false): string {
  const date =
    value.length === 10
      ? new Date(`${value}T00:00:00+07:00`)
      : new Date(value);

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    timeZone: JAKARTA_TIME_ZONE,
  }).format(date);
}
