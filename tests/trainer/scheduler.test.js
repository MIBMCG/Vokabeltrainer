import test from 'node:test';
import assert from 'node:assert/strict';

import * as syncScheduling from '../../src/trainer/sync/scheduler.js';

const {createSyncScheduler} = syncScheduling;

function timers() {
  let nextId = 0;
  const pending = new Map();
  return {
    pending,
    setTimer(callback, delay) {
      const id = ++nextId;
      pending.set(id, {callback, delay});
      return id;
    },
    clearTimer(id) { pending.delete(id); },
    async fire(delay) {
      const entry = [...pending.entries()].find(([, value]) => value.delay === delay);
      assert.ok(entry, `missing timer ${delay}`);
      pending.delete(entry[0]);
      await entry[1].callback();
      await Promise.resolve();
    },
  };
}

test('starts immediately, batches changes for 10 seconds and polls after 60 seconds', async () => {
  const clock = timers();
  let calls = 0;
  const scheduler = createSyncScheduler({
    sync: async () => { calls += 1; }, hasChanges: () => false,
    setTimer: clock.setTimer, clearTimer: clock.clearTimer, now: () => 0,
  });

  scheduler.start();
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(calls, 1);
  assert.ok([...clock.pending.values()].some(({delay}) => delay === 60_000));

  scheduler.changed();
  assert.ok([...clock.pending.values()].some(({delay}) => delay === 10_000));
  await clock.fire(10_000);
  assert.equal(calls, 2);
  scheduler.stop();
});

test('hidden state stops polling and foreground, online and round completion coalesce', async () => {
  const clock = timers();
  let calls = 0;
  let release;
  const scheduler = createSyncScheduler({
    sync: () => new Promise((resolve) => { calls += 1; release = resolve; }),
    hasChanges: () => false, setTimer: clock.setTimer, clearTimer: clock.clearTimer, now: () => 0,
  });

  scheduler.start();
  await Promise.resolve();
  scheduler.visibility(false);
  assert.equal(clock.pending.size, 0);
  scheduler.visibility(true);
  scheduler.online();
  scheduler.roundCompleted();
  assert.equal(calls, 1);
  release();
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(calls, 2);
  release();
  scheduler.stop();
});

test('retries only transient failures at 1, 2, 4, 8 and 16 seconds', async () => {
  const clock = timers();
  let calls = 0;
  const scheduler = createSyncScheduler({
    sync: async () => { calls += 1; throw Object.assign(new Error('temporary'), {code: 'retryable'}); },
    hasChanges: () => false, setTimer: clock.setTimer, clearTimer: clock.clearTimer, now: () => 0,
  });

  scheduler.start();
  await Promise.resolve();
  await Promise.resolve();
  for (const delay of [1_000, 2_000, 4_000, 8_000, 16_000]) await clock.fire(delay);
  assert.equal(calls, 6);
  assert.equal(clock.pending.size, 0);
  scheduler.stop();
});

test('does not retry permission or authentication failures', async () => {
  for (const code of ['permission', 'auth', 'missing', 'invalid']) {
    const clock = timers();
    const scheduler = createSyncScheduler({
      sync: async () => { throw Object.assign(new Error(code), {code}); }, hasChanges: () => false,
      setTimer: clock.setTimer, clearTimer: clock.clearTimer, now: () => 0,
    });
    scheduler.start();
    await Promise.resolve();
    await Promise.resolve();
    assert.equal(clock.pending.size, 0);
    scheduler.stop();
  }
});

test('repeated changes preserve the first ten-second deadline', async () => {
  let time = 0;
  let nextId = 0;
  const pending = new Map();
  const scheduler = createSyncScheduler({
    sync: async () => {}, hasChanges: () => true, now: () => time,
    setTimer(callback, delay) {
      const id = ++nextId;
      pending.set(id, {callback, due: time + delay});
      return id;
    },
    clearTimer(id) { pending.delete(id); },
  });
  scheduler.start();
  await Promise.resolve();
  await Promise.resolve();
  scheduler.changed();
  assert.equal([...pending.values()][0].due, 10_000);
  time = 9_000;
  scheduler.changed();
  assert.equal([...pending.values()][0].due, 10_000);
  scheduler.stop();
});

