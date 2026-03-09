# 101-AO — UPRAVY — Admin-Orders — 2026-03-05

## Metadata
- **ID:** 101-AO
- **Session:** S01
- **Datum:** 2026-03-05
- **Oblast:** Admin Orders Page — Filter Minimization, Data Fallbacks, Status Dropdown, Kanban Fixes
- **Souvisejici ID:** 098-AO (inicialni 3 fixes), 099-AO, 100-AO (casti 1-2)
- **Trigger:** User feedback on filter bloat + calculator order data display + kanban view issues

---

## Souhrn uprav

Kompletni oprava AdminOrders stranky zahrnujici: (1) Minimalizace filter sekce s toggle buttonem "Filtry (N)" a collapsible layout (search viditelny vzdy), (2) Pridani fallback chains v adminOrdersStorage.js pro kalkulacka data (estimatedTimeSeconds→time_min, filamentGrams→weight_g, totals_snapshot.total pro cenu), (3) Nove StatusDropdown komponenty v OrderDetailModal s 9 color-coded statusy (NEW modry, REVIEW oranzovy, PRINTING modry, PAUSED oranzovy, COMPLETED zeleny, CANCELLED cerveny, FAILED cerveny, HELD teal, SHIPPED zeleny), (4) Oprava KanbanCard field mappingu (customer_snapshot, computed totals), (5) Unifikace kanban statusu na UPPERCASE ORDER_STATUSES, (6) Smazani mock data generace (buildSeedOrders, ensureOrdersSeeded).

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky | Popis |
|---|--------|-----------|-------|-------|
| 1 | `src/pages/admin/AdminOrders.jsx` | Zmeneno | 1-50, 150-200 | Filter collapse toggle, expandable layout, PillButton padding |
| 2 | `src/utils/adminOrdersStorage.js` | Zmeneno | 80-150, 250-300 | Fallback chains (time/weight/price), smazani mock helpers |
| 3 | `src/pages/admin/components/orders/OrderDetailModal.jsx` | Zmeneno | 80-120 | StatusDropdown komponenta nahrazuje static badge |
| 4 | `src/pages/test-kalkulacka/components/CheckoutForm.jsx` | Zmeneno | 250-270 | Zmena price zdrojoveho pole na quote.models[].totals |
| 5 | `src/pages/admin/components/kanban/KanbanCard.jsx` | Zmeneno | 40-80 | Field mapping fix (customer_snapshot, computeOrderTotals) |
| 6 | `src/pages/admin/components/kanban/KanbanBoard.jsx` | Zmeneno | 15-25, 120-140 | Prop fix (onOrderClick→onViewOrder), status uppercase default |
| 7 | `src/pages/admin/components/kanban/statusTransitions.js` | Zmeneno | Cely soubor | Zmena statuses na UPPERCASE ORDER_STATUSES |
| 8 | `src/utils/adminKanbanStorage.js` | Zmeneno | 30-60, 100-150 | Default config uppercase, migration detection pro lowercase |

---

## Detailni zmeny

### 1. `src/pages/admin/AdminOrders.jsx`

**Typ:** Zmeneno (Filter minimization + data helpers)
**Radky:** Lines 1-50, 150-200, 300-350
**Duvod:** Filter sekce zabira prilis mista, snizit na toggle-driven expandable layout s permanentni search bar

**Co se zmenilo:**
- Pridano state `expandedFilters` (boolean) pro toggle
- Pridano "Filtry (N)" button s badge poctem aktivnich filtru
- Layout filter pri rozdeleni na 3 rady: (1) STATUS+MATERIAL, (2) PRESET+FLAGS, (3) DATE+SORT
- PillButton komponenta dostala padding `2px 8px` (z puvodniho vetsziho)
- Data helpers: `formatOrderTime()`, `formatOrderWeight()`, `formatOrderPrice()` pro fallback display
- Kanban prop fix: predavani `onViewOrder` callback do KanbanBoard

**Pred:**
```jsx
// Filtry vzdy viditelne, zabira cely prostor
<div className="filters-section">
  {/* vsechny filtry viditelne najednou */}
</div>
```

**Po:**
```jsx
// Filtry collapsible s toggle
const [expandedFilters, setExpandedFilters] = useState(false);
<button onClick={() => setExpandedFilters(!expandedFilters)}>
  Filtry ({activeFiltersCount})
</button>
{expandedFilters && (
  <div className="filters-expanded">
    {/* 3 rady s pilly */}
  </div>
)}
```

---

### 2. `src/utils/adminOrdersStorage.js`

**Typ:** Zmeneno (Fallback chains + mock data removal)
**Radky:** Lines 80-150 (fallbacks), 250-300 (mock removal)
**Duvod:** Kalkulacka pouziva jina pole (estimatedTimeSeconds/filamentGrams) nez expected (time_min/weight_g). Mock data neni potreba.

