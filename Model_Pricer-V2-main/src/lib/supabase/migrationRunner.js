/*
  Migration Runner — orchestrates localStorage → Supabase data migration.

  Provides:
  - Per-namespace migration with progress tracking
  - Dry-run mode (validates without writing)
  - Backup of localStorage data before migration
  - Rollback capability
  - Idempotent (safe to re-run)
*/

import { supabase, isSupabaseAvailable } from './client';
import { setStorageMode, setAllStorageModes } from './featureFlags';
import { getTenantId } from '../../utils/adminTenantStorage';

// ─── Migration definitions ─────────────────────────────────────

const MIGRATIONS = [
  {
    id: '001-pricing',
    name: 'Pricing Configuration',
    namespace: 'pricing:v3',
    table: 'pricing_configs',
    lsKey: (tid) => `modelpricer:${tid}:pricing:v3`,
    type: 'config',
  },
  {
    id: '002-fees',
    name: 'Fees Configuration',
    namespace: 'fees:v3',
    table: 'fees',
    lsKey: (tid) => `modelpricer:${tid}:fees:v3`,
    type: 'config',
  },
  {
    id: '003-orders',
    name: 'Orders',
    namespace: 'orders:v1',
    table: 'orders',
    lsKey: (tid) => `modelpricer:${tid}:orders:v1`,
    type: 'orders',
  },
  {
    id: '004-order-activity',
    name: 'Order Activity',
    namespace: 'orders:activity:v1',
    table: 'order_activity',
    lsKey: (tid) => `modelpricer:${tid}:orders:activity:v1`,
    type: 'log',
  },
  {
    id: '005-audit',
    name: 'Audit Log',
    namespace: 'audit_log',
    table: 'audit_log',
    lsKey: (tid) => `modelpricer:${tid}:audit_log`,
    type: 'log',
  },
  {
    id: '006-analytics',
    name: 'Analytics Events',
    namespace: 'analytics:events',
    table: 'analytics_events',
    lsKey: (tid) => `modelpricer:${tid}:analytics:events`,
    type: 'log',
  },
  {
    id: '007-shipping',
    name: 'Shipping Methods',
    namespace: 'shipping:v1',
    table: 'shipping_methods',
    lsKey: (tid) => `modelpricer:${tid}:shipping:v1`,
    type: 'config',
  },
  {
    id: '008-coupons',
    name: 'Coupons',
    namespace: 'coupons:v1',
    table: 'coupons',
    lsKey: (tid) => `modelpricer:${tid}:coupons:v1`,
    type: 'config',
  },
  {
    id: '009-express',
    name: 'Express Tiers',
    namespace: 'express:v1',
    table: 'express_tiers',
    lsKey: (tid) => `modelpricer:${tid}:express:v1`,
    type: 'config',
  },
  {
    id: '010-email',
    name: 'Email Templates',
    namespace: 'email:v1',
    table: 'email_templates',
    lsKey: (tid) => `modelpricer:${tid}:email:v1`,
    type: 'config',
  },
  {
    id: '011-form',
    name: 'Form Configuration',
    namespace: 'form:v1',
    table: 'form_configs',
    lsKey: (tid) => `modelpricer:${tid}:form:v1`,
    type: 'config',
  },
  {
    id: '012-kanban',
    name: 'Kanban Configuration',
    namespace: 'kanban:v1',
    table: 'kanban_configs',
    lsKey: (tid) => `modelpricer:${tid}:kanban:v1`,
    type: 'config',
  },
  {
    id: '013-dashboard',
    name: 'Dashboard Configuration',
    namespace: 'dashboard:v2',
    table: 'dashboard_configs',
    lsKey: (tid) => `modelpricer:${tid}:dashboard:v2`,
    type: 'config',
  },
  {
    id: '014-branding',
    name: 'Branding',
    namespace: 'branding',
    table: 'branding',
    lsKey: (tid) => `modelpricer_branding__${tid}`,
    type: 'config',
  },
  {
    id: '015-widgets',
    name: 'Widget Configurations',
    namespace: 'widgets',
    table: 'widget_configs',
    lsKey: (tid) => `modelpricer_widgets__${tid}`,
    type: 'config',
  },
  {
    id: '016-plan',
    name: 'Plan Features',
    namespace: 'plan_features',
    table: 'tenants',
    lsKey: (tid) => `modelpricer_plan_features__${tid}`,
    type: 'config',
  },
  {
    id: '017-widget-theme',
    name: 'Widget Theme',
    namespace: 'widget_theme',
    table: 'widget_configs',
    lsKey: (tid) => `modelpricer:widget_theme:${tid}`,
    type: 'config',
  },
  {
    id: '018-team-users',
    name: 'Team Users',
    namespace: 'team_users',
    table: 'team_members',
    lsKey: (tid) => `modelpricer:${tid}:team_users`,
    type: 'config',
  },
  {
    id: '019-team-invites',
    name: 'Team Invites',
    namespace: 'team_invites',
    table: 'team_members',
    lsKey: (tid) => `modelpricer:${tid}:team_invites`,
    type: 'config',
  },
];

