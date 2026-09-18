import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const scope = 'https://example.test/repo/trainer/';

async function loadWorker({failInstall = false, currentCache = false} = {}) {
  const listeners = new Map();
  const stores = new Map([
    ['drive-probe-v1', new Map([['probe', new Response('probe')]])],
    ['foreign-cache', new Map([['foreign', new Response('foreign')]])],
    ['vokabeltrainer-product-repo-trainer-v0', new Map([['old', new Response('old')]])],
  ]);
  if (currentCache) {
    stores.set('vokabeltrainer-product-repo-trainer-v1', new Map([
      [`${scope}index.html`, new Response('current-version')],
    ]));
  }
  const controlled = [{id: 'controlled', url: `${scope}index.html`}];
  const calls = {addAll: [], deleted: [], fetch: [], skipWaiting: 0, claim: 0};
  const caches = {
    async open(name) {
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
    location: new URL(`${scope}sw.js`),
    registration: {scope},
    clients: {
      async matchAll() { return controlled; },
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
  return {listeners, stores, calls};
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
    'https://example.test/repo/src/drive/auth.js',
  ]) assert.ok(installed.includes(expected), expected);
  assert.equal(installed.some((url) => /accounts\.google|googleapis|\.json(?:$|\?)/u.test(url)), false);
});

test('failed installation preserves an existing active product cache', async () => {
  const worker = await loadWorker({failInstall: true, currentCache: true});
  await assert.rejects(dispatchExtendable(worker.listeners.get('install')), /synthetic install failure/);
  const current = worker.stores.get('vokabeltrainer-product-repo-trainer-v1');
  assert.equal(await current.get(`${scope}index.html`).text(), 'current-version');
});

test('activation removes only older caches for the same product scope', async () => {
  const worker = await loadWorker();
  await dispatchExtendable(worker.listeners.get('install'));
  await dispatchExtendable(worker.listeners.get('activate'));
  assert.equal(worker.stores.has('drive-probe-v1'), true);
  assert.equal(worker.stores.has('foreign-cache'), true);
  assert.equal(worker.stores.has('vokabeltrainer-product-repo-trainer-v0'), false);
  assert.equal(worker.calls.claim, 1);
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

test('waiting worker activates only for an explicit message from a controlled scoped client', async () => {
  const worker = await loadWorker();
  await dispatchExtendable(worker.listeners.get('message'), {
    data: {type: 'ACTIVATE_UPDATE'},
    source: {id: 'outside', url: 'https://example.test/other/'},
  });
  assert.equal(worker.calls.skipWaiting, 0);
  await dispatchExtendable(worker.listeners.get('message'), {
    data: {type: 'ACTIVATE_UPDATE'},
    source: {id: 'controlled', url: `${scope}index.html`},
  });
  assert.equal(worker.calls.skipWaiting, 1);
});
