# 111-GN — UPRAVY — Code Quality Sprint Final (ukoly 39-50) — 2026-03-09

## Metadata
- **ID:** 111-GN
- **Session:** S06
- **Datum:** 2026-03-09
- **Oblast:** General (code quality sprint — network, export, backend, hooks, a11y, lazy loading, clipboard)
- **Souvisejici ID:** 106, 107, 108, 109, 110
- **Trigger:** Pokracovani code quality sprintu — ukoly 39 az 50 (finalni davka)

---

## Souhrn uprav

Code quality sprint final batch (ukoly 39-50). Pridany: network error handler s toast integraci, data export utilita (CSV/JSON), request logger middleware, useMediaQuery hook, ForgeConfirmDialog s promise-based API, apiClient testy, lazy loading 15 rout, focus-visible + skip-to-content a11y, copy-to-clipboard refaktoring. Celkem 601 unit testu, 50 dokoncenych ukolu.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Popis |
|---|--------|-----------|-------|
| 1 | src/lib/networkEvents.js | Novy soubor | Pub/sub system s 2s debounce pro network errory |
| 2 | src/components/NetworkErrorListener.jsx | Novy soubor | Listener komponenta — propojeni network eventu s toast notifikacemi |
| 3 | src/lib/apiClient.js | Zmeneno | Emit network error eventu pri selhani requestu |
| 4 | src/App.jsx | Zmeneno | Pridani NetworkErrorListener do stromu komponent |
| 5 | src/lib/__tests__/networkEvents.test.js | Novy soubor | 10 unit testu pro networkEvents |
| 6 | src/components/ui/__tests__/ScrollToTopButton.test.jsx | Novy soubor | 6 unit testu pro ScrollToTopButton |
| 7 | src/utils/exportData.js | Novy soubor | Export utilita: toCSV, downloadFile, exportCSV, exportJSON |
| 8 | src/pages/admin/AdminOrders.jsx | Zmeneno | Pridani JSON exportu objednavek |
| 9 | src/pages/admin/AdminAnalytics.jsx | Zmeneno | Pridani JSON exportu analytik |
| 10 | src/utils/__tests__/exportData.test.js | Novy soubor | 17 unit testu pro exportData |
| 11 | backend-local/src/middleware/requestLogger.js | Novy soubor | Request logger: error/warn/info urovne, skip health, slow request detekce |
| 12 | backend-local/src/index.js | Zmeneno | Pridani requestLogger do middleware chain |
| 13 | backend-local/src/__tests__/requestLogger.test.js | Novy soubor | 28 unit testu pro requestLogger |
| 14 | src/hooks/useMediaQuery.js | Novy soubor | Hook + useIsMobile, useIsTablet, useIsDesktop convenience funkce |
| 15 | src/components/ui/forge/ForgeConfirmDialog.jsx | Novy soubor | Promise-based confirm() API, destructive mode, Forge styling |
| 16 | src/pages/admin/AdminPayments.jsx | Zmeneno | Proof of concept — pouziti ForgeConfirmDialog |
| 17 | src/lib/__tests__/apiClient.test.js | Novy soubor | 15 unit testu pro apiClient |
| 18 | src/Routes.jsx | Zmeneno | Konverze 15 statickych importu na React.lazy(), focus-visible, skip-to-content |
| 19 | src/index.css | Zmeneno | Globalni focus-visible styly |
| 20 | src/pages/admin/AdminPricing.jsx | Zmeneno | Refaktor na sdileny CopyButton/useCopyToClipboard |
| 21 | src/pages/admin/AdminWidget.jsx | Zmeneno | Refaktor na sdileny CopyButton/useCopyToClipboard |
| 22 | src/pages/admin/AdminTeamAccess.jsx | Zmeneno | Refaktor na sdileny CopyButton/useCopyToClipboard |
| 23 | src/pages/test-kalkulacka/components/OrderConfirmation.jsx | Zmeneno | Refaktor na sdileny CopyButton/useCopyToClipboard |

---

## Detailni zmeny

### Ukol 39: Network Error Handler + Toast

**Nove soubory:** `src/lib/networkEvents.js`, `src/components/NetworkErrorListener.jsx`
**Upravene soubory:** `src/lib/apiClient.js`, `src/App.jsx`
**Duvod:** Centralizovane zachytavani network chyb s uzivatelskym feedbackem pres toast notifikace

**Co se zmenilo:**
- Pub/sub system v networkEvents.js s 2s debounce (prevence spam toastu)
- NetworkErrorListener komponenta naposlouchava eventy a zobrazuje toast
- apiClient emituje network error eventy pri selhani HTTP pozadavku
- App.jsx integruje NetworkErrorListener do komponentniho stromu

---

### Ukol 40: Network Events + ScrollToTopButton Tests (16 testu)

**Nove soubory:** `src/lib/__tests__/networkEvents.test.js`, `src/components/ui/__tests__/ScrollToTopButton.test.jsx`
**Duvod:** Test pokryti pro nove a existujici komponenty

