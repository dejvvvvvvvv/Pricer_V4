# Supabase -- Dokumentace

> Supabase infrastruktura: 25 tabulek, RLS, storage buckety, feature flags, StorageAdapter.
> Phase 4 migrace z localStorage na Supabase PostgreSQL.

---

## 1. Prehled

ModelPricer V3 pouziva Supabase jako databazovy backend pro migraci z localStorage. Architektura
je navrzena pro postupny prechod: kazdy datovy namespace (napr. `pricing:v3`, `orders:v1`) ma
vlastni feature flag urcujici zda se cte/pise z localStorage, Supabase, nebo obou (dual-write).

**Klicove vlastnosti:**
- **25 PostgreSQL tabulek** s Row Level Security (RLS)
- **3 storage buckety** pro binarni soubory (modely, dokumenty, branding)
- **Feature flags** per-namespace (localStorage / supabase / dual-write)
- **StorageAdapter** abstrakce -- jediny modul ktery komunikuje s obema systemy
- **MigrationRunner** -- orchestrace localStorage -> Supabase migrace s dry-run, backup a rollback
- **Default mod: localStorage** -- Supabase je opt-in, bezpecny fallback pri chybejici konfiguraci

**Stav:** Phase 4 (demo faze). Autentizace pres JWT neni dosud implementovana -- RLS policies
pouzivaji permisivni `anon` pristup. Produkci vyzaduje zprisneni na `auth.jwt()` claims.

---

## 2. Technologie

| Technologie | Verze / Info | Ucel |
|---|---|---|
| Supabase | cloud/self-hosted | PostgreSQL + auth + storage + realtime |
| `@supabase/supabase-js` | v package.json | Klientska knihovna |
| PostgreSQL | Supabase managed | Databaze |
| Row Level Security (RLS) | nativni PG | Tenant izolace na urovni DB |
| UUID v4 | `uuid-ossp` extension | Primarni klice |
| Vite env vars | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Konfigurace klienta |
| localStorage | Web Storage API | Fallback + feature flags |

---

## 3. Architektura souboru

### 3.1 SQL soubory (supabase/)

| Soubor | Radku | Ucel |
|---|---|---|
| `supabase/schema.sql` | 551 | Vsech 25 tabulek, indexy, RLS policies, triggery |
| `supabase/storage-policies.sql` | 101 | RLS policies pro 3 storage buckety |
| `supabase/seed.sql` | 147 | Demo data pro `demo-tenant` |

### 3.2 JavaScript moduly (src/lib/supabase/)

| Soubor | Radku | Ucel |
|---|---|---|
| `client.js` | 65 | Singleton Supabase klient, health check |
| `featureFlags.js` | 138 | Per-namespace mode switching (localStorage/supabase/dual-write) |
| `storageAdapter.js` | 348 | Abstrakce cteni/zapisu -- deleguje podle feature flags |
| `migrationRunner.js` | 538 | 19 migraci, dry-run, backup, rollback |
| `index.js` | 26 | Barrel export -- reexportuje vsechny moduly |

**Celkem JS:** ~1115 radku

---

## 4. Import graf

```
index.js (barrel export)
  |-- re-exports --> client.js
  |-- re-exports --> featureFlags.js
  |-- re-exports --> storageAdapter.js
  |-- re-exports --> migrationRunner.js

storageAdapter.js
  |-- import { supabase, isSupabaseAvailable } from './client'
  |-- import { getStorageMode, isSupabaseEnabled, isLocalStorageEnabled } from './featureFlags'

migrationRunner.js
  |-- import { supabase, isSupabaseAvailable } from './client'
  |-- import { setStorageMode, setAllStorageModes } from './featureFlags'
  |-- import { getTenantId } from '../../utils/adminTenantStorage'

client.js
  |-- import { createClient } from '@supabase/supabase-js'

featureFlags.js
  |-- (zadne externi zavislosti -- ciste localStorage operace)
```

**Externi konzumenti:**
- Storage helpery (`src/utils/admin*Storage.js`) pouzivaji `storageAdapter` z indexu
- Admin migrace stranka (`AdminMigration.jsx`) pouziva `migrationRunner` funkce
- Hooks (`useStorageQuery`, `useStorageMutation`) deleguji na adapter

---

## 6. Datovy model -- vsechny tabulky

### 6.1 Prehled vsech 25 tabulek

