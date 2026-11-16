import birdsJson from './birds.json';
import soundsJson from './sounds.json';
import type { Bird, CallSpec } from '../core/types.ts';

export const BIRDS = birdsJson as Bird[];
export const SOUNDS = soundsJson as Record<string, CallSpec>;
export const IDS: ReadonlySet<string> = new Set(BIRDS.map((b) => b.id));
/** Resolve a data path against Vite's base so it works on "/" and on "/repo-name/". */
export const asset = (p: string): string => import.meta.env.BASE_URL + p;
