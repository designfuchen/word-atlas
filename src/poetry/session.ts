import { review, type Grade } from "../store/srs";
import { bumpDay, store } from "../store/store";
import { couplets } from "./couplets";
import { buildSession, makeStep, parseCoupletId, type Pool, type PoetrySession, type PoetryStep, type QuizKind } from "./quiz";
import { poetryStore } from "./store";

type Quiz = Extract<PoetryStep, { id: string }>;

export function startSession(pool: Pool, opts: { onlyPoem?: string; ids?: string[] } = {}) {
  const { progress, prefs } = poetryStore.get();
  const s = buildSession(pool, progress, prefs.dailyNew, opts);
  poetryStore.session(() => s);
  return s;
}

const RETRY_KIND: Record<QuizKind, QuizKind> = { next: "cloze", cloze: "next", arrange: "cloze" };

/** Apply an answer. Only the first attempt for a couplet in a session updates memory and stats. */
export function answer(pool: Pool, step: Quiz, correct: boolean, grade: Grade, value: string) {
  const sess = poetryStore.get().session;
  if (!sess) return;
  const first = !(step.id in sess.graded) && !step.retry;
  if (first) {
    const { poemId } = parseCoupletId(step.id);
    const retention = store.get().settings.retention;
    poetryStore.progress((p) => {
      const isNew = sess.newPoems.includes(poemId) && !Object.keys(p.cards).some((k) => k.startsWith(`${poemId}:`));
      const next = {
        ...p,
        cards: { ...p.cards, [step.id]: review(p.cards[step.id], grade, Date.now(), retention) },
        mistakes: correct ? p.mistakes : [step.id, ...p.mistakes.filter((x) => x !== step.id)].slice(0, 300),
      };
      return bumpDay(next, { r: 1, c: correct ? 1 : 0, n: isNew ? 1 : 0 });
    });
  }
  poetryStore.session((s) => {
    if (!s) return s;
    const steps = [...s.steps];
    if (!correct) {
      // Ask it again a few steps later in another format; never re-graded.
      const retries = steps.filter((x) => "retry" in x && x.retry && (x as Quiz).id === step.id).length;
      if (retries < 2) {
        const { poemId, n } = parseCoupletId(step.id);
        const c = couplets(pool.byId.get(poemId)!)[n];
        steps.splice(Math.min(steps.length, s.index + 4), 0, makeStep(pool, c, RETRY_KIND[step.kind], Date.now(), true));
      }
    }
    return { ...s, steps, pending: { correct, value }, graded: first ? { ...s.graded, [step.id]: grade } : s.graded };
  });
}

/** Move to the next step; `seconds` is time spent on this step, capped so idle tabs don't inflate stats. */
export function advance(seconds: number) {
  poetryStore.progress((p) => bumpDay(p, { t: Math.max(0, Math.min(90, Math.round(seconds))) }));
  poetryStore.session((s: PoetrySession | null) => {
    if (!s) return s;
    const index = s.index + 1;
    return { ...s, index, pending: undefined, finished: index >= s.steps.length ? Date.now() : undefined };
  });
}

export const endSession = () => poetryStore.session(() => null);
