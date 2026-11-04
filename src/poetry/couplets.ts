import { isMastered, type CardState } from "../store/srs";
import type { Poem, PoemLine } from "./types";

/** A review unit: an opening line and the line that answers it. A poem with an odd line count ends in a lone line. */
export interface Couplet {
  /** Card id in the progress store: `<poemId>:<n>`. */
  id: string;
  poemId: string;
  n: number;
  up: PoemLine;
  down?: PoemLine;
}

export const coupletId = (poemId: string, n: number) => `${poemId}:${n}`;

export function couplets(poem: Poem): Couplet[] {
  const out: Couplet[] = [];
  for (let i = 0; i < poem.lines.length; i += 2) {
    const n = i / 2;
    out.push({ id: coupletId(poem.id, n), poemId: poem.id, n, up: poem.lines[i], down: poem.lines[i + 1] });
  }
  return out;
}

/** Only complete couplets can be asked as "line → next line". */
export const quizzable = (c: Couplet): c is Couplet & { down: PoemLine } => !!c.down;

export interface PoemStatus {
  total: number;
  started: number;
  mastered: number;
}

/** How far the learner has got with a poem, judged from its couplet cards. */
export function poemStatus(poem: Poem, cards: Record<string, CardState>): PoemStatus {
  const cs = couplets(poem).filter(quizzable);
  return {
    total: cs.length,
    started: cs.filter((c) => cards[c.id]).length,
    mastered: cs.filter((c) => isMastered(cards[c.id])).length,
  };
}
