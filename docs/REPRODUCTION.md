# Reproduction guide

This is the complete blueprint for rebuilding Cute3D from an empty folder. It assumes a coding agent
with a browser, Node 20+, and a static-file server. Follow it in order; the acceptance gates at the end
are the same ones used for the original build.

## 0. Brief

Build a static 3D web app called **Cute3D: Procedural Code-Only Animal Studio** with vanilla HTML,
CSS, ES modules and Three.js from a CDN. Seven original animals are assembled from primitives. The app
must include idle animations, click reactions, expressions, live colours, three accessories,
synthesized audio, EN/TH UI, localStorage presets, share links and transparent PNG snapshots. No
downloaded 3D models, textures, audio files, fonts or icon packs.

Non-goals: accounts, servers, analytics, third-party characters, AR, multiplayer, file import.

## 1. Scaffold

```
index.html
style.css
script.js
manifest.webmanifest
assets/favicon.svg
tests/{engine,static,browser}.test.mjs
tests/lib/{harness,fixtures}.mjs
scripts/{serve,screenshot}.mjs
docs/…
README.md AGENTS.md LICENSE state.json
```

Set the import map in `index.html`:

```html
<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/"
  }
}
</script>
```

Pin the version. Load `script.js` with `type="module"`.

## 2. Engine block first

Write the pure block before any 3D code. It must export, through the returned object:

- constants: `ANIMALS`, `EXPRESSIONS`, `ACCESSORIES`, `COLOR_KEYS`, `PRESET_LIMIT(10)`,
  `DEFAULT_COLORS` per animal, `PALETTES` (5);
- maths: `clamp`, `lerp`, `damp`, `smoothstep`, `easeOutCubic`, `easeOutBack`, `hashString`;
- colour: `normalizeHex` (accepts `#abc`, `abc`, rejects junk), `hexToRgb`, `rgbToHex`, `mixHex`,
  `shade`, `paletteById`;
- life: `blinkScale(time, seed)`, `expressionPose(name)`;
- validation: `sanitizeColors`, `sanitizeAccessories`, `sanitizePreset(s)`, `sanitizePresets`;
- export/share: `snapshotFilename`, `encodeShareState`, `decodeShareState`;
- audio: `soundPattern(kind)`;
- misc: `clampSnapshotSize`, `formatMeshLabel`.

Default palettes used by the shipped build:

| Animal | main | belly | blush |
| --- | --- | --- | --- |
| bear | `#c08a6d` | `#ffe9df` | `#ff9db6` |
| bunny | `#f0d3c2` | `#fff6ef` | `#ffa8bf` |
| penguin | `#4a5774` | `#fdf8f0` | `#ffa9b8` |
| shiba | `#dfa163` | `#fff4e4` | `#ff9f8f` |

Blink formula (copy exactly):

```
period = 3.4 + (seed % 5) * 0.37
offset = seed * 1.713
phase  = ((t + offset) mod period + period) mod period
close  = 0.17, closed = 0.035
envelope: 1 → 0.035 (smoothstep in) → 1 (smoothstep out)
double blink when floor((t + offset)/period) % 6 === 3, second dip at phase 0.34
```

Expression table (`eyeOpen`, `headTilt`, `earAmp`, `tailAmp`, `floatAmp`, `cheek`, `earLift`):

| Expression | eyeOpen | headTilt | earAmp | tailAmp | floatAmp | cheek | earLift |
| --- | --- | --- | --- | --- | --- | --- | --- |
| happy | 1.00 | 0.00 | 0.11 | 0.26 | 1.00 | 1.00 | 0.00 |
| sleepy | 0.12 | 0.20 | 0.03 | 0.05 | 0.45 | 0.70 | −0.12 |
| curious | 1.12 | −0.30 | 0.16 | 0.16 | 1.10 | 0.85 | 0.22 |
| wiggle | 1.00 | 0.07 | 0.30 | 0.62 | 1.50 | 1.15 | 0.00 |

`soundPattern` returns `{gain, notes:[{type, from, to, at, dur}]}` for `boing`, `chime`, `blink`, `pop`,
`wiggle`, `swoosh`. Deep-copy on every call.

## 3. Scene

1. Append a `WebGLRenderer({antialias, alpha, preserveDrawingBuffer, powerPreference})` canvas to
   `#stage`. Set PCFSoft shadows, ACES, sRGB, DPR ≤ 2, clear alpha 0.
