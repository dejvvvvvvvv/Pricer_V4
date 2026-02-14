# AdminMigration — Dokumentace

> Admin stranka pro migraci dat z localStorage do Supabase PostgreSQL. Poskytuje dry-run
> rezim, progress bar, backup/download, tabulku datovych zdroju s velikostmi a per-namespace
> prepinani storage modu (localStorage / dual-write / supabase). Stranka je lazy-loaded
> na route `/admin/migration`. Pouziva Forge dark theme s inline `<style>` blokem.

---

## 1. Prehled

AdminMigration (`/admin/migration`) je administrativni nastroj pro migraci tenant-scoped dat
z localStorage do Supabase. Stranka vznikla jako soucast Phase 4 (Supabase migrace, 2026-02-08).

Hlavni funkce:
1. **Connection status** — overeni pripojeni k Supabase (zeleny/cerveny indikator)
2. **Backup download** — stazeni kompletniho JSON backupu vsech localStorage dat
3. **Dry run** — simulace migrace bez zapisu (validace dat, zobrazeni velikosti)
4. **Migrace** — skutecny prenos dat z localStorage do Supabase (s confirm dialogem)
5. **Progress bar** — vizualni indikator prubehu migrace s nazvem aktualni migrace
6. **Data Sources tabulka** — prehled 19 namespace s cilovou tabulkou, velikosti a indikaci dat
7. **Storage Mode per Namespace** — per-namespace prepinani mezi `localStorage`, `dual-write` a `supabase`
8. **Hromadne akce** — Enable Dual-Write (all), Switch to Supabase (all), Rollback to localStorage (all)

Stranka NEMA lokalizaci (vsechny texty jsou v anglictine). Nepouziva `useLanguage()`.

---

## 2. Technologie a jazyk

| Polozka | Hodnota |
|---------|---------|
| Framework | React 19 |
| Bundler | Vite |
| Jazyk | JavaScript + JSX |
| Styling | Inline `<style>` blok s CSS custom properties (Forge tokeny) — BEZ Tailwind, BEZ externiho CSS souboru |
| Routing | React Router v6 (`/admin/migration` vnorena route pod AdminLayout), **lazy-loaded** pres `React.lazy()` |
| i18n | ZADNE — vsechny texty hardcoded v anglictine |
| Ikony | Zadne |
| Animace | CSS `transition: width 0.3s` na progress baru |

---

## 3. Architektura souboru

```
src/pages/admin/
  AdminMigration.jsx              — 407 radku, export default AdminMigration

src/lib/supabase/
  migrationRunner.js              — 538 radku, orchestrace migraci (19 definic, runner, backup)
  featureFlags.js                 — 138 radku, per-namespace feature flags (localStorage/supabase/dual-write)
  storageAdapter.js               — 348 radku, abstrakce nad localStorage + Supabase
  client.js                       — 65 radku, singleton Supabase klient
  index.js                        — 26 radku, barrel export
```

### Rozdeleni zodpovednosti

| Soubor | Zodpovednost |
|--------|--------------|
| `AdminMigration.jsx` | UI vrstva — zobrazeni stavu, ovladani akci, vizualni feedback |
| `migrationRunner.js` | Business logika — definice migraci, spusteni, backup, rollout |
| `featureFlags.js` | Konfigurace — per-namespace prepinani storage backendu |
| `storageAdapter.js` | Infrastruktura — abstrakce cteni/zapisu pres feature flags |
| `client.js` | Pripojeni — singleton Supabase klient + health check |

---

## 4. Import graf

### 4.1 Co AdminMigration importuje

| Import | Zdroj | Typ |
|--------|-------|-----|
| `React, useState, useEffect, useCallback` | `react` | Knihovna |
| `getMigrationList` | `../../lib/supabase/migrationRunner` | Funkce (named) |
| `runMigrations` | `../../lib/supabase/migrationRunner` | Funkce (named) |
| `backupLocalStorage` | `../../lib/supabase/migrationRunner` | Funkce (named) |
| `enableSupabaseForAll` | `../../lib/supabase/migrationRunner` | Funkce (named) |
| `enableDualWriteForAll` | `../../lib/supabase/migrationRunner` | Funkce (named) |
| `rollbackToLocalStorage` | `../../lib/supabase/migrationRunner` | Funkce (named) |
| `checkSupabaseConnection` | `../../lib/supabase/client` | Funkce (named) |
| `isSupabaseAvailable` | `../../lib/supabase/client` | Funkce (named) |
| `getAllStorageModes` | `../../lib/supabase/featureFlags` | Funkce (named) |
| `setStorageMode` | `../../lib/supabase/featureFlags` | Funkce (named) |

