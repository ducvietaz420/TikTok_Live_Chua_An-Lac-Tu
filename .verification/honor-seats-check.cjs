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
let snapshotPlayers = [], snapshotTop = [];
const mime = { '.js': 'text/javascript', '.html': 'text/html', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp3': 'audio/mpeg' };
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const file = url.pathname.startsWith('/sdk/') ? path.join(root, 'tiktok-live-kit/public', url.pathname) : path.join(themeDir, url.pathname === '/' ? 'index.html' : url.pathname);
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
const wss = new WebSocketServer({ server });
wss.on('connection', ws => ws.on('message', () => ws.send(JSON.stringify({ type: 'init', theme, players: snapshotPlayers, state: { totals: {}, top: snapshotTop, goals: [] }, guide: { rules: theme.rules }, settings: { cameraFx: true, ambientFx: false, voiceEnabled: false } }))));

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const summary = {};
  try {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    const ready = async () => page.waitForFunction(() => Kit.scene.chars.every(c => c.sheetD?.ready) && Kit.assets.get(Live.theme.scene.background).ready && document.querySelector('.cx-xam') && Kit.scene.seats.length === 19);
    await page.goto(`http://127.0.0.1:${server.address().port}/?mute&quiet`);
    await ready();
    const panels = await page.evaluate(() => {
      Kit.hud.state({ totals: { likes: 122 }, top: [], goals: [{ label: 'Tim gửi Phật', value: 122, target: 1000, progress: 0.122 }] }, 0);
      const box = selector => {
        const r = document.querySelector(selector).getBoundingClientRect();
        return { top: r.top, bottom: r.bottom };
      };
      return {
        plaque: box('.cx-plaque'), stats: box('.cx-stats'),
        guide: box('.cx-guide'), board: box('.cx-board'),
        monkHead: Kit.scene.npc('monk-left').y - Kit.scene.height(Kit.scene.npc('monk-left')),
      };
    });
    assert.equal(panels.plaque.top, 100);
    assert.equal(panels.stats.top, 100);
    assert.ok(panels.guide.top >= panels.plaque.bottom + 29);
    assert.ok(panels.board.top >= panels.stats.bottom + 29);
    assert.ok(panels.guide.bottom + 20 < panels.monkHead);
    summary.panels = panels;
    const geometry = await page.evaluate(() => {
      const s = Kit.scene.seats;
      return { count: s.length, top: s.slice(0, 3).map(p => [p.x, p.y]), rows: [...new Set(s.slice(3).map(p => p.y))], floorTop: Kit.scene.scene.floor.top };
    });
    assert.equal(geometry.count, 19);
    assert.equal(geometry.top[0][0], 540);
    assert.ok(geometry.top[1][0] < 540 && geometry.top[2][0] > 540);
    assert.equal(geometry.rows.length, 2);
    assert.ok(geometry.top.every(p => p[1] < Math.min(...geometry.rows)));
    assert.ok(Math.max(...geometry.rows) < geometry.floorTop - 50);
    await page.screenshot({ path: path.join(__dirname, 'honor-empty.png') });
    summary.geometry = geometry;
    const monks = await page.evaluate(() => ({
      viewers: Kit.scene.people().length,
      figures: ['monk-left', 'monk-right'].map(id => {
        const p = Kit.scene.npc(id);
        return { id, character: p?.char.id, ready: p?.char.sheetD.ready, showName: p?.showName, cushion: p?.cfg.cushion, x: p?.x, y: p?.y };
      }),
    }));
    assert.equal(monks.viewers, 0);
    assert.ok(monks.figures.every(p => p.character === p.id && p.ready && p.showName === false && p.cushion === true && p.y >= 835 && p.y < 938));
    assert.ok(monks.figures[0].x < 540 && monks.figures[1].x > 540);
    await page.screenshot({ path: path.join(__dirname, 'honor-layout-detail.png'), clip: { x: 180, y: 735, width: 720, height: 285 } });
    await page.screenshot({ path: path.join(__dirname, 'raised-panels-and-monks.png'), clip: { x: 0, y: 0, width: 1080, height: 1150 } });
    summary.monks = monks;

    await page.evaluate(() => {
      window.advanceScene = (count = 160) => {
        let time = performance.now();
        for (let i = 0; i < count; i++) Kit.scene.frame(time += 100, 100);
      };
      window.makeUser = i => ({ id: 'honor-viewer-' + i, name: ['Minh Anh', 'Thanh Tâm', 'An Nhiên', 'Bình An'][i % 4] + ' ' + (i + 1), avatar: 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="${['#2b7a78', '#b43e5b', '#5964b8', '#a0671c'][i % 4]}"/><text x="50" y="64" text-anchor="middle" fill="white" font-family="sans-serif" font-weight="bold" font-size="42">${i + 1}</text></svg>`) });
      window.rankUsers = ids => ids.map((id, index) => ({ ...makeUser(id), coins: (ids.length - index) * 100, rank: index + 1 }));
      for (let i = 0; i < 24; i++) Kit.scene.ensure(makeUser(i), { instant: true });
      // The first user is already walking on entry when the initial ranking arrives.
      Kit.scene.P.walkTo(Kit.scene.person(makeUser(0).id), 'bow');
      Kit.scene.P.play(Kit.scene.person(makeUser(0).id), 'bow', 1);
      Kit.scene.P.walkTo(Kit.scene.person(makeUser(0).id), 'home');
      window.currentTop = rankUsers(Array.from({ length: 16 }, (_, i) => i));
      Kit.scene.seatTop(currentTop);
    });
    const inspect = async (settled = false) => {
      const result = await page.evaluate(settled => {
        const people = Kit.scene.people(), seats = Kit.scene.seats;
        const occupied = seats.filter(s => s.taken);
        const ownership = people.map(p => ({ id: p.id, rank: p.rank, slotIndex: seats.indexOf(p.slot), x: p.x, y: p.y, slotX: p.slot?.x, slotY: p.slot?.y }));
        return {
          exact: currentTop.every((u, i) => seats[i].taken === u.id && Kit.scene.person(u.id)?.slot === seats[i] && Kit.scene.person(u.id)?.rank === i + 1),
          settled: !settled || currentTop.every(u => { const p = Kit.scene.person(u.id); return p && !p.task && !p.tasks.length && Math.hypot(p.x - p.slot.x, p.y - p.slot.y) <= 3; }),
          noDuplicateSeats: new Set(occupied.map(s => s.taken)).size === occupied.length,
          noDuplicateSlots: new Set(people.map(p => p.slot)).size === people.length,
          coherentSlots: people.every(p => p.slot?.taken === p.id),
          ranks: ownership,
          seats: occupied.length,
        };
      }, settled);
      assert.ok(result.exact, JSON.stringify(result));
      assert.ok(result.noDuplicateSeats && result.noDuplicateSlots && result.coherentSlots, JSON.stringify(result));
      assert.ok(result.settled, JSON.stringify(result));
      return result;
    };
    await inspect();
    await page.evaluate(() => advanceScene());
    await inspect(true);
    assert.ok(await page.evaluate(() => Kit.scene.people().every(p => p.char.id === 'phattu')));
    await page.waitForFunction(() => Kit.scene.people().every(p => p.avatar?.complete));
    await page.evaluate(() => Kit.hud.state({ totals: { coins: 13600 }, top: currentTop, goals: [] }, Kit.scene.people().length));
    await page.screenshot({ path: path.join(__dirname, 'honor-people.png') });
    summary.initial = '16 ranks assigned to exact seats, including an already walking user; all converge';

    await page.evaluate(() => {
      currentTop = rankUsers([1, 2, 0, ...Array.from({ length: 13 }, (_, i) => i + 3)]);
      Kit.scene.seatTop(currentTop);
    });
    await inspect();
    await page.evaluate(() => advanceScene());
    await inspect(true);
    summary.swap = 'Top 1/2/3 swapped to matching positions';

    const action = await page.evaluate(() => {
      const p = Kit.scene.person(makeUser(7).id);
      window.actionCallbacks = [];
      Kit.scene.P.walkTo(p, 'offer');
      Kit.scene.P.do(p, () => actionCallbacks.push('offer'));
      Kit.scene.P.play(p, 'bow', 2);
      Kit.scene.P.do(p, () => actionCallbacks.push('bow'));
      Kit.scene.P.walkTo(p, 'home');
      const tasks = p.tasks.slice();
      currentTop = rankUsers([7, 1, 2, 0, 3, 4, 5, 6, ...Array.from({ length: 8 }, (_, i) => i + 8)]);
      Kit.scene.seatTop(currentTop);
      const preserved = tasks.every((task, i) => p.tasks[i] === task);
      const taskCount = p.tasks.length;
      for (let i = 0; i < 50; i++) Kit.scene.seatTop(currentTop);
      return { preserved, taskCount, afterRepeatedState: p.tasks.length };
    });
    assert.ok(action.preserved, JSON.stringify(action));
    assert.equal(action.afterRepeatedState, action.taskCount);
    await inspect();
    await page.evaluate(() => advanceScene(230));
    await inspect(true);
    assert.deepEqual(await page.evaluate(() => actionCallbacks), ['offer', 'bow']);
    summary.busyPromotion = action;

    await page.evaluate(() => {
      currentTop = rankUsers([23, ...Array.from({ length: 15 }, (_, i) => i)]);
      Kit.scene.seatTop(currentTop);
    });
    await inspect();
    await page.evaluate(() => advanceScene());
    await inspect(true);
    const demoted = await page.evaluate(() => ({ rank: Kit.scene.person(makeUser(15).id).rank, vip: !!Kit.scene.person(makeUser(15).id).slot.vip }));
    assert.deepEqual(demoted, { rank: 0, vip: false });
    await page.evaluate(() => {
      currentTop = rankUsers(Array.from({ length: 16 }, (_, i) => i));
      Kit.scene.seatTop(currentTop);
      advanceScene();
    });
    await inspect(true);
    summary.replacement = 'Dropped rank returns to regular floor without duplicate ownership; can re-enter ranking';

    // Drop a viewer while the ranking still includes them, then reconcile again.
    const departure = await page.evaluate(() => {
      Kit.scene.leave(makeUser(0).id);
      currentTop = rankUsers(Array.from({ length: 16 }, (_, i) => i + 1));
      Kit.scene.seatTop(currentTop);
      advanceScene();
      return { departedGone: !Kit.scene.person(makeUser(0).id), remaining: Kit.scene.people().length };
    });
    await inspect(true);
    assert.ok(departure.departedGone);
    summary.departure = departure;

    // Confirm gift/fortune cards still fit after the seating/layout change.
    await page.evaluate(() => {
      const user = makeUser(1);
      Kit.hud.draw({ user, draw: Live.theme.draws.xam.items[8] });
      setTimeout(() => Kit.hud.giftCard({ user, action: 'bow', label: 'Lễ bái', total: 5, count: 1 }), 2600);
    });
    await page.waitForFunction(() => document.querySelector('.cx-xam.open') && document.querySelector('.cx-so.show'));
    const cardLayout = await page.evaluate(() => {
      const b = selector => { const r = document.querySelector(selector).getBoundingClientRect(); return { top: r.top, bottom: r.bottom }; };
      return { gift: b('.cx-so'), draw: b('.cx-xam'), advice: b('.cx-xam .loi'), footer: b('.cx-xam .ft') };
    });
    assert.ok(cardLayout.draw.top >= cardLayout.gift.bottom + 20);
    assert.ok(cardLayout.draw.bottom < 1760 && cardLayout.advice.bottom < cardLayout.footer.top);
    summary.cards = cardLayout;

    // Snapshot reload reconstructs seats from current server ranking.
    snapshotPlayers = await page.evaluate(() => currentTop.map(u => ({ ...u, isPlayer: true })));
    snapshotTop = snapshotPlayers;
    await page.reload();
    await ready();
    const restored = await page.evaluate(() => Kit.scene.seats.slice(0, 16).every((seat, i) => seat.taken === Live.state.top[i].id));
    assert.ok(restored);
    summary.reload = 'All seats rebuilt from server snapshot';

    // Reset does not retain any stale seat reservations.
    const reset = await page.evaluate(() => {
      Kit.scene.reset();
      let time = performance.now();
      for (let i = 0; i < 30; i++) Kit.scene.frame(time += 100, 100);
      return { people: Kit.scene.people().length, taken: Kit.scene.seats.filter(s => s.taken).length };
    });
    assert.deepEqual(reset, { people: 0, taken: 0 });
    assert.ok(await page.evaluate(() => ['monk-left', 'monk-right'].every(id => Kit.scene.npc(id)?.char.sheetD.ready)));
    summary.reset = reset;

    const crowds = [];
    for (const requested of [60, 400]) {
      const crowd = await page.evaluate(requested => {
        Kit.scene.reset();
        let time = performance.now();
        for (let i = 0; i < 20; i++) Kit.scene.frame(time += 100, 100);
        for (let i = 0; i < requested; i++) Kit.scene.ensure({ id: 'crowd-' + requested + '-' + i, name: 'Phật tử ' + i }, { instant: true });
        const top = Kit.scene.people().slice(0, 16).map((p, i) => ({ id: p.id, name: p.name, rank: i + 1, coins: 1600 - i * 100 }));
        Kit.scene.seatTop(top);
        for (let i = 0; i < 120; i++) Kit.scene.frame(time += 150, 150);
        const people = Kit.scene.people();
        const allSeated = top.every((u, i) => Kit.scene.seats[i].taken === u.id);
        Kit.scene.focus(people[0], { zoom: 1.6, duration: 5000 });
        for (let i = 0; i < 5; i++) Kit.scene.frame(time += 100, 100);
        return { requested, active: people.length, allSeated, uniqueSlots: new Set(people.map(p => p.slot)).size === people.length, finiteCoordinates: people.every(p => Number.isFinite(p.x) && Number.isFinite(p.y)) };
      }, requested);
      assert.ok(crowd.allSeated && crowd.uniqueSlots && crowd.finiteCoordinates, JSON.stringify(crowd));
      crowds.push(crowd);
    }
    summary.crowds = crowds;
    assert.deepEqual(errors, []);
    summary.pageErrors = errors;
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await browser.close();
    wss.close();
    server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; wss.close(); server.close(); });
