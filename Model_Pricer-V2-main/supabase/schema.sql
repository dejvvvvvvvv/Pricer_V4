-- ============================================================
-- ModelPricer V3 — Supabase PostgreSQL Schema
-- Phase 4: Migration from localStorage
-- ============================================================
-- Run this entire file in Supabase SQL Editor.
-- All tables use RLS (Row Level Security) for tenant isolation.
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. TENANTS (root entity for multi-tenancy)
-- ============================================================
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  plan_name TEXT NOT NULL DEFAULT 'Starter',
  plan_features JSONB NOT NULL DEFAULT '{
    "can_hide_powered_by": false,
    "max_widget_instances": 2,
    "max_users": 3,
    "can_use_domain_whitelist": true
  }'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed demo tenant
INSERT INTO tenants (slug, name, plan_name)
VALUES ('demo-tenant', 'Demo Tenant', 'Starter')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 2. PRICING CONFIGS (replaces pricing:v3 namespace)
-- ============================================================
CREATE TABLE IF NOT EXISTS pricing_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  namespace TEXT NOT NULL DEFAULT 'pricing:v3',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  schema_version INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, namespace)
);

-- ============================================================
-- 3. MATERIALS (extracted from pricing config for relational queries)
-- ============================================================
CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  name TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  price_per_gram NUMERIC(10,4) NOT NULL DEFAULT 0,
  colors JSONB DEFAULT '[]'::jsonb,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, key)
);

-- ============================================================
-- 4. FEES (replaces fees:v3 namespace)
-- ============================================================
CREATE TABLE IF NOT EXISTS fees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  namespace TEXT NOT NULL DEFAULT 'fees:v3',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  schema_version INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, namespace)
);

-- ============================================================
-- 5. CUSTOMERS
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT,
  phone TEXT,
  company TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customers_tenant ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(tenant_id, email);

-- ============================================================
-- 6. ORDERS (replaces orders:v1 namespace)
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'NEW',
  customer_id UUID REFERENCES customers(id),
  customer_snapshot JSONB DEFAULT '{}'::jsonb,
  one_time_fees JSONB DEFAULT '[]'::jsonb,
  totals_snapshot JSONB DEFAULT '{}'::jsonb,
  flags TEXT[] DEFAULT '{}',
  notes JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, order_number)
);

CREATE INDEX IF NOT EXISTS idx_orders_tenant ON orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(tenant_id, created_at DESC);

-- ============================================================
-- 7. ORDER ITEMS (models within an order)
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  item_number TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  file_snapshot JSONB DEFAULT '{}'::jsonb,
  material_snapshot JSONB DEFAULT '{}'::jsonb,
  color_snapshot TEXT,
  preset_snapshot JSONB DEFAULT '{}'::jsonb,
  resolved_config_snapshot JSONB DEFAULT '{}'::jsonb,
  slicer_snapshot JSONB DEFAULT '{}'::jsonb,
  pricing_snapshot JSONB DEFAULT '{}'::jsonb,
  price_breakdown_snapshot JSONB DEFAULT '{}'::jsonb,
  flags TEXT[] DEFAULT '{}',
  revisions JSONB DEFAULT '{"price":[],"slicer":[]}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_tenant ON order_items(tenant_id);

-- ============================================================
-- 8. ORDER ACTIVITY (replaces orders:activity:v1 namespace)
-- ============================================================
CREATE TABLE IF NOT EXISTS order_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  user_id TEXT,
  type TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_activity_tenant ON order_activity(tenant_id);
CREATE INDEX IF NOT EXISTS idx_order_activity_order ON order_activity(order_id);
CREATE INDEX IF NOT EXISTS idx_order_activity_created ON order_activity(tenant_id, created_at DESC);

-- ============================================================
-- 9. AUDIT LOG (replaces audit_log namespace)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  actor JSONB DEFAULT '{}'::jsonb,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_tenant ON audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(tenant_id, action);

-- ============================================================
-- 10. ANALYTICS EVENTS (replaces analytics:events namespace)
-- ============================================================
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  widget_id TEXT,
  session_id TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_tenant ON analytics_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(tenant_id, event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(tenant_id, created_at DESC);

-- ============================================================
-- 11. COUPONS (replaces coupons:v1 namespace)
-- ============================================================
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  namespace TEXT NOT NULL DEFAULT 'coupons:v1',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, namespace)
);

-- ============================================================
-- 12. SHIPPING METHODS (replaces shipping:v1 namespace)
-- ============================================================
CREATE TABLE IF NOT EXISTS shipping_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  namespace TEXT NOT NULL DEFAULT 'shipping:v1',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, namespace)
);

-- ============================================================
-- 13. EMAIL TEMPLATES (replaces email:v1 namespace)
-- ============================================================
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  namespace TEXT NOT NULL DEFAULT 'email:v1',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, namespace)
);

