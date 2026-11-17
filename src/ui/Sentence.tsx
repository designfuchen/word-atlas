import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useAtlas, useEntry } from "../atlas/context";
import type { WordRef } from "../atlas/types";
import { play, stopAudio } from "../lib/audio";
import { useStore } from "../store/store";
import { Illustration } from "./Illustration";
import { Speak } from "./Speak";
import { openWord } from "../lib/router";
import { splitHighlight } from "../lib/text";
import { tokenizeSentence } from "../lib/wordLookup";

type Selection = { token: string; anchor: HTMLButtonElement; ref?: WordRef };
const LOOKUP_EVENT = "word-atlas:lookup";

/** Preview meaning first, matching the original site's two-step lookup. */
export function Sentence({ text, word }: { text: string; word: string }) {
  const atlas = useAtlas();
  const id = useId();
  const [selection, setSelection] = useState<Selection | null>(null);
  const close = useCallback(() => setSelection(null), []);
  useEffect(() => {
    window.addEventListener(LOOKUP_EVENT, close);
    return () => window.removeEventListener(LOOKUP_EVENT, close);
  }, [close]);
  useEffect(close, [text, close]);
  const target = atlas.lookup(word);
  const parts = /\s/.test(word) ? splitHighlight(text, word) : null;
  const start = parts ? parts[0].length : -1;
  const end = parts ? start + parts[1].length : -1;
  let offset = 0;
  return <>{tokenizeSentence(text).map((part, index) => {
    const from = offset;
    offset += part.text.length;
    const hit = part.word ? atlas.lookup(part.text) : undefined;
    const active = selection?.anchor.dataset.offset === String(from);
    const content = part.word ? (
      <button type="button" className="lookup-token" data-offset={from}
        aria-label={`查词：${part.text}`} aria-haspopup="dialog" aria-expanded={active} aria-controls={active ? id : undefined}
        onKeyDown={(event) => { if (["Enter", " "].includes(event.key)) event.stopPropagation(); }}
        onClick={(event) => {
          event.stopPropagation();
          window.dispatchEvent(new Event(LOOKUP_EVENT));
          if (!active) setSelection({ token: part.text, anchor: event.currentTarget, ref: hit });
        }}>{part.text}</button>
    ) : part.text;
    return (hit && hit.id === target?.id) || (from < end && offset > start)
      ? <mark key={index}>{content}</mark>
      : <span key={index}>{content}</span>;
  })}{selection && createPortal(<Lookup id={id} selection={selection} close={close} />, document.body)}</>;
}

function Lookup({ id, selection, close }: { id: string; selection: Selection; close: () => void }) {
  const panel = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: 16, top: 16 });
  useLayoutEffect(() => {
    const element = panel.current!;
    const wasLocked = document.documentElement.classList.contains("is-locked");
    document.documentElement.classList.add("is-locked");
    element.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      // Keep popup keys from reaching the parent word sheet or quiz.
      event.stopImmediatePropagation();
      if (event.key === "Escape") { event.preventDefault(); close(); }
      if (event.key === "Tab") {
        const buttons = [...element.querySelectorAll<HTMLButtonElement>("button:not(:disabled)")];
        const first = buttons[0], last = buttons[buttons.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === element)) {
          event.preventDefault(); last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault(); first?.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      if (!wasLocked) document.documentElement.classList.remove("is-locked");
      if (selection.anchor.isConnected) selection.anchor.focus({ preventScroll: true });
    };
  }, [selection, close]);
  useLayoutEffect(() => {
    const place = () => {
      const anchor = selection.anchor.getBoundingClientRect();
      const width = panel.current?.offsetWidth ?? 360, height = panel.current?.offsetHeight ?? 240;
      setPosition({
        left: Math.max(16, Math.min(window.innerWidth - width - 16, anchor.left + anchor.width / 2 - width / 2)),
        top: Math.max(16, Math.min(window.innerHeight - height - 16, anchor.bottom + height + 24 <= window.innerHeight ? anchor.bottom + 8 : anchor.top - height - 8)),
      });
    };
    place();
    const observer = new ResizeObserver(place);
    if (panel.current) observer.observe(panel.current);
    window.addEventListener("resize", place);
    return () => { observer.disconnect(); window.removeEventListener("resize", place); };
  }, [selection]);
  return <div className="lookup-backdrop" onClick={(event) => { event.stopPropagation(); if (event.target === event.currentTarget) close(); }}>
    <div ref={panel} id={id} className="lookup-dialog" style={position} role="dialog" aria-modal="true" aria-label={`查词：${selection.token}`} tabIndex={-1}>
      <button type="button" className="icon-btn lookup-close" onClick={close} aria-label="关闭查词"><X size={20} /></button>
      {selection.ref ? <LookupContent refw={selection.ref} close={close} /> : <><h2 lang="en">{selection.token}</h2><p>这个词不在词光词库里</p></>}
    </div>
  </div>;
}

function LookupContent({ refw, close }: { refw: WordRef; close: () => void }) {
  const atlas = useAtlas();
  const { entry } = useEntry(refw.id);
  const accent = useStore((s) => s.settings.accent);
  const autoplay = useStore((s) => s.settings.autoplay);
  useEffect(() => {
    if (autoplay) void play(atlas.audio(refw, accent), refw.word, accent);
    return stopAudio;
  }, [atlas, refw, accent, autoplay]);
  const ipa = entry ? (accent === "us" ? entry.us || entry.uk : entry.uk || entry.us) : refw.ipa;
  return <>
    <div className="lookup-heading">
      <Illustration src={atlas.img(refw, "thumb")} word={refw.word} topic={refw.topic} />
      <div><h2 lang="en">{refw.word}</h2><p className="ipa" lang="en">{ipa}</p></div>
    </div>
    <p className="lookup-meaning">{refw.zh}</p>
    <div className="lookup-actions">
      <Speak url={atlas.audio(refw, accent)} text={refw.word} accent={accent} label="播放发音" />
      <button type="button" className="btn btn-ghost" onClick={() => { close(); openWord(refw.id); }}>查看词卡</button>
    </div>
  </>;
}
