# UPRAVY — Per-User Tenant Izolace (Session S01)

> Zapis zmeny pro implementaci per-user tenant scoped dat. Kazdj uzivatel ma vlastni tenant ID (uid), jeho data jsou izolova do oddeleneho namespace.

---

## Hlavicka

**ID:** 050-ST
**Datum:** 2026-02-25
**Oblast:** Storage (Tenant Isolation)
**Titulek:** Per-User Tenant Izolace — Core Storage + Auth Binding + Hardcoded Cleanup

---

## Popis (1-3 radky)

Implementovana per-user tenant izolace na 3 vrstvach:
1. **Faze 1:** Pridany `setTenantId()`, `clearTenantId()` a `tenantIdOverride` parametr do `src/utils/adminTenantStorage.js`
2. **Faze 3:** Propojeni auth systemu — Firebase profil uklada/nacita tenantId, backend vola `setTenantId()` pri login/register
3. **Faze 5:** Vycisteni 13 hardcoded tenant ID konstant v celem repu

---

## Soubory a zmeny

### 1. `src/utils/adminTenantStorage.js`

**Radky:** 1-50 (nove funkce), 50-120 (updateovane readTenantJson/writeTenantJson)
**Zmeny:**
- **Nove:** `setTenantId(id)` — zapise tenant ID do `localStorage['modelpricer:tenant_id']`
- **Nove:** `clearTenantId()` — smaze tenant ID z localStorage
- **Updateovano:** `getTenantId()` — zustava stejne (cte z localStorage)
- **Updateovano:** `readTenantJson(namespace, tenantIdOverride)` — umoznuje cist data pro jiny tenant (pokud override poskytnut)
- **Updateovano:** `writeTenantJson(namespace, data, tenantIdOverride)` — umoznuje psat data pro jiny tenant (pro migraci/admin)

**Duvod:** Nove API pro nastaveni tenant ID (pri login) a override pro admin operace.

---

### 2. `src/providers/FirebaseAuthProvider.jsx`

**Radky:** 1-30 (imports), 80-120 (`ensureGoogleUserProfile`), 150-200 (`onAuthStateChanged`), 250-300 (`register`), 350-380 (`logout`)
**Zmeny:**
- **Import:** `updateDoc` z `firebase/firestore`, `setTenantId`/`clearTenantId` z `adminTenantStorage`
- **Nova funkce `ensureGoogleUserProfile(user)`:**
  - Uklada `tenantId: user.uid` do Firestore profilu (collections: 'users')
  - Cte existujici tenantId (pro ucty co uz maji)
  - Migrace: pokud neni tenantId a neni admin (ne david-kunak@seznam.cz) → set na user.uid
  - Pokud je admin → set na 'demo-tenant'
- **`onAuthStateChanged()` callback:**
  - Cte tenantId z Firestore profilu
  - Vola `setTenantId(tenantId)`
  - Pouziva `readTenantJson(namespace, tenantId)` pro overeni dat
- **`register()` funkce:**
  - Po vytvoreni uzivatele vola `ensureGoogleUserProfile()`
  - Vola `setTenantId(user.uid)`
- **`logout()` funkce:**
  - Vola `clearTenantId()` PRED `signOut()`

**Duvod:** Spravne mapovani tenant ID pri login/logout, migrace starych uctu bez tenantId.

---

### 3. `src/lib/apiClient.js`

**Radky:** 1-30 (request interceptor)
**Zmeny:**
- **Novy request interceptor:**
  - Cte `getTenantId()` z adminTenantStorage
  - Prida header `x-tenant-id: ${tenantId}` do VSECH pozadavku
  - Fallback na 'unknown' pokud neni nastaven tenantId

**Duvod:** Backend kontroluje tenant ID v middleware a izolovuje data dle tenant ID.

---

### 4. `src/services/presetsApi.js`

