# Pricing Engine V3 — Dokumentace

> Deterministicky pricing pipeline: base -> fees -> markup -> volume discounts -> minima -> rounding + breakdown.
> Hlavni soubor: `src/lib/pricing/pricingEngineV3.js` (1205 radku)
> Vlastnik: `mp-mid-pricing-engine` (single owner)

---

## 1. Prehled

Pricing Engine V3 je ciste funkcionalni pricing pipeline ktery z uploadovanych 3D modelu, tiskovych konfiguraci a cenove konfigurace tenanta vypocita kompletni cenovou nabidku (quote). Engine je deterministicky — stejny vstup VZDY produkuje stejny vystup.

### Hlavni vlastnosti

- **Deterministicky** — zadne nahodne prvky, zadne vedlejsi efekty, zadne zavislosti na case (krome coupon expirace)
- **Breakdown konzistence** — soucet vsech polozek v breakdown odpovida celkove cene
- **Zaokrouhlovani na konci** — pipeline pracuje s presnymi cisly, zaokrouhluje se az na samem konci
- **Pure functions** — vsechny interni funkce jsou bez side effectu (vyjimka: `modelTotalsById` je mutovan in-place pro downstream kroky)
- **Pouzivano na FE i BE** — sdileny JavaScript modul

### Hlavni exportovane funkce

| Funkce | Popis |
|--------|-------|
| `calculateOrderQuote(params)` | Hlavni pipeline — vypocita cenu cele objednavky |
| `evaluateConditions(conditions, context)` | Vyhodnoceni podminek (pouzivano i externe) |

### Pipeline (poradi kroku)

```
1. Base price (material + cas)
2. MODEL fees (flat, per_gram, per_minute, per_cm3, per_cm2, per_piece, percent)
3. Percent MODEL fees (baze = basePerPiece + non-percent PER_PIECE fees)
4. Per-model minimum
5. Per-model rounding (jen kdyz smart_rounding NENI zapnuto)
6. Express surcharge (S09)
7. Coupon discount (S10) — proporcionalni distribuce pres modely
8. Volume discounts (S05) — tier-based slevy
9. ORDER fees (flat, per_gram, per_minute, per_cm3, per_cm2, per_piece, percent)
10. Percent ORDER fees (baze = subset models total + subset non-percent fees)
11. Markup (flat / percent / min_flat)
12. Order minimum total
13. Final rounding
14. Clamp to >= 0
15. Shipping (S04) — FIXED / WEIGHT_BASED / PICKUP + free shipping threshold
16. Grand total = total + shipping
```

---

## 2. Technologie a jazyk

| Polozka | Hodnota |
|---------|---------|
| Jazyk | JavaScript (ES modules, `export` syntax) |
| Runtime | Browser (FE) + potencialne Node.js (BE) |
| Paradigma | Pure functions, funkcionalni pipeline |
| Zavislosti | **ZADNE** — zero external dependencies |
| Typovy system | Zadny (plain JS, implicitni typy) |
| Testovani | Pokryto pres integraci v PricingCalculator komponentach |

---

## 3. Architektura souboru

### Pricing slozka: `src/lib/pricing/`

| Soubor | Radku | Popis |
|--------|-------|-------|
| `pricingEngineV3.js` | 1205 | **HOT SPOT** — hlavni pipeline, single owner `mp-mid-pricing-engine` |
| `shippingCalculator.js` | 48 | Utility pro shipping kalkulaci (FIXED, WEIGHT_BASED, free shipping) |
| `couponValidator.js` | 77 | Validace kuponu + vypocet slevy (percent, fixed, free_shipping) |

### Souvisejici soubor mimo pricing slozku

| Soubor | Radku | Popis |
|--------|-------|-------|
| `src/lib/pricingService.js` | 236 | Legacy pricing service pro verejnou kalkulacku (starsi, jednodussi pipeline) |

### Blokova mapa pricingEngineV3.js

