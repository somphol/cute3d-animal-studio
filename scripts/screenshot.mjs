#!/usr/bin/env node
// Regenerates every image in assets/ from a live headless Chrome render.
//
//   node scripts/screenshot.mjs
//   CHROME=/path/to/chrome node scripts/screenshot.mjs
//
// Desktop, character, Thai and mobile stills, a transparent 1024px snapshot
// and the 1200x630 social card. Safe to re-run: files are overwritten.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { connect, launchBrowser, startServer } from '../tests/lib/harness.mjs';
import { ROOT } from '../tests/lib/fixtures.mjs';

const ASSETS = join(ROOT, 'assets');
mkdirSync(ASSETS, { recursive: true });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const server = await startServer(ROOT);
const browser = await launchBrowser({ width: 1600, height: 1000 });
const target = await (await fetch(`http://127.0.0.1:${browser.port}/json/new?about:blank`, { method: 'PUT' })).json();
const cdp = await connect(target.webSocketDebuggerUrl);

await cdp.send('Page.enable');
await cdp.send('Runtime.enable');
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
await cdp.send('Page.navigate', { url: `${server.url}/` });
await cdp.waitFor('Boolean(window.__cute3d && window.__cute3d.ready)', { timeout: 30000 });
await sleep(1200);

const evaluate = async (expression) => {
  const { result, exceptionDetails } = await cdp.send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) throw new Error(exceptionDetails.exception?.description || exceptionDetails.text);
  return result?.value;
};

const shoot = async (name) => {
  const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(ASSETS, name), Buffer.from(shot.data, 'base64'));
  console.log(`✓ assets/${name}`);
};

const stage = async (animal, expression, accessories, lang = 'en', coat = 'plush', lighting = 'studio') => {
  await evaluate(`
    window.__cute3d.setLang('${lang}');
    window.__cute3d.setAnimal('${animal}');
    window.__cute3d.setCoat('${coat}');
    window.__cute3d.setLighting('${lighting}');
    window.__cute3d.setExpression('${expression}');
    window.__cute3d.setAccessory('bowtie', ${accessories});
    window.__cute3d.setAccessory('partyHat', ${accessories});
    window.__cute3d.setAccessory('glasses', false);
  `);
  await sleep(1300);
};

await stage('bear', 'happy', false);
await shoot('screenshot-studio.png');

await stage('bunny', 'wiggle', true);
await shoot('screenshot-bunny.png');

await stage('penguin', 'curious', true);
await shoot('screenshot-penguin.png');

await stage('shiba', 'happy', false);
await shoot('screenshot-shiba.png');

await stage('koala', 'happy', false);
await shoot('screenshot-koala.png');

await stage('conure', 'curious', true);
await shoot('screenshot-conure.png');

await stage('fold', 'sleepy', false);
await shoot('screenshot-fold.png');

await stage('shiba', 'sleepy', true, 'th');
await shoot('screenshot-thai.png');

await stage('koala', 'happy', true, 'en', 'plush', 'sky');
await shoot('screenshot-sky.png');

await stage('fold', 'sleepy', false, 'en', 'plush', 'desk');
await shoot('screenshot-desk.png');

await stage('koala', 'happy', false, 'en', 'plush', 'studio');
const snapshot = await evaluate('window.__cute3d.snapshotDataUrl()');
writeFileSync(join(ASSETS, 'snapshot-transparent.png'), Buffer.from(snapshot.split(',')[1], 'base64'));
console.log('✓ assets/snapshot-transparent.png');

await stage('koala', 'happy', true, 'en', 'plush', 'studio');

