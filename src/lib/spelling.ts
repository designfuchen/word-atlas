import { clean, same } from "./typing";

/**
 * British and American spellings that are equally correct for the same word.
 *
 * The atlas keeps one entry per spelling, so a learner who types the other
 * convention is right even though the characters differ (`liter` for `litre`).
 * Pairs that split meaning in British English are deliberately absent --
 * practice/practise, licence/license, programme/program, advice/advise,
 * tyre/tire, storey/story, enquiry/inquiry -- because accepting them would
 * mark a different word as correct.
 */
export const SPELLING_GROUPS: readonly string[] = [
  "litre liter",
  "metre meter",
  "centre center",
  "theatre theater",
  "fibre fiber",
  "colour color",
  "favour favor",
  "honour honor",
  "labour labor",
  "neighbour neighbor",
  "behaviour behavior",
  "humour humor",
  "flavour flavor",
  "harbour harbor",
  "armour armor",
  "vapour vapor",
  "odour odor",
  "tumour tumor",
  "endeavour endeavor",
  "realise realize",
  "organise organize",
  "recognise recognize",
  "apologise apologize",
  "criticise criticize",
  "summarise summarize",
  "maximise maximize",
  "stabilise stabilize",
  "specialise specialize",
  "characterise characterize",
  "analyse analyze",
  "paralyse paralyze",
  "utilise utilize",
  "travelling traveling",
  "woollen woolen",
  "jewellery jewelry",
  "marvellous marvelous",
  "counsellor counselor",
  "catalogue catalog",
  "dialogue dialog",
  "analogue analog",
  "monologue monolog",
  "grey gray",
  "aluminium aluminum",
  "moustache mustache",
  "sceptical skeptical",
  "cosy cozy",
  "pyjamas pajamas",
  "mould mold",
  "plough plow",
  "gaol jail",
  "gram gramme",
  "kilometre kilometer",
  "loath loth",
  "despatch dispatch",
  "judgement judgment",
  "acknowledgement acknowledgment",
  "fulfil fulfill",
  "enrol enroll",
  "instal install",
  "defence defense",
  "offence offense",
];

const canonicalOf = new Map<string, string>();
const spellingsByCanonical = new Map<string, string[]>();

for (const group of SPELLING_GROUPS) {
  const [head, ...rest] = group.split(" ");
  spellingsByCanonical.set(head, [head, ...rest]);
  for (const word of [head, ...rest]) canonicalOf.set(word, head);
}

/** The headword a spelling belongs to, or the word itself when it is not a variant. */
export const canonicalSpelling = (word: string) => canonicalOf.get(word) ?? word;

/** Every accepted spelling of a word, headword first. */
export function spellingsOf(word: string): string[] {
  return spellingsByCanonical.get(canonicalSpelling(word)) ?? [word];
}

/** True when `input` is the word itself or its British/American counterpart. */
export function accepts(input: string, target: string): boolean {
  const typed = clean(input).trim().toLowerCase();
  const wanted = clean(target).trim().toLowerCase();
  return typed === wanted || spellingsOf(wanted).includes(typed);
}

const edge = (token: string, at: "start" | "end") =>
  (at === "start" ? token.match(/^[^\p{L}\p{N}]+/u) : token.match(/[^\p{L}\p{N}]+$/u))?.[0] ?? "";

/**
 * Word-by-word comparison for example sentences: punctuation has to match, but
 * a variant spelling inside the sentence is accepted (`a liter of milk` for
 * `a litre of milk`).
 */
export function acceptsSentence(input: string, target: string): boolean {
  const typed = clean(input).trim().split(/\s+/).filter(Boolean);
  const wanted = clean(target).trim().split(/\s+/).filter(Boolean);
  if (typed.length !== wanted.length) return false;
  return typed.every((token, index) => {
    const expected = wanted[index];
    if (same(token, expected)) return true;
    const head = edge(token, "start");
    const tail = edge(token, "end");
    const headWanted = edge(expected, "start");
    const tailWanted = edge(expected, "end");
    const core = token.slice(head.length, token.length - tail.length);
    const coreWanted = expected.slice(headWanted.length, expected.length - tailWanted.length);
    if (!core || !coreWanted) return false;
    return head === headWanted && tail === tailWanted && accepts(core, coreWanted);
  });
}
