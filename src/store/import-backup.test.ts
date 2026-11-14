import assert from "node:assert/strict";
import { test } from "node:test";
import type { CardState } from "./srs";

// Import the store before defining window so its listener block stays off.
const { store, importBackup } = await import("./store");

const map = new Map<string, string>();
(globalThis as unknown as { window: unknown }).window = { setTimeout: () => 0, clearTimeout: () => {} };
(globalThis as unknown as { localStorage: unknown }).localStorage = {
  getItem: (k: string) => (map.has(k) ? (map.get(k) as string) : null),
  setItem: (k: string, v: string) => void map.set(k, v),
  removeItem: (k: string) => void map.delete(k),
};

const card: CardState = { due: 1, s: 2, d: 5, el: 0, sd: 1, ls: 0, reps: 1, lapses: 0, st: 2, seen: 1 };

test("a backup whose inner progress.version is unsupported is rejected, not silently wiped", () => {
  store.useDataset("word-atlas-open");
  store.progress((p) => ({ ...p, cards: { keep: card } }));

  const backup = JSON.stringify({
    app: "word-atlas",
    version: 2,
    progress: { version: 1, datasetId: "word-atlas-open", cards: { keep: card } },
    settings: {},
  });
  const res = importBackup(backup);

  assert.equal(res.ok, false, "an unreadable backup must not report success");
  assert.deepEqual(Object.keys(store.get().progress.cards), ["keep"], "existing progress must survive a rejected import");
});
