# AdminDashboard -- Dokumentace

> Hlavni prehledova stranka admin panelu. Zobrazuje realtime data z localStorage pres
> storage helpery. Plne tenant-scoped. Zadna mock data.

---

## 1. Prehled

AdminDashboard (`/admin`) je vstupni bod admin panelu. Poskytuje:

- **4 summary karty** -- dnesni trzby, dnesni objednavky, cekajici na akci, aktivni tisky
  (real data z `loadOrders()` + `computeOrderTotals()`)
- **Attention sekce** -- objednavky co cekaji >48h nebo maji flags (navigace na `/admin/orders/:id`)
- **Recent orders tabulka** -- poslednich 8 objednavek, klik vede na `/admin/orders/:id`
- **Recent activity** -- poslednich 12 zaznamu z audit logu
- **Quick actions sidebar** -- Nova objednavka, Vsechny objednavky, Analytika, Pruvodce
- **Quick links grid** -- 8 linku na hlavni admin sekce (2-sloupcovy grid)
- **Pending actions** -- badge s poctem novych objednavek, faktur a vyprsi kuponu
- **Revenue sparkline** -- SVG bar chart poslednich 7 dni
- **Popular materials** -- top 3 materialy z objednavek
- **System alerts** -- vyprsele kupony, chybejici materialy v ceniku, chybejici logo
- **System status** -- indikatory pro pricing, fees, pocet objednavek
- **Branding tips** -- doporuceni pokud chybi logo, nazev nebo tagline
- **Onboarding banner** -- zobrazuje se pokud `isOnboardingCompleted()` vraci false

### Routing

```jsx
// src/Routes.jsx
<Route index element={<AdminDashboard />} />
```

Pristup: `/admin`

---

## 2. Data flow

Vsechna data jsou realny obsah z localStorage (zadna mock data). Zdroje:

| Data | Funkce | Storage helper |
|------|--------|----------------|
| Objednavky | `loadOrders()` | `adminOrdersStorage.js` |
| Totaly objednavek | `computeOrderTotals(order)` | `adminOrdersStorage.js` |
| Audit log | `getAuditEntries()` | `adminAuditLogStorage.js` |
| Analytics 30d | `computeOverview()` | `adminAnalyticsStorage.js` |
| Branding | `getBranding(tenantId)` | `adminBrandingWidgetStorage.js` |
| Kupony | `loadCouponsConfigV1()` | `adminCouponStorage.js` |
| Pricing config | `loadPricingConfigV3()` | `adminPricingStorage.js` |

### Sdilene useMemo pro storage reads

`couponsConfig` a `currentBranding` jsou vypocteny jednou v sdilene useMemo
a sdileny mezi `systemAlerts`, `pendingActions` resp. `brandingTips`.
Zamezuje duplicitnim ctenim pri kazdem renderu.

```js
const couponsConfig = useMemo(() => loadCouponsConfigV1(), [refreshKey]);
const currentBranding = useMemo(() => getBranding(tenantId), [tenantId, refreshKey]);
```

### refreshKey

Vsechna data-useMemo zavisi na `refreshKey` (int, inkrementovany `handleRefresh()`).
Refresh se spousti automaticky po:
- Zavreni QuickOrderForm
- Zavreni DataImportWizard
- Kliknuti na tlacitko Refresh

---

## 3. Komponenty

| Komponenta | Soubor | Ucel |
|------------|--------|------|
| `AdminDashboard` | `AdminDashboard.jsx` | Hlavni komponenta |
| `SummaryCard` | inline | 4 klikatelne KPI karty nahore |
| `StatusBadge` | inline | Barevny badge pro stav objednavky |
| `StatusRow` | inline | Radek systemu status (indikator + popis) |
| `RevenueSparkline` | inline | SVG bar chart 7-denni trzby |
| `QuickSettings` | `components/QuickSettings.jsx` | Rychle nastaveni v sidebaru |
| `DataImportWizard` | `components/DataImportWizard.jsx` | Modal pro import dat |
| `QuickOrderForm` | `components/orders/QuickOrderForm.jsx` | Modal pro rychle vytvoreni objednavky |
| `OnboardingWizard` | `components/OnboardingWizard.jsx` | 5-krokovy setup pruvodce |

---

## 4. Navigace z dashboardu

| Akce | Cil |
|------|-----|
| Klik na summary kartu (trzby) | `/admin/analytics` |
| Klik na summary kartu (objednavky / cekajici / tisky) | `/admin/orders` |
| Klik na radek v tabulce objednavek | `/admin/orders/:id` |
| Klik na attention item | `/admin/orders/:id` |
| Klik na system alert | `alert.action` (viz definice) |
| Klik na branding tips link | `/admin/branding` |
| Quick links grid | viz `QUICK_LINKS` konstanta |

---

## 5. Onboarding

Onboarding banner se zobrazuje pokud `isOnboardingCompleted()` (z `OnboardingWizard.jsx`)
vraci `false`. Po dokonceni wizardu se `refreshKey` inkrementuje a banner zmizi.

---

## 6. Emptty states

| Sekce | Co se zobrazuje |
|-------|-----------------|
| Recent orders (zadne) | Ikona + text + tlacitko "Vytvorit prvni objednavku" |
| Recent activity (zadna) | Ikona Activity + popis co se zde zobrazi |
| Attention orders | Sekce se neskryva kdyz je prazdna -- zobrazuje se jen kdyz jsou data |
| Popular materials | Cela sekce se skryje kdyz `popularMaterials.length === 0` |
| System alerts | Cela sekce se skryje kdyz `systemAlerts.length === 0` |
| Pending actions | Cela sekce se skryje kdyz `pendingActions.total === 0` |

---

## 7. Styly

Vsechny styly jsou inline v komponentu jako `dashboardStyles` string
vlozen na konci pres `<style>{dashboardStyles}</style>`.

Tridy zacinaji prefixem `dash-`. Pouzivaji Forge CSS custom properties.

Responzivni breakpointy:
- `<=1024px`: sidebar jde nad main obsah
- `<=768px`: 2-sloupcovy grid karet, skryty modely a datum v tabulce
- `<=480px`: 1-sloupcovy grid karet

---

## 8. Zmeny

| Datum | Zmena |
|-------|-------|
| 2026-03-11/12 | Kompletni redesign -- actionable stats, real data, quick links, onboarding |
| 2026-03-13 | Fix: order row click naviguje na `/admin/orders/:id` misto `/admin/orders`; sdilene useMemo pro couponsConfig a currentBranding; lepsi empty state pro activity feed |
