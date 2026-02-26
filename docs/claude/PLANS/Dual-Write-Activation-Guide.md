# Dual-Write Activation Guide — localStorage to Supabase

> **Datum:** 2026-02-26
> **Status:** Ready for execution
> **Prerekvizity:** Auth bridge, 25 tabulek, demo tenant, feature flags, StorageAdapter, MigrationRunner
> **Cas:** ~30 minut (vetsina je overovani)
> **Rollback:** Mozny kdykoliv behem cele procedury

---

## Prehled fazi

| Faze | Nazev | Riziko | Reversibilni |
|------|-------|--------|--------------|
| 1 | Pre-activation Checks | Zadne | N/A |
| 2 | Enable Dual-Write | Nizke | ANO — `rollbackToLocalStorage()` |
| 3 | Run Data Migration | Nizke | ANO — data zustavaji v localStorage |
| 4 | Verify Data in Supabase | Zadne | N/A |
| 5 | Deploy Production RLS | Stredni | ANO — re-run `schema.sql` (permissive policies) |
| 6 | Enable Supabase-Only (budouci) | Vysoke | ANO — `rollbackToLocalStorage()` |

---

## Faze 1: Pre-activation Checks

### 1.1 Over Supabase pripojeni

1. Otevri aplikaci v prohlizeci: `http://localhost:4028`
2. Prihlac se (Firebase login)
3. Naviguj na **Admin > Migration**: `http://localhost:4028/admin/migration`
4. Na strance se zobrazi sekce **Connection Status**:
   - Zeleny indikator + text `Supabase connected` = OK
   - Cerveny indikator = problem — zkontroluj `.env.local`:
     ```
     VITE_SUPABASE_URL=https://xxxxx.supabase.co
     VITE_SUPABASE_ANON_KEY=eyJhbGci...
     ```
5. Alternativne over v DevTools konzoli:
   ```js
   // V konzoli prohlizece (F12 > Console):
   import('@/lib/supabase/client').then(m => m.checkSupabaseConnection().then(console.log))
   // Ocekavany vystup: { ok: true }
   ```

### 1.2 Over auth bridge

1. Po prihlaseni otevri DevTools > Network tab
2. Proved jakoukoli akci ktera vyvola Supabase request (napr. navstiv `/admin/migration`)
3. Najdi request na `supabase.co` a zkontroluj hlavicky:
   - `Authorization: Bearer eyJ...` — Firebase token musi byt pritomen
4. Over claims endpoint:
   ```
   POST http://localhost:3001/api/auth/set-claims
   Authorization: Bearer <firebase-token>
   ```
   Ocekavana odpoved: `200 OK` s `role: 'authenticated'` a `tenant_id` v tele

### 1.3 Over tenant ID

1. V DevTools konzoli:
   ```js
   localStorage.getItem('modelpricer:tenant_id')
   // Ocekavany vystup: "demo-tenant" nebo vas tenant slug
   ```
2. Over ze tenant existuje v Supabase:
   - Supabase Dashboard > Table Editor > `tenants`
   - Najdi radek kde `slug` = vas tenant slug
   - Zapamatuj si `id` (UUID): `2800525a-d5cf-43cd-8de3-0145cdbd487c` (demo tenant)

### 1.4 Stahni zalohu localStorage dat

1. Na strance `/admin/migration` klikni tlacitko **"Download Backup"**
2. Stahne se soubor `modelpricer-backup-2026-02-26.json`
3. Over obsah — JSON s klici pro kazdy namespace:
   ```json
   {
     "version": 1,
     "tenantId": "demo-tenant",
     "exportedAt": "2026-02-26T...",
     "namespaces": {
       "pricing:v3": { "key": "modelpricer:demo-tenant:pricing:v3", "data": {...} },
       "fees:v3": { "key": "modelpricer:demo-tenant:fees:v3", "data": {...} },
       ...
     }
   }
   ```
4. **DULEZITE:** Uloz tento soubor na bezpecne misto. Je to posledni zachrana pokud neco selze.

### 1.5 Spust Dry-Run migraci

1. Na strance `/admin/migration` klikni tlacitko **"Dry Run"**
2. Sleduj progress bar — projde vsech 19 migraci bez zapisu do Supabase
3. V sekci **Dry Run Results** zkontroluj:
   - **Total:** 19
   - **Migrated:** pocet namespace s daty (status `dry-run`)
   - **Skipped:** namespace bez localStorage dat
   - **Errors:** **musi byt 0**
