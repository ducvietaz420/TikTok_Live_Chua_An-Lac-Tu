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
const names = ['HẾT DUYÊN', 'Thanh Tâm', 'An Nhiên', 'Minh Anh', 'Bình An', 'Ngọc Mai', 'Người xem có tên rất dài Nguyễn Văn Bình An', 'Lan Hương', 'Khánh Linh'];
const players = names.map((name, i) => ({
  id: 'name-viewer-' + i, name, isPlayer: true, rank: i < 3 ? i + 1 : 0, coins: i < 3 ? 300 - i * 100 : 0,
  avatar: 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="${['#a53b4b', '#438980', '#5d65a5'][i % 3]}"/><text x="50" y="68" text-anchor="middle" fill="white" font-family="sans-serif" font-size="50">${i + 1}</text></svg>`),
}));
const mime = { '.js': 'text/javascript', '.html': 'text/html', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp3': 'audio/mpeg' };
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const file = url.pathname.startsWith('/sdk/') ? path.join(root, 'tiktok-live-kit/public', url.pathname) : path.join(themeDir, url.pathname === '/' ? 'index.html' : url.pathname);
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
const wss = new WebSocketServer({ server });
wss.on('connection', ws => ws.on('message', () => ws.send(JSON.stringify({ type: 'init', theme, players, state: { totals: {}, top: players.slice(0, 3), goals: [] }, guide: { rules: theme.rules }, settings: { cameraFx: true, ambientFx: false, voiceEnabled: false } }))));
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/?mute&quiet`);
    await page.waitForFunction(() => Kit.scene.chars.every(c => c.sheetD.ready) && Kit.assets.get(Live.theme.scene.background).ready && Kit.scene.people().every(p => p.avatar?.complete));
    const setup = () => {
      const regular = Kit.scene.people().filter(p => p.rank === 0).sort((a, b) => a.id.localeCompare(b.id));
      const targets = [[250, 1130], [830, 1130], [250, 1290], [830, 1290], [250, 1450], [830, 1450]];
      regular.forEach((p, i) => {
        const target = targets[i];
        const home = Kit.scene.layout.slots.filter(s => !s.taken || s.taken === p.id).sort((a, b) => Math.hypot(a.x - target[0], a.y - target[1]) - Math.hypot(b.x - target[0], b.y - target[1]))[0];
        if (p.slot?.taken === p.id) p.slot.taken = null;
        p.slot = home; home.taken = p.id;
      });
      for (const p of Kit.scene.people()) {
        p.tasks.length = 0; p.task = null; p.walking = false;
        p.x = p.slot.x; p.y = p.slot.y; p.pose = 'idle';
        p.lastActive = performance.now();
      }
    };
    await page.evaluate(setup);
    await page.waitForTimeout(100);
    await page.evaluate(() => {
      window.probeNames = (time = performance.now()) => {
        const ctx = document.querySelector('#stage canvas').getContext('2d');
        const people = Kit.scene.people();
        const methods = Object.fromEntries(['arc', 'arcTo', 'roundRect', 'fillText', 'strokeText'].map(k => [k, ctx[k]]));
        const originals = [], heads = {}, fills = [], strokes = [];
        let current = null, boxes = 0;
        for (const p of people) {
          const sheet = p.char.sheetD, original = sheet.drawFrame;
          originals.push([sheet, original]);
          sheet.drawFrame = function (...args) {
            current = p;
            try { return original.apply(this, args); } finally { current = null; }
          };
        }
        ctx.arc = function (x, y, radius, ...rest) {
          if (current) {
            const m = this.getTransform();
            heads[current.id] = { x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f, radius };
          }
          return methods.arc.call(this, x, y, radius, ...rest);
        };
        for (const method of ['arcTo', 'roundRect']) ctx[method] = function (...args) { boxes++; return methods[method].apply(this, args); };
        for (const [method, output] of [['fillText', fills], ['strokeText', strokes]]) ctx[method] = function (value, x, y, ...rest) {
          const m = this.getTransform();
          const measured = this.measureText(value);
          output.push({ value, x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f, align: this.textAlign, style: String(this.strokeStyle), glow: this.shadowBlur, font: this.font, width: measured.width, left: m.a * (x - measured.actualBoundingBoxLeft) + m.c * y + m.e, right: m.a * (x + measured.actualBoundingBoxRight) + m.c * y + m.e, top: m.b * x + m.d * (y - measured.actualBoundingBoxAscent) + m.f, bottom: m.b * x + m.d * (y + measured.actualBoundingBoxDescent) + m.f });
          return methods[method].call(this, value, x, y, ...rest);
        };
        try { Kit.scene.frame(time, 33); }
        finally {
          for (const [sheet, original] of originals) sheet.drawFrame = original;
          Object.assign(ctx, methods);
        }
        const labels = people.flatMap(p => {
          const text = fills.find(t => t.align === 'center' && (t.value === p.name || (t.value.endsWith('…') && p.name.startsWith(t.value.slice(0, -1).trimEnd()))));
          if (!text) return [];
          return [{ id: p.id, rank: p.rank, name: p.name, rendered: text.value, x: text.x, headX: heads[p.id]?.x, delta: heads[p.id] ? text.x - heads[p.id].x : null }];
        });
        return { labels, heads, fills, strokes, boxes };
      };
    });
    const seated = await page.evaluate(() => probeNames());
    assert.ok(seated.labels.filter(p => p.rank === 0).length >= 4, JSON.stringify(seated));
    assert.ok(seated.labels.every(p => Math.abs(p.delta) < 0.01), JSON.stringify(seated));
    assert.ok(seated.labels.some(p => p.rank === 0 && p.rendered.endsWith('…')), JSON.stringify(seated));
    const medals = seated.fills.filter(t => ['🥇', '🥈', '🥉'].includes(t.value));
    assert.equal(medals.length, 3);
    assert.ok(medals.every(t => t.font.startsWith('40px ')), JSON.stringify(medals));
    assert.ok(seated.labels.some(p => p.name === 'HẾT DUYÊN' && p.rendered === p.name), JSON.stringify(seated.labels));
    const topText = seated.fills.filter(t => seated.labels.some(p => p.rank > 0 && p.rendered === t.value));
    for (const label of seated.labels.filter(p => p.rank > 0)) {
      const text = topText.find(t => t.value === label.rendered);
      const medal = medals.find(t => t.value === ['', '🥇', '🥈', '🥉'][label.rank]);
      assert.ok(Math.abs(text.left - medal.right - 2) < 0.01, JSON.stringify({ medal, text }));
      assert.ok(Math.abs((text.top + text.bottom) / 2 - (medal.top + medal.bottom) / 2) < 0.01, JSON.stringify({ medal, text }));
    }
    for (const medal of medals) for (const text of topText) {
      assert.ok(medal.right <= text.left || medal.left >= text.right || medal.bottom <= text.top || medal.top >= text.bottom, JSON.stringify({ medal, text }));
    }
    const noAvatar = await page.evaluate(() => {
      const p = Kit.scene.person('name-viewer-3'), before = probeNames();
      const avatar = p.avatar; p.avatar = null;
      const after = probeNames(); p.avatar = avatar; probeNames();
      return { expected: before.heads[p.id].x, nameX: after.labels.find(l => l.id === p.id)?.x };
    });
    assert.ok(Math.abs(noAvatar.expected - noAvatar.nameX) < 0.01, JSON.stringify(noAvatar));
    await page.screenshot({ path: path.join(__dirname, 'viewer-names-centered.png'), clip: { x: 60, y: 735, width: 960, height: 815 } });
    await page.screenshot({ path: path.join(__dirname, 'top-medals-large.png'), clip: { x: 240, y: 675, width: 600, height: 270 } });
    const topOnly = await page.evaluate(() => {
      for (const p of Kit.scene.people()) if (!p.rank) { p.lastActive = performance.now() - 60000; p.joinedAt = performance.now() - 60000; }
      const now = performance.now();
      return { first: probeNames(now), second: probeNames(now + 400) };
    });
    assert.equal(topOnly.first.boxes, 0, JSON.stringify(topOnly));
    assert.equal(topOnly.first.labels.length, 3);
    assert.ok(topOnly.first.strokes.length >= 3 && topOnly.first.strokes.some(t => t.glow > 0), JSON.stringify(topOnly));
    assert.ok(topOnly.first.strokes.some((t, i) => Math.abs(t.glow - topOnly.second.strokes[i]?.glow) > 0.1), 'Top outlines must animate over time');
    const transitions = await page.evaluate(() => {
      const p = Kit.scene.person('name-viewer-3');
      p.lastActive = performance.now();
      const before = probeNames();
      Kit.scene.P.walkTo(p, 'offer');
      for (let i = 0; i < 8; i++) Kit.scene.frame(performance.now(), 50);
      const walking = probeNames();
      Kit.scene.focus(p, { zoom: 1.6, duration: 2000 });
      for (let i = 0; i < 6; i++) Kit.scene.frame(performance.now(), 50);
      const zoomed = probeNames();
      Kit.scene.P.say(p, 'Cầu bình an');
      const bubble = probeNames();
      const oldTop = Live.state.top;
      Kit.scene.seatTop([{ id: p.id, name: p.name, coins: 500, rank: 1 }, ...oldTop.slice(0, 2).map((u, i) => ({ ...u, rank: i + 2 }))]);
      const promoted = probeNames();
      Kit.scene.seatTop(oldTop);
      p.lastActive = performance.now();
      const demoted = probeNames();
      return { id: p.id, before, walking, zoomed, bubble, promoted, demoted };
    });
    for (const key of ['before', 'walking', 'zoomed', 'bubble', 'promoted', 'demoted']) {
      const label = transitions[key].labels.find(p => p.id === transitions.id);
      assert.ok(label && Math.abs(label.delta) < 0.01, JSON.stringify({ key, result: transitions[key] }));
    }
    assert.ok(transitions.bubble.fills.some(t => t.value === 'Cầu bình an'));
    assert.equal(transitions.promoted.labels.find(p => p.id === transitions.id).rank, 1);
    assert.equal(transitions.demoted.labels.find(p => p.id === transitions.id).rank, 0);
    const reset = await page.evaluate(() => {
      Kit.scene.reset(); Kit.scene.frame(performance.now(), 33);
      return { people: Kit.scene.people().length, labels: probeNames().labels.length };
    });
    assert.deepEqual(reset, { people: 0, labels: 0 });
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ ordinaryLabels: seated.labels.filter(p => p.rank === 0).length, centeredNames: seated.labels.length, noAvatar, medalBounds: medals.map(({ value, left, right, top, bottom }) => ({ value, left, right, top, bottom })), topNameBounds: topText.map(({ value, left, right, top, bottom }) => ({ value, left, right, top, bottom })), topBackgroundBoxes: topOnly.first.boxes, topGlow: true, centeredDuringMoveZoomChatAndRankChanges: true, reset, pageErrors: errors }, null, 2));
  } finally { await browser.close(); wss.close(); server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; wss.close(); server.close(); });