**Celkem: 4 React API, 6 migrationRunner funkci, 2 client funkce, 2 featureFlags funkce.**

### 4.2 Co importuje AdminMigration

| Soubor | Jak |
|--------|-----|
| `src/Routes.jsx:37` | `const AdminMigration = React.lazy(() => import('./pages/admin/AdminMigration'))` — lazy-loaded |
| `src/Routes.jsx:114` | `<Route path="migration" element={<Suspense ...><AdminMigration /></Suspense>}` — mapovano na `/admin/migration` |

AdminMigration je **lazy-loaded** pres `React.lazy()` s `<Suspense fallback>`. Neni soucasti
hlavniho bundlu — nacita se az pri navigaci na `/admin/migration`.

---

## 5. Design a vizual

### 5.1 Styling pristup

AdminMigration pouziva **inline `<style>` blok** na konci JSX (radky 326-403). Vsechny CSS tridy
maji prefix `mig-` (napr. `mig-page`, `mig-title`, `mig-btn`, `mig-table`).
Zadny externi CSS soubor, zadny Tailwind.

CSS tridy referencuji Forge tokeny pres `var(--forge-*)`:

**Pozadi:**
| Token | Pouziti |
|-------|---------|
| `--forge-bg-void` | Hlavni pozadi stranky `.mig-page` |
| `--forge-bg-elevated` | Tabulka hlavicky, buttony, storage mode badge (localStorage) |
| `--forge-bg-overlay` | Button `.mig-btn-secondary` hover |

**Text:**
| Token | Pouziti |
|-------|---------|
| `--forge-text-primary` | Nadpisy, tabulka nazvy, results texty |
| `--forge-text-secondary` | Podnapis, tabulka bunky, namespace texty |
| `--forge-text-muted` | Tabulka headery, data size, localStorage mode badge |

**Akcenty a stavy:**
| Token | Pouziti |
|-------|---------|
| `--forge-accent-primary` | Progress bar, primary button, aktivni mode button |
| `--forge-accent-primary-h` | Primary button hover |
| `--forge-success` | Connection OK, "Migrated" label, supabase mode badge, "Has Data" indikator |
| `--forge-warning` | Dual-write mode badge, results s chybami border |
| `--forge-error` | Connection chyba, error texty, Rollback button |

**Fonty:**
| Token | Pouziti |
|-------|---------|
| `--forge-font-heading` | Results nadpis (`h3`) |
| `--forge-font-tech` | Section titles, button texty, storage mode badge, mode switch buttony |
| `--forge-font-mono` | Progress counter, namespace text v tabulce, data size, error detail |

**Radii:**
| Token | Pouziti |
|-------|---------|
| `--forge-radius-md` | Buttony, connection status box, results box |
| `--forge-radius-sm` | Storage mode badge, mode switch buttony |
| `--forge-radius-lg` | Tabulka wrapper `.mig-table-wrap` |

### 5.2 Layout

**Page (`.mig-page`):** `max-width: 1024px; margin: 0 auto; padding: 24px; display: grid; gap: 32px`
— vertikalni stack sekci s fixni max sirkou a centrem.

**Actions (`.mig-actions`):** `display: flex; flex-wrap: wrap; gap: 12px` — horizontalni radek tlacitek.

**Progress bar:** Dva vnorene divy — vnejsi (8px vyska, `--forge-bg-elevated`, border-radius 999)
a vnitrni (dynamicka sirka dle `progress.current / progress.total`, `--forge-accent-primary`).

**Results grid:** `display: grid; gridTemplateColumns: repeat(4, 1fr)` — 4 hodnoty v rade
(Total, Migrated, Skipped, Errors).

**Data Sources tabulka:** 4 sloupce — Namespace (nazev + namespace kod), Table, Size, Has Data (zeleny/sedy dot).