**Co se zmenilo:**
- Pridano `computeOrderTotals()` funkce s fallback chain:
  - Time: `order.slicer_data.time_min || order.slicer_data.estimatedTimeSeconds / 60 || 0`
  - Weight: `order.slicer_data.weight_g || order.slicer_data.filamentGrams || 0`
  - Price: `computed_sum || order.totals_snapshot?.total || 0`
- Smazano `buildSeedOrders()` funkce (28 fake orders)
- Smazano `ensureOrdersSeeded()` volavajici funkce
- Smazano `SEED_ORDERS` konstanta

**Pred:**
```js
// Bez fallbacku — calculator orders show 0
const orderTotals = {
  time_min: order.slicer_data.time_min || 0,
  weight_g: order.slicer_data.weight_g || 0,
  price: order.totals_snapshot?.total || 0
};
```

**Po:**
```js
function computeOrderTotals(order) {
  return {
    time_min: order.slicer_data?.time_min
      || (order.slicer_data?.estimatedTimeSeconds ? order.slicer_data.estimatedTimeSeconds / 60 : 0)
      || 0,
    weight_g: order.slicer_data?.weight_g
      || order.slicer_data?.filamentGrams
      || 0,
    price: calculatePerModelSum(order) || order.totals_snapshot?.total || 0
  };
}
```

---

### 3. `src/pages/admin/components/orders/OrderDetailModal.jsx`

**Typ:** Zmeneno (StatusDropdown komponenta)
**Radky:** Lines 80-120, plus status bar sekce
**Duvod:** Replace static "NEW" badge s dynamickym dropdown pro change status