4. Pokud jsou errors:
   - Zkontroluj chybovou hlasku u konkretniho namespace
   - Typicke problemy: chybejici tabulka v Supabase, spatny tenant UUID
   - **NEPOKRACUJ** na fazi 2 dokud nejsou vsechny errors vyreseny

### 1.6 Over aktualni storage mody

1. Na strance `/admin/migration` zkontroluj sekci **"Storage Mode per Namespace"**
2. Vsechny namespace musi ukazovat `localStorage` (sede badge)
3. Alternativne v konzoli:
   ```js
   import('@/lib/supabase/featureFlags').then(m => console.table(m.getAllStorageModes()))
   ```
   Vsechny radky musi ukazovat `localStorage`.

### Pre-activation checklist

```
[ ] Supabase connected (zeleny indikator na /admin/migration)
[ ] Auth bridge funguje (Firebase token v Supabase requestech)
[ ] Tenant ID nastaven v localStorage
[ ] Tenant existuje v Supabase tabulce `tenants`
[ ] Backup stazeny a ulozen
[ ] Dry-run prosel bez chyb (0 errors)
[ ] Vsechny namespace v localStorage modu
```

**Pokud vsechny body jsou splneny, pokracuj na Fazi 2.**

---

## Faze 2: Enable Dual-Write (Bezpecny krok)

### Co dual-write dela

V dual-write modu:
- **WRITE:** Zapisuje do localStorage **I** Supabase soucasne
- **READ:** Cte z Supabase, pokud tam neni zadny zaznam, fallback na localStorage
- **localStorage se NIKDY nemaze** — je vzdy zachovan jako zaloha

Toto je nejbezpecnejsi krok protoze:
- Aplikace funguje uplne stejne jako predtim (localStorage je vzdy zapsany)
- Navic se data zacinaji zapisovat do Supabase
- Pokud Supabase selze, localStorage funguje jako fallback

### 2.1 Aktivace pres UI (doporuceno)

1. Naviguj na `http://localhost:4028/admin/migration`
2. Scrolluj k sekci **"Storage Mode per Namespace"**
3. Klikni tlacitko **"Enable Dual-Write (all)"** (oranzove tlacitko)
4. Vsechny namespace badge se zmeni na oranzovy `dual-write`

### 2.2 Aktivace pres konzoli (alternativa)

```js
// V DevTools konzoli (F12 > Console):
import('@/lib/supabase/featureFlags').then(m => {
  m.setAllStorageModes('dual-write');
  console.table(m.getAllStorageModes());
});
```

Alternativne pres migrationRunner API:
```js
import('@/lib/supabase/migrationRunner').then(m => {
  m.enableDualWriteForAll();
});
```

### 2.3 Aktivace po jednom namespace (opatrnejsi varianta)

Pokud chces aktivovat postupne (doporuceno pro produkci):

1. Na strance `/admin/migration` v tabulce "Storage Mode per Namespace"
2. U kazdeho namespace klikni na tlacitko `dual-write`
3. Doporucene poradi (od nejmensiho rizika):
   - Nejdrive: `branding`, `widget_theme`, `dashboard:v2` (mene kriticka data)
   - Pak: `pricing:v3`, `fees:v3` (konfigurace)
   - Pak: `orders:v1`, `orders:activity:v1` (transakcni data)
   - Nakonec: `audit_log`, `analytics:events` (logy)

Pres konzoli:
```js
import('@/lib/supabase/featureFlags').then(m => {
  m.setStorageMode('branding', 'dual-write');
  m.setStorageMode('widget_theme', 'dual-write');
  // ... dalsi po overeni
});
```

### 2.4 Overeni ze dual-write funguje

1. **DevTools > Network tab** — filtruj na `supabase.co`
2. Proved zmenu v Admin UI (napr. uprav pricing konfiguraci v `/admin/pricing`)
3. V Network tabu musi objevit POST/PATCH request na Supabase s:
   - URL obsahujici nazev tabulky (napr. `/rest/v1/pricing_configs`)
   - Status `200` nebo `201`
   - `Authorization: Bearer eyJ...` hlavicka
4. **DevTools > Console** — nemely by byt zadne cervene chyby typu `[storageAdapter] Supabase write error`
5. V DevTools konzoli over ze data stale jdou cist:
   ```js
   // Sync read (localStorage) — musi fungovat beze zmeny
   import('@/utils/adminTenantStorage').then(m => {
     console.log(m.readTenantJson('pricing:v3', null));
   });
   ```

### 2.5 Co se deje na pozadi (technicky detail)

