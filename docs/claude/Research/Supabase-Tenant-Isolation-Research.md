# Supabase Tenant Isolation Research

> **Datum:** 2026-02-26
> **Agent:** mp-researcher-web
> **Ucel:** Vyzkum best practices pro tenant izolaci v Supabase, RLS patterns, multi-tenant
> architektura, cross-device sync, a migrace z localStorage.
> **Relevance:** ModelPricer V3 Phase 4 — migrace z localStorage na Supabase (25 tabulek).

---

## Obsah

1. [Row Level Security (RLS) Patterns](#1-row-level-security-rls-patterns)
2. [Multi-Tenant Architecture Patterns](#2-multi-tenant-architecture-patterns)
3. [Best Practices z Real-World Implementaci](#3-best-practices-z-real-world-implementaci)
4. [Cross-Device Synchronizace](#4-cross-device-synchronizace)
5. [Migrace z localStorage do Supabase](#5-migrace-z-localstorage-do-supabase)
6. [RLS Performance Optimalizace](#6-rls-performance-optimalizace)
7. [Doporuceni pro ModelPricer V3](#7-doporuceni-pro-modelpricer-v3)
8. [Zdroje a Citace](#8-zdroje-a-citace)

---

## 1. Row Level Security (RLS) Patterns

### 1.1 Zakladni koncept

RLS (Row Level Security) je PostgreSQL mechanismus ktery automaticky pridava `WHERE` podminku ke kazdemu
dotazu. Na rozdil od aplikacni logiky, RLS je vynuceny na urovni databaze — i kdyz aplikace obsahuje
chybu nebo bypass, data zustavaji izolovana.

**Klicovy princip:** RLS politiky se vyhodnocuji pro KAZDY radek, takze uzivatel nikdy nemuze
pristoupit k datum jineho tenantu, ani kdyz primo spusti SQL dotaz.

Zdroj: Supabase oficialni docs — https://supabase.com/docs/guides/database/postgres/row-level-security

### 1.2 Pattern A: Auth.uid() — Per-User Izolace

Nejjednodussi pattern — kazdy radek ma `user_id` sloupec ktery se porovnava s `auth.uid()`:

```sql
-- Zakladni RLS politika pro per-user izolaci
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own orders"
  ON orders
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());
```

**Pouziti:** Vhodne pro data ktera patri jednomu uzivateli (profil, osobni nastaveni).
**Omezeni:** Nefunguje pro multi-tenant kde vice uzivatelu sdili data jednoho tenantu.

Zdroj: Supabase docs — https://supabase.com/docs/guides/database/postgres/row-level-security

### 1.3 Pattern B: Tenant ID z JWT Claims

Pro multi-tenant architekturu se `tenant_id` uklada do JWT tokenu jako custom claim a extrahuje
se v RLS politice:

```sql
-- Tenant ID ulozeny v JWT app_metadata
CREATE POLICY "Tenant data isolation"
  ON pricing_configs
  FOR ALL
  TO authenticated
  USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
  );
```

**Jak nastavit tenant_id do JWT:**
1. Pri registraci/loginu nastavit `app_metadata.tenant_id` pres Supabase Auth admin API
2. Nebo pres Auth Hook ktery prida custom claims do JWT

```javascript
// Na backendu pri prirazeni uzivatele k tenantu
const { data, error } = await supabase.auth.admin.updateUserById(
  userId,
  { app_metadata: { tenant_id: tenantUuid } }
);
```

Zdroj: Supabase blog, SSO + multi-tenancy — https://github.com/supabase/supabase (blog 2023-04-13)

### 1.4 Pattern C: SSO Provider ID jako Tenant Key

Pro enterprise SSO scenare kde kazdy SSO provider = jeden tenant:

```sql
CREATE POLICY "Only allow read-write access to tenants"
  ON tablename
  AS RESTRICTIVE
  TO authenticated
  USING (
    tenant_id = (SELECT auth.jwt() -> 'app_metadata' ->> 'provider')
  );
```

**Poznamka:** `AS RESTRICTIVE` zajisti ze tato politika MUSI byt splnena spolecne s jakoukoliv
jinou `PERMISSIVE` politikou. Toto je dulezite pro bezpecnost — i kdyz jina politika povoli
pristup, restrictive politika ho omezi na spravny tenant.

Zdroj: Supabase docs, SAML SSO — https://supabase.com/docs/guides/auth/enterprise-sso/auth-sso-saml

### 1.5 Pattern D: Request Header (Demo/Transition Phase)

Pro fazi pred implementaci auth (jako je aktualni stav ModelPricer):

```sql
-- Helper funkce pro ziskani tenant_id z HTTP headeru
CREATE OR REPLACE FUNCTION get_request_tenant_id()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    current_setting('request.headers', true)::json->>'x-tenant-id',
    'demo-tenant'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Politika pouzivajici header
CREATE POLICY "Tenant scoped access via header"
  ON orders
  FOR ALL
  USING (
    tenant_id::text = get_request_tenant_id()
  );
```

**VAROVANI:** Toto je POUZE pro development/demo fazi. X-Tenant-Id header muze byt podvrzen
klientem. Pro produkci pouzit Pattern B (JWT claims).

Zdroj: ModelPricer V3 schema.sql (existujici implementace), potvrzeno Supabase multi-tenancy
diskuzemi — https://arda.beyazoglu.com/supabase-multi-tenancy

### 1.6 Pattern E: Separate Policies pro CRUD operace

Pro jemnejsi kontrolu — ruzne politiky pro SELECT, INSERT, UPDATE, DELETE:

```sql
-- Cist muze kazdy autentizovany uzivatel v tenantu
CREATE POLICY "tenant_select"
  ON widget_configs
  FOR SELECT
  TO authenticated
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Vkladat muze jen admin
CREATE POLICY "tenant_insert_admin"
  ON widget_configs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Mazat muze jen owner
CREATE POLICY "tenant_delete_owner"
  ON widget_configs
  FOR DELETE
  TO authenticated
  USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'owner'
  );
```

Zdroj: Supabase docs RLS + komunita — https://makerkit.dev/blog/tutorials/supabase-rls-best-practices

---

## 2. Multi-Tenant Architecture Patterns

### 2.1 Tri hlavni pristupy

| Pristup | Popis | Slozitost | Izolace | Naklady |
|---------|-------|-----------|---------|---------|
| **A) Shared DB + tenant_id** | Vsichni tenanti v jedne databazi, rozliseni sloupcem `tenant_id` | Nizka | Stredni (RLS) | Nejnizsi |
| **B) Separate schemas** | Kazdy tenant ma vlastni PostgreSQL schema | Stredni | Vysoka | Stredni |
| **C) Separate instances** | Kazdy tenant ma vlastni Supabase projekt | Vysoka | Nejvyssi | Nejvyssi |

Zdroj: Reddit r/Supabase — https://www.reddit.com/r/Supabase/comments/1iyv3c6/

### 2.2 Pristup A: Shared Database + tenant_id (DOPORUCENY pro ModelPricer)

Toto je pristup ktery ModelPricer V3 jiz pouziva. Vyhody:

- **Jednoduchost:** Jedna databaze, jedna sada migraci, jeden deployment
- **Naklady:** Minimalni — vsichni tenanti sdili infrastrukturu
- **Skalovatelnost:** Zvladne stovky az tisice tenantu bez problemu
- **RLS:** PostgreSQL RLS zajisti izolaci na urovni databaze

```
┌─────────────────────────────────────────────┐
│                  Supabase DB                 │
│  ┌─────────────────────────────────────────┐ │
│  │  pricing_configs                        │ │
│  │  ┌─────────┬──────────┬──────────────┐  │ │
│  │  │ id      │ tenant_id│ data         │  │ │
│  │  ├─────────┼──────────┼──────────────┤  │ │
│  │  │ uuid-1  │ tenant-A │ { ... }      │  │ │
│  │  │ uuid-2  │ tenant-B │ { ... }      │  │ │
│  │  │ uuid-3  │ tenant-C │ { ... }      │  │ │
│  │  └─────────┴──────────┴──────────────┘  │ │
│  │           ↑ RLS filtruje dle tenant_id  │ │
│  └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

**Schema z ModelPricer V3** (jiz implementovano):
- 25 tabulek, vsechny s `tenant_id` sloupcem
- `UNIQUE(tenant_id, namespace)` pro config tabulky
- Indexy na `tenant_id` pro vsechny lookup tabulky
- `tenants` tabulka jako root entita

Zdroj: Stacksync blog — https://www.stacksync.com/blog/supabase-multi-tenancy-crm-integration

### 2.3 Pristup B: Separate Schemas

Kazdy tenant ma vlastni PostgreSQL schema (`CREATE SCHEMA tenant_abc`):

```sql
-- Vytvoreni schema pro tenantu
CREATE SCHEMA tenant_abc;

-- Tabulky v schema tenantu
CREATE TABLE tenant_abc.orders ( ... );
CREATE TABLE tenant_abc.pricing_configs ( ... );
```

**Vyhody:**
- Silnejsi izolace (schema-level boundary)
- Jednodussi RLS (neni treba tenant_id v kazdem dotazu)
- Snadnejsi mazani tenantu (DROP SCHEMA CASCADE)

**Nevyhody:**
- Supabase PostgREST defaultne exponuje jen `public` schema — potrebuje custom konfigurace
- Migrace musi bezet pro kazdy schema zvlast
- Nevhodne pro velky pocet tenantu (tisice schemat = management overhead)

**Hodnoceni pro ModelPricer:** NEVHODNE — zbytecna komplexita pro soucasny rozsah.

Zdroj: Reddit r/Supabase — https://www.reddit.com/r/Supabase/comments/1iyv3c6/

### 2.4 Pristup C: Separate Supabase Instances

Kazdy tenant = vlastni Supabase projekt:

**Vyhody:** Maximalni izolace, nezavisle skalovani, compliance (data residency)
**Nevyhody:** Vysoke naklady, slozity management, deployment pro kazdeho tenantu zvlast
**Hodnoceni pro ModelPricer:** NEVHODNE — overkill, neuskutecnitelne pro SaaS s mnoha tenancy.

### 2.5 Tenants Tabulka — Root Entita

Doporucena struktura `tenants` tabulky:

```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,          -- URL-safe identifikator
  name TEXT NOT NULL DEFAULT '',
  plan_name TEXT NOT NULL DEFAULT 'Starter',
  plan_features JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Duvody pro UUID jako tenant_id:**
- Nelze uhadnout (na rozdil od sekvencniho INT)
- Bezpecne pro URL a API
- Kompatibilni s Supabase auth system

Zdroj: Supabase diskuze #1615 — https://github.com/orgs/supabase/discussions/1615

---

## 3. Best Practices z Real-World Implementaci

### 3.1 Supabase Oficialni Doporuceni

1. **Vzdy pouzivat RLS** — nikdy se nespolehej jen na aplikacni logiku
2. **Indexy na tenant_id** — 100x zrychleni na velkych tabulkach
3. **SECURITY DEFINER funkce** pro slozite RLS podminky
4. **FORCE ROW LEVEL SECURITY** — vynuti RLS i pro table owners
5. **Testovat RLS politiky** pres pgTAP nebo manualne

Zdroj: Supabase docs — https://supabase.com/docs/guides/database/postgres/row-level-security

### 3.2 Dual Policy Approach (Permissive + Restrictive)

```sql
-- Permissive: umoznuje pristup pro autentizovane uzivatele
CREATE POLICY "authenticated_access"
  ON orders
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (true);

-- Restrictive: omezuje na spravny tenant (vzdy se aplikuje)
CREATE POLICY "tenant_isolation"
  ON orders
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
  );
```

**Proc dva typy:**
- `PERMISSIVE` politiky se OR-uji (staci aby jedna prosla)
- `RESTRICTIVE` politiky se AND-uji (vsechny musi projit)
- Tenant isolation jako RESTRICTIVE = vzdy vynuteny, nezavisle na dalsich politikach

Zdroj: Supabase docs SAML SSO — https://supabase.com/docs/guides/auth/enterprise-sso/auth-sso-saml

### 3.3 Auth Hook pro Custom JWT Claims

Pro automaticke prirazeni `tenant_id` do JWT pri loginu:

```sql
-- Supabase Auth Hook (spousti se pri kazdem tokenu)
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claims jsonb;
  tenant_id uuid;
BEGIN
  -- Najdi tenant_id pro uzivatele
  SELECT tm.tenant_id INTO tenant_id
  FROM team_members tm
  WHERE tm.user_id = (event->>'user_id')::uuid
  LIMIT 1;

  claims := event->'claims';

  IF tenant_id IS NOT NULL THEN
    claims := jsonb_set(claims, '{app_metadata,tenant_id}', to_jsonb(tenant_id::text));
  END IF;

  event := jsonb_set(event, '{claims}', claims);
  RETURN event;
END;
$$;
```

Zdroj: Supabase multi-tenancy priklady — https://roughlywritten.substack.com/p/supabase-multi-tenancy-simple-and-fast

### 3.4 Testovani RLS Politk (pgTAP)

Supabase doporucuje pouzivat pgTAP pro automaticke testovani RLS:

```sql
BEGIN;
SELECT plan(4);

-- Vytvor testovaci uzivatele
SELECT tests.create_supabase_user('user1@test.com');
SELECT tests.create_supabase_user('user2@test.com');

-- Vloz testovaci data
INSERT INTO public.orders (status, tenant_id) VALUES
  ('NEW', 'tenant-a'),
  ('NEW', 'tenant-b');

-- Otestuj ze User 1 (tenant-a) nevidi data tenantu B
SELECT tests.authenticate_as('user1@test.com');
SELECT results_eq(
  'SELECT count(*) FROM orders WHERE tenant_id = ''tenant-b''',
  ARRAY[0::bigint],
  'User from tenant-a cannot see tenant-b orders'
);

SELECT * FROM finish();
ROLLBACK;
```

Zdroj: Supabase docs — https://supabase.com/docs/guides/local-development/testing/pgtap-extended

### 3.5 Anti-Patterns (co NEDELAT)

1. **Nespolehej jen na aplikacni WHERE:** Bez RLS muze bug odhalit vsechna data
2. **Nepouzivej anon key pro admin operace:** Anon key = verejny, nema tenant claims
3. **Nedavej tenant_id do URL parametru bez overeni:** Klient muze podvrhnout cizi tenant_id
4. **Neignoruj RLS pro service_role:** Service role preskakuje RLS — pouzivej jen na backendu
5. **Nedelej subqueries v RLS bez indexu:** Zpomali cely dotaz

Zdroj: AntStack blog — https://www.antstack.com/blog/multi-tenant-applications-with-rls-on-supabase-postgress/

---

## 4. Cross-Device Synchronizace

### 4.1 Supabase Realtime — Tri Funkce

Supabase Realtime nabizi tri zpusoby real-time komunikace:

| Funkce | Popis | Persistence | Pouziti |
|--------|-------|-------------|---------|
| **Postgres Changes** | Posloucha INSERT/UPDATE/DELETE na tabulkach | Data v DB | Sync konfigurace, objednavky |
| **Broadcast** | Pub/sub zpravy mezi klienty | Neperzistentni | Chat, notifikace, UI stavy |
| **Presence** | Sdileny stav online klientu | V pameti | "Kdo je online", kurzory |

Zdroj: Supabase Realtime docs — https://supabase.com/realtime

### 4.2 Postgres Changes — Hlavni Pattern pro Sync

Pro ModelPricer je nejrelevatnejsi `Postgres Changes` — automaticka propagace zmen v databazi
do vsech pripojenych klientu:

```javascript
import { supabase } from '@/lib/supabase/client';

// Prihlaseni k odberum zmen na tabulce pricing_configs
const channel = supabase
  .channel('pricing-changes')
  .on(
    'postgres_changes',
    {
      event: '*',                    // INSERT, UPDATE, DELETE
      schema: 'public',
      table: 'pricing_configs',
      filter: `tenant_id=eq.${tenantId}`,  // Filtr na tenantu
    },
    (payload) => {
      console.log('Pricing config changed:', payload);
      // Aktualizuj lokalni stav
      if (payload.eventType === 'UPDATE') {
        setPricingConfig(payload.new.data);
      }
    }
  )
  .subscribe();

// Cleanup pri unmount
return () => {
  supabase.removeChannel(channel);
};
```

**Dulezite:**
- Realtime je defaultne VYPNUTY pro nove tabulky — musi se zapnout v Supabase dashboardu
  (Database > Replication > supabase_realtime)
- Pro prijimani stareho stavu pri UPDATE/DELETE nastavit:
  `ALTER TABLE pricing_configs REPLICA IDENTITY FULL;`
- RLS se aplikuje i na Realtime — klient dostane jen data ktera muze videt

Zdroj: Supabase docs — https://supabase.com/docs/guides/realtime/postgres-changes

### 4.3 Multi-Device Sync Flow

```
Device A (admin)             Supabase DB              Device B (jiny admin)
      │                           │                           │
      │  UPDATE pricing_configs   │                           │
      ├──────────────────────────>│                           │
      │                           │  Realtime notification    │
      │                           ├──────────────────────────>│
      │                           │                           │
      │                           │  UI se automaticky updatne│
      │                           │                           │
```

### 4.4 Optimisticke Updaty + Sync

Pro lepsi UX — kombinace optimistickych updatu s realtime potvrzenim:

```javascript
// 1. Optimisticky update (okamzity v UI)
setConfig((prev) => ({ ...prev, ...changes }));

// 2. Zapis do Supabase
const { error } = await supabase
  .from('pricing_configs')
  .upsert({ tenant_id: tenantId, namespace: 'pricing:v3', data: newConfig });

// 3. Pokud error — rollback optimistickeho updatu
if (error) {
  setConfig(previousConfig);
  showError('Ulozeni selhalo, zmeny byly vraceny.');
}

// 4. Realtime listener na ostatnich zarizeniich automaticky obnovi data
```

### 4.5 Presence pro Admin Dashboard

Sledovani kdo z tymu je online a na jake strance:

```javascript
const channel = supabase.channel('admin-presence');

// Track stav aktualniho uzivatele
channel.subscribe(async (status) => {
  if (status === 'SUBSCRIBED') {
    await channel.track({
      user_id: currentUser.id,
      page: '/admin/pricing',
      online_at: new Date().toISOString(),
    });
  }
});

// Poslechni zmeny
channel.on('presence', { event: 'sync' }, () => {
  const state = channel.presenceState();
  setOnlineUsers(Object.values(state).flat());
});
```

Zdroj: Supabase Presence docs — https://supabase.com/docs/guides/realtime/presence

### 4.6 Offline-First s RxDB (Pokrocile)

Pro plnou offline podporu existuje RxDB plugin pro Supabase — synchronizuje lokalni IndexedDB
s Supabase pres Realtime:

- Pull: PostgREST API pro initial load
- Push: PostgREST API pro zapis zmen
- Stream: Supabase Realtime pro live updaty

Zdroj: RxDB — https://rxdb.info/replication-supabase.html

**Hodnoceni pro ModelPricer:** NICE-TO-HAVE, ne priorita. Soucasny dual-write pattern pokryva
zakladni potreby. RxDB by byl relevatni az pro offline-first widget.

---

## 5. Migrace z localStorage do Supabase

### 5.1 Strategie Gradualni Migrace

ModelPricer V3 jiz ma implementovany pattern pro gradualini migraci (viz `featureFlags.js`
a `storageAdapter.js`). Toto je overeny pristup:

```
Phase 1: localStorage only        ← SOUCASNY STAV
Phase 2: dual-write               ← Pise do obou, cte z Supabase
Phase 3: supabase only            ← localStorage jen jako cache/fallback
Phase 4: cleanup                  ← Odstraneni localStorage logiky
```

### 5.2 Feature Flags per Namespace

Klicovy pattern — kazdy datovy namespace (pricing:v3, fees:v3, orders:v1, ...) ma svuj
vlastni prepinac:

```javascript
// Tri rezimy
const VALID_MODES = ['localStorage', 'supabase', 'dual-write'];

// Nastaveni modu pro konkretni namespace
setStorageMode('pricing:v3', 'dual-write');
setStorageMode('orders:v1', 'localStorage'); // Jeste nemigrovat

// Kontrola
getStorageMode('pricing:v3'); // 'dual-write'
isSupabaseEnabled('pricing:v3'); // true
isLocalStorageEnabled('pricing:v3'); // true (dual-write = obe)
```

**Vyhoda:** Muzeme migrovat po castech — nejdriv mene kriticka data (branding, dashboard),
pak kriticka (pricing, orders). Pokud se objevi problem, rychly rollback na localStorage.

### 5.3 Dual-Write Orchestrace

Jak funguje dual-write v `storageAdapter.js`:

**Zapis (write):**
1. Zkontroluj feature flag pro namespace
2. Pokud `localStorage` nebo `dual-write` → zapis do localStorage
3. Pokud `supabase` nebo `dual-write` → zapis do Supabase (async, fire-and-forget)

**Cteni (read):**
1. Zkontroluj feature flag
2. Pokud `localStorage` → cti z localStorage
3. Pokud `supabase` → cti z Supabase, fallback na error
4. Pokud `dual-write` → cti z Supabase, fallback na localStorage

```
                    ┌─── dual-write ────┐
                    │                   │
    Write ─────────>│  localStorage ←───┤── sync zapis
                    │  Supabase ←───────┤── async zapis
                    │                   │
    Read ──────────>│  Supabase ←───────┤── primarni zdroj
                    │  localStorage ←───┤── fallback
                    └───────────────────┘
```

### 5.4 Migration Runner

Pro inicializaci dat v Supabase (zkopirovat existujici localStorage data):

```javascript
// Pseudokod migration runneru
async function migrateNamespace(namespace, tenantId) {
  const lsKey = `modelpricer:${tenantId}:${namespace}`;
  const localData = JSON.parse(localStorage.getItem(lsKey));

  if (!localData) {
    return { status: 'skipped', reason: 'no local data' };
  }

  // Zkontroluj zda uz v Supabase neco je
  const { data: existing } = await supabase
    .from(getTableForNamespace(namespace))
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('namespace', namespace)
    .maybeSingle();

  if (existing) {
    return { status: 'skipped', reason: 'already migrated' };
  }

  // Vloz data do Supabase
  const { error } = await supabase
    .from(getTableForNamespace(namespace))
    .insert({
      tenant_id: tenantId,
      namespace: namespace,
      data: localData,
    });

  if (error) {
    return { status: 'error', error: error.message };
  }

  return { status: 'success' };
}
```

### 5.5 Rollback Strategie

Pokud migrace zpusobi problemy:

1. **Okamzity rollback:** `setStorageMode('pricing:v3', 'localStorage')` — okamzite prepne zpet
2. **Bulk rollback:** `setAllStorageModes('localStorage')` — vsechny namespaces zpet
3. **Data konzistence:** Protoze dual-write vzdy pise do localStorage, data tam zustavaji aktualni
4. **Backup pred migraci:** Exportovat localStorage data pred prechodem na supabase-only

### 5.6 Best Practices pro Migraci

1. **Zacni s nizko-rizikovymi daty** — branding, dashboard konfigurace, analytics
2. **Pricing a orders migruj posledni** — kriticka data, nejvyssi dopad chyby
3. **Monitoruj chybovost** — logovani kazdeho Supabase erroru, alert pri opakovanych chybach
4. **Testuj s realnym objemem dat** — RLS performance se meni s poctem radku
5. **Zachovej localStorage jako cache** — i po plnem prechodu na Supabase, localStorage muze
   slouzit jako offline cache pro rychly initial load
6. **Admin UI pro spravu flags** — `AdminMigration.jsx` (jiz v planu, route `/admin/migration`)

---

## 6. RLS Performance Optimalizace

### 6.1 Indexy na Sloupce Pouzite v RLS

**Kriticke:** Bez indexu na `tenant_id` muze RLS zpusobit sekvencni sken cele tabulky:

```sql
-- POVINNY index pro kazdy tenant_id sloupec
CREATE INDEX idx_orders_tenant ON orders (tenant_id);

-- Slozeny index pro caste dotazy
CREATE INDEX idx_orders_tenant_status ON orders (tenant_id, status);
CREATE INDEX idx_orders_tenant_created ON orders (tenant_id, created_at DESC);
```

**Mereni:** Supabase uvadi az **100x zrychleni** na velkych tabulkach po pridani indexu
na sloupec pouzity v RLS.

Zdroj: Supabase RLS performance — https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv

### 6.2 SECURITY DEFINER Funkce

Pro slozite RLS podminky zabalit logiku do funkce:

```sql
-- Funkce s SECURITY DEFINER se optimalizuje lepe
CREATE OR REPLACE FUNCTION auth_tenant_id()
RETURNS UUID AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Pouziti v RLS politice
CREATE POLICY "tenant_access"
  ON orders
  FOR ALL
  USING (tenant_id = auth_tenant_id());
```

**Proc SECURITY DEFINER:**
- Bezi s pravy creatora (ne volajiciho) — umoznuje lepsi optimalizaci
- `STABLE` oznaceni rika Postgresu ze funkce vraci stejny vysledek pro stejny vstup
  v ramci jedne transakce — umoznuje caching
- Planner muze lepe pracovat s jednoduchou funkci nez s inline JWT extrakci

Zdroj: DesignRevision — https://designrevision.com/blog/supabase-row-level-security,
Supabase docs — https://supabase.com/docs/guides/database/postgres/row-level-security

### 6.3 EXPLAIN ANALYZE pro Overeni

Vzdy overit ze RLS politika pouziva index:

```sql
EXPLAIN ANALYZE
SELECT * FROM orders WHERE tenant_id = 'some-uuid';

-- Hledej: "Index Scan" nebo "Bitmap Index Scan"
-- Spatne: "Seq Scan" = sekvencni prohledavani = pomale
```

### 6.4 Doporuceni od Supabase

1. **Pridej indexy** na vsechny sloupce pouzite v RLS politikach
2. **Pouzij `auth_tenant_id()` funkci** misto inlining `auth.jwt()` v kazde politice
3. **Nepouzivej subqueries** v RLS pokud to neni nutne — jsou pomale
4. **Pokud subquery nutne** — zabal do SECURITY DEFINER funkce s STABLE
5. **Monitoruj** pres Supabase Database Advisors (`pg_stat_statements`)

Zdroj: Supabase troubleshooting — https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv

---

## 7. Doporuceni pro ModelPricer V3

### 7.1 Co je Spravne (Existujici Implementace)

Soucasna architektura ModelPricer V3 je v souladu s best practices:

1. **Shared DB + tenant_id** — spravny pristup pro SaaS naseho rozsahu
2. **25 tabulek s tenant_id** — vsechny maji FK na `tenants` tabulku
3. **Indexy na tenant_id** — jiz implementovane v schema.sql
4. **Feature flags per namespace** — umoznuji gradualini migraci
5. **Dual-write pattern** — bezpecna migrace s rollback moznosti
6. **StorageAdapter abstrakce** — jediny bod ktery komunikuje s obema systemy

### 7.2 Co je Treba Vylepsit

#### 7.2.1 RLS Politiky — Prechod z Anon na Auth

Soucasne RLS politiky jsou `USING (true)` (demo faze). Plan prechodu:

```sql
-- Krok 1: Vytvor auth_tenant_id() helper
CREATE OR REPLACE FUNCTION auth_tenant_id()
RETURNS UUID AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Krok 2: Nahrad demo politiky autentizovanymi
DROP POLICY IF EXISTS "orders_select_anon" ON orders;

CREATE POLICY "orders_tenant_select"
  ON orders
  FOR SELECT
  TO authenticated
  USING (tenant_id = auth_tenant_id());

CREATE POLICY "orders_tenant_insert"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = auth_tenant_id());

-- Krok 3: FORCE RLS pro bezpecnost
ALTER TABLE orders FORCE ROW LEVEL SECURITY;
```

#### 7.2.2 Tenant ID do JWT Claims

Pridat Auth Hook ktery automaticky vlozi tenant_id do JWT:

```sql
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb LANGUAGE plpgsql STABLE AS $$
DECLARE
  claims jsonb;
  user_tenant_id uuid;
BEGIN
  SELECT t.id INTO user_tenant_id
  FROM tenants t
  JOIN team_members tm ON tm.tenant_id = t.id
  WHERE tm.data->>'user_id' = (event->>'user_id')
  LIMIT 1;

  claims := event->'claims';
  IF user_tenant_id IS NOT NULL THEN
    claims := jsonb_set(claims, '{app_metadata,tenant_id}', to_jsonb(user_tenant_id::text));
  END IF;

  event := jsonb_set(event, '{claims}', claims);
  RETURN event;
END;
$$;
```

#### 7.2.3 Realtime Subscriptions pro Cross-Device Sync

Pridat realtime listener v klicovych admin strankach:

```javascript
// Hook pro realtime sync (navrh)
export function useRealtimeConfig(table, namespace, tenantId) {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    if (!tenantId) return;

    const channel = supabase
      .channel(`${table}-${tenantId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: table,
        filter: `tenant_id=eq.${tenantId}`,
      }, (payload) => {
        if (payload.new.namespace === namespace) {
          setConfig(payload.new.data);
        }
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [table, namespace, tenantId]);

  return config;
}
```

#### 7.2.4 Monitoring a Alerting

- Pridat error counting do storageAdapter (pocet selhanych Supabase operaci za hodinu)
- Alert v admin dashboardu pokud chybovost prekroci prah
- Logovat vsechny RLS denied pristupy do audit_log

### 7.3 Prioritni Poradi Implementace

| Priorita | Ukol | Zavislost |
|----------|------|-----------|
| P0 | Auth-based RLS politiky | Auth system (Sprint 2 hotovy) |
| P0 | Tenant ID v JWT claims | Auth Hook setup |
| P1 | FORCE ROW LEVEL SECURITY na vsech tabulkach | RLS politiky hotove |
| P1 | Realtime subscriptions pro admin | Supabase client setup |
| P2 | Admin Migration UI (dry-run, progress) | StorageAdapter hotovy |
| P2 | pgTAP testy pro RLS | CI/CD pipeline |
| P3 | Presence (kdo je online) | Realtime setup |
| P3 | Offline-first cache | RxDB evaluace |

---

## 8. Zdroje a Citace

### Oficialni Supabase Dokumentace
- **RLS Guide:** https://supabase.com/docs/guides/database/postgres/row-level-security
- **RLS Performance:** https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv
- **Realtime Postgres Changes:** https://supabase.com/docs/guides/realtime/postgres-changes
- **Realtime Presence:** https://supabase.com/docs/guides/realtime/presence
- **pgTAP Testing:** https://supabase.com/docs/guides/local-development/testing/pgtap-extended
- **SSO/SAML Multi-Tenancy:** https://supabase.com/docs/guides/auth/enterprise-sso/auth-sso-saml
- **API Security:** https://supabase.com/docs/guides/api/securing-your-api
- **Database Advisors:** https://supabase.com/docs/guides/database/database-advisors

### Blog Posty a Tutorialy
- **AntStack — Multi-Tenant RLS:** https://www.antstack.com/blog/multi-tenant-applications-with-rls-on-supabase-postgress/
- **Stacksync — Multi-Tenancy CRM:** https://www.stacksync.com/blog/supabase-multi-tenancy-crm-integration
- **DesignRevision — RLS Complete Guide (2026):** https://designrevision.com/blog/supabase-row-level-security
- **MakerKit — RLS Best Practices:** https://makerkit.dev/blog/tutorials/supabase-rls-best-practices
- **Ryan O'Neill — Supabase Multi-Tenancy:** https://roughlywritten.substack.com/p/supabase-multi-tenancy-simple-and-fast
- **Arda Beyazoglu — Efficient Multi-Tenancy:** https://arda.beyazoglu.com/supabase-multi-tenancy
- **LockIn — RLS Deep Dive:** https://dev.to/blackie360/-enforcing-row-level-security-in-supabase-a-deep-dive-into-lockins-multi-tenant-architecture-4hd2
- **Logto — Multi-Tenancy PostgreSQL:** https://blog.logto.io/implement-multi-tenancy
- **Clerk — Multi-Tenant SaaS Design:** https://clerk.com/blog/how-to-design-multitenant-saas-architecture

### Komunitni Diskuze
- **Supabase Discussion #1615 — Multi-Tenant:** https://github.com/orgs/supabase/discussions/1615
- **Supabase Discussion #14576 — RLS Performance:** https://github.com/orgs/supabase/discussions/14576
- **Reddit r/Supabase — Multi-Tenant Backend:** https://www.reddit.com/r/Supabase/comments/1iyv3c6/

### Nastroje
- **RxDB Supabase Plugin:** https://rxdb.info/replication-supabase.html
- **Supabase Realtime:** https://supabase.com/realtime
- **SupaExplorer — RLS Optimization:** https://supaexplorer.com/best-practices/supabase-postgres/security-rls-performance/
- **Supabase Multi-Tenancy Template:** https://github.com/dikshantrajput/supabase-multi-tenancy

---

## Poznamky pro Implementacni Agenty

Tento dokument slouzi jako reference pro:
- `mp-sr-storage` — architekturalni rozhodnuti o storage/tenant izolaci
- `mp-mid-storage-tenant` — implementace RLS politk a migrace
- `mp-sr-security` — review bezpecnostniho modelu
- `mp-spec-infra-supabase` — nastaveni Supabase (realtime, auth hooks, RLS)

**Klicove soubory v projektu:**
- Schema: `Model_Pricer-V2-main/supabase/schema.sql`
- Feature Flags: `Model_Pricer-V2-main/src/lib/supabase/featureFlags.js`
- Storage Adapter: `Model_Pricer-V2-main/src/lib/supabase/storageAdapter.js`
- Supabase Client: `Model_Pricer-V2-main/src/lib/supabase/client.js`
- Migration Runner: `Model_Pricer-V2-main/src/lib/supabase/migrationRunner.js` (planovany)
