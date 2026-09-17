import test from 'node:test';
import assert from 'node:assert/strict';

import {openProbeStore} from '../../src/probe/store.js';

function fakeLocks({available = true} = {}) {
  return {
    requests: 0,
    request(_name, options, callback) {
      this.requests += 1;
      assert.deepEqual(options, {mode: 'exclusive', ifAvailable: true});
      return Promise.resolve(callback(available ? {name: 'probe'} : null));
    },
  };
}

function fakeIndexedDb() {
  let stored;
  let delayedWriteTransaction;
  const database = {
    objectStoreNames: {contains: () => false},
    createObjectStore() {},
    close() {},
    transaction(_storeName, mode) {
      const transaction = {
        error: null,
        objectStore() {
          return {
            get() {
              const request = {};
              queueMicrotask(() => {
                request.result = stored;
                request.onsuccess?.();
                queueMicrotask(() => transaction.oncomplete?.());
              });
              return request;
            },
            put(value) {
              stored = structuredClone(value);
              if (mode === 'readwrite') delayedWriteTransaction = transaction;
              return {};
            },
          };
        },
      };
      return transaction;
    },
  };
  return {
    open() {
      const request = {};
      queueMicrotask(() => {
        request.result = database;
        request.onupgradeneeded?.();
        request.onsuccess?.();
      });
      return request;
    },
    completeWrite() {
      delayedWriteTransaction?.oncomplete?.();
    },
  };
}

test('save resolves only after the IndexedDB transaction completes', async () => {
  const indexedDBImpl = fakeIndexedDb();
  const store = await openProbeStore({indexedDBImpl, locks: fakeLocks()});
  let resolved = false;

  const saving = store.save({version: 1}).then(() => { resolved = true; });
  await Promise.resolve();
  assert.equal(resolved, false);

  indexedDBImpl.completeWrite();
  await saving;
  assert.equal(resolved, true);
  assert.deepEqual(await store.load(), {version: 1});
  store.close();
});

test('refuses a second active tab instead of risking last-writer data loss', async () => {
  await assert.rejects(
    openProbeStore({indexedDBImpl: fakeIndexedDb(), locks: fakeLocks({available: false})}),
    /anderen (Tab|Fenster)|bereits geöffnet/i,
  );
});

test('requires browser lock support for explicit exclusive-tab mode', async () => {
  await assert.rejects(
    openProbeStore({indexedDBImpl: fakeIndexedDb(), locks: undefined}),
    /Einzelfenster|Browser/i,
  );
});