**Storage Mode tabulka:** 3 sloupce — Namespace, Current Mode (badge), Actions (3 mode buttony).

### 5.3 Barevne rozliseni modu

Funkce `modeColor(mode)` vraci inline styles podle aktualniho storage modu:

| Mode | Background | Color | Border |
|------|-----------|-------|--------|
| `supabase` | `rgba(0,212,170,0.08)` | `--forge-success` | `rgba(0,212,170,0.3)` |
| `dual-write` | `rgba(255,181,71,0.08)` | `--forge-warning` | `rgba(255,181,71,0.3)` |
| `localStorage` | `--forge-bg-elevated` | `--forge-text-secondary` | `--forge-border-default` |

---

## 6. Migrace Data Model

### 6.1 Definice migraci (19 polozek)

Vsech 19 migraci je definovano v `migrationRunner.js` v poli `MIGRATIONS`. Kazda migrace ma:

| Pole | Typ | Popis |
|------|-----|-------|
| `id` | string | Unikatni ID (format `XXX-nazev`, napr. `001-pricing`) |
| `name` | string | Lidsky citelny nazev |
| `namespace` | string | Storage namespace (odpovida feature flags) |
| `table` | string | Cilova Supabase tabulka |
| `lsKey` | function(tid) | Funkce vracejici localStorage klic pro daneho tenanta |
| `type` | string | Typ migrace: `config`, `orders`, nebo `log` |

### 6.2 Kompletni seznam migraci

| ID | Nazev | Namespace | Tabulka | Typ | localStorage Key Pattern |
|----|-------|-----------|---------|-----|--------------------------|
| 001-pricing | Pricing Configuration | `pricing:v3` | `pricing_configs` | config | `modelpricer:{tid}:pricing:v3` |
| 002-fees | Fees Configuration | `fees:v3` | `fees` | config | `modelpricer:{tid}:fees:v3` |
| 003-orders | Orders | `orders:v1` | `orders` | orders | `modelpricer:{tid}:orders:v1` |
| 004-order-activity | Order Activity | `orders:activity:v1` | `order_activity` | log | `modelpricer:{tid}:orders:activity:v1` |
| 005-audit | Audit Log | `audit_log` | `audit_log` | log | `modelpricer:{tid}:audit_log` |
| 006-analytics | Analytics Events | `analytics:events` | `analytics_events` | log | `modelpricer:{tid}:analytics:events` |
| 007-shipping | Shipping Methods | `shipping:v1` | `shipping_methods` | config | `modelpricer:{tid}:shipping:v1` |
| 008-coupons | Coupons | `coupons:v1` | `coupons` | config | `modelpricer:{tid}:coupons:v1` |
| 009-express | Express Tiers | `express:v1` | `express_tiers` | config | `modelpricer:{tid}:express:v1` |
| 010-email | Email Templates | `email:v1` | `email_templates` | config | `modelpricer:{tid}:email:v1` |
| 011-form | Form Configuration | `form:v1` | `form_configs` | config | `modelpricer:{tid}:form:v1` |
| 012-kanban | Kanban Configuration | `kanban:v1` | `kanban_configs` | config | `modelpricer:{tid}:kanban:v1` |
| 013-dashboard | Dashboard Configuration | `dashboard:v2` | `dashboard_configs` | config | `modelpricer:{tid}:dashboard:v2` |
| 014-branding | Branding | `branding` | `branding` | config | `modelpricer_branding__{tid}` |
| 015-widgets | Widget Configurations | `widgets` | `widget_configs` | config | `modelpricer_widgets__{tid}` |
| 016-plan | Plan Features | `plan_features` | `tenants` | config | `modelpricer_plan_features__{tid}` |
| 017-widget-theme | Widget Theme | `widget_theme` | `widget_configs` | config | `modelpricer:widget_theme:{tid}` |
| 018-team-users | Team Users | `team_users` | `team_members` | config | `modelpricer:{tid}:team_users` |
| 019-team-invites | Team Invites | `team_invites` | `team_members` | config | `modelpricer:{tid}:team_invites` |

### 6.3 Typy migraci a jejich strategie