2. Add a perspective camera (34°, `(0, 2.55, 8.1)`) and OrbitControls targeting `(0, 1.48, 0)` with
   damping 0.055, distance 4.1–11.5, polar 0.55–1.74, pan off.
3. Lights: hemisphere (sky `#fff4ea`, ground `#cabfe8`, 2.35), warm key 3.1 at `(3.4, 6.4, 4.6)` with
   2048² shadows, cool fill 1.15, white rim 1.35.
4. Pedestal: cylinder (top r 2.25, bottom 2.4, h 0.16) at y −0.085, pale `#f2e4e8`; torus rim; a
   `ShadowMaterial` disc at y 0.002.
5. Three small torus props drift behind at z −2.6…−3.0. They are decorative and hidden for snapshots.
6. Resize with `ResizeObserver`; on portrait aspect (< 0.85) move the camera to `(0, 2.4, 9.8)`.

## 4. Shared geometry helpers

- Unit sphere `SphereGeometry(1, 26, 20)`, unit circle, unit cone — marked `userData.shared = true`.
- `mesh(geo, mat, {pos, rot, scale, name, cast, receive})` stores `userData.baseScale`.
- Capsules: `CapsuleGeometry(radius, length, 8, 18)`; torus arcs: `TorusGeometry(r, tube, 10, 30, arc)`.
- `mat(role, colour)` creates a unique `MeshStandardMaterial` (roughness 0.82) with `userData.role`.

## 5. Animals

Build in this order: bear, bunny, penguin, shiba, koala, conure, fold. All stand on y = 0. All faces point +Z. Base mesh counts are 27 / 29 / 21 / 28 / 25 / 52 / 34; they must stay distinct (the self-test checks this).

| Animal | Body | Head (y) | Ears | Eyes (z) | Tail | Distinct mesh count |
| --- | --- | --- | --- | --- | --- | --- |
| Bear | sphere scale (0.92, 0.90, 0.80) at y 0.98 | 2.02 | two sphere pivots ±0.58, y 0.36 | ±0.31, z 0.70 | sphere at z −0.62 | 27 |
| Bunny | (0.82, 0.94, 0.74) at 0.94 | 1.96 | capsules, pivot ±0.34, y 0.48 | ±0.26, z 0.62 | 3-sphere fluff at z −0.58 | 29 |
| Penguin | (0.88, 0.98, 0.84) at 1.02 | 2.06 | flipper capsules ±0.92, y 1.18 | ±0.21, z 0.72 | cone at z −0.70 | 21 |
| Shiba | (0.86, 0.86, 0.80) at 0.96 | 2.00 | 4-sided cones ±0.44, y 0.48 | ±0.27, z 0.62 | torus curl at z −0.55 | 28 |
| Koala | (0.92, 1.00, 0.82) at 1.00 | 2.06 | huge spheres ±0.70, outer + cream inner | ±0.29, z 0.66 | small sphere at z −0.70 | 25 |
| Sun Conure | (0.80, 1.00, 0.72) at 1.00 | 2.02 | layered feather wings at ±0.69 | under white eye patches, z 0.62 | 6 + 3 blue-green feathers | 52 |
| Scottish Fold | (0.86, 0.94, 0.82) at 0.99 | 2.00 | folded flaps ±0.44, z 0.50 | ±0.28, z 0.63 | torus curl at z −0.60 | 34 |

Critical depths for the shipped proportions:

- **Belly patches:** bear z 0.56, bunny z 0.50, penguin z 0.60, shiba z 0.58. Their Z scale is
  0.26–0.32. If pushed back they vanish inside the body.
- **Muzzles/face patches:** bear z 0.58, bunny z 0.54, penguin z 0.45 (front reaches 0.71),
  shiba z 0.56. Penguin eyes must be at z 0.72 to sit in front of the face patch.
- **Cheeks:** bear ±0.52, bunny ±0.47, penguin ±0.37 (z 0.64), shiba ±0.49.
- **Anchors:** neck z 0.74–0.80; hat/glasses must be parented to `head`, not to the animal group.

Accessories:

- bowtie: two 4-sided cones (r 0.17, h 0.32), apex pointing **inward**, plus a gold knot sphere;
  group scale 1.1, local z 0.10;
