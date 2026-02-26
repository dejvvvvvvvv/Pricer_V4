-- ============================================================
-- ModelPricer V3 — Production RLS Policies
-- ============================================================
-- REPLACES: All permissive `*_anon` policies from schema.sql
--           and storage-policies.sql
--
-- AUTH STRATEGY (dual-mode):
--   Priority 1: Supabase Auth JWT claim `tenant_id` (future production)
--   Priority 2: Request header `x-tenant-id` (current Firebase Auth transition)
--   NO fallback to 'demo-tenant' — NULL tenant_id = DENY ALL
--
-- HOW TO APPLY:
--   1. Run this file in Supabase SQL Editor AFTER schema.sql
--   2. This file is idempotent — safe to re-run
--   3. Test with: SET LOCAL request.headers = '{"x-tenant-id":"your-tenant-slug"}';
--
-- TABLES COVERED: 25 (all tables from schema.sql)
-- STORAGE BUCKETS COVERED: 3 (models, documents, branding)
-- ============================================================

BEGIN;

-- ============================================================
-- SECTION 1: Updated get_request_tenant_id() function
-- ============================================================
-- Dual-mode tenant resolution:
--   1. Supabase Auth JWT → auth.jwt() ->> 'tenant_id'
--   2. Request header    → request.headers ->> 'x-tenant-id'
--   3. NO fallback       → returns NULL (RLS denies access)
--
-- SECURITY DEFINER: Runs with function owner privileges so it
-- can access auth.jwt() regardless of caller role.
-- STABLE: Does not modify database state (safe for RLS).

CREATE OR REPLACE FUNCTION get_request_tenant_id()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    -- Priority 1: Supabase Auth JWT claim (production mode)
    (auth.jwt() ->> 'tenant_id'),
    -- Priority 2: Request header from API gateway (transition mode)
    nullif(current_setting('request.headers', true)::json->>'x-tenant-id', '')
  );
  -- NO fallback to 'demo-tenant' — if both are NULL, return NULL → deny
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_request_tenant_id() IS
  'Resolves the current tenant_id from JWT claims (production) or request headers (transition). '
  'Returns NULL if no tenant context is available, which causes RLS policies to deny access.';


-- ============================================================
-- SECTION 2: FORCE ROW LEVEL SECURITY on all tables
-- ============================================================
-- FORCE ensures RLS applies even to the table owner (superuser).
-- Without FORCE, the table owner bypasses all policies.
-- This is critical for multi-tenant isolation.

ALTER TABLE tenants FORCE ROW LEVEL SECURITY;
ALTER TABLE pricing_configs FORCE ROW LEVEL SECURITY;
ALTER TABLE materials FORCE ROW LEVEL SECURITY;
ALTER TABLE fees FORCE ROW LEVEL SECURITY;
ALTER TABLE customers FORCE ROW LEVEL SECURITY;
ALTER TABLE orders FORCE ROW LEVEL SECURITY;
ALTER TABLE order_items FORCE ROW LEVEL SECURITY;
ALTER TABLE order_activity FORCE ROW LEVEL SECURITY;
ALTER TABLE audit_log FORCE ROW LEVEL SECURITY;
ALTER TABLE analytics_events FORCE ROW LEVEL SECURITY;
ALTER TABLE coupons FORCE ROW LEVEL SECURITY;
ALTER TABLE shipping_methods FORCE ROW LEVEL SECURITY;
ALTER TABLE email_templates FORCE ROW LEVEL SECURITY;
ALTER TABLE email_logs FORCE ROW LEVEL SECURITY;
ALTER TABLE branding FORCE ROW LEVEL SECURITY;
ALTER TABLE widget_configs FORCE ROW LEVEL SECURITY;
ALTER TABLE dashboard_configs FORCE ROW LEVEL SECURITY;
ALTER TABLE team_members FORCE ROW LEVEL SECURITY;
ALTER TABLE form_configs FORCE ROW LEVEL SECURITY;
ALTER TABLE express_tiers FORCE ROW LEVEL SECURITY;
ALTER TABLE kanban_configs FORCE ROW LEVEL SECURITY;
ALTER TABLE documents FORCE ROW LEVEL SECURITY;
ALTER TABLE feature_flags FORCE ROW LEVEL SECURITY;
ALTER TABLE api_keys FORCE ROW LEVEL SECURITY;
ALTER TABLE chat_messages FORCE ROW LEVEL SECURITY;