| # | Tabulka | Namespace | Typ | Popis |
|---|---|---|---|---|
| 1 | `tenants` | -- | root entita | Multi-tenancy zaklad, plan, features |
| 2 | `pricing_configs` | `pricing:v3` | config | Cenova konfigurace (materialy, sazby, volume discounts) |
| 3 | `materials` | -- | relacni | Materialy pro relacni dotazy (PLA, PETG, ABS...) |
| 4 | `fees` | `fees:v3` | config | Poplatky a priruzky |
| 5 | `customers` | -- | entita | Zakaznicka databaze |
| 6 | `orders` | `orders:v1` | entita | Objednavky se snapshoty |
| 7 | `order_items` | -- | detail | Modely v ramci objednavky |
| 8 | `order_activity` | `orders:activity:v1` | log | Aktivita na objednavkach |
| 9 | `audit_log` | `audit_log` | log | Audit trail vsech akci |
| 10 | `analytics_events` | `analytics:events` | log | Analytika (eventy, widgety, session) |
| 11 | `coupons` | `coupons:v1` | config | Slevy a kupony |
| 12 | `shipping_methods` | `shipping:v1` | config | Zpusoby doruceni |
| 13 | `email_templates` | `email:v1` | config | Sablony emailu |
| 14 | `email_logs` | -- | log | Logovani odeslanych emailu |
| 15 | `branding` | `branding` | config | Vizualni identita tenanta |
| 16 | `widget_configs` | `widgets` | config | Konfigurace widgetu |
| 17 | `dashboard_configs` | `dashboard:v2` | config | Dashboard layouty |
| 18 | `team_members` | `team_users` / `team_invites` | config | Clenove tymu a pozvanky |
| 19 | `form_configs` | `form:v1` | config | Konfigurace formularu |
| 20 | `express_tiers` | `express:v1` | config | Expresni casy doruceni |
| 21 | `kanban_configs` | `kanban:v1` | config | Kanban nastaveni |
| 22 | `documents` | -- | entita | Reference na binarni soubory |
| 23 | `feature_flags` | -- | config | Remote feature flags |
| 24 | `api_keys` | -- | entita | API klice pro externi integrace |
| 25 | `chat_messages` | -- | entita | Chatove zpravy (budouci) |

### 6.2 Detaily tabulek

#### 1. tenants (root entita)

```sql
id              UUID PK DEFAULT uuid_generate_v4()
slug            TEXT UNIQUE NOT NULL
name            TEXT NOT NULL DEFAULT ''
plan_name       TEXT NOT NULL DEFAULT 'Starter'
plan_features   JSONB NOT NULL DEFAULT '{"can_hide_powered_by": false, ...}'
metadata        JSONB DEFAULT '{}'
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
```

- Root entita pro multi-tenancy
- `slug` je lidsky citelny identifikator (napr. `demo-tenant`)
- `plan_features` obsahuje JSON s limitmi planu (max widgety, max uzivatele, domain whitelist)
- RLS: permisivni SELECT/INSERT/UPDATE pro anon (demo faze)

#### 2. pricing_configs

```sql
id              UUID PK
tenant_id       UUID FK -> tenants(id) ON DELETE CASCADE
namespace       TEXT NOT NULL DEFAULT 'pricing:v3'
data            JSONB NOT NULL DEFAULT '{}'
schema_version  INTEGER NOT NULL DEFAULT 3
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
UNIQUE(tenant_id, namespace)
```

- `data` JSONB obsahuje: materials array, default_material_key, tenant_pricing, volume_discounts
- Namespace-based upsert pres UNIQUE constraint

#### 3. materials (relacni)

```sql
id              UUID PK
tenant_id       UUID FK -> tenants(id) ON DELETE CASCADE
key             TEXT NOT NULL
name            TEXT NOT NULL
enabled         BOOLEAN NOT NULL DEFAULT true
price_per_gram  NUMERIC(10,4) NOT NULL DEFAULT 0
colors          JSONB DEFAULT '[]'
sort_order      INTEGER DEFAULT 0
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
UNIQUE(tenant_id, key)
```

- Extrahovano z pricing_configs pro relacni dotazy
- `key` je unikatni identifikator materialu v ramci tenanta (napr. `pla`, `petg`)
- `colors` je JSON pole dostupnych barev

#### 4. fees

```sql
id              UUID PK
tenant_id       UUID FK -> tenants(id) ON DELETE CASCADE
namespace       TEXT NOT NULL DEFAULT 'fees:v3'
data            JSONB NOT NULL DEFAULT '{}'
schema_version  INTEGER NOT NULL DEFAULT 3
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
UNIQUE(tenant_id, namespace)
```

#### 5. customers

