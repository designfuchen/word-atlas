import assert from "node:assert/strict";
import { test } from "node:test";
import type { Atlas, WordRef } from "../atlas/types";
import { matchSense, searchAtlas, sensesOf } from "./search";

const ref = (id: string, word: string, zh: string, more?: string, order = 0): WordRef => ({
  id,
  word,
  zh,
  more,
  ipa: "",
  cefr: 1,
  topic: 13,
  media: 0,
  order,
});

const wind = ref("wind", "wind", "n. 风", "v. 缠绕；卷绕|v. 蜿蜒；曲折延伸", 0);
const breeze = ref("breeze", "breeze", "n. 微风", undefined, 1);
const wander = ref("wander", "wander", "v. 蜿蜒；漫步", undefined, 2);
const atlas = { words: [wind, breeze, wander] } as unknown as Atlas;
const ids = (q: string) => searchAtlas(atlas, q).map((w) => w.id);

test("a later sense is still searchable", () => {
  assert.deepEqual(ids("缠绕"), ["wind"]);
  assert.ok(ids("蜿蜒").includes("wind"));
});

test("the matched sense is the one reported back", () => {
  assert.equal(matchSense(wind, "缠绕")?.sense, "v. 缠绕；卷绕");
  assert.equal(matchSense(wind, "蜿蜒")?.sense, "v. 蜿蜒；曲折延伸");
  assert.equal(matchSense(breeze, "缠绕"), null);
});

test("an exact meaning outranks a mention inside a longer gloss", () => {
  assert.equal(ids("风")[0], "wind");
});

test("the first sense still wins a tie", () => {
  // 蜿蜒 is sense 0 of `wander` but sense 2 of `wind`.
  assert.equal(ids("蜿蜒")[0], "wander");
});

test("single-sense rows are unaffected", () => {
  assert.deepEqual(sensesOf(breeze), ["n. 微风"]);
  assert.deepEqual(sensesOf(wind), ["n. 风", "v. 缠绕；卷绕", "v. 蜿蜒；曲折延伸"]);
});

test("English search keeps exact > prefix > infix", () => {
  assert.equal(ids("wind")[0], "wind");
  assert.deepEqual(ids("win"), ["wind"]);
  assert.ok(ids("and").includes("wander"));
  assert.deepEqual(ids(""), []);
});
