# desksprite Skin System (Phase 1) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the desksprite character data-driven ("skins") so anyone can draw any creature, save it as a standard JSON file, and load it — without a server.

**Architecture:** A skin is a pure-data object (palette + text-grid `frames` per animation state + `size`/`anchor`/meta). The engine becomes a generic frame-player: it blits the right frame for the current state and applies generic transforms (flip / bob / tremble / squash / error-droop / scared-sweat). The current office worker is extracted into the built-in default skin `office-worker`, proven byte-identical by a render-free Node diff. A tiny registry resolves `start({skin})` from a name, an object, or a fetched URL.

**Tech Stack:** Vanilla JS (browser, zero-dependency, drop-in `<script>` + CommonJS export). Node (no deps) for tests/tools. JSON skin files.

## Global Constraints

- Zero runtime dependencies; stays a sync drop-in. Only `skinUrl` may be async (`fetch`).
- Loading a skin loads **data, never code** (skins are JSON; no `eval`/`Function`).
- Backward compatible: `start()` with no `skin` renders the current office worker, unchanged.
- Skin files are JSON-serializable objects; `"."` or `" "` in a frame = transparent.
- Invalid skin → fall back to `office-worker` + `console.warn`; never throw.
- All `.js`/`.json` files use LF line endings, UTF-8.

---

### Task 1: Skin schema + `validateSkin()` (pure, testable)

**Files:**
- Modify: `desksprite.js` (add a `validateSkin` function inside the IIFE, above `start`)
- Test: `tools/test-skin.mjs` (Node, no deps)

**Interfaces:**
- Produces: `validateSkin(skin) -> { ok: boolean, errors: string[] }`. A valid skin has: non-empty `palette` object; `size.w`,`size.h` positive ints; `frames.idle` (string[]), `frames.held` (string[]), `frames.walk` (array of ≥1 string[]); every frame's rows equal length and count ≤ `size.h`, row length ≤ `size.w`.

- [ ] **Step 1: Write the failing test** — `tools/test-skin.mjs`

```js
import { validateSkin } from '../desksprite.js';   // see Step 3 for the export shim
const ok = { name:'t', palette:{'.':null,'x':'#000'}, size:{w:2,h:2},
  anchor:{x:1,y:2}, frames:{ idle:['x.','.x'], walk:[['x.','.x']], held:['xx','xx'] } };
const bad = { name:'t', palette:{'.':null}, size:{w:2,h:2}, frames:{ idle:['xxx'] } }; // missing walk/held, row too wide
const a = validateSkin(ok), b = validateSkin(bad);
if (!a.ok) throw new Error('valid skin rejected: '+a.errors.join(','));
if (b.ok) throw new Error('bad skin accepted');
console.log('Task 1 OK');
```

- [ ] **Step 2: Run, verify it fails** — `node tools/test-skin.mjs` → Expected: error (`validateSkin` not exported / not defined).

- [ ] **Step 3: Implement `validateSkin` + export shim.** Add inside the IIFE:

```js
function validateSkin(s) {
  const e = [];
  if (!s || typeof s !== 'object') return { ok:false, errors:['not an object'] };
  if (!s.palette || typeof s.palette !== 'object') e.push('palette missing');
  if (!s.size || !(s.size.w > 0) || !(s.size.h > 0)) e.push('size invalid');
  const F = s.frames || {};
  const isFrame = f => Array.isArray(f) && f.length > 0 && f.every(r => typeof r === 'string')
    && f.every(r => r.length === f[0].length);
  if (!isFrame(F.idle)) e.push('frames.idle required (string[])');
  if (!isFrame(F.held)) e.push('frames.held required (string[])');
  if (!(Array.isArray(F.walk) && F.walk.length > 0 && F.walk.every(isFrame))) e.push('frames.walk required (frame[])');
  // size bounds
  const frames = [F.idle, F.held, F.fall, F.work, F.done, F.error, F.eat, F.carry, ...(F.walk||[])].filter(isFrame);
  for (const f of frames) {
    if (s.size && (f.length > s.size.h || f[0].length > s.size.w)) { e.push('a frame exceeds size'); break; }
  }
  return { ok: e.length === 0, errors: e };
}
```

At the very end of `desksprite.js`, extend the export so Node tests can import it:

```js
const DeskSprite = { start, version: '2.0.0', validateSkin };
if (typeof module !== 'undefined' && module.exports) module.exports = DeskSprite;
// ESM-import shim for tooling/tests (browsers ignore the try/catch failure):
try { /* eslint-disable */ } catch (_) {}
global.DeskSprite = DeskSprite;
```

