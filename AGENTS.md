# AGENTS.md — Cute3D Animal Studio

Read this before changing anything. It is the one-minute handoff.

## What it is

A static, zero-asset Three.js character studio. Eight original animals — including a koala, baby hippo,
sun conure and Scottish Fold — are assembled at runtime from
spheres, capsules, cones and torus arcs; every sound is synthesized with Web Audio. It ships an
English/Thai UI, live colour/accessory customization, local presets, share links and a transparent
2048 px PNG export. It is **not** a model viewer, a game, or a backend product — there is no server,
account, database or analytics.

Live: <https://somphol.github.io/cute3d-animal-studio/>

## Commands

```bash
python3 -m http.server 4173        # or: npm start
node --test tests/engine.test.mjs  # 19 checks, no browser
node --test tests/static.test.mjs  # 84 checks, no browser
node tests/browser.test.mjs        # 28 checks, headless Chrome via CDP
npm run verify                     # engine + static + browser
node scripts/screenshot.mjs        # regenerate every PNG in assets/
TEST_URL=https://somphol.github.io/cute3d-animal-studio/ node tests/browser.test.mjs
```

Chrome is found at `CHROME` or the usual macOS/Linux paths. The harness uses `--use-mock-keychain`
and a temporary profile so macOS never prompts.

## Architecture

Three source files, no build step, no npm runtime dependencies.

1. `index.html` — shell, import map (Three.js pinned to `0.169.0`), 110 translation hooks, panel markup.
2. `style.css` — tokens and layout; the 3D canvas is transparent, the pastel backdrop is CSS.
3. `script.js` — three marked regions:
   - `/* ENGINE:START */ … END */` — pure functions. **No DOM, no THREE, no imports.** Node slices
     this block with `new Function` (in tests only).
   - `/* I18N:START */ … END */` — EN/TH dictionaries, parity-tested.
   - `/* APP:START */ … END */` — imports Three.js, builds the scene, eight rigs, coat shells, loop and UI.

Construction order in `APP`: state store → i18n helpers → audio → renderer/scene/camera/controls →
lights/pedestal/props → materials/helpers → accessories → eight builders → coat shells → rig helpers → resize → app
state/UI → animation loop → self-test → boot.

Fur/scene contract:

- `state.coat` is `off|soft|plush`; `state.outer` is `none|pelt|velvet|vfx|film` and only applies to
  `OUTER_ANIMALS` (`koala`, `fold`). `state.fur` is `{length,density,curl,clump,breeze}`; `state.lighting`
  is `studio|sky|desk`; `state.walk` is a persisted boolean behaviour toggle.
- Coat shells: 5/10 for fur, 6/12 for koala, 4/8 for feathers. Velvet uses 12/24 + a 1.018 cushion.
  Fine alpha + bump + colour maps, object-space face/ear/belly masks.
- **Attachment:** shells, cushions and strand InstancedMeshes are children of the source mesh. VFX roots
  are local at 1.008; the ribbon starts inside the skin. Do not parent coats to `mesh.parent` or use
  1.2× roots again; that was the floating-halo bug.
- Koala-only strands: Pelt up to 100k opaque tapered ribbons; VFX ~133k with a custom Kajiya–Kay
  shader and per-instance role/tint/seed/guard/clump attributes. One InstancedMesh per zone; density
  changes `mesh.count` (and shell layer visibility); never rebuild geometry on slider input.
- **`STRAND_UNIFORMS` keys must be `uTime`, `uBreeze`, `uLength`, `uCurl`, `uClump`, `uCursor`** to match
  the GLSL. A mismatch leaves them zero, which collapses every strand into a dot. This was the v1.4 fur bug.
- Koala strands are opaque with `depthWrite:true`. They are fibre, not transparent cards.
- Shell wind is deliberately tiny (`0.008` feather, `0.025` fur). Do not raise it; large shell motion
  stretches the alpha cutouts into paint-like streaks.
- `applyPosture()` must run before coat generation and must store head/ear/foot base transforms.
- `applyLighting()` owns lights, exposure, pedestal, clouds and desk visibility; call it after any state
  restore.

Coat contract:

- `COAT_CONFIG` maps mesh names to zones; `applyCoat(rig, 'off'|'soft'|'plush')` builds or removes
  shell clones.
- Shells are opaque with alpha test, use canvas-generated strand + bump textures, and inject object-space
  masks so the face (`z > 0.58`), ear centres (`z > 0.35`) and belly oval stay clear.
