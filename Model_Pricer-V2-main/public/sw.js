/**
 * ModelPricer Service Worker — basic caching for PWA support.
 *
 * Strategy:
 *   - Static assets (JS, CSS, fonts, images): Cache-first with network fallback.
 *   - API calls (/api/*): Network-first with no cache (pricing must be live).
 *   - Navigation requests: Network-first, offline fallback page.
 */

const CACHE_NAME = 'modelpricer-v1';

/** Assets to pre-cache on install. */
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/icon-192.svg',
  '/icon-512.svg',
];

// -------------------------------------------------------------------
// Install — pre-cache shell
// -------------------------------------------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        // Non-fatal: if any pre-cache URL fails (e.g. dev server), continue.
        console.warn('[SW] Pre-cache partial failure:', err);
      });
    })
  );
  // Activate immediately without waiting for old SW to finish.
  self.skipWaiting();
});

// -------------------------------------------------------------------
// Activate — clean old caches
// -------------------------------------------------------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  // Take control of all open clients immediately.
  self.clients.claim();
});

// -------------------------------------------------------------------
// Fetch — routing
// -------------------------------------------------------------------
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests (form submissions, etc.)
  if (request.method !== 'GET') return;

  // Skip cross-origin requests (CDN fonts are handled by browser cache)
  if (url.origin !== self.location.origin) return;

  // API calls — network only, never cache (pricing must be live)
  if (url.pathname.startsWith('/api')) return;

  // Navigation requests — network-first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the latest navigation response
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => {
          // Try to serve from cache when offline
          return caches.match(request).then((cached) => {
            if (cached) return cached;
            // Fallback: serve the cached root page (SPA — all routes use same HTML)
            return caches.match('/');
          });
        })
    );
    return;
  }

  // Static assets — cache-first with network fallback
  if (isStaticAsset(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          // Only cache successful responses
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Everything else — network-first
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// -------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------
function isStaticAsset(pathname) {
  return /\.(js|css|woff2?|ttf|otf|eot|svg|png|jpg|jpeg|gif|ico|webp)(\?.*)?$/.test(pathname);
}
