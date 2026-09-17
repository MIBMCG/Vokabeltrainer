import test from 'node:test';
import assert from 'node:assert/strict';

import {canonical, digest} from '../../src/trainer/model/canonical.js';
import {assertDescriptor, assertEvent, mergeEvents, assertLedger} from '../../src/trainer/model/schema.js';
import {createFixture} from './fixtures.js';

test('canonical JSON sorts object keys, preserves arrays, and hashes UTF-8 bytes', async () => {
  assert.equal(canonical({b: 1, a: ['ä', 2]}), '{"a":["ä",2],"b":1}');
  assert.equal(
    await digest({b: 1, a: 2}),
    'd3626ac30a87e6f7a6428233b3c68299976865fa5508e4267c5415c76af7a772',
  );
});

test('ID collision cannot replace a previously saved answer', () => {
  const f = createFixture();
  const a = f.answer({id: 'a1'});
  assert.equal(mergeEvents([a], [structuredClone(a)]).length, 1);
  assert.throws(
    () => mergeEvents([a], [{...a, payload: {...a.payload, correct: false}}]),
    {code: 'collision'},
  );
});

test('unknown version and broken word reference reject entire ledger', () => {
  const f = createFixture();
  assert.throws(
    () => assertLedger({...f.base, descriptor: {...f.base.descriptor, formatVersion: 2}}),
    {code: 'version'},
  );
  const a = f.answer({id: 'a1', revisionId: 'missing'});
  assert.throws(() => assertLedger(f.withEvents(f.roundStarted, a)), {code: 'reference'});
});

test('dangerous or unknown object keys are rejected instead of copied', () => {
  const f = createFixture();
  const descriptor = JSON.parse(JSON.stringify(f.base.descriptor));
  Object.defineProperty(descriptor, '__proto__', {
    value: {polluted: true},
    enumerable: true,
  });

  assert.throws(() => assertDescriptor(descriptor), {code: 'invalid'});
  assert.throws(() => assertEvent({...f.roundStarted, token: 'secret'}), {code: 'invalid'});
  assert.equal({}.polluted, undefined);
});

test('invalid UTC instants, calendar days, and non-finite counters are rejected', () => {
  const f = createFixture();
  assert.throws(
    () => assertEvent({...f.roundStarted, occurredAt: '2026-09-17T10:00:00+02:00'}),
    {code: 'invalid'},
  );
  assert.throws(() => assertEvent({...f.roundStarted, day: '2026-02-29'}), {code: 'invalid'});
  assert.throws(() => assertEvent({...f.roundStarted, clock: Number.POSITIVE_INFINITY}), {code: 'invalid'});
});

test('historical answer days are not reinterpreted in the target dataset timezone', () => {
  const f = createFixture({timeZone: 'Pacific/Kiritimati'});
  const imported = f.answer({
    id: 'a-historical',
    day: '2026-09-16',
    epochId: 'old-e0',
    occurredAt: '2026-09-17T00:30:00.000Z',
  });
  const ledger = f.withEvents(f.roundStarted, imported);
  ledger.historicalEpochs.push({
    id: 'old-e0',
    datasetId: 'd1',
    parents: [],
    deviceId: 'old-device',
    clock: 1,
    occurredAt: '2026-09-16T23:00:00.000Z',
  });

  assert.equal(assertLedger(ledger).events.at(-1).day, '2026-09-16');
});

test('an event larger than 16 KiB is rejected', () => {
  const f = createFixture();
  const candidates = Array.from({length: 600}, (_, index) => ({
    wordId: `word-${index}`,
    learningId: `learning-${index}`,
  }));
  const oversized = f.event('round.started', {
    roundId: 'r-big',
    profileId: 'p1',
    mode: 'all',
    size: 10,
    candidates,
  }, {id: 'start-big'});

  assert.ok(new TextEncoder().encode(JSON.stringify(oversized)).byteLength > 16 * 1024);
  assert.throws(() => assertEvent(oversized), {code: 'invalid'});
});

test('wrong dataset and missing event epoch reject the ledger', () => {
  const f = createFixture();
  assert.throws(
    () => assertLedger(f.withEvents({...f.roundStarted, datasetId: 'other'})),
    {code: 'reference'},
  );
  assert.throws(
    () => assertLedger(f.withEvents({...f.roundStarted, epochId: 'missing'})),
    {code: 'reference'},
  );
});

