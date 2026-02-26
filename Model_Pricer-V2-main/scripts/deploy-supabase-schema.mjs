#!/usr/bin/env node
/**
 * Supabase Schema Deployment Script
 *
 * Checks current DB state and either:
 *   1. Verifies all 25 tables exist (--verify, default)
 *   2. Outputs combined SQL for manual paste into Supabase SQL Editor (--output-sql)
 *   3. Attempts to deploy via Supabase Management API (--deploy, requires SUPABASE_ACCESS_TOKEN)
 *
 * Usage:
 *   node scripts/deploy-supabase-schema.mjs               # verify tables
 *   node scripts/deploy-supabase-schema.mjs --verify       # same as above
 *   node scripts/deploy-supabase-schema.mjs --output-sql   # print SQL to stdout
 *   node scripts/deploy-supabase-schema.mjs --deploy       # deploy via Management API
 *   node scripts/deploy-supabase-schema.mjs --seed          # verify + seed data
 *
 * Environment variables (from .env.local):
 *   VITE_SUPABASE_URL          — project URL (e.g. https://xxx.supabase.co)
 *   SUPABASE_SERVICE_ROLE_KEY  — service_role key (bypasses RLS)
 *   SUPABASE_ACCESS_TOKEN      — (optional) Management API token for --deploy mode
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
// .env.local loader (minimal, no external deps)
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
      // Strip surrounding quotes if present
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
// Expected tables (25 tables from schema.sql)
// ---------------------------------------------------------------------------
const EXPECTED_TABLES = [
  'tenants',
  'pricing_configs',
  'materials',
  'fees',
  'customers',
  'orders',
  'order_items',
  'order_activity',
  'audit_log',
  'analytics_events',
  'coupons',
  'shipping_methods',
  'email_templates',
  'email_logs',
  'branding',
  'widget_configs',
  'dashboard_configs',
  'team_members',
  'form_configs',
  'express_tiers',
  'kanban_configs',
  'documents',
  'feature_flags',
  'api_keys',
  'chat_messages',
];

// ---------------------------------------------------------------------------
// Read SQL files
// ---------------------------------------------------------------------------
function readSQLFile(relativePath) {
  const fullPath = resolve(ROOT, relativePath);
  if (!existsSync(fullPath)) {
    console.error(`ERROR: SQL file not found: ${fullPath}`);
    process.exit(1);
  }
  return readFileSync(fullPath, 'utf-8');
}

// ---------------------------------------------------------------------------
// Check which tables exist by probing each one via Supabase client
// ---------------------------------------------------------------------------
async function checkExistingTables(supabase) {
  const results = { connected: false, tables: [], errors: [] };

  // First, test basic connectivity with a simple query
  try {
    const { data, error } = await supabase
      .from('tenants')
      .select('id', { count: 'exact', head: true });

    if (error) {
      // 42P01 = relation does not exist — connection works, table missing
      if (error.code === '42P01' || (error.message && error.message.includes('does not exist'))) {
        results.connected = true;
      } else if (error.code === 'PGRST301' || error.code === 'PGRST204') {
        // PostgREST errors indicating the table is not exposed — connection works
        results.connected = true;
      } else {
        results.errors.push(`Connection test error: ${error.message} (code: ${error.code})`);
        return results;
      }
    } else {
      results.connected = true;
    }
  } catch (err) {
    results.errors.push(`Connection failed: ${err.message}`);
    return results;
  }

  // Probe each table
  for (const table of EXPECTED_TABLES) {
    try {
      const { error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (!error) {
        results.tables.push(table);
      } else if (error.code === '42P01' || (error.message && error.message.includes('does not exist'))) {
        // Table does not exist — skip
      } else if (error.code === 'PGRST204') {
        // PostgREST: could not find the relation — treat as missing
      } else {
        // Table exists but some other error (RLS, permission) — still count it
        results.tables.push(table);
      }
    } catch {
      // Network error for this specific query — skip
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Deploy via Supabase Management API (requires SUPABASE_ACCESS_TOKEN)
// ---------------------------------------------------------------------------
async function deployViaManagementAPI(projectRef, accessToken, sql, label) {
  const url = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;

  console.log(`  Deploying ${label} via Management API...`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Management API returned ${response.status}: ${text}`);
  }

  const result = await response.json();
  return result;
}

// ---------------------------------------------------------------------------
// Extract project ref from Supabase URL
// ---------------------------------------------------------------------------
function getProjectRef(supabaseUrl) {
  // https://mywfgjoaigtzzxksbqzz.supabase.co -> mywfgjoaigtzzxksbqzz
  try {
    const host = new URL(supabaseUrl).hostname;
    return host.split('.')[0];
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Print table status
// ---------------------------------------------------------------------------
function printTableStatus(existingTables) {
  console.log('');
  console.log('Table Status:');
  console.log('-'.repeat(40));

  let existCount = 0;
  let missingCount = 0;

  for (const table of EXPECTED_TABLES) {
    const exists = existingTables.includes(table);
    const icon = exists ? '[OK]' : '[--]';
    console.log(`  ${icon} ${table}`);
    if (exists) existCount++;
    else missingCount++;
  }

  console.log('-'.repeat(40));
  console.log(`  Total: ${existCount} exist, ${missingCount} missing (of ${EXPECTED_TABLES.length})`);
  console.log('');
}

// ---------------------------------------------------------------------------
// Generate SQL Editor URL
// ---------------------------------------------------------------------------
function getSQLEditorURL(supabaseUrl) {
  const projectRef = getProjectRef(supabaseUrl);
  if (!projectRef) return null;
  return `https://supabase.com/dashboard/project/${projectRef}/sql/new`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || '--verify';

  const validModes = ['--verify', '--output-sql', '--deploy', '--seed', '--help'];
  if (!validModes.includes(mode)) {
    console.error(`Unknown mode: ${mode}`);
    console.error(`Valid modes: ${validModes.join(', ')}`);
    process.exit(1);
  }

  if (mode === '--help') {
    console.log(`
Supabase Schema Deployment Tool
================================

Usage:
  node scripts/deploy-supabase-schema.mjs [mode]

Modes:
  --verify       Check which tables exist (default)
  --output-sql   Print combined SQL (schema + storage policies) to stdout
  --deploy       Deploy via Supabase Management API (needs SUPABASE_ACCESS_TOKEN)
  --seed         Run --verify, then output seed.sql if tables exist
  --help         Show this help

Environment (.env.local):
  VITE_SUPABASE_URL           Required for all modes
  SUPABASE_SERVICE_ROLE_KEY   Required for --verify, --seed
  SUPABASE_ACCESS_TOKEN       Required for --deploy (get from supabase.com/dashboard/account/tokens)
`);
    process.exit(0);
  }

  // -- Load env --
  const { vars: env, path: envPath } = loadEnv();
  const SUPABASE_URL = env.VITE_SUPABASE_URL;
  const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
  const ACCESS_TOKEN = env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_ACCESS_TOKEN;
  const projectRef = getProjectRef(SUPABASE_URL);

  console.log('=== Supabase Schema Deployment Tool ===');
  console.log(`Env file:    ${envPath}`);
  console.log(`Project URL: ${SUPABASE_URL || '(not set)'}`);
  console.log(`Project ref: ${projectRef || '(could not parse)'}`);
  console.log(`Mode:        ${mode}`);
  console.log('');

  if (!SUPABASE_URL) {
    console.error('ERROR: VITE_SUPABASE_URL is not set in .env.local');
    process.exit(1);
  }

  // -----------------------------------------------------------------------
  // MODE: --output-sql
  // -----------------------------------------------------------------------
  if (mode === '--output-sql') {
    const schemaSQL = readSQLFile('supabase/schema.sql');
    const storageSQL = readSQLFile('supabase/storage-policies.sql');
    const seedSQL = existsSync(resolve(ROOT, 'supabase/seed.sql'))
      ? readSQLFile('supabase/seed.sql')
      : null;

    console.log('-- =============================================================');
    console.log('-- Combined SQL output for Supabase SQL Editor');
    console.log('-- Generated by: scripts/deploy-supabase-schema.mjs --output-sql');
    console.log(`-- Date: ${new Date().toISOString()}`);
    console.log('-- =============================================================');
    console.log('');
    console.log('-- ===================== SCHEMA =====================');
    console.log(schemaSQL);
    console.log('');
    console.log('-- ===================== STORAGE POLICIES =====================');
    console.log(storageSQL);
    if (seedSQL) {
      console.log('');
      console.log('-- ===================== SEED DATA =====================');
      console.log(seedSQL);
    }
    console.log('');
    console.log('-- ===================== DONE =====================');
    return;
  }

  // All other modes need service_role key
  if (!SERVICE_ROLE_KEY) {
    console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY is not set in .env.local');
    console.error('This key is required for --verify, --seed, and --deploy modes.');
    process.exit(1);
  }

  // Create Supabase client with service_role key (bypasses RLS)
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  // -----------------------------------------------------------------------
  // MODE: --deploy
  // -----------------------------------------------------------------------
  if (mode === '--deploy') {
    if (!ACCESS_TOKEN) {
      console.error('ERROR: SUPABASE_ACCESS_TOKEN is required for --deploy mode.');
      console.error('');
      console.error('How to get your access token:');
      console.error('  1. Go to https://supabase.com/dashboard/account/tokens');
      console.error('  2. Generate a new token');
      console.error('  3. Add to .env.local: SUPABASE_ACCESS_TOKEN=sbp_...');
      console.error('  4. Or pass via environment: SUPABASE_ACCESS_TOKEN=sbp_... node scripts/deploy-supabase-schema.mjs --deploy');
      process.exit(1);
    }

    if (!projectRef) {
      console.error('ERROR: Could not extract project ref from VITE_SUPABASE_URL');
      process.exit(1);
    }

    console.log('Deploying schema via Supabase Management API...');
    console.log('');

    try {
      // Deploy schema.sql
      const schemaSQL = readSQLFile('supabase/schema.sql');
      const schemaResult = await deployViaManagementAPI(projectRef, ACCESS_TOKEN, schemaSQL, 'schema.sql');
      console.log('  [OK] schema.sql deployed successfully');

      // Deploy storage-policies.sql
      const storageSQL = readSQLFile('supabase/storage-policies.sql');
      try {
        const storageResult = await deployViaManagementAPI(projectRef, ACCESS_TOKEN, storageSQL, 'storage-policies.sql');
        console.log('  [OK] storage-policies.sql deployed successfully');
      } catch (storageErr) {
        console.log(`  [WARN] storage-policies.sql: ${storageErr.message}`);
        console.log('  Note: Storage policies may require manual bucket creation first.');
        console.log('  Create buckets (models, documents, branding) in the Supabase Dashboard,');
        console.log('  then re-run this script or paste storage-policies.sql in the SQL Editor.');
      }

      console.log('');

      // Verify after deploy
      console.log('Verifying deployment...');
      const { tables } = await checkExistingTables(supabase);
      printTableStatus(tables);

      const missing = EXPECTED_TABLES.filter(t => !tables.includes(t));
      if (missing.length === 0) {
        console.log('[OK] All 25 tables deployed successfully!');
      } else {
        console.log(`[WARN] ${missing.length} tables still missing after deploy.`);
        console.log('Check the Supabase SQL Editor for errors.');
      }

      // Ask about seed
      if (existsSync(resolve(ROOT, 'supabase/seed.sql'))) {
        console.log('');
        console.log('To seed demo data, run:');
        console.log('  node scripts/deploy-supabase-schema.mjs --seed');
        console.log('Or deploy seed.sql via Management API manually.');
      }

    } catch (err) {
      console.error(`[FAIL] Deployment failed: ${err.message}`);
      console.error('');
      console.error('Common causes:');
      console.error('  - Invalid access token (expired or wrong project)');
      console.error('  - Network issues');
      console.error('  - SQL syntax error in schema files');
      console.error('');
      console.error('Alternative: use --output-sql and paste into Supabase SQL Editor:');
      console.error(`  ${getSQLEditorURL(SUPABASE_URL) || 'https://supabase.com/dashboard'}`);
      process.exit(1);
    }

    return;
  }

  // -----------------------------------------------------------------------
  // MODE: --verify (default) and --seed
  // -----------------------------------------------------------------------
  console.log('Checking Supabase connection and table status...');
  console.log('');

  const { connected, tables, errors } = await checkExistingTables(supabase);

  if (!connected) {
    console.error('[FAIL] Cannot connect to Supabase.');
    if (errors.length > 0) {
      errors.forEach(e => console.error(`  ${e}`));
    }
    console.error('');
    console.error('Troubleshooting:');
    console.error('  1. Check VITE_SUPABASE_URL is correct');
    console.error('  2. Check SUPABASE_SERVICE_ROLE_KEY is correct');
    console.error('  3. Ensure the Supabase project is active (not paused)');
    process.exit(1);
  }

  console.log('[OK] Connected to Supabase');
  printTableStatus(tables);

  const missing = EXPECTED_TABLES.filter(t => !tables.includes(t));

  if (missing.length === 0) {
    console.log('[OK] All 25 tables exist!');
    console.log('');

    // Check for demo tenant
    const { data: tenant, error: tenantErr } = await supabase
      .from('tenants')
      .select('id, slug, name, plan_name')
      .eq('slug', 'demo-tenant')
      .maybeSingle();

    if (tenant) {
      console.log(`[OK] Demo tenant found: id=${tenant.id}, slug=${tenant.slug}, plan=${tenant.plan_name}`);
    } else {
      console.log('[--] Demo tenant not found. Run seed.sql to create it.');
      if (existsSync(resolve(ROOT, 'supabase/seed.sql'))) {
        console.log('');
        console.log('To seed demo data:');
        console.log(`  1. Open SQL Editor: ${getSQLEditorURL(SUPABASE_URL) || 'Supabase Dashboard > SQL Editor'}`);
        console.log('  2. Paste contents of supabase/seed.sql');
        console.log('  3. Click "Run"');
      }
    }

    // --seed mode: try to deploy seed via Management API
    if (mode === '--seed' && !tenant) {
      if (ACCESS_TOKEN) {
        console.log('');
        console.log('Deploying seed.sql via Management API...');
        try {
          const seedSQL = readSQLFile('supabase/seed.sql');
          await deployViaManagementAPI(projectRef, ACCESS_TOKEN, seedSQL, 'seed.sql');
          console.log('[OK] seed.sql deployed successfully');

          // Re-check demo tenant
          const { data: t2 } = await supabase
            .from('tenants')
            .select('id, slug')
            .eq('slug', 'demo-tenant')
            .maybeSingle();

          if (t2) {
            console.log(`[OK] Demo tenant created: id=${t2.id}`);
          }
        } catch (err) {
          console.error(`[FAIL] Seed deployment failed: ${err.message}`);
          console.error('Paste supabase/seed.sql manually into the SQL Editor.');
        }
      } else {
        console.log('');
        console.log('To deploy seed automatically, set SUPABASE_ACCESS_TOKEN in .env.local');
        console.log('Get token at: https://supabase.com/dashboard/account/tokens');
      }
    }

  } else {
    // Tables are missing
    console.log(`[--] ${missing.length} of ${EXPECTED_TABLES.length} tables are missing.`);
    console.log('');
    console.log('Missing tables:');
    missing.forEach(t => console.log(`  - ${t}`));
    console.log('');

    const sqlEditorURL = getSQLEditorURL(SUPABASE_URL);

    if (ACCESS_TOKEN) {
      console.log('You have SUPABASE_ACCESS_TOKEN set. Run with --deploy to auto-deploy:');
      console.log('  node scripts/deploy-supabase-schema.mjs --deploy');
    } else {
      console.log('To deploy the schema, choose one of these options:');
      console.log('');
      console.log('  Option A: Paste SQL into Supabase SQL Editor (simplest)');
      console.log('  --------------------------------------------------------');
      if (sqlEditorURL) {
        console.log(`  1. Open: ${sqlEditorURL}`);
      } else {
        console.log('  1. Open Supabase Dashboard > SQL Editor > New query');
      }
      console.log('  2. Copy the output of:');
      console.log('     node scripts/deploy-supabase-schema.mjs --output-sql');
      console.log('  3. Paste into the SQL Editor and click "Run"');
      console.log('');
      console.log('  Option B: Deploy via Management API (automated)');
      console.log('  ------------------------------------------------');
      console.log('  1. Get access token: https://supabase.com/dashboard/account/tokens');
      console.log('  2. Add to .env.local: SUPABASE_ACCESS_TOKEN=sbp_...');
      console.log('  3. Run: node scripts/deploy-supabase-schema.mjs --deploy');
      console.log('');
      console.log('  Option C: Use Supabase CLI');
      console.log('  --------------------------');
      console.log('  npx supabase db push');
    }
  }
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
main().catch(err => {
  console.error('');
  console.error('Fatal error:', err.message);
  if (err.cause) console.error('Cause:', err.cause);
  process.exit(1);
});
