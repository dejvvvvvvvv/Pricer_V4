# Plan: Admin Analytics — Realna data + Drag & Drop grafy

**Status:** READY TO IMPLEMENT
**Datum:** 2026-03-15
**Slozitost:** VYSOKA (4-6 hodin kvuli drag & drop systemu)
**Predchozi session:** Demo data uz odstranena (Faze 1 hotova)

---

## Kontext

AdminAnalytics (`src/pages/admin/AdminAnalytics.jsx`, 1877 radku, 7 tabu, 6 grafu)
aktualne kombinuje realna data z objednavek s analytics events z widget/kalkulacky.
Demo seeding/demo badge logika byla jiz odstranena v predchozi session (Faze 1).

Cil: pouzivat VYHRADNE realna tenant-scoped data, pridat customizovatelny grid
grafu s drag & drop, prepsat Orders tab na analyticky pohled z realnych objednavek.

---

## Co je uz hotovo (Faze 1 — dokonceno 2026-03-15)

- [x] `ensureDemoAnalyticsSeeded()` smazana z `adminAnalyticsStorage.js`
- [x] 7 `generateDemo*()` funkci smazano z `AnalyticsCharts.jsx`
- [x] DEMO badge logika odstranena
- [x] Prazdne grafy ukazuji empty state
- [x] Build prochazi

---

## Odpovedi uzivatele na otazky

| Otazka | Odpoved |
|--------|---------|
| Reset tlacitko | Uplne odstranit. Demo data kompletne smazat. Jen realna data. |
| Tab Orders | Varianta A — realne objednavky, ale zamerene na analytiku (ne jen seznam) |
| Grafy | Drag & drop system pro presunuti, zmenu velikosti a pridavani/odebirani (jako dashboard) |
| Top zakaznici | Identifikace podle emailu |
| Summary karty | Period selector (uz funguje) + maly "dnes" highlight nezavisle na vybranem obdobi |
| Scope | Muze upravit i backend/tracking/zalozky, ALE overit ze zmeny nezpusobi chyby jinde |

---

## Datove zdroje (vsechny tenant-scoped)

### Primarni

1. **Orders** (`orders:v1` v `adminOrdersStorage.js`)
   - Existujici: `loadOrders()`, `computeOrderTotals()`, `extractOrderMaterials()`
   - Fieldy: `status`, `created_at`/`createdAt`, `customer_snapshot.email/name`,
     `models[].material_snapshot`, `models[].slicer_snapshot`, `totals_snapshot`
   - Uz pouzivano v `computeOrderMetrics()` (radky 161-301 AdminAnalytics.jsx)

2. **Analytics Events** (`analytics:events` v `adminAnalyticsStorage.js`)
   - Widget/kalkulacka tracking: WIDGET_VIEW, MODEL_UPLOAD, SLICING, PRICE_SHOWN, ADD_TO_CART, ORDER_CREATED
   - Existujici: `getAnalyticsSessions()`, `computeOverview()`, `filterSessionsByRange()`
   - Pouzivano pro funnel, calculations tab, lost tab

### Sekundarni (volitelne rozsireni)

3. **Invoices** (`invoices:v1`) — pro revenue breakdown
4. **Print Queue** (`print-queue:v1`, `print-stats:v1`) — pro produkci
5. **Coupons** (`coupons:v1`) — pro kupon analytics
6. **Activity Log** (`activityLog`) — pro admin akce

---

## Existujici stav klicovych souboru

| Soubor | Radku | Stav |
|--------|-------|------|
| `src/pages/admin/AdminAnalytics.jsx` | ~1877 | Hlavni komponenta, 7 tabu, summary karty, period selector |
| `src/pages/admin/components/AnalyticsCharts.jsx` | ~700 | 6 grafu (Revenue, Status, Materials, AOV, PrintTime, Funnel) |
| `src/utils/adminAnalyticsStorage.js` | ~330 | Analytics events, sessions, overview, CSV export |
| `src/utils/adminOrdersStorage.js` | ~140+ | Orders CRUD, computeOrderTotals, extractOrderMaterials |
| `src/utils/adminDashboardStorage.js` | ~80+ | Existujici react-grid-layout patterns (precedent) |

### Jiz nainstalovane zavislosti (v package.json)

