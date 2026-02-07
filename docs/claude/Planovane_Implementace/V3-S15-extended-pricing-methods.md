# V3-S15: Rozsirene Metody Cenotvorby

> **Priorita:** P2 | **Obtiznost:** Stredni | **Vlna:** 3
> **Zavislosti:** S01 (bug fixes), S05 (mnozstevni slevy — pricing engine zaklad)
> **Odhadovany rozsah:** Stredni (~30-45 souboru, 2500-4000 radku)

---

## A. KONTEXT

### A1. Ucel a cil

Sekce S15 rozsiruje pricing engine o alternativni metody cenotvorby. Aktualne
ModelPricer pocita cenu na zaklade:
- **Hmotnost materialu** (Kc/gram) z PrusaSlicer vystupu
- **Doba tisku** (Kc/hodina) z PrusaSlicer vystupu

Toto je "Slicer-based" metoda — nejpresnejsi, ale vyzaduje slicovani modelu
(cas ~10-60s). Mnozi zakaznici a technologie (SLA, CNC) potrebuji jine pristupy.

**Nove metody cenotvorby:**

1. **Bounding Box** — cena dle objemu bounding boxu (X * Y * Z cm3)
   - Nejrychlejsi vypocet, okamzity po uploadu
   - Vhodne pro uceleni podle zabraneho prostoru v tiskarni

2. **Volume-based** — cena dle skutecneho objemu 3D modelu
   - Presnejsi nez bounding box
   - Nevyzaduje slicovani (geometricka analyza staci)

3. **Surface Area** — cena dle povrchu modelu
   - Vhodne pro SLA (pryskyrice pokryva povrch)
   - Pouziti: povrchove upravy, lakování

4. **Weight-only** — pouze hmotnost bez casu
   - Zjednoduseni pro zakazni kde cas neni faktor

5. **Time-only** — pouze cas tisku bez materialu
   - Pro CNC, laserove rezani kde material dodava zakaznik

6. **Hybrid** — kombinace vice metod s vahami
   - Napr. 60% material + 40% cas, nebo min(bounding_box, volume)

**Business value:**
- Podpora ruznych technologii (FDM, SLA, SLS, CNC) — kazda vyzaduje jiny pristup
- Konkurencni vyhoda — Layers.app nabizi 4 metody, AutoQuote3D jen 2
- Okamzity odhad ceny (bounding box / volume) bez cekani na slicer
- Flexibilita pro adminy — zvolit metodu per material / technologie

### A2. Priorita, obtiznost, vlna

**Priorita P2:** Stavajici slicer-based metoda funguje dobre pro FDM. Rozsireni
je dulezite pro podporu vice technologii a flexibilitu, ale neni kriticke pro MVP.

**Obtiznost Stredni:**
- Refaktoring pricing engine (Strategy pattern) — strední
- Geometricke vypocty (bounding box, volume, surface) — jiz castecne existuji
- Admin UI pro vyber metody — jednoduche
- Per-material override — stredni slozitost
- Testovani presnosti ruznych metod — narocne

**Vlna 3:** Vyzaduje stabilni pricing engine (S01, S05). Pripravuje zaklad
pro Vlnu 5 (S18 — pokrocile technologie).

### A3. Zavislosti na jinych sekcich

**MUSI byt hotove pred S15:**
| Sekce | Duvod |
|-------|-------|
| S01 (Bug Fixes) | Stabilni pricing engine |
| S05 (Mnozstevni slevy) | Pricing pipeline zaklad |

**DOPORUCENE pred S15:**
| Sekce | Duvod |
|-------|-------|
| S03 (Multi-format) | Vice formatu = vice geometrickych dat |
| S08 (Printability) | Mesh analyza poskytuje surface area data |

**Na S15 ZAVISI:**
| Sekce | Duvod |
|-------|-------|
| S18 (Pokrocile technologie) | Ruzne technologie = ruzne metody |
| S09 (Express pricing) | Express prirazky nad alternativnimi metodami |

### A4. Soucasny stav v codebase

**Co uz existuje:**
- `src/lib/pricing/pricingEngineV3.js` — kompletni pricing pipeline
  - `calculatePriceV3(files, pricingConfig, feesConfig, ...)` — hlavni funkce
  - `getModelMetrics(file)` — extrahuje volumeMm3, sizeMm, surfaceMm2, filamentGrams
  - `getMaterialPricePerGram()` — cena za gram materialu
  - Jiz extrahuje bounding box data (sizeMm.x, y, z) a volume (volumeMm3)
  - Jiz extrahuje surfaceMm2 (pokud je dostupne z klienta)
- `src/pages/model-upload/utils/geomEstimate.js` — odhad hmotnosti z objemu
  - `estimateWeightFromVolume()` — prevod volume na gramy
- `src/utils/adminPricingStorage.js` — pricing config (namespace `pricing:v3`)
  - `loadPricingConfigV3()`, `savePricingConfigV3()`
  - Materials s cenami za gram
  - Rate per hour, markup, rounding, minima
- `src/pages/admin/AdminPricing.jsx` — admin UI pro cenotvorbu

