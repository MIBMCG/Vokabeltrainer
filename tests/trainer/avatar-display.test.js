import test from 'node:test';
import assert from 'node:assert/strict';

import {resolveAvatarDisplay} from '../../src/trainer/avatar/display.js';

function profile(avatar = {}) {
  return {
    points: 110,
    completedRounds: 0,
    words: {},
    avatar: {
      skin: 2,
      clothing: 4,
      head: null,
      back: null,
      hand: null,
      ...avatar,
    },
  };
}

test('active human selection uses the saved figure and existing free appearance choices', () => {
  const selected = resolveAvatarDisplay({
    productState: {
      commerce: {
        mode: 'active',
        selection: [{profileId: 'p1', figureId: 'explorer-girl', stage: 1}],
      },
    },
    profileId: 'p1',
    profile: profile(),
  });

  assert.deepEqual(selected, {
    kind: 'figure',
    figureId: 'explorer-girl',
    stage: 1,
    skin: 2,
    clothing: 4,
    equipment: {},
  });
});

test('classic avatar remains the fallback without a trusted active selection', () => {
  const currentProfile = profile({skin: 1, clothing: 3, head: 'cap'});

  for (const productState of [
    {commerce: {mode: 'inactive', selection: [{profileId: 'p1', figureId: 'explorer-girl', stage: 1}]}},
    {commerce: {mode: 'active', selection: []}},
    {commerce: {mode: 'active', selection: [{profileId: 'p2', figureId: 'explorer-girl', stage: 1}]}},
    {commerce: {mode: 'active', selection: [{profileId: 'p1', figureId: 'unknown', stage: 1}]}},
  ]) {
    assert.deepEqual(resolveAvatarDisplay({productState, profileId: 'p1', profile: currentProfile}), {
      kind: 'classic',
      parts: {skin: 1, clothing: 3, head: null, back: null, hand: null},
    });
  }
});

test('selected figures are isolated by profile and retain their owned stage', () => {
  const productState = {
    commerce: {
      mode: 'active',
      selection: [
        {profileId: 'p1', figureId: 'dragon', stage: 3},
        {profileId: 'p2', figureId: 'explorer-girl', stage: 1},
      ],
    },
  };

  assert.deepEqual(resolveAvatarDisplay({productState, profileId: 'p1', profile: profile()}), {
    kind: 'figure', figureId: 'dragon', stage: 3, skin: 0, clothing: 0, equipment: {},
  });
  assert.deepEqual(resolveAvatarDisplay({productState, profileId: 'p2', profile: profile({skin: 3})}), {
    kind: 'figure', figureId: 'explorer-girl', stage: 1, skin: 3, clothing: 4, equipment: {},
  });
});
