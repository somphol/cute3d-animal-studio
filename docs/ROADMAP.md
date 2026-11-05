# Roadmap

## Shipped — 1.0.0

- Four original procedural animals with distinct silhouettes
- PCF soft-shadow studio, pedestal and decorative props
- Idle breathing, float, blink (incl. double blink), ear/tail motion, penguin waddle
- Jump-and-spin reaction with sparkles and a synthesized boing
- Four expressions with damped transitions
- Three live colours, five palettes, reset
- Bowtie, party hat and glasses with head-anchored transforms
- Six Web Audio patterns, persistent mute
- Full EN/TH UI, parity-tested, persisted
- Local presets (max 10), share links, 2048² transparent PNG
- Reduced motion, keyboard shortcuts, skip link, aria states
- 19 engine + 75 static + 23 browser + 19 in-page checks
- Docs, screenshots, OG card, GitHub Pages deployment

## Next — 1.1

- [ ] Offscreen `WebGLRenderTarget` snapshot, removing `preserveDrawingBuffer`
- [ ] Per-animal hidden text description for screen readers, updated on change
- [ ] Service worker + bundled Three.js for true offline use
- [ ] Optional GIF/WebM turntable export (MediaRecorder)
- [ ] Remember the last camera orbit in `sessionStorage`
- [ ] Rotate/zoom keyboard controls for the canvas

## Later — 1.2+

- [ ] Fifth character (a round frog) built from the same primitive kit
- [ ] Accessory colour variants without adding files
- [ ] Named preset editing/renaming
- [ ] URL length guard + short-link preview
- [ ] Localization: Japanese and Simplified Chinese
- [ ] Downloadable "studio card" with background for social sharing

## Explicit non-goals

- Accounts, cloud sync or a backend
- Importing glTF/OBJ or user images
- Third-party licensed characters or mascot lookalikes
- Physics engines, cloth, fur shells or ray-traced reflections
- Ads, analytics, tracking pixels or newsletter modals

Ideas are welcome as issues, but the code-only, static, privacy-first constraints are not negotiable.