-- ============================================================
-- SECTION 3: DROP all existing permissive _anon policies
-- ============================================================
-- These were created by schema.sql for the demo phase.
-- We drop them before creating restrictive tenant-scoped policies.
-- Using IF EXISTS so this file is idempotent.

-- 3.1 Tenants table (had custom _anon policies)
DROP POLICY IF EXISTS "tenants_select_anon" ON tenants;
DROP POLICY IF EXISTS "tenants_insert_anon" ON tenants;
DROP POLICY IF EXISTS "tenants_update_anon" ON tenants;

-- 3.2 All 24 data tables (had loop-generated _anon policies)
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'pricing_configs', 'materials', 'fees', 'customers',
    'orders', 'order_items', 'order_activity', 'audit_log',
    'analytics_events', 'coupons', 'shipping_methods',
    'email_templates', 'email_logs', 'branding', 'widget_configs',
    'dashboard_configs', 'team_members', 'form_configs',
    'express_tiers', 'kanban_configs', 'documents',
    'feature_flags', 'api_keys', 'chat_messages'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', tbl || '_select_anon', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', tbl || '_insert_anon', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', tbl || '_update_anon', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', tbl || '_delete_anon', tbl);
  END LOOP;
END $$;

-- 3.3 Storage bucket policies (from storage-policies.sql)
DROP POLICY IF EXISTS "models_insert_anon" ON storage.objects;
DROP POLICY IF EXISTS "models_select_anon" ON storage.objects;
DROP POLICY IF EXISTS "models_update_anon" ON storage.objects;
DROP POLICY IF EXISTS "models_delete_anon" ON storage.objects;
DROP POLICY IF EXISTS "documents_insert_anon" ON storage.objects;
DROP POLICY IF EXISTS "documents_select_anon" ON storage.objects;
DROP POLICY IF EXISTS "documents_update_anon" ON storage.objects;
DROP POLICY IF EXISTS "documents_delete_anon" ON storage.objects;
DROP POLICY IF EXISTS "branding_select_public" ON storage.objects;
DROP POLICY IF EXISTS "branding_insert_anon" ON storage.objects;
DROP POLICY IF EXISTS "branding_update_anon" ON storage.objects;
DROP POLICY IF EXISTS "branding_delete_anon" ON storage.objects;


-- ============================================================
-- SECTION 4: TENANT-SCOPED POLICIES — Special Tables
-- ============================================================
-- Tables with non-standard policy requirements are handled
-- individually in this section. Standard tables follow in Section 5.


-- ------------------------------------------------------------
-- 4.1 TENANTS — Owner can read/update own tenant. No delete via RLS.
-- ------------------------------------------------------------
-- The tenants table uses `slug` as the tenant identifier (not a FK).
-- get_request_tenant_id() returns the tenant slug.
-- No DELETE policy: tenants cannot be deleted through RLS.
-- Tenant creation is restricted to service role (no INSERT policy).

CREATE POLICY "tenants_select_own"
  ON tenants FOR SELECT
  USING (slug = get_request_tenant_id());

CREATE POLICY "tenants_update_own"
  ON tenants FOR UPDATE
  USING (slug = get_request_tenant_id())
  WITH CHECK (slug = get_request_tenant_id());

-- No INSERT policy: tenant creation should only happen through
-- a privileged service role endpoint, not client-side.
-- No DELETE policy: tenant deletion is a destructive admin-only
-- operation that must go through the service role.


-- ------------------------------------------------------------
-- 4.2 AUDIT_LOG — INSERT only. No UPDATE/DELETE (immutability).
-- ------------------------------------------------------------
-- Audit logs are append-only. Once written, they cannot be
-- modified or deleted. This ensures a tamper-proof audit trail.

CREATE POLICY "audit_log_select"
  ON audit_log FOR SELECT
  USING (tenant_id::text = get_request_tenant_id());

CREATE POLICY "audit_log_insert"
  ON audit_log FOR INSERT
  WITH CHECK (tenant_id::text = get_request_tenant_id());

-- No UPDATE policy: audit records are immutable.
-- No DELETE policy: audit records cannot be removed.


-- ------------------------------------------------------------
-- 4.3 ANALYTICS_EVENTS — INSERT + SELECT only. No UPDATE/DELETE.
-- ------------------------------------------------------------
-- Analytics events are append-only and queryable.
-- Once recorded, events cannot be modified or removed.
-- This preserves data integrity for analytics dashboards.

