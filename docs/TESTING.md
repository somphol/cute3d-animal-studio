# Testing

Four independent layers, all runnable offline except the CDN fetch Three.js needs.

| Layer | Command | Count | What it proves |
| --- | --- | --- | --- |
| Engine | `node --test tests/engine.test.mjs` | 19 | Math, palettes, validation, share format, dictionary parity |
| Repository | `node --test tests/static.test.mjs` | 84 checks | Files, HTML shell, i18n coverage, IP hygiene, metadata, state |
| Browser | `node tests/browser.test.mjs` | 25 | Real WebGL, seven rigs, coats/fur, lighting moods, interaction, persistence, export, mobile |
| In-page | `/?selftest` | 20 | The deployed build can inspect itself |

Run everything:

```bash
npm run verify
```

## Engine layer

No DOM, no Three.js. `tests/lib/fixtures.mjs` slices the `ENGINE` block out of `script.js` and evaluates
it with `new Function`. It covers:

- animal/expression/accessory lists and complete default palettes;
- hex normalisation (`#ABC` → `#aabbcc`), rejection of junk, mixing and shading;
- blink: range, at least one closed frame and many open frames, determinism, seed stagger;
- all four expression poses with every numeric field;
- preset sanitising: rejects unknown animals, fills defaults, trims/caps names, caps at 10, dedupes;
- snapshot filename path safety (`../etc/passwd` → `cute3d-pet-…`);
- share encode/decode round-trip and safe fallback for invalid input;
- sound pattern shape and copy semantics;
- snapshot size clamping;
- EN/TH dictionary parity and non-empty values.

## Repository layer

Reads the actual files and fails on drift:

- required source, docs, screenshots and licence files exist and are not tiny;
- title/description/viewport, pinned Three.js version, no insecure URLs;
- no duplicate ids, every `<button>` has a `type`, no inline handlers, safe external links;
- every `data-i18n`, `data-i18n-aria` and runtime `t('key')` resolves in English;
- no `.glb/.gltf/.fbx/.obj/.stl/.mp3/.wav/.ogg/.m4a/.hdr/.exr` anywhere;
- no analytics, no `eval`, no `new Function` in the browser app;
- a trademark blocklist for known character IP;
- engine/i18n markers, storage namespace, self-test and snapshot contracts;
- skip link, focus-visible, reduced motion, Thai font, `aria-pressed` counts;
- manifest, robots/sitemap agreement, `state.json` shape and **line counts**;
- README credit lines, AGENTS section headings, MIT licence.

## Browser layer

A dependency-free Chrome DevTools Protocol harness starts a local static server on a random port and a
headless Chrome with:

```
--headless=new --use-mock-keychain --password-store=basic --disable-sync --mute-audio
--remote-debugging-port=… --user-data-dir=<temp>
```

`--use-mock-keychain` is important: it prevents macOS Keychain prompts during automated runs. No
Puppeteer, Playwright, Selenium or npm packages are involved.

The suite checks:

1. canvas exists with a sensible size, loading overlay gone;
2. default bear with > 25 meshes;
3. all seven characters switch and have distinct mesh counts;
4. `aria-pressed` follows the active animal;
5. the coat toggle builds shells, removes them and scales the fibre count;
6. fur sliders change the strand count and persist; lighting presets switch moods;
7. sleepy closes the eyes and happy reopens them;
8. a palette applies all three colours;
9. a colour-input event recolours the live material and hex label;
10. all three accessories build and toggle;
11. the language switch translates names and panel, persists the key;
12. presets save to `localStorage` and the DOM;
13. preset apply switches animal and restores the look;
14. presets clear;
15. React starts a jump and settles after 0.92 s;
16. a real mouse tap on the canvas triggers the raycast reaction;
17. a snapshot is 1024², transparent in the corner, opaque in the centre;
18. the snapshot button downloads a correctly named file;
19. the share URL encodes current state and decodes back;
20. keyboard `2` switches to the bunny;
21. state survives a reload;
22. the mobile sheet opens and closes with correct `aria-expanded`;
23. reduced motion still renders;
24. the in-page self-test passes 20/20;
25. there are zero console errors.

### Live run

```bash
TEST_URL=https://somphol.github.io/cute3d-animal-studio/ node tests/browser.test.mjs
```

The same 26 checks must pass against Pages. Transparent snapshot and download checks work there too.

## In-page self-test

`/?selftest` builds all seven rigs, renders a 512² snapshot, validates dictionary parity, sanitisation
and share round-trips, then prints a 20-row report and sets `window.__selftest`.

```
{
  passed: 20,
  total: 20,
  results: [{ name, ok, detail }],
  at: "2026-11-04T…"
}
```

It is deliberately conservative: it never touches `localStorage` or the network.

## Screenshots as tests

`scripts/screenshot.mjs` regenerates every PNG from the real render, including the OG card. If a rig
regresses visually, the assets show it. Re-run and commit the new images with any visual change.

## Debugging tips

- The fastest loop is `python3 -m http.server 4173` plus DevTools; the engine and static suites take
  under 300 ms.
- Use `window.__cute3d.getRig()`, `.meshCount()`, `.reaction()` and `.snapshotDataUrl()` in the console.
- If the browser suite cannot find Chrome, set `CHROME=/path/to/executable`.
- If a snapshot check fails, verify the renderer was created with `alpha: true` and that the snapshot
  clears alpha to 0 (not white).
- If presets do not persist, check for a `localStorage` quota/private-mode error; the app fails soft.
