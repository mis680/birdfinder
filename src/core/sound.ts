import type { CallSpec, CallMode } from './types.ts';

export interface Note {
  /** seconds from start */
  start: number;
  /** seconds */
  stop: number;
  wave: 'square' | 'sine';
  f0: number;
  f1: number;
  peak: number;
  /** seconds from note start where gain is back to ~0 */
  decayAt: number;
  attack: number;
}

export interface CallPlan { notes: Note[]; durationMs: number }

export const DEFAULT_CALL: CallSpec = { hz: 2500, count: 3, gapMs: 150, mode: 'u' };

export function isCallSpec(x: unknown): x is CallSpec {
  if (typeof x !== 'object' || x === null) return false;
  const s = x as Record<string, unknown>;
  const pos = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v > 0;
  return pos(s.hz) && Number.isInteger(s.count) && (s.count as number) > 0 && pos(s.gapMs) &&
    (s.mode === 'u' || s.mode === 'd' || s.mode === 't');
}

const peakFor = (m: CallMode): number => (m === 't' ? 0.05 : 0.16);

/** Pure description of the synthesised call; the UI just schedules these on a WebAudio context. */
export function buildCallPlan(spec: CallSpec): CallPlan {
  const notes: Note[] = [];
  for (let i = 0; i < spec.count; i++) {
    const start = (i * spec.gapMs) / 1000;
    notes.push({
      start,
      stop: start + spec.gapMs / 1000,
      wave: spec.mode === 't' ? 'square' : 'sine',
      f0: spec.hz,
      f1: spec.mode === 'u' ? spec.hz * 1.5 : spec.hz * 0.6,
      peak: peakFor(spec.mode),
      attack: 0.02,
      decayAt: spec.gapMs / 1200,
    });
  }
  return { notes, durationMs: spec.count * spec.gapMs };
}
