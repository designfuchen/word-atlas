/** Irregular forms that a stem match would miss ("teach" → "taught"). */
const IRREGULAR = new Map(
  "arise arose arisen|awake awoke awoken|bear bore borne born|beat beat beaten|become became|begin began begun beginn|bend bent|bet bet|bind bound|bite bit bitten|bleed bled|blow blew blown|break broke broken|breed bred|bring brought|broadcast broadcast|build built|burn burnt burned|burst burst|buy bought|catch caught|choose chose chosen|cling clung|come came|cost cost|creep crept|cut cut cutt|deal dealt|dig dug|do did done does|draw drew drawn|dream dreamt dreamed|drink drank drunk|drive drove driven|eat ate eaten|fall fell fallen|feed fed|feel felt|fight fought|find found|flee fled|fling flung|fly flew flown flies|forbid forbade forbidden|forget forgot forgotten|forgive forgave forgiven|freeze froze frozen|get got gotten gett|give gave given|go went gone goes|grind ground|grow grew grown|hang hung|have had has|hear heard|hide hid hidden|hit hit hitt|hold held|hurt hurt|keep kept|kneel knelt|know knew known|lay laid|lead led|lean leant leaned|leap leapt leaped|learn learnt learned|leave left|lend lent|let let|lie lay lain|light lit|lose lost|make made|mean meant|meet met|pay paid|prove proved proven|put put putt|quit quit|read read|ride rode ridden|ring rang rung|rise rose risen|run ran runn|say said|see saw seen|seek sought|sell sold|send sent|set set|sew sewed sewn|shake shook shaken|shed shed|shine shone|shoot shot|show showed shown|shrink shrank shrunk|shut shut|sing sang sung|sink sank sunk|sit sat sitt|sleep slept|slide slid|sling slung|speak spoke spoken|speed sped|spend spent|spill spilt spilled|spin spun spinn|spy spied spies|mislead misled|spit spat|split split|spread spread|spring sprang sprung|stand stood|steal stole stolen|stick stuck|sting stung|stink stank stunk|stride strode|strike struck|string strung|strive strove striven|swear swore sworn|sweep swept|swell swelled swollen|swim swam swum swimm|swing swung|take took taken|teach taught|tear tore torn|tell told|think thought|throw threw thrown|tread trod trodden|understand understood|undertake undertook undertaken|upset upset|wake woke woken|wear wore worn|weave wove woven|weep wept|win won winn|wind wound|withdraw withdrew withdrawn|write wrote written|be was were been is are am being|tomato tomatoes|shelf shelves|goose geese|craftsman craftsmen|ox oxen|child children|man men|woman women|foot feet|tooth teeth|mouse mice|person people|good better best|bad worse worst|far further farther furthest"
    .split("|")
    .map((row) => row.split(" "))
    .map(([base, ...forms]) => [base, forms] as const),
);

/** Inflected form → base word, for lookups ("taught" → "teach"). */
export const BASE_FORM = new Map<string, string>(
  [...IRREGULAR].flatMap(([base, forms]) => forms.map((form) => [form, base] as const)),
);

/**
 * Words that never take a regular inflection in this app's sentences. Without
 * this list "so" would grow an "-up" tail, "the" an "-ory", and "a" an "s".
 */
const UNINFLECTED = new Set(
  (
    "a an the this that these those i you he she it we they me him her us them my your his its our their " +
    "who whom whose which what when where why how and or but nor so yet for of to in on at by from with " +
    "without about into over under between among through during before after above below up down out off " +
    "again then once here there all any both each few more most other some such no not only own same too very " +
    "can will just should now if as than is am are was were been being"
  ).split(" "),
);

/** "be" + "d" is "bed": let the irregular row carry every form instead. */
const NO_REGULAR = new Set(["be"]);

/** A final vowel + consonant may double ("stop" → "stopped", "equip" → "equipped"). */
const doublesFinal = (w: string) => w.length <= 12 && /[aeiou][bdgklmnprstvz]$/.test(w);

/** "putt", "runn" and friends are stems for the old prefix regex, not words. */
const stemArtifact = (base: string, form: string) => form === base + base.slice(-1) && /[^aeiou]$/.test(base);

/**
 * Every surface form the headword can plausibly take in a sentence. Generated
 * explicitly instead of letting a suffix wildcard run: that wildcard is what
 * turned "so" into "soup" and "the" into "theory".
 */
