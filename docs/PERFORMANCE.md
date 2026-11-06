# Performance

## Budgets

| Metric | Target | Typical desktop | Typical phone |
| --- | --- | --- | --- |
| First render | < 2.5 s on broadband | 0.8–1.4 s | 1.2–2.0 s |
| JS transferred | < 120 KB | ~95 KB (app, uncompressed) | same |
| CSS transferred | < 40 KB | ~28 KB | same |
| Runtime assets | 1 SVG icon, 0 models/textures/audio | — | — |
| Draw calls | < 60 | 36–47 | 36–47 |
| Meshes per rig | 19–52 | bear 25 | — |
| Frame budget | 16.6 ms | 2–4 ms GPU/CPU | 5–8 ms |
| Snapshot | < 400 ms at 2048² | 120–220 ms | 250–500 ms |
| Memory after seven switches | no growth | flat after disposal | flat |

The only network requests after HTML/CSS/JS are Three.js and the OrbitControls addon from jsDelivr.

## Why it is cheap

- **No textures.** Every surface is a `MeshStandardMaterial` colour; no image decode, no mipmaps, no
  UV mapping.
- **Shared geometry.** A single 26×20 sphere is reused for almost every rounded part; capsules and
  torus arcs are small and per-part.
- **Low segment counts.** 26×20 spheres and 8×18 capsules look smooth at this scale and keep the vertex
  count in the low thousands.
- **One shadow-casting light.** The key light uses a 2048² map; fill and rim cast nothing. On phones the
  map still fits comfortably.
- **No post-processing.** ACES tone mapping is a shader term, not a pass. There is no bloom, SSAO or
  outline pass.
- **DPR capped at 2.** A 3× phone renders at 2×, saving ~55% of pixels.
- **Rig disposal.** Switching animals disposes per-rig materials and non-shared geometry; shared
  geometry and accessory materials are explicitly skipped.
- **Throttled audio.** Blink ticks are capped at one per 2.4 s; there is no continuous ambience.

## Costs to watch

- `preserveDrawingBuffer: true` is required for reliable `toDataURL`; it costs some memory bandwidth.
  If snapshots move to `readRenderTargetPixels`, this can be disabled.
- The 2048² snapshot reallocates the drawing buffer for ~150 ms. A future version could render to an
  offscreen `WebGLRenderTarget` at 2048² without touching the visible canvas.
- `backdrop-filter` on the panel and pet card is composited every frame on some browsers. On very weak
  GPUs, disabling the blur would help; the fallback is still legible.
- Only the active rig is kept in memory; rebuilding plus its coat takes < 40 ms.

## Measurement

Use Chrome DevTools Performance with CPU 4× throttle, then:

```js
window.__cute3d.renderer.info.render   // calls, triangles
window.__cute3d.meshCount()            // active meshes
```

The in-page self-test renders a 512² snapshot; watch its duration in the Performance panel to estimate
2048² cost (roughly 16× the pixels).

## Mobile

The stage uses `height: 100dvh`, a bottom sheet for controls, and a portrait camera at z 9.8. The
renderer resizes on `ResizeObserver` and orientation change (debounced 120 ms). No hover-only
interaction is required.

## Strand budget

The koala fur layer is GPU-only: one instanced ribbon geometry, at most 100,000 instances in Plush
(about 45,000 on Soft), split into ~6 draw calls. Plush default density is 70%, ~70k strands. VFX adds
a separate groom: 190k target (~133k after masks) on desktop, 80k on screens under 800 px, in 6 draw
calls (~1.6M triangles) with a custom shader. There is no per-strand CPU simulation; wind, curl,
clumping, length and cursor push are vertex-shader uniforms. Velvet uses 24 light shells + 6 cushions
and no micro-strands; VFX uses the 133k groom; Film adds five fresnel shells and two point lights with
no coat geometry. The other five animals use shells only, which keeps the mobile path cheap.

- Build cost: sampling + instancing 100k Plush roots is a one-off ~150–350 ms on desktop; VFX adds
  ~133k more. Switches reuse shaders and only rebuild when the animal or coat level changes.
- Frame cost: one extra draw call per coat zone, no per-frame matrix updates.
- Memory: ~6.4 MB of instance matrices at full density.
- Reducing density updates `InstancedMesh.count`; it does not rebuild.
- Smooth removes both shells and strands.
