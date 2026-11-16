import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Bird, CallSpec } from '../src/core/types.ts';

const root = new URL('../', import.meta.url);
const json = <T>(p: string): T => JSON.parse(readFileSync(new URL(p, root), 'utf8')) as T;
export const birds = json<Bird[]>('src/data/birds.json');
export const sounds = json<Record<string, CallSpec>>('src/data/sounds.json');
export const publicPath = (p: string) => fileURLToPath(new URL('public/' + p, root));
export const byId = (id: string): Bird => {
  const b = birds.find((x) => x.id === id);
  if (!b) throw new Error('no bird ' + id);
  return b;
};
