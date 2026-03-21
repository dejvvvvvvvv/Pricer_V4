/**
 * sentryInit.js — Sentry initialization for React frontend.
 *
 * Graceful behaviour:
 *   - If VITE_SENTRY_DSN env var is not set, all exports become safe no-ops.
 *   - Uses dynamic import() so @sentry/react is NOT in the initial bundle
 *     and does not block first paint.
 *   - If @sentry/react is not installed, the import fails silently.
 *
 * Usage (in index.jsx, BEFORE ReactDOM.render):
 *   import { initSentry } from './lib/sentry/sentryInit';
 *   initSentry(); // fire-and-forget — non-blocking
 *
 * Required package (install when ready):
 *   npm install @sentry/react
 *
 * @module sentryInit
 */

/**
 * Module name stored in a variable so Rollup/Vite cannot resolve it
 * statically. This allows the build to succeed even when @sentry/react
 * is not installed — the import simply fails at runtime and is caught.
 */
const SENTRY_MODULE = '@sentry/' + 'react';

/** @type {object | null} */
let _Sentry = null;

/** Whether Sentry was successfully initialised on the client. */
let _initialized = false;

/**
 * Lazily initialise Sentry for the React frontend.
 *
 * The dynamic import ensures @sentry/react is code-split into its own chunk
 * and does not increase the main bundle size or block initial render.
 *
 * If VITE_SENTRY_DSN is not set or @sentry/react is missing, this is a no-op.
 *
 * @returns {Promise<import('@sentry/react') | null>}
 */
export async function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return null;

  try {
    _Sentry = await import(/* @vite-ignore */ SENTRY_MODULE);
  } catch {
    // @sentry/react not installed — skip silently
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn('[Sentry] @sentry/react is not installed — run: npm install @sentry/react');
    }
    return null;
  }

  _Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION || '1.0.0',

    integrations: [
      _Sentry.browserTracingIntegration(),
      _Sentry.replayIntegration({
        // PII protection: mask all text and block media in session replays
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Performance: capture 100 % in dev, 10 % in production
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,

    // Session Replay: capture 10 % of normal sessions,
    // but 100 % of sessions that hit an error
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Do NOT send default PII
    sendDefaultPii: false,
  });

  _initialized = true;
  return _Sentry;
}

/**
 * Report an exception to Sentry with optional context.
 *
 * Safe to call even when Sentry is not initialised.
 *
 * @param {Error} error - The error to report
 * @param {Record<string, unknown>} [context={}] - Extra context (page, component, etc.)
 */
export function captureException(error, context = {}) {
  if (!_initialized || !_Sentry) return;
  _Sentry.captureException(error, { extra: context });
}

/**
 * Send a message to Sentry.
 *
 * @param {string} message
 * @param {'fatal' | 'error' | 'warning' | 'info' | 'debug'} [level='info']
 */
export function captureMessage(message, level = 'info') {
  if (!_initialized || !_Sentry) return;
  _Sentry.captureMessage(message, level);
}

/**
 * Set the current user context. Only passes non-PII identifiers.
 *
 * @param {{ id?: string, tenantId?: string } | null} user
 */
export function setUser(user) {
  if (!_initialized || !_Sentry) return;
  _Sentry.setUser(user ? { id: user.id, tenantId: user.tenantId } : null);
}

/**
 * Get the Sentry module reference (or null if not loaded).
 * Useful for advanced integrations (e.g. custom ErrorBoundary wrappers).
 *
 * @returns {import('@sentry/react') | null}
 */
export function getSentry() {
  return _initialized ? _Sentry : null;
}
