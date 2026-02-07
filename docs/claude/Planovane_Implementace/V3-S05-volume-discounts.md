# V3-S05: Mnozstevni slevy a cenova degrese

> **Priorita:** P1 | **Obtiznost:** Nizka | **Vlna:** 1
> **Zavislosti:** S01 (Bug Fixes), pricing:v3 namespace (existuje)
> **Odhadovany rozsah:** Stredni (8-12 souboru, 2-3 dny)

---

## A. KONTEXT

### A1. Ucel a cil

Mnozstevni slevy (volume discounts / quantity-based pricing degression) jsou zakladnim e-commerce patternem,
ktery motivuje zakazniky k vetsimu objemu objednavek. V soucasnosti kalkulacka ModelPricer ma pole
"Pocet kusu" (quantity), ale cena se jednoduse nasobi poctem — zadna degresivni sleva za vetsi
mnozstvi neexistuje.

**Business value:**
- Zvyseni prumerneho objemu objednavky (AOV) o odhadovanych 15-25%
- Motivace zakazniku k objednavani vetsich sarzi (seriova vyroba)
- Konkurencni vyhoda — SeekMake, Xometry i Craftcloud nabizeji mnozstevni slevy
- Transparentnost cenotvorby — zakaznik vidi presne proc plati mene za vetsi objem

**Co tato sekce resi:**
1. Admin UI pro konfiguraci slevovych pasem (tier-based pricing)
2. Rozsireni pricing engine o krok mnozstevni slevy v pipeline
3. Vizualni indikace slevy pro zakazniky ve widgetu/kalkulacce
4. Developer rezim s detailnim rozpisem aplikovane slevy

### A2. Priorita, obtiznost, vlna

**Priorita P1** — neni kriticka pro zakladni funkcnost (P0 = S01, S02), ale je klicova pro
business model. Bez slev neni motivace pro vetsi objednavky.

**Obtiznost Nizka** — pricing engine uz ma zakladni pipeline, staci pridat 1 krok.
Storage schema je jednoduche (pole pasem). UI je tabulka s validaci.

**Vlna 1** — muze byt implementovana zaroven s S01 (Bug Fixes) a S02 (Checkout).
Nema zavislost na slozitych subsystemech (backend, emaily, portal).

### A3. Zavislosti na jinych sekcich

**Musi byt hotove pred touto sekci:**
- S01 (Bug Fixes) — reaktivni prepocet ceny musi fungovat spravne pred pridanim slev

**Tato sekce je zavislost pro:**
- S09 (Express Pricing) — express priplatek se pocita z ceny po sleve
- S06 (Post-Processing) — post-processing fee se aplikuje na cenu po sleve
- S10 (Kupony) — kupon se aplikuje na cenu po mnozstevni sleve

**Paralelni implementace mozna s:**
- S02 (Checkout) — nezavisla UI sekce
- S04 (Doprava) — nezavisla pipeline krok

### A4. Soucasny stav v codebase

**Pricing engine — `src/lib/pricing/pricingEngineV3.js`:**
- Pipeline: `base → fees → markup → minima → rounding`
- Mnozstevni slevy CHYBI uplne — quantity se pouziva jen jako nasobicka `baseTotal = basePerPiece * quantity`
- Funkce `calcBase()` (radek 289-318) pocita `baseTotal` jako `(materialCostPerPiece + timeCostPerPiece) * quantity`
- Zadna logika pro slevova pasma

**Pricing storage — `src/utils/adminPricingStorage.js`:**
- Namespace: `modelpricer:${tenantId}:pricing:v3`
- Schema neobsahuje zadne pole pro volume discounts
- `DEFAULT_TENANT_PRICING_RULES` neobsahuje discount tiers

**Admin Pricing UI — `src/pages/admin/AdminPricing.jsx`:**
- Zobrazuje materialy, casovou sazbu, rounding, markup, minima
- Zadna sekce pro mnozstevni slevy

**Kalkulacka — `src/pages/test-kalkulacka/components/PricingCalculator.jsx`:**
- Zobrazuje rozpis: Material, Cas, Sluzby, Sleva (vzdy 0 Kc), Markup, Celkem
- Radek "Sleva" existuje ale zobrazuje `+ 0,00 Kc` — pripraven na naplneni