```sql
id              UUID PK
tenant_id       UUID FK -> tenants(id) ON DELETE CASCADE
name            TEXT NOT NULL DEFAULT ''
email           TEXT
phone           TEXT
company         TEXT
metadata        JSONB DEFAULT '{}'
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

- **Indexy:** `idx_customers_tenant(tenant_id)`, `idx_customers_email(tenant_id, email)`

#### 6. orders

```sql
id                  UUID PK
tenant_id           UUID FK -> tenants(id) ON DELETE CASCADE
order_number        TEXT NOT NULL
status              TEXT NOT NULL DEFAULT 'NEW'
customer_id         UUID FK -> customers(id)
customer_snapshot   JSONB DEFAULT '{}'
one_time_fees       JSONB DEFAULT '[]'
totals_snapshot     JSONB DEFAULT '{}'
flags               TEXT[] DEFAULT '{}'
notes               JSONB DEFAULT '[]'
metadata            JSONB DEFAULT '{}'
created_at          TIMESTAMPTZ
updated_at          TIMESTAMPTZ
UNIQUE(tenant_id, order_number)
```

- **Indexy:** `idx_orders_tenant`, `idx_orders_status(tenant_id, status)`, `idx_orders_created(tenant_id, created_at DESC)`
- `customer_snapshot` uchovava kopii zakaznickich dat v okamziku objednavky

#### 7. order_items

```sql
id                          UUID PK
order_id                    UUID FK -> orders(id) ON DELETE CASCADE
tenant_id                   UUID FK -> tenants(id) ON DELETE CASCADE
item_number                 TEXT
quantity                    INTEGER NOT NULL DEFAULT 1
file_snapshot               JSONB DEFAULT '{}'
material_snapshot           JSONB DEFAULT '{}'
color_snapshot              TEXT
preset_snapshot             JSONB DEFAULT '{}'
resolved_config_snapshot    JSONB DEFAULT '{}'
slicer_snapshot             JSONB DEFAULT '{}'
pricing_snapshot            JSONB DEFAULT '{}'
price_breakdown_snapshot    JSONB DEFAULT '{}'
flags                       TEXT[] DEFAULT '{}'
revisions                   JSONB DEFAULT '{"price":[],"slicer":[]}'
created_at                  TIMESTAMPTZ
updated_at                  TIMESTAMPTZ
```

- **Indexy:** `idx_order_items_order(order_id)`, `idx_order_items_tenant(tenant_id)`
- Kazdy item = jeden 3D model v objednavce se vsemi snapshoty (material, cena, slicer vysledek)

#### 8. order_activity

```sql
id          UUID PK
tenant_id   UUID FK -> tenants(id) ON DELETE CASCADE
order_id    UUID FK -> orders(id) ON DELETE CASCADE
user_id     TEXT
type        TEXT NOT NULL
payload     JSONB DEFAULT '{}'
created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
```

- **Indexy:** `idx_order_activity_tenant`, `idx_order_activity_order`, `idx_order_activity_created`
- Log tabulka (bez updated_at) -- append-only

#### 9. audit_log

```sql
id          UUID PK
tenant_id   UUID FK -> tenants(id) ON DELETE CASCADE
action      TEXT NOT NULL
entity_type TEXT
entity_id   TEXT
actor       JSONB DEFAULT '{}'
details     JSONB DEFAULT '{}'
ip_address  TEXT
user_agent  TEXT
created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
```

- **Indexy:** `idx_audit_log_tenant`, `idx_audit_log_created`, `idx_audit_log_action(tenant_id, action)`
- `actor` JSONB obsahuje id, email, name osoby ktera akci provedla

#### 10. analytics_events

```sql
id          UUID PK
tenant_id   UUID FK -> tenants(id) ON DELETE CASCADE
event_type  TEXT NOT NULL
widget_id   TEXT
session_id  TEXT
payload     JSONB DEFAULT '{}'
created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
```

- **Indexy:** `idx_analytics_tenant`, `idx_analytics_type(tenant_id, event_type)`, `idx_analytics_created`

#### 11-21. Config tabulky (spolecny vzor)

Tabulky `coupons`, `shipping_methods`, `email_templates`, `branding`, `widget_configs`,
`dashboard_configs`, `team_members`, `form_configs`, `express_tiers`, `kanban_configs`
sdili spolecnou strukturu:

```sql
id          UUID PK
tenant_id   UUID FK -> tenants(id) ON DELETE CASCADE
namespace   TEXT NOT NULL DEFAULT '<defaultni_namespace>'
data        JSONB NOT NULL DEFAULT '{}'
created_at  TIMESTAMPTZ
updated_at  TIMESTAMPTZ
UNIQUE(tenant_id, namespace)
```

Vyjimky:
- `team_members` pouziva 2 namespace hodnoty: `team_users` a `team_invites`
- `widget_configs` pouziva 2 namespace hodnoty: `widgets` a `widget_theme` (pres NAMESPACE_TABLE_MAP)
- `dashboard_configs` pouziva 2 namespace hodnoty: `dashboard:v1` a `dashboard:v2`

#### 14. email_logs

```sql
id              UUID PK
tenant_id       UUID FK -> tenants(id) ON DELETE CASCADE
template_id     TEXT
recipient_email TEXT
subject         TEXT
status          TEXT NOT NULL DEFAULT 'sent'
metadata        JSONB DEFAULT '{}'
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
```

- **Index:** `idx_email_logs_tenant(tenant_id)`

#### 22. documents

```sql
id              UUID PK
tenant_id       UUID FK -> tenants(id) ON DELETE CASCADE
order_id        UUID FK -> orders(id) ON DELETE SET NULL
filename        TEXT NOT NULL
storage_path    TEXT NOT NULL
mime_type       TEXT
size_bytes      BIGINT
bucket          TEXT NOT NULL DEFAULT 'documents'
metadata        JSONB DEFAULT '{}'
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
```

- **Indexy:** `idx_documents_tenant`, `idx_documents_order`
- Reference na soubory ulozene v Supabase Storage bucketech

#### 23. feature_flags

```sql
id          UUID PK
tenant_id   UUID FK -> tenants(id) ON DELETE CASCADE
flag_key    TEXT NOT NULL
enabled     BOOLEAN NOT NULL DEFAULT false
metadata    JSONB DEFAULT '{}'
created_at  TIMESTAMPTZ
updated_at  TIMESTAMPTZ
UNIQUE(tenant_id, flag_key)
```

- Remote feature flags (doplnuje lokalni flags v localStorage)

#### 24. api_keys

```sql
id          UUID PK
tenant_id   UUID FK -> tenants(id) ON DELETE CASCADE
name        TEXT NOT NULL
key_hash    TEXT NOT NULL
key_prefix  TEXT NOT NULL
scopes      TEXT[] DEFAULT '{}'
last_used_at    TIMESTAMPTZ
expires_at      TIMESTAMPTZ
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
revoked_at      TIMESTAMPTZ
```

- **Indexy:** `idx_api_keys_tenant`, `idx_api_keys_prefix(key_prefix)`
- Klice ukladany jako hash, prefix pro rychle vyhledani

#### 25. chat_messages

```sql
id          UUID PK
tenant_id   UUID FK -> tenants(id) ON DELETE CASCADE
order_id    UUID FK -> orders(id) ON DELETE CASCADE
sender_type TEXT NOT NULL DEFAULT 'customer'
sender_id   TEXT
message     TEXT NOT NULL
metadata    JSONB DEFAULT '{}'
created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
```

- **Indexy:** `idx_chat_tenant`, `idx_chat_order`
- Pripraveno pro budouci customer chat

### 6.3 NAMESPACE_TABLE_MAP (storageAdapter.js)

Mapovani mezi localStorage namespace a Supabase tabulkou:

```
'pricing:v3'         -> 'pricing_configs'
'fees:v3'            -> 'fees'
'orders:v1'          -> 'orders'
'orders:activity:v1' -> 'order_activity'
'shipping:v1'        -> 'shipping_methods'
'coupons:v1'         -> 'coupons'
'express:v1'         -> 'express_tiers'
'form:v1'            -> 'form_configs'
'email:v1'           -> 'email_templates'
'kanban:v1'          -> 'kanban_configs'
'dashboard:v1'       -> 'dashboard_configs'
'dashboard:v2'       -> 'dashboard_configs'
'audit_log'          -> 'audit_log'
'analytics:events'   -> 'analytics_events'
'team_users'         -> 'team_members'
'team_invites'       -> 'team_members'
'branding'           -> 'branding'
'widgets'            -> 'widget_configs'
'plan_features'      -> 'tenants'
'widget_theme'       -> 'widget_configs'
```

**Poznamka:** Nektere tabulky obslhuji vice namespace hodnot (napr. `team_members` pro `team_users`
i `team_invites`, `widget_configs` pro `widgets` i `widget_theme`).

---

## 8. Komponenty

### 8.1 client.js -- Supabase klient

**Soubor:** `src/lib/supabase/client.js` (65 radku)

Singleton instance `@supabase/supabase-js` klienta. Cte env vars:
- `VITE_SUPABASE_URL` -- Supabase project URL
- `VITE_SUPABASE_ANON_KEY` -- verejny anon klic

**Exporty:**

| Export | Typ | Popis |
|---|---|---|
| `supabase` | object / null | Singleton klient. `null` pokud env vars chybi |
| `isSupabaseAvailable()` | function -> boolean | Kontrola zda je klient inicializovan |
| `checkSupabaseConnection()` | async function -> {ok, error?} | Health check -- dotaz na `tenants` tabulku |

**Chovani pri chybejicich env vars:**
- `console.warn` o chybejici konfiguraci
- `supabase = null` -- vsechny operace padnou na localStorage fallback
- Zadny crash -- graceful degradation

**Konfigurace klienta:**
```javascript
{
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'x-client-info': 'modelpricer-v3',
    },
  },
}
```

### 8.2 featureFlags.js -- Feature flags

**Soubor:** `src/lib/supabase/featureFlags.js` (138 radku)

Per-namespace prepinac mezi storage backendy. Feature flags se ukladaji v localStorage pod
klicem `modelpricer:feature_flags:storage_modes`.

**Tri mody:**

| Mod | Read z | Write do | Pouziti |
|---|---|---|---|
| `localStorage` | localStorage | localStorage | Default (pred migraci) |
| `supabase` | Supabase | Supabase | Po uspesne migraci |
| `dual-write` | Supabase (fallback LS) | localStorage + Supabase | Prechodne obdobi |

**Vsech 20 registrovanych namespaces:**

```
pricing:v3, fees:v3, orders:v1, orders:activity:v1, shipping:v1,
coupons:v1, express:v1, form:v1, email:v1, kanban:v1,
dashboard:v1, dashboard:v2, audit_log, analytics:events,
team_users, team_invites, branding, widgets, plan_features, widget_theme
```

**Exporty:**

| Export | Typ | Popis |
|---|---|---|
| `getStorageMode(namespace)` | function -> string | Vrati mod pro namespace (default: `'localStorage'`) |
| `setStorageMode(namespace, mode)` | function | Nastavi mod pro 1 namespace |
| `setAllStorageModes(mode)` | function | Nastavi mod pro VSECHNY namespaces |
| `getAllStorageModes()` | function -> object | Vrati `{namespace: mode}` pro vsechny |
| `isSupabaseEnabled(namespace)` | function -> boolean | `true` pokud mode = `supabase` nebo `dual-write` |
| `isLocalStorageEnabled(namespace)` | function -> boolean | `true` pokud mode = `localStorage` nebo `dual-write` |
| `ALL_NAMESPACES` | string[] | Vsech 20 registrovanych namespaces |
| `VALID_MODES` | string[] | `['localStorage', 'supabase', 'dual-write']` |

### 8.3 storageAdapter.js -- Storage abstrakce

**Soubor:** `src/lib/supabase/storageAdapter.js` (348 radku)

Jediny modul ktery primo komunikuje s localStorage I Supabase. Vsechny storage helpery by meli
pouzivat tento adapter misto primych volani.

**Verejne API (storageAdapter objekt):**

| Metoda | Signatura | Popis |
|---|---|---|
| `read()` | `async (namespace, tenantId, lsKey, fallback) -> any` | Precte config podle feature flags |
| `write()` | `async (namespace, tenantId, lsKey, value) -> void` | Zapise config podle feature flags |
| `readList()` | `async (namespace, tenantId, lsKey, lsFallback, supabaseOptions?) -> any` | Precte seznam zaznamu (orders, logy) |
| `appendLog()` | `async (namespace, tenantId, lsKey, entry, maxItems?) -> void` | Prida zaznam do logu |

**Direct Supabase operace (storageAdapter.supabase):**

| Metoda | Signatura | Popis |
|---|---|---|
| `readConfig()` | `async (table, tenantId, namespace, fallback)` | Primo cteni z Supabase |
| `writeConfig()` | `async (table, tenantId, namespace, value)` | Primo upsert do Supabase |
| `readList()` | `async (table, tenantId, options?)` | Primo cteni seznamu s paginaci |
| `insert()` | `async (table, record)` | Primo vlozeni zaznamu |
| `update()` | `async (table, id, updates)` | Primo update podle id |
| `delete()` | `async (table, id)` | Primo smazani podle id |

**Sentinel hodnota:** `NOT_FOUND = Symbol('NOT_FOUND')` rozlisuje "zadny radek" od "data je null".

**Chovani v jednotlivych modech:**

```
read() v modu 'localStorage':
  -> cte z localStorage

