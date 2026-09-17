import test from 'node:test';
import assert from 'node:assert/strict';

import {project} from '../../src/trainer/learning/progress.js';
import {rewardState} from '../../src/trainer/learning/rewards.js';
import {createFixture} from './fixtures.js';

const VERSION = {format: 'vokabeltrainer-product', formatVersion: 1, ruleVersion: 1};

function reward(overrides = {}) {
  return rewardState({
    points: 0,
    completedRounds: 0,
    masteredWordIds: [],
    recoveredWordIds: [],
    ...overrides,
  });
}

test('level, island, and journey boundaries are exact at 199/200/999/1000/1999/2000/2999/3000', () => {
  const cases = [
    [199, 1, 0, [true, false, false]],
    [200, 2, 1, [true, false, false]],
    [999, 5, 4, [true, false, false]],
    [1000, 6, 5, [true, true, false]],
    [1999, 10, 9, [true, true, false]],
    [2000, 11, 10, [true, true, true]],
    [2999, 15, 14, [true, true, true]],
    [3000, 16, 15, [true, true, true]],
  ];
  for (const [points, level, completedStages, unlocked] of cases) {
    const state = reward({points});
    assert.equal(state.level, level, `level at ${points}`);
    assert.equal(state.journey.completedStages, completedStages, `stages at ${points}`);
    assert.deepEqual(state.journey.islands.map((island) => island.unlocked), unlocked);
  }
});

test('all six avatar accessories unlock at their documented level boundaries', () => {
  const cases = [
    [199, {head: [], back: [], hand: []}],
    [200, {head: ['cap'], back: [], hand: []}],
    [599, {head: ['cap'], back: [], hand: []}],
    [600, {head: ['cap'], back: ['backpack'], hand: []}],
    [999, {head: ['cap'], back: ['backpack'], hand: []}],
    [1000, {head: ['cap', 'sunhat'], back: ['backpack'], hand: []}],
    [1399, {head: ['cap', 'sunhat'], back: ['backpack'], hand: []}],
    [1400, {head: ['cap', 'sunhat'], back: ['backpack'], hand: ['binoculars']}],
    [1999, {head: ['cap', 'sunhat'], back: ['backpack'], hand: ['binoculars']}],
    [2000, {head: ['cap', 'sunhat', 'mountainhat'], back: ['backpack'], hand: ['binoculars']}],
    [2599, {head: ['cap', 'sunhat', 'mountainhat'], back: ['backpack'], hand: ['binoculars']}],
    [2600, {
      head: ['cap', 'sunhat', 'mountainhat'], back: ['backpack'], hand: ['binoculars', 'compass'],
    }],
  ];
  for (const [points, unlocked] of cases) assert.deepEqual(reward({points}).unlocked, unlocked);
});

test('six badge claims use unique word IDs and do not create points', () => {
  const tenMastered = Array.from({length: 10}, (_, index) => `mastered-${index}`);
  const tenRecovered = Array.from({length: 10}, (_, index) => `recovered-${index}`);
  assert.deepEqual(reward({completedRounds: 1}).badges, ['first-round']);
  assert.deepEqual(reward({completedRounds: 10}).badges, ['first-round', 'ten-rounds']);
  assert.deepEqual(reward({masteredWordIds: [...tenMastered, tenMastered[0]]}).badges, ['ten-mastered']);
  assert.deepEqual(reward({recoveredWordIds: [...tenRecovered, tenRecovered[0]]}).badges, ['ten-recovered']);
  assert.deepEqual(reward({points: 1000}).badges, ['forest']);
  assert.deepEqual(reward({points: 3000}).badges, ['forest', 'journey-complete']);
  assert.equal(reward({masteredWordIds: tenMastered, recoveredWordIds: tenRecovered}).level, 1);
});

test('ten correct answers and repeated completion claims award exactly 120 points', () => {
  const f = createFixture();
  const answers = Array.from({length: 10}, (_, index) => f.answer({
    id: `score-${String(index + 1).padStart(2, '0')}`,
    ordinal: index + 1,
  }));
  const answerIds = answers.map(({id}) => id).sort();
  const completed = f.event('round.completed', {
    roundId: 'r1', profileId: 'p1', reason: 'full', answerIds,
  }, {id: 'complete-a'});
  const repeated = {...structuredClone(completed), id: 'complete-b', clock: completed.clock + 1};
  const ledger = f.withEvents(f.roundStarted, ...answers, completed, repeated);
  const reversed = structuredClone(ledger);
  reversed.events.reverse();

  const profile = project(ledger).profiles.p1;
  assert.equal(profile.points, 120);
  assert.equal(profile.completedRounds, 1);
  assert.deepEqual(profile.badges, ['first-round']);
  assert.deepEqual(project(reversed).profiles.p1, profile);
});

