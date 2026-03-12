/**
 * Service Worker registration utility.
 * Only registers in production builds (import.meta.env.PROD).
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
      })
      .catch((err) => {
        // Non-fatal — app works fine without SW
        console.warn('[SW] Registration failed:', err);
      });
  });
}
