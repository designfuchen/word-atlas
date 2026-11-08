import type { Atlas, Entry } from "../atlas/types";
import { downloadFile, shareFile } from "./nativeShare";
import { toast } from "./Toast";

const SERIF = '"Fraunces Variable", "Songti SC", "Noto Serif SC", Georgia, serif';
const SANS = '-apple-system, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", sans-serif';

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const tokens = /[一-鿿]/.test(text) ? Array.from(text) : text.split(/(\s+)/);
  const lines: string[] = [];
  let line = "";
  for (const t of tokens) {
    const next = line + t;
    if (ctx.measureText(next).width > maxWidth && line.trim()) {
      lines.push(line.trim());
      line = t.trimStart();
    } else line = next;
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export async function renderWordCard(atlas: Atlas, e: Entry) {
  const W = 1080;
  const H = 1440;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  await Promise.all([document.fonts.load(`600 120px ${SERIF}`), document.fonts.load(`italic 400 40px ${SERIF}`)]).catch(() => null);

  ctx.fillStyle = "#F3ECDF";
  ctx.fillRect(0, 0, W, H);
  const pad = 72;
  const art = W - pad * 2;
  const src = atlas.img(e);
  ctx.save();
  roundRect(ctx, pad, pad, art, art * 0.78, 36);
  ctx.clip();
  ctx.fillStyle = "#EAE1D0";
  ctx.fillRect(pad, pad, art, art * 0.78);
  if (src) {
    try {
      const img = await loadImage(src);
      const crop = img.width * 0.78;
      ctx.drawImage(img, 0, (img.height - crop) / 2, img.width, crop, pad, pad, art, art * 0.78);
    } catch {
      /* keep the plain plate */
    }
  }
  ctx.restore();

  let y = pad + art * 0.78 + 120;
  ctx.fillStyle = "#1E2640";
  ctx.font = `600 ${e.w.length > 12 ? 92 : 120}px ${SERIF}`;
  ctx.fillText(e.w, pad, y);
  y += 62;
  ctx.font = `400 34px ${SANS}`;
  ctx.fillStyle = "#6B6F80";
  ctx.fillText([e.uk && `英 ${e.uk}`, e.us && e.us !== e.uk && `美 ${e.us}`].filter(Boolean).join("    "), pad, y);
  y += 72;
  ctx.font = `600 40px ${SANS}`;
  ctx.fillStyle = "#1E2640";
  const s0 = e.senses[0];
  ctx.fillStyle = "#C4573A";
  ctx.font = `italic 400 38px ${SERIF}`;
  ctx.fillText(s0.pos, pad, y);
  const posW = ctx.measureText(s0.pos + "  ").width;
  ctx.fillStyle = "#1E2640";
  ctx.font = `600 40px ${SANS}`;
  ctx.fillText(e.senses.slice(0, 2).map((s) => s.zh).join("；"), pad + posW, y);
  y += 76;
  if (e.ex[0]) {
    ctx.font = `italic 400 36px ${SERIF}`;
    ctx.fillStyle = "#3C4560";
    for (const line of wrap(ctx, `“${e.ex[0].en}”`, art).slice(0, 3)) {
      ctx.fillText(line, pad, y);
      y += 50;
    }
    ctx.font = `400 30px ${SANS}`;
    ctx.fillStyle = "#7A7C88";
    for (const line of wrap(ctx, e.ex[0].zh, art).slice(0, 2)) {
      ctx.fillText(line, pad, y + 6);
      y += 44;
    }
  }
  ctx.fillStyle = "rgba(30,38,64,.14)";
  ctx.fillRect(pad, H - 120, art, 2);
  ctx.fillStyle = "#1E2640";
  ctx.font = `600 34px ${SERIF}`;
  ctx.fillText("词光 · Word Atlas", pad, H - 62);
  ctx.font = `400 26px ${SANS}`;
  ctx.fillStyle = "#7A7C88";
  const tag = "一词一画，点亮雅思";
  ctx.fillText(tag, W - pad - ctx.measureText(tag).width, H - 64);
  return c;
}

export async function shareWord(atlas: Atlas, e: Entry) {
  try {
    const canvas = await renderWordCard(atlas, e);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
    if (!blob) throw new Error("no blob");
    const file = new File([blob], `word-atlas-${e.id}.png`, { type: "image/png" });
    if ((await shareFile(file, e.w)) !== "unavailable") return;
    downloadFile(file);
    toast("分享卡片已保存", "ok");
  } catch {
    toast("卡片生成失败，请稍后再试", "warn");
  }
}
