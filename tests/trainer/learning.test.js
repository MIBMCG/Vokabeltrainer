import test from 'node:test';
import assert from 'node:assert/strict';

import {assess} from '../../src/trainer/learning/answers.js';
import {addDays, dayInZone} from '../../src/trainer/learning/calendar.js';
import {milestonesAfterAnswer, project} from '../../src/trainer/learning/progress.js';
import {createFixture} from './fixtures.js';

const VERSION = {format: 'vokabeltrainer-product', formatVersion: 1, ruleVersion: 1};

function start(f, roundId, {profileId = 'p1', size = 10} = {}) {
  return f.event('round.started', {roundId, profileId, mode: 'all', size}, {id: `start-${roundId}`});
}

function wordRevision(f, {
  id,
  parents = ['rev-w1'],
  answers = ['dog'],
  german = 'Hund',
  hint = '',
  learningId = 'learn-w1',
  archived = false,
}) {
  return f.event('entity.revised', {
    entityType: 'word',
    entityId: 'w1',
    parents,
    value: {lessonId: 'l1', german, hint, answers, archived, learningId},
  }, {id});
}

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

test('accepted typography does not hide real spelling errors', () => {
  const word = deepFreeze({answers: ["don't", 'do not']});
  assert.deepEqual(assess(' DON’T ', word), {
    empty: false,
    correct: true,
    solutions: ["don't", 'do not'],
  });
  assert.equal(assess('dont', word).correct, false);
  assert.equal(assess('do  not', word).correct, false);
  assert.equal(assess('  ', word).empty, true);
});

test('calendar helpers use the dataset zone and calendar-date arithmetic across DST', () => {
  assert.equal(dayInZone('2026-03-29T22:30:00.000Z', 'Europe/Berlin'), '2026-03-30');
  assert.equal(dayInZone('2026-03-29T22:30:00.000Z', 'America/New_York'), '2026-03-29');
  assert.equal(addDays('2026-03-28', 1), '2026-03-29');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
});

test('three correct answers persist across rounds and scheduled reviews use 1/3/7/14/14 days', () => {
  const f = createFixture();
  const a1 = f.answer({id: 'a1', ordinal: 1});
  const a2 = f.answer({id: 'a2', ordinal: 2});
  const r2 = start(f, 'r2');
  const a3 = f.answer({id: 'a3', ordinal: 1, roundId: 'r2'});
  const r3 = start(f, 'r3');
  const a4 = f.answer({id: 'a4', ordinal: 1, roundId: 'r3', day: '2026-09-18'});
  const a5 = f.answer({id: 'a5', ordinal: 2, roundId: 'r3', day: '2026-09-18'});
  const r4 = start(f, 'r4');
  const a6 = f.answer({id: 'a6', ordinal: 1, roundId: 'r4', day: '2026-09-21'});
  const r5 = start(f, 'r5');
  const a7 = f.answer({id: 'a7', ordinal: 1, roundId: 'r5', day: '2026-09-28'});
  const r6 = start(f, 'r6');
  const a8 = f.answer({id: 'a8', ordinal: 1, roundId: 'r6', day: '2026-10-12'});
  const build = [f.roundStarted, a1, a2, r2, a3];

  let state = project(f.withEvents(...build)).profiles.p1;
  assert.equal(state.words.w1.streak, 3);
  assert.equal(state.words.w1.intervalIndex, 0);
  assert.equal(state.words.w1.dueDay, '2026-09-18');
  assert.equal(state.points, 30);

  state = project(f.withEvents(...build, r3, a4, a5)).profiles.p1;
  assert.equal(state.words.w1.dueDay, '2026-09-21');
  assert.equal(state.words.w1.intervalIndex, 1);
  assert.equal(state.points, 50);

  state = project(f.withEvents(...build, r3, a4, a5, r4, a6)).profiles.p1;
  assert.equal(state.words.w1.dueDay, '2026-09-28');
  assert.equal(state.words.w1.intervalIndex, 2);

  state = project(f.withEvents(...build, r3, a4, a5, r4, a6, r5, a7)).profiles.p1;
  assert.equal(state.words.w1.dueDay, '2026-10-12');
  assert.equal(state.words.w1.intervalIndex, 3);

  state = project(f.withEvents(...build, r3, a4, a5, r4, a6, r5, a7, r6, a8)).profiles.p1;
  assert.equal(state.words.w1.dueDay, '2026-10-26');
  assert.equal(state.words.w1.intervalIndex, 3);
  assert.equal(state.points, 80);
});

