import { createEmptyCard, fsrs, Rating, State, type Card, type Grade } from "ts-fsrs";

/** Serialized FSRS card. Dates are epoch milliseconds to keep backups small and JSON-safe. */
export interface CardState {
  due: number;
  s: number;
  d: number;
  el: number;
  sd: number;
  ls: number;
  reps: number;
  lapses: number;
  st: 0 | 1 | 2 | 3;
  last?: number;
  /** First time the learner met the word. */
  seen: number;
  /** 1 when the learner marked the word as already known by hand. */
  k?: 1;
  /** When the manual "known" mark was set. */
  kAt?: number;
  /** The card exists only because of that mark — it was never answered. */
  kNew?: 1;
}

export { Rating };
export type { Grade };

const schedulers = new Map<number, ReturnType<typeof fsrs>>();
const scheduler = (retention: number) => {
  let s = schedulers.get(retention);
  if (!s) {
    s = fsrs({ request_retention: retention, enable_fuzz: true, enable_short_term: true, learning_steps: ["1m", "10m"], relearning_steps: ["10m"] });
    schedulers.set(retention, s);
  }
  return s;
};

const toCard = (c: CardState): Card => ({
  due: new Date(c.due),
  stability: c.s,
  difficulty: c.d,
  elapsed_days: c.el,
  scheduled_days: c.sd,
  learning_steps: c.ls,
  reps: c.reps,
  lapses: c.lapses,
  state: c.st as State,
  last_review: c.last ? new Date(c.last) : undefined,
});

const fromCard = (c: Card, seen: number): CardState => ({
  due: c.due.getTime(),
  s: c.stability,
  d: c.difficulty,
  el: c.elapsed_days,
  sd: c.scheduled_days,
  ls: c.learning_steps,
  reps: c.reps,
  lapses: c.lapses,
  st: c.state as CardState["st"],
  last: c.last_review?.getTime(),
  seen,
});

export function review(prev: CardState | undefined, grade: Grade, now: number, retention = 0.9): CardState {
  const card = prev ? toCard(prev) : createEmptyCard(new Date(now));
  const next = scheduler(retention).next(card, new Date(now), grade).card;
  const out = fromCard(next, prev?.seen ?? now);
  // Answering a manually-known word must not silently drop the mark; once it has
  // real memory it is no longer a mark-only card.
  if (prev?.k === 1) return { ...out, k: 1, kAt: prev.kAt };
  return out;
}

/** Next interval for each grade, for button labels. */
export function preview(prev: CardState | undefined, now: number, retention = 0.9): Record<Grade, number> {
  const card = prev ? toCard(prev) : createEmptyCard(new Date(now));
  const p = scheduler(retention).repeat(card, new Date(now));
  return {
    [Rating.Again]: p[Rating.Again].card.due.getTime() - now,
    [Rating.Hard]: p[Rating.Hard].card.due.getTime() - now,
    [Rating.Good]: p[Rating.Good].card.due.getTime() - now,
    [Rating.Easy]: p[Rating.Easy].card.due.getTime() - now,
  } as Record<Grade, number>;
}

export function retrievability(c: CardState, now: number, retention = 0.9) {
  return scheduler(retention).get_retrievability(toCard(c), new Date(now), false) as number;
}

/** Long-term memory: the card would still be recalled with 90% odds three weeks after review. */
export const MASTERED_STABILITY = 21;

/**
 * Three user-facing states:
 * - new      never met
 * - learning still being drilled
 * - mastered done — either FSRS proved it or the learner said so by hand.
 *
 * "Mastered" therefore has two sources. Both stop scheduling; only the manual one
 * can be undone, which is what the `k` flag records.
 */
export type WordState = "new" | "learning" | "mastered";

/** Marked by hand as already known. */
export const isManual = (c?: CardState) => !!c && c.k === 1;

/** Reached the memory threshold through reviews. */
export const isAutoMastered = (c?: CardState) => !!c && c.k !== 1 && c.st === 2 && c.s >= MASTERED_STABILITY;

/**
 * Mastered = 学完了，不再排复习。手动标记与 FSRS 达标等价，
 * 所以界面只呈现这一个状态（撤销只对手动标记有效）。
 */
export const isMastered = (c?: CardState) => isManual(c) || isAutoMastered(c);
export const isLearning = (c?: CardState) => !!c && !isMastered(c);

export function wordState(c?: CardState): WordState {
  if (!c) return "new";
  return isMastered(c) ? "mastered" : "learning";
}

/**
 * Mark a word as mastered by hand. An existing card keeps its memory; a word that
 * was never studied gets a placeholder so counts and filters can see it — that
 * placeholder is dropped again by `clearCardManual`.
 */
export function markCardManual(prev: CardState | undefined, now: number): CardState {
  if (prev) return { ...prev, k: 1, kAt: now };
  return { due: now, s: 0, d: 0, el: 0, sd: 0, ls: 0, reps: 0, lapses: 0, st: 0, seen: now, k: 1, kAt: now, kNew: 1 };
}

/** A card that carries nothing but the mark: never answered, no memory. */
const isMarkOnly = (c: CardState) => c.kNew === 1 || (c.reps === 0 && c.s === 0);

/** Undo the manual mark. Returns null when the card had no other reason to exist. */
export function clearCardManual(card: CardState): CardState | null {
  if (isMarkOnly(card)) return null;
  const rest = { ...card };
  delete rest.k;
  delete rest.kAt;
  delete rest.kNew;
  return rest;
}

export function formatInterval(ms: number) {
  const m = Math.round(ms / 60000);
  if (m < 1) return "<1分";
  if (m < 60) return `${m}分`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}小时`;
  const d = Math.round(h / 24);
  if (d < 31) return `${d}天`;
  const mo = Math.round(d / 30);
  if (mo < 12) return `${mo}个月`;
  return `${(d / 365).toFixed(1)}年`;
}
