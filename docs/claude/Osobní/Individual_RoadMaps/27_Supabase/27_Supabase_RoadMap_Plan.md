# 27. Supabase — plne propojeni databaze + storage — Detailni RoadMap Plan

> **Stav:** 🟠 20% hotovo | **Priorita:** KRITICKA
> **Zavislosti na jine sekce:** Auth (#20) pro RLS/JWT, Cloud Run (#26) pro backend klient
> **Kdo na nem zavisi:** Orders (#7), Model Storage (#14), Dashboard (#15), Analytika (#21), VSECHNO co potrebuje data

---

## Prehled

Supabase je PostgreSQL databaze + Storage + Realtime + Edge Functions. Aktualne existuje schema (25 tabulek), frontend klient, StorageAdapter a migracni runner, ale DEFAULT MODE = localStorage. Cil je prepnout na Supabase jako primarni zdroj dat.

**Klicove soubory:**
- `src/lib/supabase/client.js` — frontend Supabase klient
- `src/lib/supabase/featureFlags.js` — per-namespace prepinani
- `src/lib/supabase/storageAdapter.js` — NAMESPACE_TABLE_MAP, CRUD
- `supabase/schema.sql` — 25 tabulek s RLS
- `supabase/storage-policies.sql` — 3 buckety
- `supabase/seed.sql` — testovaci data
- `src/lib/supabase/migrationRunner.js` — 19 migraci
- `src/pages/admin/AdminMigration.jsx` — migracni UI

---

## Co je HOTOVO (✅)

### Schema a tabulky (80%)
- [x] 25 tabulek v `supabase/schema.sql`
- [x] RLS pravidla (zakladni)
- [x] 3 storage buckety: models (private), documents (private), branding (public)
- [x] Migracni runner s 19 migracemi
- [x] AdminMigration UI s dry-run, progress bar, backup download

### Frontend klient (70%)
- [x] `src/lib/supabase/client.js` — Supabase klient inicializace
- [x] StorageAdapter — NAMESPACE_TABLE_MAP pro mapovani namespace → tabulka
- [x] Feature flags — per-namespace `localStorage`/`supabase`/`dual-write`
- [x] Async hooks: `useStorageQuery`, `useStorageMutation`
- [x] `useSupabaseRealtime` hook (existuje, ale neni aktivne pouzivan)
- [x] `readTenantJsonAsync()`, `writeTenantJsonAsync()` — async API

### Storage helpery (70%)
- [x] Group A (10 helperu): auto-Supabase pres refaktorovany `adminTenantStorage.js`
- [x] Group B (5 helperu): explicitni Supabase fire-and-forget
- [x] `writeTenantJson()` vzdy pise localStorage i v 'supabase' modu (sync backward compat)

---

## Co CHYBI / je potreba dodelat

### Faze 1: Overeni a aktivace Supabase instance (Priorita: KRITICKA)

#### Ukol 1.1: Supabase projekt setup
- **Co udelat:**
  - [ ] Overit ze Supabase projekt existuje a je pristupny
  - [ ] Overit URL a anon klice v `src/lib/supabase/client.js`
  - [ ] Overit ze `.env` nebo config obsahuje spravne credentials
  - [ ] **POZOR:** Supabase_Information.md obsahuje klice — NIKDY necommitovat!

#### Ukol 1.2: Aplikovat schema
- **Co udelat:**
  - [ ] Spustit `supabase/schema.sql` na Supabase instanci (pokud jeste nebylo)
  - [ ] Overit ze vsech 25 tabulek existuje
  - [ ] Spustit `supabase/storage-policies.sql` pro buckety
  - [ ] Spustit `supabase/seed.sql` pro testovaci data (volitelne)

#### Ukol 1.3: Otestovat zakladni CRUD
- **Co udelat:**
  - [ ] Rucne otestovat: write do tabulky → read z tabulky → update → delete
  - [ ] Overit ze RLS neblokuje legitimni pozadavky
  - [ ] Overit ze anon klice nemaji pristup k jinym tenantum

### Faze 2: Prepnuti feature flags (Priorita: VYSOKA)

#### Ukol 2.1: Postupne prepinani namespace
- **Soubor:** `src/lib/supabase/featureFlags.js`
- **Doporuceny postup (opatrny, namespace po namespace):**
  1. Prepnout `pricing:v3` na `dual-write` → otestovat
  2. Prepnout `fees:v3` na `dual-write` → otestovat
  3. Prepnout `presets:v1` na `dual-write` → otestovat
  4. Prepnout `branding:v1` na `dual-write` → otestovat
  5. Prepnout `shipping:v1` na `dual-write` → otestovat
  6. Prepnout `express:v1` na `dual-write` → otestovat
  7. Prepnout `coupons:v1` na `dual-write` → otestovat
  8. Prepnout `orders:v1` na `dual-write` → otestovat (az po Orders #7)
  9. Po overeni: prepnout vsechny na `supabase`
- **DULEZITE:** `dual-write` = pise do obou (localStorage + Supabase), cte z Supabase s fallback na localStorage

#### Ukol 2.2: Spustit migrace
- **Co udelat:**
  - [ ] Otevrit AdminMigration UI (`/admin/migration`)
  - [ ] Spustit dry-run — overit ze migrace probehnour bez chyb
  - [ ] Stáhnout backup (download JSON)
  - [ ] Spustit migrace
  - [ ] Overit data v Supabase

### Faze 3: Backend Supabase klient (Priorita: VYSOKA)

#### Ukol 3.1: Backend klient s Service Role Key
- **Soubor:** `backend-local/lib/supabase.js` (NOVY)
- **Co udelat:**
  - [ ] `npm install @supabase/supabase-js` na backendu
  - [ ] Inicializace s Service Role Key (obchazi RLS — pro backend operace):
    ```javascript
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    ```
  - [ ] Helper funkce pro CRUD operace
  - [ ] **BEZPECNOST:** Service Role Key POUZE na backendu, nikdy na frontendu!

#### Ukol 3.2: Backend endpoints s Supabase
- **Co udelat:**
  - [ ] `POST /api/orders` → uklada do Supabase tabulky `orders` + `order_items`
  - [ ] `GET /api/orders/:id` → cte z Supabase
  - [ ] Upload souboru → Supabase Storage (bucket `models`, `documents`)
  - [ ] G-code po slicovani → ulozit do Supabase Storage

### Faze 4: RLS zprisneni (Priorita: VYSOKA pro produkci)

#### Ukol 4.1: JWT-based RLS
- **Soubor:** `supabase/schema.sql` (aktualizace RLS policies)
- **Co udelat:**
  - [ ] Aktualni RLS: zakladni (mozna jen na `anon` klici)
  - [ ] Cilove RLS: na zaklade JWT z Firebase Auth
  - [ ] Propojit Firebase Auth s Supabase JWT:
    - Varianta A: Supabase custom JWT helper (set `auth.uid()` z Firebase tokenu)
    - Varianta B: Firebase custom token → Supabase `auth.uid()`
  - [ ] Kazda tabulka: `USING (tenant_id = auth.uid())` nebo `USING (tenant_id = current_setting('request.jwt.claims')::json->>'sub')`
  - [ ] Otestovat ze tenant A nevidi data tenant B
- **? OTAZKA:** Jak propojit Firebase Auth JWT se Supabase RLS? Moznosti:
  - Custom Supabase JWT signing
  - Supabase Auth Bridge
  - Backend proxy (vsechny Supabase calls pres backend s Service Role Key)

### Faze 5: Supabase Storage (Priorita: STREDNI)

#### Ukol 5.1: Upload modelu do Storage
- **Co udelat:**
  - [ ] Po uploadu 3D modelu v kalkulacce: ulozit do Supabase Storage bucket `models`
  - [ ] Cesta: `models/{tenantId}/{orderId}/{filename}`
  - [ ] Po slicovani: ulozit G-code do bucket `documents`
  - [ ] Cesta: `documents/{tenantId}/{orderId}/{filename}.gcode`
  - [ ] Pristup: private — jen authentizovany uzivatel
  - [ ] Signed URLs pro docasny pristup (download z Order detail)

#### Ukol 5.2: Logo v branding bucket
- **Co udelat:**
  - [ ] Presunout logo z base64 localStorage do Supabase Storage bucket `branding`
  - [ ] Cesta: `branding/{tenantId}/logo.png`
  - [ ] Public pristup (logo musi byt verejne)

### Faze 6: Realtime (Priorita: NIZKA)

#### Ukol 6.1: Aktivace Realtime
- **Co udelat:**
  - [ ] Zapnout Supabase Realtime pro tabulku `orders`
  - [ ] V AdminOrders: `useSupabaseRealtime('orders')` — live aktualizace
  - [ ] V AdminDashboard: live metriky
  - [ ] Zvukova/vizualni notifikace pri nove objednavce

---

## Implementacni poradi

| # | Faze | Hodiny | Zavislosti | Priorita |
|---|------|--------|------------|----------|
| 1 | Faze 1: Overeni instance | 2-3h | Supabase ucet | KRITICKA |
| 2 | Faze 2: Feature flags + migrace | 4-6h | Faze 1 | VYSOKA |
| 3 | Faze 3: Backend klient | 3-5h | Faze 1, Cloud Run (#26) | VYSOKA |
| 4 | Faze 4: RLS zprisneni | 4-6h | Auth (#20), Faze 3 | VYSOKA (prod) |
| 5 | Faze 5: Storage | 3-4h | Faze 1 | STREDNI |
| 6 | Faze 6: Realtime | 2-3h | Faze 2 | NIZKA |

**Celkem pro Beta:** ~16-27 hodin

---

## Rizika

| Riziko | Pravdepodobnost | Dopad | Mitigace |
|--------|-----------------|-------|----------|
| Ztrata dat pri migraci | Stredni | Kriticky | Backup, dual-write, dry-run |
| RLS blokuje legitimni pozadavky | Stredni | Vysoky | Dkladne testovani |
| Service Role Key leak | Nizka | Kriticky | Env variables, ne v kodu |
| Firebase JWT ↔ Supabase RLS nefunguje | Stredni | Vysoky | Backend proxy jako fallback |

---

## Kriticke doplnky (z review)

### Doplnek 1: Firebase Auth → Supabase JWT bridge — detailni moznosti

Aktualne v Fazi 4 je jen strucna zminka. Zde jsou 3 konkretni pristupy s pros/cons:

#### Varianta A: Custom JWT signing na backendu (DOPORUCENO)
- **Jak to funguje:** Backend prijme Firebase ID token, overi ho pres Firebase Admin SDK, a podepise novy JWT kompatibilni se Supabase (`SUPABASE_JWT_SECRET` z dashboard Settings → API).
- **Implementace:**
  ```javascript
  // backend-local/lib/supabaseAuth.js
  import jwt from 'jsonwebtoken';
  import admin from 'firebase-admin';

  const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

  export async function createSupabaseToken(firebaseIdToken) {
    // 1. Verify Firebase token
    const decoded = await admin.auth().verifyIdToken(firebaseIdToken);

    // 2. Extract tenant_id (= Firebase UID or custom claim)
    const tenantId = decoded.tenant_id || decoded.uid;

    // 3. Sign Supabase-compatible JWT
    return jwt.sign(
      {
        sub: tenantId,          // maps to auth.uid() in RLS
        role: 'authenticated',  // Supabase role
        aud: 'authenticated',
        tenant_id: tenantId,    // custom claim for RLS
        email: decoded.email,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
      SUPABASE_JWT_SECRET
    );
  }
  ```
- **Frontend pouziti:**
  ```javascript
  // Po Firebase login → zavolej backend endpoint
  const { data } = await fetch('/api/auth/supabase-token', {
    headers: { Authorization: `Bearer ${firebaseIdToken}` }
  }).then(r => r.json());

  // Nastav Supabase session s custom tokenem
  await supabase.auth.setSession({
    access_token: data.supabaseToken,
    refresh_token: '', // neni potreba, token se refreshne pres backend
  });
  ```
- **Pros:** Plna kontrola nad JWT claims, funguje s RLS `auth.uid()`, zadna zavislost na Supabase Auth.
- **Cons:** Vyzaduje backend endpoint (`/api/auth/supabase-token`), manualni token refresh, backend musi bezet.
- **Slozitost:** Stredni (3-5h)

#### Varianta B: Supabase Third-Party Auth (novy v 2025)
- **Jak to funguje:** Supabase od 2025 podporuje Third-Party Auth — primy import Firebase JWT pres konfiguraci v Supabase dashboard (Settings → Authentication → Third Party).
- **Implementace:**
  1. V Supabase dashboard: zapnout Third Party Auth, nastavit Firebase project ID
  2. Frontend posila Firebase ID token primo do Supabase:
  ```javascript
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'firebase',
    token: firebaseIdToken,
  });
  ```
- **Pros:** Nejmene kodu, nativni podpora, automaticky refresh, funguje s RLS.
- **Cons:** Relativne nova feature (overit stabilitu), zavislost na Supabase implementaci, mene kontroly nad claims.
- **Slozitost:** Nizka (1-2h)

#### Varianta C: Backend proxy (bez JWT, Service Role Key)
- **Jak to funguje:** Vsechny Supabase operace jdou pres backend ktery pouziva Service Role Key (obchazi RLS). Backend sam overuje Firebase token a filtruje data podle tenant_id.
- **Implementace:**
  ```javascript
  // backend-local/routes/data.js
  app.get('/api/data/:namespace', verifyFirebaseToken, async (req, res) => {
    const tenantId = req.user.tenant_id; // z Firebase token
    const { data, error } = await supabaseAdmin
      .from(NAMESPACE_TABLE_MAP[req.params.namespace])
      .select('*')
      .eq('tenant_id', tenantId);
    res.json(data);
  });
  ```
- **Pros:** Funguje okamzite, zadna JWT logika na frontendu, plna kontrola.
- **Cons:** Kazdy request jde pres backend (latence, zatez), ztraci se vyhoda Supabase client-side, Realtime nefunguje z frontendu.
- **Slozitost:** Stredni (4-6h, hodne endpointu)

#### Doporuceni
Pro ModelPricer doporucuji **Variantu B** (Third-Party Auth) pokud je stabilni, jinak **Variantu A** (Custom JWT) s fallbackem na **Variantu C** pro kriticke endpointy.

---

### Doplnek 2: Konkretni RLS policy priklady pro klicove tabulky

Aktualni stav v `supabase/schema.sql` pouziva **plne permisivni** RLS policies (`USING (true)` pro vsechny operace na vsech tabulkach). To je nebezpecne pro produkci — jakykoli klient s anon klicem muze cist/psat data vsech tenantu.

#### Krok 1: Odstranit demo policies
```sql
-- Smazat vsechny existujici permisivni policies
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
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', tbl || '_select_anon', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', tbl || '_insert_anon', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', tbl || '_update_anon', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', tbl || '_delete_anon', tbl);
  END LOOP;
END $$;
```

#### Krok 2: Helper funkce pro tenant extrakci z JWT
```sql
-- Extrahuje tenant_id z JWT claims (funguje s Variantou A i B)
CREATE OR REPLACE FUNCTION get_tenant_id_from_jwt()
RETURNS UUID AS $$
BEGIN
  RETURN (auth.jwt() ->> 'tenant_id')::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

#### Krok 3: Produkcni RLS policies — priklady pro klicove tabulky

**Tabulka `orders` (kriticka — objednavky):**
```sql
-- Tenant muze cist pouze sve objednavky
CREATE POLICY "orders_select_tenant" ON orders
  FOR SELECT TO authenticated
  USING (tenant_id = get_tenant_id_from_jwt());

-- Tenant muze vytvaret objednavky pouze pro sebe
CREATE POLICY "orders_insert_tenant" ON orders
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_tenant_id_from_jwt());

-- Tenant muze upravovat pouze sve objednavky
CREATE POLICY "orders_update_tenant" ON orders
  FOR UPDATE TO authenticated
  USING (tenant_id = get_tenant_id_from_jwt());

-- Tenant NEMUZE mazat objednavky (jen admin pres Service Role Key)
-- Zadna DELETE policy = mazani zakazano pro authenticated role
```

**Tabulka `pricing_configs` (nastaveni cen):**
```sql
CREATE POLICY "pricing_select_tenant" ON pricing_configs
  FOR SELECT TO authenticated
  USING (tenant_id = get_tenant_id_from_jwt());

CREATE POLICY "pricing_upsert_tenant" ON pricing_configs
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_tenant_id_from_jwt());

CREATE POLICY "pricing_update_tenant" ON pricing_configs
  FOR UPDATE TO authenticated
  USING (tenant_id = get_tenant_id_from_jwt());
```

**Tabulka `audit_log` (jen cteni pro tenanta, zapis pres backend):**
```sql
-- Tenant muze cist svuj audit log
CREATE POLICY "audit_select_tenant" ON audit_log
  FOR SELECT TO authenticated
  USING (tenant_id = get_tenant_id_from_jwt());

-- Zapis audit logu POUZE pres Service Role Key (backend)
-- Zadna INSERT policy pro authenticated = frontend nemuze pridat zaznamy
```

**Tabulka `branding` (muze cist i anon — widgety potrebuji branding):**
```sql
-- Authenticated tenant muze cist/psat sve branding
CREATE POLICY "branding_tenant_all" ON branding
  FOR ALL TO authenticated
  USING (tenant_id = get_tenant_id_from_jwt())
  WITH CHECK (tenant_id = get_tenant_id_from_jwt());

-- Anon muze cist branding (pro widgety na externich domenach)
-- Potrebuje doplnkovou logiku — widget zna tenant slug, ne UUID
CREATE POLICY "branding_anon_select" ON branding
  FOR SELECT TO anon
  USING (true);  -- TODO: omezit na konkretni tenant pres request header
```

**Storage buckety — produkcni policies:**
```sql
-- models bucket: tenant muze uploadovat jen do sve slozky
CREATE POLICY "models_insert_tenant" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'models'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')
  );

-- models bucket: tenant muze cist jen svou slozku
CREATE POLICY "models_select_tenant" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'models'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')
  );

-- branding bucket: verejne cteni (logo widgetu)
CREATE POLICY "branding_select_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'branding');

-- branding bucket: zapis jen pro vlastni slozku
CREATE POLICY "branding_insert_tenant" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'branding'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')
  );
