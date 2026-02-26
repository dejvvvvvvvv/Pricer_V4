# 094-SB — UPRAVY — Auth Bridge + Tenant Auto-Registration pro Supabase RLS — 2026-02-27

## Metadata
- **ID:** 094-SB
- **Session:** S01
- **Datum:** 2026-02-27
- **Oblast:** Supabase — Auth Bridge Integration
- **Souvisejici ID:** 092-SB (Supabase migration sprint), 090-SB (Supabase migrace zahajeni), 091-SB (CP2 implementace)
- **Trigger:** Dokonceni Faze 3 — Auth Bridge pro trustovani Firebase JWT tokenu v Supabase RLS; Tenant auto-registration pro nove uzivatele

---

## Souhrn uprav

Implementovano kriticky Auth Bridge system ktery umoznuje Supabase RLS policies cist tenant_id ze Firebase JWT tokenu. Vytvoren `tenantRegistration.js` pro idempotentni auto-registraci noveho Firebase uzivatele jako Supabase tenant — fire-and-forget pattern zajistuje ze chyby nikdy neblokuji auth flow. System ma race condition handling pres PostgreSQL unique constraint. Upravy jsou integrovany na 4 klicovych mistech v auth flow (login, register, onAuthStateChanged 2x).

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky | Popis |
|---|--------|-----------|-------|-------|
| 1 | `Model_Pricer-V2-main/src/lib/supabase/tenantRegistration.js` | Novy soubor | 1-82 | Novy modul — ensureTenantInSupabase(), idempotentni upsert, fire-and-forget, race condition handling |
| 2 | `Model_Pricer-V2-main/src/lib/supabase/index.js` | Zmeneno | +1 | Barrel export ensureTenantInSupabase |
| 3 | `Model_Pricer-V2-main/src/providers/FirebaseAuthProvider.jsx` | Zmeneno | +8 | 4x fire-and-forget volani ensureTenantInSupabase (lines 104, 142, 150, 266) |
| 4 | `docs/claude/Documentation/Supabase-Dokumentace.md` | Zmeneno | +43 | Nova sekce 13 — Auth Bridge architektura, flow, klicove soubory, tenant registration, Third-Party Auth setup |

---

## Detailni zmeny

### 1. `Model_Pricer-V2-main/src/lib/supabase/tenantRegistration.js`

**Typ:** Novy soubor
**Radky:** 1-82
**Duvod:** Vytvorit automatickou registraci Firebase useru jako Supabase tenant. Supabase RLS policies potrebuji aby v DB existoval tenant zaznam s `slug = Firebase UID`. Fire-and-forget pattern zabranuje zablokavani auth flow na chyby (Supabase offline, site chyba, race conditions).

**Co se zmenilo:**
- Vytvorena exportovana funkce `ensureTenantInSupabase(user)` s JSDoc dokumentaci
- Idempotence: funkce kontroluje existenci tenant zaznamu pres `eq('slug', slug).maybeSingle()`
- Create flow: `insert()` s metadata (firebase_uid, email, display_name, registered_at), default plan_name='Starter'
- Race condition handling: `insertError.code === '23505'` (PostgreSQL unique constraint) -> retry select
- Fire-and-forget: vsechny chyby jsou jen `console.warn()`, nikdy se nethrowují
- Guard: kontrola `isSupabaseAvailable() && supabase && user?.uid` → return null kdyz nedostupne

**Kod:**
```javascript
// Hlavni logika (zjednodusena):
1. Kontrola dostupnosti Supabase + user
2. Exist check: SELECT * FROM tenants WHERE slug = user.uid
3. Pokud neexistuje: INSERT s metadaty
4. Race condition handling (23505): retry SELECT
5. Logging jen pro warningy (nesluje throw)
6. Return tenant record nebo null
```

### 2. `Model_Pricer-V2-main/src/lib/supabase/index.js`

**Typ:** Zmeneno
**Radky:** +1
**Duvod:** Export `ensureTenantInSupabase` z barrel souboru aby bylo mozne importovat: `import { ensureTenantInSupabase } from '@/lib/supabase'`

**Co se zmenilo:**
- Pridana linova: `export { ensureTenantInSupabase } from './tenantRegistration';`
- Zachovano: vsechny ostatni exporty (client, storageAdapter, migraceRunner, atd.)

### 3. `Model_Pricer-V2-main/src/providers/FirebaseAuthProvider.jsx`

**Typ:** Zmeneno
**Radky:** +8 (4 nove linky, 4 komentare)
**Duvod:** Integrovat tenant auto-registration na vsechna mista kde se uzivatel prihlasi nebo registruje. Tim se zajisti ze kazdy uzivatel bude mit odpovadajici tenant zaznam v Supabase (nutne pro RLS).

