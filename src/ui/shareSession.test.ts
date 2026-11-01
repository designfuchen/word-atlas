import assert from "node:assert/strict";
import { test } from "node:test";
import type { ActiveSession } from "../store/store";
import { sessionWordCount } from "./shareSession";

/** A session whose steps cover `distinct` words (intros + quizzes + retries repeat ids). */
function sessionWith(distinct: number): ActiveSession {
  const ids = Array.from({ length: distinct }, (_, i) => `w${i}`);
  const steps = [
    // each word appears as an intro and a quiz, and a few appear again as retries
    ...ids.map((id) => ({ id, kind: "intro" as const })),
    ...ids.map((id) => ({ id, kind: "meaning" as const })),
    ...ids.slice(0, 3).map((id) => ({ id, kind: "picture" as const, retry: true })),
  ];
  return { id: "s1", started: 0, steps, index: 0, graded: {}, newIds: ids.slice(0, 5), reviewIds: ids.slice(5) };
}

test("counts every distinct word, not just the first nine shown on the card", () => {
  assert.equal(sessionWordCount(sessionWith(12)), 12);
  assert.equal(sessionWordCount(sessionWith(9)), 9);
  assert.equal(sessionWordCount(sessionWith(1)), 1);
});

test("does not double-count a word that repeats across steps", () => {
  const s: ActiveSession = {
    id: "s2",
    started: 0,
    steps: [
      { id: "a", kind: "intro" },
      { id: "a", kind: "meaning" },
      { id: "a", kind: "picture", retry: true },
      { id: "b", kind: "intro" },
    ],
    index: 0,
    graded: {},
    newIds: ["a", "b"],
    reviewIds: [],
  };
  assert.equal(sessionWordCount(s), 2);
});
