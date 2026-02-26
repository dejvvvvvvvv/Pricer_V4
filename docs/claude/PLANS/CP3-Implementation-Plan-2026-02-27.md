# CP3 Implementation Plan — Auth Bridge + Dual-Write Activation

> **Datum:** 2026-02-27
> **Autor:** mp-spec-plan-manager (koordinator)
> **Status:** DRAFT — pripraveno k implementaci
> **Predchozi sprint:** Supabase Security Sprint (2026-02-26, viz 089-WB, 090-SB, 091-SB, 092-SB)
> **Navazuje na:** `docs/claude/PLANS/Supabase-Migration-Tenant-Isolation-Sprint.md` (Faze 1-4 HOTOVE, Faze 5+ jsou dalsi)
> **Odhadovana slozitost:** Stredni (8 fazi — 4 pracovni + 4 kontrolni)

---

## 0) Shrnuti

Tento plan pokryva CP3 implementaci Supabase migrace: od commitnuti outstanding zmen, pres auth bridge (Firebase JWT -> Supabase Third-Party Auth), az po aktivaci dual-write pro kriticke namespaces. Cilem je zprovoznit plny auth pipeline aby RLS policies mohly fungovat s realnymi tenant claims.

**Aktualni stav (pred timto planem):**
- 14 modified + 17 untracked souboru z Supabase security sprintu (NECOMMITOVANO)
- Supabase client existuje s `accessToken` callback ktery predava Firebase JWT (`src/lib/supabase/client.js`)
- Backend endpoint `/api/auth/set-claims` existuje a funguje (`backend-local/src/routes/authClaims.js`)
- `FirebaseAuthProvider.jsx` uz vola `ensureSupabaseClaims()` pri kazdem loginu/registraci
- Feature flags: vsechny namespace v `localStorage` modu
- Production RLS policies existuji v `supabase/rls-policies-production.sql` (917 radku)
- Tenant middleware opraven — neakceptuje spoofovane headery u autentizovanych requestu

**Co jeste chybi (tento plan resi):**
- Commit outstanding zmen
- Supabase Third-Party Auth registrace v Dashboard (manualni krok)
- `tenantRegistration.js` — auto-registrace Firebase useru jako Supabase tenants
- Aktivace dual-write pro kriticke namespaces
- Testovani end-to-end flow

---

## 1) Scope

### IN SCOPE

| ID | Polozka | Priorita |
|----|---------|----------|
| A | **Commit outstanding zmen** — 14 modified + 17 untracked z security sprintu | P0 |
| B | **Tenant auto-registration** — `tenantRegistration.js` pro automaticky upsert do Supabase `tenants` tabulky | P0 |
| C | **Integrace tenant registrace do auth flow** — volani pri login/register | P0 |
| D | **Third-Party Auth setup instrukce** — dokumentace manualnich kroku v Supabase Dashboard | P1 |
| E | **Dual-write aktivace** — prepnuti feature flags na `dual-write` pro kriticke namespace | P1 |
| F | **Data migrace** — spusteni migrationRunner (dry-run -> migrace) pro existujici localStorage data | P1 |
| G | **Dokumentace** — aktualizace Supabase-Dokumentace.md, Security-Assessment | P2 |

### OUT OF SCOPE

- Plna migrace na Supabase-only (zustava dual-write)
- Supabase Auth nahrazujici Firebase Auth (separatni budouci sprint)
- Deploy production RLS policies do databaze (ceka na overeni auth bridge v realnem prostredi)
- Storage buckety — fyzicky upload souboru
- Nove admin stranky/features
- Zmeny v pricing engine logice

---

## 2) Rizika a Mitigace

| # | Riziko | Pravdepodobnost | Dopad | Mitigace |
|---|--------|-----------------|-------|----------|
| R1 | Firebase custom claims jeste nemaji `tenant_id` — RLS selze | Nizka | P0 | `ensureSupabaseClaims()` uz je v auth flow; po loginu se claims nastavi a token refreshne |
| R2 | Supabase Third-Party Auth neni zaregistrovany v Dashboard | Vysoka | P0 | Faze 3 obsahuje explicitni instrukce; bez registrace accessToken callback nefunguje |
| R3 | `tenantRegistration.js` selze kvuli RLS — anon INSERT zakazan | Stredni | P1 | Pouzivame anon policies (schema.sql) dokud production RLS neni deploynut; fallback na console.warn |
| R4 | Dual-write spomaleni UX | Nizka | P1 | writeTenantJson uz pouziva fire-and-forget async zapis |
| R5 | Build break po commitu | Nizka | P0 | `npm run build` je soucasti Faze 1 pred commitem |

