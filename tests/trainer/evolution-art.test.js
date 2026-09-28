import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile, stat} from 'node:fs/promises';

import {EVOLUTION_ART, EVOLUTION_SMALL_URLS} from '../../src/trainer/avatar/evolution-art-manifest.js';
import {evolutionArt, evolutionPicture} from '../../src/trainer/avatar/evolution-art.js';

const sourceRoot = new URL('../../docs/design/avatar-evolution-sources/', import.meta.url);
const outputRoot = new URL('../../trainer/assets/avatar-evolution/', import.meta.url);
const selectedSources = ['dragon-stage-1-v3.png', 'dragon-stage-2-v3.png', 'dragon-stage-3-v1.png', 'dragon-stage-4-v2.png'];

function pngDimensions(bytes) {
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  return {width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20)};
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function webpDimensions(bytes) {
  assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
  assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
  assert.equal(bytes.toString('ascii', 12, 16), 'VP8X');
  assert.ok(bytes[20] & 0x10, 'alpha flag');
  assert.ok(bytes.includes(Buffer.from('ALPH')), 'alpha chunk');
  return {
    width: 1 + bytes.readUIntLE(24, 3),
    height: 1 + bytes.readUIntLE(27, 3),
  };
}

test('manifest describes only the four approved dragon sources and real transparent WebP derivatives', async () => {
  assert.deepEqual(Object.keys(EVOLUTION_ART.assets).sort(), [1, 2, 3, 4].map((stage) => `dragon-stage-${stage}`));
  assert.equal(EVOLUTION_SMALL_URLS.length, 4);
  for (let stage = 1; stage <= 4; stage += 1) {
    const key = `dragon-stage-${stage}`;
    const asset = EVOLUTION_ART.assets[key];
    const source = await readFile(new URL(selectedSources[stage - 1], sourceRoot));
    const original = await readFile(new URL(`${key}.png`, outputRoot));
    const dimensions = pngDimensions(source);
    assert.equal(sha256(original), sha256(source), 'existing PNG is the selected source, unchanged');
    assert.equal(asset.sourceName, selectedSources[stage - 1]);
    assert.equal(asset.sourceBytes, source.length);
    assert.equal(asset.sourceSha256, sha256(source));
    assert.equal(asset.sourceWidth, dimensions.width);
    assert.equal(asset.sourceHeight, dimensions.height);
    assert.deepEqual(asset.variants.map(({width}) => width), [256, 512, 768]);
    assert.equal(asset.fallbackUrl, asset.variants[0].url);
    assert.ok(EVOLUTION_SMALL_URLS.includes(asset.fallbackUrl));
    for (const variant of asset.variants) {
      assert.ok(variant.width <= dimensions.width, 'no width upscaling');
      assert.ok(variant.height <= dimensions.height, 'no height upscaling');
      assert.equal(variant.url, `../../../trainer/assets/avatar-evolution/${key}-${variant.width}.webp`);
      const bytes = await readFile(new URL(`${key}-${variant.width}.webp`, outputRoot));
      assert.deepEqual(webpDimensions(bytes), {width: variant.width, height: variant.height});
      assert.equal(variant.sha256, sha256(bytes));
      assert.equal((await stat(new URL(`${key}-${variant.width}.webp`, outputRoot))).size, variant.bytes);
    }
  }
});

test('build report totals match the selected sources and all generated derivatives', async () => {
  const report = JSON.parse(await readFile(new URL('build-report.json', outputRoot), 'utf8'));
  const assets = Object.values(EVOLUTION_ART.assets);
  assert.equal(report.totals.originalBytes, assets.reduce((sum, asset) => sum + asset.sourceBytes, 0));
  assert.equal(report.totals.smallBytes, assets.reduce((sum, asset) => sum + asset.variants[0].bytes, 0));
  assert.equal(report.totals.allBytes, assets.reduce((sum, asset) => sum + asset.variants.reduce((part, variant) => part + variant.bytes, 0), 0));
});

test('missing forms have no image; each dragon stage selects its own fallback', () => {
  for (let stage = 1; stage <= 4; stage += 1) {
    assert.match(evolutionArt('dragon', stage), new RegExp(`dragon-stage-${stage}-256\\.webp$`));
  }
  assert.equal(evolutionArt('explorer-girl', 1), null);
  assert.equal(evolutionArt('unknown', 1), null);
  assert.equal(evolutionArt('dragon', 5), null);
  assert.equal(evolutionPicture('unknown', 1), null);
});

test('picture exposes responsive images and recovers to the small fallback on error', () => {
  const previous = globalThis.document;
  globalThis.document = {
    createElement(tagName) {
      return {
        tagName, className: '', dataset: {}, style: {}, listeners: {},
        append(child) { this.child = child; },
        dispatchEvent(event) { this.dispatched = event; },
        addEventListener(type, handler) { this.listeners[type] = handler; },
        removeAttribute(name) { delete this[name]; },
        setAttribute(name, value) { this[name] = value; },
      };
    },
  };
  try {
    const picture = evolutionPicture('dragon', 3, {alt: 'Drachenform', className: 'shop-card', sizes: '(max-width: 500px) 50vw, 256px'});
    assert.equal(picture.tagName, 'picture');
    assert.equal(picture.className, 'evolution-art shop-card');
    assert.equal(picture.child.alt, 'Drachenform');
    assert.equal(picture.child.sizes, '(max-width: 500px) 50vw, 256px');
    assert.match(picture.child.srcset, /dragon-stage-3-768\.webp 768w/);
    picture.child.listeners.error();
    assert.equal(picture.child.srcset, undefined);
    assert.match(picture.child.src, /dragon-stage-3-256\.webp$/);
    picture.child.listeners.error();
    assert.equal(picture.dataset.complete, 'false');
    assert.equal(picture.dataset.artUnavailable, 'true');
    assert.equal(picture.dispatched.type, 'evolution-art-unavailable');
    assert.equal(picture.dispatched.bubbles, true);
    assert.deepEqual(picture.dispatched.detail, {figureId: 'dragon', stage: 3});
    assert.equal(picture.child.className, 'evolution-art-unavailable');
    assert.equal(picture.child.textContent, 'Bild gerade nicht verfügbar');
    assert.equal(picture.child['aria-label'], 'Drachenform: Bild gerade nicht verfügbar');
    assert.equal(picture.child.style.display, 'grid');

    const initialSmall = evolutionPicture('dragon', 1, {alt: 'Junger Drache'});
    initialSmall.child.currentSrc = initialSmall.child.src;
    initialSmall.child.listeners.error();
    assert.equal(initialSmall.dataset.complete, 'false');
    assert.equal(initialSmall.dataset.artUnavailable, 'true');
    assert.equal(initialSmall.child.textContent, 'Bild gerade nicht verfügbar');
  } finally {
    globalThis.document = previous;
  }
});
