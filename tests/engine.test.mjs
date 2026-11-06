// Pure engine suite. No browser, no DOM.
//
//   node --test tests/engine.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine, loadI18n } from './lib/fixtures.mjs';

const engine = loadEngine();
const i18n = loadI18n();

test('eight animals, four expressions, three accessories', () => {
  assert.deepEqual(engine.ANIMALS, ['bear', 'bunny', 'penguin', 'shiba', 'koala', 'hippo', 'conure', 'fold']);
  assert.equal(engine.EXPRESSIONS.length, 4);
  assert.deepEqual(engine.ACCESSORIES, ['bowtie', 'partyHat', 'glasses']);
  assert.equal(engine.COLOR_KEYS.length, 3);
  assert.deepEqual(engine.COAT_LEVELS, ['off', 'soft', 'plush']);
  assert.deepEqual(engine.OUTER_LEVELS, ['none', 'pelt', 'velvet', 'vfx', 'film']);
  assert.deepEqual(engine.OUTER_ANIMALS, ['koala', 'fold']);
  assert.equal(engine.DEFAULT_OUTER, 'pelt');
  assert.equal(engine.DEFAULT_COAT, 'soft');
  assert.deepEqual(engine.LIGHTING_PRESETS, ['studio', 'sky', 'desk']);
  assert.equal(engine.DEFAULT_LIGHTING, 'studio');
});

