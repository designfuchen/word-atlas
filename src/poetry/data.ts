import type { Poem, PoemRef, PoemRow, PoetryAtlas } from "./types";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const url = (p: string) => `${BASE}/poetry/${p}`;

interface IndexFile {
  id: string;
  name: string;
  count: number;
  chunk: number;
  forms: string[];
  levels: string[];
  themes: string[];
  poems: PoemRow[];
}

export async function loadPoetry(): Promise<PoetryAtlas> {
  const res = await fetch(url("index.json"));
  if (!res.ok) throw new Error(`诗词索引加载失败（${res.status}）`);
  const idx = (await res.json()) as IndexFile;
  const poems: PoemRef[] = idx.poems.map((r, order) => ({
    id: r[0],
    title: r[1],
    author: r[2],
    form: r[3],
    level: r[4],
    lines: r[5],
    themes: r[6],
    first: r[7] ?? "",
    order,
  }));
  const byId = new Map(poems.map((p) => [p.id, p]));
  const cache = new Map<string, Poem>();
  const pending = new Map<number, Promise<void>>();

  const loadChunk = (n: number) => {
    let p = pending.get(n);
    if (!p) {
      p = fetch(url(`poems/${n}.json`))
        .then((r) => {
          if (!r.ok) throw new Error(`诗词加载失败（${r.status}）`);
          return r.json() as Promise<Poem[]>;
        })
        .then((list) => list.forEach((e) => cache.set(e.id, e)))
        .catch((e) => {
          pending.delete(n);
          throw e;
        });
      pending.set(n, p);
    }
    return p;
  };

  return {
    id: idx.id,
    name: idx.name,
    count: idx.count,
    forms: idx.forms,
    levels: idx.levels,
    themes: idx.themes,
    poems,
    byId,
    peek: (id) => cache.get(id),
    async all() {
      await Promise.all(Array.from({ length: Math.ceil(idx.count / idx.chunk) }, (_, n) => loadChunk(n)));
      return poems.map((r) => cache.get(r.id)!);
    },
    async poem(id) {
      const hit = cache.get(id);
      if (hit) return hit;
      const ref = byId.get(id);
      if (!ref) throw new Error(`没有找到诗词 ${id}`);
      await loadChunk(Math.floor(ref.order / idx.chunk));
      const p = cache.get(id);
      if (!p) throw new Error(`没有找到诗词 ${id}`);
      return p;
    },
  };
}