**Co chybi:**
- Strategy pattern v pricing engine — NEEXISTUJE
- Volba metody cenotvorby v admin UI — NEEXISTUJE
- Per-material override metody — NEEXISTUJE
- Bounding box pricing logika — NEEXISTUJE
- Volume pricing logika — NEEXISTUJE
- Surface area pricing logika — NEEXISTUJE
- Hybrid pricing logika — NEEXISTUJE

**Klic existujicich dat v pricingEngineV3.js:**
```javascript
// Uz se extrahuje z modelu:
const metrics = getModelMetrics(file);
// metrics.volumeMm3     — objem modelu v mm3
// metrics.volumeCm3     — objem modelu v cm3
// metrics.sizeMm        — { x, y, z } bounding box v mm
// metrics.surfaceMm2    — povrch modelu v mm2 (pokud dostupne)
// metrics.surfaceCm2    — povrch modelu v cm2
// metrics.filamentGrams — hmotnost z sliceru
// metrics.estimatedTimeSeconds — cas tisku z sliceru
```

### A5. Referencni zdroje a konkurence

**Doporucene OSS knihovny:**

| Knihovna | GitHub | Hvezdy | Popis | Licence |
|----------|--------|--------|-------|---------|
| **json-rules-engine** | CacheControl/json-rules-engine | 2.5k+ | Pravidlovy engine | ISC |

**Doporuceni:** json-rules-engine neni nutny pro tuto sekci — Strategy pattern
v JavaScriptu je jednodussi a transparentnejsi. json-rules-engine je
vhodnejsi pro S10 (kupony) kde jsou slozite podminky.

**Konkurencni reseni:**
- **Layers.app** — 4 metody: Weight, Volume, Bounding Box, Time
- **AutoQuote3D** — 2 metody: Weight-based, Volume-based
- **Craftcloud3D** — Weight-based only
- **3D Hubs (Protolabs)** — Volume + Technology-specific

---

## B. ARCHITEKTURA

### B1. Datovy model / storage schema

**Namespace:** `pricing:v3` (rozsireni existujiciho)
**Storage klic:** `modelpricer:${tenantId}:pricing:v3`

Rozsireni existujiciho schema o nova pole:

```json
{
  "schema_version": 4,
  "tenant_pricing": {
    "rate_per_hour": 150,
    "...existujici pole...": "...",

    "pricing_method": {
      "default_method": "SLICER",
      "available_methods": ["SLICER", "BOUNDING_BOX", "VOLUME", "SURFACE_AREA", "WEIGHT_ONLY", "TIME_ONLY", "HYBRID"],
      "method_configs": {
        "BOUNDING_BOX": {
          "enabled": true,
          "price_per_cm3": 0.50,
          "minimum_price": 99,
          "tiers": [
            { "max_cm3": 100, "price_per_cm3": 0.60 },
            { "max_cm3": 500, "price_per_cm3": 0.45 },
            { "max_cm3": null, "price_per_cm3": 0.30 }
          ],
          "tiers_enabled": false
        },
        "VOLUME": {
          "enabled": true,
          "price_per_cm3": 2.00,
          "minimum_price": 99,
          "infill_coefficient": 1.0,
          "use_effective_volume": false,
          "tiers": [
            { "max_cm3": 50, "price_per_cm3": 2.50 },
            { "max_cm3": 200, "price_per_cm3": 1.80 },
            { "max_cm3": null, "price_per_cm3": 1.20 }
          ],
          "tiers_enabled": false
        },
        "SURFACE_AREA": {
          "enabled": false,
          "price_per_cm2": 0.30,
          "minimum_price": 99,
          "tiers_enabled": false,
          "tiers": []
        },
        "WEIGHT_ONLY": {
          "enabled": true,
          "note": "Pouziva existujici material prices"
        },
        "TIME_ONLY": {
          "enabled": true,
          "note": "Pouziva existujici rate_per_hour"
        },
        "HYBRID": {
          "enabled": false,
          "weights": {
            "material": 0.6,
            "time": 0.4,
            "volume": 0.0,
            "bounding_box": 0.0,
            "surface_area": 0.0
          },
          "combination_mode": "WEIGHTED_SUM",
          "minimum_price": 99
        }
      },
      "per_material_overrides": {
        "pla": { "method": "SLICER" },
        "abs": { "method": "SLICER" },
        "resin_standard": { "method": "VOLUME" },
        "nylon_sls": { "method": "VOLUME" },
        "metal_dmls": { "method": "BOUNDING_BOX" }
      }
    }
  },
  "materials": [
    {
      "key": "pla",
      "label": "PLA",
      "enabled": true,
      "price_per_gram": 0.60,
      "density_g_cm3": 1.24,
      "pricing_method_override": null,
      "...existujici pole...": "..."
    }
  ]
}
```

### B2. API kontrakty (endpointy)

**Frontend-only (localStorage):**

```javascript
// Rozsireni existujiciho adminPricingStorage.js
export function loadPricingMethod() {
  const config = loadPricingConfigV3();
  return config?.tenant_pricing?.pricing_method || getDefaultPricingMethod();
}

export function savePricingMethod(methodConfig) {
  const config = loadPricingConfigV3();
  config.tenant_pricing = config.tenant_pricing || {};
  config.tenant_pricing.pricing_method = methodConfig;
  savePricingConfigV3(config);
}

export function getEffectivePricingMethod(materialKey) {
  const method = loadPricingMethod();
  const override = method.per_material_overrides?.[materialKey];
  return override?.method || method.default_method;
}
```

