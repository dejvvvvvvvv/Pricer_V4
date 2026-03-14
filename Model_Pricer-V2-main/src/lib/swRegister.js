/**
 * Service Worker registration utility.
 * Only registers in production builds (import.meta.env.PROD).
 *
 * Update flow:
 *   - SW checks for updates every 60 minutes.
 *   - When a new SW is found and installed, it immediately takes control
 *     (skipWaiting + clients.claim in sw.js).
 *   - We listen for the controllerchange event and reload the page so the
 *     new JS bundle is loaded. A brief debounce prevents a double-reload.
 */

export function registerServiceWorker() {
  if (!import.meta.env.PROD) return;
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // Check for updates periodically (every 60 minutes)
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);

        // Also check immediately when the user returns to the tab after a
        // long absence (visibilitychange covers background tabs).
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            registration.update();
          }
        });
      })
      .catch((err) => {
        // Non-fatal — app works fine without SW
        console.warn('[SW] Registration failed:', err);
      });

    // When the active SW changes (new version took control via skipWaiting),
    // reload the page so the new JS/CSS assets are used.
    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    });
  });
}
