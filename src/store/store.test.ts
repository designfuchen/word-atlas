import assert from "node:assert/strict";
import { test } from "node:test";
import { sanitizeProgress, sanitizeSettings } from "./store";

const card = { due: 1, s: 2, d: 5, el: 0, sd: 1, ls: 0, reps: 1, lapses: 0, st: 2, seen: 1 };

test("keeps valid progress and drops malformed records", () => {
  const p = sanitizeProgress(
    {
      version: 2,
      cards: { ok: card, bad: { ...card, d: 99 }, worse: "x" },
      bookmarks: ["ok", 3],
      days: { "2026-10-25": { n: 1, r: 2, c: 1, t: 30 }, nope: { n: 1, r: 1, c: 1, t: 1 } },
      typing: [{ at: 1, mode: "word", items: 10, wpm: 40, accuracy: 98 }, { at: 1, mode: "hack", items: 1, wpm: 1, accuracy: 1 }],
    },
    "word-atlas-open",
  );
  assert.deepEqual(Object.keys(p.cards), ["ok"]);
  assert.deepEqual(p.bookmarks, ["ok"]);
  assert.deepEqual(Object.keys(p.days), ["2026-10-25"]);
  assert.equal(p.typing.length, 1);
});

test("rejects other versions and unknown settings", () => {
  assert.deepEqual(sanitizeProgress({ version: 1, cards: { ok: card } }, "x").cards, {});
  const s = sanitizeSettings({ accent: "fr", dailyNew: 1e9, theme: "dark", retention: 0.5 });
  assert.equal(s.accent, "uk");
  assert.equal(s.dailyNew, 10);
  assert.equal(s.theme, "dark");
  assert.equal(s.retention, 0.9);
});

const session = {
  id: "s1",
  started: 1,
  index: 0,
  steps: [
    { id: "library", kind: "intro" },
    { id: "library", kind: "meaning", options: ["library", "museum", "office"] },
  ],
  graded: { library: 3 },
  newIds: ["library"],
  reviewIds: [],
};

test("keeps a well-formed session", () => {
  const p = sanitizeProgress({ version: 2, session }, "word-atlas-open");
  assert.equal(p.session?.id, "s1");
  assert.equal(p.session?.steps.length, 2);
});

test("drops a session missing newIds/reviewIds/started without losing other progress", () => {
  for (const missing of ["started", "newIds", "reviewIds"]) {
    const broken: Record<string, unknown> = { ...session };
    delete broken[missing];
    const p = sanitizeProgress({ version: 2, cards: { ok: card }, session: broken }, "word-atlas-open");
    assert.equal(p.session, null, `session with missing ${missing} should be dropped`);
    assert.deepEqual(Object.keys(p.cards), ["ok"]);
  }
});

test("drops a session with malformed steps or an out-of-range index", () => {
  const badSteps = { ...session, steps: [null, { id: "library", kind: "nope" }] };
  assert.equal(sanitizeProgress({ version: 2, session: badSteps }, "x").session, null);

  const badOptions = { ...session, steps: [{ id: "library", kind: "meaning", options: [1, 2] }] };
  assert.equal(sanitizeProgress({ version: 2, session: badOptions }, "x").session, null);

  const clamped = sanitizeProgress({ version: 2, session: { ...session, index: 99 } }, "x");
  assert.equal(clamped.session?.index, session.steps.length);
});

test("ignores prototype keys in a restored card map", () => {
  const p = sanitizeProgress({ version: 2, cards: JSON.parse('{"__proto__": {"due": 1}}') }, "x");
  assert.deepEqual(Object.keys(p.cards), []);
  assert.equal(({} as Record<string, unknown>).due, undefined);
});
