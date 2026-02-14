# AdminDashboard -- Dokumentace

> Hlavni prehledova stranka admin panelu s konfigurovatelnym gridem KPI karet,
> drag & drop editaci, branding tips bannerem, recent activity sekci a quick stats.
> Dashboard je plne tenant-scoped a konfigurace se uklada pres storage helpery.

---

## 1. Prehled

AdminDashboard (`/admin`) je vstupni bod admin panelu. Poskytuje:

- **Konfigurovatelny KPI grid** -- drag & drop karty s metrikami (react-grid-layout)
- **Edit mode** -- pridavani, odebirani, zmena velikosti a barvy karet
- **Branding tips banner** -- doporuceni pro doplneni brandingu (logo, nazev, tagline)
- **Recent Activity sekce** -- poslednich 5 zaznamu z audit logu
- **Quick Stats sekce** -- 4 rychle statistiky (prumerna cena, cas, pozvanky, objednavky)
- **Persistentni konfigurace** -- layout, sekce a UI stav se ukladaji do localStorage
  pres tenant-scoped storage helper `adminDashboardStorage.js`
- **Metric registry** -- centralni registr 20+ KPI metrik definovanych v `dashboardMetricRegistry.js`

### Routing

V `src/Routes.jsx` je AdminDashboard registrovana jako default admin routa:

```jsx
<Route index element={<AdminDashboard />} />
```

Pristup: `/admin` (uvnitr admin layout wrapperu).

### Mody zobrazeni

Dashboard ma dva mody:

| Mod | Aktivace | Moznosti |
|-----|----------|----------|
| **View mode** | Vychozi stav | Zobrazeni karet, refresh dat |
| **Edit mode** | Tlacitko "Upravit dashboard" | Drag & drop, resize, pridavani/odebirani karet, nastaveni barev, toggle sekci, zmena poctu sloupcu |

Edit mode pouziva draft pattern -- zmeny se aplikuji na kopii konfigurace (`draftConfig`)
a teprve po kliknuti na "Ulozit" se zapisi do storage.

---

## 2. Technologie a jazyk

| Technologie | Verze | Pouziti |
|-------------|-------|---------|
| React | 19 | Funkcionalni komponenta, hooks |
| react-grid-layout | -- | Drag & drop grid s resize (`WidthProvider(GridLayout)`) |
| react-router-dom | v6 | `useNavigate` pro navigaci do Branding |
| Forge Design Tokens | -- | CSS custom properties pro barvy, fonty, rozmery |
| LanguageContext | -- | CS/EN preklady pres `useLanguage()` hook |
| AppIcon (lucide-react) | -- | Ikony v kartach, tlacitcich, modalech |
| ForgeCheckbox | -- | Toggle checkboxy v edit mode |

### Externi zavislosti

- `react-grid-layout` + `react-resizable` -- grid layout engine
- `react-grid-layout/css/styles.css` a `react-resizable/css/styles.css` -- zakladni styly

---

## 3. Architektura souboru

```
src/pages/admin/AdminDashboard.jsx           -- Hlavni komponenta (~1848 radku)
src/utils/adminDashboardStorage.js           -- Storage helper (load/save/reset konfigurace)
src/utils/dashboardMetricRegistry.js         -- Registr KPI metrik (20+ metrik, 9 kategorii)
```

AdminDashboard **nema** vlastni podslozku `components/dashboard/` -- vsechny subkomponenty
jsou definovane primo v souboru:

### Struktura komponenty

```
AdminDashboard (hlavni export)
  |-- RGL (WidthProvider(GridLayout))    -- react-grid-layout wrapper
  |-- stat-card (per KPI karta)          -- metrikova karta s ikonou, hodnotou, change
  |-- branding-banner                    -- tips banner (volitelne zobrazeny)
  |-- dashboard-edit-toggles             -- checkboxy pro toggle sekci (edit mode)
  |-- modal-overlay (Add Metric)         -- modal pro pridani nove metriky
  |-- SettingsModal (interni funkce)     -- modal pro nastaveni konkretni karty
  |-- activity-list                      -- posledni aktivita z audit logu
  |-- quick-stats-grid                   -- 4 rychle statistiky

SettingsModal (interni komponenta, ~233 radku)
  |-- titleOverride input                -- vlastni nazev karty
  |-- color picker + hex input           -- barva horniho okraje
  |-- bgColor picker + hex input         -- barva pozadi karty
  |-- locked checkbox (ForgeCheckbox)    -- zamknuti karty
  |-- size presets (1x1, 2x1, 1x2, 2x2) -- rychle velikosti
  |-- W/H selects                        -- presna sirka a vyska
  |-- days select (7/30/90)              -- casovy rozsah (jen pro metriky s supportsDays)

formatTime (helper funkce)
  |-- formatuje timestamp na HH:MM

labelByLang (helper funkce)
  |-- vybira jazykovou mutaci z objektu {cs, en}
```