#### Config (14 migraci)
- Cte JSON z localStorage
- Pokud data neexistuji: `skipped`
- Pokud dry-run: vraci `dry-run` s velikosti dat
- Upsert do Supabase (`onConflict: 'tenant_id,namespace'`)
- **Specialni pripad `plan_features`:** nezapisuje do `data` sloupce ale do `plan_name` + `plan_features` sloupcu tabulky `tenants`

#### Orders (1 migrace)
- Cte pole objednavek z localStorage (`raw.orders` nebo primo pole)
- Kazda objednavka se upsertne do `orders` tabulky (`onConflict: 'tenant_id,order_number'`)
- Pro kazdou objednavku se take vlozia `order_items` (modely)
- Vraci pocet `insertedOrders` a `insertedItems`
- Pri chybe uprostred vraci `partial` status

#### Log (3 migrace)
- Cte pole logovych zaznamu z localStorage
- Batch insert po 500 zaznamech
- Mapuje zaznamy pres `mapLogEntry()` podle cilove tabulky:
  - `audit_log`: mapuje action, entity_type, entity_id, actor, details, ip_address, user_agent
  - `analytics_events`: mapuje event_type, widget_id, session_id, payload
  - `order_activity`: mapuje order_id, user_id, type, payload
- Pri chybe uprostred vraci `partial` status s poctem vlozenych zaznamu

### 6.4 Legacy key formaty

Migrace 014-016 pouzivaji **legacy key format** s dvojitym podtrzitkem:
- `modelpricer_branding__{tid}` (misto `modelpricer:{tid}:branding`)
- `modelpricer_widgets__{tid}` (misto `modelpricer:{tid}:widgets`)
- `modelpricer_plan_features__{tid}` (misto `modelpricer:{tid}:plan_features`)

Migrace 017 pouziva **hybridni format**:
- `modelpricer:widget_theme:{tid}` (namespace je pred tenant ID)

Ostatni migrace pouzivaji standardni format `modelpricer:{tid}:{namespace}`.

---

## 7. API

### 7.1 migrationRunner.js — Public API

#### `getMigrationList(): MigrationInfo[]`
Vraci pole 19 migraci s informacemi o lokalnich datech.

**Navratova hodnota pro kazdou migraci:**
```
{
  id: string,           // napr. '001-pricing'
  name: string,         // napr. 'Pricing Configuration'
  namespace: string,    // napr. 'pricing:v3'
  table: string,        // napr. 'pricing_configs'
  type: string,         // 'config' | 'orders' | 'log'
  hasLocalData: boolean, // true pokud localStorage klic existuje a ma data
  localDataSize: number, // velikost JSON stringu v bytech
  localEntryCount: number // pocet polozek (pro pole), 1 pro objekty, 0 pro prazdne
}
```

#### `runMigrations(options): Promise<MigrationResults>`
Spusti migrace (vsechny nebo vyber).

**Parametry:**
| Parametr | Typ | Default | Popis |
|----------|-----|---------|-------|
| `options.dryRun` | boolean | `false` | Pokud true, pouze validuje bez zapisu |
| `options.migrationIds` | string[] | `null` (vsechny) | Pole ID migraci ke spusteni |
| `options.onProgress` | function | - | Callback volany po kazde migraci |

**Progress callback format:**
```
{
  current: number,    // poradi aktualni migrace (1-based)
  total: number,      // celkovy pocet migraci
  migration: string,  // nazev aktualni migrace
  result: object      // vysledek aktualni migrace
}
```

**Navratova hodnota:**
```
{
  ok: boolean,       // true pokud zadne errory
  dryRun: boolean,   // zda sel o dry-run
  total: number,     // celkovy pocet migraci
  migrated: number,  // uspesne migrovano
  skipped: number,   // preskoceno (zadna data)
  errors: number,    // pocet chyb
  results: array     // detailni vysledky per migrace
}
```

#### `backupLocalStorage(): BackupObject`
Vytvori JSON backup vsech localStorage dat pro aktualniho tenanta.

**Navratova hodnota:**
```
{
  version: 1,
  tenantId: string,
  exportedAt: string,        // ISO timestamp
  namespaces: {
    [namespace]: {
      key: string,           // localStorage klic
      data: any              // deserializovana data
    }
  }
}
```