test('completion of an in-flight sync keeps an earlier queued change deadline', async () => {
  let time = 0;
  let nextId = 0;
  let release;
  const pending = new Map();
  const scheduler = createSyncScheduler({
    sync: () => new Promise((resolve) => { release = resolve; }), hasChanges: () => true, now: () => time,
    setTimer(callback, delay) {
      const id = ++nextId;
      pending.set(id, {callback, due: time + delay});
      return id;
    },
    clearTimer(id) { pending.delete(id); },
  });
  scheduler.start();
  await Promise.resolve();
  time = 1_000;
  scheduler.changed();
  assert.equal([...pending.values()][0].due, 11_000);
  time = 5_000;
  release();
  await Promise.resolve();
  await Promise.resolve();
  assert.equal([...pending.values()][0].due, 11_000);
  scheduler.stop();
});

test('sync-internal state commits leave an idle dataset on the normal poll', async () => {
  const clock = timers();
  let calls = 0;
  const scheduler = createSyncScheduler({
    sync: async () => { calls += 1; }, hasChanges: () => false,
    setTimer: clock.setTimer, clearTimer: clock.clearTimer, now: () => 0,
  });
  const observe = syncScheduling.createLocalChangeNotifier({
    scheduler, initialState: {outboxEventIds: [], ledger: {events: []}},
  });
  scheduler.start();
  await Promise.resolve();
  await Promise.resolve();
  observe({outboxEventIds: [], ledger: {events: [{id: 'remote-round', type: 'round.completed'}]}});
  assert.deepEqual([...clock.pending.values()].map(({delay}) => delay), [60_000]);
  assert.equal(calls, 1);
  scheduler.stop();
});

test('new local changes schedule ten seconds and a local completed round syncs immediately', async () => {
  const clock = timers();
  let calls = 0;
  const scheduler = createSyncScheduler({
    sync: async () => { calls += 1; }, hasChanges: () => false,
    setTimer: clock.setTimer, clearTimer: clock.clearTimer, now: () => 0,
  });
  const observe = syncScheduling.createLocalChangeNotifier({
    scheduler, initialState: {outboxEventIds: [], ledger: {events: []}},
  });
  scheduler.start();
  await Promise.resolve();
  await Promise.resolve();
  observe({outboxEventIds: ['answer-1'], ledger: {events: [{id: 'answer-1', type: 'answer.recorded'}]}});
  assert.deepEqual([...clock.pending.values()].map(({delay}) => delay), [10_000]);
  observe({outboxEventIds: ['answer-1', 'round-1'], ledger: {events: [
    {id: 'answer-1', type: 'answer.recorded'}, {id: 'round-1', type: 'round.completed'},
  ]}});
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(calls, 2);
  scheduler.stop();
});

test('a local change during an active sync still causes a follow-up sync', async () => {
  const clock = timers();
  let calls = 0;
  let release;
  const scheduler = createSyncScheduler({
    sync: () => new Promise((resolve) => { calls += 1; release = resolve; }),
    hasChanges: () => false, setTimer: clock.setTimer, clearTimer: clock.clearTimer, now: () => 0,
  });
  const observe = syncScheduling.createLocalChangeNotifier({
    scheduler, initialState: {outboxEventIds: [], ledger: {events: []}},
  });
  scheduler.start();
  observe({outboxEventIds: [], ledger: {events: [{id: 'remote-round', type: 'round.completed'}]}});
  assert.equal(clock.pending.size, 0);
  observe({outboxEventIds: ['local-1'], ledger: {events: [{id: 'local-1', type: 'word.created'}]}});
  await clock.fire(10_000);
  assert.equal(calls, 1);
  release();
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(calls, 2);
  release();
  scheduler.stop();
});

test('new word and lesson revisions start one immediate sync for their batch', async () => {
  const clock = timers();
  let calls = 0;
  const scheduler = createSyncScheduler({
    sync: async () => { calls += 1; }, hasChanges: () => false,
    setTimer: clock.setTimer, clearTimer: clock.clearTimer, now: () => 0,
  });
  const observe = syncScheduling.createLocalChangeNotifier({
    scheduler, initialState: {outboxEventIds: [], ledger: {events: []}},
  });
  scheduler.start();
  await Promise.resolve();
  await Promise.resolve();
  const events = [
    {id: 'lesson-1', type: 'entity.revised', payload: {entityType: 'lesson'}},
    ...Array.from({length: 100}, (_, index) => ({
      id: `word-${index}`, type: 'entity.revised', payload: {entityType: 'word'},
    })),
  ];
  observe({outboxEventIds: events.map(({id}) => id), ledger: {events}});
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(calls, 2);
  assert.deepEqual([...clock.pending.values()].map(({delay}) => delay), [60_000]);
  scheduler.stop();
});

