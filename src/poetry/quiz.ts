import { hashSeed, shuffle } from "../lib/text";
import { Rating, type CardState, type Grade } from "../store/srs";
import { dayKey, type Progress } from "../store/store";
import { couplets, quizzable, type Couplet } from "./couplets";
import type { Poem, PoemLine } from "./types";

/** next: choose the answering line · cloze: fill one missing character · arrange: rebuild the line from its characters. */
export type QuizKind = "next" | "cloze" | "arrange";

export type PoetryStep =
  | { kind: "intro"; poemId: string }
  | {
      kind: QuizKind;
      /** Couplet card id, `<poemId>:<n>`. */
      id: string;
      retry?: boolean;
      /** next: candidate lines without punctuation · cloze: candidate characters. */
      options?: string[];
      /** cloze: index into the answer line's characters. */
      blank?: number;
      /** arrange: the answer line's characters in shuffled order. */
      tokens?: string[];
    };

export interface PoetrySession {
  id: string;
  started: number;
  steps: PoetryStep[];
  index: number;
  /** First-attempt grade per couplet; retries never change it. */
  graded: Record<string, Grade>;
  newPoems: string[];
  reviewIds: string[];
  /** Answer shown but not yet continued. */
  pending?: { correct: boolean; value: string };
  finished?: number;
}

const HAN = /[㐀-鿿]/;
/** The characters of a line without punctuation. */
export const hanChars = (zh: string) => [...zh].filter((c) => HAN.test(c));
export const strip = (zh: string) => hanChars(zh).join("");

export function parseCoupletId(id: string): { poemId: string; n: number } {
  const at = id.lastIndexOf(":");
  return { poemId: id.slice(0, at), n: Number(id.slice(at + 1)) };
}

export interface Pool {
  /** Every poem, in learning-path order. */
  poems: Poem[];
  byId: Map<string, Poem>;
}

export const makePool = (poems: Poem[]): Pool => ({ poems, byId: new Map(poems.map((p) => [p.id, p])) });

/** Lines that look like plausible wrong answers: same length, preferably same form, poet or theme. */
function distractorLines(answer: PoemLine, poem: Poem, pool: Pool, seed: number): string[] {
  const target = strip(answer.zh);
  const scored: [number, string][] = [];
  for (const p of pool.poems) {
    for (const l of p.lines) {
      const text = strip(l.zh);
      if (!text || text === target || text.length !== target.length) continue;
      let score = hashSeed(p.id + l.zh + seed) % 100;
      if (p.form === poem.form) score += 40;
      if (p.author === poem.author) score += 30;
      if (p.themes.some((t) => poem.themes.includes(t))) score += 20;
      scored.push([score, text]);
    }
  }
  scored.sort((a, b) => b[0] - a[0]);
  return [...new Set(scored.map((s) => s[1]))].slice(0, 3);
}

function distractorChars(answer: string, poem: Poem, pool: Pool, seed: number): string[] {
  const candidates = new Set<string>();
  const add = (p: Poem) => p.lines.forEach((l) => hanChars(l.zh).forEach((c) => c !== answer && candidates.add(c)));
  add(poem);
  pool.poems.forEach((p) => p.form === poem.form && add(p));
  return shuffle([...candidates], seed).slice(0, 3);
}

/** Cards that have not been answered yet start with the easiest format; long-lived ones ask for recall. */
export function pickKind(card: CardState | undefined, id: string, seed: number): QuizKind {
  const roll = hashSeed(id + seed) % 100;
  if (!card || card.s < 2) return "next";
  if (card.s < 6) return roll < 50 ? "next" : "cloze";
  return roll < 40 ? "arrange" : roll < 70 ? "cloze" : "next";
}

/** Build the data a quiz step needs. Falls back to "next" when the line is too short for the format or no distractors exist. */
export function makeStep(pool: Pool, c: Couplet, kind: QuizKind, seed: number, retry = false): PoetryStep {
  const poem = pool.byId.get(c.poemId);
  if (!poem || !quizzable(c)) throw new Error(`not a quizzable couplet: ${c.id}`);
  const answer = hanChars(c.down.zh);
  const base = { id: c.id, ...(retry ? { retry: true } : {}) };
  if (kind === "arrange" && answer.length >= 3) return { kind, ...base, tokens: shuffleDifferent(answer, seed) };
  if (kind === "cloze" && answer.length >= 3) {
    const blank = hashSeed(c.id + seed) % answer.length;
    const wrong = distractorChars(answer[blank], poem, pool, seed);
    if (wrong.length === 3) return { kind, ...base, blank, options: shuffle([answer[blank], ...wrong], seed) };
  }
  const wrong = distractorLines(c.down, poem, pool, seed);
  return { kind: "next", ...base, options: shuffle([strip(c.down.zh), ...wrong], seed) };
}

/** A shuffle that never returns the answer order (unless every character is the same). */
function shuffleDifferent(chars: string[], seed: number) {
  let out = shuffle(chars, seed);
  for (let i = 1; i < 8 && out.join("") === chars.join("") && new Set(chars).size > 1; i++) out = shuffle(chars, seed + i);
  return out;
}