#### `enableSupabaseForAll(): void`
Nastavi vsechny namespaces na `supabase` mod. Volat po uspesne migraci.

#### `enableDualWriteForAll(): void`
Nastavi vsechny namespaces na `dual-write` mod. Volat behem prechodneho obdobi.

#### `rollbackToLocalStorage(): void`
Nastavi vsechny namespaces zpet na `localStorage` mod. Rollback funkce.

### 7.2 featureFlags.js — Public API

#### `getStorageMode(namespace): string`
Vraci aktualni storage mod pro dany namespace. Default: `'localStorage'`.

**Validni mody:** `'localStorage'`, `'supabase'`, `'dual-write'`

#### `setStorageMode(namespace, mode): void`
Nastavi storage mod pro konkretni namespace. Validuje mod, loguje warning pri neplatnem.

#### `setAllStorageModes(mode): void`
Nastavi storage mod pro VSECH 20 znamych namespaces najednou.

#### `getAllStorageModes(): Record<string, string>`
Vraci objekt `{ namespace: mode }` pro vsech 20 namespaces.

#### `isSupabaseEnabled(namespace): boolean`
Vraci `true` pokud je namespace v modu `supabase` nebo `dual-write`.

#### `isLocalStorageEnabled(namespace): boolean`
Vraci `true` pokud je namespace v modu `localStorage` nebo `dual-write`.

### 7.3 Supabase Client — Public API

#### `isSupabaseAvailable(): boolean`
Vraci `true` pokud jsou nastaveny env promenne `VITE_SUPABASE_URL` a `VITE_SUPABASE_ANON_KEY`.

#### `checkSupabaseConnection(): Promise<{ok: boolean, error?: string}>`
Health check — pokusi se dotazat tabulku `tenants` a vraci stav pripojeni.

---

## 8. Stav (State Management)

AdminMigration pouziva 5 `useState` hooku:

| State | Typ | Default | Popis |
|-------|-----|---------|-------|
| `migrations` | array | `[]` | Seznam 19 migraci s info o lokalnich datech |
| `connection` | object/null | `null` | Stav pripojeni k Supabase (`{ ok, error? }`) |
| `storageModes` | object | `{}` | Mapa `{ namespace: mode }` pro vsech 20 namespaces |
| `running` | boolean | `false` | Zda prave probiha migrace |
| `progress` | object/null | `null` | Aktualni progress (`{ current, total, migration }`) |
| `results` | object/null | `null` | Vysledky posledni migrace/dry-run |

### Zivotni cyklus stavu

```
Mount
  |
  v
useEffect (jednou)
  ├── getMigrationList() → setMigrations
  ├── getAllStorageModes() → setStorageModes
  └── checkSupabaseConnection() → setConnection
  |
  v
User action (Dry Run / Migrate)
  ├── setRunning(true)
  ├── setResults(null)
  ├── setProgress(null)
  ├── runMigrations({ onProgress: setProgress })
  │     └── kazdych N ms → setProgress({ current, total, migration })
  ├── setResults(result)
  └── setRunning(false)
  |
  v
User action (Mode change)
  ├── setStorageMode(ns, mode) / enableDualWriteForAll() / ...
  └── refreshModes() → getAllStorageModes() → setStorageModes
```

---

## 9. Uzivatelesky flow

### 9.1 Doporuceny migracni postup

```
1. Overit connection status (zeleny dot = pripojeno)
2. Stahnout backup (tlacitko "Download Backup")
3. Spustit Dry Run — overit ze vsechna data jsou validni
4. Zkontrolovat vysledky — "Dry Run Results" panel
5. Spustit skutecnou migraci (tlacitko "Migrate to Supabase")
6. Overit vysledky — "Migration Results" panel
7. Zapnout dual-write rezim (tlacitko "Enable Dual-Write (all)")
8. Testovat po dobu X dni
9. Prepnout na Supabase (tlacitko "Switch to Supabase (all)")
```

### 9.2 Rollback postup

```
1. Kliknout "Rollback to localStorage (all)" — confirm dialog
2. Vsechny namespaces se prepnou zpet na localStorage
3. Data v localStorage jsou stale k dispozici (nikdy se nemazou)
```

### 9.3 Per-namespace prepinani