read() v modu 'supabase':
  -> cte z Supabase
  -> pokud zadny radek -> vraci fallback

read() v modu 'dual-write':
  -> cte z Supabase
  -> pokud zadny radek -> fallback na localStorage
  -> pokud ani v localStorage -> vraci fallback

write() v modu 'localStorage':
  -> pise do localStorage

write() v modu 'supabase':
  -> pise do Supabase (localStorage se NEAKTUALIZUJE)

write() v modu 'dual-write':
  -> pise do localStorage
  -> pise do Supabase
```

**Error handling:** Vsechny Supabase operace maji try/catch. Pri chybe se loguje `console.warn`
a vraci se fallback hodnota. Zadny throw -- graceful degradation.

### 8.4 migrationRunner.js -- Migracni orchestrator

**Soubor:** `src/lib/supabase/migrationRunner.js` (538 radku)

Orchestruje prenos dat z localStorage do Supabase. Obsahuje definice 19 migraci, 3 migracni
strategie (config, log, orders), a utility funkce.

**19 migraci:**

| ID | Nazev | Namespace | Tabulka | Typ |
|---|---|---|---|---|
| 001-pricing | Pricing Configuration | `pricing:v3` | pricing_configs | config |
| 002-fees | Fees Configuration | `fees:v3` | fees | config |
| 003-orders | Orders | `orders:v1` | orders | orders |
| 004-order-activity | Order Activity | `orders:activity:v1` | order_activity | log |
| 005-audit | Audit Log | `audit_log` | audit_log | log |
| 006-analytics | Analytics Events | `analytics:events` | analytics_events | log |
| 007-shipping | Shipping Methods | `shipping:v1` | shipping_methods | config |
| 008-coupons | Coupons | `coupons:v1` | coupons | config |
| 009-express | Express Tiers | `express:v1` | express_tiers | config |
| 010-email | Email Templates | `email:v1` | email_templates | config |
| 011-form | Form Configuration | `form:v1` | form_configs | config |
| 012-kanban | Kanban Configuration | `kanban:v1` | kanban_configs | config |
| 013-dashboard | Dashboard Configuration | `dashboard:v2` | dashboard_configs | config |
| 014-branding | Branding | `branding` | branding | config |
| 015-widgets | Widget Configurations | `widgets` | widget_configs | config |
| 016-plan | Plan Features | `plan_features` | tenants | config |
| 017-widget-theme | Widget Theme | `widget_theme` | widget_configs | config |
| 018-team-users | Team Users | `team_users` | team_members | config |
| 019-team-invites | Team Invites | `team_invites` | team_members | config |

**Tri migracni strategie:**

1. **config** (`migrateConfig`) -- Precte JSON z localStorage, upsertne jako `data` JSONB sloupec.
   Specialni pripad: `plan_features` jde do `tenants.plan_features` sloupce.

2. **log** (`migrateLog`) -- Precte JSON pole z localStorage, batch insert do tabulky (po 500).
   Mapuje fieldy pres `mapLogEntry()` podle cilove tabulky (audit_log, analytics_events,
   order_activity).

3. **orders** (`migrateOrders`) -- Precte objednavky, pro kazdou upsertne `orders` radek +
   insert `order_items` pro modely. Pouziva snapshoty (customer, totals, material, pricing).

**Exporty:**

| Export | Typ | Popis |
|---|---|---|
| `getMigrationList()` | function -> array | Seznam vsech migraci s info o localStorage datech |
| `runMigrations(options)` | async function -> object | Spusteni migraci s progress callbackem |
| `backupLocalStorage()` | function -> object | Export vsech localStorage dat do JSON |
| `enableSupabaseForAll()` | function | Prepne vsechny namespaces na `supabase` mod |
| `enableDualWriteForAll()` | function | Prepne vsechny namespaces na `dual-write` mod |
| `rollbackToLocalStorage()` | function | Prepne vsechny namespaces zpet na `localStorage` mod |
| `MIGRATIONS` | array | Pole migracnich definic |

**runMigrations options:**

```javascript
{
  dryRun: boolean,       // true = jen validace, zadny zapis
  migrationIds: string[], // konkretni migrace (null = vsechny)
  onProgress: function    // callback { current, total, migration, result }
}
```

**Navratova hodnota runMigrations:**

```javascript
{
  ok: boolean,      // true pokud 0 erroru
  dryRun: boolean,
  total: number,    // celkovy pocet migraci
  migrated: number, // uspesne migrovane
  skipped: number,  // preskocene (zadna data v localStorage)
  errors: number,   // chyby
  results: [        // detail pro kazdou migraci
    { migrationId, name, status, ... }
  ]
}
```

**Status hodnoty:** `migrated`, `skipped`, `dry-run`, `error`, `partial`

### 8.5 index.js -- Barrel export

**Soubor:** `src/lib/supabase/index.js` (26 radku)

Reexportuje vsechny verejne funkce a konstanty z ostatnich modulu. Konzumenti importuji z
`@/lib/supabase` (nebo `src/lib/supabase`).

**Kompletni seznam reexportu:**

```javascript
// Z client.js
supabase, isSupabaseAvailable, checkSupabaseConnection