**Radky:** 1-15 (imports a getTenantId)
**Zmeny:**
- **Smazano:** duplicitni `getTenantId()` definice (byla tady inline)
- **Pridano:** `import { getTenantId } from '@/utils/adminTenantStorage'`
- **Zmena:** Vhodne mista ktere pouzivaly vlastni tenantId nyni pouzivaji getTenantId()

**Duvod:** Jediny zdroj pravdy pro getTenantId je adminTenantStorage.

---

### 5. `src/utils/adminAnalyticsStorage.js`

**Radky:** 1-50 (funkce, DEFAULT_TENANT_ID)
**Zmeny:**
- **Smazano:** `const DEFAULT_TENANT_ID = 'demo-tenant'` (hardcoded)
- **Updatovano:** `getDefaultAnalyticsData(tenantId)` — bere tenantId jako parametr
- **Updatovano:** Vhodne volajici kod — pouziva `getTenantId()` pred volanim

**Duvod:** Odmoci hardcoded demo-tenant, pouziva realny tenant ID.

---

### 6. `src/pages/admin/AdminDashboard.jsx`

**Radky:** 10-25 (konst), 200-250 (readTenantJson vola)
**Zmeny:**
- **Smazano:** `const BRANDING_TENANT_ID = 'demo-tenant'` (hardcoded na 2 mistech)
- **Smazano:** `const customerId = 'demo-tenant'` (hardcoded)
- **Updatovano:** `useEffect() -> readTenantJson(..., getTenantId())` — vhodne cte branding pro aktualni tenant
- **Updatovano:** legacy klice rozsireny — pokud jsou data v oldformat, migruji na novy format s getTenantId()

**Duvod:** Dashboard cte data sveho tenanta, ne hardcoded demo-tenant.

---

### 7. `src/pages/admin/AdminBranding.jsx`

**Radky:** 15-30 (konst)
**Zmeny:**
- **Smazano:** `const customerId = 'demo-tenant'` (hardcoded)
- **Updatovano:** Vsude kde byla pouzita `customerId` nyni je `getTenantId()`

**Duvod:** Branding je tenant-scoped.

---

### 8. `src/pages/widget-kalkulacka/components/WidgetPreview.jsx`

**Radky:** 40-60 (constants)
**Zmeny:**
- **Smazano:** `const TENANT_ID = 'demo-tenant'` (hardcoded)
- **Updatovano:** `loadWidgetConfig()` pouziva `getTenantId()` namiste TENANT_ID

**Duvod:** Widget preview se zobrazi pro aktualni tenant.

---

### 9. `src/pages/widget-kalkulacka/components/WidgetEmbed.jsx`

**Radky:** 30-50 (constants)
**Zmeny:**
- **Smazano:** `const TENANT_ID = 'demo-tenant'` (hardcoded)
- **Updatovano:** Vhodne vola getTenantId()

**Duvod:** Embed pracuje s daty aktualni tenanta.

---

### 10. `src/pages/test-kalkulacka/components/CheckoutForm.jsx`

**Radky:** 180-200 (API call), 250-280 (state inicializace)
**Zmeny:**
- **Smazano:** `tenant_id: 'demo-tenant'` v POST payloadu
- **Updatovano:** `tenant_id: getTenantId()` pri vytvareni order

**Duvod:** Order se eviduje pro aktualni tenant, ne hardcoded.

---

### 11. `src/pages/test-kalkulacka/white/CheckoutForm.jsx` (duplicate white page)

**Radky:** 180-200 (API call)
**Zmeny:**
- Stejne jako #10 — `tenant_id: getTenantId()` namiste hardcoded

**Duvod:** Obe verze kalkulacky maji stejne tenant scoping.

---

### 12. `src/utils/adminOrdersStorage.js`

**Radky:** 40-80 (seed data, getDefaultOrdersData)
**Zmeny:**
- **Smazano:** `tenant_id: 'demo-tenant'` v getDefaultOrdersData()
- **Updatovano:** `getDefaultOrdersData(tenantId)` bere tenantId jako parametr
- **Updatovano:** Volajici kod vola `getDefaultOrdersData(getTenantId())`

