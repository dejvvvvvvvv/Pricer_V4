# V3-S00c: Strategie migrace databaze — localStorage → Supabase

> **Rozhodnuti:** Supabase (PostgreSQL)
> **Duvod:** Relacni data, predvidatelna cena, built-in auth, self-hosting moznost
> **Firebase:** Zachovat POUZE pro hosting (uz existujici projekt)
> **Casovy ramec:** Migrace mezi Fazi 3 a Fazi 4
> **Generovano:** 2026-02-06
> **Vlastnik:** `mp-sr-storage` + `mp-mid-storage-tenant`

---

## Obsah

1. [Proc Supabase (a ne Firebase/Convex)](#1-proc-supabase-a-ne-firebaseconvex)
2. [Architektura po migraci](#2-architektura-po-migraci)
3. [PostgreSQL schema design](#3-postgresql-schema-design)
4. [Migracni strategie — abstrakce pres storage helpery](#4-migracni-strategie--abstrakce-pres-storage-helpery)
5. [Supabase JS klient — integrace do projektu](#5-supabase-js-klient--integrace-do-projektu)
6. [File storage migrace](#6-file-storage-migrace)
7. [Auth integrace (priprava pro S12)](#7-auth-integrace-priprava-pro-s12)
8. [Realtime features](#8-realtime-features)
9. [Ubuntu server deployment plan](#9-ubuntu-server-deployment-plan)
10. [Casovy plan migrace](#10-casovy-plan-migrace)
11. [Rizika a mitigace](#11-rizika-a-mitigace)
12. [Cenovy odhad](#12-cenovy-odhad)

---

## 1. Proc Supabase (a ne Firebase/Convex)

### 1.1 Srovnani tri kandidatu

| Kriterium | Firebase | Supabase | Convex |
|-----------|----------|----------|--------|
| Databaze | Firestore (NoSQL) | PostgreSQL (SQL) | Document DB |
| Free tier DB | 1 GB | 500 MB | 500 MB |
| Free file storage | VYZADUJE placeny plan! | 1 GB | 1 GB |
| Auth | Built-in 50K MAU | Built-in 50K MAU | Externi (Clerk/Auth0) |
| Reads/writes | 50K/20K per den | Neomezene | 1M function calls/mesic |
| Placeny plan | Pay-as-you-go NEPREDVIDATELNE | $25/mesic FLAT | $25/dev/mesic + overage |
| SQL/joiny | NE | ANO — plne SQL | NE (pres funkce) |
| Self-hosting | NE | ANO (Docker) | ANO (Docker, single-node) |
| Realtime | Ano | Ano (Postgres Changes) | Ano (nejlepsi nativni) |
| Bandwidth | 10 GB/mesic free | 5 GB/mesic free | 1 GB/mesic free |
| Pauza pri neaktivite | NE | ANO (po 7 dnech!) | NE |
| Open source | NE | ANO (Apache 2.0) | NE |
| Edge Functions | Cloud Functions | Deno Edge Functions | Convex Functions |
| Vendor lock-in | Vysoky | Nizky (PostgreSQL standard) | Stredni |
| Dashboard | Vyborny | Dobry | Dobry |
| CLI nastroje | firebase-tools | supabase CLI | convex CLI |
| REST API | NE (SDK only) | Automaticky z DB schema | NE (custom functions) |
| GraphQL | NE | Pres pg_graphql (experimental) | NE |

### 1.2 Proc Supabase vyhrava pro ModelPricer

**A) Relacni data = PostgreSQL je prirozeny**
ModelPricer ma silne relacni data. Objednavka ma zakaznika, modely, materialy, poplatky, slevy,
cenovou konfiguraci. Toto v Firestore vyzaduje slozite joiny na klientu (collection group queries,
denormalizace). V PostgreSQL je to jednoduchy `SELECT ... JOIN`.

Priklady relaci v ModelPricer:
- `orders` → `order_items` (1:N)
- `order_items` → `materials` (N:1)
- `orders` → `customers` (N:1)
- `orders` → `coupons` (N:N pres order_coupons)
- `tenants` → vsechno ostatni (1:N, multi-tenant izolace)
- `email_templates` → `email_logs` (1:N)
- `chat_messages` → `orders` (N:1)

**B) $25/mesic flat vs Firebase nepredvidatelne ucty**
Firebase uctuji per read/write. Jeden spatne napsany listener muze generovat tisice reads za minutu.
Supabase Pro je flat $25/mesic bez ohledu na pocet queries. Pro bootstrap/SaaS startup je predvidatelnost klicova.

**C) Built-in auth pro S12 (Customer Portal)**
Supabase Auth podporuje out-of-box:
- Email + heslo registrace
- Google OAuth
- Magic link (email bez hesla)
- Password reset
- Email verification
- 50K MAU na free tieru

Toto pokryva kompletni pozadavky S12 (Zakaznicky portal) bez externi sluzby.

**D) Self-hosting na Ubuntu serveru az bude potreba**
Supabase je plne open-source. Az bude treba (1000+ uzivatelu, nebo regulacni duvody),
muzeme cely stack (PostgreSQL + GoTrue auth + Storage + Realtime) rozbehnout v Dockeru
na nasem Ubuntu serveru. Firebase self-hosting neexistuje.

**E) File storage na free tieru**
Od rijna 2025 Firebase Storage VYZADUJE Blaze (placeny) plan. Supabase Storage nabizi
1 GB na free tieru — staci pro prototyp a MVP fazi.

**F) Row Level Security — multi-tenant izolace na urovni databaze**
PostgreSQL RLS policies zarucuji, ze tenant A nikdy neuvidi data tenanta B.
Toto je enforcement na urovni DB enginu, ne na urovni aplikacni logiky.

### 1.3 Proc NE Firebase

1. **File storage vyzaduje placeny plan** — deal-breaker pro free tier prototyp
2. **NoSQL pro relacni data** — slozite joiny na klientu, denormalizace, nekonzistence
3. **Nepredvidatelne naklady** — uctuji per read/write, spatny listener = velky ucet
4. **Vendor lock-in** — nelze self-hostovat, nelze migrovat na jiny NoSQL bez rewrite
5. **Zadne SQL** — analytika, reporty, agregace musi byt na klientu nebo v Cloud Functions
6. **Firestore limity** — max 1 write/sec na dokument, 10K writes per batch

**Zachovavame Firebase POUZE pro hosting** — existujici projekt, free tier staci, zero-config deploy.

### 1.4 Proc NE Convex

1. **Auth vyzaduje externi sluzbu** — Clerk ($0-25/mesic navic) nebo Auth0
2. **Document DB** — joiny pres funkce, ne nativni SQL
3. **Nizsi bandwidth** — 1 GB vs 5 GB Supabase na free tieru
4. **Novejsi platforma** — mensi komunita, mene mature, mene SO odpovedi
5. **Compute-heavy operations** — PrusaSlicer slicing = drahe function calls
6. **Cena per developer** — $25/dev/mesic, ne per projekt; pri 2+ devech drahy
7. **Overage pricing** — nad free tier se plati per function call, nepredvidatelne

---

## 2. Architektura po migraci

### 2.1 Cilova architektura

```
Firebase Hosting (cloud, free)
+-- React frontend (static build, port 4028 lokalne)
|   +-- Supabase JS klient (anon key, RLS)
|   +-- localStorage (fallback pro offline, config cache)
|
Supabase Cloud (free -> $25/mesic)
+-- PostgreSQL databaze (vsechna data)
|   +-- RLS policies (multi-tenant izolace)
|   +-- Funkce a triggery (audit log, updated_at)
+-- Auth (registrace, prihlaseni, session management)
|   +-- GoTrue server (50K MAU free)
|   +-- JWT tokeny s tenant_id claim
+-- Storage (3D soubory, PDF dokumenty, loga)
|   +-- Bucket: models (STL, OBJ, 3MF soubory)
|   +-- Bucket: documents (faktury, dodaci listy)
|   +-- Bucket: branding (loga tenantu)
+-- Realtime (Postgres Changes)
|   +-- Channel: order-changes (kanban S14)
|   +-- Channel: chat-messages (chat S11)
|   +-- Channel: notifications (email status S07)
+-- Edge Functions (volitelne, pro budouci API)
    +-- process-webhook (Stripe, e-commerce)
    +-- generate-pdf (server-side rendering)

Ubuntu Server (tvuj stary pocitac) — AZ OD FAZE 4
+-- Node.js Express backend (port 3001)
|   +-- REST API
|   +-- File upload/processing pipeline
|   +-- PrusaSlicer CLI (pres xvfb-run + Flatpak)
|   +-- Supabase client (service_role key, obchazi RLS)
+-- PrusaSlicer (Linux Flatpak)
|   +-- Headless rendering pres xvfb
|   +-- CLI flagy identicke s Windows verzi
+-- Caddy reverse proxy (HTTPS, Let's Encrypt)
+-- PM2 process manager (auto-restart, logy)
```

### 2.2 Datovy tok — typicky request

```
1. Zakaznik nahraje STL na widget
   Frontend -> Supabase Storage (bucket: models)
   Frontend -> Supabase DB (INSERT order_items, status: UPLOADED)

2. Backend zpracuje model
   Backend polls Supabase (SELECT ... WHERE status = 'UPLOADED')
   Backend -> stahne soubor ze Supabase Storage
   Backend -> PrusaSlicer CLI (xvfb-run flatpak run ...)
   Backend -> Supabase DB (UPDATE order_items SET slicer_data = ...)

3. Frontend dostane realtime update
   Supabase Realtime -> Postgres Changes -> frontend callback
   Frontend zobrazi cenu zakaznikovi

4. Zakaznik odesle objednavku
   Frontend -> Supabase DB (UPDATE orders SET status = 'NEW')
   Supabase trigger -> audit_log INSERT
   Supabase Realtime -> Admin kanban se aktualizuje
```

### 2.3 PrusaSlicer na Linuxu

**Instalace (Flatpak):**
```bash
# Prerekvizity
sudo apt update
sudo apt install -y flatpak xvfb libgl1-mesa-glx libgtk-3-0

# Flatpak registr
flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo

# PrusaSlicer instalace
flatpak install -y flathub com.prusa3d.PrusaSlicer

# Overeni
flatpak run com.prusa3d.PrusaSlicer --version
```

**Headless pouziti (vyzaduje xvfb):**
```bash
# Zakladni export G-code
xvfb-run -a flatpak run com.prusa3d.PrusaSlicer \
  --export-gcode \
  --load /path/to/print-profile.ini \
  --load /path/to/filament-profile.ini \
  --load /path/to/printer-profile.ini \
  /path/to/model.stl

# Pouze info (cas, material, rozmer)
xvfb-run -a flatpak run com.prusa3d.PrusaSlicer \
  --info \
  /path/to/model.stl

# Export s konkretnimi parametry
xvfb-run -a flatpak run com.prusa3d.PrusaSlicer \
  --export-gcode \
  --layer-height 0.2 \
  --fill-density 15% \
  --nozzle-diameter 0.4 \
  --output /tmp/output.gcode \
  /path/to/model.stl
```

**Duvod pouziti xvfb:**
PrusaSlicer CLI vyzaduje X11 display i kdyz generuje jen G-code (pouziva GTK pro nektere
interni operace). `xvfb-run` vytvori virtualny framebuffer v pameti — zadny monitor neni treba.

**CLI flagy — Windows vs Linux:**
CLI flagy jsou IDENTICKE na obou platformach. Jediny rozdil je zpusob spusteni
(primo EXE na Windows vs `flatpak run` na Linuxu). Vsechny konfiguracni INI soubory
jsou kompatibilni bez uprav.

---

## 3. PostgreSQL schema design

### 3.1 Prehled tabulek

Nize je kompletni mapovani z localStorage namespaces na PostgreSQL tabulky.

| localStorage namespace | PostgreSQL tabulka | Typ dat | Priorita migrace |
|------------------------|--------------------|---------|-------------------|
| `modelpricer:tenant_id` | `tenants` | Identita tenanta | P0 (zaklad) |
| `modelpricer:{tid}:pricing:v3` | `pricing_configs` + `materials` | Cenova konfigurace | P2 (staticka) |
| `modelpricer:{tid}:fees:v3` | `fees` | Poplatky a slevy | P2 (staticka) |
| `modelpricer:{tid}:orders:v1` | `orders` + `order_items` | Objednavky | P0 (nejvic rostouci) |
| `modelpricer:{tid}:orders:activity:v1` | `order_activity` | Log aktivity | P0 (rychle rostouci) |
| `modelpricer:{tid}:audit_log` | `audit_log` | Audit trail | P1 (rychle rostouci) |
| `modelpricer:{tid}:analytics:events` | `analytics_events` | Analytika | P1 (rychle rostouci) |
| `modelpricer:{tid}:dashboard:v2` | `dashboard_configs` | UI nastaveni | P3 (user preference) |
| `modelpricer:{tid}:team_users` | `team_users` (+ Supabase Auth) | Uzivatele | P1 (auth migrace) |
| `modelpricer:{tid}:team_invites` | `team_invites` | Pozvanky | P1 (auth migrace) |
| `modelpricer_branding__{tid}` | `branding` | Vizualni identita | P3 (staticka) |
| `modelpricer_widgets__{tid}` | `widget_configs` | Widget nastaveni | P3 (staticka) |
| `modelpricer:widget_theme:{tid}` | `widget_themes` | Widget theme | P3 (staticka) |
| `modelpricer_plan_features__{tid}` | `plan_features` | Funkcni omezeni | P2 (staticka) |
| Nove (S04) | `shipping_methods` | Dopravni metody | Novy |
| Nove (S07) | `email_templates` + `email_logs` | Emaily | Novy |
| Nove (S10) | `coupons` + `order_coupons` | Kupony | Novy |
| Nove (S11) | `chat_messages` | Chat zpravy | Novy |
| Nove (S12) | `customers` | Zakaznici | Novy |
| Nove (S13) | `documents` | Generovane PDF | Novy |
| Nove (S20) | `api_keys` | API pristup | Novy |
| Nove | `feature_flags` | Feature flagy | Novy |

### 3.2 SQL schema — klicove tabulky

#### 3.2.1 tenants

```sql
-- Zakladni tabulka pro multi-tenant izolaci
CREATE TABLE tenants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL DEFAULT '',
  slug          TEXT UNIQUE,                              -- URL-safe identifikator
  plan          TEXT NOT NULL DEFAULT 'free'
                CHECK (plan IN ('free', 'starter', 'pro', 'enterprise')),
  owner_user_id UUID REFERENCES auth.users(id),           -- vlastnik tenanta
  settings      JSONB NOT NULL DEFAULT '{}',               -- volna nastaveni
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pro rychly lookup podle slugu
CREATE INDEX idx_tenants_slug ON tenants(slug);

-- Trigger pro automaticky updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Vlastnik vidi svuj tenant
CREATE POLICY "tenant_owner_select" ON tenants
  FOR SELECT USING (
    owner_user_id = auth.uid()
    OR id::text = (auth.jwt() ->> 'tenant_id')
  );

-- Vlastnik muze upravovat svuj tenant
CREATE POLICY "tenant_owner_update" ON tenants
  FOR UPDATE USING (
    owner_user_id = auth.uid()
  );
```

#### 3.2.2 orders

```sql
-- Objednavky — nejdulezitejsi tabulka, nejvic rostouci data
-- Mapuje z localStorage namespace: modelpricer:{tenantId}:orders:v1
CREATE TABLE orders (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_number   TEXT NOT NULL,                              -- ORD-001200 format
  status         TEXT NOT NULL DEFAULT 'NEW'
                 CHECK (status IN (
                   'NEW', 'REVIEW', 'APPROVED', 'PRINTING',
                   'POSTPROCESS', 'READY', 'SHIPPED', 'DONE', 'CANCELED'
                 )),

  -- Zakaznik (snapshot pri vytvoreni, plus FK na customers tabulku)
  customer_id    UUID REFERENCES customers(id),
  customer_snapshot JSONB NOT NULL DEFAULT '{}',             -- { name, email, phone }

  -- Financni souhrn
  subtotal_models    NUMERIC(12,2) NOT NULL DEFAULT 0,
  one_time_fees_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  shipping_total     NUMERIC(12,2) NOT NULL DEFAULT 0,
  min_order_delta    NUMERIC(12,2) NOT NULL DEFAULT 0,
  rounding_delta     NUMERIC(12,2) NOT NULL DEFAULT 0,
  total              NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency           TEXT NOT NULL DEFAULT 'CZK',

  -- Agregace
  sum_time_min   NUMERIC(10,2) NOT NULL DEFAULT 0,
  sum_weight_g   NUMERIC(10,2) NOT NULL DEFAULT 0,
  sum_pieces     INT NOT NULL DEFAULT 0,

  -- Metadata
  flags          TEXT[] NOT NULL DEFAULT '{}',               -- OUT_OF_BOUNDS, SLICER_FAILED, ...
  notes          JSONB NOT NULL DEFAULT '[]',                -- [{ text, author, created_at }]
  one_time_fees  JSONB NOT NULL DEFAULT '[]',                -- [{ id, name, type, amount }]
  coupon_id      UUID REFERENCES coupons(id),

  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexy
CREATE INDEX idx_orders_tenant ON orders(tenant_id);
CREATE INDEX idx_orders_status ON orders(tenant_id, status);
CREATE INDEX idx_orders_created ON orders(tenant_id, created_at DESC);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE UNIQUE INDEX idx_orders_number ON orders(tenant_id, order_number);

-- updated_at trigger
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_tenant_select" ON orders
  FOR SELECT USING (
    tenant_id::text = (auth.jwt() ->> 'tenant_id')
  );

CREATE POLICY "orders_tenant_insert" ON orders
  FOR INSERT WITH CHECK (
    tenant_id::text = (auth.jwt() ->> 'tenant_id')
  );

CREATE POLICY "orders_tenant_update" ON orders
  FOR UPDATE USING (
    tenant_id::text = (auth.jwt() ->> 'tenant_id')
  );

-- Zakaznik vidi pouze SVE objednavky (pro S12 Customer Portal)
CREATE POLICY "orders_customer_select" ON orders
  FOR SELECT USING (
    customer_id = auth.uid()
  );
```

#### 3.2.3 order_items

```sql
-- Normalizovane polozky objednavky (v localStorage jsou vnorene v order.models[])
CREATE TABLE order_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Soubor
  file_storage_path TEXT,                                    -- cesta v Supabase Storage
  file_name         TEXT NOT NULL DEFAULT '',
  file_size_bytes   INT DEFAULT 0,
  uploaded_at       TIMESTAMPTZ,

  -- Mnozstvi
  quantity          INT NOT NULL DEFAULT 1 CHECK (quantity > 0),

  -- Material snapshot (zachyceny v dobe kalkulace)
  material_id       TEXT,                                    -- FK reference do materials tabulky
  material_name     TEXT NOT NULL DEFAULT '',
  material_ppg      NUMERIC(8,4) NOT NULL DEFAULT 0,         -- price_per_gram snapshot

  -- Barva
  color             TEXT DEFAULT '',

  -- Preset snapshot
  preset_id         TEXT,
  preset_name       TEXT DEFAULT '',
  preset_version    INT DEFAULT 1,

  -- Resolved konfigurace (snapshot)
  resolved_config   JSONB NOT NULL DEFAULT '{}',              -- layer_height, fill_density, ...

  -- Slicer data (snapshot)
  slicer_time_min       NUMERIC(10,2) DEFAULT 0,
  slicer_weight_g       NUMERIC(10,2) DEFAULT 0,
  slicer_dimensions     JSONB DEFAULT '{}',                   -- { x, y, z }
  slicer_filament_mm    INT DEFAULT 0,

  -- Cenovy breakdown (snapshot)
  price_material_cost   NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_time_cost       NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_fees_total      NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_model_subtotal  NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_model_total     NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_fees_detail     JSONB NOT NULL DEFAULT '[]',          -- [{ id, name, amount }]

  -- Pricing snapshot
  rate_per_hour         NUMERIC(8,2) DEFAULT 150,

  -- Flagy
  flags                 TEXT[] NOT NULL DEFAULT '{}',

  -- Revize (historie zmena slicer dat a cen)
  revisions_slicer      JSONB NOT NULL DEFAULT '[]',
  revisions_price       JSONB NOT NULL DEFAULT '[]',

  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexy
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_tenant ON order_items(tenant_id);

CREATE TRIGGER trg_order_items_updated_at
  BEFORE UPDATE ON order_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_items_tenant_all" ON order_items
  FOR ALL USING (
    tenant_id::text = (auth.jwt() ->> 'tenant_id')
  );
```

#### 3.2.4 materials

```sql
-- Materialy extrahovane z pricing:v3 konfigurace
-- V localStorage: vnoreny array v pricing config .materials[]
CREATE TABLE materials (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  key             TEXT NOT NULL,                               -- normalizovany klicck ('pla', 'petg', ...)
  name            TEXT NOT NULL,                               -- zobrazovany nazev ('PLA', 'PETG', ...)
  enabled         BOOLEAN NOT NULL DEFAULT true,
  price_per_gram  NUMERIC(8,4) NOT NULL DEFAULT 0,
  colors          JSONB NOT NULL DEFAULT '[]',                 -- [{ name, hex }]
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unikatni material klicck per tenant
CREATE UNIQUE INDEX idx_materials_tenant_key ON materials(tenant_id, key);
CREATE INDEX idx_materials_tenant ON materials(tenant_id);

CREATE TRIGGER trg_materials_updated_at
  BEFORE UPDATE ON materials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "materials_tenant_all" ON materials
  FOR ALL USING (
    tenant_id::text = (auth.jwt() ->> 'tenant_id')
  );
```

#### 3.2.5 pricing_configs

```sql
-- Cenova konfigurace tenanta (tenant_pricing pravidla)
-- V localStorage: modelpricer:{tenantId}:pricing:v3 (root objekt krome .materials)
CREATE TABLE pricing_configs (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  schema_version            INT NOT NULL DEFAULT 3,

  -- Casova sazba
  rate_per_hour             NUMERIC(8,2) NOT NULL DEFAULT 150,

  -- Minimalni fakturovany cas
  min_billed_minutes_enabled BOOLEAN NOT NULL DEFAULT false,
  min_billed_minutes_value   NUMERIC(8,2) NOT NULL DEFAULT 30,

  -- Minimalni cena za model
  min_price_per_model_enabled BOOLEAN NOT NULL DEFAULT false,
  min_price_per_model_value   NUMERIC(10,2) NOT NULL DEFAULT 99,

  -- Minimalni celkova objednavka
  min_order_total_enabled    BOOLEAN NOT NULL DEFAULT false,
  min_order_total_value      NUMERIC(10,2) NOT NULL DEFAULT 199,

  -- Zaokrouhlovani
  rounding_enabled           BOOLEAN NOT NULL DEFAULT false,
  rounding_step              INT NOT NULL DEFAULT 5,
  rounding_mode              TEXT NOT NULL DEFAULT 'nearest'
                             CHECK (rounding_mode IN ('nearest', 'up')),
  smart_rounding_enabled     BOOLEAN NOT NULL DEFAULT true,

  -- Markup (prirazka)
  markup_enabled             BOOLEAN NOT NULL DEFAULT false,
  markup_mode                TEXT NOT NULL DEFAULT 'flat'
                             CHECK (markup_mode IN ('flat', 'percent', 'min_flat', 'off')),
  markup_value               NUMERIC(10,2) NOT NULL DEFAULT 20,
  markup_min_flat            NUMERIC(10,2) NOT NULL DEFAULT 20,

  -- Vychozi material
  default_material_key       TEXT NOT NULL DEFAULT 'pla',

  -- Metadata
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Jeden pricing config per tenant
CREATE UNIQUE INDEX idx_pricing_configs_tenant ON pricing_configs(tenant_id);

CREATE TRIGGER trg_pricing_configs_updated_at
  BEFORE UPDATE ON pricing_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE pricing_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pricing_configs_tenant_all" ON pricing_configs
  FOR ALL USING (
    tenant_id::text = (auth.jwt() ->> 'tenant_id')
  );
```

#### 3.2.6 fees

```sql
-- Poplatky a slevy
-- V localStorage: modelpricer:{tenantId}:fees:v3 -> .fees[]
CREATE TABLE fees (
  id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name                            TEXT NOT NULL DEFAULT '',
  active                          BOOLEAN NOT NULL DEFAULT true,

  -- Typ a hodnota
  type                            TEXT NOT NULL DEFAULT 'flat'
                                  CHECK (type IN ('flat', 'per_gram', 'per_minute',
                                         'percent', 'per_cm3', 'per_cm2', 'per_piece')),
  value                           NUMERIC(10,2) NOT NULL DEFAULT 0,  -- muze byt negativni (sleva)

  -- Scope a charge basis
  scope                           TEXT NOT NULL DEFAULT 'MODEL'
                                  CHECK (scope IN ('MODEL', 'ORDER')),
  charge_basis                    TEXT NOT NULL DEFAULT 'PER_FILE'
                                  CHECK (charge_basis IN ('PER_PIECE', 'PER_FILE')),

  -- UI chovani
  required                        BOOLEAN NOT NULL DEFAULT false,
  selectable                      BOOLEAN NOT NULL DEFAULT true,
  selected_by_default             BOOLEAN NOT NULL DEFAULT false,
  apply_to_selected_models_enabled BOOLEAN NOT NULL DEFAULT false,

  -- Popisne pole
  category                        TEXT NOT NULL DEFAULT '',
  description                     TEXT NOT NULL DEFAULT '',

  -- Podminky (JSON array podminek)
  conditions                      JSONB NOT NULL DEFAULT '[]',
  -- Format: [{ "key": "supports_enabled", "op": "eq", "value": true }]

  sort_order                      INT NOT NULL DEFAULT 0,
  created_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_fees_tenant ON fees(tenant_id);

CREATE TRIGGER trg_fees_updated_at
  BEFORE UPDATE ON fees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE fees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fees_tenant_all" ON fees
  FOR ALL USING (
    tenant_id::text = (auth.jwt() ->> 'tenant_id')
  );
```

#### 3.2.7 customers (nove pro S12)

```sql
-- Zakaznici — pro Customer Portal (S12)
CREATE TABLE customers (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  auth_user_id   UUID REFERENCES auth.users(id),              -- pokud ma login
  name           TEXT NOT NULL DEFAULT '',
  email          TEXT NOT NULL DEFAULT '',
  phone          TEXT DEFAULT '',
  company        TEXT DEFAULT '',
  ico            TEXT DEFAULT '',                              -- CZ identifikacni cislo
  dic            TEXT DEFAULT '',                              -- CZ danove identifikacni cislo
  address        JSONB DEFAULT '{}',                           -- { street, city, zip, country }
  notes          TEXT DEFAULT '',
  tags           TEXT[] NOT NULL DEFAULT '{}',
  total_orders   INT NOT NULL DEFAULT 0,
  total_spent    NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_customers_tenant ON customers(tenant_id);
CREATE INDEX idx_customers_email ON customers(tenant_id, email);
CREATE INDEX idx_customers_auth ON customers(auth_user_id);

CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Admin tenanta vidi vsechny zakazniky
CREATE POLICY "customers_tenant_select" ON customers
  FOR SELECT USING (
    tenant_id::text = (auth.jwt() ->> 'tenant_id')
  );

-- Zakaznik vidi sam sebe
CREATE POLICY "customers_self_select" ON customers
  FOR SELECT USING (
    auth_user_id = auth.uid()
  );

CREATE POLICY "customers_tenant_insert" ON customers
  FOR INSERT WITH CHECK (
    tenant_id::text = (auth.jwt() ->> 'tenant_id')
  );

CREATE POLICY "customers_tenant_update" ON customers
  FOR UPDATE USING (
    tenant_id::text = (auth.jwt() ->> 'tenant_id')
  );
```

#### 3.2.8 audit_log

```sql
-- Audit log — mapuje z modelpricer:{tenantId}:audit_log
CREATE TABLE audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  actor_user_id   TEXT NOT NULL DEFAULT 'system',
  actor_email     TEXT NOT NULL DEFAULT '',
  actor_name      TEXT NOT NULL DEFAULT '',
  action          TEXT NOT NULL,                               -- CREATED, UPDATED, DELETED, ...
  entity_type     TEXT NOT NULL DEFAULT 'system',              -- order, pricing, fee, team, ...
  entity_id       TEXT,
  summary         TEXT NOT NULL DEFAULT '',
  diff            JSONB,                                       -- { before, after }
  metadata        JSONB,
  ip_address      TEXT DEFAULT '127.0.0.1',
  user_agent      TEXT DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
  -- POZOR: audit_log NEMA updated_at — zaznamy se NIKDY nemeni
);

-- Indexy pro rychle dotazy
CREATE INDEX idx_audit_tenant_created ON audit_log(tenant_id, created_at DESC);
CREATE INDEX idx_audit_entity ON audit_log(tenant_id, entity_type, entity_id);
CREATE INDEX idx_audit_action ON audit_log(tenant_id, action);
CREATE INDEX idx_audit_actor ON audit_log(tenant_id, actor_email);

-- RLS
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_log_tenant_select" ON audit_log
  FOR SELECT USING (
    tenant_id::text = (auth.jwt() ->> 'tenant_id')
  );

-- INSERT povoleny pro kazdeho autentizovaneho uzivatele v tenantovi
CREATE POLICY "audit_log_tenant_insert" ON audit_log
  FOR INSERT WITH CHECK (
    tenant_id::text = (auth.jwt() ->> 'tenant_id')
  );

-- Audit log zaznamy se NESMI mazat ani upravovat (immutable)
-- Zadna UPDATE/DELETE policy = databaze to nepovolif
```

#### 3.2.9 Doplnkove tabulky (schematicke SQL)

```sql
-- Chat zpravy (S11)
CREATE TABLE chat_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  author_id   TEXT NOT NULL,
  author_name TEXT NOT NULL DEFAULT '',
  author_role TEXT NOT NULL DEFAULT 'admin' CHECK (author_role IN ('admin', 'customer', 'system')),
  content     TEXT NOT NULL DEFAULT '',
  attachments JSONB NOT NULL DEFAULT '[]',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_order ON chat_messages(order_id, created_at);

-- Email sablony (S07)
CREATE TABLE email_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  slug        TEXT NOT NULL,                                  -- 'order_confirmation', 'shipping_notification', ...
  subject     TEXT NOT NULL DEFAULT '',
  body_html   TEXT NOT NULL DEFAULT '',
  body_text   TEXT NOT NULL DEFAULT '',
  variables   JSONB NOT NULL DEFAULT '[]',                    -- [{ key, label, default }]
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_email_templates_slug ON email_templates(tenant_id, slug);

-- Email logy (S07)
CREATE TABLE email_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  template_id  UUID REFERENCES email_templates(id),
  recipient    TEXT NOT NULL,
  subject      TEXT NOT NULL DEFAULT '',
  status       TEXT NOT NULL DEFAULT 'queued'
               CHECK (status IN ('queued', 'sent', 'failed', 'bounced')),
  error        TEXT,
  sent_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_logs_tenant ON email_logs(tenant_id, created_at DESC);

-- Kupony (S10)
CREATE TABLE coupons (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code           TEXT NOT NULL,
  type           TEXT NOT NULL DEFAULT 'percent' CHECK (type IN ('percent', 'flat', 'free_shipping')),
  value          NUMERIC(10,2) NOT NULL DEFAULT 0,
  min_order      NUMERIC(10,2) DEFAULT 0,
  max_uses       INT,
  used_count     INT NOT NULL DEFAULT 0,
  valid_from     TIMESTAMPTZ,
  valid_to       TIMESTAMPTZ,
  active         BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_coupons_code ON coupons(tenant_id, code);

-- Dopravni metody (S04)
CREATE TABLE shipping_methods (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  carrier       TEXT DEFAULT '',
  price         NUMERIC(10,2) NOT NULL DEFAULT 0,
  free_above    NUMERIC(10,2),                                -- doprava zdarma nad X
  delivery_days TEXT DEFAULT '',                               -- '2-3 pracovni dny'
  active        BOOLEAN NOT NULL DEFAULT true,
  sort_order    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Dokumenty (S13)
CREATE TABLE documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id      UUID REFERENCES orders(id),
  type          TEXT NOT NULL DEFAULT 'invoice'
                CHECK (type IN ('invoice', 'proforma', 'delivery_note', 'quote', 'custom')),
  number        TEXT,
  storage_path  TEXT,                                          -- cesta v Supabase Storage
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_documents_order ON documents(order_id);

-- Branding (vizualni identita tenanta)
CREATE TABLE branding (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  business_name     TEXT NOT NULL DEFAULT '',
  tagline           TEXT DEFAULT '',
  logo_storage_path TEXT,                                      -- cesta v Supabase Storage
  primary_color     TEXT DEFAULT '#2563EB',
  secondary_color   TEXT DEFAULT '#10B981',
  background_color  TEXT DEFAULT '#FFFFFF',
  font_family       TEXT DEFAULT 'Inter',
  show_logo         BOOLEAN DEFAULT true,
  show_business_name BOOLEAN DEFAULT true,
  show_tagline      BOOLEAN DEFAULT true,
  show_powered_by   BOOLEAN DEFAULT true,
  corner_radius     INT DEFAULT 12,
  updated_by        TEXT DEFAULT 'admin',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_branding_tenant ON branding(tenant_id);

-- Widget konfigurace
CREATE TABLE widget_configs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  public_id             TEXT NOT NULL,                         -- 'wid_xxxxx' — verejny ID pro embed
  name                  TEXT NOT NULL DEFAULT 'Widget',
  status                TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  type                  TEXT NOT NULL DEFAULT 'full_calculator',
  theme_mode            TEXT DEFAULT 'auto',
  primary_color_override TEXT,
  width_mode            TEXT DEFAULT 'fixed',
  width_px              INT DEFAULT 800,
  locale_default        TEXT DEFAULT 'cs',
  config_profile_id     TEXT,
  theme_config          JSONB NOT NULL DEFAULT '{}',           -- kompletni theme (56 properties)
  domains               JSONB NOT NULL DEFAULT '[]',           -- [{ id, domain, allowSubdomains, isActive }]
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_widget_public_id ON widget_configs(public_id);
CREATE INDEX idx_widget_tenant ON widget_configs(tenant_id);

-- Feature flagy
CREATE TABLE feature_flags (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  flag_key    TEXT NOT NULL,
  enabled     BOOLEAN NOT NULL DEFAULT false,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_feature_flags_key ON feature_flags(tenant_id, flag_key);

-- API klicce (S20)
CREATE TABLE api_keys (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name          TEXT NOT NULL DEFAULT '',
  key_hash      TEXT NOT NULL,                                 -- SHA-256 hash klicce (plain text se NEUKLADA)
  key_prefix    TEXT NOT NULL,                                 -- prvnich 8 znaku pro identifikaci
  scopes        TEXT[] NOT NULL DEFAULT '{read}',              -- read, write, admin
  last_used_at  TIMESTAMPTZ,
  expires_at    TIMESTAMPTZ,
  active        BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_api_keys_tenant ON api_keys(tenant_id);
CREATE INDEX idx_api_keys_prefix ON api_keys(key_prefix);

-- Analytics events
CREATE TABLE analytics_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  widget_instance_id TEXT,
  session_id        TEXT NOT NULL,
  event_type        TEXT NOT NULL,                             -- WIDGET_VIEW, MODEL_UPLOAD_COMPLETED, ...
  metadata          JSONB NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Partitioned index pro casove dotazy (rychle pro velke objemy)
CREATE INDEX idx_analytics_tenant_created ON analytics_events(tenant_id, created_at DESC);
CREATE INDEX idx_analytics_session ON analytics_events(session_id);
CREATE INDEX idx_analytics_type ON analytics_events(tenant_id, event_type);

-- Order activity (mapovani z orders:activity:v1)
CREATE TABLE order_activity (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL DEFAULT 'system',
  type        TEXT NOT NULL,                                   -- CREATED, STATUS_CHANGED, NOTE_ADDED, ...
  payload     JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_activity_order ON order_activity(order_id, created_at);
```

### 3.3 Row Level Security (RLS) — vzory a pravidla

**Hlavni princip:** Kazdy tenant vidi POUZE svoje data. Toto je enforced na urovni
PostgreSQL — i kdyz frontend posle spatny request, databaze ho odmitne.

**Jak to funguje:**

1. Uzivatel se prihlasi pres Supabase Auth
2. Auth server vygeneruje JWT token s custom claim `tenant_id`
3. Kazdy SQL dotaz je automaticky filtrovany pres RLS policy
4. Policy kontroluje: `auth.jwt() ->> 'tenant_id' = tabulka.tenant_id`

**Nastaveni tenant_id v JWT:**

```sql
-- Funkce pro nastaveni tenant_id claim pri prihlaseni
CREATE OR REPLACE FUNCTION public.set_tenant_claim()
RETURNS TRIGGER AS $$
DECLARE
  tenant_id UUID;
BEGIN
  -- Najdi tenant podle user_id
  SELECT t.id INTO tenant_id
  FROM tenants t
  WHERE t.owner_user_id = NEW.id
  LIMIT 1;

  -- Pokud neni vlastnik, zkus team membership
  IF tenant_id IS NULL THEN
    SELECT tu.tenant_id INTO tenant_id
    FROM team_users tu
    WHERE tu.auth_user_id = NEW.id AND tu.status = 'active'
    LIMIT 1;
  END IF;

  -- Nastav claim
  IF tenant_id IS NOT NULL THEN
    UPDATE auth.users
    SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('tenant_id', tenant_id::text)
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Service role pro backend:**
Backend (Node.js na Ubuntu serveru) pouziva `service_role` key ktery obchazi RLS.
Toto je nutne pro operace jako:
- PrusaSlicer zpracovani (pristup k souborum vsech tenantu)
- Email rozsilka (pristup k email_templates vsech tenantu)
- Analyticke agregace (cross-tenant reporty pro admin panel)

```javascript
// Backend pouziva service_role — obchazi RLS
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Tento dotaz vrati vsechny objednavky bez ohledu na tenant
const { data } = await supabaseAdmin.from('orders').select('*')
```

---

## 4. Migracni strategie — abstrakce pres storage helpery

### 4.1 Soucasny stav — storage helper pattern

Aktualne ModelPricer pouziva konzistentni pattern pro praci s localStorage.
Vsechny data jsou tenant-scoped a pristupovane pres dedikované storage helpery.

**Jadro systemu:** `adminTenantStorage.js`

Tento soubor poskytuje 3 klicove funkce:
- `getTenantId()` — vraci aktualni tenant ID z `modelpricer:tenant_id`
- `readTenantJson(namespace, fallback)` — cte JSON z `modelpricer:{tenantId}:{namespace}`
- `writeTenantJson(namespace, value)` — zapisuje JSON do `modelpricer:{tenantId}:{namespace}`

**Pattern pouzivany vsemi storage helpery:**

```
1. Import { readTenantJson, writeTenantJson } z adminTenantStorage
2. Definice NAMESPACE konstanty (napr. 'pricing:v3', 'fees:v3', 'orders:v1')
3. Load funkce:
   a) Precte data pres readTenantJson(NAMESPACE, null)
   b) Pokud data existuji → normalizuj a vrat
   c) Pokud ne → pokus o migraci z legacy klicu
   d) Pokud ani migrace → seed defaults a uloz
4. Save funkce:
   a) Normalizuj vstup
   b) Pridej updated_at timestamp
   c) Uloz pres writeTenantJson(NAMESPACE, data)
   d) Vrat normalizovana data
