// Cell-resolution model of the ORIGINAL procedural office-worker render (from the
// pre-skin drawFreePet), base poses only — the engine applies bob/droop/jitter/
// squash/flip on top, so those are NOT part of the static frame. Shared by the
// generator and the verifier so the emitted skin is provably identical to legacy.
const PAL = { ' ': null, 'H': '#3D2714', 'h': '#5A3D22', 'S': '#FDBDA0', 's': '#E09070',
  'e': '#1A1A2E', 'W': '#F0F0F8', 'B': '#1E5FCC', 'b': '#1547A8', 'T': '#CC2233', 't': '#AA1020' };
const CHAR = ['   HHHHHHHHH  ', '  HHhhHHHhhH  ', '  HHhSSSSShH  ', '  HHSeeSSeeS  ',
  '  HHSSSsSSSS  ', '  HHSSsWWsSH  ', '   HHSSSSsH   ', '   WBBTtTBBW  ',
  '  BBBbTtTbBBB ', '  BBBBTtTBBBB ', '  bBBBBBBBBBb ', '  bBBBBBBBBBb '];
const W = CHAR[0].length, H = 14;            // 14 x 14 grid (12 body rows + 2 leg rows)
const LEG = '#1547A8';

function blank() { return Array.from({ length: H }, () => Array(W).fill(null)); }
function put(g, c, r, w, h, color) { for (let y = r; y < r + h; y++) for (let x = c; x < c + w; x++) if (y < H && x < W) g[y][x] = color; }
function body(g) { CHAR.forEach((row, ry) => { for (let rx = 0; rx < row.length; rx++) { const col = PAL[row[rx]]; if (col) g[ry][rx] = col; } }); }

// state ∈ idle | walk0 | walk1 | held | carry  (carry is the working-clipboard overlay)
function legacyGrid(state) {
  const g = blank();
  if (state !== 'carry') body(g);
  if (state === 'idle')  { put(g, 3, 12, 3, 2, LEG); put(g, 8, 12, 3, 2, LEG); }
  else if (state === 'walk0') { put(g, 3, 13, 3, 1, LEG); put(g, 8, 12, 3, 2, LEG); }   // frame%2===0
  else if (state === 'walk1') { put(g, 3, 12, 3, 2, LEG); put(g, 8, 13, 3, 1, LEG); }   // frame%2===1
  else if (state === 'held') {
    const S = '#FDBDA0';
    put(g, 0, 1, 1, 1, S); put(g, 0, 2, 2, 1, S); put(g, 12, 1, 1, 1, S); put(g, 11, 2, 2, 1, S); // arms up
    put(g, 4, 4, 2, 2, '#fff'); put(g, 7, 4, 2, 2, '#fff');                                       // wide eyes
    put(g, 5, 5, 1, 1, '#1A1A2E'); put(g, 8, 5, 1, 1, '#1A1A2E');                                 // pupils
  }
  else if (state === 'carry') {                                                                    // clipboard overlay
    put(g, 11, 6, 3, 4, '#E8C36A'); put(g, 12, 7, 1, 2, '#fff');
  }
  return g;
}

const COLOR2CHAR = { '#3D2714': 'H', '#5A3D22': 'h', '#FDBDA0': 'S', '#E09070': 's', '#1A1A2E': 'e',
  '#F0F0F8': 'W', '#1E5FCC': 'B', '#1547A8': 'b', '#CC2233': 'T', '#AA1020': 't', '#fff': 'o', '#E8C36A': 'g' };
const PALETTE = { '.': null, 'H': '#3D2714', 'h': '#5A3D22', 'S': '#FDBDA0', 's': '#E09070', 'e': '#1A1A2E',
  'W': '#F0F0F8', 'B': '#1E5FCC', 'b': '#1547A8', 'T': '#CC2233', 't': '#AA1020', 'o': '#fff', 'g': '#E8C36A' };
function gridToFrame(g) { return g.map(row => row.map(c => (c === null ? '.' : COLOR2CHAR[c])).join('')); }

module.exports = { legacyGrid, gridToFrame, PALETTE, W, H };
