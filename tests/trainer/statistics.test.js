import test from 'node:test';
import assert from 'node:assert/strict';

import {learningStatistics} from '../../src/trainer/learning/statistics.js';
import {ProductError} from '../../src/trainer/model/errors.js';
import {assertLedger} from '../../src/trainer/model/schema.js';
import {createFixture} from './fixtures.js';

const V2 = {formatVersion: 2, ruleVersion: 2};

function answerSeries(f, {wordId, count, ordinalStart, idPrefix}) {
  return Array.from({length: count}, (_, index) => f.answer({
    id: `${idPrefix}-${index + 1}`,
    wordId,
    ordinal: ordinalStart + index,
  }));
}

test('statistics expose empty days and count effective answers by their stored learning day', () => {
  const f = createFixture();
  const empty = learningStatistics({ledger: f.base, profileId: 'p1', day: '2026-09-17', days: 14});
  assert.deepEqual(empty.summary, {attempts: 0, correct: 0, wrong: 0, accuracy: null});
  assert.deepEqual(empty.buckets, {new: 3, learning: 0, review: 0, excluded: 0});
  assert.equal(empty.daily.length, 14);
  assert.deepEqual(empty.daily.at(-1), {day: '2026-09-17', correct: 0, wrong: 0});
  assert.equal(empty.wordCount, 3);
  assert.equal(empty.dueCount, 3);
  assert.equal(empty.epochConflict, false);

  const yesterday = f.answer({id: 'yesterday', ordinal: 1, day: '2026-09-16'});
  const today = f.answer({
    id: 'today', ordinal: 2, correct: false, day: '2026-09-17',
    occurredAt: '2026-09-18T23:59:59.000Z',
  });
  const outside = f.answer({id: 'outside', ordinal: 3, day: '2026-09-03'});
  const otherProfile = f.answer({id: 'other-profile', ordinal: 4, profileId: 'p2'});
  const result = learningStatistics({
    ledger: f.withEvents(f.roundStarted, yesterday, today, outside, otherProfile),
    profileId: 'p1', day: '2026-09-17', days: 14,
  });
  assert.deepEqual(result.summary, {attempts: 2, correct: 1, wrong: 1, accuracy: 50});
  assert.deepEqual(result.daily.at(-2), {day: '2026-09-16', correct: 1, wrong: 0});
  assert.deepEqual(result.daily.at(-1), {day: '2026-09-17', correct: 0, wrong: 1});

  for (const days of [0, 13, 15, 31]) {
    assert.throws(
      () => learningStatistics({ledger: f.base, profileId: 'p1', day: '2026-09-17', days}),
      (error) => error instanceof ProductError && error.code === 'invalid',
    );
  }
});

test('statistics deduplicate answer slots and keep historical answers separate from current words', () => {
  const f = createFixture();
  const first = f.answer({id: 'first', ordinal: 1, correct: false, clock: 20});
  const duplicate = f.answer({id: 'duplicate', ordinal: 1, correct: false, clock: 21});
  const archivedAnswer = f.answer({id: 'archived-answer', ordinal: 2, wordId: 'w2'});
  const original = f.base.events.find(({id}) => id === 'rev-w2');
  const originalW1 = f.base.events.find(({id}) => id === 'rev-w1');
  const archive = f.event('entity.revised', {
    ...original.payload,
    parents: [original.id],
    value: {...original.payload.value, archived: true},
  }, {id: 'archive-w2'});
  const newLearningRevision = f.event('entity.revised', {
    ...originalW1.payload,
    parents: [originalW1.id],
    value: {...originalW1.payload.value, answers: ['hound'], learningId: 'learn-w1-new'},
  }, {id: 'rev-w1-new'});
  const conflicting = f.withEvents(
    f.roundStarted,
    first,
    {...structuredClone(duplicate), payload: {...duplicate.payload, correct: true}},
  );
  assert.throws(() => assertLedger(conflicting), (error) => error.code === 'collision');
  const ledger = f.withEvents(f.roundStarted, duplicate, first, archivedAnswer, archive, newLearningRevision);
  assertLedger(ledger);

  const result = learningStatistics({ledger, profileId: 'p1', day: '2026-09-17', days: 14});
  assert.deepEqual(result.summary, {attempts: 2, correct: 1, wrong: 1, accuracy: 50});
  assert.equal(result.wordCount, 2);
  assert.deepEqual(result.buckets, {new: 1, learning: 1, review: 0, excluded: 0});
  assert.equal(Object.values(result.buckets).reduce((sum, value) => sum + value, 0), 2);

  const support = structuredClone(ledger);
  support.snapshots.push({
    id: 'support-snapshot', datasetId: 'd1',
    effectiveEventIds: f.base.events.map(({id}) => id).sort(),
    supportEventIds: ['start-r1', 'first', 'duplicate', 'archived-answer', 'archive-w2', 'rev-w1-new'].sort(),
    contentHash: '0'.repeat(64),
  });
  support.epochs.push({
    format: 'vokabeltrainer-product', formatVersion: 1, ruleVersion: 1, kind: 'epoch',
    id: 'support-epoch', datasetId: 'd1', parents: ['e0'], deviceId: 'restore', clock: 100,
    occurredAt: '2026-09-18T10:00:00.000Z', snapshotId: 'support-snapshot', snapshotManifestFileId: null,
  });
  support.events.push(f.answer({id: 'late-answer', ordinal: 3, wordId: 'w3'}));
  assertLedger(support);
  const supported = learningStatistics({ledger: support, profileId: 'p1', day: '2026-09-17', days: 14});
  assert.deepEqual(supported.summary, {attempts: 0, correct: 0, wrong: 0, accuracy: null});
  assert.equal(supported.wordCount, 3);
});