export function headwordForms(word: string): string[] {
  const w = word.trim().toLowerCase();
  // One entry spells a headword as two alternatives ("cheque/check").
  const variants = w.split("/").map((v) => v.trim()).filter(Boolean);
  if (variants.length > 1) return [...new Set(variants.flatMap(headwordForms))];
  const forms = new Set<string>([w]);
  const irregular = IRREGULAR.get(w) ?? (UNINFLECTED.has(w) ? undefined : IRREGULAR.get(BASE_FORM.get(w) ?? ""));
  for (const form of irregular ?? []) if (!stemArtifact(w, form)) forms.add(form);
  if (UNINFLECTED.has(w) || NO_REGULAR.has(w)) return [...forms];
  // A phrase is matched as written; inflecting its parts invents "day offed".
  if (/\s/.test(w)) return [...forms];

  const add = (s: string) => forms.add(s);
  const baseHasIrregular = !!IRREGULAR.get(w);
  const y = /[^aeiou]y$/.test(w);
  const sibilant = /(?:s|x|z|ch|sh)$/.test(w);
  const endsE = w.endsWith("e");

  // Plural / third person.
  if (y) add(`${w.slice(0, -1)}ies`);
  else if (w.length <= 4 && /[aeiou]z$/.test(w)) add(`${w}zes`);
  else if (sibilant) add(`${w}es`);
  else add(`${w}s`);

  // Past. An irregular row already has it; a 3-letter "-ee" noun would turn
  // into a different word ("fee" → "feed", "see" → "seed").
  if (!baseHasIrregular && !/^[a-z]ee$/.test(w)) {
    if (y) add(`${w.slice(0, -1)}ied`);
    else if (endsE) add(`${w}d`);
    else add(`${w}ed`);
    if (doublesFinal(w)) add(`${w}${w.slice(-1)}ed`);
  }

  // Present participle.
  if (/ie$/.test(w)) add(`${w.slice(0, -2)}ying`);
  else if (/ee$/.test(w)) add(`${w}ing`);
  else if (endsE) add(`${w.slice(0, -1)}ing`);
  else add(`${w}ing`);
  if (w.endsWith("c")) add(`${w}king`);
  if (doublesFinal(w)) add(`${w}${w.slice(-1)}ing`);

  return [...forms];
}

const PATTERN_CACHE = new Map<string, string>();
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Find the headword (or an inflected form) inside an example sentence. */
export function headwordPattern(word: string) {
  const key = word.trim().toLowerCase();
  let source = PATTERN_CACHE.get(key);
  if (!source) {
    const forms = headwordForms(word).sort((a, b) => b.length - a.length || a.localeCompare(b));
    source = `(?<![A-Za-z])(?:${forms.map((f) => f.split(/\s+/).map(escapeRe).join("\\s+")).join("|")})(?![A-Za-z])`;
    PATTERN_CACHE.set(key, source);
  }
  return new RegExp(source, "i");
}

export function splitHighlight(sentence: string, word: string): [string, string, string] | null {
  const target = word.trim().replace(/\s+/g, " ").toLowerCase();
  const re = new RegExp(headwordPattern(word).source, "gi");
  // Prefer the headword itself over an inflection: "The soup was so hot"
  // must mark "so", not the soup it mentions.
  let best: RegExpExecArray | null = null;
  let bestRank = 2;
  for (const m of sentence.matchAll(re)) {
    const rank = m[0].replace(/\s+/g, " ").toLowerCase() === target ? 0 : 1;
    if (rank < bestRank) {
      best = m;
      bestRank = rank;
      if (rank === 0) break;
    }
  }
  if (!best || best.index === undefined) return null;
  return [sentence.slice(0, best.index), best[0], sentence.slice(best.index + best[0].length)];
}

export function gap(sentence: string, word: string) {
  const parts = splitHighlight(sentence, word);
  return parts ? { before: parts[0], hidden: parts[1], after: parts[2] } : null;
}

export const normalize = (s: string) =>
  s
    .normalize("NFKC")
    .replace(/[’‘]/g, "'")
    .replace(/[‐‑–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

export function shuffle<T>(xs: T[], seed = Math.random() * 2 ** 31): T[] {
  const out = [...xs];
  let x = Math.floor(seed) || 1;
  for (let i = out.length - 1; i > 0; i--) {
    x = (Math.imul(1664525, x) + 1013904223) >>> 0;
    const j = x % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function hashSeed(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Collocations are stored as "english｜中文". */
export const splitPair = (s: string) => {
  const [en, zh] = s.split(/[｜|]/);
  return { en: (en || "").trim(), zh: (zh || "").trim() };
};

export const plural = (n: number) => n.toLocaleString("en-US");
