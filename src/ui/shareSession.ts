import type { Atlas } from "../atlas/types";
import { sessionStats } from "../store/session";
import { Rating } from "../store/srs";
import type { ActiveSession } from "../store/store";
import { toast } from "./Toast";

const SERIF = '"Fraunces Variable", "Songti SC", "Noto Serif SC", Georgia, serif';
const SANS = '-apple-system, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';

/** Distinct words studied this session. The card shows at most 9 thumbnails but reports them all. */
export const sessionWordCount = (s: ActiveSession) => new Set(s.steps.map((x) => x.id)).size;

const load = (src: string) =>
  new Promise<HTMLImageElement | null>((r) => {
    const i = new Image();
    i.onload = () => r(i);
    i.onerror = () => r(null);
    i.src = src;
  });

/** A 4:5 "today I learned" card: a mosaic of the session's illustrations plus first-try accuracy. */
export async function shareSession(atlas: Atlas, s: ActiveSession) {
  try {
    const W = 1080;
    const H = 1350;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d")!;
    await document.fonts.load(`600 96px ${SERIF}`).catch(() => null);
    ctx.fillStyle = "#F3ECDF";
    ctx.fillRect(0, 0, W, H);
    const total = sessionWordCount(s);
    const ids = [...new Set(s.steps.map((x) => x.id))].slice(0, 9);
    const refs = ids.map((id) => atlas.byId.get(id)!).filter(Boolean);
    const pad = 64;
    const gapPx = 16;
    const cell = (W - pad * 2 - gapPx * 2) / 3;
    const imgs = await Promise.all(refs.map((r) => (atlas.img(r, "thumb") ? load(atlas.img(r, "thumb")!) : Promise.resolve(null))));
    refs.forEach((r, i) => {
      const x = pad + (i % 3) * (cell + gapPx);
      const y = pad + Math.floor(i / 3) * (cell + gapPx);
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x, y, cell, cell, 24);
      ctx.clip();
      ctx.fillStyle = "#EAE1D0";
      ctx.fillRect(x, y, cell, cell);
      const img = imgs[i];
      if (img) ctx.drawImage(img, x, y, cell, cell);
      ctx.fillStyle = "rgba(20,24,40,.0)";
      ctx.restore();
      ctx.font = `600 30px ${SERIF}`;
      ctx.fillStyle = "#FBF8F2";
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,.35)";
      ctx.shadowBlur = 12;
      ctx.fillText(r.word, x + 20, y + cell - 22, cell - 40);
      ctx.restore();
    });
    const st = sessionStats(s);
    const top = pad + 3 * cell + 2 * gapPx + 96;
    const d = new Date();
    ctx.fillStyle = "#8A8C96";
    ctx.font = `500 28px ${SANS}`;
    ctx.fillText(`${d.getMonth() + 1}月${d.getDate()}日 · 今天点亮了 ${total} 颗星`, pad, top - 24);
    ctx.fillStyle = "#1E2640";
    ctx.font = `600 64px ${SERIF}`;
    ctx.fillText(`学了 ${total} 个词，首次正确 ${st.accuracy}%`, pad, top + 52, W - pad * 2);
    const wrong = Object.values(s.graded).filter((g) => g === Rating.Again).length;
    ctx.font = `400 30px ${SANS}`;
    ctx.fillStyle = "#5A6075";
    ctx.fillText(`新词 ${s.newIds.length} · 复习 ${s.reviewIds.length} · 需要再见面 ${wrong}`, pad, top + 112);
    ctx.fillStyle = "rgba(30,38,64,.14)";
    ctx.fillRect(pad, H - 116, W - pad * 2, 2);
    ctx.fillStyle = "#1E2640";
    ctx.font = `600 34px ${SERIF}`;
    ctx.fillText("词光 · Word Atlas", pad, H - 58);
    ctx.font = `400 26px ${SANS}`;
    ctx.fillStyle = "#8A8C96";
    const tag = "一词一画，点亮雅思";
    ctx.fillText(tag, W - pad - ctx.measureText(tag).width, H - 60);
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/png"));
    if (!blob) throw new Error();
    const file = new File([blob], `word-atlas-${d.toISOString().slice(0, 10)}.png`, { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file] }).catch(() => null);
      return;
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = file.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast("成绩卡已保存", "ok");
  } catch {
    toast("成绩卡生成失败", "warn");
  }
}
