import { useCallback, useEffect, useState } from 'react';
import { parseFavorites, serializeFavorites, toggleFavorite } from './core/favorites.ts';
import { parseHash } from './core/route.ts';
import { buildCallPlan, DEFAULT_CALL } from './core/sound.ts';
import { histogram, type Hist } from './core/colorMatch.ts';
import { BIRDS, IDS, SOUNDS, asset } from './data/index.ts';
import type { Bird } from './core/types.ts';

const KEY = 'bf';

export function useFavorites() {
  const [favs, setFavs] = useState<Set<string>>(() => {
    try { return parseFavorites(localStorage.getItem(KEY), IDS); } catch { return new Set(); }
  });
  const toggle = useCallback((id: string) => {
    setFavs((cur) => {
      const next = toggleFavorite(cur, id);
      try { localStorage.setItem(KEY, serializeFavorites(next)); } catch { /* private mode / quota */ }
      return next;
    });
  }, []);
  return { favs, toggle };
}

export function useRoute() {
  const read = () => parseHash(location.hash, IDS);
  const [id, setId] = useState<string | null>(read);
  useEffect(() => {
    const on = () => setId(read());
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  }, []);
  const go = useCallback((next: string | null) => {
    const run = () => { location.hash = next ?? ''; setId(next); };
    const d = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    if (d.startViewTransition) d.startViewTransition(run); else run();
  }, []);
  return { id, go };
}

// ---- audio ----
let ctx: AudioContext | null = null;
export async function playCall(bird: Bird): Promise<number> {
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') await ctx.resume(); // iOS/Safari start suspended; legacy code stayed silent there
  const plan = buildCallPlan(SOUNDS[bird.id] ?? DEFAULT_CALL);
  const t0 = ctx.currentTime;
  for (const n of plan.notes) {
    const o = ctx.createOscillator(), g = ctx.createGain(), t = t0 + n.start;
    o.type = n.wave;
    o.frequency.setValueAtTime(n.f0, t);
    o.frequency.exponentialRampToValueAtTime(n.f1, t + (n.stop - n.start) * (1000 / 1500));
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(n.peak, t + n.attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + n.decayAt);
    o.connect(g).connect(ctx.destination);
    o.start(t); o.stop(t0 + n.stop);
  }
  return plan.durationMs;
}

// ---- photo -> histogram (canvas lives here, the maths lives in core/) ----
const SIZE = 48;
export function histFromImage(img: CanvasImageSource): Hist {
  const cv = document.createElement('canvas');
  cv.width = cv.height = SIZE;
  const c = cv.getContext('2d', { willReadFrequently: true })!;
  c.drawImage(img, 0, 0, SIZE, SIZE);
  return histogram(c.getImageData(0, 0, SIZE, SIZE).data, SIZE);
}

let cache: Promise<Map<string, Hist>> | null = null;
export function birdHistograms(): Promise<Map<string, Hist>> {
  cache ??= Promise.all(
    BIRDS.map(
      (b) =>
        new Promise<[string, Hist] | null>((ok) => {
          const i = new Image();
          i.onload = () => ok([b.id, histFromImage(i)]);
          i.onerror = () => ok(null);
          i.src = asset(b.image);
        }),
    ),
  ).then((rows) => new Map(rows.filter((r): r is [string, Hist] => r !== null)));
  return cache;
}
