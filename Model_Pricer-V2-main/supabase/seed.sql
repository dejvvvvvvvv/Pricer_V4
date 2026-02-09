-- ============================================================
-- ModelPricer V3 — Seed Data for Clean Installations
-- ============================================================
-- Run this AFTER schema.sql to populate demo data.
-- Safe to re-run (uses ON CONFLICT DO NOTHING).
-- ============================================================

-- Get demo tenant ID
DO $$
DECLARE
  demo_tid UUID;
BEGIN
  SELECT id INTO demo_tid FROM tenants WHERE slug = 'demo-tenant';

  IF demo_tid IS NULL THEN
    INSERT INTO tenants (slug, name, plan_name)
    VALUES ('demo-tenant', 'Demo Tenant', 'Starter')
    RETURNING id INTO demo_tid;
  END IF;

  -- Seed default pricing config
  INSERT INTO pricing_configs (tenant_id, namespace, data, schema_version)
  VALUES (
    demo_tid,
    'pricing:v3',
    '{
      "schema_version": 3,
      "materials": [
        {"id": "mat-pla", "key": "pla", "name": "PLA", "enabled": true, "price_per_gram": 0.6, "colors": []},
        {"id": "mat-petg", "key": "petg", "name": "PETG", "enabled": true, "price_per_gram": 0.8, "colors": []},
        {"id": "mat-abs", "key": "abs", "name": "ABS", "enabled": true, "price_per_gram": 0.7, "colors": []}
      ],
      "default_material_key": "pla",
      "tenant_pricing": {
        "rate_per_hour": 150,
        "min_billed_minutes_enabled": false,
        "min_billed_minutes_value": 30,
        "min_price_per_model_enabled": false,
        "min_price_per_model_value": 99,
        "min_order_total_enabled": false,
        "min_order_total_value": 199,
        "rounding_enabled": false,
        "rounding_step": 5,
        "rounding_mode": "nearest",
        "smart_rounding_enabled": true,
        "markup_enabled": false,
        "markup_mode": "flat",
        "markup_value": 20,
        "markup_min_flat": 20
      },
      "volume_discounts": {
        "enabled": false,
        "mode": "percent",
        "scope": "per_model",
        "tiers": []
      }
    }'::jsonb,
    3
  )
  ON CONFLICT (tenant_id, namespace) DO NOTHING;

  -- Seed default fees config
  INSERT INTO fees (tenant_id, namespace, data, schema_version)
  VALUES (
    demo_tid,
    'fees:v3',
    '{"schema_version": 3, "fees": []}'::jsonb,
    3
  )
  ON CONFLICT (tenant_id, namespace) DO NOTHING;

  -- Seed default branding
  INSERT INTO branding (tenant_id, namespace, data)
  VALUES (
    demo_tid,
    'branding',
    '{
      "businessName": "Moje 3D tiskarna",
      "tagline": "Rychla kalkulace a objednavka",
      "logo": null,
      "primaryColor": "#2563EB",
      "secondaryColor": "#10B981",
      "backgroundColor": "#FFFFFF",
      "fontFamily": "Inter",
      "showLogo": true,
      "showBusinessName": true,
      "showTagline": true,
      "showPoweredBy": true,
      "cornerRadius": 12
    }'::jsonb
  )
  ON CONFLICT (tenant_id, namespace) DO NOTHING;

  -- Seed default materials (relational)
  INSERT INTO materials (tenant_id, key, name, enabled, price_per_gram, sort_order)
  VALUES
    (demo_tid, 'pla', 'PLA', true, 0.6, 1),
    (demo_tid, 'petg', 'PETG', true, 0.8, 2),
    (demo_tid, 'abs', 'ABS', true, 0.7, 3)
  ON CONFLICT (tenant_id, key) DO NOTHING;

  -- Seed shipping methods
  INSERT INTO shipping_methods (tenant_id, namespace, data)
  VALUES (
    demo_tid,
    'shipping:v1',
    '{"methods": []}'::jsonb
  )
  ON CONFLICT (tenant_id, namespace) DO NOTHING;

  -- Seed empty configs
  INSERT INTO coupons (tenant_id, namespace, data)
  VALUES (demo_tid, 'coupons:v1', '{"coupons": []}'::jsonb)
  ON CONFLICT (tenant_id, namespace) DO NOTHING;

  INSERT INTO express_tiers (tenant_id, namespace, data)
  VALUES (demo_tid, 'express:v1', '{"tiers": []}'::jsonb)
  ON CONFLICT (tenant_id, namespace) DO NOTHING;

  INSERT INTO email_templates (tenant_id, namespace, data)
  VALUES (demo_tid, 'email:v1', '{"templates": []}'::jsonb)
  ON CONFLICT (tenant_id, namespace) DO NOTHING;

  INSERT INTO form_configs (tenant_id, namespace, data)
  VALUES (demo_tid, 'form:v1', '{"fields": []}'::jsonb)
  ON CONFLICT (tenant_id, namespace) DO NOTHING;

  INSERT INTO kanban_configs (tenant_id, namespace, data)
  VALUES (demo_tid, 'kanban:v1', '{"columns": []}'::jsonb)
  ON CONFLICT (tenant_id, namespace) DO NOTHING;

  INSERT INTO dashboard_configs (tenant_id, namespace, data)
  VALUES (demo_tid, 'dashboard:v2', '{"cards": []}'::jsonb)
  ON CONFLICT (tenant_id, namespace) DO NOTHING;

  INSERT INTO widget_configs (tenant_id, namespace, data)
  VALUES (demo_tid, 'widgets', '[]'::jsonb)
  ON CONFLICT (tenant_id, namespace) DO NOTHING;

  INSERT INTO team_members (tenant_id, namespace, data)
  VALUES
    (demo_tid, 'team_users', '[]'::jsonb),
    (demo_tid, 'team_invites', '[]'::jsonb)
  ON CONFLICT (tenant_id, namespace) DO NOTHING;

END $$;