test('a failure resets the series and two answers to the same other word satisfy the error gap', () => {
  const f = createFixture();
  const first = f.answer({id: 'a1', ordinal: 1});
  const second = f.answer({id: 'a2', ordinal: 2});
  const wrong = f.answer({id: 'a3', ordinal: 3, correct: false});
  const profile2 = f.event('entity.revised', {
    entityType: 'profile', entityId: 'p2', parents: [], value: {name: 'Ben', archived: false},
  }, {id: 'rev-p2'});
  const r2 = start(f, 'r2', {profileId: 'p2'});
  const otherProfile = f.answer({
    id: 'p2-a1', ordinal: 1, roundId: 'r2', profileId: 'p2', wordId: 'w2',
  });

  let state = project(f.withEvents(
    f.roundStarted, first, second, wrong, profile2, r2, otherProfile,
  )).profiles.p1.words.w1;
  assert.equal(state.streak, 0);
  assert.equal(state.intervalIndex, -1);
  assert.equal(state.dueDay, null);
  assert.equal(state.errorGap, 2);

  const sameOther1 = f.answer({id: 'a4', ordinal: 4, wordId: 'w2'});
  const sameOther2 = f.answer({id: 'a5', ordinal: 5, wordId: 'w2'});
  state = project(f.withEvents(
    f.roundStarted, first, second, wrong, profile2, r2, otherProfile, sameOther1, sameOther2,
  )).profiles.p1.words.w1;
  assert.equal(state.errorGap, 0);
});

test('meaning changes and reverts reset only current learning state while spelling changes preserve it', () => {
  const f = createFixture();
  const answers = [1, 2, 3].map((ordinal) => f.answer({id: `a${ordinal}`, ordinal}));
  const spelling = wordRevision(f, {id: 'spell', german: ' HUND ', answers: ['DOG']});
  const spellingState = project(f.withEvents(f.roundStarted, ...answers, spelling)).profiles.p1.words.w1;
  assert.equal(spellingState.learningId, 'learn-w1');
  assert.equal(spellingState.streak, 3);

  const changed = wordRevision(f, {
    id: 'changed', parents: ['spell'], answers: ['hound'], learningId: 'learn-changed',
  });
  const changedState = project(f.withEvents(
    f.roundStarted, ...answers, spelling, changed,
  )).profiles.p1.words.w1;
  assert.equal(changedState.learningId, 'learn-changed');
  assert.equal(changedState.streak, 0);
  assert.equal(changedState.attempts, 3);
  assert.equal(changedState.everPracticed, true);

  const reverted = wordRevision(f, {
    id: 'reverted', parents: ['changed'], answers: ['dog'], learningId: 'learn-reverted',
  });
  const revertedState = project(f.withEvents(
    f.roundStarted, ...answers, spelling, changed, reverted,
  )).profiles.p1.words.w1;
  assert.equal(revertedState.learningId, 'learn-reverted');
  assert.equal(revertedState.streak, 0);
  assert.equal(revertedState.attempts, 3);
});

