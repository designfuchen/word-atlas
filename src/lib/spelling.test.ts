import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { accepts, acceptsSentence, spellingsOf, SPELLING_GROUPS } from "./spelling";

test("both spellings of a group are accepted in either direction", () => {
  for (const group of SPELLING_GROUPS) {
    const [head, ...rest] = group.split(" ");
    for (const alt of rest) {
      assert.equal(accepts(alt, head), true, `${alt} should pass for ${head}`);
      assert.equal(accepts(head, alt), true, `${head} should pass for ${alt}`);
      assert.deepEqual(spellingsOf(alt).slice().sort(), spellingsOf(head).slice().sort());
    }
  }
});

test("case and surrounding spaces do not decide the answer", () => {
  assert.equal(accepts(" Liter ", "litre"), true);
});

test("near misses and British meaning splits stay wrong", () => {
  assert.equal(accepts("litter", "litre"), false);
  assert.equal(accepts("loath", "loathe"), false);
  for (const [a, b] of [
    ["practice", "practise"],
    ["licence", "license"],
    ["programme", "program"],
    ["advice", "advise"],
    ["tyre", "tire"],
    ["storey", "story"],
    ["enquiry", "inquiry"],
  ]) {
    assert.equal(accepts(a, b), false, `${a} must not pass for ${b}`);
    assert.equal(accepts(b, a), false, `${b} must not pass for ${a}`);
  }
});

test("a variant inside a sentence passes; another word or dropped punctuation does not", () => {
  assert.equal(acceptsSentence("We need a liter of milk.", "We need a litre of milk."), true);
  assert.equal(acceptsSentence("We need a litre of milk", "We need a litre of milk."), false);
  assert.equal(acceptsSentence("We need a litter of milk.", "We need a litre of milk."), false);
});

test("every group touches a word that ships in the dataset", () => {
  const raw = readFileSync(new URL("../../data/word-atlas.json", import.meta.url), "utf8");
  const words = new Set((JSON.parse(raw) as { w: string }[]).map((entry) => entry.w));
  for (const group of SPELLING_GROUPS) {
    assert.ok(
      group.split(" ").some((word) => words.has(word)),
      `${group} has no member in data/word-atlas.json`,
    );
  }
});