---

## 3) Rollback Strategie

**3-urovnova ochrana (stejna jako v predchozim sprint planu):**

1. **Feature flag rollback:** `rollbackToLocalStorage()` — okamzite prepne vsechny namespace na localStorage
2. **Data backup:** Pred migraci backup pres AdminMigration UI
3. **Git revert:** `git revert HEAD` pokud commit rozbije build

---

## 4) Predpoklady (Assumptions)

- **A1:** Build prochazi (`npm run build` PASS) — overit v Fazi 1
- **A2:** Supabase projekt existuje a env vars jsou nastaveny v `.env.local`
- **A3:** 25 tabulek existuje v Supabase databazi (schema.sql deploynuto v predchozim sprintu)
- **A4:** Auth claims endpoint `/api/auth/set-claims` funguje (implementovan v security sprintu)
- **A5:** Uzivatel provede manualni registraci Firebase projektu v Supabase Dashboard (Third-Party Auth)

---

## Faze 1 — Commit Outstanding Zmen + Build Verify (Pracovni)

### 1.1 Cil
Commitnout vsech 31 souboru (14 modified + 17 untracked) z Supabase security sprintu a overit stabilitu buildu.

### 1.2 Detailni kroky

**Krok 1A — Build Verify**

Pred commitem spustit `npm run build` v `Model_Pricer-V2-main/`. Build MUSI projit bez chyb.

**Krok 1B — Stage a Commit**

```bash
cd Model_Pricer-V2-main
git add -A
git commit -m "feat: Supabase security sprint — RLS production policies, auth claims, tenant isolation fixes"
```

Commit message musi shrnout:
- RLS production policies (`supabase/rls-policies-production.sql`)
- Auth claims endpoint (`backend-local/src/routes/authClaims.js`)
- Tenant middleware hardening (`backend-local/src/middleware/tenant.js`)
- Widget tenant override fix
- Security assessment dokumentace
- Research dokumenty (3 soubory)

**Krok 1C — Docs-level commit**

Soubory v `docs/claude/` (mimo `Model_Pricer-V2-main/`) commitnout zvlast:

```bash
cd ..  # repo root
git add docs/
git commit -m "docs: Supabase migration sprint docs — security assessment, research, plans, brave log"
```

### 1.3 Rozlozeni agentu pro Fazi 1

| Agent | Uloha | Paralelni? |
|-------|-------|------------|
| `mp-spec-test-build` | Spusteni `npm run build`, overeni ze PASS | Ne (prvni krok) |
| `mp-spec-infra-firebase` | Git add + commit obou skupin souboru | Po build verify |

### 1.4 Acceptance Criteria

- [ ] `npm run build` — PASS (zadne chyby)
- [ ] Vsech 14 modified souboru commitnuto
- [ ] Vsech 17 untracked souboru commitnuto
- [ ] Git working tree je cisty (`git status` ukazuje "nothing to commit")
- [ ] Commit message v anglictine, strucny, popisny

---

## Faze 2 — Kontrolni kroky po Fazi 1

### Krok 1 — Ulozeni historie (pred testovanim)
Spustim agenta `mp-spec-docs-historie` pomoci Task toolu (model haiku, subagent_type general-purpose). Agent ulozi vsechny zmeny z Faze 1: commit outstanding zmen z security sprintu, build verify vysledky, commit messages. POCKAM az agent kompletne dokonci ukladani — zadna dalsi akce pred jeho dokoncenim.

### Krok 2 — Testovani na webu
Po dokonceni ulozeni historie otestuju vsechny zmeny z Faze 1 v prohlizeci pomoci mcp__claude-in-chrome nastroju. Konkretne otestuju:
- **Homepage** (`/`) — nacte se bez chyb? Header/Footer funguje?
- **Admin** (`/admin`) — login funguje? Dashboard se zobrazi?
- **Test kalkulacka** (`/test-kalkulacka`) — 5-step wizard funguje?
- **DevTools Console** — zadne cervene chyby?
- **`git log --oneline -3`** — commity jsou spravne?
Ulozim snimky obrazovky a zapisu poznatky do .md souboru ve slozce docs/claude/Research/supabase-migration/.

