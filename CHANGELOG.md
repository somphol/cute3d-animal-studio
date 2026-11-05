# Changelog

All notable changes to Cute3D are documented here. The format follows Keep a Changelog and the project
uses semantic versioning.

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
