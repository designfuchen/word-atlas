import assert from "node:assert/strict";
import { test } from "node:test";
import type { Atlas, WordRef } from "../atlas/types";
import { distractors } from "./session";

let n = 0;
const w = (word: string, zh: string): WordRef => ({ id: `w${n}`, word, zh, ipa: "", cefr: 2, topic: 0, media: 0, order: ++n });

// distractors() only reads atlas.words, so a minimal atlas is enough.
const atlasOf = (words: WordRef[]) => ({ words } as unknown as Atlas);

test("never offers a distractor that shares any meaning with the answer", () => {
  const spring = w("spring", "n. 春天；弹簧 | n. 泉水");
  const fountain = w("fountain", "n. 泉水"); // 泉水 is a *secondary* sense of spring
  const clean1 = w("summer", "n. 夏天");
  const clean2 = w("winter", "n. 冬天");
  const atlas = atlasOf([spring, fountain, clean1, clean2]);
  const options = distractors(atlas, spring, "meaning", 1);
  assert.ok(options.includes(spring.id), "the correct answer is always present");
  assert.ok(!options.includes(fountain.id), "a word meaning 泉水 must not be a distractor for spring");
});

test("never offers two distractors that share a meaning", () => {
  const spring = w("spring", "n. 春天");
  const car = w("car", "n. 小汽车；轿车");
  const automobile = w("automobile", "n. 轿车"); // shares 轿车 with car, different full gloss
  const book = w("book", "n. 书本");
  const atlas = atlasOf([spring, car, automobile, book]);
  const options = distractors(atlas, spring, "meaning", 1);
  assert.ok(!(options.includes(car.id) && options.includes(automobile.id)), "car and automobile share 轿车; only one may appear");
});
