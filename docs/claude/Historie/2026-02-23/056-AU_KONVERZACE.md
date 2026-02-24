# 056-AU — KONVERZACE — Auth — 2026-02-23

## Metadata
- **ID:** 056-AU
- **Session:** S02
- **Datum:** 2026-02-23
- **Oblast:** Auth
- **Souvisejici ID:** 043-AU through 055-LG, 057-AU

---

## Tema session

Testovani Sprint 1 Auth implementace (GoogleAuth + backend integraci). Nalezeny 3 kriticke problemy: ticha chyba pri Google Sign-In (Firestore write bez error handling), backend ukazuje "offline" (chybejici FIREBASE_PROJECT_ID + presne routovani presetsApi), a per-user tenant isolation neni implementovana (je na roadmapem, ale ne v Sprint 1). Dodatecny nalezek: vratna Firebase API key.

---

## Prubeh konverzace

### [1] Uzivatel
> Testovani Sprint 1 Auth — zkusim se prihlasit pres Google Sign-In. Vyprobuju registraci a login. Backend beleza na dev serveru?

### [1] Claude
**Shrnuti odpovedi:**
- Vzal jsem si Session S02 pro dalsi test spousteciho cyklu
- Navrhl jsem testovaci plany: Google Sign-In popup, registrace, login, backend connectivity check na presetsApi
- Upozornil jsem na mozne rizika: Firestore integraci, token verification, tenant scoping

**Akce provedene:**
- Analyza existujiciho Sprint 1 kodu
- Planovani testu Google auth flow

**Soubory zminene:**
- `src/providers/FirebaseAuthProvider.jsx`
- `src/pages/login/components/LoginForm.jsx`
- `backend-local/src/middleware/`

---

### [2] Uzivatel
> Google Sign-In popup se otevre, vyberu ucet a popup se zavře — ale nic se nedeje. Zadny error, jen ticho. Co se stalo?

### [2] Claude
**Shrnuti odpovedi:**
- Odhalil jsem Problem 1: Google OAuth popup closes silently
- Root cause: `FirebaseAuthProvider.loginWithGoogle()` nemá try/catch okolo `setDoc()` na Firestore (liny 81-101)
- Firestore write failuje tichu, error propaguje k `onError()` v `GoogleSignInButton`
- `LoginForm.handleGoogleError()` tichu vraci pro kod `popup-closed-by-user` bez zobrazeni error message
- Diagram: OAuth success → Firestore write fails → error handler calls onError() → LoginForm swallows message

**Akce provedene:**
- Diagnoza root cause (nema error handling, nema error message UI)
- Zdokumentovani problemu pro dalsi sprinti

**Soubory zminene:**
- `src/providers/FirebaseAuthProvider.jsx` (lines 81-101)
- `src/components/ui/GoogleSignInButton.jsx` (lines 18-27)
- `src/pages/login/components/LoginForm.jsx` (lines 93-100)

---

### [3] Uzivatel
> Po registraci jsem se hlasil. Login funguje. Ale presetsApi rika "backend is not running" — ale backend je spusteny na portu 3001. Proc?

### [3] Claude
**Shrnuti odpovedi:**
- Odhalil jsem Problem 2: Backend shows "offline" even though its running (dual root cause)
- Root cause A: `src/services/presetsApi.js` pouziva raw `fetch()` BEZ `Authorization: Bearer` header. Nevyuziva `apiClient.js`, ktery ma token interceptory.
- Root cause B: `backend-local/.env` chybi `FIREBASE_PROJECT_ID`. Bez nej, `firebaseAdmin.js` inicijalizuje empty → nelze verificovat ZADNY token → vsechny auth requesty vraci 401.
- Backend interpret 401 jako "offline" — misto "unauthenticated"
- Oboustranny problem: frontend neposila token (A) + backend je neschopen token verificovat (B)

**Akce provedene:**
- Diagnoza Problem 2 dual root cause
- Zdokumentovani pro dalsi sprinti

**Soubory zminene:**
- `src/services/presetsApi.js`
- `src/lib/apiClient.js`
- `backend-local/src/middleware/auth.js`
- `backend-local/.env` (chybi FIREBASE_PROJECT_ID)
- `backend-local/src/firebaseAdmin.js`

