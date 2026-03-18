/*
  Very small localStorage-based persistence used by Admin UI.
  This keeps the front-end fully functional for demos without requiring backend.

  NOTE (2026-01): We now use this helper as the single entrypoint for tenant-scoped
  config (pricing:v3, fees:v3, ...). Make it safe in non-browser contexts.

  NOTE (2026-02): Phase 4 — Added Supabase integration via StorageAdapter.
  All read/write operations now check feature flags to determine whether
  to use localStorage, Supabase, or dual-write mode.
  The sync API is preserved for backward compatibility — Supabase writes
  happen in the background (fire-and-forget from the sync caller's POV).
*/

import { storageAdapter, getTableForNamespace } from '../lib/supabase/storageAdapter';
import { getStorageMode } from '../lib/supabase/featureFlags';
import { isSupabaseAvailable } from '../lib/supabase/client';
import { debug } from '@/lib/debug';

function canUseLocalStorage() {
  try {
    return typeof window !== 'undefined' && !!window.localStorage;
  } catch {
    return false;
  }
}

export function getTenantId() {
  // Returns null if no tenant is set — callers must handle this.
  if (!canUseLocalStorage()) return null;
  return window.localStorage.getItem('modelpricer:tenant_id') || null;
}

/**
 * Returns the current tenant ID or throws if none is set.
 * Use in code paths where a tenant MUST exist (e.g. admin write operations).
 */
export function getTenantIdOrThrow() {
  const id = getTenantId();
  if (!id) {
    throw new Error('[adminTenantStorage] No tenant ID set. User must be authenticated with a tenant.');
  }
  return id;
}

export function setTenantId(id) {
  if (!canUseLocalStorage()) return;
  if (!id || typeof id !== 'string') {
    debug('[adminTenantStorage] setTenantId called with invalid id:', id);
    return;
  }
  debug('[adminTenantStorage] setTenantId:', id.trim());
  window.localStorage.setItem('modelpricer:tenant_id', id.trim());
}

export function clearTenantId() {
  if (!canUseLocalStorage()) return;
  debug('[adminTenantStorage] clearTenantId');
  window.localStorage.removeItem('modelpricer:tenant_id');
}

function buildKey(tenantId, namespace) {
  return `modelpricer:${tenantId}:${namespace}`;
}

/**
 * Basic UUID-like format check (8-4-4-4-12 hex pattern).
 * Used to validate tenantIdOverride values before trusting them.
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidTenantIdFormat(id) {
  return typeof id === 'string' && id.length > 0 && UUID_RE.test(id);
}

/**
 * Resolves the effective tenantId for a storage operation.
 *
 * When tenantIdOverride is explicitly provided AND is a valid UUID, it is
 * trusted even if it differs from the current logged-in tenant. This is
 * necessary because widget-kalkulacka (running on the same domain as the
 * admin panel) must be able to write analytics for its own tenant without
 * being silently redirected to the admin's tenant.
 *
 * If tenantIdOverride is provided but does NOT look like a valid UUID,
 * it is rejected and the current tenant is used instead (with a warning).
 *
 * Returns null if no tenant is available at all.
 */
function resolveAndValidateTenantId(tenantIdOverride) {
  const currentTenantId = getTenantId();
  if (!tenantIdOverride) {
    return currentTenantId;
  }

  // If override is explicitly provided and is a valid UUID, trust it.
  // This supports widget analytics writes where the widget's tenantId
  // may differ from the admin's logged-in tenant on the same domain.
  if (isValidTenantIdFormat(tenantIdOverride)) {
    if (currentTenantId && tenantIdOverride !== currentTenantId) {
      debug(
        '[adminTenantStorage] tenantIdOverride differs from current tenant.',
        'Override:', tenantIdOverride,
        'Current:', currentTenantId,
        'Trusting explicit override (valid UUID).'
      );
    }
    return tenantIdOverride;
  }

  // Override is present but malformed — reject it, use current tenant.
  console.warn(
    '[adminTenantStorage] SECURITY: tenantIdOverride is not a valid UUID format.',
    'Override:', tenantIdOverride,
    'Current:', currentTenantId,
    'Falling back to current tenant ID.'
  );
  return currentTenantId || null;
}

/**
 * Read tenant-scoped JSON from localStorage (sync, backward compatible).
 * For async Supabase reads, use readTenantJsonAsync().
 */
export function readTenantJson(namespace, fallback, tenantIdOverride) {
  if (!canUseLocalStorage()) return fallback;
  const tenantId = resolveAndValidateTenantId(tenantIdOverride);
  if (!tenantId) {
    console.warn('[adminTenantStorage] readTenantJson: No tenant ID available, returning fallback for', namespace);
    return fallback;
  }
  const storageKey = buildKey(tenantId, namespace);
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('[adminTenantStorage] Failed to read/parse', storageKey, e);
    return fallback;
  }
}

/**
 * Write tenant-scoped JSON to localStorage (sync, backward compatible).
 * If Supabase is enabled for this namespace (dual-write or supabase mode),
 * the write is also sent to Supabase asynchronously (fire-and-forget).
 */
export function writeTenantJson(namespace, value, tenantIdOverride) {
  if (!canUseLocalStorage()) return;
  const tenantId = resolveAndValidateTenantId(tenantIdOverride);
  if (!tenantId) {
    console.warn('[adminTenantStorage] writeTenantJson: No tenant ID available, skipping write for', namespace);
    return;
  }
  const storageKey = buildKey(tenantId, namespace);

  // Always write to localStorage for sync compat
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(value));
  } catch (e) {
    console.warn('[adminTenantStorage] Failed to write', storageKey, e);
  }

  // Fire-and-forget Supabase write (if enabled for this namespace)
  const mode = getStorageMode(namespace);
  if ((mode === 'supabase' || mode === 'dual-write') && isSupabaseAvailable()) {
    storageAdapter.write(namespace, tenantId, storageKey, value).catch((err) => {
      debug('[adminTenantStorage] Supabase write failed:', err.message);
    });
  }
}

