import test from 'node:test';
import assert from 'node:assert/strict';

import {createSyncScheduler} from '../../src/trainer/sync/scheduler.js';

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
