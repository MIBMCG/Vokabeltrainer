import test from 'node:test';
import assert from 'node:assert/strict';

import {projectProbe} from '../../src/probe/model.js';

const answer = (id, epoch = 'initial') => ({
  version: 1,
  kind: 'answer',
  id,
  epoch,
  correct: true,
});

const reset = (id, parentEpoch = 'initial', epoch = `epoch-${id}`, previousAnswerIds = []) => ({
  version: 1,
  kind: 'reset',
  id,
  parentEpoch,
  epoch,
  baseAnswers: [],
  previousAnswerIds,
  backupFileId: `backup-${id}`,
});

test('deduplicates identical events and rejects one ID with different payloads', () => {
  const first = answer('answer-a');

  assert.equal(projectProbe([first, first]).points, 10);
  assert.throws(
    () => projectProbe([first, {...first, epoch: 'other'}]),
    /Ereignis-ID|unterschied/i,
  );
});

test('rejects malformed events atomically', () => {
  assert.throws(
    () => projectProbe([answer('answer-a'), {...answer('answer-b'), correct: false}]),
    /Ereignis|Antwort/i,
  );
});

test('reset excludes known answers and lists unknown old-epoch answers as late', () => {
  const first = answer('answer-a');
  const clearing = reset('reset-a', 'initial', 'epoch-reset-a', ['answer-a']);

  assert.deepEqual(projectProbe([first, clearing]), {
    epoch: 'epoch-reset-a',
    answerCount: 0,
    points: 0,
    lateAnswers: [],
    conflict: false,
  });

  const late = answer('late-a');
  const projected = projectProbe([first, clearing, late]);
  assert.equal(projected.answerCount, 0);
  assert.equal(projected.points, 0);
  assert.deepEqual(projected.lateAnswers, [late]);
});

test('counts answers in the active reset epoch', () => {
  const projected = projectProbe([
    answer('answer-a'),
    reset('reset-a', 'initial', 'epoch-reset-a', ['answer-a']),
    answer('answer-b', 'epoch-reset-a'),
  ]);

  assert.equal(projected.epoch, 'epoch-reset-a');
  assert.equal(projected.answerCount, 1);
  assert.equal(projected.points, 10);
});

test('retains late answers from every completed reset generation', () => {
  const projected = projectProbe([
    answer('known-a'),
    reset('reset-a', 'initial', 'epoch-a', ['known-a']),
    answer('late-initial'),
    answer('known-b', 'epoch-a'),
    reset('reset-b', 'epoch-a', 'epoch-b', ['known-b']),
    answer('late-a', 'epoch-a'),
  ]);

  assert.equal(projected.epoch, 'epoch-b');
  assert.deepEqual(projected.lateAnswers.map(({id}) => id), ['late-initial', 'late-a']);
});

test('keeps the common parent epoch visible when resets branch concurrently', () => {
  const first = answer('answer-a');
  const projected = projectProbe([
    first,
    reset('reset-a', 'initial', 'epoch-reset-a', ['answer-a']),
    reset('reset-b', 'initial', 'epoch-reset-b', ['answer-a']),
    answer('answer-b', 'epoch-reset-a'),
    answer('answer-c', 'epoch-reset-b'),
  ]);

  assert.equal(projected.epoch, 'initial');
  assert.equal(projected.answerCount, 1);
  assert.equal(projected.points, 10);
  assert.deepEqual(projected.lateAnswers, []);
  assert.equal(projected.conflict, true);
});

test('rejects malformed reset graphs and JSON extensions', () => {
  assert.throws(() => projectProbe([reset('reset-a', 'initial', 'initial')]), /Generation|epoch/i);
  assert.throws(() => projectProbe([{...answer('answer-a'), token: 'secret'}]), /Ereignis/i);
});