- party hat: cone r 0.3 h 0.78, gold torus trim, mint pompom; rotated `(-0.12, 0, 0.16)`;
- glasses: two torus rings r 0.155 tube 0.022, bridge and temple arms, dark material.

### New animal notes

- **Koala** — a broad dark nose (0.24 × 0.18 × 0.14) at z 0.80, a cream muzzle, huge outer ears with cream
  inner discs, and a small tail. Its coat uses long silver shells and ear masks that reveal the inner ear.
- **Sun Conure** — yellow head/body (`#f7c948`), orange chest (`#ff9c2f`), cream eye patches, charcoal
  triangular beak, green layered wings with lime coverts, and green-to-blue tail feathers. Wing/tail
  feathers use the shared `featherGeometry(base, tip)` leaf builder; the low tail fan is angled down so
  blue tips can peek below the body. Coat zones are feather shells on body, chest and crown.
- **Scottish Fold** — silver plush body, cream chest, eight whisker cylinders, tiny pink nose, and folded
  ear flaps on the forehead (`z ≈ 0.5`, flattened in Z, tilted forward) with pink inner ears.

## 5b. Coat system

Fur and feathers are **layered shells for every animal**, with a **strand layer for the koala**:

1. For each coat zone (body, belly, head, ears, cheeks, tail) clone the source mesh 5/10 times for fur,
   6/12 for koala, or 4/8 for feathers.
2. Scale each clone from `1.004` to `1.004 + thickness` (fur 0.09, koala 0.08, feathers 0.045).
3. Give each shell a canvas-generated fine alpha texture (`makeShellAlphaTexture`) plus a colour map and a matching bump map. Three fur variants and two feather variants are generated once and UV-offset per layer.
4. Raise `alphaTest` on outer layers (fur 0.34 → 0.54, feather 0.42 → 0.54) so they thin out into a fuzzy silhouette.
5. Inject a GLSL discard mask per zone: face `z > 0.58`, ears `z > 0.35`, body an oval window matching
   the belly patch.
6. Colour the shells by role and refresh them in `applyColors`.

Store shells in `rig.fluff` and role materials in `rig.fluffMaterials`. `disposeCoat` removes them and
disposes materials; shared geometry is never disposed. The UI exposes Smooth / Soft / Plush and the
state key is `coat`, shared as `f=`.

Do **not** replace this with solid cone strands, particles or cards — all three were prototyped and
read as wire, dust or paper shards. Koala strands are opaque ribbons with `depthWrite:true`; their
`STRAND_UNIFORMS` keys must match the GLSL (`uTime`, `uBreeze`, `uLength`, `uCurl`, `uClump`, `uCursor`).

### Optional VFX groom (koala)

The koala-only outer mode `vfx` replaces decorative shells with a dark undercoat and ~133k masked strands
(190k target desktop, 80k small screens). It uses uniform random sphere roots, per-instance normal /
seed / tint / role attributes, a custom `ShaderMaterial` with two-lobe Kajiya–Kay specular, root AO,
fill and rim, and a cream belly role rather than a body-mask hole. VFX is disabled outside the koala and
falls back to Plush. Do not enable it on every animal; the triangle budget is ~1.6M.

## 6. Animation

Write the loop exactly as described in [ANIMATION.md](ANIMATION.md). The non-obvious parts:

- eyes use `baseScale.y * blink * pose.eyeOpen`, plus `pose.eyeScale` on X;
- cheeks must scale from `userData.baseScale`, never `setScalar(1)`;
- ear rest rotations differ per animal; capture them in `earBases` inside `buildAnimal`;
- reaction: 0.92 s, jump `sin(kπ) * 0.82`, spin `easeOutCubic(k) * 2π * dir`, squash
  `1 + sin(3kπ) * 0.035 * (1 − k)`, reset rotation at the end;
- sparkles: 22 additive points, velocity + gravity, 0.7–1.1 s life, hidden under reduced motion.

## 7. UI and state

The panel has six sections in this order: characters, expression, colours, accessories, studio tools,
saved presets. Use `data-i18n` on the text node itself so emoji spans survive translation. Use
`data-animal`, `data-expr`, `data-accessory`, `data-palette` attributes as the wiring contract.