Kazdy namespace lze prepnout jednotlive kliknutim na jedno ze tri tlacitek v tabulce:
`localStorage` | `dual-write` | `supabase`

Aktivni mod je zvyraznen barvou a fontWeight 600.

---

## 10. Error Handling

### 10.1 Connection errors

| Situace | Chovani |
|---------|---------|
| Supabase neni konfigurovany (chybi env vars) | `setConnection({ ok: false, error: 'Supabase not configured' })` — cerveny dot |
| Supabase query selze | `setConnection({ ok: false, error: error.message })` — cerveny dot |
| Pripojeni OK | `setConnection({ ok: true })` — zeleny dot |

Kdyz connection neni OK, tlacitka "Dry Run" a "Migrate to Supabase" jsou **disabled**.

### 10.2 Migration errors

| Situace | Vysledek |
|---------|----------|
| Supabase neni dostupny | `{ ok: false, error: 'Supabase not configured' }` |
| Tenant nenalezen v Supabase | `{ ok: false, error: 'Tenant "X" not found in Supabase' }` |
| Migrace config selze (upsert error) | `{ status: 'error', error: message }` |
| Migrace orders selze uprostred | `{ status: 'partial', insertedOrders, insertedItems, error }` |
| Migrace log selze uprostred batche | `{ status: 'partial', inserted, error, total }` |
| Vyjimka v jakekoli migraci | `{ status: 'error', error: err.message }` |

Chyby jsou zobrazeny v Results panelu v cervenem textu (`--forge-error`, mono font, 12px).

### 10.3 UI error zobrazeni

```
try {
  const result = await runMigrations({ dryRun, onProgress: setProgress });
  setResults(result);
} catch (err) {
  setResults({
    ok: false, error: err.message,
    total: 0, migrated: 0, skipped: 0, errors: 1, results: []
  });
}
```

Pokud dojde k neocekavanemu erroru (throw), UI nevypadne — error se zachyti a zobrazi
v results panelu jako fallback objekt.

### 10.4 Feature flags error handling

`featureFlags.js` ma graceful handling:
- `loadFlags()` — pokud localStorage vraci neplatny JSON, vraci prazdny objekt `{}`
- `saveFlags()` — pokud zapis selze, tichy fail (silently catch)
- `getStorageMode()` — pokud mod neni validni, vraci default `'localStorage'`
- `setStorageMode()` — pokud mod neni validni, loguje `console.warn` a nic nezapise

### 10.5 migrationRunner error handling

`readLsJson(key)` — pokud JSON.parse selze, vraci `null` (graceful fallback).
Kazda migracni funkce (`migrateConfig`, `migrateLog`, `migrateOrders`) ma vlastni try/catch
v `runMigrations()` smycce — jedna selhana migrace neblokuje dalsi.

---

## 11. Idempotence

### 11.1 Config migrace
Pouzivaji `upsert` s `onConflict: 'tenant_id,namespace'` — bezpecne pro opakovaney spusteni.
Stejny config se prepise bez duplikace.

### 11.2 Orders migrace
Pouzivaji `upsert` s `onConflict: 'tenant_id,order_number'` — objednavky se nepoduplikuji.
**Pozor:** Order items (`order_items`) pouzivaji `insert` (ne upsert) — pri opakovanem spusteni
**dojde k duplikaci order items** pokud jiz existuji. Toto je znamy design trade-off.

### 11.3 Log migrace
Pouzivaji `insert` — log zaznamy se pri opakovanem spusteni **zduplikuji**.
Toto je ocekavane chovani pro logy (appendovat, ne prepisovat).

---

## 12. Tenant izolace

- `getTenantId()` z `adminTenantStorage.js` urcuje aktivniho tenanta
- Vsechny localStorage klice obsahuji tenant ID (viz sekce 6.2)
- Vsechny Supabase operace pouzivaji `tenant_id` (UUID) z dotazu na `tenants` tabulku
- Konverze tenant slug -> UUID probiha pres `getTenantUuid(tenantSlug)` dotazem na Supabase
- **Riziko:** Pokud tenant neexistuje v Supabase, migrace vraci chybu (viz sekce 10.2)

---

## 13. Backup format