Kdyz je namespace v `dual-write` modu a zavolate `writeTenantJson('pricing:v3', data)`:

1. `adminTenantStorage.writeTenantJson()` zapise do localStorage (synchronne)
2. Detekuje `dual-write` mod pro `pricing:v3`
3. Zavola `storageAdapter.write()` asynchronne (fire-and-forget)
4. `storageAdapter.write()`:
   - `isLocalStorageEnabled('pricing:v3')` = true -> zapise localStorage (uz zapsano, noop)
   - `isSupabaseEnabled('pricing:v3')` = true -> zavola `supabaseWriteConfig('pricing_configs', tenantId, 'pricing:v3', data)`
5. Supabase upsert na `pricing_configs` tabulku s `tenant_id` + `namespace` jako unikatni klic

Feature flags samotne jsou ulozeny v localStorage pod klicem:
```
modelpricer:feature_flags:storage_modes
```

### Dual-write checklist

```
[ ] Vsechny namespace ukazuji "dual-write" (oranzovy badge)
[ ] Supabase requesty jsou viditelne v Network tabu
[ ] Zadne Supabase chyby v konzoli
[ ] Aplikace funguje normalne (pricing, fees, orders...)
[ ] Sync read z localStorage stale vraci data
```

---

## Faze 3: Run Data Migration (localStorage -> Supabase)

### Proc je toto potreba

Dual-write zapisuje nova data do obou systemu, ale **existujici data** jsou jen v localStorage. Migrace zkopiruje vsechna existujici data do Supabase.

### 3.1 Spusteni migrace

1. Naviguj na `http://localhost:4028/admin/migration`
2. Klikni tlacitko **"Migrate to Supabase"** (zelene/teal tlacitko)
3. Objevi se confirm dialog: *"This will copy all localStorage data to Supabase. Continue?"*
4. Klikni **OK**
5. Sleduj progress bar — ukazuje aktualne migrovany namespace a pocet `X / 19`

### 3.2 Co migrace dela (19 kroku)

| ID | Namespace | Cilova tabulka | Typ |
|----|-----------|---------------|-----|
| 001 | `pricing:v3` | `pricing_configs` | config (upsert) |
| 002 | `fees:v3` | `fees` | config (upsert) |
| 003 | `orders:v1` | `orders` + `order_items` | orders (insert) |
| 004 | `orders:activity:v1` | `order_activity` | log (batch insert) |
| 005 | `audit_log` | `audit_log` | log (batch insert) |
| 006 | `analytics:events` | `analytics_events` | log (batch insert) |
| 007 | `shipping:v1` | `shipping_methods` | config (upsert) |
| 008 | `coupons:v1` | `coupons` | config (upsert) |
| 009 | `express:v1` | `express_tiers` | config (upsert) |
| 010 | `email:v1` | `email_templates` | config (upsert) |
| 011 | `form:v1` | `form_configs` | config (upsert) |
| 012 | `kanban:v1` | `kanban_configs` | config (upsert) |
| 013 | `dashboard:v2` | `dashboard_configs` | config (upsert) |
| 014 | `branding` | `branding` | config (upsert) |
| 015 | `widgets` | `widget_configs` | config (upsert) |
| 016 | `plan_features` | `tenants` (plan_name + plan_features sloupce) | config (update) |
| 017 | `widget_theme` | `widget_configs` | config (upsert) |
| 018 | `team_users` | `team_members` | config (upsert) |
| 019 | `team_invites` | `team_members` | config (upsert) |

**Config** typy pouzivaji upsert (bezpecne pro opakovane spusteni).
**Log** typy pouzivaji batch insert (500 zaznamu naraz).
**Orders** typ inseruje objednavky + jejich polozky (order_items).

### 3.3 Kontrola vysledku

Po dokonceni se zobrazi sekce **Migration Results**:

- **Total:** 19
- **Migrated:** pocet uspesne migrovanich namespace
- **Skipped:** namespace bez localStorage dat (normalni, ne chyba)
- **Errors:** **musi byt 0**

Pokud jsou errors:
- Chybove hlasky jsou zobrazeny pod vysledky (cerveny text s monospace fontem)
- Typicke problemy:
  - `Tenant "xxx" not found in Supabase` — tenant neni v tabulce `tenants`
  - `duplicate key value violates unique constraint` — data uz byla migrovana (bezpecne ignorovat)
  - `permission denied for table xxx` — RLS problem (over ze pouzivate anon klic a permissive policies)
- Migrace je **idempotentni** — bezpecne ji muzes spustit znovu

### 3.4 Migrace je bezpecna

