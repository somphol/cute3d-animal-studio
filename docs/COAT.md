# Coat system: fur and feathers

The studio ships two coat modes on top of the smooth base models. Everything is generated at runtime;
there are no texture files, model files, or downloaded assets.

## Levels and budgets

| Level | What it does | Typical load |
| --- | --- | --- |
| **Smooth** | No shells, no strands. The original clay look. | 48–70 meshes |
| **Soft** | Half the shell layers; koala gets ~45k short strands. | 70–90 meshes |
| **Plush** | Full shells; koala gets up to 100k strands. | 90–125 meshes |

The choice is stored in `state.coat`, persisted, included in presets, and encoded in share links as
`f=off|soft|plush`. Smooth removes both shells and strands.

## Two rendering strategies

### Layered shells (all seven animals)

1. `COAT_CONFIG` declares zones by mesh name (`body`, `belly`, `head-mesh`, `ear-left`, `cheek-right`,
   `tail`), a colour role, a virtual fibre count, and masks.
2. For each zone the source mesh is cloned N times. Each clone is scaled from `1.004` outward by a
   fraction of the coat thickness, so the layers sit just above the skin.
3. Every shell uses a canvas-generated **alpha texture**:
   - **fur** — 36,000 tiny 2–5 px fibres plus 2,400 longer guard hairs at 512²;
   - **feather** — 18×14 scalloped barbs at 256² (the original down pattern).
4. Fur shells also receive a **colour map** (`COAT_PATTERN`) with fine light/dark directional grain,
   plus a bump map. This is what keeps the front from reading as smooth velvet.
5. Outer shells have a higher `alphaTest`, so they get sparser and soften the silhouette.
6. Shell colours follow the active palette role. Inner layers are darker, outer layers slightly
   lighter, creating depth without per-fiber lights.

Shell counts:

| Animal kind | Soft | Plush |
| --- | --- | --- |
| Fur (bear, bunny, shiba, fold) | 5 | 10 |
| Koala | 6 | 12 |
| Feather (penguin, conure) | 4 | 8 |

### GPU strands (koala only)

The koala is the long-fur species. It gets a real strand layer on top of its shells:

- Up to **100,000 tapered ribbons** in Plush, split across body, belly, head, ears, and tail zones.
- One `InstancedMesh` per zone, one shared 6-row ribbon geometry (cloned per zone for the optional
  per-instance normal attribute; the current material uses the ribbon normal).
- Roots are sampled on a sphere at `surfaceScale = 1.2`, outside the shells.
- Strands are **opaque** with `depthWrite: true` so they read as solid fibre rather than transparent
  dust. They are not sorted cards.
- A direction field projects a downward flow onto the local tangent plane, then blends in the surface
  normal and a small random tangent. This prevents front strands from pointing into the torso.
- The vertex shader applies length, curl, clump, two low-frequency wind gusts, and a cursor push.
- Density changes `InstancedMesh.count`; it never rebuilds geometry.
- Disposal removes the mesh, material, and per-zone geometry clone.

## Uniform contract

`STRAND_UNIFORMS` keys must match the shader declarations **exactly**:

```js
const STRAND_UNIFORMS = {
  uTime, uBreeze, uLength, uCurl, uClump, uCursor
};
```

Earlier versions declared `uTime`/`uBreeze` in GLSL but stored `time`/`breeze` in the object. Three
silently left the uniforms at zero, so `transformed.y *= uLength` collapsed every strand into a dot.
That was the root cause of “the fur looks like brush strokes / dust.” Do not rename one side without
the other. The browser suite and the in-page self-test now exercise the strand count and the layer
visibility, but a visual check is still required.

## Face and belly masks

A fur sphere would cover the eyes and the cream belly. Shell materials inject an object-space discard:

- **Head** — `if (vFurPos.z > 0.58) discard;` keeps the face clear.
- **Ears** — `if (vFurPos.z > 0.35) discard;` reveals the inner ear.
- **Body** — an oval window matching the belly patch is discarded, so the chest stays cream.
- Koala ear strands use `maxZ: 0.25` to keep the inner ear visible.

## Wind

There are two wind paths:

1. **Shell wind** — a small displacement (`uWindLocal × uWindSpeed × layer² × gain`). Gain is `0.008`
   for feathers and `0.025` for fur. Shells are undercoat; large shell motion made the coat look like
   stretched paint at high breeze.
2. **Strand wind** — the koala strand shader applies two low-frequency gusts and a curl/ clump bend
   along the fibre. This is the visible motion.

The fan remains the direction source: `updateShellWind` maps the fan→pet vector into each zone's local
space. The pointer adds a local radial push. Both paths are cheap, reversible, and stable.

## Fur studio controls

| Control | State key | Range | Effect |
| --- | --- | --- | --- |
| Length | `fur.length` | 0.4–1.8 | scales koala strand height in the shader |
| Density | `fur.density` | 0.1–1 | shell layer visibility + koala instance count |
| Curl | `fur.curl` | 0–1 | adds a sine bend along each koala strand |
| Clumping | `fur.clump` | 0–1 | adds coherent clump bends |
| Breeze | `fur.breeze` | 0–1 | shell micro-motion + koala strand wind + cursor push |

All five are persisted, included in presets, and encoded in share links (`u=`).

## Species recipes

| Animal | Type | Signature coat |
| --- | --- | --- |
| Bear | fur shells | short dense brown coat, crown and ear fuzz |
| Bunny | fur shells | fine coat, long ear fringe, fluffy tail |
| Penguin | feather shells | short down on the dark body, clean white belly |
| Shiba | fur shells | double coat, cream chest, bushy curled tail |
| Koala | shells + strands | long silver coat, huge fuzzy ears with cream inner ear |
| Sun Conure | feather shells | yellow-orange down, white eye patches, green layered wings |
| Scottish Fold | fur shells | dense silver coat, cream chest, folded flap ears, whiskers |

## Tuning guide

- **Dust instead of fur:** length is too short relative to width, or the shader uniforms are zero.
  Check that `uLength` is applied and that the strands are outside the base mesh.
- **Wire wool:** width is too large, opacity is opaque with too much contrast, or the coat is too
  long. Reduce width/length, not necessarily count.
- **Bare patches:** raise shell layer count or lower `alphaTest`; for koala, raise density or include
  another zone.
- **Fur on the face:** tighten the head mask (`z > 0.52` removes more) or ear `maxZ`.
- **Coat looks painted:** the alpha texture is too coarse or `texture.repeat` is too low. Use the
  high-frequency fur texture and repeat ≈1.3.
- **Coat looks like velvet:** add/raise the fine colour map and bump scale, or add more visible guard
  hairs. The shell alone is an undercoat.
- **Colour does not follow the picker:** call `refreshCoatColors(rig)` and `refreshStrandColors(rig)`.
- **New animal:** add a palette, builder, `COAT_CONFIG` entry, dictionary keys, and a distinct mesh
  count. Postures and coats both resolve parts by mesh name.

## Performance

- Strands are koala-only. The other six animals use shells, which keeps mobile GPU cost down.
- Koala Plush: up to 100k instances × 6 triangles ≈ 600k triangles, in 6 draw calls (one per zone).
- Shells: 8–12 alpha-tested clones per zone, no shadows, shared geometry, materials disposed on
  rebuild.
- Density never rebuilds geometry. Length/curl/clump/breeze are uniforms.
- Snapshot capture includes the full coat; it uses the same scene at 2048².
