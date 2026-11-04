/** Pure helpers for choosing a voice and building speech text; kept free of browser imports so they can be tested in Node. */
export const RATE = { normal: 0.85, slow: 0.6 } as const;

const norm = (lang: string) => lang.replace("_", "-").toLowerCase();

/** Best Mandarin voice: mainland first, then other Chinese, preferring neural or enhanced ones. */
export function pickVoice<T extends { name: string; lang: string }>(voices: T[]): T | undefined {
  const zh = voices.filter((v) => norm(v.lang).startsWith("zh"));
  const score = (v: T) => {
    const l = norm(v.lang);
    let s = 0;
    if (l === "zh-cn" || l === "zh-hans-cn" || l === "zh") s += 20;
    else if (l === "zh-tw" || l === "zh-hant-tw") s += 8;
    else if (l === "zh-hk" || l === "zh-yue") s -= 20; // Cantonese reads classical verse differently
    if (/premium|enhanced|natural|neural|xiaoxiao|yunxi|ting-?ting|google/i.test(v.name)) s += 10;
    return s;
  };
  return [...zh].sort((a, b) => score(b) - score(a))[0];
}

/** The text of lines for speech: Han characters and the punctuation that makes pauses. */
export const speechText = (lines: { zh: string }[]) => lines.map((l) => l.zh).join("");