- **localStorage data se NEMENI a NEMAZOU** behem migrace
- Migrace jen KOPIRUJE data do Supabase
- Config upsert = pokud zaznam uz existuje, prepise ho (bezpecne pro opakovani)
- Log insert = muze duplikovat zaznamy pri opakovanem spusteni (ale to se stane jen pokud migrujete znovu)

### Migration checklist

```
[ ] Migrace dokoncena (progress bar na 19/19)
[ ] 0 errors ve vysledcich
[ ] Skipped namespace odpovida tem bez dat (ocekavane)
```

---

## Faze 4: Verify Data in Supabase

### 4.1 Kontrola pres Supabase Dashboard

1. Otevri Supabase Dashboard: `https://supabase.com/dashboard/project/YOUR_PROJECT_ID`
2. Naviguj na **Table Editor** (levy panel)
3. Zkontroluj tyto tabulky:

#### pricing_configs
- Klikni na `pricing_configs`
- Musi existovat radek s:
  - `tenant_id` = `2800525a-d5cf-43cd-8de3-0145cdbd487c` (UUID demo tenanta)
  - `namespace` = `pricing:v3`
  - `data` = JSON objekt s pricing konfiguraci

#### fees
- Klikni na `fees`
- Radek s `namespace` = `fees:v3` a stejnym `tenant_id`

#### orders
- Klikni na `orders`
- Radky s objednavkami (pokud existovaly v localStorage)
- `tenant_id` musi odpovidat

#### order_items
- Klikni na `order_items`
- Polozky objednavek s `order_id` odkazujicim na tabulku `orders`

### 4.2 Krizova kontrola s localStorage

Pro overeni konzistence dat:

```js
// V DevTools konzoli:

// 1. Precti z localStorage
const lsData = JSON.parse(localStorage.getItem('modelpricer:demo-tenant:pricing:v3'));
console.log('localStorage:', lsData);

// 2. Precti z Supabase (pres async API)
import('@/utils/adminTenantStorage').then(async (m) => {
  const sbData = await m.readTenantJsonAsync('pricing:v3', null);
  console.log('Supabase:', sbData);
  console.log('Match:', JSON.stringify(lsData) === JSON.stringify(sbData));
});
```

Opakuj pro dalsi kriticke namespace:
- `fees:v3`
- `orders:v1`
- `branding`
- `widgets`

### 4.3 Kontrola pres SQL Editor

V Supabase Dashboard > SQL Editor:

```sql
-- Pocet zaznamu per tabulka pro daneho tenanta
SELECT 'pricing_configs' as tbl, count(*) FROM pricing_configs WHERE tenant_id = '2800525a-d5cf-43cd-8de3-0145cdbd487c'
UNION ALL
SELECT 'fees', count(*) FROM fees WHERE tenant_id = '2800525a-d5cf-43cd-8de3-0145cdbd487c'
UNION ALL
SELECT 'orders', count(*) FROM orders WHERE tenant_id = '2800525a-d5cf-43cd-8de3-0145cdbd487c'
UNION ALL
SELECT 'order_items', count(*) FROM order_items WHERE tenant_id = '2800525a-d5cf-43cd-8de3-0145cdbd487c'
UNION ALL
SELECT 'audit_log', count(*) FROM audit_log WHERE tenant_id = '2800525a-d5cf-43cd-8de3-0145cdbd487c'
UNION ALL
SELECT 'analytics_events', count(*) FROM analytics_events WHERE tenant_id = '2800525a-d5cf-43cd-8de3-0145cdbd487c'
UNION ALL
SELECT 'branding', count(*) FROM branding WHERE tenant_id = '2800525a-d5cf-43cd-8de3-0145cdbd487c'
UNION ALL
SELECT 'widget_configs', count(*) FROM widget_configs WHERE tenant_id = '2800525a-d5cf-43cd-8de3-0145cdbd487c'
UNION ALL
SELECT 'team_members', count(*) FROM team_members WHERE tenant_id = '2800525a-d5cf-43cd-8de3-0145cdbd487c';
```

### 4.4 Funkcni test aplikace

1. Otevri `/admin/pricing` — data se musi zobrazit spravne
2. Uprav neco (napr. cenu materialu) a uloz
3. Over ze zmena je v Supabase (Table Editor > `pricing_configs` > `data` sloupec)
4. Over ze zmena je i v localStorage:
   ```js
   JSON.parse(localStorage.getItem('modelpricer:demo-tenant:pricing:v3'))
   ```
5. Opakuj pro `/admin/fees`, `/admin/orders`, `/admin/branding`

