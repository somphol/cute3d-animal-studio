// Headless browser suite over the Chrome DevTools Protocol.
//
//   node tests/browser.test.mjs
//   TEST_URL=https://somphol.github.io/cute3d-animal-studio/ node tests/browser.test.mjs
//
// One Chrome instance, mock keychain (no macOS prompts), temporary profile.
// No npm dependencies: the harness talks to Chrome directly.

import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { connect, launchBrowser, startServer } from './lib/harness.mjs';
import { ROOT } from './lib/fixtures.mjs';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const LIVE = process.env.TEST_URL || null;
const results = [];
let server = null;

const record = async (name, fn) => {
  try {
    const detail = await fn();
    results.push({ name, ok: detail !== false, detail });
    console.log(`${detail === false ? '✖' : '✓'} ${name}`);
  } catch (error) {
    results.push({ name, ok: false, detail: error?.message || String(error) });
    console.log(`✖ ${name}\n    ${error?.message || error}`);
  }
};

const base = LIVE || (server = await startServer(ROOT)).url;
const browser = await launchBrowser({ width: 1600, height: 1000 });
const target = await (
  await fetch(`http://127.0.0.1:${browser.port}/json/new?about:blank`, { method: 'PUT' })
).json();
const cdp = await connect(target.webSocketDebuggerUrl);
const consoleErrors = [];
const downloads = mkdtempSync(join(tmpdir(), 'c3d-downloads-'));

cdp.on('Runtime.consoleAPICalled', (params) => {
  if (params.type === 'error') {
    consoleErrors.push(params.args.map((arg) => arg.value ?? arg.description).join(' '));
  }
});
cdp.on('Runtime.exceptionThrown', (params) => {
  consoleErrors.push(params.exceptionDetails.exception?.description || params.exceptionDetails.text);
});
cdp.on('Log.entryAdded', (params) => {
  if (params.entry.level === 'error') consoleErrors.push(params.entry.text);
});

await cdp.send('Page.enable');
await cdp.send('Runtime.enable');
await cdp.send('Log.enable');
await cdp.send('Network.enable');
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
await cdp.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: downloads });

const evaluate = async (expression) => {
  const { result, exceptionDetails } = await cdp.send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(exceptionDetails.exception?.description || exceptionDetails.text);
  }
  return result?.value;
};

const waitFor = (expression, timeout = 20000) => cdp.waitFor(expression, { timeout, interval: 120 });

const navigate = async (path = '/') => {
  await cdp.send('Page.navigate', { url: `${base}${path}` });
  await waitFor('Boolean(window.__cute3d && window.__cute3d.ready)');
  await sleep(600);
};

const click = async (selector) => {
  await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
  await sleep(140);
};

const state = () => evaluate('JSON.stringify(window.__cute3d.state)').then(JSON.parse);
const snapshotState = () => evaluate(`JSON.stringify({
  animal: window.__cute3d.state.animal,
  expression: window.__cute3d.state.expression,
  lang: window.__cute3d.state.lang,
  meshCount: window.__cute3d.meshCount(),
  rigAnimal: window.__cute3d.getRig().id,
  error: null
})`).then(JSON.parse);