```

#### Soubor pro RLS update
Vytvorit novy soubor `supabase/rls-production.sql` s kompletnimi produkcnimi policies. Aplikovat az PO implementaci JWT bridge (Doplnek 1).

---

### Doplnek 3: Migration rollback plan

Aktualni `migrationRunner.js` ma `rollbackToLocalStorage()` ktery jen prepne feature flags, ale neresi situaci kdy migrace selze uprostred. Zde je detailni plan:

#### Scenar 1: Migrace selze uprostred (partial migration)
- **Problem:** Nekteré namespaces migrovany, jine ne. Data v nekonzistentnim stavu.
- **Reseni:**
  1. `migrationRunner.js` uz trackuje `status: 'partial'` — vyuzit toto
  2. Pridat do AdminMigration UI: tlacitko "Rollback partially migrated" ktere:
     - Prepne vsechny namespaces zpet na `localStorage`
     - Smazne z Supabase data jen tech namespacu ktere maji `status: 'partial'` nebo `status: 'error'`
     - Ponecha uspesne migrovane namespaces v Supabase (ale cte se z localStorage)
  3. Implementace:
  ```javascript
  // Pridat do migrationRunner.js
  export async function rollbackPartialMigration(failedMigrationIds) {
    const tenantSlug = getTenantId();
    const tenantUuid = await getTenantUuid(tenantSlug);
    if (!tenantUuid) return { ok: false, error: 'Tenant not found' };

    for (const migId of failedMigrationIds) {
      const migration = MIGRATIONS.find(m => m.id === migId);
      if (!migration) continue;

      // Smazat data z Supabase pro tento namespace
      if (migration.type === 'config') {
        await supabase
          .from(migration.table)
          .delete()
          .eq('tenant_id', tenantUuid)
          .eq('namespace', migration.namespace);
      } else if (migration.type === 'log') {
        await supabase
          .from(migration.table)
          .delete()
          .eq('tenant_id', tenantUuid);
      }

      // Prepnout namespace zpet na localStorage
      setStorageMode(migration.namespace, 'localStorage');
    }

    return { ok: true, rolledBack: failedMigrationIds };
  }
  ```

#### Scenar 2: Supabase je nedostupne po migraci
- **Problem:** Data jsou v Supabase, ale sluzba spadne / je nedostupna.
- **Reseni:**
  1. `storageAdapter.read()` uz ma fallback na localStorage v `dual-write` modu
  2. Pridat **automaticky circuit breaker**:
  ```javascript
  // Pridat do storageAdapter.js
  let consecutiveFailures = 0;
  const CIRCUIT_BREAKER_THRESHOLD = 3;
  let circuitOpen = false;
  let circuitOpenedAt = null;
  const CIRCUIT_RESET_MS = 60000; // 1 minuta

  function checkCircuit() {
    if (circuitOpen && Date.now() - circuitOpenedAt > CIRCUIT_RESET_MS) {
      circuitOpen = false;
      consecutiveFailures = 0;
      console.warn('[storageAdapter] Circuit breaker reset, retrying Supabase');
    }
    return !circuitOpen;
  }

  function recordFailure() {
    consecutiveFailures++;
    if (consecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD) {
      circuitOpen = true;
      circuitOpenedAt = Date.now();
      console.error('[storageAdapter] Circuit breaker OPEN — falling back to localStorage');
    }
  }

  function recordSuccess() {
    consecutiveFailures = 0;
  }
  ```
  3. Pridat do kazde Supabase operace v storageAdapter: `if (!checkCircuit()) return fallback;`

#### Scenar 3: Data corruption v Supabase
- **Problem:** Data v Supabase jsou poskozena (spatny JSON, chybejici sloupce).
- **Reseni:**
  1. Vzdy mit `backupLocalStorage()` backup PRED migraci (uz existuje)
  2. Pridat restore funkci:
  ```javascript
  // Pridat do migrationRunner.js
  export function restoreFromBackup(backupJson) {
    const backup = JSON.parse(backupJson);
    for (const [namespace, entry] of Object.entries(backup.namespaces)) {
      window.localStorage.setItem(entry.key, JSON.stringify(entry.data));
      setStorageMode(namespace, 'localStorage');
    }
    return { ok: true, restored: Object.keys(backup.namespaces) };
  }
  ```
  3. V AdminMigration UI: tlacitko "Restore from backup" (upload JSON souboru)

#### Celkovy rollback checklist
```
[ ] 1. Zastavit vsechny zapisy do Supabase (setAllStorageModes('localStorage'))
[ ] 2. Overit ze localStorage ma posledni verzi dat (pokud dual-write = ano)
[ ] 3. Pokud localStorage nema data: pouzit backup JSON
[ ] 4. Otestovat aplikaci v localStorage modu
[ ] 5. Investigovat pricinu selhani
[ ] 6. Opravit a zkusit migraci znovu
```

---

### Doplnek 4: Performance — connection pooling, query optimalizace

#### 4.1 Connection Pooling
Supabase pouziva PgBouncer v transaction modu na portu 6543. Pro frontend klienta (browser) to neni relevantni (pouziva REST/WebSocket), ale pro backend JE.

**Backend doporuceni:**
```javascript
// backend-local/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

