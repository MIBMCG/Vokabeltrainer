import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';

import {
  inventoryAvatarSources,
  planAvatarSources,
  rasterIssue,
} from '../../scripts/build-avatar-art.mjs';
import {AVATAR_ART, AVATAR_SMALL_URLS} from '../../src/trainer/avatar/art-manifest.js';
import {figureLayers, resolveFigureLayers} from '../../src/trainer/avatar/art.js';
import {FIGURES, ITEMS, isCompatible} from '../../src/trainer/avatar/catalog.js';
import * as artBuild from '../../scripts/build-avatar-art.mjs';

test('rendition scaling follows the target canvas even when raw source dimensions differ', () => {
  assert.equal(typeof artBuild.nonUpscaledWidths, 'function');
  // A 2048px raw source placed at scale 2 on a 1024px rig would be
  // enlarged 1.5x in a 768px output. Raw source size cannot make that safe.
  assert.deepEqual(artBuild.nonUpscaledWidths({width: 1024, height: 1536}, {scale: 2}), [256, 512]);
  assert.deepEqual(artBuild.nonUpscaledWidths({width: 1086, height: 1448}, {scale: 1.07143}), [256, 512, 768]);
  assert.deepEqual(artBuild.nonUpscaledWidths({width: 300, height: 451}, {scale: 1}), [256]);
});

function entry(name, width = 1086, height = 1448, details = {}) {
  return {
    name, width, height, bytes: 1,
    metadataName: name.replace(/\.png$/u, '.json'),
    metadataSha256: 'f'.repeat(64),
    provenanceVerified: true,
    ...details,
  };
}

function pngHeader(width = 1086, height = 1448) {
  const bytes = Buffer.alloc(24);
  Buffer.from('89504e470d0a1a0a', 'hex').copy(bytes);
  bytes.writeUInt32BE(width, 16);
  bytes.writeUInt32BE(height, 20);
  return bytes;
}

test('source planning uses only catalogue filenames, keeps one fixed canvas and ignores drafts', () => {
  const plan = planAvatarSources([
    entry('dragon.png', 1024, 1536),
    entry('dragon-margin.png'),
    entry('horse.png'),
    entry('horse-moon-head-front.png'),
    entry('horse-moon-body-front.png', 1024, 1536),
    entry('unrelated.png'),
  ]);

  assert.equal(plan.figures.dragon.base.sourceName, 'dragon.png');
  assert.equal(plan.figures.dragon.canvas.width, 1024);
  assert.equal(plan.figures.horse.items['moon-head'].front.sourceName, 'horse-moon-head-front.png');
  assert.equal(plan.figures.horse.items['moon-body'], undefined);
  assert.deepEqual(plan.misaligned, [{
    figureId: 'horse', sourceName: 'horse-moon-body-front.png',
    expected: {width: 1086, height: 1448}, actual: {width: 1024, height: 1536},
  }]);
  assert.deepEqual(plan.ignored.map(({sourceName}) => sourceName).sort(), ['dragon-margin.png', 'unrelated.png']);
  assert.equal(plan.complete, false);
});

test('human planning requires every skin and clothing layer on the same canvas', () => {
  const sources = [
    ...Array.from({length: 4}, (_, index) => entry(`explorer-girl-skin-${index}.png`)),
    ...Array.from({length: 6}, (_, index) => entry(`explorer-girl-clothing-${index}.png`)),
  ];
  sources[7] = entry('explorer-girl-clothing-3.png', 1087, 1447);
  const plan = planAvatarSources(sources);

  assert.deepEqual(Object.keys(plan.figures['explorer-girl'].skins), ['0', '1', '2', '3']);
  assert.equal(plan.figures['explorer-girl'].clothing['3'], undefined);
  assert.equal(plan.misaligned.some(({sourceName}) => sourceName === 'explorer-girl-clothing-3.png'), true);
  assert.equal(plan.missing.includes('explorer-girl:clothing:3'), true);
});

test('explicit registration accepts measured negative anchors and one-pixel raw-canvas differences', () => {
  const registration = {scale: 1.5, x: -300, y: -400};
  const canvas = {width: 1086, height: 1448};
  const plan = planAvatarSources([
    entry('horse.png'),
    entry('horse-moon-head-rear.png', 1087, 1447, {registration, canvas, metadataSha256: 'a'.repeat(64)}),
    entry('horse-moon-head-front.png', 1086, 1449, {registration, canvas, metadataSha256: 'b'.repeat(64)}),
  ]);

  const layers = plan.figures.horse.items['moon-head'];
  assert.deepEqual(layers.rear.registration, registration);
  assert.deepEqual(layers.rear.registeredBounds, {left: -300, top: -400, right: 1330.5, bottom: 1770.5});
  assert.deepEqual(layers.front.registration, registration);
  assert.deepEqual(layers.front.registeredBounds, {left: -300, top: -400, right: 1329, bottom: 1773.5});
  assert.deepEqual(plan.invalid, []);
  assert.deepEqual(plan.misaligned, []);
});