> Note: `tools/test-skin.mjs` uses `import { validateSkin }`. To support a named ESM import without a build step, add at the end of the file (guarded so the browser script ignores it):
> ```js
> // Named ESM exports are appended by tools/build-esm only; for tests, run via the CJS path:
> ```
> Simpler: change the test to `import DeskSprite from '../desksprite.js'` won't work for a non-module file. **Decision:** the test `require`s it: rename `tools/test-skin.mjs` → `tools/test-skin.cjs` and use `const { validateSkin } = require('../desksprite.js')`. Update Steps 1–2 commands to `node tools/test-skin.cjs`.

- [ ] **Step 4: Run, verify pass** — `node tools/test-skin.cjs` → Expected: `Task 1 OK`.

- [ ] **Step 5: Commit** — `git add desksprite.js tools/test-skin.cjs && git commit -m "feat(skin): skin schema + validateSkin"`

---

### Task 2: `frameToGrid()` renderer core (pure, testable)

**Files:**
- Modify: `desksprite.js` (add `frameToGrid`)
- Test: `tools/test-skin.cjs` (extend)

**Interfaces:**
- Produces: `frameToGrid(frameRows, palette) -> (string|null)[][]` — a 2D array `[row][col]` of hex color or `null` (transparent) for `'.'`/`' '` or a char absent from palette.

- [ ] **Step 1: Failing test** — append to `tools/test-skin.cjs`:

```js
const { frameToGrid } = require('../desksprite.js');
const g = frameToGrid(['x.','.x'], {'.':null,'x':'#000'});
if (g[0][0] !== '#000' || g[0][1] !== null || g[1][1] !== '#000') throw new Error('frameToGrid wrong');
console.log('Task 2 OK');
```

- [ ] **Step 2: Run, verify fail** — `node tools/test-skin.cjs` → Expected: `frameToGrid is not a function`.

- [ ] **Step 3: Implement + export.** Add inside the IIFE and to the `DeskSprite` object:

```js
function frameToGrid(rows, palette) {
  return rows.map(row => Array.from(row, ch => {
    if (ch === '.' || ch === ' ') return null;
    const c = palette[ch];
    return (c === undefined) ? null : c;     // unknown char = transparent (palette value may be null)
  }));
}
```
Add `frameToGrid` to `const DeskSprite = { start, version, validateSkin, frameToGrid }`.

- [ ] **Step 4: Run, verify pass** — `node tools/test-skin.cjs` → Expected: `Task 1 OK` / `Task 2 OK`.

- [ ] **Step 5: Commit** — `git add desksprite.js tools/test-skin.cjs && git commit -m "feat(skin): frameToGrid renderer core"`

---

### Task 3: Render-free OLD-vs-NEW model + office-worker skin (the faithful-conversion gate)

**Files:**
- Create: `skins/office-worker.json`
- Create: `tools/verify-office-worker.cjs`

**Interfaces:**
- Consumes: `frameToGrid` (Task 2).
- Produces: `skins/office-worker.json` whose per-state grids equal the legacy procedural render.

The legacy procedural draw (current `desksprite.js`, pre-refactor) at cell resolution (PX=1):
the body is `CHAR` (12 rows × 13 cols) using palette `PAL`; legs are color `#1547A8` ('b');
overlays per state. Translate each `fillRect(x*P, y*P, w*P, h*P)` to cells `(col=x, row=y, w, h)`:

- **idle** = CHAR rows 0–11 + standing legs: cols 3–5 rows 12–13; cols 8–10 rows 12–13.
- **walk[0]** (frame%2===0) = CHAR + cols 3–5 row 13; cols 8–10 rows 12–13.
- **walk[1]** (frame%2===1) = CHAR + cols 3–5 rows 12–13; cols 8–10 row 13.
- **held** = CHAR + arms (`PAL.S`=`#FDBDA0`): col0 row1, cols0–1 row2, col12 row1, cols11–12 row2; wide eyes (`#fff`): cols4–5 rows4–5, cols7–8 rows4–5; pupils (`#1A1A2E`): col5 row5, col8 row5. (Sweat is fear-conditional → an engine overlay, NOT in the frame.)
- **carry** (clipboard overlay, working) = gold `#E8C36A` cols11–13 rows6–9 + white `#fff` col12 rows7–8.

- [ ] **Step 1: Write `tools/verify-office-worker.cjs`** — model the legacy render as grids:

```js
const { frameToGrid } = require('../desksprite.js');
const worker = require('../skins/office-worker.json');
const PAL = { ' ':null,'H':'#3D2714','h':'#5A3D22','S':'#FDBDA0','s':'#E09070',
  'e':'#1A1A2E','W':'#F0F0F8','B':'#1E5FCC','b':'#1547A8','T':'#CC2233','t':'#AA1020' };
const CHAR = ['   HHHHHHHHH  ','  HHhhHHHhhH  ','  HHhSSSSShH  ','  HHSeeSSeeS  ',
  '  HHSSSsSSSS  ','  HHSSsWWsSH  ','   HHSSSSsH   ','   WBBTtTBBW  ',
  '  BBBbTtTbBBB ','  BBBBTtTBBBB ','  bBBBBBBBBBb ','  bBBBBBBBBBb '];
const W = 13, H = 14;
function blank() { return Array.from({length:H}, () => Array(W).fill(null)); }
function put(g, c, r, w, h, color) { for (let y=r;y<r+h;y++) for (let x=c;x<c+w;x++) if (g[y]&&x<W) g[y][x]=color; }
function legacyChar(g) { CHAR.forEach((row,ry)=>{ for(let rx=0;rx<row.length;rx++){ const c=PAL[row[rx]]; if(c) g[ry][rx]=c; } }); }
function legacy(state) {
  const g = blank(); legacyChar(g); const L='#1547A8';
  if (state==='idle'){ put(g,3,12,3,2,L); put(g,8,12,3,2,L); }
  if (state==='walk0'){ put(g,3,13,3,1,L); put(g,8,12,3,2,L); }
  if (state==='walk1'){ put(g,3,12,3,2,L); put(g,8,13,3,1,L); }
  if (state==='held'){ const S='#FDBDA0';
    put(g,0,1,1,1,S); put(g,0,2,2,1,S); put(g,12,1,1,1,S); put(g,11,2,2,1,S);
    put(g,4,4,2,2,'#fff'); put(g,7,4,2,2,'#fff'); put(g,5,5,1,1,'#1A1A2E'); put(g,8,5,1,1,'#1A1A2E'); }
  return g;
}
function newGrid(frame) { // pad a skin frame's grid to W×H (top-left origin) for comparison
  const sub = frameToGrid(frame, worker.palette); const g = blank();
  for (let y=0;y<sub.length;y++) for (let x=0;x<sub[y].length;x++) g[y][x]=sub[y][x];
  return g;
}
function eq(a,b,label){ for(let y=0;y<H;y++)for(let x=0;x<W;x++) if(a[y][x]!==b[y][x])
  throw new Error(`${label} differs at (${x},${y}): ${a[y][x]} vs ${b[y][x]}`); }
eq(legacy('idle'),  newGrid(worker.frames.idle),   'idle');
eq(legacy('walk0'), newGrid(worker.frames.walk[0]),'walk0');
eq(legacy('walk1'), newGrid(worker.frames.walk[1]),'walk1');
eq(legacy('held'),  newGrid(worker.frames.held),   'held');
console.log('office-worker identical ✓');
```

- [ ] **Step 2: Create `skins/office-worker.json`** with `palette` = PAL (as JSON; map `" "` to `null`), `size:{w:13,h:14}`, `anchor:{x:6,y:14}`, and `frames.idle/walk[0..1]/held/carry` authored to match the cell maps above (CHAR rows + the per-state cells). Use the SAME palette chars as CHAR/PAL so the body rows are the CHAR strings verbatim; append leg rows (rows 12–13) using `'b'` (=`#1547A8`); for `held`, overlay arm cells with `'S'`, and add eye chars (introduce `'W'` for white is already `#F0F0F8` not `#fff`; add a palette entry `'o':'#ffffff'` and `'e'` already `#1A1A2E` for pupils — but the legacy uses literal `#fff`/`#1A1A2E`; set palette `'o':'#fff'` and reuse `'e'`).

- [ ] **Step 3: Run verify, iterate** — `node tools/verify-office-worker.cjs`. Fix the JSON frames until output is `office-worker identical ✓`. (This is the test loop; do not proceed until it passes.)

- [ ] **Step 4: Commit** — `git add skins/office-worker.json tools/verify-office-worker.cjs && git commit -m "feat(skin): office-worker skin proven identical (render-free)"`

---

### Task 4: Engine renders skins (replace hard-coded pixel logic)

**Files:**
- Modify: `desksprite.js` (`drawScene` desk-char block, `drawFreePet`, sizing in `start`, `placeFreePet`)

**Interfaces:**
- Consumes: the resolved `skin` (Task 5 wires resolution; for now read a module-scope `skin` initialised to the bundled office-worker), `frameToGrid`.
- Produces: `drawFrame(ctx, grid, ox, oy, px)` and a `frameFor(state, status)` selector.

- [ ] **Step 1:** Add helpers:

