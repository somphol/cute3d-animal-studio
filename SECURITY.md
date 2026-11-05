# Security policy

## Supported versions

| Version | Supported |
| --- | --- |
| 1.x | ✅ |
| < 1.0 | ❌ |

## Reporting a vulnerability

Please use GitHub's private **Report a vulnerability** flow on
<https://github.com/somphol/cute3d-animal-studio/security/advisories/new>, or email the maintainer via
the address on the GitHub profile. Do not open a public issue first. Expect an acknowledgement within
72 hours and a fix or mitigation plan within 14 days for confirmed issues.

## Scope and threat model

Cute3D is a static client-side page with no backend, accounts, database or cookies. The realistic
attack surface is small:

- **`localStorage` tampering.** Presets and state are untrusted. They are always passed through
  `sanitizePreset(s)` / `sanitizeColors`; invalid records are dropped. Rendered names use
  `textContent`, not `innerHTML`.
- **URL share state.** `a`, `c`, `x`, `o`, `l` are validated against allow-lists and hex patterns.
  Unknown values fall back safely.
- **CDN supply chain.** Three.js is pinned to `0.169.0` from jsDelivr. A fork can vendor the file; the
  page never loads executable content from user input.
- **XSS.** No `eval`, no `new Function` in the browser app, no `innerHTML` with user data. The static
  suite asserts the first two.
- **Snapshot.** Generated locally with `toDataURL` and downloaded; nothing is uploaded.
- **Dependencies.** Zero npm runtime dependencies. Dev tooling is Node's built-in test runner and
  Chrome DevTools Protocol; there is no lockfile to audit.

Out of scope: attacks requiring a compromised browser profile, malicious extensions, or the CDN itself.
If you discover a real XSS, prototype pollution or sanitizer bypass, it is in scope — please report it.

## Hardening advice for forks

- Vendor Three.js and add Subresource Integrity if you need deterministic builds.
- Keep `Content-Security-Policy` restrictive (`script-src 'self' https://cdn.jsdelivr.net`).
- Do not add a backend that accepts snapshots without authentication and size limits.
