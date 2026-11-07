import assert from "node:assert/strict";
import { test } from "node:test";
import type { Atlas, WordRef } from "../atlas/types";
import { distractors, senses } from "./session";

const word = (id: string, text: string, zh: string, order: number, cefr = 2): WordRef => ({
  id,
  word: text,
  zh,
  ipa: "",
  cefr,
  topic: 0,
  media: 1,
  order,
});

const spring = word("spring", "spring", "n. 春天；弹簧 | n. 泉水", 0);
const words = [
  spring,
  word("fountain", "fountain", "n. 泉水", 1),
  word("sedan", "sedan", "n. 轿车", 2),
  word("car", "car", "n. 小汽车；轿车", 3),
  word("cloud", "cloud", "n. 云", 4),
  word("meadow", "meadow", "n. 草地", 5),
  word("winter", "winter", "n. 冬天", 6),
];
const atlas = { words } as unknown as Atlas;

test("splits a gloss into every sense segment", () => {
  assert.deepEqual([...senses("n. 春天；弹簧 | n. 泉水")].sort(), ["春天", "弹簧", "泉水"].sort());
  assert.deepEqual([...senses("v. 错过；未赶上 | v. 想念")], ["错过", "未赶上", "想念"]);
});

test("never offers a distractor that shares any meaning with the answer", () => {
  for (let seed = 1; seed <= 200; seed++) {
    const ids = distractors(atlas, spring, "meaning", seed);
    assert.ok(!ids.includes("fountain"), `seed ${seed} offered 泉水 for spring`);
  }
});

test("never offers two distractors that share a meaning", () => {
  for (let seed = 1; seed <= 200; seed++) {
    const ids = distractors(atlas, spring, "meaning", seed).filter((id) => id !== spring.id);
    for (let i = 0; i < ids.length; i++)
      for (let j = i + 1; j < ids.length; j++) {
        const a = senses(words.find((w) => w.id === ids[i])!.zh);
        const b = senses(words.find((w) => w.id === ids[j])!.zh);
        assert.ok(![...a].some((x) => b.has(x)), `seed ${seed}: ${ids[i]} and ${ids[j]} share a meaning`);
      }
  }
});