CREATE POLICY "analytics_events_select"
  ON analytics_events FOR SELECT
  USING (tenant_id::text = get_request_tenant_id());

CREATE POLICY "analytics_events_insert"
  ON analytics_events FOR INSERT
  WITH CHECK (tenant_id::text = get_request_tenant_id());

-- No UPDATE policy: analytics events are immutable once recorded.
-- No DELETE policy: analytics history must be preserved.


-- ------------------------------------------------------------
-- 4.4 BRANDING — Public SELECT (widgets need branding data).
--                Tenant-scoped INSERT/UPDATE/DELETE.
-- ------------------------------------------------------------
-- Branding data (logos, colors, company name) must be publicly
-- readable because embedded widgets on third-party sites need
-- to load the tenant's branding without authentication.
-- Only the owning tenant can modify their branding.

CREATE POLICY "branding_select_public"
  ON branding FOR SELECT
  USING (true);

CREATE POLICY "branding_insert_tenant"
  ON branding FOR INSERT
  WITH CHECK (tenant_id::text = get_request_tenant_id());

CREATE POLICY "branding_update_tenant"
  ON branding FOR UPDATE
  USING (tenant_id::text = get_request_tenant_id())
  WITH CHECK (tenant_id::text = get_request_tenant_id());

CREATE POLICY "branding_delete_tenant"
  ON branding FOR DELETE
  USING (tenant_id::text = get_request_tenant_id());


-- ------------------------------------------------------------
-- 4.5 WIDGET_CONFIGS — Public SELECT (widgets load their config).
--                       Tenant-scoped INSERT/UPDATE/DELETE.
-- ------------------------------------------------------------
-- Widget configurations must be publicly readable because the
-- embedded widget JS on third-party sites fetches its config
-- via the Supabase anon key without tenant authentication.
-- Only the owning tenant can modify their widget configs.

CREATE POLICY "widget_configs_select_public"
  ON widget_configs FOR SELECT
  USING (true);

CREATE POLICY "widget_configs_insert_tenant"
  ON widget_configs FOR INSERT
  WITH CHECK (tenant_id::text = get_request_tenant_id());

CREATE POLICY "widget_configs_update_tenant"
  ON widget_configs FOR UPDATE
  USING (tenant_id::text = get_request_tenant_id())
  WITH CHECK (tenant_id::text = get_request_tenant_id());

CREATE POLICY "widget_configs_delete_tenant"
  ON widget_configs FOR DELETE
  USING (tenant_id::text = get_request_tenant_id());


-- ------------------------------------------------------------
-- 4.6 ORDER_ACTIVITY — Append-only log for order history.
-- ------------------------------------------------------------
-- Order activity records (status changes, notes, etc.) are
-- append-only within a tenant scope. SELECT and INSERT only.
-- No UPDATE/DELETE to preserve order history integrity.

CREATE POLICY "order_activity_select"
  ON order_activity FOR SELECT
  USING (tenant_id::text = get_request_tenant_id());

CREATE POLICY "order_activity_insert"
  ON order_activity FOR INSERT
  WITH CHECK (tenant_id::text = get_request_tenant_id());

-- No UPDATE policy: order activity records are immutable.
-- No DELETE policy: order history must be preserved.


-- ------------------------------------------------------------
-- 4.7 EMAIL_LOGS — Append-only log for sent emails.
-- ------------------------------------------------------------
-- Email logs record every email sent. They are append-only
-- within a tenant scope for compliance and debugging.

CREATE POLICY "email_logs_select"
  ON email_logs FOR SELECT
  USING (tenant_id::text = get_request_tenant_id());

CREATE POLICY "email_logs_insert"
  ON email_logs FOR INSERT
  WITH CHECK (tenant_id::text = get_request_tenant_id());

-- No UPDATE policy: email log records are immutable.
-- No DELETE policy: email history must be preserved for compliance.


-- ------------------------------------------------------------
-- 4.8 API_KEYS — Full CRUD but extra security considerations.
-- ------------------------------------------------------------
-- API keys table contains key_hash (not the raw key).
-- Tenant can manage their own API keys.
-- Note: The actual key validation happens in the backend
-- middleware, not through RLS.

CREATE POLICY "api_keys_select"
  ON api_keys FOR SELECT
  USING (tenant_id::text = get_request_tenant_id());