### Verification checklist

```
[ ] pricing_configs ma data v Supabase
[ ] fees ma data v Supabase
[ ] orders ma data v Supabase (pokud existovaly)
[ ] tenant_id je spravny ve vsech zaznamech
[ ] Krizova kontrola LS vs Supabase — data se shoduji
[ ] Funkcni test — admin stranky funguji spravne
[ ] Nove zmeny se propisuji do OBOU systemu
```

---

## Faze 5: Deploy Production RLS (Po overeni)

> **POZOR:** Tuto fazi provadej AZ po uspesnem overeni dat ve fazi 4.
> Tato faze je nepovinne pro development, ale POVINNE pred produkci.

### 5.1 Co production RLS meni

Aktualne maji vsechny tabulky **permissive** politiky (`USING(true)`) — kdokoliv s anon klicem vidi vsechna data. Production RLS je nahradi **tenant-scoped** politikami kde:

- Kazda SELECT/INSERT/UPDATE/DELETE operace vyzaduje platny `tenant_id`
- `tenant_id` se zjistuje z:
  1. Firebase JWT custom claims (priorita 1)
  2. `x-tenant-id` request header (priorita 2, pro prechodni obdobi)
- Bez tenant kontextu = **DENY ALL** (zadny fallback na demo-tenant)
- Nektere tabulky maji specialni pravidla:
  - `branding` + `widget_configs`: verejne SELECT (widgety potrebuji data bez autentikace)
  - `audit_log` + `analytics_events` + `order_activity` + `email_logs`: jen SELECT + INSERT (append-only, nezmenne)
  - `tenants`: jen SELECT + UPDATE vlastniho tenanta (zadne INSERT/DELETE pres RLS)

### 5.2 Spusteni

1. Otevri Supabase Dashboard > **SQL Editor**
2. Otevri soubor `supabase/rls-policies-production.sql` z repa
   - Umisteni: `Model_Pricer-V2-main/supabase/rls-policies-production.sql`
3. Zkopiruj cely obsah do SQL Editoru
4. Klikni **Run**
5. Skript je idempotentni (bezpecne pro opakovane spusteni) — pouziva `DROP POLICY IF EXISTS` a `CREATE OR REPLACE`

### 5.3 Co skript dela (v poradi)

1. Vytvori/aktualizuje funkci `get_request_tenant_id()` (dual-mode: JWT + header)
2. Aktivuje `FORCE ROW LEVEL SECURITY` na vsech 25 tabulkach
3. Smaze vsechny existujici `*_anon` permissive policies (24 tabulek + 3 storage buckety)
4. Vytvori tenant-scoped policies pro specialni tabulky (sekce 4: tenants, audit_log, analytics_events, branding, widget_configs, order_activity, email_logs, api_keys)
5. Vytvori standardni tenant-scoped CRUD policies (sekce 5: 11 tabulek)
6. Vytvori storage bucket policies (sekce 6: models, documents, branding)

### 5.4 Overeni RLS

V SQL Editoru spust verifikacni dotazy:

```sql
-- 1. Over ze zadne _anon policies nezustavaji
SELECT policyname FROM pg_policies
WHERE policyname LIKE '%_anon'
AND schemaname = 'public';
-- Ocekavano: 0 radku

-- 2. Over FORCE RLS na vsech tabulkach
SELECT relname, relrowsecurity, relforcerowsecurity
FROM pg_class
WHERE relname IN (
  'tenants', 'pricing_configs', 'materials', 'fees', 'customers',
  'orders', 'order_items', 'order_activity', 'audit_log',
  'analytics_events', 'coupons', 'shipping_methods', 'email_templates',
  'email_logs', 'branding', 'widget_configs', 'dashboard_configs',
  'team_members', 'form_configs', 'express_tiers', 'kanban_configs',
  'documents', 'feature_flags', 'api_keys', 'chat_messages'
)
ORDER BY relname;
-- Vsechny radky musi mit relrowsecurity = true, relforcerowsecurity = true

-- 3. Test tenant izolace — SPATNY tenant
SET LOCAL request.headers = '{"x-tenant-id":"nonexistent-tenant"}';
SELECT count(*) FROM pricing_configs;
-- Ocekavano: 0

-- 4. Test tenant izolace — SPRAVNY tenant
SET LOCAL request.headers = '{"x-tenant-id":"demo-tenant"}';
SELECT count(*) FROM pricing_configs;
-- Ocekavano: > 0 (data pro demo tenanta)
```

### 5.5 Funkcni test po RLS

