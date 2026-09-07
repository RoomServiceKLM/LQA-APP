// Service worker mínimo: habilita la instalación como PWA y deja la app
// utilizable sin conexión (los datos siguen viviendo en localStorage / Apps Script).
const CACHE_NAME = "lqa-fb-tracker-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./assets/css/styles.css",
  "./assets/js/data.js",
  "./assets/js/plan-data.js",
  "./assets/js/config.js",
  "./assets/js/store.js",
  "./assets/js/icons.js",
  "./assets/js/charts.js",
  "./assets/js/app.js",
  "./assets/img/logo.svg",
  "./assets/img/icon-192.png",
  "./assets/img/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Estrategia: network-first para el HTML/JS (para recibir actualizaciones),
// cache-first para el resto. Los datos de la auditoría NUNCA pasan por aquí:
// viven en localStorage y/o se envían directamente a Apps Script.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || req.url.includes("script.google.com")) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req))
  );
});