### Helper funkce (top-level, mimo komponentu)

| Funkce | Ucel |
|--------|------|
| `isoDaysAgo(days)` | Vrati ISO datum `days` dnu zpet (cas 00:00:00) |
| `isoNowEnd()` | Vrati ISO datum dnesniho dne (cas 23:59:59) |
| `uid(prefix)` | Generuje unikatni ID (nahodne hex + timestamp) |
| `deepClone(obj)` | JSON parse/stringify klonovani |
| `formatValue({value, valueType, language})` | Formatuje cislo podle typu (currency, percent, grams, minutes) |

---

## 4. Import graf

```
AdminDashboard.jsx
  |-- react                    (useState, useEffect, useMemo, useRef)
  |-- react-grid-layout        (GridLayout, WidthProvider)
  |-- react-grid-layout/css/styles.css
  |-- react-resizable/css/styles.css
  |-- react-router-dom         (useNavigate)
  |-- @/components/AppIcon     (Icon)
  |-- @/components/ui/forge/ForgeCheckbox  (ForgeCheckbox)
  |-- @/contexts/LanguageContext (useLanguage)
  |
  |-- Storage helpery:
  |   |-- @/utils/adminAnalyticsStorage     (computeOverview)
  |   |-- @/utils/adminTeamAccessStorage    (getTeamSummary, getSeatLimit)
  |   |-- @/utils/adminOrdersStorage        (loadOrders)
  |   |-- @/utils/adminAuditLogStorage      (getAuditEntries)
  |   |-- @/utils/adminTenantStorage        (readTenantJson)
  |   |-- @/utils/adminDashboardStorage     (loadDashboardConfig, saveDashboardConfig, resetDashboardConfig)
  |   |-- @/utils/adminBrandingWidgetStorage (getBranding, getDefaultBranding, getPlanFeatures, getWidgets, getWidgetDomains)
  |
  |-- Metric registry:
      |-- @/utils/dashboardMetricRegistry   (DASHBOARD_CATEGORIES, DASHBOARD_METRICS, getMetricByKey)
```

### Reverzni graf (kdo importuje AdminDashboard)

```
src/Routes.jsx  -->  lazy(() => import('./pages/admin/AdminDashboard'))
                -->  <Route index element={<AdminDashboard />} />
```

---

## 5. Design a vizual (Forge compliance)

### Forge tokeny pouzite v AdminDashboard

| CSS Variable | Kde | Hodnota |
|-------------|-----|---------|
| `--forge-bg-void` | Pozadi stranky, inputy, quick-stat karty | `#0A0E17` |
| `--forge-bg-surface` | Stat-card, bannery, modaly, edit toggles | `#111827` |
| `--forge-bg-elevated` | Hover stavy, card-edit-controls | `#1E293B` |
| `--forge-border-default` | Ohraniceni vsech elementu | `#1E293B` |
| `--forge-text-primary` | Nadpisy, hodnoty, hlavni text | `#F1F5F9` |
| `--forge-text-secondary` | Sekundarni text, btn-secondary | `#94A3B8` |
| `--forge-text-muted` | Labely, timestampy, stat-change | `#64748B` |
| `--forge-accent-primary` | Primary buttony, hover border, accent prvky | `#00D4AA` |
| `--forge-font-heading` | Nadpis "Dashboard", section headingy, modal headingy | `Space Grotesk` |
| `--forge-font-tech` | Uppercase labely (stat-label, cols-label, quick-stat-label) | `Space Mono` |
| `--forge-font-mono` | Hodnoty (stat-value, quick-stat-value), timestampy | `JetBrains Mono` |
| `--forge-radius-md` | Zaobleni karet, tlacitek, inputu | `6px` |

### Font pouziti

| Element | Font token | Spravnost | Poznamka |
|---------|-----------|-----------|----------|
| "Dashboard" heading (28px) | `--forge-font-heading` | OK | Heading font pro velke nadpisy |
| Subtitle "Prehled a rychle statistiky" (13px, uppercase) | `--forge-font-tech` | OK | Tech font pro male uppercase labely |
| Stat label (11px, uppercase) | `--forge-font-tech` | OK | Tech font pro 12px- labels |
| Stat value (28px, clamp 20-34px) | `--forge-font-mono` | OK | Mono font pro cisla a hodnoty |
| Stat change (12px) | `--forge-font-mono` | OK | Mono font pro male ciselne zmeny |
| Quick stat label (10px, uppercase) | `--forge-font-tech` | OK | Tech font pro male uppercase labely |
| Quick stat value (18px) | `--forge-font-mono` | OK | Mono font pro cisla |
| Activity time (11px) | `--forge-font-mono` | OK | Mono font pro timestampy |
| Button text (13px) | `--forge-font-tech` | OK | Tech font pro button labely |
| Modal heading | `--forge-font-heading` | OK | Heading font pro modalni nadpisy |
| Modal input/select | `--forge-font-mono` | OK | Mono font pro formularove vstupy |

