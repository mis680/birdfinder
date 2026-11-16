import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { birds, sounds, publicPath } from './helpers.ts';
import { validateData, validateImages } from '../src/core/validate.ts';

test('40 birds, 40 sound entries, zero data errors', () => {
  assert.equal(birds.length, 40);
  assert.equal(Object.keys(sounds).length, 40);
  const r = validateData(birds, sounds);
  assert.deepEqual(r.errors, []);
});

test('40 photo files, valid JPEGs, ~972 KB total', () => {
  const files = new Map(birds.map((b) => [b.image, readFileSync(publicPath(b.image))]));
  assert.equal(files.size, 40);
  const total = [...files.values()].reduce((n, b) => n + b.length, 0);
  assert.deepEqual(validateImages(birds, files).errors, []);
  assert.ok(Math.abs(total / 1024 - 972.8) < 1, `total KiB ${(total / 1024).toFixed(1)}`);
});

test('regression: Indian Cormorant is not filed under kingfishers', () => {
  const c = birds.find((b) => b.id === 'indian-cormorant')!;
  assert.equal(c.family, 'Phalacrocoracidae');
  assert.equal(birds.filter((b) => b.family === 'Alcedinidae').length, 1);
});

test('validator catches broken data', () => {
  const bad = structuredClone(birds);
  bad[1].id = bad[0].id; bad[2].tc = 'red'; bad[3].more = 'ftp://x'; 
  const r = validateData(bad, sounds);
  assert.ok(r.errors.some((e) => e.includes('duplicate id')));
  assert.ok(r.errors.some((e) => e.includes('bad theme colour')));
  assert.ok(r.errors.some((e) => e.includes('bad link protocol')));
  assert.ok(validateData(birds.slice(1), sounds).errors.some((e) => e.includes('expected 40 birds')));
});

test('http links are reported as warnings (known legacy issue), never silently ignored', () => {
  const r = validateData(birds, sounds);
  assert.equal(r.warnings.filter((w) => w.includes('not https')).length, 25);
});
