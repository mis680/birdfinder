import type { Bird, CallSpec } from './types.ts';
import { isCallSpec } from './sound.ts';

export interface Report { errors: string[]; warnings: string[] }

/** Data-integrity checks. Everything here is a hard error unless noted. */
export function validateData(
  birds: readonly Bird[],
  sounds: Readonly<Record<string, CallSpec>>,
  expected = { birds: 40, sounds: 40 },
): Report {
  const errors: string[] = [], warnings: string[] = [];
  if (birds.length !== expected.birds) errors.push(`expected ${expected.birds} birds, got ${birds.length}`);
  const ids = new Set<string>();
  for (const b of birds) {
    if (ids.has(b.id)) errors.push(`duplicate id ${b.id}`);
    ids.add(b.id);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(b.id)) errors.push(`${b.id}: id must be kebab-case`);
    for (const k of ['name', 'sci', 'family', 'hindi', 'desc', 'image'] as const) {
      if (!b[k] || !b[k].trim()) errors.push(`${b.id}: missing ${k}`);
    }
    if (!/^#[0-9a-f]{6}$/i.test(b.tc)) errors.push(`${b.id}: bad theme colour ${b.tc}`);
    if (!/^[A-Z][a-z]+ [a-z]+$/.test(b.sci)) errors.push(`${b.id}: scientific name format "${b.sci}"`);
    if (!/^[A-Z][a-z]+idae$/.test(b.family)) errors.push(`${b.id}: family format "${b.family}"`);
    if (b.image !== `birds/${b.id}.jpg`) errors.push(`${b.id}: image path should be birds/${b.id}.jpg`);
    try {
      const u = new URL(b.more);
      if (u.protocol === 'http:') warnings.push(`${b.id}: link is not https (${u.host})`);
      else if (u.protocol !== 'https:') errors.push(`${b.id}: bad link protocol`);
    } catch { errors.push(`${b.id}: invalid link`); }
  }
  const soundIds = Object.keys(sounds);
  if (soundIds.length !== expected.sounds) errors.push(`expected ${expected.sounds} sounds, got ${soundIds.length}`);
  for (const b of birds) if (!sounds[b.id]) errors.push(`${b.id}: no sound entry`);
  for (const id of soundIds) {
    if (!ids.has(id)) errors.push(`sound entry for unknown bird ${id}`);
    else if (!isCallSpec(sounds[id])) errors.push(`${id}: invalid sound params`);
  }
  return { errors, warnings };
}

/** Image-file checks given file name -> bytes. JPEG magic number + size budget. */
export function validateImages(
  birds: readonly Bird[],
  files: ReadonlyMap<string, Uint8Array>,
  budgetBytes = 1_100_000,
): Report {
  const errors: string[] = [];
  let total = 0;
  for (const b of birds) {
    const buf = files.get(b.image);
    if (!buf) { errors.push(`${b.id}: image file missing`); continue; }
    total += buf.length;
    if (!(buf[0] === 0xff && buf[1] === 0xd8 && buf[buf.length - 2] === 0xff && buf[buf.length - 1] === 0xd9)) {
      errors.push(`${b.id}: not a complete JPEG`);
    }
  }
  if (total > budgetBytes) errors.push(`total image size ${total} exceeds budget ${budgetBytes}`);
  return { errors, warnings: [] };
}