CREATE POLICY "api_keys_insert"
  ON api_keys FOR INSERT
  WITH CHECK (tenant_id::text = get_request_tenant_id());

CREATE POLICY "api_keys_update"
  ON api_keys FOR UPDATE
  USING (tenant_id::text = get_request_tenant_id())
  WITH CHECK (tenant_id::text = get_request_tenant_id());

CREATE POLICY "api_keys_delete"
  ON api_keys FOR DELETE
  USING (tenant_id::text = get_request_tenant_id());


-- ============================================================
-- SECTION 5: TENANT-SCOPED POLICIES — Standard Tables
-- ============================================================
-- These tables follow the standard pattern:
--   SELECT  → tenant_id matches request tenant
--   INSERT  → tenant_id matches request tenant
--   UPDATE  → tenant_id matches request tenant (USING + WITH CHECK)
--   DELETE  → tenant_id matches request tenant
--
-- WITH CHECK on UPDATE ensures tenant_id cannot be changed
-- to a different tenant (prevents tenant_id reassignment attacks).

-- ------------------------------------------------------------
-- 5.1 PRICING_CONFIGS
-- ------------------------------------------------------------
CREATE POLICY "pricing_configs_select"
  ON pricing_configs FOR SELECT
  USING (tenant_id::text = get_request_tenant_id());

CREATE POLICY "pricing_configs_insert"
  ON pricing_configs FOR INSERT
  WITH CHECK (tenant_id::text = get_request_tenant_id());

CREATE POLICY "pricing_configs_update"
  ON pricing_configs FOR UPDATE
  USING (tenant_id::text = get_request_tenant_id())
  WITH CHECK (tenant_id::text = get_request_tenant_id());

CREATE POLICY "pricing_configs_delete"
  ON pricing_configs FOR DELETE
  USING (tenant_id::text = get_request_tenant_id());


-- ------------------------------------------------------------
-- 5.2 MATERIALS
-- ------------------------------------------------------------
CREATE POLICY "materials_select"
  ON materials FOR SELECT
  USING (tenant_id::text = get_request_tenant_id());

CREATE POLICY "materials_insert"
  ON materials FOR INSERT
  WITH CHECK (tenant_id::text = get_request_tenant_id());

CREATE POLICY "materials_update"
  ON materials FOR UPDATE
  USING (tenant_id::text = get_request_tenant_id())
  WITH CHECK (tenant_id::text = get_request_tenant_id());

CREATE POLICY "materials_delete"
  ON materials FOR DELETE
  USING (tenant_id::text = get_request_tenant_id());


-- ------------------------------------------------------------
-- 5.3 FEES
-- ------------------------------------------------------------
CREATE POLICY "fees_select"
  ON fees FOR SELECT
  USING (tenant_id::text = get_request_tenant_id());

CREATE POLICY "fees_insert"
  ON fees FOR INSERT
  WITH CHECK (tenant_id::text = get_request_tenant_id());

CREATE POLICY "fees_update"
  ON fees FOR UPDATE
  USING (tenant_id::text = get_request_tenant_id())
  WITH CHECK (tenant_id::text = get_request_tenant_id());

CREATE POLICY "fees_delete"
  ON fees FOR DELETE
  USING (tenant_id::text = get_request_tenant_id());


-- ------------------------------------------------------------
-- 5.4 CUSTOMERS
-- ------------------------------------------------------------
CREATE POLICY "customers_select"
  ON customers FOR SELECT
  USING (tenant_id::text = get_request_tenant_id());

CREATE POLICY "customers_insert"
  ON customers FOR INSERT
  WITH CHECK (tenant_id::text = get_request_tenant_id());

CREATE POLICY "customers_update"
  ON customers FOR UPDATE
  USING (tenant_id::text = get_request_tenant_id())
  WITH CHECK (tenant_id::text = get_request_tenant_id());

CREATE POLICY "customers_delete"
  ON customers FOR DELETE
  USING (tenant_id::text = get_request_tenant_id());


-- ------------------------------------------------------------
-- 5.5 ORDERS
-- ------------------------------------------------------------
CREATE POLICY "orders_select"
  ON orders FOR SELECT
  USING (tenant_id::text = get_request_tenant_id());

CREATE POLICY "orders_insert"
  ON orders FOR INSERT
  WITH CHECK (tenant_id::text = get_request_tenant_id());

CREATE POLICY "orders_update"
  ON orders FOR UPDATE
  USING (tenant_id::text = get_request_tenant_id())
  WITH CHECK (tenant_id::text = get_request_tenant_id());

