# Birdfinder

Vite 8 + React 19 + TypeScript. 40 Indian birds, search (English / Hindi / family / clue), colour-based photo match, synthesised call sketches, favourites.

## Run
Needs Node **20.19+** or **22.12+**.

```bash
npm install
npm test          # core logic + data integrity (node:test, no extra deps)
npm run dev       # http://localhost:5173
npm run build     # typecheck + production build -> dist/
npm run preview
```

## Structure
- `src/core/` pure, framework-free, unit-tested: `search`, `filters`, `colorMatch`, `sound`, `favorites`, `route`, `validate`
- `src/data/` `birds.json`, `sounds.json` (40 + 40); photos in `public/birds/` (40 JPEGs)
- `src/components/`, `src/App.tsx`, `src/lib.ts` UI + browser glue (canvas, WebAudio, localStorage)
- `scripts/extract-assets.mjs` one-time migration from the legacy single-file HTML

## Deploy (free)
Static site, hash routing -> works on any host without rewrite rules.

**Cloudflare Pages (recommended):** Git repo connect -> Framework preset *Vite* -> build `npm run build`, output `dist`, env `NODE_VERSION=22`.
**Netlify:** same settings (`netlify.toml` included).
**GitHub Pages:** push to `main`; Settings -> Pages -> Source: GitHub Actions (`.github/workflows/deploy.yml` sets `BASE_PATH` automatically).
