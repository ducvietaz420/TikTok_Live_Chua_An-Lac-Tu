const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/Nemou/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const root = path.resolve(__dirname, '..');
const themeDir = path.join(root, 'tiktok-live-pgd-main/themes/chua');
const theme = JSON.parse(fs.readFileSync(path.join(themeDir, 'theme.json')));
theme.scene = JSON.parse(fs.readFileSync(path.join(themeDir, 'scene.json')));
const colors = ['#386f73', '#8f4a60', '#4d5989'];
const names = ['Thanh Tâm', 'Minh Anh', 'An Nhiên'];
const mime = { '.js': 'text/javascript', '.html': 'text/html', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp3': 'audio/mpeg' };
// Virtual origin + WebSocket routing: this harness never needs a local socket.
const base = 'https://chua.test';
const players = names.map((name, i) => ({ id: `board-viewer-${i}`, name, isPlayer: true, rank: i + 1, coins: [1000, 500, 250][i], avatar: `${base}/avatars/${i + 1}.svg` }));

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.origin !== base) return route.abort();
      if (url.pathname.startsWith('/avatars/')) {
        const index = Number(url.pathname.match(/\d+/)?.[0]) - 1;
        if (index < 0 || index >= colors.length) return route.fulfill({ status: 404, body: '' });
        return route.fulfill({ contentType: 'image/svg+xml', body: `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="${colors[index]}"/><circle cx="50" cy="35" r="21" fill="#f1d8b7"/><ellipse cx="50" cy="99" rx="40" ry="38" fill="#e6c485"/></svg>` });
      }
      if (url.pathname.startsWith('/api/')) return route.fulfill({ contentType: 'application/json', body: '{"files":[]}' });
      const file = url.pathname.startsWith('/sdk/')
        ? path.join(root, 'tiktok-live-kit/public', url.pathname)
        : path.join(themeDir, url.pathname === '/' ? 'index.html' : url.pathname);
      if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return route.fulfill({ status: 404, body: '' });
      return route.fulfill({ contentType: mime[path.extname(file)] || 'application/octet-stream', body: fs.readFileSync(file) });
    });
    await page.routeWebSocket('**/ws', socket => socket.onMessage(() => socket.send(JSON.stringify({
      type: 'init', theme, players,
      state: { totals: { coins: 1750, likes: 1200 }, top: players, goals: [] },
      guide: { rules: theme.rules },
      settings: { cameraFx: true, ambientFx: false, voiceEnabled: false },
    }))));
    await page.goto(`${base}/?mute&quiet`);
    await page.waitForFunction(() => document.querySelectorAll('.cx-board .av.loaded').length === 3 && Kit.scene.chars.every(c => c.sheetD.ready) && Kit.assets.get(Live.theme.scene.background).ready);
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => {
      for (const person of Kit.scene.people()) {
        person.tasks.length = 0; person.task = null; person.walking = false;
        if (person.slot) { person.x = person.slot.x; person.y = person.slot.y; }
        person.pose = 'idle';
      }
    });
    const board = page.locator('.cx-board');
    const bounds = await board.boundingBox();
    await page.screenshot({ path: path.join(__dirname, 'board-avatars.png'), clip: { x: bounds.x - 20, y: bounds.y - 20, width: bounds.width + 40, height: bounds.height + 40 } });
    await page.screenshot({ path: path.join(__dirname, 'board-avatars-overlay.png') });
    const initial = await page.evaluate(() => {
      window.savedBoardImage = document.querySelector('.cx-board img');
      const board = document.querySelector('.cx-board');
      const right = board.getBoundingClientRect().right;
      return {
        rows: board.querySelectorAll('li').length,
        loaded: board.querySelectorAll('.av.loaded').length,
        names: [...board.querySelectorAll('.nm')].map(n => n.textContent),
        ranks: [...board.querySelectorAll('.rk')].map(n => n.textContent),
        overflow: [...board.querySelectorAll('li')].some(n => n.getBoundingClientRect().right > right),
      };
    });
    assert.equal(initial.rows, 3);
    assert.equal(initial.loaded, 3);
    assert.deepEqual(initial.names, names);
    assert.deepEqual(initial.ranks, ['1', '2', '3']);
    assert.equal(initial.overflow, false);
    const reused = await page.evaluate(() => { Kit.hud.state(Live.state, 3); return document.querySelector('.cx-board img') === savedBoardImage; });
    assert.equal(reused, true);
    await page.evaluate(base => Kit.hud.state({ totals: {}, top: [
      { name: '<img src=x onerror=alert(1)> Nguyễn Văn Bình An', coins: 1000000, avatar: 'javascript:alert(1)' },
      { name: 'Bình An', coins: 500, avatar: `${base}/avatars/404.svg` },
      { name: '   ', coins: 100, avatar: 'data:image/svg+xml,invalid' },
    ] }, 3), base);
    await page.waitForFunction(() => document.querySelectorAll('.cx-board img').length === 0);
    const fallback = await page.evaluate(() => ({
      initials: [...document.querySelectorAll('.cx-board .initials')].map(n => n.textContent),
      names: [...document.querySelectorAll('.cx-board .nm')].map(n => n.textContent),
      nameImages: document.querySelectorAll('.cx-board .nm img').length,
    }));
    assert.deepEqual(fallback.initials, ['<A', 'BA', 'TC']);
    assert.equal(fallback.names[2], 'Thí chủ');
    assert.equal(fallback.nameImages, 0);
    const empty = await page.evaluate(() => { Kit.hud.state({ totals: {}, top: [] }, 0); return [...document.querySelectorAll('.cx-board .nm')].map(n => n.textContent); });
    assert.deepEqual(empty, Array(3).fill('Chờ người hữu duyên'));
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ initial, reused, fallback, empty, pageErrors: errors, screenshots: ['board-avatars.png', 'board-avatars-overlay.png'] }, null, 2));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
