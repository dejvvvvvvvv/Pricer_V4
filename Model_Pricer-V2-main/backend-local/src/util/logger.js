/**
 * Minimal backend logger.
 *
 * logInfo  — dev-only (suppressed in production)
 * logWarn  — always emitted
 * logError — always emitted
 *
 * @module util/logger
 */

const isDev = process.env.NODE_ENV !== "production";

export function logInfo(...args) {
  if (isDev) console.log("[MP]", ...args);
}

export function logWarn(...args) {
  console.warn("[MP]", ...args);
}

export function logError(...args) {
  console.error("[MP]", ...args);
}
