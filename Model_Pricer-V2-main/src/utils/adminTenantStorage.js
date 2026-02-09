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

function canUseLocalStorage() {
  try {
    return typeof window !== 'undefined' && !!window.localStorage;
  } catch {
    return false;
  }
}

export function getTenantId() {
  // Keep it simple for now. Later this should come from auth/tenant context.
  if (!canUseLocalStorage()) return 'demo-tenant';
  return window.localStorage.getItem('modelpricer:tenant_id') || 'demo-tenant';
}

function buildKey(tenantId, namespace) {
  return `modelpricer:${tenantId}:${namespace}`;
}

/**
 * Read tenant-scoped JSON from localStorage (sync, backward compatible).
 * For async Supabase reads, use readTenantJsonAsync().
 */
export function readTenantJson(namespace, fallback) {
  if (!canUseLocalStorage()) return fallback;
  const tenantId = getTenantId();
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
export function writeTenantJson(namespace, value) {
  if (!canUseLocalStorage()) return;
  const tenantId = getTenantId();
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
      console.warn('[adminTenantStorage] Supabase write failed:', err.message);
    });
  }
}

/**
 * Append to a tenant-scoped log array (sync localStorage + async Supabase).
 */
export function appendTenantLog(namespace, entry, maxItems = 100) {
  const tenantId = getTenantId();
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

// ─── Async API (for new code / Step 1+ migrations) ──────────────

/**
 * Async read — checks feature flags and reads from the appropriate source.
 * In dual-write mode: reads from Supabase, falls back to localStorage.
 * In localStorage mode: reads from localStorage (same as sync version).
 */
export async function readTenantJsonAsync(namespace, fallback) {
  const tenantId = getTenantId();
  const storageKey = buildKey(tenantId, namespace);
  return storageAdapter.read(namespace, tenantId, storageKey, fallback);
}

/**
 * Async write — writes to the appropriate backend(s) based on feature flags.
 */
export async function writeTenantJsonAsync(namespace, value) {
  const tenantId = getTenantId();
  const storageKey = buildKey(tenantId, namespace);
  return storageAdapter.write(namespace, tenantId, storageKey, value);
}

/**
 * Async append — appends log entry to appropriate backend(s).
 */
export async function appendTenantLogAsync(namespace, entry, maxItems = 100) {
  const tenantId = getTenantId();
  const storageKey = buildKey(tenantId, namespace);
  return storageAdapter.appendLog(namespace, tenantId, storageKey, entry, maxItems);
}
