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

const session = { id: "s1", started: 1, steps: [], index: 0, graded: {}, newIds: [], reviewIds: [] };

test("keeps a well-formed session", () => {
  const p = sanitizeProgress({ version: 2, session }, "x");
  assert.equal(p.session?.id, "s1");
});

test("drops a session missing newIds/reviewIds/started without losing other progress", () => {
  for (const key of ["newIds", "reviewIds", "started"] as const) {
    const { [key]: _drop, ...partial } = session;
    const p = sanitizeProgress({ version: 2, cards: { ok: card }, session: partial }, "word-atlas-open");
    assert.equal(p.session, null, `session with missing ${key} should be dropped`);
    assert.deepEqual(Object.keys(p.cards), ["ok"], "the rest of progress is kept");
  }
});
