/*
  StorageAdapter — abstraction layer between storage helpers and the actual backend.

  Delegates to localStorage or Supabase based on feature flags.
  This is the ONLY module that should interact with both systems directly.

  Usage pattern in storage helpers:
    Instead of: readTenantJson(namespace, fallback)
    Use:        storageAdapter.read(namespace, fallback)

  The adapter handles:
  - Feature flag checking (localStorage vs supabase vs dual-write)
  - Supabase table name mapping (namespace → table)
  - Dual-write orchestration
  - Error handling with localStorage fallback
*/

import { supabase, isSupabaseAvailable } from './client';
import { getStorageMode, isSupabaseEnabled, isLocalStorageEnabled } from './featureFlags';

// ─── Namespace → Supabase table mapping ────────────────────────────
const NAMESPACE_TABLE_MAP = {
  'pricing:v3': 'pricing_configs',
  'fees:v3': 'fees',
  'orders:v1': 'orders',
  'orders:activity:v1': 'order_activity',
  'shipping:v1': 'shipping_methods',
  'coupons:v1': 'coupons',
  'express:v1': 'express_tiers',
  'form:v1': 'form_configs',
  'email:v1': 'email_templates',
  'kanban:v1': 'kanban_configs',
  'dashboard:v1': 'dashboard_configs',
  'dashboard:v2': 'dashboard_configs',
  'audit_log': 'audit_log',
  'analytics:events': 'analytics_events',
  'team_users': 'team_members',
  'team_invites': 'team_members',
  'branding': 'branding',
  'widgets': 'widget_configs',
  'plan_features': 'tenants',
  'widget_theme': 'widget_configs',
};

/**
 * Get the Supabase table name for a namespace.
 */
export function getTableForNamespace(namespace) {
  return NAMESPACE_TABLE_MAP[namespace] || null;
}

// ─── localStorage helpers (direct, no tenant wrapper) ──────────────
function canUseLocalStorage() {
  try {
    return typeof window !== 'undefined' && !!window.localStorage;
  } catch {
    return false;
  }
}

function lsRead(key, fallback) {
  if (!canUseLocalStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function lsWrite(key, value) {
  if (!canUseLocalStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('[storageAdapter] localStorage write failed:', e);
  }
}

// Sentinel value to distinguish "no row found" from "data is null"
const NOT_FOUND = Symbol('NOT_FOUND');

// ─── Supabase query helpers ────────────────────────────────────────

/**
 * Read a single config record from Supabase (for namespace-based configs).
 * Returns the data column value, NOT_FOUND if no row exists, or fallback on error.
 */
async function supabaseReadConfig(table, tenantId, namespace, fallback) {
  if (!supabase) return fallback;
  try {
    const { data, error } = await supabase
      .from(table)
      .select('data')
      .eq('tenant_id', tenantId)
      .eq('namespace', namespace)
      .maybeSingle();

    if (error) {
      console.warn(`[storageAdapter] Supabase read error (${table}):`, error.message);
      return fallback;
    }
    // Row exists → return data (even if null). No row → NOT_FOUND.
    if (data === null) return NOT_FOUND;
    return data.data;
  } catch (err) {
    console.warn(`[storageAdapter] Supabase read exception (${table}):`, err.message);
    return fallback;
  }
}

/**
 * Write a config record to Supabase (upsert by tenant_id + namespace).
 */
async function supabaseWriteConfig(table, tenantId, namespace, value) {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from(table)
      .upsert(
        {
          tenant_id: tenantId,
          namespace,
          data: value,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'tenant_id,namespace' }
      );

    if (error) {
      console.warn(`[storageAdapter] Supabase write error (${table}):`, error.message);
    }
  } catch (err) {
    console.warn(`[storageAdapter] Supabase write exception (${table}):`, err.message);
  }
}

/**
 * Read a list of records from Supabase (for array-based data like orders, audit_log).
 */
async function supabaseReadList(table, tenantId, options = {}) {
  if (!supabase) return null;
  try {
    let query = supabase
      .from(table)
      .select(options.select || '*')
      .eq('tenant_id', tenantId);

    if (options.orderBy) {
      query = query.order(options.orderBy, { ascending: options.ascending ?? false });
    }
    if (options.offset != null) {
      // Use range() for pagination (handles both offset and limit)
      const limit = options.limit || 50;
      query = query.range(options.offset, options.offset + limit - 1);
    } else if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) {
      console.warn(`[storageAdapter] Supabase list error (${table}):`, error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn(`[storageAdapter] Supabase list exception (${table}):`, err.message);
    return null;
  }
}

/**
 * Insert a single record into Supabase.
 */
async function supabaseInsert(table, record) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from(table)
      .insert(record)
      .select()
      .single();

    if (error) {
      console.warn(`[storageAdapter] Supabase insert error (${table}):`, error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn(`[storageAdapter] Supabase insert exception (${table}):`, err.message);
    return null;
  }
}

/**
 * Update a record in Supabase.
 */
async function supabaseUpdate(table, id, updates) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from(table)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.warn(`[storageAdapter] Supabase update error (${table}):`, error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn(`[storageAdapter] Supabase update exception (${table}):`, err.message);
    return null;
  }
}

/**
 * Delete a record from Supabase.
 */
async function supabaseDelete(table, id) {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);

    if (error) {
      console.warn(`[storageAdapter] Supabase delete error (${table}):`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`[storageAdapter] Supabase delete exception (${table}):`, err.message);
    return false;
  }
}

