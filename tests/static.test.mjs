// Repository-level checks. Fast, offline, no browser.
//
//   node --test tests/static.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, read, loadI18n, flattenKeys } from './lib/fixtures.mjs';

const html = read('index.html');
const css = read('style.css');
const js = read('script.js');
const i18n = loadI18n();
const pkg = JSON.parse(read('package.json'));

const exists = (file) => existsSync(join(ROOT, file));
const size = (file) => statSync(join(ROOT, file)).size;

const CORE_FILES = ['index.html', 'style.css', 'script.js', 'manifest.webmanifest', 'assets/favicon.svg'];
const DOC_FILES = [
  'README.md', 'AGENTS.md', 'CHANGELOG.md', 'CONTRIBUTING.md', 'CODE_OF_CONDUCT.md',
  'SECURITY.md', 'SUPPORT.md', 'LICENSE', 'THIRD_PARTY_NOTICES.md', 'state.json',
  'docs/README.md', 'docs/ARCHITECTURE.md', 'docs/REPRODUCTION.md', 'docs/DESIGN.md',
  'docs/ANIMATION.md', 'docs/AUDIO.md', 'docs/COAT.md', 'docs/TESTING.md', 'docs/DEPLOYMENT.md',
  'docs/DECISIONS.md', 'docs/ACCESSIBILITY.md', 'docs/PERFORMANCE.md', 'docs/PRIVACY.md',
  'docs/FAQ.md', 'docs/ROADMAP.md', 'docs/CREDITS.md',
];
const SHOTS = [
  'assets/og-card.png', 'assets/screenshot-studio.png', 'assets/screenshot-bunny.png',
  'assets/screenshot-penguin.png', 'assets/screenshot-shiba.png', 'assets/screenshot-hippo.png', 'assets/screenshot-thai.png',
  'assets/screenshot-koala.png', 'assets/screenshot-koala-vfx.png', 'assets/screenshot-koala-velvet.png', 'assets/screenshot-koala-film.png', 'assets/screenshot-conure.png', 'assets/screenshot-fold.png', 'assets/screenshot-fold-film.png', 'assets/screenshot-fold-velvet.png',
  'assets/screenshot-sky.png', 'assets/screenshot-desk.png',
  'assets/screenshot-mobile.png', 'assets/snapshot-transparent.png',
];

test('section: project files', async (t) => {
  for (const file of [...CORE_FILES, ...DOC_FILES, ...SHOTS]) {
    await t.test(`exists: ${file}`, () => assert.ok(exists(file), `missing ${file}`));
  }
  for (const file of SHOTS.filter((f) => f.endsWith('.png'))) {
    assert.ok(size(file) > 20_000, `${file} is suspiciously small`);
  }
});

