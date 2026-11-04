import assert from "node:assert/strict";
import { test } from "node:test";
import type { CardState } from "../store/srs";
import { filterPoems, isStatus, poemProgress, poemTexts, snippetOf, stateOf, type FilterSource } from "./filter";

const ref = (id: string, title: string, author: string, form: number, themes: number[], lines = 4, level = 0) => ({ id, title, author, form, level, lines, themes, first: "", order: 0 });
const atlas: FilterSource = {
  forms: ["五言绝句", "七言绝句"],
  themes: ["初中古诗", "思乡", "咏物"],
  levels: ["入门", "初级"],
  poems: [ref("a", "静夜思", "李白", 0, [0, 1]), ref("b", "咏鹅", "骆宾王", 0, [2]), ref("c", "枫桥夜泊", "张继", 1, [1], 4, 1), ref("d", "短", "某", 0, [], 1)],
};
const card = (s: number): CardState => ({ due: 1, s, d: 5, el: 0, sd: 1, ls: 0, reps: 3, lapses: 0, st: 2, seen: 1 });
const base = { q: "", status: "all" as const };
const ids = (f: Parameters<typeof filterPoems>[1], cards: Record<string, CardState> = {}, saved: string[] = []) => filterPoems(atlas, f, poemProgress(cards), saved).map((p) => p.id);

test("counts started and mastered couplets per poem from card ids", () => {
  const m = poemProgress({ "a:0": card(30), "a:1": card(2), "b:0": card(1) });
  assert.deepEqual(m.get("a"), { started: 2, mastered: 1 });
  assert.deepEqual(m.get("b"), { started: 1, mastered: 0 });
  assert.equal(m.get("c"), undefined);
});

test("a poem is mastered only when every askable couplet is", () => {
  assert.equal(stateOf({ lines: 4 }, undefined), "new");
  assert.equal(stateOf({ lines: 4 }, { started: 1, mastered: 0 }), "learning");
  assert.equal(stateOf({ lines: 4 }, { started: 2, mastered: 1 }), "learning");
  assert.equal(stateOf({ lines: 4 }, { started: 2, mastered: 2 }), "mastered");
  // 5 lines: two askable couplets, the lone last line does not count.
  assert.equal(stateOf({ lines: 5 }, { started: 2, mastered: 2 }), "mastered");
  // A single line has no askable couplet, so it can never be mastered.
  assert.equal(stateOf({ lines: 1 }, { started: 0, mastered: 0 }), "new");
});

test("filters by form, stage, theme and text, all at once", () => {
  assert.deepEqual(ids(base), ["a", "b", "c", "d"]);
  assert.deepEqual(ids({ ...base, form: "七言绝句" }), ["c"]);
  assert.deepEqual(ids({ ...base, stage: "初中古诗" }), ["a"]);
  assert.deepEqual(ids({ ...base, theme: "思乡" }), ["a", "c"]);
  assert.deepEqual(ids({ ...base, theme: "思乡", form: "五言绝句" }), ["a"]);
  assert.deepEqual(ids({ ...base, q: "张" }), ["c"]);
  assert.deepEqual(ids({ ...base, q: "夜" }), ["a", "c"]);
  assert.deepEqual(ids({ ...base, form: "不存在" }), []);
});

test("filters by learning state and bookmarks", () => {
  const cards = { "a:0": card(30), "a:1": card(30), "b:0": card(1) };
  assert.deepEqual(ids({ ...base, status: "mastered" }, cards), ["a"]);
  assert.deepEqual(ids({ ...base, status: "learning" }, cards), ["b"]);
  assert.deepEqual(ids({ ...base, status: "new" }, cards), ["c", "d"]);
  assert.deepEqual(ids({ ...base, status: "saved" }, cards, ["c", "gone"]), ["c"]);
  assert.deepEqual(ids({ ...base, status: "new", q: "枫" }, cards), ["c"]);
});

test("recognises valid status values only", () => {
  assert.equal(isStatus("learning"), true);
  assert.equal(isStatus("nope"), false);
  assert.equal(isStatus(undefined), false);
});

test("filters by difficulty level by name", () => {
  assert.deepEqual(ids({ ...base, level: "初级" }), ["c"]);
  assert.deepEqual(ids({ ...base, level: "入门", theme: "思乡" }), ["a"]);
  assert.deepEqual(ids({ ...base, level: "没有" }), []);
});

test("searches poem text once it is loaded, across the comma between lines", () => {
  const texts = poemTexts([
    { id: "a", lines: [{ zh: "床前明月光，" }, { zh: "疑是地上霜。" }] },
    { id: "c", lines: [{ zh: "月落乌啼霜满天，" }, { zh: "江枫渔火对愁眠。" }] },
  ]);
  const search = (q: string, t?: Map<string, string>) => filterPoems(atlas, { ...base, q }, poemProgress({}), [], t).map((p) => p.id);
  assert.deepEqual(search("明月光"), []);
  assert.deepEqual(search("明月光", texts), ["a"]);
  assert.deepEqual(search("霜", texts), ["a", "c"]);
  assert.deepEqual(search("明月光，疑是", texts), ["a"]);
  assert.deepEqual(search("光疑", texts), ["a"]);
  assert.deepEqual(search("李白", texts), ["a"]);
});

test("a snippet is the matching line, or the couplet when the query spans lines", () => {
  const lines = [{ zh: "床前明月光，" }, { zh: "疑是地上霜。" }];
  assert.equal(snippetOf(lines, "地上"), "疑是地上霜。");
  assert.equal(snippetOf(lines, "光疑"), "床前明月光，疑是地上霜。");
  assert.equal(snippetOf(lines, "没有"), null);
  assert.equal(snippetOf(lines, "，"), null);
});