test('cyclic entity predecessors and lost entity dependencies are rejected', () => {
  const f = createFixture();
  const first = f.event('entity.revised', {
    entityType: 'word',
    entityId: 'w-cycle',
    parents: ['cycle-b'],
    value: {
      lessonId: 'l1', german: 'A', hint: '', answers: ['a'], archived: false, learningId: 'learn-cycle',
    },
  }, {id: 'cycle-a'});
  const second = f.event('entity.revised', {
    entityType: 'word',
    entityId: 'w-cycle',
    parents: ['cycle-a'],
    value: {
      lessonId: 'l1', german: 'B', hint: '', answers: ['b'], archived: false, learningId: 'learn-cycle',
    },
  }, {id: 'cycle-b'});
  assert.throws(() => assertLedger(f.withEvents(first, second)), {code: 'reference'});

  const orphan = structuredClone(first);
  orphan.id = 'orphan';
  orphan.payload.parents = ['missing-parent'];
  assert.throws(() => assertLedger(f.withEvents(orphan)), {code: 'reference'});
});

test('the same round ordinal cannot contain contradictory answers', () => {
  const f = createFixture();
  const first = f.answer({id: 'a1', ordinal: 1, wordId: 'w1'});
  const contradictory = f.answer({id: 'a2', ordinal: 1, wordId: 'w2'});

  assert.throws(
    () => assertLedger(f.withEvents(f.roundStarted, first, contradictory)),
    {code: 'collision'},
  );
});

test('causal evidence order uses ASCII event keys instead of locale collation', () => {
  const f = createFixture();
  const wrong = f.answer({id: 'a1', ordinal: 1, correct: false, clock: 20, deviceId: 'Z'});
  const corrected = f.answer({id: 'a2', ordinal: 2, correct: true, clock: 20, deviceId: 'a'});
  const recovered = f.event('word.milestone', {
    profileId: 'p1',
    wordId: 'w1',
    milestone: 'recovered',
    evidenceAnswerIds: ['a1', 'a2'],
  }, {id: 'milestone-1', clock: 21});

  assert.doesNotThrow(() => assertLedger(f.withEvents(f.roundStarted, wrong, corrected, recovered)));
});

test('snapshot references and hash syntax are checked synchronously', () => {
  const f = createFixture();
  const missingEvent = structuredClone(f.base);
  missingEvent.snapshots.push({
    id: 's1',
    datasetId: 'd1',
    effectiveEventIds: ['missing'],
    supportEventIds: [],
    contentHash: '0'.repeat(64),
  });
  assert.throws(() => assertLedger(missingEvent), {code: 'reference'});

  const wrongHash = structuredClone(f.base);
  wrongHash.snapshots.push({
    id: 's1',
    datasetId: 'd1',
    effectiveEventIds: [],
    supportEventIds: [],
    contentHash: 'not-a-sha256',
  });
  assert.throws(() => assertLedger(wrongHash), {code: 'invalid'});
});

test('valid event payloads use exact field sets for every event type', () => {
  const f = createFixture();
  const valid = [
    f.event('round.completed', {roundId: 'r1', profileId: 'p1', reason: 'exhausted', answerIds: ['a1']}),
    f.event('round.abandoned', {roundId: 'r1', profileId: 'p1'}),
    f.event('word.milestone', {
      profileId: 'p1', wordId: 'w1', milestone: 'recovered', evidenceAnswerIds: ['a1', 'a2'],
    }),
    f.event('avatar.changed', {
      profileId: 'p1', skin: 0, clothing: 0, head: null, back: null, hand: null,
    }),
    f.event('preference.changed', {profileId: 'p1', animations: true}),
    f.event('events.adopted', {sourceEpochId: 'old-e0', eventIds: ['a1'], supportEventIds: ['rev-w1']}),
  ];

  for (const value of valid) assert.deepEqual(assertEvent(value), value);
  assert.throws(
    () => assertEvent({...valid[0], payload: {...valid[0].payload, bonus: 20}}),
    {code: 'invalid'},
  );
});

test('validators and merge results are independent structured copies', () => {
  const f = createFixture();
  const descriptor = assertDescriptor(f.base.descriptor);
  const event = assertEvent(f.roundStarted);
  const merged = mergeEvents([], [f.roundStarted]);
  descriptor.name = 'Changed';
  event.payload.candidates[0].wordId = 'changed';
  merged[0].payload.candidates[0].wordId = 'changed-again';

  assert.equal(f.base.descriptor.name, 'Fixture');
  assert.equal(f.roundStarted.payload.candidates[0].wordId, 'w1');
});

test('fixtures do not share counters or mutable values between tests', () => {
  const first = createFixture();
  const second = createFixture();
  first.base.descriptor.name = 'Changed';
  first.base.events[0].payload.value.name = 'Changed';

  assert.equal(second.base.descriptor.name, 'Fixture');
  assert.equal(second.base.events[0].payload.value.name, 'Ada');
  assert.equal(first.event('preference.changed', {profileId: 'p1', animations: true}).clock,
    second.event('preference.changed', {profileId: 'p1', animations: true}).clock);
});