**Budouci backend endpointy:**
```
GET    /api/pricing/methods
  Response: { methods: [...], default_method, per_material_overrides }

PUT    /api/pricing/methods
  Body: { default_method, method_configs, per_material_overrides }
  Response: { methods }

POST   /api/pricing/calculate
  Body: { model_data, material, method?: "BOUNDING_BOX" }
  Response: { price, method_used, breakdown }

GET    /api/pricing/methods/:method/preview
  Query: ?volume=100&bbox_x=50&bbox_y=30&bbox_z=20&surface=500&weight=50&time=3600
  Response: { estimated_price, breakdown }
```

### B3. Komponentni strom (React)

```
AdminPricing (existujici stranka /admin/pricing)
├── ... existujici sekce ...
├── PricingMethodSection (NOVA sekce)
│   ├── SectionHeader ("Metoda cenotvorby")
│   ├── DefaultMethodSelector
│   │   ├── MethodRadioGroup
│   │   │   ├── SlicerMethodOption (existujici — material + cas)
│   │   │   ├── BoundingBoxMethodOption (NOVA)
│   │   │   ├── VolumeMethodOption (NOVA)
│   │   │   ├── SurfaceAreaMethodOption (NOVA)
│   │   │   ├── WeightOnlyMethodOption (NOVA)
│   │   │   ├── TimeOnlyMethodOption (NOVA)
│   │   │   └── HybridMethodOption (NOVA)
│   │   └── MethodDescription (popis vybrane metody)
│   ├── MethodConfigPanel (konfigurace vybrane metody)
│   │   ├── [if BOUNDING_BOX] BoundingBoxConfig
│   │   │   ├── PricePerCm3Input
│   │   │   ├── MinimumPriceInput
│   │   │   ├── TiersToggle
│   │   │   └── TiersTable (cenova pasma)
│   │   ├── [if VOLUME] VolumeConfig
│   │   │   ├── PricePerCm3Input
│   │   │   ├── MinimumPriceInput
│   │   │   ├── InfillCoefficientSlider
│   │   │   ├── UseEffectiveVolumeToggle
│   │   │   └── TiersTable
│   │   ├── [if SURFACE_AREA] SurfaceAreaConfig
│   │   │   ├── PricePerCm2Input
│   │   │   ├── MinimumPriceInput
│   │   │   └── TiersTable
│   │   ├── [if HYBRID] HybridConfig
│   │   │   ├── WeightSliders (material, time, volume, bbox, surface)
│   │   │   ├── CombinationModeSelect (weighted_sum, max, min)
│   │   │   └── MinimumPriceInput
│   │   └── [if WEIGHT_ONLY or TIME_ONLY] SimpleMethodInfo
│   ├── PerMaterialOverrides
│   │   ├── MaterialOverrideTable
│   │   │   ├── MaterialRow
│   │   │   │   ├── MaterialName
│   │   │   │   ├── CurrentMethodBadge
│   │   │   │   ├── OverrideMethodSelect (dropdown)
│   │   │   │   └── ClearOverrideButton
│   │   │   └── ... (pro kazdy material)
│   │   └── AddOverrideButton
│   └── MethodPreview
│       ├── PreviewInputs (objem, bbox, povrch, hmotnost, cas)
│       ├── PreviewResult (vypoctena cena pro kazdou metodu)
│       └── ComparisonChart (porovnani metod na jednom modelu)
└── ... existujici sekce ...

PricingCalculator (existujici — widget/kalkulacka)
├── ... existujici ...
├── MethodIndicator (NOVY — zobrazit pouzitou metodu v developer modu)
└── PriceBreakdown (ROZSIRENT — zobrazit breakdown dle aktualni metody)
```

### B4. Tenant storage namespace

**Rozsireni existujiciho helperu:** `src/utils/adminPricingStorage.js`

```javascript
// Pridani do existujiciho adminPricingStorage.js:

export function getDefaultPricingMethod() {
  return {
    default_method: 'SLICER',
    available_methods: ['SLICER', 'BOUNDING_BOX', 'VOLUME', 'SURFACE_AREA',
                        'WEIGHT_ONLY', 'TIME_ONLY', 'HYBRID'],
    method_configs: {
      BOUNDING_BOX: { enabled: true, price_per_cm3: 0.50, minimum_price: 99, tiers: [], tiers_enabled: false },
      VOLUME: { enabled: true, price_per_cm3: 2.00, minimum_price: 99, infill_coefficient: 1.0, tiers: [], tiers_enabled: false },
      SURFACE_AREA: { enabled: false, price_per_cm2: 0.30, minimum_price: 99, tiers: [], tiers_enabled: false },
      WEIGHT_ONLY: { enabled: true },
      TIME_ONLY: { enabled: true },
      HYBRID: { enabled: false, weights: { material: 0.6, time: 0.4, volume: 0, bounding_box: 0, surface_area: 0 }, combination_mode: 'WEIGHTED_SUM', minimum_price: 99 },
    },
    per_material_overrides: {},
  };
}

// Normalizace — zajistit ze pricing method existuje v configu
export function normalizePricingMethodConfig(config) {
  const defaults = getDefaultPricingMethod();
  const method = config?.tenant_pricing?.pricing_method || {};
  return {
    ...defaults,
    ...method,
    method_configs: {
      ...defaults.method_configs,
      ...(method.method_configs || {}),
    },
  };
}
```