| Radky (priblizne) | Blok | Popis |
|--------------------|------|-------|
| 1-6 | Hlavicka | Komentare s pipeline popisem |
| 7-31 | Utility funkce | `safeNum`, `clampMin0`, `normStr`, `normStrLower`, `parseBoolLoose` |
| 37-92 | `normalizePricingConfigEngineShape` | Normalizace pricing configu z tenant_pricing |
| 94-99 | `roundToStep` | Zaokrouhlovaci funkce (up / nearest) |
| 101-114 | `getSurfaceMm2FromFile` | Extrakce povrchu modelu z ruznych zdroju |
| 112-138 | `getFileId`, `getModelMetrics` | Extrakce ID a metrik z uploadovanych souboru |
| 140-151 | `getMaterialPricePerGram` | Vyhledani ceny materialu (V3 array -> legacy map fallback) |
| 153-177 | Fee helpery | `getChargeBasis`, `shouldApplyFee`, `getFeeTargets` |
| 179-289 | Condition engine | `normalizeConditionOp`, `evalConditionSingle`, `evaluateConditionsWithDebug`, `evaluateConditions` |
| 291-320 | `calcBase` | Zakladni cenova kalkulace (material + cas) |
| 322-336 | `feeTypeUnitAmount` | Vypocet jednotkove castky fee podle typu |
| 338-392 | `buildModelContext` | Sestaveni kontextu pro condition evaluation |
| 395-399 | `subsetKey` | Generovani klice pro subset matching u ORDER fees |
| 401-1204 | `calculateOrderQuote` | **HLAVNI PIPELINE** — cela cenova kalkulace |

---

## 4. Import graf

### Kdo importuje pricingEngineV3.js

```
pricingEngineV3.js
  <- src/pages/test-kalkulacka/components/PricingCalculator.jsx
  <- src/pages/test-kalkulacka/components/CheckoutForm.jsx
  <- src/pages/test-kalkulacka-white/components/PricingCalculator.jsx
  <- src/pages/test-kalkulacka-white/components/CheckoutForm.jsx
  <- src/pages/widget-kalkulacka/components/PricingCalculator.jsx
```

### Co pricingEngineV3.js importuje

```
pricingEngineV3.js
  -> NIC (zero imports, ciste pure functions)
```

### shippingCalculator.js a couponValidator.js

Tyto dva soubory jsou **standalone utility moduly**. Engine `pricingEngineV3.js` je NEIMPORTUJE — shipping a coupon logika je duplikovana primo v pipeline (inlined pro determinismus a nezavislost).

### pricingService.js (legacy)

```
pricingService.js
  <- adminPricingStorage.js (loadPricingConfigV3, normalizePricingConfigV3, normalizeMaterialKey)
```

Tento soubor neni v produkcnim import grafu pricing engine V3 — nikdo ho aktualne neimportuje.

---

## 6. Datovy model (pricing config, breakdown, result)

### 6.1 Vstupni parametry calculateOrderQuote

```javascript
calculateOrderQuote({
  // Povinne
  uploadedFiles,     // Array<File> — uploadovane 3D modely s vysledky slicovani
  printConfigs,      // Object<fileId, Config> — tiskove konfigurace per model
  pricingConfig,     // PricingConfigV3 — cenova konfigurace tenanta
  feesConfig,        // FeesConfigV3 — konfigurace poplatku (MODEL + ORDER fees)

  // Volitelne — fee selections
  feeSelections,     // { selectedFeeIds: Set<string>, feeTargetsById: Object }

  // Volitelne — S09 Express
  expressConfig,     // { enabled, tiers: Array<ExpressTier> }
  selectedExpressTierId, // string | null

  // Volitelne — S10 Coupon
  couponsConfig,     // { enabled, coupons: Array<Coupon>, settings }
  appliedCouponCode, // string | null

  // Volitelne — S04 Shipping
  shippingConfig,    // { enabled, methods: Array<ShippingMethod>, free_shipping_enabled, free_shipping_threshold }
  selectedShippingMethodId, // string | null
})
```