CREATE POLICY "orders_delete"
  ON orders FOR DELETE
  USING (tenant_id::text = get_request_tenant_id());


-- ------------------------------------------------------------
-- 5.6 ORDER_ITEMS
-- ------------------------------------------------------------
CREATE POLICY "order_items_select"
  ON order_items FOR SELECT
  USING (tenant_id::text = get_request_tenant_id());

CREATE POLICY "order_items_insert"
  ON order_items FOR INSERT
  WITH CHECK (tenant_id::text = get_request_tenant_id());

CREATE POLICY "order_items_update"
  ON order_items FOR UPDATE
  USING (tenant_id::text = get_request_tenant_id())
  WITH CHECK (tenant_id::text = get_request_tenant_id());

CREATE POLICY "order_items_delete"
  ON order_items FOR DELETE
  USING (tenant_id::text = get_request_tenant_id());


-- ------------------------------------------------------------
-- 5.7 COUPONS
-- ------------------------------------------------------------
CREATE POLICY "coupons_select"
  ON coupons FOR SELECT
  USING (tenant_id::text = get_request_tenant_id());

CREATE POLICY "coupons_insert"
  ON coupons FOR INSERT
  WITH CHECK (tenant_id::text = get_request_tenant_id());

CREATE POLICY "coupons_update"
  ON coupons FOR UPDATE
  USING (tenant_id::text = get_request_tenant_id())
  WITH CHECK (tenant_id::text = get_request_tenant_id());

CREATE POLICY "coupons_delete"
  ON coupons FOR DELETE
  USING (tenant_id::text = get_request_tenant_id());


-- ------------------------------------------------------------
-- 5.8 SHIPPING_METHODS
-- ------------------------------------------------------------
CREATE POLICY "shipping_methods_select"
  ON shipping_methods FOR SELECT
  USING (tenant_id::text = get_request_tenant_id());

CREATE POLICY "shipping_methods_insert"
  ON shipping_methods FOR INSERT
  WITH CHECK (tenant_id::text = get_request_tenant_id());

CREATE POLICY "shipping_methods_update"
  ON shipping_methods FOR UPDATE
  USING (tenant_id::text = get_request_tenant_id())
  WITH CHECK (tenant_id::text = get_request_tenant_id());

CREATE POLICY "shipping_methods_delete"
  ON shipping_methods FOR DELETE
  USING (tenant_id::text = get_request_tenant_id());


-- ------------------------------------------------------------
-- 5.9 EMAIL_TEMPLATES
-- ------------------------------------------------------------
CREATE POLICY "email_templates_select"
  ON email_templates FOR SELECT
  USING (tenant_id::text = get_request_tenant_id());

CREATE POLICY "email_templates_insert"
  ON email_templates FOR INSERT
  WITH CHECK (tenant_id::text = get_request_tenant_id());

CREATE POLICY "email_templates_update"
  ON email_templates FOR UPDATE
  USING (tenant_id::text = get_request_tenant_id())
  WITH CHECK (tenant_id::text = get_request_tenant_id());

CREATE POLICY "email_templates_delete"
  ON email_templates FOR DELETE
  USING (tenant_id::text = get_request_tenant_id());


-- ------------------------------------------------------------
-- 5.10 DASHBOARD_CONFIGS
-- ------------------------------------------------------------
CREATE POLICY "dashboard_configs_select"
  ON dashboard_configs FOR SELECT
  USING (tenant_id::text = get_request_tenant_id());

CREATE POLICY "dashboard_configs_insert"
  ON dashboard_configs FOR INSERT
  WITH CHECK (tenant_id::text = get_request_tenant_id());

CREATE POLICY "dashboard_configs_update"
  ON dashboard_configs FOR UPDATE
  USING (tenant_id::text = get_request_tenant_id())
  WITH CHECK (tenant_id::text = get_request_tenant_id());

CREATE POLICY "dashboard_configs_delete"
  ON dashboard_configs FOR DELETE
  USING (tenant_id::text = get_request_tenant_id());


-- ------------------------------------------------------------
-- 5.11 TEAM_MEMBERS
-- ------------------------------------------------------------
CREATE POLICY "team_members_select"
  ON team_members FOR SELECT
  USING (tenant_id::text = get_request_tenant_id());

CREATE POLICY "team_members_insert"
  ON team_members FOR INSERT
  WITH CHECK (tenant_id::text = get_request_tenant_id());