1. Otevri aplikaci `http://localhost:4028`
2. Prihlac se
3. Naviguj na `/admin/pricing` — data se musi zobrazit
4. Uprav neco a uloz — musi fungovat bez chyb
5. Over DevTools konzoli — zadne `permission denied` chyby
6. Over `/admin/migration` — Supabase stale connected

### RLS checklist

```
[ ] SQL skript prosel bez chyb
[ ] Zadne _anon policies v pg_policies
[ ] FORCE RLS povoleno na vsech 25 tabulkach
[ ] Spatny tenant vraci 0 radku
[ ] Spravny tenant vraci data
[ ] Aplikace funguje normalne po nasazeni RLS
```

---

## Faze 6: Enable Supabase-Only (Volitelne, Budouci)

> **NEPROVADEJ** tuto fazi bez dukladneho testovani v dual-write modu po dobu minimalne nekolika dnu.
> Toto je posledni krok migrace kdy se localStorage prestane pouzivat pro cteni.

### 6.1 Predpoklady

- Dual-write bezi bez problemu minimalne 3-5 dni
- Zadne Supabase chyby v konzoli
- Vsechna data overena v Supabase
- Production RLS nasazeny a otestovany

### 6.2 Aktivace pres UI

1. Na strance `/admin/migration`
2. Klikni **"Switch to Supabase (all)"** (zelene tlacitko)
3. Confirm dialog: *"Switch ALL namespaces to Supabase-only mode? localStorage will no longer be written to."*
4. Klikni **OK**

### 6.3 Aktivace pres konzoli

```js
import('@/lib/supabase/featureFlags').then(m => {
  m.setAllStorageModes('supabase');
  console.table(m.getAllStorageModes());
});
```

Nebo:
```js
import('@/lib/supabase/migrationRunner').then(m => {
  m.enableSupabaseForAll();
});
```

### 6.4 Co se zmeni

- **WRITE:** Zapisuje JEN do Supabase (localStorage se uz nezapisuje)
- **READ:** Cte JEN z Supabase (localStorage se ignoruje)
- **POZOR:** `writeTenantJson()` (sync API) stale zapise do localStorage kvuli backward kompatibilite (radek 82 v `adminTenantStorage.js`), ale Supabase je primarne zdroj pro cteni

### 6.5 Overeni

- Aplikace musi fungovat normalne
- V DevTools Network musi byt Supabase requesty pro kazdou operaci
- V konzoli nesmej byt chyby

---

## Rollback Plan

### Kdykoliv behem fazi 2-6: Rollback na localStorage

#### Pres UI (doporuceno)

1. Naviguj na `http://localhost:4028/admin/migration`
2. Klikni **"Rollback to localStorage (all)"** (cervene tlacitko)
3. Confirm dialog: *"Switch ALL namespaces back to localStorage mode?"*
4. Klikni **OK**
5. Vsechny badge se zmeni na sedy `localStorage`

#### Pres konzoli

```js
import('@/lib/supabase/featureFlags').then(m => {
  m.setAllStorageModes('localStorage');
  console.table(m.getAllStorageModes());
});
```

Nebo:
```js
import('@/lib/supabase/migrationRunner').then(m => {
  m.rollbackToLocalStorage();
});
```

### Proc rollback funguje bezpecne

1. **Dual-write nikdy nemaze localStorage data** — localStorage je vzdy zapsany prvni (synchronne)
2. Feature flags samy jsou v localStorage (`modelpricer:feature_flags:storage_modes`) — takze rollback funguje i bez Supabase
3. Po rollbacku aplikace cte jen z localStorage — Supabase se ignoruje
4. Data v Supabase zustavaji (nejsou smazana) — muzete dual-write znovu zapnout kdykoliv

### Rollback RLS (pokud faze 5 zpusobi problemy)

Pokud production RLS zpusobi problemy (napr. `permission denied` chyby):

1. Supabase Dashboard > SQL Editor
2. Spust puvodni `schema.sql` ktere obsahuje permissive policies
3. Alternativne rucne vratit jednu tabulku:
   ```sql
   DROP POLICY IF EXISTS "pricing_configs_select" ON pricing_configs;
   DROP POLICY IF EXISTS "pricing_configs_insert" ON pricing_configs;
   DROP POLICY IF EXISTS "pricing_configs_update" ON pricing_configs;
   DROP POLICY IF EXISTS "pricing_configs_delete" ON pricing_configs;

   CREATE POLICY "pricing_configs_select_anon" ON pricing_configs FOR SELECT USING (true);
   CREATE POLICY "pricing_configs_insert_anon" ON pricing_configs FOR INSERT WITH CHECK (true);
   CREATE POLICY "pricing_configs_update_anon" ON pricing_configs FOR UPDATE USING (true);
   CREATE POLICY "pricing_configs_delete_anon" ON pricing_configs FOR DELETE USING (true);
   ```

