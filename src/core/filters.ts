import type { Bird, FilterKey } from './types.ts';

// Word-boundary regexes: the legacy /sing/ also matched "single", /call/ matched "recall", etc.
const SING = /\b(sing(s|ing)?|songs?|songster|melod(y|ies|ious)|whistl(e|es|ing)|vocal(ist|ises|izes)?|calls?|calling)\b/i;
const WATER = /\b(water|waters|fish|fishes|fishing|kingfisher|cormorant|dive|dives|diving|wetlands?|rivers?|lakes?|ponds?|marsh(es)?|shore(s|line)?)\b/i;
const YARD = /\b(gardens?|city|cities|urban|towns?|farmland|villages?|orchards?|suburb(s|an)?|parks?)\b/i;

export type Predicate = (b: Bird) => boolean;

export function predicateFor(key: FilterKey, favorites: ReadonlySet<string>): Predicate {
  switch (key) {
    case 'all': return () => true;
    case 'sing': return (b) => SING.test(b.desc);
    case 'water': return (b) => WATER.test(b.desc + ' ' + b.name);
    case 'yard': return (b) => YARD.test(b.desc);
    case 'saved': return (b) => favorites.has(b.id);
  }
}

export const FILTERS: ReadonlyArray<{ key: FilterKey; label: string }> = [
  { key: 'all', label: 'All birds' },
  { key: 'sing', label: 'Singers' },
  { key: 'water', label: 'Waterside' },
  { key: 'yard', label: 'Gardens & towns' },
  { key: 'saved', label: 'Saved ♥' },
];