### Krok 3 — Ulozeni historie (po testovani)
Znovu spustim agenta `mp-spec-docs-historie` pomoci Task toolu. Tentokrat agent ulozi POUZE vysledky testovani z Kroku 2 — snimky, poznatky, nalezene bugy. POCKAM az agent kompletne dokonci — zadna dalsi akce pred jeho dokoncenim.

### Krok 4 — Compact kontextu
Proved `/compact` pro uvolneni kontextoveho okna. Toto je posledni krok teto faze. Az po compactu pokracuju na Fazi 3.

---

## Faze 3 — Auth Bridge + Tenant Auto-Registration (Pracovni)

### 3.1 Cil
Implementovat auto-registraci Firebase useru jako Supabase tenantu a zdokumentovat manualni kroky pro Third-Party Auth setup.

### 3.2 Detailni kroky

**Krok 3A — Vytvoreni `tenantRegistration.js`**

Novy soubor: `Model_Pricer-V2-main/src/lib/supabase/tenantRegistration.js`

Funkce `ensureTenantInSupabase(user)`:
1. Zkontroluje zda Supabase je dostupny (`isSupabaseAvailable()`)
2. Zkontroluje zda tenant uz existuje (`SELECT FROM tenants WHERE slug = user.uid`)
3. Pokud ne, vytvori ho (`INSERT INTO tenants` s slug, name, plan_name, metadata)
4. Chyba = jen `console.warn`, NEBLOKUJE auth flow
5. Vraci tenant objekt `{ id, slug }` nebo `null`

Implementace (viz `Supabase-Migration-Tenant-Isolation-Sprint.md` Faze 7 — tam je presny kod):

```javascript
// src/lib/supabase/tenantRegistration.js
import { supabase, isSupabaseAvailable } from './client';

export async function ensureTenantInSupabase(user) {
  if (!isSupabaseAvailable() || !supabase || !user?.uid) return null;

  const slug = user.uid;

  try {
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

    console.log('[tenantRegistration] Created tenant:', created.slug);
    return created;
  } catch (err) {
    console.warn('[tenantRegistration] Error:', err.message);
    return null;
  }
}
```

**Krok 3B — Integrace do FirebaseAuthProvider.jsx**

V `Model_Pricer-V2-main/src/providers/FirebaseAuthProvider.jsx`:

1. Pridat import: `import { ensureTenantInSupabase } from '../lib/supabase/tenantRegistration';`
2. V `onAuthStateChanged` callbacku (radek ~130): po `setTenantId(tenantId)` pridat fire-and-forget volani `ensureTenantInSupabase(user)`
3. V `ensureGoogleUserProfile()` (radek ~68): po `setTenantId()` pridat `ensureTenantInSupabase(user)`
4. V `register()` (radek ~232): po `setTenantId(user.uid)` pridat `ensureTenantInSupabase(user)`

Volani je fire-and-forget — `ensureTenantInSupabase(user)` bez `await`. Chyba neblokuje auth flow.

**Krok 3C — Third-Party Auth Setup dokumentace**

Vytvorit/aktualizovat sekci v `docs/claude/Documentation/Supabase-Dokumentace.md`:

```
## Third-Party Auth Setup (Manualni kroky)

1. Otevri Supabase Dashboard: https://supabase.com/dashboard
2. Naviguj: Authentication > Third-party auth > Add integration > Firebase
3. Zadej Firebase Project ID (z Firebase Console > Settings > General)
4. Uloz
5. Over ze integrace je aktivni (zeleny status)

Po registraci:
- Supabase API automaticky trustuje Firebase JWT tokeny
- accessToken callback v client.js predava Firebase JWT
- RLS policies mohou cist auth.jwt()->>'tenant_id'
```

**Krok 3D — Build verify**

`npm run build` — MUSI projit.

### 3.3 Rozlozeni agentu pro Fazi 3

| Agent | Uloha | Paralelni? |
|-------|-------|------------|
| `mp-mid-storage-db` | Vytvoreni `tenantRegistration.js` | Ano (s auth integraci) |
| `mp-spec-infra-firebase` | Integrace `ensureTenantInSupabase` do FirebaseAuthProvider.jsx | Ano (s helper tvorbu) |
| `mp-spec-docs-dev` | Third-Party Auth setup dokumentace v Supabase-Dokumentace.md | Po implementaci |
| `mp-spec-test-build` | `npm run build` verify | Po vsech zmenach |

