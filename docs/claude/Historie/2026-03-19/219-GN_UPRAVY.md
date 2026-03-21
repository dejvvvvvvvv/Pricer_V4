# 219-GN — UPRAVY — Sentry Monitoring — 2026-03-19

## Metadata
- **ID:** 219-GN
- **Session:** S01
- **Datum:** 2026-03-19
- **Oblast:** General (Sentry — frontend + backend)
- **Souvisejici ID:** 217-GN (Master plan — cast E: Sentry), 218-BK (Vlna 3 backend infrastruktura)
- **Trigger:** Vlna 4 implementace BETA infrastruktury — Sentry error monitoring integrace

---

## Souhrn uprav

Implementace Sentry error monitoringu pro frontend i backend. Backend pouziva dynamicky import `@sentry/node` s PII scrubbing (beforeSend), frontend pouziva lazy dynamicky import `@sentry/react` se session replay a browser tracing. Oba ErrorBoundary (hlavni + widget) integrovany s Sentry pro automaticky report chyb.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky | Popis |
|---|--------|-----------|-------|-------|
| 1 | backend-local/src/services/sentryService.js | Novy soubor | cele | Backend Sentry service: initSentry(), captureException(), PII scrubbing |
| 2 | src/lib/sentry/sentryInit.js | Novy soubor | cele | Frontend Sentry: lazy import, session replay, browserTracing |
| 3 | backend-local/src/index.js | Zmeneno | — | Pridan import + initSentry() + setupSentryErrorHandler() + captureException |
| 4 | src/index.jsx | Zmeneno | — | Pridan initSentry() + unhandledrejection/error listeners |
| 5 | src/components/ErrorBoundary.jsx | Zmeneno | — | Pridan dynamicky Sentry import v componentDidCatch |
| 6 | src/pages/widget-kalkulacka/components/ErrorBoundary.jsx | Zmeneno | — | Totez — dynamicky Sentry import v componentDidCatch |
| 7 | .env.example (oba — root + backend-local) | Zmeneno | — | Pridany SENTRY_DSN, APP_VERSION promenne |

---

## Detailni zmeny

### 1. `backend-local/src/services/sentryService.js`

**Typ:** Novy soubor
**Radky:** cele
**Duvod:** Centralizovany Sentry service pro backend — error tracking v produkcnim prostredi

**Co se zmenilo:**
- Funkce `initSentry()` — inicializace s dynamickym importem `@sentry/node`
- Funkce `captureException()` — wrapper pro zachyceni chyb s extra kontextem
- PII scrubbing v `beforeSend` — odstranovani citlivych dat pred odeslanim do Sentry
- Dynamicky import zabranuje padu kdyby `@sentry/node` nebyl nainstalovan

---

### 2. `src/lib/sentry/sentryInit.js`

**Typ:** Novy soubor
**Radky:** cele
**Duvod:** Frontend Sentry inicializace s lazy loadem a session replay

**Co se zmenilo:**
- Lazy dynamicky import `@sentry/react` — nenacita se dokud neni potreba
- Session replay konfigurace (`maskAllText` pro GDPR)
- Browser tracing integrace pro performance monitoring
- Kontrola `VITE_SENTRY_DSN` env promenne pred inicializaci

---

### 3. `backend-local/src/index.js`

**Typ:** Zmeneno
**Radky:** —
**Duvod:** Zapojeni Sentry do Express serveru — inicializace + error handler + catch

**Co se zmenilo:**
- Pridan import sentryService na zacatek souboru
- Volani `initSentry()` pri startu serveru
- `setupSentryErrorHandler()` registrovan jako Express error middleware
- `captureException()` volano v existujicim globalnim error handleru

---

### 4. `src/index.jsx`

**Typ:** Zmeneno
**Radky:** —
**Duvod:** Frontend Sentry inicializace + globalni error listenery

**Co se zmenilo:**
- Import a volani `initSentry()` pred renderem aplikace
- Pridany globalni event listenery `unhandledrejection` a `error` pro zachyceni neosetrencych chyb

---

### 5. `src/components/ErrorBoundary.jsx`

**Typ:** Zmeneno
**Radky:** —
**Duvod:** Automaticky report chyb do Sentry pri padu komponenty

**Co se zmenilo:**
- V metode `componentDidCatch` pridan dynamicky import `@sentry/react`
- Pokud je Sentry dostupny, chyba se automaticky odesle s komponentovym stackem

---

### 6. `src/pages/widget-kalkulacka/components/ErrorBoundary.jsx`

**Typ:** Zmeneno
**Radky:** —
**Duvod:** Stejna integrace jako hlavni ErrorBoundary — widget chyby tez do Sentry

**Co se zmenilo:**
- Totez jako bod 5 — dynamicky Sentry import v componentDidCatch pro widget ErrorBoundary

---

### 7. `.env.example` (oba)

**Typ:** Zmeneno
**Radky:** —
**Duvod:** Dokumentace novych env promennych pro Sentry

**Co se zmenilo:**
- Root `.env.example`: pridano `VITE_SENTRY_DSN`, `VITE_APP_VERSION`
- `backend-local/.env.example`: pridano `SENTRY_DSN`, `APP_VERSION`

---

## Dopad zmen

- **Ovlivnene komponenty:** ErrorBoundary (2x), index.jsx, backend index.js
- **Breaking changes:** Ne — Sentry je volitelny, dynamicky import nepadne bez balicku
- **Nove zavislosti:** `@sentry/node` (backend), `@sentry/react` (frontend) — CEKAJI na npm install
- **Rizika:** Bez nainstalovanych balicku Sentry nebude fungovat, ale aplikace nepada (graceful fallback)

---

## Testovani

- **Build:** Neovereno (ceka na npm install novych balicku)
- **Manual test:** Zadny — infrastrukturni zmena, ceka na balicky
- **Poznamky:** Dynamicky import zajistuje ze aplikace funguje i bez @sentry/* balicku

---