// Pro REST API (frontend i backend) — connection pooling je automaticky
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    db: {
      schema: 'public',
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Pro primo PostgreSQL pripojeni (pokud bude potreba):
// Pouzit port 6543 (PgBouncer) misto 5432 (primo Postgres)
// Connection string: postgresql://...@db.xxx.supabase.co:6543/postgres
```

#### 4.2 Query optimalizace — indexy
Schema uz ma zakladni indexy. Pro produkci pridat:
```sql
-- Casty dotaz: objednavky podle datumu (dashboard, analytics)
CREATE INDEX IF NOT EXISTS idx_orders_created_status
  ON orders(tenant_id, created_at DESC, status);

-- Casty dotaz: audit log filtrovany podle entity
CREATE INDEX IF NOT EXISTS idx_audit_log_entity
  ON audit_log(tenant_id, entity_type, entity_id);

-- Casty dotaz: analytics podle casoveho rozsahu
CREATE INDEX IF NOT EXISTS idx_analytics_time_range
  ON analytics_events(tenant_id, created_at DESC, event_type);

-- JSONB indexy pro pricing data (pokud budeme filtrovat uvnitr JSON)
CREATE INDEX IF NOT EXISTS idx_pricing_data_gin
  ON pricing_configs USING GIN (data jsonb_path_ops);

-- Partial index: jen aktivni materialy
CREATE INDEX IF NOT EXISTS idx_materials_active
  ON materials(tenant_id, key) WHERE enabled = true;
```

#### 4.3 Frontend optimalizace
- **Batch reads:** Misto 5 separatnich `storageAdapter.read()` volani pouzit Promise.all():
  ```javascript
  const [pricing, fees, shipping, coupons, express] = await Promise.all([
    storageAdapter.read('pricing:v3', tenantId, lsKey1, {}),
    storageAdapter.read('fees:v3', tenantId, lsKey2, {}),
    storageAdapter.read('shipping:v1', tenantId, lsKey3, {}),
    storageAdapter.read('coupons:v1', tenantId, lsKey4, {}),
    storageAdapter.read('express:v1', tenantId, lsKey5, {}),
  ]);
  ```
- **Select optimalizace:** Pouzit `.select('id, data')` misto `.select('*')` kde to staci.
- **Pagination:** Pro orders a audit_log vzdy pouzivat `readList()` s `limit` a `offset`.
- **Cache:** Zvazit `stale-while-revalidate` pattern — cist z localStorage cache, na pozadi refreshnout ze Supabase.

#### 4.4 Metriky na sledovani
- Prumerna latence Supabase queries (cil: <200ms pro config reads, <500ms pro list queries)
- Pocet chybovych odpovedi za minutu (cil: <1%)
- Velikost JSONB dat v `data` sloupci (varovani pri >500KB na radek)

---

### Doplnek 5: Backup strategie

#### 5.1 Automaticke backupy (Supabase vestavene)
| Plan | Frekvence | Retence | Point-in-Time Recovery |
|------|-----------|---------|------------------------|
| Free | Zadne | — | Ne |
| Pro ($25/mesic) | Denne | 7 dni | Ano (posledni 7 dni) |
| Team ($599/mesic) | Denne | 30 dni | Ano (posledni 30 dni) |

**DULEZITE:** Free tier NEMA automaticke backupy. Pro produkci je Pro plan minimum.

#### 5.2 Vlastni backup reseni (doporuceno i na Pro planu)
```javascript
// backend-local/scripts/backup.js — spoustet pres cron nebo manualne
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TABLES_TO_BACKUP = [
  'tenants', 'pricing_configs', 'fees', 'orders', 'order_items',
  'customers', 'branding', 'widget_configs', 'shipping_methods',
  'coupons', 'express_tiers', 'materials'
];

async function backupAll() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backup = { version: 1, timestamp, tables: {} };

  for (const table of TABLES_TO_BACKUP) {
    const { data, error } = await supabase.from(table).select('*');
    if (error) {
      console.error(`Backup failed for ${table}:`, error.message);
      backup.tables[table] = { error: error.message };
    } else {
      backup.tables[table] = { count: data.length, data };
    }
  }

  const filename = `backup-${timestamp}.json`;
  await fs.writeFile(filename, JSON.stringify(backup, null, 2));
  console.log(`Backup saved: ${filename} (${Object.keys(backup.tables).length} tables)`);
  return filename;
}

