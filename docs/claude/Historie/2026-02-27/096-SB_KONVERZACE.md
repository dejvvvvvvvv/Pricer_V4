# 096-SB — KONVERZACE — RLS Deploy via MCP + Dual-Write Guide Rewrite — 2026-02-27

## Metadata
- **ID:** 096-SB
- **Session:** S05
- **Datum:** 2026-02-27
- **Oblast:** Supabase RLS deployment, dokumentace
- **Souvisejici ID:** 091-SB (CP2 RLS policies napsany), 094-SB (auth bridge), 095-SB (sprint kompletni)

---

## Tema session

Uzivatel pripojil Supabase MCP plugin a pozadal o provedeni manualnich kroku ktere byly drive oznaceny jako "pending user actions". Hlavni uspech: 102 production RLS politik nasazeno primo pres MCP (bez nutnosti Supabase Dashboard). Nasledne prepsan Dual-Write-Activation-Guide.md na srozumitelny krok-po-kroku guide.

---

## Prubeh konverzace

### [1] Uzivatel
> zkus zda funguje supabase mcp

### [1] Claude
- Zavolal `list_projects` pres Supabase MCP
- Vysledek: Projekt "Model Pricer" (ID: mywfgjoaigtzzxksbqzz), region eu-central-1, status ACTIVE_HEALTHY, PostgreSQL 17.6.1
- **MCP funguje spravne**

### [2] Uzivatel
> super, a muzes tim padem nyni udelat ty veci ktere jsi po me chtel?
> Jakoby toto - Zbyvajici manualni kroky:
> 1. Supabase Dashboard > Authentication > Third-party auth > Add Firebase > Project ID: model-pricer
> 2. SQL Editor > paste supabase/rls-policies-production.sql > Run
> 3. Test > login > over /api/auth/claims vrati role: 'authenticated' + tenant_id
> 4. Aktivace dual-write > /admin/migration UI
> Ale vice se muzes dozvedet v historii

### [2] Claude
**Analyza a priprava:**
- Precetl `rls-policies-production.sql` (917 radku) z `Model_Pricer-V2-main/supabase/`
- Precetl historii 095-SB pro kontext
- Zavolal `list_tables` — potvrzeno 25 tabulek s RLS enabled
- Zkontroloval aktualni stav: 99 starych `_anon` politik (vsechny s `USING(true)` = plne otevrene)
- Zkontroloval ze zadne production politiky jeste neexistuji

**Aplikace RLS v 4 migracnich krocich:**

1. **Step 1: production_rls_step1_functions_and_cleanup** — SUCCESS
   - Vytvoreni `get_request_tenant_id()` funkce (dual-mode: JWT + header)
   - `FORCE ROW LEVEL SECURITY` na 25 tabulkach
   - DROP vsech 99 starych `_anon` politik
   - DROP 12 starych storage bucket politik

2. **Step 2: production_rls_step2_special_tables** — SUCCESS
   - tenants: SELECT/UPDATE vlastniho tenantu (slug-based)
   - audit_log, analytics_events, order_activity, email_logs: append-only (SELECT + INSERT)
   - branding, widget_configs: verejny SELECT + tenant-scoped write
   - api_keys: plny CRUD tenant-scoped

3. **Step 3: production_rls_step3_standard_crud_tables** — SUCCESS
   - 17 tabulek × 4 operace (SELECT/INSERT/UPDATE/DELETE)
   - pricing_configs, materials, fees, customers, orders, order_items, coupons, shipping_methods, email_templates, dashboard_configs, team_members, form_configs, express_tiers, kanban_configs, documents, feature_flags, chat_messages

4. **Step 4: production_rls_step4_storage_buckets** — SUCCESS
   - `get_storage_tenant_id()` helper funkce
   - models (private): 4 tenant-scoped policies
   - documents (private): 4 tenant-scoped policies
   - branding (public read): 1 public SELECT + 3 tenant-scoped

