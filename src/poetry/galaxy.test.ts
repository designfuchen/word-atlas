import assert from "node:assert/strict";
import { test } from "node:test";
import { layoutPoems } from "./galaxy";
import type { PoemRef } from "./types";

const ref = (id: string, form: number, level: number): PoemRef => ({ id, title: id, author: "a", form, level, lines: 4, themes: [], first: "", order: 0 });
const poems = [...Array.from({ length: 30 }, (_, i) => ref(`e${i}`, 0, 0)), ...Array.from({ length: 30 }, (_, i) => ref(`h${i}`, 3, 3)), ref("m1", 5, 1)];
const atlas = { poems, forms: ["五言绝句", "七言绝句", "五言律诗", "七言律诗", "五言古诗", "七言古诗"], levels: ["入门", "初级", "中级", "进阶"] };
const radius = (l: ReturnType<typeof layoutPoems>, i: number) => Math.hypot(l.positions[i * 3], l.positions[i * 3 + 2]);
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

test("one star per poem, with matching ids and finite positions", () => {
  const l = layoutPoems(atlas);
  assert.equal(l.n, poems.length);
  assert.equal(l.ids.length, poems.length);
  assert.equal(l.positions.length, poems.length * 3);
  assert.equal(l.colors.length, poems.length * 3);
  assert.ok([...l.positions].every(Number.isFinite));
  assert.equal(l.index.get("h3"), 33);
});

test("only forms that have poems get an arm, labelled by form name", () => {
  const l = layoutPoems(atlas);
  assert.deepEqual(l.labels, ["五言绝句", "七言律诗", "七言古诗"]);
  assert.equal(l.topicCenters.length, 3);
  assert.deepEqual([...new Set(l.arm)], [0, 1, 2]);
});

test("harder poems sit further from the core", () => {
  const l = layoutPoems(atlas);
  const easy = mean(Array.from({ length: 30 }, (_, i) => radius(l, i)));
  const hard = mean(Array.from({ length: 30 }, (_, i) => radius(l, 30 + i)));
  assert.ok(hard > easy + 0.3, `${hard} vs ${easy}`);
});

test("the layout is deterministic and copes with an empty atlas", () => {
  assert.deepEqual([...layoutPoems(atlas).positions], [...layoutPoems(atlas).positions]);
  const empty = layoutPoems({ poems: [], forms: [], levels: ["a"] });
  assert.equal(empty.n, 0);
  assert.deepEqual(empty.labels, []);
});
