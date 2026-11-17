import type { WordRef } from "../atlas/types";

export const normalizeLookupWord = (text: string) => text.replace(/[‘’]/g, "'").toLowerCase();

/** Keep punctuation and spacing verbatim; hyphenated compounds can be read one word at a time. */
export function tokenizeSentence(text: string): { text: string; word: boolean }[] {
  const pattern = /\b(?:[ap]\.m\.|bona fide|t-shirts?)|\p{L}+(?:['’]\p{L}+)*/giu;
  const parts: { text: string; word: boolean }[] = [];
  let end = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > end) parts.push({ text: text.slice(end, match.index), word: false });
    parts.push({ text: match[0], word: true });
    end = match.index + match[0].length;
  }
  if (end < text.length) parts.push({ text: text.slice(end), word: false });
  return parts;
}

export function createWordLookup(words: WordRef[], aliases: Record<string, string> = {}) {
  const exact = new Map(words.map((w) => [normalizeLookupWord(w.word), w]));
  const byId = new Map(words.map((w) => [w.id, w]));
  return (text: string): WordRef | undefined => {
    const word = normalizeLookupWord(text);
    const find = (w: string) => exact.get(w) ?? (Object.hasOwn(aliases, w) ? byId.get(aliases[w]) : undefined);
    // Contractions such as "it's" have their own entries and must precede possessives.
    return find(word) ?? (/['’]s$/.test(word) ? find(word.slice(0, -2)) : undefined);
  };
}
