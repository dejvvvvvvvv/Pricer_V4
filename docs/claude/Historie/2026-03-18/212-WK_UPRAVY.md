# 212-WK — UPRAVY — Widget-Kalkulacka P1 Fixes — 2026-03-18

## Metadata
- **ID:** 212-WK
- **Session:** S02
- **Datum:** 2026-03-18
- **Oblast:** Widget-Kalkulacka + Test-Kalkulacka
- **Souvisejici ID:** 211-WK
- **Trigger:** P1 code review fixes — nekonzistentni formatovani cen, Tailwind classes ve widgetu, chybejici resety, nepouzivane importy

---

## Souhrn uprav

Oprava P1 problemu zjustenych pri code review widget-kalkulacky. Hlavni oblasti: chybejici resety pri novem objednavkovem flow, Tailwind classes v CTA/filelist sekcich nahrazeny inline styles (widget v iframe nema Tailwind), nekonzistentni formatovani cen (hardcoded "Kc" misto formatCzk()), nepoouzivane importy. Navic rozsireni OrderConfirmation o isWidget prop pro skryti navigacnich prvku ve widget kontextu.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Popis |
|---|--------|-----------|-------|
| 1 | src/pages/widget-kalkulacka/index.jsx | Zmeneno | handleStartNewOrder resety + Tailwind→inline styles (12+ vyskytu) |
| 2 | src/pages/widget-kalkulacka/components/PricingCalculator.jsx | Zmeneno | Odstranen nepoouzivany import, formatCzk() misto hardcoded "Kc" |
| 3 | src/pages/test-kalkulacka/components/OrderConfirmation.jsx | Zmeneno | isWidget prop, podminene skryti "Sledovat objednavku" tlacitka |

---

## Detailni zmeny

### 1. `src/pages/widget-kalkulacka/index.jsx`

**Typ:** Zmeneno
**Duvod:** P1 — handleStartNewOrder chybely resety novych stavu (express, shipping, batch progress, priceShownSetRef). Tailwind classes v CTA a filelist sekcich nefungovaly v iframe bez Tailwind.

**Co se zmenilo:**
- handleStartNewOrder: pridany chybejici resety — selectedExpressTierId, selectedShippingMethodId, batchProgress, priceShownSetRef
- 12+ vyskytu Tailwind classes nahrazeno inline styles v CTA a filelist sekcich
- Zajistena plna funkcnost widgetu v iframe prostredi bez pristupu k Tailwind CSS

---

### 2. `src/pages/widget-kalkulacka/components/PricingCalculator.jsx`

**Typ:** Zmeneno
**Duvod:** P1 — nekonzistentni formatovani cen a zbytecny import

**Co se zmenilo:**
- Odstranen nepoouzivany import Card/CardContent/CardHeader/CardTitle
- ShippingSelector a ExpressTierSelector: `${price} Kc` nahrazeno `formatCzk(price)` pro konzistentni formatovani cen v cele aplikaci

---

### 3. `src/pages/test-kalkulacka/components/OrderConfirmation.jsx`

**Typ:** Zmeneno
**Duvod:** P1 — "Sledovat objednavku" tlacitko nemusi byt viditelne ve widget kontextu (widget nema routing)

**Co se zmenilo:**
- Pridan prop `isWidget = false` (defaultne false pro zpetnou kompatibilitu)
- "Sledovat objednavku" tlacitko podminene skryto: `{!isWidget && ...}`
- useNavigate() hook zachovan na top-level (Rules of Hooks compliance), jen UI podminene skryto
- Zadny breaking change pro existujici pouziti v test-kalkulacce

---

## Dopad zmen

- **Ovlivnene komponenty:** widget-kalkulacka (index, PricingCalculator), test-kalkulacka (OrderConfirmation)
- **Breaking changes:** Ne — isWidget prop ma default false
- **Nove zavislosti:** Zadne
- **Rizika:** Minimalni — formatCzk jiz existuje a je pouzivan jinde

---

## Testovani

- **Build:** npm run build — PASS
- **Manual test:** Widget checkout flow, cenovy format, new order reset
- **Poznamky:** Zadne

---

<!-- KONEC SABLONY -->