### KPI karta vizualni struktura

```
+---------------------------------------+
| 2px top border (accent barva)         |
| +---+ +-----------------------------+|
| |ICO| | STAT-LABEL (uppercase, 11px)||
| |56x| | STAT-VALUE (28px, bold)     ||
| |56 | | stat-change (12px, muted)   ||
| +---+ | [fee breakdown chips]       ||
|        +-----------------------------+|
+---------------------------------------+
```

V edit modu se v pravem hornim rohu zobrazuji ovladaci prvky:
`[grip] [lock/unlock] [settings] [trash]`

### Barvy akcentu KPI karet

Vychozi rotace: `#00D4AA` (teal), `#FF6B35` (orange), `#4DA8DA` (blue).
Kazda karta muze mit vlastni barvu nastavenou v SettingsModal.

### Responsivita

- Na `max-width: 640px` se header prepne na `flex-direction: column`
- Quick stats grid se zmeni z `1.2fr 1fr 0.8fr 1fr` na `1fr 1fr`
- KPI grid reaguje pres react-grid-layout `WidthProvider` (automaticky prepocet)
- Pro 6 sloupcu se zmensuje font stat-value a stat-icon (CSS `[data-kpi-cols="6"]`)

---

## 8. Data model

### 8.1 Dashboard konfigurace (localStorage)

Konfigurace se uklada pres `adminDashboardStorage.js` pod namespace `dashboard:v2`.

```javascript
{
  version: 2,
  grid: {
    cols: 3,           // Pocet sloupcu (2-6)
    rowHeight: 128,    // Vyska radku v px
    margin: [16, 16],  // Mezery [x, y] v px
  },
  cards: [
    {
      id: "card_calculations_30d",        // Unikatni ID
      metricKey: "analytics.calculations", // Klic z metric registry
      days: 30,                            // Casovy rozsah (7/30/90, jen pro supportsDays)
      color: "#2563EB",                    // Barva horniho okraje
      bgColor: "",                         // Barva pozadi (prazdne = default)
      titleOverride: "",                   // Vlastni nazev (prazdne = automaticky)
      locked: false,                       // Zamknuti (nelze presouvat/menit velikost)
      layout: { x: 0, y: 0, w: 1, h: 1 }, // Pozice a velikost v gridu
    },
    // ... dalsi karty
  ],
  sections: {
    activity: true,       // Zobrazit sekci "Posledni aktivita"
    quickStats: true,     // Zobrazit sekci "Rychle statistiky"
    brandingTips: true,   // Zobrazit branding banner
  },
  ui: {
    brandingBannerDismissed: false,  // Uzivatel zavre banner
  },
  _meta: {
    created_at: "2026-02-13T12:00:00Z",
    updated_at: "2026-02-13T12:05:00Z",
  },
}
```

### 8.2 Migrace V1 -> V2

`adminDashboardStorage.js` automaticky migruje starsí format `dashboard:v1`:
- V1 nemelo `grid` objekt ani `layout` na kartach
- Migrace priradi sekvencni layout (x = idx % cols, y = floor(idx / cols))
- Po migraci se zapise V2 do storage a V1 se ponecha (backward compat)

### 8.3 Metric registry (dashboardMetricRegistry.js)

Registry obsahuje 20+ metrik v 9 kategoriich:

| Kategorie | Metriky | Data zdroj |
|-----------|---------|------------|
| `analytics` | calculations, orders, conversion, avg_price, avg_time_min, avg_weight_g | `computeOverview()` z `adminAnalyticsStorage` |
| `orders` | total, new | `loadOrders()` z `adminOrdersStorage` |
| `team` | active_users, pending_invites | `getTeamSummary()`, `getSeatLimit()` z `adminTeamAccessStorage` |
| `pricing` | hourly_rate, material_count | Primo localStorage (pricing config) |
| `fees` | active_fees | Primo localStorage (fees config) |
| `parameters` | active_for_slicing | `readTenantJson('parameters:v1')` |
| `presets` | total, visible | `readTenantJson('presets:v1')` |
| `widget` | instances, domains | `getWidgets()`, `getWidgetDomains()` z `adminBrandingWidgetStorage` |
| `plan` | name | `getPlanFeatures()` z `adminBrandingWidgetStorage` |

