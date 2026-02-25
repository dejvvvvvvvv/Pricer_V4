# 082-ST — UPRAVY — Storage + Auth System (P1 Fixes) — 2026-02-25

## Metadata
- **ID:** 082-ST
- **Session:** S01
- **Datum:** 2026-02-25
- **Oblast:** Storage + Auth System
- **Souvisejici ID:** 081-GN, 080-ST, 077-ST
- **Trigger:** P1 Code Review + paralelni implementace 3 opravnych agentu (mp-spec-st-async, mp-spec-st-validace, mp-spec-au-firebase)

---

## Souhrn uprav

Oprava vsech 7 P1 chyb identifikovanych v P0 code review. Zavolania include: konzistence async API s tenantIdOverride, cache getTenantId() volani, odstraneni redundantnich rpc volani, oprava dependency arrays v useEffect hooky, dead code cleanup, a oprava Google Sign-In race conditions. Vytvoreni noveho dokumentu BUGFIX-TRACKER.md pro persistent tracking P0/P1/P2 chyb.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | `src/utils/adminTenantStorage.js` | Zmeneno | 139, 148, 157 | Pridano tenantIdOverride parametr do async funkci |
| 2 | `src/utils/adminAnalyticsStorage.js` | Zmeneno | 397, 422-433 | Cache getTenantId() v seedAnalyticsDemo — prevence 5 hot-loop volani |
| 3 | `src/utils/adminFeesStorage.js` | Zmeneno | 231 | Komentar zmenen z "prefer test-customer-1" na "prefer current tenant" |
| 4 | `src/providers/FirebaseAuthProvider.jsx` | Zmeneno | 110-121 | Odstranen redundantni ensureGoogleUserProfile z getRedirectResult handler |
| 5 | `src/services/presetsApi.js` | Zmeneno | 11 | Re-export zmenen na import — dead code removal |
| 6 | `src/pages/admin/AdminBranding.jsx` | Zmeneno | 83 | Pridan customerId do useEffect dependency array |
| 7 | `src/pages/admin/AdminDashboard.jsx` | Zmeneno | 224, 266, 268-270, 272-280 | Pridano BRANDING_TENANT_ID do 6 useMemo dependency arrays |
| 8 | `docs/claude/Research/per-user-tenant/BUGFIX-TRACKER.md` | Novy soubor | - | Kompletni bug tracker (P0/P1/P2/future) pro persistent reference |

---

## Detailni zmeny

### 1. `src/utils/adminTenantStorage.js`

**Typ:** Zmeneno
**Radky:** 139, 148, 157
**Duvod:** Konzistence async API s sync API — async funkce `readTenantJsonAsync`, `writeTenantJsonAsync`, `appendTenantLogAsync` maji nyt tenantIdOverride parametr shodne se svymi sync protejsky

**Co se zmenilo:**
- Pridano `tenantIdOverride` parametr (optional, default undefined) do signature tech 3 async funkci
- Umoznovano explicitni prepis tenant ID pri volani, obdobne jako v sync API
- Backward compatible — pokud tenantIdOverride neni zadano, pouzije se getTenantId()

---

### 2. `src/utils/adminAnalyticsStorage.js`

**Typ:** Zmeneno
**Radky:** 397, 422-433
**Duvod:** Cache getTenantId() volani — funkce `seedAnalyticsDemo` volala getTenantId() 5x v hot loopu, bylo ziskano 5x stejne hodnotu

**Co se zmenilo:**
- Pridano na zacatek seedAnalyticsDemo: `const currentTenantId = getTenantId();`
- Nahrazeny vsechny 5 intra-loop volani getTenantId() s `currentTenantId` referencou
- Snizeno pocet RPC/localStorage read volani z 5 na 1

---

### 3. `src/utils/adminFeesStorage.js`

**Typ:** Zmeneno
**Radky:** 231
**Duvod:** Spravne okomentovani — komentar "prefer test-customer-1" byl nepresny (testovaci artifact)

**Co se zmenilo:**
- Zmenen komentar z "prefer test-customer-1" na "prefer current tenant"
- Nic v logice, pouze dokumentacni zmena

---

### 4. `src/providers/FirebaseAuthProvider.jsx`

**Typ:** Zmeneno
**Radky:** 110-121
**Duvod:** Prevence race condition — `getRedirectResult` volal `ensureGoogleUserProfile`, ale `onAuthStateChanged` jiz resi tenant binding. Bylo to redundantni a mohlo zpusobit race.

**Co se zmenilo:**
- Odstranen call `ensureGoogleUserProfile()` z handleru `getRedirectResult()`
- `onAuthStateChanged` listener jiz automaticky spousti tenant binding a profil setup
- Eliminovana moznost double-binding na Google Sign-In redirect flow

---

### 5. `src/services/presetsApi.js`

**Typ:** Zmeneno
**Radky:** 11
**Duvod:** Dead code removal — export getTenantId z presetsApi.js nebyl pouzivany nikde, jen re-export z adminTenantStorage

**Co se zmenilo:**
- Zmenen `export { getTenantId }` na `import { getTenantId }` (pro interní pouziti v souboru)
- Odstranen dead re-export ktery nikoho nezajimal

---

### 6. `src/pages/admin/AdminBranding.jsx`

**Typ:** Zmeneno
**Radky:** 83
**Duvod:** Oprava dependency array — useEffect bez zavislosti by mohl byt volan vickrat nez potreba

**Co se zmenilo:**
- useEffect dependency array zmenen z `[]` na `[customerId]`
- Zajisteno ze useEffect bude vykreslen jen kdyz se zmeni customerId

---

### 7. `src/pages/admin/AdminDashboard.jsx`

**Typ:** Zmeneno
**Radky:** 224, 266, 268-270, 272-280
**Duvod:** Oprava dependency arrays — v 6 useMemo kalkulacich chybelChybela zavislost BRANDING_TENANT_ID

**Co se zmenilo:**
- 6 useMemo dependency arrays rozsireny o BRANDING_TENANT_ID
- Zaradi se ze memo kalkulace budou provedeny znovu kdyz se zmeni branding tenant
- Prevence outdated memoized values

---

### 8. `docs/claude/Research/per-user-tenant/BUGFIX-TRACKER.md`

**Typ:** Novy soubor
**Duvod:** Persistent tracking chyb — potreba aby bug list prezil compact konverzace a byl pouzitelny jako zdroj pravdy pro dalsi prace

**Obsah:**
- Sekce P0-FIXED (6 chyb opraveno)
- Sekce P1-FIXED (7 chyb opraveno — v teto session)
- Sekce P2-CEKA (5 chyb ceka na opravu)
- Sekce FUTURE-WORK (dlouhodobejsi mejseni)
- Tabulka s detaily kazde chyby (soubor, linky, popis, impact)

---

## Dopad zmen

- **Ovlivnene komponenty:** AdminBranding, AdminDashboard, FirebaseAuthProvider, storage helpery (analytics, fees, presets)
- **Breaking changes:** Ne
- **Nove zavislosti:** Ne
- **Rizika:** Minimalni — jedine zmeny jsou v useEffect dependencies a odstraneni redundantnich volani. Vsechny zmeny jsou konzervativni, bez nutnosti refactoru logiky.

---

## Testovani

- **Build:** npm run build — PASS
- **Manual test:** Smoke test kompletni — zadne chyby
- **Poznamky:** Vsechny P1 opravy ověreny a dokumentovany v BUGFIX-TRACKER.md

---