### 3.4 Acceptance Criteria

- [ ] `src/lib/supabase/tenantRegistration.js` existuje a exportuje `ensureTenantInSupabase()`
- [ ] `FirebaseAuthProvider.jsx` importuje a vola `ensureTenantInSupabase()` na 3 mistech (onAuthStateChanged, ensureGoogleUserProfile, register)
- [ ] Volani je fire-and-forget — chyba neblokuje auth flow (jen console.warn)
- [ ] `npm run build` — PASS
- [ ] Dokumentace Third-Party Auth setup v `Supabase-Dokumentace.md`
- [ ] Existujici `ensureSupabaseClaims()` zustava nezmenena (uz je v auth flow)

---

## Faze 4 — Kontrolni kroky po Fazi 3

### Krok 1 — Ulozeni historie (pred testovanim)
Spustim agenta `mp-spec-docs-historie` pomoci Task toolu (model haiku, subagent_type general-purpose). Agent ulozi vsechny zmeny z Faze 3: vytvoreni tenantRegistration.js, integrace do FirebaseAuthProvider.jsx, dokumentace Third-Party Auth. POCKAM az agent kompletne dokonci ukladani — zadna dalsi akce pred jeho dokoncenim.

### Krok 2 — Testovani na webu
Po dokonceni ulozeni historie otestuju vsechny zmeny z Faze 3 v prohlizeci pomoci mcp__claude-in-chrome nastroju. Konkretne otestuju:
- **Login flow** (email) — prihlasit se, over v DevTools Console ze se zobrazil `[tenantRegistration] Created tenant:` nebo `[Auth] Supabase RLS claims set`
- **Login flow** (Google) — prihlasit se pres Google, over stejne logy
- **Logout + Login** — druhy login NESMI duplikovat tenant (idempotence — `maybeSingle()` check)
- **DevTools Console** — zadne cervene chyby z `tenantRegistration` nebo `ensureSupabaseClaims`
- **AdminMigration** (`/admin/migration`) — Supabase connection status (zeleny pokud env vars jsou nastaveny)
- **Register flow** — registrace noveho uzivatele (pokud mozne) — tenant se vytvori
Ulozim snimky obrazovky a zapisu poznatky do .md souboru ve slozce docs/claude/Research/supabase-migration/.

### Krok 3 — Ulozeni historie (po testovani)
Znovu spustim agenta `mp-spec-docs-historie` pomoci Task toolu. Tentokrat agent ulozi POUZE vysledky testovani z Kroku 2 — snimky, poznatky, nalezene bugy, auth flow vysledky. POCKAM az agent kompletne dokonci — zadna dalsi akce pred jeho dokoncenim.

### Krok 4 — Compact kontextu
Proved `/compact` pro uvolneni kontextoveho okna. Toto je posledni krok teto faze. Az po compactu pokracuju na Fazi 5.

---

## Faze 5 — Dual-Write Aktivace + Data Migrace (Pracovni)

### 5.1 Cil
Aktivovat dual-write mod pro kriticke namespaces a migrovat existujici localStorage data do Supabase.

### 5.2 Predpoklady pro tuto fazi

- Supabase pripojeni funguje (zeleny status na `/admin/migration`)
- Auth bridge funguje (claims set, tenant existuje v Supabase)
- Pokud auth bridge NENI pripraven (napr. Third-Party Auth neni registrovan v Dashboard), tato faze se PRESKOCI a plan konci po Fazi 4 s dokumentaci co chybi

### 5.3 Detailni kroky

**Krok 5A — Backup localStorage dat**

1. Naviguj na `/admin/migration`
2. Klikni "Download Backup"
3. Uloz JSON soubor bezpecne (mimo repo)

**Krok 5B — Dry-Run migrace**

1. Na `/admin/migration` klikni "Dry Run"
2. `runMigrations({ dryRun: true })` projde vsech 19 migraci BEZ zapisu
3. Kontrola vysledku:
   - `dry-run` = data nalezena, pripravena k migraci (OK)
   - `skipped` = namespace nema localStorage data (OK)
   - `error` = problem — NEPOKRACUJ, investiguj

**Krok 5C — Realna migrace**

1. Spustit `runMigrations({ dryRun: false })` pres AdminMigration UI
2. Sledovat progress bar
3. Overit vysledky: vsechny kriticke namespace maji status `migrated`

**Krok 5D — Aktivace dual-write pro kriticke namespaces**

