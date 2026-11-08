import { createContext, useContext, useEffect, useState } from "react";
import { loadPoetry } from "./data";
import type { Poem, PoetryAtlas } from "./types";

export const PoetryContext = createContext<PoetryAtlas | null>(null);

export function usePoetry() {
  const a = useContext(PoetryContext);
  if (!a) throw new Error("Poetry not loaded");
  return a;
}

/** Loads the poetry index the first time it is needed, so the word atlas never pays for it. */
export function usePoetryLoader() {
  const [atlas, setAtlas] = useState<PoetryAtlas | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    loadPoetry().then(
      (a) => live && setAtlas(a),
      (e: Error) => live && setError(e.message),
    );
    return () => {
      live = false;
    };
  }, []);
  return { atlas, error };
}

/** Full poem for an id; returns the cached copy synchronously when available. */
export function usePoem(id: string | null | undefined) {
  const atlas = usePoetry();
  const [poem, setPoem] = useState<Poem | undefined>(() => (id ? atlas.peek(id) : undefined));
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!id) return;
    const hit = atlas.peek(id);
    setPoem(hit);
    setError(null);
    if (hit) return;
    let live = true;
    atlas.poem(id).then(
      (p) => live && setPoem(p),
      (e: Error) => live && setError(e.message),
    );
    return () => {
      live = false;
    };
  }, [atlas, id]);
  return { poem: poem?.id === id ? poem : undefined, error };
}
