import { Crosshair, Minus, Plus, RotateCcw, Share2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAtlas } from "../atlas/context";
import type { WordRef } from "../atlas/types";
import { openWord } from "../lib/router";
import { cue, playFile } from "../lib/sound";
import { isMastered } from "../store/srs";
import { store, useStore } from "../store/store";
import { Illustration } from "../ui/Illustration";
import { detectQuality, GalaxyEngine } from "./engine";
import { layoutGalaxy, TOPIC_COLORS, type GalaxyLayout } from "./layout";
import { shareGalaxy } from "./share";

const layouts = new WeakMap<object, GalaxyLayout>();
export function useGalaxyLayout() {
  const atlas = useAtlas();
  return useMemo(() => {
    let l = layouts.get(atlas);
    if (!l) {
      l = layoutGalaxy(atlas);
      layouts.set(atlas, l);
    }
    return l;
  }, [atlas]);
}

const reduced = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Brightness of every star from the learner's memory state. */
function starStates(layout: GalaxyLayout, cards: Record<string, { st: number; s: number } | undefined>, highlight?: Set<string>) {
  const out = new Float32Array(layout.n);
  layout.ids.forEach((id, i) => {
    if (highlight?.has(id)) out[i] = 3;
    else {
      const c = cards[id];
      out[i] = c ? (isMastered(c as never) ? 2 : 1) : 0;
    }
  });
  return out;
}

