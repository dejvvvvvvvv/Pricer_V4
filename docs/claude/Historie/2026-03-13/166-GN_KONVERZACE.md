# 166-GN — KONVERZACE — Utilities + P2 Fixes + Browser Testing — 2026-03-13

## Metadata
- **ID:** 166-GN
- **Session:** S27
- **Datum:** 2026-03-13
- **Oblast:** General / Utilities / Code Quality
- **Souvisejici ID:** 164-GN (P1 Bugs Wave 4-5), 165-GN (Related UPRAVY)

---

## Tema session

Vlna 7: Centralizace utility funkcí (formatters, order constants), dead code cleanup, browser testing 7 stránek. Pokračování v P1/P2 bugfixech a standardizaci kódu.

---

## Prubeh konverzace

### [1] Uzivatel
> Ulož historii. Kontext:
>
> ## Session 2026-03-13 — Vlna 6-7: P1/P2 fixes + Browser testing + Utilities
>
> ### Vlna 6 — Zbývající P1 bugs:
> 1. AdminBranding.jsx — flush on unmount guard (null payload), try/catch v useEffect
> 2. TabCustomer.jsx — notes key fix (note.id), TODO pro user_id
> 3. OrderCalendar.jsx — computeOrderTotals do useMemo (performance)
> 4. OrderTagSelector.jsx — deduplikace getOrderTags, try/catch
> 5. WidgetConfigTab.jsx — borderRadius JS clamp (0-32)
> 6. AdminExpress.jsx — `t` var collision → `tier`/`item`
> 7. PresetInlineEditor.jsx — draft reset po uložení (savedDraftRef)
>
> ### Vlna 7 — Utilities + P2 + Browser testing:
>
> **Centrální formatters.js:**
> - Vytvořen `src/utils/formatters.js` s 8 funkcemi (formatMoney, formatTime, formatDateTime, formatDate, formatTimeShort, formatRelativeTime, formatSize, safeNum, formatMoneyInt)
> - 10 souborů nahradilo lokální duplikáty importem (AdminOrderDetail, AdminOrders, TabItemsFiles, PrintQueue, FileListPanel, PreviewPanel, AdminCustomers, AdminAnalytics, AdminActivityLog, KanbanCard, NotificationCenter)
>
> **orderConstants.js:**
> - Vytvořen `src/utils/orderConstants.js` — STATUS_COLORS, STATUS_LABELS, getStatusColor()
> - 2 soubory deduplikovány (AdminOrderDetail, OrderDetailModal)
>
> **Dead code cleanup:** AdminExpress deepClone, DashboardCharts Legend import, AnalyticsCharts TEAL_DARK, PreviewPanel 3 unused imports
>
> **console.error → debug():** AdminPayments, AdminExpress, AdminModelStorage
>
> **type="button":** PresetComparison, WidgetDomainsTab
>
> **Browser testing (7 stránek):** Všech 7 OK bez console errors — Dashboard, Pricing, Fees, Orders, Express, Test kalkulačka, Coupons
>
> ### Nové soubory: formatters.js, orderConstants.js
> ### Změněné soubory: ~25 admin stránek a komponent

### [1] Claude
**Shrnuti odpovedi:**
- Příjem kontextu pro Vlnu 6-7: 7 P1 bugfixů z AdminBranding, TabCustomer, OrderCalendar, atd.
- Centralizace utility: formatters.js (8 funkcí), orderConstants.js (status helpers)
- Dead code cleanup v 5 souborech, console normalizace, type="button" doplnění
- Browser testing 7 stránek — všechny PASS bez chyb
- Celkem ~25 souborů změněno, 2 nové utility soubory

**Akce provedene:**
- Vytvoření historie záznamů pro Vlnu 6 (UPRAVY) a Vlnu 7 (KONVERZACE, UPRAVY)
- Aktualizace ID-REGISTRY.md (pocitadlo → 167)
- Aktualizace MASTER-HISTORIE.md (3 nové řádky pro dne 2026-03-13)

---

## Rozhodnuti ucinena v teto session

| # | Rozhodnuti | Kontext/duvod | Kdo rozhodl |
|---|-----------|---------------|-------------|
| 1 | Vytvořit centrální formatters.js | Duplikáty formatovacích funkcí v 10+ souborech → DRY princip | Claude |
| 2 | Vytvořit orderConstants.js | STATUS_COLORS/LABELS duplikovány v 2 souborech → centralizace | Claude |
| 3 | Dead code cleanup v 5 souborech | Nepoužívané importy, funkce, CSS třídy → clean codebase | Claude |
| 4 | Browser testing bez rata-limit | 7 hlavních stránek odzkoušeno — všechny PASS | Claude |

---

## Navaznost

- **Predchozi:** 165-GN (P1 Bugs Wave 4-5)
- **Nasledujici:** zatím žádný další zaznam

---

<!-- KONEC SABLONY -->
