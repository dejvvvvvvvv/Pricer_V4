# 109-GN — UPRAVY — Code Quality Sprint (ukoly 19-27) — 2026-03-09

## Metadata
- **ID:** 109-GN
- **Session:** S04
- **Datum:** 2026-03-09
- **Oblast:** General (testy, hooky, UI komponenty, backend middleware)
- **Souvisejici ID:** 106-TS, 107-GN, 108-GN
- **Trigger:** Pokracovani code quality sprintu — ukoly 19-27 z 27 celkem

---

## Souhrn uprav

Dokonceni code quality sprintu: apiClient unit testy, dva nove React hooky (useDocumentTitle, useKeyboardShortcut), hook testy, ForgeBreadcrumb navigace, rate limiting middleware pro backend, backend validacni testy. Celkovy vysledek session: 504 unit testu, 27 dokoncenych ukolu.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Popis |
|---|--------|-----------|-------|
| 1 | src/lib/__tests__/apiClient.test.js | Novy soubor | 15 unit testu pro apiClient (interceptory, token refresh, error handling, tenant ID header) |
| 2 | src/hooks/useDocumentTitle.js | Novy soubor | Hook pro dynamicky document.title + SEO |
| 3 | src/hooks/useKeyboardShortcut.js | Novy soubor | Hook pro klavesove zkratky (Escape atd.) |
| 4 | src/hooks/__tests__/useDocumentTitle.test.js | Novy soubor | 7 unit testu pro useDocumentTitle |
| 5 | src/hooks/__tests__/useKeyboardShortcut.test.js | Novy soubor | 16 unit testu pro useKeyboardShortcut |
| 6 | src/components/ui/forge/ForgeBreadcrumb.jsx | Novy soubor | Breadcrumb navigace, auto-generovana z URL, ARIA pristupna |
| 7 | backend-local/src/middleware/rateLimit.js | Novy soubor | Rate limiting middleware (in-memory, zero deps, 3 urovne) |
| 8 | backend-local/src/__tests__/validate.test.js | Novy soubor | 56 unit testu pro backend validacni middleware |
| 9 | vitest.config.backend.mjs | Novy soubor | Vitest konfigurace pro backend testove prostredi |
| 10 | 9 stranek (home, pricing, support, login, register, account, 404, calculator, admin layout) | Zmeneno | Integrace useDocumentTitle hooku |
| 11 | src/pages/admin/AdminParameters.jsx | Zmeneno | Pridani Escape klavesove zkratky do modalu |
| 12 | src/pages/admin/AdminOrders.jsx | Zmeneno | Pridani Escape klavesove zkratky do modalu |
| 13 | src/pages/admin/AdminPresets.jsx | Zmeneno | Pridani Escape klavesove zkratky do modalu |
| 14 | src/pages/admin/AdminLayout.jsx | Zmeneno | Integrace ForgeBreadcrumb nad Outlet |
| 15 | backend-local/src/index.js | Zmeneno | Aplikace rate limiting middleware (3 urovne) |

---

## Detailni zmeny

### 1. `src/lib/__tests__/apiClient.test.js` (Ukol 19)

**Typ:** Novy soubor
**Duvod:** Unit testy pro apiClient — overeni interceptoru, token refresh, error handling, tenant ID header

**Co se zmenilo:**
- 15 testu pokryvajicich: request/response interceptory, automaticky token refresh pri 401, error handling pro ruzne HTTP kody, tenant ID header injekce
- Testy pouzivaji mock axios instance

---

### 2. `src/hooks/useDocumentTitle.js` + 9 stranek (Ukol 20)

**Typ:** Novy soubor + zmeny v 9 strankach
**Duvod:** SEO — dynamicky document.title pro kazdou stranku

**Co se zmenilo:**
- Novy hook useDocumentTitle(title) — nastavi document.title, obnovi puvodni pri unmount
- Aplikovano na: home, pricing, support, login, register, account, 404, calculator, admin layout
- Kazda stranka ma unikatni title (napr. "ModelPricer — Domovska stranka")

---

### 3. `src/hooks/useKeyboardShortcut.js` + 3 admin modaly (Ukol 21)

**Typ:** Novy soubor + zmeny ve 3 souborech
**Duvod:** Konzistentni Escape key handling v admin modalech

**Co se zmenilo:**
- Novy hook useKeyboardShortcut(key, callback, options) — registruje keydown listener
- Pridano do AdminParameters, AdminOrders, AdminPresets — zavreni modalu pres Escape
- Overeno ze ForgeDialog, OrderDetailModal, AdminWidget, BuilderTopBar uz Escape meli

---

### 4. `src/hooks/__tests__/useDocumentTitle.test.js` + `useKeyboardShortcut.test.js` (Ukol 22)

**Typ:** Nove soubory
**Duvod:** Unit testy pro nove hooky

**Co se zmenilo:**
- 7 testu pro useDocumentTitle: nastaveni titlu, obnova pri unmount, prazdny title, re-render
- 16 testu pro useKeyboardShortcut: registrace, modifikatory (Ctrl, Shift, Alt), disabled stav, cleanup, vice zkratek

---

### 5. `src/components/ui/forge/ForgeBreadcrumb.jsx` + AdminLayout (Ukol 23)

**Typ:** Novy soubor + zmena AdminLayout
**Duvod:** Breadcrumb navigace pro admin sekci

**Co se zmenilo:**
- ForgeBreadcrumb: auto-generovany z URL cesty, Forge design, ARIA pristupny (nav + aria-label)
- AdminLayout.jsx: ForgeBreadcrumb vlozen nad <Outlet />
- Mapovani URL segmentu na ceske nazvy (dashboard, nastaveni, objednavky, atd.)

---

### 6. `backend-local/src/middleware/rateLimit.js` + index.js (Ukol 24)

**Typ:** Novy soubor + zmena index.js
**Duvod:** Ochrana API pred abuse — rate limiting

**Co se zmenilo:**
- In-memory rate limiter, zero zavislosti, sliding window
- 3 urovne: global (100 req/min), /api/slice (10 req/min), /api/auth (20 req/min)
- Standardni X-RateLimit-Remaining, X-RateLimit-Limit, X-RateLimit-Reset hlavicky
- Error response: 429 Too Many Requests, kod MP_RATE_LIMITED
- Aplikovano v index.js na prislusne route skupiny

---

### 7. `backend-local/src/__tests__/validate.test.js` + vitest.config.backend.mjs (Ukol 25)

**Typ:** Nove soubory
**Duvod:** Unit testy pro backend validacni middleware

**Co se zmenilo:**
- 56 testu pokryvajicich vsechny validacni pravidla
- Nova vitest.config.backend.mjs pro backend testove prostredi (node environment, oddeleny od frontend testu)

---

## Dopad zmen

- **Ovlivnene komponenty:** Admin modaly (Escape key), vsechny stranky (document.title), admin layout (breadcrumb), backend API (rate limiting)
- **Breaking changes:** Ne
- **Nove zavislosti:** Zadne (rate limiter je in-memory, zero deps)
- **Rizika:** Minimalni — rate limiting muze ovlivnit automatizovane testy pokud bezi rychle po sobe

---

## Testovani

- **Build:** npm run build — PASS
- **Unit testy:** 504 celkem (15 apiClient + 7 useDocumentTitle + 16 useKeyboardShortcut + 56 backend validace + 410 existujicich)
- **Poznamky:** Celkovy vysledek session: 27 dokoncenych ukolu, 504 unit testu

---

<!-- KONEC ZAZNAMU -->
