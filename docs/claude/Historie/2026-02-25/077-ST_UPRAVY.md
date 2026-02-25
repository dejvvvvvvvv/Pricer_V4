# 077-ST — UPRAVY — Storage + Tenant Izolace — 2026-02-25

## Metadata
- **ID:** 077-ST
- **Session:** S01
- **Datum:** 2026-02-25
- **Oblast:** Storage + Tenant System
- **Souvisejici ID:** 076-ST (KONVERZACE), 078-ST (OTAZKY)
- **Trigger:** Implementace planu per-user tenant izolace (fáze 1, 3, 5)

---

## Souhrn uprav

Implementace per-user tenant izolace přes celý systém. Přidány setTenantId/clearTenantId funkcionalita, upraven FirebaseAuthProvider pro automatické binding Firebase UID jako tenant ID, přidán x-tenant-id header do API, a vyřešeny 13 souborů s hardcoded tenant ID hodnotami. Všechny změny jsou tenant-scoped a build prochází.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | src/utils/adminTenantStorage.js | Zmeneno | 33-41, 51, 70 | setTenantId(), clearTenantId(), tenantIdOverride parametr |
| 2 | src/providers/FirebaseAuthProvider.jsx | Zmeneno | 17, 20, 25-56, 67-100, 174-199, 201-205 | Import updateDoc+setTenantId, ensureGoogleUserProfile, onAuthStateChanged migration, register, logout |
| 3 | src/lib/apiClient.js | Zmeneno | 2, 11 | Import getTenantId, x-tenant-id header |
| 4 | src/services/presetsApi.js | Zmeneno | 11 | Smazana duplikatni getTenantId, reexport z adminTenantStorage |
| 5 | src/utils/adminAnalyticsStorage.js | Zmeneno | 8, 10-11, 14, 62, 150, 421-433 | getTenantId import, dynamicke getDefaultTenantId(), getStoragePrefix() |
| 6 | src/pages/admin/AdminDashboard.jsx | Zmeneno | 14, 143, 196-200, 247-250 | getTenantId import, BRANDING_TENANT_ID = getTenantId() |
| 7 | src/pages/admin/AdminBranding.jsx | Zmeneno | 12, 18 | getTenantId import, customerId = getTenantId() |
| 8 | src/pages/widget/WidgetPreview.jsx | Zmeneno | 13, 15 | getTenantId import, TENANT_ID = getTenantId() |
| 9 | src/pages/widget/WidgetEmbed.jsx | Zmeneno | 12, 14 | getTenantId import, TENANT_ID = getTenantId() |
| 10 | src/pages/test-kalkulacka/components/CheckoutForm.jsx | Zmeneno | 12, 244 | getTenantId import, tenant_id: getTenantId() |
| 11 | src/pages/test-kalkulacka-white/components/CheckoutForm.jsx | Zmeneno | 12, 106 | getTenantId import, tenant_id: getTenantId() |
| 12 | src/utils/adminOrdersStorage.js | Zmeneno | 11, 310 | getTenantId import, tenant_id v seed datech |
| 13 | src/hooks/useSupabaseRealtime.js | Zmeneno | 9 | JSDoc komentar opraven na '<your-tenant-id>' |
| 14 | src/utils/adminFeesStorage.js | Zmeneno | 13, 237 | getTenantId import, preferredCustomerId = getTenantId() |
| 15 | src/utils/adminPricingStorage.js | Zmeneno | 407-414 | Legacy klíče rozšíření — nejdřív dynamický tenant, fallback na test-customer-1 |

---

## Detailni zmeny

### 1. `src/utils/adminTenantStorage.js`

**Typ:** Zmeneno
**Radky:** 33-41, 51, 70
**Duvod:** Umožnit nastavení/vymazání tenant ID per session a optional override v readTenantJson/writeTenantJson

**Co se zmenilo:**
- Přidány funkce setTenantId(id) a clearTenantId() pro session management
- getTenantId() nyní kontroluje tenantIdOverride před výchozím localhost tenantId
- readTenantJson a writeTenantJson akceptují tenantIdOverride parametr pro testování

---

### 2. `src/providers/FirebaseAuthProvider.jsx`

**Typ:** Zmeneno
**Radky:** 17, 20, 25-56, 67-100, 174-199, 201-205
**Duvod:** Automatické bindování Firebase UID jako tenant ID + migrace starých účtů bez tenantId

**Co se zmenilo:**
- ensureGoogleUserProfile nyní uklada tenantId do Firestore profilu u Google přihlášení
- onAuthStateChanged automaticky čte tenantId z Firestore a nastavuje jej přes setTenantId()
- Migrace: starý účet (david-kunak@seznam.cz) získá tenantId 'demo-tenant', ostatní dostávají user.uid
- register nastavuje tenantId = user.uid pro nové účty
- logout vola clearTenantId() pro vyčištění

---

### 3. `src/lib/apiClient.js`

**Typ:** Zmeneno
**Radky:** 2, 11
**Duvod:** Posílat x-tenant-id header v každém API requestu pro server-side validaci

**Co se zmenilo:**
- Přidán import getTenantId
- Request interceptor nyní přidává x-tenant-id header do headers

