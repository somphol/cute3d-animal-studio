# Privacy

Cute3D is a static page. It has no backend, no accounts, no analytics, no cookies, no fingerprinting and
no third-party fonts.

## Data that stays on the device

| Key | Contents | Purpose |
| --- | --- | --- |
| `cute3d:state:v1` | animal, expression, per-animal colours, accessories, sound | restore the studio |
| `cute3d:presets:v1` | up to 10 named looks | saved presets |
| `cute3d:lang:v1` | `en` or `th` | language preference |

All three are `localStorage`, readable by anyone with access to the browser profile. They contain no
personal data, no identifiers and no timestamps beyond an optional preset `createdAt`. Clearing site
data removes them.

## Data in the URL

Share links contain only the look: `a` (animal), `c` (three hex colours), `x` (expression), `o`
(accessories) and `l` (language). Nothing is uploaded. If you paste a share link into a chat, the
recipient can see the look — that is the point.

Snapshots are generated in the browser and downloaded directly. They are never uploaded.

## Network

| Request | Destination | Why |
| --- | --- | --- |
| `three.module.js` | `cdn.jsdelivr.net` | 3D runtime |
| `OrbitControls.js` | `cdn.jsdelivr.net` | camera controls |
| everything else | the same origin | HTML, CSS, JS, icon, manifest |

jsDelivr may receive standard request metadata (IP, user agent, referrer). There is no API call, no
telemetry and no error reporting. The app works offline after the CDN files are cached by the browser,
but it does not register a service worker.

## If you fork this

- Keep the analytics-free default, or disclose any addition prominently.
- Do not add third-party fonts without updating this document and `THIRD_PARTY_NOTICES.md`.
- Do not send presets or snapshots to a server without explicit consent.
- The `state.json` file records build metadata only, not user data.

## Children

The app collects nothing and shows no ads. It is suitable for classroom and family use. The only
external dependency is a public CDN.
