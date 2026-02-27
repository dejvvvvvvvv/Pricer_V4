# 097-SB — UPRAVY: Supabase RLS deployment via MCP + Dual-Write Activation Guide rewrite

| Parametr | Hodnota |
|----------|---------|
| **ID** | 097-SB |
| **Datum** | 2026-02-27 |
| **Session** | S05 |
| **Oblast** | Supabase — RLS deployment, migrace, dokumentace |
| **Souvisejici** | 091-SB, 095-SB, 096-SB |

---

## Shrnutí

Session S05 obsahovala 3 hlavní deliverable:

1. **Supabase MCP test** — overeni pristupu k projektu, 25 tabulek konfirmovano
2. **RLS Policy deployment** — 4 migrace pres Supabase MCP, 102 tenant-scoped politik nasazeno a overeno
3. **Dual-Write Activation Guide rewrite** — 820 radku → 200 radku, 6 fazi → 7 casti (A-G), step-by-step format

---

## 1. Supabase MCP Test

### Zavolane MCP operace

| Operace | Vysledek | Poznamka |
|---------|----------|----------|
| `list_projects` | Model Pricer (mywfgjoaigtzzxksbqzz) ACTIVE_HEALTHY | Projekt nalezen, health check PASS |
| `list_tables` | 25 tabulek s RLS enabled | Vsechny tabulky existuji a RLS je zapnuto |
| `list_extensions` | OK | Extensions overeny |

### Zisteni — RLS Audit
- **99 starych `_anon` politik** s `USING(true)` — plne otevrene
- **0 production tenant-scoped politik** — P0 security issue
- **12 starych storage bucket politik** — 4 na kazdy bucket (models, documents, branding)

---

## 2. Aplikace 102 RLS Politik pres MCP (4 Migrace)

### Migrace 1: `production_rls_step1_functions_and_cleanup`

**Nove funkce:**
- `get_request_tenant_id()` — dual-mode:
  - Priorita 1: JWT claims `x-tenant-id`
  - Priorita 2: HTTP header `x-tenant-id`
  - NO fallback (vypada vyjimka)

**Cleanup — DROP stare politiky:**
- 99 `_anon` politiky z public schema (loop DO $$ block)
- 12 starych storage bucket politik (4 na kazdy: models, documents, branding)

**Force RLS na 25 tabulkach:**
```
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
```

### Migrace 2: `production_rls_step2_special_tables`

**Special-case tabulky (read-only/append-only/public):**

| Tabulka | Politiky | Popis |
|---------|----------|-------|
| tenants | SELECT + UPDATE | SELECT: vlastni slug; UPDATE: pouze slug pole |
| audit_log | SELECT + INSERT | Append-only, immutable |
| analytics_events | SELECT + INSERT | Append-only, immutable |
| branding | SELECT (public) + INSERT/UPDATE/DELETE | Public select pro widgety, tenant-scoped write |
| widget_configs | SELECT (public) + INSERT/UPDATE/DELETE | Public select pro embed, tenant-scoped write |
| order_activity | SELECT + INSERT | Append-only, immutable |
| email_logs | SELECT + INSERT | Append-only, immutable |
| api_keys | SELECT + INSERT + UPDATE + DELETE | Plny tenant-scoped CRUD |

### Migrace 3: `production_rls_step3_standard_crud_tables`

**17 tabulek × 4 operace (SELECT/INSERT/UPDATE/DELETE):**

```
pricing_configs, materials, fees, customers, orders, order_items,
coupons, shipping_methods, email_templates, dashboard_configs,
team_members, form_configs, express_tiers, kanban_configs,
documents, feature_flags, chat_messages
```

**Jednotna politika pro vsechny:**
```sql
tenant_id::text = get_request_tenant_id()
```

**UPDATE politika (dual USING + WITH CHECK):**
- USING: checka se tenant_id
- WITH CHECK: checka se tenant_id (prevence reassignment)

