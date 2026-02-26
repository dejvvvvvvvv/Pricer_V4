# Supabase Migration & Tenant Isolation Sprint — Implementacni Plan

> **Datum:** 2026-02-26
> **Autor:** mp-spec-plan-manager (koordinator)
> **Status:** DRAFT — ceka na schvaleni
> **Odhadovana slozitost:** Stredni-Velka (6 pracovnich fazi + 6 kontrolnich fazi)

---

## 0) Shrnuti

Sprint ktery propoji existujici JS infrastrukturu (Supabase client, storageAdapter, featureFlags, migrationRunner, useStorageQuery, useSupabaseRealtime) s realnou Supabase databazi. Soucasti je oprava P0 bugu ve widgetu (tenant override nefunguje) a priprava auth bridgeovani Firebase -> Supabase.

**Cilem je:** localStorage funguje jako doted, ale data se zaroven zapisuji do Supabase (dual-write) a po overeni se prechod na Supabase-first cteni.

---

## 1) Scope

### IN SCOPE

| ID | Polozka | Priorita |
|----|---------|----------|
| A | **P0 Bug: Widget tenant override** — WidgetKalkulacka nedestruktuje `tenantId` prop | P0 |
| B | **Deploy DB schema** — Spusteni schema.sql, storage-policies.sql, seed.sql v Supabase | P0 |
| C | **Env setup** — .env.local s VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY | P0 |
| D | **Connection test** — Overeni ze Supabase client se pripoji uspesne | P1 |
| E | **Dual-write aktivace** — Prepnuti feature flags na dual-write pro kriticke namespace | P1 |
| F | **Data migrace** — Spusteni migrationRunner (dry-run -> migrace) pro existujici localStorage data | P1 |
| G | **Auth bridge** — Mapovani Firebase user.uid na Supabase tenant slug/uuid | P1 |
| H | **RLS tightening** — Nahrazeni anon RLS politik za auth-based (JWT claims) | P2 |
| I | **Realtime overeni** — Test useSupabaseRealtime hooku na orders/pricing tabulkach | P2 |

### OUT OF SCOPE

- Plna migrace na Supabase-only (zustava dual-write jako bezpecna faze)
- Supabase Auth nahrazujici Firebase Auth (to je separatni sprint)
- Storage buckety (models, documents, branding) — fyzicky upload souboru (jen SQL politiky)
- Nove admin stranky/features
- Zmeny v pricing engine logice
- Mobilni verze / PWA

---

## 2) Rizika a Mitigace

| # | Riziko | Pravdepodobnost | Dopad | Mitigace |
|---|--------|-----------------|-------|----------|
| R1 | Supabase tabulky neexistuji v projektu — schema.sql nebylo spusteno | Vysoka | P0 | Faze 1 explicitne deployne schema pres SQL Editor / Chrome MCP |
| R2 | RLS politiky blokuji anon pristup — data se nezapisi | Stredni | P0 | Schema pouziva permisivni anon politiky (demo faze); overit hned po deploy |
| R3 | Firebase UID neodpovida Supabase tenant slug — migrationRunner nenajde tenant | Vysoka | P1 | Pridat tenant registraci (upsert do `tenants` tabulky) pri login/startup |
| R4 | localStorage data format neodpovida Supabase schema — migrace selze | Nizka | P1 | migrationRunner ma dry-run + per-namespace error handling; backup pred migraci |
| R5 | Widget bude nacitat data z demo-tenant misto spravneho tenanta | Vysoka | P0 | Fix A primo v prvni fazi (highest priority) |
| R6 | Build break kvuli Supabase importum kdyz neni @supabase/supabase-js | Nizka | P0 | Je uz v package.json; overit `npm run build` |
| R7 | Dual-write spomaleni UX — kazdy save ceka na Supabase | Nizka | P1 | writeTenantJson uz pouziva fire-and-forget (async, ne-blokujici) |

---

## 3) Rollback Strategie

**3-urovnova ochrana:**

1. **Feature flag rollback:** `rollbackToLocalStorage()` z migrationRunner.js — okamzite prepne vsechny namespaces na localStorage mod. Data v localStorage zustala zachovana (dual-write je zapsal).

2. **Data backup:** Pred migraci se stahne JSON backup pres `backupLocalStorage()`. Backup obsahuje vsechny namespaces s plnymi daty. Ulozen jako downloadovany soubor.

3. **Schema revert:** Pokud je treba smazat Supabase data, kazda tabulka ma `ON DELETE CASCADE` z tenants. Smazani tenant radu smaze vsechna jeho data.

**Postup pri problemu:**
```
1. Okamzite: rollbackToLocalStorage() — app opet cte jen localStorage
2. Do 5 minut: Over ze app funguje normalne s localStorage
3. Investigace: Proved diagnostiku s Supabase dashboard
4. Oprava: Fix problem, re-enable dual-write
```

---

## 4) Predpoklady (Assumptions)

- **A1:** Supabase projekt existuje a je pristupny (URL + anon key jsou k dispozici). Pokud ne, Faze 1 bude obsahovat instrukce pro vytvoreni projektu.
- **A2:** Firebase Auth zustava primární auth provider. Supabase se pouziva POUZE pro data storage (ne auth).
- **A3:** Tenant slug = Firebase user.uid (jak bylo implementovano v Sprint 2025-02-24/25).
- **A4:** Demo-tenant slug se zachovava pro neautentifikovane scenare (test-kalkulacka, lokalni dev).
- **A5:** Chrome MCP je dostupny pro interakci se Supabase SQL Editorem. Pokud ne, SQL se spusti manualne.
- **A6:** `@supabase/supabase-js` je uz nainstalovany v package.json (overit v Fazi 1).