Postupna aktivace (od nejmensiho rizika):

```javascript
// V DevTools konzoli:
import('@/lib/supabase/featureFlags').then(m => {
  // 1. Mene kriticka data (nejdriv)
  m.setStorageMode('branding', 'dual-write');
  m.setStorageMode('widget_theme', 'dual-write');
  m.setStorageMode('dashboard:v2', 'dual-write');

  // 2. Konfigurace
  m.setStorageMode('pricing:v3', 'dual-write');
  m.setStorageMode('fees:v3', 'dual-write');

  // 3. Transakcni data
  m.setStorageMode('orders:v1', 'dual-write');
  m.setStorageMode('orders:activity:v1', 'dual-write');

  console.table(m.getAllStorageModes());
});
```

NEPOUZIVAT `enableDualWriteForAll()` hned — nejdriv otestovat na podmnozine.

**Krok 5E — Overeni dual-write**

1. V Admin Pricing (`/admin/pricing`) zmenit rate_per_hour
2. Over localStorage: `JSON.parse(localStorage.getItem('modelpricer:<tid>:pricing:v3'))`
3. Over Supabase Dashboard: Table Editor > `pricing_configs` > data sloupec
4. Oba zdroje MUSI obsahovat stejna data

**Krok 5F — Build verify**

`npm run build` — MUSI projit. (Zadne kodove zmeny v teto fazi, ale build overeni je dobra praxe.)

**Krok 5G — Commit**

```bash
git add -A
git commit -m "feat: tenant auto-registration + auth bridge integration for Supabase RLS"
```

### 5.4 Rozlozeni agentu pro Fazi 5

| Agent | Uloha | Paralelni? |
|-------|-------|------------|
| `mp-spec-storage-migration` | Backup, dry-run, realna migrace pres AdminMigration UI | Ne (sekvencni) |
| `mp-mid-storage-tenant` | Aktivace dual-write pro 7 kritickych namespaces, overeni dat | Po migraci |
| `mp-spec-test-build` | `npm run build` verify | Po aktivaci |

### 5.5 Acceptance Criteria

- [ ] Backup stazeny a ulozen bezpecne
- [ ] Dry-run prochazi bez erroru
- [ ] Realna migrace: kriticke namespace (`pricing:v3`, `fees:v3`, `orders:v1`) maji status `migrated`
- [ ] Dual-write aktivovan pro minimalne 7 kritickych namespaces
- [ ] Zmena v Admin Pricing se propise do localStorage I do Supabase
- [ ] Zadny data loss (localStorage data zachovana)
- [ ] `npm run build` — PASS
- [ ] Zmeny commitnuty

---

## Faze 6 — Kontrolni kroky po Fazi 5

### Krok 1 — Ulozeni historie (pred testovanim)
Spustim agenta `mp-spec-docs-historie` pomoci Task toolu (model haiku, subagent_type general-purpose). Agent ulozi vsechny zmeny z Faze 5: backup, migracni vysledky, dual-write aktivace, namespace modes, commit info. POCKAM az agent kompletne dokonci ukladani — zadna dalsi akce pred jeho dokoncenim.

### Krok 2 — Testovani na webu
Po dokonceni ulozeni historie otestuju vsechny zmeny z Faze 5 v prohlizeci pomoci mcp__claude-in-chrome nastroju. Konkretne otestuju:
- **Admin Pricing** (`/admin/pricing`) — zmena ceny materialu, uloz, over v Supabase dashboardu
- **Admin Fees** (`/admin/fees`) — pridani fee, uloz, over v Supabase
- **Admin Branding** (`/admin/branding`) — zmena barvy, over dual-write
- **Test Kalkulacka** (`/test-kalkulacka`) — cte spravna data? Pricing funguje?
- **Widget** (`/w/<id>`) — nacte data spravneho tenanta? (pokud je dostupny publicWidgetId)
- **AdminMigration** (`/admin/migration`) — ukazuje spravne storage modes? Migracni vysledky? Connection status?
- **DevTools > Network** — filtr na `supabase.co` — vidi se POST/PATCH requesty pri ukladani?
Ulozim snimky obrazovky a zapisu poznatky do .md souboru ve slozce docs/claude/Research/supabase-migration/.