**Duvod:** Seed data (default objednavky) jsou tenant-scoped.

---

### 13. `src/hooks/useSupabaseRealtime.js`

**Radky:** 15-25 (komentar)
**Zmeny:**
- **Updateovan komentar:** Zminen z "vola se s hardcoded TENANT_ID" na "vola se s getTenantId() z adminTenantStorage"

**Duvod:** Dokumentace up-to-date.

---

### 14. `src/utils/adminFeesStorage.js`

**Radky:** 10-40 (konst a funkce getDefaultFeesData)
**Zmeny:**
- **Smazano:** `const preferredCustomerId = 'demo-tenant'` (hardcoded)
- **Updatovano:** `getDefaultFeesData(tenantId)` — novy parametr
- **Updatovano:** Volajici kod pouziva `getDefaultFeesData(getTenantId())`

**Duvod:** Fees jsou tenant-scoped, ne hardcoded.

---

### 15. `src/utils/adminPricingStorage.js`

**Radky:** 50-120 (legacy key rozsireni)
**Zmeny:**
- **Updateovano:** Podpora starych klicu (bez tenantId v namespace)
- **Migrace logika:** Pokud exist `modelpricer:pricing:v3` (stary format bez tenant), zkopiruj do `modelpricer:${tenantId}:pricing:v3`
- **Novo:** `getTenantId()` pouzito pri vsech operacich

**Duvod:** Kompatibilita s existujicimi daty, plynula migrace.

---

## Shrnuty seznam

- [x] adminTenantStorage.js — setTenantId, clearTenantId, tenantIdOverride
- [x] FirebaseAuthProvider.jsx — ensureGoogleUserProfile, auth state change, login/logout
- [x] apiClient.js — x-tenant-id header
- [x] presetsApi.js — smazano duplicitni getTenantId
- [x] adminAnalyticsStorage.js — dynamic tenantId
- [x] AdminDashboard.jsx — dynamic tenantId, legacy klice
- [x] AdminBranding.jsx — dynamic tenantId
- [x] WidgetPreview.jsx — dynamic tenantId
- [x] WidgetEmbed.jsx — dynamic tenantId
- [x] CheckoutForm.jsx (test-kalkulacka) — dynamic tenantId
- [x] CheckoutForm.jsx (white) — dynamic tenantId
- [x] adminOrdersStorage.js — dynamic tenantId v seed
- [x] useSupabaseRealtime.js — komentar aktualizovan
- [x] adminFeesStorage.js — dynamic tenantId
- [x] adminPricingStorage.js — legacy key support + dynamic tenantId
- [x] Build: npm run build — PASS

---

## Poznamky

**Rozhodovani:**
- 1 uzivatel = 1 ucet s vlastnim tenant ID (uid)
- Novy ucet = prazdny admin panel (nevidí data ostatnich uzivatelu)
- david-kunak@seznam.cz = specialni admin s pristupem k demo-tenanta (tenantId = 'demo-tenant')
- Synchronizace mezi zarizenimi = az s Supabase (budouci session)

**Edge cases:**
- test-kalkulacka nema zatim override parametr pro tenant ID — loadPricingConfigV3/loadFeesConfigV3 nejsou updatovany (LOW PRIORITY)
- Stare ucty bez tenantId v Firestore — migrace automaticka pri prvnimu login
- Fallback v apiClient na 'unknown' pokud getTenantId() vrati null — backend vrati chybu s jasnym textem

**Follow-up:**
- Supabase migrace — budouci session, tenant ID storage se zmeni z localStorage na Supabase
- Test-kalkulacka loadPricingConfigV3/loadFeesConfigV3 — mozne pridat override parametr ale neni CRITICAL
- Backend validace tenant ID — zkontroluj ze `/api/presets`, `/api/slice`, `/api/storage` validuji x-tenant-id header