```js
function frameFor(skin, state, status) {
  const F = skin.frames;
  if (state === 'held')   return F.held;
  if (state === 'falling')return F.fall || F.held;
  if (state === 'walk')   return null; // caller cycles
  // idle-ish: pick status variant if present
  if (status === 'working') return F.work || F.idle;
  if (status === 'done')    return F.done || F.idle;
  if (status === 'error')   return F.error || F.idle;
  return F.idle;
}
function drawFrame(ctx, grid, ox, oy, px) {
  for (let y=0;y<grid.length;y++) for (let x=0;x<grid[y].length;x++) {
    const c = grid[y][x]; if (!c) continue; ctx.fillStyle = c; ctx.fillRect(ox+x*px, oy+y*px, px, px);
  }
}
```

- [ ] **Step 2:** In `drawFreePet`, REPLACE the hard-coded CHAR/legs/arms/eyes block with: pick the frame (walk → `skin.frames.walk[pet.frame % skin.frames.walk.length]`, else `frameFor`), convert via `frameToGrid` (cache per skin+frame), then `ctx.save()`, apply the SAME transforms already present (translate to free.width/2, flip if `pet.dir<0 && !scared`, squash, jitter via `jx/jy`, **error-droop** = `+2*px` y when `status==='error'`), then `drawFrame(ctx, grid, -anchorX*px, 0, px)`. Keep the scared-sweat overlay (`if (scared && pet.fear>0.45) fillRect(...)`) as an engine overlay. When `status==='working'` and walking and `skin.frames.carry`, draw the carry overlay grid too.