// Z storageAdapter.js
storageAdapter, getTableForNamespace

// Z featureFlags.js
getStorageMode, setStorageMode, setAllStorageModes, getAllStorageModes,
isSupabaseEnabled, isLocalStorageEnabled, ALL_NAMESPACES, VALID_MODES

// Z migrationRunner.js
getMigrationList, runMigrations, backupLocalStorage,
enableSupabaseForAll, enableDualWriteForAll, rollbackToLocalStorage, MIGRATIONS
```

---

## 9. Data flow

### 9.1 Zapis (write)

```
UI komponenta
  |
  v
Storage helper (napr. adminPricingStorage.js)
  |  volani: writeTenantJson(namespace, data)
  v
storageAdapter.write(namespace, tenantId, lsKey, value)
  |
  |-- getStorageMode(namespace)
  |
  |-- mode === 'localStorage'?
  |     |-- YES --> lsWrite(lsKey, value)  [KONEC]
  |
  |-- isLocalStorageEnabled(namespace)?
  |     |-- YES (localStorage || dual-write)
  |     |     --> lsWrite(lsKey, value)
  |
  |-- isSupabaseEnabled(namespace) && isSupabaseAvailable() && table?
        |-- YES (supabase || dual-write)
              --> supabaseWriteConfig(table, tenantId, namespace, value)
                    |-- supabase.from(table).upsert({tenant_id, namespace, data, updated_at})
