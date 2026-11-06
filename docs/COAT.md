# Coat system: fur and feathers

The studio ships a **two-row** fur studio on top of the smooth base models. Everything is generated at
runtime; there are no texture files, model files, or downloaded assets.

## The two rows

| Row | Options | Applies to | Meaning |
| --- | --- | --- | --- |
| **Coat** | Smooth / Soft / Plush | all seven animals | base density and quality |
| **Outer coat** | None / Pelt / Velvet / VFX / Film | koala + Scottish Fold | how the visible outer layer is built |

The outer row is hidden and disabled outside `OUTER_ANIMALS` (`koala`, `fold`). Both pets keep the same
first row as every other animal; the outer layer is additive.

## Base coat budgets

| Coat | Shells (fur) | Shells (koala) | Plush strands |
| --- | --- | --- | --- |
| Smooth | none | none | none |
| Soft | 5 | 6 | ~45k |
| Plush | 10 | 12 | ~100k |

Feather animals use 4 (Soft) or 8 (Plush) shell layers. The 24-layer Velvet setting is separate.

## Outer modes

### None
Base shells only. No strand layer. This is useful for comparing the shell silhouette.

### Pelt
The balanced mode: base shells plus the legacy tapered-ribbon strands. Koala and Fold get a strand
layer on top of shells. This is the default and the most “cute plush” result.

### Velvet
The thick, soft undercoat. It is designed to read as **dense plush/velour**, not long fur:

- **No micro-strand blizzard.** The surface is a cushion, not a cloud of 1 px dots.
- A **cushion mesh** for each zone at `1.018×`, parented to the skin, with a velvet material
  (`sheen: 0.9`, `sheenRoughness: 0.92`, roughness 0.96) and a soft bump.
- **24 shell layers** in Plush (12 in Soft) at up to `1.14×`, no high-frequency colour map, low
  `alphaTest` ramp, light inner layers. This produces a thick fuzzy edge rather than painted strands.
- No guard hairs; the silhouette stays round and soft.

Velvet is the “หนานุ่ม” mode: fewer individual fibres, more cushion and sheen.

### VFX
The high-density strand groom, for comparison and for a more directional fur look:

- ~133k masked strands from a 190k desktop target (80k on screens under 800 px).
- Uniform random sphere roots; the earlier Fibonacci loop only covered the northern hemisphere.
- A custom `ShaderMaterial` with a Kajiya–Kay two-lobe specular, root-to-tip occlusion, fill and rim.
- **Undercoat/guard split** via a per-instance `aGuard` flag: most strands are short and matte, a
  minority are longer and glossier.
- **Clump field** via a per-instance `aClump` vector, so neighbouring strands bend into tufts.
- A **cream belly role** per instance instead of a body-mask hole.
- A dark undercoat beneath the strands.
- No decorative shells.

VFX is intentionally the most expensive mode (~1.6M triangles in six draw calls). It is optional.

### Film
A clean, sculpted feature-film CG coat — the smooth, filmic read without any trademarked name.
It removes the shells and strands entirely and treats the base
model as a smooth character maquette:

- **No shells, no strands, no cushion.** `buildFilmCoat()` leaves the smooth clay meshes.
- **Warm rim shell.** A six-vertex-shader copy of `body`, `belly`, `head-mesh` and both ears at
  `1.006×` with an additive fresnel (`pow(1 - dot(N, V), 3.2)`, strength `0.34`). It hugs the
  silhouette instead of forming a halo.
- **Two-light film rig.** A warm `#ffd2ab` rim point light behind-left and a cool `#a9c4ff` fill
  behind-right, added to the rig so they travel with the pet.
- **Glossier clay.** `main` drops to roughness `0.62`, `belly` to `0.72` while Film is active and is
  restored on exit.
- **Fluffy ear scallops (koala only).** Four flattened, surface-anchored lobes per ear at `0.9×`
  radius: enough to soften the ear rim without reading as beads.

Do **not** parent the rim shells to the rig group or scale them by more than ~1.01; the fresnel shell is
meant to sit on the skin. The Film material/light changes are tracked in `filmMaterials` and disposed
in `disposeFilm()`, so switching back to Pelt restores the original roughness and light count.

## Rooted attachment

All three outer modes are attached to the skin, not to an inflated bubble:

- Shells and cushions are children of the **source mesh** (`body`, `belly`, `head-mesh`, `ear-left`,
  `ear-right`, `tail`). Their local scale is just above 1.0.