- `rig.fluff` holds the shells, `rig.fluffMaterials` maps roles for live recolouring. Never dispose
  shared geometry.

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
- **Two-row coat.** Row 1 is universal `off|soft|plush`; row 2 is `none|pelt|velvet|vfx|film` for the
  koala and the Scottish Fold. Pelt adds strands over shells; Velvet is a thick cushion + many light
  shells; VFX is a dense rooted groom; Film removes the coat and adds a fresnel rim shell plus a warm
  key/cool fill pair. Other animals are shell-only. Do not replace this with CPU strand physics,
  particles or cards without visual proof.
- **Film is a rendering mode, not geometry.** `buildFilmCoat()` keeps the smooth base meshes, adds
  five `film-rim-*` fresnel shells at `1.006×` and two point lights, and nudges `main`/`belly`
  roughness. `disposeFilm()` must restore roughness, remove the lights/shells and dispose the shader.
  Do not scale the rim shells beyond ~1.01; they become a halo.
- **Walking is opt-in.** `state.walk` drives `walk.phase` in the loop (ellipse offset left of centre so
  the default fan is not walked through). It damps to rest when a reaction plays or reduced motion is
  on, and `captureSnapshot()` zeroes `group.position.x/z` and `rotation.y` for the transparent capture.
- **The Google prompt is inspiration, not a spec.** We did not add a literal 60k CPU simulation or copy
  its copy; the app keeps its own cozy pastel identity and performance budget.
- **The fan is the wind source.** `updateShellWind` maps the fan→pet vector into each coat zone; keep
  `state.fanAngle` and `updateFanPose` in sync. Do not hard-code a global wind direction.
- **Postures run before coats.** If you pose a rig after coats, shells and strands detach.
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
- **Keep the test counts honest.** Current gates: 19 engine, 88 repository, 28 browser, 21 in-page.
  If a check is removed, update the README table; never edit a claim to match a failing suite.

## Known issues

- The GitHub Actions `verify` workflow fails on the hosted runner (the browser step cannot start a
  WebGL Chrome there). Local `npm run verify` and the live Pages suite are the source of truth; do not
  weaken the local gates to make CI green.
- The Three.js CDN must load on first visit; there is no bundled copy or service worker.
- Snapshot capture temporarily resizes the drawing buffer to 2048², so expect a ~150 ms hitch on
  low-end phones.
- The desktop panel scrolls; "Saved presets" sits below the fold at 800 px height. This is intentional
  but frequently mistaken for missing content.
- Safari may require a user gesture before AudioContext starts; the first click does that.
- Presets are capped at 10 per browser profile and are not synchronized between devices.
- Pelt adds 12 shells + up to 100k strands (Fold 60k). Velvet adds 24 light shells + 6 cushions (more
  draw calls, fewer triangles). VFX adds ~133k strands (~1.6M triangles) and no shells, with an 80k
  mobile budget. Film adds no coat geometry. Measure before raising any.
- The fold belly sits at `z = 0.62` (was `0.58`). At `0.58` the body and belly surfaces were nearly
  coplanar and produced a dark H-shaped seam on the bare belly whenever the coat was removed (Film).
  Do not move it back.
- The koala's chest patch boundary can read as a soft collar; it is the body mask and belly patch, not
  a missing mesh.
- The koala/conure/fold coats are tuned for the default palettes; extreme custom colours still work but
  the silhouette contrast changes.
- Film is a clean sculpted read, not a fur render: there is no per-hair shadowing. If it reads too
  smooth, tune the rim shell/light intensities before adding clumps; surface-anchored sphere clumps
  read as beads on this model.
- Lighting presets swap 3D props (clouds/desk) and CSS backgrounds. Snapshot hides them; keep that in
  mind when adding new props.
- The static test suite expects `state.json` line counts to match the source; regenerate the state file
  after editing `index.html`, `style.css` or `script.js`.

## Continuity

- Repository: <https://github.com/somphol/cute3d-animal-studio>
- Deployed: <https://somphol.github.io/cute3d-animal-studio/> (GitHub Pages, `main` / root)
- Skill: `~/.config/opencode/skills/cute3d-animal-studio`, mirrored to
  <https://github.com/somphol/opencode-skills> under `cute3d-animal-studio/`
- Local: `~/Projects/cute3d-animal-studio`
- Session record: `state.json` (elapsed time, tokens, model, artifacts)
