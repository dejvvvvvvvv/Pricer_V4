# 167-GN — UPRAVY — Utilities + P2 Fixes — 2026-03-13

## Metadata
- **ID:** 167-GN
- **Session:** S27
- **Datum:** 2026-03-13
- **Oblast:** General / Code Quality / Utilities
- **Souvisejici ID:** 164-GN, 165-GN, 166-GN
- **Trigger:** Code quality improvements, centralization of duplicate formatters, P2 bug cleanup

---

## Souhrn uprav

Vytvoření dvou centrálních utility souborů (formatters.js, orderConstants.js) a deduplikace formatovacích a status-related funkcí z 12+ souborů. Normalizace error handling (console.error → debug), doplnění type="button" atributů, cleanup nepoužívaných importů.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | `src/utils/formatters.js` | Novy soubor | 1-180 | 8 centrálních formatter funkcí (formatMoney, formatTime, formatDateTime, formatDate, formatTimeShort, formatRelativeTime, formatSize, safeNum, formatMoneyInt) |
| 2 | `src/utils/orderConstants.js` | Novy soubor | 1-25 | STATUS_COLORS mapa, STATUS_LABELS mapa, getStatusColor() funkce |
| 3 | `src/pages/admin/AdminOrderDetail.jsx` | Zmeneno | 1-50 | Import formatters (formatMoney, formatDateTime), smazáno 15 lokálních formatovacích linií |
| 4 | `src/pages/admin/AdminOrders.jsx` | Zmeneno | 1-40 | Import formatters, import orderConstants (getStatusColor) |
| 5 | `src/pages/admin/components/orders/TabItemsFiles.jsx` | Zmeneno | 1-30 | Import formatters (formatSize, formatMoney, formatDateTime) |
| 6 | `src/pages/admin/components/orders/PrintQueue.jsx` | Zmeneno | 1-35 | Import formatters (formatDateTime, formatTime) |
| 7 | `src/pages/admin/components/FileListPanel.jsx` | Zmeneno | 1-25 | Import formatters (formatSize, formatDateTime) |
| 8 | `src/pages/admin/components/PreviewPanel.jsx` | Zmeneno | 1-30 | Import formatters (formatSize), smazáno 3 nepoužívané importy (Button, Badge, useState) |
| 9 | `src/pages/admin/AdminCustomers.jsx` | Zmeneno | 1-35 | Import formatters (formatMoney, formatDateTime, formatRelativeTime) |
| 10 | `src/pages/admin/AdminAnalytics.jsx` | Zmeneno | 1-40 | Import formatters (formatMoney, formatRelativeTime), smazáno TEAL_DARK konstanta |
| 11 | `src/pages/admin/AdminActivityLog.jsx` | Zmeneno | 1-30 | Import formatters (formatRelativeTime, formatDateTime) |
| 12 | `src/pages/admin/components/kanban/KanbanCard.jsx` | Zmeneno | 1-35 | Import formatters (formatMoney, formatDateTime), import orderConstants (getStatusColor) |
| 13 | `src/pages/admin/components/NotificationCenter.jsx` | Zmeneno | 1-25 | Import formatters (formatRelativeTime) |
| 14 | `src/pages/admin/AdminExpress.jsx` | Zmeneno | 20-40, 85-110, 145-160 | Rename `t` → `tier`/`item` (var collision fix), smazáno deepClone util, console.error → debug() |
| 15 | `src/pages/admin/AdminPayments.jsx` | Zmeneno | 95-115, 140-160 | console.error → debug() pro error handling |
| 16 | `src/pages/admin/AdminModelStorage.jsx` | Zmeneno | 180-200 | console.error → debug() |
| 17 | `src/pages/admin/components/DashboardCharts.jsx` | Zmeneno | 1-15 | Smazáno nepoužívané `Legend` importu z recharts |
| 18 | `src/pages/admin/components/AnalyticsCharts.jsx` | Zmeneno | 1-20 | Smazáno TEAL_DARK hardcoded konstanta, sjednoceno s forge-tokens.css |
| 19 | `src/pages/admin/components/PresetComparison.jsx` | Zmeneno | 245-255 | type="button" na compare button (bylo type="submit" bez formu) |
| 20 | `src/pages/admin/components/widget/WidgetDomainsTab.jsx` | Zmeneno | 120-130 | type="button" na remove domain button |
| 21 | `src/pages/admin/AdminOrderDetail.jsx` | Zmeneno | 45-65 | Import orderConstants (getStatusColor), smazáno 8 lokálních STATUS_COLORS řádků |
| 22 | `src/pages/admin/components/orders/OrderDetailModal.jsx` | Zmeneno | 1-20 | Import orderConstants (getStatusColor, STATUS_LABELS) |

---

## Detailni zmeny

### 1. `src/utils/formatters.js` (NOVÝ SOUBOR)

**Typ:** Novy soubor
**Radky:** 1-180
**Duvod:** Centralizace opakovaných formatter funkcí — v 10+ souborech byly duplikovány (formatMoney, formatDateTime, formatSize atd.)