test('registration requires a matching target canvas and bounded finite transform', () => {
  const plan = planAvatarSources([
    entry('horse.png'),
    entry('horse-moon-head-front.png', 1086, 1448, {
      registration: {scale: 2.1, x: -1087, y: 0},
      canvas: {width: 1087, height: 1448},
      metadataSha256: 'c'.repeat(64),
    }),
    entry('horse-moon-body-front.png', 1086, 1448, {
      registration: {scale: 2.1, x: -1087, y: 0},
      canvas: {width: 1086, height: 1448},
      metadataSha256: 'd'.repeat(64),
    }),
  ]);

  assert.equal(plan.figures.horse.items['moon-head'], undefined);
  assert.equal(plan.figures.horse.items['moon-body'], undefined);
  assert.equal(plan.missing.includes('horse:item:moon-head'), true);
  assert.deepEqual(plan.invalid, [
    {
      figureId: 'horse',
      sourceName: 'horse-moon-body-front.png',
      reason: 'invalid-registration',
      registration: {scale: 2.1, x: -1087, y: 0},
    },
    {
      figureId: 'horse',
      sourceName: 'horse-moon-head-front.png',
      reason: 'registration-canvas-mismatch',
      canvas: {width: 1087, height: 1448},
    },
  ]);
});

test('raster validation rejects a fully transparent registered layer', () => {
  assert.equal(rasterIssue({
    sourceHasFullyTransparentPixel: true,
    hasVisiblePixel: false,
    variants: [{width: 256}],
  }), 'empty-after-registration');
  assert.equal(rasterIssue({
    sourceHasFullyTransparentPixel: true,
    hasVisiblePixel: true,
    variants: [{width: 256}],
  }), null);
});

test('corrupt catalogue PNGs become invalid while corrupt ignored drafts stay reportable', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'avatar-art-inventory-'));
  try {
    await writeFile(join(directory, 'horse.png'), Buffer.from('broken canonical png'));
    await writeFile(join(directory, 'unrelated-draft.png'), Buffer.from('broken ignored png'));
    const inventory = await inventoryAvatarSources(directory);
    const plan = planAvatarSources(inventory);

    assert.equal(inventory.every(({invalidPng}) => invalidPng === true), true);
    assert.equal(plan.invalid.some(({sourceName, reason}) => sourceName === 'horse.png' && reason === 'invalid-png'), true);
    assert.equal(plan.missing.includes('horse:base'), true);
    assert.equal(plan.ignored.some(({sourceName}) => sourceName === 'unrelated-draft.png'), true);
  } finally {
    await rm(directory, {recursive: true, force: true});
  }
});

test('canonical sources require traceable matching sidecars while unsupplied drafts remain ignored', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'avatar-art-provenance-'));
  try {
    await Promise.all([
      writeFile(join(directory, 'horse.png'), pngHeader()),
      writeFile(join(directory, 'tiger.png'), pngHeader()),
      writeFile(join(directory, 'tiger.json'), JSON.stringify({
        sourceFile: 'dragon.png',
        provenance: 'Copied from an existing generated layer.',
      })),
      writeFile(join(directory, 'phoenix.png'), pngHeader()),
      writeFile(join(directory, 'phoenix.json'), JSON.stringify({registration: {scale: 1, x: 0, y: 0}})),
      writeFile(join(directory, 'unrelated-draft.png'), pngHeader()),
    ]);
    const plan = planAvatarSources(await inventoryAvatarSources(directory));

    assert.equal(plan.invalid.some(({sourceName, reason}) =>
      sourceName === 'horse.png' && reason === 'missing-metadata-sidecar'), true);
    assert.equal(plan.invalid.some(({sourceName, reason, declaredSource}) =>
      sourceName === 'tiger.png' && reason === 'metadata-source-mismatch' && declaredSource === 'dragon.png'), true);
    assert.equal(plan.invalid.some(({sourceName, reason}) =>
      sourceName === 'phoenix.png' && reason === 'missing-provenance'), true);
    assert.equal(plan.ignored.some(({sourceName}) => sourceName === 'unrelated-draft.png'), true);
    assert.equal(plan.invalid.some(({sourceName}) => sourceName === 'unrelated-draft.png'), false);
  } finally {
    await rm(directory, {recursive: true, force: true});
  }
});