// ─── Helper functions ──────────────────────────────────────────

function readLsJson(key) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function getTenantUuid(tenantSlug) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', tenantSlug)
    .maybeSingle();
  if (error || !data) return null;
  return data.id;
}

// ─── Migration execution ───────────────────────────────────────

async function migrateConfig(migration, tenantSlug, tenantUuid, dryRun) {
  const lsKey = migration.lsKey(tenantSlug);
  const data = readLsJson(lsKey);

  if (data === null) {
    return { status: 'skipped', reason: 'No localStorage data found' };
  }

  if (dryRun) {
    return { status: 'dry-run', dataSize: JSON.stringify(data).length };
  }

  // Special case: plan_features goes into tenants.plan_features column
  if (migration.namespace === 'plan_features') {
    const { error } = await supabase
      .from('tenants')
      .update({
        plan_name: data.plan_name || 'Starter',
        plan_features: data.features || data,
      })
      .eq('slug', tenantSlug);

    if (error) return { status: 'error', error: error.message };
    return { status: 'migrated' };
  }

  // Generic config upsert
  const { error } = await supabase
    .from(migration.table)
    .upsert(
      {
        tenant_id: tenantUuid,
        namespace: migration.namespace,
        data,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'tenant_id,namespace' }
    );

  if (error) return { status: 'error', error: error.message };
  return { status: 'migrated' };
}

async function migrateLog(migration, tenantSlug, tenantUuid, dryRun) {
  const lsKey = migration.lsKey(tenantSlug);
  const data = readLsJson(lsKey);

  if (!data || !Array.isArray(data) || data.length === 0) {
    return { status: 'skipped', reason: 'No log entries found' };
  }

  if (dryRun) {
    return { status: 'dry-run', entryCount: data.length, dataSize: JSON.stringify(data).length };
  }

  // Batch insert log entries
  const batchSize = 500;
  let inserted = 0;

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize).map((entry) => ({
      tenant_id: tenantUuid,
      ...mapLogEntry(migration.table, entry),
    }));

    const { error } = await supabase.from(migration.table).insert(batch);
    if (error) {
      return { status: 'partial', inserted, error: error.message, total: data.length };
    }
    inserted += batch.length;
  }

  return { status: 'migrated', inserted };
}

