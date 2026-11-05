# Contributing

Thanks for considering a change. This is a small, deliberate codebase; the best contributions are
focused and verified.

## Setup

```bash
git clone https://github.com/somphol/cute3d-animal-studio.git
cd cute3d-animal-studio
python3 -m http.server 4173     # no install, no build
```

Node 20+ is only needed for tests and scripts. Chrome is needed for the browser suite; set `CHROME` if
it is not in a standard location.

## Before opening a pull request

```bash
npm test
npm run test:browser
npm run shots        # if the visuals changed
```

All four suites must pass. If you change a documented count, update the README table and
`docs/TESTING.md`; never change a claim to match a failure.

## Rules

1. **No external art.** No `.glb/.gltf/.obj`, textures, HDRIs, audio files or icon fonts. Primitives and
   oscillators only.
2. **Original characters.** Do not add or reference third-party mascots, franchises or recognizable
   designs.
3. **Keep the engine pure.** Nothing between `ENGINE:START` and `ENGINE:END` may reference `document`,
   `window`, `THREE`, `localStorage` or imports.
4. **Sanitize untrusted input.** Presets and URL share state must pass through the engine sanitizers.
5. **Update both languages.** Every user-facing string goes into both `en` and `th`; parity is tested.
6. **Respect reduced motion.** New animation must degrade under `prefers-reduced-motion`.
7. **No trackers.** No analytics, pixels, remote fonts or telemetry.
8. **Update the handoff.** If behaviour or constraints change, update `AGENTS.md` in the same PR.

## Style

- Vanilla ES2022 modules, 2-space indent, single quotes, semicolons.
- Descriptive names, early returns, no classes except the audio engine.
- Prefer functions over configuration; keep the three-file structure.
- Comments explain *why*, not *what*. Do not add banner comments to every function.
- CSS custom properties for new colours; no one-off hex in components.
- Name meshes (`name: 'eye-left'`) when tests or debugging benefit.

## Commit messages

Imperative, scoped, short:

```
feat(animation): add double-blink cycle
fix(snapshot): use dedicated camera to preserve orbit
docs(reproduction): document accessory anchors
test(browser): assert Thai panel labels
```

## Reporting bugs

Use the issue template ideas in [SUPPORT.md](SUPPORT.md). Include the browser, OS, what you expected,
what happened, and the console output. For rendering bugs, a screenshot helps.

## Licence

By contributing you agree that your work is licensed under the MIT licence of this repository.
