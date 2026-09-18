import test from 'node:test';
import assert from 'node:assert/strict';

import {createUpdateController} from '../../src/trainer/updates.js';

class FakeTarget {
  #listeners = new Map();

  addEventListener(type, listener) {
    const listeners = this.#listeners.get(type) ?? new Set();
    listeners.add(listener);
    this.#listeners.set(type, listeners);
  }

  removeEventListener(type, listener) {
    this.#listeners.get(type)?.delete(listener);
  }

  dispatch(type, event = {}) {
    for (const listener of this.#listeners.get(type) ?? []) listener({type, target: this, ...event});
  }
}

function fakeRegistration(calls) {
  const registration = new FakeTarget();
  const active = {
    postMessage(message) {
      calls.push(message);
    },
  };
  registration.active = active;
  registration.waiting = {};
  registration.installing = null;
  registration.update = async () => {
    calls.push('check');
  };
  registration.controller = active;
  return registration;
}

function updateError(code) {
  return (error) => error?.code === code;
}

test('active round update requires saved explicit pause and reloads only after controller change', async () => {
  const calls = [];
  const serviceWorker = new FakeTarget();
  const registration = fakeRegistration(calls);
  serviceWorker.controller = registration.active;
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: {serviceWorker},
  });
  const updates = createUpdateController({
    registration,
    hasActiveRound: () => true,
    pauseAndSave: async () => {
      calls.push('saved');
      return () => calls.push('released');
    },
    reload: () => calls.push('reload'),
    onAvailable: () => calls.push('available'),
  });

  await assert.rejects(updates.activate(), updateError('not-ready'));
  let settled = false;
  const activating = updates.activate({pauseConfirmed: true}).then(() => { settled = true; });
  await Promise.resolve();
  const request = calls.find((call) => call?.type === 'REQUEST_UPDATE_ACTIVATION');
  assert.ok(request?.requestId);
  assert.ok(calls.indexOf('saved') < calls.indexOf(request));
  assert.equal(settled, false);
  assert.equal(calls.includes('reload'), false);
  serviceWorker.dispatch('controllerchange');
  await activating;
  assert.equal(calls.at(-1), 'reload');
  assert.equal(calls.includes('released'), false, 'the boundary stays locked through reload');
  updates.destroy();
  assert.equal(calls.at(-1), 'released');
  delete globalThis.navigator;
});

test('failed pause leaves the waiting worker untouched', async () => {
  const calls = [];
  const serviceWorker = new FakeTarget();
  const registration = fakeRegistration(calls);
  serviceWorker.controller = registration.active;
  Object.defineProperty(globalThis, 'navigator', {configurable: true, value: {serviceWorker}});
  const updates = createUpdateController({
    registration,
    hasActiveRound: () => true,
    pauseAndSave: async () => {
      const error = new Error('Bitte zuerst die Eingabe absenden oder leeren.');
      error.code = 'typed-answer-present';
      throw error;
    },
    reload: () => calls.push('reload'),
    onAvailable: () => {},
  });

  await assert.rejects(updates.activate({pauseConfirmed: true}), updateError('typed-answer-present'));
  assert.equal(calls.some((call) => call?.type === 'REQUEST_UPDATE_ACTIVATION'), false);
  serviceWorker.dispatch('controllerchange');
  assert.equal(calls.includes('reload'), false);
  updates.destroy();
  delete globalThis.navigator;
});

test('check reports an already waiting worker and destroy unregisters lifecycle listeners', async () => {
  const calls = [];
  const serviceWorker = new FakeTarget();
  Object.defineProperty(globalThis, 'navigator', {configurable: true, value: {serviceWorker}});
  const registration = fakeRegistration(calls);
  serviceWorker.controller = registration.active;
  const updates = createUpdateController({
    registration,
    hasActiveRound: () => false,
    pauseAndSave: async () => {},
    reload: () => calls.push('reload'),
    onAvailable: () => calls.push('available'),
  });

  await updates.check();
  assert.deepEqual(calls, ['check', 'available']);
  updates.destroy();
  serviceWorker.dispatch('controllerchange');
  registration.dispatch('updatefound');
  assert.deepEqual(calls, ['check', 'available']);
  delete globalThis.navigator;
});

