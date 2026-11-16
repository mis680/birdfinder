import type { Bird } from './types.ts';

const norm = (s: string): string => s.normalize('NFC').toLowerCase();

export const haystack = (b: Bird): string =>
  norm([b.name, b.sci, b.family, b.hindi, b.desc].join(' '));

/** Split a query into lowercase terms; empty/whitespace -> []. */
export function terms(q: string): string[] {
  return norm(q).trim().split(/\s+/).filter(Boolean);
}

/** A term matches when it starts a word (space- or hyphen-separated) of the haystack. */
function termMatches(hay: string, term: string): boolean {
  return (' ' + hay).includes(' ' + term) || hay.includes('-' + term);
}

/** 3 = name starts with query, 2 = a name word starts with query, 1 = other field, 0 = no match. */
export function score(b: Bird, q: string): number {
  const ts = terms(q);
  if (ts.length === 0) return 1;
  const hay = haystack(b);
  if (!ts.every((t) => termMatches(hay, t))) return 0;
  const name = norm(b.name);
  const full = ts.join(' ');
  if (name.startsWith(full)) return 3;
  if (ts.every((t) => termMatches(name, t))) return 2;
  return 1;
}

/** Search birds. Empty query returns everything in original order. Ties keep original order (stable). */
export function find(birds: readonly Bird[], q: string): Bird[] {
  if (terms(q).length === 0) return [...birds];
  return birds
    .map((b, i) => ({ b, i, s: score(b, q) }))
    .filter((x) => x.s > 0)
    .sort((a, z) => z.s - a.s || a.i - z.i)
    .map((x) => x.b);
}

export interface Segment { text: string; hit: boolean }

/** Split text into highlighted / plain segments (first case-insensitive occurrence). UI escapes for us. */
export function highlight(text: string, q: string): Segment[] {
  const query = q.trim();
  if (!query) return [{ text, hit: false }];
  const i = norm(text).indexOf(norm(query));
  if (i < 0) return [{ text, hit: false }];
  const parts: Segment[] = [
    { text: text.slice(0, i), hit: false },
    { text: text.slice(i, i + query.length), hit: true },
    { text: text.slice(i + query.length), hit: false },
  ];
  return parts.filter((p) => p.text.length > 0);
}
