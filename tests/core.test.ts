import { test } from 'node:test';
import assert from 'node:assert/strict';
import { birds, sounds } from './helpers.ts';
import { parseFavorites, serializeFavorites, toggleFavorite } from '../src/core/favorites.ts';
import { parseHash } from '../src/core/route.ts';
import { buildCallPlan, isCallSpec, DEFAULT_CALL } from '../src/core/sound.ts';
import { bucket, histogram, rank, isConfident, cosine, colourName, type Hist } from '../src/core/colorMatch.ts';

const ids = new Set(birds.map((b) => b.id));

test('favorites: tolerant parse, immutable toggle, roundtrip', () => {
  assert.equal(parseFavorites('not json').size, 0);
  assert.equal(parseFavorites('{"a":1}').size, 0);
  assert.equal(parseFavorites(null).size, 0);
  assert.deepEqual([...parseFavorites('["asian-koel",5,"ghost"]', ids)], ['asian-koel']);
  const a = new Set<string>();
  const b = toggleFavorite(a, 'asian-koel');
  assert.equal(a.size, 0); assert.ok(b.has('asian-koel'));
  assert.ok(!toggleFavorite(b, 'asian-koel').has('asian-koel'));
  assert.deepEqual([...parseFavorites(serializeFavorites(b))], ['asian-koel']);
});

test('route: valid, empty, unknown, malformed', () => {
  assert.equal(parseHash('#asian-koel', ids), 'asian-koel');
  assert.equal(parseHash('#/asian-koel', ids), 'asian-koel');
  assert.equal(parseHash('', ids), null);
  assert.equal(parseHash('#nope', ids), null);
  assert.equal(parseHash('#%E0%A4%A', ids), null);
});

test('sound: every bird has a valid, audible, bounded plan', () => {
  for (const b of birds) {
    const s = sounds[b.id];
    assert.ok(isCallSpec(s), b.id);
    const p = buildCallPlan(s);
    assert.equal(p.notes.length, s.count);
    assert.equal(p.durationMs, s.count * s.gapMs);
    assert.ok(p.durationMs < 2500, `${b.id} too long`);
    for (const n of p.notes) {
      assert.ok(n.decayAt > n.attack, `${b.id}: decay must come after attack`);
      assert.ok(n.f0 > 0 && n.f1 > 0 && n.f0 < 20000 && n.f1 < 20000, `${b.id}: freq range`);
      assert.ok(n.peak > 0 && n.peak <= 0.2);
    }
  }
  assert.equal(isCallSpec({ hz: -1, count: 2, gapMs: 100, mode: 'u' }), false);
  assert.equal(isCallSpec({ hz: 1, count: 1.5, gapMs: 100, mode: 'u' }), false);
  assert.equal(isCallSpec(null), false);
  assert.equal(buildCallPlan(DEFAULT_CALL).notes.length, 3);
});

test('color: buckets', () => {
  assert.equal(bucket(255, 255, 255), 7);
  assert.equal(bucket(5, 5, 5), 6);
  assert.equal(bucket(200, 30, 30), 0);
  assert.equal(bucket(30, 180, 40), 3);
  assert.equal(bucket(30, 60, 220), 4);
  assert.equal(bucket(230, 200, 20), 2);
  assert.equal(colourName('#0870a1'), 'blue');
});

const solid = (r: number, g: number, b: number, n = 48): number[] => Array.from({ length: n * n }, () => [r, g, b, 255]).flat();

test('color: histogram is unit-length; identical images score ~1; different colours score low', () => {
  const g = histogram(solid(30, 180, 40), 48), g2 = histogram(solid(35, 175, 45), 48), r = histogram(solid(200, 30, 30), 48);
  assert.ok(Math.abs(Math.hypot(...g) - 1) < 1e-9);
  assert.ok(cosine(g, g2) > 0.99);
  assert.ok(cosine(g, r) < 0.1);
});

test('rank + confidence: filename wins; near-ties are NOT confident (regression vs legacy >=.9 rule)', () => {
  const [A, B, C] = birds;
  const hists = new Map<string, Hist>([[A.id, [1, 0, 0, 0, 0, 0, 0, 0]], [B.id, [0.95, 0.31, 0, 0, 0, 0, 0, 0]], [C.id, [0, 1, 0, 0, 0, 0, 0, 0]]]);
  const user: Hist = [1, 0.1, 0, 0, 0, 0, 0, 0].map((x) => x / Math.hypot(1, 0.1));
  const m = rank([A, B, C], hists, user);
  assert.ok(m[0].score >= 0.9 && m[1].score >= 0.9, 'both pass the old 0.9 rule');
  assert.equal(isConfident(m), false);
  const byName = rank([A, B, C], hists, user, `my-${B.name.replace(/ /g, '_')}.jpg`);
  assert.equal(byName[0].bird.id, B.id);
  assert.equal(isConfident(byName), true);
  assert.equal(isConfident([]), false);
});

test('regression: every bird (incl. hyphenated names) is matched by its own filename', () => {
  const hists = new Map<string, Hist>();
  const user: Hist = [1, 0, 0, 0, 0, 0, 0, 0];
  for (const b of birds) {
    const m = rank(birds, hists, user, `IMG_${b.name.replace(/ /g, '_')}_001.JPG`);
    assert.equal(m[0].bird.id, b.id, b.name);
    assert.equal(m[0].score, 1);
  }
});