### B5. Widget integrace (postMessage)

**Propagace metody do widgetu:**
```javascript
// Kdyz admin zmeni metodu cenotvorby
{
  type: 'MODELPRICER_CONFIG_UPDATE',
  payload: {
    pricing: {
      method: 'BOUNDING_BOX',
      method_config: { price_per_cm3: 0.50, minimum_price: 99 },
      // Widget pouzije tuto metodu pro zobrazeni ceny
    }
  }
}
```

**Dulezite:** Widget musi vedet jakou metodu pouzit, protoze:
- SLICER metoda: Widget zobrazi "Pocitam cenu..." (ceka na slicer)
- BOUNDING_BOX / VOLUME: Widget zobrazi cenu okamzite po uploadu
- Toto je velky UX rozdil — okamzita cena vs cekani na slicer

### B6. Pricing engine integrace

**Toto je JADRO sekce S15.** Refaktoring `pricingEngineV3.js` na Strategy pattern.

**Soucasna struktura (v pricingEngineV3.js):**
```javascript
// Soucasne — hardcoded material + time:
const materialCost = filamentGrams * materialPricePerGram;
const timeCost = (estimatedTimeSeconds / 3600) * ratePerHour;
const baseCost = materialCost + timeCost;
```

**Cilova struktura (Strategy pattern):**
```javascript
// Novy pristup — Strategy:
const strategy = getPricingStrategy(effectiveMethod);
const baseCost = strategy.calculate(metrics, methodConfig, materialConfig);

// Kde strategy.calculate vraci:
// { baseCost, breakdown: { material?: N, time?: N, volume?: N, bbox?: N, surface?: N } }
```

**Zmeny v pricingEngineV3.js:**
1. Extrahovat base cost vypocet do strategy funkci
2. Pridat parameter `pricingMethod` do `calculatePriceV3()`
3. Zachovat zpetnou kompatibilitu — default = SLICER (stavajici chovani)
4. Fees, markup, rounding, minima zustavaji STEJNE (aplikuji se nad base cost)

**Pricing pipeline po zmene:**
```
Model upload → geometricka analyza (volume, bbox, surface)
     ↓
[volitelne] Slicer → filament grams + print time
     ↓
Strategy selection (dle metody + material override)
     ↓
Base cost calculation (strategy-specific)
     ↓
+ Fees (post-processing, express, ...)     ← beze zmeny
     ↓
+ Markup (flat/percent/min_flat)            ← beze zmeny
     ↓
Apply minimums (per model, per order)       ← beze zmeny
     ↓
Apply rounding                              ← beze zmeny
     ↓
= Final price
```

---

## C. IMPLEMENTACE

### C1. Agent assignments (kdo co dela)

| Agent | Ukol | Soubory | Priorita |
|-------|------|---------|----------|
| `mp-mid-pricing-engine` | Strategy pattern, pricing strategies | `src/lib/pricing/pricingEngineV3.js`, `src/lib/pricing/strategies/` | P0 |
| `mp-sr-pricing` | Architektura, review pricing logiky | — | P0 |
| `mp-mid-storage-tenant` | Rozsireni pricing storage o method config | `src/utils/adminPricingStorage.js` | P0 |
| `mp-mid-frontend-admin` | PricingMethodSection v AdminPricing | `src/pages/admin/AdminPricing.jsx` | P1 |
| `mp-spec-fe-forms` | Konfiguracni formulare pro metody | Admin komponenty | P1 |
| `mp-spec-pricing-methods` | Jednotlive strategy implementace | `src/lib/pricing/strategies/*.js` | P0 |
| `mp-mid-frontend-widget` | Method indicator v kalkulacce | Widget komponenty | P2 |
| `mp-spec-test-build` | Testy pricing strategii | `src/lib/pricing/__tests__/` | P1 |
| `mp-mid-quality-code` | Code review + build | — | P1 |

### C2. Implementacni kroky (poradi)

**Faze 1: Pricing engine refaktoring (sekvencni — KRITICKE)**
```
Krok 1: [mp-sr-pricing] Architekturalni review — definovat Strategy interface
        Vystup: Specifikace interface PricingStrategy

Krok 2: [mp-mid-pricing-engine] Extrakce stavajiciho kodu do SlicerStrategy
        - Presun material + time vypoctu do samostatne funkce
        - ZACHOVAT zpetnou kompatibilitu
        Soubor: src/lib/pricing/strategies/slicerStrategy.js

Krok 3: [mp-mid-pricing-engine] Implementovat strategy dispatcher
        - getPricingStrategy(method) — factory funkce
        - Integrace do calculatePriceV3()
        Soubor: src/lib/pricing/pricingEngineV3.js (update)
```

