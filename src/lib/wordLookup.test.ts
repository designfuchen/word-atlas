import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import { createHash } from "node:crypto";
import type { Entry, WordRef } from "../atlas/types";
import { createWordLookup, tokenizeSentence } from "./wordLookup";

const original: Entry[] = JSON.parse(fs.readFileSync(new URL("../../data/word-atlas.json", import.meta.url), "utf8"));
const extra: { entries: Entry[]; aliases: Record<string, string> } = JSON.parse(fs.readFileSync(new URL("../../public/atlas/supplemental.json", import.meta.url), "utf8"));
const entries = [...original, ...extra.entries];
const words: WordRef[] = entries.map((e, order) => ({ id: e.id, word: e.w, zh: e.senses[0].zh, ipa: e.uk, cefr: 0, topic: 0, media: e.m || 0, order }));
const lookup = createWordLookup(words, extra.aliases);

test("every supplemental word and example has a matching bundled recording", () => {
  const manifest = JSON.parse(fs.readFileSync(new URL("../../data/supplemental-audio.json", import.meta.url), "utf8"));
  const recordings = new Map<string, { text: string; sha256: string; voice: string }>();
  for (const asset of manifest.assets) {
    const key = `${asset.kind}/${asset.id}`;
    assert.ok(!recordings.has(key), `Duplicate recording: ${key}`);
    recordings.set(key, asset);
    const bytes = fs.readFileSync(new URL(`../../public/atlas/audio/${key}.mp3`, import.meta.url));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), asset.sha256, key);
  }
  let expected = 0;
  for (const e of extra.entries) {
    assert.equal(e.m & 14, 14, `Missing word or first example recording: ${e.id}`);
    assert.equal(Boolean(e.m & 16), e.ex.length === 2, e.id);
    const spelling = ({ un: "U N", C: "C", x: "X" } as Record<string, string>)[e.w] || e.w;
    for (const kind of ["uk", "us"]) {
      const rec = recordings.get(`${kind}/${e.id}`);
      assert.equal(rec?.text, spelling + ".");
      assert.equal(rec?.voice, kind === "uk" ? "bf_emma" : "af_heart");
      expected++;
    }
    e.ex.forEach((ex, i) => {
      assert.equal(recordings.get(`${i === 0 ? "ex" : "ex2"}/${e.id}`)?.text, ex.en);
      expected++;
    });
  }
  assert.equal(recordings.size, expected);
});

test("preserves punctuation, whitespace, accented words and common abbreviations", () => {
  const text = "‘Students’ cafés aren't closed at 9 p.m. — T-shirts, too!";
  const parts = tokenizeSentence(text);
  assert.equal(parts.map((p) => p.text).join(""), text);
  assert.deepEqual(parts.filter((p) => p.word).map((p) => p.text), ["Students", "cafés", "aren't", "closed", "at", "p.m.", "T-shirts", "too"]);
  assert.deepEqual(tokenizeSentence(" 123! "), [{ text: " 123! ", word: false }]);
});

test("looks up inflections without confusing possessives and contractions", () => {
  for (const [word, base] of [["students", "student"], ["cities", "city"], ["went", "go"], ["is", "be"], ["has", "have"], ["clinicians", "clinician"], ["datasets", "dataset"]]) {
    assert.equal(lookup(word)?.word.toLowerCase(), base, word);
  }
  assert.equal(lookup("student’s")?.word, "student");
  assert.equal(lookup("it's")?.word, "it's");
  assert.equal(lookup("housing")?.word, "housing");
  assert.equal(lookup("orders")?.word, "order");
  assert.equal(lookup("screenings")?.word, "screening");
  assert.equal(lookup("haven’t")?.word, "haven't");
  assert.equal(lookup("___not_a_word___"), undefined);
});

test("every word in every original and supplemental example opens a real card", () => {
  const missing = new Set<string>();
  for (const entry of entries) for (const ex of entry.ex) for (const part of tokenizeSentence(ex.en)) {
    if (part.word && !lookup(part.text)) missing.add(part.text);
  }
  assert.deepEqual([...missing], []);
});

test("supplements preserve the original dataset and use real bilingual source examples", () => {
  const originalIds = new Set(original.map((e) => e.id));
  const allIds = new Set(entries.map((e) => e.id));
  assert.equal(allIds.size, entries.length);
  const sourceExamples = new Set(original.flatMap((e) => e.ex.map((ex) => JSON.stringify(ex))));
  for (const e of extra.entries) {
    assert.ok(!originalIds.has(e.id));
    assert.match(e.id, /^[a-z0-9-]{1,64}$/);
    assert.ok(e.senses.length > 0 && e.senses.every((s) => /[\u3400-\u9fff]/.test(s.zh)));
    assert.ok(e.ex.length > 0 && e.ex.length <= 2);
    assert.ok(Number.isInteger(e.m) && e.m >= 0 && e.m <= 31, `Unexpected supplemental media: ${e.id}`);
    for (const [kind, bit] of Object.entries({ uk: 2, us: 4, ex: 8, ex2: 16 })) {
      assert.equal(fs.existsSync(new URL(`../../public/atlas/audio/${kind}/${e.id}.mp3`, import.meta.url)), Boolean(e.m & bit), `Audio flag mismatch: ${kind}/${e.id}`);
    }
    for (const folder of ["img", "thumb"]) {
      assert.equal(fs.existsSync(new URL(`../../public/atlas/${folder}/${e.id}.webp`, import.meta.url)), Boolean(e.m & 1), `Image flag mismatch: ${folder}/${e.id}`);
    }
    for (const ex of e.ex) {
      assert.ok(sourceExamples.has(JSON.stringify(ex)), e.w);
      assert.ok(tokenizeSentence(ex.en).some((p) => p.word && lookup(p.text)?.id === e.id), `Example does not resolve to ${e.w}`);
    }
  }
  for (const id of Object.values(extra.aliases)) assert.ok(allIds.has(id), id);
});