test('current canonical source sidecars are parseable, traceable and filename-consistent', async () => {
  const inventory = await inventoryAvatarSources(resolve('docs/design/avatar-shop-sources'));
  const plan = planAvatarSources(inventory);
  const provenanceReasons = new Set([
    'missing-metadata-sidecar', 'invalid-metadata-json', 'missing-provenance', 'metadata-source-mismatch',
  ]);

  assert.deepEqual(plan.invalid.filter(({reason}) => provenanceReasons.has(reason)), []);
  assert.equal(inventory.filter((value) => value.metadataName && !value.provenanceVerified).length, 0);
  assert.equal(plan.ignored.some(({sourceName}) => sourceName === 'deer-mist-cropped-draft.png'), true);
  assert.equal(plan.ignored.some(({sourceName}) => sourceName === 'dragon-cropped-draft.png'), true);
});

test('layer resolution orders rear, body, clothing and front without accepting incompatible IDs', () => {
  const asset = (key) => ({key, width: 768, height: 1024, variants: [{width: 256, url: `${key}-256.webp`}], fallbackUrl: `${key}-256.webp`});
  const assets = Object.fromEntries([
    'horse-base', 'moon-rear', 'moon-front', 'stars-front',
  ].map((key) => [key, asset(key)]));
  const manifest = {
    assets,
    figures: {
      horse: {
        canvas: {width: 1086, height: 1448}, base: 'horse-base', skins: {}, clothing: {},
        items: {
          'moon-body': {rear: 'moon-rear', front: 'moon-front'},
          'stars-adornment': {front: 'stars-front'},
        },
      },
    },
  };

  const layers = resolveFigureLayers({
    figureId: 'horse', skin: 0, clothing: 0,
    equipment: {head: 'crystal-head', body: 'moon-body', adornment: 'stars-adornment'},
  }, manifest);
  assert.deepEqual(layers.map(({key, plane}) => [key, plane]), [
    ['moon-rear', 'rear'],
    ['horse-base', 'base'],
    ['moon-front', 'front'],
    ['stars-front', 'front'],
  ]);
  assert.deepEqual(resolveFigureLayers({figureId: 'horse', equipment: {}}, {assets: {}, figures: {}}), []);
});

test('human colour layers use exact selected variants and a clothing item replaces colour clothing', () => {
  const asset = (key) => ({key, width: 768, height: 1024, variants: [{width: 256, url: `${key}-256.webp`}], fallbackUrl: `${key}-256.webp`});
  const assets = Object.fromEntries([
    'girl-skin-2', 'girl-clothing-4', 'knight-front',
  ].map((key) => [key, asset(key)]));
  const manifest = {
    assets,
    figures: {
      'explorer-girl': {
        canvas: {width: 1086, height: 1448}, base: null,
        skins: {'2': 'girl-skin-2'}, clothing: {'4': 'girl-clothing-4'},
        items: {'knight-clothing': {front: 'knight-front'}},
      },
    },
  };

  assert.deepEqual(resolveFigureLayers({
    figureId: 'explorer-girl', skin: 2, clothing: 4, equipment: {},
  }, manifest).map(({key}) => key), ['girl-skin-2', 'girl-clothing-4']);
  assert.deepEqual(resolveFigureLayers({
    figureId: 'explorer-girl', skin: 2, clothing: 4,
    equipment: {clothing: 'knight-clothing'},
  }, manifest).map(({key}) => key), ['girl-skin-2', 'knight-front']);
});

test('every catalogue-compatible figure and item combination preserves rear-to-front composition', () => {
  const assets = {};
  const figures = {};
  const addAsset = (key) => {
    assets[key] = {
      key, width: 768, height: 1024,
      variants: [{width: 256, url: `${key}-256.webp`}],
      fallbackUrl: `${key}-256.webp`,
    };
    return key;
  };
  for (const figure of FIGURES) {
    const human = figure.group === 'human';
    const art = {
      canvas: {width: 1086, height: 1448},
      base: human ? null : addAsset(`${figure.id}-base`),
      skins: human ? {'0': addAsset(`${figure.id}-skin`)} : {},
      clothing: human ? {'0': addAsset(`${figure.id}-clothing`)} : {},
      items: {},
    };
    for (const item of ITEMS.filter(({id}) => isCompatible(id, figure.id))) {
      art.items[item.id] = {
        rear: addAsset(`${figure.id}-${item.id}-rear`),
        front: addAsset(`${figure.id}-${item.id}-front`),
      };
    }
    figures[figure.id] = art;
  }
  const manifest = {assets, figures};

  for (const figure of FIGURES) {
    for (const item of ITEMS.filter(({id}) => isCompatible(id, figure.id))) {
      const layers = resolveFigureLayers({
        figureId: figure.id,
        skin: 0,
        clothing: 0,
        equipment: {[item.slot]: item.id},
      }, manifest);
      assert.deepEqual(layers.filter(({itemId}) => itemId === item.id).map(({plane}) => plane), ['rear', 'front']);
      assert.ok(layers.findIndex(({plane}) => plane === 'rear') < layers.findIndex(({plane}) => plane === 'base'));
      assert.ok(layers.findLastIndex(({plane}) => plane === 'front') > layers.findIndex(({plane}) => plane === 'base'));
      assert.equal(
        layers.some(({plane}) => plane === 'clothing'),
        figure.group === 'human' && item.slot !== 'clothing',
      );
    }
  }
});

