import test from 'node:test';
import assert from 'node:assert/strict';

import {ART, AVATAR_LAYER_KEYS, PRECACHE_ART_URLS} from '../../src/trainer/ui/art-manifest.js';

const expectedAvatarKeys = [
  ...Array.from({length: 4}, (_, index) => `avatar-skin-${index}`),
  ...Array.from({length: 6}, (_, index) => `avatar-clothing-${index}`),
  'avatar-head-cap',
  'avatar-head-sunhat',
  'avatar-head-mountainhat',
  'avatar-back-backpack',
  'avatar-hand-binoculars',
  'avatar-hand-compass',
];

test('art manifest exposes the complete finite island and avatar set', () => {
  assert.deepEqual(Object.keys(ART).sort(), ['island-beach', 'island-journey', ...expectedAvatarKeys].sort());
  assert.deepEqual(AVATAR_LAYER_KEYS, {
    skin: ['avatar-skin-0', 'avatar-skin-1', 'avatar-skin-2', 'avatar-skin-3'],
    clothing: Array.from({length: 6}, (_, index) => `avatar-clothing-${index}`),
    head: {cap: 'avatar-head-cap', sunhat: 'avatar-head-sunhat', mountainhat: 'avatar-head-mountainhat'},
    back: {backpack: 'avatar-back-backpack'},
    hand: {binoculars: 'avatar-hand-binoculars', compass: 'avatar-hand-compass'},
  });
});

test('each art asset has ordered responsive renditions and a precached fallback', () => {
  for (const [key, asset] of Object.entries(ART)) {
    assert.ok(Number.isInteger(asset.width) && asset.width > 0, key);
    assert.ok(Number.isInteger(asset.height) && asset.height > 0, key);
    assert.ok(asset.variants.length >= 1, key);
    assert.deepEqual(asset.variants.map(({width}) => width), [...asset.variants.map(({width}) => width)].sort((a, b) => a - b));
    assert.equal(asset.fallbackUrl, asset.variants[0].url, key);
    assert.ok(asset.variants.every(({url}) => url.startsWith('../../../trainer/assets/art/') && url.endsWith('.webp')), key);
    assert.ok(PRECACHE_ART_URLS.includes(asset.fallbackUrl), key);
  }
  assert.equal(new Set(PRECACHE_ART_URLS).size, PRECACHE_ART_URLS.length);
});
