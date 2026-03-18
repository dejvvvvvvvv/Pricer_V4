# 208-AO — UPRAVY — Admin-Orders / Checkout — 2026-03-17

## Metadata
- **ID:** 208-AO
- **Session:** S02
- **Datum:** 2026-03-17
- **Oblast:** Admin-Orders + Checkout (Order Data Completeness)
- **Souvisejici ID:** 098-AO, 099-AO, 100-AO, 101-AO, 102-PY, 103-PY, 155-AO, 207-BH
- **Trigger:** P0 oprava — objednavky neukladaly kompletni cenove a dopravni data, admin detail zobrazoval jen 5 z 11 pricing polozek

---

## Souhrn uprav

P0 implementace rozsireni order objektu v CheckoutForm o kompletni snapshoty (shipping, express, volume discount, order fees, rozsireny totals_snapshot) a per-model fees detail. Admin Order Detail rozsiren z 5 na 11 pricing polozek. AdminOrdersStorage rozsiren o 6 novych return poli v computeOrderTotals. Tab stranky (Shipping, Customer) doplneny o nove sekce.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | src/pages/test-kalkulacka/components/CheckoutForm.jsx | Zmeneno | vice oblasti | Rozsireni order objektu o 6 novych snapshot poli |
| 2 | src/utils/adminOrdersStorage.js | Zmeneno | computeOrderTotals | 6 novych return poli v computeOrderTotals |
| 3 | src/pages/admin/AdminOrderDetail.jsx | Zmeneno | pricing breakdown | Kompletni pricing breakdown (11 polozek misto 5) |
| 4 | src/pages/admin/components/orders/TabShipping.jsx | Zmeneno | vice oblasti | Nove sekce: dopravni metoda, express doruceni, fakturacni adresa |
| 5 | src/pages/admin/components/orders/TabCustomer.jsx | Zmeneno | vice oblasti | Nove sekce: firemni udaje, kupon, platebni udaje |

---

## Detailni zmeny

### 1. `src/pages/test-kalkulacka/components/CheckoutForm.jsx`

**Typ:** Zmeneno
**Duvod:** Order objekt neukladal dopravni, express, volume discount a fees data — admin nemel co zobrazit

**Co se zmenilo:**
- Pridano `shipping_snapshot` (id, name, type, cost, delivery_days, free_shipping_applied)
- Pridano `express_snapshot` (tier_id, surcharge_total, details)
- Pridano `volume_discount_snapshot` (mode, scope, total_savings, details)
- Pridano `order_fees_snapshot` — pole aplikovanych ORDER-level fees (id, name, type, value, amount)
- Rozsireny `totals_snapshot` o 7 novych poli: express_surcharge_total, coupon_discount_total, volume_discount_total, order_fees_total, subtotal_before_markup, markup_amount, models_total
- Pridano `material_snapshot.price_per_gram` per model
- Pridano `price_breakdown_snapshot.fees_detail` per model — pole fees s id, name, type, amount

---

### 2. `src/utils/adminOrdersStorage.js`

**Typ:** Zmeneno
**Duvod:** computeOrderTotals nemel nove fields pro admin zobrazeni

**Co se zmenilo:**
- Pridano 6 novych return poli z totals_snapshot: express_surcharge_total, coupon_discount_total, volume_discount_total, order_fees_total, subtotal_before_markup, markup_amount
- Fallback na 0 pro zpetnou kompatibilitu se starymi objednavkami

---

### 3. `src/pages/admin/AdminOrderDetail.jsx`

**Typ:** Zmeneno
**Duvod:** Pricing breakdown zobrazoval jen 5 polozek (subtotal, shipping, tax, discount, total)

**Co se zmenilo:**
- Rozsiren pricing breakdown na 11 polozek: models_total, order_fees_total, express_surcharge, subtotal_before_markup, markup_amount, subtotal, shipping, coupon_discount, volume_discount, tax, grand_total
- Podminene zobrazeni — sekce se zobrazuji jen pokud data existuji (zpetna kompatibilita)
- Zobrazeni kuponu, express prirazky, volume discount v detailu

---

### 4. `src/pages/admin/components/orders/TabShipping.jsx`

**Typ:** Zmeneno
**Duvod:** Tab neukazoval dopravni metodu, express doruceni ani fakturacni adresu

**Co se zmenilo:**
- Nova sekce: Dopravni metoda (nazev, typ, cena, doba doruceni, free shipping indikator)
- Nova sekce: Express doruceni (tier, prirazka, detaily)
- Nova sekce: Fakturacni adresa (z billing_address snapshot)
- Podminene zobrazeni — sekce se zobrazuji jen pokud snapshot existuje

---

### 5. `src/pages/admin/components/orders/TabCustomer.jsx`

**Typ:** Zmeneno
**Duvod:** Tab nezobrazoval firemni udaje, kupon ani platebni metodu

**Co se zmenilo:**
- Nova sekce: Firemni udaje (nazev firmy, ICO, DIC z billing_address)
- Nova sekce: Kupon (kod, sleva, typ z coupon_snapshot)
- Nova sekce: Platebni udaje (metoda platby, platebni reference)
- Podminene zobrazeni — sekce se zobrazuji jen pokud data existuji

---

## Dopad zmen

- **Ovlivnene komponenty:** CheckoutForm (order creation), AdminOrderDetail (pricing display), TabShipping, TabCustomer, adminOrdersStorage (computeOrderTotals)
- **Breaking changes:** Ne — vsechna nova pole maji fallback na null/0/[] pro zpetnou kompatibilitu
- **Nove zavislosti:** Zadne
- **Rizika:** Stare objednavky (pred touto zmenou) nebudou mit nova pole — admin zobrazuje jen co existuje

---

## Testovani

- **Build:** npm run build — PASS
- **Manual test:** Zpetna kompatibilita se starymi objednavkami (podminene zobrazeni)
- **Poznamky:** Dalsi kroky — P1: detailnejsi zobrazeni fees/volume discount, P2: model-level fees rozpad

---

<!-- KONEC ZAZNAMU -->