test('section: page shell', async (t) => {
  await t.test('has a title and description', () => {
    assert.match(html, /<title>Cute3D/);
    assert.match(html, /name="description"/);
    assert.match(html, /name="viewport"[^>]*width=device-width/);
  });
  await t.test('pins Three.js to an exact version over HTTPS', () => {
    assert.match(html, /three@0\.169\.0/);
    assert.ok(!/three@latest/.test(html));
    assert.ok(!/http:\/\//.test(html), 'no insecure URLs');
  });
  await t.test('loads local CSS and a module script', () => {
    assert.match(html, /<link rel="stylesheet" href="style\.css">/);
    assert.match(html, /<script type="module" src="script\.js"><\/script>/);
  });
  await t.test('has no duplicate element ids', () => {
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
    assert.equal(new Set(ids).size, ids.length);
  });
  await t.test('character dropdown lists all four pets', () => {
    assert.equal((html.match(/<option value="(bear|bunny|penguin|shiba|koala|conure|fold)"/g) || []).length, 7);
  });
  await t.test('every button declares its type', () => {
    for (const tag of html.match(/<button\b[^>]*>/g) || []) {
      assert.match(tag, /type="(button|submit|reset)"/, tag);
    }
  });
  await t.test('no inline event handlers', () => {
    assert.ok(!/\son(click|load|error|mouseover|change)=/i.test(html));
  });
  await t.test('external links are safe', () => {
    for (const tag of html.match(/<a\b[^>]*target="_blank"[^>]*>/g) || []) {
      assert.match(tag, /rel="noopener noreferrer"/, tag);
    }
  });
});

test('section: bilingual wiring', async (t) => {
  const enKeys = new Set(flattenKeys(i18n.en));
  const used = [
    ...[...html.matchAll(/data-i18n="([^"]+)"/g)].map((m) => m[1]),
    ...[...html.matchAll(/data-i18n-aria="([^"]+)"/g)].map((m) => m[1]),
    ...[...html.matchAll(/data-i18n-placeholder="([^"]+)"/g)].map((m) => m[1]),
  ];
  await t.test('all translated DOM nodes resolve', () => {
    const missing = used.filter((key) => !enKeys.has(key));
    assert.deepEqual(missing, []);
    assert.ok(used.length >= 60);
  });
  await t.test('dictionary keys match across languages', () => {
    assert.deepEqual(flattenKeys(i18n.th).sort(), flattenKeys(i18n.en).sort());
  });
  await t.test('every runtime toast key exists', () => {
    const usedInJs = [...js.matchAll(/t\('([a-zA-Z0-9.]+)'/g)].map((m) => m[1]);
    const missing = [...new Set(usedInJs)].filter((key) => key.includes('.') && !enKeys.has(key));
    assert.deepEqual(missing, []);
  });
});

test('section: no third-party assets or trackers', async (t) => {
  await t.test('no model, texture or audio files are referenced', () => {
    for (const extension of ['glb', 'gltf', 'fbx', 'obj', 'stl', 'mp3', 'wav', 'ogg', 'm4a', 'hdr', 'exr']) {
      assert.ok(!new RegExp(`\\.${extension}\\b`, 'i').test(html + js + css), `unexpected .${extension}`);
    }
  });
  await t.test('no analytics or tracking scripts', () => {
    const trackers = ['googletagmanager', 'google-analytics', 'gtag(', 'plausible.io', 'mixpanel', 'segment.io', 'facebook.net'];
    for (const tracker of trackers) assert.ok(!html.toLowerCase().includes(tracker), tracker);
  });
  await t.test('no trademarked character names in the shipped files', () => {
    const terms = [
      'hello kitty', 'sanrio', 'pokemon', 'pikachu', 'disney', 'mickey mouse', 'animal crossing',
      'line friends', 'kakao', 'totoro', 'kirby', 'nintendo', 'peppa pig', 'marvel', 'cinema',
    ];
    const corpus = (html + css + js + read('README.md')).toLowerCase();
    for (const term of terms) assert.ok(!corpus.includes(term), `found protected term: ${term}`);
  });
  await t.test('no eval or new Function in the browser app', () => {
    assert.ok(!/\beval\s*\(/.test(js));
    assert.ok(!/new Function\s*\(/.test(js));
  });
});

test('section: engine contract', async (t) => {
  await t.test('engine and i18n markers are present', () => {
    assert.match(js, /\/\* ENGINE:START \*\//);
    assert.match(js, /\/\* ENGINE:END \*\//);
    assert.match(js, /\/\* I18N:START \*\//);
    assert.match(js, /\/\* I18N:END \*\//);
  });
  await t.test('local storage keys are namespaced', () => {
    const keys = [...js.matchAll(/'(cute3d:[a-z0-9:]+)'/g)].map((m) => m[1]);
    assert.ok(keys.length >= 3);
    for (const key of keys) assert.match(key, /^cute3d:/);
  });
  await t.test('self-test and debug API are exposed', () => {
    assert.match(js, /has\('selftest'\)/);
    assert.match(js, /window\.__selftest/);
    assert.match(js, /window\.__cute3d/);
  });
  await t.test('snapshot is high resolution and transparent', () => {
    assert.match(js, /captureSnapshot\(2048\)/);
    assert.match(js, /setClearColor\(0x000000, 0\)/);
  });
});

test('section: accessibility and motion', async (t) => {
  await t.test('has a skip link and focus styles', () => {
    assert.match(html, /class="skip-link"/);
    assert.match(css, /:focus-visible/);
  });
  await t.test('honours reduced motion', () => {
    assert.match(css, /prefers-reduced-motion: reduce/);
    assert.match(js, /prefers-reduced-motion: reduce/);
  });
  await t.test('has an application language and Thai font fallback', () => {
    assert.match(html, /<html lang="en">/);
    assert.match(css, /--font-thai/);
  });
  await t.test('buttons expose pressed state where toggles', () => {
    assert.ok((html.match(/aria-pressed=/g) || []).length >= 7);
  });
});

test('section: metadata and release', async (t) => {
  await t.test('manifest is valid and points at the icon', () => {
    const manifest = JSON.parse(read('manifest.webmanifest'));
    assert.equal(manifest.short_name, 'Cute3D');
    assert.ok(manifest.icons.length >= 1);
    assert.ok(exists(manifest.icons[0].src));
  });
  await t.test('robots and sitemap agree on the live URL', () => {
    const robots = read('robots.txt');
    const sitemap = read('sitemap.xml');
    assert.match(robots, /Sitemap: https:\/\/somphol\.github\.io\/cute3d-animal-studio\/sitemap\.xml/);
    assert.match(sitemap, /https:\/\/somphol\.github\.io\/cute3d-animal-studio\//);
  });
  await t.test('state.json records model, usage and artifacts', () => {
    const state = JSON.parse(read('state.json'));
    assert.equal(state.project, 'Cute3D: Procedural Code-Only Animal Studio');
    assert.equal(state.model.provider, 'opencode-go');
    assert.equal(state.model.id, 'deepseek-v4.1-flash');
    assert.ok(state.usage.totalTokens > 0);
    assert.equal(
      state.usage.inputTokens + state.usage.outputTokens + state.usage.reasoningTokens +
        state.usage.cacheReadTokens + state.usage.cacheWriteTokens,
      state.usage.totalTokens,
    );
    assert.ok(state.session.elapsedSeconds > 0);
  });
  await t.test('state.json line counts match the source', () => {
    const state = JSON.parse(read('state.json'));
    const counts = state.artifacts.lineCounts;
    let sum = 0;
    for (const [file, lines] of Object.entries(counts)) {
      if (file === 'total') continue;
      const actual = read(file).split('\n').length;
      assert.equal(actual, lines, `${file} line count drifted`);
      sum += actual;
    }
    assert.equal(counts.total, sum, 'total source line count drifted');
  });
  await t.test('package metadata is publishable', () => {
    assert.equal(pkg.private, true);
    assert.match(pkg.license, /MIT/);
    assert.ok(pkg.scripts.test.includes('node --test'));
    assert.ok(pkg.scripts.verify.includes('browser.test.mjs'));
  });
  await t.test('README credits the toolchain', () => {
    const readme = read('README.md');
    assert.match(readme, /somphol\.github\.io\/cute3d-animal-studio/);
    assert.match(readme, /OpenCode/);
    assert.match(readme, /DeepSeek V4\.1 Flash/);
    assert.match(readme, /MIT/);
  });
  await t.test('AGENTS.md covers the handoff sections', () => {
    const agents = read('AGENTS.md');
    for (const heading of ['What it is', 'Commands', 'Architecture', 'Decisions', 'Known issues', 'Continuity']) {
      assert.match(agents, new RegExp(heading, 'i'), heading);
    }
  });
  await t.test('licence is MIT and names the author', () => {
    const licence = read('LICENSE');
    assert.match(licence, /MIT License/);
    assert.match(licence, /Somphol Boonjing/);
  });
});
