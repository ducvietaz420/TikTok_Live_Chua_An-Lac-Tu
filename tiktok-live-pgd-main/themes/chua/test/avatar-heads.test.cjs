const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.resolve(__dirname, '../avatar-heads.js'), 'utf8');
const avatar = (width = 300, height = 100) => ({ complete: true, naturalWidth: width, naturalHeight: height });

function drawing() {
  const calls = [];
  const ctx = Object.fromEntries(['save', 'beginPath', 'arc', 'clip', 'drawImage', 'restore', 'scale', 'translate']
    .map((name) => [name, (...args) => calls.push({ name, args })]));
  return { ctx, calls };
}

function fixture(avatars = [avatar()], ready = true) {
  const bodyCalls = [];
  const sheet = {
    ready,
    frames: 32,
    frameW: 195,
    // Simulate trimmed sprite bounds, including the sheet-wide source x value.
    boxes: Array.from({ length: 32 }, (_, i) => ({ x: i * 195 + 20, y: 80, w: 140, h: 200 })),
    drawFrame(...args) { bodyCalls.push(args); return sheet.ready; },
  };
  const character = { sheet: 'assets/chars/devotee.png', sheetD: sheet };
  const people = avatars.map((image, i) => ({ id: `viewer-${i}`, avatar: image, char: character }));
  let frames = 0;
  const scene = {
    people: () => people,
    frame(t, dt) { assert.equal(this, scene); frames++; return { t, dt }; },
  };
  vm.runInNewContext(source, { window: { Kit: { scene } } }, { filename: 'avatar-heads.js' });
  const draw = (person = people[0], opts = {}) => {
    const result = drawing();
    result.drawn = person.char.sheetD.drawFrame(result.ctx, 16, 500, 1000, 100, { refH: 200, ...opts });
    return result;
  };
  return { scene, people, character, sheet, bodyCalls, draw, frames: () => frames };
}

test('viewers sharing one character draw their own current avatar without altering the shared sheet', () => {
  const a = avatar(), b = avatar(100, 300);
  const f = fixture([a, b]);
  const originalDraw = f.sheet.drawFrame;
  f.scene.frame(10, 5);
  assert.notEqual(f.people[0].char, f.people[1].char);
  assert.notEqual(f.people[0].char.sheetD, f.people[1].char.sheetD);
  assert.equal(f.sheet.drawFrame, originalDraw);
  assert.equal(f.draw(f.people[0]).calls.find((call) => call.name === 'drawImage').args[0], a);
  assert.equal(f.draw(f.people[1]).calls.find((call) => call.name === 'drawImage').args[0], b);
  const updated = avatar(160, 160);
  f.people[0].avatar = updated;
  assert.equal(f.draw(f.people[0]).calls.find((call) => call.name === 'drawImage').args[0], updated);
});

test('head diameter is 170% of the sprite head and landscape images use a centered square crop', () => {
  const f = fixture();
  f.scene.frame(10, 5);
  const { calls, drawn } = f.draw();
  assert.equal(drawn, true);
  const circle = calls.find((call) => call.name === 'arc').args;
  // Idle frame: head source center (98,130); trimmed bounds (20,80,140,200).
  assert.deepEqual(circle, [504, 925, 18.7, 0, Math.PI * 2]);
  const image = calls.find((call) => call.name === 'drawImage').args;
  assert.deepEqual(image.slice(1, 5), [100, 0, 100, 100]);
  assert.equal(image[7], 37.4);
  assert.equal(image[8], 37.4);
  assert.equal(image[5] + image[7] / 2, circle[0]);
  assert.equal(image[6] + image[8] / 2, circle[1]);
  assert.ok(calls.findIndex((call) => call.name === 'clip') < calls.findIndex((call) => call.name === 'drawImage'));
});

test('portrait images crop centrally and flipping moves the head without mirroring the avatar', () => {
  const f = fixture([avatar(120, 200)]);
  f.scene.frame(10, 5);
  const { calls } = f.draw(undefined, { flip: true });
  const image = calls.find((call) => call.name === 'drawImage').args;
  assert.deepEqual(image.slice(1, 5), [0, 40, 120, 120]);
  assert.equal(calls.find((call) => call.name === 'arc').args[0], 496);
  assert.equal(calls.some((call) => call.name === 'scale' || call.name === 'translate'), false);
  assert.equal(f.bodyCalls[0][5].flip, true);
});

test('per-viewer sheets inherit later source readiness and frame bounds instead of freezing unloaded data', () => {
  const f = fixture([avatar()], false);
  f.sheet.boxes = [];
  f.scene.frame(10, 5);
  const personal = f.people[0].char.sheetD;
  assert.equal(Object.getPrototypeOf(personal), f.sheet);
  assert.equal(Object.hasOwn(personal, 'ready'), false);
  assert.equal(f.draw().drawn, false);
  f.sheet.ready = true;
  f.sheet.boxes = Array.from({ length: 32 }, (_, i) => ({ x: i * 195 + 20, y: 80, w: 140, h: 200 }));
  assert.equal(personal.ready, true);
  assert.equal(personal.boxes, f.sheet.boxes);
  assert.equal(f.draw().calls.filter((call) => call.name === 'drawImage').length, 1);
});

test('absent, unloaded, or invalid avatars preserve the body and produce no overlay', () => {
  for (const image of [null, undefined, { complete: false, naturalWidth: 100, naturalHeight: 100 },
    { complete: true, naturalWidth: 0, naturalHeight: 100 }, { complete: true, naturalWidth: 100, naturalHeight: 0 }]) {
    const f = fixture([image]);
    f.scene.frame(10, 5);
    const result = f.draw();
    assert.equal(result.drawn, true);
    assert.equal(f.bodyCalls.length, 1);
    assert.equal(result.calls.length, 0);
  }
});

test('each viewer is wrapped once, forwards frame arguments, and overlays only a successfully drawn body', () => {
  const f = fixture();
  assert.deepEqual(f.scene.frame(10, 5), { t: 10, dt: 5 });
  const character = f.people[0].char;
  const personal = character.sheetD;
  f.scene.frame(20, 7);
  assert.equal(f.frames(), 2);
  assert.equal(f.people[0].char, character);
  assert.equal(f.people[0].char.sheetD, personal);
  f.draw();
  assert.equal(f.bodyCalls.length, 1);
  f.sheet.ready = false;
  const failed = f.draw();
  assert.equal(failed.drawn, false);
  assert.equal(failed.calls.length, 0);
  assert.equal(f.bodyCalls.length, 2);
});

test('unrelated character sheets remain untouched', () => {
  const f = fixture();
  f.character.sheet = 'assets/chars/other.png';
  f.scene.frame(10, 5);
  assert.equal(f.people[0].char, f.character);
  assert.equal(f.people[0].char.sheetD, f.sheet);
});
