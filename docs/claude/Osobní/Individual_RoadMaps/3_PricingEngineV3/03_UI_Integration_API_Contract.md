# Faze 2 — UI Integrace a API Kontrakt

> **Zdroj:** Extrahovano z `3_PricingEngineV3_RoadMap_Plan.md` Faze 2 (Ukoly 2.1-2.2)
> **Ucel:** Definice jak kalkulacka/widget komunikuji s enginem pro express/shipping/coupon
> **Odhad:** 1-2 hodiny
> **Zavislosti:** Spolecne s Kalkulackou (#1) a Widget (#11)

---

## Ukol 2.1: API kontrakt — vstupni parametry

### Co engine ocekava (nove parametry nad ramec zakladnich):

```javascript
calculateOrderQuote({
  // ... zakladni (uploadedFiles, printConfigs, pricingConfig, feesConfig) ...

  // Express — admin nastavi tiers, zakaznik vybere jeden
  expressConfig: {
    enabled: true,
    tiers: [
      { id: 'express-24h', name: 'Express 24h', active: true,
        surcharge_type: 'percent', surcharge_value: 20 },
      { id: 'express-12h', name: 'Super Express 12h', active: true,
        surcharge_type: 'fixed', surcharge_value: 200 }
    ]
  },
  selectedExpressTierId: 'express-24h',  // nebo null

  // Coupon — admin nastavi kupony, zakaznik zada kod
  couponsConfig: {
    enabled: true,
    coupons: [
      { code: 'SLEVA10', active: true, type: 'percent', value: 10,
        expires_at: '2026-12-31', starts_at: '2026-01-01', max_uses: 100 }
    ],
    settings: { max_discount_percent: 50 }
  },
  appliedCouponCode: 'SLEVA10',  // nebo null

  // Shipping — admin nastavi metody, zakaznik vybere jednu
  shippingConfig: {
    enabled: true,
    methods: [
      { id: 'standard', name: 'Standard', price: 89, estimated_days: '3-5' },
      { id: 'express-post', name: 'Express posta', price: 149, estimated_days: '1-2' }
    ],
    free_shipping_enabled: true,
    free_shipping_threshold: 500
  },
  selectedShippingMethodId: 'standard'  // nebo null
})
```

### Kde v admin se tyto configy nastavuji (bude potreba vytvorit/propojit):

| Config | Admin stranka | Storage helper | Namespace |
|--------|--------------|----------------|-----------|
| expressConfig | AdminExpress (TODO #17) | `adminExpressStorage.js` (TODO) | `express:v1` |
| couponsConfig | AdminCoupons (TODO #18) | `adminCouponsStorage.js` (TODO) | `coupons:v1` |
| shippingConfig | AdminShipping (TODO #16) | `adminShippingStorage.js` (TODO) | `shipping:v1` |

---

## Ukol 2.1b: API kontrakt — vystup (nove polozky v breakdown)

### Co engine vraci navic:

```javascript
// V OrderQuoteResult:
{
  // ... existujici pole (total, modelResults, breakdown, ...) ...

  // Express
  expressSurchargeTotal: 100,     // celkovy priplatek za express
  expressTier: { id: '...', name: '...' },  // vybrany tier info

  // Coupon
  couponDiscount: 50,             // celkova sleva z kuponu
  appliedCoupon: { code: '...', type: '...', value: 10 },

  // Shipping
  shippingCost: 89,               // cena dopravy
  shippingMethod: { id: '...', name: '...', price: 89 },
  freeShippingApplied: false,     // zda se uplatnila free shipping

  // Grand total
  grandTotal: 639,                // total + shippingCost
}
```

### Breakdown polozky (pro zobrazeni v UI):

Engine vraci `breakdown` pole ktere by melo obsahovat:
- Express polozku (pokud vybrany)
- Coupon polozku (pokud aplikovany)
- Shipping polozku (pokud vybrany)

**TODO:** Overit presny format breakdown polozek v kodu enginu (radky ~1155+).

---

## Ukol 2.2: Helper funkce (pokud potreba)

### Moznost A: Primo v kalkulacce (doporuceno)
Kalkulacka si sama cte admin storage a predava configy do engine:

```javascript
// V kalkulacce:
const expressConfig = loadExpressConfig();  // z adminExpressStorage
const shippingConfig = loadShippingConfig(); // z adminShippingStorage
const couponsConfig = loadCouponsConfig();   // z adminCouponsStorage

const result = calculateOrderQuote({
  ...zakladni,
  expressConfig,
  selectedExpressTierId: userSelectedTier,
  shippingConfig,
  selectedShippingMethodId: userSelectedMethod,
  couponsConfig,
  appliedCouponCode: userEnteredCode,
});
```

### Moznost B: Helper v enginu (alternativa)
Pokud by kalkulacka byla prilis slozita, vytvorit helper funkce:
- `getShippingCost(shippingConfig, selectedId, orderSubtotal)` — vraci cislo
- `getExpressSurcharge(expressConfig, selectedId, orderSubtotal)` — vraci cislo
- `validateCoupon(couponsConfig, code)` — vraci {valid, reason}

**Doporuceni:** Moznost A je cistsi — engine uz vsechno pocita sam, neni duvod duplikovat logiku.

---

## Integrace s kalkulackou — UI komponenty

### Nove UI sekce v kalkulacce (TODO — spoluprace s Kalkulacka #1):

1. **Shipping selector** — radio/select pro vyber metody dopravy
2. **Express selector** — radio/select pro vyber expresni urovne
3. **Coupon input** — textove pole pro zadani kodu + tlacitko "Aplikovat"
4. **Breakdown rozesireni** — zobrazit express, coupon, shipping v cenove rekapitulaci

### Datovy tok:

```
Admin (storage) --> expressConfig, shippingConfig, couponsConfig
                        |
Zakaznik (UI) -----> selectedExpressTierId, selectedShippingMethodId, appliedCouponCode
                        |
Engine ----> calculateOrderQuote({...all params...})
                        |
UI <---- zobrazeni vysledku (breakdown s express, shipping, coupon polozkami)
```