export function gradeFor(kind: QuizKind, correct: boolean, ms: number): Grade {
  if (!correct) return Rating.Again;
  if (ms > (kind === "arrange" ? 40000 : 12000)) return Rating.Hard;
  if (kind === "arrange" && ms < 12000) return Rating.Easy;
  return Rating.Good;
}

/** Couplet cards that are due, oldest first. Cards of unknown poems or lone lines are ignored. */
export function dueCouplets(progress: Progress, pool: Pool, now: number): Couplet[] {
  const out: [number, Couplet][] = [];
  for (const [id, card] of Object.entries(progress.cards)) {
    if (card.due > now) continue;
    const { poemId, n } = parseCoupletId(id);
    const poem = pool.byId.get(poemId);
    const c = poem && couplets(poem)[n];
    if (c && quizzable(c)) out.push([card.due, c]);
  }
  return out.sort((a, b) => a[0] - b[0]).map((x) => x[1]);
}

/** Couplets of poems already begun that were never asked (e.g. the learner left mid-session). */
export function unaskedCouplets(progress: Progress, pool: Pool): Couplet[] {
  const started = new Set(Object.keys(progress.cards).map((k) => parseCoupletId(k).poemId));
  const out: Couplet[] = [];
  for (const poem of pool.poems)
    if (started.has(poem.id)) for (const c of couplets(poem)) if (quizzable(c) && !progress.cards[c.id]) out.push(c);
  return out;
}

export const newToday = (p: Progress) => p.days[dayKey()]?.n ?? 0;

/** Poems the learner has not met yet, in learning-path order. */
export function unseenPoems(progress: Progress, pool: Pool, count: number): Poem[] {
  const started = new Set(Object.keys(progress.cards).map((k) => parseCoupletId(k).poemId));
  return pool.poems.filter((p) => !started.has(p.id) && p.lines.length >= 2).slice(0, count);
}

export function todayPlan(progress: Progress, pool: Pool, dailyNew: number, now = Date.now()) {
  const due = [...dueCouplets(progress, pool, now), ...unaskedCouplets(progress, pool)].slice(0, 40);
  const fresh = unseenPoems(progress, pool, Math.max(0, dailyNew - newToday(progress)));
  const freshCouplets = fresh.reduce((n, p) => n + couplets(p).filter(quizzable).length, 0);
  return { due, fresh, minutes: Math.max(1, Math.round(due.length * 0.3 + fresh.length * 1 + freshCouplets * 0.3)) };
}

/**
 * Reviews first while attention is fresh, then each new poem: read it, then recall its couplets
 * in shuffled order. With `onlyPoem` the session practises that poem alone.
 */
export function buildSession(pool: Pool, progress: Progress, dailyNew: number, opts: { onlyPoem?: string; ids?: string[]; seed?: number; now?: number } = {}): PoetrySession {
  const seed = opts.seed ?? Date.now();
  const now = opts.now ?? seed;
  const steps: PoetryStep[] = [];
  const quiz = (c: Couplet, salt: number) => steps.push(makeStep(pool, c, pickKind(progress.cards[c.id], c.id, seed + salt), seed + salt));

  let reviewIds: string[] = [];
  let newPoems: Poem[] = [];
  if (opts.ids) {
    const cs = opts.ids.map((id) => couplets(pool.byId.get(parseCoupletId(id).poemId)!)[parseCoupletId(id).n]).filter((c) => c && quizzable(c));
    reviewIds = cs.map((c) => c.id);
    shuffle(cs, seed).forEach((c, i) => quiz(c, i));
  } else if (opts.onlyPoem) {
    const poem = pool.byId.get(opts.onlyPoem);
    if (poem) {
      const fresh = !couplets(poem).some((c) => progress.cards[c.id]);
      if (fresh) newPoems = [poem];
      else {
        reviewIds = couplets(poem).filter(quizzable).map((c) => c.id);
        shuffle(reviewIds, seed).forEach((id, i) => quiz(couplets(poem)[parseCoupletId(id).n], i));
      }
    }
  } else {
    const plan = todayPlan(progress, pool, dailyNew, now);
    reviewIds = plan.due.map((c) => c.id);
    plan.due.forEach((c, i) => quiz(c, i));
    newPoems = plan.fresh;
  }
  newPoems.forEach((poem, g) => {
    steps.push({ kind: "intro", poemId: poem.id });
    const cs = couplets(poem).filter(quizzable);
    shuffle(cs, seed + g).forEach((c, i) => quiz(c, 1000 + g * 50 + i));
  });
  return { id: `s${seed}`, started: seed, steps, index: 0, graded: {}, newPoems: newPoems.map((p) => p.id), reviewIds };
}

export function sessionStats(s: PoetrySession) {
  const graded = Object.values(s.graded);
  const correct = graded.filter((g) => g !== Rating.Again).length;
  return { total: graded.length, correct, accuracy: graded.length ? Math.round((correct / graded.length) * 100) : 0 };
}

/** The correct answer for a quiz step, in the form its UI compares against. */
export function answerOf(pool: Pool, step: Extract<PoetryStep, { id: string }>): string {
  const { poemId, n } = parseCoupletId(step.id);
  const c = couplets(pool.byId.get(poemId)!)[n];
  const chars = hanChars(c.down?.zh ?? "");
  return step.kind === "cloze" ? chars[step.blank ?? 0] : chars.join("");
}