export function Galaxy({
  mode = "full",
  highlight,
  ignite,
  className = "",
  focus,
}: {
  mode?: "full" | "mini";
  /** Words to show as today's gold stars. */
  highlight?: string[];
  /** Light the highlighted stars one by one (session summary). */
  ignite?: boolean;
  className?: string;
  /** Fly to this word once ready. */
  focus?: string | null;
}) {
  const atlas = useAtlas();
  const layout = useGalaxyLayout();
  const cards = useStore((s) => s.progress.cards);
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<GalaxyEngine | null>(null);
  const labels = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ ref: WordRef; x: number; y: number } | null>(null);
  const [fallback, setFallback] = useState(false);
  const highlightSet = useMemo(() => new Set(highlight ?? []), [highlight]);

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const eng = new GalaxyEngine(cv, layout, {
      quality: detectQuality(),
      reducedMotion: reduced(),
      preserve: mode === "full",
      autoRotate: mode === "mini" ? 0.06 : 0.025,
    });
    engine.current = eng;
    setFallback(!eng.webgl);
    eng.resize();
    if (mode === "mini") eng.cam.dist = eng.baseDist() * 1.1;
    const ro = new ResizeObserver(() => eng.resize());
    ro.observe(cv);
    // Only animate while visible.
    const io = new IntersectionObserver(([e]) => (e.isIntersecting && !document.hidden ? eng.start() : eng.stop()));
    io.observe(cv);
    // Browsers drop WebGL contexts under memory pressure; without handling this
    // the galaxy stays blank until a reload.
    const lost = (e: Event) => {
      e.preventDefault(); // let the browser restore the context
      eng.handleContextLost();
    };
    const restored = () => eng.handleContextRestored();
    cv.addEventListener("webglcontextlost", lost);
    cv.addEventListener("webglcontextrestored", restored);
    const vis = () => (document.hidden ? eng.stop() : eng.start());
    document.addEventListener("visibilitychange", vis);
    if (mode === "full") {
      eng.onFrame = () => {
        const box = labels.current;
        if (!box) return;
        const kids = box.children as HTMLCollectionOf<HTMLElement>;
        layout.topicCenters.forEach(([x, y, z], t) => {
          const el = kids[t];
          const p = eng.toScreen(x, y, z);
          if (!el) return;
          if (!p) {
            el.style.opacity = "0";
            return;
          }
          el.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%)`;
          el.style.opacity = String(Math.max(0, Math.min(0.9, 3.4 - p.depth)));
        });
      };
    }
    return () => {
      ro.disconnect();
      io.disconnect();
      cv.removeEventListener("webglcontextlost", lost);
      cv.removeEventListener("webglcontextrestored", restored);
      document.removeEventListener("visibilitychange", vis);
      eng.destroy();
      engine.current = null;
    };
  }, [layout, mode]);

  // Brightness follows memory state; in ignite mode today's stars start dark.
  useEffect(() => {
    const eng = engine.current;
    if (!eng) return;
    const states = starStates(layout, cards, ignite ? undefined : highlightSet);
    if (ignite) highlightSet.forEach((id) => {
      const i = layout.index.get(id);
      if (i !== undefined) states[i] = 0;
    });
    eng.setStates(states);
  }, [layout, cards, highlightSet, ignite]);

  // Session summary: stars light up one after another, then a soft voice line.
  useEffect(() => {
    const eng = engine.current;
    if (!eng || !ignite || !highlightSet.size) return;
    const ids = [...highlightSet].filter((id) => layout.index.has(id));
    eng.frameStars(ids.map((id) => layout.index.get(id)!));
    eng.autoRotate = 0.02;
    const sfx = store.get().settings.sfx;
    const timers = ids.map((id, k) =>
      window.setTimeout(() => {
        eng.setState(layout.index.get(id)!, 3);
        if (sfx && k < 12) void cue("ignite");
      }, 1400 + k * 180),
    );
    const voice = window.setTimeout(() => sfx && void playFile("voice-galaxy-lit.mp3", 0.9), 1600 + ids.length * 180);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(voice);
    };
  }, [ignite, highlightSet, layout]);

  useEffect(() => {
    if (!focus) return;
    const i = layout.index.get(focus);
    if (i !== undefined) {
      engine.current?.flyTo(i);
      if (store.get().settings.sfx) void cue("fly");
    }
  }, [focus, layout]);

  // First visit to the full galaxy: one quiet sentence explaining what it is.
  useEffect(() => {
    if (mode !== "full") return;
    // Leave the greeting unconsumed while sound is off, so turning it on later
    // still plays it instead of losing it forever.
    if (!store.get().settings.sfx) return;
    try {
      if (localStorage.getItem("word-atlas:galaxy-hello")) return;
    } catch {
      return;
    }
    const t = window.setTimeout(() => {
      void playFile("voice-galaxy-hello.mp3", 0.9).then(() => {
        // Mark it heard only once it has actually been handed to the audio engine.
        try {
          localStorage.setItem("word-atlas:galaxy-hello", "1");
        } catch {
          /* optional */
        }
      });
    }, 900);
    return () => clearTimeout(t);
  }, [mode]);

  /* ---------- interaction (full mode) ---------- */
  const drag = useRef<{ x: number; y: number; moved: number; pinch?: number } | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const lastTwinkle = useRef(0);
  const dwell = useRef(0);
  useEffect(() => () => window.clearTimeout(dwell.current), []);

  const local = (e: { clientX: number; clientY: number }) => {
    const r = canvas.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const onMove = (e: React.PointerEvent) => {
    const eng = engine.current;
    if (!eng) return;
    const p = local(e);
    const ps = pointers.current;
    if (ps.has(e.pointerId)) {
      const prev = ps.get(e.pointerId)!;
      ps.set(e.pointerId, p);
      if (ps.size === 2) {
        const [a, b] = [...ps.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (drag.current?.pinch) eng.cam.dist = clampDist(eng.cam.dist * (drag.current.pinch / dist));
        if (drag.current) drag.current.pinch = dist;
        return;
      }
      if (drag.current) {
        const dx = p.x - prev.x;
        const dy = p.y - prev.y;
        drag.current.moved += Math.abs(dx) + Math.abs(dy);
        eng.cam.yaw -= dx * 0.006;
        eng.cam.pitch = Math.max(0.12, Math.min(1.45, eng.cam.pitch + dy * 0.005));
      }
      return;
    }
    if (e.pointerType !== "mouse") return;
    // Only reveal a star once the cursor rests on it, so sweeping across the
    // galaxy doesn't flicker through dozens of cards (and sounds).
    const i = eng.pick(p.x, p.y);
    eng.hover = i;
    window.clearTimeout(dwell.current);
    if (i < 0) {
      dwell.current = window.setTimeout(() => setHover(null), 260);
      return;
    }
    const ref = atlas.words[i];
    if (hover?.ref.id === ref.id) return;
    dwell.current = window.setTimeout(() => {
      setHover({ ref, x: p.x, y: p.y });
      const now = performance.now();
      if (store.get().settings.sfx && now - lastTwinkle.current > 400) {
        lastTwinkle.current = now;
        void cue("twinkle");
      }
    }, 120);
  };

  const onDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, local(e));
    drag.current = { ...local(e), moved: 0 };
  };

  const onUp = (e: React.PointerEvent) => {
    const eng = engine.current;
    const d = drag.current;
    pointers.current.delete(e.pointerId);
    if (pointers.current.size) return;
    drag.current = null;
    if (!eng || !d || d.moved > 8) return;
    const p = local(e);
    const i = eng.pick(p.x, p.y, e.pointerType === "mouse" ? 16 : 26);
    if (i < 0) return;
    const ref = atlas.words[i];
    if (e.pointerType !== "mouse" && hover?.ref.id !== ref.id) {
      // First tap previews, second tap opens.
      eng.hover = i;
      setHover({ ref, x: p.x, y: p.y });
      if (store.get().settings.sfx) void cue("twinkle");
      return;
    }
    eng.flyTo(i);
    if (store.get().settings.sfx) void cue("fly");
    window.setTimeout(() => openWord(ref.id), 350);
  };

  const onWheel = (e: React.WheelEvent) => {
    const eng = engine.current;
    if (!eng) return;
    eng.cam.dist = clampDist(eng.cam.dist * Math.exp(e.deltaY * 0.0012));
  };

  useEffect(() => {
    // Wheel zoom must not scroll the page while over the galaxy.
    const cv = canvas.current;
    if (!cv || mode !== "full") return;
    const stop = (e: WheelEvent) => e.preventDefault();
    cv.addEventListener("wheel", stop, { passive: false });
    return () => cv.removeEventListener("wheel", stop);
  }, [mode]);

  const lit = useMemo(() => layout.ids.reduce((n, id) => n + (cards[id] ? 1 : 0), 0), [layout, cards]);

  if (mode === "mini")
    return (
      <div className={`galaxy galaxy-mini ${className}`}>
        <canvas ref={canvas} aria-hidden="true" />
        {fallback && <span className="galaxy-fallback" />}
      </div>
    );

  return (
    <div className={`galaxy galaxy-full ${className}`}>
      <canvas
        ref={canvas}
        onPointerMove={onMove}
        onPointerDown={onDown}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onPointerLeave={() => {
          if (engine.current) engine.current.hover = -1;
          setHover(null);
        }}
        onWheel={onWheel}
        role="img"
        aria-label={`词汇星图：${layout.n} 颗星，已点亮 ${lit} 颗。可拖动旋转、滚动缩放，点击星星打开词条。`}
        tabIndex={0}
        onKeyDown={(e) => {
          const eng = engine.current;
          if (!eng) return;
          if (e.key === "ArrowLeft") eng.cam.yaw -= 0.12;
          if (e.key === "ArrowRight") eng.cam.yaw += 0.12;
          if (e.key === "ArrowUp") eng.cam.pitch = Math.min(1.45, eng.cam.pitch + 0.08);
          if (e.key === "ArrowDown") eng.cam.pitch = Math.max(0.12, eng.cam.pitch - 0.08);
          if (e.key === "+" || e.key === "=") eng.cam.dist = clampDist(eng.cam.dist * 0.85);
          if (e.key === "-") eng.cam.dist = clampDist(eng.cam.dist * 1.18);
        }}
      />
      <div className="galaxy-labels" ref={labels} aria-hidden="true">
        {atlas.topics.map(([key, name], t) => (
          <span key={key} style={{ "--c": TOPIC_COLORS[t % TOPIC_COLORS.length] } as React.CSSProperties}>
            {name}
          </span>
        ))}
      </div>
      {hover && (
        <button
          className="galaxy-tip"
          style={{ transform: `translate(${Math.min(hover.x + 18, (canvas.current?.clientWidth ?? 0) - 260)}px, ${Math.max(8, hover.y - 46)}px)` }}
          onClick={() => openWord(hover.ref.id)}
        >
          <Illustration src={atlas.img(hover.ref, "thumb")} word={hover.ref.word} topic={hover.ref.topic} />
          <span>
            <b lang="en">{hover.ref.word}</b>
            <small>{hover.ref.zh}</small>
          </span>
        </button>
      )}
      <div className="galaxy-hud">
        <p>
          <b>{lit.toLocaleString()}</b> / {layout.n.toLocaleString()} 颗星已点亮
        </p>
        <ul className="galaxy-legend" aria-hidden="true">
          <li>
            <i className="lg-dust" />
            未学
          </li>
          <li>
            <i className="lg-learning" />
            学习中
          </li>
          <li>
            <i className="lg-mastered" />
            已掌握
          </li>
        </ul>
      </div>
      <div className="galaxy-controls">
        <button className="icon-btn" onClick={() => engine.current && (engine.current.cam.dist = clampDist(engine.current.cam.dist * 0.8))} aria-label="放大">
          <Plus size={18} />
        </button>
        <button className="icon-btn" onClick={() => engine.current && (engine.current.cam.dist = clampDist(engine.current.cam.dist * 1.25))} aria-label="缩小">
          <Minus size={18} />
        </button>
        <button
          className="icon-btn"
          onClick={() => {
            engine.current?.reset();
            engine.current?.replayIntro();
            if (store.get().settings.sfx) void cue("fly");
          }}
          aria-label="回到全景"
        >
          <RotateCcw size={17} />
        </button>
        <button
          className="icon-btn"
          onClick={() => {
            const ids = Object.keys(cards);
            const pick = ids[Math.floor(Math.random() * ids.length)] ?? atlas.words[0].id;
            const i = layout.index.get(pick);
            if (i !== undefined) {
              engine.current?.flyTo(i);
              if (store.get().settings.sfx) void cue("fly");
            }
          }}
          aria-label="飞到一颗已点亮的星"
        >
          <Crosshair size={17} />
        </button>
        <button className="icon-btn" onClick={() => canvas.current && shareGalaxy(canvas.current, lit, layout.n)} aria-label="分享我的星图">
          <Share2 size={17} />
        </button>
      </div>
      <p className="galaxy-hint">拖动旋转 · 滚动缩放 · 点击星星打开词条</p>
    </div>
  );
}

const clampDist = (d: number) => Math.max(0.35, Math.min(4.2, d));
