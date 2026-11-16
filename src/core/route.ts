/** Hash routing that works on any static host with zero rewrite rules: "#indian-peafowl". */
export function parseHash(hash: string, validIds: ReadonlySet<string>): string | null {
  let id = hash.replace(/^#\/?/, '');
  try { id = decodeURIComponent(id); } catch { return null; }
  return validIds.has(id) ? id : null;
}