---

### [4] Uzivatel
> OK, takze Problem 1 a 2 jsou zname. Ceka se na fix v dalsi sprint. Ale co tenant isolation? Jsou svi uzivatele na "demo-tenant"? Ma to vest kde?

### [4] Claude
**Shrnuti odpovedi:**
- Problem 3: Per-user tenant isolation NENI v Sprint 1 — je na roadmapem
- Nalezen v: `docs/claude/Osobní/RoadMap.md` Blocking Item #3 "Tenant izolace" (3-5 hodin), + `V3-S00c-database-migration-supabase.md` Phase 4
- Architektura: register → backend creates tenant → Firebase custom claim → frontend reads from auth → localStorage
- Zatim: `getTenantId()` vracejici `demo-tenant` hardcoded fallback (vsichni uzivatele share)
- Neni to chyba v kodu, je to neplannene (v teto sprintu) — je to znamá limitace

**Akce provedene:**
- Potvrzeni ze to neni Problem — je to feature na dalsi sprint
- Reference na roadmap dokumenty

**Soubory zminene:**
- `src/utils/adminTenantStorage.js`
- `docs/claude/Osobní/RoadMap.md`
- `docs/claude/Planovane_Implementace/V3-S00c-database-migration-supabase.md`

---

### [5] Uzivatel
> Takze shrnuti: 3 problemy (1 a 2 v Sprint 1, 3 je feature). Jsou zname, nejsou v teto sprintu. Registrace funguje (testoval jsem email). Cokoliv jeste?

### [5] Claude
**Shrnuti odpovedi:**
- Zjistil jsem Problem 4: Firebase API key je SPATNENA — typo v `.env.local`
- Spatne: `AIzaSyCbvGXsN_C9tZtmcrJw5whNLw-Fr1H9m0g` (typo: `cr` misto `c7`, uppercase `L` misto `l`)
- Spravne: `AIzaSyCbvGXsN_C9tZtmc7Jw5whNlw-Fr1H9m0g`
- OPRAVA: Upravil jsem `.env.local` s tímto klíčem
- Registrace pres email nyn funguje (testovano po oprave)

**Akce provedene:**
- Oprava `.env.local` — API key fix
- Overeni ze registrace nyn pracuje
- Build PASS

**Soubory zminene:**
- `Model_Pricer-V2-main/.env.local` (line 1 — API key)

---

## Rozhodnuti ucinena v teto session

| # | Rozhodnuti | Kontext/duvod | Kdo rozhodl |
|---|-----------|---------------|-------------|
| 1 | Problem 1 (Google ticha chyba) neni part Sprint 1 fix — je to "design debt" | Sprint 1 ma omezeny scope, problem je znamy ale nefunkcni, oprava potrebuje redesign error handling | Uzivatel + Claude (podle roadmapu) |
| 2 | Problem 2 (backend offline) neni part Sprint 1 fix — oba root causes budou fixnute az se bude rozsirovat backend | Podpora auth middleware a FIREBASE_PROJECT_ID setup je poza Sprint 1 scopem | Uzivatel + Claude |
| 3 | Problem 3 (tenant isolation) oficialne jde do dalsi sprintu — je to na roadmapem | Blokujici prvek pro Phase 4 Supabase migraci, neni part Sprint 1 | Uzivatel (podle RoadMap) |
| 4 | Firebase API key byla spatne — oprav ji ihned | Registrace pres email nechodila, po oprave funguje | Claude (Fix provedeny) |

---

## Otevrene otazky

- [ ] Jak by se měl Problem 1 (Google ticha chyba) řešit — redesignovat error handling v FirebaseAuthProvider nebo přidat error UI wrapper?
- [ ] Kdy bude Problem 2 (backend auth tokens) fixnut — v ramci jine sprintu nebo az se resi backend integrace jako celek?
- [ ] Jaký je aktuální plán pro Problem 3 (tenant isolation) — je to fakt Phase 4, nebo mozna skup v jine sprintu?

---

## Navaznost

- **Predchozi:** 055-LG (Login-Page OTAZKY, S01)
- **Nasledujici:** 057-AU (UPRAVY — diagnoza + pozadavky na fix)

---

<!-- KONEC SABLONY -->
