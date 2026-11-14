import assert from "node:assert/strict";
import { test } from "node:test";

// Import the store while window is still undefined, so its window-guarded
// listener block (which needs document.addEventListener) stays off, then install
// the minimal globals flush()/write() need.
const { store, flush } = await import("./store");

const map = new Map<string, string>();
let failWrites = false;
(globalThis as unknown as { window: unknown }).window = { setTimeout: () => 0, clearTimeout: () => {} };
(globalThis as unknown as { localStorage: unknown }).localStorage = {
  getItem: (k: string) => (map.has(k) ? (map.get(k) as string) : null),
  setItem: (k: string, v: string) => {
    if (failWrites) throw new Error("QuotaExceededError");
    map.set(k, v);
  },
  removeItem: (k: string) => void map.delete(k),
};

test("a save that failed (quota) is retried on the next flush instead of being dropped", () => {
  const key = "word-atlas:v2:word-atlas-open";
  store.useDataset("word-atlas-open"); // loadedId = dataset, so flush writes progress
  store.progress((p) => ({ ...p, bookmarks: ["star"] }));

  failWrites = true;
  flush(); // write throws -> save fails
  assert.equal(map.has(key), false, "nothing persisted during the failure");

  failWrites = false;
  flush(); // must retry the still-unsaved change
  assert.equal(map.has(key), true, "the change is persisted on the next flush");
  assert.ok((map.get(key) ?? "").includes("star"), "the retried write contains the bookmark");
});