### Migrace 4: `production_rls_step4_storage_buckets`

**Nova helper funkce:**
```sql
get_storage_tenant_id(object_name TEXT)
```
- Extrahuje tenant ID z prvniho segmentu cesty (format: `{tenant_id}/{rest}`)

**Bucket `models` (private):**
- SELECT, INSERT, UPDATE, DELETE — tenant-scoped

**Bucket `documents` (private):**
- SELECT, INSERT, UPDATE, DELETE — tenant-scoped

**Bucket `branding` (public read):**
- SELECT: public (bez podminky)
- INSERT, UPDATE, DELETE: tenant-scoped

---

## 3. Verifikace RLS

### Kontrolni dotazy (spusteny post-deployment)

| Kontrola | Vysledek |
|----------|----------|
| Stare `_anon` policies | 0 remaining ✓ |
| Nove tenant-scoped policies (public schema) | 90 ✓ |
| Storage bucket policies | 12 ✓ |
| FORCE RLS na tabulkach | true/true na vzorku (tenants, pricing_configs, materials, fees, customers, orders, audit_log, branding, widget_configs) ✓ |
| **Celkem politiky** | **102** ✓ |

---

## 4. Upravene soubory — Dual-Write Activation Guide Rewrite

### Soubor
- **Cesta:** `docs/claude/PLANS/Dual-Write-Activation-Guide.md`
- **Puvodni:** 820 radku, 6 technickych fazi, hodne kodu a konzole prikazu
- **Novy:** ~200 radku, 7 casti (A-G), step-by-step format

### Zmeny

| Cast | Obsah | Radky |
|------|-------|-------|
| A | Firebase registrace v Supabase Dashboard (3 kroky) | 25-30 |
| B | Overeni ze vsechno funguje (4 kroky) | 32-45 |
| C | Spusteni stranka migrace (/admin/migration) | 47-55 |
| D | Zapnuti dual-write (2 kroky) | 57-65 |
| E | Migrace existujicich dat (2 kroky) | 67-75 |
| F | Overeni dat v Supabase | 77-85 |
| G | Test tenant izolace (volitelne) | 87-100 |
| — | Zachrana: 3 varianty rollbacku | 105-145 |
| — | Kontrolni seznam na konci | 150-155 |

### Klicove zmeny
1. **Odstranen RLS deployment** — uz je hotov pres MCP (viz Migrace 1-4)
2. **Zjednoduseny jazyk** — srozumitelnejsi pro bezne uzivatele
3. **Step-by-step format** — snadnější sledovani postupu
4. **3 varianty rollbacku** — feature-flag reset, data reset, schema reset

---

## Upravene soubory — Sumarni seznam

| # | Soubor | Zmena | Typ |
|---|--------|-------|-----|
| 1 | `docs/claude/PLANS/Dual-Write-Activation-Guide.md` | Rewrite: 820→200 radku, 6 fazi→7 casti A-G, step-by-step | UPRAVY |

**Pozn.:** RLS schema byl aplikovan pres MCP `apply_migration`, nikoliv pres git commit.

---

## Kontrolni seznam — P0 Verifkace

- [x] Supabase MCP pristup OK (projekt, tabulky, extensions)
- [x] 102 RLS politiky aplikovany a overeny
- [x] 99 starych `_anon` politiky smazany
- [x] 25 tabulek nastaveno na FORCE RLS
- [x] Storage buckety zabezpeceny
- [x] Dual-Write Guide presypsany a zjednoduseny
- [x] Build proc nesouviseje s RLS

---

##Related Sessions

- **095-SB:** Kompletni Supabase migrace & tenant izolace sprint (18 deliverables, pending user actions)
- **096-SB:** RLS Deploy via MCP iniciace
- **091-SB:** CP2 implementace — backend security, RLS policies scaffolding

---

> Zaznam: 2026-02-27, S05, mp-spec-docs-historie (haiku)
