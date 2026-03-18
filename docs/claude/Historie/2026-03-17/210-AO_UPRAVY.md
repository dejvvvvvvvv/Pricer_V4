# 210-AO — UPRAVY — Admin-Orders (P2 Order Detail, Export, Per-model Fees) — 2026-03-17

## Metadata
- **ID:** 210-AO
- **Session:** S04
- **Datum:** 2026-03-17
- **Oblast:** Admin-Orders / Checkout / Export
- **Souvisejici ID:** 208-AO (P0), 209-AO (P1)
- **Trigger:** P2 implementace — rozsireni modalniho detailu objednavky, exportu a per-model fees zobrazeni

---

## Souhrn uprav

Treti faze oprav order dat (P2). Pridana PricingSummary komponenta jako sticky footer v OrderDetailModal s kompletnim pricing breakdown. Rozsiren TabItemsFiles o material price_per_gram a per-model fees breakdown. CSV/JSON export rozsiren o 9 novych sloupcu.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Popis |
|---|--------|-----------|-------|
| 1 | src/pages/admin/components/orders/OrderDetailModal.jsx | Zmeneno | Nova PricingSummary komponenta — sticky footer s pricing breakdown |
| 2 | src/pages/admin/components/orders/TabItemsFiles.jsx | Zmeneno | Material price_per_gram zobrazeni + per-model fees breakdown sekce |
| 3 | src/pages/admin/components/OrderExportActions.jsx | Zmeneno | CSV/JSON export rozsiren o 9 novych sloupcu |

---

## Detailni zmeny

### 1. `src/pages/admin/components/orders/OrderDetailModal.jsx`

**Typ:** Zmeneno
**Duvod:** Chybel kompletni pricing breakdown ve forme sticky footer

**Co se zmenilo:**
- Nova komponenta `PricingSummary` — sticky footer v modalnim okne
- Zobrazuje: subtotal, order fees, express (oranzova), kupon s kodem (zelena), volume discount (zelena), markup, doprava s nazvem metody, zaokrouhleni, celkem
- Podminene zobrazeni radku — jen pokud castka > 0
- Barevne rozliseni: zelena pro slevy, oranzova pro express surcharge

---

### 2. `src/pages/admin/components/orders/TabItemsFiles.jsx`

**Typ:** Zmeneno
**Duvod:** Chybely detailni informace o materialu a per-model fees

**Co se zmenilo:**
- Material `price_per_gram` zobrazeni vedle nazvu materialu v tabulce modelu
- Nova sekce pod tabulkou modelu: per-model fees breakdown
- Jednotlive fees s nazvy, typy a castkami

---

### 3. `src/pages/admin/components/OrderExportActions.jsx`

**Typ:** Zmeneno
**Duvod:** Export neobsahoval nove pridana data z P0/P1 fazi

**Co se zmenilo:**
- 9 novych sloupcu v CSV/JSON exportu:
  - `shipping_method` — nazev dopravni metody
  - `express_tier` — uroven express doruceni
  - `express_surcharge` — priplatek za express
  - `coupon_code` — kod pouziteho kuponu
  - `coupon_discount` — sleva z kuponu
  - `volume_discount` — mnozstevni sleva
  - `markup` — marze
  - `order_fees` — celkove poplatky objednavky
  - `payment_method` — zpusob platby

---

## Celkovy souhrn session (P0 + P1 + P2)

### P0 (ID 208-AO, 5 souboru)
- CheckoutForm: 7 novych snapshot poli (shipping, express, volume_discount, order_fees, rozsirene totals, material price_per_gram, fees_detail)
- adminOrdersStorage: 6 novych poli v computeOrderTotals
- AdminOrderDetail: 11-polozkovy pricing breakdown
- TabShipping: dopravni metoda, express, fakturacni adresa
- TabCustomer: firemni udaje, kupon, platebni udaje

### P1 (ID 209-AO, 2 soubory)
- adminOrdersStorage: autoritativni early return z totals_snapshot, opraveny fallback
- AdminOrderDetail: ModelPricingDetail komponenta (per-model pricing, material, volume discount)

### P2 (ID 210-AO, 3 soubory)
- OrderDetailModal: PricingSummary sticky footer
- TabItemsFiles: material price_per_gram, per-model fees
- OrderExportActions: 9 novych export sloupcu

---

## Dopad zmen

- **Ovlivnene komponenty:** OrderDetailModal, TabItemsFiles, OrderExportActions, navaznost na data z P0/P1 fazi
- **Breaking changes:** Ne — vsechny nove sekce jsou podminene (zobrazuji se jen pokud data existuji)
- **Nove zavislosti:** Zadne
- **Rizika:** Minimalni — widget nema checkout flow, nepotrebuje upravy

---

## Testovani

- **Build:** npm run build — PASS (vsechny 3 faze P0/P1/P2)
- **Manual test:** Overeni zobrazeni PricingSummary, per-model fees, export sloupcu
- **Poznamky:** Widget nepotrebuje upravy (nema checkout flow)

---
