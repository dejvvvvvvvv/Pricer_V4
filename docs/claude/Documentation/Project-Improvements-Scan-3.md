# Project Improvements — Třetí průzkum

**Datum:** 2026-03-18
**Zaměření:** Vylepšení existujícího kódu

---

## P1 — Vysoká priorita (6)

### 1. DRY: parseDecimal/finalizeDecimal/parseIntInput — 13 duplikátů
- **Soubory:** AdminPricing, AdminFees, AdminExpress, AdminEmails, AdminCoupons, AdminShipping, AdminSettings, AdminPresets, AdminPayments, WidgetEmbedTab, PresetInlineEditor, PrintConfiguration, NumberPropertyEditor
- **Řešení:** Extrahovat do src/utils/formatters.js, importovat
- **Složitost:** Jednoduchá
- **Implementováno:** [ ]

### 2. DRY: safeNum — 11 lokálních duplikátů
- **Soubory:** AdminPricing, AdminCoupons, pricingEngineV3, couponValidator, shippingCalculator, adminPricingStorage, adminFeesStorage, adminShippingStorage, adminExpressStorage, adminKanbanStorage, adminPaymentStorage
- **Řešení:** UI soubory importovat z formatters.js, pricing lib nechat (zero-dependency záměr)
- **Složitost:** Jednoduchá
- **Implementováno:** [ ]

### 3. DRY: ConfirmModal — 3 lokální definice místo ForgeConfirmDialog
- **Soubory:** AdminOrders.jsx, AdminOrderDetail.jsx, AdminParameters.jsx
- **Řešení:** Nahradit za useConfirmDialog/ForgeConfirmDialog
- **Složitost:** Střední
- **Implementováno:** [ ]

### 4. DRY: getSlicerTimeMin/getSlicerWeightG — 3 kopie
- **Soubory:** AdminOrders, AdminOrderDetail, orderExportGenerator
- **Řešení:** Přesunout do adminOrdersStorage.js
- **Složitost:** Jednoduchá
- **Implementováno:** [ ]

### 5. DRY: createStableId vs generateId
- **Soubor:** AdminPricing.jsx
- **Řešení:** Použít import z generateId.js
- **Složitost:** Jednoduchá
- **Implementováno:** [ ]

### 6. Security: innerHTML bez React v FileListPanel
- **Soubor:** FileListPanel.jsx:457
- **Řešení:** Nahradit React state + podmíněný render
- **Složitost:** Jednoduchá
- **Implementováno:** [ ]

---

## P2 — Střední priorita (6)

### 7. Performance: refreshTags bez useCallback v AdminOrders
### 8. DX: Hardcoded 'cs' v getStatusLabel (AdminOrderDetail)
### 9. DX: Chybí JSDoc pro pricing engine
### 10. Security: dangerouslySetInnerHTML audit (sanitizeHtml)
### 11. Performance: innerHTML mutace v AdminEmails editor
### 12. DX: adminCouponsStorage vs adminCouponStorage (dva podobné soubory)

---

## P3 — Nízká priorita (4)

### 13. Performance: Inline <style> v JSX (AdminOrders, AdminOrderDetail)
### 14. DX: Chybí displayName pro memoizované komponenty
### 15. Error handling: Granulární error boundaries v admin
### 16. DX: Magic string localStorage klíče

---

## Statistika
- P1: 6 vylepšení
- P2: 6 vylepšení
- P3: 4 vylepšení
- Celkem: 16 příležitostí
