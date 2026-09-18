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

  dispatch(type) {
    for (const listener of this.#listeners.get(type) ?? []) listener({type, target: this});
  }
}

function fakeRegistration(calls) {
  const registration = new FakeTarget();
  const active = {};
  registration.active = active;
  registration.waiting = {
    postMessage(message) {
      calls.push(message.type);
    },
  };
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
    pauseAndSave: async () => { calls.push('saved'); },
    reload: () => calls.push('reload'),
    onAvailable: () => calls.push('available'),
  });

  await assert.rejects(updates.activate(), updateError('not-ready'));
  await updates.activate({pauseConfirmed: true});
  assert.ok(calls.indexOf('saved') < calls.indexOf('ACTIVATE_UPDATE'));
  assert.equal(calls.includes('reload'), false);
  serviceWorker.dispatch('controllerchange');
  assert.equal(calls.at(-1), 'reload');
  updates.destroy();
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
  assert.equal(calls.includes('ACTIVATE_UPDATE'), false);
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
  await updates.activate();
  assert.deepEqual(calls, ['safe', 'ACTIVATE_UPDATE']);
  updates.destroy();
  delete globalThis.navigator;
});
