import { stopAudio } from "../lib/audio";
import { duck } from "../lib/sound";
import { pickVoice, RATE } from "./voice";

/** Mandarin reading with the device's own speech synthesis. No audio files and no network of ours. */
export type SpeakResult = "device" | "no-voice" | "unsupported" | "stopped";

/** Voices load asynchronously in some browsers; wait briefly for the list instead of failing the first click. */
function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  const have = speechSynthesis.getVoices();
  if (have.length) return Promise.resolve(have);
  return new Promise((resolve) => {
    const done = () => {
      speechSynthesis.removeEventListener("voiceschanged", done);
      window.clearTimeout(timer);
      resolve(speechSynthesis.getVoices());
    };
    const timer = window.setTimeout(done, 1200);
    speechSynthesis.addEventListener("voiceschanged", done);
  });
}

let token = 0;

/** Read `text` aloud and resolve when it ends. Starting another reading (or `stopAudio`) cancels this one. */
export async function readAloud(text: string, rate: number = RATE.normal): Promise<SpeakResult> {
  if (!("speechSynthesis" in window)) return "unsupported";
  stopAudio();
  const mine = ++token;
  const voice = pickVoice(await loadVoices());
  if (mine !== token) return "stopped";
  const u = new SpeechSynthesisUtterance(text);
  u.lang = voice?.lang ?? "zh-CN";
  u.rate = rate;
  if (voice) u.voice = voice;
  duck(true);
  try {
    await new Promise<void>((resolve) => {
      u.onend = () => resolve();
      u.onerror = () => resolve();
      speechSynthesis.speak(u);
    });
  } finally {
    duck(false);
  }
  return mine !== token ? "stopped" : voice ? "device" : "no-voice";
}
