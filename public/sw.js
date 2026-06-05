const CACHE_NAME = 'drs-cache-v1';
const URLS_TO_CACHE = [
  '/'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

self.addEventListener('fetch', (event) => {
  // Pass-through pour l'API et autres routes dynamiques
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
