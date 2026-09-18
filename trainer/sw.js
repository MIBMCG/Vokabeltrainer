const SCOPE = self.registration.scope;
const SCOPE_KEY = new URL(SCOPE).pathname.split('/').filter(Boolean).join('-') || 'root';
const CACHE_PREFIX = `vokabeltrainer-product-${SCOPE_KEY}-`;
const CACHE_NAME = `${CACHE_PREFIX}v1`;
const APP_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './manifest.webmanifest',
  './sw.js',
  './assets/app-icon.svg',
  './assets/islands.svg',
  './assets/avatar.svg',
  './assets/badges.svg',
  '../src/drive/auth.js',
  '../src/drive/client.js',
  '../src/trainer/main.js',
  '../src/trainer/updates.js',
  '../src/trainer/ui/dom.js',
  '../src/trainer/ui/shell.js',
  '../src/trainer/ui/practice.js',
  '../src/trainer/ui/rewards.js',
  '../src/trainer/ui/adult.js',
  '../src/trainer/ui/sync.js',
  '../src/trainer/ui/backup.js',
  '../src/trainer/ui/preview.js',
  '../src/trainer/adult/pin.js',
  '../src/trainer/adult/import.js',
  '../src/trainer/commands.js',
  '../src/trainer/backup/format.js',
  '../src/trainer/backup/restore.js',
  '../src/trainer/backup/transport.js',
  '../src/trainer/sync/packets.js',
  '../src/trainer/sync/drive.js',
  '../src/trainer/sync/scheduler.js',
  '../src/trainer/storage/store.js',
  '../src/trainer/model/canonical.js',
  '../src/trainer/model/errors.js',
  '../src/trainer/model/revisions.js',
  '../src/trainer/model/schema.js',
  '../src/trainer/model/epochs.js',
  '../src/trainer/learning/answers.js',
  '../src/trainer/learning/calendar.js',
  '../src/trainer/learning/progress.js',
  '../src/trainer/learning/rewards.js',
  '../src/trainer/learning/rounds.js',
];
const ASSET_URLS = new Set(APP_ASSETS.map((path) => new URL(path, SCOPE).href));

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll([...ASSET_URLS])));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
      .map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const {request} = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !ASSET_URLS.has(url.href)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const hit = await cache.match(request);
    return hit || fetch(request);
  })());
});

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'ACTIVATE_UPDATE' || !event.source?.id) return;
  event.waitUntil((async () => {
    let sourceUrl;
    try {
      sourceUrl = new URL(event.source.url);
    } catch {
      return;
    }
    if (sourceUrl.origin !== self.location.origin || !sourceUrl.href.startsWith(SCOPE)) return;
    await self.skipWaiting();
  })());
});
