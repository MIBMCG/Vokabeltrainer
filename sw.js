const CACHE_NAME = 'vokabeltrainer-probe-v1';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './src/probe/main.js',
  './manifest.webmanifest',
  './icons/probe.svg',
  './sw.js',
  './src/drive/auth.js',
  './src/drive/client.js',
  './src/probe/controller.js',
  './src/probe/model.js',
  './src/probe/store.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
    )),
  );
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  if (event.request.method !== 'GET' || requestUrl.origin !== self.location.origin) return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached ?? fetch(event.request)),
  );
});
