import assert from "node:assert/strict";
import { test } from "node:test";

// Import the store while window is still undefined, so its window-guarded listener
// block stays off, then install the minimal globals the store needs. We drive the
// cross-tab handler directly via the exported onExternalStorage().
const { store, flush, onExternalStorage, emptyProgress } = await import("./store");

const map = new Map<string, string>();
(globalThis as unknown as { window: unknown }).window = { setTimeout: () => 0, clearTimeout: () => {} };
(globalThis as unknown as { localStorage: unknown }).localStorage = {
  getItem: (k: string) => (map.has(k) ? (map.get(k) as string) : null),
  setItem: (k: string, v: string) => void map.set(k, v),
  removeItem: (k: string) => void map.delete(k),
};

const KEY = "word-atlas:v2:word-atlas-open";
const otherTab = (bookmarks: string[]) => JSON.stringify({ ...emptyProgress("word-atlas-open"), bookmarks });

test("adopts another tab's progress when this tab has nothing unsaved", () => {
  store.useDataset("word-atlas-open"); // loadedId set, dirty cleared
  flush();
  onExternalStorage(KEY, otherTab(["from-other-tab"]));
  assert.deepEqual(store.get().progress.bookmarks, ["from-other-tab"]);
});

test("does not clobber an unsaved local edit with another tab's write", () => {
  store.useDataset("word-atlas-open");
  flush(); // start clean (dirty = false)
  store.progress((p) => ({ ...p, bookmarks: ["local-unsaved"] })); // local edit -> dirty = true, not yet flushed
  onExternalStorage(KEY, otherTab(["from-other-tab"]));
  assert.deepEqual(store.get().progress.bookmarks, ["local-unsaved"], "the unsaved local edit survives");
  flush(); // persist our edit
  onExternalStorage(KEY, otherTab(["later"])); // now clean, so a later cross-tab write is adopted
  assert.deepEqual(store.get().progress.bookmarks, ["later"]);
});
