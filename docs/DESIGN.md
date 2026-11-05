# Design

## Direction

A soft-clay photo studio for pocket-sized characters. Warm cream paper, a rose/lavender wash, a
powder-pink pedestal and glassy control surfaces. The 3D subject is always the brightest, most
saturated thing on screen; the interface recedes into frosted white.

Three adjectives drove every decision: **huggable, hand-made, honest**. Honest means no fake product
photography: what you see is a live WebGL render, and the screenshots in `assets/` are captured from
that render.

## Tokens

| Token | Value | Use |
| --- | --- | --- |
| `--cream` | `#fff8f3` | page base |
| `--ink` | `#352a2e` | primary text, dark buttons |
| `--ink-soft` | `#6c5c61` | secondary text |
| `--ink-faint` | `#a19096` | notes, inactive labels |
| `--rose` | `#ff9db6` | blush accents, primary action |
| `--rose-deep` | `#e8789a` | links, active outlines |
| `--lav` | `#b9a5e8` | party hat, decorative blobs |
| `--mint` | `#8fd3bf` | toggles, pompom |
| `--butter` | `#ffd68a` | bowtie knot, trim |
| `--glass` | `rgba(255,255,255,.72)` | topbar buttons |
| `--shadow-md` | `0 18px 50px rgba(92,60,70,.14)` | panel, pet card |
| `--radius-lg` | `26px` | stage and panel |

Typography is rounded-system: `Nunito`, `Avenir Next Rounded`, `Quicksand`, then `ui-rounded`. Thai
text switches to `Noto Sans Thai` / `Sukhumvit Set` / `Thonburi` via `body[data-lang="th"]`. No web
fonts are downloaded, which keeps the page private and instant.

## Backdrop

Four stacked radial gradients on `.backdrop` plus three blurred blobs that drift on a 26 s alternate
loop. A 0.5 px dot grid at 32% opacity adds paper grain. The canvas itself is transparent, so the
backdrop is entirely CSS and never appears in snapshots.

## Layout

```
┌───────────────────────────── topbar 76px ─────────────────────────────┐
│ brand                                    live pill · sound · EN/TH    │
├─────────────────────────────────────────┬─────────────────────────────┤
│ stage (rounded 26px)                    │ panel 388px                 │
│  pet card top-left                      │  head                       │
│  hint bottom-left · mesh count bottom   │  scroll: 6 sections         │
│                                         │  footer credits             │
└─────────────────────────────────────────┴─────────────────────────────┘
```

- Desktop: CSS grid, `minmax(0,1fr) 388px`; panel margins 10/18 px.
- ≤1100 px: panel narrows to 352 px, tagline truncates, live pill hides.
- ≤860 px: panel becomes a bottom sheet (78 dvh, 26 px top radius) with a floating **Customize**
  button; the hint chip moves up 78 px to clear it.
- ≤380 px: brand subtitle and tagline hide; expression labels shrink.

The stage is always at least 380 px tall on desktop and fills the remaining height on mobile.

## Character design

All four are built from the same primitive vocabulary, which makes them feel like one family:

| Cue | Bear | Bunny | Penguin | Shiba |
| --- | --- | --- | --- | --- |
| Silhouette | round, low | tall ears, pear body | egg, flippers | compact, pointed ears |
| Signature | panda eye patches | buck teeth + fluff tail | white face disc + gold beak | curled tail + cream brows |
| Ear rig | sphere pivots | long capsules | flipper pivots | 4-sided cones |
| Eyes | large glossy | medium | medium, high | medium, wide-set |

Faces use the same recipe everywhere: dark glossy sphere + tiny white glint, a cream muzzle/face
patch, a small nose, a torus-arc smile, and blush discs. This is deliberately generic and original —
button eyes and blush are universal toy language, not a borrowed mascot design. There are no
recognizable third-party proportions, palettes or accessories.

The bear's dark eye patches are tinted from the fur colour (`shade(main, −0.13)`), so they survive any
custom palette instead of staying black.

## Panel design

Six sections, ordered by how often a visitor will use them:

1. **Characters** — 2×2 cards with emoji, name and one-word trait.
2. **Expression** — 4 chips, active chip lifts and saturates.
3. **Colours** — 3 rows (fur/belly/blush) with native colour input, hex readout and five palette
   swatches in a conic-gradient ring.
4. **Accessories** — full-width toggle rows with a sliding pill.
5. **Studio tools** — snapshot (primary rose), save preset, copy link, sound; preset list below.
6. **Footer** — credits and the "no models, no textures, no audio" line.

Native `<input type="color">` is used on purpose: it is accessible, localized by the OS and needs no
custom picker code. The hex readout is monospaced to signal precision.

## Motion

Motion is used to communicate life, never to decorate the interface:

- the pet floats ±0.045 units and breathes ~2% scale;
- buttons lift 1–2 px on hover; toggles use a spring cubic-bezier;
- toasts slide up and leave after 2.8 s;
- the mobile sheet uses a 420 ms `cubic-bezier(.22,1,.36,1)` eased translate.

All of it collapses under `prefers-reduced-motion: reduce`; the 3D float amplitude drops to 30% and
sparkles are disabled, but the studio remains fully usable.

## Social card

`scripts/screenshot.mjs` draws a 1200×630 card in a canvas: pastel gradient, blurred blobs, a white
orbit ring, the live pet snapshot on the right, the wordmark and value proposition on the left, three
chips, the URL and the toolchain credit. It is regenerated from the app, so it can never drift from
the product.

## Anti-patterns avoided

- No stock illustrations, no icon font, no emoji as the only label (every emoji has text).
- No gradient text or glass on text-heavy areas where contrast would drop.
- No fake 3D-looking CSS mockups; the hero is the actual render.
- No modal onboarding, cookie banner, newsletter prompt or "sign in".