**Widget — `src/pages/widget/WidgetEmbed.jsx`, `WidgetPreview.jsx`:**
- Widget dostava pricing data pres postMessage — zatim bez slev

### A5. Referencni zdroje a konkurence

**OSS knihovny (z doporuceni):**
- **decimal.js** — presna desetinna aritmetika (prevence floating point chyb)
- **dinero.js** — prace s menami a cenami (immutable money objects)
- Doporuceni: Pro tuto fazi NENI treba externi knihovna — implementace jako soucast pricing engine

**Konkurencni reseni:**
- **Xometry:** Automaticke volume discounts per-part, zobrazuje tabulku pasem u quantity selectoru
- **SeekMake:** Procentualni slevy za mnozstvi s tabulkou viditelnou v kalkulacce
- **Craftcloud:** Dynamicke slevy s vizualni indikaci usetrene castky
- **Shapeways:** Tiered pricing s degresivni krivkou

**Best practices:**
- PAsma museji byt vzajemne exkluzivni (nesmí se prekryvat)
- Pasma museji navazovat (gap = plna cena v tom rozmezi)
- Admin musi moci volit model: PROCENTA vs FIXNI CENA za kus
- Scope slevy: per-model vs per-objednavka (admin volba)

---

## B. ARCHITEKTURA

### B1. Datovy model / storage schema

**Rozsireni pricing:v3 namespace:**

```json
{
  "schema_version": 3,
  "materials": [...],
  "tenant_pricing": { ... },
  "volume_discounts": {
    "enabled": true,
    "mode": "percent",
    "scope": "per_model",
    "tiers": [
      {
        "id": "tier_001",
        "min_qty": 1,
        "max_qty": 4,
        "discount_percent": 0,
        "fixed_price_per_unit": null
      },
      {
        "id": "tier_002",
        "min_qty": 5,
        "max_qty": 9,
        "discount_percent": 5,
        "fixed_price_per_unit": null
      },
      {
        "id": "tier_003",
        "min_qty": 10,
        "max_qty": 24,
        "discount_percent": 10,
        "fixed_price_per_unit": null
      },
      {
        "id": "tier_004",
        "min_qty": 25,
        "max_qty": 49,
        "discount_percent": 15,
        "fixed_price_per_unit": null
      },
      {
        "id": "tier_005",
        "min_qty": 50,
        "max_qty": null,
        "discount_percent": 20,
        "fixed_price_per_unit": null
      }
    ],
    "updated_at": "2026-02-06T12:00:00Z"
  },
  "updated_at": "2026-02-06T12:00:00Z"
}
```

**Klic v localStorage:** `modelpricer:${tenantId}:pricing:v3`

**Typy:**
- `mode`: `"percent"` | `"fixed_price"` — urcuje ktery sloupec se pouzije pro vypocet
- `scope`: `"per_model"` | `"per_order"` — zda se pocet kusu scita pres cele objednavky
- `tiers[].min_qty`: cislo, >= 1
- `tiers[].max_qty`: cislo | null (null = neomezeno / "50+")
- `tiers[].discount_percent`: cislo 0-100 (pouzije se pri mode=percent)
- `tiers[].fixed_price_per_unit`: cislo | null (pouzije se pri mode=fixed_price)

**Default hodnoty (pri prvnim nacteni):**
```json
{
  "enabled": false,
  "mode": "percent",
  "scope": "per_model",
  "tiers": []
}
```

**Migrace:** Neni treba — pole `volume_discounts` se prida jako optional field. Pokud chybi,
engine pouzije default (zadne slevy).

### B2. API kontrakty (endpointy)

V soucasne fazi je pricing engine ciste na frontendu (localStorage). Zadne REST endpointy.
Pro budouci backend API:

```
GET    /api/v1/tenant/:tenantId/pricing/volume-discounts
Response: { enabled, mode, scope, tiers: [...] }

PUT    /api/v1/tenant/:tenantId/pricing/volume-discounts
Body:  { enabled, mode, scope, tiers: [...] }
Response: { ...normalized }

GET    /api/v1/quote/:tenantId/calculate
Body:  { files: [...], configs: [...] }
Response: { ...quote, volume_discount: { tier_id, percent, amount } }
```

### B3. Komponentni strom (React)

