const CACHE_NAME = "nota";
const ASSETS = [
  "index.html",
  "styles/index.css",
  "js/main.js",
];

self.addEventListener("install", (event) => {
  console.log("[SW] Nota — installing…");
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener("activate", (event) => {
  console.log("[SW] Nota — activated!");
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // External resources (fonts etc.) — network first, fall back to cache
  if (url.origin !== location.origin) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Local assets — cache first, fall back to network and cache the result
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        console.log("[SW] Cache hit:", event.request.url);
        return cached;
      }
      console.log("[SW] Network fetch:", event.request.url);
      return fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
