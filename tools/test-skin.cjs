// Node tests for the skin format helpers. Run: node tools/test-skin.cjs
const { validateSkin, frameToGrid, resolveSkin } = require('../desksprite.js');

// ── validateSkin ──────────────────────────────────────────────────────────────
const ok = {
  name: 't', palette: { '.': null, 'x': '#000' }, size: { w: 2, h: 2 },
  anchor: { x: 1, y: 2 }, frames: { idle: ['x.', '.x'], walk: [['x.', '.x']], held: ['xx', 'xx'] },
};
const bad = { name: 't', palette: { '.': null }, size: { w: 2, h: 2 }, frames: { idle: ['xxx'] } };
let a = validateSkin(ok), b = validateSkin(bad);
if (!a.ok) throw new Error('valid skin rejected: ' + a.errors.join(','));
if (b.ok) throw new Error('bad skin accepted');
console.log('Task 1 OK');

// ── frameToGrid ───────────────────────────────────────────────────────────────
const g = frameToGrid(['x.', '.x'], { '.': null, 'x': '#000' });
if (g[0][0] !== '#000' || g[0][1] !== null || g[1][1] !== '#000') throw new Error('frameToGrid wrong');
console.log('Task 2 OK');

// ── resolveSkin (Task 5; guarded so this file passes before T5 lands) ──────────
if (typeof resolveSkin === 'function') {
  if (resolveSkin('office-worker').name !== 'office-worker') throw new Error('builtin lookup fail');
  if (resolveSkin({ bad: 1 }).name !== 'office-worker') throw new Error('bad skin should fall back');
  if (!validateSkin(require('../skins/cat.json')).ok) throw new Error('cat skin invalid');
  console.log('Task 5 OK');
}