**Co se zmenilo:**
- 10 testu pro networkEvents (subscribe, emit, debounce, unsubscribe)
- 6 testu pro ScrollToTopButton (render, visibility, scroll behavior)

---

### Ukol 41: Data Export Utility + Admin Integration

**Novy soubor:** `src/utils/exportData.js`
**Upravene soubory:** `src/pages/admin/AdminOrders.jsx`, `src/pages/admin/AdminAnalytics.jsx`
**Duvod:** Sdilena utilita pro export dat z admin stranek

**Co se zmenilo:**
- exportData.js: toCSV (konverze pole objektu na CSV string), downloadFile (blob download), exportCSV, exportJSON
- AdminOrders: pridano tlacitko pro JSON export objednavek
- AdminAnalytics: pridano tlacitko pro JSON export analytickych dat

---

### Ukol 42: Export Data Tests (17 testu)

**Novy soubor:** `src/utils/__tests__/exportData.test.js`
**Duvod:** Pokryti exportnich funkci testy

---

### Ukol 43: Request Logger Middleware

**Novy soubor:** `backend-local/src/middleware/requestLogger.js`
**Upraveny soubor:** `backend-local/src/index.js`
**Duvod:** Strukturovane logovani HTTP requestu na backendu

**Co se zmenilo:**
- Smart logging s 3 urovnemi: error (5xx), warn (4xx), info (2xx/3xx)
- Skip health check endpointu (nesnizuje signal-to-noise ratio)
- Detekce pomalych requestu (>1s) s warning logem
- Pridano do middleware chain v index.js

---

### Ukol 44: Request Logger Tests (28 testu)

**Novy soubor:** `backend-local/src/__tests__/requestLogger.test.js`
**Duvod:** Pokryti request logger middleware testy

---

### Ukol 45: useMediaQuery Hook

**Novy soubor:** `src/hooks/useMediaQuery.js`
**Duvod:** Reusable hook pro responsive breakpointy

**Co se zmenilo:**
- Zakladni useMediaQuery hook (matchMedia API)
- Convenience hooks: useIsMobile (<768px), useIsTablet (768-1024px), useIsDesktop (>1024px)

---

### Ukol 46: ForgeConfirmDialog + useConfirmDialog Hook

**Novy soubor:** `src/components/ui/forge/ForgeConfirmDialog.jsx`
**Upraveny soubor:** `src/pages/admin/AdminPayments.jsx`
**Duvod:** Nahrada window.confirm() za Forge-styled dialog s promise-based API

**Co se zmenilo:**
- Promise-based confirm() API — await confirm() vraci true/false
- Destructive mode (cervene tlacitko pro mazaci akce)
- Forge Design System styling
- AdminPayments pouziva jako proof of concept

---

### Ukol 47: apiClient Tests (15 testu)

**Novy soubor:** `src/lib/__tests__/apiClient.test.js`
**Duvod:** Test pokryti pro HTTP klientskou vrstvu

---

### Ukol 48: Lazy Loading Routes (15 rout)

**Upraveny soubor:** `src/Routes.jsx`
**Duvod:** Code splitting — snizeni initial bundle size

**Co se zmenilo:**
- 15 statickych importu konvertovano na React.lazy()
- Kazda lazy route obalena Suspense s fallback loading
- Code splitting viditelny ve build outputu

---

### Ukol 49: Focus-visible + Skip-to-content (a11y)

**Upravene soubory:** `src/index.css`, `src/Routes.jsx`
**Duvod:** Zlepseni pristupnosti (WCAG)

**Co se zmenilo:**
- Globalni :focus-visible styly v index.css (viditelny focus ring pri klavesove navigaci)
- Skip-to-content link v Routes.jsx (preskok navigace na hlavni obsah)

---

### Ukol 50: Copy-to-clipboard Refactoring (4 soubory)

**Upravene soubory:** AdminPricing.jsx, AdminWidget.jsx, AdminTeamAccess.jsx, OrderConfirmation.jsx
**Duvod:** Eliminace duplicitniho copy-to-clipboard kodu

**Co se zmenilo:**
- Vsechny 4 soubory refaktorovany na sdileny CopyButton/useCopyToClipboard
- Konzistentni UX (toast feedback, vizualni stav)

---

## Dopad zmen

- **Ovlivnene komponenty:** App.jsx (NetworkErrorListener), Routes.jsx (lazy loading, skip-to-content), 4 admin stranky (clipboard refaktor), AdminPayments (ForgeConfirmDialog), backend middleware chain
- **Breaking changes:** Ne
- **Nove zavislosti:** Zadne (vsechno pouziva existujici deps)
- **Rizika:** Lazy loading muze zpusobit kratky loading flash pri prvnim nacitani route

---

## Testovani

- **Build:** npm run build — PASS
- **Nove testy v teto davce:** 61 testu (10 networkEvents + 6 ScrollToTop + 17 exportData + 28 requestLogger)
- **Celkem v projektu:** 601 unit testu
- **Celkem ukolu:** 50 dokoncenych

---

<!-- KONEC ZAZNAMU -->
