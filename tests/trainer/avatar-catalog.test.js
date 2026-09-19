import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CATALOG_VERSION,
  FIGURES,
  ITEMS,
  LEGACY_ITEM_IDS,
  figureById,
  isCompatible,
  itemById,
  levelEntitlements,
} from '../../src/trainer/avatar/catalog.js';
import {normalizeSelection} from '../../src/trainer/avatar/selection.js';

const SHOP_SET_IDS = ['moon', 'stars', 'crystal', 'storm', 'sun', 'aurora', 'forest', 'obsidian', 'jungle', 'runes'];

function deeplyFrozen(value) {
  if (value === null || typeof value !== 'object' || !Object.isFrozen(value)) return false;
  return Object.values(value).every((child) => (
    child === null || typeof child !== 'object' || deeplyFrozen(child)
  ));
}

test('catalog exposes the exact immutable 13-figure roster and version', () => {
  assert.equal(CATALOG_VERSION, 1);
  assert.deepEqual(FIGURES.map(({id}) => id), [
    'explorer-girl', 'explorer-boy', 'horse', 'tiger', 'dragon',
    'deer-mist', 'wolf-aurora', 'panther-shadow', 'unicorn-moon',
    'griffin-storm', 'dragon-crystal', 'pegasus-star', 'phoenix',
  ]);
  assert.equal(new Set(FIGURES.map(({id}) => id)).size, 13);
  assert.equal(FIGURES.filter(({unlock}) => unlock.kind === 'shop').length, 8);
  assert.equal(deeplyFrozen(FIGURES), true);
  assert.equal(deeplyFrozen(ITEMS), true);
  assert.equal(deeplyFrozen(LEGACY_ITEM_IDS), true);
});

test('figures have the approved start, level and shop unlocks', () => {
  assert.deepEqual(Object.fromEntries(FIGURES.map(({id, unlock}) => [id, unlock])), {
    'explorer-girl': {kind: 'start'},
    'explorer-boy': {kind: 'start'},
    horse: {kind: 'level', level: 3},
    tiger: {kind: 'level', level: 5},
    dragon: {kind: 'level', level: 9},
    'deer-mist': {kind: 'shop', price: 600},
    'wolf-aurora': {kind: 'shop', price: 800},
    'panther-shadow': {kind: 'shop', price: 800},
    'unicorn-moon': {kind: 'shop', price: 900},
    'griffin-storm': {kind: 'shop', price: 1000},
    'dragon-crystal': {kind: 'shop', price: 1200},
    'pegasus-star': {kind: 'shop', price: 1200},
    phoenix: {kind: 'shop', price: 1200},
  });
});

test('catalog has exactly ten complete shop sets with approved prices and slots', () => {
  const shopItems = ITEMS.filter(({unlock}) => unlock.kind === 'shop');
  assert.equal(shopItems.length, 30);
  assert.equal(new Set(shopItems.map(({id}) => id)).size, 30);
  for (const setId of SHOP_SET_IDS) {
    const set = shopItems.filter(({id}) => id.startsWith(`${setId}-`));
    assert.equal(set.length, 3, setId);
    assert.deepEqual(set.map(({unlock}) => unlock.price).sort((a, b) => a - b), [120, 240, 360], setId);
  }
  assert.deepEqual(
    shopItems.filter(({group}) => group === 'human')
      .map(({id, slot}) => [id, slot]),
    [['runes-head', 'head'], ['runes-back', 'back'], ['runes-hand', 'hand']],
  );
});

test('free legacy equipment and knight reward retain exact levels and adapter IDs', () => {
  assert.deepEqual(LEGACY_ITEM_IDS, {
    head: {cap: 'cap', sunhat: 'sunhat', mountainhat: 'mountainhat'},
    back: {backpack: 'backpack'},
    hand: {binoculars: 'binoculars', compass: 'compass'},
  });
  assert.deepEqual(Object.fromEntries(
    ITEMS.filter(({unlock}) => unlock.kind === 'level').map(({id, slot, unlock}) => [id, [slot, unlock.level]]),
  ), {
    cap: ['head', 2],
    backpack: ['back', 4],
    sunhat: ['head', 6],
    'knight-clothing': ['clothing', 7],
    binoculars: ['hand', 8],
    mountainhat: ['head', 11],
    compass: ['hand', 14],
  });
});

test('shared equine equipment is portable, dragon equipment is not', () => {
  assert.equal(isCompatible('moon-head', 'horse'), true);
  assert.equal(isCompatible('moon-head', 'unicorn-moon'), true);
  assert.equal(isCompatible('moon-head', 'pegasus-star'), true);
  assert.equal(isCompatible('crystal-body', 'horse'), false);
  assert.equal(isCompatible('crystal-body', 'dragon'), true);
  assert.equal(isCompatible('crystal-body', 'dragon-crystal'), true);
  assert.equal(isCompatible('runes-hand', 'explorer-girl'), true);
  assert.equal(isCompatible('runes-hand', 'explorer-boy'), true);
  assert.equal(isCompatible('runes-hand', 'tiger'), false);
});

test('lookup helpers reject wrong types and unknown IDs without granting anything', () => {
  assert.equal(figureById('horse')?.name, 'Pferd');
  assert.equal(itemById('moon-head')?.name, 'Mondsichel-Kopfschmuck');
  for (const value of [undefined, null, 0, {}, [], 'unknown']) {
    assert.equal(figureById(value), null);
    assert.equal(itemById(value), null);
  }
  assert.equal(isCompatible('moon-head', {}), false);
  assert.equal(isCompatible({}, 'horse'), false);
  assert.equal(isCompatible('unknown', 'horse'), false);
});

