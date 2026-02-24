# 057-AU — UPRAVY — Auth — 2026-02-23

## Metadata
- **ID:** 057-AU
- **Session:** S02
- **Datum:** 2026-02-23
- **Oblast:** Auth
- **Souvisejici ID:** 043-AU through 056-AU
- **Trigger:** Testovani Sprint 1 Auth + diagnoza 3 kritickych problemu z testing session

---

## Souhrn uprav

Byla provedena pouze 1 oprava (Firebase API key), ostatni 3 nalezene problemy jsou zaznamenany jako "diagnosed but not yet fixed" — jsou mimo scope Sprint 1 a budou reseny v dalsich sprintech nebo faze. Build status: PASS (bez zmeny, klic v .env.local).

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | `Model_Pricer-V2-main/.env.local` | Zmeneno | 1 | Firebase Web API key oprava — typo (`cr` -> `c7`, uppercase `L` -> `l`) |

---

## Detailni zmeny

### 1. `Model_Pricer-V2-main/.env.local`

**Typ:** Zmeneno
**Radky:** 1
**Duvod:** Firebase API key byla spatne — registrace pres email nechodila. Po oprave pracuje.

**Co se zmenilo:**
- Spatne: `AIzaSyCbvGXsN_C9tZtmcrJw5whNLw-Fr1H9m0g` (typo v `cr` a `L`)
- Spravne: `AIzaSyCbvGXsN_C9tZtmc7Jw5whNlw-Fr1H9m0g`
- Registrace pres email se nyn spusta bez chyby

---

## Dopad zmen

- **Ovlivnene komponenty:** Firebase SDK initialization (frontend auth flow)
- **Breaking changes:** Ne — jde pouze o opravu configu
- **Nove zavislosti:** Ne
- **Rizika:** Zadna — jde o nefunkcni klíč -> funkcní klíč

---

## Pozadovane opravy (3 problemy v diagnostice)

Nize jsou souborove odkazy na 3 problemy, ktere byly nalezeny a diagnostikovany v testing session (056-AU_KONVERZACE.md), ale NEJSOU v teto session fixnute. Jsou mimo scope Sprint 1.

### Problem 1: Google Sign-In popup closes silently

**Soubory:** `src/providers/FirebaseAuthProvider.jsx` (lines 81-101), `src/components/ui/GoogleSignInButton.jsx` (lines 18-27), `src/pages/login/components/LoginForm.jsx` (lines 93-100)

**Root cause:** `loginWithGoogle()` nemá try/catch okolo Firestore `setDoc()`. Kdyz Firestore write failuje, error propaguje do `onError()` handleru, ale `handleGoogleError()` tichu vracejicií pro kod `popup-closed-by-user` bez zobrazeni error message.

**Postup:** Nutna redesign error handling — bud v FirebaseAuthProvider (add try/catch + rethrow s lepsím errorem), nebo v GoogleSignInButton (show error UI), nebo v LoginForm (neumoznit silent return).

**Priorita:** High — blokuje Google Sign-Up

---

### Problem 2: Backend shows "offline" even though it's running

**Soubory:** `src/services/presetsApi.js`, `src/lib/apiClient.js`, `backend-local/src/middleware/auth.js`, `backend-local/.env`, `backend-local/src/firebaseAdmin.js`

**Root cause A:** `presetsApi.js` pouziva raw `fetch()` bez `Authorization: Bearer` headeru. Neveruje `apiClient.js`, ktery ma token interceptory.

**Root cause B:** `backend-local/.env` chybi `FIREBASE_PROJECT_ID`. Bez nej `firebaseAdmin.js` inicijalizuje empty → nelze verificovat zádny token → vsechny auth requesty vraci 401.

**Postup:** (A) Refaktorovať `presetsApi.js` aby pouzival `apiClient` misto raw `fetch`, nebo (B) Pridať `FIREBASE_PROJECT_ID` do `.env` a overit firebaseAdmin initialization.

**Priorita:** High — blokuje presetsApi + vsechny auth-required backend requesty

---

### Problem 3: Per-user tenant isolation not implemented

**Soubory:** `src/utils/adminTenantStorage.js`, `docs/claude/Osobní/RoadMap.md`, `docs/claude/Planovane_Implementace/V3-S00c-database-migration-supabase.md`

**Root cause:** Neni to bug — je to feature. Vsichni uzivatele sdileji `demo-tenant`, protoze per-user tenant assignment neni implementovano.

**Postup:** Implementace je na roadmapem Blocking Item #3 "Tenant izolace" (3-5 hodin). Architektura: register → backend creates tenant → Firebase custom claim → frontend reads from auth → localStorage.

**Priorita:** Blocking — nutna pro Phase 4 Supabase migraci, ale NENI v Sprint 1

---

## Testovani

- **Build:** npm run build — PASS (bez zmeny)
- **Manual test:** Registrace pres email pracuje (testovano po oprave .env.local key)
- **Poznamky:** Zbyle 3 problemy neni mozne fixovat bez vetsiho redesignu — jsou v dalsi sprint/faze

---

<!-- KONEC SABLONY -->
