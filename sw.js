const CACHE_NAME = 'ls-pets-v1';
const ASSETS = [
  'index.html',
  'manifest.json',
  'bg_wp.JPG',
  'happy-day.mp3'
];

// Installs the service worker
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// Controls the fetch requests
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});