```

**Konkretni storage helpery a jejich namespaces:**

| Helper soubor | Namespace | Load funkce | Save funkce |
|---------------|-----------|-------------|-------------|
| `adminPricingStorage.js` | `pricing:v3` | `loadPricingConfigV3()` | `savePricingConfigV3(config)` |
| `adminFeesStorage.js` | `fees:v3` | `loadFeesConfigV3()` | `saveFeesConfigV3(data)` |
| `adminOrdersStorage.js` | `orders:v1` | `loadOrders()` | `saveOrders(orders)` |
| `adminAuditLogStorage.js` | `audit_log` (primo key) | `getAuditEntries()` | `appendAuditEntry(entry)` |
| `adminDashboardStorage.js` | `dashboard:v2` | `loadDashboardConfig()` | `saveDashboardConfig(config)` |
| `adminTeamAccessStorage.js` | `team_users`, `team_invites` | `getTeamUsers()` | `writeUsers()` |
| `adminAnalyticsStorage.js` | `analytics:events` (primo key) | `getAnalyticsEvents()` | `setAnalyticsEvents(events)` |
| `adminBrandingWidgetStorage.js` | primo key format | `getBranding(tid)` | `saveBranding(tid, data)` |
| `widgetThemeStorage.js` | primo key format | `getWidgetTheme()` | `saveWidgetTheme(theme)` |

**Klicove pozorovani:**
- Nektere helpery pouzivaji `readTenantJson`/`writeTenantJson` (novejsi pattern — pricing, fees, orders, dashboard)
- Nektere pouzivaji primo `localStorage.getItem`/`setItem` (starsi pattern — audit, analytics, team, branding, widget)
- Vsechny helpery maji normalizacni funkce ktere zarucuji konzistentni schema
- Vsechny helpery maji seed/default funkce pro prvni spusteni
- Nektere maji migracni logiku z legacy klicu (pricing, fees)

### 4.2 Abstrakni vrstva — StorageAdapter

Klicovy princip migrace: **NESMI se menit zadny existujici UI kod.** Zmeni se POUZE
implementace storage helperu (ctenarsky/zapisovaci vrstva).

```javascript
// src/lib/storageAdapter.js
//
// Centralni abstrakce pro cteni/zapis dat.
// Prepina mezi localStorage a Supabase podle feature flags.

