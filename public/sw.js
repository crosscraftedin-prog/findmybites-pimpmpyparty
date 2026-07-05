// FindMyBites × PimpMyParty Service Worker (v4 — ChunkLoadError fix)
//
// CRITICAL FIX: This service worker NO LONGER intercepts /_next/static/ requests.
// Previously, it used network-first for JS/CSS chunks, but after a Vercel
// redeploy the old chunk URLs return 404 from the network. The SW cached
// those 404 responses, causing ChunkLoadError on every page.
//
// Fix: Let the browser handle /_next/static/ natively (no SW interception).
// The SW only caches images/fonts (which are stable across deploys) and
// provides an offline fallback page for navigation requests.
//
// Cache version bumped to v4 to force all existing v3 caches to be purged.

const CACHE_NAME = "findmybites-v4";
const STATIC_ASSETS = [
  "/favicon.svg",
  "/favicon-96x96.png",
  "/apple-touch-icon.png",
  "/web-app-manifest-192x192.png",
  "/web-app-manifest-512x512.png",
  "/site.webmanifest",
];

// Install — cache only favicons/icons (NOT JS/CSS/chunks)
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate — purge ALL old caches (v3 and earlier) to clear stale chunks
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  // Take control of all clients immediately
  self.clients.claim();
});

// Fetch strategy (v4):
// - /_next/static/* → BYPASS (let browser handle natively — prevents ChunkLoadError)
// - /_next/image/*   → BYPASS
// - API requests     → BYPASS (always network)
// - JS/CSS           → BYPASS (let browser handle — SW must not cache build artifacts)
// - Images/fonts     → cache-first (safe — they don't change between deploys)
// - Pages (navigate) → network-first with offline fallback
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // ── BYPASS: Never intercept Next.js build assets ──
  // This is the critical fix for ChunkLoadError. The browser's native cache
  // + Vercel's CDN handles these correctly. The SW must NOT cache 404s
  // from old build chunks.
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/_next/image/") ||
    url.pathname.startsWith("/_next/data/")
  ) {
    return; // Let the browser handle it natively
  }

  // ── BYPASS: API requests ──
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // ── BYPASS: JS and CSS files (build artifacts) ──
  // These are served from /_next/static/ (already bypassed above) but
  // also bypass any other JS/CSS to be safe.
  if (url.pathname.match(/\.(js|css|mjs)$/i)) {
    return;
  }

  // ── Navigation requests (HTML pages): network-first with offline fallback ──
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Only cache successful HTML responses
          if (response.ok && response.type === "basic") {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match("/"))
        )
    );
    return;
  }

  // ── Images and fonts: cache-first (safe — stable across deploys) ──
  if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|eot)$/i)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            // Only cache successful responses
            if (response.ok && response.type === "basic") {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
      )
    );
    return;
  }

  // All other requests: let the browser handle natively (no SW interception)
});