/**
 * Append to a tenant-scoped log array (sync localStorage + async Supabase).
 */
export function appendTenantLog(namespace, entry, maxItems = 100) {
  const tenantId = getTenantId();
  if (!tenantId) {
    console.warn('[adminTenantStorage] appendTenantLog: No tenant ID available, skipping append for', namespace);
    return [];
  }
  const storageKey = buildKey(tenantId, namespace);

  // Sync localStorage append
  const list = readTenantJson(namespace, []);
  const next = [entry, ...list].slice(0, maxItems);
  if (canUseLocalStorage()) {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
    } catch (e) {
      console.warn('[adminTenantStorage] Failed to append', storageKey, e);
    }
  }

  // Fire-and-forget Supabase insert only (skip storageAdapter.appendLog
  // to avoid duplicate localStorage write — we already handled LS above)
  const mode = getStorageMode(namespace);
  if ((mode === 'supabase' || mode === 'dual-write') && isSupabaseAvailable()) {
    const table = getTableForNamespace(namespace);
    if (table) {
      storageAdapter.supabase.insert(table, {
        tenant_id: tenantId,
        ...entry,
        created_at: entry.created_at || entry.timestamp || new Date().toISOString(),
      }).catch((err) => {
        console.warn('[adminTenantStorage] Supabase append failed:', err.message);
      });
    }
  }

  return next;
}

/**
 * Delete a single tenant-scoped key from localStorage.
 * Also fires a Supabase delete if enabled for the namespace.
 */
export function deleteTenantJson(namespace, tenantIdOverride) {
  if (!canUseLocalStorage()) return;
  const tenantId = resolveAndValidateTenantId(tenantIdOverride);
  if (!tenantId) {
    console.warn('[adminTenantStorage] deleteTenantJson: No tenant ID available, skipping delete for', namespace);
    return;
  }
  const storageKey = buildKey(tenantId, namespace);
  try {
    window.localStorage.removeItem(storageKey);
  } catch (e) {
    console.warn('[adminTenantStorage] Failed to delete', storageKey, e);
  }
}

/**
 * Remove ALL tenant-scoped keys from localStorage (factory reset).
 * Iterates all localStorage keys matching `modelpricer:${tenantId}:*`.
 *
 * Also removes legacy-format keys used by adminBrandingWidgetStorage.js and
 * adminEcommerceStorage.js before the colon-separated namespace convention.
 * Legacy pattern: `modelpricer_<namespace>__${tenantId}`
 * Examples: modelpricer_branding__<id>, modelpricer_widgets__<id>,
 *           modelpricer_plan_features__<id>, modelpricer_ecommerce__<id>
 */
export function clearAllTenantData(tenantIdOverride) {
  if (!canUseLocalStorage()) return;
  const tenantId = resolveAndValidateTenantId(tenantIdOverride);
  if (!tenantId) {
    console.warn('[adminTenantStorage] clearAllTenantData: No tenant ID available, skipping.');
    return;
  }
  const modernPrefix = `modelpricer:${tenantId}:`;
  const legacySuffix = `__${tenantId}`;
  try {
    const keys = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (!k) continue;
      // Modern keys: modelpricer:<tenantId>:*
      if (k.startsWith(modernPrefix)) {
        keys.push(k);
        continue;
      }
      // Legacy keys: modelpricer_*__<tenantId>
      if (k.startsWith('modelpricer_') && k.endsWith(legacySuffix)) {
        keys.push(k);
      }
    }
    keys.forEach((k) => window.localStorage.removeItem(k));
  } catch (e) {
    console.warn('[adminTenantStorage] clearAllTenantData failed:', e);
  }
}

// ─── Async API (for new code / Step 1+ migrations) ──────────────

/**
 * Async read — checks feature flags and reads from the appropriate source.
 * In dual-write mode: reads from Supabase, falls back to localStorage.
 * In localStorage mode: reads from localStorage (same as sync version).
 */
export async function readTenantJsonAsync(namespace, fallback, tenantIdOverride) {
  const tenantId = resolveAndValidateTenantId(tenantIdOverride);
  if (!tenantId) {
    console.warn('[adminTenantStorage] readTenantJsonAsync: No tenant ID available, returning fallback for', namespace);
    return fallback;
  }
  const storageKey = buildKey(tenantId, namespace);
  return storageAdapter.read(namespace, tenantId, storageKey, fallback);
}

/**
 * Async write — writes to the appropriate backend(s) based on feature flags.
 */
export async function writeTenantJsonAsync(namespace, value, tenantIdOverride) {
  const tenantId = resolveAndValidateTenantId(tenantIdOverride);
  if (!tenantId) {
    console.warn('[adminTenantStorage] writeTenantJsonAsync: No tenant ID available, skipping write for', namespace);
    return;
  }
  const storageKey = buildKey(tenantId, namespace);
  return storageAdapter.write(namespace, tenantId, storageKey, value);
}

/**
 * Async append — appends log entry to appropriate backend(s).
 */
export async function appendTenantLogAsync(namespace, entry, maxItems = 100, tenantIdOverride) {
  const tenantId = resolveAndValidateTenantId(tenantIdOverride);
  if (!tenantId) {
    console.warn('[adminTenantStorage] appendTenantLogAsync: No tenant ID available, skipping append for', namespace);
    return [];
  }
  const storageKey = buildKey(tenantId, namespace);
  return storageAdapter.appendLog(namespace, tenantId, storageKey, entry, maxItems);
}