import { supabase } from './supabase'

// Feature flagy — kontroluji ktery namespace uz pouziva Supabase
const FEATURE_FLAGS = {
  // Postupne zapinani per namespace
  use_supabase_orders: import.meta.env.VITE_USE_SUPABASE === 'true',
  use_supabase_audit: import.meta.env.VITE_USE_SUPABASE === 'true',
  use_supabase_analytics: import.meta.env.VITE_USE_SUPABASE === 'true',
  use_supabase_customers: import.meta.env.VITE_USE_SUPABASE === 'true',
  use_supabase_email: import.meta.env.VITE_USE_SUPABASE === 'true',
  use_supabase_chat: import.meta.env.VITE_USE_SUPABASE === 'true',
  // Staticka data — zustavaji v localStorage dele
  use_supabase_pricing: false,
  use_supabase_fees: false,
  use_supabase_branding: false,
  use_supabase_widget: false,
  use_supabase_dashboard: false,
}

// Mapovani namespace → Supabase tabulka
const NAMESPACE_TABLE_MAP = {
  'orders:v1': 'orders',
  'orders:activity:v1': 'order_activity',
  'audit_log': 'audit_log',
  'analytics:events': 'analytics_events',
  'pricing:v3': 'pricing_configs',
  'fees:v3': 'fees',
  'dashboard:v2': 'dashboard_configs',
  'team_users': 'team_users',
  'team_invites': 'team_invites',
}

