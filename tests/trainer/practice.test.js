import test from 'node:test';
import assert from 'node:assert/strict';

import {keyAction, roundSummary} from '../../src/trainer/ui/practice.js';

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
