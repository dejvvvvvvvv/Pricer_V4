/**
 * sentryService.js — Sentry initialization & helpers for Express backend.
 *
 * Graceful behaviour:
 *   - If SENTRY_DSN env var is not set, all exports become safe no-ops.
 *   - If @sentry/node is not installed, dynamic import fails silently
 *     and Sentry features are disabled without breaking the app.
 *
 * Usage (in index.js):
 *   import { initSentry, setupSentryErrorHandler } from './services/sentryService.js';
 *
 *   const app = express();
 *   await initSentry(app);   // MUST be called before any route/middleware
 *   // ... routes ...
 *   setupSentryErrorHandler(app); // MUST be after all routes, before custom error handlers
 *
 * Required package (install when ready):
 *   npm install @sentry/node
 *
 * @module sentryService
 */

/** @type {import('@sentry/node') | null} */
let _Sentry = null;

/** Whether Sentry was successfully initialised. */
let _initialized = false;

/**
 * Scrub PII fields from event data before sending to Sentry.
 * Removes customer emails, passwords, auth tokens from breadcrumbs
 * and request bodies.
 *
 * @param {object} event - Sentry event
 * @returns {object} Sanitised event
 */
function scrubPii(event) {
  // Strip sensitive fields from request body if captured
  if (event.request?.data) {
    const sensitive = ['password', 'token', 'secret', 'apiKey', 'api_key', 'creditCard', 'credit_card'];
    if (typeof event.request.data === 'object') {
      for (const key of sensitive) {
        if (key in event.request.data) {
          event.request.data[key] = '[Filtered]';
        }
      }
    }
  }

  // Strip query params from URL breadcrumbs (may contain tokens)
  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
      if (breadcrumb.data?.url) {
        breadcrumb.data.url = breadcrumb.data.url.split('?')[0];
      }
      return breadcrumb;
    });
  }

  // Remove user email/ip if accidentally attached
  if (event.user) {
    delete event.user.email;
    delete event.user.ip_address;
  }

  return event;
}

/**
 * Initialise Sentry for the Express backend.
 *
 * Must be called BEFORE any middleware or routes are registered.
 * If SENTRY_DSN is not set or @sentry/node is missing, this is a safe no-op.
 *
 * @param {import('express').Express} _app - Express application instance
 *        (reserved for future use; Sentry v8 auto-instruments Express)
 * @returns {Promise<import('@sentry/node') | null>} The Sentry module, or null
 */
export async function initSentry(_app) {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    console.log('[Sentry] No SENTRY_DSN set, skipping initialization');
    return null;
  }

  try {
    _Sentry = await import('@sentry/node');
  } catch {
    console.warn('[Sentry] @sentry/node is not installed — run: npm install @sentry/node');
    return null;
  }

  _Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.APP_VERSION || '1.0.0',

    // Capture 100 % of transactions in dev, 10 % in production
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Do NOT send default PII (emails, IPs) automatically
    sendDefaultPii: false,

    // Scrub remaining PII before send
    beforeSend(event) {
      return scrubPii(event);
    },
  });

  _initialized = true;
  console.log('[Sentry] Initialized successfully');
  return _Sentry;
}

/**
 * Register the Sentry Express error handler.
 *
 * In Sentry v8 this replaces the old Sentry.Handlers.requestHandler()
 * and Sentry.Handlers.errorHandler() — a single call is needed.
 *
 * MUST be called AFTER all routes but BEFORE custom error-handling middleware.
 *
 * @param {import('express').Express} app - Express application instance
 */
export function setupSentryErrorHandler(app) {
  if (!_initialized || !_Sentry) return;

  // Sentry v8 unified API — auto-installs request + error instrumentation
  if (typeof _Sentry.setupExpressErrorHandler === 'function') {
    _Sentry.setupExpressErrorHandler(app);
  } else {
    // Fallback for older Sentry versions (v7 and below)
    if (_Sentry.Handlers?.errorHandler) {
      app.use(_Sentry.Handlers.errorHandler());
    }
  }
}

/**
 * Report an exception to Sentry with optional context.
 *
 * Safe to call even when Sentry is not initialised — becomes a no-op.
 *
 * @param {Error} error - The error to report
 * @param {Record<string, unknown>} [context={}] - Extra context (tenantId, route, etc.)
 */
export function captureException(error, context = {}) {
  if (!_initialized || !_Sentry) return;

  _Sentry.withScope((scope) => {
    // Attach structured context as tags + extra
    if (context.tenantId) scope.setTag('tenantId', context.tenantId);
    if (context.userId) scope.setTag('userId', context.userId);
    if (context.route) scope.setTag('route', context.route);

    // Everything else goes into "extra"
    const { tenantId, userId, route, ...extra } = context;
    if (Object.keys(extra).length > 0) {
      scope.setExtras(extra);
    }

    _Sentry.captureException(error);
  });
}

/**
 * Send an informational / warning message to Sentry.
 *
 * @param {string} message - Human-readable message
 * @param {'fatal' | 'error' | 'warning' | 'info' | 'debug'} [level='info'] - Severity level
 */
export function captureMessage(message, level = 'info') {
  if (!_initialized || !_Sentry) return;
  _Sentry.captureMessage(message, level);
}

/**
 * Set the current user context on future Sentry events.
 *
 * @param {{ id?: string, tenantId?: string }} user
 */
export function setUser(user) {
  if (!_initialized || !_Sentry) return;
  // Only set id + tenantId — no email/IP (PII)
  _Sentry.setUser(user ? { id: user.id, tenantId: user.tenantId } : null);
}
