# AGENTS.md — Cute3D Animal Studio

Read this before changing anything. It is the one-minute handoff.

## What it is

A static, zero-asset Three.js character studio. Four original animals are assembled at runtime from
spheres, capsules, cones and torus arcs; every sound is synthesized with Web Audio. It ships an
English/Thai UI, live colour/accessory customization, local presets, share links and a transparent
2048 px PNG export. It is **not** a model viewer, a game, or a backend product — there is no server,
account, database or analytics.

Live: <https://somphol.github.io/cute3d-animal-studio/>

## Commands

```bash
python3 -m http.server 4173        # or: npm start
node --test tests/engine.test.mjs  # 19 checks, no browser
node --test tests/static.test.mjs  # 75 checks, no browser
node tests/browser.test.mjs        # 23 checks, headless Chrome via CDP
npm run verify                     # engine + static + browser
node scripts/screenshot.mjs        # regenerate every PNG in assets/
TEST_URL=https://somphol.github.io/cute3d-animal-studio/ node tests/browser.test.mjs
```

Chrome is found at `CHROME` or the usual macOS/Linux paths. The harness uses `--use-mock-keychain`
and a temporary profile so macOS never prompts.

## Architecture

Three source files, no build step, no npm runtime dependencies.

1. `index.html` — shell, import map (Three.js pinned to `0.169.0`), 64 translation hooks, panel markup.
2. `style.css` — tokens and layout; the 3D canvas is transparent, the pastel backdrop is CSS.
3. `script.js` — three marked regions:
   - `/* ENGINE:START */ … END */` — pure functions. **No DOM, no THREE, no imports.** Node slices
     this block with `new Function` (in tests only).
   - `/* I18N:START */ … END */` — EN/TH dictionaries, parity-tested.
   - `/* APP:START */ … END */` — imports Three.js, builds the scene, rigs, loop and UI.

Construction order in `APP`: state store → i18n helpers → audio → renderer/scene/camera/controls →
lights/pedestal/props → materials/helpers → accessories → four builders → rig helpers → resize → app
state/UI → animation loop → self-test → boot.

The model contract is small and strict:

- Every builder returns `{ group, head, body, belly, ears[2], eyes[2], glints[2], tail, feet, arms,
  cheeks, mouth, anchors{neck,hat,glasses}, materials, base, seed, blinkSeed }`.
- Accessories are separate groups parented to `anchors`. Never parent them to the scene.
- `buildAnimal()` adds the three accessories and records `earBases`.
- Recolour through `rig.materials` roles: `main`, `mainDark`, `belly`, `blush`, `inner`, `accent`.
- Persist only through `ENGINE.sanitize*`; never trust `localStorage` or URL parameters.

## Decisions and constraints

- **No external art.** Do not add `.glb`, `.gltf`, `.obj`, textures, HDRIs, audio files or icon fonts.
  The only remote dependency is the pinned Three.js CDN in the import map.
- **Original characters only.** Do not reskin or imitate third-party mascots; `tests/static.test.mjs`
  scans for protected names, but that scan is a guard, not a licence.
- **Belly patches sit forward.** They are spheres at `z ≈ 0.55` so they read outside the body
  silhouette. Moving them back makes them invisible and has been fixed twice.
- **Penguin eyes sit forward** (`z = 0.72`) because the face patch extends to `z ≈ 0.71`.
- **Accessory anchors belong to `head` or the animal group.** Adding a hat/glasses anchor directly to
  the group re-parents it and silently detaches it from head motion.
- **Snapshot uses its own camera** (`fov 30`, `z 7.15`) and hides pedestal/rim/props/sparkles. It never
  mutates the main camera. `alpha: true` + clear alpha 0 is what makes the PNG transparent.
- **Blink and expression maths are pure** and live in the engine block so they can be tested in Node.
  Do not move them into the render loop.
- **The engine block must stay import-free.** `new Function` cannot resolve `THREE` or `document`.
- **Three.js is pinned.** Upgrading changes shadow/tone-mapping behaviour; re-run browser tests and
  regenerate screenshots after any bump.
- **Keep the test counts honest.** If a check is removed, update the README table; never edit a claim
  to match a failing suite.

## Known issues

- The Three.js CDN must load on first visit; there is no bundled copy or service worker.
- Snapshot capture temporarily resizes the drawing buffer to 2048², so expect a ~150 ms hitch on
  low-end phones.
- The desktop panel scrolls; "Saved presets" sits below the fold at 800 px height. This is intentional
  but frequently mistaken for missing content.
- Safari may require a user gesture before AudioContext starts; the first click does that.
- Presets are capped at 10 per browser profile and are not synchronized between devices.
- The static test suite expects `state.json` line counts to match the source; regenerate the state file
  after editing `index.html`, `style.css` or `script.js`.

## Continuity

- Repository: <https://github.com/somphol/cute3d-animal-studio>
- Deployed: <https://somphol.github.io/cute3d-animal-studio/> (GitHub Pages, `main` / root)
- Skill: `~/.config/opencode/skills/cute3d-animal-studio`, mirrored to
  <https://github.com/somphol/opencode-skills> under `cute3d-animal-studio/`
- Local: `~/Projects/cute3d-animal-studio`
- Session record: `state.json` (elapsed time, tokens, model, artifacts)
