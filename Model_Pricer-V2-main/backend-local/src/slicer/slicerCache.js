/**
 * slicerCache.js — In-memory cache for slicer results keyed by file hash + preset hash.
 *
 * Global (shared across tenants) since identical model + identical preset
 * always produces identical slicing output regardless of tenant.
 *
 * Features:
 * - SHA-256 hash of model file content + preset INI content as cache key
 * - TTL-based expiration (default: 30 minutes)
 * - Max entries limit to prevent unbounded memory growth
 * - Cache stats for monitoring via health endpoints
 *
 * @module slicer/slicerCache
 */

import { createHash } from "node:crypto";
import fs from "node:fs/promises";

const DEFAULT_TTL_MS = 30 * 60 * 1000; // 30 minutes
const DEFAULT_MAX_ENTRIES = 200;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * @typedef {Object} CacheEntry
 * @property {Object} result - The cached slicer result
 * @property {number} expiresAt - Timestamp when this entry expires
 * @property {number} createdAt - Timestamp when this entry was created
 * @property {number} hits - Number of cache hits for this entry
 */

export class SlicerCache {
  /**
   * @param {Object} [options]
   * @param {number} [options.ttlMs=1800000] - Time-to-live for cache entries (default 30min)
   * @param {number} [options.maxEntries=200] - Maximum cache entries before eviction
   */
  constructor(options = {}) {
    this.ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
    this.maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES;

    /** @type {Map<string, CacheEntry>} */
    this._cache = new Map();

    /** @type {{ hits: number, misses: number, evictions: number }} */
    this._stats = { hits: 0, misses: 0, evictions: 0 };

    // Periodic cleanup
    this._cleanupTimer = setInterval(() => this._cleanup(), CLEANUP_INTERVAL_MS);
    if (this._cleanupTimer.unref) {
      this._cleanupTimer.unref();
    }
  }

  /**
   * Compute the cache key from model file path and INI file path.
   * Key = SHA-256(modelContent + "||SEPARATOR||" + iniContent).
   *
   * @param {string} modelPath - Path to the model file
   * @param {string} iniPath - Path to the INI preset file
   * @returns {Promise<string>} Cache key (hex digest)
   */
  async computeKey(modelPath, iniPath) {
    const [modelBuf, iniBuf] = await Promise.all([
      fs.readFile(modelPath),
      fs.readFile(iniPath),
    ]);

    const hash = createHash("sha256");
    hash.update(modelBuf);
    hash.update("||SEPARATOR||");
    hash.update(iniBuf);
    return hash.digest("hex");
  }

  /**
   * Look up a cached result.
   *
   * @param {string} key - Cache key from computeKey()
   * @returns {Object|null} Cached result or null if not found/expired
   */
  get(key) {
    const entry = this._cache.get(key);
    if (!entry) {
      this._stats.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this._cache.delete(key);
      this._stats.misses++;
      return null;
    }

    entry.hits++;
    this._stats.hits++;
    return entry.result;
  }

  /**
   * Store a slicer result in the cache.
   *
   * @param {string} key - Cache key from computeKey()
   * @param {Object} result - Slicer result to cache
   */
  set(key, result) {
    // Evict oldest entries if at capacity
    if (this._cache.size >= this.maxEntries && !this._cache.has(key)) {
      this._evictOldest();
    }

    this._cache.set(key, {
      result,
      expiresAt: Date.now() + this.ttlMs,
      createdAt: Date.now(),
      hits: 0,
    });
  }

  /**
   * Get cache statistics for health/monitoring endpoints.
   *
   * @returns {{ size: number, maxEntries: number, ttlMs: number, hits: number, misses: number, evictions: number, hitRate: string }}
   */
  getStats() {
    const total = this._stats.hits + this._stats.misses;
    const hitRate = total > 0 ? ((this._stats.hits / total) * 100).toFixed(1) + "%" : "N/A";
    return {
      size: this._cache.size,
      maxEntries: this.maxEntries,
      ttlMs: this.ttlMs,
      hits: this._stats.hits,
      misses: this._stats.misses,
      evictions: this._stats.evictions,
      hitRate,
    };
  }

  /**
   * Clear all cached entries and reset statistics.
   */
  clear() {
    this._cache.clear();
    this._stats = { hits: 0, misses: 0, evictions: 0 };
  }

  /**
   * Reset cache statistics without clearing cached entries.
   */
  resetStats() {
    this._stats = { hits: 0, misses: 0, evictions: 0 };
  }

  /**
   * Graceful shutdown — clear cache and stop cleanup timer.
   */
  shutdown() {
    clearInterval(this._cleanupTimer);
    this._cache.clear();
  }

  /**
   * Remove expired entries.
   * @private
   */
  _cleanup() {
    const now = Date.now();
    for (const [key, entry] of this._cache) {
      if (now > entry.expiresAt) {
        this._cache.delete(key);
      }
    }
  }

  /**
   * Evict the oldest entry by creation time.
   * @private
   */
  _evictOldest() {
    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this._cache) {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this._cache.delete(oldestKey);
      this._stats.evictions++;
    }
  }
}

// Singleton instance
export const slicerCache = new SlicerCache();
