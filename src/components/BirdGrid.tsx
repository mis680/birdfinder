import type { CSSProperties } from 'react';
import type { Bird } from '../core/types.ts';
import { asset } from '../data/index.ts';

export interface GridItem { bird: Bird; pct?: number }

export function BirdGrid({ items, favs, onOpen }: { items: GridItem[]; favs: ReadonlySet<string>; onOpen: (id: string) => void }) {
  return (
    <div className="grid">
      {items.map(({ bird: b, pct }) => (
        <button
          key={b.id}
          type="button"
          className="card"
          style={{ '--tc': b.tc } as CSSProperties}
          onClick={() => onOpen(b.id)}
          onPointerMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
            e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
          }}
        >
          <img src={asset(b.image)} alt="" loading="lazy" decoding="async" width={400} height={400} />
          <div>
            {pct !== undefined && <span className="pct">{pct}%</span>}
            <b>{b.name}</b>
            <span>{b.sci}</span><br />
            <em className="stb" lang="hi">{b.hindi}</em>
            {favs.has(b.id) && <u className="hrt" aria-label="Saved">♥</u>}
          </div>
        </button>
      ))}
    </div>
  );
}
