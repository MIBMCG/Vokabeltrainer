import test from 'node:test';
import assert from 'node:assert/strict';

import {openProductStore} from '../../src/trainer/storage/store.js';

function fakeLocks() {
  let held = false;
  return {
    requests: [],
    request(name, options, callback) {
      this.requests.push({name, options});
      if (held) return Promise.resolve(callback(null));
      held = true;
      return Promise.resolve(callback({name})).finally(() => { held = false; });
    },
  };
}

function fakeIndexedDb() {
  let stored;
  let pendingWrite = null;
  let closes = 0;
  const database = {
    objectStoreNames: {contains: () => false},
    createObjectStore() {},
    close() { closes += 1; },
    transaction(_storeName, mode) {
      const transaction = {
        error: null,
        objectStore() {
          return {
            get() {
              const request = {};
              queueMicrotask(() => {
                request.result = structuredClone(stored);
                request.onsuccess?.();
                queueMicrotask(() => transaction.oncomplete?.());
              });
              return request;
            },
            put(value) {
              const request = {};
              pendingWrite = {transaction, value: structuredClone(value), request};
              queueMicrotask(() => request.onsuccess?.());
              return request;
            },
          };
        },
      };
      if (mode !== 'readwrite') pendingWrite = null;
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
      stored = structuredClone(pendingWrite.value);
      pendingWrite.transaction.oncomplete?.();
      pendingWrite = null;
    },
    abortWrite() {
      pendingWrite.transaction.onabort?.();
      pendingWrite = null;
    },
    get closes() { return closes; },
  };
}

test('save publishes only after the product IndexedDB transaction completes', async () => {
  const indexedDBImpl = fakeIndexedDb();
  const locks = fakeLocks();
  const store = await openProductStore({indexedDBImpl, locks});
  let resolved = false;

  const saving = store.save({storageVersion: 1}).then(() => { resolved = true; });
  await Promise.resolve();
  assert.equal(resolved, false);

  indexedDBImpl.completeWrite();
  await saving;
  assert.equal(resolved, true);
  assert.deepEqual(await store.load(), {storageVersion: 1});
  assert.deepEqual(locks.requests, [{
    name: 'vokabeltrainer-product-v1-writer',
    options: {mode: 'exclusive', ifAvailable: true},
  }]);
  store.close();
});

test('a successful put request followed by transaction abort rejects and retains old state', async () => {
  const indexedDBImpl = fakeIndexedDb();
  const store = await openProductStore({indexedDBImpl, locks: fakeLocks()});

  const first = store.save({storageVersion: 1, marker: 'old'});
  indexedDBImpl.completeWrite();
  await first;

  const failed = store.save({storageVersion: 1, marker: 'new'});
  await Promise.resolve();
  indexedDBImpl.abortWrite();
  await assert.rejects(failed, {code: 'storage'});
  assert.deepEqual(await store.load(), {storageVersion: 1, marker: 'old'});
  store.close();
});

test('exclusive writer lock blocks another tab and close releases it for a controlled reopen', async () => {
  const locks = fakeLocks();
  const firstDb = fakeIndexedDb();
  const first = await openProductStore({indexedDBImpl: firstDb, locks});

  await assert.rejects(
    openProductStore({indexedDBImpl: fakeIndexedDb(), locks}),
    {code: 'locked'},
  );

  first.close();
  await Promise.resolve();
  await Promise.resolve();
  const reopened = await openProductStore({indexedDBImpl: fakeIndexedDb(), locks});
  assert.equal(firstDb.closes, 1);
  reopened.close();
});

test('missing Web Lock support never opens an unprotected product writer', async () => {
  let opens = 0;
  await assert.rejects(openProductStore({
    indexedDBImpl: {open() { opens += 1; }},
    locks: undefined,
  }), {code: 'locked'});
  assert.equal(opens, 0);
});
