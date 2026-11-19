import { Headphones, Keyboard, RotateCcw, Type } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { prefetch, useAtlas } from "../atlas/context";
import type { Entry } from "../atlas/types";
import { play, stopAudio } from "../lib/audio";
import { cue } from "../lib/sound";
import { hashSeed } from "../lib/text";
import { clean, correctCharacterCount, practiceBatch, same, typingDelta, typingMetrics } from "../lib/typing";
import { store, useStore } from "../store/store";
import { AmbiencePicker } from "../ui/Ambience";
import { Illustration } from "../ui/Illustration";

type Mode = "word" | "sentence" | "dictation";
type Source = "recent" | "mistakes" | "saved" | "path";

const MODES: [Mode, string, string, typeof Type][] = [
  ["word", "单词", "看图写出单词", Type],
  ["sentence", "例句", "照着抄写，练出手感", Keyboard],
  ["dictation", "听写", "只听声音，写下整句", Headphones],
];
const SOURCES: [Source, string][] = [
  ["recent", "最近学过"],
  ["mistakes", "错词本"],
  ["saved", "收藏"],
  ["path", "学习路线"],
];

export function Practice() {
  const atlas = useAtlas();
  const progress = useStore((s) => s.progress);
  const startLevel = useStore((s) => s.settings.startLevel);
  const [mode, setMode] = useState<Mode>("word");
  const [source, setSource] = useState<Source>(() => (Object.keys(progress.cards).length ? "recent" : "path"));
  const [round, setRound] = useState<{ entries: Entry[]; key: number } | null>(null);

  const pool = useMemo(() => {
    const learned = Object.entries(progress.cards)
      .sort((a, b) => (b[1].last ?? 0) - (a[1].last ?? 0))
      .map(([id]) => id);
    const ids =
      source === "recent" ? learned : source === "mistakes" ? progress.mistakes : source === "saved" ? progress.bookmarks : atlas.words.filter((w) => w.cefr >= startLevel).slice(0, 400).map((w) => w.id);
    return ids.filter((id) => atlas.byId.has(id));
  }, [atlas, progress.cards, progress.mistakes, progress.bookmarks, source, startLevel]);

  const start = async () => {
    const ids = practiceBatch(pool, hashSeed(String(Date.now())));
    const entries = (await prefetch(atlas, ids)).filter((e): e is Entry => !!e && (mode === "word" || e.ex.length > 0));
    if (entries.length) setRound({ entries, key: Date.now() });
  };

  if (round) return <TypingRound key={round.key} mode={mode} entries={round.entries} onExit={() => setRound(null)} onAgain={start} />;

  const best = progress.typing.filter((t) => t.mode === mode).reduce((m, t) => Math.max(m, t.wpm), 0);
  return (
    <div className="page practice">
      <header className="page-head">
        <p className="eyebrow">练习 · Typing Studio</p>
        <h1 className="display">让手，也记住它们。</h1>
        <p className="lede">打字只练拼写和手感，不会改动记忆进度。</p>
      </header>
      <div className="practice-grid">
        <section className="panel">
          <h3 className="eyebrow">模式</h3>
          <div className="mode-cards">
            {MODES.map(([k, name, desc, Icon]) => (
              <button key={k} className={`mode-card ${mode === k ? "is-on" : ""}`} onClick={() => setMode(k)} aria-pressed={mode === k}>
                <Icon size={22} strokeWidth={1.7} />
                <b>{name}</b>
                <small>{desc}</small>
              </button>
            ))}
          </div>
          <h3 className="eyebrow">词来自</h3>
          <div className="segmented segmented-wide">
            {SOURCES.map(([k, label]) => (
              <button key={k} className={source === k ? "is-on" : ""} onClick={() => setSource(k)} aria-pressed={source === k}>
                {label}
              </button>
            ))}
          </div>
          <p className="muted">
            {pool.length
              ? source === "path"
                ? "从学习路线的前 400 个词里随机抽 10 个。"
                : `可练 ${pool.length} 个词，每轮随机 10 个。`
              : "这里还没有词，先去学几个，或换个来源。"}
          </p>
          <button className="btn btn-primary btn-xl" onClick={start} disabled={!pool.length}>
            开始一轮
          </button>
        </section>
        <section className="panel practice-side">
          <img src={`${import.meta.env.BASE_URL}brand/${mode === "dictation" ? "listen" : "typing"}.webp`} alt="" />
          <dl className="mini-stats">
            <div>
              <dt>最佳速度</dt>
              <dd>
                {best}
                <small>WPM</small>
              </dd>
            </div>
            <div>
              <dt>完成轮次</dt>
              <dd>{progress.typing.length}</dd>
            </div>
          </dl>
          <p className="muted">WPM 按标准每 5 个字符计 1 词，只统计正确输入。</p>
        </section>
      </div>
    </div>
  );
}