### Obnoveni z JSON backupu (krajni reseni)

Pokud byla localStorage data ztracena a potrebujete obnovit ze zalohy:

1. Otevri stazeny backup JSON (`modelpricer-backup-2026-02-26.json`)
2. V DevTools konzoli:
   ```js
   // Nahraj obsah backup souboru
   const backup = { /* obsah JSON */ };

   for (const [namespace, entry] of Object.entries(backup.namespaces)) {
     localStorage.setItem(entry.key, JSON.stringify(entry.data));
     console.log('Restored:', entry.key);
   }
   ```
3. Refreshni stranku

---

## Troubleshooting

### Problem: "Supabase not configured" na /admin/migration

**Pricina:** Chybi `VITE_SUPABASE_URL` nebo `VITE_SUPABASE_ANON_KEY` v `.env.local`

**Reseni:**
1. Over `.env.local` v rootu projektu (`Model_Pricer-V2-main/.env.local`)
2. Musi obsahovat:
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGci...
   ```
3. Restartuj Vite dev server (`npm run dev`)
4. POZOR: zmeny v `.env.local` vyzaduji restart serveru

### Problem: "Tenant not found in Supabase"

**Pricina:** Vas tenant slug neni v tabulce `tenants`

**Reseni:**
1. Zkontroluj vas tenant slug:
   ```js
   localStorage.getItem('modelpricer:tenant_id')
   ```
2. V Supabase Dashboard > Table Editor > `tenants` overit ze zaznam existuje
3. Pokud neexistuje, vytvor ho v SQL Editor:
   ```sql
   INSERT INTO tenants (slug, name, plan_name)
   VALUES ('demo-tenant', 'Demo Tenant', 'Starter');
   ```

### Problem: Supabase write chyby po RLS nasazeni

**Pricina:** JWT neobsahuje `tenant_id` claim nebo header `x-tenant-id` chybi

**Reseni:**
1. Over ze auth bridge funguje — po prihlaseni zavolej:
   ```
   POST /api/auth/set-claims
   ```
2. Over JWT obsah v jwt.io — musi obsahovat `tenant_id` claim
3. Docasny workaround: rollback RLS (viz vyse)

### Problem: Data se nezobrazuji po prepnuti na dual-write

**Pricina:** Supabase nema data (migrace nebyla spustena) a dual-write cte z Supabase prvne

**Reseni:**
1. Spust migraci (Faze 3) — ta zkopiruje existujici localStorage data do Supabase
2. Alternativne: docasne prepni zpet na localStorage, uprav data, prepni na dual-write

### Problem: `[storageAdapter] Supabase write error: permission denied`

**Pricina:** RLS politiky blokuji zapis protoze tenant_id nesedi

**Reseni:**
1. Over ze Firebase token obsahuje spravne claims
2. V SQL Editoru otestuj:
   ```sql
   SET LOCAL request.headers = '{"x-tenant-id":"demo-tenant"}';
   SELECT * FROM pricing_configs;
   ```
3. Pokud funguje v SQL ale ne z aplikace — problem je v auth bridge

### Problem: Duplicitni zaznamy v log tabulkach po opakovanem spusteni migrace

**Pricina:** Log migrace pouziva INSERT (ne upsert) — opakovane spusteni duplikuje zaznamy

**Reseni:**
1. Smazat duplicity:
   ```sql
   DELETE FROM audit_log
   WHERE id NOT IN (
     SELECT DISTINCT ON (created_at, action, entity_type, entity_id) id
     FROM audit_log
     WHERE tenant_id = '2800525a-d5cf-43cd-8de3-0145cdbd487c'
     ORDER BY created_at, action, entity_type, entity_id, id
   )
   AND tenant_id = '2800525a-d5cf-43cd-8de3-0145cdbd487c';
   ```
2. Logy v localStorage jsou omezeny na 100 zaznamu — duplikace je mala

### Kde hledat logy

| Zdroj | Kde |
|-------|-----|
| Frontend konzole | DevTools > Console (filtry: `[storageAdapter]`, `[adminTenantStorage]`, `[Supabase]`) |
| Supabase logy | Supabase Dashboard > Logs > Postgres (real-time) |
| Supabase API logy | Supabase Dashboard > Logs > API |
| Network requesty | DevTools > Network > Filter: `supabase.co` |
| Feature flags | `localStorage.getItem('modelpricer:feature_flags:storage_modes')` |

---

## Reference soubory

| Soubor | Ucel | Cesta (relativni k repo rootu) |
|--------|------|------|
| Feature flags | Per-namespace mod switching | `src/lib/supabase/featureFlags.js` |
| Storage adapter | Abstrakce localStorage/Supabase | `src/lib/supabase/storageAdapter.js` |
| Supabase client | Singleton + auth bridge | `src/lib/supabase/client.js` |
| Migration runner | 19 migraci + backup + rollback | `src/lib/supabase/migrationRunner.js` |
| Admin Migration UI | /admin/migration stranka | `src/pages/admin/AdminMigration.jsx` |
| Tenant storage | Hlavni entrypoint pro storage | `src/utils/adminTenantStorage.js` |
| Barrel export | Re-export vsech Supabase modulu | `src/lib/supabase/index.js` |
| Production RLS | Tenant-scoped politiky | `supabase/rls-policies-production.sql` |

---

## Celkovy flow diagram

```
Faze 1: PRE-CHECKS
  Supabase connected? ──NO──> Fix .env.local, restart dev server
  Auth bridge works?  ──NO──> Fix Firebase token, /api/auth/set-claims
  Backup downloaded?  ──NO──> /admin/migration > "Download Backup"
  Dry run 0 errors?   ──NO──> Fix errors first
  |
  v
