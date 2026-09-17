import test from 'node:test';
import assert from 'node:assert/strict';

import {resolveEpochs} from '../../src/trainer/model/epochs.js';
import {projectEntities} from '../../src/trainer/model/revisions.js';
import {createFixture} from './fixtures.js';

const VERSION = {format: 'vokabeltrainer-product', formatVersion: 1, ruleVersion: 1};

function epoch(id, parents, snapshotId, overrides = {}) {
  return {
    ...VERSION,
    kind: 'epoch',
    id,
    datasetId: 'd1',
    parents,
    deviceId: 'restore-device',
    clock: 100,
    occurredAt: '2026-09-17T12:00:00.000Z',
    snapshotId,
    snapshotManifestFileId: snapshotId === null ? null : `manifest-${snapshotId}`,
    ...overrides,
  };
}

function snapshot(id, effectiveEventIds, supportEventIds = []) {
  return {
    id,
    datasetId: 'd1',
    effectiveEventIds,
    supportEventIds,
    contentHash: '0'.repeat(64),
  };
}

test('the root epoch projects its native events in stable event order', () => {
  const f = createFixture();
  const resolved = resolveEpochs(f.base);
  assert.equal(resolved.activeEpochId, 'e0');
  assert.deepEqual(resolved.heads, ['e0']);
  assert.equal(resolved.epochConflict, false);
  assert.deepEqual(resolved.effectiveEvents.map(({id}) => id),
    ['rev-p1', 'rev-l1', 'rev-w1', 'rev-w2', 'rev-w3']);
  assert.deepEqual(resolved.supportEvents, []);
  assert.deepEqual(resolved.lateEvents, []);
});

test('parallel restore heads remain a conflict without a timestamp winner', () => {
  const f = createFixture();
  const ledger = structuredClone(f.base);
  ledger.snapshots.push(snapshot('s-left', ['rev-p1']), snapshot('s-right', ['rev-l1']));
  ledger.epochs.push(
    epoch('e-left', ['e0'], 's-left', {clock: 200, deviceId: 'Z'}),
    epoch('e-right', ['e0'], 's-right', {clock: 1, deviceId: 'A'}),
  );

  const resolved = resolveEpochs(ledger);
  assert.equal(resolved.activeEpochId, null);
  assert.equal(resolved.epochConflict, true);
  assert.deepEqual(resolved.heads, ['e-right', 'e-left']);
  assert.deepEqual(resolved.effectiveEvents, []);
  assert.deepEqual(resolved.supportEvents, []);
  assert.equal(resolved.lateEvents.length, f.base.events.length);
});

test('an incomplete restore head with no available snapshot never activates', () => {
  const f = createFixture();
  const ledger = structuredClone(f.base);
  ledger.epochs.push(epoch('e-incomplete', ['e0'], 'missing'));

  const resolved = resolveEpochs(ledger);
  assert.deepEqual(resolved.heads, ['e-incomplete']);
  assert.equal(resolved.activeEpochId, null);
  assert.deepEqual(resolved.effectiveEvents, []);
  assert.equal(resolved.lateEvents.length, f.base.events.length);
});

test('snapshot support stays separate and does not activate an entity', () => {
  const f = createFixture();
  const ledger = structuredClone(f.base);
  ledger.snapshots.push(snapshot('s1', ['rev-p1', 'rev-l1'], ['rev-w1']));
  ledger.epochs.push(epoch('e1', ['e0'], 's1'));

  const resolved = resolveEpochs(ledger);
  assert.deepEqual(resolved.effectiveEvents.map(({id}) => id), ['rev-p1', 'rev-l1']);
  assert.deepEqual(resolved.supportEvents.map(({id}) => id), ['rev-w1']);
  const entities = projectEntities(resolved.effectiveEvents, {supportEvents: resolved.supportEvents});
  assert.equal(entities.entities.words.w1, undefined);
});

test('late answers remain separate while repeated adoptions activate each ID once', () => {
  const f = createFixture();
  const oldStart = {...structuredClone(f.roundStarted), epochId: 'old-e0'};
  const oldAnswer = f.answer({id: 'old-answer', epochId: 'old-e0'});
  const adoptOnce = f.event('events.adopted', {
    sourceEpochId: 'old-e0', eventIds: ['old-answer'], supportEventIds: ['start-r1'],
  }, {id: 'adopt-once', epochId: 'e1', clock: 110});
  const adoptAgain = f.event('events.adopted', {
    sourceEpochId: 'old-e0', eventIds: ['old-answer'], supportEventIds: ['start-r1'],
  }, {id: 'adopt-again', epochId: 'e1', clock: 111});
  const neverAdopted = f.answer({id: 'late-answer', epochId: 'old-e0', ordinal: 2, wordId: 'w2'});
  const ledger = structuredClone(f.base);
  ledger.historicalEpochs.push({
    id: 'old-e0', datasetId: 'd1', parents: [], deviceId: 'old', clock: 1,
    occurredAt: '2026-09-16T10:00:00.000Z',
  });
  ledger.events.push(oldStart, oldAnswer, neverAdopted, adoptOnce, adoptAgain);
  ledger.snapshots.push(snapshot('s1', f.base.events.map(({id}) => id)));
  ledger.epochs.push(epoch('e1', ['e0'], 's1'));

  const resolved = resolveEpochs(ledger);
  assert.equal(resolved.effectiveEvents.filter(({id}) => id === 'old-answer').length, 1);
  assert.deepEqual(resolved.supportEvents.map(({id}) => id), ['start-r1']);
  assert.deepEqual(resolved.lateEvents.map(({id}) => id), ['late-answer']);
});

test('historical backup ancestry never becomes an active control head', () => {
  const f = createFixture();
  const ledger = structuredClone(f.base);
  ledger.historicalEpochs.push(
    {id: 'foreign-root', datasetId: 'd1', parents: [], deviceId: 'foreign', clock: 1,
      occurredAt: '2026-09-15T10:00:00.000Z'},
    {id: 'foreign-child', datasetId: 'd1', parents: ['foreign-root'], deviceId: 'foreign', clock: 2,
      occurredAt: '2026-09-15T10:01:00.000Z'},
  );
  ledger.events.push(f.event('preference.changed', {profileId: 'p1', animations: false}, {
    id: 'foreign-event', epochId: 'foreign-child', clock: 50,
  }));

  const resolved = resolveEpochs(ledger);
  assert.deepEqual(resolved.heads, ['e0']);
  assert.equal(resolved.activeEpochId, 'e0');
  assert.deepEqual(resolved.lateEvents.map(({id}) => id), ['foreign-event']);
});

test('epoch and event input permutations produce the same projection', () => {
  const f = createFixture();
  const ledger = structuredClone(f.base);
  ledger.snapshots.push(snapshot('s1', f.base.events.map(({id}) => id)));
  ledger.epochs.push(epoch('e1', ['e0'], 's1'));
  const preference = f.event('preference.changed', {profileId: 'p1', animations: false}, {
    id: 'preference-e1', epochId: 'e1', clock: 120,
  });
  ledger.events.push(preference);

  const permuted = structuredClone(ledger);
  permuted.events.reverse();
  permuted.epochs.reverse();
  permuted.snapshots.reverse();
  assert.deepEqual(resolveEpochs(ledger), resolveEpochs(permuted));
});