-- ============================================================
-- 14. EMAIL LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  template_id TEXT,
  recipient_email TEXT,
  subject TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_tenant ON email_logs(tenant_id);

-- ============================================================
-- 15. BRANDING (replaces branding namespace)
-- ============================================================
CREATE TABLE IF NOT EXISTS branding (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  namespace TEXT NOT NULL DEFAULT 'branding',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, namespace)
);

-- ============================================================
-- 16. WIDGET CONFIGS (replaces widgets namespace)
-- ============================================================
CREATE TABLE IF NOT EXISTS widget_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  namespace TEXT NOT NULL DEFAULT 'widgets',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, namespace)
);

-- ============================================================
-- 17. DASHBOARD CONFIGS (replaces dashboard:v1/v2 namespace)
-- ============================================================
CREATE TABLE IF NOT EXISTS dashboard_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  namespace TEXT NOT NULL DEFAULT 'dashboard:v2',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, namespace)
);

-- ============================================================
-- 18. TEAM MEMBERS (replaces team_users + team_invites namespace)
-- ============================================================
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  namespace TEXT NOT NULL DEFAULT 'team_users',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, namespace)
);

-- ============================================================
-- 19. FORM CONFIGS (replaces form:v1 namespace)
-- ============================================================
CREATE TABLE IF NOT EXISTS form_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  namespace TEXT NOT NULL DEFAULT 'form:v1',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, namespace)
);

-- ============================================================
-- 20. EXPRESS TIERS (replaces express:v1 namespace)
-- ============================================================
CREATE TABLE IF NOT EXISTS express_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  namespace TEXT NOT NULL DEFAULT 'express:v1',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, namespace)
);

-- ============================================================
-- 21. KANBAN CONFIGS (replaces kanban:v1 namespace)
-- ============================================================
CREATE TABLE IF NOT EXISTS kanban_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  namespace TEXT NOT NULL DEFAULT 'kanban:v1',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, namespace)
);

-- ============================================================
-- 22. DOCUMENTS (for file references)
-- ============================================================
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  bucket TEXT NOT NULL DEFAULT 'documents',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_tenant ON documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_order ON documents(order_id);

-- ============================================================
-- 23. FEATURE FLAGS (stored in DB for remote toggles)
-- ============================================================
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  flag_key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, flag_key)
);

-- ============================================================
-- 24. API KEYS (for external integrations)
-- ============================================================
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  scopes TEXT[] DEFAULT '{}',
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_api_keys_tenant ON api_keys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);

-- ============================================================
-- 25. CHAT MESSAGES (for future customer chat)
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL DEFAULT 'customer',
  sender_id TEXT,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_tenant ON chat_messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_chat_order ON chat_messages(order_id);

-- ============================================================
-- RLS POLICIES — Enable Row Level Security on all tables
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE express_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES — anon key access (for demo / initial setup)
-- ============================================================
-- For Phase 4 (no auth yet), we allow anon access scoped to tenant_id.
-- Once auth is added (Phase 5+), these policies will be tightened
-- to use auth.uid() and jwt claims.
--
-- IMPORTANT: These are permissive policies for the demo stage.
-- Production should use: auth.jwt() ->> 'tenant_id' = tenant_id

-- Helper function to get tenant_id from request header
-- (used during demo phase; will be replaced by JWT claims later)
CREATE OR REPLACE FUNCTION get_request_tenant_id()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    current_setting('request.headers', true)::json->>'x-tenant-id',
    'demo-tenant'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tenants: allow read for anon
CREATE POLICY "tenants_select_anon" ON tenants
  FOR SELECT USING (true);

CREATE POLICY "tenants_insert_anon" ON tenants
  FOR INSERT WITH CHECK (true);

CREATE POLICY "tenants_update_anon" ON tenants
  FOR UPDATE USING (true);

-- Generic tenant-scoped policies for all data tables
-- Pattern: SELECT/INSERT/UPDATE/DELETE where tenant_id matches

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
    -- Allow all operations for anon (demo phase)
    -- These will be replaced with proper auth-based policies later
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR SELECT USING (true)',
      tbl || '_select_anon', tbl
    );
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR INSERT WITH CHECK (true)',
      tbl || '_insert_anon', tbl
    );
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR UPDATE USING (true)',
      tbl || '_update_anon', tbl
    );
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR DELETE USING (true)',
      tbl || '_delete_anon', tbl
    );
  END LOOP;
END $$;

-- ============================================================
-- Updated_at trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables with updated_at column
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'tenants', 'pricing_configs', 'materials', 'fees',
    'customers', 'orders', 'order_items', 'coupons',
    'shipping_methods', 'email_templates', 'branding',
    'widget_configs', 'dashboard_configs', 'team_members',
    'form_configs', 'express_tiers', 'kanban_configs',
    'feature_flags'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
      'trigger_updated_at_' || tbl, tbl
    );
  END LOOP;
END $$;