- `react-grid-layout` ^1.4.4 — UZ NAINSTALOVAN, neni treba pridavat
- `react-resizable` ^3.0.5 — UZ NAINSTALOVAN
- `@dnd-kit/core` ^6.3.1 — alternativa, ale react-grid-layout je vhodnejsi pro grafy
- `recharts` ^2.15.2 — vsechny existujici grafy

---

## Implementacni kroky

### Faze 2: Drag & Drop Grid System pro grafy [PRACOVNI]
**Odhad:** 90-120 min

#### 2.1 Knihovna

Pouzit `react-grid-layout` (MIT, uz nainstalovano v projektu).
`adminDashboardStorage.js` uz pouziva stejny pattern — konzistentni pristup.

> **DULEZITE:** Projekt pouziva `react-grid-layout` v1.4.4. Context7 docs ukazuji
> novejsi API (`useContainerWidth`, `gridConfig`, `dragConfig`). Verze 1.4.4 pouziva
> starsi API s `WidthProvider` a prima `cols`/`rowHeight` props. Implementace MUSI
> pouzivat API kompatibilni s nainstalovanou verzi.
>
> Verze 1.4.4 API:
> ```jsx
> import { Responsive, WidthProvider } from 'react-grid-layout';
> const ResponsiveGridLayout = WidthProvider(Responsive);
> // Props: layouts, breakpoints, cols, rowHeight, onLayoutChange, isDraggable, isResizable
> ```

#### 2.2 Nova komponenta: `AnalyticsDashboardGrid.jsx`

Vytvorit v `src/pages/admin/components/AnalyticsDashboardGrid.jsx`

**Funkcionalita:**
- Grid layout s kartami (kazdy graf = jedna karta)
- Drag & drop presunuti karet (drag handle v headeru karty)
- Resize karet (male/stredni/velke)
- Pridavani/odebirani grafů pres menu
- Edit mode toggle (behem normalniho prohlizeni je grid staticky)
- Persist layout do localStorage pres tenant storage
- Default layout pro nove uzivatele

**Props vstupni data:**
```jsx
// Vsechna data predana jako props z AdminAnalytics (kde se pocitaji)
<AnalyticsDashboardGrid
  orderMetrics={orderMetrics}  // z computeOrderMetrics()
  sessions={sessions}          // z getAnalyticsSessions()
  cs={cs}                      // jazyk
  hasOrders={hasOrders}
/>
```

#### 2.3 Katalog dostupnych grafu

Kazdy graf registrovany v katalogu s metadata:

```javascript
const CHART_CATALOG = [
  // Existujici grafy (uz v AnalyticsCharts.jsx)
  { id: 'revenue-trend',     name: { cs: 'Trzby v case', en: 'Revenue Over Time' },
    component: RevenueTrendChart,  defaultSize: { w: 6, h: 2 }, category: 'revenue' },
  { id: 'orders-by-status',  name: { cs: 'Objednavky podle stavu', en: 'Orders by Status' },
    component: OrdersByStatusChart, defaultSize: { w: 6, h: 2 }, category: 'orders' },
  { id: 'top-materials',     name: { cs: 'Top materialy', en: 'Top Materials' },
    component: TopMaterialsBarChart, defaultSize: { w: 6, h: 2 }, category: 'materials' },
  { id: 'aov-trend',         name: { cs: 'Prumerna hodnota objednavky', en: 'Avg Order Value' },
    component: AOVChart,         defaultSize: { w: 6, h: 2 }, category: 'revenue' },
  { id: 'print-time-dist',   name: { cs: 'Rozlozeni casu tisku', en: 'Print Time Distribution' },
    component: PrintTimeChart,   defaultSize: { w: 6, h: 2 }, category: 'production' },
  { id: 'conversion-funnel', name: { cs: 'Konverzni trychtyr', en: 'Conversion Funnel' },
    component: ConversionFunnelChart, defaultSize: { w: 6, h: 2 }, category: 'conversion' },

  // Nove grafy (Faze 3)
  { id: 'orders-over-time',    name: { cs: 'Objednavky v case', en: 'Orders Over Time' },
    component: OrdersOverTimeChart,    defaultSize: { w: 6, h: 2 }, category: 'orders' },
  { id: 'top-customers',       name: { cs: 'Top zakaznici', en: 'Top Customers' },
    component: TopCustomersChart,      defaultSize: { w: 6, h: 2 }, category: 'customers' },
  { id: 'revenue-by-material', name: { cs: 'Trzby podle materialu', en: 'Revenue by Material' },
    component: RevenueByMaterialChart, defaultSize: { w: 6, h: 2 }, category: 'materials' },
  { id: 'top-models',          name: { cs: 'Top modely', en: 'Top Models' },
    component: TopModelsChart,         defaultSize: { w: 6, h: 2 }, category: 'models' },
];
```