---

## Faze 1 — P0 Widget Bug Fix + Environment Setup (Pracovni)

### 1.1 Cil
Opravit P0 bug kde widget ignoruje `tenantId` prop a nastavit prostredi pro Supabase.

### 1.2 Detailni kroky

**Krok 1A — Widget Tenant Override Fix (P0)**

Bug v `Model_Pricer-V2-main/src/pages/widget-kalkulacka/index.jsx` radky 206-221:
- `WidgetKalkulacka` komponent NEDESTRUKTUJE `tenantId` z props
- `WidgetPublicPage.jsx` (radek 231) spravne predava `tenantId={tenantId}`
- Ale `WidgetKalkulacka` ho ignoruje a vola `loadPricingConfigV3()` / `loadFeesConfigV3()` BEZ override

**Oprava:**
1. Pridat `tenantId = null` do destrukce props WidgetKalkulacka (radek 206-221)
2. Zmenit radek 232: `loadPricingConfigV3()` na `loadPricingConfigV3(tenantId)`
3. Zmenit radek 233: `loadFeesConfigV3()` na `loadFeesConfigV3(tenantId)`
4. Overit ze vsechny dalsi volani storage helperu v WidgetKalkulacka predavaji tenantId

Relevantni soubory:
- `Model_Pricer-V2-main/src/pages/widget-kalkulacka/index.jsx` (hlavni oprava)
- `Model_Pricer-V2-main/src/pages/widget-public/WidgetPublicPage.jsx` (read-only overeni)
- `Model_Pricer-V2-main/src/utils/adminPricingStorage.js` (uz podporuje tenantIdOverride — OK)
- `Model_Pricer-V2-main/src/utils/adminFeesStorage.js` (uz podporuje tenantIdOverride — OK)

**Krok 1B — Environment Verification**

