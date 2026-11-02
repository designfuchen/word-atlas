export type Accent = "uk" | "us";

/** Compact row from atlas/index.json: [id, word, zh, ipa, cefr, topic, media]. */
export type IndexRow = [string, string, string, string, number, number, number];

export interface Sense {
  pos: string;
  zh: string;
  en: string;
  /** Which reading in `Entry.pron` says this sense; absent means the only one. */
  v?: number;
}

/**
 * One reading of a word that is spelled the same but said two ways — `tear` as
 * in rip (`/teə/`) and as in crying (`/tɪə/`). Senses point back at a group
 * through `Sense.v`, so a card can say which meaning goes with which sound.
 */
export interface Pron {
  uk: string;
  us: string;
}

export interface Example {
  en: string;
  zh: string;
}

export interface Entry {
  id: string;
  w: string;
  uk: string;
  us: string;
  /** Present only when the spelling covers more than one pronunciation. */
  pron?: Pron[];
  senses: Sense[];
  ex: Example[];
  col: string[];
  fam: string[];
  syn: string[];
  ant: string[];
  tip: string;
  cefr: string;
  topic: string;
  /** Usage caution (register, offensiveness, spelling), shown with the entry. */
  note?: string;
  /** Media bit flags, see MEDIA. */
  m: number;
  /** Absolute media URLs for datasets that do not follow the atlas layout. */
  media?: {
    img?: string | null;
    uk?: string | null;
    us?: string | null;
    uk2?: string | null;
    us2?: string | null;
    ex?: string | null;
    ex2?: string | null;
  };
}

export const MEDIA = { img: 1, uk: 2, us: 4, ex: 8, ex2: 16 } as const;

export interface WordRef {
  id: string;
  word: string;
  zh: string;
  ipa: string;
  cefr: number;
  topic: number;
  media: number;
  /** Position in the learning path. */
  order: number;
}

export interface Atlas {
  id: string;
  name: string;
  kind: "open" | "private";
  count: number;
  examples: number;
  illustrated: number;
  topics: [string, string][];
  cefr: string[];
  words: WordRef[];
  byId: Map<string, WordRef>;
  /** Loads full entries; chunked for the open atlas, in-memory for private sets. */
  entry: (id: string) => Promise<Entry>;
  peek: (id: string) => Entry | undefined;
  img: (ref: WordRef | Entry, size?: "thumb" | "full") => string | null;
  /**
   * `variant` selects a reading group for words with `pron`. Group 0 is the
   * ordinary recording and needs no bit; groups 1+ live in `audio/<kind>2/`,
   * which each build fills from its own source (TTS for share, OALDPEX for
   * private), so the media bits say nothing about them.
   */
  audio: (ref: WordRef | Entry, kind: "uk" | "us" | "ex" | "ex2", variant?: number) => string | null;
}
