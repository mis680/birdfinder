import { useEffect, useId, useRef, useState, type KeyboardEvent, type RefObject } from 'react';
import type { Bird } from '../core/types.ts';
import { highlight } from '../core/search.ts';
import { asset } from '../data/index.ts';

interface Props {
  value: string;
  suggestions: Bird[];
  onChange: (v: string) => void;
  onPick: (id: string) => void;
  onFile: (f: File | undefined) => void;
  inputRef: RefObject<HTMLInputElement | null>;
}

export function SearchBar({ value, suggestions, onChange, onPick, onFile, inputRef }: Props) {
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState(-1);
  const file = useRef<HTMLInputElement>(null);
  const cam = useRef<HTMLInputElement>(null);
  const listId = useId();
  const show = open && suggestions.length > 0;

  useEffect(() => {
    const close = (e: MouseEvent) => { if (!(e.target as Element).closest('.bar')) setOpen(false); };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setSel((s) => Math.min(s + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
    else if (e.key === 'Enter') { if (sel >= 0 && suggestions[sel]) onPick(suggestions[sel].id); else setOpen(false); }
    else if (e.key === 'Escape') setOpen(false);
  };

  return (
    <div className="bar">
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={show}
        aria-controls={listId}
        aria-activedescendant={sel >= 0 ? `${listId}-${sel}` : undefined}
        aria-label="Search birds"
        placeholder="Search a bird, Hindi name or clue"
        autoComplete="off"
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); setSel(-1); }}
        onKeyDown={onKey}
      />
      <button type="button" className="ghost" onClick={() => file.current?.click()}>Upload</button>
      <button type="button" className="ghost" onClick={() => cam.current?.click()}>Camera</button>
      <input ref={file} type="file" accept="image/*" hidden onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ''; }} />
      <input ref={cam} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ''; }} />
      {show && (
        <ul id={listId} role="listbox" className="sug">
          {suggestions.map((b, i) => (
            <li
              key={b.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === sel}
              className={i === sel ? 'on' : ''}
              onMouseDown={(e) => { e.preventDefault(); onPick(b.id); setOpen(false); }}
            >
              <img src={asset(b.image)} alt="" width={44} height={44} />
              <div>
                {highlight(b.name, value).map((s, k) => (s.hit ? <mark key={k}>{s.text}</mark> : <span key={k}>{s.text}</span>))}
                <small>{b.sci}</small>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