1. Overit ze `@supabase/supabase-js` je v `Model_Pricer-V2-main/package.json`
2. Overit/vytvorit `.env.local` s:
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGci...
   ```
3. Spustit `npm run build` — musi PASS
4. Overit ze Supabase client.js se vytvori s validni instanci (ne null)

**Krok 1C — Package.json Check**

Overit ze `@supabase/supabase-js` je v dependencies. Pokud ne, pridat.

### 1.3 Rozlozeni agentu pro Fazi 1

| Agent | Uloha | Paralelni? |
|-------|-------|------------|
| `mp-mid-frontend-widget` | Fix WidgetKalkulacka — destrukce tenantId prop, predani do load funkci | Ano (s env setup) |
| `mp-spec-storage-tenant-id` | Overeni ze tenantIdOverride funguje spravne v adminPricingStorage + adminFeesStorage | Ano (s widget fixem) |
| `mp-spec-infra-firebase` | Overeni .env.local, package.json dependencies, npm run build | Ano (s widget fixem) |

### 1.4 Acceptance Criteria

- [ ] WidgetKalkulacka destruktuje `tenantId` prop
- [ ] `loadPricingConfigV3(tenantId)` a `loadFeesConfigV3(tenantId)` volany s override
- [ ] `.env.local` obsahuje VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
- [ ] `npm run build` — PASS
- [ ] `@supabase/supabase-js` v package.json

---

## Faze 2 — Kontrolni kroky po Fazi 1

### Krok 1 — Ulozeni historie (pred testovanim)
Spustim agenta `mp-spec-docs-historie` pomoci Task toolu (model haiku, subagent_type general-purpose). Agent ulozi vsechny zmeny z Faze 1: oprava WidgetKalkulacka tenantId destructure, env setup, package.json overeni. POCKAM az agent kompletne dokonci ukladani — zadna dalsi akce pred jeho dokoncenim.

### Krok 2 — Testovani na webu
Po dokonceni ulozeni historie otestuju vsechny zmeny z Faze 1 v prohlizeci pomoci mcp__claude-in-chrome nastroju. Konkretne otestuju:
- **Widget public page** (`/w/<publicWidgetId>`) — nacte spravny tenant config? Zobrazi spravne ceny?
- **Test kalkulacka** (`/test-kalkulacka`) — stale funguje po zmenach?
- **DevTools console** — zadne errory ze Supabase clientu, warning pokud env neni nastaven je OK
- **npm run build output** — cistý build bez chyb
Ulozim snimky obrazovky a zapisu poznatky do .md souboru ve slozce docs/claude/Research/supabase-migration/.

### Krok 3 — Ulozeni historie (po testovani)
Znovu spustim agenta `mp-spec-docs-historie` pomoci Task toolu. Tentokrat agent ulozi POUZE vysledky testovani z Kroku 2 — snimky, poznatky, nalezene bugy. POCKAM az agent kompletne dokonci — zadna dalsi akce pred jeho dokoncenim.

### Krok 4 — Compact kontextu
Proved `/compact` pro uvolneni kontextoveho okna. Toto je posledni krok teto faze. Az po compactu pokracuju na Fazi 3.

---

## Faze 3 — Deploy DB Schema + Connection Test (Pracovni)

### 3.1 Cil
Vytvort tabulky v Supabase databazi a overit pripojeni z frontendu.

### 3.2 Detailni kroky

**Krok 3A — Schema Deployment**

Spustit SQL skripty v Supabase SQL Editor (pres Chrome MCP nebo manualne):

1. **schema.sql** (`Model_Pricer-V2-main/supabase/schema.sql`)
   - 25 tabulek s RLS
   - Permisivni anon politiky (demo faze)
   - `updated_at` triggery
   - UUID extension
   - Demo tenant seed (slug='demo-tenant')

2. **storage-policies.sql** (`Model_Pricer-V2-main/supabase/storage-policies.sql`)
   - Politiky pro 3 buckety: models, documents, branding
   - POZOR: Buckety musi byt vytvoreny PRED spustenim policies (manual step v Supabase dashboard)

3. **seed.sql** (`Model_Pricer-V2-main/supabase/seed.sql`)
   - Demo data: pricing, fees, branding, materials, shipping, coupons, etc.
   - Idempotentni (ON CONFLICT DO NOTHING)

**Poradi je dulezite:** schema.sql -> (rucne vytvorit buckety) -> storage-policies.sql -> seed.sql

**Krok 3B — Overeni tabulek**

Po deploy overit:
- `SELECT count(*) FROM tenants;` — musi byt >= 1 (demo-tenant)
- `SELECT count(*) FROM pricing_configs;` — musi byt >= 1
- `SELECT * FROM tenants WHERE slug = 'demo-tenant';` — overit ze existuje

**Krok 3C — Connection Test z Frontendu**

1. Spustit dev server (`npm run dev`)
2. Otevrit DevTools console
3. Zavolat manualne (v konzoli nebo pres AdminMigration stranku):
   ```js
   import { checkSupabaseConnection } from '@/lib/supabase/client';
   const result = await checkSupabaseConnection();
   console.log(result); // { ok: true } nebo { ok: false, error: '...' }
   ```
4. Alternativne: navstivit `/admin/migration` — AdminMigration.jsx automaticky testuje pripojeni v useEffect

**Krok 3D — Registrace realneho tenanta**

Pokud uzivatel ma Firebase ucet (UID = tenant slug), vlozit odpovidajici radek do `tenants` tabulky:
```sql
INSERT INTO tenants (slug, name, plan_name)
VALUES ('<firebase-user-uid>', '<uzivatel-jmeno>', 'Starter')
ON CONFLICT (slug) DO NOTHING;
```

Toto je kriticke pro migrationRunner — `getTenantUuid()` hleda tenant podle slug.

### 3.3 Rozlozeni agentu pro Fazi 3

| Agent | Uloha | Paralelni? |
|-------|-------|------------|
| `mp-mid-storage-db` | Spusteni schema.sql + seed.sql v Supabase, overeni tabulek | Ne (sekvencni) |
| `mp-spec-storage-tenant-id` | Registrace realneho tenanta v Supabase (Firebase UID -> tenant row) | Po schema deploy |
| `mp-mid-frontend-admin` | Test AdminMigration stranky — zobrazi se connection status? | Po connection test |

### 3.4 Acceptance Criteria

- [ ] Vsech 25 tabulek vytvoreno v Supabase
- [ ] Demo tenant existuje v `tenants` tabulce
- [ ] Seed data naplnena (pricing, fees, branding, materials)
- [ ] `checkSupabaseConnection()` vraci `{ ok: true }`
- [ ] AdminMigration stranka (`/admin/migration`) zobrazi zeleny connection status
- [ ] RLS povoluje SELECT/INSERT/UPDATE/DELETE pro anon

---

## Faze 4 — Kontrolni kroky po Fazi 3

### Krok 1 — Ulozeni historie (pred testovanim)
Spustim agenta `mp-spec-docs-historie` pomoci Task toolu (model haiku, subagent_type general-purpose). Agent ulozi vsechny zmeny z Faze 3: schema deployment, seed data, connection test vysledky, tenant registrace. POCKAM az agent kompletne dokonci ukladani — zadna dalsi akce pred jeho dokoncenim.

### Krok 2 — Testovani na webu
Po dokonceni ulozeni historie otestuju vsechny zmeny z Faze 3 v prohlizeci pomoci mcp__claude-in-chrome nastroju. Konkretne otestuju:
- **AdminMigration** (`/admin/migration`) — zeleny connection badge? Seznam migraci se zobrazi?
- **Supabase Dashboard** (pres Chrome MCP) — tabulky existuji? Demo data jsou tam?
- **DevTools Console** — `[Supabase] Connected successfully` log?
- **Test: rucni cteni** — zkusim `fetch` na Supabase REST API z konzole
Ulozim snimky obrazovky a zapisu poznatky do .md souboru ve slozce docs/claude/Research/supabase-migration/.

### Krok 3 — Ulozeni historie (po testovani)
Znovu spustim agenta `mp-spec-docs-historie` pomoci Task toolu. Tentokrat agent ulozi POUZE vysledky testovani z Kroku 2 — snimky, poznatky, nalezene bugy. POCKAM az agent kompletne dokonci — zadna dalsi akce pred jeho dokoncenim.

### Krok 4 — Compact kontextu
Proved `/compact` pro uvolneni kontextoveho okna. Toto je posledni krok teto faze. Az po compactu pokracuju na Fazi 5.

---

## Faze 5 — Dual-Write Aktivace + Data Migrace (Pracovni)

### 5.1 Cil
Aktivovat dual-write mod a migrovat existujici localStorage data do Supabase.

### 5.2 Detailni kroky

**Krok 5A — Backup**

1. Otevrit `/admin/migration` (AdminMigration.jsx)
2. Stahnout backup: `backupLocalStorage()` — JSON soubor se vsemi namespace daty
3. Ulozit backup bezpecne (nedavat do repa — muze obsahovat citliva data)

**Krok 5B — Dry-Run Migrace**

1. Na AdminMigration strance kliknout "Dry Run"
2. `runMigrations({ dryRun: true })` projde vsech 19 migraci BEZ zapisu
3. Zkontrolovat vysledky:
   - `skipped` = namespace nema localStorage data (OK)
   - `dry-run` = data nalezena, pripravena k migraci (OK)
   - `error` = problem s formatem/mapovanim (FIX pred migraci)
4. Overit ze vsechny kriticke namespace (`pricing:v3`, `fees:v3`, `orders:v1`) maji status `dry-run`

**Krok 5C — Realna Migrace**

1. Spustit `runMigrations({ dryRun: false })` pres AdminMigration UI
2. Sledovat progress bar (onProgress callback)
3. Overit vysledky:
   - `migrated` = data uspesne zkopirovana do Supabase
   - `skipped` = nic k migraci (OK)
   - `partial` = castecny uspech (investigovat)
   - `error` = selhani (rollback a fix)

**Krok 5D — Aktivace Dual-Write**

Po uspesne migraci prepnout na dual-write pro kriticke namespaces:

```js
// Postupne — nejdriv kriticke, pak ostatni
setStorageMode('pricing:v3', 'dual-write');
setStorageMode('fees:v3', 'dual-write');
setStorageMode('branding', 'dual-write');
setStorageMode('widgets', 'dual-write');
setStorageMode('orders:v1', 'dual-write');
```

NEPOUZIVAT `enableDualWriteForAll()` hned — nejdriv otestovat na podmnozine.

**Krok 5E — Overeni Dual-Write**

1. V admin panelu zmenit pricing config (napr. upravit rate_per_hour)
2. Overit ze zmena se zapisala do localStorage (`modelpricer:<tid>:pricing:v3`)
3. Overit ze zmena se zapisala do Supabase (`pricing_configs` tabulka, data JSONB)
4. Oba zdroje musi obsahovat STEJNA data

### 5.3 Rozlozeni agentu pro Fazi 5

| Agent | Uloha | Paralelni? |
|-------|-------|------------|
| `mp-spec-storage-migration` | Spusteni dry-run + realne migrace pres AdminMigration UI | Ne (sekvencni) |
| `mp-mid-storage-tenant` | Overeni dat v Supabase po migraci — porovnani s localStorage | Po migraci |
| `mp-spec-storage-cache` | Invalidace query cache po dual-write aktivaci | Po aktivaci |

### 5.4 Acceptance Criteria

- [ ] Backup stazeny a ulozen
- [ ] Dry-run prochazi bez erroru
- [ ] Realna migrace: vsechny `pricing:v3`, `fees:v3`, `orders:v1` maji status `migrated`
- [ ] Dual-write aktivovan pro min. 5 kritickych namespaces
- [ ] Zmena v admin panelu se propise do localStorage I do Supabase
- [ ] Zadny data loss (localStorage data zachovana)

---

## Faze 6 — Kontrolni kroky po Fazi 5

### Krok 1 — Ulozeni historie (pred testovanim)
Spustim agenta `mp-spec-docs-historie` pomoci Task toolu (model haiku, subagent_type general-purpose). Agent ulozi vsechny zmeny z Faze 5: backup, migracni vysledky, dual-write aktivace, namespace modes. POCKAM az agent kompletne dokonci ukladani — zadna dalsi akce pred jeho dokoncenim.

### Krok 2 — Testovani na webu
Po dokonceni ulozeni historie otestuju vsechny zmeny z Faze 5 v prohlizeci pomoci mcp__claude-in-chrome nastroju. Konkretne otestuju:
- **Admin Pricing** (`/admin/pricing`) — zmena ceny materialu, uloz, over v Supabase dashboardu
- **Admin Fees** (`/admin/fees`) — pridani fee, uloz, over v Supabase
- **Admin Branding** (`/admin/branding`) — zmena barvy, over dual-write
- **Test Kalkulacka** (`/test-kalkulacka`) — cte spravna data? Pricing funguje?
- **Widget** (`/w/<id>`) — nacte data spravneho tenanta pres opraveny tenant override?
- **AdminMigration** (`/admin/migration`) — ukazuje spravne storage modes? Migracni vysledky?
Ulozim snimky obrazovky a zapisu poznatky do .md souboru ve slozce docs/claude/Research/supabase-migration/.

### Krok 3 — Ulozeni historie (po testovani)
Znovu spustim agenta `mp-spec-docs-historie` pomoci Task toolu. Tentokrat agent ulozi POUZE vysledky testovani z Kroku 2 — snimky, poznatky, nalezene bugy, vykon dual-write. POCKAM az agent kompletne dokonci — zadna dalsi akce pred jeho dokoncenim.

### Krok 4 — Compact kontextu
Proved `/compact` pro uvolneni kontextoveho okna. Toto je posledni krok teto faze. Az po compactu pokracuju na Fazi 7.

---

## Faze 7 — Auth Bridge + Tenant Auto-Registration (Pracovni)

### 7.1 Cil
Automaticky registrovat Firebase usery jako Supabase tenanty a pripravit zaklad pro budouci RLS tightening.

### 7.2 Detailni kroky

**Krok 7A — Tenant Auto-Registration pri Login**

V `FirebaseAuthProvider.jsx` pridat logiku ktera po uspesnem Firebase login/register:
1. Zkontroluje zda tenant existuje v Supabase (`tenants` tabulka, slug = user.uid)
2. Pokud ne, vytvori ho: `INSERT INTO tenants (slug, name, plan_name) ...`
3. Pouzije existujici Supabase client (ne novy) — anon key staci pro INSERT (demo politiky)

Implementace — nova helper funkce `ensureTenantInSupabase(user)`:
```js
// src/lib/supabase/tenantRegistration.js (novy soubor)
import { supabase, isSupabaseAvailable } from './client';

