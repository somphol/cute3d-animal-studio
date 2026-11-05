# Support

## First stops

- **Using the studio:** [README](../README.md) and [FAQ](docs/FAQ.md).
- **Something looks wrong:** hard-reload once. GitHub Pages caches HTML for ~10 minutes.
- **Sound is silent:** click once (browsers require a gesture), then check the sound toggle.
- **Presets disappeared:** private browsing or cleared site data removes `localStorage`.
- **Running locally:** serve over HTTP (`python3 -m http.server 4173` or `npm start`).

## Report a bug

Open an issue at <https://github.com/somphol/cute3d-animal-studio/issues> with:

1. Browser and version, OS, and whether it is the live site or local.
2. Steps to reproduce (character, expression, actions).
3. Expected vs actual behaviour.
4. Console errors or a screenshot.
5. The output of `window.__cute3d?.version` if available.

## Request a feature

Check [ROADMAP](docs/ROADMAP.md) first. Feature requests should explain the use case, not only the
solution. Additions that break the code-only, static, privacy-first or original-IP constraints will be
declined.

## Questions about the build

Read [REPRODUCTION](docs/REPRODUCTION.md) and [ARCHITECTURE](docs/ARCHITECTURE.md). The handoff in
[AGENTS.md](../AGENTS.md) explains the contracts that must not be broken.

## Security

Do not file security issues publicly. Follow [SECURITY.md](../SECURITY.md).

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for setup, style and the pre-PR checklist.