test('every animal has a complete default palette', () => {
  for (const animal of engine.ANIMALS) {
    const colors = engine.DEFAULT_COLORS[animal];
    assert.ok(colors, `${animal} palette missing`);
    for (const key of engine.COLOR_KEYS) {
      assert.match(colors[key], /^#[0-9a-f]{6}$/, `${animal}.${key}`);
    }
  }
});

test('colour normalisation accepts short hex and rejects junk', () => {
  assert.equal(engine.normalizeHex('#ABC'), '#aabbcc');
  assert.equal(engine.normalizeHex('ff9db6'), '#ff9db6');
  assert.equal(engine.normalizeHex('tomato', '#c08a6d'), '#c08a6d');
  assert.equal(engine.normalizeHex(null, '#ffffff'), '#ffffff');
  assert.equal(engine.normalizeHex('#12345', '#000000'), '#000000');
});

test('colour mixing and shading stay in gamut', () => {
  assert.equal(engine.mixHex('#000000', '#ffffff', 0.5), '#808080');
  assert.equal(engine.shade('#808080', 0.5), '#c0c0c0');
  assert.equal(engine.shade('#ffffff', -0.5), '#808080');
  const rgb = engine.hexToRgb('#0a14ff');
  assert.deepEqual(rgb, { r: 10, g: 20, b: 255 });
  assert.equal(engine.rgbToHex(rgb.r, rgb.g, rgb.b), '#0a14ff');
});

test('palette lookup falls back to the first palette', () => {
  assert.equal(engine.paletteById('mint').main, '#7fc7b1');
  assert.equal(engine.paletteById('nope').id, 'mochi');
});

test('blink envelope closes and opens over time', () => {
  let closed = 0;
  let open = 0;
  for (let time = 0; time < 20; time += 0.01) {
    const value = engine.blinkScale(time, 3);
    assert.ok(value >= 0 && value <= 1, `out of range at ${time}`);
    if (value < 0.1) closed += 1;
    if (value > 0.99) open += 1;
  }
  assert.ok(closed > 0, 'never closes');
  assert.ok(open > closed, 'never opens');
});

test('blink is deterministic per seed and staggered between seeds', () => {
  assert.equal(engine.blinkScale(4.2, 2), engine.blinkScale(4.2, 2));
  const a = Array.from({ length: 60 }, (_, i) => engine.blinkScale(i * 0.1, 2));
  const b = Array.from({ length: 60 }, (_, i) => engine.blinkScale(i * 0.1, 7));
  assert.notDeepEqual(a, b);
});

test('expression poses are complete and visually distinct', () => {
  const fingerprints = new Set();
  for (const expression of engine.EXPRESSIONS) {
    const pose = engine.expressionPose(expression);
    for (const key of ['eyeOpen', 'headTilt', 'earAmp', 'tailAmp', 'floatAmp', 'cheek']) {
      assert.equal(typeof pose[key], 'number', `${expression}.${key}`);
    }
    fingerprints.add(JSON.stringify(pose));
  }
  assert.equal(fingerprints.size, 4);
  assert.equal(engine.expressionPose('unknown').eyeOpen, 1);
});

test('colour sanitiser fills missing keys from the animal default', () => {
  const colors = engine.sanitizeColors({ main: '#123456' }, 'penguin');
  assert.equal(colors.main, '#123456');
  assert.equal(colors.belly, engine.DEFAULT_COLORS.penguin.belly);
  assert.equal(colors.blush, engine.DEFAULT_COLORS.penguin.blush);
});

test('preset sanitiser rejects invalid animals and keeps one good record', () => {
  const presets = engine.sanitizePresets([
    null,
    { animal: 'dragon' },
    { animal: 'bear', colors: { main: 'tomato' }, accessories: { bowtie: 'yes' }, name: '  Keep me  ' },
  ]);
  assert.equal(presets.length, 1);
  assert.equal(presets[0].name, 'Keep me');
  assert.equal(presets[0].colors.main, engine.DEFAULT_COLORS.bear.main);
  assert.equal(presets[0].accessories.bowtie, true);
  assert.equal(presets[0].expression, 'happy');
  assert.equal(presets[0].coat, 'soft');
  assert.match(presets[0].id, /^[a-z0-9-]{6,48}$/);
});

test('preset sanitiser is stable and caps the list', () => {
  const item = { animal: 'shiba', name: 'One', colors: { main: '#112233' } };
  const first = engine.sanitizePreset(item);
  const second = engine.sanitizePreset(first);
  assert.deepEqual(first, second);

  const many = Array.from({ length: 30 }, (_, i) => ({
    animal: 'bear', name: `Preset ${i}`, id: `p-test-${i}`, createdAt: i,
  }));
  const capped = engine.sanitizePresets(many);
  assert.equal(capped.length, engine.PRESET_LIMIT);
  const duplicated = engine.sanitizePresets([first, first]);
  assert.equal(duplicated.length, 1);
});

test('preset names are trimmed and length-capped', () => {
  const preset = engine.sanitizePreset({ animal: 'bunny', name: `  ${'x'.repeat(80)}  ` });
  assert.equal(preset.name.length, 42);
});

test('snapshot filenames are stable and path-safe', () => {
  const filename = engine.snapshotFilename('penguin', new Date('2026-11-04T23:59:00Z'));
  assert.equal(filename, 'cute3d-penguin-2026-11-04.png');
  assert.equal(engine.snapshotFilename('../etc/passwd', new Date('2026-01-01T00:00:00Z')), 'cute3d-pet-2026-01-01.png');
});

test('share state round-trips every field', () => {
  const encoded = engine.encodeShareState({
    animal: 'shiba',
    expression: 'curious',
    lang: 'th',
    colors: { main: '#112233', belly: '#445566', blush: '#778899' },
    accessories: { bowtie: true, partyHat: false, glasses: true },
    coat: 'plush',
    lighting: 'desk',
    fur: { length: 1.5, density: 0.9, curl: 0.7, clump: 0.2, breeze: 0.8 },
  });
  const decoded = engine.decodeShareState(`?${encoded}`);
  assert.equal(decoded.animal, 'shiba');
  assert.equal(decoded.expression, 'curious');
  assert.equal(decoded.lang, 'th');
  assert.equal(decoded.coat, 'plush');
  assert.equal(decoded.lighting, 'desk');
  assert.equal(decoded.fur.length, 1.5);
  assert.equal(decoded.fur.density, 0.9);
  assert.deepEqual(decoded.colors, { main: '#112233', belly: '#445566', blush: '#778899' });
  assert.deepEqual(decoded.accessories, { bowtie: true, partyHat: false, glasses: true });
  assert.equal(decoded.valid, true);
});

test('share decoder rejects an unknown animal but keeps a safe fallback', () => {
  const decoded = engine.decodeShareState('?a=unicorn&c=zzzzzz&x=loud&o=laser&l=fr');
  assert.equal(decoded.valid, false);
  assert.equal(decoded.expression, 'happy');
  assert.equal(decoded.lang, 'en');
  assert.deepEqual(decoded.accessories, { bowtie: false, partyHat: false, glasses: false });
  assert.match(decoded.colors.main, /^#[0-9a-f]{6}$/);
});

test('sound patterns are well formed', () => {
  const boing = engine.soundPattern('boing');
  assert.ok(boing.notes.length >= 2);
  for (const note of boing.notes) {
    assert.ok(note.from > 0 && note.to > 0);
    assert.ok(note.dur > 0 && note.at >= 0);
  }
  assert.equal(engine.soundPattern('nope'), null);
  const copy = engine.soundPattern('chime');
  copy.notes[0].from = 1;
  assert.notEqual(engine.soundPattern('chime').notes[0].from, 1, 'pattern must be a copy');
});

test('snapshot size is clamped to a sane power of two range', () => {
  assert.equal(engine.clampSnapshotSize(100), 512);
  assert.equal(engine.clampSnapshotSize(99999), 4096);
  assert.equal(engine.clampSnapshotSize(2048), 2048);
  assert.equal(engine.clampSnapshotSize('nope'), 2048);
  assert.equal(engine.clampSnapshotSize(1000) % 64, 0);
});

test('small helpers behave', () => {
  assert.equal(engine.clamp(5, 0, 3), 3);
  assert.equal(engine.lerp(0, 10, 0.25), 2.5);
  assert.equal(engine.easeOutCubic(1), 1);
  assert.equal(engine.easeOutBack(1), 1);
  assert.equal(engine.formatMeshLabel(0), '0');
  assert.equal(engine.formatMeshLabel(36.4), '36');
  assert.equal(engine.hashString('bear'), engine.hashString('bear'));
  assert.equal(engine.sanitizeCoat('plush'), 'plush');
  assert.equal(engine.sanitizeCoat('nope'), 'soft');
  assert.equal(engine.sanitizeLighting('desk'), 'desk');
  assert.equal(engine.sanitizeLighting('moon'), 'studio');
  assert.deepEqual(engine.sanitizeFur({ length: 99, density: 0, curl: 2, clump: -1, breeze: 'x' }), {
    length: 1.8, density: 0.1, curl: 1, clump: 0, breeze: 0.3,
  });
  assert.notEqual(engine.hashString('bear'), engine.hashString('bunny'));
});

test('dictionary covers both languages with identical keys', () => {
  const en = Object.keys(i18n.en).sort();
  const th = Object.keys(i18n.th).sort();
  assert.deepEqual(th, en);
  assert.ok(en.length >= 70);
  for (const key of en) {
    assert.ok(i18n.en[key].trim().length > 0, `empty EN value: ${key}`);
    assert.ok(i18n.th[key].trim().length > 0, `empty TH value: ${key}`);
  }
  assert.ok(i18n.th['pet.bear.name'].includes('หมี'));
  assert.ok(i18n.en['toast.presetSaved'].includes('{name}'));
});
