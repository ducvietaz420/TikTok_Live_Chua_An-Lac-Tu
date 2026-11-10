const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/Nemou/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const { WebSocketServer } = require('../tiktok-live-kit/node_modules/ws');
const root = path.resolve(__dirname, '..');
const themeDir = path.join(root, 'tiktok-live-pgd-main/themes/chua');
const theme = JSON.parse(fs.readFileSync(path.join(themeDir, 'theme.json')));
theme.scene = JSON.parse(fs.readFileSync(path.join(themeDir, 'scene.json')));
const state = { totals: {}, top: [], goals: [] };
const mime = { '.js': 'text/javascript', '.html': 'text/html', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp3': 'audio/mpeg' };
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let file = url.pathname.startsWith('/sdk/') ? path.join(root, 'tiktok-live-kit/public', url.pathname) : path.join(themeDir, url.pathname === '/' ? 'index.html' : url.pathname);
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
const wss = new WebSocketServer({ server });
wss.on('connection', ws => ws.on('message', () => ws.send(JSON.stringify({ type: 'init', theme, players: [], state, guide: { rules: theme.rules }, settings: { cameraFx: false, ambientFx: false, voiceEnabled: false } }))));

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/?mute&quiet`);
    await page.waitForFunction(() => Kit.scene.chars[0]?.sheetD?.ready && document.querySelector('.cx-xam'));
    await page.screenshot({ path: path.join(__dirname, 'empty.png') });
    const empty = await page.evaluate(() => ({ people: Kit.scene.people().length, extras: Kit.scene.extras().length }));
    assert.deepEqual(empty, { people: 0, extras: 0 });
    await page.evaluate(() => {
      const colors = ['#2b7a78', '#b43e5b', '#5964b8', '#a0671c'];
      for (let i = 0; i < 24; i++) {
        const avatar = 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="${colors[i % 4]}"/><text x="50" y="64" text-anchor="middle" fill="white" font-family="sans-serif" font-weight="bold" font-size="42">${i + 1}</text></svg>`);
        Kit.scene.ensure({ id: 'viewer-' + i, name: ['Minh Anh', 'Thanh Tâm', 'An Nhiên', 'Bình An'][i % 4], avatar }, { instant: true });
      }
      window.previewTop = Kit.scene.people().slice(0, 16).map((p, i) => ({ id: p.id, name: p.name, coins: (16 - i) * 10, rank: i + 1 }));
      Kit.scene.seatTop(previewTop);
    });
    // Advance the real scene task runner without waiting for 20 seconds of walking.
    await page.evaluate(() => {
      let time = performance.now();
      for (let i = 0; i < 600; i++) Kit.scene.frame(time += 50, 50);
    });
    await page.waitForFunction(() => Kit.scene.people().every(p => p.avatar.complete));
    await page.screenshot({ path: path.join(__dirname, 'people.png') });
    await page.evaluate(() => {
      const user = { id: 'viewer-0', name: 'Minh Anh', isPlayer: true };
      Kit.hud.draw({ user, draw: Live.theme.draws.xam.items[8] });
      setTimeout(() => {
        Kit.hud.remember(user.id, 'Cầu bình an và sức khỏe cho gia đình');
        Kit.hud.giftCard({ user, action: 'bow', label: 'Lễ bái', total: 5, count: 1 });
      }, 2600);
    });
    await page.waitForFunction(() => document.querySelector('.cx-xam.open') && document.querySelector('.cx-so.show'));
    await page.waitForTimeout(700);
    const layout = await page.evaluate(() => {
      const r = sel => { const b = document.querySelector(sel).getBoundingClientRect(); return { top: b.top, bottom: b.bottom, left: b.left, right: b.right }; };
      return { gift: r('.cx-so'), draw: r('.cx-xam'), poem: r('.cx-xam .tho'), advice: r('.cx-xam .loi'), footer: r('.cx-xam .ft'), heading: document.querySelector('.cx-xam .heading').textContent, people: Kit.scene.people().length, seats: Kit.scene.seats.filter(s => s.taken).length, extras: Kit.scene.extras().length };
    });
    assert.ok(layout.draw.top >= layout.gift.bottom + 20, JSON.stringify(layout));
    assert.ok(layout.draw.bottom < 1760);
    assert.ok(layout.advice.bottom < layout.footer.top, JSON.stringify(layout));
    assert.equal(layout.seats, 16);
    assert.equal(layout.people, 24);
    assert.equal(layout.extras, 0);
    assert.match(layout.heading, /Quẻ số 9.*của Minh Anh/s);
    await page.screenshot({ path: path.join(__dirname, 'fortune-and-gift.png') });
    const fortuneLayouts = await page.evaluate(() => Live.theme.draws.xam.items.map(draw => {
      const poem = document.querySelector('.cx-xam .tho');
      poem.replaceChildren(...draw.tho.flatMap((line, i) => i ? [document.createElement('br'), document.createTextNode(line)] : [document.createTextNode(line)]));
      document.querySelector('.cx-xam .loi').textContent = 'Lời bàn · ' + draw.loi;
      return { number: draw.so, bottom: document.querySelector('.cx-xam .loi').getBoundingClientRect().bottom, footer: document.querySelector('.cx-xam .ft').getBoundingClientRect().top };
    }));
    assert.ok(fortuneLayouts.every(item => item.bottom < item.footer), JSON.stringify(fortuneLayouts));
    // Exercise viewer text as literal text and check a very long name stays in its box.
    const safeName = await page.evaluate(() => {
      const node = document.querySelector('.cx-xam .requester');
      node.textContent = 'của <img src=x onerror=alert(1)>' + ' Người xin xăm tên rất dài'.repeat(12);
      return { images: node.querySelectorAll('img').length, width: node.getBoundingClientRect().width, parent: node.parentElement.getBoundingClientRect().width, right: node.getBoundingClientRect().right, sealLeft: document.querySelector('.cx-xam .loai').getBoundingClientRect().left };
    });
    assert.equal(safeName.images, 0);
    assert.ok(safeName.width <= safeName.parent);
    assert.ok(safeName.right < safeName.sealLeft);
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ layout, safeName, fortunesChecked: fortuneLayouts.length, pageErrors: errors }, null, 2));
  } finally {
    await browser.close();
    wss.close();
    server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; wss.close(); server.close(); });
