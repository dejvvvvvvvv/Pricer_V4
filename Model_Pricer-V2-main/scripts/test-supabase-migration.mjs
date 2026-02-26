#!/usr/bin/env node
/**
 * Supabase Migration CRUD Validation Script
 *
 * Tests that the StorageAdapter's Supabase operations will work
 * when we enable dual-write mode. Validates INSERT, SELECT, UPDATE,
 * DELETE on representative tables used by migrationRunner.js.
 *
 * Usage:
 *   cd Model_Pricer-V2-main && node scripts/test-supabase-migration.mjs
 *
 * Environment variables (from .env.local):
 *   VITE_SUPABASE_URL          - project URL
 *   SUPABASE_SERVICE_ROLE_KEY  - service_role key (bypasses RLS)
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// .env.local loader (same as deploy script - no external deps)
// ---------------------------------------------------------------------------
function loadEnv() {
  const candidates = [
    resolve(ROOT, '.env.local'),
    resolve(ROOT, '.env'),
  ];

  for (const envPath of candidates) {
    if (!existsSync(envPath)) continue;

    const content = readFileSync(envPath, 'utf-8');
    const vars = {};
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      let value = trimmed.slice(eqIndex + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      vars[key] = value;
    }
    return { vars, path: envPath };
  }

  console.error('ERROR: No .env.local or .env file found in', ROOT);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Test result tracking
// ---------------------------------------------------------------------------
let passed = 0;
let failed = 0;
const results = [];

function ok(testName, detail = '') {
  passed++;
  const msg = `  [PASS] ${testName}${detail ? ' — ' + detail : ''}`;
  console.log(msg);
  results.push({ name: testName, status: 'pass', detail });
}

function fail(testName, error) {
  failed++;
  const msg = `  [FAIL] ${testName} — ${error}`;
  console.log(msg);
  results.push({ name: testName, status: 'fail', error });
}

// ---------------------------------------------------------------------------
// CRUD Test: Config table (namespace-based, like StorageAdapter.writeConfig)
// Tests: pricing_configs, fees, shipping_methods, coupons, etc.
// ---------------------------------------------------------------------------
async function testConfigCRUD(supabase, tenantId, table, namespace) {
  const testLabel = `${table} (${namespace})`;
  const testData = {
    _test: true,
    _script: 'test-supabase-migration.mjs',
    _timestamp: new Date().toISOString(),
    sampleKey: 'sampleValue',
    nested: { a: 1, b: [2, 3] },
  };

  // INSERT (upsert)
  try {
    const { data, error } = await supabase
      .from(table)
      .upsert(
        {
          tenant_id: tenantId,
          namespace: namespace,
          data: testData,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'tenant_id,namespace' }
      )
      .select()
      .single();

    if (error) throw new Error(error.message);
    ok(`INSERT ${testLabel}`, `id=${data.id}`);
  } catch (err) {
    fail(`INSERT ${testLabel}`, err.message);
    return; // Skip remaining tests for this table
  }

  // READ
  try {
    const { data, error } = await supabase
      .from(table)
      .select('id, data, namespace')
      .eq('tenant_id', tenantId)
      .eq('namespace', namespace)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('No row returned');
    if (data.data._test !== true) throw new Error('Data mismatch: _test flag not found');
    if (data.data.sampleKey !== 'sampleValue') throw new Error('Data mismatch: sampleKey');
    ok(`READ ${testLabel}`, `data._test=${data.data._test}`);
  } catch (err) {
    fail(`READ ${testLabel}`, err.message);
  }

  // UPDATE (upsert with changed data)
  try {
    const updatedData = { ...testData, sampleKey: 'updatedValue', _updated: true };
    const { data, error } = await supabase
      .from(table)
      .upsert(
        {
          tenant_id: tenantId,
          namespace: namespace,
          data: updatedData,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'tenant_id,namespace' }
      )
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (data.data.sampleKey !== 'updatedValue') throw new Error('Update not reflected');
    ok(`UPDATE ${testLabel}`, `sampleKey=${data.data.sampleKey}`);
  } catch (err) {
    fail(`UPDATE ${testLabel}`, err.message);
  }

  // DELETE
  try {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('tenant_id', tenantId)
      .eq('namespace', namespace);

    if (error) throw new Error(error.message);

    // Verify deletion
    const { data: check } = await supabase
      .from(table)
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('namespace', namespace)
      .maybeSingle();

    if (check) throw new Error('Row still exists after delete');
    ok(`DELETE ${testLabel}`, 'row removed');
  } catch (err) {
    fail(`DELETE ${testLabel}`, err.message);
  }
}

// ---------------------------------------------------------------------------
// CRUD Test: Log table (append-only, like StorageAdapter.appendLog)
// Tests: audit_log, analytics_events
// ---------------------------------------------------------------------------
async function testLogCRUD(supabase, tenantId, table) {
  const testLabel = `${table} (log)`;
  let insertedId = null;

  // INSERT
  try {
    const logEntry = table === 'audit_log'
      ? {
          tenant_id: tenantId,
          action: 'TEST_MIGRATION_SCRIPT',
          entity_type: 'test',
          entity_id: 'test-001',
          actor: { id: 'script', email: 'test@test.com', name: 'Migration Test' },
          details: { summary: 'CRUD test from migration script', _test: true },
          created_at: new Date().toISOString(),
        }
      : {
          tenant_id: tenantId,
          event_type: 'TEST_MIGRATION_SCRIPT',
          widget_id: 'test-widget',
          session_id: 'test-session',
          payload: { _test: true, source: 'migration-script' },
          created_at: new Date().toISOString(),
        };

    const { data, error } = await supabase
      .from(table)
      .insert(logEntry)
      .select('id')
      .single();

    if (error) throw new Error(error.message);
    insertedId = data.id;
    ok(`INSERT ${testLabel}`, `id=${insertedId}`);
  } catch (err) {
    fail(`INSERT ${testLabel}`, err.message);
    return;
  }

  // READ
  try {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', insertedId)
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('No row returned');
    ok(`READ ${testLabel}`, `found id=${data.id}`);
  } catch (err) {
    fail(`READ ${testLabel}`, err.message);
  }

  // READ LIST (tenant-scoped, ordered by created_at DESC — matches StorageAdapter.readList)
  try {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) throw new Error('Empty result');
    ok(`READ LIST ${testLabel}`, `returned ${data.length} rows`);
  } catch (err) {
    fail(`READ LIST ${testLabel}`, err.message);
  }

  // DELETE (cleanup)
  try {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', insertedId);

    if (error) throw new Error(error.message);
    ok(`DELETE ${testLabel}`, 'cleanup done');
  } catch (err) {
    fail(`DELETE ${testLabel}`, err.message);
  }
}

// ---------------------------------------------------------------------------
// CRUD Test: Orders (complex — order + order_items, like migrateOrders)
// ---------------------------------------------------------------------------
async function testOrdersCRUD(supabase, tenantId) {
  let orderId = null;
  let orderItemId = null;

  // INSERT order
  try {
    const { data, error } = await supabase
      .from('orders')
      .upsert(
        {
          tenant_id: tenantId,
          order_number: 'TEST-MIGRATION-001',
          status: 'NEW',
          customer_snapshot: { name: 'Test Customer', email: 'test@test.com' },
          one_time_fees: [],
          totals_snapshot: { subtotal: 100, total: 100 },
          flags: [],
          notes: [],
          metadata: { source: 'migration-test-script', _test: true },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'tenant_id,order_number' }
      )
      .select('id')
      .single();

    if (error) throw new Error(error.message);
    orderId = data.id;
    ok('INSERT orders', `id=${orderId}`);
  } catch (err) {
    fail('INSERT orders', err.message);
    return;
  }

  // INSERT order_item
  try {
    const { data, error } = await supabase
      .from('order_items')
      .insert({
        order_id: orderId,
        tenant_id: tenantId,
        item_number: 'ITEM-001',
        quantity: 2,
        file_snapshot: { name: 'test.stl', size: 1024 },
        material_snapshot: { key: 'pla', name: 'PLA' },
        pricing_snapshot: { unitPrice: 50, total: 100 },
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) throw new Error(error.message);
    orderItemId = data.id;
    ok('INSERT order_items', `id=${orderItemId}, order_id=${orderId}`);
  } catch (err) {
    fail('INSERT order_items', err.message);
  }

  // READ order with items
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Order not found');
    const itemCount = data.order_items?.length || 0;
    ok('READ orders+items', `order status=${data.status}, items=${itemCount}`);
  } catch (err) {
    fail('READ orders+items', err.message);
  }

  // UPDATE order status
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({
        status: 'PROCESSING',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select('id, status')
      .single();

    if (error) throw new Error(error.message);
    if (data.status !== 'PROCESSING') throw new Error('Status not updated');
    ok('UPDATE orders', `status=${data.status}`);
  } catch (err) {
    fail('UPDATE orders', err.message);
  }

  // DELETE order_items first (FK constraint)
  if (orderItemId) {
    try {
      const { error } = await supabase
        .from('order_items')
        .delete()
        .eq('id', orderItemId);
      if (error) throw new Error(error.message);
      ok('DELETE order_items', 'cleanup done');
    } catch (err) {
      fail('DELETE order_items', err.message);
    }
  }

  // DELETE order
  try {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);
    if (error) throw new Error(error.message);
    ok('DELETE orders', 'cleanup done');
  } catch (err) {
    fail('DELETE orders', err.message);
  }
}

// ---------------------------------------------------------------------------
// CRUD Test: Tenants table (special — plan_features migration)
// ---------------------------------------------------------------------------
async function testTenantOperations(supabase) {
  // READ demo tenant
  try {
    const { data, error } = await supabase
      .from('tenants')
      .select('id, slug, name, plan_name, plan_features')
      .eq('slug', 'demo-tenant')
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw new Error('Demo tenant not found — run seed.sql first');
    ok('READ tenants (demo)', `id=${data.id}, plan=${data.plan_name}`);
    return data;
  } catch (err) {
    fail('READ tenants (demo)', err.message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// CRUD Test: Tenants plan_features update (simulates migration 016-plan)
// ---------------------------------------------------------------------------
async function testTenantPlanUpdate(supabase, tenantSlug, originalPlanFeatures) {
  // UPDATE plan_features (what migration 016 does)
  try {
    const testFeatures = {
      ...originalPlanFeatures,
      _test: true,
      _timestamp: new Date().toISOString(),
    };

    const { error: updateErr } = await supabase
      .from('tenants')
      .update({ plan_features: testFeatures })
      .eq('slug', tenantSlug);

    if (updateErr) throw new Error(updateErr.message);

    // Verify
    const { data, error: readErr } = await supabase
      .from('tenants')
      .select('plan_features')
      .eq('slug', tenantSlug)
      .single();

    if (readErr) throw new Error(readErr.message);
    if (!data.plan_features._test) throw new Error('plan_features update not reflected');
    ok('UPDATE tenants plan_features', '_test flag set');

    // Restore original
    const { error: restoreErr } = await supabase
      .from('tenants')
      .update({ plan_features: originalPlanFeatures })
      .eq('slug', tenantSlug);

    if (restoreErr) throw new Error(restoreErr.message);
    ok('RESTORE tenants plan_features', 'original data restored');
  } catch (err) {
    fail('UPDATE tenants plan_features', err.message);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('=== Supabase Migration CRUD Validation ===');
  console.log('');

  // Load env
  const { vars: env, path: envPath } = loadEnv();
  const SUPABASE_URL = env.VITE_SUPABASE_URL;
  const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

  console.log(`Env file:       ${envPath}`);
  console.log(`Supabase URL:   ${SUPABASE_URL || '(not set)'}`);
  console.log(`Service key:    ${SERVICE_ROLE_KEY ? SERVICE_ROLE_KEY.slice(0, 20) + '...' : '(not set)'}`);
  console.log('');

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('ERROR: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
    console.error('Set them in .env.local');
    process.exit(1);
  }

  // Create client with service_role key (bypasses RLS)
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  // -----------------------------------------------------------------------
  // Test 1: Connection + Tenant lookup
  // -----------------------------------------------------------------------
  console.log('--- 1. Tenant Lookup ---');
  const tenant = await testTenantOperations(supabase);

  if (!tenant) {
    console.log('');
    console.error('Cannot proceed without demo tenant. Ensure seed.sql has been run.');
    process.exit(1);
  }

  const tenantId = tenant.id;
  console.log(`  Using tenant: id=${tenantId}, slug=${tenant.slug}`);
  console.log('');

  // -----------------------------------------------------------------------
  // Test 2: Config tables CRUD (the majority of migrations)
  // -----------------------------------------------------------------------
  console.log('--- 2. Config Table CRUD ---');
  console.log('  (Tests INSERT/READ/UPDATE/DELETE on namespace-based config tables)');
  console.log('');

  // Test a representative sample of config tables (all follow same pattern)
  const configTables = [
    { table: 'pricing_configs', namespace: 'pricing:v3' },
    { table: 'fees', namespace: 'fees:v3' },
    { table: 'shipping_methods', namespace: 'shipping:v1' },
    { table: 'coupons', namespace: 'coupons:v1' },
    { table: 'express_tiers', namespace: 'express:v1' },
    { table: 'email_templates', namespace: 'email:v1' },
    { table: 'form_configs', namespace: 'form:v1' },
    { table: 'kanban_configs', namespace: 'kanban:v1' },
    { table: 'dashboard_configs', namespace: 'dashboard:v2' },
    { table: 'branding', namespace: 'branding' },
    { table: 'widget_configs', namespace: 'widgets' },
    { table: 'widget_configs', namespace: 'widget_theme' },
    { table: 'team_members', namespace: 'team_users' },
    { table: 'team_members', namespace: 'team_invites' },
  ];

  for (const { table, namespace } of configTables) {
    await testConfigCRUD(supabase, tenantId, table, namespace);
  }
  console.log('');

  // -----------------------------------------------------------------------
  // Test 3: Log tables CRUD
  // -----------------------------------------------------------------------
  console.log('--- 3. Log Table CRUD ---');
  console.log('  (Tests INSERT/READ/READ LIST/DELETE on append-only log tables)');
  console.log('');

  await testLogCRUD(supabase, tenantId, 'audit_log');
  await testLogCRUD(supabase, tenantId, 'analytics_events');
  console.log('');

  // -----------------------------------------------------------------------
  // Test 4: Orders + Order Items CRUD
  // -----------------------------------------------------------------------
  console.log('--- 4. Orders CRUD ---');
  console.log('  (Tests INSERT/READ/UPDATE/DELETE on orders + order_items with FK)');
  console.log('');

  await testOrdersCRUD(supabase, tenantId);
  console.log('');

  // -----------------------------------------------------------------------
  // Test 5: Tenant plan_features update (migration 016)
  // -----------------------------------------------------------------------
  console.log('--- 5. Tenant Plan Features Update ---');
  console.log('  (Tests UPDATE/RESTORE on tenants.plan_features — migration 016-plan)');
  console.log('');

  await testTenantPlanUpdate(supabase, 'demo-tenant', tenant.plan_features);
  console.log('');

  // -----------------------------------------------------------------------
  // Test 6: Order Activity CRUD (migration 004)
  // -----------------------------------------------------------------------
  console.log('--- 6. Order Activity CRUD ---');
  console.log('  (Tests INSERT/READ/DELETE on order_activity log table)');
  console.log('');

  let activityId = null;
  try {
    const { data, error } = await supabase
      .from('order_activity')
      .insert({
        tenant_id: tenantId,
        order_id: null, // no FK needed for test
        user_id: 'test-script',
        type: 'TEST_MIGRATION',
        payload: { _test: true, source: 'migration-script' },
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) throw new Error(error.message);
    activityId = data.id;
    ok('INSERT order_activity', `id=${activityId}`);
  } catch (err) {
    fail('INSERT order_activity', err.message);
  }

  if (activityId) {
    try {
      const { data, error } = await supabase
        .from('order_activity')
        .select('*')
        .eq('id', activityId)
        .single();
      if (error) throw new Error(error.message);
      ok('READ order_activity', `type=${data.type}`);
    } catch (err) {
      fail('READ order_activity', err.message);
    }

    try {
      const { error } = await supabase
        .from('order_activity')
        .delete()
        .eq('id', activityId);
      if (error) throw new Error(error.message);
      ok('DELETE order_activity', 'cleanup done');
    } catch (err) {
      fail('DELETE order_activity', err.message);
    }
  }
  console.log('');

  // -----------------------------------------------------------------------
  // Summary
  // -----------------------------------------------------------------------
  console.log('='.repeat(50));
  console.log(`RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log('='.repeat(50));

  if (failed === 0) {
    console.log('');
    console.log('All Supabase CRUD operations validated successfully.');
    console.log('The StorageAdapter dual-write mode is ready to be enabled.');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Open admin UI at /admin/migration');
    console.log('  2. Click "Dry Run" to validate localStorage data');
    console.log('  3. Click "Migrate" to copy data to Supabase');
    console.log('  4. Enable dual-write mode for transition period');
    console.log('  5. After verification, switch to Supabase-only mode');
  } else {
    console.log('');
    console.log('Some tests failed. Investigate the errors above before enabling migration.');
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
main().catch(err => {
  console.error('');
  console.error('Fatal error:', err.message);
  if (err.stack) console.error(err.stack);
  process.exit(1);
});
