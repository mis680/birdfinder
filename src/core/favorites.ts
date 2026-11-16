/** Tolerant parse: corrupt JSON, wrong shapes and unknown ids never throw. */
export function parseFavorites(raw: string | null | undefined, validIds?: ReadonlySet<string>): Set<string> {
  if (!raw) return new Set();
  try {
    const v: unknown = JSON.parse(raw);
    if (!Array.isArray(v)) return new Set();
    return new Set(v.filter((x): x is string => typeof x === 'string' && (!validIds || validIds.has(x))));
  } catch {
    return new Set();
  }
}

export const serializeFavorites = (s: ReadonlySet<string>): string => JSON.stringify([...s]);

/** Immutable toggle (React-friendly). */
export function toggleFavorite(s: ReadonlySet<string>, id: string): Set<string> {
  const next = new Set(s);
  if (!next.delete(id)) next.add(id);
  return next;
}
