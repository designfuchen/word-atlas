/**
 * Search the atlas by English spelling or Chinese gloss.
 *
 * The index row only has room for the headword's first meaning, so a Chinese
 * query for 缠绕 used to miss `wind` (n. 风 / v. 缠绕 / v. 蜿蜒). Every row now
 * carries its remaining senses in `WordRef.more`; the matcher below looks at
 * all of them and prefers the earliest, tightest gloss that fits.
 */
import type { Atlas, WordRef } from "../atlas/types";

const HAN = /[\u4e00-\u9fff]/;

/** True when the query should be matched against Chinese glosses. */
export const isChinese = (q: string) => HAN.test(q);

/** Every gloss on a row — first sense (what the grid shows) included. */
export function sensesOf(w: WordRef): string[] {
  const list = w.more ? [w.zh, ...w.more.split("|")] : [w.zh];
  return list.filter(Boolean);
}

/** `n. 风` → `风`, so an exact meaning still counts as exact. */
const bare = (sense: string) => sense.replace(/^[a-z]+\.\s*/i, "");

/**
 * The best gloss on a row for a Chinese query, with its score.
 *
 * Scoring favours, in order: an exact gloss, a gloss that starts with the
 * query, an early match inside a gloss; then earlier senses and shorter
 * glosses, so `风` puts `wind` above a word that merely mentions 风 in a long
 * third sense.
 */
export function matchSense(w: WordRef, q: string): { sense: string; score: number } | null {
  let best: { sense: string; score: number } | null = null;
  sensesOf(w).forEach((sense, i) => {
    const zh = bare(sense);
    const at = zh.indexOf(q);
    if (at < 0) return;
    let score = zh === q ? 900 : at === 0 ? 700 : 450 - Math.min(100, at);
    score -= i * 30;
    score -= Math.min(60, zh.length * 0.8);
    if (!best || score > best.score) best = { sense, score };
  });
  return best;
}

export function searchAtlas(atlas: Atlas, raw: string, limit = 40): WordRef[] {
  const q = raw.trim().toLowerCase();
  if (!q) return [];
  const zh = isChinese(q);
  const hits: [number, WordRef][] = [];
  for (const w of atlas.words) {
    let score = 0;
    if (zh) {
      score = matchSense(w, q)?.score ?? 0;
    } else {
      const word = w.word.toLowerCase();
      if (word === q) score = 1000;
      else if (word.startsWith(q)) score = 500 - word.length;
      else if (word.includes(q)) score = 200 - word.indexOf(q) - word.length;
    }
    if (score > 0) hits.push([score, w]);
  }
  hits.sort((a, b) => b[0] - a[0] || a[1].order - b[1].order);
  return hits.slice(0, limit).map((h) => h[1]);
}
