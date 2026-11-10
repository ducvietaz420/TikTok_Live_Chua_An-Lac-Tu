const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const http = require('node:http');
const { chromium } = require('C:/Users/Nemou/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const { WebSocketServer } = require('../tiktok-live-kit/node_modules/ws');
const root = path.resolve(__dirname, '..');
const themeDir = path.join(root, 'tiktok-live-pgd-main/themes/chua');
const theme = JSON.parse(fs.readFileSync(path.join(themeDir, 'theme.json')));
theme.scene = JSON.parse(fs.readFileSync(path.join(themeDir, 'scene.json')));
const emitter = theme.scene.emitters.find(e => e.preset === 'smoke');
const burst = theme.actions.find(a => a.id === 'incense').steps.find(s => s.play).each.find(s => s.preset === 'smoke');
const [x, y] = theme.scene.points.censerMouth;
// Run the real particle updater/drawer with a controlled clock. Measure the
// visible puff radius over repeated gifts. Fully faded particles continue to
// exist briefly; their alpha-zero draw calls do not obscure the scene.
let time = 0, highest = Infinity, faintestEdge = Infinity, samples = 0;
const kit = { W: 1080, H: 1920, assets: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'tiktok-live-kit/public/sdk/fx.js'), 'utf8'), { window: { Kit: kit }, performance: { now: () => time }, Math });
const ctx = {
  save() {}, restore() {}, beginPath() {}, fill() {},
  createRadialGradient() { return { addColorStop() {} }; },
  arc(px, py, radius) {
    if (this.globalAlpha >= 1 / 255) faintestEdge = Math.min(faintestEdge, py - radius);
    if (this.globalAlpha < 0.04) return;
    highest = Math.min(highest, py - radius); samples++;
  },
};
kit.fx.emitter('censer', 'smoke', { ...emitter, x, y });
for (let i = 0; i < 400; i++) {
  time += 50;
  if (i % 20 === 0) kit.fx.emit('smoke', { ...burst, x, y });
  kit.fx.update(50, time);
  kit.fx.draw(ctx, 'front', time);
}
const top1Feet = theme.scene.seats[0][1];
assert.ok(samples > 100, 'Smoke must remain visible');
// The thin tip reaches just above the cushion, while even the faintest smoke
// stays below the face and upper body of the seated top viewer.
assert.ok(highest > top1Feet - 40 && highest < top1Feet - 5, JSON.stringify({ highest, top1Feet }));
assert.ok(faintestEdge > top1Feet - 40, JSON.stringify({ faintestEdge, top1Feet }));

