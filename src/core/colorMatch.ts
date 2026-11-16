import type { Bird } from './types.ts';

export const BUCKETS = ['red', 'orange', 'yellow', 'green', 'blue', 'brown', 'dark', 'light'] as const;
export type Hist = number[];

export function hexToRgb(h: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

/** Map an RGB pixel to one of 8 coarse colour buckets (index into BUCKETS). */
export function bucket(r: number, g: number, b: number): number {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, l = (mx + mn) / 510;
  if (l > 0.82) return 7;
  if (l < 0.2) return 6;
  if (d < 28) return l < 0.5 ? 6 : 7;
  let h = mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h *= 60;
  if (l < 0.42 && h > 10 && h < 50) return 5;
  return h < 15 || h >= 330 ? 0 : h < 42 ? (l < 0.45 ? 5 : 1) : h < 70 ? 2 : h < 170 ? 3 : h < 260 ? 4 : 0;
}

export function colourName(hex: string): string {
  return BUCKETS[bucket(...hexToRgb(hex))];
}

export function normalize(v: number[]): number[] {
  const s = Math.hypot(...v) || 1;
  return v.map((x) => x / s);
}

/** Centre-weighted, saturation-weighted colour histogram of RGBA pixels (size x size, row-major). Pure. */
export function histogram(rgba: ArrayLike<number>, size: number): Hist {
  const v = Array<number>(8).fill(0);
  const half = (size - 1) / 2;
  for (let i = 0; i + 3 < rgba.length; i += 4) {
    const r = rgba[i], g = rgba[i + 1], b = rgba[i + 2];
    const k = bucket(r, g, b);
    const mx = Math.max(r, g, b);
    const s = mx ? (mx - Math.min(r, g, b)) / mx : 0;
    const p = i / 4;
    const dx = ((p % size) - half) / (size / 2);
    const dy = (Math.floor(p / size) - half) / (size / 2);
    const cw = Math.max(0.1, 1.5 - Math.hypot(dx, dy));
    v[k] += cw * (k === 6 ? 0.25 : k === 7 ? 0.05 : Math.max(0.03, s - 0.12));
  }
  return normalize(v);
}

export const cosine = (a: Hist, b: Hist): number => a.reduce((s, x, i) => s + x * b[i], 0);

export interface Match { bird: Bird; score: number }

export function rank(
  birds: readonly Bird[],
  hists: ReadonlyMap<string, Hist>,
  user: Hist,
  filename = '',
  top = 4,
): Match[] {
  // Normalise BOTH sides the same way. Legacy code only normalised the filename, so every
  // hyphenated name ("White-throated Kingfisher", "Rose-ringed Parakeet"...) could never match.
  const flat = (s: string) => s.toLowerCase().replace(/[-_.\s]+/g, ' ').trim();
  const f = flat(filename);
  return birds
    .map((bird) => {
      const h = hists.get(bird.id);
      let score = h ? cosine(user, h) : 0;
      if (f && f.includes(flat(bird.name))) score = 1;
      return { bird, score };
    })
    .sort((a, z) => z.score - a.score)
    .slice(0, top);
}

/**
 * Is the best match trustworthy enough to auto-open?
 * Legacy rule was score >= .9 alone; with 8 coarse buckets many birds score > .9, so that
 * opened wrong birds confidently. Now: exact filename hit, or very high score AND a clear margin.
 */
export function isConfident(matches: readonly Match[]): boolean {
  const [a, b] = matches;
  if (!a) return false;
  if (a.score >= 1) return true;
  return a.score >= 0.97 && (!b || a.score - b.score >= 0.03);
}