export async function ensureTenantInSupabase(user) {
  if (!isSupabaseAvailable() || !supabase || !user?.uid) return null;

  const slug = user.uid;

  // Check if exists
  const { data: existing } = await supabase
    .from('tenants')
    .select('id, slug')
    .eq('slug', slug)
    .maybeSingle();

  if (existing) return existing;

  // Create tenant
  const { data: created, error } = await supabase
    .from('tenants')
    .insert({
      slug,
      name: user.displayName || user.email || slug,
      plan_name: 'Starter',
      metadata: {
        firebase_uid: user.uid,
        email: user.email,
        registered_at: new Date().toISOString(),
      },
    })
    .select('id, slug')
    .single();

  if (error) {
    console.warn('[tenantRegistration] Failed to create tenant:', error.message);
    return null;
  }

  return created;
}
```

**Krok 7B — Integrace do AuthProvider**

V `FirebaseAuthProvider.jsx`, v `onAuthStateChanged` callbacku:
1. Po `setTenantId(user.uid)` pridat: `ensureTenantInSupabase(user)`
2. Fire-and-forget — neblokovany main auth flow
3. Chyba = jen warning, app pokracuje s localStorage

**Krok 7C — MigrationRunner Kompatibilita**

`migrationRunner.js` funkce `getTenantUuid()` hleda tenant podle slug.
Po Kroku 7A bude tenant vzdy existovat kdyz je user prihlasen -> migrace bude fungovat.

**Krok 7D — Supabase Session Bridge (Priprava)**

PRO BUDOUCNOST (ne pro tento sprint, ale pripravit zaklad):
- Supabase client momentalne pouziva anon key (zadna Supabase session)
- Budouci sprint prida: `supabase.auth.setSession()` s custom JWT z Firebase
- Toto umozni RLS politiky zalozene na `auth.uid()` misto permisivnich anon politik

V tomto sprintu: jen pridat TODO komentare kde se bude menit.

### 7.3 Rozlozeni agentu pro Fazi 7

| Agent | Uloha | Paralelni? |
|-------|-------|------------|
| `mp-mid-storage-db` | Vytvoreni tenantRegistration.js — nova helper pro auto-registraci | Ano (s auth integraci) |
| `mp-spec-infra-firebase` | Integrace ensureTenantInSupabase do FirebaseAuthProvider | Ano (s helper tvorbu) |
| `mp-spec-storage-tenant-id` | Overeni ze getTenantId() vraci spravny slug po login | Po integraci |

### 7.4 Acceptance Criteria

- [ ] `ensureTenantInSupabase()` existuje v `src/lib/supabase/tenantRegistration.js`
- [ ] Po Firebase login se automaticky vytvori tenant v Supabase (pokud neexistuje)
- [ ] Existujici tenanti se neduplikuji (ON CONFLICT / maybeSingle check)
- [ ] Chyba v registraci NEBLOKUJE auth flow — jen console.warn
- [ ] `npm run build` — PASS
- [ ] migrationRunner `getTenantUuid()` najde tenant po loginu

---

## Faze 8 — Kontrolni kroky po Fazi 7

### Krok 1 — Ulozeni historie (pred testovanim)
Spustim agenta `mp-spec-docs-historie` pomoci Task toolu (model haiku, subagent_type general-purpose). Agent ulozi vsechny zmeny z Faze 7: tenantRegistration.js, FirebaseAuthProvider integrace, migrationRunner kompatibilita. POCKAM az agent kompletne dokonci ukladani — zadna dalsi akce pred jeho dokoncenim.

### Krok 2 — Testovani na webu
Po dokonceni ulozeni historie otestuju vsechny zmeny z Faze 7 v prohlizeci pomoci mcp__claude-in-chrome nastroju. Konkretne otestuju:
- **Login flow** — prihlasit se (email/Google), over v Supabase dashboardu ze se vytvoril tenant
- **Logout + Login** — druhy login nesmí duplikovat tenant (idempotence)
- **AdminMigration** — po loginu zobrazi spravny tenant? Migrace funguje?
- **DevTools console** — zadne errory z tenantRegistration
Ulozim snimky obrazovky a zapisu poznatky do .md souboru ve slozce docs/claude/Research/supabase-migration/.

### Krok 3 — Ulozeni historie (po testovani)
Znovu spustim agenta `mp-spec-docs-historie` pomoci Task toolu. Tentokrat agent ulozi POUZE vysledky testovani z Kroku 2. POCKAM az agent kompletne dokonci — zadna dalsi akce pred jeho dokoncenim.

### Krok 4 — Compact kontextu
Proved `/compact` pro uvolneni kontextoveho okna. Toto je posledni krok teto faze. Az po compactu pokracuju na Fazi 9.

---

## Faze 9 — Realtime + Remaining Dual-Write + Stabilizace (Pracovni)

### 9.1 Cil
Aktivovat dual-write pro vsechny namespaces, otestovat Realtime subscriptions, finalni stabilizace.

### 9.2 Detailni kroky

**Krok 9A — Dual-Write pro Zbyvajici Namespaces**

Po uspesnem overeni v Fazi 5/6 (kriticke namespaces), aktivovat i zbyvajici:
```js
enableDualWriteForAll();
```

Toto prepne vsech 20 namespaces na dual-write.

**Krok 9B — Realtime Test**

Otestovat `useSupabaseRealtime` hook na zive data:

1. Otevrit Admin Orders ve dvou tabech
2. V jednom tabu pridat objednavku
3. V druhem tabu by se mela objednavka zobrazit (Realtime INSERT event)
4. Pokud nefunguje — overit ze Supabase Realtime je povoleny na projektu (Dashboard -> Settings -> Realtime)

POZOR: Realtime vyzaduje ze Supabase Realtime je zapnuty (defaultne je, ale overit).

**Krok 9C — useStorageQuery Integration Test**

Overit ze `useStorageQuery` hook spravne cte z Supabase v dual-write modu:
1. V admin pricing strance nacist data
2. V DevTools overit ze `readTenantJsonAsync` slo do Supabase (ne jen localStorage)
3. Zmenit data v Supabase primo (SQL Update) — po `refetch()` musi byt videt

**Krok 9D — Cross-Tab Konzistence**

1. Otevrit admin pricing ve dvou tabech
2. V jednom zmenit cenu
3. V druhem provest refetch — musi videt zmenu (Supabase je sdileny zdroj)

**Krok 9E — Error Handling Overeni**

1. Docasne odpojit Supabase (spatny URL v .env)
2. App musi pokracovat s localStorage (graceful fallback)
3. Konzole zobrazi warning, ne error ktery rozbije app
4. Obnovit spravny URL — app automaticky zacne pouzivat Supabase

**Krok 9F — Build + Smoke Test**

1. `npm run build` — PASS
2. Smoke test vsech kritickych cest:
   - `/test-kalkulacka` — funguje
   - `/admin/pricing` — funguje
   - `/admin/fees` — funguje
   - `/admin/migration` — zobrazuje spravne mody
   - `/w/<publicWidgetId>` — funguje se spravnym tenantem

### 9.3 Rozlozeni agentu pro Fazi 9

| Agent | Uloha | Paralelni? |
|-------|-------|------------|
| `mp-mid-storage-tenant` | Aktivace dual-write pro vsechny namespaces | Ne (prvni krok) |
| `mp-spec-storage-cache` | Test useStorageQuery — cteni z Supabase, cache invalidace | Ano (s Realtime testem) |
| `mp-mid-frontend-admin` | Test Realtime na Admin Orders — INSERT/UPDATE eventy | Ano (s storage testem) |
| `mp-spec-test-build` | npm run build + smoke test vsech cest | Po vsech testech |

### 9.4 Acceptance Criteria

- [ ] Vsech 20 namespaces v dual-write modu
- [ ] Realtime eventy funguji (INSERT na orders se projevi v jinem tabu)
- [ ] useStorageQuery cte z Supabase, fallbackuje na localStorage
- [ ] App prezije Supabase vypadek (graceful degradation do localStorage)
- [ ] `npm run build` — PASS
- [ ] Smoke test vsech kritickych cest — OK

---

## Faze 10 — Kontrolni kroky po Fazi 9

### Krok 1 — Ulozeni historie (pred testovanim)
Spustim agenta `mp-spec-docs-historie` pomoci Task toolu (model haiku, subagent_type general-purpose). Agent ulozi vsechny zmeny z Faze 9: dual-write kompletni aktivace, Realtime testy, error handling overeni, smoke test vysledky. POCKAM az agent kompletne dokonci ukladani — zadna dalsi akce pred jeho dokoncenim.

### Krok 2 — Testovani na webu
Po dokonceni ulozeni historie otestuju vsechny zmeny z Faze 9 v prohlizeci pomoci mcp__claude-in-chrome nastroju. Konkretne otestuju:
- **Kompletni smoke test** — vsechny admin stranky, test-kalkulacka, widget
- **Dual-write konzistence** — data v localStorage == data v Supabase pro min. 3 namespaces
- **Realtime** — zmena v jednom tabu se projevi v druhem
- **Error resilience** — docasne odpojeni Supabase nepadne app
- **Performance** — zadne viditelne spomaleni oproti localStorage-only
Ulozim snimky obrazovky a zapisu poznatky do .md souboru ve slozce docs/claude/Research/supabase-migration/.

### Krok 3 — Ulozeni historie (po testovani)
Znovu spustim agenta `mp-spec-docs-historie` pomoci Task toolu. Tentokrat agent ulozi POUZE vysledky testovani z Kroku 2 — kompletni test report, snimky, performance poznatky. POCKAM az agent kompletne dokonci — zadna dalsi akce pred jeho dokoncenim.

### Krok 4 — Compact kontextu
Proved `/compact` pro uvolneni kontextoveho okna. Toto je posledni krok teto faze. Az po compactu pokracuju na Fazi 11.

---

## Faze 11 — Dokumentace + Finalizace (Pracovni)

### 11.1 Cil
Aktualizovat veskterou dokumentaci, zapsat do historie, aktualizovat MEMORY.md.

### 11.2 Detailni kroky

**Krok 11A — Dokumentace Update**

Aktualizovat nasledujici dokumentacni soubory:

| Soubor | Co pridat |
|--------|-----------|
| `docs/claude/Documentation/Storage-Utilities-Dokumentace.md` | Supabase dual-write, feature flags, storage modes |
| `docs/claude/Documentation/Widget-Kalkulacka-Dokumentace.md` | Fix tenant override bugu, tenantId prop |
| `docs/claude/Documentation/Supabase-Dokumentace.md` | Schema deployment, connection, migration postup |
| `docs/claude/Documentation/00-MASTER-Dokumentace.md` | Link na Supabase dokumentaci |

**Krok 11B — MEMORY.md Update**

Pridat do MEMORY.md:
- Supabase Migration Sprint vysledky
- Dual-write architektura
- tenantRegistration.js pattern
- Pasti: schema musi byt deploynuto pred aktivaci dual-write, tenant musi existovat v tenants tabulce

**Krok 11C — AGENT_MAP.md Update**

Pokud byly pouzity novi agenti — aktualizovat.

**Krok 11D — Plan Closure**

Zmenit status tohoto planu na COMPLETED s datem a shrnutim vysledku.

### 11.3 Rozlozeni agentu pro Fazi 11

| Agent | Uloha | Paralelni? |
|-------|-------|------------|
| `mp-spec-docs-dev` | Aktualizace 4 dokumentacnich souboru | Ano (s MEMORY update) |
| `mp-spec-docs-historie` | Finalni historie zapis — cely sprint souhrn | Po dokumentaci |

### 11.4 Acceptance Criteria

- [ ] 4 dokumentacni soubory aktualizovany
- [ ] MEMORY.md aktualizovany
- [ ] Historie ulozena
- [ ] Plan status = COMPLETED

---

## Faze 12 — Kontrolni kroky po Fazi 11 (FINALNI)

### Krok 1 — Ulozeni historie (pred testovanim)
Spustim agenta `mp-spec-docs-historie` pomoci Task toolu (model haiku, subagent_type general-purpose). Agent ulozi finalni stav sprintu: vsechny dokumentacni zmeny, MEMORY.md update, plan closure. POCKAM az agent kompletne dokonci ukladani — zadna dalsi akce pred jeho dokoncenim.

### Krok 2 — Testovani na webu
Po dokonceni ulozeni historie proved finalni sanity check:
- **npm run build** — PASS
- **Rychly smoke** — homepage, admin, kalkulacka, widget
- **Dokumentace** — soubory existuji a maji spravny obsah
- **Supabase dashboard** — data konzistentni, connection zeleny
Ulozim snimky obrazovky a zapisu poznatky do .md souboru ve slozce docs/claude/Research/supabase-migration/.

### Krok 3 — Ulozeni historie (po testovani)
Znovu spustim agenta `mp-spec-docs-historie` pomoci Task toolu. Tentokrat agent ulozi POUZE finalni test vysledky — posledni sprint zaznam. POCKAM az agent kompletne dokonci — zadna dalsi akce pred jeho dokoncenim.

### Krok 4 — Compact kontextu
Proved `/compact` pro uvolneni kontextoveho okna. Sprint je kompletni.

---

## 5) Paralelizacni Mapa

```
Faze 1: [Widget Fix || Env Setup || Package Check]   -- 3 paralelni tasky
Faze 2: KONTROLNI (sekvencni)
Faze 3: [Schema Deploy] -> [Connection Test] -> [Tenant Registration]  -- sekvencni
Faze 4: KONTROLNI (sekvencni)
Faze 5: [Backup] -> [Dry-Run] -> [Migrace] -> [Dual-Write] -> [Overeni]  -- sekvencni
Faze 6: KONTROLNI (sekvencni)
Faze 7: [tenantRegistration.js || AuthProvider integrace] -> [Overeni]  -- 2 paralelni, pak sekvencni
Faze 8: KONTROLNI (sekvencni)
Faze 9: [Dual-Write All] -> [Realtime || StorageQuery || Admin test] -> [Build]  -- mix
Faze 10: KONTROLNI (sekvencni)
Faze 11: [Dokumentace || MEMORY update]  -- 2 paralelni
Faze 12: KONTROLNI (sekvencni)
```

---

## 6) Klicove Soubory — Kompletni Seznam

### Existujici soubory (UPRAVA)

| Soubor | Zmena | Faze |
|--------|-------|------|
| `Model_Pricer-V2-main/src/pages/widget-kalkulacka/index.jsx` | Destrukce tenantId prop, predani do loadPricingConfigV3/loadFeesConfigV3 | 1 |
| `Model_Pricer-V2-main/src/providers/FirebaseAuthProvider.jsx` | Import + volani ensureTenantInSupabase po loginu | 7 |
| `docs/claude/Documentation/Storage-Utilities-Dokumentace.md` | Supabase dual-write dokumentace | 11 |
| `docs/claude/Documentation/Widget-Kalkulacka-Dokumentace.md` | Tenant override fix dokumentace | 11 |

### Nove soubory (TVORBA)

| Soubor | Ucel | Faze |
|--------|------|------|
| `Model_Pricer-V2-main/src/lib/supabase/tenantRegistration.js` | Auto-registrace Firebase useru jako Supabase tenants | 7 |
| `docs/claude/Documentation/Supabase-Dokumentace.md` | Kompletni Supabase dokumentace | 11 |

### Existujici soubory (BEZE ZMENY — jen pouziti/overeni)

| Soubor | Ucel |
|--------|------|
| `Model_Pricer-V2-main/src/lib/supabase/client.js` | Singleton client — overit ze funguje s env vars |
| `Model_Pricer-V2-main/src/lib/supabase/storageAdapter.js` | Abstrakce — uz implementovana, beze zmen |
| `Model_Pricer-V2-main/src/lib/supabase/featureFlags.js` | Per-namespace mody — uz implementovana, beze zmen |
| `Model_Pricer-V2-main/src/lib/supabase/migrationRunner.js` | 19 migraci — uz implementovan, beze zmen |
| `Model_Pricer-V2-main/src/hooks/useStorageQuery.js` | Async read hook — uz implementovan, beze zmen |
| `Model_Pricer-V2-main/src/hooks/useSupabaseRealtime.js` | Realtime subscriptions — uz implementovan, beze zmen |
| `Model_Pricer-V2-main/src/utils/adminTenantStorage.js` | Tenant storage entrypoint — uz podporuje Supabase, beze zmen |
| `Model_Pricer-V2-main/src/utils/adminPricingStorage.js` | Pricing storage — uz podporuje tenantIdOverride, beze zmen |
| `Model_Pricer-V2-main/src/utils/adminFeesStorage.js` | Fees storage — uz podporuje tenantIdOverride, beze zmen |
| `Model_Pricer-V2-main/src/pages/admin/AdminMigration.jsx` | Migration UI — uz implementovana, beze zmen |
| `Model_Pricer-V2-main/supabase/schema.sql` | 25 tabulek — spustit v Supabase, beze zmen |
| `Model_Pricer-V2-main/supabase/storage-policies.sql` | Bucket policies — spustit v Supabase, beze zmen |
| `Model_Pricer-V2-main/supabase/seed.sql` | Demo data — spustit v Supabase, beze zmen |

---

## 7) Agent Assignment Summary

| Agent | Faze | Ulohy |
|-------|------|-------|
| `mp-mid-frontend-widget` | 1 | Widget tenantId fix |
| `mp-spec-storage-tenant-id` | 1, 3, 7 | Tenant override overeni, registrace |
| `mp-spec-infra-firebase` | 1, 7 | Env setup, AuthProvider integrace |
| `mp-mid-storage-db` | 3, 7 | Schema deploy, tenantRegistration.js |
| `mp-mid-frontend-admin` | 3, 9 | AdminMigration test, Realtime test |
| `mp-spec-storage-migration` | 5 | Dry-run + realna migrace |
| `mp-mid-storage-tenant` | 5, 9 | Data overeni, dual-write aktivace |
| `mp-spec-storage-cache` | 5, 9 | Cache invalidace, useStorageQuery test |
| `mp-spec-test-build` | 9 | Build + smoke test |
| `mp-spec-docs-dev` | 11 | Dokumentacni aktualizace |
| `mp-spec-docs-historie` | 2,4,6,8,10,12 | Historie ukladani (vsechny kontrolni faze) |

**Celkem 11 unikatnich agentu pouzito.**

---

## 8) Kontrolni Seznam pro Plan (dle Hlavni_Pozadavky.md)

- [x] Kazda pracovni faze ma za sebou kontrolni fazi (4 kroky)
- [x] V kazde pracovni fazi je tabulka rozlozeni agentu
- [x] Vsichni potrebni agenti existuji (overeno v AGENT_MAP.md)
- [x] Plan je dostatecne detailni — kazdy krok je jasny
- [x] Scope jasne definovan (IN/OUT)
- [x] Rizika identifikovana s mitigacemi
- [x] Rollback strategie definovana
- [x] Acceptance criteria pro kazdou fazi
- [x] Edge cases pokryty (Supabase nedostupnost, tenant neexistuje, data format mismatch)
- [ ] Otazky zodpovezeny pred finalizaci — VYNECHANO dle pozadavku (uzivatel nedostupny)

---

## 9) Predpokladany Casovy Odhad

| Faze | Odhad | Poznamka |
|------|-------|----------|
| Faze 1 (Widget fix + env) | 15 min | Jednoducha zmena, paralelizovatelna |
| Faze 2 (Kontrola) | 10 min | |
| Faze 3 (Schema deploy) | 20 min | Zavisi na Supabase pristupnosti |
| Faze 4 (Kontrola) | 10 min | |
| Faze 5 (Migrace + dual-write) | 30 min | Dry-run + migrace + overeni |
| Faze 6 (Kontrola) | 15 min | Rozsahle testovani |
| Faze 7 (Auth bridge) | 20 min | Novy soubor + integrace |
| Faze 8 (Kontrola) | 10 min | |
| Faze 9 (Realtime + stabilizace) | 25 min | Testovaci faze |
| Faze 10 (Kontrola) | 15 min | |
| Faze 11 (Dokumentace) | 15 min | |
| Faze 12 (Kontrola) | 10 min | |
| **CELKEM** | **~3 hodiny** | Vcetne testovani a kontrolnich fazi |

---

**END OF PLAN**