const card = await evaluate(`(async () => {
  const url = window.__cute3d.snapshotDataUrl();
  const img = await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext('2d');

  const bg = ctx.createLinearGradient(0, 0, 1200, 630);
  bg.addColorStop(0, '#fff8f1');
  bg.addColorStop(0.5, '#fdf0f4');
  bg.addColorStop(1, '#ece7fb');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1200, 630);

  ctx.save();
  ctx.filter = 'blur(52px)';
  ctx.globalAlpha = 0.65;
  ctx.fillStyle = '#ffd9c4';
  ctx.beginPath(); ctx.arc(1010, 110, 250, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ded4ff';
  ctx.beginPath(); ctx.arc(1050, 560, 260, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffd2e4';
  ctx.beginPath(); ctx.arc(760, 360, 180, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(960, 315, 250, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  const petHeight = 560;
  const petWidth = petHeight;
  const petX = 900;
  const petY = 40;
  ctx.drawImage(img, petX - petWidth / 2, petY, petWidth, petHeight);

  ctx.fillStyle = '#352a2e';
  ctx.font = '900 92px "Avenir Next Rounded", "Nunito", "Trebuchet MS", sans-serif';
  ctx.fillText('Cute3D', 76, 178);

  const accent = ctx.measureText('Cute').width;
  ctx.fillStyle = '#e8789a';
  ctx.fillText('3D', 76 + accent - 6, 178);

  ctx.fillStyle = '#6c5c61';
  ctx.font = '700 26px "Avenir Next Rounded", "Nunito", "Trebuchet MS", sans-serif';
  ctx.fillText('PROCEDURAL CODE-ONLY ANIMAL STUDIO', 80, 222);

  ctx.fillStyle = '#352a2e';
  ctx.font = '800 34px "Avenir Next Rounded", "Nunito", "Trebuchet MS", sans-serif';
  ctx.fillText('Seven pets. Real coats. Zero files.', 80, 312);

  ctx.fillStyle = '#6c5c61';
  ctx.font = '600 22px "Avenir Next Rounded", "Nunito", "Trebuchet MS", sans-serif';
  ctx.fillText('Soft fur and layered feathers, generated in code.', 80, 356);
  ctx.fillText('Orbit, customize, save presets and export a transparent PNG.', 80, 390);

  const chips = ['7 original pets', 'Fur + feathers', 'EN / TH'];
  let x = 80;
  ctx.font = '800 18px "Avenir Next Rounded", "Nunito", "Trebuchet MS", sans-serif';
  for (const chip of chips) {
    const w = ctx.measureText(chip).width + 34;
    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.beginPath();
    ctx.roundRect(x, 428, w, 44, 22);
    ctx.fill();
    ctx.strokeStyle = 'rgba(53,42,46,0.10)';
    ctx.stroke();
    ctx.fillStyle = '#6c5c61';
    ctx.fillText(chip, x + 17, 456);
    x += w + 12;
  }

  ctx.fillStyle = '#a19096';
  ctx.font = '700 17px "Avenir Next Rounded", "Nunito", "Trebuchet MS", sans-serif';
  ctx.fillText('somphol.github.io/cute3d-animal-studio', 80, 560);

  ctx.fillStyle = 'rgba(53,42,46,0.10)';
  ctx.beginPath();
  ctx.roundRect(80, 584, 1040, 1, 1);
  ctx.fill();
  ctx.fillStyle = '#6c5c61';
  ctx.font = '600 16px "Avenir Next Rounded", "Nunito", "Trebuchet MS", sans-serif';
  ctx.fillText('Built with Three.js  •  Designed and built with OpenCode + DeepSeek V4.1 Flash', 80, 612);

  return canvas.toDataURL('image/png');
})()`);
writeFileSync(join(ASSETS, 'og-card.png'), Buffer.from(card.split(',')[1], 'base64'));
console.log('✓ assets/og-card.png');

// Mobile pass
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await cdp.send('Page.navigate', { url: `${server.url}/` });
await cdp.waitFor('Boolean(window.__cute3d && window.__cute3d.ready)', { timeout: 30000 });
await evaluate("window.__cute3d.setAnimal('conure'); window.__cute3d.setCoat('plush'); window.__cute3d.setAccessory('partyHat', true); window.__cute3d.setLang('en');");
await sleep(1400);
await shoot('screenshot-mobile.png');

cdp.close();
browser.proc.kill();
await server.close();
console.log('All assets regenerated.');
