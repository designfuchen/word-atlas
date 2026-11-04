import { Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, Grid3x3, List, Search, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { go, type Route } from "../lib/router";
import { PoemSpeak } from "../poetry/PoemSpeak";
import { PoetryGalaxy } from "../poetry/PoetryGalaxy";
import { ProgressRing } from "../poetry/ProgressRing";
import { readAloud } from "../poetry/speech";
import { RATE, speechText } from "../poetry/voice";
import { PoetryContext, usePoem, usePoetry, usePoetryLoader } from "../poetry/context";
import { PoetryLearn } from "./PoetryLearn";
import { poemStatus } from "../poetry/couplets";
import { coupletCount, filterPoems, isStatus, poemProgress, poemTexts, snippetOf, stateOf, STAGES, STATUS, type Status } from "../poetry/filter";
import { poetryStore, togglePoemBookmark, usePoetryStore } from "../poetry/store";
import { newToday } from "../poetry/quiz";
import type { Poem } from "../poetry/types";

type View = "grid" | "list" | "galaxy";
const VIEW_KEY = "word-atlas:poetry-view";
function readView(): View {
  try {
    const v = localStorage.getItem(VIEW_KEY);
    return v === "list" || v === "galaxy" ? v : "grid";
  } catch {
    return "grid";
  }
}
const poemHref = (id: string) => `#/poetry/${encodeURIComponent(id)}`;

/** Set the tab title while a page is shown and put the previous one back afterwards. */
function useDocumentTitle(title: string) {
  useEffect(() => {
    const prev = document.title;
    document.title = title;
    return () => {
      document.title = prev;
    };
  }, [title]);
}

/** Poetry section: loads its own index on first visit, then shows the list or one poem. */
export function Poetry({ route }: { route: Extract<Route, { page: "poetry" }> }) {
  const { atlas, error } = usePoetryLoader();
  if (error)
    return (
      <div className="page">
        <p>{error}</p>
        <button className="btn btn-primary" onClick={() => location.reload()}>
          重新加载
        </button>
      </div>
    );
  if (!atlas)
    return (
      <div className="page" aria-busy="true">
        <span className="spinner" />
      </div>
    );
  return (
    <PoetryContext.Provider value={atlas}>
      {route.learn ? <PoetryLearn poem={route.poem} /> : route.id ? <PoemPage id={route.id} /> : <PoemList route={route} />}
    </PoetryContext.Provider>
  );
}

function PoemList({ route }: { route: Extract<Route, { page: "poetry" }> }) {
  useDocumentTitle("诗词 · 词光 Word Atlas");
  const atlas = usePoetry();
  const cards = usePoetryStore((s) => s.progress.cards);
  const bookmarks = usePoetryStore((s) => s.progress.bookmarks);
  const dailyNew = usePoetryStore((s) => s.prefs.dailyNew);
  const progressAll = usePoetryStore((s) => s.progress);

  // Filters live in the URL so a view can be shared or returned to with the back button.
  const status: Status = isStatus(route.status) ? route.status : "all";
  const view: View = route.view === "list" || route.view === "grid" || route.view === "galaxy" ? route.view : readView();
  const [q, setQ] = useState(route.q ?? "");
  useEffect(() => setQ(route.q ?? ""), [route.q]);
  const update = (patch: Partial<Extract<Route, { page: "poetry" }>>) => go({ ...route, ...patch }, null, true);
  const setView = (v: View) => {
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* the choice then only lasts for this visit */
    }
    update({ view: v });
  };

  const usedForms = useMemo(() => [...new Set(atlas.poems.map((p) => p.form))].sort((a, b) => a - b).map((f) => atlas.forms[f]), [atlas]);
  const themeOptions = useMemo(() => {
    const n = new Map<number, number>();
    for (const p of atlas.poems) for (const t of p.themes) n.set(t, (n.get(t) ?? 0) + 1);
    return [...n].filter(([t, c]) => c >= 2 && !STAGES.includes(atlas.themes[t])).sort((a, b) => b[1] - a[1] || a[0] - b[0]);
  }, [atlas]);
  const stages = useMemo(() => STAGES.filter((s) => atlas.themes.includes(s)), [atlas]);

  // The index has titles and poets only; the first search loads every poem so lines can be searched too.
  const [texts, setTexts] = useState<Map<string, string> | undefined>();
  const searching = q.trim() !== "";
  useEffect(() => {
    if (!searching || texts) return;
    let live = true;
    atlas.all().then(
      (poems) => live && setTexts(poemTexts(poems)),
      () => null,
    );
    return () => {
      live = false;
    };
  }, [atlas, searching, texts]);

  const progress = useMemo(() => poemProgress(cards), [cards]);
  const shown = useMemo(
    () => filterPoems(atlas, { q, form: route.form, stage: route.stage, theme: route.theme, level: route.level, status }, progress, bookmarks, texts),
    [atlas, q, route.form, route.stage, route.theme, route.level, status, progress, bookmarks, texts],
  );
  const learned = [...progress.values()].filter((v) => v.started > 0).length;
  // In the star map the search flies to the first match instead of filtering.
  const focus = useMemo(() => (searching ? filterPoems(atlas, { q, status: "all" }, progress, [], texts)[0]?.id : undefined), [atlas, q, searching, progress, texts]);

  // Today's plan from the index alone: due cards, plus unseen poems up to the daily limit.
  const plan = useMemo(() => {
    const now = Date.now();
    const known = new Set(atlas.poems.map((p) => p.id));
    const due = Object.entries(progressAll.cards).filter(([k, c]) => c.due <= now && known.has(k.slice(0, k.lastIndexOf(":")))).length;
    const unseen = atlas.poems.filter((p) => !progress.has(p.id)).length;
    return { due, fresh: Math.min(unseen, Math.max(0, dailyNew - newToday(progressAll))) };
  }, [atlas, progress, progressAll, dailyNew]);

  return (
    <div className={`page poetry ${view === "galaxy" ? "is-galaxy" : ""}`}>
      <header className="page-head">
        <p className="eyebrow">诗词图鉴 · {atlas.count} 首唐诗</p>
        <h1 className="display">读一首诗，记一首诗。</h1>
        <p className="lede">按由易到难排列，已开始 {learned} 首。内容来自 chinese-poetry，尚未逐首人工审校。</p>
      </header>

      <section className="panel poem-plan" aria-label="今日学习">
        <div>
          <p className="eyebrow">今日</p>
          <p className="poem-plan-line">
            复习 <b>{plan.due}</b> 联 · 新诗 <b>{plan.fresh}</b> 首
          </p>
        </div>
        <label className="poem-plan-new">
          每天新诗
          <select value={dailyNew} onChange={(e) => poetryStore.prefs({ dailyNew: Number(e.target.value) })} aria-label="每天新诗数">
            {[1, 2, 3, 5, 8].map((n) => (
              <option key={n} value={n}>
                {n} 首
              </option>
            ))}
          </select>
        </label>
        <a className={`btn btn-primary ${plan.due + plan.fresh === 0 ? "is-disabled" : ""}`} href="#/poetry/learn" aria-disabled={plan.due + plan.fresh === 0}>
          开始学习
        </a>
      </section>

      <div className="poem-filters">
        <label className="search poem-search">
          <Search size={17} aria-hidden />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              update({ q: e.target.value || undefined });
            }}
            placeholder="搜索题目、诗人或诗句"
            aria-label="搜索题目、诗人或诗句"
          />
        </label>
        {view !== "galaxy" && (
          <select value={route.theme ?? ""} onChange={(e) => update({ theme: e.target.value || undefined })} aria-label="题材">
            <option value="">全部题材</option>
            {themeOptions.map(([t, c]) => (
              <option key={t} value={atlas.themes[t]}>
                {atlas.themes[t]}（{c}）
              </option>
            ))}
          </select>
        )}
        <div className="segmented" role="group" aria-label="视图">
          <button className={view === "grid" ? "is-on" : ""} onClick={() => setView("grid")} aria-label="卡片视图" aria-pressed={view === "grid"}>
            <Grid3x3 size={17} />
          </button>
          <button className={view === "list" ? "is-on" : ""} onClick={() => setView("list")} aria-label="列表视图" aria-pressed={view === "list"}>
            <List size={17} />
          </button>
          <button className={view === "galaxy" ? "is-on" : ""} onClick={() => setView("galaxy")} aria-label="星图视图" aria-pressed={view === "galaxy"}>
            <Sparkles size={17} />
          </button>
        </div>
      </div>
      {view !== "galaxy" && (
        <>
          <div className="segmented segmented-wide" role="group" aria-label="学习状态">
            {STATUS.map(([k, label]) => (
              <button key={k} className={status === k ? "is-on" : ""} onClick={() => update({ status: k === "all" ? undefined : k })} aria-pressed={status === k}>
                {label}
                {k === "saved" ? ` ${bookmarks.length}` : ""}
              </button>
            ))}
          </div>
          <div className="segmented segmented-wide" role="group" aria-label="体裁">
            <button className={!route.form ? "is-on" : ""} onClick={() => update({ form: undefined })} aria-pressed={!route.form}>
              全部体裁
            </button>
            {usedForms.map((f) => (
              <button key={f} className={route.form === f ? "is-on" : ""} onClick={() => update({ form: f })} aria-pressed={route.form === f}>
                {f}
              </button>
            ))}
          </div>
          <div className="segmented segmented-wide" role="group" aria-label="学段">
            <button className={!route.stage ? "is-on" : ""} onClick={() => update({ stage: undefined })} aria-pressed={!route.stage}>
              全部学段
            </button>
            {stages.map((s) => (
              <button key={s} className={route.stage === s ? "is-on" : ""} onClick={() => update({ stage: s })} aria-pressed={route.stage === s}>
                {s}
              </button>
            ))}
          </div>
          <div className="segmented segmented-wide" role="group" aria-label="难度">
            <button className={!route.level ? "is-on" : ""} onClick={() => update({ level: undefined })} aria-pressed={!route.level}>
              全部难度
            </button>
            {atlas.levels.map((l) => (
              <button key={l} className={route.level === l ? "is-on" : ""} onClick={() => update({ level: l })} aria-pressed={route.level === l}>
                {l}
              </button>
            ))}
          </div>
        </>
      )}

      {view === "galaxy" ? (
        <PoetryGalaxy focus={focus} />
      ) : (
        <>
          <p className="poem-count" aria-live="polite">
            {shown.length === atlas.count ? `共 ${atlas.count} 首` : `${shown.length} / ${atlas.count} 首`}
          </p>
          {shown.length === 0 ? (
            <p className="poem-empty">{status === "saved" && bookmarks.length === 0 ? "还没有收藏。在诗词页点右上角的书签即可收藏。" : "没有符合条件的诗。换个筛选条件试试。"}</p>
          ) : (
            <ul className={view === "grid" ? "poem-list" : "poem-rows"}>
              {shown.map((p) => {
                const total = coupletCount(p);
                const v = progress.get(p.id);
                const state = stateOf(p, v);
                const label = state === "mastered" ? "已掌握" : state === "learning" ? `已学 ${v?.started ?? 0}/${total} 联` : "未学";
                // A search that matched the poem's text shows the matching line instead of the opening one.
                const textHit = searching && !p.title.includes(q.trim()) && !p.author.includes(q.trim());
                const mark = bookmarks.includes(p.id) && <BookmarkCheck className="poem-mark" size={16} aria-label="已收藏" />;
                return (
                  <li key={p.id}>
                    <a href={poemHref(p.id)} className={`poem-item is-${state}`} title={p.title}>
                      <span className="poem-item-body">
                      <span className="poem-item-main">
                        <b>{p.title}</b>
                        {textHit ? <Snippet id={p.id} q={q} /> : view === "grid" && p.first && <em className="poem-first">{p.first}</em>}
                        <span className="poem-meta">
                          {p.author} · {atlas.forms[p.form]} · {atlas.levels[p.level]}
                        </span>
                      </span>
                      <span className="poem-item-side">
                        <ProgressRing started={v?.started ?? 0} mastered={v?.mastered ?? 0} total={total} />
                        <small>{label}</small>
                        {mark}
                      </span>
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function PoemPage({ id }: { id: string }) {
  const atlas = usePoetry();
  const { poem, error } = usePoem(id);
  const ref = atlas.byId.get(id);
  useDocumentTitle(ref ? `${ref.title} · ${ref.author} · 词光` : "诗词 · 词光 Word Atlas");

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [id]);

  const neighbor = (d: number) => {
    const n = ref && atlas.poems[ref.order + d];
    if (n) go({ page: "poetry", id: n.id }, null, true);
  };
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "SELECT" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowLeft") neighbor(-1);
      if (e.key === "ArrowRight") neighbor(1);
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  });

  if (!ref) {
    return (
      <div className="page poem-page">
        <a className="btn btn-ghost" href="#/poetry">
          <ChevronLeft size={18} /> 全部诗词
        </a>
        <p>没有找到这首诗。</p>
      </div>
    );
  }
  return (
    <div className="page poem-page">
      <div className="poem-bar">
        <a className="btn btn-ghost" href="#/poetry">
          <ChevronLeft size={18} /> 全部诗词
        </a>
        <span className="poem-bar-actions">
          <a className="btn btn-primary" href={`#/poetry/learn?p=${encodeURIComponent(id)}`}>
            学这首
          </a>
          <BookmarkButton id={id} />
        </span>
      </div>
      {poem ? <PoemBody poem={poem} /> : error ? <p>{error}</p> : <span className="spinner" />}
      <nav className="poem-nav" aria-label="切换诗词">
        <button className="icon-btn" onClick={() => neighbor(-1)} disabled={ref.order === 0} aria-label="上一首">
          <ChevronLeft size={20} />
        </button>
        <span>
          {ref.order + 1} / {atlas.count}
        </span>
        <button className="icon-btn" onClick={() => neighbor(1)} disabled={ref.order >= atlas.count - 1} aria-label="下一首">
          <ChevronRight size={20} />
        </button>
      </nav>
    </div>
  );
}

function BookmarkButton({ id }: { id: string }) {
  const saved = usePoetryStore((s) => s.progress.bookmarks.includes(id));
  return (
    <button
      className={`icon-btn ${saved ? "is-on" : ""}`}
      onClick={() => togglePoemBookmark(id)}
      aria-pressed={saved}
      aria-label={saved ? "取消收藏" : "收藏"}
      title={saved ? "取消收藏" : "收藏"}
    >
      {saved ? <BookmarkCheck size={19} /> : <Bookmark size={19} />}
    </button>
  );
}

/** The line of a poem that matched the search, shown under its title in the list. */
function Snippet({ id, q }: { id: string; q: string }) {
  const atlas = usePoetry();
  const poem = atlas.peek(id);
  const line = poem && snippetOf(poem.lines, q);
  return line ? <em className="poem-snippet">{line}</em> : null;
}

function PoemBody({ poem }: { poem: Poem }) {
  const atlas = usePoetry();
  const pinyin = usePoetryStore((s) => s.prefs.pinyin);
  const slow = usePoetryStore((s) => s.prefs.slow);
  const cards = usePoetryStore((s) => s.progress.cards);
  const status = poemStatus(poem, cards);
  const themes = poem.themes.filter((t) => !STAGES.includes(t));
  const stage = poem.themes.find((t) => STAGES.includes(t));
  return (
    <article className="poem">
      <header>
        <p className="eyebrow">
          {poem.dynasty} · {poem.author} · {poem.form} · {atlas.levels[poem.level]}
          {stage ? ` · ${stage}` : ""}
        </p>
        <h1 className="display">{poem.title}</h1>
        <div className="poem-tools">
          <PoemSpeak text={speechText(poem.lines)} label="朗读全诗" />
          <label className="poem-toggle">
            <input type="checkbox" checked={pinyin} onChange={(e) => poetryStore.prefs({ pinyin: e.target.checked })} /> 显示拼音
          </label>
          <label className="poem-toggle">
            <input type="checkbox" checked={slow} onChange={(e) => poetryStore.prefs({ slow: e.target.checked })} /> 慢速朗读
          </label>
        </div>
      </header>
      <div className={`poem-lines ${pinyin ? "has-py" : ""}`} lang="zh-Hans">
        {poem.lines.map((l, i) => (
          <p
            key={i}
            className="poem-line"
            role="button"
            tabIndex={0}
            title="点一下朗读这一句"
            onClick={() => void readAloud(l.zh, slow ? RATE.slow : RATE.normal)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), void readAloud(l.zh, slow ? RATE.slow : RATE.normal))}
          >
            {[...l.zh].map((ch, j) => (
              <span key={j} className={l.py[j] ? "ch" : "ch ch-punct"}>
                {pinyin && <small aria-hidden>{l.py[j]}</small>}
                <span>{ch}</span>
              </span>
            ))}
          </p>
        ))}
      </div>
      {poem.gist && (
        <section className="poem-gist">
          <h3 className="eyebrow">大意</h3>
          <p>{poem.gist}</p>
        </section>
      )}
      <p className="poem-hint">点一句诗可以单独朗读。朗读用的是你设备自带的语音，音质和读音因系统而异。</p>
      {themes.length > 0 && <p className="poem-tags">{themes.join(" · ")}</p>}
      <p className="poem-status">
        已开始 {status.started} / {status.total} 联 · 已掌握 {status.mastered} 联
      </p>
    </article>
  );
}
