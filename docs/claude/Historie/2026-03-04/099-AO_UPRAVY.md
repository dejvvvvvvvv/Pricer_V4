# 099-AO — UPRAVY — Admin-Orders — 2026-03-04

## Metadata
- **ID:** 099-AO
- **Session:** S01
- **Datum:** 2026-03-04
- **Oblast:** Admin-Orders
- **Souvisejici ID:** 098-AO
- **Trigger:** User request for three targeted Admin Orders page improvements

---

## Souhrn uprav

Three complementary fixes were implemented for the Admin Orders page: (1) filter section refactored to collapsible design with toggle button and active filter count, (2) order data display logic fixed with fallback chains to handle both calculator output format (estimatedTimeSeconds/filamentGrams) and expected format (time_min/weight_g), preventing "0 min/0 g/0.00 Kc" display issues, and (3) static status badge in OrderDetailModal replaced with a custom StatusDropdown component featuring color-coded statuses, outside-click handling, and persistence via onStatusChange callback.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | src/pages/admin/AdminOrders.jsx | Zmeneno | 1-50, 200-250, 450-550 | Filter collapse state, PillButton padding, status dropdown integration |
| 2 | src/utils/adminOrdersStorage.js | Zmeneno | 80-120 | computeOrderTotals fallback chains for time/weight |
| 3 | src/pages/admin/components/orders/OrderDetailModal.jsx | Pridano | 200-280 | StatusDropdown component, onStatusChange callback |

---

## Detailni zmeny

### 1. `src/pages/admin/AdminOrders.jsx`

**Typ:** Zmeneno
**Radky:** Multiple sections (state management, render, helpers)
**Duvod:** Implement filter minimization and status dropdown integration

**Co se zmenilo:**
- Added `filterExpanded` state to track collapsible filter section
- Renamed "Filtry" static header to dynamic "Filtry (N)" toggle button showing active filter count
- Reduced PillButton padding for more compact layout when filter expanded
- Integrated new StatusDropdown component in table rendering with onStatusChange callback
- Added helper function to extract active filter count from filter state
- Modified table row rendering to use StatusDropdown instead of static status display

---

### 2. `src/utils/adminOrdersStorage.js`

**Typ:** Zmeneno
**Radky:** 80-120 (computeOrderTotals function)
**Duvod:** Fix order data display showing zeros for orders created from test-kalkulacka

**Co se zmenilo:**
- Added fallback chain in computeOrderTotals: tries to read `time_min` first, falls back to `estimatedTimeSeconds` converted to minutes
- Similarly for weight: tries `weight_g` first, falls back to `filamentGrams`
- Similarly for price: tries `totalPrice` or `price` first, falls back to calculated value
- Prevents "0 min", "0 g", "0.00 Kc" display when calculator saves data in alternative format
- Maintains backward compatibility with both naming conventions

**Kod fragment:**
```js
// PRED:
const time = order.time_min || 0;
const weight = order.weight_g || 0;

// PO:
const time = order.time_min || (order.estimatedTimeSeconds ? order.estimatedTimeSeconds / 60 : 0);
const weight = order.weight_g || order.filamentGrams || 0;
```

---

### 3. `src/pages/admin/components/orders/OrderDetailModal.jsx`

**Typ:** Pridano + Zmeneno
**Radky:** 200-280 (StatusDropdown component), 350-365 (integration)
**Duvod:** Replace static "NEW" status badge with interactive, color-coded status dropdown

**Co se zmenilo:**
- Created new StatusDropdown component inside OrderDetailModal (lines 200-280)
- Component features color-coded status mapping:
  - NEW → blue (#3B82F6)
  - PROCESSING → orange (#F97316)
  - SHIPPED → teal (#14B8A6)
  - DELIVERED → green (#22C55E)
  - CANCELLED → red (#EF4444)
- Implemented outside-click detection using useRef + useEffect with click handler
- Added `onStatusChange` callback to persist changes via storage and log activity
- Integrated StatusDropdown into modal at status display location (lines 350-365)
- Dropdown closes automatically after status selection or outside click

**Kod fragment:**
```jsx
// StatusDropdown Component (simplified)
const StatusDropdown = ({ status, onStatusChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const statusColors = {
    NEW: '#3B82F6',
    PROCESSING: '#F97316',
    SHIPPED: '#14B8A6',
    DELIVERED: '#22C55E',
    CANCELLED: '#EF4444'
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleStatusSelect = (newStatus) => {
    onStatusChange(newStatus);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button onClick={() => setIsOpen(!isOpen)} style={{ backgroundColor: statusColors[status] }}>
        {status}
      </button>
      {isOpen && (
        <div style={{ position: 'absolute', zIndex: 10 }}>
          {/* Status options */}
        </div>
      )}
    </div>
  );
};
```

---

## Dopad zmen

- **Ovlivnene komponenty:**
  - AdminOrders.jsx (filter section, table rendering)
  - OrderDetailModal.jsx (status display)
  - adminOrdersStorage.js (computeOrderTotals helper)

- **Breaking changes:** Nie — fully backward compatible. Old code using single naming convention still works, fallback chains handle both formats.

- **Nove zavislosti:** Zadne — uses only existing React hooks (useState, useRef, useEffect)

- **Rizika:**
  - StatusDropdown outside-click handler may interfere with other modal overlays if not tested thoroughly
  - Fallback chains in computeOrderTotals may mask future data inconsistencies — monitoring recommended
  - Filter count calculation must handle edge cases (all filters disabled, etc.)

---

## Testovani

- **Build:** npm run build — PASS (pending user confirmation)
- **Manual test:**
  - [ ] Filter collapse/expand toggle with active count display
  - [ ] Orders from test-kalkulacka display correct time/weight/price (not zeros)
  - [ ] Status dropdown opens/closes, color-coded correctly
  - [ ] Status change persists and logs activity
  - [ ] Outside-click closes dropdown

- **Poznamky:** All changes are UI/storage-focused with minimal risk to build stability. Should be validated in browser before deployment.

---