### 6.2 PricingConfigV3 (po normalizaci)

```javascript
{
  // Zakladni sazby
  rate_per_hour: number,              // Hodinova sazba za cas tisku
  minimum_billed_minutes: number,     // Minimalni uctovany cas (minuty)
  minimum_price_per_model: number,    // Minimalni cena za model
  minimum_order_total: number,        // Minimalni celkova cena objednavky

  // Materialy
  materials: [                        // V3 format (preferovany)
    { key: 'pla', name: 'PLA', price_per_gram: 0.5, enabled: true, ... }
  ],
  materialPrices: { pla: 0.5, ... }, // Legacy format (fallback)

  // Zaokrouhlovani
  rounding: {
    enabled: boolean,
    step: number,                     // Zaokrouhlovaci krok (min 1)
    mode: 'nearest' | 'up',          // Nearest = Math.round, Up = Math.ceil
    smart_rounding_enabled: boolean,  // true = rounding jen na konci, false = per-model i finalni
  },

  // Markup (prirazka)
  markup: {
    enabled: boolean,
    mode: 'flat' | 'percent' | 'min_flat' | 'off',
    value: number,
    min_flat?: number,                // Pro mode 'min_flat' — cilova minimalni castka
  },

  // Volume discounts (S05)
  volume_discounts: {
    enabled: boolean,
    mode: 'percent' | 'fixed_price',
    scope: 'per_model' | 'per_order',
    tiers: [
      { min_qty: 10, value: 5, label: '5% sleva' },
      { min_qty: 50, value: 10, label: '10% sleva' },
    ],
  },

  // Tenant pricing (normalizuje se v normalizePricingConfigEngineShape)
  tenant_pricing: { ... },            // Alternativni zdroj — promitne se do root fieldu
}
```

### 6.3 FeesConfig

```javascript
{
  fees: [
    {
      id: string,
      name: string,
      scope: 'MODEL' | 'ORDER',       // MODEL = per file/piece, ORDER = pres celou objednavku
      type: 'flat' | 'per_gram' | 'per_minute' | 'per_cm3' | 'per_cm2' | 'per_piece' | 'percent',
      value: number,                   // Castka nebo procento
      active: boolean,                 // Aktivni/neaktivni
      required: boolean,               // Povinny fee (vzdy aplikovan)
      selectable: boolean,             // Uzivatel muze vybrat/odvybrat
      charge_basis: 'PER_FILE' | 'PER_PIECE', // Jak se nasobi quantity
      conditions: [                    // Podminky pro aplikaci
        { key: 'material', op: 'eq', value: 'pla' }
      ],
      apply_to_selected_models_enabled: boolean, // Cileni na konkretni modely
    }
  ]
}
```

### 6.4 Vystupni objekt (OrderQuote)

