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
| Elapsed | **8h 54m 34s** wall clock (32,074 s), including a pause between releases |
| First release | **30m 15s** (1,815 s) for v1.0.0 |
| Tokens | **64,025,542 cumulative** |

The session spans two releases with a long pause between them. v1.0.0 built the studio, four pets,
animation, audio, bilingual UI, export, tests, docs, Pages and the skill in 30m 15s. v1.1.0 added the
koala, sun conure and Scottish Fold plus the Smooth/Soft/Plush coat system, refreshed every asset and
doc, and re-verified the live site. No pre-existing template or project was copied. The cumulative
token total is dominated by cache reads, which are repeated prompt context rather than new output.

| Token counter | Count |
| --- | --- |
| Input | 742,854 |
| Output | 191,675 |
| Reasoning | 128,192 |
| Cache read | 62,961,152 |
| Cache write | 1,669 |
| **Total** | **64,025,542** |

`costUSD` is 0 on the flat-rate plan. The authoritative, machine-readable record is
[`../state.json`](../state.json); it also lists line counts, tests and every artifact.

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

All seven characters, their names, proportions, palettes, accessories and the studio art direction were
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