### Krok 3 — Ulozeni historie (po testovani)
Znovu spustim agenta `mp-spec-docs-historie` pomoci Task toolu. Tentokrat agent ulozi POUZE vysledky testovani z Kroku 2 — snimky, poznatky, nalezene bugy, dual-write vykon. POCKAM az agent kompletne dokonci — zadna dalsi akce pred jeho dokoncenim.

### Krok 4 — Compact kontextu
Proved `/compact` pro uvolneni kontextoveho okna. Toto je posledni krok teto faze. Az po compactu pokracuju na Fazi 7.

---

## Faze 7 — Dokumentace + Finalizace (Pracovni)

### 7.1 Cil
Aktualizovat dokumentaci, zapsat do historie, uzavrit plan.

### 7.2 Detailni kroky

**Krok 7A — Dokumentace Update**

Aktualizovat nasledujici dokumentacni soubory:

| Soubor | Co pridat |
|--------|-----------|
| `docs/claude/Documentation/Supabase-Dokumentace.md` | tenantRegistration.js, auth bridge flow, dual-write status, Third-Party Auth instrukce |
| `docs/claude/Documentation/Storage-Utilities-Dokumentace.md` | Supabase dual-write mody, feature flags, rollback postup |
| `docs/claude/Documentation/Security-Assessment-2026-02-26.md` | Stav P0-3 (Auth bridge): aktualizovat na "IMPLEMENTED" |
| `docs/claude/Documentation/00-MASTER-Dokumentace.md` | Overit ze Supabase dokumentace je odkazovana |

**Krok 7B — MEMORY.md Update**

Pridat do MEMORY.md:
- `tenantRegistration.js` pattern (fire-and-forget, idempotentni upsert)
- Auth bridge stav: `ensureSupabaseClaims()` + `accessToken` callback + `/api/auth/set-claims`
- Dual-write aktivace postup a rollback
- Past: Third-Party Auth musi byt registrovany v Supabase Dashboard pred tim nez accessToken callback funguje

**Krok 7C — Plan Closure**

Zmenit status tohoto planu na COMPLETED (nebo PARTIAL pokud Faze 5 byla preskocena).

**Krok 7D — Build + Commit**

```bash
npm run build
git add -A
git commit -m "docs: CP3 implementation — auth bridge, tenant registration, dual-write activation docs"
```

### 7.3 Rozlozeni agentu pro Fazi 7

| Agent | Uloha | Paralelni? |
|-------|-------|------------|
| `mp-spec-docs-dev` | Aktualizace 4 dokumentacnich souboru | Ano (s MEMORY update) |
| `mp-spec-docs-historie` | Finalni historie zapis — cely sprint souhrn | Po dokumentaci |

### 7.4 Acceptance Criteria

- [ ] 4 dokumentacni soubory aktualizovany
- [ ] MEMORY.md aktualizovany
- [ ] Historie ulozena
- [ ] Plan status aktualizovan
- [ ] `npm run build` — PASS
- [ ] Finalni commit

---

## Faze 8 — Kontrolni kroky po Fazi 7 (FINALNI)

### Krok 1 — Ulozeni historie (pred testovanim)
Spustim agenta `mp-spec-docs-historie` pomoci Task toolu (model haiku, subagent_type general-purpose). Agent ulozi finalni stav: dokumentacni zmeny, MEMORY.md update, plan closure, commit info. POCKAM az agent kompletne dokonci ukladani — zadna dalsi akce pred jeho dokoncenim.

### Krok 2 — Testovani na webu
Po dokonceni ulozeni historie proved finalni sanity check:
- **`npm run build`** — PASS
- **Rychly smoke** — homepage (`/`), admin (`/admin`), test-kalkulacka (`/test-kalkulacka`)
- **Dokumentace** — soubory existuji a maji spravny obsah
- **`git log --oneline -5`** — commity jsou spravne a popisne
- **`git status`** — working tree je cisty
Ulozim snimky obrazovky a zapisu poznatky do .md souboru ve slozce docs/claude/Research/supabase-migration/.

### Krok 3 — Ulozeni historie (po testovani)
Znovu spustim agenta `mp-spec-docs-historie` pomoci Task toolu. Tentokrat agent ulozi POUZE finalni test vysledky — posledni zaznam tohoto sprintu. POCKAM az agent kompletne dokonci — zadna dalsi akce pred jeho dokoncenim.

### Krok 4 — Compact kontextu
Proved `/compact` pro uvolneni kontextoveho okna. Sprint CP3 je kompletni.

---

## 5) Paralelizacni Mapa

