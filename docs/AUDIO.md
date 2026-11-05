# Audio

All sound is synthesized with the Web Audio API. The repository contains no audio files, and the
static test fails if `.mp3`, `.wav`, `.ogg` or `.m4a` ever appear.

## Graph

```
oscillator → per-note gain (attack 12ms, exponential release)
           → master gain (0.62)
           → DynamicsCompressor (threshold −18, knee 18, ratio 5)
           → destination
```

The `AudioContext` is created lazily inside the first user gesture. Nothing starts on page load, so
browsers never block or warn. Muting sets the master gain to 0; it does not destroy the context.

## Patterns

Defined in the engine as `soundPattern(kind)` and deep-copied per call.

| Kind | Gain | Notes |
| --- | --- | --- |
| `boing` | 0.20 | sine 170→520 Hz 0.13 s; triangle 520→280 Hz 0.40 s; sine 1400→900 Hz 0.08 s |
| `chime` | 0.14 | triangle A5 0.22 s; triangle D6 0.24 s at +0.07; sine G6 0.42 s at +0.14 |
| `blink` | 0.05 | sine 1500→700 Hz 0.07 s |
| `pop` | 0.10 | triangle 420→780 Hz 0.11 s |
| `wiggle` | 0.11 | sine 660→990 Hz 0.10 s; sine 990→1320 Hz 0.12 s at +0.09 |
| `swoosh` | 0.06 | sawtooth 220→90 Hz 0.30 s (reserved) |

Frequencies use `exponentialRampToValueAtTime` with a floor of 30 Hz. Gains use an exponential
approach to 0.0001 to avoid clicks; the attack is 12 ms.

## Event map

- **React** → `boing`; a burst of sparkles is visual only, not sonified.
- **Character switch, preset apply, snapshot, un-mute** → `chime`.
- **Expression, colour, accessory, palette, language, reset** → `pop`; `wiggle` gets its own chirp.
- **Blink** → soft tick, capped at one every 2.4 s.

## Accessibility

- Sound defaults on but is easy to mute from the topbar and the panel; the preference persists.
- Every sound is decorative. All state changes are also announced with visible text/toasts.
- The level is deliberately low (0.62 master) and compressed, so repeated boings do not clip.
- Headless tests launch Chrome with `--mute-audio`; the context still initialises without errors.

## Why no samples

Samples would add binary assets, licensing questions and load time for six very short sounds. The
oscillator patterns are also trivially testable in Node: the engine test asserts note shape and that
patterns are copies, not shared mutable state.
