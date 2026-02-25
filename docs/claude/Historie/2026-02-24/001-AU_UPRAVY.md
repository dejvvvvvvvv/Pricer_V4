# 001-AU — Sprint 1 Auth Bugfixy FINAL (2026-02-24)

**ID:** 001-AU
**Datum:** 2026-02-24
**Oblast:** Auth (login, register, Google Sign-In, token handling)
**Titulek:** Sprint 1 Auth Bugfixy — Tri kritické bugy opraveny

---

## Popis

Dokonceni Sprint 1 Auth implementace se zamerenim na tri kritické bugy:

1. **Bug 1:** Chybejici error handling v Google Sign-In (Promise rejection v setDoc())
2. **Bug 2a:** Chybejici Authorization headery v service API souborech (presetsApi, slicerApi, storageApi)
3. **Bug 2b:** Chybejici FIREBASE_PROJECT_ID v backend .env pro inicializaci Firebase Admin SDK

Vsechny tri bugy jsou nyni opraveny. Dokumentace aktualizovana.

---

## Soubory a zmeny

### 1. `src/providers/FirebaseAuthProvider.jsx`

**Radky:** 45-80 (loginWithGoogle), 120-150 (register)
**Zmeny:**
- Pridano try/catch kolem `setDoc(userDocRef, userData)` v `loginWithGoogle()` (radek 75)
- Pridano console.error pro zachyceni Firestore chyb (napr. permission denied, network error)
- Pridano try/catch kolem `setDoc(userDocRef, newUser)` v `register()` (radek 140)
- Presna chybova zprava se loguje: "Failed to create user in Firestore: ${error.message}"

**Duvod:** Bug 1 — setDoc() muze selhati a vyvolat Promise rejection. Bez try/catch dochazi k neošetrenému chybovému stavu.

**Status:** FIXED

---

### 2. `src/components/ui/GoogleSignInButton.jsx`

**Radky:** 30-50
**Zmeny:**
- Pridano console.error v catch bloku pri Google Sign-In selhani
- Chybova zprava zobrazena uzivateli: "Chyba pri prihlasovani. Zkuste znova."

**Duvod:** Bug 1 — UI feedback pro uzivatele pri selhani Google Sign-In.

**Status:** FIXED

---

### 3. `src/pages/login/components/LoginForm.jsx`

**Radky:** 45-65
**Zmeny:**
- Rozsireny error handling v handleSubmit()
- console.error pri login selhani
- Pridana kontrola na account-exists error (`error.code === 'auth/account-exists-with-different-credential'`)

**Duvod:** Bug 1 — lepsi error handling a UX feedback.

**Status:** FIXED

---

### 4. `src/pages/register/components/RegistrationForm.jsx`

**Radky:** 50-75
**Zmeny:**
- console.error v catch bloku pri register selhani
- Pridano zachyceni 'auth/email-already-in-use' a zobrazeni vhodne zpravy
- Pridana kontrola na account-exists-with-different-credential

**Duvod:** Bug 1 — UX feedback a handling edge case emailu, ktere uz existuji.

**Status:** FIXED

---

### 5. `src/services/presetsApi.js`

**Radky:** 15-40
**Zmeny:**
- Pridano `Authorization` header v apiFetch() funkci
- Token se cte z `window.__authGetToken()` (helper funkce z `src/lib/apiClient.js`)
- Priklad: `headers: { ..., Authorization: 'Bearer ' + (await window.__authGetToken()) }`

**Duvod:** Bug 2a — /api/presets endpoint vyzaduje auth header pro tenant-scoped pristup.

**Status:** FIXED

---

### 6. `src/services/slicerApi.js`

**Radky:** 25-45
**Zmeny:**
- Pridano `Authorization` header v sliceModelLocal() funkci
- Token se cte pres window.__authGetToken()
- Header prechazi do fetch() volani

**Duvod:** Bug 2a — /api/slice endpoint vyzaduje auth token.

**Status:** FIXED

---

### 7. `src/services/storageApi.js`

**Radky:** 30-160 (vsechny fetch volani)
**Zmeny:**
- Zmena: `tenantHeaders()` -> `authHeaders()` (async funkce)
- Async funkce nyni vraci: `{ Authorization: 'Bearer ' + token, 'X-Tenant-ID': tenantId }`
- Aktualizovano 12 fetch volani na: `const headers = await authHeaders()`
- Priklad: `fetch(url, { method: 'POST', headers: await authHeaders(), body: JSON.stringify(data) })`

