import test from 'node:test';
import assert from 'node:assert/strict';

import {avatarParts} from '../../src/trainer/ui/rewards.js';

function profile(points, avatar) {
  return {
    points,
    completedRounds: 0,
    words: {},
    avatar,
  };
}

test('avatarParts keeps free colours but removes equipment below its unlock level', () => {
  const selected = Object.freeze({
    skin: 3,
    clothing: 5,
    head: 'mountainhat',
    back: 'backpack',
    hand: 'compass',
  });

  assert.deepEqual(avatarParts(profile(0, selected)), {
    skin: 3,
    clothing: 5,
    head: null,
    back: null,
    hand: null,
  });
  assert.deepEqual(selected, {
    skin: 3,
    clothing: 5,
    head: 'mountainhat',
    back: 'backpack',
    hand: 'compass',
  });
});

test('avatarParts exposes each selected accessory only from its exact level boundary', () => {
  const cases = [
    [199, {head: null, back: null, hand: null}],
    [200, {head: 'cap', back: null, hand: null}],
    [600, {head: 'cap', back: 'backpack', hand: null}],
    [1000, {head: 'sunhat', back: 'backpack', hand: null}],
    [1400, {head: 'sunhat', back: 'backpack', hand: 'binoculars'}],
    [2000, {head: 'mountainhat', back: 'backpack', hand: 'binoculars'}],
    [2600, {head: 'mountainhat', back: 'backpack', hand: 'compass'}],
  ];

  for (const [points, equipment] of cases) {
    assert.deepEqual(avatarParts(profile(points, {skin: 1, clothing: 2, ...equipment})), {
      skin: 1,
      clothing: 2,
      ...equipment,
    }, `selection at ${points} points`);
  }
});