const players = [0, 1, 2].map(i => ({
  id: 'smoke-top-' + i, name: ['HẾT DUYÊN', 'Thanh Tâm', 'An Nhiên'][i],
  avatar: 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="${['#a53b4b', '#438980', '#5d65a5'][i]}"/><text x="50" y="68" text-anchor="middle" fill="white" font-family="sans-serif" font-size="52">${i + 1}</text></svg>`),
  coins: 300 - i * 100, rank: i + 1, isPlayer: true,
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
wss.on('connection', ws => ws.on('message', () => ws.send(JSON.stringify({ type: 'init', theme, players, state: { totals: {}, top: players, goals: [] }, guide: { rules: theme.rules }, settings: { cameraFx: false, ambientFx: true, voiceEnabled: false } }))));
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/?mute&quiet`);
    await page.waitForFunction(() => Kit.scene.chars.every(c => c.sheetD.ready) && Kit.assets.get(Live.theme.scene.background).ready);
    await page.evaluate(() => {
      for (const p of Kit.scene.people()) {
        p.tasks.length = 0; p.task = null; p.x = p.slot.x; p.y = p.slot.y; p.pose = 'idle';
      }
    });
    await page.waitForFunction(() => Kit.scene.people().every(p => p.avatar?.complete));
    const labels = await page.evaluate(() => {
      const p = Kit.scene.people().find(p => p.rank === 1);
      function probe() {
        const ctx = document.querySelector('#stage canvas').getContext('2d');
        const sheet = p.char.sheetD, drawFrame = sheet.drawFrame;
        const fillText = ctx.fillText, arc = ctx.arc, arcTo = ctx.arcTo, roundRect = ctx.roundRect;
        let inAvatar = false, actualHead = null, boxes = 0;
        const text = [];
        sheet.drawFrame = function (...args) {
          inAvatar = true;
          try { return drawFrame.apply(this, args); } finally { inAvatar = false; }
        };
        ctx.arc = function (x, y, ...rest) {
          if (inAvatar) {
            const m = this.getTransform();
            actualHead = { x: m.a * x + m.c * y + m.e, zoom: m.a };
          }
          return arc.call(this, x, y, ...rest);
        };
        ctx.arcTo = function (...args) { boxes++; return arcTo.apply(this, args); };
        ctx.roundRect = function (...args) { boxes++; return roundRect.apply(this, args); };
        ctx.fillText = function (value, x, y, ...rest) {
          const m = this.getTransform();
          text.push({ value, align: this.textAlign, x: m.a * x + m.c * y + m.e });
          return fillText.call(this, value, x, y, ...rest);
        };
        try { Kit.scene.frame(performance.now(), 33); }
        finally { sheet.drawFrame = drawFrame; ctx.fillText = fillText; ctx.arc = arc; ctx.arcTo = arcTo; ctx.roundRect = roundRect; }
        const name = text.find(t => t.align === 'center' && (t.value === p.name || (t.value.endsWith('…') && p.name.startsWith(t.value.slice(0, -1).trimEnd()))));
        return { centered: !!name && Math.abs(name.x - actualHead.x) < 0.01, error: name ? name.x - actualHead.x : null, boxes, head: actualHead, text: text.map(t => t.value) };
      }
      const seated = probe();
      Kit.scene.configure({ cameraFx: true, ambientFx: true });
      Kit.scene.focus(p, { zoom: 1.6, duration: 5000 });
      for (let i = 0; i < 6; i++) Kit.scene.frame(performance.now(), 50);
      const zoomed = probe();
      Kit.scene.P.walkTo(p, 'offer');
      for (let i = 0; i < 8; i++) Kit.scene.frame(performance.now(), 50);
      const walking = probe();
      Kit.scene.P.say(p, 'Cầu bình an');
      const bubble = probe();
      p.rank = 0; p.bubble = null; p.lastActive = performance.now();
      const regular = probe();
      return { seated, zoomed, walking, bubble, regularFallback: regular.centered && regular.boxes > 0 };
    });
    for (const key of ['seated', 'zoomed', 'walking', 'bubble']) assert.ok(labels[key].centered, JSON.stringify(labels));
    assert.equal(labels.seated.boxes, 0, JSON.stringify(labels));
    assert.ok(['HẾT DUYÊN', 'Thanh Tâm', 'An Nhiên'].every(name => labels.seated.text.includes(name)), JSON.stringify(labels));
    assert.ok(labels.zoomed.head.zoom > 1);
    assert.ok(labels.bubble.text.includes('Cầu bình an'));
    assert.ok(labels.regularFallback);
    // Return to a clean initial scene for the final preview after camera probes.
    await page.reload();
    await page.waitForFunction(() => Kit.scene.chars.every(c => c.sheetD.ready) && Kit.assets.get(Live.theme.scene.background).ready && Kit.scene.people().every(p => p.avatar?.complete));
    await page.evaluate(() => {
      for (const p of Kit.scene.people()) {
        p.tasks.length = 0; p.task = null; p.x = p.slot.x; p.y = p.slot.y; p.pose = 'idle';
      }
    });
    await page.waitForTimeout(2400);
    await page.evaluate(() => {
      const step = Live.theme.actions.find(a => a.id === 'incense').steps.find(s => s.play).each.find(s => s.preset === 'smoke');
      const at = Kit.scene.point(step.at);
      Kit.fx.emit(step.preset, { ...step, x: at.x, y: at.y });
    });
    await page.waitForTimeout(1300);
    await page.screenshot({ path: path.join(__dirname, 'smoke-cushion-height.png'), clip: { x: 240, y: 750, width: 600, height: 280 } });
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ visibleSmokeTop: highest, faintestEdge, top1Feet, aboveCushion: top1Feet - highest, smokeSamples: samples, ambientAndGiftSmokeChecked: true, labels, pageErrors: errors }, null, 2));
  } finally { await browser.close(); wss.close(); server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; wss.close(); server.close(); });