```
AdminPricing.jsx
├── MaterialsSection (existujici)
├── TenantPricingRules (existujici)
├── VolumeDiscountsSection (NOVY)
│   ├── VolumeDiscountsToggle
│   │   ├── Switch (enabled/disabled)
│   │   ├── ModeSelector (percent / fixed_price)
│   │   └── ScopeSelector (per_model / per_order)
│   ├── VolumeDiscountTiersTable
│   │   ├── TierRow (pro kazde pasmo)
│   │   │   ├── Input[min_qty]
│   │   │   ├── Input[max_qty]
│   │   │   ├── Input[discount_percent] (nebo fixed_price)
│   │   │   └── DeleteButton
│   │   └── AddTierButton
│   └── VolumeDiscountPreview
│       └── PreviewTable (priklad vypoctu pro ruzna mnozstvi)
└── PricingPreviewSection (existujici — rozsirit o slev)

PricingCalculator.jsx (kalkulacka)
├── OrderSummary (existujici)
│   ├── ModelRow (existujici)
│   │   └── DiscountBadge (NOVY — zeleny badge "-10%")
│   ├── DiscountRow (existujici — naplnit realnou hodnotou)
│   └── VolumeDiscountHint (NOVY)
│       └── NextTierMessage ("Objednejte 5+ a zyskejte 5% slevu!")
└── DiscountTiersPopover (NOVY — mini tabulka pasem)
```

### B4. Tenant storage namespace

- **Namespace:** `pricing:v3` (existujici)
- **Helper:** `adminPricingStorage.js` — `loadPricingConfigV3()` / `savePricingConfigV3()`
- Data se strukturuji jako novy blok `volume_discounts` v ramci stavajiciho pricing config objektu
- **Zadny novy namespace** — rozsireni stavajiciho

### B5. Widget integrace (postMessage)

Widget dostava pricing config pres postMessage pri inicializaci. Rozsireni:

```javascript
// Widget init message
{
  type: 'MODELPRICER_CONFIG',
  payload: {
    pricingConfig: {
      // ... existujici pole
      volume_discounts: {
        enabled: true,
        mode: 'percent',
        scope: 'per_model',
        tiers: [...]
      }
    }
  }
}

// Quote result message (po kalkulaci)
{
  type: 'MODELPRICER_QUOTE',
  payload: {
    // ... existujici pole
    models: [{
      // ... existujici pole
      volume_discount: {
        tier_id: 'tier_003',
        tier_label: '10-24 ks',
        discount_percent: 10,
        discount_amount: 150.00,
        original_total: 1500.00,
        discounted_total: 1350.00
      }
    }]
  }
}
```

### B6. Pricing engine integrace

**Zmena pipeline poradi:**
```
PRED:  base (material + cas) → fees → markup → minima → zaokrouhleni
PO:    base (material + cas) → fees → VOLUME DISCOUNT → markup → minima → zaokrouhleni
```

**Implementace v `calculateOrderQuote()`:**

Nova funkce `applyVolumeDiscount()`:
```javascript
function findTier(tiers, quantity) {
  if (!Array.isArray(tiers)) return null;
  return tiers.find(t => {
    const minOk = quantity >= (t.min_qty || 1);
    const maxOk = t.max_qty == null || quantity <= t.max_qty;
    return minOk && maxOk;
  }) || null;
}

function applyVolumeDiscount({ baseTotal, quantity, volumeDiscounts, basePerPiece }) {
  if (!volumeDiscounts?.enabled || !Array.isArray(volumeDiscounts?.tiers) || volumeDiscounts.tiers.length === 0) {
    return { discountAmount: 0, discountPercent: 0, tierId: null, tierLabel: null };
  }

  const tier = findTier(volumeDiscounts.tiers, quantity);
  if (!tier) {
    return { discountAmount: 0, discountPercent: 0, tierId: null, tierLabel: null };
  }

  const mode = volumeDiscounts.mode || 'percent';
  let discountAmount = 0;
  let discountPercent = 0;

  if (mode === 'percent') {
    discountPercent = Math.max(0, Math.min(100, safeNum(tier.discount_percent, 0)));
    discountAmount = baseTotal * (discountPercent / 100);
  } else if (mode === 'fixed_price') {
    const fixedPricePerUnit = safeNum(tier.fixed_price_per_unit, 0);
    if (fixedPricePerUnit > 0 && fixedPricePerUnit < basePerPiece) {
      discountAmount = (basePerPiece - fixedPricePerUnit) * quantity;
      discountPercent = ((basePerPiece - fixedPricePerUnit) / basePerPiece) * 100;
    }
  }

  const tierLabel = tier.max_qty != null
    ? `${tier.min_qty}-${tier.max_qty} ks`
    : `${tier.min_qty}+ ks`;

  return { discountAmount, discountPercent, tierId: tier.id, tierLabel };
}
```

