/**
 * Hitung kemunculan nilai dari daftar yang sudah diketahui.
 * Semua nilai selalu muncul di hasil (0 bila belum ada) agar aman dipakai
 * untuk ringkasan status tanpa pengecekan tambahan.
 */
export function countValues<T extends string>(
  values: readonly T[],
  items: readonly string[],
): Record<T, number> {
  const counts = Object.fromEntries(values.map((value) => [value, 0])) as Record<
    T,
    number
  >;

  for (const item of items) {
    const key = item as T;
    if (key in counts) counts[key] += 1;
  }

  return counts;
}