try {
  await navigate('/');

  await record('page loads with a live WebGL canvas', async () => {
    const info = await evaluate(`JSON.stringify({
      canvas: Boolean(document.querySelector('#stage canvas')),
      width: document.querySelector('#stage canvas').width,
      height: document.querySelector('#stage canvas').height,
      loaderHidden: document.querySelector('#stage-loading').classList.contains('is-hidden')
    })`);
    const data = JSON.parse(info);
    assert.ok(data.canvas && data.width > 300 && data.height > 300);
    assert.equal(data.loaderHidden, true);
  });

  await record('default pet is the bear with a mesh count', async () => {
    const data = await snapshotState();
    assert.equal(data.animal, 'bear');
    assert.equal(data.rigAnimal, 'bear');
    assert.ok(data.meshCount > 25);
    const label = await evaluate("document.querySelector('#pet-name').textContent");
    assert.match(label, /Mochi/);
  });

  await record('all seven characters switch from the panel', async () => {
    const counts = [];
    for (const animal of ['bear', 'bunny', 'penguin', 'shiba', 'koala', 'conure', 'fold']) {
      await click(`[data-animal="${animal}"]`);
      const data = await snapshotState();
      assert.equal(data.animal, animal);
      assert.equal(data.rigAnimal, animal);
      counts.push(data.meshCount);
    }
    assert.ok(counts.every((count) => count > 30), `a rig failed to build: ${counts}`);
    return counts.join(',');
  });

  await record('character buttons expose aria-pressed', async () => {
    await evaluate(`(() => {
      const select = document.querySelector('#animal-select');
      select.value = 'bunny';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    })()`);
    await sleep(400);
    const viaSelect = await snapshotState();
    assert.equal(viaSelect.animal, 'bunny');
    await click('[data-animal="penguin"]');
    const pressed = await evaluate("[...document.querySelectorAll('[data-animal]')].filter(b => b.getAttribute('aria-pressed') === 'true').map(b => b.dataset.animal).join(',')");
    assert.equal(pressed, 'penguin');
    const synced = await evaluate("document.querySelector('#animal-select').value");
    assert.equal(synced, 'penguin');
  });

  await record('expressions animate the eyes', async () => {
    await click('[data-expr="sleepy"]');
    await sleep(700);
    const eye = await evaluate('window.__cute3d.getRig().eyes[0].scale.y');
    const base = await evaluate('window.__cute3d.getRig().eyes[0].userData.baseScale.y');
    assert.ok(eye < base * 0.4, `eye did not close: ${eye} vs ${base}`);
    await click('[data-expr="happy"]');
    await sleep(500);
    const open = await evaluate('window.__cute3d.getRig().eyes[0].scale.y');
    assert.ok(open > base * 0.6, 'eye did not reopen');
  });

  await record('coat levels add and remove fur shells', async () => {
    await click('[data-coat="plush"]');
    await sleep(500);
    const plush = await evaluate('window.__cute3d.strandCount()');
    assert.ok(plush > 1000, `too few fibres: ${plush}`);
    await click('[data-coat="off"]');
    await sleep(300);
    const off = await evaluate('window.__cute3d.strandCount()');
    assert.equal(off, 0);
    await click('[data-coat="soft"]');
    await sleep(300);
    const soft = await evaluate('window.__cute3d.strandCount()');
    assert.ok(soft > 0 && soft < plush, `soft ${soft} vs plush ${plush}`);
  });

  await record('VFX groom builds the high-density koala coat', async () => {
    await click('[data-animal="koala"]');
    await sleep(500);
    await click('[data-coat="plush"]');
    await sleep(300);
    await click('[data-outer="vfx"]');
    await sleep(800);
    const vfx = await evaluate('window.__cute3d.strandCount()');
    assert.ok(vfx > 100000, `VFX coat too sparse: ${vfx}`);
    const meshes = await evaluate('window.__cute3d.getRig().strandMeshes.length');
    assert.ok(meshes >= 4, `VFX zones missing: ${meshes}`);
    const outer = await evaluate('window.__cute3d.state.outer');
    assert.equal(outer, 'vfx');
    await click('[data-outer="velvet"]');
    await sleep(600);
    const velvet = await evaluate('window.__cute3d.getRig().fluffCount');
    assert.ok(velvet > 10000, `Velvet cushion missing: ${velvet}`);
    await click('[data-outer="pelt"]');
    await sleep(400);
  });

  await record('fur sliders and lighting presets respond', async () => {
    await click('[data-animal="koala"]');
    await sleep(500);
    await click('[data-coat="plush"]');
    await sleep(400);
    await evaluate(`(() => {
      const input = document.querySelector('#fur-density');
      input.value = '0.4';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    })()`);
    await sleep(300);
    const low = await evaluate('window.__cute3d.furStrands()');
    await evaluate(`(() => {
      const input = document.querySelector('#fur-density');
      input.value = '1';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    })()`);
    await sleep(300);
    const high = await evaluate('window.__cute3d.furStrands()');
    assert.ok(high > low && high >= 30000, `density did not grow strands: ${low} -> ${high}`);
    const stored = await evaluate("JSON.parse(localStorage.getItem('cute3d:state:v1')).fur.density");
    assert.equal(stored, 1);

    await evaluate(`(() => {
      const input = document.querySelector('#fur-length');
      input.value = '1.5';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    })()`);
    await sleep(200);
    const length = await evaluate('window.__cute3d.state.fur.length');
    assert.equal(length, 1.5);

    const rect = JSON.parse(await evaluate("JSON.stringify(document.querySelector('#stage canvas').getBoundingClientRect())"));
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: Math.round(rect.left + rect.width / 2), y: Math.round(rect.top + rect.height / 2) });
    await sleep(200);
    const cursor = await evaluate('window.__cute3d.furUniforms().cursor');
    assert.ok(Math.abs(cursor[0]) < 50 && Math.abs(cursor[1]) < 50, `cursor not projected: ${cursor}`);

    await click('[data-lighting="sky"]');
    await sleep(400);
    const sky = await evaluate("JSON.stringify({ mode: document.body.dataset.lighting, clouds: document.body.dataset.lighting === 'sky' })");
    assert.deepEqual(JSON.parse(sky), { mode: 'sky', clouds: true });
    await click('[data-lighting="desk"]');
    await sleep(400);
    const desk = await evaluate("document.body.dataset.lighting");
    assert.equal(desk, 'desk');
    await click('[data-lighting="studio"]');
    await sleep(300);
    const studio = await evaluate("document.body.dataset.lighting");
    assert.equal(studio, 'studio');

    await evaluate('window.__cute3d.setFanAngle(0.2)');
    await sleep(150);
    const rightFan = await evaluate('window.__cute3d.fanPosition()');
    await evaluate('window.__cute3d.setFanAngle(3.4)');
    await sleep(150);
    const leftFan = await evaluate('window.__cute3d.fanPosition()');
    assert.ok(rightFan[0] > 0 && leftFan[0] < 0, `fan did not move: ${rightFan} / ${leftFan}`);
    await evaluate(`(() => {
      const density = document.querySelector('#fur-density');
      density.value = '0.7';
      density.dispatchEvent(new Event('input', { bubbles: true }));
      const length = document.querySelector('#fur-length');
      length.value = '1';
      length.dispatchEvent(new Event('input', { bubbles: true }));
    })()`);
  });

  await record('palette applies three colours at once', async () => {
    await click('[data-palette="sunset"]');
    const data = await state();
    assert.equal(data.colors[data.animal].main, '#e8996b');
    assert.equal(data.colors[data.animal].belly, '#fff3e6');
    const input = await evaluate("document.querySelector('#color-main').value");
    assert.equal(input, '#e8996b');
  });

  await record('colour picker recolours the live material', async () => {
    const result = await evaluate(`(() => {
      const input = document.querySelector('#color-main');
      input.value = '#3366cc';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      const material = window.__cute3d.getRig().materials.main.color.getHexString();
      return JSON.stringify({ material, label: document.querySelector('#hex-main').textContent });
    })()`);
    const data = JSON.parse(result);
    assert.equal(data.material, '3366cc');
    assert.equal(data.label, '#3366CC');
  });

  await record('accessories build and toggle', async () => {
    for (const key of ['bowtie', 'partyHat', 'glasses']) {
      await click(`[data-accessory="${key}"]`);
    }
    await sleep(300);
    const data = await evaluate(`(() => {
      const rig = window.__cute3d.getRig();
      return JSON.stringify(Object.fromEntries(['bowtie','partyHat','glasses'].map(k => [k, rig.accessories[k].visible])));
    })()`);
    assert.deepEqual(JSON.parse(data), { bowtie: true, partyHat: true, glasses: true });
    const pressed = await evaluate("[...document.querySelectorAll('[data-accessory]')].every(b => b.getAttribute('aria-pressed') === 'true')");
    assert.equal(pressed, true);
  });

  await record('language switch translates the whole page', async () => {
    await click('[data-animal="penguin"]');
    await sleep(400);
    await click('#lang-toggle');
    await sleep(350);
    const lang = await evaluate('document.documentElement.lang');
    assert.equal(lang, 'th');
    const name = await evaluate("document.querySelector('#pet-name').textContent");
    assert.match(name, /เพนกวิน/);
    const panel = await evaluate("document.querySelector('.panel-title').textContent");
    assert.equal(panel, 'สตูดิโอ');
    const stored = await evaluate("localStorage.getItem('cute3d:lang:v1')");
    assert.equal(stored, 'th');
  });

  await record('saved presets persist to localStorage', async () => {
    await click('#save-preset');
    await sleep(250);
    const items = await evaluate("document.querySelectorAll('#preset-list .preset-item').length");
    assert.ok(items >= 1);
    const stored = await evaluate("JSON.parse(localStorage.getItem('cute3d:presets:v1')).length");
    assert.ok(stored >= 1);
  });

  await record('preset apply restores colours and animal', async () => {
    await click('[data-animal="bear"]');
    await sleep(500);
    const before = await state();
    assert.equal(before.animal, 'bear');
    const firstId = await evaluate("document.querySelector('#preset-list .preset-apply').dataset.presetId");
    await evaluate(`document.querySelector('[data-preset-id="${firstId}"] [data-action="apply"]').click()`);
    await sleep(500);
    const after = await snapshotState();
    assert.equal(after.animal, 'penguin');
  });

  await record('presets can be cleared', async () => {
    await click('#clear-presets');
    await sleep(200);
    const items = await evaluate("document.querySelectorAll('#preset-list .preset-item').length");
    assert.equal(items, 0);
    const empty = await evaluate("!document.querySelector('#preset-empty').hidden");
    assert.equal(empty, true);
  });

  await record('clicking React starts a jump and spin', async () => {
    await click('#pet-action');
    await sleep(180);
    const reaction = await evaluate('JSON.stringify(window.__cute3d.reaction())');
    assert.equal(JSON.parse(reaction).active, true);
    const y = await evaluate('window.__cute3d.getRig().group.position.y');
    assert.ok(y > 0.05, `not jumping: ${y}`);
    await sleep(1200);
    const settled = await evaluate('JSON.stringify(window.__cute3d.reaction())');
    assert.equal(JSON.parse(settled).active, false);
  });

  await record('3D tap triggers the reaction raycast', async () => {
    await sleep(400);
    const rect = JSON.parse(await evaluate("JSON.stringify(document.querySelector('#stage canvas').getBoundingClientRect())"));
    const x = Math.round(rect.left + rect.width / 2);
    const y = Math.round(rect.top + rect.height * 0.55);
    await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
    await sleep(180);
    const active = await evaluate('window.__cute3d.reaction().active');
    assert.equal(active, true);
  });

  await record('snapshot is a transparent high-resolution PNG', async () => {
    const data = await evaluate(`(async () => {
      const url = window.__cute3d.snapshotDataUrl();
      const blob = await (await fetch(url)).blob();
      const bitmap = await createImageBitmap(blob);
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(bitmap, 0, 0);
      const corner = ctx.getImageData(0, 0, 1, 1).data;
      const middle = ctx.getImageData(Math.floor(bitmap.width / 2), Math.floor(bitmap.height / 2), 1, 1).data;
      return JSON.stringify({ width: bitmap.width, height: bitmap.height, cornerAlpha: corner[3], middleAlpha: middle[3], bytes: blob.size });
    })()`);
    const info = JSON.parse(data);
    assert.equal(info.width, 1024);
    assert.equal(info.height, 1024);
    assert.equal(info.cornerAlpha, 0, 'background is not transparent');
    assert.ok(info.middleAlpha > 200, 'character missing from snapshot');
    assert.ok(info.bytes > 50_000);
  });

  await record('snapshot button downloads the generated file', async () => {
    await click('#snapshot-btn');
    let files = [];
    for (let i = 0; i < 120; i += 1) {
      files = readdirSync(downloads).filter((file) => file.endsWith('.png'));
      if (files.length) break;
      await sleep(100);
    }
    assert.ok(files.length >= 1, 'no file downloaded');
    const file = files[0];
    assert.match(file, /^cute3d-[a-z]+-\d{4}-\d{2}-\d{2}\.png$/);
    assert.ok(statSync(join(downloads, file)).size > 40_000);
    return file;
  });

  await record('share link encodes the current studio', async () => {
    const current = await snapshotState();
    const url = await evaluate('window.__cute3d.shareUrl()');
    const parsed = new URL(url);
    assert.equal(parsed.searchParams.get('a'), current.animal);
    assert.ok(parsed.searchParams.get('c').includes('-'));
    assert.ok(['happy', 'sleepy', 'curious', 'wiggle'].includes(parsed.searchParams.get('x')));
    assert.ok(['none', 'pelt', 'velvet', 'vfx'].includes(parsed.searchParams.get('v')));
    const decoded = await evaluate(`JSON.stringify(window.__cute3d.engine.decodeShareState(${JSON.stringify(parsed.search)}))`);
    const data = JSON.parse(decoded);
    assert.equal(data.animal, current.animal);
    assert.equal(data.outer, parsed.searchParams.get('v'));
    assert.equal(data.valid, true);
  });

  await record('keyboard shortcuts switch animals', async () => {
    await evaluate("document.dispatchEvent(new KeyboardEvent('keydown', { key: '2', bubbles: true }))");
    await sleep(350);
    const data = await snapshotState();
    assert.equal(data.animal, 'bunny');
  });

  await record('the live state survives a reload', async () => {
    await click('[data-animal="shiba"]');
    await sleep(300);
    await navigate('/');
    const data = await snapshotState();
    assert.equal(data.animal, 'shiba');
    assert.equal(data.lang, 'th');
  });

  await record('mobile layout opens the customizer sheet', async () => {
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await navigate('/');
    const open = await evaluate("document.querySelector('#panel').classList.contains('is-open')");
    assert.equal(open, false);
    const toggleVisible = await evaluate("getComputedStyle(document.querySelector('.mobile-panel-toggle')).display !== 'none'");
    assert.equal(toggleVisible, true);
    await click('#panel-toggle');
    await sleep(500);
    const isOpen = await evaluate("document.querySelector('#panel').classList.contains('is-open')");
    assert.equal(isOpen, true);
    const toggle = await evaluate("document.querySelector('#panel-toggle').getAttribute('aria-expanded')");
    assert.equal(toggle, 'true');
    await click('#panel-close');
    await sleep(300);
    const closed = await evaluate("document.querySelector('#panel').classList.contains('is-open')");
    assert.equal(closed, false);
  });

  await record('reduced motion still renders the studio', async () => {
    await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
    await navigate('/');
    const matches = await evaluate("window.matchMedia('(prefers-reduced-motion: reduce)').matches");
    assert.equal(matches, true);
    const size = await evaluate('window.__cute3d.meshCount()');
    assert.ok(size > 20);
    await cdp.send('Emulation.setEmulatedMedia', { features: [] });
  });

  await navigate('/?selftest');
  await waitFor('Boolean(window.__selftest)', 30000);
  await record('in-page self-test passes every check', async () => {
    const report = JSON.parse(await evaluate('JSON.stringify(window.__selftest)'));
    if (report.passed !== report.total) {
      const failed = report.results.filter((item) => !item.ok).map((item) => `${item.name}: ${item.detail}`);
      throw new Error(`${report.passed}/${report.total} — ${failed.join('; ')}`);
    }
    assert.ok(report.total >= 18);
    return `${report.passed}/${report.total}`;
  });

  await record('no console errors across the suite', () => {
    assert.deepEqual(consoleErrors, []);
  });
} finally {
  const passed = results.filter((item) => item.ok).length;
  console.log(`\n${passed}/${results.length} browser checks passed`);
  cdp.close();
  browser.proc.kill();
  if (server) await server.close();
  rmSync(downloads, { recursive: true, force: true });
  if (passed !== results.length) process.exitCode = 1;
}