**Integrace do `calculateOrderQuote()`:**
- Po vypoctu `feesTotal` a pred markup
- Sleva se aplikuje na `modelSubtotal` (= baseTotal + feesTotal)
- Vysledek se prida do `modelResults[].volume_discount`
- Hodnota `discountsNegative` se aktualizuje

---

## C. IMPLEMENTACE

### C1. Agent assignments (kdo co dela)

| Agent | Ukol | Soubory | Priorita |
|-------|------|---------|----------|
| `mp-mid-pricing-engine` | Implementace applyVolumeDiscount(), zmena pipeline | `src/lib/pricing/pricingEngineV3.js` | P0 |
| `mp-mid-pricing-discounts` | Normalizace a validace tier dat | `src/utils/adminPricingStorage.js` | P0 |
| `mp-mid-frontend-admin` | VolumeDiscountsSection v AdminPricing | `src/pages/admin/AdminPricing.jsx` | P0 |
| `mp-spec-fe-forms` | Formularove komponenty (TierRow, inputs) | `src/pages/admin/AdminPricing.jsx` | P1 |
| `mp-spec-fe-tables` | Tabulka pasem s drag-and-drop | `src/pages/admin/AdminPricing.jsx` | P1 |
| `mp-mid-frontend-public` | Vizualni indikace slevy v kalkulacce | `src/pages/test-kalkulacka/components/PricingCalculator.jsx` | P1 |
| `mp-mid-frontend-widget` | Widget integrace volume discounts | `src/pages/widget/WidgetEmbed.jsx` | P2 |
| `mp-spec-test-build` | Unit testy pro applyVolumeDiscount | testy | P0 |
| `mp-sr-i18n` | Prekladove klice CZ/EN | `src/locales/` | P1 |

### C2. Implementacni kroky (poradi)

**Krok 1: Storage schema (paralelni s krokem 2)**
- Rozsirit `normalizeVolumeDiscounts()` v `adminPricingStorage.js`
- Pridat `volume_discounts` do `normalizePricingConfigV3()`
- Pridat default hodnoty do `getDefaultPricingConfigV3()`
- Zajistit zpetnou kompatibilitu (chybejici pole = disabled)

**Krok 2: Pricing engine (paralelni s krokem 1)**
- Implementovat `findTier()` a `applyVolumeDiscount()`
- Integrovat do `calculateOrderQuote()` pipeline za fees a pred markup
- Pridat `volume_discount` do vysledku pro kazdy model
- Aktualizovat `simple.discount` agregaci

**Krok 3: Admin UI (zavisi na kroku 1)**
- Pridat `VolumeDiscountsSection` do `AdminPricing.jsx`
- Toggle enabled/disabled
- Mode selector (percent / fixed_price)
- Scope selector (per_model / per_order)
- Tabulka pasem s add/remove/edit
- Validace: pasma se nesmi prekryvat, musi navazovat

**Krok 4: Kalkulacka UI (zavisi na kroku 2)**
- Aktualizovat `PricingCalculator.jsx` — zobrazit skutecnou slevu misto `0 Kc`
- Pridat zeleny badge u modelu se slevou
- Pridat hint o dalsim pasmu ("Objednejte 5+ pro 5% slevu")
- Pridat popover s tabulkou vsech pasem

**Krok 5: Widget integrace (zavisi na kroku 4)**
- Propagovat `volume_discounts` config pres postMessage
- Zobrazit slevy ve widgetu

**Krok 6: Testy a review**
- Unit testy pro `applyVolumeDiscount()` a `findTier()`
- Edge cases: 0 pasem, 1 pasmo, prekryvajici se pasma
- Build test

**Paralelizovatelnost:** Kroky 1+2 paralelne. Kroky 3+4 paralelne po 1+2.

