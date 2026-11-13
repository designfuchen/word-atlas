import assert from "node:assert/strict";
import { test } from "node:test";
import { dueIds, manualMasteredCount } from "./session";
import {
  clearCardManual,
  isAutoMastered,
  isManual,
  isMastered,
  markCardManual,
  Rating,
  review,
  wordState,
} from "./srs";
import { sanitizeProgress, type Progress } from "./store";

const NOW = Date.UTC(2026, 10, 13);

test("marking a new word mastered creates a placeholder card that survives a backup", () => {
  const c = markCardManual(undefined, NOW);
  assert.equal(isManual(c), true);
  assert.equal(isAutoMastered(c), false);
  assert.equal(isMastered(c), true);
  assert.equal(wordState(c), "mastered");
  assert.equal(c.kNew, 1);

  const p = sanitizeProgress({ version: 2, cards: { w1: c } }, "ds");
  assert.ok(p.cards.w1, "placeholder card was dropped by sanitize");
  assert.equal(isManual(p.cards.w1), true);
});

test("both kinds of mastered words leave the review queue", () => {
  const base = sanitizeProgress({ version: 2 }, "ds");
  const manual = markCardManual(undefined, NOW);
  // A card FSRS has certified: stability well past the threshold, due long ago.
  const auto = { ...review(undefined, Rating.Good, NOW - 60 * 86400000), st: 2 as const, s: 40, due: NOW - 86400000 };
  const cards: Progress["cards"] = { manual, auto };
  assert.equal(isMastered(auto), true);
  assert.deepEqual(dueIds({ ...base, cards }, NOW), []);
  // A learning card still shows up.
  const learning = { ...manual, k: undefined, kAt: undefined, kNew: undefined, due: NOW - 1 };
  assert.deepEqual(dueIds({ ...base, cards: { learning } }, NOW), ["learning"]);
});

test("unmarking a mark-only card removes it, so the word is new again", () => {
  const c = markCardManual(undefined, NOW);
  assert.equal(clearCardManual(c), null);
  assert.equal(wordState(undefined), "new");
});

test("a hand-edited card that carries only the mark is dropped too", () => {
  // e.g. a backup where `k` survived but `kNew` did not: never answered, no memory.
  const zombie = { due: NOW, s: 0, d: 0, el: 0, sd: 0, ls: 0, reps: 0, lapses: 0, st: 0 as const, seen: NOW, k: 1 as const, kAt: NOW };
  assert.equal(clearCardManual(zombie), null);
});

test("unmarking a studied word keeps its memory", () => {
  let c = review(undefined, Rating.Good, NOW);
  c = markCardManual(c, NOW + 1000);
  assert.equal(isManual(c), true);
  const back = clearCardManual(c);
  assert.ok(back);
  assert.equal(isManual(back), false);
  assert.equal(isMastered(back), false);
  assert.equal(back.reps, 1);
  assert.equal(back.seen, NOW);
  assert.equal(back.due, c.due);
});

test("answering a manually mastered word keeps the mark", () => {
  const known = markCardManual(undefined, NOW);
  const answered = review(known, Rating.Good, NOW + 10);
  assert.equal(isManual(answered), true);
  // It now has real memory, so it is no longer a mark-only card.
  assert.equal(answered.kNew, undefined);
});

test("a manual mark and FSRS mastery are the same user-facing state", () => {
  const certified = { ...review(undefined, Rating.Good, NOW), st: 2 as const, s: 42 };
  assert.equal(wordState(certified), "mastered");
  assert.equal(wordState(markCardManual(undefined, NOW)), "mastered");
  assert.equal(wordState(certified), wordState(markCardManual(undefined, NOW)));
  // Only the manual one is undoable.
  assert.equal(isAutoMastered(certified), true);
  assert.equal(isAutoMastered(markCardManual(undefined, NOW)), false);
});

test("only manual marks are counted for the undo panel", () => {
  const p = sanitizeProgress(
    { version: 2, cards: { a: markCardManual(undefined, NOW), b: { ...markCardManual(undefined, NOW), k: undefined, kAt: undefined, kNew: undefined, st: 2, s: 40 } } },
    "ds",
  );
  assert.equal(manualMasteredCount(p), 1);
});

test("days track how many words were marked mastered by hand", () => {
  const p = sanitizeProgress(
    { version: 2, days: { "2026-11-13": { n: 0, r: 0, c: 0, t: 0, k: 3 } } },
    "ds",
  );
  assert.equal(p.days["2026-11-13"].k, 3);
  // Older backups without the field still load, defaulting to zero.
  const old = sanitizeProgress({ version: 2, days: { "2026-11-13": { n: 1, r: 2, c: 1, t: 30 } } }, "ds");
  assert.equal(old.days["2026-11-13"].k, 0);
});