// ─── Public StorageAdapter API ─────────────────────────────────────

export const storageAdapter = {
  /**
   * Read tenant-scoped JSON config (for namespace-based data).
   * Respects feature flags: localStorage / supabase / dual-write.
   *
   * In dual-write mode: reads from Supabase, falls back to localStorage.
   */
  async read(namespace, tenantId, lsKey, fallback) {
    const mode = getStorageMode(namespace);
    const table = getTableForNamespace(namespace);

    if (mode === 'localStorage' || !isSupabaseAvailable() || !table) {
      return lsRead(lsKey, fallback);
    }

    // supabase or dual-write → read from Supabase
    const result = await supabaseReadConfig(table, tenantId, namespace, NOT_FOUND);
    if (result !== NOT_FOUND) return result;

    // Fallback to localStorage if Supabase had no row
    if (mode === 'dual-write') {
      return lsRead(lsKey, fallback);
    }

    return fallback;
  },

  /**
   * Write tenant-scoped JSON config.
   * Respects feature flags for dual-write.
   */
  async write(namespace, tenantId, lsKey, value) {
    const mode = getStorageMode(namespace);
    const table = getTableForNamespace(namespace);

    // Always write to localStorage in localStorage or dual-write mode
    if (isLocalStorageEnabled(namespace)) {
      lsWrite(lsKey, value);
    }

    // Write to Supabase in supabase or dual-write mode
    if (isSupabaseEnabled(namespace) && isSupabaseAvailable() && table) {
      await supabaseWriteConfig(table, tenantId, namespace, value);
    }
  },

  /**
   * Read a list of records (for orders, audit_log, etc.).
   */
  async readList(namespace, tenantId, lsKey, lsFallback, supabaseOptions = {}) {
    const mode = getStorageMode(namespace);
    const table = getTableForNamespace(namespace);

    if (mode === 'localStorage' || !isSupabaseAvailable() || !table) {
      return lsRead(lsKey, lsFallback);
    }

    const result = await supabaseReadList(table, tenantId, supabaseOptions);
    if (result !== null) return result;

    if (mode === 'dual-write') {
      return lsRead(lsKey, lsFallback);
    }

    return lsFallback;
  },

  /**
   * Append to a log/array (for audit_log, analytics).
   * In Supabase mode: inserts a new row. In localStorage mode: prepends to array.
   */
  async appendLog(namespace, tenantId, lsKey, entry, maxItems = 100) {
    const mode = getStorageMode(namespace);
    const table = getTableForNamespace(namespace);

    // localStorage append
    if (isLocalStorageEnabled(namespace)) {
      const list = lsRead(lsKey, []);
      const next = [entry, ...list].slice(0, maxItems);
      lsWrite(lsKey, next);
    }

    // Supabase insert
    if (isSupabaseEnabled(namespace) && isSupabaseAvailable() && table) {
      await supabaseInsert(table, {
        tenant_id: tenantId,
        ...entry,
        created_at: entry.created_at || entry.timestamp || new Date().toISOString(),
      });
    }
  },

  // Direct Supabase operations (for when you need full control)
  supabase: {
    readConfig: supabaseReadConfig,
    writeConfig: supabaseWriteConfig,
    readList: supabaseReadList,
    insert: supabaseInsert,
    update: supabaseUpdate,
    delete: supabaseDelete,
  },
};

export default storageAdapter;