### C3. Kriticke rozhodovaci body

1. **Kam v pipeline umistit slevu?**
   - Rozhodnuti: Za fees, pred markup — sleva se pocita z (base + fees)
   - Duvod: Markup je obchodni marze, ta by mela byt na jiz zlevnene cene

2. **Scope: per_model vs per_order?**
   - Rozhodnuti: Admin volba (default: per_model)
   - per_model = 10ks modelA + 2ks modelB → sleva jen na modelA
   - per_order = 12ks celkem → sleva na cele objednavky

3. **Mode: percent vs fixed_price?**
   - Rozhodnuti: Admin volba (default: percent)
   - Obe moznosti jsou validni pro ruzne use cases

4. **Jak resit prekryvy pasem?**
   - Rozhodnuti: Validace na urovni admin UI — zabranit ulozeni nevalidnich pasem
   - Engine pouzije prvni nalezene pasmo (bezpecnost)

### C4. Testovaci strategie

**Unit testy:**
- `findTier()` — prazdne tiers, 1 tier, N tiers, hranicni hodnoty, null max_qty
- `applyVolumeDiscount()` — oba mody (percent, fixed_price), oba scopy (per_model, per_order)
- `normalizeVolumeDiscounts()` — chybejici pole, nevalidni data, migrace

**Edge cases:**
- quantity = 0 (melo by byt 1)
- quantity = 999999 (velmi velke cislo)
- Vsechna pasma disabled
- Pasma s mezerami (napr. 1-4, 10-20 — co se deje s 5-9?)
- discount_percent = 100% (zadarmo)
- fixed_price_per_unit = 0 (zadarmo)
- fixed_price_per_unit > basePerPiece (zadna sleva)

**E2E testy:**
- Admin nastavi pasma → kalkulacka zobrazuje spravne slevy
- Zmena quantity v kalkulacce → sleva se dynamicky aktualizuje
- Widget zobrazuje slevy spravne

### C5. Migrace existujicich dat

**Zpetna kompatibilita:** Pole `volume_discounts` je optional v pricing:v3 schema.
Pokud chybi:
- `normalizeVolumeDiscounts()` vraci `{ enabled: false, mode: 'percent', scope: 'per_model', tiers: [] }`
- Engine se chova jako dosud (zadne slevy)

**Zadna destruktivni migrace neni potreba.**

---

## D. KVALITA

### D1. Security review body

- **Input validace:** Vsechny numericke vstupy (min_qty, max_qty, discount_percent) musi byt validovany
  - min_qty >= 1 (integer)
  - max_qty > min_qty nebo null
  - discount_percent: 0-100
  - fixed_price_per_unit >= 0
- **XSS:** Zadne user-provided HTML/stringy v slevovych pAsmech
- **Tenant isolation:** Data jsou scoped pod `modelpricer:${tenantId}:pricing:v3`
- **DoS prevence:** Max pocet pasem = 20 (UI limit)

### D2. Performance budget

- **Render time:** Pridani VolumeDiscountsSection do AdminPricing: < 16ms (1 frame)
- **Engine overhead:** `applyVolumeDiscount()` je O(n) pres tiers (max 20) — zanedbatelne
- **Bundle size:** Zadna nova zavislost — cista JS implementace, +~2KB minified
- **Memory:** Zanedbalny prirustek (pole max 20 tier objektu)

### D3. Accessibility pozadavky

- **WCAG 2.1 AA:** Vsechny formularove prvky musi mit labels
- **Keyboard nav:** Tabulka pasem navigovatelna pomoci Tab/Shift+Tab
- **Screen readers:** ARIA labels pro toggle, mode selector, tabulku
- **Color contrast:** Zeleny badge slevy musi splnovat 4.5:1 kontrast
- **Focus management:** Po pridani/smazani pasma fokus na relevantni prvek

### D4. Error handling a edge cases

| Chybovy stav | Reseni | Fallback |
|-------------|--------|----------|
| volume_discounts chybi v storage | Pouzij default (disabled) | Zadne slevy |
| tiers je prazdne pole | Zadna sleva i kdyz enabled=true | 0 Kc sleva |
| quantity neodpovida zadnemu pasmu | Zadna sleva | 0 Kc sleva |
| discount_percent < 0 | Clamp na 0 | 0% |
| discount_percent > 100 | Clamp na 100 | 100% |
| Pasma se prekryvaji | Validace v admin UI | Engine: prvni match |
| NaN/undefined v tier hodnotach | safeNum() fallback | 0 |

