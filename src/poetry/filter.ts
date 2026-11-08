import { isMastered, type CardState } from "../store/srs";
import type { PoemRef } from "./types";

/** School stages are tags in the source data; the list shows them as their own filter. */
export const STAGES = ["小学古诗", "初中古诗", "高中古诗"];

export type Status = "all" | "new" | "learning" | "mastered" | "saved";
export const STATUS: [Status, string][] = [
  ["all", "全部"],
  ["new", "未学"],
  ["learning", "学习中"],
  ["mastered", "已掌握"],
  ["saved", "收藏"],
];
export const isStatus = (v: unknown): v is Status => STATUS.some(([k]) => k === v);

export type PoemState = "new" | "learning" | "mastered";

export interface PoemProgress {
  started: number;
  mastered: number;
}

/** Per poem: couplets started and mastered, counted from card ids (`<poemId>:<n>`). */
export function poemProgress(cards: Record<string, CardState>): Map<string, PoemProgress> {
  const m = new Map<string, PoemProgress>();
  for (const [k, c] of Object.entries(cards)) {
    const id = k.slice(0, k.lastIndexOf(":"));
    const cur = m.get(id) ?? { started: 0, mastered: 0 };
    cur.started++;
    if (isMastered(c)) cur.mastered++;
    m.set(id, cur);
  }
  return m;
}

/** Couplets that can be asked in a poem; a lone last line is not one. */
export const coupletCount = (p: Pick<PoemRef, "lines">) => Math.floor(p.lines / 2);

/** A poem is mastered when every askable couplet is, learning once any couplet has been asked. */
export function stateOf(p: Pick<PoemRef, "lines">, v: PoemProgress | undefined): PoemState {
  const total = coupletCount(p);
  if (v && total > 0 && v.mastered >= total) return "mastered";
  return v && v.started > 0 ? "learning" : "new";
}

export interface ListFilter {
  q: string;
  /** Names rather than indexes, so links stay valid if the data is regenerated. */
  form?: string;
  stage?: string;
  theme?: string;
  level?: string;
  status: Status;
}

export interface FilterSource {
  poems: PoemRef[];
  forms: string[];
  themes: string[];
  levels: string[];
}

/** Text without punctuation or spaces, so a search can span the comma between two lines. */
export const squash = (s: string) => s.replace(/[^㐀-鿿A-Za-z0-9]/g, "");

/**
 * Poems matching every filter. `texts` maps poem id to its full text; without it the search
 * covers only titles and poets (the index has no poem text until the chunks are loaded).
 */
export function filterPoems(atlas: FilterSource, f: ListFilter, progress: Map<string, PoemProgress>, bookmarks: string[], texts?: Map<string, string>): PoemRef[] {
  const q = f.q.trim();
  const qs = squash(q);
  const form = f.form ? atlas.forms.indexOf(f.form) : -1;
  const stage = f.stage ? atlas.themes.indexOf(f.stage) : -1;
  const theme = f.theme ? atlas.themes.indexOf(f.theme) : -1;
  const level = f.level ? atlas.levels.indexOf(f.level) : -1;
  const saved = new Set(bookmarks);
  return atlas.poems.filter((p) => {
    if (f.form && p.form !== form) return false;
    if (f.stage && !p.themes.includes(stage)) return false;
    if (f.theme && !p.themes.includes(theme)) return false;
    if (f.level && p.level !== level) return false;
    if (q && !p.title.includes(q) && !p.author.includes(q) && !(qs && texts?.get(p.id)?.includes(qs))) return false;
    if (f.status === "saved") return saved.has(p.id);
    if (f.status === "all") return true;
    return stateOf(p, progress.get(p.id)) === f.status;
  });
}

/** The line (or couplet, when the query spans two lines) of a poem that contains the query. */
export function snippetOf(lines: { zh: string }[], q: string): string | null {
  const qs = squash(q);
  if (!qs) return null;
  for (let i = 0; i < lines.length; i++) if (squash(lines[i].zh).includes(qs)) return lines[i].zh;
  for (let i = 0; i + 1 < lines.length; i++) if (squash(lines[i].zh + lines[i + 1].zh).includes(qs)) return lines[i].zh + lines[i + 1].zh;
  return null;
}

/** Full text of each poem for searching, without punctuation. */
export const poemTexts = (poems: { id: string; lines: { zh: string }[] }[]) => new Map(poems.map((p) => [p.id, squash(p.lines.map((l) => l.zh).join(""))]));
