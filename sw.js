const CACHE_NAME = 'lqa-glass-v2';
const urlsToCache = ['./','./index.html','./app.js','./manifest.json','./logo.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(urlsToCache)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
  )));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Network-first para la app: siempre versión nueva; offline -> cache
  if (e.request.mode === 'navigate' || url.pathname.endsWith('app.js') || url.pathname.endsWith('index.html')) {
    e.respondWith(
      fetch(e.request).then(r => {
        const copy = r.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, copy));
        return r;
      }).catch(() => caches.match(e.request))
    );
  } else {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
  }
});
