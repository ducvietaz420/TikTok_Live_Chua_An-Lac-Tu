const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');

const kitRoot = path.resolve(__dirname, '../../../../tiktok-live-kit');
const sceneConfig = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../scene.json'), 'utf8'));

// Run the actual SDK with a simulated clock and drawing surface. These checks
// exercise allocation and task completion without changing the shared engine.
async function fixture() {
  let clock = 10000;
  const noop = () => {};
  const drawing = new Proxy({}, {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (prop === 'measureText') return (text) => ({ width: String(text).length * 12 });
      if (String(prop).startsWith('create')) return () => ({ addColorStop: noop });
      return noop;
    },
  });
  const Kit = {
    assets: { get: () => null },
    fx: { stop: noop, emitter: noop, update: noop, draw: noop, pillar: noop, shakeOffset: () => ({ x: 0, y: 0 }) },
    events: { emit: noop },
  };
  const context = vm.createContext({
    window: { Kit },
    Live: { img: () => null },
    performance: { now: () => clock },
    URLSearchParams,
    location: { search: '' },
    console,
  });
  for (const name of ['geometry.js', 'scene.js']) {
    vm.runInContext(fs.readFileSync(path.join(kitRoot, 'public/sdk', name), 'utf8'), context, { filename: name });
  }
  Kit.scene.init({ canvas: { getContext: () => drawing }, theme: { scene: sceneConfig }, settings: { ambientFx: false } });
  const { createSession } = await import(pathToFileURL(path.join(kitRoot, 'src/core/session.js')).href);
  const session = createSession();
  const user = (id, coins = 0) => {
    const { player } = session.touch({ id, name: id });
    if (coins) session.addCoins(player, coins);
    Kit.scene.ensure(player, { instant: true });
    return player;
  };
  const tick = (duration = 16000) => {
    for (let elapsed = 0; elapsed < duration; elapsed += 50) {
      clock += 50;
      Kit.scene.frame(clock, 50);
    }
  };
  const apply = () => Kit.scene.seatTop(session.top(16));
  const fillSeats = () => {
    for (let n = 1; n <= 16; n++) user(`donor-${n}`, n * 10);
    apply();
    tick();
    assert.equal(Kit.scene.seats.filter((seat) => seat.taken).length, 16);
  };
  return { Kit, session, user, tick, apply, fillSeats };
}

test('all sixteen donor seats fill and a higher cumulative total replaces the lowest donor', async () => {
  const f = await fixture();
  f.fillSeats();
  const lowestSeat = f.Kit.scene.person('donor-1').slot;
  const newcomer = f.user('newcomer', 6);
  f.apply();
  assert.equal(Boolean(f.Kit.scene.person('newcomer').slot.vip), false);
  f.session.addCoins(newcomer, 5);
  f.apply();
  assert.equal(lowestSeat.taken, 'newcomer');
  assert.equal(Boolean(f.Kit.scene.person('donor-1').slot.vip), false);
  assert.equal(f.Kit.scene.people().length, 17);
  f.tick();
  const promoted = f.Kit.scene.person('newcomer');
  assert.equal(promoted.x, lowestSeat.x);
  assert.equal(promoted.y, lowestSeat.y);
});

test('a later newcomer with an equal total does not displace a seated donor', async () => {
  const f = await fixture();
  f.fillSeats();
  f.user('equal-newcomer', 10);
  f.apply();
  assert.equal(Boolean(f.Kit.scene.person('equal-newcomer').slot.vip), false);
  assert.equal(f.Kit.scene.person('donor-1').slot.vip, true);
});

test('a busy qualifying donor preserves their action, then seats on the next ranking application', async () => {
  const f = await fixture();
  f.fillSeats();
  f.user('busy-newcomer', 11);
  const person = f.Kit.scene.person('busy-newcomer');
  f.Kit.scene.P.wait(person, 2500);
  const action = person.tasks[0];
  f.apply();
  assert.equal(person.tasks[0], action);
  assert.equal(Boolean(person.slot.vip), false);
  f.tick(3000);
  f.apply();
  assert.equal(person.slot.vip, true);
  f.tick();
  assert.equal(person.x, person.slot.x);
  assert.equal(person.y, person.slot.y);
});

test('removing front-row fill allows real viewers into the first floor positions', async () => {
  const f = await fixture();
  assert.equal(f.Kit.scene.extras().length, 0);
  f.user('real-viewer');
  const person = f.Kit.scene.person('real-viewer');
  assert.equal(person.slot.y, Math.min(...f.Kit.scene.layout.slots.map((slot) => slot.y)));
  f.tick(1000);
  assert.equal(f.Kit.scene.extras().length, 0);
});