backupAll();
```

#### 5.3 Doporuceny backup plan
| Typ | Frekvence | Kam | Retence |
|-----|-----------|-----|---------|
| Supabase auto (Pro plan) | Denne | Supabase infra | 7 dni |
| Vlastni JSON export | Tydne | Cloud Storage / lokalni disk | 30 dni |
| Pre-migration backup | Pred kazdou migraci | Stahnout pres AdminMigration UI | Permanentni |
| localStorage snapshot | Pred prepnutim na `supabase` mode | Browser download | Do overeni migrace |

#### 5.4 Restore postup
1. **Z Supabase auto-backup (Pro plan):** Supabase Dashboard → Database → Backups → Restore
2. **Z vlastniho JSON exportu:** Spustit restore skript ktery importuje data zpet pres Service Role Key
3. **Z localStorage snapshotu:** Pouzit `restoreFromBackup()` z migrationRunner.js (viz Doplnek 3)

---

### Doplnek 6: Monitoring a alerting

#### 6.1 Supabase Dashboard metriky (vestavene)
- **Database:** Aktivni pripojeni, queries/sec, disk usage, CPU usage
- **API:** Requesty/sec, chybove kody (4xx, 5xx), latence
- **Storage:** Bucket usage, bandwidth
- **Realtime:** Aktivni subscriptions, broadcasty/sec
- **Auth:** Loginy/sec, registrace, chybove pokusy

#### 6.2 Vlastni monitoring v aplikaci
```javascript
// src/lib/supabase/monitor.js — lightweight monitoring
const metrics = {
  queries: 0,
  errors: 0,
  totalLatencyMs: 0,
  lastError: null,
  circuitBreakerTrips: 0,
};