test('activation checks the durable UI boundary even when no round is active', async () => {
  const calls = [];
  const serviceWorker = new FakeTarget();
  const registration = fakeRegistration(calls);
  serviceWorker.controller = registration.active;
  Object.defineProperty(globalThis, 'navigator', {configurable: true, value: {serviceWorker}});
  const updates = createUpdateController({
    registration,
    hasActiveRound: () => false,
    pauseAndSave: async () => { calls.push('safe'); },
    reload: () => {},
    onAvailable: () => {},
  });
  const activating = updates.activate();
  await Promise.resolve();
  assert.equal(calls[0], 'safe');
  assert.equal(calls[1].type, 'REQUEST_UPDATE_ACTIVATION');
  serviceWorker.dispatch('controllerchange');
  await activating;
  updates.destroy();
  delete globalThis.navigator;
});

test('only the expected active worker can reject the current activation request', async () => {
  const calls = [];
  const serviceWorker = new FakeTarget();
  const registration = fakeRegistration(calls);
  serviceWorker.controller = registration.active;
  Object.defineProperty(globalThis, 'navigator', {configurable: true, value: {serviceWorker}});
  const updates = createUpdateController({
    registration,
    hasActiveRound: () => false,
    pauseAndSave: async () => () => calls.push('released'),
    reload: () => calls.push('reload'),
    onAvailable: () => {},
  });

  let settled = false;
  const activating = updates.activate().finally(() => { settled = true; });
  await Promise.resolve();
  const request = calls.find((call) => call?.type === 'REQUEST_UPDATE_ACTIVATION');
  serviceWorker.dispatch('message', {
    source: {},
    data: {type: 'UPDATE_ACTIVATION_REJECTED', requestId: request.requestId},
  });
  serviceWorker.dispatch('message', {
    source: registration.active,
    data: {type: 'UPDATE_ACTIVATION_REJECTED', requestId: 'late-other-request'},
  });
  await Promise.resolve();
  assert.equal(settled, false);
  serviceWorker.dispatch('message', {
    source: registration.active,
    data: {type: 'UPDATE_ACTIVATION_REJECTED', requestId: request.requestId},
  });
  await assert.rejects(activating, updateError('not-ready'));
  assert.equal(calls.includes('released'), true);
  serviceWorker.dispatch('controllerchange');
  assert.equal(calls.includes('reload'), false);
  updates.destroy();
  delete globalThis.navigator;
});

test('activation timeout releases the boundary and ignores a delayed controller change', async () => {
  const calls = [];
  const serviceWorker = new FakeTarget();
  const registration = fakeRegistration(calls);
  serviceWorker.controller = registration.active;
  Object.defineProperty(globalThis, 'navigator', {configurable: true, value: {serviceWorker}});
  const originalSetTimeout = globalThis.setTimeout;
  const originalClearTimeout = globalThis.clearTimeout;
  let timeoutCallback;
  globalThis.setTimeout = (callback, delay) => {
    if (delay === 10_000) {
      timeoutCallback = callback;
      return 123;
    }
    return originalSetTimeout(callback, delay);
  };
  globalThis.clearTimeout = () => {};
  try {
    const updates = createUpdateController({
      registration,
      hasActiveRound: () => false,
      pauseAndSave: async () => () => calls.push('released'),
      reload: () => calls.push('reload'),
      onAvailable: () => {},
    });
    const activating = updates.activate();
    await Promise.resolve();
    assert.equal(typeof timeoutCallback, 'function');
    timeoutCallback();
    await assert.rejects(activating, (error) => (
      error?.code === 'not-ready' && /neu öffnen/i.test(error.message)
    ));
    assert.equal(calls.includes('released'), true);
    serviceWorker.dispatch('controllerchange');
    assert.equal(calls.includes('reload'), false);
    updates.destroy();
  } finally {
    globalThis.setTimeout = originalSetTimeout;
    globalThis.clearTimeout = originalClearTimeout;
    delete globalThis.navigator;
  }
});

test('synchronous relay failure releases the durable boundary', async () => {
  const calls = [];
  const serviceWorker = new FakeTarget();
  const registration = fakeRegistration(calls);
  registration.active.postMessage = () => { throw new Error('relay failed'); };
  serviceWorker.controller = registration.active;
  Object.defineProperty(globalThis, 'navigator', {configurable: true, value: {serviceWorker}});
  const updates = createUpdateController({
    registration,
    hasActiveRound: () => false,
    pauseAndSave: async () => () => calls.push('released'),
    reload: () => calls.push('reload'),
    onAvailable: () => {},
  });

  await assert.rejects(updates.activate(), /relay failed/);
  assert.equal(calls.includes('released'), true);
  updates.destroy();
  delete globalThis.navigator;
});