**Duvod:** Bug 2a — vsechny storage API volani potrebuji auth header pro tenant-scoped bezpecnost.

**Status:** FIXED

---

### 8. `backend-local/.env`

**Radky:** Konec souboru
**Zmeny:**
- Pridana nova promenna: `FIREBASE_PROJECT_ID=model-pricer`
- Format: KEY=VALUE (bez tabulatoru, bez mezer kolem =)

**Duvod:** Bug 2b — backend-local/src/firebaseAdmin.js pouziva process.env.FIREBASE_PROJECT_ID pri inicializaci Firebase Admin SDK. Bez teto promenne Admin SDK selze.

**Status:** FIXED

---

### 9. `docs/claude/Documentation/Login-Dokumentace.md`

**Zmeny (2026-02-24):**
- Aktualizovana sekce "Error Handling" s novym try/catch handlingem
- Pridany nove error codes: `auth/account-exists-with-different-credential`, `auth/email-already-in-use`
- Aktualizovano "Google Sign-In Flow" s chybovym stavem

**Status:** UPDATED

---

### 10. `docs/claude/Documentation/Register-Dokumentace.md`

**Zmeny (2026-02-24):**
- Aktualizovana sekce "Error Handling" se seznamem moznych chyb
- Pridany error codes pro Bug 1 handling
- Aktualizovano "Registration Flow" s error states

**Status:** UPDATED

---

### 11. `docs/claude/Documentation/Backend-Server-Dokumentace.md`

**Zmeny (2026-02-24):**
- Pridana nova sekce "Environment Variables"
- Doplnena dokumentace FIREBASE_PROJECT_ID (nova promenna)
- Upraven seznam povinnych .env promennych

**Status:** UPDATED

---

## Shrnuty seznam zmen

- [x] FirebaseAuthProvider.jsx — try/catch kolem setDoc() (Bug 1)
- [x] GoogleSignInButton.jsx — error logging (Bug 1)
- [x] LoginForm.jsx — extended error handling (Bug 1)
- [x] RegistrationForm.jsx — account-exists handling (Bug 1)
- [x] presetsApi.js — auth header (Bug 2a)
- [x] slicerApi.js — auth header (Bug 2a)
- [x] storageApi.js — auth header (Bug 2a)
- [x] backend-local/.env — FIREBASE_PROJECT_ID (Bug 2b)
- [x] Login-Dokumentace.md — aktualizovana (DAN)
- [x] Register-Dokumentace.md — aktualizovana (DAN)
- [x] Backend-Server-Dokumentace.md — aktualizovana (DAN)

---

## Poznamky a vyvody

**Bug 1 — Google Sign-In error handling:**
- Zaver: Setdoc() v Firebase muze selhati z mnoha duvodu (permissions, network, invalid data)
- Reseni: try/catch s presnym logem + user-friendly zprava v UI
- Edge case: account-exists-with-different-credential (Google account jiz pouzan pro jiny email) — nyni osetren

**Bug 2a — Auth headers v service API:**
- Zaver: /api/presets, /api/slice, /api/storage vyzaduji Authorization header pro tenant-scoped pristup
- Reseni: window.__authGetToken() callback + async authHeaders() helper
- Architektura: apiClient.js nastavuje window.__authGetToken (neni circular dependency)

**Bug 2b — Backend .env:**
- Zaver: firebaseAdmin.js potrebuje FIREBASE_PROJECT_ID pro inicializaci Admin SDK
- Reseni: pridano do .env s hodnotou 'model-pricer'
- Bezpecnost: PROJECT_ID je verejne viditelne (neni secret)

**Next steps:**
- Smoke test: Login -> Google Sign-In -> Create Preset -> Check /api/presets ma auth header
- E2E test: Overit error states v UI (network error, permission denied, email-already-in-use)
- Dokumentace: Update MEMORY.md se zaverem Sprint 1

---

## Soubory ke kontrole (QA)

1. Overit, ze presetsApi.js ma vyzadovany Authorization header
2. Overit, ze storage API neni broken na chybne `authHeaders()` vracejici Promise
3. Prihlasit se pres Google — overit ze LoginForm hlasi chybu pri selhani setDoc()
4. Registrovat se — overit email-already-in-use chyba
5. Backend .env ma FIREBASE_PROJECT_ID

---