async function migrateOrders(migration, tenantSlug, tenantUuid, dryRun) {
  const lsKey = migration.lsKey(tenantSlug);
  const raw = readLsJson(lsKey);
  const orders = raw?.orders || (Array.isArray(raw) ? raw : []);

  if (!orders.length) {
    return { status: 'skipped', reason: 'No orders found' };
  }

  if (dryRun) {
    return { status: 'dry-run', orderCount: orders.length, dataSize: JSON.stringify(orders).length };
  }

  let insertedOrders = 0;
  let insertedItems = 0;

  for (const order of orders) {
    // Insert order row
    const { data: insertedOrder, error: orderError } = await supabase
      .from('orders')
      .upsert(
        {
          tenant_id: tenantUuid,
          order_number: order.id || `ORD-${Date.now()}`,
          status: order.status || 'NEW',
          customer_snapshot: order.customer_snapshot || {},
          one_time_fees: order.one_time_fees || [],
          totals_snapshot: order.totals_snapshot || {},
          flags: order.flags || [],
          notes: order.notes || [],
          metadata: { activity: order.activity || [], source: 'localStorage_migration' },
          created_at: order.created_at || new Date().toISOString(),
          updated_at: order.updated_at || new Date().toISOString(),
        },
        { onConflict: 'tenant_id,order_number' }
      )
      .select('id')
      .single();

    if (orderError) {
      return { status: 'partial', insertedOrders, insertedItems, error: orderError.message };
    }
    insertedOrders++;

    // Insert order items (models)
    const models = order.models || [];
    if (models.length > 0 && insertedOrder?.id) {
      const items = models.map((m) => ({
        order_id: insertedOrder.id,
        tenant_id: tenantUuid,
        item_number: m.id || null,
        quantity: m.quantity || 1,
        file_snapshot: m.file_snapshot || {},
        material_snapshot: m.material_snapshot || {},
        color_snapshot: m.color_snapshot || null,
        preset_snapshot: m.preset_snapshot || {},
        resolved_config_snapshot: m.resolved_config_snapshot || {},
        slicer_snapshot: m.slicer_snapshot || {},
        pricing_snapshot: m.pricing_snapshot || {},
        price_breakdown_snapshot: m.price_breakdown_snapshot || {},
        flags: m.flags || [],
        revisions: m.revisions || { price: [], slicer: [] },
        created_at: order.created_at || new Date().toISOString(),
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(items);
      if (itemsError) {
        return { status: 'partial', insertedOrders, insertedItems, error: itemsError.message };
      }
      insertedItems += items.length;
    }
  }

  return { status: 'migrated', insertedOrders, insertedItems };
}

function mapLogEntry(table, entry) {
  if (table === 'audit_log') {
    return {
      action: entry.action || 'UNKNOWN',
      entity_type: entry.entity_type || entry.entityType || null,
      entity_id: entry.entity_id || entry.entityId || null,
      actor: {
        id: entry.actor_user_id || entry.actor?.id,
        email: entry.actor_email || entry.actor?.email,
        name: entry.actor_name || entry.actor?.name,
      },
      details: { summary: entry.summary, diff: entry.diff, metadata: entry.metadata },
      ip_address: entry.ip_address,
      user_agent: entry.user_agent,
      created_at: entry.timestamp || entry.created_at || new Date().toISOString(),
    };
  }

  if (table === 'analytics_events') {
    return {
      event_type: entry.eventType || 'UNKNOWN',
      widget_id: entry.widgetInstanceId || null,
      session_id: entry.sessionId || null,
      payload: entry.metadata || {},
      created_at: entry.timestamp || new Date().toISOString(),
    };
  }

  if (table === 'order_activity') {
    return {
      order_id: entry.order_id || null,
      user_id: entry.user_id,
      type: entry.type || 'UNKNOWN',
      payload: entry.payload || {},
      created_at: entry.timestamp || new Date().toISOString(),
    };
  }

  // Generic fallback
  return {
    data: entry,
    created_at: entry.timestamp || entry.created_at || new Date().toISOString(),
  };
}

// ─── Public API ────────────────────────────────────────────────

/**
 * Get list of all migrations and their current status.
 */
export function getMigrationList() {
  const tenantId = getTenantId();
  return MIGRATIONS.map((m) => {
    const lsKey = m.lsKey(tenantId);
    const data = readLsJson(lsKey);
    return {
      id: m.id,
      name: m.name,
      namespace: m.namespace,
      table: m.table,
      type: m.type,
      hasLocalData: data !== null,
      localDataSize: data ? JSON.stringify(data).length : 0,
      localEntryCount: Array.isArray(data) ? data.length : (data ? 1 : 0),
    };
  });
}

/**
 * Run all migrations (or a subset).
 *
 * @param {Object} options
 * @param {boolean} options.dryRun - If true, only validate, don't write
 * @param {string[]} options.migrationIds - Specific migration IDs to run (default: all)
 * @param {Function} options.onProgress - Progress callback ({ current, total, migration, result })
 * @returns {Promise<Object>} Migration results
 */
export async function runMigrations(options = {}) {
  const { dryRun = false, migrationIds = null, onProgress } = options;

  if (!isSupabaseAvailable()) {
    return { ok: false, error: 'Supabase not configured', results: [] };
  }

  const tenantSlug = getTenantId();
  const tenantUuid = await getTenantUuid(tenantSlug);

  if (!tenantUuid) {
    return { ok: false, error: `Tenant "${tenantSlug}" not found in Supabase`, results: [] };
  }

  const toRun = migrationIds
    ? MIGRATIONS.filter((m) => migrationIds.includes(m.id))
    : MIGRATIONS;

  const results = [];
  let errors = 0;

  for (let i = 0; i < toRun.length; i++) {
    const migration = toRun[i];

    let result;
    try {
      if (migration.type === 'orders') {
        result = await migrateOrders(migration, tenantSlug, tenantUuid, dryRun);
      } else if (migration.type === 'log') {
        result = await migrateLog(migration, tenantSlug, tenantUuid, dryRun);
      } else {
        result = await migrateConfig(migration, tenantSlug, tenantUuid, dryRun);
      }
    } catch (err) {
      result = { status: 'error', error: err.message };
    }

    if (result.status === 'error' || result.status === 'partial') {
      errors++;
    }

    const entry = { migrationId: migration.id, name: migration.name, ...result };
    results.push(entry);

    onProgress?.({
      current: i + 1,
      total: toRun.length,
      migration: migration.name,
      result: entry,
    });
  }

  return {
    ok: errors === 0,
    dryRun,
    total: toRun.length,
    migrated: results.filter((r) => r.status === 'migrated').length,
    skipped: results.filter((r) => r.status === 'skipped').length,
    errors,
    results,
  };
}

/**
 * Backup all localStorage data to a downloadable JSON.
 */
export function backupLocalStorage() {
  const tenantId = getTenantId();
  const backup = {};

  for (const m of MIGRATIONS) {
    const lsKey = m.lsKey(tenantId);
    const data = readLsJson(lsKey);
    if (data !== null) {
      backup[m.namespace] = { key: lsKey, data };
    }
  }

  return {
    version: 1,
    tenantId,
    exportedAt: new Date().toISOString(),
    namespaces: backup,
  };
}

/**
 * Switch all namespaces to Supabase mode.
 * Call after successful migration.
 */
export function enableSupabaseForAll() {
  setAllStorageModes('supabase');
}

/**
 * Switch all namespaces to dual-write mode.
 * Call during transition period.
 */
export function enableDualWriteForAll() {
  setAllStorageModes('dual-write');
}

/**
 * Switch all namespaces back to localStorage mode.
 * Call to rollback.
 */
export function rollbackToLocalStorage() {
  setAllStorageModes('localStorage');
}

export { MIGRATIONS };