function getFeatureFlag(namespace) {
  // Mapuje namespace na feature flag
  const nsToFlag = {
    'orders:v1': 'use_supabase_orders',
    'orders:activity:v1': 'use_supabase_orders',
    'audit_log': 'use_supabase_audit',
    'analytics:events': 'use_supabase_analytics',
    'pricing:v3': 'use_supabase_pricing',
    'fees:v3': 'use_supabase_fees',
    'dashboard:v2': 'use_supabase_dashboard',
  }
  const flagKey = nsToFlag[namespace]
  if (!flagKey) return false
  return FEATURE_FLAGS[flagKey] ?? false
}

/**
 * Genericky read — precte data z localStorage NEBO Supabase
 * podle feature flagu pro dany namespace.
 */
export async function readData(namespace, fallback = null) {
  if (getFeatureFlag(namespace)) {
    try {
      return await supabaseRead(namespace)
    } catch (err) {
      console.warn(`[StorageAdapter] Supabase read failed for ${namespace}, falling back to localStorage`, err)
      return localStorageRead(namespace, fallback)
    }
  }
  return localStorageRead(namespace, fallback)
}

/**
 * Genericky write — zapise data do localStorage NEBO Supabase
 * podle feature flagu.
 */
export async function writeData(namespace, data) {
  if (getFeatureFlag(namespace)) {
    try {
      await supabaseWrite(namespace, data)
      // Dual-write: zapise i do localStorage jako cache/fallback
      localStorageWrite(namespace, data)
      return
    } catch (err) {
      console.warn(`[StorageAdapter] Supabase write failed for ${namespace}, writing to localStorage only`, err)
    }
  }
  localStorageWrite(namespace, data)
}

