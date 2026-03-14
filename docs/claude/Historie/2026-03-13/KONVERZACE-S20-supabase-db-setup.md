---
id: 045-SDB
session: S20
type: KONVERZACE
date: 2026-03-13
---

# S20: Supabase Database Complete Setup

## Co se dělo
Uživatel požádal o kompletní nastavení Supabase databáze pro celý projekt ModelPricer V3.

## Rozhodnutí
1. Jen Supabase (žádný dual-write s localStorage)
2. Všech 36 tabulek najednou, od nejkritičtějších
3. Backend orders by měl zapisovat přímo do Supabase (rozhodnutí: ano, výhodnější)
4. Každý nový tenant automaticky dostane PLA material + default pricing

## Provedené změny

### Supabase Migrace (8 migrací):
- 001: tenants + get_request_tenant_id() helper + set_updated_at() trigger
- 003: FIX P0 SECURITY - všechny INSERT RLS politiky opraveny (přidán WITH CHECK tenant constraint)
- 004: 11 chybějících tabulek (settings, payment_configs, ecommerce_configs, notifications, print_queue, invoices, company_data, order_views, order_tags, email_send_log, activity_log)
- 005: seed_tenant_defaults() funkce + auto-trigger na tenants INSERT
- 007: FIX P0 SECURITY - storage bucket INSERT politiky opraveny + file size limits
- 008: Fix seed funkce (materials nemá density sloupec)

### Finální stav DB:
- 36 tabulek (25 existujících + 11 nových), všechny s RLS
- 135 RLS politik (všechny INSERT mají WITH CHECK)
- 3 storage buckety (models 50MB, documents 10MB, branding 5MB public)
- 12 storage RLS politik
- Auto-seed: PLA material, pricing config, branding, settings, fees

### Frontend změny:
- `src/lib/supabase/storageAdapter.js` — přidáno 14 nových namespace→tabulka mapování
- `src/lib/supabase/featureFlags.js` — registrováno 14 nových namespaces

## P0 Security fixes:
- Všechny INSERT politiky měly chybějící WITH CHECK — kdokoli mohl vložit data s cizím tenant_id
- Storage bucket INSERT politiky stejný problém — opraveno