Kazda metrika definuje:
- `key` -- unikatni identifikator (napr. `analytics.calculations`)
- `category` -- kategorie pro filtraci v Add Metric modalu
- `icon` -- nazev lucide ikony
- `defaultColor` -- vychozi barva akcentu
- `valueType` -- typ hodnoty (`number`, `currency`, `percent`, `minutes`, `grams`, `text`)
- `supportsDays` -- zda metrika podporuje casovy rozsah 7/30/90 dni
- `getLabel({language, days})` -- funkce vracejici lokalizovany nazev
- `compute(context, {days, language})` -- funkce vracejici `{value, change, subtext?}`

### 8.4 Default karty (pri prvnim nacteni)

| # | metricKey | Barva | Popis |
|---|-----------|-------|-------|
| 1 | `analytics.calculations` | `#2563EB` | Pocet kalkulaci (30d) |
| 2 | `orders.total` | `#10B981` | Celkem objednavek |
| 3 | `analytics.conversion` | `#F59E0B` | Konverzni pomer (30d) |
| 4 | `team.active_users` | `#8B5CF6` | Aktivni uzivatele |
| 5 | `pricing.hourly_rate` | `#EF4444` | Cena hodiny |
| 6 | `fees.active_fees` | `#14B8A6` | Aktivni poplatky |

### 8.5 Live data zdroje

Dashboard nacita data z vice storage helperu najednou. Vsechna data jsou memoizovana
pres `useMemo` a refreshuji se pres `refreshKey` state:

| Datovy zdroj | Storage helper | Namespace |
|-------------|---------------|-----------|
| Analytics (7/30/90d) | `adminAnalyticsStorage.computeOverview()` | `analytics:v1` |
| Team summary | `adminTeamAccessStorage.getTeamSummary()` | `team:v1` |
| Seat limit | `adminTeamAccessStorage.getSeatLimit()` | `team:v1` |
| Orders | `adminOrdersStorage.loadOrders()` | `orders:v1` |
| Parameters | `adminTenantStorage.readTenantJson('parameters:v1')` | `parameters:v1` |
| Presets | `adminTenantStorage.readTenantJson('presets:v1')` | `presets:v1` |
| Pricing config | Primo localStorage (fallback chain) | `modelpricer_pricing_config__*` |
| Fees config | Primo localStorage (fallback chain) | `modelpricer_fees_config__*` |
| Widgets | `adminBrandingWidgetStorage.getWidgets()` | branding tenant-scoped |
| Widget domains | `adminBrandingWidgetStorage.getWidgetDomains()` | branding tenant-scoped |
| Plan features | `adminBrandingWidgetStorage.getPlanFeatures()` | branding tenant-scoped |
| Branding tips | `adminBrandingWidgetStorage.getBranding()` | branding tenant-scoped |
| Audit log | `adminAuditLogStorage.getAuditEntries()` | `audit:v1` |

**Poznamka k Pricing a Fees:** Tyto dve metriky ctou primo z localStorage s fallback
chainem `[tenantId, test-customer-1, demo-tenant]`. To je historicky dusledek toho
ze AdminPricing uklada pod vlastnim klicem (`modelpricer_pricing_config__*`) mimo
tenant storage namespace. Viz sekce 17 (omezeni O1).

---

## 9. State management

### 9.1 Hlavni stavy

| State | Typ | Ucel |
|-------|-----|------|
| `refreshKey` | `number` | Inkrementace vynuti prepocet vsech memoizovanych dat |
| `dashboardConfig` | `object` | Ulozena konfigurace (view mode) |
| `draftConfig` | `object \| null` | Pracovni kopie (edit mode), `null` = view mode |
| `showAddModal` | `boolean` | Zobrazeni Add Metric modalu |
| `addSearch` | `string` | Vyhledavaci dotaz v Add Metric modalu |
| `addCategory` | `string` | Vybrany filtr kategorie (`'all'` nebo konkretni) |
| `settingsCardId` | `string \| null` | ID karty s otevrenym Settings modalem |

### 9.2 Derived stavy

| Promenna | Odvozeno z | Popis |
|----------|-----------|-------|
| `editing` | `!!draftConfig` | Zda je aktivni edit mode |
| `activeConfig` | `editing ? draftConfig : dashboardConfig` | Aktualni konfigurace pro rendering |
| `gridCols` | `activeConfig.grid.cols` | Pocet sloupcu gridu |
| `gridRowHeight` | `activeConfig.grid.rowHeight` | Vyska radku |
| `gridMargin` | `activeConfig.grid.margin` | Mezery gridu |