```javascript
{
  currency: 'CZK',
  total: number,                      // Celkova cena BEZ shippingu (po rounding)
  grandTotal: number,                 // Celkova cena VCETNE shippingu

  totals: {
    material: number,                 // Celkem material (vsechny modely)
    time: number,                     // Celkem cas (vsechny modely)
    modelsTotal: number,              // Soucet modelu po volume discounts
    expressSurchargeTotal: number,
    couponDiscountTotal: number,
    volumeDiscountTotal: number,
    orderFeesTotal: number,
    subtotalBeforeMarkup: number,
    markupAmount: number,
    totalAfterMarkup: number,
    totalRounded: number,
    shippingCost: number,
    grandTotal: number,
  },

  simple: {                           // Zjednoduseny breakdown pro UI
    material: number,
    time: number,
    services: number,                 // Kladne fees
    discount: number,                 // Zaporne fees + kupony + volume (zaporne cislo)
    markup: number,
  },

  models: [                           // Per-model detaily
    {
      id: string,
      name: string,
      status: string,
      quantity: number,
      config: Object,
      base: {
        materialKey, pricePerGram, ratePerHour,
        filamentGrams, estimatedTimeSeconds, billedMinutes,
        volumeCm3, surfaceCm2,
        materialCostPerPiece, timeCostPerPiece,
        basePerPiece, baseTotal,
      },
      fees: [ ... ],                  // Fee rows s amount, applied, reason
      totals: {
        feesTotal,
        subtotalBeforeMin,
        subtotalAfterMin,
        subtotalAfterPerModelRounding,
      },
      flags: {
        min_price_per_model_applied: boolean,
        rounding_per_model_applied: boolean,
      },
    }
  ],

  orderFees: [ ... ],                // ORDER fee rows

  express: {                          // S09
    enabled, tierId, surchargeTotal, details: { [modelId]: { originalTotal, surcharge, newTotal } }
  } | null,

  coupon: {                           // S10
    code, type, value, discount
  } | null,

  volumeDiscount: {                   // S05
    enabled, mode, scope, totalSavings, details: [{ modelId, applied, tier, savings }]
  } | null,

  shipping: {                         // S04
    id, name, type, cost, delivery_days_min, delivery_days_max, freeShippingApplied
  } | null,

  flags: {
    min_order_total_applied: boolean,
    rounding_final_applied: boolean,
    clamped_to_zero: boolean,
    volume_discount_applied: boolean,
    express_applied: boolean,
    coupon_applied: boolean,
    shipping_applied: boolean,
    free_shipping_applied: boolean,
  },
}
```

---

## 8. Pipeline kroky — detailni popis kazdeho kroku

### Krok 1: Normalizace configu

Funkce `normalizePricingConfigEngineShape(pricingConfig)` preklopi data z `tenant_pricing` podstromu na root-level fieldy enginu. Resi backward kompatibilitu s ruznymu formaty configu.

**Normalizovane fieldy:** `rate_per_hour`, `minimum_billed_minutes`, `minimum_price_per_model`, `minimum_order_total`, `rounding`, `markup`.

### Krok 2: Base price (per model)

Funkce `calcBase({ file, cfg, pricingConfig })`.

```
materialCostPerPiece = filamentGrams * pricePerGram
timeCostPerPiece     = billedMinutes * (ratePerHour / 60)
basePerPiece         = materialCostPerPiece + timeCostPerPiece
baseTotal            = basePerPiece * quantity
```

**Pravidla:**
- `billedMinutes = max(rawMinutes, minimum_billed_minutes)` — minimalni uctovany cas
- `rawMinutes = ceil(estimatedTimeSeconds / 60)` — zaokrouhleni nahoru na minuty
- `quantity = max(1, floor(quantity))` — minimalne 1, celociselne

### Krok 3: MODEL fees

Pro kazdy model se iteruji vsechny fees se `scope === 'MODEL'`.

**Rozhodovaci logika aplikace fee:**
1. `shouldApplyFee` — je fee aktivni? Je povinny? Je selectable a vybrany?
2. `evaluateConditions` — splnuji podminky? (material, kvalita, rozmery, atd.)
3. `getFeeTargets` — je fee cileny na tento model? (ALL vs SELECTED)

**Typy fee a jejich kalkulace (funkce `feeTypeUnitAmount`):**

| Typ | Vzorec pro unit amount |
|-----|------------------------|
| `flat` | `value` |
| `per_piece` | `value` (nasobi se quantity pozdeji) |
| `per_gram` | `filamentGrams * value` |
| `per_minute` | `billedMinutes * value` |
| `per_cm3` | `volumeCm3 * value` |
| `per_cm2` | `surfaceCm2 * value` (vyzaduje real surface data!) |
| `percent` | `(percentBase * value) / 100` — zpracovava se az po non-percent fees |

