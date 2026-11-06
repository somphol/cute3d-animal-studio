# Changelog

All notable changes to Cute3D are documented here. The format follows Keep a Changelog and the project
uses semantic versioning.

## [1.5.0] — 2026-11-05

### Added

- **VFX coat mode (koala only).** A fourth coat level builds a high-density strand groom (~133k strands after masks, 190k target on desktop, 80k on small phones) with:
  - tangent-plane flow and per-strand seed/tint/role attributes;
  - a custom Kajiya–Kay two-lobe specular shader with root-to-tip occlusion, fill light and rim;
  - a per-instance cream belly role instead of a hard body-mask hole;
  - a dark undercoat shell, no brush-stroke shells.
- The existing Plush mode remains the balanced strand + shell coat; Soft remains the light version.
- VFX is disabled for non-koala animals and falls back to Plush.
- New `assets/screenshot-koala-vfx.png` release asset.

### Changed

- Sampling for the VFX groom uses uniform random sphere roots; the previous Fibonacci loop only covered the northern hemisphere, leaving the lower body bare.
- Release metadata, docs, AGENTS handoff, screenshots and test counts synced to 1.5.0.

## [1.4.0] — 2026-11-05

### Fixed

- **Strand fur uniforms now match the GLSL.** `STRAND_UNIFORMS` stored `time/breeze/length/curl/clump/cursor` while the shader declared `uTime/uBreeze/...`, so Three left them at zero and every strand collapsed along Y into a dot. This was the root cause of the brush-stroke / dust look and the wind smearing.
- Shell wind gain reduced to `0.008` (feather) / `0.025` (fur) so high breeze no longer stretches alpha cutouts into paint-like streaks.
- Koala inner ears are no longer buried under the coat.

### Changed

- **Real-fur pass.** The koala now uses up to 100,000 opaque, depth-writing strand ribbons with a tangent-plane flow field, root-to-tip shading, and visible wind; its shells use a fine 512² fibre texture plus a colour map and bump.
- Other six animals use layered plush/feather shells only, keeping the soft toy silhouette and mobile budget.
- Density now controls shell layer visibility as well as koala strand count.
- Coat docs, architecture, animation, AGENTS handoff, screenshots and release metadata synced to 1.4.0.

## [1.3.0] — 2026-11-05

### Added

- **Movable wind fan:** a procedural pedestal fan that can be dragged around the stage. The fan defines
  the wind vector; blades spin with the wind slider.
- **Wind-driven shell fur:** koala fur shells bend by layer², gust, flatten on the windward side, and
  use an arc/stiffness correction so the coat does not stretch.
- **Cursor disturbance:** pointer movement pushes nearby fur away from the touch point.
- `fanAngle` persistence and the ability to set/test the fan direction through the debug API.

### Changed

- Wind slider label clarified; fan hidden from transparent snapshots.
- Release version 1.3.0.

## [1.2.0] — 2026-11-05

### Added

- **Species postures:** seated bear, alert bunny, leaning penguin, shiba on haunches, koala reaching up,
  conure on a wooden perch and a Scottish Fold loaf.
- **GPU strand fur:** up to 60,000 tapered ribbon strands per character, layered outside the shells.
  Vertex-shader breeze, curl, clumping, length and cursor push; feet stay planted during idle.
- **Fur studio controls:** length, density, curl, clumping and breeze sliders, persisted and shared.
- **Lighting moods:** Studio, Cloud Sky (drifting procedural clouds) and Cozy Desk (wood table, mug,
  plant, books, warm exposure), with CSS backdrop variants.
- **Cuteness pass:** +8% heads, +12% eyes, second catchlights, rounder bodies, warmer marshmallow palettes.

### Changed

- Coat shells reduced to 4 Soft / 8 Plush layers so the strand layer reads; texture disposal fixed.
- Browser suite 25 checks; in-page 20. Release version 1.2.0.

### Fixed

- Feet counter-translate the idle bob instead of floating off the ground.
- Conure perch sits under the feet instead of crossing the body.
- Fold arm shadows no longer draw an H on the chest.

## [1.1.0] — 2026-11-05

### Added

- Three new original characters: **Kumo the Koala**, **Sol the Sun Conure** and **Biscuit the Scottish
  Fold**, each with a distinct silhouette, palette, coat recipe and signature feature.
- A **Coat detail** toggle with Smooth / Soft / Plush levels, persisted, included in presets and share
  links (`f=`). Plush can add up to 60 fur/feather shells per character.
- Procedural fur and feather shells with canvas-generated strand alpha textures, bump relief, face/ear/
  belly masks and a live fibre count. Zero asset files.
- New signature geometry: koala ears with cream inner ear, layered conure wings with lime coverts and a
  blue-green tail fan, and folded Scottish Fold ears with whiskers.
- `docs/COAT.md`, three new character stills, refreshed existing stills and an updated OG card.

### Changed

- Character selector, presets, share state and selftest now cover seven animals.
- Verification: 19 engine, 80 repository, 24 browser and 20 in-page checks; README/docs updated.
- Release version 1.1.0.

### Fixed

- Fur does not cover the face, inner ears or cream belly (object-space shader masks).
- Coat materials recolour live with the fur/belly/blush pickers.
- Shared fur geometry and accessory materials survive rig switches.

## [1.0.0] — 2026-11-04

### Added

- Four original code-only characters: Chibi Bear, Bunny, Penguin and Shiba, 19–29 meshes each.
- Three.js studio with PCF soft shadows, hemisphere/key/fill/rim lighting, ACES tone mapping, a pastel
  pedestal, contact shadow and three drifting props.
- Damped OrbitControls with restricted polar angle and zoom range.
- Idle breathing, float, ear wiggle, tail wag, deterministic blink with occasional double blink and a
  penguin waddle.
- Click/tap raycast reaction: jump, spin, squash-and-stretch and a 22-point sparkle burst.
- Four expressions (happy, sleepy, curious, wiggle) with damped transitions.
- Live fur/belly/blush colour pickers, five curated palettes and reset.
- Bowtie, party hat and glasses, head-anchored so they follow tilt and nod.
- Six synthesized Web Audio patterns with a lazy context, compressor and persistent mute.
- Complete English/Thai UI (93 keys), Thai font stack, live `<html lang>` and metadata.
- Local studio persistence, ten sanitized presets, and share links that encode the whole look.
- 2048² transparent PNG snapshot with a dedicated square camera and hidden studio props.
- Responsive layout with a mobile customizer sheet, keyboard shortcuts and reduced-motion support.
- Verification: 19 engine, 76 repository, 23 browser and 19 in-page checks; zero console errors.
- Documentation set, reproduction guide, generated screenshots and a 1200×630 OG card.
- GitHub Pages deployment and a reusable OpenCode skill.

### Fixed during the build

- Accessory anchors were re-parented to the animal group and appeared at waist height; they now stay
  under the head.
- Belly and face patches sat inside the body shell and were invisible; all patches moved forward.
- Penguin eyes were covered by the face patch; eyes and brows moved to z 0.72/0.70.
- Cheek animation reset mesh scale to 1; it now multiplies the stored base scale.
- Shared accessory materials were disposed with a rig; they are now marked shared.
- Snapshot capture reset the user's orbit; it now uses a dedicated camera.
- Mobile hint chip overlapped the Customize button; the HUD moved above it.
- Penguin party hat hid the eyes; the hat anchor moved slightly forward.

## Unreleased

- Nothing yet. See [docs/ROADMAP.md](docs/ROADMAP.md).
