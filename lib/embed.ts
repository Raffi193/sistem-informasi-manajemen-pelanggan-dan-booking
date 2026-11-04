/** Supabase dapat mengembalikan relasi tunggal sebagai objek atau array. */
export type Embed<T> = T | T[] | null;

export function one<T>(value: Embed<T>): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export function many<T>(value: Embed<T>): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}