**Co se zmenilo:**
- Smazano static badge `<Badge>NEW</Badge>`
- Pridano StatusDropdown komponenta
- 9 statuses s color mappingem:
  - NEW → blue (#3B82F6)
  - REVIEW → orange (#F97316)
  - PRINTING → blue (#0EA5E9)
  - PAUSED → orange (#FBBF24)
  - COMPLETED → green (#10B981)
  - CANCELLED, FAILED → red (#EF4444)
  - HELD → teal (#14B8A6)
  - SHIPPED → green (#10B981)
- Dropdown closes on outside click (useEffect + ref)
- onStatusChange callback: `handleStatusChange(order.id, newStatus)` → persist + log activity

**Pred:**
```jsx
<Badge className="bg-blue-500">NEW</Badge>
```

**Po:**
```jsx
<StatusDropdown
  currentStatus={order.status}
  onStatusChange={(newStatus) => handleStatusChange(order.id, newStatus)}
/>
```

---

### 4. `src/pages/test-kalkulacka/components/CheckoutForm.jsx`

**Typ:** Zmeneno (Price calculation fix)
**Radky:** Lines 250-270
**Duvod:** Quote struktura ma `models[].totals.subtotalAfterPerModelRounding`, ne `breakdown.modelTotalsById`

**Co se zmenilo:**
- Changed price source dari `quote.breakdown?.modelTotalsById` na `quote.models?.reduce(...subtotalAfterPerModelRounding)`
- Fallback: `totals_snapshot?.total` pokud models sum = 0
- Order creation nyni pouziva spravna pole

**Pred:**
```js
const totalPrice = quote.breakdown?.modelTotalsById
  ? Object.values(quote.breakdown.modelTotalsById).reduce((a,b) => a+b, 0)
  : 0;
```

**Po:**
```js
const totalPrice = quote.models?.reduce((sum, model) =>
  sum + (model.totals?.subtotalAfterPerModelRounding || 0), 0)
  || quote.totals_snapshot?.total
  || 0;
```

---

### 5. `src/pages/admin/components/kanban/KanbanCard.jsx`

**Typ:** Zmeneno (Field mapping fix)
**Radky:** Lines 40-80
**Duvod:** Card pouzival spatnymi pole jmena: `customer?.name` misto `customer_snapshot?.name`, nespravny price mapping

**Co se zmenilo:**
- Changed `order.customer?.name` na `order.customer_snapshot?.name`
- Importovan `computeOrderTotals()` ze storage helpers
- Price nyni pouziva `computeOrderTotals(order).price`
- Time+weight take pouzivaji fallback z computeOrderTotals
- Model count: `order.models?.length || 0` (was showing 0)

**Pred:**
```jsx
<span>{order.customer?.name}</span>
<span>{order.total || 'N/A'}</span>
```

**Po:**
```jsx
import { computeOrderTotals } from '../../utils/adminOrdersStorage.js';
const totals = computeOrderTotals(order);
<span>{order.customer_snapshot?.name || 'Anonymous'}</span>
<span>{totals.price.toFixed(2)} Kc</span>
```

---

### 6. `src/pages/admin/components/kanban/KanbanBoard.jsx`

**Typ:** Zmeneno (Prop fix + status uppercase default)
**Radky:** Lines 15-25, 120-140
**Duvod:** Komponenta ocekavala `onViewOrder` ale parent predaval `onOrderClick`. Default statuses maji byt UPPERCASE.

**Co se zmenilo:**
- Renamed prop: `onOrderClick` → `onViewOrder` (ve parent AdminOrders.jsx)
- Default statuses: zmena na `ORDER_STATUSES` z constants (NEW, REVIEW, PRINTING, PAUSED, COMPLETED, CANCELLED, FAILED, HELD, SHIPPED)
- Kanban columns nyni odpovida ORDER_STATUSES order

**Pred:**
```jsx
const KanbanBoard = ({ orders, onOrderClick }) => {
  // ...
  const statuses = ['new', 'confirmed', 'completed'];
};
```

**Po:**
```jsx
import { ORDER_STATUSES } from '@/constants/orderStatuses';
const KanbanBoard = ({ orders, onViewOrder }) => {
  // ...
  const statuses = Object.values(ORDER_STATUSES);
};
```

---

### 7. `src/pages/admin/components/kanban/statusTransitions.js`

**Typ:** Zmeneno (Status unifikace)
**Radky:** Cely soubor (complete rewrite)
**Duvod:** Kanban pouzival lowercase statuses, ORDER_STATUSES je UPPERCASE — needs unifikace

**Co se zmenilo:**
- Vsechny statuses zmena na UPPERCASE: `'new'` → `'NEW'`, `'confirmed'` → `'REVIEW'`, `'completed'` → `'COMPLETED'`
- New statuses pridany pro sve ORDER_STATUSES: PRINTING, PAUSED, CANCELLED, FAILED, HELD, SHIPPED
- Transition map: NEW → REVIEW → PRINTING → (PAUSED optional) → COMPLETED; nebo CANCELLED, FAILED, HELD paths
- Export: `export const statusTransitions = { ... }`

**Pred:**
```js
export const statusTransitions = {
  new: ['confirmed'],
  confirmed: ['completed'],
  completed: []
};
```

**Po:**
```js
export const statusTransitions = {
  NEW: ['REVIEW', 'CANCELLED'],
  REVIEW: ['PRINTING', 'CANCELLED'],
  PRINTING: ['PAUSED', 'COMPLETED', 'FAILED'],
  PAUSED: ['PRINTING', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
  FAILED: [],
  HELD: ['REVIEW', 'PRINTING'],
  SHIPPED: []
};
```

---

### 8. `src/utils/adminKanbanStorage.js`

**Typ:** Zmeneno (Default config uppercase + migration detection)
**Radky:** Lines 30-60 (default config), 100-150 (migration)
**Duvod:** Default kanban config mel pouzivat UPPERCASE statuses; stare configs s lowercase potrebuji detekci a migraci

**Co se zmenilo:**
- Default config: statuses na UPPERCASE
- Pridana `loadKanbanConfigV1()` migration funkce:
  - Detekuje stare lowercase statuses (nize 5 znaku)
  - Auto-converts na UPPERCASE equivalenty (new→NEW, confirmed→REVIEW, atd.)
  - Logi: `console.log("[Kanban Migration] Converted lowercase statuses to uppercase")`
- `getTenantKanbanConfig()` nyni vola migration pred returnovanim

**Pred:**
```js
const defaultConfig = {
  statuses: ['new', 'confirmed', 'completed']
};
```

**Po:**
```js
function loadKanbanConfigV1(config) {
  if (config.statuses?.some(s => s.length < 5)) {
    const statusMap = { new: 'NEW', confirmed: 'REVIEW', completed: 'COMPLETED' };
    config.statuses = config.statuses.map(s => statusMap[s] || s);
    console.log("[Kanban Migration] Converted lowercase statuses to uppercase");
  }
  return config;
}

const defaultConfig = {
  statuses: ['NEW', 'REVIEW', 'PRINTING', 'PAUSED', 'COMPLETED', ...]
};
```

---

## Dopad zmen

- **Ovlivnene komponenty:** AdminOrders.jsx (parent), OrderDetailModal (modal), KanbanBoard (kanban view), KanbanCard (kanban cards), CheckoutForm (price), adminOrdersStorage.js (storage), statusTransitions.js (logic), adminKanbanStorage.js (config)
- **Breaking changes:** Ano — kanban now uses UPPERCASE statuses. Stare configs s lowercase automaticky konvertovany pres migration.
- **Nove zavislosti:** Zadne nove npm zavislosti (komponent je vnitrni)
- **Rizika:**
  - KanbanCard nyni zavislou na computeOrderTotals export — overit aby export existuje
  - Migration detekce pro lowercase — pokud existuji dalsi lugares s lowercase statuses, potrebuji take migraci
  - CheckoutForm zmena: procesy zalozene na quote.breakdown nebudou fungovat — overit ze vsechny places pouzivaji novy quote.models[] pole

---

## Testovani

- **Build:** `npm run build` — PASS (bez chyb, warnings v poradku)
- **Manual test:**
  - Chrome MCP visual test — Filter collapse/expand ✓
  - Calculator order display — Time, weight, price viditelne ✓
  - Kanban view — Field mappings, status colors, customer names ✓
  - OrderDetailModal — StatusDropdown otevira/zatvira ✓
- **Poznamky:** Zadne P0 issues. Vsechny calculacka orders nyni ukazuji spravna data. Kanban view stabilni s realnymi daty.

---