State hydration order: defaults → localStorage state → separate language key → URL share. Always
sanitize. UI sync functions (`syncColorInputs`, `syncAnimalButtons`, `syncExpressionButtons`,
`syncAccessoryButtons`, `syncSoundButtons`) are called after every state change.

Share format: `a=bear&c=c08a6d-ffe9df-ff9db6&x=happy&o=bowtie,glasses&l=en`. Colours are hex without
`#`, joined by `-`; accessories comma-separated.

## 8. Snapshot and social card

Use a dedicated `snapshotCamera` (fov 30, `(0, 2.15, 7.15)`, lookAt `(0, 1.55, 0)`), hide pedestal,
rim, props and sparkles, set clear alpha 0, render at 2048², export `toDataURL`. Restore everything
afterwards. For the OG card, draw the snapshot into a 1200×630 canvas with a pastel gradient, the
wordmark, one headline, three chips and a credit line (see `scripts/screenshot.mjs`).

## 9. Audio

Implement `StudioAudio` with lazy context creation, one master gain, a compressor, and the six patterns
from the engine. Add a 12 ms attack and exponential release per note. Mute via master gain, never by
recreating the context.

## 9b. Strand fur, postures and lighting

After the rig and shells:

1. **Postures** — adjust body/head/limb transforms per species; store `base.headRotX/Z`, `earBaseX` and
   `feet.baseY`. Bear sits, bunny is alert, penguin leans, shiba sits on haunches, koala reaches up,
   conure perches, fold loafs.
2. **Koala strands** — sample roots in local space at `1.008`; parent the InstancedMesh to the source mesh; build up to 100k opaque ribbons in Pelt. Put
   phase in the vertex shader from the root position, and drive breeze/curl/clump/length/cursor from
   `STRAND_UNIFORMS`. Density changes `InstancedMesh.count`, not geometry.
3. **Fur UI** — Sliders for length, density, curl, clumping, breeze; state key `fur`, share `u=`.
4. **Lighting** — studio / sky / desk; change lights, exposure, props and `body[data-lighting]`.
   Add procedural clouds for sky and a wooden desk/mug/plant/books for desk.
5. **Ground feet** — lower each foot by the idle bob unless a reaction is active.

## 10. Verification

Write all four layers before declaring done:

- engine: 19 checks (palettes, colour parsing, blink envelope, poses, preset sanitising, share
  round-trip, filename safety, size clamp, dictionary parity, coat levels);
- static: 82 checks (files, HTML shell, i18n coverage, no assets/trackers/trademarks, markers,
  storage namespace, snapshot contract, accessibility, metadata, state.json line counts);
- browser: 26 checks (canvas, seven rigs, coat levels, expressions, colours, accessories, language, presets,
  reaction, raycast tap, transparency, download, share, keyboard, reload, mobile sheet, reduced
  motion, in-page self-test, zero console errors);
- in-page: 20 checks at `/?selftest`.

## 11. Common failures and their fixes

| Symptom | Cause | Fix |
| --- | --- | --- |
| Hat/glasses float at the pet's waist | anchors added to `group` after being parented to `head` | omit them from `group.add` |
| Belly patch invisible | sphere centre too far back | move to z 0.5–0.6 |
| Penguin is eyeless | face patch covers z 0.56 | move eyes to z 0.72, brows to 0.70 |
| Cheeks become giant spheres | `scale.setScalar(1)` | multiply `userData.baseScale` |
| New rig loses accessory materials | shared materials disposed with the rig | mark them `userData.shared` |
| Snapshot resets the user's orbit | reusing the main camera + `resize()` | dedicated snapshot camera |
| Selftest "accessories built" fails | builders don't create accessories | test `ACCESSORY_BUILDERS`, or use `buildAnimal` |
| Static state test fails after edits | line counts stale | regenerate `state.json` |

## 12. Release

1. Run `npm run verify`, then `node scripts/screenshot.mjs`.
2. Update `state.json` (tokens, elapsed, line counts) and any test counts in README.
3. Commit, push to `main`, enable Pages (root). Wait for the Pages build.
4. Run the browser suite against the live URL until 26/26.
5. Add the skill to `~/Projects/opencode-skills` and run `node sync.mjs`.
6. Keep `AGENTS.md` current in the same push.

The original build took one session (see `state.json`). Budget most of the time for rig tuning and
snapshot composition, not boilerplate.
