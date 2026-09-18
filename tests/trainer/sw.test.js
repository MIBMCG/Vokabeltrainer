import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const scope = 'https://example.test/repo/trainer/';

async function loadWorker({failInstall = false, currentCache = false, workerScope = scope, hasWaiting = true} = {}) {
  const listeners = new Map();
  const cacheOwner = `vokabeltrainer-product:${encodeURIComponent(new URL(workerScope).pathname)}:`;
  const stores = new Map([
    ['drive-probe-v1', new Map([['probe', new Response('probe')]])],
    ['foreign-cache', new Map([['foreign', new Response('foreign')]])],
    [`${cacheOwner}v1`, new Map([['old', new Response('old')]])],
    ['vokabeltrainer-product:%2Frepo%2Ftrainer%2Fother%2Ftrainer%2F:v1', new Map([['nested', new Response('nested')]])],
    ['vokabeltrainer-product-repo-trainer-v1', new Map([['legacy', new Response('legacy')]])],
  ]);
  if (currentCache) {
    stores.set(`${cacheOwner}v5`, new Map([
      [`${scope}index.html`, new Response('current-version')],
    ]));
  }
  const controlled = [{
    id: 'controlled',
    url: `${workerScope}index.html`,
    postMessage(message) { calls.responses.push(message); },
  }];
  const activeWorker = {state: 'activated'};
  const waitingWorker = {
    postMessage(message) {
      calls.relayed.push(message);
    },
  };
  const calls = {
    addAll: [], deleted: [], fetch: [], opened: [], relayed: [], responses: [], matched: [], skipWaiting: 0, claim: 0,
  };
  const caches = {
    async open(name) {
      calls.opened.push(name);
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name);
      return {
        async addAll(urls) {
          if (failInstall) throw new Error('synthetic install failure');
          calls.addAll.push([...urls]);
          for (const url of urls) store.set(url, new Response(url));
        },
        async match(request) {
          return store.get(typeof request === 'string' ? request : request.url);
        },
      };
    },
    async keys() { return [...stores.keys()]; },
    async delete(name) { calls.deleted.push(name); return stores.delete(name); },
  };
  const self = {
    location: new URL(`${workerScope}sw.js`),
    registration: {scope: workerScope, active: activeWorker, waiting: hasWaiting ? waitingWorker : null},
    clients: {
      async matchAll(options) { calls.matched.push(options); return controlled; },
      async claim() { calls.claim += 1; },
    },
    async skipWaiting() { calls.skipWaiting += 1; },
    addEventListener(type, listener) { listeners.set(type, listener); },
  };
  const context = vm.createContext({
    self, caches, URL, Request, Response, Promise, Set,
    fetch: async (request) => {
      calls.fetch.push(request.url);
      return new Response(`network:${request.url}`);
    },
  });
  vm.runInContext(await readFile(new URL('../../trainer/sw.js', import.meta.url), 'utf8'), context);
  return {listeners, stores, calls, activeWorker, waitingWorker, controlled};
}

async function dispatchExtendable(listener, extra = {}) {
  let work = Promise.resolve();
  listener({...extra, waitUntil(promise) { work = Promise.resolve(promise); }});
  await work;
}

test('worker installs the complete scoped trainer app without Google or personal data URLs', async () => {
  const worker = await loadWorker();
  await dispatchExtendable(worker.listeners.get('install'));
  assert.equal(worker.calls.addAll.length, 1);
  const installed = worker.calls.addAll[0];
  for (const expected of [
    `${scope}index.html`, `${scope}styles.css`, `${scope}manifest.webmanifest`, `${scope}sw.js`,
    `${scope}assets/app-icon.svg`, 'https://example.test/repo/src/trainer/main.js',
    'https://example.test/repo/src/trainer/ui/preview.js',
    'https://example.test/repo/src/trainer/ui/status.js',
    'https://example.test/repo/src/drive/auth.js',
  ]) assert.ok(installed.includes(expected), expected);
  assert.equal(installed.some((url) => /accounts\.google|googleapis|\.json(?:$|\?)/u.test(url)), false);
});

test('failed installation preserves an existing active product cache', async () => {
  const worker = await loadWorker({failInstall: true, currentCache: true});
  await assert.rejects(dispatchExtendable(worker.listeners.get('install')), /synthetic install failure/);
  const current = worker.stores.get('vokabeltrainer-product:%2Frepo%2Ftrainer%2F:v5');
  assert.equal(await current.get(`${scope}index.html`).text(), 'current-version');
});