**Faze 2: Nove strategie (paralelne)**
```
Krok 4a: [mp-spec-pricing-methods] BoundingBoxStrategy
         - Vypocet: bbox_volume = x * y * z / 1000 (cm3)
         - Cenova pasma (tiers)
         Soubor: src/lib/pricing/strategies/boundingBoxStrategy.js

Krok 4b: [mp-spec-pricing-methods] VolumeStrategy
         - Vypocet: model_volume_cm3 * price_per_cm3
         - Infill coefficient
         Soubor: src/lib/pricing/strategies/volumeStrategy.js

Krok 4c: [mp-spec-pricing-methods] SurfaceAreaStrategy
         - Vypocet: surface_cm2 * price_per_cm2
         Soubor: src/lib/pricing/strategies/surfaceAreaStrategy.js

Krok 4d: [mp-spec-pricing-methods] WeightOnlyStrategy
         - Pouzije jen material cost (filamentGrams * pricePerGram)
         Soubor: src/lib/pricing/strategies/weightOnlyStrategy.js

Krok 4e: [mp-spec-pricing-methods] TimeOnlyStrategy
         - Pouzije jen time cost (seconds / 3600 * ratePerHour)
         Soubor: src/lib/pricing/strategies/timeOnlyStrategy.js

Krok 4f: [mp-spec-pricing-methods] HybridStrategy
         - Weighted sum z vice metod
         Soubor: src/lib/pricing/strategies/hybridStrategy.js
```

**Faze 3: Storage a Admin UI (paralelne s Fazi 2)**
```
Krok 5: [mp-mid-storage-tenant] Rozsireni adminPricingStorage.js
        - Pridat pricing_method do schema
        - Normalizace, migrace z v3 na v4
        Soubor: src/utils/adminPricingStorage.js (update)

Krok 6: [mp-mid-frontend-admin] PricingMethodSection v AdminPricing
        - Vyber metody, konfigurace, per-material overrides
        Soubor: src/pages/admin/AdminPricing.jsx (update)
        Nove: src/pages/admin/components/PricingMethodSection.jsx
```

**Faze 4: Integrace a testovani (sekvencni)**
```
Krok 7: [mp-mid-pricing-engine] Integrace vsech strategii do dispatcheru
        - Per-material override logika
        - Fallback na default metodu

Krok 8: [mp-spec-test-build] Komplexni testy vsech strategii
        - Jednotkove testy pro kazdou strategii
        - Integracni test — prechod mezi metodami
        - Regresni test — stavajici SLICER chovani zachovano

Krok 9: [mp-mid-frontend-widget] MethodIndicator v kalkulacce
        - Zobrazit pouzitou metodu v developer modu
        - Zmenit UX: okamzita cena vs cekani na slicer

Krok 10: [mp-mid-quality-code] Finalni review + build
```

### C3. Kriticke rozhodovaci body

1. **Jak resit modely bez slicer dat pri SLICER metode?**
   - Rozhodnuti: Fallback na VOLUME metodu (pokud jsou geometricka data)
   - Fallback chain: SLICER -> VOLUME -> BOUNDING_BOX
   - Zobrazit varovani: "Cena odhadnuta bez slicovani"

2. **Jak resit modely bez geometrickych dat pri BOUNDING_BOX/VOLUME?**
   - Rozhodnuti: Zobrazit "Nelze vypocitat cenu — nahrajte 3D model"
   - Nektere formaty (STEP, IGES) nemaji snadno dostupny objem

3. **Kde ukladat method config — v pricing:v3 nebo novy namespace?**
   - Rozhodnuti: V pricing:v3 (rozsireni existujiciho schema)
   - Duvod: Method je soucasti pricing configu, neni separatni entita
   - Schema migrace z v3 na v4 pridava `pricing_method` blok

4. **Surface area — je dostatecne presna z klientske analyzy?**
   - Rozhodnuti: Pouzit pouze pokud je surfaceMm2 dostupne z realne mesh analyzy
   - NEPOUZIVAT odhad z bounding boxu (prilis nepresne)
   - Pokud neni dostupne: Surface area metoda neni zvolitelna pro dany model

5. **Hybrid metoda — jak validovat ze vahy se rovnaji 1.0?**
   - Rozhodnuti: Normalizovat vahy automaticky (vahy / suma vah)
   - Admin muze zadat libovolne kladne hodnoty, system normalizuje

### C4. Testovaci strategie

**Unit testy (pro kazdou strategii):**
```javascript
// src/lib/pricing/__tests__/strategies.test.js

describe('BoundingBoxStrategy', () => {
  test('basic calculation', () => {
    const result = boundingBoxStrategy({
      sizeMm: { x: 100, y: 50, z: 30 },  // = 150 cm3
    }, { price_per_cm3: 0.50 });
    expect(result.baseCost).toBe(75);  // 150 * 0.50
  });

  test('with tiers', () => {
    const result = boundingBoxStrategy({
      sizeMm: { x: 200, y: 200, z: 200 },  // = 8000 cm3
    }, {
      tiers_enabled: true,
      tiers: [
        { max_cm3: 100, price_per_cm3: 0.60 },
        { max_cm3: 1000, price_per_cm3: 0.40 },
        { max_cm3: null, price_per_cm3: 0.20 },
      ]
    });
    // 100 * 0.60 + 900 * 0.40 + 7000 * 0.20 = 60 + 360 + 1400 = 1820
    expect(result.baseCost).toBe(1820);
  });

  test('minimum price applied', () => {
    const result = boundingBoxStrategy({
      sizeMm: { x: 10, y: 10, z: 10 },  // = 1 cm3
    }, { price_per_cm3: 0.50, minimum_price: 99 });
    expect(result.baseCost).toBe(99);  // minimum
  });
});

describe('VolumeStrategy', () => {
  test('basic calculation', () => { ... });
  test('with infill coefficient', () => { ... });
  test('missing volume data', () => { ... });
});

// ... pro kazdy strategy
```