**Co se zmenilo:**
- Vytvořen hlavní utility soubor s 8 exportovanými funkcemi
- formatMoney(value, decimals, currency) — formátuje cenu na CZK s dvěma desetinnými místy
- formatTime(ms) — převede ms na "XXh XXm XXs"
- formatDateTime(date) — vrátí "YYYY-MM-DD HH:MM:SS"
- formatDate(date) — vrátí "YYYY-MM-DD"
- formatTimeShort(ms) — zkrácená verze (např. "2h 30m")
- formatRelativeTime(date) — "před 2 hod", "před 3 dny" atd.
- formatSize(bytes) — "1.5 MB", "512 KB" atd.
- safeNum(val) — bezpečné parsování čísla (null → 0)
- formatMoneyInt(value) — formatuje bez des. míst (např. "1,250 Kč")

---

### 2. `src/utils/orderConstants.js` (NOVÝ SOUBOR)

**Typ:** Novy soubor
**Radky:** 1-25
**Duvod:** Centralizace status helper funkcí — STATUS_COLORS a STATUS_LABELS byly duplikovány v OrderDetailModal a AdminOrderDetail

**Co se zmenilo:**
- Vytvořen soubor s centrálními konstantami pro objednávky
- STATUS_COLORS = { pending: '#FFB800', processing: '#2563EB', shipped: '#10B981', delivered: '#6B7280', cancelled: '#EF4444' }
- STATUS_LABELS = { pending: 'Čeká se', processing: 'Zpracování', ... }
- getStatusColor(status) — helper funkce vrací barvu pro daný status

---

### 3-13. Deduplikace formatters (10 souborů)

**Typ:** Zmeneno
**Radky:** Různé (1-50 na začátku)
**Duvod:** Nahrazení lokálních formatter definic importem z centrálního formatters.js

**Co se zmenilo:**
- AdminOrderDetail.jsx: smazáno 15 řádků formatovacích funkcí, přidán import
- AdminOrders.jsx: přidán import orderConstants pro getStatusColor
- TabItemsFiles.jsx, PrintQueue.jsx, FileListPanel.jsx: import formatters
- PreviewPanel.jsx: import formatters + smazáno 3 nepoužívané importy (Button, Badge, useState)
- AdminCustomers.jsx, AdminAnalytics.jsx, AdminActivityLog.jsx: import formatters
- KanbanCard.jsx: import formatters + import orderConstants (getStatusColor)
- NotificationCenter.jsx: import formatters (formatRelativeTime)

**Pred:**
```jsx
// V AdminOrderDetail.jsx byla funkce:
const formatMoney = (val) => {
  if (!val) return '0 Kč';
  return val.toFixed(2) + ' Kč';
};

// Stejná nebo podobná byla v 5+ dalších souborech
```

**Po:**
```jsx
// Nyní v AdminOrderDetail.jsx:
import { formatMoney, formatDateTime } from '@/utils/formatters';
import { getStatusColor } from '@/utils/orderConstants';
```

---

### 14. `src/pages/admin/AdminExpress.jsx`

**Typ:** Zmeneno
**Radky:** 20-40, 85-110, 145-160
**Duvod:** Oprava var collision (variable `t` byla kolize s i18n context), smazání nepoužívaného deepClone, normalizace error handling

**Co se zmenilo:**
- Var collision fix: přeznačena proměnná `t` (tier tier) → `tier` a `item` (iterační proměnná)
- Smazáno 8 řádků deepClone utility (nepoužíváno)
- console.error → debug() pro 3 error handling bloky

**Pred:**
```jsx
const t = tier; // kolize s useTranslation() const { t } = ...
for (const t of items) { ... } // duplikát
const deepClone = (obj) => JSON.parse(JSON.stringify(obj));
```

**Po:**
```jsx
const tier = tierData;
for (const item of items) { ... }
// deepClone smazáno
debug('Error processing tier:', error);
```

---

### 15-16. console.error → debug()

**Typ:** Zmeneno
**Radky:** Různé
**Duvod:** Normalizace error loggingu — všechny console.error → debug() wrapper

**Co se zmenilo:**
- AdminPayments.jsx: 2 console.error → debug()
- AdminModelStorage.jsx: 1 console.error → debug()

---

### 17-18. Dead code cleanup (2 soubory)

**Typ:** Odebrano
**Radky:** Import lines
**Duvod:** Nepoužívané importy a hardcoded konstanty

**Co se zmenilo:**
- DashboardCharts.jsx: smazáno `import { Legend } from 'recharts'` (nepoužíváno)
- AnalyticsCharts.jsx: smazáno hardcoded TEAL_DARK = '#0D9488', nyní se používá CSS var

---

### 19-20. type="button" doplnění (2 soubory)

**Typ:** Zmeneno
**Radky:** 245-255, 120-130
**Duvod:** Best practice — tlačítka mimo formulář by měla mít type="button"

**Co se zmenilo:**
- PresetComparison.jsx: compare button → type="button" (bylo type="submit" bez formu)
- WidgetDomainsTab.jsx: remove domain button → type="button"

---

## Dopad zmen

- **Ovlivnene komponenty:** 22 souborů (12 admin stránek, 10 komponent)
- **Breaking changes:** Ne
- **Nove zavislosti:** Ne (jen interní reorganizace)
- **Rizika:** Nízká — čistě refaktoring, žádné logické změny

---

## Testovani

- **Build:** npm run build — PASS
- **Manual test:** Browser testing 7 stránek — všechny PASS bez console errors
- **Poznamky:** Měkká migraci — všechny importy funkční, žádné chybějící případy

---

<!-- KONEC SABLONY -->
