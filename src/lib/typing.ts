import { shuffle } from "./text";

/** Pick up to `n` practice words from anywhere in the pool: shuffle first, then take. */
export function practiceBatch(pool: string[], seed: number, n = 10): string[] {
  return shuffle(pool, seed).slice(0, n);
}

/** Normalize the typography mobile keyboards commonly substitute. */
export const clean = (text: string) =>
  text
    .normalize("NFKC")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[‐‑–—]/g, "-")
    .replace(/\s/g, " ");
export const same = (a: string, b: string) =>
  clean(a).toLowerCase() === clean(b).toLowerCase();

/** Use normalized Unicode code points consistently for scoring and highlighting. */
export function correctCharacterCount(value: string, target: string) {
  const expected = Array.from(clean(target));
  return Array.from(clean(value)).filter((char, index) =>
    same(char, expected[index] || ""),
  ).length;
}

/** Count newly inserted characters, including replacements, without rewarding deletions. */
export function typingDelta(previous: string, next: string, target: string) {
  const before = Array.from(clean(previous));
  const after = Array.from(clean(next));
  const expected = Array.from(clean(target));
  let prefix = 0;
  while (
    prefix < before.length &&
    prefix < after.length &&
    before[prefix] === after[prefix]
  ) prefix++;
  let suffix = 0;
  while (
    suffix < before.length - prefix &&
    suffix < after.length - prefix &&
    before[before.length - 1 - suffix] === after[after.length - 1 - suffix]
  ) suffix++;
  const added = after.slice(prefix, after.length - suffix);
  let correct = 0;
  for (let i = 0; i < added.length; i++) {
    if (same(added[i], expected[prefix + i] || "")) correct++;
  }
  return { total: added.length, correct };
}

/** Standard WPM uses 5 characters per word, not the number of vocabulary cards. */
export function typingMetrics(
  correctCharacters: number,
  attemptedCharacters: number,
  acceptedCharacters: number,
  elapsedMs: number,
) {
  const finiteNonnegative = (n: number) => Number.isFinite(n) ? Math.max(0, n) : 0;
  const attempted = finiteNonnegative(attemptedCharacters);
  const correct = Math.min(finiteNonnegative(correctCharacters), attempted);
  const accepted = finiteNonnegative(acceptedCharacters);
  const duration = finiteNonnegative(elapsedMs);
  return {
    accuracy: attempted ? Math.round((correct / attempted) * 100) : 100,
    wpm: duration >= 1000 ? Math.round(accepted / 5 / (duration / 60000)) : 0,
  };
}