**Regresni testy:**
- Vsechny existujici testy pricing engine MUSI projit beze zmeny
- Defaultni metoda SLICER musi vracet PRESNE stejne vysledky jako pred refaktoringem

**Integracni testy:**
- Zmena metody v admin UI → pricing engine pouzije novou metodu
- Per-material override → ruzne modely pouziji ruzne metody v jedne objednavce
- Fallback chain — model bez slicer dat fallbackne na VOLUME

### C5. Migrace existujicich dat

**Migrace pricing:v3 -> pricing:v4:**
```javascript
function migratePricingV3toV4(config) {
  if (config.schema_version >= 4) return config;

  config.schema_version = 4;
  config.tenant_pricing = config.tenant_pricing || {};
  config.tenant_pricing.pricing_method = getDefaultPricingMethod();
  // Default = SLICER — zachovat stavajici chovani
  return config;
}
```

**Zpetna kompatibilita:**
- Existujici tenant bez `pricing_method` = defaultne SLICER
- Zadna zmena v cenach pro existujici tenanty
- Novy blok `pricing_method` se prida pri prvnim pristupu do admin pricing

---

## D. KVALITA

### D1. Security review body

- **Pricing manipulace:** Validovat vsechny vstupy na serveru (budouci)
  - price_per_cm3 musi byt > 0
  - Tiers musi byt serazene (max_cm3 rostouci)
  - Vahy v hybrid metode musi byt >= 0
- **Client-side vypocet:** V localStorage muze admin zmenit cokoliv
  - Toto je demo-safe — v produkci ceny pocita backend
- **Per-material override:** Overit ze material key existuje v materials listu
- **Rounding attack:** Overit ze rounding nemeni cenu o vice nez 1 krok

### D2. Performance budget

| Operace | Budget | Metrika |
|---------|--------|---------|
| Strategy selection | < 1ms | Lookup time |
| BoundingBox calculation (1 model) | < 1ms | Compute time |
| Volume calculation (1 model) | < 1ms | Compute time |
| Hybrid calculation (1 model) | < 5ms | Compute time (kombinace) |
| Full pricing pipeline (10 modelu, VOLUME) | < 20ms | End-to-end |
| Full pricing pipeline (10 modelu, SLICER) | Beze zmeny | Regrese |
| Admin PricingMethodSection render | < 50ms | React render |
| Method preview (porovnani 6 metod) | < 50ms | Compute + render |

### D3. Accessibility pozadavky

- RadioGroup pro vyber metody: `role="radiogroup"`, `aria-label="Metoda cenotvorby"`
- Kazda radio option: `role="radio"`, `aria-checked`, popisek
- Slider pro hybrid vahy: `aria-label="Vaha materialu"`, `aria-valuemin`, `aria-valuemax`
- Tiers tabulka: Spravne `<th>` hlavicky, moznost pridani/smazani radku klavesnici
- Preview sekce: `aria-live="polite"` pro dynamicke aktualizace ceny

### D4. Error handling a edge cases

| Edge case | Reseni |
|-----------|--------|
| Model bez bounding box dat | Fallback na SLICER, varovani |
| Model bez volume dat | Fallback na BOUNDING_BOX, varovani |
| Model bez surface area dat | Metoda SURFACE_AREA neni dostupna pro tento model |
| Model bez slicer dat | Fallback chain: SLICER -> VOLUME -> BOUNDING_BOX |
| Vsechny metriky chybi | Zobrazit "Nelze vypocitat cenu" + minimum_price |
| Negative price (bug) | clampMin0 — nikdy negativni cena |
| Tier max_cm3 = 0 | Ignorovat tier, pouzit default price_per_cm3 |
| Hybrid vahy vsechny = 0 | Fallback na SLICER |
| Per-material override pro neexistujici material | Ignorovat override |
| Zmena metody na objednavce ktera je uz vytvorena | Stara objednavka si drzi snapshot — novy metoda jen pro nove |

### D5. i18n pozadavky

