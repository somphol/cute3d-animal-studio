# Coat system: fur and feathers

The studio ships two coat modes on top of the smooth base models. They are generated at runtime;
nothing is downloaded and no texture files exist in the repository.

## Levels

| Level | What it does | Typical load |
| --- | --- | --- |
| **Smooth** | No shells. The original clay look. | 34–42 meshes |
| **Soft** | 5 shell layers per coat zone, sparse alpha strands. | 70–90 meshes |
| **Plush** | 10 layers, thicker offset, denser strand texture. | 85–110 meshes |

The choice is stored in `state.coat`, persisted, included in presets and encoded in share links as
`f=off|soft|plush`. The self-test asserts that Plush produces more fibres than Soft and that Smooth
removes the coat entirely.

## How a coat is built

1. Each character declares coat zones in `COAT_CONFIG`: a source mesh (`body`, `belly`, `head-mesh`,
   `ear-left`, `cheek-right`, `tail`), a colour role, a shell count and a face mask.
2. For each zone, the source mesh is cloned N times. Every clone is scaled from `1.004` to
   `1.004 + thickness`, so the layers sit just above the skin.
3. Each shell uses a **procedural alpha texture** generated on a `<canvas>`: thousands of short,
   tapered strands for fur, and layered scalloped barbs for down feathers.
4. The same canvas is reused as a **bump map** to give the coat subtle fibre relief.
5. Outer shells have a higher `alphaTest`, so they become sparser and produce a soft, feathered
   silhouette instead of a hard rim.
6. Color comes from the active role (`main`, `belly`, `blush`, `inner`, `accent`) and is refreshed when
   the colour picker changes. Outer layers are 2–4% lighter for depth.

## Face and belly masks

A fur sphere would otherwise cover the eyes and the cream belly. Shell materials inject a small GLSL
discard at the top of the fragment shader:

- **Head** — `if (vFurPos.z > 0.58) discard;` keeps the face clear.
- **Ears** — `if (vFurPos.z > 0.35) discard;` reveals the pink/cream inner ear.
- **Body** — an oval window matching the belly patch is discarded, so the chest stays cream.
- Other zones are unmasked.

Masks are in object space, so they survive scaling and animation. This is why the head and body are
cloned rather than re-generated.

## Species recipes

| Animal | Type | Signature coat |
| --- | --- | --- |
| Bear | fur | short dense brown coat, crown and ear fuzz |
| Bunny | fur | fine coat, long ear fringe, fluffy tail |
| Penguin | down | short feather down on the dark body, clean white belly |
| Shiba | fur | double coat, cream chest, bushy curled tail |
| Koala | plush fur | long silver coat, huge fuzzy ears with cream inner ear |
| Sun Conure | feathers | yellow-orange down, white eye patches, green layered wings, blue-green tail |
| Scottish Fold | plush | dense silver coat, cream chest, folded flap ears, whiskers |

## Performance

- Shells are **opaque with alpha test**, not transparent, so they sort correctly and avoid blending
  cost.
- Each shell is a clone of an existing low-poly mesh; the geometry is shared and only the material is
  new.
- Plush adds up to 60 shell draw calls. The renderer stays inside a 16 ms frame on desktop and a
  mid-range phone; shells do not cast shadows.
- Switching coat levels disposes the old shell materials. Shared geometry is never disposed.
- Snapshot capture includes the coat; it is the same scene rendered at 2048².

## Tuning guide

- **Too spiky / wire-like:** increase `alphaTest` contrast, use softer strand textures, or lower
  `thickness`. Avoid adding solid cone strands; the shell approach exists because they read as wire.
- **Bare patches:** increase shell count, raise the base scale from `1.004`, or lower `alphaTest` on
  inner layers.
- **Fur on the face:** tighten the head mask (`z > 0.52` removes more).
- **Colour does not follow the picker:** call `refreshCoatColors(rig)` after changing materials; the
  coat stores role materials in `rig.fluffMaterials`.
- **New animal:** add a palette, a builder, a `COAT_CONFIG` entry, dictionary keys and a distinct base
  mesh count. The shell generator works from mesh names, so name the ears, cheeks and tail clearly.

## Why not instanced strands or particles

Three earlier prototypes were tested during the build: solid cone strands (read as wire), camera-facing
fuzz particles (read as dust), and alpha cards (fragmented at small sizes). Layered shells with a
procedural strand alpha gave the most convincing plush silhouette for the lowest draw-call cost at this
stylised scale. They also survive the transparent PNG export without sorting artifacts.
