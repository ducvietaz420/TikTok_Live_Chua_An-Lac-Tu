const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/Nemou/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const source = fs.readFileSync(path.resolve(__dirname, '../tiktok-live-pgd-main/themes/chua/grand-tribute.js'), 'utf8');
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route('https://avatar.test/**', route => route.fulfill(route.request().url().endsWith('/broken')
      ? { status: 404, body: '' }
      : { contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="90" height="90"><rect width="90" height="90" fill="#4e8177"/><circle cx="45" cy="32" r="17" fill="#f5d9a0"/><path d="M15 90a30 30 0 0 1 60 0" fill="#f5d9a0"/></svg>' }));
    await page.setContent('<html><head><style>body{margin:0}#stage{position:relative;width:1080px;height:1920px;background:#482618}.cx-toast{position:absolute;top:1010px;color:white}.cx-so{position:absolute;top:1180px;color:white}</style></head><body><div id="stage"><div class="cx-toast">Toast</div><div class="cx-so">Receipt</div></div></body></html>');
    await page.evaluate(() => {
      const handlers = {}, live = {};
      window.Kit = { on: (name, fn) => (handlers[name] ||= []).push(fn), emit: (name, ev) => (handlers[name] || []).forEach(fn => fn(ev)) };
      window.Live = { on: (name, fn) => (live[name] ||= []).push(fn), emit: name => (live[name] || []).forEach(fn => fn()) };
      window.clock = 1000; performance.now = () => clock;
      window.tick = ms => { clock += ms; Kit.emit('frame', clock); };
      window.offer = (name, avatar = '') => Kit.emit('grandOffering', { person: { name }, event: { user: { name, avatar } } });
    });
    await page.addScriptTag({ content: source });
    await page.evaluate(() => { Kit.emit('start'); Live.emit('ready'); offer('Thanh Tâm', 'https://avatar.test/good'); });
    await page.waitForSelector('.cx-tribute-avatar.loaded');
    await page.waitForTimeout(500);
    const first = await page.evaluate(() => {
      const card = document.querySelector('.cx-tribute'), box = card.getBoundingClientRect();
      return { name: card.querySelector('.cx-tribute-name').textContent, phrase: card.querySelector('.cx-tribute-message').textContent, top: box.top, bottom: box.bottom, toast: getComputedStyle(document.querySelector('.cx-toast')).visibility, receipt: getComputedStyle(document.querySelector('.cx-so')).visibility, overflow: card.scrollWidth > card.clientWidth };
    });
    assert.equal(first.name, 'Thanh Tâm'); assert.equal(first.phrase, 'Trân trọng tấm lòng của');
    assert.ok(first.top === 1180 && first.bottom < 1360 && !first.overflow, JSON.stringify(first));
    assert.equal(first.toast, 'hidden');
    assert.equal(first.receipt, 'hidden');
    await page.screenshot({ path: path.join(__dirname, 'grand-tribute-card.png'), clip: { x: 90, y: 1150, width: 900, height: 200 } });
    const timeline = await page.evaluate(() => {
      offer('Minh Anh'); tick(4590);
      const faded = !document.querySelector('.cx-tribute').classList.contains('show');
      tick(410);
      const next = document.querySelector('.cx-tribute-name').textContent;
      tick(5000);
      return { faded, next, ended: document.querySelector('.cx-tribute').getAttribute('aria-hidden'), toast: getComputedStyle(document.querySelector('.cx-toast')).visibility, receipt: getComputedStyle(document.querySelector('.cx-so')).visibility };
    });
    assert.deepEqual(timeline, { faded: true, next: 'Minh Anh', ended: 'true', toast: 'visible', receipt: 'visible' });
    const burst = await page.evaluate(() => {
      Live.emit('reset'); for (let i = 0; i < 15; i++) offer('Donor ' + i);
      const names = [];
      for (let i = 0; i < 7; i++) { if (document.querySelector('.cx-tribute').classList.contains('show')) names.push(document.querySelector('.cx-tribute-name').textContent); tick(5000); }
      return names;
    });
    assert.deepEqual(burst, ['Donor 0', 'Donor 10', 'Donor 11', 'Donor 12', 'Donor 13', 'Donor 14']);
    await page.evaluate(() => { Live.emit('reset'); offer('Bình An', 'https://avatar.test/broken'); });
    await page.waitForFunction(() => !document.querySelector('.cx-tribute-avatar img'));
    assert.equal(await page.locator('.cx-tribute-initials').textContent(), 'BA');
    const safety = await page.evaluate(() => {
      Live.emit('reset'); offer('<img src=x onerror=window.injected=1> Nguyễn Văn ' + 'Tên dài '.repeat(15), 'javascript:alert(1)');
      const label = document.querySelector('.cx-tribute-name');
      return { literal: label.textContent.startsWith('<img'), injected: Boolean(window.injected), noImage: !document.querySelector('.cx-tribute-avatar img'), within: label.getBoundingClientRect().right <= document.querySelector('.cx-tribute').getBoundingClientRect().right, ellipsis: getComputedStyle(label).textOverflow };
    });
    assert.deepEqual(safety, { literal: true, injected: false, noImage: true, within: true, ellipsis: 'ellipsis' });
    const resets = await page.evaluate(() => {
      offer('Waiting'); Live.emit('ready'); tick(10000);
      return { count: document.querySelectorAll('.cx-tribute').length, hidden: document.querySelector('.cx-tribute').getAttribute('aria-hidden'), name: document.querySelector('.cx-tribute-name').textContent, toast: getComputedStyle(document.querySelector('.cx-toast')).visibility };
    });
    assert.deepEqual(resets, { count: 1, hidden: 'true', name: '', toast: 'visible' });
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ first, timeline, burst, safety, resets, pageErrors: errors }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