Backup se stahuje jako JSON soubor s nazvem `modelpricer-backup-YYYY-MM-DD.json`.

```json
{
  "version": 1,
  "tenantId": "demo-tenant",
  "exportedAt": "2026-02-13T14:30:00.000Z",
  "namespaces": {
    "pricing:v3": {
      "key": "modelpricer:demo-tenant:pricing:v3",
      "data": { ... }
    },
    "orders:v1": {
      "key": "modelpricer:demo-tenant:orders:v1",
      "data": { ... }
    }
  }
}
```

Backup obsahuje POUZE namespaces ktere maji data v localStorage (preskakuje prazdne).
Generovani backupu je **synchronni** — nevyzaduje pripojeni k Supabase.

---

## 14. Interakce s okolnim systemem

### 14.1 Feature Flags storage

Feature flags jsou ulozeny v localStorage pod klicem:
```
modelpricer:feature_flags:storage_modes
```

Tento klic je **tenant-agnosticky** — sdileny pro vsechny tenanty na stejnem browseru.
Format: JSON objekt `{ "pricing:v3": "dual-write", "orders:v1": "localStorage", ... }`.

### 14.2 Vliv na storage helpery

Zmena storage modu ovlivnuje chovani `adminTenantStorage.js`:

| Mod | `readTenantJson()` (sync) | `writeTenantJson()` (sync) | `readTenantJsonAsync()` | `writeTenantJsonAsync()` |
|-----|---------------------------|---------------------------|-------------------------|-------------------------|
| `localStorage` | Cte z LS | Pise do LS | Cte z LS | Pise do LS |
| `dual-write` | Cte z LS | Pise do LS + fire-and-forget Supabase | Cte ze Supabase, fallback LS | Pise do LS + Supabase |
| `supabase` | Cte z LS (sync compat!) | Pise do LS + fire-and-forget Supabase | Cte ze Supabase | Pise do Supabase |

**Dulezite:** Sync API (`readTenantJson`, `writeTenantJson`) VZDY cte/pise z localStorage
kvuli backward kompatibilite. Supabase zapis je fire-and-forget.

### 14.3 Vztah k ALL_NAMESPACES

`featureFlags.js` definuje 20 namespaces v `ALL_NAMESPACES` poli.
`migrationRunner.js` definuje 19 migraci v `MIGRATIONS` poli.

**Nesoulad:** `dashboard:v1` je v `ALL_NAMESPACES` ale NEMA migraci v `MIGRATIONS`
(migrace 013 je pro `dashboard:v2`). To znamena ze `dashboard:v1` namespace lze prepnout
na supabase mod, ale migrace pro nej neexistuje. Toto je ocekavane — `dashboard:v1`
je legacy namespace ktery byl nahrazen `dashboard:v2`.

---

## 15. Konfigurace

### 15.1 Environment promenne

| Promenna | Popis | Povinne |
|----------|-------|---------|
| `VITE_SUPABASE_URL` | URL Supabase projektu | Ano (pro Supabase funkce) |
| `VITE_SUPABASE_ANON_KEY` | Verejny anon klic | Ano (pro Supabase funkce) |

Pokud nejsou nastaveny, Supabase klient je `null` a vsechny migracni operace jsou
**disabled** (tlacitka disabled, connection cervena).

### 15.2 Konstanty v kodu

| Konstanta | Hodnota | Kde | Popis |
|-----------|---------|-----|-------|
| `STORAGE_KEY` | `'modelpricer:feature_flags:storage_modes'` | `featureFlags.js:14` | localStorage klic pro feature flags |
| `ALL_NAMESPACES` | 20 polozek | `featureFlags.js:17-38` | Vsechny zname namespaces |
| `VALID_MODES` | `['localStorage', 'supabase', 'dual-write']` | `featureFlags.js:40` | Povolene storage mody |
| `MIGRATIONS` | 19 polozek | `migrationRunner.js:18-171` | Definice vsech migraci |
| `batchSize` | `500` | `migrationRunner.js:255` | Velikost batche pro log migrace |

### 15.3 Supabase klient konfigurace

```javascript
createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'x-client-info': 'modelpricer-v3',
    },
  },
});
```

---

## 16. Omezeni a znama rizika

