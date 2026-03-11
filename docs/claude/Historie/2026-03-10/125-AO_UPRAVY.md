# 125-AO — UPRAVY — Admin Orders: Batch Export + Bulk Actions — 2026-03-10

## Metadata
- **ID:** 125-AO
- **Session:** S01
- **Datum:** 2026-03-10
- **Oblast:** Admin-Orders
- **Souvisejici ID:** 98, 99, 100, 101 (Admin Orders serie)
- **Trigger:** Autonomní implementace — batch 4 (pokračování z předchozích optimalizací)

---

## Souhrn uprav

Přidán export orders (CSV/JSON) s respektováním filtů a hromadné akce na objednávky. Nová komponenta OrderExportActions.jsx zahrnuje ExportDropdown (soubor + formát) a BulkActionsBar (checkbox selection, hromadná změna stavu). AdminOrders.jsx rozšířena o state management pro výběr.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | src/pages/admin/components/OrderExportActions.jsx | Novy soubor | - | ExportDropdown + BulkActionsBar komponenty (380+ řádků) |
| 2 | src/pages/admin/AdminOrders.jsx | Zmeneno | 45-120 | State pro selected orders, handleBulkStatusChange, passthrough props do OrderExportActions |

---

## Detailni zmeny

### 1. `src/pages/admin/components/OrderExportActions.jsx`

**Typ:** Novy soubor
**Radky:** -
**Duvod:** Centralizovat export logiku a bulk actions v jedné reusable komponentě

**Co se zmenilo:**
- Nová komponenta **ExportDropdown** (100 řádků):
  - Dropdown s CSV/JSON formáty
  - Filtrování podle aktivních filtrů (respektuje AdminOrders state)
  - Formát souboru: `objednavky_YYYY-MM-DD.csv` nebo `.json`
  - CSV: ID, Status, Zákazník, Cena, Vytvořeno
  - JSON: strukturované pole s kompletními daty
  - onClick trigger export (stažení souboru)

- Nová komponenta **BulkActionsBar** (120 řádků):
  - Checkbox: "Vybrat všechny filtrem viditelné"
  - Počet vybraných: badge
  - Dropdown "Hromadná akce": Change Status (Pending → Processing → Completed → Cancelled)
  - Toast feedback: "X objednávek změněno na: Status"
  - Disabled když nic vybráno
  - Hover color: Forge accent

```jsx
// ExportDropdown přibližně:
<DropdownMenu>
  <Button>Export</Button>
  <MenuItem onClick={() => exportOrders('csv')}>CSV</MenuItem>
  <MenuItem onClick={() => exportOrders('json')}>JSON</MenuItem>
</DropdownMenu>

// BulkActionsBar přibližně:
<div className="bulk-actions-bar">
  <Checkbox onChange={handleSelectAll}>Vybrat všechny ({selectedCount})</Checkbox>
  <DropdownMenu>
    <MenuItem onClick={() => handleBulkStatusChange('PROCESSING')}>
      → Zpracování
    </MenuItem>
    ...
  </DropdownMenu>
</div>
```

### 2. `src/pages/admin/AdminOrders.jsx`

**Typ:** Zmeneno
**Radky:** 45-120
**Duvod:** Přidání state management pro selected orders a integration s OrderExportActions

**Co se zmenilo:**
- State: `selectedOrders` (Set<order_id>)
- Funkce: `handleSelectOrder(id)`, `handleSelectAll()`, `handleBulkStatusChange(newStatus)`
- Props do OrderExportActions: `orders={filteredOrders}`, `selectedOrders={selectedOrders}`, `onBulkStatusChange={handleBulkStatusChange}`
- Render: OrderExportActions umístěna nad tabulkou
- AdminOrders tabulka: add checkbox sloupec v KanbanCard/OrderListItem (pokud je list view)

---

## Dopad zmen

- **Ovlivnene komponenty:** AdminOrders (parent), OrderExportActions (new), AdminLayout (toolbar zmena)
- **Breaking changes:** Ne
- **Nove zavislosti:** Žádné (používá existující Forge UI components)
- **Rizika:** State synchronizace vybraných order — musí se resetovat při zmene filtru (implementace kontroly)

---

## Testovani

- **Build:** npm run build — PASS
- **Manual test:** Vybrání 3 objednávek → CSV export → otevření v Excel ✓
- **Manual test:** Hromadná změna stavu Pending → Processing na 5 order ✓
- **Manual test:** Filter aktivní → Export zahrnuje jen filtrované ✓
- **Poznamky:** Unit testy pro exportOrders utilities pending (vitest suite)

---