### 9.3 Memoizovane hodnoty (useMemo)

| Promenna | Zavislosti | Popis |
|----------|-----------|-------|
| `RGL` | `[]` (jednou) | `WidthProvider(GridLayout)` wrapper |
| `analyticsByDays` | `refreshKey` | Predpocitane analytics pro 7/30/90 dni |
| `teamSummary` | `refreshKey` | Souhrn tymu |
| `seatLimit` | `refreshKey` | Limit mist |
| `ordersSummary` | `refreshKey` | {newOrders, totalOrders} |
| `parametersSummary` | `refreshKey` | {activeCount, changedCount, widgetVisibleCount} |
| `presetsList` | `refreshKey` | Pole presetu |
| `pricingData` | `refreshKey` | {hourlyRate, materialCount, totalMaterials} |
| `feesData` | `refreshKey` | {totalActive, breakdown} |
| `widgetsList` | `refreshKey` | Pole widgetu |
| `widgetDomains` | `refreshKey` | Pole domen |
| `planFeatures` | `refreshKey` | Plan features objekt |
| `brandingTips` | `refreshKey, language` | Pole doporuceni (max 3) |
| `recentActivity` | `refreshKey` | 5 poslednich audit zaznamu |
| `metricContext` | Vsech 12 datovych zdroju + language | Kontext predavany do `metric.compute()` |
| `filteredMetrics` | `addSearch, addCategory, language` | Filtrovane metriky pro Add Metric modal |

### 9.4 Akce a handlery

| Handler | Co dela | Podminky |
|---------|---------|----------|
| `handleRefresh()` | Inkrementuje `refreshKey` (prepocet vsech dat) | Vzdy |
| `startEdit()` | Vytvori deep clone konfigurace jako draft | Vzdy |
| `cancelEdit()` | Zahodi draft, vrati view mode | Vzdy |
| `saveEdit()` | Ulozi draft do storage, nastavi jako hlavni config | V edit mode |
| `resetToDefault()` | Resetuje na defaultni konfiguraci | Vzdy |
| `moveCard(index, delta)` | Presune kartu v poradi | V edit mode |
| `toggleLockCard(id)` | Prepne zamknuti karty | V edit mode |
| `removeCard(id)` | Odebere kartu z gridu | V edit mode |
| `addMetricCard(metricKey)` | Prida novou kartu s metrikou | V edit mode (nebo zapne edit) |
| `openSettings(id)` | Otevre SettingsModal pro kartu | V edit mode (nebo zapne edit) |
| `closeSettings()` | Zavre SettingsModal | Vzdy |
| `updateCard(id, patch)` | Aktualizuje vlastnosti karty | V edit mode |
| `dismissBrandingBanner()` | Skryje branding banner (persistentne) | Vzdy |
| `toggleSection(key)` | Prepne zobrazeni sekce (activity/quickStats/brandingTips) | V edit mode |
| `setDashboardCols(cols)` | Zmeni pocet sloupcu a prepocita layout | V edit mode |
| `commitRglLayout(layoutArr)` | Synchronizuje react-grid-layout pozice do draftu | V edit mode |

### 9.5 useEffect -- scroll containment

Dva nezavisle useEffect handlery (jeden pro Add Metric modal, druhy pro SettingsModal)
implementuji custom smooth scroll s exponentialnim easing (faktor 0.18):

1. Pri otevreni modalu: `document.body.style.overflow = 'hidden'`
2. Zachytava `wheel` event na overlay (`passive: false`)
3. Animuje scroll pres `requestAnimationFrame` loop
4. Cleanup: odebere event listener, cancellne RAF, obnovi body overflow

---

## 11. Preklady (i18n)

**STAV: IMPLEMENTOVANO (inline CS/EN)**

Dashboard pouziva `useLanguage()` hook a vsechny texty jsou lokalizovane
inline ternary operatorem `language === 'cs' ? '...' : '...'`.

### Prehlad prelozenych textu

