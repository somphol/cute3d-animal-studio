# Architecture

## The three-file contract

| File | Owns | Must not own |
| --- | --- | --- |
| `index.html` | document shell, import map, panel markup, aria labels, translation hooks | layout values, model data |
| `style.css` | tokens, backdrop, glass panel, HUD, responsive sheet, reduced motion | canvas pixels, 3D colours |
| `script.js` | engine maths, dictionaries, scene, rigs, animation, audio, state, UI | build tooling, network calls, assets |

There is no bundler. The browser resolves `three` and `three/addons/` from the import map. The app is
one ES module; Node loads the pure blocks by slicing the file between markers.

## Marked regions in `script.js`

```js
/* ENGINE:START */ const createStudioEngine = () => { … } /* ENGINE:END */
/* I18N:START */   const I18N = { en: {…}, th: {…} };       /* I18N:END */
/* APP:START */    import * as THREE from 'three'; …       /* APP:END */
```

`tests/lib/fixtures.mjs` extracts ENGINE and I18N and evaluates them with `new Function`. Therefore:

- the engine block may not reference `document`, `window`, `THREE`, `localStorage` or imports;
- the dictionaries must be plain object literals;
- adding a third-party helper to the engine breaks the Node tests.

## Runtime construction order

```
state (localStorage + defaults + URL share)
  → i18n helpers
  → StudioAudio (no AudioContext until first sound)
  → renderer, scene, camera, OrbitControls
  → lights, pedestal, shadow disc, decorative props
  → materials + geometry helpers
  → accessory builders
  → seven animal builders
  → rig helpers (buildAnimal, applyColors, applyAccessories, disposeRig)
  → ResizeObserver + camera framing
  → UI sync + event wiring
  → animation loop
  → self-test hook + window.__cute3d
```

Order matters: `buildAnimal` needs `ACCESSORY_BUILDERS` and `applyAccessories` needs the live `rig`.
The animation loop is started last so no frame observes a half-built rig.

## Scene contract

| Item | Value |
| --- | --- |
| Renderer | antialias, alpha, `preserveDrawingBuffer`, DPR ≤ 2 |
| Shadows | `PCFSoftShadowMap`, 2048² key-light map, radius 4, normalBias 0.025 |
| Tone mapping | `ACESFilmicToneMapping`, exposure 1.04, `SRGBColorSpace` |
| Camera | perspective 34°, position `(0, 2.55, 8.1)`, portrait `(0, 2.4, 9.8)` |
| Orbit target | `(0, 1.48, 0)` |
| Orbit limits | distance 4.1–11.5, polar 0.55–1.74, damping 0.055, pan disabled |
| Lights | hemisphere `#fff4ea`/`#cabfe8` 2.35; key 3.1; fill 1.15; rim 1.35 |
| Pedestal | cylinder r 2.25/2.4, h 0.16 at y −0.085; torus rim |
| Shadow | `ShadowMaterial` disc, opacity 0.2 |
| World origin | floor at y = 0, characters stand on it, height ≈ 3.3 units |

The backdrop is **CSS**, not a Three.js scene background. That keeps the canvas alpha transparent and
lets the snapshot remove the backdrop simply by clearing to alpha 0.

## Rig contract

Every builder returns the same shape. Treat it as an interface.

```ts
type Rig = {
  id: 'bear' | 'bunny' | 'penguin' | 'shiba';
  group: THREE.Group;        // world root, position.y animated
  head: THREE.Group;         // tilt/nod applied here; anchors for hat/glasses
  body: THREE.Mesh;          // breathing scale
  belly: THREE.Mesh;         // breathing scale, must sit forward of the body shell
  ears: THREE.Object3D[];    // two pivots, ear-wiggle and expression lift
  eyes: THREE.Mesh[];        // scale.y drives blinks
  glints: THREE.Mesh[];      // hidden when the eye closes
  tail: THREE.Object3D;      // wagged on Z/Y
  feet: THREE.Object3D[];    // waddle (penguin)
  arms: THREE.Object3D[];
  cheeks: THREE.Mesh[];      // scale from baseScale, never setScalar(1)
  mouth: THREE.Mesh;
  anchors: { neck; hat; glasses };
  materials: Record<Role, MeshStandardMaterial>;
  base: { belly: Vector3; headRotX; headRotZ; tailRot };
  seed: number;              // idle phase offset
  blinkSeed: number;         // blink phase offset
  earBases?: number[];       // filled by buildAnimal from each ear rest rotation
  accessories?: Record<string, THREE.Group>;
};
```

### Material roles

| Role | Source | Used by |
| --- | --- | --- |
| `main` | fur picker | body, head, limbs, ears |
| `mainDark` | `shade(main, −0.13)` | bear eye patches |
| `belly` | belly picker | patches, muzzle, paws, inner face |
| `blush` | blush picker | cheeks, pads |
| `inner` | `mix(blush, white, 0.28)` | inner ears |
| `accent` | `shade(blush, −0.18)` | bunny nose |
| `eye`, `glint`, `nose`, `beak`, `foot`, `cream` | fixed | faces and feet |

Recolouring updates `rig.materials` in place. Materials are **not** shared between rigs; accessory
materials and shared geometries are marked `userData.shared` so `disposeRig` skips them.

