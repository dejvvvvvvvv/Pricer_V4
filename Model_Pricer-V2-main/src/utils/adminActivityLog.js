/**
 * Admin Activity Log — tenant-scoped activity tracking.
 *
 * Stores up to MAX_ENTRIES activities in localStorage under
 * `modelpricer:${tenantId}:activityLog`.
 *
 * Each activity: { id, action, category, details, user, timestamp }
 * Categories: 'order' | 'pricing' | 'config' | 'auth' | 'export' | 'slicing' | 'system'
 */

import { getTenantId } from './adminTenantStorage';
import { generateId } from './generateId';
import { debug } from '@/lib/debug';

const NAMESPACE = 'activityLog';
const MAX_ENTRIES = 500;
const DEFAULT_DAYS_TO_KEEP = 30;

const VALID_CATEGORIES = ['order', 'pricing', 'config', 'auth', 'export', 'slicing', 'system'];

function buildKey(tenantId) {
  return `modelpricer:${tenantId}:${NAMESPACE}`;
}

function canUseLocalStorage() {
  try {
    return typeof window !== 'undefined' && !!window.localStorage;
  } catch {
    return false;
  }
}

/**
 * Read all activities from storage (raw, newest first).
 */
function readActivities(tenantIdOverride) {
  if (!canUseLocalStorage()) return [];
  const tenantId = tenantIdOverride || getTenantId();
  try {
    const raw = window.localStorage.getItem(buildKey(tenantId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    debug('[adminActivityLog] Failed to read:', e);
    return [];
  }
}

/**
 * Write activities array to storage.
 */
function writeActivities(activities, tenantIdOverride) {
  if (!canUseLocalStorage()) return;
  const tenantId = tenantIdOverride || getTenantId();
  try {
    window.localStorage.setItem(
      buildKey(tenantId),
      JSON.stringify(activities)
    );
  } catch (e) {
    debug('[adminActivityLog] Failed to write:', e);
  }
}

/**
 * Log a new activity. Returns the new activity object.
 *
 * @param {{ action: string, category: string, details?: string, user?: string }} data
 * @param {string} [tenantIdOverride]
 * @returns {object} The created activity entry
 */
export function logActivity(data, tenantIdOverride) {
  const activities = readActivities(tenantIdOverride);

  const category = VALID_CATEGORIES.includes(data.category) ? data.category : 'system';

  const entry = {
    id: generateId('act'),
    action: data.action || '',
    category,
    details: data.details || '',
    user: data.user || '',
    timestamp: Date.now(),
  };

  // Prepend (newest first), enforce max limit
  const updated = [entry, ...activities].slice(0, MAX_ENTRIES);
  writeActivities(updated, tenantIdOverride);
  debug('[adminActivityLog] Logged:', entry.action, `[${category}]`);
  return entry;
}

/**
 * Get activities with optional filters.
 *
 * @param {{ category?: string, search?: string, dateFrom?: number, dateTo?: number }} [filters]
 * @param {string} [tenantIdOverride]
 * @returns {Array<object>}
 */
export function getActivities(filters = {}, tenantIdOverride) {
  let activities = readActivities(tenantIdOverride);

  if (filters.category && filters.category !== 'all') {
    activities = activities.filter((a) => a.category === filters.category);
  }

  if (filters.search) {
    const q = filters.search.toLowerCase();
    activities = activities.filter(
      (a) =>
        (a.action && a.action.toLowerCase().includes(q)) ||
        (a.details && a.details.toLowerCase().includes(q)) ||
        (a.user && a.user.toLowerCase().includes(q))
    );
  }

  if (filters.dateFrom) {
    activities = activities.filter((a) => a.timestamp >= filters.dateFrom);
  }

  if (filters.dateTo) {
    activities = activities.filter((a) => a.timestamp <= filters.dateTo);
  }

  return activities;
}

/**
 * Clear activities older than specified days.
 *
 * @param {number} [daysToKeep=30]
 * @param {string} [tenantIdOverride]
 * @returns {number} Number of removed entries
 */
export function clearOldActivities(daysToKeep = DEFAULT_DAYS_TO_KEEP, tenantIdOverride) {
  const activities = readActivities(tenantIdOverride);
  const cutoff = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;
  const filtered = activities.filter((a) => a.timestamp >= cutoff);
  const removed = activities.length - filtered.length;
  writeActivities(filtered, tenantIdOverride);
  debug('[adminActivityLog] Cleared', removed, 'entries older than', daysToKeep, 'days');
  return removed;
}

/**
 * Clear ALL activities.
 *
 * @param {string} [tenantIdOverride]
 */
export function clearAllActivities(tenantIdOverride) {
  writeActivities([], tenantIdOverride);
}

/**
 * Get total count of activities (unfiltered).
 *
 * @param {string} [tenantIdOverride]
 * @returns {number}
 */
export function getActivityCount(tenantIdOverride) {
  return readActivities(tenantIdOverride).length;
}

/** Valid categories for external use */
export { VALID_CATEGORIES };