| Klic / Kontext | CS | EN |
|---------------|----|----|
| Hlavni nadpis | "Dashboard" | "Dashboard" |
| Podnadpis | "Prehled a rychle statistiky" | "Overview and quick stats" |
| Edit button | "Upravit dashboard" | "Edit dashboard" |
| Refresh button | "Obnovit" | "Refresh" |
| Add KPI button | "Pridat ukazatel" | "Add KPI" |
| Reset button | "Reset" | "Reset" |
| Cancel button | "Zrusit" | "Cancel" |
| Save button | "Ulozit" | "Save" |
| Columns label | "Sloupce" | "Columns" |
| Branding banner title | "Doporuceni: dokonci Branding" | "Tip: finish Branding" |
| Open Branding button | "Otevrit Branding" | "Open Branding" |
| Section toggle: activity | "Sekce aktivita" | "Activity section" |
| Section toggle: quickStats | "Rychle statistiky" | "Quick stats" |
| Section toggle: brandingTips | "Branding doporuceni" | "Branding tips" |
| Activity heading | "Posledni aktivita" | "Recent Activity" |
| No activity | "Zadna aktivita" | "No activity" |
| Quick stats heading | "Rychle statistiky" | "Quick Stats" |
| Quick stat: avg price | "Prumerna cena (30d)" | "Avg Price (30d)" |
| Quick stat: avg time | "Prumerny cas (30d)" | "Avg Time (30d)" |
| Quick stat: pending | "Pending pozvanek" | "Pending Invites" |
| Quick stat: new orders | "Nove objednavky" | "New Orders" |
| Add Metric modal: heading | "Pridat ukazatel" | "Add KPI" |
| Add Metric modal: search | "Hledat..." | "Search..." |
| Add Metric modal: all | "Vse" | "All" |
| Settings modal: heading | "Nastaveni ukazatele" | "KPI Settings" |
| Settings: custom title | "Vlastni nazev (volitelne)" | "Custom title (optional)" |
| Settings: color | "Barva" | "Color" |
| Settings: bg color | "Pozadi karty" | "Card background" |
| Settings: lock | "Zamknout kartu..." | "Lock card..." |
| Settings: card size | "Velikost karty" | "Card size" |
| Settings: width | "Sirka" | "W" |
| Settings: height | "Vyska" | "H" |
| Settings: time range | "Casovy rozsah" | "Time range" |
| Settings: days options | "7/30/90 dni" | "7/30/90 days" |
| Settings: clear bg | "Vycistit" | "Clear" |
| Settings: auto placeholder | "Nechat automaticky" | "Leave automatic" |
| Settings: done | "Hotovo" | "Done" |
| Drag handle tooltip | "Pretahnout" | "Drag" |
| Lock tooltip | "Zamknout"/"Odemknout" | "Lock"/"Unlock" |
| Settings tooltip | "Nastaveni" | "Settings" |
| Remove tooltip | "Odebrat" | "Remove" |
| Settings: resize tip | "Tip: velikost muzes zmenit..." | "Tip: you can also resize..." |

### Branding tips texty (dynamicke)

| Podminka | CS | EN |
|----------|----|----|
| Chybi logo | "Pridej logo (zlepsi duveryhodnost widgetu)." | "Add a logo (improves trust)." |
| Default businessName | "Nastav nazev firmy v Brandingu." | "Set your business name in Branding." |
| Default tagline | "Dopln tagline (kratky popis)." | "Add a tagline (short description)." |

### Metriky -- lokalizace

Kazda metrika v `dashboardMetricRegistry.js` ma vlastni `getLabel()` funkci
s CS/EN prekladem. Priklady:

| metricKey | CS | EN |
|-----------|----|----|
| `analytics.calculations` | "Kalkulace (30d)" | "Calculations (30d)" |
| `orders.total` | "Objednavky celkem" | "Total Orders" |
| `team.active_users` | "Aktivni uzivatele" | "Active Users" |
| `pricing.hourly_rate` | "Cena hodiny" | "Hourly Rate" |
| `fees.active_fees` | "Aktivni poplatky" | "Active Fees" |

### Formatovani hodnot

Funkce `formatValue()` respektuje jazyk:

| valueType | CS format | EN format |
|-----------|-----------|-----------|
| `currency` | `cs-CZ` Intl + " Kc" | `en-US` Intl + " Kc" |
| `percent` | "XX.X%" | "XX.X%" |
| `minutes` | "XX.X min" | "XX.X min" |
| `grams` | `cs-CZ` Intl + " g" | `en-US` Intl + " g" |
| `number` | `cs-CZ` Intl | `en-US` Intl |
| `text` | String(value) | String(value) |

---

## 12. Pristupnost

### Soucasny stav

| Kriteria | Stav | Poznamka |
|----------|------|----------|
| Semanticky HTML | CASTECNE | `<h1>` pro nadpis, `<h3>` pro sekce, ale KPI karty jsou `<div>` |
| ARIA atributy | CASTECNE | `aria-label="Dismiss"` na banner close, ale modaly nemaji `role="dialog"` |
| Kontrast (WCAG AA) | OK | Forge tokeny splnuji WCAG AA |
| Fokus management | CASTECNE | Modaly nemaji focus trap, ale buttony jsou standardni `<button>` |
| Document title | CHYBI | Dashboard nemeni `<title>` |
| Keyboard support | CASTECNE | Modaly zaviratelne klikem na overlay ale bez Escape handleru |
| Drag & drop a11y | SLABE | react-grid-layout nema ARIA roles pro drag & drop |
| Screen reader | SLABE | KPI karty nemaji `role="group"` ani aria-label |