### D5. i18n pozadavky

**Nove CZ/EN klice:**
```json
{
  "admin.pricing.volume_discounts": "Mnozstevni slevy / Volume Discounts",
  "admin.pricing.volume_discounts.enabled": "Aktivovat mnozstevni slevy / Enable volume discounts",
  "admin.pricing.volume_discounts.mode": "Typ slevy / Discount type",
  "admin.pricing.volume_discounts.mode.percent": "Procentualni sleva / Percentage discount",
  "admin.pricing.volume_discounts.mode.fixed_price": "Fixni cena za kus / Fixed price per unit",
  "admin.pricing.volume_discounts.scope": "Rozsah / Scope",
  "admin.pricing.volume_discounts.scope.per_model": "Za model / Per model",
  "admin.pricing.volume_discounts.scope.per_order": "Za objednavku / Per order",
  "admin.pricing.volume_discounts.tier.min_qty": "Od (kusu) / From (pcs)",
  "admin.pricing.volume_discounts.tier.max_qty": "Do (kusu) / To (pcs)",
  "admin.pricing.volume_discounts.tier.discount": "Sleva (%) / Discount (%)",
  "admin.pricing.volume_discounts.tier.price": "Cena za kus / Price per unit",
  "admin.pricing.volume_discounts.add_tier": "Pridat pasmo / Add tier",
  "admin.pricing.volume_discounts.no_tiers": "Zadna pasma / No tiers defined",
  "calculator.discount.badge": "Sleva -{{percent}}% / Discount -{{percent}}%",
  "calculator.discount.hint": "Objednejte {{qty}}+ kusu a zyskejte {{percent}}% slevu! / Order {{qty}}+ pieces and get {{percent}}% off!",
  "calculator.discount.tiers_title": "Mnozstevni slevy / Volume discounts"
}
```

**Formatovani cisel:** Pouzit `Intl.NumberFormat('cs-CZ')` pro CZ a `Intl.NumberFormat('en-US')` pro EN.
Pouzit `useLanguage()` hook z `LanguageContext`.

---

## E. ROLLOUT

### E1. Feature flagy a postupne nasazeni

- **Feature flag:** `volume_discounts.enabled` v pricing config (admin toggle)
- **Default:** Disabled — admin musi explicitne zapnout a nakonfigurovat pasma
- **Rollout postup:**
  1. Merge kodu s disabled feature
  2. Interni testovani na demo tenantu
  3. Dokumentace pro adminy
  4. Aktivace na produkci

### E2. Admin UI zmeny

- **AdminPricing.jsx** — nova sekce "Mnozstevni slevy" pod stavajicim nastavenim cenotvorby
- **Umisteni:** Pod sekcemi Material, Casova sazba, Rounding, Markup — na konci stranky
- **Vizualni oddeleni:** Card s vlastnim header, collapsible
- **Preview:** Tabulka s prikladem vypoctu pro ruzna mnozstvi (1, 5, 10, 25, 50 ks)

### E3. Widget zmeny

- Widget dostane `volume_discounts` v pricing config pres postMessage
- Zobrazeni slevy v cenove sumarizaci
- Badge u modelu se slevou
- Hint o dalsim pasmu vedle quantity inputu

### E4. Dokumentace pro uzivatele

- Admin guide: "Jak nastavit mnozstevni slevy"
- Tooltip v admin UI vysvetlujici rozdil percent vs fixed_price
- Tooltip vysvetlujici scope per_model vs per_order
- Help ikona u kazdeho pasma

### E5. Metriky uspechu (KPI)

| Metrika | Cil | Mereni |
|---------|-----|--------|
| Prumerna velikost objednavky (kusy) | +20% | Analytics (orders:v1) |
| Pouziti mnozstevnich slev | >30% objednavek | Flags v order datech |
| Admin adoption | >50% tenantu zapne slevy | Storage analytics |
| Cas konfigurace | <5 minut | UX testing |
| Bug reports (pricing errors) | 0 P0 bugu | Issue tracker |