- [ ] **Step 3:** In `drawScene`, REPLACE `drawChar(...)` with `drawFrame` of `skin.frames.idle` (or `work`/`eat` per context) at the desk seat, using `skin.size`/`anchor` for placement (today's fixed `20, DESK-48` becomes anchor-derived). Keep the eating bowl overlay as desk-scene code.

- [ ] **Step 4:** In `start`, size the free canvas to `skin.size.w*PX` × `skin.size.h*PX` (was fixed 60); update `PET_BOX` usages to read the skin's pixel width/height; `placeFreePet`/`floorY` use those. Default office-worker (13×14×4 ≈ 52×56) ≈ today's 60 box.

- [ ] **Step 5: Verify** — `node --check desksprite.js`; re-run `node tools/verify-office-worker.cjs` (still passes — frames unchanged). Manual: open `demo/index.html`, default look unchanged; grab/throw/roam/seat still work.

- [ ] **Step 6: Commit** — `git add desksprite.js && git commit -m "feat(skin): engine renders skins via frames + generic transforms"`

---

### Task 5: Skin registry + loader (`start({skin})`)

**Files:**
- Modify: `desksprite.js` (bundle built-in skins; add `resolveSkin`; use it in `start`)
- Test: `tools/test-skin.cjs` (extend)

**Interfaces:**
- Produces: `resolveSkin(value) -> validatedSkinObject` where `value` is a name string (built-in), a skin object, or undefined (→ `office-worker`); invalid → office-worker + warn. `start({skin})` and `start({skinUrl})` (async fetch → re-render).

- [ ] **Step 1: Failing test** — append:

```js
const DS = require('../desksprite.js');
if (DS.resolveSkin('office-worker').name !== 'office-worker') throw new Error('builtin lookup fail');
if (DS.resolveSkin({bad:1}).name !== 'office-worker') throw new Error('bad skin should fall back');
console.log('Task 5 OK');
```

- [ ] **Step 2: Run, verify fail** — `node tools/test-skin.cjs` → `resolveSkin is not a function`.

- [ ] **Step 3: Implement.** Bundle skins (inline the office-worker JSON as `const OFFICE_WORKER = {...}` and a `const CAT` from Task 6, in a `const SKINS = { 'office-worker':OFFICE_WORKER, cat:CAT }`). Add:

```js
function resolveSkin(v) {
  let skin = (!v) ? SKINS['office-worker']
    : (typeof v === 'string') ? (SKINS[v] || (console.warn('desksprite: unknown skin '+v), SKINS['office-worker']))
    : v;
  const chk = validateSkin(skin);
  if (!chk.ok) { console.warn('desksprite: invalid skin ('+chk.errors.join('; ')+') — using office-worker'); skin = SKINS['office-worker']; }
  return skin;
}
```
In `start`: `const skin = resolveSkin(cfg.skin);` (use throughout). If `cfg.skinUrl`: `fetch(cfg.skinUrl).then(r=>r.json()).then(s=>{ const sk=resolveSkin(s); /* swap skin + clear frame cache + redraw */ }).catch(()=>{});` Export `resolveSkin`.

- [ ] **Step 4: Run, verify pass** — `node tools/test-skin.cjs` → all OK.

- [ ] **Step 5: Commit** — `git add desksprite.js tools/test-skin.cjs && git commit -m "feat(skin): registry + resolveSkin loader (name/object/url, fallback)"`

---

### Task 6: Demo skin `cat` + blank `_template`

**Files:**
- Create: `skins/cat.json`, `skins/_template.json`

- [ ] **Step 1:** Author `skins/cat.json` — a simple cat (size ~13×13): `palette` (black, pink nose, white), `frames.idle/walk[2]/held`, `anchor`. Validate: add to `tools/test-skin.cjs` a line `if(!DS.validateSkin(require('../skins/cat.json')).ok) throw new Error('cat invalid')`.
- [ ] **Step 2:** Author `skins/_template.json` — minimal valid skin with comments-in-README explaining each field (JSON has no comments; keep keys + tiny placeholder frames that pass validation).
- [ ] **Step 3: Run** — `node tools/test-skin.cjs` → all OK.
- [ ] **Step 4: Commit** — `git add skins/cat.json skins/_template.json tools/test-skin.cjs && git commit -m "feat(skin): cat demo skin + blank template"`

---

### Task 7: Authoring converter `tools/png-to-skin.mjs`

**Files:**
- Create: `tools/png-to-skin.mjs`

- [ ] **Step 1:** Implement a Node script (no deps; parse PNG via the built-in `zlib` + a minimal PNG decoder, OR document requiring `pngjs` — **decision:** keep zero-dep by accepting a **plain `.txt` grid + a palette JSON** instead of PNG for v1, named `txt-to-skin.mjs`, OR use a tiny inlined PNG reader). **Decision for zero-dep:** accept an indexed-PNG only via a ~60-line inlined decoder for 8-bit RGBA; map each distinct color to an auto-assigned palette char; emit skin JSON with one frame (the engineer maps frames by running per-pose PNGs). Document usage in `--help`.
- [ ] **Step 2:** Smoke test: run on a tiny generated PNG (create in the script's test) → prints valid skin JSON; `node -e "..."` validates it with `validateSkin`.
- [ ] **Step 3: Commit** — `git add tools/png-to-skin.mjs && git commit -m "feat(skin): PNG→skin JSON authoring converter"`

---

### Task 8: Docs — SKIN_FORMAT, CONTRIBUTING, README, demo picker

**Files:**
- Create: `docs/SKIN_FORMAT.md`, `CONTRIBUTING.md`
- Modify: `README.md` (add "Skins" section), `demo/index.html` (skin picker), `package.json` (version 2.0.0)

- [ ] **Step 1:** `docs/SKIN_FORMAT.md` — the standard: schema, each field, the frame/state contract (idle/walk/held required; fall/work/done/error/eat/carry optional), transparency rule, size/anchor, a full annotated example.
- [ ] **Step 2:** `CONTRIBUTING.md` — how to draw (template + converter), validate (`node tools/test-skin.cjs` pattern), and PR a `skins/<name>.json`.
- [ ] **Step 3:** `README.md` — add a "Skins" section: `start({skin:'cat'})`, custom object, `skinUrl`, link to SKIN_FORMAT + the `skins/` folder.
- [ ] **Step 4:** `demo/index.html` — add a `<select>` to switch skins (office-worker / cat) via `restart({skin})`.
- [ ] **Step 5: Commit** — `git add docs/SKIN_FORMAT.md CONTRIBUTING.md README.md demo/index.html package.json && git commit -m "docs(skin): skin format, contributing guide, README + demo picker"`

---

## Self-Review

- **Spec coverage:** skin JSON format (T1,T3), engine frame-player (T4), loader name/object/url + fallback (T5), office-worker default unchanged + render-free proof (T3), cat demo + template (T6), converter (T7), docs/skins folder/CONTRIBUTING (T8). Deferred items (gallery/npm/TS/events/scenes) correctly absent. ✓
- **Placeholder scan:** the converter (T7) and template (T6) carry explicit "decisions" rather than TODOs; the office-worker frames are produced by an iterate-until-verify loop (T3) rather than hand-pasted strings (which can't be verified blind). Acceptable — the verify script is the executable spec.
- **Type consistency:** `validateSkin` / `frameToGrid` / `resolveSkin` / `frameFor` / `drawFrame` signatures are used consistently across tasks; `SKINS` map keys (`office-worker`,`cat`) match `resolveSkin` and the demo.
- **Risk:** the unrenderable office-worker conversion is gated by `verify-office-worker.cjs` (T3) — the default cannot silently drift.