test('a lesson revision alone starts sync immediately', async () => {
  const clock = timers();
  let calls = 0;
  const scheduler = createSyncScheduler({
    sync: async () => { calls += 1; }, hasChanges: () => false,
    setTimer: clock.setTimer, clearTimer: clock.clearTimer, now: () => 0,
  });
  const observe = syncScheduling.createLocalChangeNotifier({
    scheduler, initialState: {outboxEventIds: [], ledger: {events: []}},
  });
  scheduler.start();
  await Promise.resolve();
  await Promise.resolve();
  observe({outboxEventIds: ['lesson-1'], ledger: {events: [
    {id: 'lesson-1', type: 'entity.revised', payload: {entityType: 'lesson'}},
  ]}});
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(calls, 2);
  scheduler.stop();
});

test('unchanged, removed and sync-internal outbox revisions never restart sync', async () => {
  const clock = timers();
  let calls = 0;
  const scheduler = createSyncScheduler({
    sync: async () => { calls += 1; }, hasChanges: () => false,
    setTimer: clock.setTimer, clearTimer: clock.clearTimer, now: () => 0,
  });
  const initialState = {outboxEventIds: ['word-1'], ledger: {events: [
    {id: 'word-1', type: 'entity.revised', payload: {entityType: 'word'}},
  ]}};
  const observe = syncScheduling.createLocalChangeNotifier({scheduler, initialState});
  scheduler.start();
  await Promise.resolve();
  await Promise.resolve();
  observe(initialState);
  observe({...initialState, ledger: {events: [...initialState.ledger.events,
    {id: 'remote-word', type: 'entity.revised', payload: {entityType: 'word'}},
  ]}});
  observe({outboxEventIds: [], ledger: initialState.ledger});
  assert.equal(calls, 1);
  assert.deepEqual([...clock.pending.values()].map(({delay}) => delay), [60_000]);
  scheduler.stop();
});

test('a new word revision during sync causes one joined follow-up without a timer', async () => {
  const clock = timers();
  let calls = 0;
  let release;
  const scheduler = createSyncScheduler({
    sync: () => new Promise((resolve) => { calls += 1; release = resolve; }),
    hasChanges: () => false, setTimer: clock.setTimer, clearTimer: clock.clearTimer, now: () => 0,
  });
  const observe = syncScheduling.createLocalChangeNotifier({
    scheduler, initialState: {outboxEventIds: [], ledger: {events: []}},
  });
  scheduler.start();
  const events = [{id: 'word-1', type: 'entity.revised', payload: {entityType: 'word'}}];
  observe({outboxEventIds: ['word-1'], ledger: {events}});
  observe({outboxEventIds: ['word-1'], ledger: {events}});
  assert.equal(calls, 1);
  assert.equal(clock.pending.size, 0);
  release();
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(calls, 2);
  release();
  scheduler.stop();
});

test('offline word revision waits for foreground recovery', async () => {
  const clock = timers();
  let calls = 0;
  const scheduler = createSyncScheduler({
    sync: async () => { calls += 1; }, hasChanges: () => false,
    setTimer: clock.setTimer, clearTimer: clock.clearTimer, now: () => 0,
  });
  const observe = syncScheduling.createLocalChangeNotifier({
    scheduler, initialState: {outboxEventIds: [], ledger: {events: []}},
  });
  scheduler.start();
  await Promise.resolve();
  await Promise.resolve();
  scheduler.visibility(false);
  observe({outboxEventIds: ['word-1'], ledger: {events: [
    {id: 'word-1', type: 'entity.revised', payload: {entityType: 'word'}},
  ]}});
  assert.equal(calls, 1);
  assert.equal(clock.pending.size, 0);
  scheduler.visibility(true);
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(calls, 2);
  scheduler.stop();
});