### Doporuceni pro zlepseni

1. **Pridat `role="dialog"` a `aria-modal="true"`** na oba modaly (Add Metric, Settings)
2. **Pridat focus trap** do modalu -- fokus by mel zustat uvnitr modalu po otevreni
3. **Pridat Escape handler** pro zavreni modalu klavesou
4. **Pridat `role="group"` a `aria-label`** na kazdy stat-card
5. **Pridat `aria-live="polite"`** na stat-value pro dynamicke zmeny hodnot
6. **Pridat document.title** -- napr. "Dashboard | ModelPricer Admin"

---

## 16. Souvisejici dokumenty

| Dokument / Soubor | Cesta | Relevance |
|-------------------|-------|-----------|
| AdminDashboard.jsx | `Model_Pricer-V2-main/src/pages/admin/AdminDashboard.jsx` | Hlavni soubor (1848 radku) |
| adminDashboardStorage.js | `Model_Pricer-V2-main/src/utils/adminDashboardStorage.js` | Load/save/reset konfigurace (252 radku) |
| dashboardMetricRegistry.js | `Model_Pricer-V2-main/src/utils/dashboardMetricRegistry.js` | Registr 20+ KPI metrik (323 radku) |
| adminTenantStorage.js | `Model_Pricer-V2-main/src/utils/adminTenantStorage.js` | Tenant-scoped read/write |
| adminAnalyticsStorage.js | `Model_Pricer-V2-main/src/utils/adminAnalyticsStorage.js` | computeOverview() |
| adminTeamAccessStorage.js | `Model_Pricer-V2-main/src/utils/adminTeamAccessStorage.js` | Team summary, seat limit |
| adminOrdersStorage.js | `Model_Pricer-V2-main/src/utils/adminOrdersStorage.js` | loadOrders() |
| adminAuditLogStorage.js | `Model_Pricer-V2-main/src/utils/adminAuditLogStorage.js` | getAuditEntries() |
| adminBrandingWidgetStorage.js | `Model_Pricer-V2-main/src/utils/adminBrandingWidgetStorage.js` | Branding, widgets, domains, plan |
| ForgeCheckbox.jsx | `Model_Pricer-V2-main/src/components/ui/forge/ForgeCheckbox.jsx` | Toggle checkboxy v edit mode |
| AppIcon.jsx | `Model_Pricer-V2-main/src/components/AppIcon.jsx` | Lucide ikony |
| LanguageContext.jsx | `Model_Pricer-V2-main/src/contexts/LanguageContext.jsx` | i18n slovnik |
| Routes.jsx | `Model_Pricer-V2-main/src/Routes.jsx` | Registrace routy `/admin` |
| forge-tokens.css | `Model_Pricer-V2-main/src/styles/forge-tokens.css` | Designove tokeny |
| MEMORY.md | `.claude/projects/.../memory/MEMORY.md` | Forge font pravidla, hot spots |

---

## 17. Zname omezeni

### O1: Pricing a Fees data ctene primo z localStorage

- **Kde:** `AdminDashboard.jsx:186-298` (useMemo bloky `pricingData` a `feesData`)
- **Popis:** Metriky `pricing.hourly_rate`, `pricing.material_count` a `fees.active_fees`
  ctou data primo z localStorage s manualni fallback chain
  `[tenantId, test-customer-1, demo-tenant]` a manualni JSON parsovani. Toto obchazi
  standardni `readTenantJson()` helper a porušuje invariant #4 z CLAUDE.md
  ("Jeden zdroj pravdy -- pricing/fees cti pres tenant storage helpery").
- **Dopad:** Pokud se zmeni format storage klicu v AdminPricing nebo AdminFees,
  dashboard se neaktualizuje. Udrzba dvou parsovacich logik.
- **Doporuceni:** Refaktorovat na `readTenantJson('pricing:v3')` a `readTenantJson('fees:v3')`,
  pripadne pridat dedicated helper funkce do prislusnych storage souboru.

### O2: Branding tenant ID hardcoded

- **Kde:** `AdminDashboard.jsx:143`
- **Popis:** Konstanta `BRANDING_TENANT_ID = 'test-customer-1'` je pouzita pro vsechna
  branding/widget API volani. Misto toho by se melo pouzit `getTenantId()`.
- **Dopad:** Dashboard vzdy cte branding data pro `test-customer-1`, nikoliv pro
  aktualne zvoleneho tenanta.
