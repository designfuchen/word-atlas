import { useSyncExternalStore } from "react";
import { read, sanitizeProgress, write, type Progress } from "../store/store";
import type { PoetrySession } from "./quiz";

/**
 * Poetry keeps its own progress next to the word store instead of switching its dataset,
 * so the word pages (Today, Me, backups) never see poetry cards. Cards are keyed by
 * couplet id; FSRS settings such as retention are shared with the word store.
 */
export const POETRY_ID = "poetry-tang";
const PROGRESS_KEY = `word-atlas:v2:${POETRY_ID}`;
const PREFS_KEY = "word-atlas:poetry:prefs";

export interface PoetryPrefs {
  pinyin: boolean;
  /** New poems per day. */
  dailyNew: number;
  /** Read aloud at a slower pace. */
  slow: boolean;
}

export const defaultPrefs: PoetryPrefs = { pinyin: true, dailyNew: 2, slow: false };

export function sanitizePrefs(v: unknown): PoetryPrefs {
  const out = { ...defaultPrefs };
  if (!v || typeof v !== "object") return out;
  const p = v as Record<string, unknown>;
  if (typeof p.pinyin === "boolean") out.pinyin = p.pinyin;
  if (typeof p.slow === "boolean") out.slow = p.slow;
  if (typeof p.dailyNew === "number" && Number.isFinite(p.dailyNew) && p.dailyNew >= 0 && p.dailyNew <= 20) out.dailyNew = Math.round(p.dailyNew);
  return out;
}

interface State {
  progress: Progress;
  prefs: PoetryPrefs;
  /** The running study session. Kept in memory only: answered cards are already saved in `progress`. */
  session: PoetrySession | null;
}

let state: State = {
  progress: sanitizeProgress(read(PROGRESS_KEY), POETRY_ID),
  prefs: sanitizePrefs(read(PREFS_KEY)),
  session: null,
};
const listeners = new Set<() => void>();
let saveTimer: number | undefined;
let dirty = false;

function emit() {
  listeners.forEach((l) => l());
}

export function flushPoetry() {
  window.clearTimeout(saveTimer);
  if (!dirty) return;
  dirty = false;
  write(PROGRESS_KEY, state.progress);
  write(PREFS_KEY, state.prefs);
}

function scheduleSave() {
  dirty = true;
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(flushPoetry, 250);
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", flushPoetry);
  document.addEventListener("visibilitychange", () => document.visibilityState === "hidden" && flushPoetry());
}

export const poetryStore = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  progress(fn: (p: Progress) => Progress) {
    state = { ...state, progress: fn(state.progress) };
    emit();
    scheduleSave();
  },
  session(fn: (s: PoetrySession | null) => PoetrySession | null) {
    state = { ...state, session: fn(state.session) };
    emit();
  },
  prefs(patch: Partial<PoetryPrefs>) {
    state = { ...state, prefs: sanitizePrefs({ ...state.prefs, ...patch }) };
    emit();
    scheduleSave();
  },
};

export function usePoetryStore<T>(select: (s: State) => T): T {
  return useSyncExternalStore(poetryStore.subscribe, () => select(state), () => select(state));
}

export function togglePoemBookmark(id: string) {
  poetryStore.progress((p) => ({
    ...p,
    bookmarks: p.bookmarks.includes(id) ? p.bookmarks.filter((x) => x !== id) : [id, ...p.bookmarks],
  }));
}