**Verifikace:**
- Stare `_anon` policies: **0 remaining**
- Nove tenant-scoped policies: **90** (public schema)
- Storage bucket policies: **12**
- FORCE RLS: **true/true** na vsech tabulkach (sample check)
- **Celkem: 102 RLS politik aplikovano**

**Zbyva:**
- Firebase Third-Party Auth — MCP nepodporuje, musi se udelat rucne v Dashboard
- Test auth bridge — zavisi na bezicim dev serveru
- Dual-write aktivace — zavisi na auth bridge

### [3] Uzivatel
> uprav mi ten dokument Dual-Write-Activation-Guide.md ktery byl urceny k tomuto aby tam bylo jen to co mam otestovat v prohlizeci, napis Step by Step neboli krok po kroku kazdou cast aby to bylo co nejlepe pochopitelne

### [3] Claude
- Precetl puvodni dokument (820 radku, 6 fazi, hodne technickeho detailu)
- Prepsal na 7 casti (A-G), kazda se step-by-step kroky:
  - **CAST A:** Firebase registrace v Supabase Dashboard (3 kroky)
  - **CAST B:** Overeni ze vsechno funguje (4 kroky: app, login, auth bridge, tenant ID)
  - **CAST C:** Stranka migrace (4 kroky: pripojeni, zaloha, dry-run, storage mody)
  - **CAST D:** Zapnuti dual-write (2 kroky + troubleshooting)
  - **CAST E:** Migrace existujicich dat (2 kroky)
  - **CAST F:** Overeni dat v Supabase (2 kroky: dashboard + app)
  - **CAST G:** Test tenant izolace (volitelne, SQL test)
  - **Zachrana:** 3 varianty rollbacku (tlacitko, zaloha, "napis mi")
  - **Kontrolni seznam** na konci
- Odstranen RLS deployment (uz hotov pres MCP)
- Odlozena Faze 6 (Supabase-only) — zminka jen na konci
- Zjednoduseny jazyk — srozumitelne i pro zacatecnika

### [4] Uzivatel
> uloz historii

---

## Rozhodnuti ucinena

| # | Rozhodnuti | Kontext |
|---|-----------|---------|
| 1 | RLS deploy pres MCP migration API (ne SQL Editor) | Tracked migrations, idempotentni, 4 kroky |
| 2 | Rozdeleni RLS na 4 migrace (ne 1 velky skript) | Bezpecnejsi, lepsí debugging, kazdy krok verifikovatelny |
| 3 | Dual-Write guide prepsan na step-by-step | Uzivatel pozadoval srozumitelnost, puvodnich 820 radku bylo prilis technickych |

---

## Upravene soubory

| Soubor | Zmena |
|--------|-------|
| `docs/claude/PLANS/Dual-Write-Activation-Guide.md` | Kompletni rewrite (820 → ~200 radku, 7 casti A-G) |

## Supabase migrace (pres MCP)

| Migrace | Nazev | Obsah |
|---------|-------|-------|
| 1 | `production_rls_step1_functions_and_cleanup` | get_request_tenant_id(), FORCE RLS, DROP 99+12 anon politik |
| 2 | `production_rls_step2_special_tables` | 8 specialnich tabulek (tenants, audit, analytics, branding, widget, order_activity, email_logs, api_keys) |
| 3 | `production_rls_step3_standard_crud_tables` | 17 standardnich CRUD tabulek |
| 4 | `production_rls_step4_storage_buckets` | get_storage_tenant_id(), 3 buckety (models, documents, branding) |

---

## Otevrene otazky

- [ ] Firebase Third-Party Auth registrace v Supabase Dashboard (manualne)
- [ ] Test auth bridge po Firebase registraci
- [ ] Dual-write aktivace a migrace dat

---

## Navaznost

- **Predchozi:** 095-SB (kompletni sprint konverzace)
- **Nasledujici:** Uzivatel provede CAST A (Firebase registrace) → pak CAST B-G (testovani + dual-write)

---

**Zaznameno:** Claude Opus 4.6
**Cas:** 2026-02-27
