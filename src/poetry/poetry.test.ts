import assert from "node:assert/strict";
import { test } from "node:test";
import type { CardState } from "../store/srs";
import { coupletId, couplets, poemStatus, quizzable } from "./couplets";
import { sanitizePrefs } from "./store";
import type { Poem } from "./types";

const line = (zh: string) => ({ zh, py: [...zh].map(() => "") });
const poem = (n: number): Poem => ({
  id: "p",
  title: "t",
  author: "a",
  dynasty: "唐",
  form: "五言绝句",
  themes: [],
  level: 0,
  lines: Array.from({ length: n }, (_, i) => line(`第${i}句，`)),
  gist: "",
});
const card = (s: number): CardState => ({ due: 1, s, d: 5, el: 0, sd: 1, ls: 0, reps: 3, lapses: 0, st: 2, seen: 1 });

test("pairs lines into couplets and keeps a lone last line", () => {
  const cs = couplets(poem(5));
  assert.deepEqual(cs.map((c) => c.id), ["p:0", "p:1", "p:2"]);
  assert.equal(cs[1].up.zh, "第2句，");
  assert.equal(cs[1].down?.zh, "第3句，");
  assert.equal(cs[2].down, undefined);
  assert.deepEqual(cs.map(quizzable), [true, true, false]);
  assert.equal(coupletId("p", 2), "p:2");
});

test("poem status counts only complete couplets", () => {
  const status = poemStatus(poem(5), { "p:0": card(30), "p:1": card(2), "p:2": card(30) });
  assert.deepEqual(status, { total: 2, started: 2, mastered: 1 });
});

test("prefs fall back to defaults on bad input", () => {
  assert.deepEqual(sanitizePrefs(null), { pinyin: true, dailyNew: 2, slow: false });
  assert.deepEqual(sanitizePrefs({ pinyin: false, dailyNew: 1e9, slow: "x" }), { pinyin: false, dailyNew: 2, slow: false });
  assert.equal(sanitizePrefs({ slow: true }).slow, true);
  assert.equal(sanitizePrefs({ dailyNew: 4.4 }).dailyNew, 4);
});
