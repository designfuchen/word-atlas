export type Accent = "uk" | "us";

/** Compact row from atlas/index.json: [id, word, zh, ipa, cefr, topic, media]. */
export type IndexRow = [string, string, string, string, number, number, number];

export interface Sense {
  pos: string;
  zh: string;
  en: string;
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
  senses: Sense[];
  ex: Example[];
  col: string[];
  fam: string[];
  /** 同根词 — cognates that share the headword's root, from the etymology dictionary. */
  root?: string[];
  syn: string[];
  ant: string[];
  tip: string;
  /**
   * 词源图景 — one line from the etymology dictionary reading the word's
   * literal meaning out of its root (`com- (共同) + currere (跑) 的字面意思是…`).
   * Reaches 6,754 of the 7,298 entries; the rest go without the block.
   */
  ety?: string;
  cefr: string;
  topic: string;
  /** Usage caution (register, offensiveness, spelling), shown with the entry. */
  note?: string;
  /** Media bit flags, see MEDIA. */
  m: number;
  /** Absolute media URLs for datasets that do not follow the atlas layout. */
  media?: { img?: string | null; uk?: string | null; us?: string | null; ex?: string | null; ex2?: string | null };
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
  audio: (ref: WordRef | Entry, kind: "uk" | "us" | "ex" | "ex2") => string | null;
}