```

### 9.2 Cteni (read)

```
UI komponenta
  |
  v
Storage helper
  |  volani: readTenantJson(namespace, fallback)
  v
storageAdapter.read(namespace, tenantId, lsKey, fallback)
  |
  |-- getStorageMode(namespace)
  |
  |-- mode === 'localStorage' || !isSupabaseAvailable() || !table?
  |     |-- YES --> lsRead(lsKey, fallback)  [KONEC]
  |
  |-- supabaseReadConfig(table, tenantId, namespace, NOT_FOUND)
  |     |-- result !== NOT_FOUND?
  |     |     |-- YES --> return result  [KONEC]
  |
  |-- mode === 'dual-write'?
  |     |-- YES --> lsRead(lsKey, fallback)  [KONEC]
  |
  |-- return fallback  [KONEC]
```

### 9.3 Migrace (jednoruzovy prenos)

```
AdminMigration.jsx
  |
  v
runMigrations({ dryRun: false, onProgress })
  |
  |-- getTenantId() --> tenantSlug
  |-- getTenantUuid(tenantSlug) --> tenantUuid
  |
  |-- Pro kazdou migraci:
  |     |-- type === 'config'?  --> migrateConfig()
  |     |-- type === 'log'?     --> migrateLog()
  |     |-- type === 'orders'?  --> migrateOrders()
  |     |
  |     |-- onProgress({ current, total, migration, result })
  |
  |-- Vysledek: { ok, total, migrated, skipped, errors, results }
  |
  v
