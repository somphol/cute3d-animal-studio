# FAQ

**Is this really code-only?**
Yes. There are no `.glb`, `.gltf`, `.obj`, image textures, HDRIs, audio files or icon fonts. The only
binary assets are the SVG favicon and the PNG screenshots/OG card used for the repository and social
preview. The app itself draws the animals from spheres, capsules, cones and torus arcs.

**How are the animals made?**
Each is a `THREE.Group` of 19–50 meshes with a shared material set. Body, head, ears, eyes, muzzle,
cheeks, limbs and tail are primitives. Accessories are separate groups attached to head/neck anchors.
See [ARCHITECTURE.md](ARCHITECTURE.md) and [REPRODUCTION.md](REPRODUCTION.md).

**Can I use it commercially?**
The code is MIT. The character designs are original to this project. You may use, modify and sell
derivatives; attribution is appreciated but not required. Do not add third-party characters.

**Why seven animals and not more?**
Seven gives a broad selector without diluting the craft: four classics plus a koala, a sun conure and
a Scottish Fold. Adding another requires a builder, a palette, coat zones, dictionary entries, a mesh
count and a test update; the pattern is documented in [REPRODUCTION.md](REPRODUCTION.md).

**Does it work offline?**
After the Three.js CDN files are cached, yes, but there is no service worker. A future version could
bundle Three.js and add one.

**Why does the first load need jsDelivr?**
The project avoids a build step and npm dependencies. The import map pins Three.js `0.169.0`; nothing
else is fetched.

**Are my presets uploaded?**
No. They live in `localStorage` under `cute3d:presets:v1`. Share links put the look in the URL, not on
a server. See [PRIVACY.md](PRIVACY.md).

**Why is the PNG transparent but the shadow still visible?**
The export uses alpha 0 and hides the pedestal and decorative props, but keeps the contact shadow for
grounding. The shadow is a `ShadowMaterial`, which is partly transparent by design.

**Why are hats and glasses attached to the head?**
So they follow head tilt and nodding. Parenting them to the animal group detached them and made them
float at waist height — see the pitfalls table in [REPRODUCTION.md](REPRODUCTION.md).

**Sound does not play on first load.**
Browsers require a user gesture before `AudioContext` starts. The first click or tap does it; the
context is created lazily and never on page load.

**How do I reset everything?**
Use **Reset** for colours, or clear site data for the full studio. Console:
`localStorage.removeItem('cute3d:state:v1'); localStorage.removeItem('cute3d:presets:v1'); location.reload()`.

**Why Thai?**
The project is bilingual by design and treats Thai as an equal, not an afterthought: the dictionary is
parity-tested and the panel uses a Thai font stack.

**Can I add my own character?**
Create a builder returning the rig contract in `script.js`, add it to `BUILDERS`, `ANIMALS`,
`DEFAULT_COLORS`, the animal grid and both dictionaries. Update the mesh-count and animal tests. The
reproduction guide lists the exact contract.

**Why is the panel cut off on a laptop?**
It scrolls. At 800 px height, "Saved presets" is below the fold. Scroll inside the panel.

**What is `state.json`?**
A build record: session elapsed time, token usage, model/provider, artifact list and line counts. It is
not used at runtime. The static suite validates its shape and line counts.