test('a support-only abandonment cannot suppress an effective completion bonus', () => {
  const f = createFixture();
  const answer = f.answer({id: 'effective-answer', clock: 20});
  const completed = f.event('round.completed', {
    roundId: 'r1', profileId: 'p1', reason: 'exhausted', answerIds: ['effective-answer'],
  }, {id: 'effective-completion', clock: 30});
  const abandoned = f.event('round.abandoned', {
    roundId: 'r1', profileId: 'p1',
  }, {id: 'support-abandonment', clock: 10});
  const ledger = f.withEvents(f.roundStarted, answer, completed, abandoned);
  ledger.snapshots.push({
    id: 's1',
    datasetId: 'd1',
    effectiveEventIds: [
      ...f.base.events.map(({id}) => id), answer.id, completed.id,
    ].sort(),
    supportEventIds: [f.roundStarted.id, abandoned.id].sort(),
    contentHash: '0'.repeat(64),
  });
  ledger.epochs.push({
    ...VERSION,
    kind: 'epoch',
    id: 'e1',
    datasetId: 'd1',
    parents: ['e0'],
    deviceId: 'restore',
    clock: 100,
    occurredAt: '2026-09-18T10:00:00.000Z',
    snapshotId: 's1',
    snapshotManifestFileId: null,
  });

  const profile = project(ledger).profiles.p1;
  assert.equal(profile.points, 30);
  assert.equal(profile.completedRounds, 1);
  assert.deepEqual(profile.badges, ['first-round']);
});

test('projection exposes exact avatar and preference shape and filters locked equipment', () => {
  const f = createFixture();
  const avatar = f.event('avatar.changed', {
    profileId: 'p1', skin: 3, clothing: 5, head: 'cap', back: 'backpack', hand: 'compass',
  }, {id: 'avatar-choice'});
  const preference = f.event('preference.changed', {profileId: 'p1', animations: false}, {
    id: 'animations-off',
  });

  let profile = project(f.withEvents(avatar, preference)).profiles.p1;
  assert.deepEqual(profile.avatar, {skin: 3, clothing: 5, head: null, back: null, hand: null});
  assert.equal(profile.animations, false);

  const round = f.event('round.started', {
    roundId: 'r-points', profileId: 'p1', mode: 'all', size: 30,
  }, {id: 'start-r-points'});
  const answers = Array.from({length: 20}, (_, index) => f.answer({
    id: `score-${String(index + 1).padStart(2, '0')}`,
    ordinal: index + 1,
    roundId: 'r-points',
  }));
  profile = project(f.withEvents(avatar, preference, round, ...answers)).profiles.p1;
  assert.equal(profile.points, 200);
  assert.deepEqual(profile.avatar, {skin: 3, clothing: 5, head: 'cap', back: null, hand: null});
  assert.deepEqual(Object.keys(profile).sort(), [
    'animations', 'avatar', 'badges', 'completedRounds', 'level', 'points', 'words',
  ]);
});

test('rewardState owns its exact arrays and accepts deeply frozen input', () => {
  const input = Object.freeze({
    points: 3000,
    completedRounds: 10,
    masteredWordIds: Object.freeze(Array.from({length: 10}, (_, index) => `m-${index}`)),
    recoveredWordIds: Object.freeze(Array.from({length: 10}, (_, index) => `r-${index}`)),
  });
  const state = rewardState(input);
  assert.deepEqual(state, {
    level: 16,
    badges: [
      'first-round', 'ten-rounds', 'ten-mastered', 'ten-recovered', 'forest', 'journey-complete',
    ],
    unlocked: {
      head: ['cap', 'sunhat', 'mountainhat'],
      back: ['backpack'],
      hand: ['binoculars', 'compass'],
    },
    journey: {
      completedStages: 15,
      islands: [
        {id: 'beach', unlocked: true},
        {id: 'forest', unlocked: true},
        {id: 'mountain', unlocked: true},
      ],
    },
  });
  state.badges.push('changed');
  assert.equal(input.masteredWordIds.length, 10);
});