test('level entitlements grant only starts and reached level rewards', () => {
  assert.deepEqual(levelEntitlements(1), {
    figureIds: ['explorer-girl', 'explorer-boy'],
    itemIds: [],
  });
  assert.deepEqual(levelEntitlements(7), {
    figureIds: ['explorer-girl', 'explorer-boy', 'horse', 'tiger'],
    itemIds: ['cap', 'backpack', 'sunhat', 'knight-clothing'],
  });
  assert.deepEqual(levelEntitlements(14), {
    figureIds: ['explorer-girl', 'explorer-boy', 'horse', 'tiger', 'dragon'],
    itemIds: ['cap', 'backpack', 'sunhat', 'knight-clothing', 'binoculars', 'mountainhat', 'compass'],
  });
  for (const value of [0, -1, 1.5, NaN, '7', null]) {
    assert.throws(() => levelEntitlements(value), TypeError);
  }
  assert.equal(levelEntitlements(100).itemIds.every((id) => itemById(id).unlock.kind === 'level'), true);
});

test('normalization falls back safely and never infers ownership from price or level', () => {
  const selected = normalizeSelection({
    figureId: 'phoenix', skin: 3, clothing: 5,
    equipment: {head: 'sun-head', body: 'sun-body', adornment: 'sun-adornment'},
  }, {ownedFigureIds: [], ownedItemIds: []});
  assert.deepEqual(selected, {
    figureId: 'explorer-boy', skin: 3, clothing: 5,
    equipment: {clothing: null, head: null, back: null, hand: null},
  });

  const levelOnly = levelEntitlements(14);
  assert.deepEqual(normalizeSelection({figureId: 'dragon', equipment: {}}, {
    ownedFigureIds: levelOnly.figureIds,
    ownedItemIds: levelOnly.itemIds,
  }).figureId, 'dragon');
});

test('normalization keeps only owned compatible equipment in the selected body slots', () => {
  assert.deepEqual(normalizeSelection({
    figureId: 'horse', skin: 2, clothing: 4,
    equipment: {head: 'moon-head', body: 'stars-body', adornment: 'crystal-adornment', hand: 'compass'},
  }, {
    ownedFigureIds: ['horse'],
    ownedItemIds: ['moon-head', 'stars-body', 'crystal-adornment', 'compass'],
  }), {
    figureId: 'horse', skin: 2, clothing: 4,
    equipment: {head: 'moon-head', body: 'stars-body', adornment: null},
  });

  assert.deepEqual(normalizeSelection({
    figureId: 'explorer-girl', skin: 9, clothing: -1,
    equipment: {clothing: 'knight-clothing', head: 'runes-head', back: 'moon-body', hand: 'runes-hand'},
  }, {
    ownedFigureIds: [],
    ownedItemIds: ['knight-clothing', 'runes-head', 'moon-body'],
  }), {
    figureId: 'explorer-girl', skin: 0, clothing: 0,
    equipment: {clothing: 'knight-clothing', head: 'runes-head', back: null, hand: null},
  });
});

test('normalization is child-independent and does not mutate frozen caller input', () => {
  const selection = Object.freeze({
    figureId: 'wolf-aurora', skin: 1, clothing: 2,
    equipment: Object.freeze({head: 'aurora-head', body: 'aurora-body', adornment: 'aurora-adornment'}),
  });
  const ownership = Object.freeze({
    ownedFigureIds: Object.freeze(['wolf-aurora']),
    ownedItemIds: Object.freeze(['aurora-head', 'aurora-body', 'aurora-adornment']),
  });
  const first = normalizeSelection(selection, ownership);
  const second = normalizeSelection(selection, ownership);
  assert.deepEqual(first, second);
  assert.notEqual(first, second);
  assert.notEqual(first.equipment, selection.equipment);
  assert.deepEqual(selection.equipment, {head: 'aurora-head', body: 'aurora-body', adornment: 'aurora-adornment'});
  assert.deepEqual(ownership.ownedItemIds, ['aurora-head', 'aurora-body', 'aurora-adornment']);
});

test('malformed selections and inherited equipment never become owned choices', () => {
  const inherited = Object.create({head: 'moon-head'});
  assert.deepEqual(normalizeSelection({figureId: 'horse', equipment: inherited}, {
    ownedFigureIds: new Set(['horse']),
    ownedItemIds: new Set(['moon-head']),
  }), {
    figureId: 'horse', skin: 0, clothing: 0,
    equipment: {head: null, body: null, adornment: null},
  });
  assert.deepEqual(normalizeSelection(null, null), {
    figureId: 'explorer-boy', skin: 0, clothing: 0,
    equipment: {clothing: null, head: null, back: null, hand: null},
  });
});

test('inherited figure and colour fields are ignored as untrusted input', () => {
  const inheritedSelection = Object.create({
    figureId: 'explorer-girl', skin: 3, clothing: 5,
  });
  inheritedSelection.equipment = {};
  assert.deepEqual(normalizeSelection(inheritedSelection, {}), {
    figureId: 'explorer-boy', skin: 0, clothing: 0,
    equipment: {clothing: null, head: null, back: null, hand: null},
  });
});
