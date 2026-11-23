/**
 * Crawl the English Vocabulary Profile detail pages, which carry the definition
 * of every sense.
 *
 * The list page only exposes base word / guideword / level / part of speech.
 * Each row's "details" button opens ?menu=evp-online&refid=ID_00000000, and those
 * refids run 1..6969 in alphabetical order with gaps. One page covers a headword
 * and lists every sense with its definition, so the whole vocabulary profile is
 * 6,969 page loads rather than 15,696 clicks.
 *
 * Usage: node analysis/cefr/crawl-evp-details.cjs [start] [end] [workers] [out]
 * Output: JSONL, one line per refid: { refid, notFound, entries: [...] }
 *         entry = { head, word, guide, labels, level, pos, ipa, def }
 * Resumable: refids already present with entries are skipped.
 */
const { chromium } = require('playwright');
const fs = require('fs');

const LEVEL = /^(A1|A2|B1|B2|C1|C2)$/;
const NL = String.fromCharCode(10);

function parse(text) {
  const lines = text.split(NL).map(s => s.trim()).filter(Boolean);
  const start = lines.findIndex(l => l === 'Back to Report');
  if (start < 0) return null;
  const out = [];
  let head = '', pos = '', ipa = '';
  let i = start + 1;
  while (i < lines.length && !/^(Copyright|Terms of Use)/.test(lines[i])) {
    const l = lines[i];
    if (l.endsWith('·')) {
      head = l.replace(/\s*·$/, '');
      pos = lines[i + 1] || '';
      ipa = (lines[i + 2] || '').startsWith('/') ? lines[i + 2] : '';
      i += 2 + (ipa ? 1 : 0);
      if (lines[i] === 'Show full view') i++;
      continue;
    }
    let j = i + 1, guide = '';
    const labels = [];
    while (j < lines.length && (/^\(.*\)$/.test(lines[j]) || /^\[.*\]$/.test(lines[j]))) {
      if (lines[j].startsWith('(')) guide = lines[j].slice(1, -1);
      else labels.push(lines[j].slice(1, -1));
      j++;
    }
    if (LEVEL.test(lines[j] || '')) {
      const level = lines[j];
      let k = j + 1;
      const def = [];
      while (k < lines.length) {
        const n = lines[k];
        if (/^(Copyright|Terms of Use)/.test(n) || n.endsWith('·')) break;
        let m = k + 1, isStart = false;
        while (m < lines.length && (/^\(.*\)$/.test(lines[m]) || /^\[.*\]$/.test(lines[m]))) m++;
        if (LEVEL.test(lines[m] || '')) isStart = true;
        if (isStart) break;
        def.push(n);
        k++;
      }
      out.push({ head, word: l, guide, labels, level, pos, ipa, def: def.join(' ') });
      i = k;
      continue;
    }
    i++;
  }
  return out;
}

async function getBody(page, id) {
  const refid = 'ID_' + String(id).padStart(8, '0');
  await page.goto(`https://englishprofile.org/?menu=evp-online&refid=${refid}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  let last = -1, stable = 0, body = '';
  for (let i = 0; i < 60; i++) {
    await page.waitForTimeout(300);
    body = await page.evaluate(() => document.body.innerText);
    if (body.includes('404 error')) return { refid, body, notFound: true };
    const ready = body.includes('Show full view') || /(A1|A2|B1|B2|C1|C2)/.test(body);
    if (ready && body.length === last) { if (++stable >= 2) break; } else { stable = 0; }
    last = body.length;
  }
  return { refid, body, notFound: false };
}

(async () => {
  const START = parseInt(process.argv[2] || '1', 10);
  const END = parseInt(process.argv[3] || '6969', 10);
  const WORKERS = parseInt(process.argv[4] || '5', 10);
  const OUT = process.argv[5] || '.tmp-build/detail_all.jsonl';

  const ids = [];
  const seen = new Set();
  if (fs.existsSync(OUT)) {
    for (const line of fs.readFileSync(OUT, 'utf8').split(NL)) {
      if (!line.trim()) continue;
      try { const o = JSON.parse(line); if (o.entries && o.entries.length) seen.add(o.refid); } catch (e) {}
    }
  }
  for (let i = START; i <= END; i++) {
    const refid = 'ID_' + String(i).padStart(8, '0');
    if (!seen.has(refid)) ids.push(i);
  }
  console.log('todo', ids.length, 'skip', seen.size);

  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding'],
  });
  const chunks = Array.from({ length: WORKERS }, () => []);
  ids.forEach((id, k) => chunks[k % WORKERS].push(id));

  let done = 0;
  const out = fs.createWriteStream(OUT, { flags: 'a' });
  const t0 = Date.now();

  await Promise.all(chunks.map(async (chunk) => {
    if (!chunk.length) return;
    // 每个 worker 独立 context：共享 context 时多个标签页会互相打断渲染
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    for (const id of chunk) {
      try {
        const { refid, body, notFound } = await getBody(page, id);
        const entries = notFound ? [] : (parse(body) || []);
        out.write(JSON.stringify({ refid, notFound, entries }) + NL);
      } catch (e) {
        out.write(JSON.stringify({ refid: 'ID_' + String(id).padStart(8, '0'), error: String(e).slice(0, 120), entries: [] }) + NL);
      }
      done++;
      if (done % 100 === 0) {
        const rate = done / ((Date.now() - t0) / 1000);
        console.log(`progress ${done}/${ids.length} ${rate.toFixed(1)}/s eta ${Math.round((ids.length - done) / rate / 60)}min`);
      }
    }
    await ctx.close();
  }));

  out.end();
  await browser.close();
  console.log('DONE', done);
})();
