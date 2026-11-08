#!/usr/bin/env node
/** Validate the public poetry dataset: structure, ordering and pinyin alignment. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pub = path.join(root, "public/poetry");
const index = JSON.parse(fs.readFileSync(path.join(pub, "index.json"), "utf8"));
const errors = [];
const warn = { noGist: 0, noTheme: 0, oddLines: 0 };
const fail = (msg) => errors.length < 50 && errors.push(msg);
const HAN = /[㐀-鿿]/;

if (index.poems.length !== index.count) fail(`count ${index.count} != rows ${index.poems.length}`);
const ids = new Set();
index.poems.forEach((r, i) => {
  const [id, title, author, form, level, lines, themes, first] = r;
  if (!/^[a-z0-9-]{1,64}$/.test(id) || ids.has(id)) fail(`bad or duplicate id at ${i}: ${id}`);
  ids.add(id);
  if (!title || !author) fail(`empty title or author: ${id}`);
  if (!(form >= 0 && form < index.forms.length)) fail(`bad form: ${id}`);
  if (!(level >= 0 && level < index.levels.length)) fail(`bad level: ${id}`);
  if (!(lines >= 2)) fail(`too few lines: ${id}`);
  if (!Array.isArray(themes) || themes.some((t) => !(t >= 0 && t < index.themes.length))) fail(`bad themes: ${id}`);
  if (typeof first !== "string" || !first) fail(`no first line: ${id}`);
});

let poems = 0;
for (let n = 0; n * index.chunk < index.count; n++) {
  const chunk = JSON.parse(fs.readFileSync(path.join(pub, `poems/${n}.json`), "utf8"));
  chunk.forEach((p, k) => {
    const row = index.poems[n * index.chunk + k];
    if (!row || row[0] !== p.id) return fail(`chunk ${n} out of order at ${p.id}`);
    poems++;
    if (p.lines.length !== row[5]) fail(`line count differs from index: ${p.id}`);
    if (!p.lines[0].zh.startsWith(row[7])) fail(`first line differs from index: ${p.id}`);
    p.lines.forEach((l, i) => {
      if (!l.zh || l.py.length !== [...l.zh].length) return fail(`pinyin length mismatch: ${p.id} line ${i}`);
      [...l.zh].forEach((ch, j) => {
        if (HAN.test(ch) !== !!l.py[j]) fail(`pinyin/character mismatch: ${p.id} line ${i} char ${j}`);
      });
    });
    if (p.lines.length % 2) warn.oddLines++;
    if (!p.gist) warn.noGist++;
    if (!p.themes.length) warn.noTheme++;
  });
}
if (poems !== index.count) fail(`found ${poems} poems in chunks, index says ${index.count}`);

console.log(JSON.stringify({ poems, warnings: warn, errors: errors.length }, null, 1));
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