enableDualWriteForAll()  // nebo enableSupabaseForAll()
```

### 9.4 Feature flag lifecycle

```
1. PRED MIGRACI (default)
   Vsechny namespaces: mode = 'localStorage'
   --> Vsechno cte/pise z localStorage
   --> Supabase neni nutny

2. SPUSTENI MIGRACE
   runMigrations() --> data z localStorage se zkopiruje do Supabase
   enableDualWriteForAll()
   --> Zapis jde do OBOU (localStorage + Supabase)
   --> Cteni preferuje Supabase s fallbackem na localStorage

3. OVERENI
   Nechat dual-write po dobu overovani
   --> Oba systemy maji stejna data
   --> Pokud problem --> rollbackToLocalStorage()

4. PLNY PRECHOD
   enableSupabaseForAll()
   --> Zapis/cteni jen Supabase
   --> localStorage se neaktualizuje

5. ROLLBACK (kdykoliv)
   rollbackToLocalStorage()
   --> Navrat na localStorage
   --> Data v Supabase zustavaji ale nepouzivaji se
```

---

## 14. Bezpecnost

### 14.1 Row Level Security (RLS)

**Vsech 25 tabulek ma povoleny RLS** (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).

**Aktualni stav (Phase 4 -- demo faze):**

RLS policies jsou **permisivni** -- povoleno vse pro `anon` roli:

```sql
-- Tabulka tenants: explicitni SELECT/INSERT/UPDATE pro anon
CREATE POLICY "tenants_select_anon" ON tenants FOR SELECT USING (true);
CREATE POLICY "tenants_insert_anon" ON tenants FOR INSERT WITH CHECK (true);
CREATE POLICY "tenants_update_anon" ON tenants FOR UPDATE USING (true);

-- Vsech 24 datovych tabulek: SELECT/INSERT/UPDATE/DELETE pro anon
-- Generovano dynamicky pres DO $$ blok
```

**Dulezite:** Tyto policies jsou docasne. Produkce musi pouzivat:
```sql
-- Budouci Phase 5+ policies
auth.jwt() ->> 'tenant_id' = tenant_id
```

**Helper funkce pro tenant_id z headeru:**

```sql
CREATE OR REPLACE FUNCTION get_request_tenant_id()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    current_setting('request.headers', true)::json->>'x-tenant-id',
    'demo-tenant'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Pouzita pro demo fazi; bude nahrazena JWT claims.

### 14.2 Storage buckety -- policies

**3 buckety:**

| Bucket | Pristup | Ucel | Typy souboru |
|---|---|---|---|
| `models` | private | 3D modely (.stl, .obj, .3mf) | model soubory |
| `documents` | private | PDF, faktury, dokumenty | dokumenty |
| `branding` | public (read) | Loga, favicony | obrazky |

**Policies (vsechny na `storage.objects`):**

Kazdy bucket ma 4 policies: SELECT, INSERT, UPDATE, DELETE -- vsechny permisivni (anon pristup).
Filtrovani podle `bucket_id`.

```sql
-- Priklad pro bucket 'models':
CREATE POLICY "models_select_anon" ON storage.objects
  FOR SELECT USING (bucket_id = 'models');
CREATE POLICY "models_insert_anon" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'models');
-- ... analogicky pro UPDATE a DELETE
```

**Branding:** Verejne cteni (`branding_select_public`) -- loga viditelna na embedovanych widgetech.

### 14.3 Klientska bezpecnost

- **Service role key** nesmi zacinat `VITE_` -- zabrani leknuti do frontend bundlu
- **Anon key** je pouzit na klientu -- pristup omezen RLS policies
- **Env vars** se ctou z `.env.local` (v .gitignore)
- **x-client-info header** identifikuje aplikaci (`modelpricer-v3`)

### 14.4 Tenant izolace

- **DB uroven:** Kazda tabulka (krome `tenants`) ma `tenant_id UUID FK`
- **App uroven:** `getTenantId()` z `adminTenantStorage.js` je jediny zdroj tenant ID
- **localStorage uroven:** Klice maji prefix `modelpricer:${tenantId}:` pro izolaci
- **Budouci:** JWT claims budou nest tenant_id -- RLS policies ho vynutia

### 14.5 Updated_at triggery

Automaticky trigger `update_updated_at()` se spousti `BEFORE UPDATE` na 18 tabulkach
s `updated_at` sloupcem. Zajistuje ze casova znacka je vzdy aktualni bez spolelani na klienta.

Tabulky s triggerem: `tenants`, `pricing_configs`, `materials`, `fees`, `customers`, `orders`,
`order_items`, `coupons`, `shipping_methods`, `email_templates`, `branding`, `widget_configs`,
`dashboard_configs`, `team_members`, `form_configs`, `express_tiers`, `kanban_configs`, `feature_flags`.

---

## 15. Konfigurace

### 15.1 Env vars (nutne pro Supabase)

