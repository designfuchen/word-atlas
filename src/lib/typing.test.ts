import assert from "node:assert/strict";
import { test } from "node:test";
import { clean, practiceBatch, same, typingDelta, typingMetrics } from "./typing";

test("typing counts inserted characters and does not reward deletions", () => {
  assert.deepEqual(typingDelta("", "c", "cat"), { total: 1, correct: 1 });
  assert.deepEqual(typingDelta("c", "cx", "cat"), { total: 1, correct: 0 });
  assert.deepEqual(typingDelta("cx", "c", "cat"), { total: 0, correct: 0 });
  assert.deepEqual(typingDelta("cat", "cat", "cat"), { total: 0, correct: 0 });
});

test("a corrected mistake remains in the cumulative accuracy denominator", () => {
  let total = 0,
    correct = 0,
    previous = "";
  for (const value of ["c", "cx", "c", "ca", "cat"]) {
    const delta = typingDelta(previous, value, "cat");
    total += delta.total;
    correct += delta.correct;
    previous = value;
  }
  assert.deepEqual(typingMetrics(correct, total, 3, 6000), {
    accuracy: 75,
    wpm: 6,
  });
});

test("replacement and middle insertion assess only new characters at their new positions", () => {
  assert.deepEqual(typingDelta("cxt", "cat", "cat"), { total: 1, correct: 1 });
  assert.deepEqual(typingDelta("cat", "cart", "cart"), {
    total: 1,
    correct: 1,
  });
  assert.deepEqual(typingDelta("cart", "cat", "cat"), { total: 0, correct: 0 });
  assert.deepEqual(typingDelta("cat", "cats", "cat"), { total: 1, correct: 0 });
});

test("case and equivalent smart punctuation are accepted, punctuation is still required", () => {
  assert.ok(same("Cat", "cat"));
  assert.ok(same("It’s fine.", "It's fine."));
  assert.ok(!same("Its fine", "It's fine."));
  assert.ok(!same("cat ", "cat"));
  assert.deepEqual(typingDelta("", "Cat", "cat"), { total: 3, correct: 3 });
  assert.equal(clean("Ａ—Ｂ"), "A-B");
});

test("IME commits or multi-character replacements are assessed as one insertion", () => {
  assert.deepEqual(typingDelta("", "hello", "hello"), { total: 5, correct: 5 });
  assert.deepEqual(typingDelta("hel", "hello", "hello"), {
    total: 2,
    correct: 2,
  });
  assert.deepEqual(typingDelta("hello", "hello", "hello"), {
    total: 0,
    correct: 0,
  });
  assert.deepEqual(typingDelta("", "你好", "hello"), { total: 2, correct: 0 });
});

test("WPM uses five characters per word and excludes discarded error characters", () => {
  assert.deepEqual(typingMetrics(200, 250, 200, 60000), {
    accuracy: 80,
    wpm: 40,
  });
  assert.deepEqual(typingMetrics(150, 150, 150, 30000), {
    accuracy: 100,
    wpm: 60,
  });
});

test("an untouched or subsecond round never reports infinite or misleading WPM", () => {
  assert.deepEqual(typingMetrics(0, 0, 0, 0), { accuracy: 100, wpm: 0 });
  assert.equal(typingMetrics(1, 1, 1, 20).wpm, 0);
  assert.equal(typingMetrics(50, 50, 50, 999).wpm, 0);
});

test("normalized ligatures count as the same displayed characters", () => {
  assert.deepEqual(typingDelta("", "oﬃce", "office"), { total: 6, correct: 6 });
  assert.deepEqual(typingDelta("oﬃce", "office", "office"), { total: 0, correct: 0 });
});

test("decomposed accents normalize before positions and accuracy are assessed", () => {
  assert.deepEqual(typingDelta("", "cafe\u0301", "café"), { total: 4, correct: 4 });
  assert.deepEqual(typingDelta("café", "cafe\u0301", "café"), { total: 0, correct: 0 });
});

test("supplementary Unicode characters do not shift the following letter positions", () => {
  assert.deepEqual(typingDelta("", "𝔸B", "AB"), { total: 2, correct: 2 });
  assert.deepEqual(typingDelta("", "🙂a", "🙂a"), { total: 2, correct: 2 });
});

test("source nonbreaking spaces match keyboard spaces but omitted punctuation does not", () => {
  assert.ok(same("a b", "a\u00a0b"));
  assert.deepEqual(typingDelta("", "a b", "a\u00a0b"), { total: 3, correct: 3 });
  assert.ok(!same("well being", "well-being"));
});

test("metrics never emit NaN, Infinity, negatives or accuracy above 100", () => {
  assert.deepEqual(typingMetrics(20, 10, 10, 60000), { accuracy: 100, wpm: 2 });
  assert.deepEqual(typingMetrics(-1, 10, -10, 60000), { accuracy: 0, wpm: 0 });
  assert.deepEqual(typingMetrics(NaN, Infinity, 2, Infinity), { accuracy: 100, wpm: 0 });
});

test("practice can draw words from the whole pool, not just the first 60", () => {
  const pool = Array.from({ length: 70 }, (_, i) => `w${i}`);
  const reachable = new Set<string>();
  for (let seed = 1; seed <= 200; seed++) practiceBatch(pool, seed).forEach((id) => reachable.add(id));
  assert.ok(
    Array.from({ length: 10 }, (_, i) => `w${60 + i}`).some((id) => reachable.has(id)),
    "words after index 60 should be reachable",
  );
});
