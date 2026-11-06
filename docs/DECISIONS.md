# Decisions

Short records of choices that are easy to undo accidentally.

## ADR-001 — Code-only characters, no model files

**Decision:** Build every mesh from Three.js primitives at runtime.
**Why:** The brief demands zero assets and the app must remain a single static tree. A 20–30 mesh rig
per animal is small, fast, easy to recolour and impossible to break with a missing file.
**Cost:** Geometry tuning is manual; a glTF artist would iterate faster.
**Do not:** Add a loader or a `.glb` fallback. The static suite rejects model extensions.

## ADR-002 — CSS backdrop, transparent WebGL canvas

**Decision:** The pastel studio is CSS; the renderer clears to alpha 0.
**Why:** The same canvas can produce an opaque-looking studio and a transparent PNG without a second
render path.
**Do not:** Set `scene.background` to a colour. It would tint every snapshot.

## ADR-003 — Pure engine block, sliced by tests

**Decision:** All maths and validation live between `ENGINE` markers with no DOM/THREE imports.
**Why:** Node can test blinks, palettes and sanitising in 300 ms, and the in-page self-test can reuse
the same functions.
**Cost:** The file is not a normal module boundary. A future refactor could extract `engine.js`, but
that would weaken the single-file story.

## ADR-004 — Per-animal palettes

**Decision:** Each animal stores its own `{main, belly, blush}`; switching preserves per-animal edits.
**Why:** A lilac bunny should not force a lilac bear. It also makes presets self-contained.
**Do not:** Collapse this to one global palette.

## ADR-005 — Presets capped at 10, sanitized on every read

**Decision:** `sanitizePresets` clamps, dedupes and validates. Invalid animals are dropped.
**Why:** `localStorage` is user-editable and shared across app versions; never trust it. Ten keeps the
panel manageable and the payload small.

## ADR-006 — Share state in the query string

**Decision:** `?a=&c=&x=&o=&l=`, short and human-readable.
**Why:** No backend, no shortener, no storage. It also gives tests a deterministic round-trip.
**Do not:** Base64-encode the whole state; it hides errors and inflates the URL.

## ADR-007 — Dedicated snapshot camera

**Decision:** Render snapshots with a separate camera and hide studio props.
**Why:** Reusing the main camera forced a resize, which reset the user's orbit and captured the
pedestal. A fixed square composition is more useful as an export.
**Do not:** Call `resize()` after capture.

## ADR-008 — Native colour inputs

**Decision:** Use `<input type="color">` rather than a custom HSV wheel.
**Why:** Accessible, keyboard-friendly, OS-localized and zero code. The hex readout gives precision for
anyone who needs it.
**Trade-off:** Styling is limited and varies by browser; the swatch frame is styled but the picker is
native.

## ADR-009 — No build step, no npm runtime dependencies

**Decision:** ES modules + import map + pinned CDN.
**Why:** Clone and serve. Reviewers can read the source. Tests need only Node and Chrome.
**Trade-off:** First load needs the CDN; no tree shaking or minification.

## ADR-010 — Dependent-free CDP test harness

**Decision:** Talk to headless Chrome over the DevTools Protocol with the built-in `WebSocket`.
**Why:** Puppeteer/Playwright add hundreds of megabytes and browser downloads. The harness is ~170
lines and works on macOS and Linux CI.
**Trade-off:** Slightly more manual waiting and event handling.

## ADR-011 — Thai and English as equals

**Decision:** The dictionary is a first-class pair, parity-tested; Thai gets its own font stack.
**Why:** The author's audience is bilingual. Machine-translated labels crammed into an English layout
look broken; the panel is sized for Thai's longer strings.
**Do not:** Add a language without adding parity tests.

## ADR-012 — Sound synthesized, not sampled

**Decision:** Six oscillator patterns, lazy context, compressor.
**Why:** No binary assets, tiny code, predictable tests, no licensing.
**Trade-off:** Less character than recorded Foley, but consistent with the code-only mandate.

## ADR-013 — Generic, original character language

**Decision:** Button eyes, blush, rounded muzzles and simple accessories only.
**Why:** These are universal toy conventions. No third-party silhouettes, palettes or names are used.
**Do not:** Add "cute" references to known mascots in code, docs or marketing.

## ADR-015 — Fur and feathers are layered shells

**Decision:** Build coats by cloning each fur zone 5 or 10 times, scaling outward, and applying a
canvas-generated strand alpha plus bump map. Mask the face, inner ears and belly in object space.
**Why:** Solid strands read as wire, particles as dust and small alpha cards as paper shards. Shells
give a soft silhouette with opaque, sortable draw calls and no external textures.
**Cost:** ~50–100 extra draw calls at Plush and a modest switch cost.
**Do not:** Reintroduce cone strands as the primary coat. Add new species through `COAT_CONFIG`, not by
hard-coding hair in a builder.

## ADR-016 — Seven characters, one primitive language

**Decision:** Add Koala, Sun Conure and Scottish Fold by extending the same rig contract and palette
system rather than adding special-case scene code.
**Why:** The selector, recolouring, accessories, expressions and tests all work unchanged. Each new
animal has one signature feature (koala ears, conure wings/tail, folded ears) while sharing eyes,
blush and muzzle grammar.

## ADR-018 — Shells plus shader strands

**Decision:** Keep the soft shell coat and add a separate koala-only GPU strand layer (up to 100k ribbons) for
visible fibre and wind/cursor physics. All motion is vertex-shader work; there is no CPU simulation.
**Why:** Shells alone read as plush but not furry; strands alone read as wire or dust. Together they
give a soft body and directional fibre at a predictable cost.
**Do not:** Add per-strand CPU physics, rebuild strand geometry on every density change, or remove the
shell masks.

## ADR-019 — Species posture is part of the model

**Decision:** Pose each animal at build time (sit, alert, lean, perch, loaf) instead of animating a
generic standing rig.
**Why:** Silhouette is the strongest cuteness cue. Posture runs before coat generation so fur follows
the limbs, and base rotations feed the idle animation rather than being overwritten.

## ADR-020 — Verification is part of the product

**Decision:** Four layers, a self-test route, regenerated screenshots and a state file.
**Why:** A visual toy is easy to break silently. The tests cover the contracts that are hard to see:
transparency, persistence, i18n parity, accessory parenting and IP hygiene.
