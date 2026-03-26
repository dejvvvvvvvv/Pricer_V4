# 264-GN — UPRAVY — Batch 1 Bug Fixes (PDF, Z-Index, Firma removal) — 2026-03-24

## Metadata
- **ID:** 264-GN
- **Session:** S01
- **Datum:** 2026-03-24
- **Oblast:** General (Admin-Orders + Checkout)
- **Souvisejici ID:** 155-AO, 103-PY
- **Trigger:** Uzivatelsky pozadavek — ukoly z `docs/claude/Error_LOG-Dokumentace/Ukoly pro upravu_opravu.md`, Batch 1

---

## Souhrn uprav

Batch 1 implementace 4 tasku z Error LOGu: (1) PDF stahovani faktury misto window.print(), (2) z-index fix pro sticky status card, (3) odstraneni pole "Firma" z order preview, (4) odstraneni inputu "Firma" z checkout formu. Vsechny 4 tasky prosly `npm run build` bez chyb.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | src/pages/admin/AdminOrderDetail.jsx | Zmeneno | handlePrintInvoice | Nahrazeno window.print() za html2pdf.js dynamicky import |
| 2 | src/pages/admin/AdminOrderDetail.jsx | Zmeneno | ~2554 | Pridan zIndex: 10 na Status change Card |
| 3 | src/pages/admin/AdminOrderDetail.jsx | Odebrano | ~2410 | Odstranen radek s company/Firma ze sekce zakaznik |
| 4 | src/pages/test-kalkulacka/CheckoutForm.jsx | Odebrano | 723-730 | Odstranen input FIRMA/COMPANY z kontaktni sekce |
| 5 | package.json | Zmeneno | dependencies | Pridana zavislost html2pdf.js |

---

## Detailni zmeny

### 1. `src/pages/admin/AdminOrderDetail.jsx` — PDF Download

**Typ:** Zmeneno
**Radky:** handlePrintInvoice funkce
**Duvod:** window.print() oteviral nativni print dialog misto stahovani PDF souboru

**Co se zmenilo:**
- Pred: `window.print()` — otevrel print dialog prohlizece
- Po: Dynamicky import `html2pdf.js`, generuje PDF z invoice elementu
- Stahuje soubor jako `faktura-{invoiceNumber}.pdf`
- Fallback na `window.print()` pri selhani html2pdf

```jsx
// PRED:
window.print();

// PO:
const html2pdf = (await import('html2pdf.js')).default;
const element = document.getElementById('invoice-content');
html2pdf().set({ margin: 10, filename: `faktura-${invoiceNumber}.pdf` }).from(element).save();
```

---

### 2. `src/pages/admin/AdminOrderDetail.jsx` — Z-Index Fix

**Typ:** Zmeneno
**Radky:** ~2554
**Duvod:** Status change Card mel position: sticky ale chybel zIndex, takze "+Stitek" tlacitko nebylo videt pri rozsirenni sekce zmeny stavu

**Co se zmenilo:**
- Pridan `zIndex: 10` na existujici sticky element
- Pred: `position: 'sticky'` bez zIndex
- Po: `position: 'sticky', zIndex: 10`

---

### 3. `src/pages/admin/AdminOrderDetail.jsx` — Remove Firma from Order Preview

**Typ:** Odebrano
**Radky:** ~2410
**Duvod:** Pole "Firma" v sekci zakaznik v order preview je nadbytecne — firemni udaje jsou v oddelene sekci

**Co se zmenilo:**
- Odstranen radek `{ key: 'company', label: 'Firma', value: customer.company }`
- Zustavaji: Jmeno, Email, Telefon

---

### 4. `src/pages/test-kalkulacka/CheckoutForm.jsx` — Remove Firma Input

**Typ:** Odebrano
**Radky:** 723-730
**Duvod:** Input "FIRMA"/"COMPANY" v kontaktni sekci byl duplicitni — firemni udaje zustaly v toggle sekci "Nakupuji na firmu"

**Co se zmenilo:**
- Odstranen input pro firmu z kontaktni sekce checkout formulare
- Toggle sekce "Nakupuji na firmu" s ICO/DIC zustava beze zmeny

---

### 5. `package.json` — Nova zavislost

**Typ:** Zmeneno
**Radky:** dependencies
**Duvod:** Potreba pro PDF generovani v Task 1.1

**Co se zmenilo:**
- Pridana zavislost `html2pdf.js`

---

## Dopad zmen

- **Ovlivnene komponenty:** AdminOrderDetail (order detail page), CheckoutForm (checkout flow v test-kalkulacce)
- **Breaking changes:** Ne
- **Nove zavislosti:** html2pdf.js (npm balicek pro generovani PDF z HTML)
- **Rizika:** html2pdf.js dynamicky import — pokud se balicek nenacte, fallback na window.print()

---

## Testovani

- **Build:** npm run build — PASS
- **Manual test:** Vsechny 4 tasky overeny
- **Poznamky:** Batch 1 ze sady ukolu z Error LOGu, dalsi batche nasleduji