**Charge basis:**
- `PER_FILE` — fee se aplikuje jednou per soubor
- `PER_PIECE` — fee se nasobi `quantity`

**Percent fee baze:**
```
percentBasePerPiece = basePerPiece + nonPercentPerPieceUnitSum
```
Pozn.: Percent fees se pocitaji AZ po vsech non-percent fees, aby meli spravny zaklad.

**per_cm2 specialni chovani:** Pokud model NEMA real surface data (surfaceCm2 === null), fee se NEAPLIKUJE a v reason objektu se nastavi `surface_unavailable: true`. Engine nepouziva bbox area jako fallback, protoze by to bylo zavedejici.

### Krok 4: Per-model minimum

```javascript
if (minPerModel > 0 && modelSubtotal < minPerModel) {
  modelSubtotal = minPerModel;
}
```

### Krok 5: Per-model rounding

Aplikuje se POUZE pokud `rounding.enabled === true` A `smart_rounding_enabled === false`.

```javascript
perModelRounded = roundToStep(modelSubtotal, step, mode);
```

**roundToStep logika:**
- `mode === 'up'`: `Math.ceil(value / step) * step`
- `mode === 'nearest'` (default): `Math.round(value / step) * step`

### Krok 6: Express surcharge (S09)

Pro kazdy model se vypocita prirazka na zaklade vybraneho express tieru:

```
surchargeType === 'percent' => surcharge = (modelTotal * surchargeValue) / 100
surchargeType === 'fixed'   => surcharge = surchargeValue
```

**DULEZITE:** Express surcharge modifikuje `modelTotalsById[model.id]` **in-place**. Downstream kroky (coupon, volume discount, ORDER fees) pracuji s aktualizovanymi hodnotami.

### Krok 7: Coupon discount (S10)

Validace kuponu: aktivni, nezaexpiroval, zahajen, neprekrocen max_uses, splnuje min_order_total.

**Typy kuponu:**
- `percent` — sleva v procentech (omezena `max_discount_percent` z settings)
- `fixed` — fixni sleva (omezena aktualnim subtotalem)
- `free_shipping` — zpracovava se v shipping kroku

**Proporcionalni distribuce:** Kuponova sleva se rozdeluje proporcionalne pres vsechny modely podle pomeru `modelTotal / currentSubtotal`.

**DULEZITE:** Modifikuje `modelTotalsById` in-place. Kazdy model ma `max(0, modelTotal - modelDiscount)`.

### Krok 8: Volume discounts (S05)

Tier-based mnozstevni slevy s dvema rozsahy a dvema mody.

**Scope:**
- `per_model` — quantity jednoho modelu se porovnava s tier `min_qty`
- `per_order` — soucet quantity vsech modelu se porovnava s tier `min_qty`

**Mode:**
- `percent` — procentualni sleva z `originalPerPiece`
- `fixed_price` — nova fixni cena per piece

**Tier matching:** Tiery se radi sestupne podle `min_qty`. Prvni tier kde `qty >= min_qty` se pouzije.

**DULEZITE:** Modifikuje `modelTotalsById` in-place. Savings se odecitaji od aktualniho model totalu (`max(0, modelTotal - savings)`).

### Krok 9: ORDER fees

Funguje podobne jako MODEL fees, ale operuje na agregovanych metrikach pres subset modelu.

**Subset modelu:** Pro kazdy ORDER fee se urci mnozina modelu (subset) na zaklade targets a conditions. Metrika se pak agreguje pres cely subset:

```
grams   = sum(model.filamentGrams * quantity) pro vsechny modely v subsetu
minutes = sum(model.billedMinutes * quantity)
vol     = sum(model.volumeCm3 * quantity)
surf    = sum(model.surfaceCm2 * quantity)
pieces  = sum(quantity)
```

**Percent ORDER fee baze:**
```
baseForPercent = subsetModelsTotal + subsetNonPercentFees (se stejnym subset key)
```