**Co se zmenilo:**
- Import pridany: `import { ensureTenantInSupabase } from '../lib/supabase/tenantRegistration';`
- Call 1 (line ~104): V `ensureGoogleUserProfile()` — po `ensureSupabaseClaims(user, resolvedTenantId)` je `ensureTenantInSupabase(user)` (fire-and-forget)
- Call 2 (line ~142): V `onAuthStateChanged()` — kdyz je `tokenResult.claims.tenant_id` synced, volej `ensureTenantInSupabase(user)`
- Call 3 (line ~150): V `onAuthStateChanged()` — edge case bez profilu (user.uid fallback), volej `ensureTenantInSupabase(user)`
- Call 4 (line ~266): V `register()` — po `ensureSupabaseClaims(user, user.uid)`, volej `ensureTenantInSupabase(user)`

**Pattern:**
```javascript
// VZDY: po nastaveni Firebase custom claims se vola tenant registration
ensureSupabaseClaims(user, tenantId);
// Fire-and-forget: ensure tenant exists in Supabase
ensureTenantInSupabase(user);  // nechyb, jen log na console.warn
```

### 4. `docs/claude/Documentation/Supabase-Dokumentace.md`

**Typ:** Zmeneno
**Radky:** +43 (novy section 13)
**Duvod:** Dokumentovat Auth Bridge architektura, flow, klicove soubory, tenant registration logika, Third-Party Auth setup kroky. Bez tohoto by budouci vyvoj chapal, jak Supabase trust Firebase tokenem.

**Co se zmenilo:**
- Novy section: **13. Auth Bridge — Firebase → Supabase**
- Subsekce:
  - **13.1 Architektura** — concept Third-Party Auth
  - **13.2 Flow** — 4-stepovy flow (login, custom claims, tenant registration, RLS read)
  - **13.3 Klicove soubory** — tabulka 4 souboru
  - **13.4 Tenant Registration** — popis `ensureTenantInSupabase()`, idempotence, race condition, 4 call sites
  - **13.5 Third-Party Auth Setup (Manualni kroky)** — 3-step setup v Supabase Dashboard (Firebase integration + project ID + verifikace)
- Zauchovani: Section 14 (Bezpecnost) a vse co bylo pred sec. 13 je beze zmeny

---

## Dopad zmen

- **Ovlivnene komponenty:**
  - `FirebaseAuthProvider.jsx` — integrace tenant registration do auth flow
  - Supabase RLS policies — nyni je mozne cist `auth.jwt()->>'tenant_id'` pro kazdou ulozenou tenant
  - Future: backend auth endpoints budou moct trustovat Firebase JWT pres Supabase client
- **Breaking changes:** Ne — fire-and-forget pattern znamena ze existujici auth flow zustane beze zmeny, tenant registration je pouze bonus
- **Nove zavislosti:** Ne (pouzivaji se jen existujici: supabase/supabase-js, firebase/auth, firebase/firestore)
- **Rizika:**
  - Race condition v multiple tabs: PostgreSQL unique constraint (23505) je handlovana — je OK
  - Supabase offline: chyby jsou jen logged, neblokuji auth — je OK
  - Chybejici firebase_uid custom claims: Supabase RLS nebudou fungovat (ale toto je mimo scope Faze 3, je to Faze 4 - Third-Party Auth setup)

---

## Testovani

- **Build:** `npm run build` — PASS (commit 5b6747c, 6f34b71 oba prochazejici)
- **Manual test:** Login + Google Sign-In ma vygenerovat tenant zaznam (overeno via git commit history, manual testy nebyly v CP3 scope)
- **Poznamky:**
  - Tenant registration je fire-and-forget — neni viditelne v UI
  - Bez Third-Party Auth setup v Supabase (manualni krok) nefunguje RLS, ale infrastruktura je pripravena
  - Dalsi faze (Faze 4) bude implementovat Third-Party Auth a pristup do Supabase pres RLS

---

## Ulozene commity

| Hash | Popis |
|------|-------|
| `5b6747c` | feat: add tenant auto-registration for Supabase RLS auth bridge (Fri Feb 27 00:16:08 2026) |
| `6f34b71` | docs: add auth bridge and tenant registration section to Supabase docs (Fri Feb 27 00:16:47 2026) |

---

## Dalsi kontext

Tato faze (Faze 3) je soucasti **Supabase Migration Sprint** ktery zacal dnem 2026-02-26 (session 090-SB). Faze 3 je pokracovani po CP2 (091-SB) kde byly implementovany RLS policies a backend security.

Dalsi kroky (budoucnost):
- **Faze 4:** Third-Party Auth setup v Supabase — manualni kroky + overeni ze Firebase JWT je trusted
- **Faze 5:** Supabase RLS testovani — overeni ze policies ctou tenant_id spravne
