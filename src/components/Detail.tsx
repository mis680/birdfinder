import { useEffect, useState, type CSSProperties } from 'react';
import type { Bird } from '../core/types.ts';
import { BIRDS, asset } from '../data/index.ts';
import { playCall } from '../lib.ts';

const wikipediaUrl = (bird: Bird) => {
  try {
    const link = new URL(bird.more);
    if (/(^|\.)statueofunitytentcity\.com$/i.test(link.hostname)) {
      return `https://en.wikipedia.org/wiki/${encodeURIComponent(bird.name.replace(/\s+/g, '_'))}`;
    }
  } catch {
    // Keep the stored link as a fallback; data validation reports malformed links.
  }
  return bird.more;
};

interface Props {
  bird: Bird;
  saved: boolean;
  onToggleSaved: () => void;
  onBack: () => void;
  onOpen: (id: string) => void;
}

export function Detail({ bird, saved, onToggleSaved, onBack, onOpen }: Props) {
  const [playing, setPlaying] = useState(false);
  const sameFamily = BIRDS.filter((x) => x.id !== bird.id && x.family === bird.family).slice(0, 3);
  const related = sameFamily.length ? sameFamily : BIRDS.filter((x) => x.id !== bird.id).slice(0, 3);

  useEffect(() => {
    document.title = `${bird.name} – Birdfinder`;
    window.scrollTo(0, 0);
    return () => { document.title = 'Birdfinder'; };
  }, [bird.id, bird.name]);

  const hear = async () => {
    try {
      setPlaying(true);
      const ms = await playCall(bird);
      setTimeout(() => setPlaying(false), ms + 300);
    } catch {
      setPlaying(false); // AudioContext unavailable
    }
  };

  return (
    <section aria-labelledby="bird-title">
      <button className="ghost" type="button" onClick={onBack}>‹ Back to results</button>
      <div className="detail">
        <div className="pic"><img src={asset(bird.image)} alt={bird.name} decoding="async" /></div>
        <div style={{ '--tc': bird.tc } as CSSProperties}>
          <h2 id="bird-title">{bird.name}</h2>
          <p className="sci">{bird.sci}</p>
          <dl>
            <dt>Family</dt><dd>{bird.family}</dd>
            <dt>Hindi name</dt><dd lang="hi">{bird.hindi}</dd>
          </dl>
          <p className="about">{bird.desc}</p>
          <div className="acts">
            <a className="btn" href={wikipediaUrl(bird)} target="_blank" rel="noopener noreferrer">To know more</a>
            <button type="button" onClick={hear} className={playing ? 'on' : ''} aria-live="polite">
              <span className="eq" aria-hidden="true"><i /><i /><i /></span> Hear call sketch
            </button>
            <button type="button" className="ghost" onClick={onToggleSaved} aria-pressed={saved}>
              {saved ? '♥ Saved' : '♡ Save'}
            </button>
          </div>
          <p className="note">Call sketches are synthesised from each bird’s call style, not real recordings.</p>
          <p className="note">
            {sameFamily.length ? 'Same family: ' : 'You might also like: '}
            {related.map((x, i) => (
              <span key={x.id}>
                {i > 0 && ', '}
                <a href={`#${x.id}`} onClick={(e) => { e.preventDefault(); onOpen(x.id); }}>{x.name}</a>
              </span>
            ))}
          </p>
        </div>
      </div>
    </section>
  );
}
