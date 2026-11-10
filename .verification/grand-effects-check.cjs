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
    await page.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.hostname !== 'chua.test') return route.abort();
      if (url.pathname === '/test-avatar.png') return route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#2b7a78"/><circle cx="50" cy="36" r="18" fill="#ffe5b5"/><path d="M15 100 Q15 60 50 60 Q85 60 85 100" fill="#d5dbd4"/></svg>' });
      if (url.pathname.startsWith('/api/')) return route.fulfill({ contentType: 'application/json', body: '{"files":[]}' });
      const file = url.pathname.startsWith('/sdk/') ? path.join(root, 'tiktok-live-kit/public', url.pathname) : path.join(themeDir, url.pathname === '/' ? 'index.html' : url.pathname);
      if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return route.fulfill({ status: 404, body: '' });
      return route.fulfill({ contentType: mime[path.extname(file)] || 'application/octet-stream', body: fs.readFileSync(file) });
    });
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
    await page.waitForFunction(() => Kit.scene.chars.every(c => c.sheetD.ready) && Kit.assets.get(Live.theme.scene.background).ready && Kit.assets.get('assets/cdo/fx_lotus.png').ready && document.querySelector('.cx-tribute'), null, { polling: 100, timeout: 10000 });
    await page.evaluate(() => {
      window.celebrations = 0;
      Kit.on('grandOffering', () => celebrations++);
      const ctx = document.querySelector('#stage canvas').getContext('2d');
      const drawImage = ctx.drawImage;
      ctx.drawImage = function (art, ...args) {
        if (art instanceof HTMLCanvasElement) {
          const m = this.getTransform();
          window.lotusDraws.push({ layer: window.fxLayer, artWidth: art.width, artHeight: art.height, zoom: Math.hypot(m.a, m.b), screenX: m.e, screenY: m.f, args });
        }
        return drawImage.call(this, art, ...args);
      };
      const fxDraw = Kit.fx.draw;
      Kit.fx.draw = function (context, layer, time) {
        const before = window.fxLayer;
        window.fxLayer = layer;
        try { return fxDraw.call(this, context, layer, time); }
        finally { window.fxLayer = before; }
      };
      window.stepFrame = (dt = 50) => {
        window.lotusDraws = [];
        window.__time += dt;
        Kit.scene.frame(__time, dt);
        Kit.events.emit('frame', __time, dt);
        return lotusDraws;
      };
      window.advance = ms => { for (let elapsed = 0; elapsed < ms; elapsed += 50) stepFrame(); return lotusDraws; };
      window.donor = { id: 'grand-donor', name: 'Thanh Tâm', avatar: 'https://chua.test/test-avatar.png', isPlayer: true };
      window.prepare = (user = donor) => {
        Live.emit('reset', {}); advance(25000);
        window.celebrations = 0;
        const p = Kit.scene.ensure(user, { instant: true });
        p.tasks.length = 0; p.task = null; p.walking = false; p.x = p.slot.x; p.y = p.slot.y;
        return p;
      };
      window.emitGift = (action, extra = {}, user = donor) => {
        const ev = { kind: 'gift', user, action, label: action, gift: { name: action, coins: 1 }, total: 1, count: 1, big: false, ...extra };
        Live.emit('gift', ev); return ev;
      };
      window.cardState = () => {
        const card = document.querySelector('.cx-tribute');
        const name = card.querySelector('.cx-tribute-name');
        const rect = card.getBoundingClientRect(), nameRect = name.getBoundingClientRect();
        return {
          show: card.classList.contains('show'), hidden: card.getAttribute('aria-hidden'),
          active: card.parentElement.classList.contains('grand-tribute-active'),
          message: card.querySelector('.cx-tribute-message').textContent, name: name.textContent,
          initials: card.querySelector('.cx-tribute-initials').textContent,
          avatarLoaded: card.querySelector('.cx-tribute-avatar').classList.contains('loaded'),
          images: card.querySelectorAll('img').length,
          injected: card.querySelectorAll('script,svg,iframe,img[onerror]').length,
          rect: { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom },
          nameRect: { left: nameRect.left, right: nameRect.right, width: nameRect.width },
          overflow: getComputedStyle(name).textOverflow,
        };
      };
    });

    const regular = await page.evaluate(() => {
      prepare(); emitGift('lotus'); advance(1200);
      return { celebrations, card: cardState(), lotuses: lotusDraws.length };
    });
    assert.equal(regular.celebrations, 0);
    assert.equal(regular.lotuses, 0);
    assert.equal(regular.card.show, false);

    await page.evaluate(() => {
      prepare();
      const names = ['An Nhiên', 'Bình An', 'Minh Anh', 'Ngọc Mai', 'Lan Hương', 'Khánh Linh', 'Tuệ Tâm', 'Thanh Hà'];
      const people = names.map((name, i) => ({ id: 'context-' + i, name, avatar: 'https://chua.test/test-avatar.png', isPlayer: true, coins: (8 - i) * 100 }));
      people.forEach(user => Kit.scene.ensure(user, { instant: true }));
      Kit.scene.seatTop(people.slice(0, 3));
      for (const p of Kit.scene.people()) { p.tasks.length = 0; p.task = null; p.walking = false; p.x = p.slot.x; p.y = p.slot.y; }
      Kit.hud.state({ totals: { likes: 1200, coins: 3700 }, top: people.slice(0, 3), goals: [] }, Kit.scene.people().length);
      window.sameEvent = emitGift('grand', { big: true, total: 100 }); advance(1200);
    });
    await page.waitForFunction(() => document.querySelector('.cx-tribute-avatar.loaded'), null, { polling: 100, timeout: 5000 });
    const grand = await page.evaluate(() => ({ celebrations, card: cardState(), lotuses: lotusDraws.slice(), person: { x: Kit.scene.person(donor.id).x, y: Kit.scene.person(donor.id).y, height: Kit.scene.height(Kit.scene.person(donor.id)) } }));
    assert.equal(grand.celebrations, 1);
    assert.equal(grand.card.name, 'Thanh Tâm');
    assert.equal(grand.card.message, 'Trân trọng tấm lòng của');
    assert.equal(grand.card.images, 1);
    assert.equal(grand.card.avatarLoaded, true);
    assert.equal(grand.lotuses.length, 1, JSON.stringify(grand));
    assert.equal(grand.lotuses[0].layer, 'back');
    assert.ok(grand.lotuses[0].zoom > 1.55, JSON.stringify(grand));
    await page.waitForTimeout(500);
    await page.evaluate(() => stepFrame(0));
    const settled = await page.evaluate(() => ({ card: cardState(), receiptVisibility: getComputedStyle(document.querySelector('.cx-so')).visibility, lotuses: lotusDraws.slice() }));
    assert.ok(settled.card.rect.top >= 1179.9 && settled.card.rect.top < 1181, JSON.stringify(settled));
    assert.equal(settled.receiptVisibility, 'hidden');
    const lotusBottom = settled.lotuses[0].screenY + settled.lotuses[0].zoom * (settled.lotuses[0].args[1] + settled.lotuses[0].args[3]);
    assert.ok(lotusBottom < settled.card.rect.top, JSON.stringify({ lotusBottom, settled }));
    await page.screenshot({ path: path.join(__dirname, 'grand-effects-overlay.png') });
    await page.screenshot({ path: path.join(__dirname, 'grand-effects-card.png'), clip: { x: 106, y: 1160, width: 868, height: 180 } });
    await page.screenshot({ path: path.join(__dirname, 'grand-effects-lotus.png'), clip: { x: 240, y: 830, width: 600, height: 350 } });

    const duplicate = await page.evaluate(() => {
      const p = Kit.scene.person(donor.id);
      p.tasks.length = 0; p.task = null;
      Kit.run([{ js: 'giftFocus' }, { js: 'giftFocus' }], p, sameEvent); advance(250);
      return { celebrations, lotuses: lotusDraws.length };
    });
    assert.equal(duplicate.celebrations, 1);
    assert.equal(duplicate.lotuses, 1);

    const moving = await page.evaluate(() => {
      const p = Kit.scene.person(donor.id);
      p.tasks.length = 0; p.task = null;
      p.slot = { x: 630, y: 1210 }; p.x = 630; p.y = 1210;
      advance(300);
      const art = lotusDraws[0];
      const ctx = document.querySelector('#stage canvas').getContext('2d');
      const setTransform = ctx.setTransform;
      const matrices = [];
      ctx.setTransform = function (...args) { if (args.length === 6) matrices.push(args); return setTransform.apply(this, args); };
      stepFrame();
      ctx.setTransform = setTransform;
      const m = matrices[1], draw = lotusDraws[0];
      const expected = { x: m[0] * p.x + m[4], y: m[3] * (p.y + Kit.scene.height(p) * .09) + m[5] };
      return { art, draw, expected };
    });
    assert.ok(Math.abs(moving.draw.screenX - moving.expected.x) < .01, JSON.stringify(moving));
    assert.ok(Math.abs(moving.draw.screenY - moving.expected.y) < .01, JSON.stringify(moving));

    const fallback = [];
    for (const [kind, avatar] of [['missing', ''], ['broken', 'https://chua.test/missing-avatar.png'], ['unsafe', 'javascript:alert(1)']]) {
      await page.evaluate(({ avatar }) => {
        const user = { id: 'fallback-donor', name: 'Bình An', avatar, isPlayer: true };
        prepare(user); emitGift('grand', {}, user); advance(1200);
      }, { avatar });
      await page.waitForTimeout(100);
      const result = await page.evaluate(kind => ({ kind, card: cardState(), lotuses: lotusDraws.length }), kind);
      assert.equal(result.card.initials, 'BA', JSON.stringify(result));
      assert.equal(result.card.avatarLoaded, false);
      assert.equal(result.card.images, 0, JSON.stringify(result));
      assert.equal(result.lotuses, 1);
      fallback.push(result);
    }

    const malicious = await page.evaluate(() => {
      const user = { id: 'long-donor', name: '<img src=x onerror=alert(1)> Nguyễn Văn Bình An '.repeat(12), isPlayer: true };
      prepare(user); emitGift('grand', {}, user); advance(1200);
      return { expectedName: user.name.trim(), card: cardState() };
    });
    assert.equal(malicious.card.name, malicious.expectedName);
    assert.equal(malicious.card.injected, 0);
    assert.equal(malicious.card.overflow, 'ellipsis');
    assert.ok(malicious.card.nameRect.right < malicious.card.rect.right, JSON.stringify(malicious));

    const disabledCombo = await page.evaluate(() => {
      Live.settings = { ...Live.settings, cameraFx: false }; Live.emit('settings', Live.settings);
      prepare(); emitGift('incense', { big: true, count: 100, total: 100 });
      for (let i = 0; i < 700 && !celebrations; i++) stepFrame();
      advance(1200);
      const result = { celebrations, card: cardState(), lotuses: lotusDraws.slice() };
      Live.settings = { ...Live.settings, cameraFx: true }; Live.emit('settings', Live.settings);
      return result;
    });
    assert.equal(disabledCombo.celebrations, 1);
    assert.equal(disabledCombo.card.show, true);
    assert.equal(disabledCombo.lotuses.length, 1);
    assert.ok(Math.abs(disabledCombo.lotuses[0].zoom - 1) < .001, JSON.stringify(disabledCombo));

    const expiration = await page.evaluate(() => {
      prepare(); emitGift('grand');
      for (let i = 0; i < 20 && !celebrations; i++) stepFrame();
      advance(4000);
      const bothActive = { card: cardState(), lotuses: lotusDraws.length };
      advance(800);
      const lotusExpired = lotusDraws.length;
      advance(200);
      return { bothActive, lotusExpired, cardExpired: cardState() };
    });
    assert.equal(expiration.bothActive.card.show, true);
    assert.equal(expiration.bothActive.card.active, true);
    assert.equal(expiration.bothActive.lotuses, 1);
    assert.equal(expiration.lotusExpired, 0);
    assert.equal(expiration.cardExpired.show, false);
    assert.equal(expiration.cardExpired.active, false);

    const burst = await page.evaluate(() => {
      prepare();
      for (let i = 0; i < 40; i++) {
        const user = { id: 'burst-' + i, name: 'Thí chủ ' + i, isPlayer: true };
        const p = Kit.scene.ensure(user, { instant: true });
        p.tasks.length = 0; p.task = null;
        Kit.run([{ js: 'giftFocus' }], p, { kind: 'gift', action: 'grand', user, big: true });
      }
      stepFrame(); advance(1200);
      const simultaneous = { celebrations, lotusCount: lotusDraws.length, name: cardState().name };
      advance(31000);
      const drained = { show: cardState().show, active: cardState().active, lotusCount: lotusDraws.length };
      const p = Kit.scene.person('burst-39');
      p.tasks.length = 0; p.task = null;
      Kit.run([{ js: 'giftFocus' }], p, { kind: 'gift', action: 'grand', user: { id: p.id, name: p.name }, big: true });
      stepFrame(); advance(600);
      Live.emit('reset', {}); stepFrame();
      const reset = { card: cardState(), lotusCount: lotusDraws.length };
      advance(25000);
      return { simultaneous, drained, reset, noStaleCard: !cardState().show };
    });
    assert.equal(burst.simultaneous.celebrations, 40);
    assert.equal(burst.simultaneous.lotusCount, 6, JSON.stringify(burst));
    assert.equal(burst.drained.show, false);
    assert.equal(burst.drained.active, false);
    assert.equal(burst.drained.lotusCount, 0);
    assert.equal(burst.reset.card.show, false);
    assert.equal(burst.reset.card.name, '');
    assert.equal(burst.reset.lotusCount, 0);
    assert.equal(burst.noStaleCard, true);
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ regular, grand, settled, lotusBottom, duplicate, moving, fallback, malicious, disabledCombo, expiration, burst, pageErrors: errors }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
