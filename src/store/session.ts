import type { Atlas, WordRef } from "../atlas/types";
import { MEDIA } from "../atlas/types";
import { hashSeed, normalize, shuffle } from "../lib/text";
import { isMastered, review, Rating, type Grade } from "./srs";
import { bumpDay, dayKey, store, type ActiveSession, type Progress, type QuizKind, type Settings, type Step } from "./store";

export function dueIds(p: Progress, now = Date.now()) {
  return Object.entries(p.cards)
    .filter(([, c]) => c.due <= now)
    .sort((a, b) => a[1].due - b[1].due)
    .map(([id]) => id);
}

export function newToday(p: Progress) {
  return p.days[dayKey()]?.n ?? 0;
}

/** Next unseen words along the learning path, starting at the learner's level. */
export function nextNew(atlas: Atlas, p: Progress, settings: Settings, count: number) {
  const out: string[] = [];
  const pass = (from: number) => {
    for (const w of atlas.words) {
      if (out.length >= count) return;
      if (w.cefr < from || p.cards[w.id] || out.includes(w.id)) continue;
      out.push(w.id);
    }
  };
  pass(settings.startLevel);
  if (out.length < count) pass(0);
  return out;
}

export function todayPlan(atlas: Atlas, p: Progress, s: Settings) {
  const due = dueIds(p).filter((id) => atlas.byId.has(id));
  const newLeft = Math.max(0, s.dailyNew - newToday(p));
  const fresh = nextNew(atlas, p, s, newLeft);
  return { due, fresh, minutes: Math.max(1, Math.round(due.length * 0.25 + fresh.length * 0.9)) };
}

function quizKind(ref: WordRef, p: Progress, s: Settings, salt: number): QuizKind {
  const c = p.cards[ref.id];
  const hasImg = !!(ref.media & MEDIA.img);
  const roll = hashSeed(ref.id + salt) % 100;
  if (!c || c.s < 2) {
    if (hasImg && roll < 45) return "picture";
    return roll < 80 ? "meaning" : "listen";
  }
  if (s.spell && (c.s >= 4 || roll < 35)) return roll < 75 ? "spell" : hasImg ? "picture" : "listen";
  return roll < 50 ? "listen" : hasImg ? "picture" : "meaning";
}

/** Distinct meaning segments of a zh gloss (senses and sub-meanings), with pos tags stripped. */
function senses(zh: string): Set<string> {
  return new Set(zh.split(/[｜|；;，,]/).map((s) => normalize(s.trim().replace(/^[a-z.]+\s*/, ""))).filter(Boolean));
}

/** Distractors that look plausible: same level, similar spelling or length, different meaning. */
export function distractors(atlas: Atlas, ref: WordRef, kind: QuizKind, seed: number) {
  const target = normalize(ref.word);
  const refSenses = senses(ref.zh);
  const scored: [number, WordRef][] = [];
  const pool = atlas.words;
  const start = Math.max(0, ref.order - 400);
  for (let i = start; i < Math.min(pool.length, ref.order + 400); i++) {
    const w = pool[i];
    if (w.id === ref.id || normalize(w.word) === target) continue;
    if ([...senses(w.zh)].some((s) => refSenses.has(s))) continue; // shares a meaning with the answer
    let score = hashSeed(w.id + seed) % 100;
    if (kind === "listen" || kind === "picture") {
      if (w.word[0]?.toLowerCase() === target[0]) score += 120;
      score += Math.max(0, 60 - Math.abs(w.word.length - target.length) * 20);
    } else {
      if (w.cefr === ref.cefr) score += 40;
      if (w.zh.split(" ")[0] === ref.zh.split(" ")[0]) score += 60; // same part of speech
    }
    scored.push([score, w]);
  }
  scored.sort((a, b) => b[0] - a[0]);
  const seen = new Set<string>();
  const picks: string[] = [];
  for (const [, w] of scored) {
    const keys = kind === "meaning" ? [...senses(w.zh)] : [normalize(w.word)];
    if (keys.some((k) => seen.has(k))) continue;
    keys.forEach((k) => seen.add(k));
    picks.push(w.id);
    if (picks.length === 3) break;
  }
  return shuffle([ref.id, ...picks], seed);
}