test('milestone claims survive later errors and archiving', () => {
  const f = createFixture();
  const a1 = f.answer({id: 'a1', ordinal: 1});
  const a2 = f.answer({id: 'a2', ordinal: 2});
  const a3 = f.answer({id: 'a3', ordinal: 3});
  const mastered = f.event('word.milestone', {
    profileId: 'p1', wordId: 'w1', milestone: 'mastered', evidenceAnswerIds: ['a1', 'a2', 'a3'],
  }, {id: 'mastered-w1'});
  const wrong = f.answer({id: 'a4', ordinal: 4, correct: false});
  const correct = f.answer({id: 'a5', ordinal: 5});
  const recovered = f.event('word.milestone', {
    profileId: 'p1', wordId: 'w1', milestone: 'recovered', evidenceAnswerIds: ['a4', 'a5'],
  }, {id: 'recovered-w1'});
  const archived = wordRevision(f, {id: 'archived', archived: true});

  const state = project(f.withEvents(
    f.roundStarted, a1, a2, a3, mastered, wrong, correct, recovered, archived,
  )).profiles.p1.words.w1;
  assert.equal(state.masteredEver, true);
  assert.equal(state.recoveredEver, true);
  assert.equal(state.streak, 1);
});

test('milestones after an answer contain stable causal evidence and are not repeated', () => {
  const f = createFixture();
  const a1 = f.answer({id: 'a1', ordinal: 1});
  const a2 = f.answer({id: 'a2', ordinal: 2});
  const a3 = f.answer({id: 'a3', ordinal: 3});
  const beforeMastery = project(f.withEvents(f.roundStarted, a1, a2));
  const afterMastery = project(f.withEvents(f.roundStarted, a1, a2, a3));
  assert.deepEqual(
    milestonesAfterAnswer(beforeMastery, afterMastery, a3, [f.roundStarted, a1, a2, a3]),
    [{profileId: 'p1', wordId: 'w1', milestone: 'mastered', evidenceAnswerIds: ['a1', 'a2', 'a3']}],
  );

  const wrong = f.answer({id: 'a4', ordinal: 4, correct: false, wordId: 'w2'});
  const corrected = f.answer({id: 'a5', ordinal: 5, wordId: 'w2'});
  const beforeRecovery = project(f.withEvents(f.roundStarted, wrong));
  const afterRecovery = project(f.withEvents(f.roundStarted, wrong, corrected));
  assert.deepEqual(
    milestonesAfterAnswer(
      beforeRecovery,
      afterRecovery,
      corrected,
      [f.roundStarted, wrong, corrected],
    ),
    [{profileId: 'p1', wordId: 'w2', milestone: 'recovered', evidenceAnswerIds: ['a4', 'a5']}],
  );

  const claim = f.event('word.milestone', {
    profileId: 'p1', wordId: 'w2', milestone: 'recovered', evidenceAnswerIds: ['a4', 'a5'],
  }, {id: 'recovered-w2'});
  const alreadyClaimed = project(f.withEvents(f.roundStarted, wrong, corrected, claim));
  assert.deepEqual(
    milestonesAfterAnswer(alreadyClaimed, alreadyClaimed, corrected, [wrong, corrected, claim]),
    [],
  );
});

test('duplicate logical answer slots and reversed arrivals produce identical progress', () => {
  const f = createFixture();
  const original = f.answer({id: 'answer-a', ordinal: 1});
  const repeated = {...structuredClone(original), id: 'answer-b', clock: original.clock + 1};
  const ledger = f.withEvents(f.roundStarted, original, repeated);
  const reversed = structuredClone(ledger);
  reversed.events.reverse();

  const forwardProjection = project(ledger);
  assert.deepEqual(forwardProjection, project(reversed));
  assert.equal(forwardProjection.profiles.p1.points, 10);
  assert.equal(forwardProjection.profiles.p1.words.w1.attempts, 1);
});