### Krok 10: Markup

```
mode === 'flat'     => markupAmount = value
mode === 'percent'  => markupAmount = subtotalBeforeMarkup * value / 100
mode === 'min_flat' => markupAmount = max(0, target - subtotalBeforeMarkup)
                       kde target = min_flat > 0 ? min_flat : value
```

Markup se pocita z `subtotalBeforeMarkup = modelsTotalAfterVolume + orderFeesTotal`.

### Krok 11: Order minimum total

```javascript
if (minOrderTotal > 0 && totalAfterMarkup < minOrderTotal) {
  totalAfterMarkup = minOrderTotal;
}
```

### Krok 12: Final rounding

Vzdy se aplikuje pokud `rounding.enabled === true` (nezavisle na `smart_rounding_enabled`).

```javascript
totalRounded = roundToStep(totalAfterMarkup, step, mode);
```

### Krok 13: Clamp to zero

```javascript
total = Math.max(0, totalRounded);
```
Zaporny vysledek (zpusobeny velkymi slevami) se clampe na 0.

### Krok 14: Shipping (S04)

Typy shipping metod:
- `PICKUP` — zdarma (cost = 0)
- `FIXED` — fixni cena z `method.price`
- `WEIGHT_BASED` — tiered podle celkove vahy objednavky

**Free shipping:**
- Threshold: pokud `total >= free_shipping_threshold`
- Coupon: pokud aplikovany kupon je typu `free_shipping`

### Krok 15: Grand total

```javascript
grandTotal = Math.max(0, total + shippingCost);
```

---

## 9. Data flow (vstup -> pipeline -> vystup)

```
uploadedFiles + printConfigs + pricingConfig + feesConfig
                    |
                    v
  normalizePricingConfigEngineShape(pricingConfig)
                    |
                    v
  FOR EACH file:
    |-> calcBase() -----> materialCost + timeCost = baseTotal
    |-> buildModelContext() -----> condition context
    |-> FOR EACH MODEL fee:
    |     |-> shouldApplyFee() + evaluateConditions() + getFeeTargets()
    |     |-> feeTypeUnitAmount() * charge_basis
    |     \-> percentCandidates (deferred)
    |-> Percent MODEL fees (base = basePerPiece + non-percent PER_PIECE)
    |-> Per-model minimum
    |-> Per-model rounding (if !smart_rounding)
    \-> modelTotalsById[id] = perModelRounded
                    |
                    v
  Express surcharge (modifies modelTotalsById in-place)
                    |
                    v
  Coupon discount (proportional, modifies modelTotalsById in-place)
                    |
                    v
  Volume discounts (tier matching, modifies modelTotalsById in-place)
                    |
                    v
  modelsTotalAfterVolume = sum(modelTotalsById)
                    |
                    v
  FOR EACH ORDER fee:
    |-> subset = models matching targets + conditions
    |-> aggregate metrics (grams, minutes, vol, surf, pieces) per subset
    |-> feeTypeUnitAmount() na agregovanych metrikach
    \-> Percent ORDER fees (base = subsetModelsTotal + subsetNonPercent)
                    |
                    v
  subtotalBeforeMarkup = modelsTotalAfterVolume + orderFeesTotal
                    |
                    v
  Markup (flat / percent / min_flat)
                    |
                    v
  Order minimum total
                    |
                    v
  Final rounding (roundToStep)
                    |
                    v
  Clamp to >= 0
                    |
                    v
  Shipping (FIXED / WEIGHT_BASED / PICKUP + free shipping)
                    |
                    v
  grandTotal = total + shippingCost
```

---

## 10. Error handling

### Strategie: Fail-safe s default hodnotami

Engine **nikdy nevyhazuje vyjimku**. Misto toho pouziva defenzivni fallbacky:

| Funkce | Chovani pri neplatnem vstupu |
|--------|------------------------------|
| `safeNum(v, fallback)` | NaN, undefined, prazdny string -> fallback (default 0) |
| `clampMin0(v)` | Zaporne cislo -> 0, NaN -> 0 |
| `normStr(v)` | null, undefined -> prazdny string |
| `parseBoolLoose(v)` | Nerozpoznany vstup -> false |
| `normalizeConditionOp(op)` | Neznamy operator -> vraci jak je (evalConditionSingle pak vraci `ok: false`) |

### Chybejici data

| Situace | Chovani |
|---------|---------|
| Model nema slicing vysledky | `estimatedTimeSeconds = 0`, `filamentGrams = 0` -> cena = 0 |
| Material neni v configu | `pricePerGram = 0` (z getMaterialPricePerGram fallbacku) |
| Surface data nedostupne | per_cm2 fees se preskoci (applied = false, reason.surface_unavailable = true) |
| Fee conditions neodpovida | Fee se neaplikuje (applied = false, duvod v reason) |
| Kupon neni nalezen / nevalidni | couponApplied = null, zadna sleva |
| Shipping metoda neexistuje | shippingCost = 0, shippingMethod = null |

### Debugging

Kazdy fee row obsahuje podrobny `reason` objekt s:
- `apply` — zda fee prosel shouldApplyFee
- `match` — zda conditions odpovida
- `targetOk` — zda model je v targetu
- `conditions` — pole s detaily per-condition (key, operator, expected, actual, ok)
- `targets` — mode + modelIds

Toto umoznuje kompletni debugovani "proc se fee neaplikoval" bez pristupu k enginu.

---

## 13. Performance

### Casova slozitost

```
O(M * F) kde M = pocet modelu, F = pocet fees
```

Kazdy model se porovnava s kazdym fee (conditions + targets + aplikace). Pro typicke pouziti (5-20 modelu, 10-30 fees) je to zanedbatelne.

### Potencialni bottlenecky

| Oblast | Pricina | Reseni |
|--------|---------|--------|
| `evaluateConditionsWithDebug` | JSON.stringify v subsetKey | Nepodstatne pro male pocty |
| `percentCandidates` | Druhy pruchod pres pending fees | Konstantni overhead per model |
| `modelTotalsById` mutace | In-place updates v 3 krocich (express, coupon, volume) | Nutne pro spravnost downstream |
| Volume discount tier sort | Sort kazdy pruchod | Maly pocet tieru (typicky 3-5) |

### Pameti

Engine nealokuje velke struktury. Hlavni alokace:
- `modelResults` array (jeden objekt per model)
- `feeRows` arrays (jeden objekt per fee per model)
- `orderFeeRows` array
- `modelTotalsById` objekt (jednoduchy map)

Pro 100 modelu s 50 fees: cca stovky objektu, desitky KB — zanedbatelne.

---

## 14. Bezpecnost (determinismus, floating point)

### Determinismus

Engine je deterministicky pro VSECHNY vstupy **KROME** jednoho edge case:

**Vyjimka — Coupon expirace:**
Coupon validace pouziva `new Date()` pro kontrolu `expires_at` a `starts_at`. Pokud se ten samy vstup zpracuje v ruznych casech, vysledek muze byt odlisny pokud se kupon mezitim zmenil (expirace, pouziti).

**Mitigace:** V praxi se cena pocita v danem okamziku a vysledek se ulozi. Opetovny vypocet ze stejnych vstupu ve stejnem casovem okne da stejny vysledek.

### Floating point

JavaScript pouziva IEEE 754 double precision. Engine **NEPOUZIVA** specialni knihovny pro presnou aritmetiku (jako decimal.js). To znamena:

- `0.1 + 0.2 !== 0.3` (klasicky JS floating point problem)
- Zaokrouhlovani na konci pipeline mitiguje kumulativni chyby
- Pro ceny v CZK (celociselne zaokrouhleni) je presnost dostatecna
- Pro meny s desitnymi misty (EUR, USD) muze dojit k drobnym odchylkam

