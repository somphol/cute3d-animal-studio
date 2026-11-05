# Credits

## The build

| | |
| --- | --- |
| Project | Cute3D: Procedural Code-Only Animal Studio |
| Author | Somphol Boonjing |
| Built with | **OpenCode** — <https://opencode.ai> |
| Model | **DeepSeek V4.1 Flash** (`deepseek-v4.1-flash`, provider `opencode-go`) |
| Session | `ses_e55af5b0bffejTt8i56ugdjBHf` |
| Date | 4–5 November 2026 (America/Los_Angeles) |
| Elapsed | see `state.json` |
| Tokens | see `state.json` |

The full session was one continuous build: specification, scene, four rigs, animation, audio, UI,
tests, documentation, assets, deployment and the reusable skill. No pre-existing template or project
was copied. The token total is dominated by cache reads, which are repeated prompt context rather than
new output.

## Runtime

- **Three.js 0.169.0** — MIT — <https://threejs.org>
  loaded from jsDelivr with an import map.
- **OrbitControls** from the Three.js examples, same licence.
- No other runtime libraries. No fonts, icons, models, textures or audio files.

## Type

System font stacks only: Nunito / Avenir Next Rounded / Quicksand / ui-rounded for Latin, and
Noto Sans Thai / Sukhumvit Set / Thonburi for Thai. Nothing is downloaded.

## Tools

- Node.js 20+ for the test harness and scripts.
- Headless Google Chrome over the Chrome DevTools Protocol for browser tests and screenshots.
- macOS Keychain was never queried by the test harness: Chrome runs with `--use-mock-keychain`.

## Design originality

All four characters, their names, proportions, palettes, accessories and the studio art direction were
created for this project. The design language — button eyes, blush, rounded muzzles, a pastel clay
studio — is generic toy vocabulary, not a reference to any existing mascot or franchise. The static
test suite includes a blocklist for protected character names as a guard.

## Reuse

The written guide for rebuilding this project is in [REPRODUCTION.md](REPRODUCTION.md). The packaged
skill lives at `~/.config/opencode/skills/cute3d-animal-studio` and is mirrored to
<https://github.com/somphol/opencode-skills>.

## Licence

Code and original designs: MIT © 2026 Somphol Boonjing. See [../LICENSE](../LICENSE) and
[../THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md).
