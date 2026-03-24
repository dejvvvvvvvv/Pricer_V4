# UPRAVY — 259-CP

**ID:** 259-CP
**Datum:** 2026-03-22
**Oblast:** Customer Portal (CP) — Phase 2 Bug Fixes
**Titulek:** Phase 2 Bug-Fix Implementation — 19 issues resolved

---

## Popis

Komplexní audit Customer Portalu Phase 1 identifikoval 19 problémů. Phase 2 implementace se zaměřila na:
1. Přidání 6 chybějících backend endpointů
2. Opravu response shape mismatche pro konzistenci datových struktur
3. Fixování React Hooks violations a undefined proměnných
4. Propojení frontend komponenty s reálnými daty a notification systémem

Všechny změny jsou tenant-scoped a integrovány s existujícím storage systémem.

---

## Soubory a zmeny

### 1. `backend-local/src/routes/customerPortal.js`

**Radky:** 1-350 (nový/rozšířený soubor)
**Zmeny:**
- POST `/api/portal/support/tickets` — vytvoření support ticketu
- PATCH `/api/portal/change-password` — změna hesla přes portál
- POST `/api/portal/models/upload` — upload nového modelu
- GET `/api/portal/models/:id/download` — stažení existujícího modelu
- GET `/api/portal/orders/:id/invoice` — získání faktury
- PATCH `/api/portal/notification-preferences` — nastavení preferencí notifikací
- Obnova response shape pro `/models`, `/presets`, `/addresses` → `{ items: [], total: N }`

**Důvod:** Doplnění chybějících endpointů z Phase 1 audit; konzistentní response formát; tenant-scoped routing.

---

### 2. `backend-local/src/customerStore.js`

**Radky:** 200-280 (nové funkce)
**Zmeny:**
- `getOrCreateSupportTickets()` — čtení/zápis support ticketů per tenant
- `downloadModelFile()` — bezpečné stažení modelu s validací ownership
- `saveNotificationPreferences()` — uložení preferencí do tenant storage
- Validace tenantId a customerId na všech funkcích

**Důvod:** Podpůrné funkce pro nové backend endpointy; isolace dat per tenant.

---

### 3. `src/pages/portal/CustomerDashboard.jsx`

**Radky:** 45-80
**Zmeny:**
- FIX: `stats` bylo undefined — nyní vychází z `customerContext?.dashboard?.stats || {}`
- Fallback empty state místo crash
- Stabilní render bez console errors

**Důvod:** Phase 1 bug — undefined variable vedla na bílou obrazovku.

---

### 4. `src/pages/portal/CustomerProfile.jsx`

**Radky:** 120-180, 250-320, 500-550
**Zmeny:**
- Address type field — zmapování na správné pole z API (`addressType` místo `type`)
- Change Password tab — nový endpoint `/api/portal/change-password` namísto auth-only
- Notification preferences — čtení z `/api/portal/notification-preferences` místo hardcoded
- Default form state se inicializuje z realných dat
- Error handling pro všechny API volání

**Důvod:** Fase 1 API mismatch; nyní volají správné endpointy s správnou strukturou dat.

---

### 5. `src/pages/portal/CustomerModels.jsx`

**Radky:** 80-140, 200-280, 350-420
**Zmeny:**
- Upload — endpoint `/api/portal/models/upload` s proper error handling
- Download — endpoint `/api/portal/models/:id/download` s progress feedback
- Rename — endpoint `/api/portal/models/:id` PATCH s `{ name: "new-name" }`
- Obnova response handling — `{ items: [], total }` místo přímého pole

**Důvod:** Phase 1 endpointy chyběly; rename field `fileName` → `name`; konzistentní response format.

---

### 6. `src/pages/portal/CustomerSupport.jsx`

**Radky:** 60-120, 180-240
**Zmeny:**
- Form submission — endpoint `/api/portal/support/tickets` místo hardcoded mock
- Error handling s konkrétní zprávou pro uživatele
- Loading state během odesílání
- Success toast feedback

**Důvod:** Phase 1 endpointu chyběl; nyní se tickety ukládají do backendu.

---

### 7. `src/pages/portal/CustomerPortalLayout.jsx`

**Radky:** 25-45, 75-95
**Zmeny:**
- Notification bell nyní volá `useCustomerContext()` a čte reálné notifikace
- Červené badge s počtem nepřečtených notifikací
- onClick handler otevírá notification panel s reálnými daty
- Fallback na prázdný stav když nejsou notifikace

**Důvod:** Phase 1 notification bell byla jen statická ikona; nyní plně funkční.

---

### 8. `src/pages/portal/CustomerOrderDetail.jsx`

**Radky:** 110-140
**Zmeny:**
- Invoice download button — verifikace že endpointu `/api/portal/orders/:id/invoice` existuje
- Error state když invoice není dostupná
- Loading spinner během stahování

**Důvod:** Verifikace že backend endpoint je dostupný; graceful fallback.

---

## Shrnutý seznam

- [x] Backend — 6 nových endpointů
- [x] Backend — response shape normalizace
- [x] Frontend Dashboard — undefined stats fix
- [x] Frontend Profile — address type mapping
- [x] Frontend Profile — change-password endpoint
- [x] Frontend Profile — notification preferences
- [x] Frontend Models — upload/download/rename endpointy
- [x] Frontend Support — form submission endpoint
- [x] Frontend Layout — notification bell integration
- [x] Frontend Orders — invoice endpoint verification
- [x] Dokumentace aktualizována

---

## Poznámky

**Tenant Isolation:**
- Všechny backend funkce používají `getTenantId()` z requestu
- Storage je scoped per `modelpricer:${tenantId}:*`
- Validace customerId ownership na kritických operacích

**Breaking Changes:**
- API response format změní z pole na `{ items, total }` — klienti MUSI aktualizovat
- Endpoint `/api/portal/models` již vrací `{ items: [...], total: N }` místo `[...]`

**Follow-up (Phase 3):**
- CSV export objednávek
- Batch operations (delete multiple)
- Advanced notification filtering

