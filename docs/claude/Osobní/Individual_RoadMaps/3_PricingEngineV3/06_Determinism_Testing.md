# KD-6 — Determinismus a Snapshot Testy

> **Zdroj:** Extrahovano z `3_PricingEngineV3_RoadMap_Plan.md` sekce KD-6
> **Ucel:** Zajistit ze stejny vstup vzdy produkuje stejny vystup + automatizovane testy
> **Odhad:** 4 hodiny (KD-6.1: 30min, KD-6.2: 30min, KD-6.3: 3-4h)
> **Zavislosti:** ZADNE
> **Priorita:** VYSOKA

---

## Problem: Nedeterministicke chovani

Engine je z 99% deterministicky (pure funkce, zadne side effects), ale:

**Coupon expirace (radky 724-728):** Pouziva `new Date()` pro kontrolu `expires_at`/`starts_at`.
- Stejny vstup v pondeli a v utery MUZE dat jiny vysledek (kupon mezitim expiroval)
- To znamena: snapshot test by mohl nahodne failnout

---

## Ukol KD-6.1: Inject `now` parametr

**Co udelat:**
- [ ] Pridat volitelny parametr `now?: Date` do `calculateOrderQuote`
- [ ] Pokud neni predany → pouzij `new Date()` (zpetne kompatibilni)
- [ ] Pokud JE predany → pouzij pro vsechny casove kontroly (coupon expirace)

**Priklad:**
```javascript
// Pro testy a reproducibilitu:
calculateOrderQuote({ ..., now: new Date('2026-02-18T12:00:00Z') })

// Pro bezny provoz (zpetne kompatibilni):
calculateOrderQuote({ ... })  // pouzije new Date() interno
```

**Zmena v kodu:** Najit `new Date()` na radcich 724-728, nahradit za `now || new Date()`

**Odhad:** 30 minut

---

## Ukol KD-6.2: Deterministicke razeni fees

**Problem:** `fees` pole se iteruje v poradi jak prichazi. Pokud admin ulozi fees v jinem poradi, vysledna castka se NEZMENI, ale poradi polozek v breakdown ANO.

**Akce:**
- [ ] Overit zda engine radi fees pred iteraci (sort by `id` nebo `priority`)
- [ ] Pokud ne → pridat stabilni sort na zacatku fee iterace
- [ ] Alternativne: dokumentovat ze poradi breakdown polozek je "as provided"

**Odhad:** 30 minut

---

## Ukol KD-6.3: Snapshot test suite

**Co udelat:**
- [ ] Vytvorit 10-15 fixture souboru (JSON) s definovanymi vstupy a ocekavanym vystupem
- [ ] Pro kazdy fixture: `assert.deepEqual(calculateOrderQuote(input, {now}), expectedOutput)`
- [ ] Spoustet pri kazdem buildu (Vitest)

**Umisteni:**
```
src/lib/pricing/__tests__/
  pricingEngineV3.test.js      ← test runner
  fixtures/
    01_basic_single_model.json
    02_multiple_models_materials.json
    03_model_fees_all_types.json
    04_order_fees_subset.json
    05_volume_discounts_quantity.json
    06_volume_discounts_amount.json
    07_express_percent.json
    08_express_fixed.json
    09_coupon_percent.json
    10_coupon_fixed.json
    11_coupon_free_shipping.json
    12_full_combo.json
    13_edge_zero_price.json
    14_edge_empty_order.json
    15_rounding_smart_vs_permodel.json
```

**Kazdy fixture obsahuje:**
```json
{
  "name": "Basic single model - PLA 50g 2h",
  "input": {
    "uploadedFiles": [...],
    "printConfigs": {...},
    "pricingConfig": {...},
    "feesConfig": {...},
    "now": "2026-02-18T12:00:00Z"
  },
  "expectedOutput": {
    "total": 245,
    "grandTotal": 245,
    "modelResults": [...],
    "breakdown": [...]
  }
}
```

**Fixtures by mely pokryvat:**
- [x] Zakladni kalkulace (1 model, zadne fees)
- [x] Vicemodely s ruznymi materialy
- [x] MODEL fees (vsech 7 typu)
- [x] ORDER fees s subset targeting
- [x] Volume discounts (oba mody, oba scopy)
- [x] Express + coupon + volume kombinace
- [x] Edge: nulova cena, nulovy cas, prazdny order, 0 quantity
- [x] Rounding: smart vs per-model
- [x] Markup: vsechny 3 mody

**Odhad:** 3-4 hodiny (vytvoreni fixtures + test runner)