**Prekladove klice pro metody cenotvorby:**
```json
{
  "pricing_methods": {
    "section_title": "Metoda cenotvorby",
    "default_method": "Vychozi metoda",
    "per_material": "Nastaveni per material",
    "preview": "Nahled ceny",
    "SLICER": "Slicer (material + cas)",
    "SLICER_desc": "Nejpresnejsi — pouziva data z PrusaSliceru (hmotnost + cas tisku)",
    "BOUNDING_BOX": "Bounding Box",
    "BOUNDING_BOX_desc": "Cena dle objemu ohranicujiciho kvadru modelu (X * Y * Z)",
    "VOLUME": "Objem modelu",
    "VOLUME_desc": "Cena dle skutecneho objemu 3D modelu",
    "SURFACE_AREA": "Povrch modelu",
    "SURFACE_AREA_desc": "Cena dle plochy povrchu modelu — vhodne pro SLA/povrchove upravy",
    "WEIGHT_ONLY": "Pouze hmotnost",
    "WEIGHT_ONLY_desc": "Cena zalozena jen na hmotnosti materialu (bez casu)",
    "TIME_ONLY": "Pouze cas",
    "TIME_ONLY_desc": "Cena zalozena jen na dobe tisku (bez materialu)",
    "HYBRID": "Hybridni",
    "HYBRID_desc": "Kombinace vice metod s nastavitelnymi vahami",
    "price_per_cm3": "Cena za cm3",
    "price_per_cm2": "Cena za cm2",
    "minimum_price": "Minimalni cena za model",
    "tiers": "Cenova pasma",
    "tier_up_to": "Do",
    "tier_price": "Cena/cm3",
    "infill_coefficient": "Koeficient vyplne",
    "override_method": "Prepsat metodu",
    "no_override": "Pouzit vychozi",
    "fallback_warning": "Cena odhadnuta pomoci alternativni metody ({method})"
  }
}
```

---

## E. ROLLOUT

### E1. Feature flagy a postupne nasazeni

**Feature flag:** `extended_pricing_methods_enabled` — default `false`

Kdyz je `false`, admin vidi jen stavajici SLICER konfiguraci (zadna zmena UX).
Kdyz je `true`, zobrazi se nova sekce PricingMethodSection v AdminPricing.

**Postupne nasazeni:**
1. **Alpha:** Jen BOUNDING_BOX a VOLUME jako alternativy k SLICER
2. **Beta:** Vsech 6 metod + per-material overrides
3. **GA:** Hybrid metoda + method preview/comparison

### E2. Admin UI zmeny

**Zmeny v AdminPricing.jsx:**
- Nova sekce "Metoda cenotvorby" mezi existujicimi sekcemi
- RadioGroup pro vyber vychozi metody
- Konfiguracni panel pro vybranou metodu
- Per-material override tabulka
- Preview sekce s porovnanim metod

**Nove komponenty:**
```
src/pages/admin/components/PricingMethodSection.jsx    — hlavni sekce
src/pages/admin/components/MethodConfigPanel.jsx       — konfigurace metody
src/pages/admin/components/BoundingBoxConfig.jsx       — nastaveni bbox
src/pages/admin/components/VolumeConfig.jsx            — nastaveni volume
src/pages/admin/components/HybridConfig.jsx            — nastaveni hybrid
src/pages/admin/components/PerMaterialOverrides.jsx    — per-material tabulka
src/pages/admin/components/MethodPreview.jsx           — preview/porovnani
```

### E3. Widget zmeny

**Zmeny v kalkulacce/widgetu:**
1. **Okamzita cena** — pokud metoda je BOUNDING_BOX nebo VOLUME, zobrazit
   cenu ihned po uploadu (bez cekani na slicer)
2. **Method indicator** — v developer modu zobrazit pouzitou metodu
3. **Fallback info** — pokud se pouzila fallback metoda, zobrazit diskretni info

### E4. Dokumentace pro uzivatele

**In-app tooltips:**
- "Slicer metoda je nejpresnejsi, ale vyzaduje slicovani modelu (10-60 sekund)"
- "Bounding Box je nejrychlejsi — cena se zobrazi okamzite po uploadu"
- "Objem modelu je dobry kompromis mezi rychlosti a presnosti"
- "Hybridni metoda umoznuje kombinovat vice pristupu s nastavitelnymi vahami"

**Admin dokumentace:**
- Tabulka porovnani metod (presnost, rychlost, vhodne technologie)
- Doporucene metody per technologie (FDM, SLA, SLS, CNC)

### E5. Metriky uspechu (KPI)

| Metrika | Cil | Mereni |
|---------|-----|--------|
| Adoption (% tenantu pouzivajicich jinou nez SLICER) | > 20% do 60 dni | Settings tracking |
| Presnost ceny (odchylka od SLICER referencni ceny) | < 15% pro VOLUME | Porovnavaci analyza |
| Cas do zobrazeni ceny (BBOX/VOLUME vs SLICER) | 80% redukce | Performance tracking |
| Per-material overrides pouzivane | > 10% tenantu | Settings tracking |
| Conversion rate (s okamzitou cenou vs cekani) | +5% | A/B test |
| Bug reports related to pricing | 0 P0 | Issue tracker |

---

## F. REFERENCNI SNIPPETY

### F1. Strategy interface a implementace

