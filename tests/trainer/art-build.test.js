import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

import {loadArtSources, loadAvatarSource} from '../../scripts/build-art.mjs';

const expectedAvatarFiles = {
  'avatar-skin-0': 'explorer-boy-skin-0.png',
  'avatar-skin-1': 'explorer-boy-skin-1.png',
  'avatar-skin-2': 'explorer-boy-skin-2.png',
  'avatar-skin-3': 'explorer-boy-skin-3.png',
  'avatar-clothing-0': 'explorer-boy-clothing-0.png',
  'avatar-clothing-1': 'explorer-boy-clothing-1.png',
  'avatar-clothing-2': 'explorer-boy-clothing-2.png',
  'avatar-clothing-3': 'explorer-boy-clothing-3.png',
  'avatar-clothing-4': 'explorer-boy-clothing-4.png',
  'avatar-clothing-5': 'explorer-boy-clothing-5.png',
  'avatar-head-cap': 'explorer-boy-cap-front.png',
  'avatar-head-sunhat': 'explorer-boy-sunhat-front.png',
  'avatar-head-mountainhat': 'explorer-boy-mountainhat-front.png',
  'avatar-back-backpack': 'explorer-boy-backpack-rear.png',
  'avatar-hand-binoculars': 'explorer-boy-binoculars-front.png',
  'avatar-hand-compass': 'explorer-boy-compass-front.png',
};

test('legacy avatar keys map to the 16 registered full-canvas boy sources without bbox targets', async () => {
  const sources = await loadArtSources();
  const landscapes = sources.filter(({kind}) => kind === 'landscape');
  const avatars = sources.filter(({kind}) => kind === 'avatar');

  assert.deepEqual(landscapes.map(({key, file}) => [key, file]), [
    ['island-beach', 'island-beach.png'],
    ['island-journey', 'island-journey.png'],
  ]);
  assert.deepEqual(Object.fromEntries(avatars.map(({key, file}) => [key, file])), expectedAvatarFiles);
  for (const source of avatars) {
    assert.deepEqual(source.canvas, {width: 1086, height: 1448}, source.key);
    assert.equal(Object.hasOwn(source, 'target'), false, source.key);
    assert.equal(typeof source.registration.scale, 'number', source.key);
    assert.equal(typeof source.registration.x, 'number', source.key);
    assert.equal(typeof source.registration.y, 'number', source.key);
    assert.ok(source.registration.scale > 0 && source.registration.scale <= 2, source.key);
    assert.ok(source.widths.every((width) => width / source.canvas.width * source.registration.scale <= 1), source.key);
    assert.ok(source.metadataName.endsWith('.json'), source.key);
  }
});

test('an avatar PNG without its registration sidecar is rejected instead of normalized heuristically', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'legacy-avatar-source-'));
  try {
    await writeFile(join(directory, 'explorer-boy-skin-0.png'), Buffer.from('placeholder'));
    await assert.rejects(
      loadAvatarSource({key: 'avatar-skin-0', file: 'explorer-boy-skin-0.png'}, {sourceRoot: directory}),
      /Missing avatar sidecar: explorer-boy-skin-0\.json/u,
    );
  } finally {
    await rm(directory, {recursive: true, force: true});
  }
});

test('no-upscale validation uses the registered target canvas instead of the raw PNG width', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'legacy-avatar-upscale-'));
  const pngHeader = Buffer.alloc(24);
  Buffer.from('89504e470d0a1a0a', 'hex').copy(pngHeader);
  pngHeader.writeUInt32BE(2048, 16);
  pngHeader.writeUInt32BE(2048, 20);
  try {
    await writeFile(join(directory, 'explorer-boy-skin-0.png'), pngHeader);
    await writeFile(join(directory, 'explorer-boy-skin-0.json'), JSON.stringify({
      canvas: {width: 1086, height: 1448},
      registration: {scale: 2, x: 0, y: 0},
    }));
    await assert.rejects(
      loadAvatarSource({key: 'avatar-skin-0', file: 'explorer-boy-skin-0.png'}, {sourceRoot: directory}),
      /rendition would upscale source pixels at 768px/u,
    );
  } finally {
    await rm(directory, {recursive: true, force: true});
  }
});