// === IMPLEMENTACE ===

function localStorageRead(namespace, fallback) {
  if (typeof window === 'undefined') return fallback
  try {
    const tenantId = window.localStorage.getItem('modelpricer:tenant_id') || 'demo-tenant'
    const key = `modelpricer:${tenantId}:${namespace}`
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function localStorageWrite(namespace, data) {
  if (typeof window === 'undefined') return
  try {
    const tenantId = window.localStorage.getItem('modelpricer:tenant_id') || 'demo-tenant'
    const key = `modelpricer:${tenantId}:${namespace}`
    window.localStorage.setItem(key, JSON.stringify(data))
  } catch (err) {
    console.warn('[StorageAdapter] localStorage write failed:', err)
  }
}

async function supabaseRead(namespace) {
  const table = NAMESPACE_TABLE_MAP[namespace]
  if (!table) throw new Error(`Unknown namespace: ${namespace}`)

  const { data, error } = await supabase
    .from(table)
    .select('*')

  if (error) throw error
  return data
}

async function supabaseWrite(namespace, payload) {
  const table = NAMESPACE_TABLE_MAP[namespace]
  if (!table) throw new Error(`Unknown namespace: ${namespace}`)

  const { error } = await supabase
    .from(table)
    .upsert(payload, { onConflict: 'tenant_id' })

  if (error) throw error
}
```

### 4.3 Postupna migrace — namespace po namespace

Migrace probiha ve 4 vlnach, od nejvice rostoucich dat po staticka:

**Vlna 1 — Rychle rostouci data (Faze 3→4)**

| Namespace | Duvod priority | Riziko v localStorage |
|-----------|----------------|----------------------|
| `orders:v1` | Nejvice rostouci, 5 MB limit | Ztrata dat pri plnem localStorage |
| `orders:activity:v1` | Rostouci linearne s objednavkami | Reteze na tisice zaznamu |
| `audit_log` | 2000 zaznamu limit v demo | Ztrata audit trail |
| `analytics:events` | 20000 events limit v demo | Ztrata analytickych dat |

**Vlna 2 — Relacni data (Faze 4)**

| Namespace | Duvod | Zavislost |
|-----------|-------|-----------|
| `customers` (nove) | Normalizace z order snapshotu | Pred S12 |
| `email_templates` + `email_logs` (nove) | Vyzaduje server-side | Pred S07 |
| `chat_messages` (nove) | Realtime, server-side | Pred S11 |
| `coupons` (nove) | Relacni vazba na orders | Pred S10 |

**Vlna 3 — Konfiguracni data (Faze 5)**

| Namespace | Duvod | Poznamka |
|-----------|-------|----------|
| `pricing:v3` | Staticka, meni se zridka | Muze zustat localStorage dele |
| `fees:v3` | Staticka, meni se zridka | Muze zustat localStorage dele |
| `team_users` + `team_invites` | Auth migrace | Zavisi na Supabase Auth |

**Vlna 4 — UI konfigurace (Faze 6+)**

| Namespace | Duvod | Poznamka |
|-----------|-------|----------|
| `branding` | Staticka, 1 zaznam per tenant | Nejnizsi priorita |
| `widget_configs` + `widget_themes` | Staticka, maly objem | Nejnizsi priorita |
| `dashboard:v2` | User preference, maly objem | Nejnizsi priorita |
| `plan_features` | Staticka, 1 zaznam | Nejnizsi priorita |

### 4.4 Postupna uprava storage helperu

Kazdy storage helper se upravi individualne. Priklad pro `adminOrdersStorage.js`:

**PRED (soucasny stav):**
```javascript
import { readTenantJson, writeTenantJson } from './adminTenantStorage'

const NS_ORDERS = 'orders:v1'

export function loadOrders() {
  ensureOrdersSeeded()
  const data = readTenantJson(NS_ORDERS, { orders: [] })
  return deepClone(data.orders || [])
}

export function saveOrders(orders) {
  writeTenantJson(NS_ORDERS, { orders: deepClone(orders) })
}
```

**PO (s Supabase adaptorem):**
```javascript
import { readData, writeData } from '../lib/storageAdapter'
import { supabase } from '../lib/supabase'
import { readTenantJson, writeTenantJson } from './adminTenantStorage'

const NS_ORDERS = 'orders:v1'
const USE_SUPABASE = import.meta.env.VITE_USE_SUPABASE === 'true'

export async function loadOrders() {
  if (USE_SUPABASE) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('[orders] Supabase read failed, falling back:', error)
      return loadOrdersFromLocalStorage()
    }
    return data
  }
  return loadOrdersFromLocalStorage()
}

function loadOrdersFromLocalStorage() {
  ensureOrdersSeeded()
  const data = readTenantJson(NS_ORDERS, { orders: [] })
  return deepClone(data.orders || [])
}

export async function saveOrder(order) {
  if (USE_SUPABASE) {
    const { data, error } = await supabase
      .from('orders')
      .upsert({
        id: order.id,
        order_number: order.id,
        status: order.status,
        customer_snapshot: order.customer_snapshot,
        total: order.totals_snapshot?.total || 0,
        // ... mapovani dalsich poli
      })
      .select()

    if (error) throw error
    return data[0]
  }
  // Fallback na localStorage
  const orders = loadOrdersFromLocalStorage()
  const idx = orders.findIndex(o => o.id === order.id)
  if (idx >= 0) orders[idx] = order
  else orders.unshift(order)
  writeTenantJson(NS_ORDERS, { orders })
  return order
}
```

**Klicove zmeny:**
1. Load/save funkce se stanu `async` (Supabase je async)
2. Feature flag rozhodne zda pouzit Supabase nebo localStorage
3. Fallback na localStorage pokud Supabase selze
4. UI komponenty budou muset pouzit `useEffect` + `useState` misto synchronniho cteni

### 4.5 Zpetna kompatibilita

**Dual-write behem migrace:**
Behem prechodoveho obdobi se data zapisuji do OBOU systemu:
1. Primarni zapis do Supabase
2. Sekundarni zapis do localStorage (cache)
3. Pri cteni: preferuj Supabase, fallback na localStorage

**Offline podpora:**
localStorage slouzi jako offline cache. Kdyz neni pripojeni:
1. Data se ctou z localStorage
2. Zapisy se ukladaji do localStorage + fronty pro sync
3. Po obnoveni pripojeni se fronta synchronizuje do Supabase

**Migracni skript pro existujici data:**

```javascript
// scripts/migrate-to-supabase.js
// Jednorrazovy skript ktery precte vsechna data z localStorage
// a nahraje je do Supabase.

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function migrateOrders(tenantId, localOrders) {
  console.log(`Migrating ${localOrders.length} orders for tenant ${tenantId}...`)

  for (const order of localOrders) {
    // 1. Insert order
    const { data: dbOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        tenant_id: tenantId,
        order_number: order.id,
        status: order.status,
        customer_snapshot: order.customer_snapshot || {},
        total: order.totals_snapshot?.total || 0,
        subtotal_models: order.totals_snapshot?.subtotal_models || 0,
        one_time_fees_total: order.totals_snapshot?.one_time_fees_total || 0,
        shipping_total: order.totals_snapshot?.shipping_total || 0,
        min_order_delta: order.totals_snapshot?.min_order_delta || 0,
        rounding_delta: order.totals_snapshot?.rounding_delta || 0,
        sum_time_min: order.totals_snapshot?.sum_time_min || 0,
        sum_weight_g: order.totals_snapshot?.sum_weight_g || 0,
        sum_pieces: order.totals_snapshot?.sum_pieces || 0,
        flags: order.flags || [],
        notes: order.notes || [],
        one_time_fees: order.one_time_fees || [],
        created_at: order.created_at,
        updated_at: order.updated_at,
      })
      .select()
      .single()

    if (orderError) {
      console.error(`Failed to migrate order ${order.id}:`, orderError)
      continue
    }

    // 2. Insert order items (models)
    for (const model of (order.models || [])) {
      const { error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: dbOrder.id,
          tenant_id: tenantId,
          file_name: model.file_snapshot?.filename || '',
          file_storage_path: model.file_snapshot?.storage_path || '',
          file_size_bytes: model.file_snapshot?.size || 0,
          quantity: model.quantity || 1,
          material_id: model.material_snapshot?.material_id || '',
          material_name: model.material_snapshot?.name || '',
          material_ppg: model.material_snapshot?.price_per_gram_snapshot || 0,
          color: model.color_snapshot || '',
          preset_id: model.preset_snapshot?.preset_id || '',
          preset_name: model.preset_snapshot?.name || '',
          slicer_time_min: model.slicer_snapshot?.time_min || 0,
          slicer_weight_g: model.slicer_snapshot?.weight_g || 0,
          slicer_dimensions: model.slicer_snapshot?.dimensions_xyz || {},
          price_material_cost: model.price_breakdown_snapshot?.material_cost || 0,
          price_time_cost: model.price_breakdown_snapshot?.time_cost || 0,
          price_fees_total: model.price_breakdown_snapshot?.fees_total || 0,
          price_model_subtotal: model.price_breakdown_snapshot?.model_subtotal || 0,
          price_model_total: model.price_breakdown_snapshot?.model_total || 0,
          rate_per_hour: model.pricing_snapshot?.rate_per_hour || 150,
          flags: model.flags || [],
          revisions_slicer: model.revisions?.slicer || [],
          revisions_price: model.revisions?.price || [],
        })

      if (itemError) {
        console.error(`Failed to migrate order item for ${order.id}:`, itemError)
      }
    }

    // 3. Insert order activity
    for (const activity of (order.activity || [])) {
      await supabase.from('order_activity').insert({
        tenant_id: tenantId,
        order_id: dbOrder.id,
        user_id: activity.user_id || 'system',
        type: activity.type || 'UNKNOWN',
        payload: activity.payload || {},
        created_at: activity.timestamp,
      })
    }
  }
  console.log(`Migration complete for tenant ${tenantId}`)
}
```

---

## 5. Supabase JS klient — integrace do projektu

### 5.1 Instalace a setup

```bash
# Instalace Supabase JS klienta
npm install @supabase/supabase-js
```

**Environment variables (.env):**
```env
# Supabase Cloud
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Feature flag pro prepinani localStorage <-> Supabase
VITE_USE_SUPABASE=false

# Backend-only (NIKDY v VITE_ prefixu — nesmime exposovat do frontendu!)
# SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

**Klient inicializace (frontend):**

```javascript
// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — Supabase is disabled')
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'x-client-info': 'modelpricer-web',
        },
      },
    })
  : null

// Helper pro kontrolu zda je Supabase dostupny
export function isSupabaseAvailable() {
  return supabase !== null
}
```

### 5.2 CRUD operace — priklady

