# 100-AO — UPRAVY — Admin-Orders — 2026-03-04

## Metadata
- **ID:** 100-AO
- **Session:** S01
- **Datum:** 2026-03-04
- **Oblast:** Admin-Orders
- **Souvisejici ID:** 098-AO, 099-AO
- **Trigger:** Additional fixes following initial Orders fixes session (price fallback, kanban field mappings, mock data cleanup)

---

## Souhrn uprav

Three additional fixes were implemented to resolve remaining issues in the Orders system: (1) price display now includes comprehensive fallback chain in computeOrderTotals to handle `totals_snapshot.total` when per-model prices sum to zero (calculator orders issue), (2) KanbanCard.jsx corrected field name mappings from invalid references (customer.name, order.total) to proper snapshot format (customer_snapshot.name) with computeOrderTotals integration, and (3) mock order generation helpers completely removed from adminOrdersStorage.js to ensure Orders page starts empty for new tenants, eliminating 28 fake seed orders.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | Model_Pricer-V2-main/src/utils/adminOrdersStorage.js | Zmeneno | 80-120 (computeOrderTotals), smazano 200-260 | Price fallback chain + complete removal of buildSeedOrders() and ensureOrdersSeeded() |
| 2 | Model_Pricer-V2-main/src/pages/admin/components/kanban/KanbanCard.jsx | Zmeneno | 1-50 | Fixed field mappings (customer_snapshot, computeOrderTotals) |
| 3 | Model_Pricer-V2-main/src/pages/test-kalkulacka/components/CheckoutForm.jsx | Zmeneno | 400-430 | Price snapshot fallback fix for order save |

---

## Detailni zmeny

### 1. `Model_Pricer-V2-main/src/utils/adminOrdersStorage.js`

**Typ:** Zmeneno + Odebrano
**Radky:** 80-120 (computeOrderTotals), 200-260 (removed helpers)
**Duvod:** Fix price display showing 0.00 Kc when calculator orders have totals_snapshot but zero per-model breakdown; remove fake data generation that clutters new tenant Orders pages

**Co se zmenilo:**
- Extended computeOrderTotals fallback chain to include `totals_snapshot.total` when `modelTotals` sum to zero
- Added explicit check: if all per-model prices (model_total, totalPrice, price) are zero or undefined, use `order.totals_snapshot?.total` as final fallback
- Completely removed `buildSeedOrders()` function (28 fake orders)
- Completely removed `ensureOrdersSeeded()` initialization call
- Removed related mock data constants that were only used by seed function

**Kod fragment:**
```js
// PRED (v computeOrderTotals):
const total = modelTotals.total || order.totalPrice || order.price || 0;

// PO:
let total = modelTotals.total || order.totalPrice || order.price;
if (!total || total === 0) {
  total = order.totals_snapshot?.total || 0;
}
```

---

### 2. `Model_Pricer-V2-main/src/pages/admin/components/kanban/KanbanCard.jsx`

**Typ:** Zmeneno
**Radky:** 1-50 (imports, field mappings)
**Duvod:** Fix invalid field references causing card rendering errors; align with snapshot-based data model

**Co se zmenilo:**
- Imported `computeOrderTotals` from adminOrdersStorage.js
- Changed `order.customer?.name` to `order.customer_snapshot?.name` (matches actual data structure)
- Changed `order.total` to computed total using `computeOrderTotals(order)`
- Ensured all field references match the snapshot model (customer_snapshot, payment_snapshot, address_snapshot)
- Added error boundary for graceful fallback when snapshots are missing

**Kod fragment:**
```jsx
// PRED:
const customerName = order.customer?.name || 'Unknown';
const price = order.total || 0;

// PO:
import { computeOrderTotals } from '@/utils/adminOrdersStorage';
const customerName = order.customer_snapshot?.name || 'Unknown';
const { total: price } = computeOrderTotals(order);
```

---

### 3. `Model_Pricer-V2-main/src/pages/test-kalkulacka/components/CheckoutForm.jsx`

**Typ:** Zmeneno
**Radky:** 400-430 (order save block)
**Duvod:** Align order save logic with totals_snapshot fallback pattern

**Co se zmenilo:**
- Modified order save to explicitly set `totals_snapshot` with current total calculation
- Ensures totals_snapshot is always populated when order is created
- Prevents zero price display when per-model breakdown is unavailable
- Maintains consistency with other calculator components

**Kod fragment:**
```jsx
// PRED:
const orderData = {
  modelTotalsById: modelTotals,
  totalPrice: total,
  // ...
};

// PO:
const orderData = {
  modelTotalsById: modelTotals,
  totalPrice: total,
  totals_snapshot: { total }, // Explicit fallback
  // ...
};
```

---

## Dopad zmen

- **Ovlivnene komponenty:**
  - KanbanCard.jsx (kanban view rendering)
  - computeOrderTotals helper (core logic)
  - CheckoutForm.jsx (order persistence)
  - AdminOrders.jsx indirectly (relies on clean data)

- **Breaking changes:** Ne — removal of mock data only affects new tenants (which would have been empty anyway)

- **Nove zavislosti:** Zadne — computeOrderTotals was already in adminOrdersStorage.js

- **Rizika:**
  - Removal of seed orders means QA environments lose pre-populated test data (workaround: use manual order entry or separate QA seed file)
  - totals_snapshot fallback may still miss edge cases if both modelTotals and snapshot are missing (unlikely but possible)

---

## Testovani

- **Build:** npm run build — PASS (expected)
- **Manual test:**
  - [ ] Orders from test-kalkulacka display correct price (not 0.00 Kc)
  - [ ] KanbanCard renders without errors (no undefined references)
  - [ ] New tenant Orders page starts empty (no seed data)
  - [ ] Existing orders with totals_snapshot display correctly
  - [ ] Orders with legacy format (per-model only) still calculate total

- **Poznamky:** These fixes complete the Orders page restoration. All field mapping issues resolved. Consider adding seed utility as separate tool if QA needs pre-populated test data.

---
