/**
 * Security Audit Log — tenant-scoped security event tracking.
 *
 * Stores up to MAX_ENTRIES security events in localStorage under
 * `modelpricer:${tenantId}:security-audit:v1`.
 *
 * Each entry: { id, event_type, actor, details, severity, timestamp }
 * Severities: 'info' | 'warning' | 'critical'
 * Event types: 'login' | 'logout' | 'login_failed' | 'password_change' |
 *   'permission_change' | 'config_change' | 'data_export' | 'api_key_usage'
 */

import { getTenantId } from './adminTenantStorage';
import { generateId } from './generateId';
import { debug } from '@/lib/debug';

const NAMESPACE = 'security-audit:v1';
const MAX_ENTRIES = 1000;

const VALID_SEVERITIES = ['info', 'warning', 'critical'];
const VALID_EVENT_TYPES = [
  'login',
  'logout',
  'login_failed',
  'password_change',
  'permission_change',
  'config_change',
  'data_export',
  'api_key_usage',
];

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
 * Read all security audit entries from storage (raw, newest first).
 */
function readEntries(tenantIdOverride) {
  if (!canUseLocalStorage()) return [];
  const tenantId = tenantIdOverride || getTenantId();
  try {
    const raw = window.localStorage.getItem(buildKey(tenantId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    debug('[securityAuditLog] Failed to read:', e);
    return [];
  }
}

/**
 * Write entries array to storage.
 */
function writeEntries(entries, tenantIdOverride) {
  if (!canUseLocalStorage()) return;
  const tenantId = tenantIdOverride || getTenantId();
  try {
    window.localStorage.setItem(
      buildKey(tenantId),
      JSON.stringify(entries)
    );
  } catch (e) {
    debug('[securityAuditLog] Failed to write:', e);
  }
}

/**
 * Log a new security audit event. Returns the new entry object.
 *
 * @param {{
 *   event_type: string,
 *   actor?: string,
 *   details?: string,
 *   severity?: 'info' | 'warning' | 'critical'
 * }} data
 * @param {string} [tenantIdOverride]
 * @returns {object} The created audit entry
 */
export function logSecurityEvent(data, tenantIdOverride) {
  const entries = readEntries(tenantIdOverride);

  const event_type = VALID_EVENT_TYPES.includes(data.event_type)
    ? data.event_type
    : 'config_change';

  const severity = VALID_SEVERITIES.includes(data.severity)
    ? data.severity
    : 'info';

  const entry = {
    id: generateId('sec'),
    event_type,
    actor: data.actor || 'system',
    details: data.details || '',
    severity,
    timestamp: Date.now(),
  };

  // Prepend (newest first), enforce max limit (FIFO)
  const updated = [entry, ...entries].slice(0, MAX_ENTRIES);
  writeEntries(updated, tenantIdOverride);
  debug('[securityAuditLog] Logged:', entry.event_type, `[${severity}]`);
  return entry;
}

/**
 * Get security audit entries with optional filters.
 *
 * @param {{
 *   severity?: string,
 *   event_type?: string,
 *   dateFrom?: number,
 *   dateTo?: number,
 *   search?: string
 * }} [filters]
 * @param {string} [tenantIdOverride]
 * @returns {Array<object>}
 */
export function getSecurityEvents(filters = {}, tenantIdOverride) {
  let entries = readEntries(tenantIdOverride);

  if (filters.severity && filters.severity !== 'all') {
    entries = entries.filter((e) => e.severity === filters.severity);
  }

  if (filters.event_type && filters.event_type !== 'all') {
    entries = entries.filter((e) => e.event_type === filters.event_type);
  }

  if (filters.dateFrom) {
    entries = entries.filter((e) => e.timestamp >= filters.dateFrom);
  }

  if (filters.dateTo) {
    entries = entries.filter((e) => e.timestamp <= filters.dateTo);
  }

  if (filters.search) {
    const q = filters.search.toLowerCase();
    entries = entries.filter(
      (e) =>
        (e.details && e.details.toLowerCase().includes(q)) ||
        (e.actor && e.actor.toLowerCase().includes(q)) ||
        (e.event_type && e.event_type.toLowerCase().includes(q))
    );
  }

  return entries;
}

/**
 * Get total count of security audit entries (unfiltered).
 *
 * @param {string} [tenantIdOverride]
 * @returns {number}
 */
export function getSecurityEventCount(tenantIdOverride) {
  return readEntries(tenantIdOverride).length;
}

/**
 * Clear entries older than specified days.
 *
 * @param {number} [daysToKeep=90]
 * @param {string} [tenantIdOverride]
 * @returns {number} Number of removed entries
 */
export function clearOldSecurityEvents(daysToKeep = 90, tenantIdOverride) {
  const entries = readEntries(tenantIdOverride);
  const cutoff = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;
  const filtered = entries.filter((e) => e.timestamp >= cutoff);
  const removed = entries.length - filtered.length;
  writeEntries(filtered, tenantIdOverride);
  debug('[securityAuditLog] Cleared', removed, 'entries older than', daysToKeep, 'days');
  return removed;
}

/**
 * Clear ALL security audit entries.
 *
 * @param {string} [tenantIdOverride]
 */
export function clearAllSecurityEvents(tenantIdOverride) {
  writeEntries([], tenantIdOverride);
}

/** Exported constants for external use */
export { VALID_SEVERITIES, VALID_EVENT_TYPES };
