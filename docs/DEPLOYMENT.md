# Deployment

## GitHub Pages (current)

The site is a static tree on `main` and Pages serves the repository root.

1. Repository → Settings → Pages → Source: **Deploy from a branch** → `main` / `/ (root)`.
2. No build command, no artifact, no Actions dependency. The `.nojekyll` file keeps Pages from
   processing the tree with Jekyll.
3. Wait for `pages build and deployment` to finish, then open
   <https://somphol.github.io/cute3d-animal-studio/>.
4. Run the live browser suite:

```bash
TEST_URL=https://somphol.github.io/cute3d-animal-studio/ node tests/browser.test.mjs
```

Expected: 26/26 and zero console errors.

## Cache behaviour

Pages serves `Cache-Control: max-age=600` on HTML and longer on hashed-looking files. Because the app
has no hashed filenames, a deploy can take a few minutes to be visible. For demos, append `?v=…` to
the share URL or hard-reload. There is no service worker, so old JS never sticks around indefinitely.

## Updating the live copy

```bash
node scripts/screenshot.mjs
node --test tests/engine.test.mjs tests/static.test.mjs
node tests/browser.test.mjs
git add -A
git commit -m "…"
git push origin main
TEST_URL=https://somphol.github.io/cute3d-animal-studio/ node tests/browser.test.mjs
```

Before pushing, regenerate `state.json` if source line counts changed; the static suite fails on
stale line counts by design.

## Alternate hosts

The tree works unchanged on Netlify, Cloudflare Pages, Vercel static, S3 + CloudFront or any nginx
root. Requirements:

- serve `index.html` at `/`;
- keep the `assets/` and `docs/` paths;
- allow `https://cdn.jsdelivr.net` for Three.js;
- do not strip the `importmap` script;
- MIME types: `.js` → `text/javascript`, `.webmanifest` → `application/manifest+json` (optional).

`python3 -m http.server` and `npm start` both satisfy this locally.

## Release checklist

- [ ] `npm run verify` passes (19 engine, 83 static, 26 browser)
- [ ] `?selftest` shows 20/20 on the deployed URL
- [ ] `state.json` line counts and usage are current
- [ ] README test-count table matches reality
- [ ] OG card and screenshots regenerated if visuals changed
- [ ] `AGENTS.md` still describes the current architecture
- [ ] `robots.txt` and `sitemap.xml` use the live URL
- [ ] live browser suite passes 26/26
- [ ] skill copy mirrored to the catalog (see `docs/CREDITS.md`)

## Rollback

Pages keeps the last successful deployment. Revert the offending commit on `main` and push; the site
rebuilds automatically. There is no database or migration to undo.
