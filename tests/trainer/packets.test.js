import test from 'node:test';
import assert from 'node:assert/strict';

import {buildPackets, validatePacket} from '../../src/trainer/sync/packets.js';
import {createFixture} from './fixtures.js';

function ids(prefix) {
  let value = 0;
  return () => `${prefix}-${++value}`;
}

test('splits 101 events into immutable packets of at most 100 events and 64 KiB', () => {
  const f = createFixture();
  const events = Array.from({length: 101}, (_, index) => f.event('preference.changed', {
    profileId: 'p1', animations: index % 2 === 0,
  }, {id: `pref-${index}`, clock: index + 10}));

  const packets = buildPackets({events, datasetId: 'd1', epochId: 'e0', id: ids('packet')});

  assert.equal(packets.length, 2);
  assert.deepEqual(packets.map(({events: entries}) => entries.length), [100, 1]);
  for (const packet of packets) {
    assert.ok(new TextEncoder().encode(JSON.stringify(packet)).byteLength <= 64 * 1024);
    assert.deepEqual(validatePacket(packet), packet);
  }
});

test('measures UTF-8 packet bytes including the JSON envelope', () => {
  const f = createFixture();
  const events = Array.from({length: 20}, (_, index) => f.event('entity.revised', {
    entityType: 'profile', entityId: `p${index + 10}`, parents: [],
    value: {name: 'Ä'.repeat(80), archived: false},
  }, {id: `rev-p${index + 10}`, clock: index + 10}));

  const packets = buildPackets({events, datasetId: 'd1', epochId: 'e0', id: ids('umlaut')});

  assert.equal(packets.flatMap(({events: entries}) => entries).length, 20);
  assert.ok(packets.every((packet) => new TextEncoder().encode(JSON.stringify(packet)).byteLength <= 64 * 1024));
});

test('rejects a single event when its packet envelope exceeds 64 KiB', () => {
  const f = createFixture();
  const event = f.event('entity.revised', {
    entityType: 'word',
    entityId: 'large-word',
    parents: [],
    value: {
      lessonId: 'l1',
      german: '🌊'.repeat(200),
      hint: '🌊'.repeat(300),
      answers: Array.from({length: 20}, () => '🌊'.repeat(200)),
      archived: false,
      learningId: 'large-learning',
    },
  }, {id: 'large'});

  assert.throws(
    () => buildPackets({events: [event], datasetId: 'd1', epochId: 'e0', id: ids('large')}),
    (error) => error?.code === 'invalid' && /16 KiB|64 KiB/.test(error.message),
  );
});

test('rejects mismatched dataset or epoch envelopes', () => {
  const f = createFixture();
  const wrongDataset = f.event('preference.changed', {profileId: 'p1', animations: true}, {
    id: 'wrong-dataset', datasetId: 'other',
  });
  const wrongEpoch = f.event('preference.changed', {profileId: 'p1', animations: true}, {
    id: 'wrong-epoch', epochId: 'other',
  });

  assert.throws(() => buildPackets({events: [wrongDataset], datasetId: 'd1', epochId: 'e0', id: ids('a')}), /Datensatz/);
  assert.throws(() => buildPackets({events: [wrongEpoch], datasetId: 'd1', epochId: 'e0', id: ids('b')}), /Epoche/);
});
