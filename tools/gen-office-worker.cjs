// Generate skins/office-worker.json from the legacy render model (run once / on change).
// Run: node tools/gen-office-worker.cjs
const fs = require('fs'), path = require('path');
const { legacyGrid, gridToFrame, PALETTE } = require('./office-worker-legacy.cjs');

const skin = {
  name: 'office-worker',
  author: 'welltilln',
  palette: PALETTE,
  size: { w: 14, h: 14 },
  anchor: { x: 7, y: 14 },
  frames: {
    idle: gridToFrame(legacyGrid('idle')),
    walk: [gridToFrame(legacyGrid('walk0')), gridToFrame(legacyGrid('walk1'))],
    held: gridToFrame(legacyGrid('held')),
    carry: gridToFrame(legacyGrid('carry')),   // clipboard overlay drawn while "working"
  },
};
fs.writeFileSync(path.join(__dirname, '../skins/office-worker.json'), JSON.stringify(skin, null, 2) + '\n');
console.log('wrote skins/office-worker.json');
