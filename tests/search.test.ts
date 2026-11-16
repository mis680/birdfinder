import { test } from 'node:test';
import assert from 'node:assert/strict';
import { birds } from './helpers.ts';
import { find, highlight, terms } from '../src/core/search.ts';
import { predicateFor } from '../src/core/filters.ts';

const names = (q: string) => find(birds, q).map((b) => b.name);

test('empty query returns all 40 in original order', () => {
  assert.equal(find(birds, '').length, 40);
  assert.equal(find(birds, '   ')[0].id, birds[0].id);
});
test('name prefix ranks first; case-insensitive', () => {
  assert.equal(names('INDIAN peafowl')[0], 'Indian Peafowl');
  assert.equal(names('kingf')[0], 'White-throated Kingfisher');
});
test('hindi name and scientific name searchable', () => {
  assert.deepEqual(names('कोयल'), ['Asian Koel']);
  assert.ok(names('pavo').includes('Indian Peafowl'));
});
test('multi-term is AND; garbage gives none', () => {
  assert.ok(names('indian roller').includes('Indian Roller'));
  assert.deepEqual(names('zzzz qqq'), []);
});
test('stable: equal scores keep original order', () => {
  const r = find(birds, 'accipitridae').map((b) => b.id);
  const orig = birds.filter((b) => b.family === 'Accipitridae').map((b) => b.id);
  assert.deepEqual(r.sort(), orig.sort());
});
test('highlight splits safely, no HTML involved', () => {
  assert.deepEqual(highlight('Grey Heron', 'her'), [{ text: 'Grey ', hit: false }, { text: 'Her', hit: true }, { text: 'on', hit: false }]);
  assert.deepEqual(highlight('<b>x</b>', 'zzz'), [{ text: '<b>x</b>', hit: false }]);
  assert.deepEqual(terms('  a   b '), ['a', 'b']);
});
test('filters: sensible, non-empty, no false positives from substrings', () => {
  const none = new Set<string>();
  const pick = (k: any) => birds.filter(predicateFor(k, none)).map((b) => b.id);
  assert.equal(pick('all').length, 40);
  assert.ok(pick('water').includes('white-throated-kingfisher'));
  assert.ok(pick('water').includes('indian-cormorant'));
  assert.ok(!pick('water').includes('indian-peafowl'));
  assert.ok(pick('sing').length > 0 && pick('yard').length > 0);
  assert.deepEqual(birds.filter(predicateFor('saved', new Set(['asian-koel']))).map((b) => b.id), ['asian-koel']);
});
