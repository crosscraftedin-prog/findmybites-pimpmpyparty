// FindMyBites × PimpMyParty Service Worker
// Network-first for JS/CSS (so new deploys take effect immediately)
// Cache-first for images/fonts only

const CACHE_NAME = "findmybites-v3";
const STATIC_ASSETS = [
  "/favicon.svg",
  "/favicon-96x96.png",
  "/apple-touch-icon.png",
  "/web-app-manifest-192x192.png",
  "/web-app-manifest-512x512.png",
  "/site.webmanifest",
  "/hero-findmybites.png",
  "/hero-pimpmpyparty.png",
];

// Install — cache static assets (NOT JS/CSS — those use network-first)
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean up ALL old caches (force fresh start)
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch strategy:
// - JS/CSS: network-first (so new deploys take effect immediately)
// - Images/fonts: cache-first (safe to cache, don't change between deploys)
// - Pages: network-first with offline fallback
// - API: always network (never cache)
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip API requests
  if (request.url.includes("/api/")) return;

  // JS and CSS: network-first (CRITICAL — prevents stale code from old deploys)
  if (request.url.match(/\.(js|css)$/i) || request.url.includes("/_next/static/chunks/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || new Response("", { status: 503 })))
    );
    return;
  }

  // Images and fonts: cache-first (safe — they don't change between deploys)
  if (request.url.match(/\.(png|jpg|jpeg|svg|webp|ico|woff2?)$/i)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          })
      )
    );
    return;
  }

  // Pages: network-first with offline fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match("/")))
  );
});