test('statistics form four disjoint current-word groups and reactivation returns a word to learning', () => {
  const f = createFixture({words: [
    ['w1', 'Hund', ['dog']],
    ['w2', 'Katze', ['cat']],
    ['w3', 'Haus', ['house']],
    ['w4', 'Boot', ['boat']],
  ]});
  const rules = f.event('learning.rules.changed', {
    profileId: 'p1', slowAfter: 3, stopAfter: 4, intervals: [1, 3, 7, 14],
  }, {...V2, id: 'rules'});
  const events = [
    f.roundStarted,
    rules,
    ...answerSeries(f, {wordId: 'w2', count: 1, ordinalStart: 1, idPrefix: 'learning'}),
    ...answerSeries(f, {wordId: 'w3', count: 3, ordinalStart: 2, idPrefix: 'review'}),
    ...answerSeries(f, {wordId: 'w4', count: 4, ordinalStart: 5, idPrefix: 'excluded'}),
  ];
  const ledger = f.withEvents(...events);
  assertLedger(ledger);
  const result = learningStatistics({ledger, profileId: 'p1', day: '2026-09-17', days: 14});
  assert.deepEqual(result.buckets, {new: 1, learning: 1, review: 1, excluded: 1});
  assert.equal(result.wordCount, 4);
  assert.equal(result.dueCount, 2);
  assert.deepEqual(result.summary, {attempts: 8, correct: 8, wrong: 0, accuracy: 100});

  const reset = f.event('word.reactivated', {
    profileId: 'p1', wordId: 'w4', revisionId: 'rev-w4', learningId: 'learn-w4',
  }, {...V2, id: 'reset-w4'});
  const reactivated = learningStatistics({
    ledger: f.withEvents(...events, reset), profileId: 'p1', day: '2026-09-17', days: 14,
  });
  assert.deepEqual(reactivated.buckets, {new: 1, learning: 2, review: 1, excluded: 0});
  assert.equal(reactivated.dueCount, 3);
  assert.deepEqual(reactivated.summary, result.summary);
});

test('statistics surface epoch conflicts without presenting answer or word totals as valid', () => {
  const f = createFixture();
  const ledger = structuredClone(f.base);
  const root = ledger.epochs[0];
  ledger.epochs.push(
    {...root, id: 'left-epoch', parents: ['e0'], deviceId: 'left', clock: 50},
    {...root, id: 'right-epoch', parents: ['e0'], deviceId: 'right', clock: 50},
  );
  const result = learningStatistics({ledger, profileId: 'p1', day: '2026-09-17', days: 30});
  assert.equal(result.epochConflict, true);
  assert.deepEqual(result.summary, {attempts: 0, correct: 0, wrong: 0, accuracy: null});
  assert.deepEqual(result.buckets, {new: 0, learning: 0, review: 0, excluded: 0});
  assert.equal(result.wordCount, 0);
  assert.equal(result.dueCount, 0);
  assert.equal(result.daily.length, 30);
});
