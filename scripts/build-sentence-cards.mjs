import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.resolve(root, process.argv[2] || ".local/dictionary/ecdict.csv");
const original = JSON.parse(fs.readFileSync(path.join(root, "data/word-atlas.json"), "utf8"));
const normalize = (s) => s.toLowerCase().replace(/[‘’]/g, "'");
const tokens = (s) => s.match(/\b(?:[ap]\.m\.|bona fide|t-shirts?)|\p{L}+(?:['’]\p{L}+)*/giu) || [];
const originals = new Map(original.map((e) => [normalize(e.w), e]));
const contexts = new Map();
for (const entry of original) for (const ex of entry.ex) for (const raw of tokens(ex.en)) {
  const word = normalize(raw);
  const list = contexts.get(word) || [];
  if (!list.some((x) => x.ex.en === ex.en)) list.push({ ex, topic: entry.topic, cefr: entry.cefr });
  contexts.set(word, list);
}
const wanted = new Set([...contexts.keys(), ...originals.keys()]);
for (const word of [...wanted]) if (word.endsWith("'s")) wanted.add(word.slice(0, -2));

// RFC 4180 reader; source uses literal \\n within definitions as well as quoted CSV fields.
function readCsv(file, visit) {
  const data = fs.readFileSync(file, "utf8");
  let row = [], field = "", quoted = false, headers;
  for (let i = 0; i <= data.length; i++) {
    const c = data[i] ?? "\n";
    if (c === '"') {
      if (quoted && data[i + 1] === '"') { field += '"'; i++; }
      else quoted = !quoted;
    } else if (!quoted && (c === "," || c === "\n")) {
      row.push(field.replace(/\r$/, "")); field = "";
      if (c === "\n") {
        if (!headers) headers = row;
        else if (row.length === headers.length) visit(Object.fromEntries(headers.map((h, j) => [h, row[j]])));
        row = [];
      }
    } else field += c;
  }
}
const dictionary = new Map(), forms = new Map();
const exchanges = (s) => s.split("/").map((x) => x.split(":"));
readCsv(source, (row) => {
  const word = normalize(row.word);
  if (wanted.has(word) && (!dictionary.has(word) || row.word === word)) dictionary.set(word, row);
  for (const [kind, value] of exchanges(row.exchange)) {
    if (!"pdi3rts".includes(kind) || !value) continue;
    for (const variant of value.split(",")) {
      const form = normalize(variant);
      if (wanted.has(form) && form !== word && /^[a-z]+$/.test(word)) {
        const list = forms.get(form) || [];
        if (!list.includes(word)) list.push(word);
        forms.set(form, list);
      }
    }
  }
});
const overridesPath = path.join(root, "data/sentence-card-overrides.json");
const overrides = fs.existsSync(overridesPath) ? JSON.parse(fs.readFileSync(overridesPath, "utf8")) : {};
const baseWords = new Set([...forms.values()].flat());
for (const override of Object.values(overrides)) if (override.alias) baseWords.add(override.alias);
for (const row of dictionary.values()) for (const [kind, value] of exchanges(row.exchange)) {
  if (kind === "0" && value) value.split(",").forEach((w) => baseWords.add(normalize(w)));
}
readCsv(source, (row) => {
  const word = normalize(row.word);
  if (baseWords.has(word) && !dictionary.has(word)) dictionary.set(word, row);
});

const ids = new Set(original.map((e) => e.id));
const supplements = new Map(), aliases = {}, unresolved = [];
const hasChinese = (s) => /[\u3400-\u9fff]/.test(s || "");
const lexicalForms = new Set("housing clothing shopping training parking marketing learning teaching building drawing painting reading writing meeting opening warning lighting heating manufacturing processing packaging funding accounting gardening cooking cleaning engineering mining fishing banking advertising broadcasting networking recording planning living surroundings earnings savings belongings news means goods informed experienced skilled talented limited retired disabled married worried tired excited interested interesting boring amazing surprising challenging promising demanding rewarding outstanding".split(" "));
const usable = (word) => overrides[word] || hasChinese(dictionary.get(word)?.translation);
const slug = (word) => `extra-${word.replace(/[^a-z0-9]+/g, "-")}`;
function senses(row) {
  return row.translation.replace(/\\r/g, "").split(/\\n|\n/).filter((s) => hasChinese(s) && !/^\[/.test(s)).map((s) => {
    const match = s.match(/^([a-z./]+\.)\s*(.*)/i);
    return { pos: match?.[1] || "", zh: (match?.[2] || s).trim(), en: "" };
  }).slice(0, 3);
}
function ensure(word, token) {
  if (originals.has(word)) return originals.get(word).id;
  if (supplements.has(word)) return supplements.get(word).id;
  const row = dictionary.get(word), custom = overrides[word];
  if (!custom && !hasChinese(row?.translation)) return undefined;
  const found = contexts.get(token) || contexts.get(word) || [];
  const selected = found.slice(0, 2);
  const meaning = custom?.senses || senses(row);
  if (!meaning.length) return undefined;
  const id = slug(word);
  if (ids.has(id)) throw new Error(`Duplicate ID: ${id}`);
  ids.add(id);
  const entry = {
    id, w: word === "i" ? "I" : word === "c" ? "C" : word.replace(/^i(?=')/, "I"), uk: custom?.uk || (row?.phonetic ? `/${row.phonetic.replace(/^\/|\/$/g, "")}/` : ""), us: "",
    senses: meaning, ex: selected.map((x) => x.ex), col: custom?.col || [], fam: [], syn: [], ant: [],
    tip: custom?.tip || "结合例句判断词性与含义；点击例句中的单词可继续查词。",
    cefr: custom?.cefr || found[0]?.cefr || "B1", topic: found[0]?.topic || "daily",
    m: (["img", "thumb"].every(folder => fs.existsSync(path.join(root, "public/atlas", folder, `${id}.webp`))) ? 1 : 0)
      | Object.entries({ uk: 2, us: 4, ex: 8, ex2: 16 }).reduce((flags, [kind, bit]) =>
        flags | (fs.existsSync(path.join(root, "public/atlas/audio", kind, `${id}.mp3`)) ? bit : 0), 0),
    note: custom?.note || "补充词卡：释义取自 ECDICT；例句取自原词库，难度沿用例句来源词条，尚未逐条审校。",
    supplemental: true,
  };
  supplements.set(word, entry);
  return id;
}
function resolve(token) {
  if (originals.has(token)) return originals.get(token).id;
  if (overrides[token]?.alias) return ensure(overrides[token].alias, token);
  if (overrides[token]) return ensure(token, token);
  if (token.endsWith("'s") && !dictionary.has(token)) {
    const base = token.slice(0, -2);
    if (originals.has(base) || usable(base)) return ensure(base, token);
  }
  const row = dictionary.get(token);
  const irregular = { am: "be", is: "be", are: "be", was: "be", were: "be", been: "be", being: "be", has: "have", had: "have", does: "do", did: "do", done: "do", went: "go", gone: "go" };
  if (irregular[token]) return ensure(irregular[token], token);
  const roots = (forms.get(token) || []).concat(exchanges(row?.exchange || "").filter(([k]) => k === "0").flatMap(([, v]) => (v || "").split(",")));
  // Preserve standalone noun/adjective senses (e.g. housing), instead of stripping suffixes blindly.
  const ownSense = lexicalForms.has(token);
  if (!ownSense) {
    const base = roots.find((w) => originals.has(w)) || roots.find((w) => usable(w));
    if (base) {
      const id = ensure(base, token);
      if (id) return id;
    }
  }
  return ensure(token, token);
}
for (const token of [...contexts.keys()].sort()) {
  const id = resolve(token);
  if (id) aliases[token] = id;
  else unresolved.push({ word: token, count: contexts.get(token).length, examples: contexts.get(token).slice(0, 2).map((x) => x.ex) });
}
// A base may itself be a word in the sentences (e.g. mooring/moorings).
// Match runtime exact-word precedence and keep only cards that can actually be reached.
const examplesById = new Map();
for (const [token, uses] of contexts) {
  const id = originals.get(token)?.id || supplements.get(token)?.id || aliases[token];
  if (!id) continue;
  aliases[token] = id;
  const list = examplesById.get(id) || [];
  for (const { ex } of uses) if (list.length < 2 && !list.some((x) => x.en === ex.en)) list.push(ex);
  examplesById.set(id, list);
}
const entries = [...supplements.values()].filter((e) => examplesById.has(e.id)).map((e) => ({ ...e, ex: examplesById.get(e.id) })).sort((a, b) => a.id.localeCompare(b.id));
const report = { originalEntries: original.length, uniqueTokens: contexts.size, addedEntries: entries.length, resolvedTokens: Object.keys(aliases).length, unresolved };
fs.mkdirSync(path.join(root, ".local/dictionary"), { recursive: true });
fs.writeFileSync(path.join(root, ".local/dictionary/coverage.json"), JSON.stringify(report, null, 2));
if (unresolved.length) throw new Error(`Unresolved words: ${unresolved.map((x) => x.word).join(", ")}; see .local/dictionary/coverage.json`);
const output = { source: "https://github.com/skywind3000/ECDICT", sourceSha256: crypto.createHash("sha256").update(fs.readFileSync(source)).digest("hex"), entries, aliases };
fs.writeFileSync(path.join(root, "public/atlas/supplemental.json"), JSON.stringify(output));
console.log(JSON.stringify({ ...report, unresolved: unresolved.map((x) => x.word) }, null, 2));
