const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/Nemou/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(__dirname, '..');
const themeDir = path.join(root, 'tiktok-live-pgd-main/themes/chua');
const theme = JSON.parse(fs.readFileSync(path.join(themeDir, 'theme.json')));
theme.scene = JSON.parse(fs.readFileSync(path.join(themeDir, 'scene.json')));
const mime = { '.js': 'text/javascript', '.html': 'text/html', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp3': 'audio/mpeg' };
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('https://chua.test/**', async route => {
      const url = new URL(route.request().url());
      const file = url.pathname.startsWith('/sdk/') ? path.join(root, 'tiktok-live-kit/public', url.pathname) : path.join(themeDir, url.pathname === '/' ? 'index.html' : url.pathname);
      if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { await route.fulfill({ status: 404, body: '' }); return; }
      await route.fulfill({ status: 200, contentType: mime[path.extname(file)] || 'application/octet-stream', path: file });
    });
    await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }));
    await page.routeWebSocket('**/ws', ws => ws.onMessage(() => ws.send(JSON.stringify({
      type: 'init', theme, players: [], state: { totals: {}, top: [], goals: [] }, guide: { rules: theme.rules },
      settings: { cameraFx: true, ambientFx: false, voiceEnabled: false },
    }))));
    await page.addInitScript(() => {
      window.__time = 1000;
      performance.now = () => window.__time;
      window.requestAnimationFrame = () => 0;
    });
    await page.goto('https://chua.test/?mute&quiet');
    await page.waitForFunction(() => Kit.scene.chars.every(c => c.sheetD.ready) && Kit.assets.get(Live.theme.scene.background).ready && document.querySelector('.cx-board'), null, { polling: 100, timeout: 8000 }).catch(async error => {
      console.error(await page.evaluate(() => ({ connected: Live.connected, theme: Live.theme?.name, chars: Kit.scene.chars.map(c => ({ id: c.id, ready: c.sheetD?.ready })), board: Boolean(document.querySelector('.cx-board')) })));
      console.error(errors);
      throw error;
    });
    await page.evaluate(() => {
      window.requests = [];
      const originalFocus = Kit.scene.focus;
      Kit.scene.focus = function (target, options) {
        requests.push({ id: target?.id, x: target?.x, y: target?.y, options: { ...options }, at: __time });
        return originalFocus.call(this, target, options);
      };
      const ctx = document.querySelector('#stage canvas').getContext('2d');
      const setTransform = ctx.setTransform;
      ctx.setTransform = function (...args) {
        if (args.length === 6) window.frameTransforms.push(args);
        return setTransform.apply(this, args);
      };
      window.stepFrame = (dt = 50) => {
        window.frameTransforms = [];
        window.__time += dt;
        Kit.scene.frame(__time, dt);
        const m = frameTransforms[1];
        return { zoom: m[0], x: (540 - m[4]) / m[0], y: (960 - m[5]) / m[0] };
      };
      window.advance = ms => {
        let camera;
        for (let elapsed = 0; elapsed < ms; elapsed += 50) camera = stepFrame();
        return camera;
      };
      window.donor = { id: 'gift-donor', name: 'Thanh Tâm', isPlayer: true, coins: 100 };
      Kit.scene.ensure(donor, { instant: true });
      window.prepare = () => {
        advance(20000);
        const p = Kit.scene.person(donor.id);
        p.tasks.length = 0; p.task = null; p.walking = false;
        p.x = p.slot.x; p.y = p.slot.y; p.pose = 'idle';
        p.boost = 1; p.boostUntil = 0;
        requests.length = 0;
        return p;
      };
      window.emitGift = (action, extra = {}) => {
        const ev = { kind: 'gift', user: donor, action, label: action, gift: { name: action, coins: 1 }, total: 1, count: 1, big: false, ...extra };
        Live.emit('gift', ev);
        return ev;
      };
      window.untilFocus = () => {
        for (let i = 0; i < 700 && !requests.length; i++) stepFrame();
        return requests.slice();
      };
    });

    const normal = [];
    for (const action of ['incense', 'bow', 'lotus', 'unmapped-offering', 'pray']) {
      const result = await page.evaluate(action => {
        const p = prepare();
        emitGift(action);
        const before = requests.length;
        untilFocus();
        const first = requests[0];
        const zoomed = advance(900);
        advance(16000);
        return { action, before, first, count: requests.length, zoomed, end: stepFrame() };
      }, action);
      assert.equal(result.before, 0, JSON.stringify(result));
      assert.equal(result.count, 1, JSON.stringify(result));
      assert.equal(result.first.id, 'gift-donor');
      assert.equal(result.first.options.zoom, 1.25);
      assert.equal(result.first.options.duration, 2200);
      assert.ok(result.zoomed.zoom > 1.2 && result.zoomed.zoom < 1.251, JSON.stringify(result));
      assert.ok(Math.abs(result.end.zoom - 1) < 0.001, JSON.stringify(result));
      if (['incense', 'bow'].includes(action)) {
        assert.ok(Math.abs(result.first.x - 540) < 0.01, JSON.stringify(result));
        assert.ok(Math.abs(result.first.y - (action === 'incense' ? 1062 : 1120)) < 0.01, JSON.stringify(result));
      }
      normal.push(result);
    }

    const large = [];
    for (const [action, extra] of [['grand', { big: false }], ['grand', { big: true, total: 100 }], ['incense', { big: true, total: 100, count: 100 }]]) {
      const result = await page.evaluate(({ action, extra }) => {
        prepare();
        const ev = emitGift(action, extra);
        untilFocus();
        const first = requests[0];
        Kit.run([{ js: 'giftFocus' }], Kit.scene.person(donor.id), ev);
        const zoomed = advance(1200);
        advance(20000);
        return { action, extra, first, count: requests.length, zoomed, end: stepFrame() };
      }, { action, extra });
      assert.equal(result.count, 1, JSON.stringify(result));
      assert.equal(result.first.options.zoom, 1.6);
      assert.equal(result.first.options.duration, 3500);
      assert.ok(result.zoomed.zoom > 1.55, JSON.stringify(result));
      assert.ok(Math.abs(result.end.zoom - 1) < 0.001, JSON.stringify(result));
      large.push(result);
    }

    const commands = await page.evaluate(() => {
      const results = [];
      for (const action of ['incense', 'bow', 'lotus', 'grand', 'pray']) {
        prepare();
        Live.emit('command', { kind: 'command', user: donor, action });
        advance(20000);
        results.push({ action, count: requests.length });
      }
      return results;
    });
    assert.ok(commands.every(r => r.count === 0), JSON.stringify(commands));

    const disabled = await page.evaluate(() => {
      const results = [];
      Live.settings = { ...Live.settings, cameraFx: false };
      Live.emit('settings', Live.settings);
      for (const action of ['incense', 'grand', 'unmapped-offering']) {
        prepare(); emitGift(action, { big: action === 'grand' }); advance(20000);
        results.push({ action, count: requests.length, camera: stepFrame() });
      }
      Live.settings = { ...Live.settings, cameraFx: true };
      Live.emit('settings', Live.settings);
      return results;
    });
    assert.ok(disabled.every(r => r.count === 0 && Math.abs(r.camera.zoom - 1) < 0.001), JSON.stringify(disabled));

    const moving = await page.evaluate(() => {
      const p = prepare();
      const savedSlot = p.slot;
      p.slot = { x: 450, y: 1230 }; p.x = 450; p.y = 1230;
      Kit.scene.focus(p, { zoom: 1.25, duration: 3500 });
      const left = advance(1100);
      p.slot = { x: 630, y: 1230 }; p.x = 630;
      const right = advance(1100);
      p.slot = savedSlot;
      const wide = advance(5000);
      return { left, right, wide };
    });
    assert.ok(moving.right.x - moving.left.x > 150, JSON.stringify(moving));
    assert.ok(Math.abs(moving.right.zoom - 1.25) < 0.001, JSON.stringify(moving));
    assert.ok(Math.abs(moving.wide.zoom - 1) < 0.001, JSON.stringify(moving));

    // Repeated donations are bounded by native camera queue (four waiting shots).
    const burst = await page.evaluate(() => {
      const p = prepare();
      for (let i = 0; i < 40; i++) emitGift('grand', { total: 100, big: true });
      // Running queued ceremony steps generates all 40 requests in under 10 seconds.
      advance(26000);
      const count = requests.length;
      p.tasks.length = 0; p.task = null;
      const afterDrain = advance(21000);
      return { count, afterDrain };
    });
    assert.equal(burst.count, 40, JSON.stringify(burst));
    assert.ok(Math.abs(burst.afterDrain.zoom - 1) < 0.001, JSON.stringify(burst));
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ normal, large, commands, disabled, moving, burst, pageErrors: errors }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
