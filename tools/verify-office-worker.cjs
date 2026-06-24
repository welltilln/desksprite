// Render-free proof that skins/office-worker.json is IDENTICAL to the legacy
// procedural render (base poses). Run: node tools/verify-office-worker.cjs
const { validateSkin, frameToGrid } = require('../desksprite.js');
const { legacyGrid } = require('./office-worker-legacy.cjs');
const skin = require('../skins/office-worker.json');

const chk = validateSkin(skin);
if (!chk.ok) throw new Error('office-worker invalid: ' + chk.errors.join(', '));

function eq(a, b, label) {
  if (a.length !== b.length) throw new Error(`${label}: height ${a.length} vs ${b.length}`);
  for (let y = 0; y < a.length; y++) {
    if (a[y].length !== b[y].length) throw new Error(`${label}: width differs at row ${y}`);
    for (let x = 0; x < a[y].length; x++)
      if (a[y][x] !== b[y][x]) throw new Error(`${label} differs at (${x},${y}): ${a[y][x]} vs ${b[y][x]}`);
  }
}
const P = skin.palette;
eq(frameToGrid(skin.frames.idle, P),    legacyGrid('idle'),  'idle');
eq(frameToGrid(skin.frames.walk[0], P), legacyGrid('walk0'), 'walk0');
eq(frameToGrid(skin.frames.walk[1], P), legacyGrid('walk1'), 'walk1');
eq(frameToGrid(skin.frames.held, P),    legacyGrid('held'),  'held');
eq(frameToGrid(skin.frames.carry, P),   legacyGrid('carry'), 'carry');
console.log('office-worker identical to legacy render ✓');