test('activation removes only older caches for the same product scope', async () => {
  const worker = await loadWorker();
  await dispatchExtendable(worker.listeners.get('install'));
  await dispatchExtendable(worker.listeners.get('activate'));
  assert.equal(worker.stores.has('drive-probe-v1'), true);
  assert.equal(worker.stores.has('foreign-cache'), true);
  assert.equal(worker.stores.has('vokabeltrainer-product:%2Frepo%2Ftrainer%2Fother%2Ftrainer%2F:v1'), true);
  assert.equal(worker.stores.has('vokabeltrainer-product-repo-trainer-v1'), true);
  assert.equal(worker.stores.has('vokabeltrainer-product:%2Frepo%2Ftrainer%2F:v1'), false);
  assert.equal(worker.calls.claim, 1);
});

test('cache ownership is injective for differently segmented scope paths', async () => {
  const segmented = await loadWorker({workerScope: 'https://example.test/a/b/trainer/'});
  const dashed = await loadWorker({workerScope: 'https://example.test/a-b/trainer/'});
  await dispatchExtendable(segmented.listeners.get('install'));
  await dispatchExtendable(dashed.listeners.get('install'));
  assert.notEqual(segmented.calls.opened.at(-1), dashed.calls.opened.at(-1));
});

test('fetch serves only exact same-origin app assets from the product cache', async () => {
  const worker = await loadWorker();
  await dispatchExtendable(worker.listeners.get('install'));
  let response;
  worker.listeners.get('fetch')({
    request: new Request(`${scope}index.html`),
    respondWith(value) { response = Promise.resolve(value); },
  });
  assert.equal(await (await response).text(), `${scope}index.html`);

  for (const url of [
    `${scope}private-backup.json`,
    'https://www.googleapis.com/drive/v3/files',
    'https://example.test/repo/manifest.webmanifest',
  ]) {
    let intercepted = false;
    worker.listeners.get('fetch')({
      request: new Request(url),
      respondWith() { intercepted = true; },
    });
    assert.equal(intercepted, false, url);
  }
});

test('active worker relays activation only for the current controlled scoped client', async () => {
  const worker = await loadWorker();
  await dispatchExtendable(worker.listeners.get('message'), {
    data: {type: 'REQUEST_UPDATE_ACTIVATION', requestId: 'outside-request'},
    source: {id: 'outside', url: 'https://example.test/other/'},
  });
  assert.deepEqual(worker.calls.relayed, []);
  await dispatchExtendable(worker.listeners.get('message'), {
    data: {type: 'ACTIVATE_UPDATE', requestId: 'direct-request'},
    source: worker.controlled[0],
  });
  assert.equal(worker.calls.skipWaiting, 0, 'a window client must not address the waiting-worker command');
  await dispatchExtendable(worker.listeners.get('message'), {
    data: {type: 'REQUEST_UPDATE_ACTIVATION', requestId: 'controlled-request'},
    source: worker.controlled[0],
  });
  assert.equal(worker.calls.matched.at(-1).type, 'window');
  assert.equal(worker.calls.matched.at(-1).includeUncontrolled, false);
  assert.equal(worker.calls.relayed.length, 1);
  assert.equal(worker.calls.relayed[0].type, 'ACTIVATE_UPDATE');
  assert.equal(worker.calls.relayed[0].requestId, 'controlled-request');
});

test('waiting worker accepts activation only from the registered active worker', async () => {
  const worker = await loadWorker();
  await dispatchExtendable(worker.listeners.get('message'), {
    data: {type: 'ACTIVATE_UPDATE', requestId: 'direct-request'},
    source: worker.controlled[0],
  });
  assert.equal(worker.calls.skipWaiting, 0);
  await dispatchExtendable(worker.listeners.get('message'), {
    data: {type: 'ACTIVATE_UPDATE', requestId: 'relayed-request'},
    source: worker.activeWorker,
  });
  assert.equal(worker.calls.skipWaiting, 1);
});

test('active worker rejects the current controlled request when no update is waiting', async () => {
  const worker = await loadWorker({hasWaiting: false});
  await dispatchExtendable(worker.listeners.get('message'), {
    data: {type: 'REQUEST_UPDATE_ACTIVATION', requestId: 'stale-request'},
    source: worker.controlled[0],
  });
  assert.equal(worker.calls.responses.length, 1);
  assert.equal(worker.calls.responses[0].type, 'UPDATE_ACTIVATION_REJECTED');
  assert.equal(worker.calls.responses[0].requestId, 'stale-request');
});
