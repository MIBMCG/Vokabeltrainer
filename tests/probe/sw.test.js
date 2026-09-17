import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

async function serviceWorkerFixture(scopePath = '/probe-a/') {
  const listeners = new Map();
  const deleted = [];
  const opened = [];
  const added = [];
  const matchedByOwnCache = [];
  let globalMatchCount = 0;
  const scopePrefix = `vokabeltrainer-probe:${encodeURIComponent(scopePath)}:`;
  const keys = [
    'unrelated-app-test',
    `${scopePrefix}old`,
    `vokabeltrainer-probe:${encodeURIComponent('/probe-b/')}:current`,
  ];
  const caches = {
    async keys() { return [...keys]; },
    async delete(key) { deleted.push(key); return true; },
    async open(key) {
      opened.push(key);
      return {
        async addAll(assets) { added.push(...assets); },
        async match(request) {
          matchedByOwnCache.push(request.url);
          return {from: 'own-cache'};
        },
      };
    },
    async match() { globalMatchCount += 1; return {from: 'foreign-cache'}; },
  };
  const self = {
    location: {origin: 'https://example.test'},
    registration: {scope: `https://example.test${scopePath}`},
    addEventListener(name, listener) { listeners.set(name, listener); },
  };
  const source = await readFile(new URL('../../sw.js', import.meta.url), 'utf8');
  vm.runInNewContext(source, {self, caches, fetch: async () => {}, URL, Promise});
  return {
    listeners,
    deleted,
    opened,
    added,
    matchedByOwnCache,
    globalMatchCount: () => globalMatchCount,
    scopePrefix,
  };
}

async function dispatchExtendable(listener) {
  let completion;
  listener({waitUntil(promise) { completion = promise; }});
  await completion;
}

test('activation deletes only old caches owned by this registration scope', async () => {
  const fixture = await serviceWorkerFixture();

  await dispatchExtendable(fixture.listeners.get('activate'));

  assert.deepEqual(fixture.deleted, [`${fixture.scopePrefix}old`]);
  assert.equal(fixture.deleted.includes('unrelated-app-test'), false);
  assert.equal(fixture.deleted.some((key) => key.includes(encodeURIComponent('/probe-b/'))), false);
});

test('installation precaches only own assets in the scope-specific cache', async () => {
  const fixture = await serviceWorkerFixture('/nested/probe/');

  await dispatchExtendable(fixture.listeners.get('install'));

  assert.equal(fixture.opened.length, 1);
  assert.match(fixture.opened[0], new RegExp(`^${fixture.scopePrefix}`));
  assert.ok(fixture.added.includes('./src/probe/main.js'));
  assert.ok(fixture.added.every((asset) => !/accounts\.google|googleapis/.test(asset)));
});

test('fetch reads only this scope cache instead of searching origin-wide caches', async () => {
  const fixture = await serviceWorkerFixture();
  let response;
  const request = {method: 'GET', url: 'https://example.test/probe-a/index.html'};

  fixture.listeners.get('fetch')({
    request,
    respondWith(promise) { response = promise; },
  });
  assert.deepEqual(await response, {from: 'own-cache'});
  assert.equal(fixture.globalMatchCount(), 0);
  assert.deepEqual(fixture.matchedByOwnCache, [request.url]);
});
