var CACHE_VERSION = 'madness-v1';
var CACHE_FILES = [
  '/',
  '/index.html',
  '/css/madness.css',
  '/js/config.js',
  '/js/state.js',
  '/js/scoring.js',
  '/js/draft.js',
  '/js/dashboard.js',
  '/js/bracket.js',
  '/js/api.js',
  '/js/app.js',
  '/manifest.json'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_VERSION).then(function(cache) {
      return cache.addAll(CACHE_FILES);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(n) { return n !== CACHE_VERSION; })
             .map(function(n) { return caches.delete(n); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  if (e.request.url.includes('/.netlify/functions/')) return;
  e.respondWith(
    fetch(e.request).catch(function() {
      return caches.match(e.request);
    })
  );
});
