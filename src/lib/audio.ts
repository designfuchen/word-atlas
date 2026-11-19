import { duck } from "./sound";

let current: HTMLAudioElement | null = null;
let token = 0;
let playToken = 0;

export function stopAudio() {
  token++;
  current?.pause();
  current = null;
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}

/** Play a recording, falling back to the device voice. Resolves when playback ends. */
export async function play(url: string | null | undefined, text: string, accent: "uk" | "us" = "uk", rate = 1) {
  // A stopped playback must not un-duck the ambience while a newer one still runs.
  const mine = ++playToken;
  duck(true);
  try {
    return await speak(url, text, accent, rate);
  } finally {
    if (mine === playToken) duck(false);
  }
}

async function speak(url: string | null | undefined, text: string, accent: "uk" | "us", rate: number) {
  stopAudio();
  const mine = ++token;
  if (url) {
    const a = new Audio(url);
    a.playbackRate = rate;
    current = a;
    try {
      await a.play();
      const outcome = await new Promise<"ended" | "error">((r) => {
        a.onended = () => r("ended");
        a.onpause = () => r("ended");
        a.onerror = () => r("error");
      });
      if (outcome === "ended") return "recorded" as const;
      if (mine !== token) return "stopped" as const;
      // The recording failed mid-playback: fall back to the device voice below
      // instead of leaving the caller pending and the ambience ducked.
      current = null;
    } catch {
      if (mine !== token) return "stopped" as const;
      current = null;
    }
  }
  if (!("speechSynthesis" in window)) return "unsupported" as const;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = accent === "uk" ? "en-GB" : "en-US";
  u.rate = rate * 0.95;
  const voices = speechSynthesis.getVoices().filter((v) => v.lang.replace("_", "-") === u.lang);
  const best = voices.find((v) => /premium|enhanced|natural|google/i.test(v.name)) || voices[0];
  if (best) u.voice = best;
  await new Promise<void>((r) => {
    u.onend = () => r();
    u.onerror = () => r();
    speechSynthesis.speak(u);
  });
  return "device" as const;
}