CREATE POLICY "team_members_update"
  ON team_members FOR UPDATE
  USING (tenant_id::text = get_request_tenant_id())
  WITH CHECK (tenant_id::text = get_request_tenant_id());

CREATE POLICY "team_members_delete"
  ON team_members FOR DELETE
  USING (tenant_id::text = get_request_tenant_id());


-- ------------------------------------------------------------
-- 5.12 FORM_CONFIGS
-- ------------------------------------------------------------
CREATE POLICY "form_configs_select"
  ON form_configs FOR SELECT
  USING (tenant_id::text = get_request_tenant_id());

CREATE POLICY "form_configs_insert"
  ON form_configs FOR INSERT
  WITH CHECK (tenant_id::text = get_request_tenant_id());

CREATE POLICY "form_configs_update"
  ON form_configs FOR UPDATE
  USING (tenant_id::text = get_request_tenant_id())
  WITH CHECK (tenant_id::text = get_request_tenant_id());

CREATE POLICY "form_configs_delete"
  ON form_configs FOR DELETE
  USING (tenant_id::text = get_request_tenant_id());


-- ------------------------------------------------------------
-- 5.13 EXPRESS_TIERS
-- ------------------------------------------------------------
CREATE POLICY "express_tiers_select"
  ON express_tiers FOR SELECT
  USING (tenant_id::text = get_request_tenant_id());

CREATE POLICY "express_tiers_insert"
  ON express_tiers FOR INSERT
  WITH CHECK (tenant_id::text = get_request_tenant_id());

CREATE POLICY "express_tiers_update"
  ON express_tiers FOR UPDATE
  USING (tenant_id::text = get_request_tenant_id())
  WITH CHECK (tenant_id::text = get_request_tenant_id());

CREATE POLICY "express_tiers_delete"
  ON express_tiers FOR DELETE
  USING (tenant_id::text = get_request_tenant_id());


-- ------------------------------------------------------------
-- 5.14 KANBAN_CONFIGS
-- ------------------------------------------------------------
CREATE POLICY "kanban_configs_select"
  ON kanban_configs FOR SELECT
  USING (tenant_id::text = get_request_tenant_id());

CREATE POLICY "kanban_configs_insert"
  ON kanban_configs FOR INSERT
  WITH CHECK (tenant_id::text = get_request_tenant_id());

CREATE POLICY "kanban_configs_update"
  ON kanban_configs FOR UPDATE
  USING (tenant_id::text = get_request_tenant_id())
  WITH CHECK (tenant_id::text = get_request_tenant_id());

CREATE POLICY "kanban_configs_delete"
  ON kanban_configs FOR DELETE
  USING (tenant_id::text = get_request_tenant_id());


-- ------------------------------------------------------------
-- 5.15 DOCUMENTS
-- ------------------------------------------------------------
CREATE POLICY "documents_select"
  ON documents FOR SELECT
  USING (tenant_id::text = get_request_tenant_id());

CREATE POLICY "documents_insert"
  ON documents FOR INSERT
  WITH CHECK (tenant_id::text = get_request_tenant_id());

CREATE POLICY "documents_update"
  ON documents FOR UPDATE
  USING (tenant_id::text = get_request_tenant_id())
  WITH CHECK (tenant_id::text = get_request_tenant_id());

CREATE POLICY "documents_delete"
  ON documents FOR DELETE
  USING (tenant_id::text = get_request_tenant_id());


-- ------------------------------------------------------------
-- 5.16 FEATURE_FLAGS
-- ------------------------------------------------------------
CREATE POLICY "feature_flags_select"
  ON feature_flags FOR SELECT
  USING (tenant_id::text = get_request_tenant_id());

CREATE POLICY "feature_flags_insert"
  ON feature_flags FOR INSERT
  WITH CHECK (tenant_id::text = get_request_tenant_id());

CREATE POLICY "feature_flags_update"
  ON feature_flags FOR UPDATE
  USING (tenant_id::text = get_request_tenant_id())
  WITH CHECK (tenant_id::text = get_request_tenant_id());

CREATE POLICY "feature_flags_delete"
  ON feature_flags FOR DELETE
  USING (tenant_id::text = get_request_tenant_id());


-- ------------------------------------------------------------
-- 5.17 CHAT_MESSAGES
-- ------------------------------------------------------------
CREATE POLICY "chat_messages_select"
  ON chat_messages FOR SELECT
  USING (tenant_id::text = get_request_tenant_id());

