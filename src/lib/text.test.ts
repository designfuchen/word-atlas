import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import { gap, headwordForms, normalize, splitHighlight, splitPair } from "./text";

test("highlights the headword and common inflections", () => {
  assert.deepEqual(splitHighlight("Training with a friend motivates me.", "motivate")?.[1], "motivates");
  assert.deepEqual(splitHighlight("She studied hard.", "study")?.[1], "studied");
  assert.deepEqual(splitHighlight("We got a day off today.", "day off")?.[1], "day off");
  assert.equal(splitHighlight("Nothing here.", "salt"), null);
});

test("does not match inside longer unrelated words", () => {
  assert.equal(splitHighlight("The cartoon was funny.", "art"), null);
});

test("gaps the sentence for cloze questions", () => {
  const g = gap("I refused the extra money as a matter of principle.", "principle");
  assert.equal(g?.hidden, "principle");
  assert.equal(g?.after, ".");
});

test("normalizes typography from mobile keyboards", () => {
  assert.equal(normalize("  Don’t  "), "don't");
  assert.deepEqual(splitPair("in principle｜原则上"), { en: "in principle", zh: "原则上" });
});

test("a short headword never swallows a longer word that starts with it", () => {
  // The reported bug: "so" turned the sentence's "soup" into the blank, while
  // the options were the four senses of "so".
  const sentence = "The soup was so hot that I had to wait.";
  assert.equal(gap(sentence, "so")?.hidden, "so");
  assert.equal(gap(sentence, "so")?.before, "The soup was ");
  assert.equal(splitHighlight("The theory is hard.", "the")?.[1], "The");
  assert.equal(splitHighlight("He put the bowl on the head of the table.", "he")?.[1], "He");
});

test("prefers the headword itself over an inflection elsewhere", () => {
  // "study" appears after "studies"; the direct form is the better blank.
  assert.equal(gap("She studies hard, and her study is quiet.", "study")?.hidden, "study");
});

test("knows regular, doubled and irregular forms without inventing words", () => {
  assert.equal(gap("They stopped the car.", "stop")?.hidden, "stopped");
  assert.equal(gap("She studied hard.", "study")?.hidden, "studied");
  assert.equal(gap("We equipped our bikes.", "equip")?.hidden, "equipped");
  assert.equal(gap("A volunteer marshalled the runners.", "marshal")?.hidden, "marshalled");
  assert.equal(gap("My aunt taught me how to mend a shirt.", "teach")?.hidden, "taught");
  assert.equal(gap("The children played outside.", "child")?.hidden, "children");
  assert.equal(gap("This one is better.", "good")?.hidden, "better");
  assert.equal(gap("The teacher gave us two quizzes.", "quiz")?.hidden, "quizzes");
  assert.equal(gap("She quizzed him about the keys.", "quiz")?.hidden, "quizzed");

  // "-eed" nouns must not become unrelated past forms.
  assert.equal(splitHighlight("Please feed the cat.", "fee"), null);
  assert.equal(splitHighlight("She planted a seed.", "see"), null);
  assert.ok(headwordForms("see").includes("seeing"));
});

test("matches the two spellings of a slash headword", () => {
  assert.equal(gap("My grandmother sent me a cheque for my birthday.", "cheque/check")?.hidden, "cheque");
});

test("every shipped example can be gapped at its own headword", () => {
  const index = JSON.parse(fs.readFileSync("public/atlas/index.json", "utf8"));
  const chunks = Math.ceil(index.words.length / index.chunk);
  let seen = 0;
  for (let n = 0; n < chunks; n++) {
    const rows = JSON.parse(fs.readFileSync(`public/atlas/entries/${n}.json`, "utf8"));
    for (const entry of rows) {
      for (const ex of entry.ex ?? []) {
        seen++;
        const g = gap(ex.en, entry.w);
        assert.ok(g, `${entry.id}: no cloze in “${ex.en}”`);
        assert.ok(headwordForms(entry.w).includes(g!.hidden.toLowerCase()), `${entry.id}: blanked “${g!.hidden}” in “${ex.en}”`);
      }
    }
  }
  assert.ok(seen > 14_000, `only ${seen} examples audited`);
});