test('generated manifest exposes ordered non-upscaled renditions, hashes, byte counts and explicit partial coverage', () => {
  assert.equal(Object.keys(AVATAR_ART.figures).length, 13);
  assert.equal(typeof AVATAR_ART.coverage.complete, 'boolean');
  assert.ok(Array.isArray(AVATAR_ART.coverage.missing));
  assert.ok(Array.isArray(AVATAR_ART.coverage.misaligned));
  assert.equal(new Set(AVATAR_SMALL_URLS).size, AVATAR_SMALL_URLS.length);
  const expectedMissing = [];
  const referencedAssets = new Set();
  for (const figure of FIGURES) {
    const art = AVATAR_ART.figures[figure.id];
    assert.ok(art, `missing art figure ${figure.id}`);
    if (figure.group === 'human') {
      assert.equal(Object.keys(art.skins).length, 4);
      assert.equal(Object.keys(art.clothing).length, 6);
    } else {
      assert.ok(art.base, `missing base for ${figure.id}`);
    }
    if (art.base) referencedAssets.add(art.base);
    for (const key of Object.values(art.skins)) referencedAssets.add(key);
    for (const key of Object.values(art.clothing)) referencedAssets.add(key);
    for (const item of ITEMS.filter(({id}) => isCompatible(id, figure.id))) {
      const layers = art.items[item.id];
      if (!layers || Object.keys(layers).length === 0) expectedMissing.push(`${figure.id}:item:${item.id}`);
      else for (const key of Object.values(layers)) referencedAssets.add(key);
    }
  }
  assert.deepEqual(AVATAR_ART.coverage.missing, expectedMissing.sort());
  assert.deepEqual([...referencedAssets].sort(), Object.keys(AVATAR_ART.assets).sort());
  const expectedComplete = expectedMissing.length === 0
    && AVATAR_ART.coverage.misaligned.length === 0
    && AVATAR_ART.coverage.invalid.length === 0;
  assert.equal(AVATAR_ART.coverage.complete, expectedComplete);
  assert.equal(AVATAR_ART.coverage.ready,
    expectedComplete && AVATAR_ART.coverage.smallBytes <= AVATAR_ART.coverage.smallBudgetBytes);
  for (const figureId of ['explorer-girl', 'explorer-boy']) {
    assert.ok(AVATAR_ART.figures[figureId].items['knight-clothing'].front);
  }
  for (const asset of Object.values(AVATAR_ART.assets)) {
    assert.match(asset.sourceSha256, /^[a-f0-9]{64}$/u);
    assert.ok(asset.sourceBytes > 0);
    assert.ok(asset.outputBytes > 0);
    assert.deepEqual(Object.keys(asset.registration).sort(), ['scale', 'x', 'y']);
    assert.match(asset.derivationSha256, /^[a-f0-9]{64}$/u);
    if (asset.metadataSha256) assert.match(asset.metadataSha256, /^[a-f0-9]{64}$/u);
    assert.equal(asset.fallbackUrl, asset.variants[0].url);
    assert.deepEqual(
      asset.variants.map(({width}) => width),
      [...asset.variants.map(({width}) => width)].sort((a, b) => a - b),
    );
    assert.ok(asset.variants.every(({width}) => width <= asset.sourceWidth));
    assert.ok(asset.variants.every(({width, height}) =>
      width / asset.canvasWidth * asset.registration.scale <= 1
      && height / asset.canvasHeight * asset.registration.scale <= 1));
    assert.equal(AVATAR_SMALL_URLS.includes(asset.fallbackUrl), true);
  }
});

test('default resolver rejects invalid catalogue IDs and missing figure art safely', () => {
  assert.deepEqual(figureLayers({figureId: '__proto__', equipment: {}}), []);
  const missingFigureId = ['phoenix', 'wolf-aurora', 'deer-mist'].find((id) => !AVATAR_ART.figures[id]);
  if (missingFigureId) assert.deepEqual(figureLayers({figureId: missingFigureId, equipment: {}}), []);
});