- **Doporuceni:** Nahradit za `getTenantId()` import z `adminTenantStorage.js`.

### O3: Modaly bez focus trap a Escape handleru

- **Kde:** `AdminDashboard.jsx:908-963` (Add Metric modal), `1604-1837` (SettingsModal)
- **Popis:** Oba modaly (Add Metric a Settings) se zaviraji klikem na overlay
  (`onMouseDown`), ale nemaji Escape key handler ani focus trap. Uzivatel s klavesnici
  nemuze zavrit modal bez mysi.
- **Dopad:** Pristupnost (WCAG 2.1.1 Keyboard). Fokus muze uniknout z modalu
  pri Tab navigaci.
- **Doporuceni:** Pridat `useEffect` s `keydown` handlerem pro Escape a implementovat
  focus trap (napr. pres `react-focus-lock` nebo manualni `tabIndex` management).

### O4: SettingsModal definovan mimo hlavni export

- **Kde:** `AdminDashboard.jsx:1604-1837`
- **Popis:** `SettingsModal` je definovan jako bezna funkce (ne React.memo) na konci
  souboru, mimo hlavni komponentu. Je predavan `language`, `gridCols`, `card`, `metric`,
  `onClose`, `onChange` jako props. Jelikoz neni memoizovan a parent se re-renderuje
  pri kazde zmene draftu, modal se zbytecne re-renderuje.
- **Dopad:** Maly performance impact (modal je jednoduchy formular).
- **Doporuceni:** Extrahovat do `src/pages/admin/components/dashboard/SettingsModal.jsx`
  a obalit `React.memo()`.

### O5: Duplicitni setDashboardCols a setGridCols

- **Kde:** `AdminDashboard.jsx:481-490` (`setDashboardCols`) a `529-538` (`setGridCols`)
- **Popis:** Obe funkce delaji prakticky to same -- mensi pocet sloupcu, repackuji
  karty a updatuji draft. `setGridCols` se vsak nikde nepouziva v JSX.
- **Dopad:** Mrtvy kod, potencialni zmateni pri udrzbe.
- **Doporuceni:** Odstranit jednu z duplicitnich funkci (preferovane `setGridCols`).

### O6: Soubor ma 1848 radku (monoliticky)

- **Kde:** `AdminDashboard.jsx`
- **Popis:** Hlavni soubor obsahuje hlavni komponentu (~650 radku logiky),
  SettingsModal (~233 radku), helper funkce (~77 radku), a ~600 radku inline `<style>`.
- **Dopad:** Obtizna navigace a udrzba.
- **Doporuceni:** Extrahovat:
  1. `SettingsModal` -> `components/dashboard/SettingsModal.jsx`
  2. Helper funkce -> `utils/dashboardHelpers.js`
  3. Inline `<style>` -> `styles/admin-dashboard.css` nebo CSS module

### O7: Scroll containment duplicitni implementace

- **Kde:** `AdminDashboard.jsx:102-140` (Add Metric modal) a `1606-1646` (SettingsModal)
- **Popis:** Identicky smooth scroll useEffect (30+ radku) je zkopirovany dvakrat --
  jednou pro Add Metric modal v hlavni komponente a jednou v SettingsModal.
- **Dopad:** Duplikace kodu, nasobene udrzba.
- **Doporuceni:** Extrahovat do sdileneho hooku `useModalScrollContainment(overlayRef, isOpen)`.

### O8: Quick Stats nepouzivaji metric registry

- **Kde:** `AdminDashboard.jsx:878-905`
- **Popis:** Quick Stats sekce ma 4 hardcoded statistiky (avg price, avg time,
  pending invites, new orders) s primym pristupem k datum. Tyto metriky existuji
  i v metric registry ale Quick Stats je nepouziva.
- **Dopad:** Nekonzistence -- KPI karty pouzivaji registry, Quick Stats ne.
- **Doporuceni:** Bud prevest Quick Stats na konfigurovatelne karty z registry,
  nebo ponechat jako staticke (ale zdokumentovat duvod).

### O9: Inline CSS (~600 radku) ve style tagu

- **Kde:** `AdminDashboard.jsx:977-1599`
- **Popis:** Vsechny styly jsou ve `<style>` tagu uvnitr JSX. Styly se re-insertuji
  pri kazdem renderovani komponenty (React neoptimalizuje inline style tagy).
- **Dopad:** Maly performance impact, ale zhorsuje citlivost souboru a IDE navigaci.
- **Doporuceni:** Presunout do externiho CSS souboru
  (napr. `src/styles/admin-dashboard.css`) a importovat.

---

*Posledni aktualizace: 2026-02-13*
*Autor: mp-mid-frontend-admin agent*
