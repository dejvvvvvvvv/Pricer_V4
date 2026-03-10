/**
 * Simple pub/sub event emitter for network errors.
 * Allows components to subscribe to network errors without tight coupling.
 *
 * Usage:
 *   import { onNetworkError, emitNetworkError } from '@/lib/networkEvents';
 *
 *   // Subscribe
 *   const unsubscribe = onNetworkError((error) => { ... });
 *
 *   // Emit
 *   emitNetworkError(new Error('Network timeout'));
 *
 *   // Cleanup
 *   unsubscribe();
 */

const listeners = new Set();

/** Last emission timestamp — used for debouncing rapid-fire errors. */
let lastEmitTime = 0;

/** Minimum interval between emitted events (ms). */
const DEBOUNCE_MS = 2000;

/**
 * Register a listener for network errors.
 * @param {function} listener - Called with the error object when a network error is emitted.
 * @returns {function} Unsubscribe function - call it to remove the listener.
 */
export function onNetworkError(listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Emit a network error to all registered listeners.
 * Debounced: rapid-fire errors within DEBOUNCE_MS are silently dropped
 * so the user does not get flooded with toasts.
 * @param {Error|object} error - The error to broadcast.
 */
export function emitNetworkError(error) {
  const now = Date.now();
  if (now - lastEmitTime < DEBOUNCE_MS) {
    return;
  }
  lastEmitTime = now;

  for (const listener of listeners) {
    try {
      listener(error);
    } catch (e) {
      console.error('[networkEvents] Listener threw:', e);
    }
  }
}

/**
 * Remove all listeners. Useful for testing cleanup.
 */
export function clearAllListeners() {
  listeners.clear();
}
