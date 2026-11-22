const { chromium } = require('playwright');
const fs = require('fs');

const LANG = process.argv[2] || 'American English';
const OUT = process.argv[3] || 'evp.json';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 3000 } });
  await page.goto('https://englishprofile.org/?menu=evp-online', { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForTimeout(6000);

  if (LANG !== 'British English') {
    await page.evaluate((lang) => {
      const el = Array.from(document.querySelectorAll('div,span,label')).find(e => (e.innerText || '').trim() === lang && e.children.length <= 1);
      if (el) el.click();
    }, LANG);
    await page.waitForTimeout(8000);
  }

  let info = null;
  for (let t = 0; t < 30 && !info; t++) {
    info = await page.evaluate(() => {
      const out = [];
      document.querySelectorAll('.bubble-rg').forEach((rg) => {
        if (rg.offsetParent === null) return;
        const row = rg.firstElementChild;
        if (!row) return;
        const g = row.firstElementChild;
        if (!g) return;
        const cells = Array.from(g.children).map(c => c.innerText.trim());
        if (cells.length >= 4) out.push({ cls: rg.className.match(/(ba[A-Za-z0-9]+)/)[1], n: rg.children.length, sample: cells[0].slice(0, 20) });
      });
      out.sort((a, b) => b.n - a.n);
      return out[0] || null;
    });
    if (!info) await page.waitForTimeout(1000);
  }
  console.log('RG', JSON.stringify(info));
  const RG = '.' + info.cls;

  const totalText = await page.evaluate(() => (document.body.innerText.match(/of\s+([\d,]+)/) || [])[1]);
  const total = parseInt(String(totalText).replace(/,/g, ''), 10);
  console.log('target total', total);

  const selIdx = await page.evaluate(() => {
    const sels = Array.from(document.querySelectorAll('select'));
    for (let i = 0; i < sels.length; i++) {
      const s = sels[i];
      if (s.offsetParent !== null && Array.from(s.options).some(o => o.textContent.trim() === 'All') && s.getBoundingClientRect().top > 0) return i;
    }
    return -1;
  });
  console.log('select idx', selIdx);
  await page.locator('select').nth(selIdx).selectOption({ label: 'All' });
  await page.waitForTimeout(5000);

  let last = 0, stall = 0;
  for (let i = 0; i < 400; i++) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(600);
    const n = await page.locator(RG + ' > .group-item').count();
    if (i % 20 === 0) console.log('pass', i, 'rows', n);
    if (n >= total) { console.log('ALL RENDERED', n); break; }
    if (n === last) { if (++stall > 12) { console.log('STALLED', n); break; } } else stall = 0;
    last = n;
  }

  const data = await page.evaluate((rg) => {
    return Array.from(document.querySelectorAll(rg + ' > .group-item')).map(r => {
      const g = r.firstElementChild;
      return g ? Array.from(g.children).filter(c => c.tagName !== 'BUTTON').map(c => c.innerText.trim()) : [];
    });
  }, RG);
  fs.writeFileSync(OUT, JSON.stringify(data));
  console.log('EXTRACTED', data.length, 'bad', data.filter(d => d.length !== 5).length);
  console.log(JSON.stringify(data.slice(0, 3)));
  await browser.close();
})();