**Insert objednavky:**
```javascript
const { data, error } = await supabase
  .from('orders')
  .insert({
    tenant_id: tenantId,
    order_number: 'ORD-001234',
    status: 'NEW',
    customer_snapshot: {
      name: 'Jan Novak',
      email: 'jan@example.com',
      phone: '+420 777 111 222',
    },
    total: 450.00,
    currency: 'CZK',
  })
  .select()
  .single()

if (error) {
  console.error('Failed to create order:', error.message)
} else {
  console.log('Order created:', data.id)
}
```

**Dotaz na objednavky s joinem na items:**
```javascript
const { data: orders, error } = await supabase
  .from('orders')
  .select(`
    id,
    order_number,
    status,
    total,
    created_at,
    customer_snapshot,
    order_items (
      id,
      file_name,
      quantity,
      material_name,
      color,
      price_model_total,
      slicer_time_min,
      slicer_weight_g
    )
  `)
  .order('created_at', { ascending: false })
  .limit(50)

// Filtrovani podle statusu
const { data: newOrders } = await supabase
  .from('orders')
  .select('*')
  .eq('status', 'NEW')
  .order('created_at', { ascending: false })

// Fulltextove hledani v objednavkach
const { data: searchResults } = await supabase
  .from('orders')
  .select('*')
  .or(`order_number.ilike.%${query}%,customer_snapshot->>name.ilike.%${query}%`)
```

**Upload 3D souboru do Storage:**
```javascript
async function upload3DModel(file, orderId) {
  const fileName = `${orderId}/${Date.now()}_${file.name}`

  const { data, error } = await supabase.storage
    .from('models')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'application/octet-stream',
    })

  if (error) {
    console.error('Upload failed:', error.message)
    return null
  }

  // Ziskani verejne URL (pokud je bucket public)
  const { data: urlData } = supabase.storage
    .from('models')
    .getPublicUrl(data.path)

  return {
    storagePath: data.path,
    publicUrl: urlData.publicUrl,
  }
}

// Stazeni souboru
async function download3DModel(storagePath) {
  const { data, error } = await supabase.storage
    .from('models')
    .download(storagePath)

  if (error) {
    console.error('Download failed:', error.message)
    return null
  }

  return data // Blob
}
```

**Realtime subscripce pro zmeny objednavek:**
```javascript
function subscribeToOrderChanges(tenantId, onUpdate) {
  const channel = supabase
    .channel(`orders-${tenantId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `tenant_id=eq.${tenantId}`,
      },
      (payload) => {
        console.log('Order updated:', payload.new.order_number, '→', payload.new.status)
        onUpdate(payload.new)
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
        filter: `tenant_id=eq.${tenantId}`,
      },
      (payload) => {
        console.log('New order:', payload.new.order_number)
        onUpdate(payload.new)
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Listening for order changes...')
      }
    })

  // Cleanup funkce
  return () => {
    supabase.removeChannel(channel)
  }
}

// Pouziti v React komponente:
// useEffect(() => {
//   const unsubscribe = subscribeToOrderChanges(tenantId, (order) => {
//     setOrders(prev => prev.map(o => o.id === order.id ? order : o))
//   })
//   return unsubscribe
// }, [tenantId])
```

**Auth signup/login:**
```javascript
// Registrace
async function signUp(email, password, name) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        role: 'admin',
      },
    },
  })

  if (error) throw error
  return data
}

// Prihlaseni
async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

// Google OAuth
async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) throw error
  return data
}

// Magic Link (prihlaseni bez hesla)
async function signInWithMagicLink(email) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) throw error
  return data
}

// Odhlaseni
async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Listener na zmeny auth stavu
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    console.log('User signed in:', session.user.email)
  } else if (event === 'SIGNED_OUT') {
    console.log('User signed out')
  } else if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed')
  }
})
```

### 5.3 Backend (Node.js) integrace

```javascript
// backend/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

// Service role key — obchazi RLS, pouzivat POUZE na serveru
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

// Priklad: zpracovani modelu po slicingu
export async function updateSlicerResults(orderItemId, slicerData) {
  const { data, error } = await supabaseAdmin
    .from('order_items')
    .update({
      slicer_time_min: slicerData.time_min,
      slicer_weight_g: slicerData.weight_g,
      slicer_dimensions: slicerData.dimensions,
      slicer_filament_mm: slicerData.filament_mm,
    })
    .eq('id', orderItemId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Priklad: stazeni 3D souboru pro slicing
export async function downloadModelForSlicing(storagePath) {
  const { data, error } = await supabaseAdmin.storage
    .from('models')
    .download(storagePath)

  if (error) throw error
  return data // Buffer
}
```

### 5.4 React hook pro Supabase

```javascript
// src/hooks/useSupabaseQuery.js
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

/**
 * React hook pro dotazy do Supabase s loading/error state.
 *
 * Pouziti:
 *   const { data, loading, error, refetch } = useSupabaseQuery(
 *     () => supabase.from('orders').select('*').eq('status', 'NEW'),
 *     [status] // dependencies
 *   )
 */
export function useSupabaseQuery(queryFn, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const execute = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: result, error: queryError } = await queryFn()
      if (queryError) throw queryError
      setData(result)
    } catch (err) {
      console.error('[useSupabaseQuery] Error:', err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    execute()
  }, [execute])

  return { data, loading, error, refetch: execute }
}
```

---

## 6. File storage migrace

### 6.1 Buckety a struktura

Supabase Storage bude mit 3 buckety:

| Bucket | Obsah | Pristup | Max velikost souboru |
|--------|-------|---------|---------------------|
| `models` | 3D soubory (STL, OBJ, 3MF, STEP) | Authenticated + tenant RLS | 50 MB |
| `documents` | PDF faktury, dodaci listy, nabidky | Authenticated + tenant RLS | 10 MB |
| `branding` | Loga tenantu, ikony | Public read, authenticated write | 5 MB |

**Adresarova struktura uvnitr bucketu:**

```
models/
  {tenant_id}/
    {order_id}/
      {timestamp}_{filename}.stl
      {timestamp}_{filename}.obj

documents/
  {tenant_id}/
    invoices/
      INV-{order_number}.pdf
    delivery_notes/
      DN-{order_number}.pdf
    quotes/
      QT-{order_number}.pdf

branding/
  {tenant_id}/
    logo.png
    favicon.ico
```

### 6.2 Storage policies (RLS pro buckety)

```sql
-- Bucket: models
-- Authenticated uzivatele mohou uploadovat do sve tenant slozky
CREATE POLICY "models_tenant_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'models'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')
  );

-- Authenticated uzivatele mohou cist ze sve tenant slozky
CREATE POLICY "models_tenant_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'models'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')
  );

-- Bucket: branding — public read
CREATE POLICY "branding_public_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'branding'
  );

-- Branding — authenticated write
CREATE POLICY "branding_tenant_write" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'branding'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')
  );
```

### 6.3 Upload pipeline (frontend → Supabase Storage → backend slicing)

```
1. Zakaznik vybere STL soubor ve widgetu
2. Frontend uploaduje do Supabase Storage (bucket: models)
3. Frontend vlozi zaznam do order_items (status: UPLOADED, file_storage_path: ...)
4. Backend periodicky kontroluje nove zaznamy (poll nebo realtime trigger)
5. Backend stahne soubor ze Supabase Storage pres service_role
6. Backend spusti PrusaSlicer (xvfb-run flatpak run ...)
7. Backend updatuje order_items s vysledky slicingu
8. Frontend dostane realtime update a zobrazi cenu
```

---

## 7. Auth integrace (priprava pro S12)

### 7.1 Supabase Auth features

Supabase Auth (GoTrue) poskytuje:
- **Email + heslo** — klasicka registrace s email verifikaci
- **Google OAuth** — prihlaseni pres Google ucet
- **Magic link** — prihlaseni bez hesla (email s odkazem)
- **Password reset** — obnoveni hesla pres email
- **Email verification** — potvrzeni emailu po registraci
- **JWT tokeny** — access token + refresh token, auto-refresh
- **Session management** — automaticke prodluzovani session
- **User metadata** — custom data na uzivateli (role, tenant_id)
- **Rate limiting** — ochrana proti brute-force

**Limity na free tieru:**
- 50,000 MAU (Monthly Active Users)
- Neomezeny pocet registraci
- Email rate limit: 4 emaily/hodinu (na free tieru — pro produkci zvysit)

### 7.2 Role system

ModelPricer ma 3 role uzivatelu:

| Role | Popis | Pristup |
|------|-------|---------|
| `admin` | Vlastnik tenanta, plny pristup | Vse — pricing, fees, orders, team, analytics |
| `operator` | Clen tymu, omezeny pristup | Orders, chat, kanban — BEZ pricing/fees/team |
| `customer` | Zakaznik (portal S12) | Pouze SVE objednavky, chat, dokumenty |

**Ukladani role v JWT:**

```sql
-- Role se uklada do user metadata pri registraci/prirazeni
-- a prida se do JWT jako custom claim

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event JSONB)
RETURNS JSONB AS $$
DECLARE
  claims JSONB;
  user_role TEXT;
  user_tenant_id TEXT;
BEGIN
  claims := event->'claims';

  -- Nacti tenant_id a roli z app_metadata
  user_tenant_id := claims->'app_metadata'->>'tenant_id';
  user_role := claims->'app_metadata'->>'role';

  -- Pridej do JWT claims
  claims := jsonb_set(claims, '{tenant_id}', to_jsonb(COALESCE(user_tenant_id, '')));
  claims := jsonb_set(claims, '{user_role}', to_jsonb(COALESCE(user_role, 'customer')));

  event := jsonb_set(event, '{claims}', claims);
  RETURN event;