### Ochrana proti neplatnym vstupum

- `safeNum` — odmita NaN, Infinity, prazdne stringy
- `clampMin0` — odmita zaporna cisla
- `Math.max(0, ...)` — clamp finalniho vysledku
- `Math.max(1, Math.floor(...))` — ochrana quantity pred 0 nebo desitkami

### modelTotalsById in-place mutace

Tri kroky pipeline modifikuji `modelTotalsById` in-place:
1. **Express** — pricita surcharge
2. **Coupon** — odecita proporcionalni slevu
3. **Volume discount** — odecita savings

Toto je ZAMERNE — downstream kroky (ORDER fees percent baze, markup baze) MUSI videt aktualizovane hodnoty. Je to jediny "side effect" v jinak pure pipeline.

---

## 17. Zname omezeni

### 17.1 Coupon + Volume discount poradi

Coupon se aplikuje PRED volume discountem. To znamena ze volume discount se pocita z uz snizene ceny. V nekterych business scenariich by bylo vhodnejsi opacne poradi. Aktualni poradi je fixni a neni konfigurovatelne.

### 17.2 Floating point kumulace

Pri velkem poctu modelu (100+) s mnoha fees muze dojit ke kumulativni floating point chybe. Zaokrouhlovani na konci pipeline to ve vetsine pripadu pokryje, ale pro ceny s desetinnymi misty (ne CZK) to muze byt viditelne.

### 17.3 per_cm2 vyzaduje real surface data

Fee typu `per_cm2` se NEAPLIKUJE pokud model nema skutecna povrchova data (surfaceMm2). Engine zamerme NEPOUZIVA bounding box area jako fallback, protoze by to bylo zavedejici. To znamena ze per_cm2 fees mohou byt tichy ignorovany pokud klient neposle surface data.

### 17.4 pricingService.js je legacy a duplicitni

Soubor `src/lib/pricingService.js` obsahuje starsi, jednodussi pricing pipeline, ktery neni pouzivan v aktualnim flow (nikdo ho neimportuje). Obsahuje hardcoded `POST_PROCESSING_PRICES` a `DEFAULT_MATERIAL_PRICES`. Mohl by byt potencialne odstranen.

### 17.5 shippingCalculator.js a couponValidator.js jsou duplicitni

Shipping a coupon logika je duplikovana — jednou v samostatnych utility souborech a podruhe inlined v `pricingEngineV3.js`. Utility soubory aktualne nikdo neimportuje. Existuji pravdepodobne pro budouci pouziti (napr. standalone validace kuponu na backendu).

### 17.6 Condition engine podporuje jen AND logiku

Vsechny podminky v `conditions` poli se vyhodnocuji jako AND (vsechny musi byt true). Neni podpora pro OR logiku nebo nested groupy.

### 17.7 Smart rounding vs per-model rounding

Kdyz `smart_rounding_enabled = true`, zaokrouhlovani se dela POUZE na konci (finalni total). Kdyz `smart_rounding_enabled = false`, zaokrouhlovani se dela NA OBOU mistech (per-model + finalni). To muze vest k vyrazne odlisnym vysledkum.

### 17.8 Coupon datum zavislost

Validace kuponu (starts_at, expires_at) pouziva `new Date()` — jediny nedeterministicky prvek v jinak pure pipeline. Pro unit testy je nutne mockovat Date.

### 17.9 Zadne explicitni typove kontroly

Engine je plain JavaScript bez TypeScript typingu. Vsechny typove kontroly jsou implicitni pres `safeNum`, `normStr` a podobne utility. Chybejici pole nezpusobi crash, ale mohou vest k tichym nulovym hodnotam.

---

*Dokumentace vygenerovana 2026-02-13. Zdrojovy soubor: `src/lib/pricing/pricingEngineV3.js` (1205 radku).*
