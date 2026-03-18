# 209-AO — UPRAVY — Admin-Orders — 2026-03-17

## Metadata
- **ID:** 209-AO
- **Session:** S03
- **Datum:** 2026-03-17
- **Oblast:** Admin-Orders / Checkout / Pricing
- **Souvisejici ID:** 208-AO (P0 Order Data Completeness)
- **Trigger:** P1 implementace — oprava computeOrderTotals logiky a rozsireni admin zobrazeni per-model pricing

---

## Souhrn uprav

Oprava `computeOrderTotals` v adminOrdersStorage.js, kde se chybne pricital shipping k uz finalnimu total. Pridani early return pro objednavky s kompletnim `totals_snapshot` — pouziti autoritativnich dat z pricing engine. Rozsireni legacy fallbacku o express, coupon, volume discount, order fees a markup. Nova komponenta `ModelPricingDetail` v AdminOrderDetail pro per-model pricing breakdown vcetne material cost, time cost, fees rozpadu a mnozstevnich slev.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | src/utils/adminOrdersStorage.js | Zmeneno | computeOrderTotals | Early return pro totals_snapshot, oprava shipping double-add, legacy fallback rozsiren |
| 2 | src/pages/admin/AdminOrderDetail.jsx | Pridano | ModelPricingDetail | Nova komponenta per-model pricing breakdown, ExpandableModelRow aktualizovan |

---

## Detailni zmeny

### 1. `src/utils/adminOrdersStorage.js`

**Typ:** Zmeneno
**Duvod:** computeOrderTotals chybne pripocitaval shipping k uz finalnimu total z totals_snapshot. Legacy fallback chybel express, coupon, volume discount, order fees a markup.

**Co se zmenilo:**
- Novy early return pro objednavky s kompletnim `totals_snapshot` — pouziva autoritativni data z pricing engine
- Odstranen chybny fallback kde se shipping pricitival k uz finalnimu total
- Legacy fallback rozsiren o 6 novych poli: express, coupon, volume_discount, order_fees, markup, subtotal
- Vsech 6 novych poli z P0 (208-AO) se spravne ctou a vraceji

```js
// PRED:
const total = order.totals_snapshot?.total || order.total || 0;
return { ...result, total: total + shipping }; // double-add shipping!

// PO:
if (order.totals_snapshot?.total != null) {
  return { ...order.totals_snapshot }; // autoritativni zdroj
}
// legacy fallback s express, coupon, volume_discount, order_fees, markup
```

---

### 2. `src/pages/admin/AdminOrderDetail.jsx`

**Typ:** Pridano
**Duvod:** Zobrazeni per-model pricing breakdown v admin detail objednavky — material cost s price_per_gram anotaci, time cost, fees rozpad, mnozstevni slevy.

**Co se zmenilo:**
- Nova komponenta `ModelPricingDetail` — per-model pricing breakdown
  - Material cost s price_per_gram anotaci
  - Time cost
  - Fees rozpad (jednotlive fees nebo fallback fees_total)
  - Material info sekce s cenou za gram
  - Mnozstevni sleva per model: tier info, originalni vs. zlevnena cena, uspora
- Responzivni CSS grid (1-3 sloupce podle obsahu)
- `ExpandableModelRow` aktualizovan pro predani `order` prop
- Podminene zobrazeni pro zpetnou kompatibilitu (stare objednavky bez dat nezobrazuji prazdne sekce)

---

## Dopad zmen

- **Ovlivnene komponenty:** AdminOrderDetail, AdminOrders (neprime — data z computeOrderTotals), OrderConfirmation
- **Breaking changes:** Ne — early return pro totals_snapshot je zpetne kompatibilni, stare objednavky padnou do legacy fallbacku
- **Nove zavislosti:** Zadne
- **Rizika:** Stare objednavky bez totals_snapshot mohou zobrazovat nekompletni data — osetreno podminenym zobrazenim

---

## Testovani

- **Build:** npm run build — PASS
- **Manual test:** Overeno zobrazeni objednavek s kompletnim snapshot i bez nej
- **Poznamky:** computeOrderTotals nyni preferuje totals_snapshot jako autoritativni zdroj, fallback zachovan pro stare objednavky

---

<!-- KONEC SABLONY -->
