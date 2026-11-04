import { ArrowRight, Check, RotateCcw, Undo2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { burst } from "../lib/burst";
import { go } from "../lib/router";
import { cue } from "../lib/sound";
import { PoetryContext, usePoetry } from "../poetry/context";
import { couplets, type Couplet } from "../poetry/couplets";
import { PoemSpeak } from "../poetry/PoemSpeak";
import { PoetryGalaxy } from "../poetry/PoetryGalaxy";
import { speechText } from "../poetry/voice";
import { answerOf, gradeFor, hanChars, makePool, parseCoupletId, sessionStats, type Pool, type PoetrySession, type PoetryStep } from "../poetry/quiz";
import { advance, answer, endSession, startSession } from "../poetry/session";
import { usePoetryStore } from "../poetry/store";
import type { Poem, PoemLine } from "../poetry/types";
import { Rating } from "../store/srs";
import { store } from "../store/store";
import { AmbiencePicker } from "../ui/Ambience";
import { useKeys } from "./Learn";

type Quiz = Extract<PoetryStep, { id: string }>;
const KIND_LABEL = { next: "接下句：下一句是？", cloze: "补全这一句", arrange: "把字按顺序排好" } as const;

/** Study session for poetry: loads every poem once, builds a plan from the saved cards, then runs it. */
export function PoetryLearn({ poem }: { poem?: string }) {
  const atlas = usePoetry();
  const session = usePoetryStore((s) => s.session);
  const [pool, setPool] = useState<Pool | null>(null);
  const [empty, setEmpty] = useState(false);

  useEffect(() => {
    let live = true;
    atlas.all().then((poems) => {
      if (!live) return;
      const p = makePool(poems);
      const s = startSession(p, { onlyPoem: poem });
      if (!s.steps.length) setEmpty(true);
      else setPool(p);
    });
    return () => {
      live = false;
    };
  }, [atlas, poem]);

  if (empty)
    return (
      <div className="learn learn-loading">
        <p className="poem-empty">今天没有需要学习或复习的诗。</p>
        <button className="btn btn-primary" onClick={() => go({ page: "poetry" })}>
          返回诗词
        </button>
      </div>
    );
  if (!session || !pool)
    return (
      <div className="learn learn-loading">
        <span className="spinner" />
      </div>
    );
  return (
    <PoetryContext.Provider value={atlas}>
      {session.finished || session.index >= session.steps.length ? <Summary session={session} pool={pool} /> : <Runner session={session} pool={pool} />}
    </PoetryContext.Provider>
  );
}

function Runner({ session, pool }: { session: PoetrySession; pool: Pool }) {
  const step = session.steps[session.index];
  const total = session.steps.length;
  return (
    <div className="learn">
      <header className="learn-top">
        <button className="icon-btn" onClick={() => go({ page: "poetry" })} aria-label="暂停并返回">
          <X size={22} />
        </button>
        <div className="learn-progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={session.index}>
          <span style={{ width: `${(session.index / total) * 100}%` }} />
        </div>
        <span className="learn-count">
          {session.index + 1}
          <small>/{total}</small>
        </span>
        <AmbiencePicker />
      </header>
      <main className="learn-stage" key={`${session.id}-${session.index}`}>
        {step.kind === "intro" ? <Intro poem={pool.byId.get(step.poemId)!} /> : <QuizStep step={step} session={session} pool={pool} />}
      </main>
    </div>
  );
}

function useStepTimer() {
  const t = useRef(performance.now());
  return () => (performance.now() - t.current) / 1000;
}

/** One line of verse, with optional pinyin above each character. */
function Verse({ line, pinyin, blank, className = "" }: { line: PoemLine; pinyin: boolean; blank?: number; className?: string }) {
  let han = -1;
  return (
    <p className={`verse ${pinyin ? "has-py" : ""} ${className}`} lang="zh-Hans">
      {[...line.zh].map((ch, j) => {
        const isHan = !!line.py[j];
        if (isHan) han++;
        const hidden = isHan && han === blank;
        return (
          <span key={j} className={`${isHan ? "ch" : "ch ch-punct"} ${hidden ? "ch-blank" : ""}`}>
            {pinyin && <small aria-hidden>{hidden ? "" : line.py[j]}</small>}
            <span>{hidden ? "　" : ch}</span>
          </span>
        );
      })}
    </p>
  );
}

function Intro({ poem }: { poem: Poem }) {
  const pinyin = usePoetryStore((s) => s.prefs.pinyin);
  const elapsed = useStepTimer();
  const next = useCallback(() => {
    if (store.get().settings.sfx) void cue("flip");
    advance(elapsed());
  }, [elapsed]);
  useKeys({ Enter: next, " ": next });
  return (
    <div className="intro poem-intro">
      <p className="stage-label">
        <span className="dot dot-new" /> 读一读这首诗
      </p>
      <p className="eyebrow">
        {poem.dynasty} · {poem.author} · {poem.form}
      </p>
      <h2 className="display">{poem.title}</h2>
      <PoemSpeak text={speechText(poem.lines)} label="朗读全诗" />
      <div className={`poem-lines ${pinyin ? "has-py" : ""}`}>
        {poem.lines.map((l, i) => (
          <Verse key={i} line={l} pinyin={pinyin} />
        ))}
      </div>
      {poem.gist && <p className="poem-gist">{poem.gist}</p>}
      <footer className="learn-actions">
        <button className="btn btn-primary btn-xl" onClick={next} autoFocus>
          读熟了，开始回忆 <ArrowRight size={20} />
        </button>
        <span className="hint-keys">
          <kbd>Enter</kbd> 继续
        </span>
      </footer>
    </div>
  );
}

function QuizStep({ step, session, pool }: { step: Quiz; session: PoetrySession; pool: Pool }) {
  const { poemId, n } = parseCoupletId(step.id);
  const poem = pool.byId.get(poemId)!;
  const c = couplets(poem)[n] as Couplet & { down: PoemLine };
  const pinyin = usePoetryStore((s) => s.prefs.pinyin);
  const pending = session.pending;
  const elapsed = useStepTimer();
  const correctAnswer = answerOf(pool, step);

  const submit = useCallback(
    (value: string, el?: HTMLElement | null) => {
      if (pending) return;
      const correct = value === correctAnswer;
      const r = el?.getBoundingClientRect();
      if (correct && r) burst(r.left + r.width / 2, r.top + r.height / 2);
      if (store.get().settings.sfx) void cue(correct ? "correct" : "wrong");
      answer(pool, step, correct, gradeFor(step.kind, correct, elapsed() * 1000), value);
    },
    [pending, correctAnswer, pool, step, elapsed],
  );
  const next = useCallback(() => advance(elapsed()), [elapsed]);

  const keys: Record<string, () => void> = {};
  if (pending) {
    keys.Enter = next;
    keys[" "] = next;
  } else if (step.kind !== "arrange") {
    (step.options ?? []).forEach((o, i) => (keys[String(i + 1)] = () => submit(o, document.querySelector<HTMLElement>(`[data-option="${o}"]`))));
  }
  useKeys(keys);

  return (
    <div className={`quiz quiz-poem ${pending ? (pending.correct ? "is-right" : "is-wrong") : ""}`}>
      <p className="stage-label">
        <span className={`dot ${step.retry ? "dot-retry" : "dot-review"}`} />
        {step.retry ? "再见一面 · " : ""}
        {KIND_LABEL[step.kind as keyof typeof KIND_LABEL]}
      </p>
      <p className="poem-source">
        {poem.author} · {poem.title}
      </p>
      <section className="prompt poem-prompt">
        <Verse line={c.up} pinyin={pinyin} />
        {step.kind === "cloze" ? (
          <Verse line={c.down} pinyin={pinyin} blank={pending ? undefined : step.blank} className={pending ? "is-shown" : ""} />
        ) : step.kind === "arrange" ? null : (
          <p className="verse verse-ask">？</p>
        )}
      </section>

      {step.kind === "arrange" ? (
        <Arrange step={step} line={c.down} pinyin={pinyin} pending={pending} onSubmit={(v, el) => submit(v, el)} />
      ) : (
        <ul className={`options ${step.kind === "cloze" ? "options-chars" : "options-lines"}`}>
          {(step.options ?? []).map((o, i) => {
            const isAnswer = o === correctAnswer;
            const chosen = pending?.value === o;
            const cls = pending ? (isAnswer ? "is-answer" : chosen ? "is-chosen" : "is-dim") : "";
            return (
              <li key={o}>
                <button className={`option ${cls}`} data-option={o} onClick={(e) => submit(o, e.currentTarget)} disabled={!!pending}>
                  <kbd>{i + 1}</kbd>
                  <span lang="zh-Hans">{o}</span>
                  {pending && isAnswer && <Check size={20} className="option-mark" />}
                  {pending && chosen && !isAnswer && <X size={20} className="option-mark" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {pending && <Feedback couplet={c} poem={poem} correct={pending.correct} pinyin={pinyin} onNext={next} />}
    </div>
  );
}

function Arrange({ step, line, pinyin, pending, onSubmit }: { step: Quiz; line: PoemLine; pinyin: boolean; pending?: { correct: boolean; value: string }; onSubmit: (v: string, el: HTMLElement | null) => void }) {
  const tokens = step.tokens ?? [];
  const [picked, setPicked] = useState<number[]>([]);
  const slots = useRef<HTMLDivElement>(null);
  const full = picked.length === tokens.length;
  const value = picked.map((i) => tokens[i]).join("");

  useEffect(() => {
    if (full && !pending) onSubmit(value, slots.current);
  }, [full]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="arrange">
      <div className="arrange-slots" ref={slots} aria-label="已排好的字">
        {tokens.map((_, i) => (
          <span key={i} className={`slot ${picked[i] !== undefined ? "is-filled" : ""} ${pending ? (value[i] === hanChars(line.zh)[i] ? "is-ok" : "is-bad") : ""}`}>
            {pending && !pending.correct ? hanChars(line.zh)[i] : picked[i] !== undefined ? tokens[picked[i]] : ""}
          </span>
        ))}
      </div>
      {!pending && (
        <>
          <div className="arrange-tokens">
            {tokens.map((t, i) => (
              <button key={i} className="option" disabled={picked.includes(i)} onClick={() => setPicked([...picked, i])}>
                {t}
              </button>
            ))}
          </div>
          <div className="spell-actions">
            <button className="btn btn-ghost" onClick={() => setPicked(picked.slice(0, -1))} disabled={!picked.length}>
              <Undo2 size={17} /> 撤销一个
            </button>
          </div>
        </>
      )}
      {pinyin && !pending && <p className="poem-hint">拼音：{line.py.filter(Boolean).join(" ")}</p>}
    </div>
  );
}

function Feedback({ couplet, poem, correct, pinyin, onNext }: { couplet: Couplet & { down: PoemLine }; poem: Poem; correct: boolean; pinyin: boolean; onNext: () => void }) {
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => btn.current?.focus({ preventScroll: true }), []);
  return (
    <div className={`feedback feedback-poem ${correct ? "is-right" : "is-wrong"}`} role="status">
      <div className="feedback-inner">
        <div className="feedback-text">
          <p className="feedback-verdict">{correct ? "答对了" : "没关系，再读一遍"}</p>
          <Verse line={couplet.up} pinyin={pinyin} />
          <Verse line={couplet.down} pinyin={pinyin} />
          <p className="feedback-zh">
            {poem.author}《{poem.title}》
          </p>
          <PoemSpeak text={speechText([couplet.up, couplet.down])} label="朗读这一联" size="sm" />
        </div>
        <button ref={btn} className={`btn btn-xl ${correct ? "btn-sage" : "btn-terra"}`} onClick={onNext}>
          继续 <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}

function Summary({ session, pool }: { session: PoetrySession; pool: Pool }) {
  useEffect(() => {
    if (store.get().settings.sfx) void cue("complete");
  }, []);
  const stats = sessionStats(session);
  const wrong = Object.entries(session.graded)
    .filter(([, g]) => g === Rating.Again)
    .map(([id]) => id);
  const poems = useMemo(() => [...new Set(Object.keys(session.graded).map((id) => parseCoupletId(id).poemId))].map((id) => pool.byId.get(id)!), [session, pool]);
  // Stable identity, so the star map lights these once rather than on every render.
  const litIds = useMemo(() => poems.map((p) => p.id), [poems]);
  const minutes = Math.max(1, Math.round(((session.finished ?? Date.now()) - session.started) / 60000));
  const done = () => {
    endSession();
    go({ page: "poetry" });
  };
  const again = () => startSession(pool, { ids: wrong });
  return (
    <div className="learn summary">
      <div className="summary-card">
        {poems.length > 0 && (
          <div className="summary-sky">
            <PoetryGalaxy mode="mini" highlight={litIds} ignite />
            <p>这一程点亮了 {poems.length} 颗星</p>
          </div>
        )}
        <p className="eyebrow">这一程结束了</p>
        <h1 className="display">{stats.accuracy >= 90 ? "漂亮的一程。" : stats.accuracy >= 60 ? "稳稳向前。" : "错过的，会再相遇。"}</h1>
        <dl className="summary-stats">
          <div>
            <dt>首次正确</dt>
            <dd>{stats.accuracy}%</dd>
          </div>
          <div>
            <dt>新诗</dt>
            <dd>{session.newPoems.length}</dd>
          </div>
          <div>
            <dt>复习</dt>
            <dd>{session.reviewIds.length}</dd>
          </div>
          <div>
            <dt>用时</dt>
            <dd>
              {minutes}
              <small>分钟</small>
            </dd>
          </div>
        </dl>
        <ul className="poem-sum-list">
          {poems.map((p) => {
            const ids = couplets(p).map((c) => c.id);
            const bad = ids.some((id) => session.graded[id] === Rating.Again);
            return (
              <li key={p.id} className={bad ? "is-wrong" : ""}>
                <b>{p.title}</b>
                <small>{p.author}</small>
              </li>
            );
          })}
        </ul>
        <p className="summary-note">FSRS 已为每联诗排好下次相遇的时间。答错的，会更早回来。</p>
        <div className="summary-actions">
          {wrong.length > 0 && (
            <button className="btn btn-ghost" onClick={again}>
              <RotateCcw size={18} /> 再练 {wrong.length} 联错题
            </button>
          )}
          <button className="btn btn-primary btn-xl" onClick={done} ref={(b) => b?.focus({ preventScroll: true })}>
            完成 <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