## Coat system

Fur and feathers are **layered shell meshes** generated after the rig is built:

- `COAT_CONFIG` declares zones by mesh name and colour role.
- `applyCoat(rig, level, outer)` clones each zone 5/10 (fur), 6/12 (koala), or 4/8 (feather) times;
  Velvet uses 12/24 plus a 1.018 cushion. Shells and cushions are **children of the source mesh**, so
  breathing/ear wiggles carry the coat.
- Object-space GLSL masks keep the face, inner ears and belly clear.
- `rig.fluff` holds the shells; `rig.fluffMaterials` maps roles to materials for live recolouring.
- The koala/fold outer layer is `none|pelt|velvet|vfx|film`: Pelt gets up to 100k ribbons, Velvet a
  thick cushion, VFX a ~133k-strand rooted groom with a custom Kajiya–Kay shader, and Film a clean
  smooth base with a fresnel rim shell and a warm key/cool fill pair.
- `state.coat` is `off|soft|plush` (shared as `f=`), `state.outer` is `none|pelt|velvet|vfx|film`
  (shared as `v=`). `OUTER_ANIMALS` gates the outer row to `koala` and `fold`.

Full detail and tuning rules are in [COAT.md](COAT.md).

## Rendering layers

1. Opaque base meshes and eyes.
2. Opaque alpha-tested coat shells (5/10 fur, 6/12 koala, 4/8 feathers) or Velvet cushions/shells, all
   parented to the source mesh.
3. Koala-only strand ribbons: Pelt up to 100k with vertex-shader wind; VFX ~133k rooted at 1.008 with an
   anisotropic Kajiya–Kay shader and no decorative shells.
4. Transparent sparkles and props.

Strands use `depthWrite: true` and render after shells, so they read as fibre rather than transparent
dust. `STRAND_UNIFORMS` is shared and its keys must match the GLSL (`uTime`, `uBreeze`, `uLength`,
`uCurl`, `uClump`, `uCursor`).

## Lighting presets

`applyLighting('studio'|'sky'|'desk')` changes hemisphere/key/fill/rim colors, tone-mapping exposure,
pedestal visibility, the cloud group and the cozy desk group, plus `body[data-lighting]` for the CSS
backdrop. The preset is stored in state and share links.

## State model

```js
{
  animal: 'bear',
  expression: 'happy',
  lang: 'en',
  sound: true,
  coat: 'soft',
  lighting: 'studio',
  fur: { length: 1, density: 0.7, curl: 0.35, clump: 0.4, breeze: 0.3 },
  colors: { bear: { main, belly, blush }, … },
  accessories: { bowtie: false, partyHat: false, glasses: false }
}
```

Persisted under three namespaced keys:

- `cute3d:state:v1` — the whole studio state;
- `cute3d:presets:v1` — sanitized preset array, max 10;
- `cute3d:lang:v1` — language, kept separately so it wins over older state blobs.

Presets are always passed through `sanitizePreset` / `sanitizePresets` on read and write. Invalid
animals, bad hex values and duplicate ids are dropped rather than trusted.

## Animation pipeline

One `requestAnimationFrame` loop with a delta clamped to 50 ms:

1. damp each expression target into `pose` (`lambda 6`, `12` under reduced motion);
2. compute idle bob and any active reaction (jump, spin, squash);
3. write group transform, body/belly breathing, blink scale, head tilt, ears, tail, cheeks, mouth;
4. penguin waddle adds a Z sway and alternating foot rotation;
5. advance sparkles, decorative props and pedestal rim;
6. `controls.update()` and `renderer.render()`.

Blink is deterministic: `blinkScale(time, seed)` returns a 1→0.035→1 envelope with a 3.4–5.2 s period,
plus a double blink on every sixth cycle. It is recomputed every frame and is fully testable in Node.

## Snapshot pipeline

```
save renderer size / pixel ratio / clear colour / alpha
hide pedestal + rim + decorative props + sparkles
scene.background = null
renderer.setPixelRatio(1), setSize(2048, 2048, false), clear alpha 0
render scene with snapshotCamera (fov 30, (0, 2.15, 7.15), lookAt (0, 1.55, 0))
canvas.toDataURL('image/png')  → download as cute3d-<animal>-<date>.png
restore size, ratio, clear colour and visibility
```

The main camera and OrbitControls are never touched. This is deliberate: earlier versions reused the
main camera and a resize call, which snapped the user's orbit back after every snapshot.

## Audio pipeline

`StudioAudio` creates the `AudioContext` lazily on the first user gesture. Each sound is a list of
oscillator notes with frequency ramps, an exponential gain envelope and a shared
gain → compressor → destination chain. Muting sets master gain to 0 and stops new contexts.

## Test seams

| Seam | Used by |
| --- | --- |
| ENGINE markers | engine tests, self-test |
| I18N markers | dictionary parity |
| `window.__cute3d` API | browser tests, screenshot script |
| `?selftest` | in-page report and overlay |
| `window.__selftest` | browser assertion |
| `window.__cute3d.getRig()` | material/eye/accessory assertions |
| `window.__cute3d.snapshotDataUrl()` | transparency check, OG card |

The API is a debug surface, not a public SDK. Keep it stable for tests and document changes in
`CHANGELOG.md`.