export function buildSession(atlas: Atlas, p: Progress, s: Settings, opts?: { ids?: string[]; reviewOnly?: boolean }): ActiveSession {
  const seed = Date.now();
  const plan = todayPlan(atlas, p, s);
  const reviewIds = opts?.ids ? opts.ids.filter((id) => p.cards[id]) : plan.due.slice(0, 120);
  const newIds = opts?.ids ? opts.ids.filter((id) => !p.cards[id]) : opts?.reviewOnly ? [] : plan.fresh;
  const steps: Step[] = [];
  const quiz = (id: string, salt: number): Step => {
    const ref = atlas.byId.get(id)!;
    const kind = quizKind(ref, p, s, seed + salt);
    return { id, kind, options: kind === "spell" ? undefined : distractors(atlas, ref, kind, seed + salt) };
  };
  // Reviews first while attention is fresh, then new words in small groups:
  // meet five, then recall those five in a different order.
  reviewIds.forEach((id, i) => steps.push(quiz(id, i)));
  for (let g = 0; g < newIds.length; g += 5) {
    const group = newIds.slice(g, g + 5);
    group.forEach((id) => steps.push({ id, kind: "intro" }));
    shuffle(group, seed + g).forEach((id, i) => steps.push(quiz(id, 1000 + g + i)));
  }
  return { id: `s${seed}`, started: seed, steps, index: 0, graded: {}, newIds, reviewIds };
}

export function gradeFor(kind: QuizKind, correct: boolean, ms: number, hinted: boolean): Grade {
  if (!correct) return Rating.Again;
  if (hinted) return Rating.Hard;
  const slow = kind === "spell" ? 20000 : 9000;
  const fast = kind === "spell" ? 6000 : 2500;
  if (ms > slow) return Rating.Hard;
  if (ms < fast && kind === "spell") return Rating.Easy;
  return Rating.Good;
}

/** Apply an answer. Only the first attempt for a word in a session updates memory and stats. */
export function answer(atlas: Atlas, step: Step & { kind: QuizKind }, correct: boolean, grade: Grade, value: string) {
  const { settings } = store.get();
  store.progress((p) => {
    const sess = p.session;
    if (!sess) return p;
    let next: Progress = { ...p, session: { ...sess, pending: { correct, value } } };
    const first = !(step.id in sess.graded) && !step.retry;
    if (first) {
      next = {
        ...next,
        cards: { ...next.cards, [step.id]: review(p.cards[step.id], grade, Date.now(), settings.retention) },
        session: { ...next.session!, graded: { ...sess.graded, [step.id]: grade } },
        mistakes: correct ? next.mistakes : [step.id, ...next.mistakes.filter((x) => x !== step.id)].slice(0, 300),
      };
      next = bumpDay(next, { r: 1, c: correct ? 1 : 0, n: sess.newIds.includes(step.id) ? 1 : 0 });
    }
    if (!correct) {
      // Practise it again a few steps later in another format; never re-graded.
      const steps = [...next.session!.steps];
      const retries = steps.filter((x) => x.id === step.id && "retry" in x && x.retry).length;
      if (retries < 2) {
        const ref = atlas.byId.get(step.id)!;
        const kind: QuizKind = step.kind === "meaning" ? (ref.media & MEDIA.img ? "picture" : "listen") : "meaning";
        const at = Math.min(steps.length, sess.index + 4);
        steps.splice(at, 0, { id: step.id, kind, retry: true, options: distractors(atlas, ref, kind, Date.now()) });
        next = { ...next, session: { ...next.session!, steps } };
      }
    }
    return next;
  });
}

/** Move to the next step; `seconds` is time spent on this step, capped so idle tabs don't inflate stats. */
export function advance(seconds: number) {
  store.progress((p) => {
    const s = p.session;
    if (!s) return p;
    const index = s.index + 1;
    const finished = index >= s.steps.length ? Date.now() : undefined;
    const next = bumpDay(p, { t: Math.max(0, Math.min(90, Math.round(seconds))) });
    return { ...next, session: { ...s, index, pending: undefined, finished } };
  });
}

export function sessionStats(s: ActiveSession) {
  const graded = Object.values(s.graded);
  const correct = graded.filter((g) => g !== Rating.Again).length;
  return { total: graded.length, correct, accuracy: graded.length ? Math.round((correct / graded.length) * 100) : 0 };
}

export const masteredCount = (p: Progress) => Object.values(p.cards).filter(isMastered).length;