END;
$$ LANGUAGE plpgsql;
```

### 7.3 Auth flow pro registraci admina (novy tenant)

```
1. Admin vyplni registracni formular (email, heslo, nazev firmy)
2. Frontend zavola supabase.auth.signUp({ email, password, ... })
3. Supabase odesle verifikacni email
4. Admin klikne na verifikacni odkaz
5. Trigger vytvori novy zaznam v tabulce tenants
6. Trigger nastavi tenant_id claim v JWT
7. Admin je prihlasen a presmerovan na /admin dashboard
```

### 7.4 Auth flow pro zakaznika (S12 portal)

```
1. Zakaznik pristoupi na /portal
2. Zvoli: email+heslo NEBO Google NEBO magic link
3. Po prihlaseni se hleda customer zaznam v tabulce customers
4. Pokud neexistuje — vytvori se novy customer (tenant_id z objednavky)
5. JWT obsahuje customer role — RLS povoluje pouze vlastni objednavky
6. Zakaznik vidi sve objednavky, chat, dokumenty
```

---

## 8. Realtime features

### 8.1 Postgres Changes — pouziti v ModelPricer

Supabase Realtime posloucha zmeny v PostgreSQL databazi a posila je
klientum pres WebSocket. Toto pouzijeme pro:

| Feature | Tabulka | Event | Pouziti |
|---------|---------|-------|---------|
| Kanban (S14) | `orders` | UPDATE | Aktualizace karty pri zmene statusu |
| Chat (S11) | `chat_messages` | INSERT | Nova zprava v realtime |
| Notifikace (S07) | `email_logs` | INSERT/UPDATE | Status odeslaneho emailu |
| Orders (admin) | `orders` | INSERT | Notifikace noveho orderu |
| Dashboard | `orders` | INSERT/UPDATE | Live KPI metriky |

### 8.2 Implementace subscripci

**Kanban realtime (S14):**
```javascript
function useKanbanRealtime(tenantId) {
  const [orders, setOrders] = useState([])

  useEffect(() => {
    // Inicializacni load
    loadOrders().then(setOrders)

    // Realtime subscripce
    const channel = supabase
      .channel(`kanban-${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          setOrders(prev =>
            prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o)
          )
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          setOrders(prev => [payload.new, ...prev])
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [tenantId])

  return orders
}
```

**Chat realtime (S11):**
```javascript
function useChatRealtime(orderId) {
  const [messages, setMessages] = useState([])

  useEffect(() => {
    // Load existujicich zprav
    supabase
      .from('chat_messages')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true })
      .then(({ data }) => setMessages(data || []))

    // Realtime nove zpravy
    const channel = supabase
      .channel(`chat-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new])
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [orderId])

  return messages
}
```

### 8.3 Broadcast a Presence (volitelne)

Krome Postgres Changes Supabase Realtime podporuje:
- **Broadcast** — posle zpravu vsem klientum v channelu (bez DB triggeru)
- **Presence** — sleduje kdo je online (uzivatele v kanban view)

Tyto features jsou volitelne a mohou se pridat v pozdejsich fazich pro:
- "Uzivatel X prave upravuje objednavku Y" (presence)
- "Admin poslal zpravu" notifikace (broadcast)

---

## 9. Ubuntu server deployment plan

### 9.1 Pozadavky na hardware

| Komponenta | Minimum | Doporuceno |
|------------|---------|------------|
| CPU | 2 cores | 4 cores |
| RAM | 4 GB | 8 GB |
| Disk | 50 GB SSD | 100 GB SSD |
| OS | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |
| Sit | Staticka IP nebo DDNS | Staticka IP |
| Pripojeni | 10 Mbps upload | 50+ Mbps |

**PrusaSlicer pametove naroky:**
- Jednoduchy model (< 50 MB STL): ~500 MB RAM
- Komplexni model (50-200 MB STL): ~2 GB RAM
- Doporuceni: max 2 paralelni slicingy na 8 GB RAM

### 9.2 Instalace — step by step

```bash
# === 1. Zakladni system ===
sudo apt update && sudo apt upgrade -y

# Zakladni nastroje
sudo apt install -y curl git build-essential ufw

# === 2. Node.js 20 LTS (pres NodeSource) ===
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # ocekavano: v20.x.x

# === 3. PM2 (process manager) ===
sudo npm install -g pm2
pm2 startup  # nastaveni autostartu

# === 4. PrusaSlicer (Flatpak + xvfb) ===
sudo apt install -y flatpak xvfb libgl1-mesa-glx libgl1-mesa-dri mesa-utils
flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo
flatpak install -y flathub com.prusa3d.PrusaSlicer

# Overeni PrusaSlicer
xvfb-run -a flatpak run com.prusa3d.PrusaSlicer --version

# === 5. Caddy (reverse proxy + automaticky HTTPS) ===
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
  | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
  | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy

