/** Compact row from poetry/index.json: [id, title, author, form, level, lines, themes, first line]. */
export type PoemRow = [string, string, string, number, number, number, number[], string];

export interface PoemLine {
  zh: string;
  /** One reading per character of `zh`; empty for punctuation. */
  py: string[];
}

export interface Poem {
  id: string;
  title: string;
  author: string;
  dynasty: string;
  form: string;
  themes: string[];
  level: number;
  /** One sentence per line; consecutive pairs form a couplet. */
  lines: PoemLine[];
  /** Plain-language summary; empty when the source has none. */
  gist: string;
}

export interface PoemRef {
  id: string;
  title: string;
  author: string;
  form: number;
  level: number;
  lines: number;
  themes: number[];
  /** Opening line without its closing punctuation, for lists. */
  first: string;
  /** Position in the learning path. */
  order: number;
}

export interface PoetryAtlas {
  id: string;
  name: string;
  count: number;
  forms: string[];
  levels: string[];
  themes: string[];
  poems: PoemRef[];
  byId: Map<string, PoemRef>;
  /** Loads a full poem; chunked like the word atlas. */
  poem: (id: string) => Promise<Poem>;
  peek: (id: string) => Poem | undefined;
  /** Every poem in learning-path order; sessions need the whole set for plausible wrong answers. */
  all: () => Promise<Poem[]>;
}
