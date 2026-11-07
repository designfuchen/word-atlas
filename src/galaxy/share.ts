import { downloadFile, shareFile } from "../ui/nativeShare";
import { toast } from "../ui/Toast";

const SERIF = '"Fraunces Variable", "Songti SC", "Noto Serif SC", Georgia, serif';
const SANS = '-apple-system, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';

/** "My word galaxy": the live render framed as a 4:5 poster. */
export async function shareGalaxy(source: HTMLCanvasElement, lit: number, total: number) {
  try {
    const W = 1080;
    const H = 1350;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const g = c.getContext("2d")!;
    await document.fonts.load(`600 72px ${SERIF}`).catch(() => null);
    g.fillStyle = "#090c18";
    g.fillRect(0, 0, W, H);
    // Cover-fit the galaxy into the upper part of the poster.
    const box = { x: 0, y: 0, w: W, h: 1020 };
    const s = Math.max(box.w / source.width, box.h / source.height);
    const sw = box.w / s;
    const sh = box.h / s;
    g.drawImage(source, (source.width - sw) / 2, (source.height - sh) / 2, sw, sh, box.x, box.y, box.w, box.h);
    const fade = g.createLinearGradient(0, 760, 0, 1080);
    fade.addColorStop(0, "rgba(9,12,24,0)");
    fade.addColorStop(1, "rgba(9,12,24,1)");
    g.fillStyle = fade;
    g.fillRect(0, 760, W, 330);
    const pad = 72;
    g.fillStyle = "rgba(243,236,223,.62)";
    g.font = `500 28px ${SANS}`;
    g.fillText("我的词汇星图", pad, 1110);
    g.fillStyle = "#f3ecdf";
    g.font = `600 76px ${SERIF}`;
    g.fillText(`已点亮 ${lit.toLocaleString()} 颗星`, pad, 1196);
    g.font = `400 28px ${SANS}`;
    g.fillStyle = "rgba(243,236,223,.6)";
    g.fillText(`共 ${total.toLocaleString()} 个雅思词 · 每学会一个，就点亮一颗`, pad, 1248);
    g.fillStyle = "rgba(243,236,223,.16)";
    g.fillRect(pad, H - 66, W - pad * 2, 1);
    g.fillStyle = "#f3ecdf";
    g.font = `600 30px ${SERIF}`;
    g.fillText("词光 · Word Atlas", pad, H - 26);
    g.font = `400 24px ${SANS}`;
    g.fillStyle = "rgba(243,236,223,.55)";
    const tag = "一词一画，点亮雅思";
    g.fillText(tag, W - pad - g.measureText(tag).width, H - 28);
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/png"));
    if (!blob) throw new Error("no blob");
    const file = new File([blob], "word-atlas-galaxy.png", { type: "image/png" });
    if ((await shareFile(file)) !== "unavailable") return;
    downloadFile(file);
    toast("星图已保存", "ok");
  } catch {
    toast("星图生成失败", "warn");
  }
}