```
Faze 1: [Build Verify] -> [Git Add + Commit]  -- sekvencni
Faze 2: KONTROLNI (sekvencni)
Faze 3: [tenantRegistration.js || AuthProvider integrace] -> [Docs] -> [Build]  -- mix
Faze 4: KONTROLNI (sekvencni)
Faze 5: [Backup] -> [Dry-Run] -> [Migrace] -> [Dual-Write] -> [Overeni] -> [Build + Commit]  -- sekvencni
Faze 6: KONTROLNI (sekvencni)
Faze 7: [Dokumentace || MEMORY update] -> [Build + Commit]  -- 2 paralelni, pak sekvencni
Faze 8: KONTROLNI (sekvencni)
```

---

## 6) Klicove Soubory — Kompletni Seznam

### Nove soubory (TVORBA)

| Soubor | Ucel | Faze |
|--------|------|------|
| `Model_Pricer-V2-main/src/lib/supabase/tenantRegistration.js` | Auto-registrace Firebase useru jako Supabase tenants | 3 |

### Existujici soubory (UPRAVA)

| Soubor | Zmena | Faze |
|--------|-------|------|
| `Model_Pricer-V2-main/src/providers/FirebaseAuthProvider.jsx` | Import + volani `ensureTenantInSupabase` na 3 mistech | 3 |
| `docs/claude/Documentation/Supabase-Dokumentace.md` | Auth bridge, tenant registration, Third-Party Auth instrukce | 7 |
| `docs/claude/Documentation/Storage-Utilities-Dokumentace.md` | Dual-write mody, feature flags, rollback | 7 |
| `docs/claude/Documentation/Security-Assessment-2026-02-26.md` | P0-3 status update | 7 |
| `docs/claude/Documentation/00-MASTER-Dokumentace.md` | Overeni odkazu | 7 |

### Existujici soubory (BEZE ZMENY — jen pouziti/overeni)

| Soubor | Ucel |
|--------|------|
| `Model_Pricer-V2-main/src/lib/supabase/client.js` | Supabase singleton s accessToken callback — uz implementovan |
| `Model_Pricer-V2-main/src/lib/supabase/featureFlags.js` | Per-namespace mod switching — uz implementovan |
| `Model_Pricer-V2-main/src/lib/supabase/storageAdapter.js` | Abstrakce localStorage/Supabase — uz implementovan |
| `Model_Pricer-V2-main/src/lib/supabase/migrationRunner.js` | 19 migraci — uz implementovan |
| `Model_Pricer-V2-main/backend-local/src/routes/authClaims.js` | Auth claims endpoint — uz implementovan |
| `Model_Pricer-V2-main/backend-local/src/middleware/tenant.js` | Tenant middleware — uz opraven |
| `Model_Pricer-V2-main/supabase/rls-policies-production.sql` | Production RLS — ceka na deploy po overeni auth |

---

## 7) Agent Assignment Summary

| Agent | Faze | Ulohy |
|-------|------|-------|
| `mp-spec-test-build` | 1, 3, 5 | Build verify (`npm run build`) |
| `mp-spec-infra-firebase` | 1, 3 | Git commit, AuthProvider integrace |
| `mp-mid-storage-db` | 3 | Vytvoreni tenantRegistration.js |
| `mp-spec-docs-dev` | 3, 7 | Third-Party Auth docs, dokumentacni aktualizace |
| `mp-spec-storage-migration` | 5 | Backup, dry-run, realna migrace |
| `mp-mid-storage-tenant` | 5 | Dual-write aktivace, data overeni |
| `mp-spec-docs-historie` | 2, 4, 6, 8 | Historie ukladani (vsechny kontrolni faze) |

**Celkem 7 unikatnich agentu.**

---

## 8) Kontrolni Seznam pro Plan (dle Hlavni_Pozadavky.md)

- [x] Kazda pracovni faze ma za sebou kontrolni fazi (4 kroky)
- [x] V kazde pracovni fazi je tabulka rozlozeni agentu
- [x] Vsichni potrebni agenti existuji (overeno — vsech 7 je v AGENT_MAP.md)
- [x] Plan je dostatecne detailni — kazdy krok je jasny
- [x] Scope jasne definovan (IN/OUT)
- [x] Rizika identifikovana s mitigacemi
- [x] Rollback strategie definovana
- [x] Acceptance criteria pro kazdou fazi
- [x] Edge cases pokryty (Supabase nedostupnost, tenant neexistuje, Third-Party Auth neregistrovan)
- [x] Kontrolni faze maji plny format (viz 4kroky.md)
- [ ] Otazky zodpovezeny pred finalizaci — VYNECHANO dle pozadavku (uzivatel nedostupny)

