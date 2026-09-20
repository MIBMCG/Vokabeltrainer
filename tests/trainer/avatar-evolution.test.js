import test from 'node:test';
import assert from 'node:assert/strict';
import {FIGURES, figureById, levelEntitlements} from '../../src/trainer/avatar/catalog.js';
import {
  EVOLUTION_VERSION,
  EVOLUTION_FORMS,
  evolutionFormId,
  evolutionAssetKey,
  evolutionOffer,
} from '../../src/trainer/avatar/evolution.js';

test('catalogue contains four sequentially priced forms for all figures', () => {
  assert.equal(EVOLUTION_VERSION, 1);
  assert.equal(EVOLUTION_FORMS.length, 52);
  assert.equal(new Set(EVOLUTION_FORMS.map(({id}) => id)).size, 52);
  assert.equal(new Set(EVOLUTION_FORMS.flatMap(({assetKeys}) => assetKeys)).size, 76);
  assert.equal(FIGURES.length, 13);
  for (const figure of FIGURES) {
    assert.deepEqual(EVOLUTION_FORMS.filter((form) => form.figureId === figure.id)
      .map(({stage, price}) => [stage, price]), [[1, 0], [2, 200], [3, 400], [4, 800]]);
  }
  assert.deepEqual(levelEntitlements(1).figureIds, ['explorer-girl', 'explorer-boy']);
  assert.equal(figureById('dragon').unlock.level, 9);
});

test('stable form IDs and asset keys include free human skin variants', () => {
  assert.equal(evolutionFormId('dragon', 3), 'evolution:dragon:3');
  assert.equal(evolutionAssetKey('dragon', 3), 'dragon-stage-3');
  const id = evolutionFormId('explorer-girl', 2);
  const form = EVOLUTION_FORMS.find(({id: formId}) => formId === id);
  assert.equal(form.price, 200);
  assert.deepEqual(form.assetKeys, [0, 1, 2, 3]
    .map((skin) => evolutionAssetKey('explorer-girl', 2, skin)));
  assert.equal(evolutionFormId('explorer-girl', 2), evolutionFormId('explorer-girl', 2));
});

test('offer shows only the next stage and its exact remaining cost', () => {
  const cases = [
    [0, 1, 'saving', 200, 200, 0],
    [199, 1, 'saving', 200, 1, 199 / 200],
    [200, 1, 'available', 200, 0, 1],
    [201, 1, 'available', 200, 0, 1],
    [399, 2, 'saving', 400, 1, 399 / 400],
    [400, 2, 'available', 400, 0, 1],
    [799, 3, 'saving', 800, 1, 799 / 800],
    [800, 3, 'available', 800, 0, 1],
  ];
  for (const [availablePoints, highestOwnedStage, status, price, missingPoints, progress] of cases) {
    assert.deepEqual(evolutionOffer({figureId: 'dragon', highestOwnedStage, availablePoints}), {
      status, nextStage: highestOwnedStage + 1, price, missingPoints, progress,
    });
  }
  assert.equal(evolutionOffer({figureId: 'dragon', highestOwnedStage: 1, availablePoints: 1400}).nextStage, 2);
  assert.equal(evolutionOffer({figureId: 'dragon', highestOwnedStage: 3, availablePoints: Number.MAX_SAFE_INTEGER}).progress, 1);
});

test('locked base and complete form cannot offer a purchase', () => {
  assert.deepEqual(evolutionOffer({figureId: 'dragon', highestOwnedStage: 0, availablePoints: 9000}),
    {status: 'base-locked', nextStage: null, price: null, missingPoints: null, progress: 0});
  assert.deepEqual(evolutionOffer({figureId: 'dragon', highestOwnedStage: 4, availablePoints: 0}),
    {status: 'complete', nextStage: null, price: null, missingPoints: 0, progress: 1});
});

test('catalogue and nested asset-key lists are deeply immutable', () => {
  assert.ok(Object.isFrozen(EVOLUTION_FORMS));
  for (const form of EVOLUTION_FORMS) {
    assert.ok(Object.isFrozen(form));
    assert.ok(Object.isFrozen(form.assetKeys));
  }
});

test('offer does not mutate its input', () => {
  const input = {figureId: 'dragon', highestOwnedStage: 2, availablePoints: 399};
  const before = structuredClone(input);
  evolutionOffer(input);
  assert.deepEqual(input, before);
});

test('invalid figures, stages, skins, and point values throw TypeError', () => {
  for (const stage of [0, 5, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => evolutionFormId('dragon', stage), TypeError);
    assert.throws(() => evolutionAssetKey('dragon', stage), TypeError);
  }
  assert.throws(() => evolutionFormId('unknown', 1), TypeError);
  assert.throws(() => evolutionAssetKey('unknown', 1), TypeError);
  for (const skin of [-1, 4, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => evolutionAssetKey('explorer-boy', 1, skin), TypeError);
  }
  assert.throws(() => evolutionAssetKey('dragon', 1, 1), TypeError);
  for (const highestOwnedStage of [-1, 5, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => evolutionOffer({figureId: 'dragon', highestOwnedStage, availablePoints: 0}), TypeError);
  }
  for (const availablePoints of [-1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => evolutionOffer({figureId: 'dragon', highestOwnedStage: 1, availablePoints}), TypeError);
  }
  assert.throws(() => evolutionOffer({figureId: 'unknown', highestOwnedStage: 1, availablePoints: 0}), TypeError);
});