CREATE POLICY "chat_messages_insert"
  ON chat_messages FOR INSERT
  WITH CHECK (tenant_id::text = get_request_tenant_id());

CREATE POLICY "chat_messages_update"
  ON chat_messages FOR UPDATE
  USING (tenant_id::text = get_request_tenant_id())
  WITH CHECK (tenant_id::text = get_request_tenant_id());

CREATE POLICY "chat_messages_delete"
  ON chat_messages FOR DELETE
  USING (tenant_id::text = get_request_tenant_id());


-- ============================================================
-- SECTION 6: STORAGE BUCKET POLICIES
-- ============================================================
-- Storage objects use path-based tenant isolation.
-- Convention: all files are stored under `{tenant_id}/` prefix.
-- Example path: "demo-tenant/models/cube.stl"
--
-- The tenant_id is extracted from the first path segment using:
--   (storage.foldername(name))[1]
-- which returns the first folder in the object path.
--
-- Helper function for extracting tenant from storage path:

CREATE OR REPLACE FUNCTION get_storage_tenant_id(object_name TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Extract the first path segment as the tenant identifier.
  -- Example: 'demo-tenant/models/file.stl' → 'demo-tenant'
  RETURN split_part(object_name, '/', 1);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION get_storage_tenant_id(TEXT) IS
  'Extracts the tenant_id from a storage object path. '
  'Convention: all storage objects are stored under {tenant_id}/ prefix.';


-- ------------------------------------------------------------
-- 6.1 BUCKET: models (private — 3D model files)
-- ------------------------------------------------------------
-- Only the owning tenant can read, write, and delete model files.
-- No public access — models contain proprietary customer data.

CREATE POLICY "models_select_tenant"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'models'
    AND get_storage_tenant_id(name) = get_request_tenant_id()
  );

CREATE POLICY "models_insert_tenant"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'models'
    AND get_storage_tenant_id(name) = get_request_tenant_id()
  );

CREATE POLICY "models_update_tenant"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'models'
    AND get_storage_tenant_id(name) = get_request_tenant_id()
  );

CREATE POLICY "models_delete_tenant"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'models'
    AND get_storage_tenant_id(name) = get_request_tenant_id()
  );


-- ------------------------------------------------------------
-- 6.2 BUCKET: documents (private — PDFs, invoices, etc.)
-- ------------------------------------------------------------
-- Only the owning tenant can read, write, and delete documents.
-- No public access — documents may contain PII and financial data.

CREATE POLICY "documents_storage_select_tenant"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents'
    AND get_storage_tenant_id(name) = get_request_tenant_id()
  );

CREATE POLICY "documents_storage_insert_tenant"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents'
    AND get_storage_tenant_id(name) = get_request_tenant_id()
  );

CREATE POLICY "documents_storage_update_tenant"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'documents'
    AND get_storage_tenant_id(name) = get_request_tenant_id()
  );

CREATE POLICY "documents_storage_delete_tenant"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'documents'
    AND get_storage_tenant_id(name) = get_request_tenant_id()
  );


-- ------------------------------------------------------------
-- 6.3 BUCKET: branding (public read — logos, favicons)
-- ------------------------------------------------------------
-- Public read: embedded widgets need to load tenant logos
-- and branding assets without authentication.
-- Writes are tenant-scoped: only the owning tenant can upload,
-- update, or delete their branding assets.

CREATE POLICY "branding_storage_select_public"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'branding'
  );

CREATE POLICY "branding_storage_insert_tenant"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'branding'
    AND get_storage_tenant_id(name) = get_request_tenant_id()
  );

CREATE POLICY "branding_storage_update_tenant"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'branding'
    AND get_storage_tenant_id(name) = get_request_tenant_id()
  );

CREATE POLICY "branding_storage_delete_tenant"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'branding'
    AND get_storage_tenant_id(name) = get_request_tenant_id()
  );


-- ============================================================
-- SECTION 7: POLICY VERIFICATION QUERIES
-- ============================================================
-- Run these queries to verify that all policies are correctly
-- applied. Uncomment and execute manually.

-- 7.1 List all RLS policies grouped by table:
--
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, cmd;