---

## 9) Predpokladany Casovy Odhad

| Faze | Odhad | Poznamka |
|------|-------|----------|
| Faze 1 (Commit + build) | 10 min | Jednoduche, automatizovatelne |
| Faze 2 (Kontrola) | 10 min | |
| Faze 3 (Auth bridge + tenant reg) | 20 min | 1 novy soubor + 1 modifikace + docs |
| Faze 4 (Kontrola) | 15 min | Rozsahlejsi testovani auth flow |
| Faze 5 (Dual-write) | 25 min | Backup + migrace + aktivace + overeni |
| Faze 6 (Kontrola) | 15 min | Rozsahle testovani dual-write |
| Faze 7 (Dokumentace) | 15 min | 4 soubory + MEMORY |
| Faze 8 (Kontrola) | 10 min | Finalni sanity |
| **CELKEM** | **~2 hodiny** | Vcetne testovani a kontrolnich fazi |

---

## 10) Architekturalni Kontext — Auth Bridge Flow

Pro uplnost, toto je kompletni auth bridge flow po implementaci tohoto planu:

```
[Uzivatel]
   |
   v
[Firebase Auth Login]  (email/password nebo Google)
   |
   v
[FirebaseAuthProvider.jsx]
   |
   |-- setTenantId(tenantId)                    [localStorage — sync]
   |-- ensureSupabaseClaims(user, tenantId)     [POST /api/auth/set-claims — async, non-blocking]
   |     |
   |     v
   |   [Backend: authClaims.js]
   |     |-- Firebase Admin SDK: setCustomUserClaims(uid, { role: 'authenticated', tenant_id })
   |     |-- Response: { ok: true, tenantId }
   |     |
   |   [Frontend: user.getIdToken(true)]         [Force token refresh s novymi claims]
   |
   |-- ensureTenantInSupabase(user)              [INSERT INTO tenants — async, non-blocking]  << NOVY
   |
   v
[Supabase Client (client.js)]
   |-- accessToken: getFirebaseToken()            [Firebase ID token s role+tenant_id claims]
   |
   v
[Supabase API]
   |-- auth.jwt()->>'tenant_id'                   [RLS policies ctou z Firebase JWT]
   |-- auth.jwt()->>'role' = 'authenticated'      [Supabase trustuje Firebase JWT pres Third-Party Auth]
   |
   v
[Supabase DB]
   |-- RLS: tenant_id = auth.jwt()->>'tenant_id'  [Tenant izolace na DB urovni]
```

### Co uz existuje vs co se pridava

| Komponenta | Stav | Kdo |
|-----------|------|-----|
| `accessToken` callback v client.js | EXISTUJE | Predchozi sprint |
| `ensureSupabaseClaims()` v FirebaseAuthProvider | EXISTUJE | Security sprint |
| `/api/auth/set-claims` endpoint | EXISTUJE | Security sprint |
| Tenant middleware (JWT-based) | EXISTUJE | Security sprint |
| `rls-policies-production.sql` | EXISTUJE (nedeplynuto) | Security sprint |
| `tenantRegistration.js` | **NOVE — tento plan** | Faze 3 |
| Third-Party Auth registrace | **MANUALNI KROK** | Faze 3 (instrukce) |
| Dual-write aktivace | **NOVE — tento plan** | Faze 5 |

---

## 11) Co nasleduje po tomto planu

Po dokonceni CP3 jsou dalsi kroky (separatni plany):

1. **Deploy Production RLS** — spustit `rls-policies-production.sql` v Supabase SQL Editor (vyzaduje overeni ze auth bridge funguje v realnem prostredi)
2. **Realtime overeni** — test `useSupabaseRealtime` hooku na orders/pricing tabulkach
3. **Dual-write pro zbyvajici namespaces** — `enableDualWriteForAll()` po uspesnem overeni kritickych 7
4. **Cross-tab konzistence** — zmena v jednom tabu se projevi v druhem pres Supabase
5. **Error resilience test** — docasne odpojeni Supabase, app musi prezit
6. **(Budouci)** Migrace na Supabase Auth — nahrazeni Firebase Auth

---

**END OF PLAN**