test('support events preserve references without awarding points or rounds', () => {
  const f = createFixture();
  const answer = f.answer({id: 'a1'});
  const completed = f.event('round.completed', {
    roundId: 'r1', profileId: 'p1', reason: 'exhausted', answerIds: ['a1'],
  }, {id: 'complete-r1'});
  const ledger = f.withEvents(f.roundStarted, answer, completed);
  ledger.snapshots.push({
    id: 's1',
    datasetId: 'd1',
    effectiveEventIds: f.base.events.map(({id}) => id).sort(),
    supportEventIds: ['a1', 'complete-r1', 'start-r1'],
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

  const projection = project(ledger);
  assert.equal(projection.profiles.p1.points, 0);
  assert.equal(projection.profiles.p1.completedRounds, 0);
  assert.equal(projection.profiles.p1.words.w1.attempts, 0);
});

test('a restore can select an older reward state and incomplete integrity is distinct from conflict', () => {
  const f = createFixture();
  const answer = f.answer({id: 'a1'});
  const ledger = f.withEvents(f.roundStarted, answer);
  ledger.snapshots.push({
    id: 's-old', datasetId: 'd1', effectiveEventIds: f.base.events.map(({id}) => id).sort(),
    supportEventIds: [], contentHash: '0'.repeat(64),
  });
  ledger.epochs.push({
    ...VERSION, kind: 'epoch', id: 'e-old', datasetId: 'd1', parents: ['e0'], deviceId: 'restore',
    clock: 100, occurredAt: '2026-09-18T10:00:00.000Z', snapshotId: 's-old',
    snapshotManifestFileId: null,
  });
  const restored = project(ledger);
  assert.equal(restored.profiles.p1.points, 0);
  assert.deepEqual(restored.lateEvents.map(({id}) => id), ['start-r1', 'a1']);

  const incomplete = structuredClone(ledger);
  incomplete.snapshots = [];
  const incompleteProjection = project(incomplete);
  assert.equal(incompleteProjection.activeEpochId, null);
  assert.equal(incompleteProjection.epochConflict, false);
  assert.deepEqual(incompleteProjection.integrityProblems, ['active-epoch-incomplete']);
});

test('special accepted profile and word IDs remain enumerable own projection fields', () => {
  const f = createFixture();
  const profile = f.event('entity.revised', {
    entityType: 'profile', entityId: 'constructor', parents: [],
    value: {name: 'Special', archived: false},
  }, {id: 'rev-special-profile'});
  const lesson = f.event('entity.revised', {
    entityType: 'lesson', entityId: 'prototype', parents: [],
    value: {name: 'Special unit', archived: false, profileIds: ['constructor']},
  }, {id: 'rev-special-lesson'});
  const word = f.event('entity.revised', {
    entityType: 'word', entityId: '__proto__', parents: [],
    value: {
      lessonId: 'prototype', german: 'Sicher', hint: '', answers: ['safe'], archived: false,
      learningId: 'learn-special',
    },
  }, {id: 'rev-special-word'});
  const round = start(f, 'special-round', {profileId: 'constructor'});
  const answer = f.answer({
    id: 'special-answer', profileId: 'constructor', roundId: 'special-round',
    wordId: '__proto__', revisionId: 'rev-special-word', learningId: 'learn-special',
  });

  const projection = project(f.withEvents(profile, lesson, word, round, answer));
  assert.equal(Object.hasOwn(projection.profiles, 'constructor'), true);
  assert.equal(Object.hasOwn(projection.profiles.constructor.words, '__proto__'), true);
  const serialized = JSON.parse(JSON.stringify(projection.profiles));
  assert.equal(Object.hasOwn(serialized, 'constructor'), true);
  assert.equal(Object.hasOwn(serialized.constructor.words, '__proto__'), true);
});

test('project is synchronous and does not mutate deeply frozen input', () => {
  const f = createFixture();
  const answer = f.answer({id: 'a1'});
  const ledger = deepFreeze(f.withEvents(f.roundStarted, answer));

  const projection = project(ledger);
  assert.equal(projection.profiles.p1.points, 10);
  assert.equal(Object.isFrozen(ledger.events), true);
});