Faze 2: DUAL-WRITE ON
  /admin/migration > "Enable Dual-Write (all)"
  Verify: Network tab shows Supabase requests
  Verify: No console errors
  |
  v
Faze 3: MIGRATE DATA
  /admin/migration > "Migrate to Supabase"
  Verify: 0 errors, all migrated/skipped
  |
  v
Faze 4: VERIFY
  Supabase Dashboard > Table Editor
  Cross-check LS vs Supabase
  Functional test in app
  |
  v
Faze 5: PRODUCTION RLS (optional for dev)
  SQL Editor > run rls-policies-production.sql
  Verify: tenant isolation works
  |
  v
Faze 6: SUPABASE-ONLY (budouci, po dnech testovani)
  /admin/migration > "Switch to Supabase (all)"

ROLLBACK (kdykoliv):
  /admin/migration > "Rollback to localStorage (all)"
```

---

## API reference (pro DevTools konzoli)

```js
// === Feature Flags ===
import('@/lib/supabase/featureFlags').then(m => {
  m.getAllStorageModes()                    // { 'pricing:v3': 'localStorage', ... }
  m.getStorageMode('pricing:v3')           // 'localStorage' | 'dual-write' | 'supabase'
  m.setStorageMode('pricing:v3', 'dual-write')  // Nastav 1 namespace
  m.setAllStorageModes('dual-write')       // Nastav vsechny
  m.isSupabaseEnabled('pricing:v3')        // true pokud dual-write nebo supabase
  m.isLocalStorageEnabled('pricing:v3')    // true pokud localStorage nebo dual-write
});

// === Migration Runner ===
import('@/lib/supabase/migrationRunner').then(m => {
  m.getMigrationList()                     // Seznam 19 migraci s info o localStorage datech
  m.runMigrations({ dryRun: true })        // Dry run (validace bez zapisu)
  m.runMigrations({ dryRun: false })       // Skutecna migrace
  m.backupLocalStorage()                   // Vrati JSON objekt se vsemi daty
  m.enableDualWriteForAll()                // Prepni vsechny na dual-write
  m.enableSupabaseForAll()                 // Prepni vsechny na supabase-only
  m.rollbackToLocalStorage()               // Rollback vsechny na localStorage
});

// === Supabase Client ===
import('@/lib/supabase/client').then(m => {
  m.isSupabaseAvailable()                  // true/false
  m.checkSupabaseConnection()              // Promise<{ ok: true/false, error? }>
});

// === Tenant Storage ===
import('@/utils/adminTenantStorage').then(m => {
  m.getTenantId()                          // 'demo-tenant'
  m.readTenantJson('pricing:v3', null)     // Sync read z localStorage
  m.readTenantJsonAsync('pricing:v3', null) // Async read (respektuje feature flags)
  m.writeTenantJson('pricing:v3', data)    // Sync LS + async Supabase fire-and-forget
  m.writeTenantJsonAsync('pricing:v3', data) // Async write (respektuje feature flags)
});
```