function TypingRound({ mode, entries, onExit, onAgain }: { mode: Mode; entries: Entry[]; onExit: () => void; onAgain: () => void }) {
  const atlas = useAtlas();
  const settings = useStore((s) => s.settings);
  const [i, setI] = useState(0);
  const [value, setValue] = useState("");
  // Running totals live in a ref so every keystroke is counted exactly once.
  const totalsRef = useRef({ typed: 0, correct: 0, accepted: 0, ms: 0 });
  const [totals, setTotals] = useState(totalsRef.current);
  const [done, setDone] = useState(false);
  const started = useRef<number | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const e = entries[i];
  const target = mode === "word" ? e.w : e.ex[0].en;

  useEffect(() => {
    setValue("");
    started.current = null;
    input.current?.focus();
    if (mode === "dictation") void play(atlas.audio(e, "ex"), e.ex[0].en, settings.accent);
    if (mode === "word" && settings.autoplay) void play(atlas.audio(e, settings.accent), e.w, settings.accent);
  }, [i]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => stopAudio(), []);

  const onChange = (next: string) => {
    if (done) return;
    if (started.current === null && next) started.current = performance.now();
    const d = typingDelta(value, next, target);
    if (settings.sfx && d.total > 0) void cue("key");
    const t = totalsRef.current;
    totalsRef.current = { ...t, typed: t.typed + d.total, correct: t.correct + d.correct };
    setTotals(totalsRef.current);
    setValue(next);
    if (clean(next).length >= clean(target).length && same(next.trimEnd(), target)) finishItem(next);
  };

  const finishItem = (final: string) => {
    const ms = started.current ? performance.now() - started.current : 0;
    const accepted = correctCharacterCount(final, target);
    if (settings.sfx) void cue("correct");
    const t = totalsRef.current;
    const nt = { ...t, accepted: t.accepted + accepted, ms: t.ms + ms };
    totalsRef.current = nt;
    setTotals(nt);
    if (i + 1 >= entries.length) {
      setDone(true);
      const m = typingMetrics(nt.correct, nt.typed, nt.accepted, nt.ms);
      store.progress((p) => ({ ...p, typing: [...p.typing, { at: Date.now(), mode, items: entries.length, wpm: m.wpm, accuracy: m.accuracy }].slice(-500) }));
    } else window.setTimeout(() => setI(i + 1), 260);
  };

  const m = typingMetrics(totals.correct, totals.typed, totals.accepted, totals.ms);
  const chars = Array.from(target);
  const typed = Array.from(value);

  if (done)
    return (
      <div className="page practice">
        <section className="panel typing-done">
          <p className="eyebrow">本轮完成</p>
          <h1 className="display">
            {m.wpm} <small>WPM</small>
          </h1>
          <p className="lede">准确率 {m.accuracy}% · {entries.length} 项</p>
          <div className="summary-actions">
            <button className="btn btn-ghost" onClick={onExit}>
              返回
            </button>
            <button className="btn btn-primary btn-xl" onClick={onAgain} autoFocus>
              <RotateCcw size={18} /> 再来一轮
            </button>
          </div>
        </section>
      </div>
    );

  return (
    <div className="page practice typing">
      <header className="typing-top">
        <button className="btn btn-ghost" onClick={onExit}>
          结束
        </button>
        <AmbiencePicker />
        <div className="learn-progress">
          <span style={{ width: `${(i / entries.length) * 100}%` }} />
        </div>
        <span className="typing-meter">
          <b>{m.wpm}</b> WPM · <b>{m.accuracy}%</b>
        </span>
      </header>
      <section className="typing-stage" onClick={() => input.current?.focus()}>
        {mode === "word" && (
          <div className="typing-cue">
            <Illustration src={atlas.img(e)} word={e.w} topic={0} eager />
            <p>
              <span className="pos">{e.senses[0].pos}</span> {e.senses[0].zh}
            </p>
          </div>
        )}
        {mode !== "word" && (
          <p className="typing-zh">
            {mode === "dictation" && (
              <button className="link" onClick={() => play(atlas.audio(e, "ex"), e.ex[0].en, settings.accent)}>
                再听一遍
              </button>
            )}
            {e.ex[0].zh}
          </p>
        )}
        <p className={`typing-text ${mode === "word" ? "is-word" : ""} ${mode === "dictation" ? "is-hidden" : ""}`} lang="en" aria-hidden="true">
          {chars.map((ch, k) => {
            const t = typed[k];
            const cls = t === undefined ? (k === typed.length ? "is-caret" : "") : same(t, ch) ? "is-ok" : "is-bad";
            const show = mode === "dictation" && t === undefined ? (ch === " " ? " " : /[A-Za-z]/.test(ch) ? "·" : ch) : ch;
            return (
              <span key={k} className={cls}>
                {show}
              </span>
            );
          })}
        </p>
        <input
          ref={input}
          className="typing-input"
          value={value}
          onChange={(ev) => onChange(ev.target.value)}
          autoFocus
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          aria-label="在这里输入"
        />
        <p className="muted typing-help">
          {mode === "dictation" ? "听不清可以点「再听一遍」。" : "直接开始输入，全部正确后自动进入下一项。"} 第 {i + 1}/{entries.length} 项
        </p>
      </section>
    </div>
  );
}
