import test from 'node:test';
import assert from 'node:assert/strict';

import {project} from '../../src/trainer/learning/progress.js';
import {startRound} from '../../src/trainer/learning/rounds.js';
import {keyAction, practiceRenderKey, roundSummary} from '../../src/trainer/ui/practice.js';
import {createFixture} from './fixtures.js';

test('keyAction maps one intentional Enter press to the phase action', () => {
  assert.equal(keyAction({key: 'Enter', repeat: false, isComposing: false, phase: 'asking'}), 'submit');
  assert.equal(keyAction({key: 'Enter', repeat: false, isComposing: false, phase: 'feedback'}), 'next');
});

test('keyAction ignores held, composing, unrelated and terminal keys', () => {
  assert.equal(keyAction({key: 'Enter', repeat: true, isComposing: false, phase: 'asking'}), null);
  assert.equal(keyAction({key: 'Enter', repeat: false, isComposing: true, phase: 'asking'}), null);
  assert.equal(keyAction({key: ' ', repeat: false, isComposing: false, phase: 'asking'}), null);
  assert.equal(keyAction({key: 'Enter', repeat: false, isComposing: false, phase: 'completed'}), null);
});

test('roundSummary derives actual answers, right answers, wrong words and separated points', () => {
  const events = [
    {id: 'a1', type: 'answer.recorded', payload: {roundId: 'r1', wordId: 'w1', correct: false}},
    {id: 'a2', type: 'answer.recorded', payload: {roundId: 'r1', wordId: 'w2', correct: true}},
    {id: 'a3', type: 'answer.recorded', payload: {roundId: 'r1', wordId: 'w1', correct: true}},
    {id: 'done', type: 'round.completed', payload: {roundId: 'r1', profileId: 'p1', reason: 'exhausted', answerIds: ['a1', 'a2', 'a3']}},
  ];
  assert.deepEqual(roundSummary({id: 'r1', answeredIds: ['a1', 'a2', 'a3']}, events), {
    answers: 3,
    correct: 2,
    wrongWordIds: ['w1'],
    answerPoints: 20,
    bonusPoints: 20,
  });
});

test('roundSummary gives neither answer points nor bonus to an empty or uncompleted round', () => {
  assert.deepEqual(roundSummary({id: 'r-empty', answeredIds: []}, []), {
    answers: 0,
    correct: 0,
    wrongWordIds: [],
    answerPoints: 0,
    bonusPoints: 0,
  });
});

test('practiceRenderKey preserves valid drafts and changes when the profile becomes invalid', () => {
  const fixture = createFixture({words: [['w1', 'Hund', ['dog']]]});
  const round = startRound({
    id: 'render-key', profileId: 'p1', mode: 'all', size: 10,
    projection: project(fixture.base), day: '2026-09-17',
  });
  const initial = {ledger: fixture.base, rounds: {p1: round}, pendingPackets: []};
  const validBackgroundUpdate = structuredClone(initial);
  validBackgroundUpdate.pendingPackets.push({kind: 'unrelated-update'});

  const archived = fixture.event('entity.revised', {
    entityType: 'profile', entityId: 'p1', parents: ['rev-p1'],
    value: {name: 'Ada', archived: true},
  }, {id: 'profile-archived'});
  const left = fixture.event('entity.revised', {
    entityType: 'profile', entityId: 'p1', parents: ['rev-p1'],
    value: {name: 'Ada A', archived: false},
  }, {id: 'profile-conflict-left'});
  const right = fixture.event('entity.revised', {
    entityType: 'profile', entityId: 'p1', parents: ['rev-p1'],
    value: {name: 'Ada B', archived: false},
  }, {id: 'profile-conflict-right'});
  const withoutProfile = structuredClone(fixture.base);
  withoutProfile.events = withoutProfile.events.filter((event) => event.payload.entityType !== 'profile');

  const initialKey = practiceRenderKey(initial, 'p1');
  assert.equal(practiceRenderKey(validBackgroundUpdate, 'p1'), initialKey);
  assert.notEqual(practiceRenderKey({...initial, ledger: fixture.withEvents(archived)}, 'p1'), initialKey);
  assert.notEqual(practiceRenderKey({...initial, ledger: fixture.withEvents(left, right)}, 'p1'), initialKey);
  assert.notEqual(practiceRenderKey({...initial, ledger: withoutProfile}, 'p1'), initialKey);
});