### 16.1 Zadna lokalizace (i18n)
Vsechny texty na strance jsou hardcoded v anglictine. Stranka nepouziva `useLanguage()`
ani zadny prekladovy slovnik. Toto je konzistentni s tim ze migrace je intern-admin nastroj.

### 16.2 Order items duplikace
Pri opakovanem spusteni migrace objednavek se order items **zduplikuji** protoze pouzivaji
`insert` misto `upsert`. Objednavky samotne se nepoduplikuji (upsert na `tenant_id,order_number`).

### 16.3 Zadna obnoveni (restore) funkce
Stranka umoznuje **stahnout** backup ale **neumi ho nahrat zpet**. Restore je manualni
proces — uzivatel musi data importovat rucne do localStorage.

### 16.4 Tenant-agnosticke feature flags
Feature flags jsou sdileny pro vsechny tenanty na stejnem browseru. Pokud admin spravuje
vice tenantu, zmena modu ovlivni vsechny.

### 16.5 Synchronni API backward kompatibilita
Sync `readTenantJson()` VZDY cte z localStorage — i v `supabase` modu. To znamena ze po
prepnuti na `supabase` mod budou sync-only komponenty stale cist stara data z localStorage,
pokud nepouzivaji async API.

### 16.6 Zadna selektivni migrace v UI
UI neumoznuje spustit migraci pro jednotlivy namespace — vzdy se spousti vsech 19 najednou.
API `runMigrations()` toto podporuje pres parametr `migrationIds`, ale UI ho nevyuziva.

---

## 17. CSS tridy

| Trida | Element | Pouziti |
|-------|---------|---------|
| `.mig-page` | `div` | Hlavni wrapper stranky |
| `.mig-title` | `h1` | Hlavni nadpis "Database Migration" |
| `.mig-subtitle` | `p` | Podnapis |
| `.mig-section-title` | `h2` | Sekce nadpis (uppercase, tech font) |
| `.mig-conn-status` | `div` | Connection status box (inline styles pro barvu) |
| `.mig-actions` | `div` | Flex kontejner pro tlacitka |
| `.mig-btn` | `button` | Zakladni button styl |
| `.mig-btn-secondary` | `button` | Sekundarni button (elevated pozadi) |
| `.mig-btn-outline` | `button` | Outline button (teal border) |
| `.mig-btn-primary` | `button` | Primarni button (teal pozadi) |
| `.mig-btn-warn-outline` | `button` | Warning outline button (oranzovy border) |
| `.mig-btn-success-outline` | `button` | Success outline button (zeleny border) |
| `.mig-btn-danger-outline` | `button` | Danger outline button (cerveny border) |
| `.mig-table-wrap` | `div` | Wrapper tabulky s border a overflow |
| `.mig-table` | `table` | Tabulka s collapse borders |
| `.mig-table th` | `th` | Hlavicka tabulky (uppercase, tech font) |
| `.mig-table td` | `td` | Bunka tabulky |

---

## 18. Zavislosti

### 18.1 NPM zavislosti
| Balicek | Pouziti |
|---------|---------|
| `react` | useState, useEffect, useCallback |
| `@supabase/supabase-js` | Supabase klient (createClient) |

### 18.2 Interni zavislosti
| Modul | Pouziti |
|-------|---------|
| `src/lib/supabase/migrationRunner.js` | Migracni logika, backup, rollout |
| `src/lib/supabase/featureFlags.js` | Per-namespace mode management |
| `src/lib/supabase/client.js` | Supabase klient, connection check |
| `src/utils/adminTenantStorage.js` | `getTenantId()` (pouzivano v migrationRunner) |

---

## 19. Mozna budouci rozsireni

1. **Restore z backupu** — upload JSON souboru a obnoveni dat do localStorage
2. **Selektivni migrace** — UI pro spusteni migrace jednoho konkretniho namespace
3. **Lokalizace** — pridani CS prekladu (pokud bude pozadovano)
4. **Migration status persistence** — ulozeni stavu migraci (kdy byla naposledy spustena)
5. **Order items deduplication** — upsert misto insert pro order_items
6. **Progress pro log batche** — detailnejsi progress uvnitr velke log migrace
7. **Tenant-scoped feature flags** — aby kazdy tenant mohl mit vlastni storage mod