---

### 4. `src/services/presetsApi.js`

**Typ:** Zmeneno
**Radky:** 11
**Duvod:** Odstranit duplikaci getTenantId funkce

**Co se zmenilo:**
- Smazány radky 11-18 (duplikátní getTenantId definice)
- Nahrazeno re-exportem: `export { getTenantId } from '../utils/adminTenantStorage'`

---

### 5. `src/utils/adminAnalyticsStorage.js`

**Typ:** Zmeneno
**Radky:** 8, 10-11, 14, 62, 150, 421-433
**Duvod:** Nahradit hardcoded DEFAULT_TENANT_ID a STORAGE_PREFIX dynamickými funkcemi

**Co se zmenilo:**
- Přidán import getTenantId
- Funkce getDefaultTenantId() vrací getTenantId() dynamicky
- Funkce getStoragePrefix() konstruuje klíč s dynamickým tenant ID
- Všechny readTenantJson/writeTenantJson volání nyní používají dynamický tenant

---

### 6. `src/pages/admin/AdminDashboard.jsx`

**Typ:** Zmeneno
**Radky:** 14, 143, 196-200, 247-250
**Duvod:** Odstranit hardcoded BRANDING_TENANT_ID = 'test-customer-1'

**Co se zmenilo:**
- Přidán import getTenantId
- BRANDING_TENANT_ID = getTenantId() místo konstant
- Smazány legacy klíče pro 'demo-tenant', nyní se čtou dynamicky

---

### 7. `src/pages/admin/AdminBranding.jsx`

**Typ:** Zmeneno
**Radky:** 12, 18
**Duvod:** Dynamický tenant místo hardcoded 'test-customer-1'

**Co se zmenilo:**
- Přidán import getTenantId
- customerId = getTenantId() místo 'test-customer-1'

---

### 8. `src/pages/widget/WidgetPreview.jsx`

**Typ:** Zmeneno
**Radky:** 13, 15
**Duvod:** Tenant-scoped widget preview

**Co se zmenilo:**
- Přidán import getTenantId
- TENANT_ID = getTenantId() místo hardcoded

---

### 9. `src/pages/widget/WidgetEmbed.jsx`

**Typ:** Zmeneno
**Radky:** 12, 14
**Duvod:** Tenant-scoped widget embed

**Co se zmenilo:**
- Přidán import getTenantId
- TENANT_ID = getTenantId() místo hardcoded

---

### 10. `src/pages/test-kalkulacka/components/CheckoutForm.jsx`

**Typ:** Zmeneno
**Radky:** 12, 244
**Duvod:** Tenant-scoped checkout payload

**Co se zmenilo:**
- Přidán import getTenantId
- tenant_id: getTenantId() v submitData

---

### 11. `src/pages/test-kalkulacka-white/components/CheckoutForm.jsx`

**Typ:** Zmeneno
**Radky:** 12, 106
**Duvod:** Tenant-scoped checkout pro white-label verzi

**Co se zmenilo:**
- Přidán import getTenantId
- tenant_id: getTenantId() v submitData

---

### 12. `src/utils/adminOrdersStorage.js`

**Typ:** Zmeneno
**Radky:** 11, 310
**Duvod:** Tenant-scoped seed data

**Co se zmenilo:**
- Přidán getTenantId do importu
- tenant_id v seed datech nyní používá getTenantId()

---

### 13. `src/hooks/useSupabaseRealtime.js`

**Typ:** Zmeneno
**Radky:** 9
**Duvod:** Oprava JSDoc příkladu

**Co se zmenilo:**
- Komentar změněn z 'demo-tenant-uuid' na '<your-tenant-id>' pro jasnost

---

### 14. `src/utils/adminFeesStorage.js`

**Typ:** Zmeneno
**Radky:** 13, 237
**Duvod:** Tenant-scoped preferred customer ID

**Co se zmenilo:**
- Přidán getTenantId do importu
- preferredCustomerId = getTenantId() místo hardcoded

---

### 15. `src/utils/adminPricingStorage.js`

**Typ:** Zmeneno
**Radky:** 407-414
**Duvod:** Legacy klíče rozšíření — migrace starých dat

**Co se zmenilo:**
- getPricingConfigV3 nejdřív zkusí getTenantId() tenant
- Fallback na 'test-customer-1' pro zpětnou kompatibilitu
- Umožňuje starým testovacím účtům přístup k demo datům

---

## Dopad zmen

- **Ovlivnené komponenty:** Všechny admin stránky, kalkulačky, widget, checkout, storage helpery
- **Breaking changes:** Ne — je zachována zpětná kompatibilita přes fallback klíče
- **Nove zavislosti:** Žádné nové npm balíčky
- **Rizika:** Pokud getTenantId() vrátí undefined, mohou se data načítat ze špatného tenant prostoru — to je řešeno fallbackem na 'demo-tenant'

---

## Testovani

- **Build:** npm run build — PASS
- **Manual test:** Přeskočeny (Chrome nepřipojen)
- **Poznámky:** Browser testy budou v dalším kroku (CP2)

---

<!-- KONEC SABLONY -->