```javascript
// src/lib/pricing/strategies/pricingStrategy.js

/**
 * Kazda pricing strategy implementuje tuto funkci.
 *
 * @param {Object} metrics - { volumeMm3, volumeCm3, sizeMm, surfaceMm2, surfaceCm2, filamentGrams, estimatedTimeSeconds }
 * @param {Object} methodConfig - Konfigurace specificka pro danou metodu
 * @param {Object} materialConfig - { price_per_gram, density_g_cm3, ... }
 * @param {Object} pricingConfig - Celkova pricing konfigurace (rate_per_hour, ...)
 * @returns {{ baseCost: number, breakdown: Object, method: string, fallback: boolean }}
 */

// === SLICER (stavajici logika) ===
export function slicerStrategy(metrics, methodConfig, materialConfig, pricingConfig) {
  const materialCost = metrics.filamentGrams * (materialConfig.price_per_gram || 0);
  const timeCost = (metrics.estimatedTimeSeconds / 3600) * (pricingConfig.rate_per_hour || 0);
  return {
    baseCost: materialCost + timeCost,
    breakdown: { material: materialCost, time: timeCost },
    method: 'SLICER',
    fallback: false,
  };
}

// === BOUNDING BOX ===
export function boundingBoxStrategy(metrics, methodConfig) {
  const x = (metrics.sizeMm?.x || 0) / 10;  // mm -> cm
  const y = (metrics.sizeMm?.y || 0) / 10;
  const z = (metrics.sizeMm?.z || 0) / 10;
  const bboxCm3 = x * y * z;

  let cost;
  if (methodConfig.tiers_enabled && methodConfig.tiers?.length > 0) {
    cost = calculateTieredPrice(bboxCm3, methodConfig.tiers);
  } else {
    cost = bboxCm3 * (methodConfig.price_per_cm3 || 0);
  }

  cost = Math.max(cost, methodConfig.minimum_price || 0);

  return {
    baseCost: cost,
    breakdown: { bounding_box_cm3: bboxCm3, price_per_cm3: methodConfig.price_per_cm3 },
    method: 'BOUNDING_BOX',
    fallback: false,
  };
}

// === VOLUME ===
export function volumeStrategy(metrics, methodConfig) {
  let volumeCm3 = metrics.volumeCm3 || (metrics.volumeMm3 || 0) / 1000;

  if (methodConfig.use_effective_volume && methodConfig.infill_coefficient) {
    volumeCm3 *= methodConfig.infill_coefficient;
  }

  let cost;
  if (methodConfig.tiers_enabled && methodConfig.tiers?.length > 0) {
    cost = calculateTieredPrice(volumeCm3, methodConfig.tiers);
  } else {
    cost = volumeCm3 * (methodConfig.price_per_cm3 || 0);
  }

  cost = Math.max(cost, methodConfig.minimum_price || 0);

  return {
    baseCost: cost,
    breakdown: { volume_cm3: volumeCm3, price_per_cm3: methodConfig.price_per_cm3 },
    method: 'VOLUME',
    fallback: false,
  };
}

// === TIER HELPER ===
function calculateTieredPrice(quantity, tiers) {
  let total = 0;
  let remaining = quantity;

  const sorted = [...tiers].sort((a, b) => (a.max_cm3 || Infinity) - (b.max_cm3 || Infinity));

  let prevMax = 0;
  for (const tier of sorted) {
    const tierMax = tier.max_cm3 || Infinity;
    const tierRange = tierMax - prevMax;
    const inTier = Math.min(remaining, tierRange);
    total += inTier * (tier.price_per_cm3 || 0);
    remaining -= inTier;
    prevMax = tierMax;
    if (remaining <= 0) break;
  }

  return total;
}
```

### F2. Dispatcher v pricingEngineV3.js

```javascript
// Pridano do pricingEngineV3.js:

import { slicerStrategy, boundingBoxStrategy, volumeStrategy,
         surfaceAreaStrategy, weightOnlyStrategy, timeOnlyStrategy,
         hybridStrategy } from './strategies/pricingStrategy';

const STRATEGY_MAP = {
  SLICER: slicerStrategy,
  BOUNDING_BOX: boundingBoxStrategy,
  VOLUME: volumeStrategy,
  SURFACE_AREA: surfaceAreaStrategy,
  WEIGHT_ONLY: weightOnlyStrategy,
  TIME_ONLY: timeOnlyStrategy,
  HYBRID: hybridStrategy,
};

const FALLBACK_CHAIN = ['SLICER', 'VOLUME', 'BOUNDING_BOX'];

function executeStrategy(method, metrics, methodConfig, materialConfig, pricingConfig) {
  const strategy = STRATEGY_MAP[method];
  if (!strategy) {
    console.warn(`[pricingEngineV3] Unknown method: ${method}, falling back to SLICER`);
    return slicerStrategy(metrics, {}, materialConfig, pricingConfig);
  }

  const result = strategy(metrics, methodConfig, materialConfig, pricingConfig);

  // Pokud strategy vraci baseCost === 0 a neni to zamerne, zkus fallback
  if (result.baseCost <= 0 && !result.intentionalZero) {
    for (const fallbackMethod of FALLBACK_CHAIN) {
      if (fallbackMethod === method) continue;
      const fb = STRATEGY_MAP[fallbackMethod];
      if (!fb) continue;
      const fbResult = fb(metrics, methodConfig, materialConfig, pricingConfig);
      if (fbResult.baseCost > 0) {
        return { ...fbResult, fallback: true, originalMethod: method };
      }
    }
  }

  return result;
}
```