- VFX roots are sampled in the source mesh's local space at `1.008×` and the InstancedMesh is parented
  to that mesh. Breathing, head tilts, ear wiggles and tail motion carry the coat with the skin.
- The VFX ribbon starts slightly inside the skin (`y = -0.06` in ribbon space) and rises through it, so
  the root is hidden rather than sitting on top.
- Root AO darkens the base of each strand.

Earlier versions used `1.2×` roots and parented the strands to the rig group; that is why the coat
looked like a floating halo and did not follow the body. Do not reintroduce either.

## Face and belly masks

Object-space masks keep the face and belly clear:

- **Head** — `if (vFurPos.z > 0.58) discard;` keeps the face clear.
- **Ears** — `if (vFurPos.z > 0.35) discard;` reveals the inner ear.
- **Body** — an oval window matching the belly patch is discarded for the shell coat. VFX additionally
  uses a cream `aRole` for the belly region so the chest is made of cream fibres.

## Uniform contract

`STRAND_UNIFORMS` keys must match the shader declarations exactly:

```js
const STRAND_UNIFORMS = {
  uTime, uBreeze, uLength, uCurl, uClump, uCursor
};
```

Earlier versions declared `uTime`/`uBreeze` in GLSL but stored `time`/`breeze` in the object. Three
silently left the uniforms at zero, so `transformed.y *= uLength` collapsed every strand into a dot.
That was the root cause of “the fur looks like brush strokes / dust.” Do not rename one side without the
other.

The VFX shader adds `aNormal`, `aSeed`, `aTint`, `aRole`, `aGuard` and `aClump` instanced attributes.

## Fur studio controls

| Control | State key | Range | Effect |
| --- | --- | --- | --- |
| Length | `fur.length` | 0.4–1.8 | strand height |
| Density | `fur.density` | 0.1–1 | shell visibility + strand count |
| Curl | `fur.curl` | 0–1 | sine bend along each strand |
| Clumping | `fur.clump` | 0–1 | coherent clump bends |
| Breeze | `fur.breeze` | 0–1 | shell micro-motion + strand wind + cursor push |

`state.coat` and `state.outer` are persisted. Presets include both. Share links use `f=` for the coat and
`v=` for the outer mode; old `f=vfx` links migrate to `f=plush&v=vfx`. `state.walk` is persisted but is
not part of share links.

## Species recipes

| Animal | Type | Signature coat |
| --- | --- | --- |
| Bear | fur shells | short dense brown coat, crown and ear fuzz |
| Bunny | fur shells | fine coat, long ear fringe, fluffy tail |
| Penguin | feather shells | short down on the dark body, clean white belly |
| Shiba | fur shells | double coat, cream chest, bushy curled tail |
| Koala | shells + outer | long silver coat in Pelt, soft cushion in Velvet, high-density groom in VFX, clean sculpt in Film |
| Sun Conure | feather shells | yellow-orange down, white eye patches, green layered wings |
| Scottish Fold | shells + outer | dense silver coat; Pelt, Velvet, VFX and Film outer modes |

## Performance

- Pelt Plush: 12 shells per zone + up to 100k strands, ~600k triangles.
- Velvet Plush: 24 shells per zone + 6 cushions, no micro-strands; heavier on draw calls, lighter on
  triangles.
- VFX Plush: ~133k strands × 7 rows ≈ 1.6M triangles, 6 draw calls; 80k on narrow screens.
- Film: five fresnel shells + two point lights, no coat geometry; the cheapest non-zero outer mode.
- Smooth removes every layer and rebuilds the plain clay body.
- All modes reuse the renderer, lights and controls; only the coat group is rebuilt.

## Tuning guide

- **Dust instead of fur:** the uniforms are zero, the roots are floating, or the strands are too short.
- **Wire wool:** width is too large or the coat is too long relative to the body.
- **Bare patches:** raise density or shells; check the face/belly masks.
- **Grainy/velvet speckle:** high-frequency bump/colour maps at small scale; prefer the velvet cushion
  and light shell layers.
- **Fur ball:** roots are too far out or every strand has the same length. Root at ~1.008 and split
  undercoat/guard.
- **Coat detaches when breathing:** the mesh is parented to the group instead of the skin.
- **Film shell halo:** the fresnel scale is too large or the strength is above ~0.4; keep it at 1.006
  and 0.34.

## Why not a shadow pass yet

The current VFX mode uses root AO and a dark undercoat instead of a full hair shadow map. A 133k-strand
depth pass would double the geometry cost, and the static page is already at the GPU budget. A future
step is a low-resolution guard-hair shadow proxy.