#### 2.4 UI pro spravu grafu

- Tlacitko **"Upravit dashboard"** v headeru Charts tabu → prepne do edit modu
- V edit modu:
  - Viditelne drag handles (six-dot ikona v headeru kazdej karty)
  - Resize handles (pravy dolni roh)
  - "X" tlacitko pro odebirani grafu
  - Barevne oramovani signalizujici edit mod
- Panel **"Pridat graf"** → dropdown/modal s katalogem (filtr podle kategorie)
- Tlacitko **"Obnovit vychozi"** → reset na default layout
- Tlacitko **"Hotovo"** → ulozi a prepne zpet do view modu
- Keyboard: Escape ukonci edit mod

#### 2.5 Layout persistence

```javascript
// Storage: pres adminTenantStorage
// Namespace: analytics:dashboard-layout

import { readTenantJson, writeTenantJson } from '@/utils/adminTenantStorage';

const LAYOUT_NS = 'analytics:dashboard-layout';

// Format:
{
  version: 1,
  activeCharts: ['revenue-trend', 'orders-by-status', 'top-materials', 'aov-trend', 'conversion-funnel', 'orders-over-time'],
  layouts: {
    lg: [
      { i: 'revenue-trend', x: 0, y: 0, w: 6, h: 2 },
      { i: 'orders-by-status', x: 6, y: 0, w: 6, h: 2 },
      // ...
    ],
    md: [...],
    sm: [...]
  }
}
```

#### 2.6 Existujici chart komponenty — refaktoring

Existujici charty v `AnalyticsCharts.jsx` (RevenueTrendChart, OrdersByStatusChart, atd.)
se NEMAZOU ale exportuji jako named exports aby je grid mohl pouzit:

```javascript
// AnalyticsCharts.jsx — ZMENA: pridat named exports pro jednotlive charty
export { RevenueTrendChart, OrdersByStatusChart, TopMaterialsBarChart, AOVChart, PrintTimeChart, ConversionFunnelChart };

// Default export ZUSTAVNE pro zpetnou kompatibilitu (pouziva se v charts tabu pokud neni grid)
export default function AnalyticsCharts({ ... }) { ... }
```

**Alternativa:** Pokud je to cistejsi, presunout chart komponenty do samostatnych
souboru v `src/pages/admin/components/charts/`. Rozhodnuti na implementerovi —
ale NESMIE se rozbil existujici import v AdminAnalytics.jsx.

---

### Faze 2K: KONTROLNI (4 kroky) [KONTROLNI]

1. Ulozeni historie (pred testovanim)
2. Testovani v Chrome — drag & drop funguje, layout se uklada
3. Ulozeni historie (po testovani)
4. `/compact`

---

### Faze 3: Nove grafy a rozsireni metrik [PRACOVNI]
**Odhad:** 60 min

#### 3.1 Novy graf: Orders Over Time (Line Chart)

- X osa: datum (denni/tydenni dle periodu)
- Y osa: pocet objednavek
- Data z `orderMetrics.dailyOrders` (uz se pocita v computeOrderMetrics, radek 200)
- Potreba: pridat do `computeOrderMetrics()` vystupni pole `ordersOverTime`:
  ```javascript
  const ordersOverTime = Object.entries(dailyOrders)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({
      date,
      label: formatShortDate(date),
      orders: count,
    }));
  ```
