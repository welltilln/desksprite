# desksprite — skin system (Phase 1)

**Date:** 2026-06-22
**Goal:** turn the hard-coded pixel character into **data** ("skins") so anyone can draw
any creature (dog/cat/dragon/…), save it as a standard file, and load it — building a
community "desksprite universe" with **no server/platform** (just standard files).

## Scope (Phase 1 only)

- The **character** becomes a skin (data). The **engine** becomes a generic frame-player.
- The **desk scene** (CRT room) stays as-is and still optional (`desk:false`). Custom
  *scenes* are a later phase.
- Ship the current look as the built-in **`office-worker`** skin (default) → standalone is
  visually unchanged. Add one demo skin (`cat`) to prove the system.
- Deferred to later phases: gallery page, npm/ESM/TS packaging, events/API, custom scenes.

## Skin file = a standard JSON object

Pure data (no code → safe to load untrusted skins; portable; PR-diffable).

```jsonc
{
  "name": "cat",
  "author": "someone",
  "palette": { ".": null, "k": "#222", "p": "#f7a" },   // char → color; "." (or " ") = transparent
  "size": { "w": 13, "h": 14 },                          // grid cells
  "anchor": { "x": 6, "y": 13 },                         // feet point (floor placement + h-centering)
  "frames": {
    "idle":  ["...","..."],                              // REQUIRED — sit / stand / paused
    "walk":  [["...",".."], ["...",".."]],               // REQUIRED — 1+ frames, cycled while moving
    "held":  ["...","..."],                              // REQUIRED — grabbed / scared
    "fall":  ["..."],                                    // optional → defaults to held
    "work":  ["..."], "done": ["..."], "error": ["..."], // optional idle variants by status → idle
    "eat":   ["..."]                                     // optional (lunch at desk) → idle
  }
}
```

- A **frame** is an array of equal-length strings (rows); each char indexes `palette`.
- The engine applies generic **transforms** on top of a frame: horizontal flip by facing,
  vertical bob (idle/walk), tremble jitter scaled by fear (held/fall), squash on landing.
  These are NOT baked into frames — the frame is the static pose only.

### State → frame mapping (engine)

| engine state | frame |
|---|---|
| desk-sit / stand / paused / seating | `idle` (or `work`/`done`/`error`/`eat` when that status/context applies, else `idle`) |
| roaming (moving) | `walk[ frame % walk.length ]` |
| held | `held` |
| falling | `fall` (→ `held`) |

## Engine changes (`desksprite.js`)

1. **Renderer** (`drawFreePet`, the desk `drawChar`): replace all hard-coded pixel/limb
   logic with a generic `drawFrame(ctx, skin, frameRows, originX, originY)` that blits the
   text grid via `palette`. Flip/jitter/squash/bob remain as ctx transforms.
2. **Variable size:** the free-body canvas and desk placement size to the skin's `size`×PX
   and use `anchor` for floor/seat placement (today's 60px / fixed offsets are office-worker
   specific). PX stays 4 by default (skin may set its own).
3. **Loader / registry:** `start({skin})` accepts (a) a built-in name string, (b) a skin
   object, or (c) `skinUrl` (async `fetch` of a `.json`; optional convenience, not a server).
   Built-ins live in a small `SKINS` map bundled in the file. Invalid skin → fall back to
   `office-worker` + a console warning (never throw).
4. **Validation:** a tiny `validateSkin()` checks required frames + palette + equal row
   lengths; bad skins warn and fall back.

## office-worker conversion (the risky part)

The current worker is drawn procedurally (CHAR grid + per-frame legs + scared arms/eyes +
clipboard/droop). Convert to explicit frames: `idle`, `walk[0]`, `walk[1]`, `held`, plus
`work` (clipboard) and `error` (droop). **Verification without a browser:** a Node script
(`tools/verify-office-worker.js`) renders BOTH the OLD procedural logic and the NEW frames
to a cell-color grid per state and asserts they are **identical**. The default must not drift.

## Files

```
desksprite.js                 ← engine (skin-driven) + bundled built-in skins
skins/office-worker.json      ← the default, extracted
skins/cat.json                ← demo skin
skins/_template.json          ← blank skin to copy
tools/png-to-skin.mjs         ← convert a PNG (+ palette) → skin JSON (authoring aid)
tools/verify-office-worker.js ← render-free proof the default is unchanged
docs/SKIN_FORMAT.md           ← the standard (contributor reference)
CONTRIBUTING.md               ← how to draw + submit a skin
README.md                     ← add "Skins" section
```

## Non-functional

- Backward compatible: `start()` with no `skin` = `office-worker` = today's look.
- Still zero-dependency, sync drop-in (skin objects/built-ins are sync; only `skinUrl` is async).
- Loading a skin is loading **data**, never code.

## Verification

`node --check`; `tools/verify-office-worker.js` (default unchanged, render-free); the demo
page gains a skin picker for manual playtest (can't render here). Adversarial review of the
engine refactor + loader.
