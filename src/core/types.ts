export interface Bird {
  id: string;
  name: string;
  sci: string;
  family: string;
  hindi: string;
  desc: string;
  /** Theme colour, #rrggbb */
  tc: string;
  /** External "to know more" link */
  more: string;
  /** Path relative to the site base, e.g. "birds/indian-peafowl.jpg" */
  image: string;
}

/** u = rising chirp, d = falling note, t = sharp/square "tick" */
export type CallMode = 'u' | 'd' | 't';

export interface CallSpec {
  hz: number;
  count: number;
  gapMs: number;
  mode: CallMode;
}

export type FilterKey = 'all' | 'sing' | 'water' | 'yard' | 'saved';