- Barva: `var(--forge-accent-primary)` (#00D4AA)
- Pouzit `LineChart` z recharts (uz importovany v AnalyticsCharts.jsx)

#### 3.2 Novy graf: Top Customers (Horizontal Bar Chart)

- Top 10 zakazniku podle celkovych trzeb
- Identifikace podle emailu:
  ```javascript
  const email = order.customer_snapshot?.email || order.customer?.email || 'unknown';
  ```
- Zobrazit: email (zkraceny na 20 znaku) + celkova castka + pocet objednavek
- Barva: gradient teal
- Potreba: pridat do `computeOrderMetrics()`:
  ```javascript
  // Top customers by email
  const customerMap = {};
  for (const order of filtered) {
    const email = order.customer_snapshot?.email || order.customer?.email || 'unknown';
    if (!customerMap[email]) customerMap[email] = { email, revenue: 0, orders: 0 };
    customerMap[email].revenue += totals.total || 0;
    customerMap[email].orders += 1;
  }
  const topCustomers = Object.values(customerMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
  ```

#### 3.3 Novy graf: Top Models (Bar Chart)

- Top 10 modelu podle poctu objednani
- Data z `order.models[].file_name` nebo `order.models[].name`
- Zobrazit: nazev souboru (zkraceny) + pocet objednani
- Potreba: pridat do `computeOrderMetrics()`:
  ```javascript
  const modelMap = {};
  for (const order of filtered) {
    for (const m of order.models || []) {
      const name = m.file_name || m.name || m.fileName || 'unknown';
      modelMap[name] = (modelMap[name] || 0) + (Number(m.quantity) || 1);
    }
  }
  const topModels = Object.entries(modelMap)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));
  ```

#### 3.4 Novy graf: Revenue by Material (Pie/Donut Chart)

- Trzby rozdelene podle materialu
- Data: pro kazdy material secteme revenue z objednavek kde se pouzil
- Zobrazit: nazev materialu + castka + podil (%)
- Potreba: pridat do `computeOrderMetrics()`:
  ```javascript
  const materialRevenue = {};
  for (const order of filtered) {
    for (const m of order.models || []) {
      const matName = m.material_snapshot?.name || 'unknown';
      const qty = Number(m.quantity) || 1;
      const price = Number(m.price_breakdown_snapshot?.model_total || m.totalPrice || m.price || 0);
      materialRevenue[matName] = (materialRevenue[matName] || 0) + (price * qty);
    }
  }
  const revenueByMaterial = Object.entries(materialRevenue)
    .sort(([,a], [,b]) => b - a)
    .map(([name, revenue]) => ({ name, revenue: Math.round(revenue) }));
  ```

#### 3.5 Rozsireni `computeOrderMetrics()` — souhrn novych poli

Do existujici `computeOrderMetrics()` funkce (radky 161-301 v AdminAnalytics.jsx) pridat:

| Nove pole | Popis |
|-----------|-------|
| `ordersOverTime` | Pole `{ date, label, orders }` |
| `topCustomers` | Pole `{ email, revenue, orders }` (top 10) |
| `topModels` | Pole `{ name, count }` (top 10) |
| `revenueByMaterial` | Pole `{ name, revenue }` |
| `todayRevenue` | Cislo — trzby za dnes (pro summary highlight) |
| `todayOrders` | Cislo — pocet objednavek dnes |

```javascript
// Today metrics (nezavisle na period selectoru)
const todayStart = new Date();
todayStart.setHours(0, 0, 0, 0);
const todayFiltered = orders.filter(o => {
  const created = new Date(o.created_at || o.createdAt || '');
  return created >= todayStart;
});
let todayRevenue = 0;
for (const order of todayFiltered) {
  todayRevenue += computeOrderTotals(order).total || 0;
}
const todayOrders = todayFiltered.length;
```

---

### Faze 3K: KONTROLNI (4 kroky) [KONTROLNI]

---

### Faze 4: Tab "Orders" — analyticky pohled [PRACOVNI]
**Odhad:** 30 min

Prepsat tab "Orders" z analytics-event-based na order-based s analytickym zamerenim.

**Aktualni stav (radky 853-874):** 3 stat karty z `overview.metrics` (analytics events)
+ note card. Velmi chude.

#### 4.1 Stat karty (3 karty) — z realnych objednavek

```jsx
// NAHRADIT overview.metrics za orderMetrics
<div className="aa-stat-card">
  <div className="aa-stat-label">{ui.totalRevenue}</div>
  <div className="aa-stat-value">{formatKc(orderMetrics.totalRevenue)}</div>
</div>
<div className="aa-stat-card">
  <div className="aa-stat-label">{ui.totalOrders}</div>
  <div className="aa-stat-value">{formatNumber(orderMetrics.totalOrders)}</div>
</div>
<div className="aa-stat-card">
  <div className="aa-stat-label">{ui.avgOrder}</div>
  <div className="aa-stat-value">{formatKc(orderMetrics.avgOrderValue)}</div>
</div>
```

#### 4.2 Breakdown podle statusu

Mini vizualizace (progress bary) ukazujici kolik objednavek je v kazdem statusu:

```jsx
// orderMetrics.ordersByStatus uz existuje (pole { status, name, value })
{orderMetrics.ordersByStatus.map(({ status, value }) => (
  <div className="aa-status-bar-row">
    <span className="aa-status-label">{status}</span>
    <div className="aa-status-bar-track">
      <div className="aa-status-bar-fill"
        style={{
          width: `${(value / orderMetrics.totalOrders * 100)}%`,
          backgroundColor: STATUS_COLORS[status]
        }}
      />
    </div>
    <span className="aa-status-count">{value}</span>
  </div>
))}
```

#### 4.3 Tabulka poslednich objednavek

- Poslednich 20 objednavek (serazeno dle data sestupne)
- Sloupce: Datum, Zakaznik (email), Material, Pocet modelu, Celkova cena, Status
- Kliknutelne — link na `/admin/orders` (ne detail — aby se nerozbil routing)
- Empty state: "Zatim zadne objednavky"

```jsx
const recentOrders = useMemo(() => {
  return [...allOrders]
    .filter(o => {
      const created = new Date(o.created_at || o.createdAt || '');
      return created >= new Date(fromISO) && created <= new Date(toISO);
    })
    .sort((a, b) => (b.created_at || b.createdAt || '').localeCompare(a.created_at || a.createdAt || ''))
    .slice(0, 20);
}, [allOrders, fromISO, toISO]);
```

#### 4.4 Odstranit "note" card

Nahradit card "In Variant A, an order is derived from ORDER_CREATED..." protoze
uz nepouzivame analytics events ale realne objednavky.

---

### Faze 4K: KONTROLNI (4 kroky) [KONTROLNI]

---

### Faze 5: Summary karty — "dnes" highlight [PRACOVNI]
**Odhad:** 20 min

#### 5.1 "Dnes" highlight pod hlavnim cislem

Pod hlavni cislo kazde summary karty pridat maly radek s dnesnich hodnotou:

```jsx
// Revenue karta — doplnit pod trend indicator:
<div className="aa-summary-today">
  {cs ? 'Dnes' : 'Today'}: {formatKc(orderMetrics.todayRevenue)}
</div>

// Orders karta:
<div className="aa-summary-today">
  {cs ? 'Dnes' : 'Today'}: {formatNumber(orderMetrics.todayOrders)}
</div>
```

**Styling:**
```css
.aa-summary-today {
  font-size: 11px;
  color: var(--forge-text-muted, #7A8291);
  font-family: var(--forge-font-tech, 'Space Mono', monospace);
  margin-top: 4px;
}
```

Nezavisly na period selectoru — vzdy ukazuje dnesni hodnotu.
Zobrazit jen pokud je `todayRevenue > 0` nebo `todayOrders > 0` (jinak zbytecne).

#### 5.2 Odstraneni "Reset demo data" tlacitka

Odstranit z headeru (radek 588-590):
```jsx
// SMAZAT:
<button type="button" className="aa-btn aa-btn-ghost" onClick={handleClear}>
  {ui.resetDemo}
</button>
```

Odstranit funkci `handleClear()` (radky 471-480).
Odstranit `clearAnalyticsAll` z importu (radek 8) — ALE overit ze se nepouziva
jinde v souboru. Pokud se pouziva jen v handleClear, smazat.
Odstranit `ui.resetDemo` a `ui.confirmClear` z useMemo (radky 322, 402).

**POZOR:** `clearAnalyticsAll` z `adminAnalyticsStorage.js` se NESMAZE —
je to utility ktera muze byt pouzita odjinud. Smazeme jen jeji pouziti
v AdminAnalytics.jsx.

---

### Faze 5K: KONTROLNI (4 kroky) [KONTROLNI]

---

### Faze 6: Empty states a UX polish [PRACOVNI]
**Odhad:** 15 min

#### 6.1 Prazdne grafy

Kazdy graf v grid systemu kdyz nema data:
- Prazdna plocha s ikonou a textem (uz existuje `EmptyChart` v AnalyticsCharts.jsx)
- Napoveda: `cs ? 'Data se zobrazi po prvni objednavce' : 'Data will appear after first order'`
- Overit ze VSECHNY grafy (vcetne novych 4) maji empty state

#### 6.2 Prazdne tabulky v Orders tabu

- "Zatim zadne objednavky v tomto obdobi" / "No orders in this period"

#### 6.3 Prazdne summary karty

- Zobrazit `0` nebo `0 Kc` — ne prazdny prostor
- Uz existuje v soucasne implementaci (radky 607-646), ale overit

#### 6.4 Grid empty state

Pokud uzivatel odebere vsechny grafy:
- Zobrazit zpravy: "Dashboard je prazdny. Klikni 'Pridat graf' pro pridani."
- CTA tlacitko "Pridat graf" primo v empty state

---

### Faze 7: Cleanup a testovani [PRACOVNI]
**Odhad:** 15 min

#### 7.1 Odstranit

- [x] "Reset demo data" tlacitko z headeru (viz Faze 5.2)
- [ ] Jakekoli dalsi reference na demo seeding co zustaly
- [ ] Nepouzivane importy (po vsech zmenach)
- [ ] `useConfirmDialog` import pokud se pouzival JEN pro reset dialog (overit!)

#### 7.2 CSS cleanup

- Grid layout CSS: importovat `react-grid-layout/css/styles.css` a `react-resizable/css/styles.css`
  pridat pres import v AnalyticsDashboardGrid.jsx
- Customizovat react-grid-layout CSS vars aby seděly s Forge theme (tmave pozadi, border colors)

#### 7.3 Build test

- `npm run build` musi projit bez chyb

#### 7.4 Smoke test

- [ ] Analytics stranka se nacte bez crashu
- [ ] Charts tab zobrazuje grid s grafy (prazdne pokud nejsou data, s daty pokud existuji objednavky)
- [ ] Drag & drop funguje v edit modu
- [ ] Resize funguje v edit modu
- [ ] Pridani/odebrani grafu funguje
- [ ] Layout se persistuje po refreshi stranky
- [ ] Period selector filtruje data ve vsech tabech
- [ ] Orders tab zobrazuje realne objednavky
- [ ] Summary karty zobrazuji "dnes" highlight (pokud jsou dnesni data)
- [ ] Reset demo tlacitko je pryc
- [ ] Export (CSV/JSON) stale funguje
- [ ] Reports tab stale funguje
- [ ] Session detail dialog stale funguje
- [ ] Mobilni responsivita (grid se preskupi na mobile)

---

### Faze 7K: KONTROLNI (4 kroky) [KONTROLNI — FINALNI]

---

## Soubory k uprave/vytvoreni

| Soubor | Akce | Slozitost | Popis zmeny |
|--------|------|-----------|-------------|
| `src/pages/admin/AdminAnalytics.jsx` | UPRAVA | Vysoka | Rozsireni computeOrderMetrics (6 novych poli), odstraneni reset tlacitka, summary "dnes" highlight, tab Orders prepis, import gridu |
| `src/pages/admin/components/AnalyticsCharts.jsx` | UPRAVA | Stredni | Pridat named exports pro jednotlive chart komponenty. Pridat 4 nove charty (OrdersOverTime, TopCustomers, TopModels, RevenueByMaterial) |
| `src/pages/admin/components/AnalyticsDashboardGrid.jsx` | NOVY | Vysoka | Drag & drop grid, chart catalog, edit mode, layout persistence |
| `src/utils/adminAnalyticsStorage.js` | BEZ ZMENY | - | Layout persistence pujde pres adminTenantStorage primo |

## Nove zavislosti

**ZADNE** — `react-grid-layout` (^1.4.4) a `react-resizable` (^3.0.5) uz jsou v package.json.

---

## Rozlozeni agentu

### Faze 2 (Drag & Drop Grid)

| Agent | Ukol | Paralelne? |
|-------|------|------------|
| `mp-mid-frontend-admin` | AnalyticsDashboardGrid.jsx — grid system, edit mode, layout persistence | Hlavni |
| `mp-spec-fe-forms` | UI pro "Pridat graf" dropdown/modal + edit mode controls | Paralelne s hlavnim |

### Faze 3 (Nove grafy)

| Agent | Ukol | Paralelne? |
|-------|------|------------|
| `mp-mid-frontend-admin` | Rozsireni computeOrderMetrics() v AdminAnalytics.jsx (6 poli) | Sekvencni (pred grafy) |
| `mp-spec-fe-charts` (pokud existuje, jinak `mp-mid-frontend-admin`) | 4 nove chart komponenty v AnalyticsCharts.jsx | Paralelne (po metrikach) |

### Faze 4-7 (Orders tab, Summary, Cleanup)

| Agent | Ukol | Paralelne? |
|-------|------|------------|
| `mp-mid-frontend-admin` | Orders tab prepis, summary highlight, cleanup | Sekvencni |

**Koordinace:** Hlavni okno koordinuje, kontroluje build po kazde fazi,
resi konflikty. Max 2 agenty paralelne.

---

## Rizika a mitigace

| # | Riziko | Pravdepodobnost | Dopad | Mitigace |
|---|--------|-----------------|-------|----------|
| 1 | `react-grid-layout` 1.4.4 API neni kompatibilni s React 19 | Nizka (uz je v projektu a funguje v Dashboard) | Vysoka | `adminDashboardStorage.js` dokazuje ze to funguje. Pouzit stejny pattern. |
| 2 | Performance — grafy s velkym mnozstvim objednavek | Stredni | Stredni | `useMemo` pro vsechny agregace (uz se pouziva). Omezit na posledni rok pokud > 1000 objednavek. |
| 3 | Layout migrace — budouci nove grafy | Nizka | Nizka | `version` field v layout schema. Migracni logika pri nacitani. |
| 4 | Rozbiti existujiciho Charts tabu | Stredni | Vysoka | Default export AnalyticsCharts zustavne. Grid je NOVY component, ne nahrada. |
| 5 | Named exports z AnalyticsCharts.jsx | Nizka | Stredni | Overit ze zadny jiny soubor neimportuje named exports z tohoto modulu. |
| 6 | `useConfirmDialog` import po smazani reset tlacitka | Nizka | Vysoka (build fail) | Overit vsechny pouziti v souboru pred smazanim importu. |
| 7 | CSS konflikty react-grid-layout vs Forge theme | Stredni | Nizka | Customizovat CSS promenne, obalit grid do scopovaneho containeru. |

---

## Odhad casu

| Faze | Obsah | Odhad |
|------|-------|-------|
| Faze 2 + 2K | Drag & Drop Grid System + kontrola | 90-120 min |
| Faze 3 + 3K | Nove grafy + metriky + kontrola | 60 min |
| Faze 4 + 4K | Tab Orders prepis + kontrola | 30 min |
| Faze 5 + 5K | Summary highlight + reset cleanup + kontrola | 20 min |
| Faze 6 | Empty states + UX polish | 15 min |
| Faze 7 + 7K | Cleanup + build + smoke test + kontrola | 15 min |
| **Celkem** | | **~4-5 hodin** |

---

## Acceptance Criteria

- [ ] Charts tab zobrazuje drag & drop grid misto statickych 2-column radku
- [ ] Edit mode umoznuje drag, resize, pridani a odebrani grafu
- [ ] Layout se uklada do tenant-scoped localStorage a prezije refresh
- [ ] Vsechny data jsou z realnych objednavek (orders:v1) a analytics events — zadna demo data
- [ ] 10 dostupnych grafu v katalogu (6 existujicich + 4 nove)
- [ ] Tab Orders zobrazuje realny analyticky pohled (stat karty, status breakdown, tabulka objednavek)
- [ ] Summary karty maji "dnes" highlight
- [ ] "Reset demo data" tlacitko je uplne odstraneno
- [ ] Empty states pro vsechny grafy a tabulky
- [ ] `npm run build` prochazi
- [ ] Mobilni responsivita (grid se sklada na 1 sloupec)
- [ ] Existujici taby (Overview, Calculations, Lost, Exports, Reports) NEJSOU ovlivneny

## Out of Scope

- Backend analytiky (server-side agregace) — zatim vse frontend-only
- Real-time updates (WebSocket push) — neni potreba pro MVP
- Zmena analytics event tracking — pouzivame existujici tracking as-is
- A/B testing analytika
- Heatmapy / session recording
- Zmena dalsich admin stranek
- Export grafu do PDF (PNG export uz existuje a zustavne)