export function recordQuery(durationMs, success) {
  metrics.queries++;
  metrics.totalLatencyMs += durationMs;
  if (!success) {
    metrics.errors++;
    metrics.lastError = new Date().toISOString();
  }
}

export function getMetrics() {
  return {
    ...metrics,
    avgLatencyMs: metrics.queries > 0
      ? Math.round(metrics.totalLatencyMs / metrics.queries)
      : 0,
    errorRate: metrics.queries > 0
      ? ((metrics.errors / metrics.queries) * 100).toFixed(2) + '%'
      : '0%',
  };
}

// Pouziti v storageAdapter.js:
// const start = performance.now();
// const result = await supabaseReadConfig(...);
// recordQuery(performance.now() - start, result !== NOT_FOUND);
```

#### 6.3 AdminDashboard integrace
Pridat do AdminDashboard novou kartu "Supabase Health":
- Connection status (zelena/cervena)
- Prumerna latence poslednich 50 queries
- Error rate (posledni hodina)
- Aktualni storage mode pro vsechny namespaces
- Circuit breaker stav

#### 6.4 Alerting (budouci)
| Alert | Podminka | Akce |
|-------|----------|------|
| Supabase nedostupne | 3 po sobe jdouci chyby | Prepnout na localStorage (circuit breaker) |
| Vysoka latence | Prumerna >1s za 5 min | Warning log + dashboard badge |
| Disk usage >80% | Supabase dashboard metric | Upozornit admina |
| RLS denial | 403 z Supabase | Log + investigate (mozna JWT problem) |
| Backup stary >7 dni | Kontrola pri startu | Warning v AdminDashboard |

---

### Doplnek 7: Odhad nakladu Supabase

#### 7.1 Free tier limity (relevantni pro vyvoj/MVP)
| Zdroj | Limit | Nase pouziti (odhad) | Staci? |
|-------|-------|----------------------|--------|
| Database | 500 MB | ~50 MB (25 tabulek, JSON configs) | ANO |
| Storage | 1 GB | ~200 MB (3D modely, G-code, loga) | NA HRANICI |
| Bandwidth | 2 GB/mesic | ~500 MB (API calls + storage downloads) | ANO |
| Realtime | 200 concurrent | ~5-20 concurrent admin sessions | ANO |
| Edge Functions | 500K invocations | 0 (zatim nepouzivame) | ANO |
| Auth | 50K MAU | ~100-500 tenantu | ANO |
| File uploads | 50 MB max/soubor | 3D modely typicky 1-50 MB | NA HRANICI |
| Rows | Bez limitu | ~10K-100K radku | ANO |
| **Auto backup** | **ZADNE** | — | **KRITICKE** |

**Zaver Free tier:** Staci pro vyvoj a male MVP (~10 tenantu). Hlavni omezeni je **zadne automaticke backupy** a **1 GB storage limit**.

#### 7.2 Pro plan ($25/mesic) — doporuceno pro produkci
| Zdroj | Limit | Zmena oproti Free |
|-------|-------|-------------------|
| Database | 8 GB | +7.5 GB |
| Storage | 100 GB | +99 GB |
| Bandwidth | 250 GB/mesic | +248 GB |
| File uploads | 5 GB max/soubor | +4.95 GB |
| Auto backup | Denne, 7 dni retence | **NOVA FEATURE** |
| Point-in-Time Recovery | Ano | **NOVA FEATURE** |
| Podpora | Email | Upgrade z community-only |

**Extras (nad Pro limit):** Database $0.125/GB, Storage $0.021/GB, Bandwidth $0.09/GB

#### 7.3 Nakladovy odhad pro ModelPricer
| Faze | Plan | Mesicni naklady | Rocni naklady |
|------|------|-----------------|---------------|
| Vyvoj / MVP (1-10 tenantu) | Free | $0 | $0 |
| Beta (10-50 tenantu) | Pro | $25 | $300 |
| Produkce (50-200 tenantu) | Pro + extras | ~$35-50 | ~$420-600 |
| Scale (200+ tenantu) | Team ($599) nebo Pro + heavy extras | $100-599 | $1200-7188 |

**Porovnani s alternativami:**
| Sluzba | Cena pro ~50 tenantu | Nase features |
|--------|---------------------|---------------|
| Supabase Pro | $25/mesic | DB + Storage + Realtime + Auth |
| Firebase Blaze | ~$30-50/mesic | DB + Storage + Auth (no Realtime SQL) |
| PlanetScale + R2 | ~$40/mesic | DB + Storage (bez Realtime) |
| Railway + Neon | ~$25-35/mesic | Hosting + DB (bez Storage) |

---

### Doplnek 8: Edge Functions — alternativa k Cloud Functions

#### 8.1 Co jsou Supabase Edge Functions
Deno-based serverless funkce bezici na Supabase infra (Deno Deploy). Alternativa ke Google Cloud Functions / Cloud Run pro lehke backend operace.

#### 8.2 Potencialni pouziti v ModelPricer
| Use case | Aktualne | Edge Function alternativa | Vyhoda |
|----------|----------|--------------------------|--------|
| Webhook handler (Shopify) | Cloud Run backend | Edge Function `shopify-webhook` | Nizsi latence, neni potreba vlastni server |
| Order email notifikace | Backend → email API | Edge Function `send-order-email` | Trigger primo z DB (Supabase triggers) |
| Analytics aggregace | Frontend pocita | Edge Function `aggregate-analytics` | Presunuti zateze z klienta |
| Scheduled backup | Manualni / cron | Edge Function + pg_cron | Automaticky, bez externiho cronu |
| PDF generovani (faktura) | Backend | Edge Function `generate-invoice` | Serverless, pay-per-use |

#### 8.3 Priklad: Webhook handler
```typescript
// supabase/functions/shopify-webhook/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  // Verify Shopify HMAC
  const hmac = req.headers.get('x-shopify-hmac-sha256');
  const body = await req.text();
  // ... verify HMAC ...

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const payload = JSON.parse(body);

  // Ulozit objednavku
  const { error } = await supabase.from('orders').update({
    status: 'PAID',
    metadata: { shopify_order_id: payload.id },
  }).eq('order_number', payload.note_attributes?.modelpricer_order_id);

  return new Response(JSON.stringify({ ok: !error }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

#### 8.4 Doporuceni
- **Nepouzivat Edge Functions jako nahradu za Cloud Run backend** — PrusaSlicer slicing vyzaduje plny server (binarka, file system, dlouhy beh)
- **Pouzit pro:** webhooky, emaile, scheduled tasks, lehke transformace
- **Nepouzivat pro:** slicing, velke file operace, dlouhobezici procesy (>60s timeout)
- **Casovani:** Implementovat az po Fazi 3 (backend klient), jako optimalizace

---

## Poznamky

- **KRITICKE:** `writeTenantJson()` VZDY pise localStorage (sync backward compat) — async API respektuje flags
- **KRITICKE:** Service Role Key obchazi RLS — POUZE na backendu
- **KRITICKE:** Supabase_Information.md obsahuje klice — v .gitignore, NIKDY necommitovat
- **DULEZITE:** `useStorageMutation` musi mit `useEffect` cleanup pro `mountedRef` (memory leak prevence)
- **TIP:** Dual-write je bezpecny zpusob migrace — cte ze Supabase, pise do obou
- **TIP:** AdminMigration UI ma dry-run a backup — pouzit!