-- 7.2 Verify FORCE RLS is enabled on all tables:
--
-- SELECT relname, relrowsecurity, relforcerowsecurity
-- FROM pg_class
-- WHERE relname IN (
--   'tenants', 'pricing_configs', 'materials', 'fees', 'customers',
--   'orders', 'order_items', 'order_activity', 'audit_log',
--   'analytics_events', 'coupons', 'shipping_methods', 'email_templates',
--   'email_logs', 'branding', 'widget_configs', 'dashboard_configs',
--   'team_members', 'form_configs', 'express_tiers', 'kanban_configs',
--   'documents', 'feature_flags', 'api_keys', 'chat_messages'
-- )
-- ORDER BY relname;

-- 7.3 Test tenant isolation (should return 0 rows with wrong tenant):
--
-- SET LOCAL request.headers = '{"x-tenant-id":"nonexistent-tenant"}';
-- SELECT count(*) FROM pricing_configs;  -- Expected: 0
--
-- SET LOCAL request.headers = '{"x-tenant-id":"demo-tenant"}';
-- SELECT count(*) FROM pricing_configs;  -- Expected: rows for demo-tenant

-- 7.4 Verify no permissive _anon policies remain:
--
-- SELECT policyname FROM pg_policies
-- WHERE policyname LIKE '%_anon'
-- AND schemaname = 'public';
-- -- Expected: 0 rows

-- 7.5 List storage bucket policies:
--
-- SELECT policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'storage' AND tablename = 'objects'
-- ORDER BY policyname;

COMMIT;


-- ============================================================
-- SECTION 8: POLICY SUMMARY
-- ============================================================
--
-- TABLE                 | SELECT | INSERT | UPDATE | DELETE | NOTES
-- ----------------------|--------|--------|--------|--------|------
-- tenants               | own    | -      | own    | -      | No INSERT (service role only), no DELETE
-- pricing_configs       | tenant | tenant | tenant | tenant | Standard CRUD
-- materials             | tenant | tenant | tenant | tenant | Standard CRUD
-- fees                  | tenant | tenant | tenant | tenant | Standard CRUD
-- customers             | tenant | tenant | tenant | tenant | Standard CRUD
-- orders                | tenant | tenant | tenant | tenant | Standard CRUD
-- order_items           | tenant | tenant | tenant | tenant | Standard CRUD
-- order_activity        | tenant | tenant | -      | -      | Append-only (immutable history)
-- audit_log             | tenant | tenant | -      | -      | Append-only (immutable audit trail)
-- analytics_events      | tenant | tenant | -      | -      | Append-only (immutable analytics)
-- coupons               | tenant | tenant | tenant | tenant | Standard CRUD
-- shipping_methods      | tenant | tenant | tenant | tenant | Standard CRUD
-- email_templates       | tenant | tenant | tenant | tenant | Standard CRUD
-- email_logs            | tenant | tenant | -      | -      | Append-only (immutable email log)
-- branding              | PUBLIC | tenant | tenant | tenant | Public read for widget embedding
-- widget_configs        | PUBLIC | tenant | tenant | tenant | Public read for widget loading
-- dashboard_configs     | tenant | tenant | tenant | tenant | Standard CRUD
-- team_members          | tenant | tenant | tenant | tenant | Standard CRUD
-- form_configs          | tenant | tenant | tenant | tenant | Standard CRUD
-- express_tiers         | tenant | tenant | tenant | tenant | Standard CRUD
-- kanban_configs        | tenant | tenant | tenant | tenant | Standard CRUD
-- documents             | tenant | tenant | tenant | tenant | Standard CRUD
-- feature_flags         | tenant | tenant | tenant | tenant | Standard CRUD
-- api_keys              | tenant | tenant | tenant | tenant | Contains key_hash only
-- chat_messages         | tenant | tenant | tenant | tenant | Standard CRUD
--
-- STORAGE BUCKET        | SELECT | INSERT | UPDATE | DELETE | NOTES
-- ----------------------|--------|--------|--------|--------|------
-- models (private)      | tenant | tenant | tenant | tenant | Path prefix: {tenant_id}/
-- documents (private)   | tenant | tenant | tenant | tenant | Path prefix: {tenant_id}/
-- branding (public)     | PUBLIC | tenant | tenant | tenant | Public read for widget logos
--
-- LEGEND:
--   tenant = tenant_id::text = get_request_tenant_id()
--   own    = slug = get_request_tenant_id() (tenants table only)
--   PUBLIC = USING (true) — no auth required
--   -      = No policy (operation denied by RLS)
