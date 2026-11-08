import assert from "node:assert/strict";
import { test } from "node:test";
import { Rating, type CardState } from "../store/srs";
import { dayKey, emptyProgress } from "../store/store";
import { couplets } from "./couplets";
import { answerOf, buildSession, dueCouplets, gradeFor, hanChars, makePool, makeStep, parseCoupletId, pickKind, strip, todayPlan, type PoetryStep } from "./quiz";
import type { Poem } from "./types";

const line = (zh: string) => ({ zh, py: [...zh].map(() => "") });
const poem = (id: string, ...lines: string[]): Poem => ({ id, title: id, author: "a", dynasty: "唐", form: "五言绝句", themes: [], level: 0, lines: lines.map(line), gist: "" });
const pool = makePool([
  poem("p1", "白日依山尽，", "黄河入海流。", "欲穷千里目，", "更上一层楼。"),
  poem("p2", "红豆生南国，", "春来发几枝？", "愿君多采撷，", "此物最相思。"),
  poem("p3", "床前明月光，", "疑是地上霜。", "举头望明月，", "低头思故乡。"),
]);
const card = (due: number, s = 1): CardState => ({ due, s, d: 5, el: 0, sd: 1, ls: 0, reps: 1, lapses: 0, st: 2, seen: 1 });
type Quiz = Extract<PoetryStep, { id: string }>;

test("strips punctuation and parses couplet ids", () => {
  assert.equal(strip("黄河入海流。"), "黄河入海流");
  assert.deepEqual(hanChars("a春，b"), ["春"]);
  assert.deepEqual(parseCoupletId("a-b:3"), { poemId: "a-b", n: 3 });
});

test("next step offers the answer and three distinct same-length lines", () => {
  const c = couplets(pool.byId.get("p1")!)[0];
  const step = makeStep(pool, c, "next", 7) as Quiz;
  assert.equal(step.kind, "next");
  assert.equal(step.options!.length, 4);
  assert.equal(new Set(step.options).size, 4);
  assert.ok(step.options!.includes("黄河入海流"));
  assert.ok(step.options!.every((o) => o.length === 5));
});

test("cloze hides one character and offers it among four", () => {
  const c = couplets(pool.byId.get("p3")!)[0];
  const step = makeStep(pool, c, "cloze", 3) as Quiz;
  assert.equal(step.kind, "cloze");
  assert.equal(step.options!.length, 4);
  assert.equal(new Set(step.options).size, 4);
  assert.ok(step.options!.includes(answerOf(pool, step)));
  assert.equal(answerOf(pool, step), hanChars("疑是地上霜。")[step.blank!]);
});

test("arrange shuffles the answer characters into a different order", () => {
  const c = couplets(pool.byId.get("p2")!)[0];
  const step = makeStep(pool, c, "arrange", 11) as Quiz;
  assert.equal(step.kind, "arrange");
  assert.deepEqual([...step.tokens!].sort(), hanChars("春来发几枝？").sort());
  assert.notEqual(step.tokens!.join(""), answerOf(pool, step));
});

test("falls back to next when a line is too short for the format", () => {
  const short = makePool([poem("s", "春眠，", "晓。", "x", "y"), ...pool.poems]);
  const step = makeStep(short, couplets(short.byId.get("s")!)[0], "arrange", 1);
  assert.equal(step.kind, "next");
});

test("kind progresses with card stability and grading rewards speed", () => {
  assert.equal(pickKind(undefined, "p1:0", 1), "next");
  assert.equal(pickKind(card(0, 1), "p1:0", 1), "next");
  assert.ok(["next", "cloze"].includes(pickKind(card(0, 4), "p1:0", 1)));
  assert.equal(gradeFor("next", false, 100), Rating.Again);
  assert.equal(gradeFor("next", true, 20000), Rating.Hard);
  assert.equal(gradeFor("next", true, 3000), Rating.Good);
  assert.equal(gradeFor("arrange", true, 5000), Rating.Easy);
});

test("a fresh session reads each new poem then recalls its couplets", () => {
  const s = buildSession(pool, emptyProgress("x"), 2, { seed: 5 });
  assert.deepEqual(s.newPoems, ["p1", "p2"]);
  assert.deepEqual(s.steps.map((x) => x.kind === "intro"), [true, false, false, true, false, false]);
  assert.deepEqual(s.reviewIds, []);
});

test("due couplets come first and the daily limit counts poems already begun today", () => {
  const p = emptyProgress("x");
  p.cards = { "p3:0": card(100), "p3:1": card(50), "p2:0": card(Date.now() + 1e9) };
  p.days = { [dayKey()]: { n: 1, r: 0, c: 0, t: 0 } };
  const due = dueCouplets(p, pool, 200).map((c) => c.id);
  assert.deepEqual(due, ["p3:1", "p3:0"]);
  const plan = todayPlan(p, pool, 2, 200);
  assert.deepEqual(plan.fresh.map((x) => x.id), ["p1"]);
  const s = buildSession(pool, p, 2, { seed: 200, now: 200 });
  assert.deepEqual(s.steps.slice(0, 2).map((x) => (x as Quiz).id), ["p3:1", "p3:0"]);
  // p2 was begun (one card) but its other couplet was never asked, so it follows the due reviews.
  assert.equal((s.steps[2] as Quiz).id, "p2:1");
  assert.equal(s.steps[3].kind, "intro");
});

test("practising a single poem skips the intro once it has been started", () => {
  const p = emptyProgress("x");
  p.cards = { "p1:0": card(Date.now() + 1e9) };
  const s = buildSession(pool, p, 2, { onlyPoem: "p1", seed: 1 });
  assert.equal(s.steps.length, 2);
  assert.ok(s.steps.every((x) => x.kind !== "intro"));
  assert.deepEqual(s.newPoems, []);
});

test("couplets never asked in a begun poem come back, and explicit ids drive a retry session", () => {
  const p = emptyProgress("x");
  p.cards = { "p1:0": card(Date.now() + 1e9) };
  const plan = todayPlan(p, pool, 0, 5);
  assert.deepEqual(plan.due.map((c) => c.id), ["p1:1"]);
  const s = buildSession(pool, p, 0, { ids: ["p2:1", "p3:0"], seed: 4 });
  assert.deepEqual(s.reviewIds, ["p2:1", "p3:0"]);
  assert.equal(s.steps.length, 2);
});
