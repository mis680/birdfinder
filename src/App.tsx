import { useEffect, useMemo, useRef, useState } from 'react';
import { BIRDS } from './data/index.ts';
import { find } from './core/search.ts';
import { FILTERS, predicateFor } from './core/filters.ts';
import { isConfident, rank, type Match } from './core/colorMatch.ts';
import type { FilterKey } from './core/types.ts';
import { birdHistograms, histFromImage, useFavorites, useRoute } from './lib.ts';
import { SearchBar } from './components/SearchBar.tsx';
import { BirdGrid, type GridItem } from './components/BirdGrid.tsx';
import { Detail } from './components/Detail.tsx';

interface Photo { url: string; matches: Match[]; confident: boolean }

export function App() {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [photoMsg, setPhotoMsg] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const { favs, toggle } = useFavorites();
  const { id, go } = useRoute();
  const input = useRef<HTMLInputElement>(null);
  const photoUrl = useRef<string | null>(null);

  const results = useMemo(() => find(BIRDS, q).filter(predicateFor(filter, favs)), [q, filter, favs]);
  const suggestions = useMemo(() => (q.trim() ? find(BIRDS, q).slice(0, 6) : []), [q]);
  const bird = id ? BIRDS.find((b) => b.id === id) ?? null : null;

  // "/" focuses search (when not already typing)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === '/' && t.tagName !== 'INPUT' && t.tagName !== 'TEXTAREA') {
        e.preventDefault(); go(null); setTimeout(() => input.current?.focus(), 0);
      }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [go]);

  const clearPhoto = () => {
    if (photoUrl.current) URL.revokeObjectURL(photoUrl.current);
    photoUrl.current = null; setPhoto(null); setPhotoMsg('');
  };

  const handleFile = (f: File | undefined) => {
    if (!f || !f.type.startsWith('image/')) return;
    if (photoUrl.current) URL.revokeObjectURL(photoUrl.current);
    const url = URL.createObjectURL(f);
    photoUrl.current = url;
    const im = new Image();
    im.onload = async () => {
      try {
        const hists = await birdHistograms();
        if (photoUrl.current !== url) return; // a newer photo replaced this one
        const matches = rank(BIRDS, hists, histFromImage(im), f.name);
        const confident = isConfident(matches);
        setQ(''); setFilter('all'); setPhoto({ url, matches, confident });
        setPhotoMsg(confident
          ? 'Closest match for your photo. Opening the best match…'
          : 'No confident match. These are the closest guesses by colour. Try a clearer, closer shot, or remove the photo.');
        if (location.hash) go(null);
        if (confident) setTimeout(() => { if (photoUrl.current === url) go(matches[0].bird.id); }, 1400);
      } catch { setPhotoMsg('Could not analyse this photo. Please try another.'); }
    };
    im.onerror = () => setPhotoMsg('This file couldn’t be read as a photo. Choose a JPG or PNG.');
    im.src = url;
  };

  useEffect(() => () => { if (photoUrl.current) URL.revokeObjectURL(photoUrl.current); }, []);

  const items: GridItem[] = photo
    ? photo.matches.map((m) => ({ bird: m.bird, pct: Math.round(m.score * 100) }))
    : results.map((bird) => ({ bird }));

  const msg = photo ? photoMsg
    : results.length
      ? (q.trim() ? `${results.length} bird${results.length > 1 ? 's' : ''} match “${q.trim()}”.` : `${results.length} bird${results.length > 1 ? 's' : ''}.`)
      : `No bird matches${q.trim() ? ` “${q.trim()}”` : ''}. Try a colour, family or habitat.`;

  if (bird) {
    return (
      <div className="wrap">
        <Detail bird={bird} saved={favs.has(bird.id)} onToggleSaved={() => toggle(bird.id)} onBack={() => go(null)} onOpen={go} />
      </div>
    );
  }

  const names = BIRDS.map((b) => b.name);
  return (
    <div className="wrap">
      <header className="hero">
        <h1>
          {'Name the bird you just saw.'.split(' ').map((w, i) => (
            <span key={i} style={{ animationDelay: `${i * 80}ms` }}>{w}{' '}{i === 2 && <br />}</span>
          ))}
        </h1>
        <p>Search {BIRDS.length} birds by name, Hindi name, family or a clue like “green” or “nest”. Or drop in a photo to find the closest match.</p>
      </header>
      <div className="marq" aria-hidden="true">
        <div>{[...names, ...names].map((n, i) => <span key={i}>{n}</span>)}</div>
      </div>

      <SearchBar
        value={q}
        suggestions={suggestions}
        inputRef={input}
        onChange={(v) => { clearPhoto(); setQ(v); }}
        onPick={go}
        onFile={handleFile}
      />

      <div
        className={`drop${dragOver ? ' over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragEnter={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
      >
        <span>Drag a bird photo here, or use Upload or Camera.</span>
        {photo && <img src={photo.url} alt="Your photo" style={{ height: 56, borderRadius: 8 }} />}
        {photo && <button type="button" className="ghost" onClick={clearPhoto}>✕ Remove photo</button>}
      </div>

      <div className="fl" role="group" aria-label="Filters">
        {FILTERS.map((f) => (
          <button key={f.key} type="button" className="chip" aria-pressed={filter === f.key} onClick={() => { clearPhoto(); setFilter(f.key); }}>{f.label}</button>
        ))}
      </div>
      <p className="note" role="status">{msg}</p>
      <BirdGrid items={items} favs={favs} onOpen={go} />
    </div>
  );
}