```
# .env.local (v .gitignore)
VITE_SUPABASE_URL=https://<project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# SERVER ONLY — NEMA prefix VITE_ !
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

**Pokud env vars chybi:**
- `supabase = null`
- `isSupabaseAvailable() = false`
- Vsechny operace padaji na localStorage
- `console.warn` informuje o chybejici konfiguraci

### 15.2 Feature flags

Ukladany v localStorage pod klicem `modelpricer:feature_flags:storage_modes`.

**Format:**
```json
{
  "pricing:v3": "localStorage",
  "fees:v3": "dual-write",
  "orders:v1": "supabase"
}
```

**Chybejici klic = default `localStorage`.**

**Zmena flags:**
```javascript
import { setStorageMode, setAllStorageModes } from '@/lib/supabase';

// Jeden namespace
setStorageMode('pricing:v3', 'dual-write');

// Vsechny naraz
setAllStorageModes('supabase');
```

### 15.3 Supabase setup (poradky spusteni SQL)

1. Vytvorit Supabase projekt
2. Nastavit env vars v `.env.local`
3. Spustit `supabase/schema.sql` v SQL Editoru (vytvori tabulky + RLS + triggery)
4. Rucne vytvorit 3 storage buckety: `models` (private), `documents` (private), `branding` (public)
5. Spustit `supabase/storage-policies.sql` (RLS pro buckety)
6. Spustit `supabase/seed.sql` (demo data)

### 15.4 Seed data (demo-tenant)

Seed vytvorit v `seed.sql` pro `demo-tenant`:
- **tenants** -- 1 zaznam (slug: `demo-tenant`, plan: `Starter`)
- **pricing_configs** -- PLA/PETG/ABS materialy, rate_per_hour: 150, schema_version: 3
- **materials** -- 3 relacni zaznamy (pla, petg, abs)
- **fees** -- prazdny config
- **branding** -- vychozi branding (modra/zelena, Inter font, cornerRadius 12)
- **shipping_methods, coupons, express_tiers, email_templates, form_configs, kanban_configs,
  dashboard_configs, widget_configs, team_members** -- prazdne vychozi konfigurace

Vsechny seedy pouzivaji `ON CONFLICT ... DO NOTHING` -- bezpecne pro opetovne spusteni.

---

## 17. Zname omezeni

### 17.1 Bezpecnostni (P0)

| Omezeni | Dopad | Plan reseni |
|---|---|---|
| RLS policies jsou permisivni (anon pristup) | Kdokoliv muze cist/psat data libovolneho tenanta | Phase 5: JWT auth + zprisneni policies |
| Tenant izolace zalozena na `x-tenant-id` headeru | Snadno zfalsovateny | Phase 5: Tenant ID z JWT claims |
| Storage bucket policies bez tenant scoping | Pristup ke vsem souboram ve bucketu | Phase 5: Path-based RLS `{tenant_id}/...` |
| `get_request_tenant_id()` fallback na `demo-tenant` | Pri chybejicim headeru vsechno jde do demo tenanta | Odstranit fallback pri nasazeni auth |

### 17.2 Funkcionalni

| Omezeni | Popis |
|---|---|
| Feature flags jen v localStorage | Remote flags v DB tabulce `feature_flags` nejsou integrovany do `featureFlags.js` |
| Migrace neumi resume | Pokud migrace `orders` selze uprostred, nektere orders se vlozi duplicitne |
| Batch insert log bez deduplikace | Opetovne spusteni `migrateLog` vlozi zaznamy znovu |
| `supabase` mod nepise localStorage | V cistm supabase modu se localStorage neaktualizuje -- pri rollbacku mohou byt stara data |
| Zadna real-time sync | StorageAdapter nepouziva Supabase Realtime -- data se necachuje/nesynchronizuji mezi taby |

### 17.3 Technicke

| Omezeni | Popis |
|---|---|
| Singleton klient | `supabase` je modul-level singleton -- neni mozne mit 2 instance |
| `NOT_FOUND` symbol | Symbol neni serializovatelny -- nesmi uniknout z adapteru |
| localStorage 5-10 MB limit | Velke datasety (stovky objednavek) mohou presahnout limit |
| Zadna offline podpora | Pokud Supabase neni dostupny v modu `supabase`, cteni vraci fallback |
| `mapLogEntry()` je lossy | Transformace localStorage log zaznamu na DB schema muze ztratit neocekavane fieldy |

### 17.4 Migracni

| Omezeni | Popis |
|---|---|
| `plan_features` jde do `tenants` tabulky | Specialni pripad v `migrateConfig` -- neni genericky |
| Branding localStorage klic pouziva `__` separator | `modelpricer_branding__${tid}` vs standardni `modelpricer:${tid}:branding` |
| Widget theme localStorage klic je nekonzistentni | `modelpricer:widget_theme:${tid}` (tenant na konci) vs `modelpricer:${tid}:*` (uprostred) |
| Zadna zpetna migrace (Supabase -> localStorage) | `backupLocalStorage()` exportuje data ale neni funkce pro import zpet |
| `migrateOrders` pouziva `Date.now()` pro order_number | Pokud puvodni order nema `id`, generuje se nestabilni cislo |

---

*Posledni aktualizace: 2026-02-13*
