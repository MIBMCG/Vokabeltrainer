const SCOPE = self.registration.scope;
const CACHE_OWNER = `vokabeltrainer-product:${encodeURIComponent(new URL(SCOPE).pathname)}:`;
const CACHE_NAME = `${CACHE_OWNER}v13`;
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
  './assets/art/island-beach-480.webp',
  './assets/art/island-journey-480.webp',
  './assets/art/avatar-skin-0-256.webp',
  './assets/art/avatar-skin-1-256.webp',
  './assets/art/avatar-skin-2-256.webp',
  './assets/art/avatar-skin-3-256.webp',
  './assets/art/avatar-clothing-0-256.webp',
  './assets/art/avatar-clothing-1-256.webp',
  './assets/art/avatar-clothing-2-256.webp',
  './assets/art/avatar-clothing-3-256.webp',
  './assets/art/avatar-clothing-4-256.webp',
  './assets/art/avatar-clothing-5-256.webp',
  './assets/art/avatar-head-cap-256.webp',
  './assets/art/avatar-head-sunhat-256.webp',
  './assets/art/avatar-head-mountainhat-256.webp',
  './assets/art/avatar-back-backpack-256.webp',
  './assets/art/avatar-hand-binoculars-256.webp',
  './assets/art/avatar-hand-compass-256.webp',
  '../src/drive/auth.js',
  '../src/drive/client.js',
  '../src/trainer/main.js',
  '../src/trainer/config.js',
  '../src/trainer/auth-config.js',
  '../src/trainer/updates.js',
  '../src/trainer/ui/dom.js',
  '../src/trainer/ui/art.js',
  '../src/trainer/ui/art-manifest.js',
  '../src/trainer/ui/shell.js',
  '../src/trainer/ui/practice.js',
  '../src/trainer/ui/rewards.js',
  '../src/trainer/ui/adult.js',
  '../src/trainer/ui/vocabulary.js',
  '../src/trainer/ui/settings.js',
  '../src/trainer/ui/sync.js',
  '../src/trainer/ui/backup.js',
  '../src/trainer/ui/preview.js',
  '../src/trainer/ui/status.js',
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
  '../src/trainer/model/versions.js',
  '../src/trainer/model/policies.js',
  '../src/trainer/storage/migrate.js',
  '../src/trainer/model/epochs.js',
  '../src/trainer/learning/answers.js',
  '../src/trainer/learning/calendar.js',
  '../src/trainer/learning/progress.js',
  '../src/trainer/learning/rewards.js',
  '../src/trainer/learning/rounds.js',
];
const ON_DEMAND_ART = [
  './assets/art/island-beach-960.webp', './assets/art/island-beach-1440.webp',
  './assets/art/island-journey-960.webp', './assets/art/island-journey-1086.webp',
  ...['skin-0', 'skin-1', 'skin-2', 'skin-3', 'clothing-0', 'clothing-1', 'clothing-2', 'clothing-3', 'clothing-4', 'clothing-5', 'head-cap', 'head-sunhat', 'head-mountainhat', 'back-backpack', 'hand-binoculars', 'hand-compass']
    .flatMap((key) => [512, 768].map((width) => `./assets/art/avatar-${key}-${width}.webp`)),
];
const PRECACHE_URLS = new Set(APP_ASSETS.map((path) => new URL(path, SCOPE).href));
const ON_DEMAND_URLS = new Set(ON_DEMAND_ART.map((path) => new URL(path, SCOPE).href));
const ASSET_URLS = new Set([...PRECACHE_URLS, ...ON_DEMAND_URLS]);

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll([...PRECACHE_URLS])));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter((name) => name.startsWith(CACHE_OWNER) && name !== CACHE_NAME)
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
    if (hit) return hit;
    const response = await fetch(request);
    if (ON_DEMAND_URLS.has(url.href) && response.ok) await cache.put(request, response.clone());
    return response;
  })());
});

self.addEventListener('message', (event) => {
  const requestId = event.data?.requestId;
  if (typeof requestId !== 'string' || !requestId) return;
  if (event.data.type === 'ACTIVATE_UPDATE') {
    if (event.source !== self.registration.active) return;
    event.waitUntil(self.skipWaiting());
    return;
  }
  if (event.data.type !== 'REQUEST_UPDATE_ACTIVATION' || !event.source?.id) return;
  event.waitUntil((async () => {
    let sourceUrl;
    try {
      sourceUrl = new URL(event.source.url);
    } catch {
      return;
    }
    if (sourceUrl.origin !== self.location.origin || !sourceUrl.href.startsWith(SCOPE)) return;
    const controlledClients = await self.clients.matchAll({type: 'window', includeUncontrolled: false});
    if (!controlledClients.some((client) => client.id === event.source.id)) return;
    const waiting = self.registration.waiting;
    if (!waiting) {
      event.source.postMessage?.({type: 'UPDATE_ACTIVATION_REJECTED', requestId});
      return;
    }
    waiting.postMessage({type: 'ACTIVATE_UPDATE', requestId});
  })());
});