# === 6. Firewall ===
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP (pro Let's Encrypt)
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# === 7. Docker (pro budouci Supabase self-hosting) ===
sudo apt install -y docker.io docker-compose-v2
sudo systemctl enable docker
sudo usermod -aG docker $USER  # prida aktualniho uzivatele do docker skupiny
```

### 9.3 Backend deploy

```bash
# === Klonuj repo a nainstaluj zavislosti ===
cd /opt
sudo mkdir -p modelpricer && sudo chown $USER:$USER modelpricer
cd modelpricer
git clone <REPO_URL> .

# Backend zavislosti
cd backend-local
npm install --production

# Environment variables
cat > .env << 'EOF'
PORT=3001
NODE_ENV=production

# Supabase
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# PrusaSlicer
PRUSASLICER_CMD=xvfb-run -a flatpak run com.prusa3d.PrusaSlicer
PRUSASLICER_PROFILES_DIR=/opt/modelpricer/prusa-profiles

# Upload limity
MAX_FILE_SIZE_MB=50
UPLOAD_DIR=/opt/modelpricer/uploads
EOF

# PM2 start
pm2 start server.js --name modelpricer-api --env production
pm2 save
```

### 9.4 Caddy konfigurace (HTTPS + reverse proxy)

```
# /etc/caddy/Caddyfile

api.modelpricer.cz {
    reverse_proxy localhost:3001

    # CORS headers
    header Access-Control-Allow-Origin https://modelpricer.web.app
    header Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    header Access-Control-Allow-Headers "Content-Type, Authorization"

    # Upload limit (50 MB)
    request_body {
        max_size 50MB
    }

    # Logy
    log {
        output file /var/log/caddy/modelpricer-api.log
    }
}
```

```bash
# Reload Caddy
sudo systemctl reload caddy

# Overeni HTTPS (Caddy automaticky ziska Let's Encrypt certifikat)
curl https://api.modelpricer.cz/health
```

### 9.5 SSH pristup z Claude Code

```bash
# === Na serveru ===
# Vytvor uzivatele pro Claude Code
sudo adduser modelpricer-deploy --disabled-password
sudo usermod -aG sudo modelpricer-deploy

# SSH key setup
mkdir -p /home/modelpricer-deploy/.ssh
# Vloz public key z lokalni masiny

# === Z lokalni masiny (Claude Code) ===
# SSH pristup
ssh modelpricer-deploy@api.modelpricer.cz 'node --version'

# Deploy pres SSH
ssh modelpricer-deploy@api.modelpricer.cz 'cd /opt/modelpricer && git pull && pm2 restart modelpricer-api'

# Monitoring
ssh modelpricer-deploy@api.modelpricer.cz 'pm2 status'
ssh modelpricer-deploy@api.modelpricer.cz 'pm2 logs modelpricer-api --lines 50'
```

### 9.6 Monitoring a maintenance

```bash
# PM2 monitoring
pm2 monit           # real-time CPU/RAM
pm2 status          # status vsech procesu
pm2 logs            # logy

# Disk usage
df -h               # celkove
du -sh /opt/modelpricer/uploads/  # uploads

# Caddy logy
sudo tail -f /var/log/caddy/modelpricer-api.log

# PrusaSlicer test
xvfb-run -a flatpak run com.prusa3d.PrusaSlicer --version

# Automaticke updaty OS
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## 10. Casovy plan migrace

### 10.1 Pred Fazi 1 (priprava — OKAMZITE)

**Kroky:**
1. Vytvorit Supabase projekt na supabase.com (cloud, free tier)
2. Nainstalovat `@supabase/supabase-js` do projektu
3. Vytvorit `src/lib/supabase.js` (klient inicializace)
4. Vytvorit `src/lib/storageAdapter.js` (abstrakce)
5. Pridat `VITE_SUPABASE_URL` a `VITE_SUPABASE_ANON_KEY` do `.env`
6. Nastavit `VITE_USE_SUPABASE=false` (zatim vypnuto)
7. Pridat `.env` do `.gitignore` pokud tam neni

**Pravidlo pro novy kod:**
Od tohoto momentu vsechny NOVE features psat tak, aby byly pripraveny na async storage.
Tzn. nove load/save funkce musi byt `async` i kdyz zatim ctou z localStorage.

**Casova narocnost:** 2-4 hodiny

### 10.2 Faze 1-3 (postupna priprava)

**Behem Faze 1 (S01, S02, S05):**
- Refaktorovat `adminOrdersStorage.js` na async pattern
- Pridat `useSupabaseQuery` hook
- Otestovat ze localStorage stale funguje se zapnutym `VITE_USE_SUPABASE=false`

**Behem Faze 2 (S06, S09, S04):**
- Pridat shipping_methods tabulku (S04 to potrebuje)
- Otestovat Supabase Storage upload na free tieru

**Behem Faze 3 (S14, S07, S10):**
- Pridat email_templates, email_logs, coupons tabulky
- Pridat realtime subscripce pro kanban (S14)
- Otestovat Postgres Changes na free tieru

**Casova narocnost:** prubezne, 1-2 hodiny per faze

### 10.3 Mezi Fazi 3 a 4 (HLAVNI MIGRACE)

Toto je hlavni migracni okno. Kroky:

1. **Vytvorit kompletni PostgreSQL schema** (vsechny tabulky z sekce 3)
   - Spustit SQL pres Supabase Dashboard SQL Editor
   - Overit ze RLS policies funguji
   - Casova narocnost: 4-6 hodin

2. **Migracni skripty pro existujici data**
   - Skript pro export z localStorage
   - Skript pro import do Supabase
   - Testovaci run s demo daty
   - Casova narocnost: 4-8 hodin

3. **Prepnout rychle rostouci data na Supabase**
   - `VITE_USE_SUPABASE=true`
   - Prepnout: orders, order_activity, audit_log, analytics_events
   - Dual-write zapnout pro bezpecnost
   - Casova narocnost: 4-6 hodin

4. **Testovani**
   - Smoke test vsech admin stranek
   - Test realtime subscripci
   - Test offline fallbacku
   - Performance benchmark
   - Casova narocnost: 4-8 hodin

**Celkova narocnost hlavni migrace:** 16-28 hodin (2-4 dny)

### 10.4 Faze 5 (auth migrace)

1. Zapnout Supabase Auth
2. Implementovat registracni a prihlasovaci flow
3. Nastavit JWT custom claims (tenant_id, role)
4. Implementovat S12 (Customer Portal) primo na Supabase Auth
5. RLS policies prepnout z demo na real auth

**Casova narocnost:** 8-16 hodin (auth je citlive, vyzaduje dukladne testovani)

### 10.5 Faze 6+ (full migration)

1. Prepnout vsechny zbyvajici namespaces na Supabase:
   - pricing_configs, materials, fees
   - branding, widget_configs, widget_themes
   - dashboard_configs, plan_features
2. Odstranit localStorage fallback kod (volitelne — muze zustat pro offline)
3. Self-hosting evaluace — zda je ekonomicky vyhodne hodit Supabase na vlastni server

**Casova narocnost:** 8-12 hodin

---

## 11. Rizika a mitigace

### 11.1 Supabase free tier pauzuje po 7 dnech neaktivity

**Riziko:** Supabase free tier automaticky pauzuje projekt po 7 dnech bez aktivity.
Pokud se toto stane v produkci, vsechny dotazy selzou.

**Mitigace:**
- **CRON ping** — nastavit externt CRON (napr. cron-job.org) ktery kazdy den
  posle request na Supabase (napr. `SELECT 1`)
- **Backend ping** — pokud bezi Ubuntu server, PM2 cron kazdy den pingne Supabase
- **Upgrade na Pro** — $25/mesic = zadne pauzovani

```bash
# crontab -e (na Ubuntu serveru)
# Kazdy den v 6:00 rano pingne Supabase
0 6 * * * curl -s -o /dev/null -X GET \
  "https://xxxxxxxxxxxxx.supabase.co/rest/v1/tenants?select=id&limit=1" \
  -H "apikey: $SUPABASE_ANON_KEY"
```

### 11.2 Ztrata dat pri migraci localStorage → Supabase

**Riziko:** Behem migrace se mohou ztratit data pokud skript selze uprostred.

**Mitigace:**
- **Dual-write** — behem prechodoveho obdobi se data zapisuji do OBOU systemu
- **Backup pred migraci** — exportovat vsechna localStorage data do JSON souboru
- **Idempotentni migrace** — migracni skript lze bezpecne spustit vickrat
- **Rollback plan** — pokud migrace selze, prepnout `VITE_USE_SUPABASE=false`
  a vsechna data jsou stale v localStorage

```javascript
// Backup vsech localStorage dat pred migraci
function backupLocalStorage() {
  const backup = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key.startsWith('modelpricer')) {
      backup[key] = localStorage.getItem(key)
    }
  }
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `modelpricer-backup-${new Date().toISOString().slice(0,10)}.json`
  a.click()
}
```

### 11.3 Supabase outage (vypadek sluzby)

**Riziko:** Supabase cloud muze mit vypadek. Pokud frontend nema fallback, aplikace nefunguje.

**Mitigace:**
- **localStorage fallback** — pokud Supabase neni dostupny, cte/pise z localStorage
- **Retry logika** — exponential backoff pri selhanich
- **Health check** — na dashboardu zobrazit status Supabase pripojeni
- **Offline mode** — pro staticka data (pricing, fees) vvzdy cachovat v localStorage

### 11.4 5 MB limit localStorage

**Riziko:** Browsers maji 5 MB limit na localStorage per origin. S rostoucim poctem
objednavek se limit muze prekrocit.

**Mitigace:**
- **Migrace na Supabase** — hlavni reseni, protoze Supabase nema limit na objem dat
- **LRU eviction** — pokud localStorage je plny, smazat nejstarsi data
- **Komprese** — pro prechodne obdobi mozno komprimovat JSON (lz-string knihovna)

### 11.5 PrusaSlicer Linux kompatibilita

**Riziko:** PrusaSlicer na Linuxu se muze chovat jinak nez na Windows.

**Mitigace:**
- **Testovat PRED deploy** — spustit 10+ ruznych modelu na Linux a porovnat s Windows vystupy
- **Identicky profily** — pouzit stejne INI profily na obou platformach
- **CI test** — zahrnout PrusaSlicer test do CI pipeline

### 11.6 Supabase free tier limity

**Riziko:** Free tier ma 500 MB DB, 1 GB storage, 5 GB bandwidth.

**Mitigace:**
- **Monitoring** — sledovat usage na Supabase dashboardu
- **Alerting** — nastavit email alert pri 80% vyuziti
- **Upgrade plan** — $25/mesic = 8 GB DB, 100 GB storage, 250 GB bandwidth
- **Data retention** — automaticky mazat stare analytics_events (>90 dni)
- **Storage cleanup** — mazat docasne soubory po zpracovani

### 11.7 CORS a security

**Riziko:** Frontend na Firebase Hosting komunikuje se Supabase na jine domene.

**Mitigace:**
- Supabase automaticky nastavuje CORS pro sveho klienta
- Anon key je bezpecny v frontendu (RLS ho omezuje)
- Service role key NIKDY v frontendu — pouze na backendu
- HTTPS vsude (Firebase = automaticky, Caddy = automaticky Let's Encrypt)

---

## 12. Cenovy odhad

### 12.1 Detailni breakdown

| Obdobi | Supabase | Firebase | Ubuntu server | Domena | Celkem |
|--------|----------|----------|---------------|--------|--------|
| Prototyp (0-100 uzivatelu) | $0 (free) | $0 (free hosting) | $0 (lokalni vyvoj) | $0 (subdomena) | **$0/mesic** |
| MVP (100-1000 uzivatelu) | $25 (Pro plan) | $0 (free hosting) | ~$5 elektrina | ~$1 domena | **~$31/mesic** |
| Produkt (1000-5000 uzivatelu) | $25 (Pro plan) | $0 (free hosting) | ~$10 elektrina | ~$1 domena | **~$36/mesic** |
| Scale (5000+ uzivatelu) | $25 + overage | $0 | VPS $10-30/mesic | ~$1 domena | **~$50-70/mesic** |
| Self-hosted (volitelne) | $0 (Docker) | $0 | ~$10 elektrina | ~$1 domena | **~$11/mesic** |

### 12.2 Srovnani s alternativami

| Reseni | 0-100 uzivatelu | 100-1000 | 1000+ |
|--------|------------------|----------|-------|
| **Supabase + Firebase** | $0 | $25 | $25-50 |
| Firebase full (Blaze) | $0* | $20-100+ | Nepredvidatelne |
| Convex + Clerk | $0 | $50 ($25+$25) | $75+ |
| Vlastni PostgreSQL (VPS) | $5-10 | $10-20 | $20-50 |
| PlanetScale (MySQL) | $0 | $29 | $29-99 |

*Firebase Blaze: storage vyzaduje placeny plan i na free tieru (od 10/2025)

### 12.3 Supabase Free vs Pro — co ziskas

| Feature | Free | Pro ($25/mesic) |
|---------|------|-----------------|
| DB velikost | 500 MB | 8 GB |
| Storage | 1 GB | 100 GB |
| Bandwidth | 5 GB | 250 GB |
| Edge Functions invocations | 500K/mesic | 2M/mesic |
| Realtime connections | 200 concurrent | 500 concurrent |
| Auth MAU | 50,000 | 100,000 |
| Pauza pri neaktivite | ANO (7 dni) | NE |
| Daily backups | NE | ANO |
| Email rate limit | 4/hodina | 100/hodina |
| Support | Community | Email |
| Logy | 1 den retence | 7 dni retence |

### 12.4 Break-even analyza

Kdy se vyplati prejit z Free na Pro:
- **DB > 400 MB** — blizi se limitu, prejdi na Pro preventivne
- **Storage > 800 MB** — blizi se limitu
- **Produkce** — jakmile mas placici zakazniky, pauzovani je neprijatelne
- **Email notifikace** — 4 emaily/hodinu nestaci pro produkci
- **Backupy** — bez Pro nemas automaticke daily backupy

**Doporuceni:** Prejdi na Pro ($25/mesic) jakmile mas prvniho placiciho zakaznika.

---

## Priloha A: Kompletni seznam env variables

```env
# === Frontend (Vite — VITE_ prefix) ===

# Supabase projekt URL a anon key (bezpecne v frontendu)
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Feature flag pro prepinani localStorage <-> Supabase
VITE_USE_SUPABASE=false

# === Backend (Node.js — BEZ VITE_ prefixu) ===

# Supabase service role key (NIKDY v frontendu!)
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Server
PORT=3001
NODE_ENV=production

# PrusaSlicer
PRUSASLICER_CMD=xvfb-run -a flatpak run com.prusa3d.PrusaSlicer
PRUSASLICER_PROFILES_DIR=/opt/modelpricer/prusa-profiles

# Upload
MAX_FILE_SIZE_MB=50
UPLOAD_DIR=/opt/modelpricer/uploads
```

---

## Priloha B: Migracni checklist

```
=== PRED MIGRACI ===
[ ] Supabase projekt vytvoren (supabase.com)
[ ] @supabase/supabase-js nainstalovan
[ ] .env soubory nastaveny (frontend + backend)
[ ] .env v .gitignore
[ ] src/lib/supabase.js vytvoreno
[ ] src/lib/storageAdapter.js vytvoreno
[ ] VITE_USE_SUPABASE=false (zatim vypnuto)

=== SCHEMA ===
[ ] SQL schema spusten v Supabase SQL Editor
[ ] RLS policies vytvoreny pro vsechny tabulky
[ ] updated_at trigger vytvoren
[ ] Indexy vytvoreny
[ ] Test: INSERT + SELECT funguje pres Supabase Dashboard

=== MIGRACE DAT ===
[ ] localStorage backup exportovan (JSON)
[ ] Migracni skript otestovan s demo daty
[ ] Orders migrovany
[ ] Order items migrovany
[ ] Audit log migrovan
[ ] Analytics events migrovany

=== PREPNUTI ===
[ ] VITE_USE_SUPABASE=true
[ ] Dual-write zapnut
[ ] Smoke test vsech admin stranek
[ ] Realtime subscripce funguji
[ ] Offline fallback funguje

=== POST-MIGRACE ===
[ ] Monitoring nastaven (Supabase Dashboard)
[ ] CRON ping nastaven (proti pauzovani)
[ ] Backup strategie overena
[ ] Performance benchmark — srovnani s localStorage
[ ] Dokumentace aktualizovana
```

---

## Priloha C: Uzitecne SQL dotazy pro monitoring

```sql
-- Pocet zaznamu per tabulka
SELECT
  schemaname,
  relname AS table_name,
  n_live_tup AS row_count
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

-- Velikost tabulek
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(tablename::regclass)) AS total_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(tablename::regclass) DESC;

-- Nejpomalejsi dotazy
SELECT
  calls,
  mean_exec_time::numeric(10,2) AS avg_ms,
  total_exec_time::numeric(10,2) AS total_ms,
  query
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Aktivni RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Pocet objednavek per tenant (pro monitoring)
SELECT
  t.name AS tenant_name,
  COUNT(o.id) AS order_count,
  COALESCE(SUM(o.total), 0) AS total_revenue
FROM tenants t
LEFT JOIN orders o ON o.tenant_id = t.id
GROUP BY t.id, t.name
ORDER BY order_count DESC;

-- Storage usage (buckety)
SELECT
  bucket_id,
  COUNT(*) AS file_count,
  pg_size_pretty(SUM(metadata->>'size')::bigint) AS total_size
FROM storage.objects
GROUP BY bucket_id;
```

---

## Priloha D: Rozhodovaci strom — kdy pouzit co

```
Novy feature potrebuje ukladat data?
  |
  +-- Data rostou linearne s poctem uzivatelu/objednavek?
  |     |
  |     +-- ANO → Supabase (PostgreSQL tabulka)
  |     |         Priklady: orders, chat_messages, analytics_events
  |     |
  |     +-- NE (staticka konfigurace) → localStorage (cache) + Supabase (master)
  |           Priklady: pricing_configs, branding, widget_themes
  |
  +-- Data potrebuji relace (joiny)?
  |     |
  |     +-- ANO → Supabase (PostgreSQL tabulka s FK)
  |     +-- NE → Supabase (jednoducha tabulka) nebo JSONB sloupec
  |
  +-- Data potrebuji realtime updaty?
  |     |
  |     +-- ANO → Supabase + Postgres Changes subscripce
  |     +-- NE → Supabase (standardni CRUD)
  |
  +-- Data obsahuji soubory (>1 MB)?
  |     |
  |     +-- ANO → Supabase Storage (bucket)
  |     +-- NE → Supabase (JSONB nebo TEXT sloupec)
  |
  +-- Data jsou citliva (GDPR, hesla, tokeny)?
        |
        +-- ANO → Supabase + sifrovani + audit_log
        +-- NE → Supabase (standardni)
```

---

> **Tento dokument je zivym dokumentem.** Aktualizuj ho pri kazdem migracnim kroku.
> Vlastnik: `mp-sr-storage` → delegace na `mp-mid-storage-tenant`.
> Krizove reference: V3-S00 (index), V3-S12 (auth), V3-S14 (kanban), V3-S11 (chat).
