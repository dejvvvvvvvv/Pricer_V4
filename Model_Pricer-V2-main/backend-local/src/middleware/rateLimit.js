/**
 * Simple in-memory rate limiter middleware.
 * No external dependencies — uses a Map as the backing store.
 *
 * Suitable for single-instance backends. For multi-instance deployments,
 * replace the in-memory store with Redis or similar.
 *
 * @module middleware/rateLimit
 */

const store = new Map();

// Clean up expired entries every 5 minutes.
// .unref() ensures this timer does not prevent Node.js from exiting.
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000).unref();

/**
 * Creates a rate limiting middleware.
 *
 * @param {Object} options
 * @param {number}   [options.windowMs=60000]  Time window in milliseconds (default: 1 minute)
 * @param {number}   [options.max=100]         Maximum requests per window (default: 100)
 * @param {string}   [options.message='Too many requests, please try again later']
 * @param {Function} [options.keyGenerator]    Custom function (req) => string to derive the rate-limit key
 * @returns {import('express').RequestHandler}
 */
export function rateLimit({
  windowMs = 60_000,
  max = 100,
  message = "Too many requests, please try again later",
  keyGenerator,
} = {}) {
  return (req, res, next) => {
    const key = keyGenerator
      ? keyGenerator(req)
      : req.ip || req.connection?.remoteAddress || "unknown";

    const now = Date.now();

    let entry = store.get(key);
    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      store.set(key, entry);
    }

    entry.count++;

    // Standard rate-limit response headers
    res.set("X-RateLimit-Limit", String(max));
    res.set("X-RateLimit-Remaining", String(Math.max(0, max - entry.count)));
    res.set("X-RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count > max) {
      return res.status(429).json({
        ok: false,
        errorCode: "MP_RATE_LIMITED",
        message,
      });
    }

    next();
  };
}
