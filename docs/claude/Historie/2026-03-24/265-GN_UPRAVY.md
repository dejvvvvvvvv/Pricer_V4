# 265-GN — UPRAVY — Batch 2 Bug Fixes — 2026-03-24

## Metadata
- **ID:** 265-GN
- **Session:** S01
- **Datum:** 2026-03-24
- **Oblast:** General (AO + FE)
- **Souvisejici ID:** 264-GN (Batch 1)
- **Trigger:** Pokracovani oprav z Error LOGu — Batch 2 (Task 1.2 + Task 2.2 + Task 2.3)

---

## Souhrn uprav

Batch 2 obsahoval 3 tasky: opravu vypoctu poplatku ve fakturach (invoiceGenerator), pridani sipek pro navigaci stavu objednavek a odemceni vsech prechodu stavu (status transitions). Vsechny zmeny prosly npm run build.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky | Popis |
|---|--------|-----------|-------|-------|
| 1 | src/utils/invoiceGenerator.js | Zmeneno | vice oblasti | Pridany chybejici fee radky do HTML faktury |
| 2 | src/pages/admin/AdminOrderDetail.jsx | Zmeneno | header sekce | Sipky ChevronLeft/ChevronRight pro status navigaci |
| 3 | src/utils/statusTransitions.js | Zmeneno | canTransition + getNextStatuses | Odemceni vsech validnich prechodu stavu |

---

## Detailni zmeny

### 1. `src/utils/invoiceGenerator.js`

**Typ:** Zmeneno
**Duvod:** Faktura nezobrazovala vsechny polozky ceny — chybely order fees, express surcharge, markup, volume discount, coupon discount a rounding delta.

**Co se zmenilo:**
- Pridany HTML radky pro: order_fees_snapshot, express_surcharge_total, markup_amount, volume_discount_total, coupon_discount_total, rounding_delta
- Pouziva totals_snapshot.total jako autoritativni celkovou castku
- Kazdy typ poplatku se zobrazi jen pokud ma nenulovou hodnotu

---

### 2. `src/pages/admin/AdminOrderDetail.jsx`

**Typ:** Zmeneno
**Duvod:** Admin chtel vizualni navigaci mezi stavy objednavky — sipky "Dalsi"/"Zpet" vedle dropdown menu.

**Co se zmenilo:**
- Import ChevronLeft a ChevronRight ikon
- Pridany sipky do headeru sekce zmeny stavu
- Labely "Dalsi" a "Zpet" pro snadnou orientaci

---

### 3. `src/utils/statusTransitions.js`

**Typ:** Zmeneno
**Duvod:** Prechody stavu byly uzamceny — admin nemohl volne menit stav objednavky.

**Co se zmenilo:**
- canTransition() nyni vraci true pro jakykoliv validni par stavu (ne jen predem definovane sekvence)
- getNextStatuses() vraci vsechny stavy krome aktualniho
- Dropdown bez zamku — admin ma plnou kontrolu

---

## Dopad zmen

- **Ovlivnene komponenty:** Faktura (PDF/HTML), AdminOrderDetail status sekce
- **Breaking changes:** Ne
- **Nove zavislosti:** Zadne
- **Rizika:** Volne prechody stavu mohou zpusobit neocekavane workflow pokud admin neni obezretny

---

## Testovani

- **Build:** npm run build — PASS
- **Manual test:** Overeni generovani faktury s poplatky, status navigace sipkami
- **Poznamky:** Zadne

---
