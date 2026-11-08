import { TOPIC_COLORS, type GalaxyLayout } from "../galaxy/layout";
import { hashSeed } from "../lib/text";
import type { PoemRef } from "./types";

export interface PoemGalaxyLayout extends GalaxyLayout {
  /** Name of each arm, in the same order as `topicCenters`. */
  labels: string[];
  /** Arm index of every star, in star order. */
  arm: number[];
}

/** Deterministic pseudo-random numbers per poem, so the galaxy looks the same everywhere. */
function rand(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);

/**
 * A spiral galaxy for poems: each poetic form owns an arm, easy poems sit near the core and
 * the hardest at the rim, so learning visibly travels outward. Only forms that have poems get
 * an arm. Star `i` is `poems[i]`.
 */
export function layoutPoems(atlas: { poems: PoemRef[]; forms: string[]; levels: string[] }): PoemGalaxyLayout {
  const poems = atlas.poems;
  const n = poems.length;
  const used = [...new Set(poems.map((p) => p.form))].sort((a, b) => a - b);
  const armOf = new Map(used.map((f, k) => [f, k]));
  const arms = Math.max(1, used.length);
  const top = Math.max(1, atlas.levels.length - 1);
  const counts = new Array(arms).fill(0);
  poems.forEach((p) => counts[armOf.get(p.form)!]++);
  const avg = n / arms || 1;

  const positions = new Float32Array(n * 3);
  const colors = new Float32Array(n * 3);
  const seeds = new Float32Array(n);
  const arm: number[] = [];
  poems.forEach((p, i) => {
    const r = rand(hashSeed(p.id));
    const gauss = () => (r() + r() + r() - 1.5) / 1.5;
    const a = armOf.get(p.form)!;
    arm.push(a);
    const radius = 0.1 + (p.level / top) * 0.62 + r() * 0.2;
    const base = (a / arms) * Math.PI * 2;
    const spread = Math.sqrt(Math.max(0.6, counts[a] / avg));
    const angle = base + radius * 3.4 + gauss() * (0.09 + 0.05 / radius) * spread;
    const thick = 0.05 * (1 - radius * 0.6) * spread;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = gauss() * thick;
    positions[i * 3 + 2] = Math.sin(angle) * radius;
    colors.set(rgb(TOPIC_COLORS[a % TOPIC_COLORS.length]), i * 3);
    seeds[i] = r();
  });

  // Label each arm half-way out.
  const mid = 0.55;
  return {
    n,
    positions,
    colors,
    seeds,
    ids: poems.map((p) => p.id),
    index: new Map(poems.map((p, i) => [p.id, i])),
    topicCenters: used.map((_, k) => {
      const ang = (k / arms) * Math.PI * 2 + mid * 3.4;
      return [Math.cos(ang) * mid, 0, Math.sin(ang) * mid] as [number, number, number];
    }),
    labels: used.map((f) => atlas.forms[f]),
    arm,
  };
}
