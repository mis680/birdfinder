// One-time migration: legacy single-file Birdfinder.html -> src/data/*.json + public/birds/*.jpg
// Usage: node scripts/extract-assets.mjs path/to/Birdfinder.html
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import vm from 'node:vm';

const src = process.argv[2];
if (!src) { console.error('usage: node scripts/extract-assets.mjs <legacy.html>'); process.exit(1); }
const lines = readFileSync(src, 'utf8').split('\n');

// Evaluate only the data lines inside an isolated VM context (no DOM, no network).
const birdsCode = lines.filter((l) => l.startsWith('const BIRDS=') || l.startsWith('BIRDS.push(')).join('\n');
const sndLine = lines.find((l) => l.startsWith('const SND='));
if (!birdsCode || !sndLine) throw new Error('Legacy data lines not found');
const ctx = vm.createContext({});
vm.runInContext(birdsCode.replace('const BIRDS=', 'var BIRDS=') + '\n' + sndLine.replace('const SND=', 'var SND='), ctx);
const { BIRDS, SND } = ctx;

// Data corrections found during audit (kept explicit so the migration is reproducible).
const FIXES = {
  'indian-cormorant': { family: 'Phalacrocoracidae' }, // legacy data wrongly said Alcedinidae (kingfishers)
};

mkdirSync('public/birds', { recursive: true });
mkdirSync('src/data', { recursive: true });

const birds = BIRDS.map((b) => {
  const m = /^data:image\/jpeg;base64,(.+)$/.exec(b.img);
  if (!m) throw new Error(`Unexpected image data for ${b.id}`);
  writeFileSync(`public/birds/${b.id}.jpg`, Buffer.from(m[1], 'base64'));
  const { img, ...rest } = b;
  return { ...rest, ...(FIXES[b.id] ?? {}), image: `birds/${b.id}.jpg` };
});

const sounds = Object.fromEntries(
  Object.entries(SND).map(([id, [hz, count, gapMs, mode]]) => [id, { hz, count, gapMs, mode }]),
);

writeFileSync('src/data/birds.json', JSON.stringify(birds, null, 2) + '\n');
writeFileSync('src/data/sounds.json', JSON.stringify(sounds, null, 2) + '\n');
console.log(`birds=${birds.length} sounds=${Object.keys(sounds).length}`);
