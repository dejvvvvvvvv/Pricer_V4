# Pipeline Reference — Quick Lookup

> **Zdroj:** Extrahovano z `3_PricingEngineV3_RoadMap_Plan.md` sekce KD-1 + KD-2
> **Ucel:** Rychla reference pro implementaci — pipeline poradi, funkce, radky kodu
> **Hlavni soubor enginu:** `src/lib/pricing/pricingEngineV3.js` (~1205 radku)

---

## Kompletni pipeline (16 kroku)

```
base -> MODEL fees (non-%) -> MODEL fees (%) -> per-model min -> per-model round
     -> EXPRESS (S09) -> COUPON (S10) -> VOLUME DISCOUNTS (S05)
     -> ORDER fees (non-%) -> ORDER fees (%) -> markup
     -> order min -> final round -> clamp -> SHIPPING (S04) -> grand total
```

## Detailni mapa: krok -> funkce -> radky

| # | Krok | Radky | Funkce/blok | Vstup | Vystup |
|---|------|-------|-------------|-------|--------|
| 0 | Config normalizace | L420 | `normalizePricingConfigEngineShape()` (L37-92) | raw pricingConfig | normalizovany `pc` |
| 1 | Base price (per model) | L453 | `calcBase()` (L291-320) | file + cfg + pc | materialCost, timeCost, baseTotal |
| 2 | Model context | L454 | `buildModelContext()` (L338-392) | fileId + cfg + base | ctx pro condition eval |
| 3a | MODEL fees (non-percent) | L469-582 | `shouldApplyFee()` + `evaluateConditionsWithDebug()` + `feeTypeUnitAmount()` | fee + ctx + base | nonPercentTotal |
| 3b | MODEL fees (percent) | L588-611 | deferred pass | percentBasePerPiece | percentTotal |
| 4 | Per-model minimum | L623-627 | inline if | modelSubtotal | modelSubtotal (clamped) |
| 5 | Per-model rounding | L632-636 | `roundToStep()` (L94-99) | modelSubtotal | perModelRounded |
| 6 | Express surcharge (S09) | L677-711 | inline loop | modelTotalsById | +surcharge (in-place) |
| 7 | Coupon discount (S10) | L714-764 | inline | modelTotalsById | -discount (in-place, proportional) |
| 8 | Volume discounts (S05) | L770-827 | inline | modelTotalsById | -savings (in-place) |
| 9a | ORDER fees (non-percent) | L868-1031 | subset aggregation + feeTypeUnitAmount | aggregated metrics | orderNonPercentTotal |
| 9b | ORDER fees (percent) | L1034-1057 | deferred pass | subsetModelsTotal + subsetNonPercent | orderPercentTotal |
| 10 | Markup | L1066-1079 | inline | subtotalBeforeMarkup | +markupAmount |
| 11 | Order minimum | L1084-1088 | inline if | totalAfterMarkup | totalAfterMarkup (clamped) |
| 12 | Final rounding | L1091-1097 | `roundToStep()` | totalAfterMarkup | totalRounded |
| 13 | Clamp >= 0 | L1100-1101 | `Math.max(0, ...)` | totalRounded | total |
| 14 | Shipping (S04) | L1103-1151 | inline | total + selectedMethod | shippingCost |
| 15 | Grand total | L1153 | `Math.max(0, total + shippingCost)` | total + shippingCost | grandTotal |

---

## Exportovane funkce

Engine exportuje POUZE 2 funkce:

### 1. `calculateOrderQuote(params)` — hlavni pipeline

```javascript
export function calculateOrderQuote({
  // Povinne
  uploadedFiles,          // Array<UploadedFile>
  printConfigs,           // Record<fileId, PrintConfig>
  pricingConfig,          // PricingConfigV3
  feesConfig,             // {fees: Array<FeeDefinition>}

  // Volitelne — uzivatelsky vyber
  feeSelections,          // {selectedFeeIds, feeTargetsById}

  // Volitelne — S09 Express
  expressConfig,          // {enabled, tiers: Array<ExpressTier>}
  selectedExpressTierId,  // string | null

  // Volitelne — S10 Coupon
  couponsConfig,          // {enabled, coupons: Array<Coupon>, settings?}
  appliedCouponCode,      // string | null

  // Volitelne — S04 Shipping
  shippingConfig,         // {enabled, methods: Array<ShippingMethod>, free_shipping_*}
  selectedShippingMethodId, // string | null
})
// Vraci: OrderQuoteResult
```

### 2. `evaluateConditions(conditions, context)` — condition evaluator

```javascript
export function evaluateConditions(conditions, context)
// conditions: Array<{key: string, op: string, value: any}>
// context: Record<string, any>
// Vraci: boolean
```

---

## Utility funkce (interni, neexportovane)

| Funkce | Radky | Ucel |
|--------|-------|------|
| `safeNum(v, fallback)` | L7-10 | Bezpecna konverze na cislo |
| `clampMin0(v)` | L12-14 | Max(0, number) |
| `normStr(v)` | L16-18 | Trim string |
| `normStrLower(v)` | L20-22 | Trim + lowercase |
| `parseBoolLoose(v)` | L24-30 | Flexibilni boolean parsing |
| `roundToStep(val, step, mode)` | L94-99 | Zaokrouhleni dle kroku a modu |
| `calcBase(file, cfg, pc)` | L291-320 | Zakladni cena (material + cas) |
| `buildModelContext(...)` | L338-392 | Kontext pro condition evaluation |
| `shouldApplyFee(fee, ctx, ...)` | L... | Rozhodne zda fee aplikovat |
| `evaluateConditionsWithDebug(...)` | L... | Condition eval s debug info |
| `feeTypeUnitAmount(fee, ctx, base)` | L... | Vypocet castky fee dle typu |
| `normalizePricingConfigEngineShape(raw)` | L37-92 | Normalizace vstupu |

---

## Kriticke invarianty

1. **`modelTotalsById` je modifikovano in-place** — kroky 6,7,8 (express, coupon, volume) primo meni tento objekt. ORDER fees v kroku 9 z nej ctou aktualni hodnoty. NESMI se narusit toto poradi.
2. **Shipping je POSLEDNI** — pridava se k uz zaokrouhlenemu totalu, sam se nezaokrouhluje.
3. **Coupon je PRED volume discounty** — sleva z kuponu snizi zaklad pro volume discount vypocet.
4. **Express je PER-MODEL** — kazdy model dostane svuj priplatek, ne jen celkovy total.
