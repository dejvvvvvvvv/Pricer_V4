# Test-Kalkulacka -- Dokumentace

> 5-krokovy wizard pro 3D tisk cenovou kalkulaci se slicerem a checkoutem.
> Hlavni kalkulacka aplikace -- 1049 radku v orchestratoru, 14 subkomponent,
> 1 custom hook, 1 Zod schema, integrace s PrusaSlicer backendem a pricing engine V3.

---

## 1. Prehled

Test-kalkulacka (`/test-kalkulacka`) je hlavni produkcni kalkulacka pro zakazniky 3D tiskovych firem.
Umoznuje nahrani 3D modelu, konfiguraci parametru tisku, automaticky vypocet ceny
pres PrusaSlicer backend a odeslani objednavky.

### 5-step wizard flow

| Krok | ID | Nazev | Ikona | Popis |
|------|-----|-------|-------|-------|
| 1 | upload | Nahrani souboru | Upload | Drag&drop nebo vyber STL/OBJ/3MF souboru |
| 2 | config | Konfigurace | Settings | Material, barva, kvalita, vyplne, podpery, mnozstvi |
| 3 | pricing | Kontrola a cena | Calculator | Cenovy souhrn, per-model breakdown, developer view |
| 4 | checkout | Objednavka | ShoppingCart | Kontaktni udaje, dodaci adresa, GDPR |
| 5 | confirm | Potvrzeni | CheckCircle | Cislo objednavky, souhrn, nova objednavka |

### Klicove vlastnosti

- **Multi-model podpora** -- vice souboru najednou, batch slicing, per-model konfigurace
- **Auto-recalc** -- zmena konfigurace automaticky triggeruje re-slice po debounce (500ms default, 800ms slider)
- **Per-model presets** -- kazdy model muze mit vlastni slicer preset (Bug 2 fix)
- **Preset fallback** -- pokud preset selze, automaticky retry bez presetu (Bug 3 fix)
- **Progressive pricing** -- cena se zobrazuje prubezne i kdyz nejsou vsechny modely hotove
- **Surface area computation** -- browser-side vypocet povrchu pro per_cm2 fees (STL only, s guardrails)
- **Classified error messages** -- 12 kategorii slicer erroru s user-friendly CZ hlasky
- **Developer view** -- prepinac Zakaznicky/Developer s detailnim fee breakdown vcetne condition evaluation
- **Checkout flow** -- react-hook-form + zod validace, ulozeni do localStorage + backend storage
- **Cross-tab sync** -- localStorage storage event listener pro live reload admin config zmen

### URL a routing

- **Route:** `/test-kalkulacka`
- **Definovano v:** `src/Routes.jsx:8` (prime import, ne lazy)
- **Navigace:** breadcrumb Dashboard > Nahrani modelu

---

## 2. Technologie a jazyk

| Polozka | Hodnota |
|---------|---------|
| Framework | React 19 |
| Bundler | Vite |
| Jazyk | JavaScript + JSX |
| Styling | Forge design tokeny (CSS vars) + Tailwind utility classes + inline styles |
| 3D Rendering | @react-three/fiber + @react-three/drei + three.js (STLLoader) |
| Formulare | react-hook-form + @hookform/resolvers |
| Validace | zod |
| Drag & Drop | react-dropzone |
| Routing | React Router v6 (`/test-kalkulacka`) |
| i18n | `useLanguage()` hook z `LanguageContext.jsx` |
| Pricing | pricingEngineV3 (`calculateOrderQuote`) |
| Backend | PrusaSlicer pres `slicerApi.sliceModelLocal()` |
| Ikony | lucide-react pres AppIcon (Upload, Settings, Calculator, ShoppingCart, CheckCircle, ChevronRight, Loader, Clock, CheckCircle, XCircle, Plus, ChevronLeft, a dalsi) |

---

## 3. Architektura souboru

```
src/pages/test-kalkulacka/
  index.jsx                           -- Hlavni orchestrator (1049 r.), 5-step wizard, state management
  hooks/
    useDebouncedRecalculation.js      -- Custom hook pro debounced auto-recalc (40 r.)
  schemas/
    checkoutSchema.js                 -- Zod schema pro checkout formular (65 r.)
  components/
    FileUploadZone.jsx                -- Drag&drop upload zona (330 r.)
    ModelViewer.jsx                   -- 3D STL nahled + metriky + fullscreen (659 r.)
    PrintConfiguration.jsx            -- Material, barva, kvalita, infill, fees (1010 r.)
    PricingCalculator.jsx             -- Cenovy souhrn a breakdown (626 r.)
    GenerateButton.jsx                -- Animovane CTA tlacitko pro slicing (58 r.)
    GenerateButton.module.css         -- CSS Modules styly pro GenerateButton (103 r.)
    ErrorBoundary.jsx                 -- React class error boundary (106 r.)
    CheckoutForm.jsx                  -- Checkout formular s react-hook-form (595 r.)
    OrderConfirmation.jsx             -- Potvrzeni objednavky (266 r.)
    ShippingSelector.jsx              -- Vyber zpusobu doruceni (148 r.)
    ExpressTierSelector.jsx           -- Vyber rychlosti doruceni (99 r.)
    CouponInput.jsx                   -- Vstup pro slevovy kupon (153 r.)
    PostProcessingSelector.jsx        -- Vyber post-processing sluzeb (99 r.)
    PromoBar.jsx                      -- Promoacni banner (55 r.)
    UpsellPanel.jsx                   -- Upsell panel pro upgrade doruceni (69 r.)
```

### Celkovy pocet radku: ~5313 radku (16 souboru + 1 hook + 1 schema)

---

## 4. Import graf

### Orchestrator (index.jsx) -- prime importy

```
index.jsx
  +-- React (useState, useEffect, useRef, useCallback)
  +-- react-router-dom (useNavigate)
  +-- components/AppIcon
  +-- components/ui/Button
  +-- ./components/FileUploadZone
  +-- ./components/ModelViewer
  +-- ./components/PrintConfiguration
  +-- ./components/PricingCalculator
  +-- ./components/GenerateButton
  +-- ./components/ErrorBoundary
  +-- ./components/CheckoutForm
  +-- ./components/OrderConfirmation
  +-- services/slicerApi (sliceModelLocal)
  +-- services/presetsApi (fetchWidgetPresets)
  +-- utils/adminPricingStorage (loadPricingConfigV3)
  +-- utils/adminFeesStorage (loadFeesConfigV3)
  +-- utils/adminExpressStorage (loadExpressConfigV1)
  +-- utils/adminShippingStorage (loadShippingConfigV1)
  +-- utils/adminCouponsStorage (loadCouponsConfigV1)
  +-- utils/slicerErrorClassifier (parseSlicerError)
  +-- ./hooks/useDebouncedRecalculation
```

### Subkomponent importy (kriticke zavislosti)

```
PrintConfiguration
  +-- components/ui/Input
  +-- components/ui/Select
  +-- components/ui/Checkbox
  +-- components/ui/forge/ForgeCheckbox
  +-- contexts/LanguageContext (useLanguage)

PricingCalculator
  +-- components/ui/Button (named: { Button })
  +-- components/ui/Card (named: { Card, CardContent, CardHeader, CardTitle })
  +-- components/ui/Icon (default)
  +-- lib/pricing/pricingEngineV3 (calculateOrderQuote)

CheckoutForm
  +-- react-hook-form (useForm)
  +-- @hookform/resolvers/zod (zodResolver)
  +-- ../schemas/checkoutSchema (getCheckoutSchema)
  +-- lib/pricing/pricingEngineV3 (calculateOrderQuote)
  +-- utils/adminOrdersStorage (loadOrders, saveOrders, nowIso)
  +-- services/storageApi (saveOrderFiles)
  +-- contexts/LanguageContext (useLanguage)

ModelViewer
  +-- @react-three/fiber (Canvas, useLoader)
  +-- @react-three/drei (OrbitControls, Center)
  +-- three/examples/jsm/loaders/STLLoader
  +-- three (THREE)
  +-- ./ErrorBoundary
```

### DULEZITE: Nesrovnalost importu

PricingCalculator importuje `Button` jako named export (`{ Button }`) a `Icon` z `components/ui/Icon`,
zatimco ostatni subkomponenty importuji `Button` jako default z `components/ui/Button` a `Icon`
z `components/AppIcon`. Toto je potencialni zdroj problemu pokud by se exporty zmenily.

---

## 5. Design a vizual (Forge compliance)

### Pouzite Forge tokeny

| Kategorie | Tokeny |
|-----------|--------|
| Pozadi | `--forge-bg-void`, `--forge-bg-surface`, `--forge-bg-elevated` |
| Text | `--forge-text-primary`, `--forge-text-secondary`, `--forge-text-muted` |
| Bordery | `--forge-border-default`, `--forge-border-active` |
| Akcent | `--forge-accent-primary`, `--forge-accent-secondary` |
| Statusy | `--forge-success`, `--forge-error`, `--forge-warning` |
| Fonty | `--forge-font-heading`, `--forge-font-body`, `--forge-font-mono`, `--forge-font-tech` |
| Radius | `--forge-radius-sm`, `--forge-radius-md`, `--forge-radius-lg`, `--forge-radius-xl` |
| Animace | `--forge-ease-out-expo` |

### Styling pristup

- **Hlavni kontejner:** inline styles s Forge CSS vars (`backgroundColor: 'var(--forge-bg-void)'`)
- **Subkomponenty:** dedicke `fg` / `forgeStyles` objekty definovane na zacatku souboru
- **Tailwind:** pouzivan minimalne (hlavne pro layout: `grid`, `flex`, `gap`, `mx-auto`, `px-6`)
- **CSS Modules:** pouze GenerateButton (`.module.css`)
- **Inline `<style>`:** slider CSS (`::-webkit-slider-thumb`, `::-moz-range-thumb`) v PrintConfiguration,
  keyframe animace v OrderConfirmation

### Typograficke pravidlo

- `--forge-font-heading` pro nadpisy sekci (text-lg a vice), uppercase s letter-spacing 0.08em
- `--forge-font-body` pro body text, popisy, label text
- `--forge-font-mono` pro ceny, kody, metriky, technicky text
- `--forge-font-tech` pro 12px labels, uppercase, small badges (v ErrorBoundary reset button)

### 3D model vizualizace

- Material: `meshStandardMaterial` s barvou `#00D4AA` (forge accent primary)
- Svetla: ambient (0.8) + directional (0.8)
- Ovladani: OrbitControls s autoRotate (0.5 speed), vypnuty pan
- Pozadi: `--forge-bg-void`
- Fullscreen: modal s blur overlay, vetsi svetla (1.5 ambient, 2.0 directional), rychlejsi rotace (1.0)

---

## 6. Datovy model

### 6.1 Model state (uploadedFiles array)

Kazdy soubor v `uploadedFiles` ma nasledujici tvar:

```javascript
{
  id: Number,                          // Date.now() + Math.random()
  name: String,                        // nazev souboru (napr. "model.stl")
  size: Number,                        // velikost v bajtech
  type: String,                        // MIME typ
  file: File,                          // puvodni File objekt (pro slicing)
  uploadedAt: Date,                    // cas nahrani
  status: 'pending' | 'processing' | 'completed' | 'failed',
  result: Object | null,               // vysledek slicingu (metrics, modelInfo, pricing, ...)
  error: String | null,                // user-friendly chybova hlaska
  errorCategory: String | null,        // kategorie z slicerErrorClassifier
  errorSeverity: 'error' | 'warning' | null,
  errorRaw: String | null,             // raw error string pro debugging
  clientModelInfo: {                   // browser-side computed data
    surfaceMm2: Number,
    surfaceCm2: Number,
  } | undefined,
  clientModelInfoMeta: {               // metadata o vypoctu
    surface: { reason, vertexCount, triangleCount, ms }
  } | undefined,
}
```

### 6.2 Print config (printConfigs objekt)

Klicem je `file.id`, hodnota je konfiguracni objekt:

```javascript
{
  material: 'pla',       // klic materialu z AdminPricing
  color: null | String,  // ID barvy (z AdminPricing material.colors[] nebo fallback palety)
  quality: 'standard',   // 'nozzle_08' | 'nozzle_06' | 'nozzle_04' | 'draft' | 'standard' | 'fine' | 'ultra'
  infill: 20,            // 10-100, krok po 5
  quantity: 1,           // 1-100
  supports: false,       // boolean
}
```

### 6.3 Fee selections

```javascript
{
  selectedFeeIds: Set<String>,     // Set of fee IDs zvoleny zakaznikem
  feeTargetsById: {                // per-fee cileni na modely
    [feeId]: {
      mode: 'SELECTED',           // nebo undefined = ALL
      modelIds: Array<Number>,    // ID modelu na ktere se fee aplikuje
      uiMode: 'ALL' | 'THIS' | 'SELECTED'  // UI-only, pro zobrazeni radio buttonu
    }
  }
}
```

### 6.4 Slicer result (file.result)

```javascript
{
  ok: Boolean,
  metrics: {
    estimatedTimeSeconds: Number,
    filamentGrams: Number,
    layers: Number,
  },
  modelInfo: {
    sizeMm: { x, y, z },          // rozmery v mm
    volumeMm3: Number,             // objem v mm3
    surfaceMm2: Number,            // povrch (patchovany z clientModelInfo)
    surfaceCm2: Number,
  },
  pricing: {                       // optional, z backendu
    breakdown: Array<{ label, amount }>,
  },
  usedPreset: String | null,       // ID pouziteho presetu
  warnings: Array | null,          // varovani ze sliceru
  jobId: String | null,            // ID slicovaci ulohy
}
```

### 6.5 Admin konfigurace (nacteno z localStorage)

| Konfigurace | Loader | Namespace |
|-------------|--------|-----------|
| pricingConfig | `loadPricingConfigV3()` | `modelpricer:${tenantId}:pricing:v3` |
| feesConfig | `loadFeesConfigV3()` | `modelpricer:${tenantId}:fees:v3` |
| expressConfig | `loadExpressConfigV1()` | `modelpricer:${tenantId}:express:v1` |
| shippingConfig | `loadShippingConfigV1()` | `modelpricer:${tenantId}:shipping:v1` |
| couponsConfig | `loadCouponsConfigV1()` | `modelpricer:${tenantId}:coupons:v1` |

### 6.6 Pricing Engine V3 pipeline

```
base (material cost + time cost)
  -> MODEL fees (flat, percent, per_gram, per_minute, per_cm3, per_cm2, per_piece)
  -> percent fees
  -> per-model minimum
  -> per-model rounding
  -> EXPRESS surcharge (S09)
  -> COUPON discount (S10)
  -> volume discounts (S05)
  -> ORDER fees
  -> markup
  -> order minimum
  -> final rounding
  -> SHIPPING (S04)
```

### 6.7 Order objekt (z CheckoutForm)

```javascript
{
  id: 'ORD-YYYYMMDDHHmm-XXXX',
  tenant_id: 'demo-tenant',
  created_at: ISO string,
  status: 'NEW',
  customer_snapshot: { name, email, phone, company, note, gdpr_consent, gdpr_consent_at },
  shipping_address: { street, city, zip, country },
  models: Array<{
    id: 'M-N',
    file_snapshot: { filename, size, uploaded_at },
    quantity, material_snapshot, config_snapshot, slicer_snapshot, price_breakdown_snapshot
  }>,
  totals_snapshot: { total, currency, simple },
  flags: [],
  notes: Array,
  activity: Array<{ timestamp, user_id, type, payload }>,
  storage: { orderFolderId, storagePath, savedAt, fileManifest, status }
}
```

---

## 7. Sekce vynechana (cislovani zachovano dle zadane struktury)

---

## 8. UI komponenty -- detailni popis

### 8.1 FileUploadZone

**Soubor:** `src/pages/test-kalkulacka/components/FileUploadZone.jsx` (330 r.)
**Export:** default `FileUploadZone`

**Props:**

| Prop | Typ | Povinny | Popis |
|------|-----|---------|-------|
| onFilesUploaded | Function | ano | Callback s nahranym souborem `{ id, name, size, type, file, uploadedAt }` |
| uploadedFiles | Array | ne | Pole jiz nahranych souboru (pro seznam) |
| onRemoveFile | Function | ne | Callback pro odstraneni souboru |

**Funkcionalita:**
- Pouziva `react-dropzone` pro drag&drop
- Accept: `.stl`, `.obj` (MIME typy `application/octet-stream`, `model/stl`, `model/obj`)
- Max velikost: 50 MB
- Multiple: ano
- Simulovany upload progress (inkrementace po 10% kazdych 200ms)
- Po dokonceni "uploadu" vola `onFilesUploaded` pres `setTimeout(0)` (avoid React warning)

**State:**
- `uploadProgress` -- objekt `{ [fileId]: number }` pro zobrazeni progress baru

**Vizual:**
- Centralni upload zona s dashed borderem
- Ikona Upload v kruhu
- Badge `.STL` a `.OBJ`
- Progress bar s procenty
- Seznam nahranych souboru s ikonami a velikostmi
- Info box "Podporovane formaty"

**Poznamka:** Dropzone accept objekt NEOBSAHUJE `.3mf` format, ackoliv hidden file input
v orchestratoru (index.jsx:654) `.3mf` akceptuje. Toto je nesrovnalost.

### 8.2 ModelViewer

**Soubor:** `src/pages/test-kalkulacka/components/ModelViewer.jsx` (659 r.)
**Export:** default `ModelViewer`

**Props:**

| Prop | Typ | Povinny | Popis |
|------|-----|---------|-------|
| selectedFile | Object | ne | Aktualne vybrany model z uploadedFiles |
| onRemove | Function | ne | Callback pro smazani modelu |
| onSurfaceComputed | Function | ne | Callback `(fileId, { surfaceMm2, surfaceCm2, meta })` |

**Funkcionalita:**
- **3D nahled:** STL modely do 12 MB zobrazeny v Three.js Canvas s OrbitControls
- **Surface area:** Browser-side vypocet povrchu (mm2/cm2) pro STL modely
  - Guardrails: max 2M vertices, max 1M trojuhelniku, max 140ms time budget
  - Pouziva `requestIdleCallback` pro non-blocking computation
  - Vysledek se patchuje do slicer result (pro per_cm2 fees v pricing engine)
- **Fullscreen:** Modal s blur backdrop, vetsi camera distance (75), autoRotate 1.0
- **Metriky:** Rozmery (mm), objem (cm3), povrch (cm2), cas tisku, hmotnost materialu
- **Error state:** Zobrazeni chybove hlasky pokud slicing selhal

**Interni komponenty:**
- `STLModel` -- Three.js mesh s STLLoader, surface computation
- `STLCanvas` -- Canvas wrapper s URL.createObjectURL management a wheel scroll prevention
- `FullScreenModel` -- Zjednoduseny model pro fullscreen
- `FullScreenViewer` -- Modal overlay s Canvas

**State:**
- `fileUrl` -- Object URL pro fullscreen viewer
- `isFullScreen` -- boolean

**Safety thresholds:**
- `MAX_PREVIEW_MB = 12` -- soubory vetsi nez 12 MB se nezobrazuji v 3D
- `MAX_SURFACE_VERTICES = 2_000_000`
- `MAX_SURFACE_TRIANGLES = 1_000_000`
- `MAX_SURFACE_TIME_MS = 140`

### 8.3 PrintConfiguration

**Soubor:** `src/pages/test-kalkulacka/components/PrintConfiguration.jsx` (1010 r.)
**Export:** default `PrintConfiguration`

**Props:**

| Prop | Typ | Povinny | Popis |
|------|-----|---------|-------|
| onConfigChange | Function | ano | Callback pri zmene konfigurace |
| selectedFile | Object | ano | Vybrany model |
| initialConfig | Object | ne | Pocatecni konfigurace |
| pricingConfig | Object | ne | Admin pricing V3 konfigurace |
| feesConfig | Object | ne | Admin fees V3 konfigurace |
| feeSelections | Object | ne | Aktualni vyber fees |
| onFeeSelectionsChange | Function | ne | Callback pro zmenu fee selections |
| uploadedFiles | Array | ne | Vsechny nahrane modely (pro fee targeting) |
| disabled | Boolean | ne | Zamkne vsechny vstupy |
| availablePresets | Array | ne | Slicer presety z backendu |
| defaultPresetId | String | ne | Default preset ID |
| selectedPresetId | String | ne | Vybrany preset pro aktualni model |
| onPresetChange | Function | ne | Callback pri zmene presetu |
| presetsLoading | Boolean | ne | Loading state pro presety |
| presetsError | Error | ne | Chyba nacitani presetu |
| onPresetsRetry | Function | ne | Retry callback pro presety |

**Hlavni sekce UI:**

1. **Slicer preset selector** -- dropdown s presety z backendu, error/retry banner, loading state
2. **Rychle predvolby** -- 3 preset buttony (Basic/Middle/Pro) s ruznou kvalitou a infill
3. **Material a barva** -- Select pro material (z AdminPricing), 4x2 grid barvy (z materialu nebo fallback paleta)
4. **Kvalita tisku** -- Select pro kvalitu (7 urovni od 0.8mm do 0.1mm), slider pro infill (10-100%), checkbox podpery
5. **Mnozstvi** -- number input 1-100
6. **Dodatecne sluzby** -- selectable fees z AdminFees s targeting (All/This/Selected models)
7. **Vysledky slicingu** -- metriky (cas, hmotnost, vrstvy, teplota), cenovy breakdown

**State:**
- `config` -- lokalni print config objekt

**Klicove useEffect:**
- Sync `initialConfig` prop -> lokalni state
- Validace materialu a barvy proti AdminPricing (pri zmene konfigurace)
- Dynamic materials z `pricingConfig.materials[]`
- Dynamic colors z `selectedMaterial.colors[]` nebo fallback paleta

**Fee targeting system:**
- Kazda fee muze byt aplikovana na: ALL modely, THIS (aktualni) model, nebo SELECTED modely
- UI: radio buttony + checkbox list modelu pro SELECTED mode
- Target data se ukladaji do `feeTargetsById` a predavaji do pricing engine

### 8.4 PricingCalculator

**Soubor:** `src/pages/test-kalkulacka/components/PricingCalculator.jsx` (626 r.)
**Export:** default function `PricingCalculator`

**Props:**

| Prop | Typ | Povinny | Popis |
|------|-----|---------|-------|
| selectedFile | Object | ne | Vybrany model |
| onSlice | Function | ne | Callback pro slicing vybraneho modelu |
| totalModels | Number | ne | Celkovy pocet modelu |
| onSliceAll | Function | ne | Callback pro batch slicing |
| sliceAllLoading | Boolean | ne | Batch slicing loading state |
| uploadedFiles | Array | ne | Vsechny modely |
| printConfigs | Object | ne | Print config per model |
| pricingConfig | Object | ne | Admin pricing V3 |
| feesConfig | Object | ne | Admin fees V3 |
| feeSelections | Object | ne | Fee selections |
| expressConfig | Object | ne | Express pricing config |
| selectedExpressTierId | String | ne | Vybrany express tier |
| shippingConfig | Object | ne | Shipping config |
| selectedShippingMethodId | String | ne | Vybrany shipping method |
| couponsConfig | Object | ne | Coupons config |
| appliedCouponCode | String | ne | Aplikovany kupon |

**Funkcionalita:**
- Vola `calculateOrderQuote()` z pricing engine V3
- Zobrazuje `quote.total` s CZK formatovanim
- **Zakaznicky view:** jednoduchy breakdown (material, cas, sluzby, sleva, markup, celkem), per-model karty s fees
- **Developer view:** surovy order totals, model breakdown s base vypoctem (filamentGrams, billedMinutes, materialCost, timeCost), fee evaluation detail (MATCH/NO MATCH, conditions, targetOk)
- **Volume discount box:** zvyrazneny pri aplikaci mnozstevni slevy
- **Progressive pricing:** zobrazuje prubeznou cenu i pri nedokoncenem slicingu

**State:**
- `showDeveloper` -- boolean prepinac zakaznicky/developer view

**Dulezite:** Importuje `{ Button }` (named) a `Icon` z `components/ui/Icon` -- odlisne od ostatnich komponent.

### 8.5 GenerateButton

**Soubor:** `src/pages/test-kalkulacka/components/GenerateButton.jsx` (58 r.)
**Styly:** `GenerateButton.module.css` (103 r.)
**Export:** default `GenerateButton`

**Props:**

| Prop | Typ | Default | Popis |
|------|-----|---------|-------|
| label | String | 'Spocitat cenu' | Text tlacitka |
| loading | Boolean | false | Loading state (zobrazuje 'Pocitam...') |
| disabled | Boolean | false | Disabled state |
| onClick | Function | -- | Click handler |
| size | String | 'default' | 'default' / 'top' / 'compact' |

**Vizual:**
- Uiverse.io inspirovany design (od AlimurtuzaCodes)
- SVG sparkle ikona
- 3 velikosti: default (13em), top (10.4em, -20%), compact (8.5em, -35%)
- Hover: gradient zelena (#00D4AA -> #00B894), glow shadow, translateY(-2px)
- Disabled: opacity 0.6, zadny hover efekt
- `aria-busy` pro loading state

### 8.6 ErrorBoundary

**Soubor:** `src/pages/test-kalkulacka/components/ErrorBoundary.jsx` (106 r.)
**Export:** default class `ErrorBoundary`

**Props:**

| Prop | Typ | Popis |
|------|-----|-------|
| children | ReactNode | Child komponenty |
| onReset | Function | Optional callback pri resetu |

**Funkcionalita:**
- React class component (componentDidCatch, getDerivedStateFromError)
- Zachyti pad 3D previewu / mesh parsovani
- Zobrazuje error message s "Zkusit znovu" tlacitkem
- Console.error pro debugging

**Pouziti:** Obaluje ModelViewer a STLCanvas pro prevenci white-screen.

### 8.7 CheckoutForm

**Soubor:** `src/pages/test-kalkulacka/components/CheckoutForm.jsx` (595 r.)
**Export:** default function `CheckoutForm`

**Props:**

| Prop | Typ | Povinny | Popis |
|------|-----|---------|-------|
| uploadedFiles | Array | ano | Vsechny modely |
| printConfigs | Object | ano | Print config per model |
| pricingConfig | Object | ano | Admin pricing V3 |
| feesConfig | Object | ano | Admin fees V3 |
| feeSelections | Object | ano | Fee selections |
| expressConfig | Object | ne | Express config |
| selectedExpressTierId | String | ne | Express tier |
| shippingConfig | Object | ne | Shipping config |
| selectedShippingMethodId | String | ne | Shipping method |
| couponsConfig | Object | ne | Coupons config |
| appliedCouponCode | String | ne | Coupon code |
| onComplete | Function | ano | Callback s order objektem |
| onBack | Function | ano | Navigace zpet na krok 3 |

**Formulare (react-hook-form + zod):**

| Pole | Typ | Povinne | Validace |
|------|-----|---------|----------|
| name | text | ano | min 2, max 100 |
| email | email | ano | email format |
| phone | tel | ne | max 20 |
| company | text | ne | max 100 |
| street | text | ano | min 2, max 200 |
| city | text | ano | min 1, max 100 |
| zip | text | ano | min 3, max 10 |
| country | text | ano | min 1, max 100 |
| note | textarea | ne | max 1000 |
| gdprConsent | checkbox | ano | musi byt true |

**Submit flow:**
1. Vygeneruje cislo objednavky (`ORD-YYYYMMDDHHmm-XXXX`)
2. Vytvori order objekt s customer, shipping, models, totals snapshoty
3. Ulozi do localStorage pres `saveOrders()`
4. Pokusy se ulozit soubory na backend pres `saveOrderFiles()` (fire-and-forget)
5. Aktualizuje order se storage info
6. Vola `onComplete(order)`

**State:**
- `savingFiles` -- boolean pro loading state behem file upload

**POZNAMKA:** `tenant_id` je hardcoded jako `'demo-tenant'` (radek 245). Toto porusi pravidlo
tenant-scoped storage z CLAUDE.md sekce 7 -- melo by pouzivat `getTenantId()`.

### 8.8 OrderConfirmation

**Soubor:** `src/pages/test-kalkulacka/components/OrderConfirmation.jsx` (266 r.)
**Export:** default function `OrderConfirmation`

**Props:**

| Prop | Typ | Popis |
|------|-----|-------|
| order | Object | Order objekt z CheckoutForm |
| onStartNew | Function | Callback pro novou objednavku (resetuje wizard) |

**Funkcionalita:**
- Zobrazuje animovany checkmark s pulse efektem (CSS keyframe `forgeCheckPulse`)
- Cislo objednavky v mono fontu
- Seznam modelu s materialem
- Celkova cena
- Kontaktni udaje zakaznika
- Tlacitko "Nova objednavka"

### 8.9 ShippingSelector

**Soubor:** `src/pages/test-kalkulacka/components/ShippingSelector.jsx` (148 r.)
**Export:** default function `ShippingSelector`

**Props:** `{ methods, selectedMethodId, onSelectMethod, orderTotal, freeShippingThreshold, freeShippingEnabled, disabled }`

**Funkcionalita:**
- Zobrazuje aktivni shipping metody serazene dle `sort_order`
- Radio-button styl vyber
- Progress bar pro free shipping threshold
- PICKUP typ je vzdy zdarma
- Texty v anglictine (chybi i18n)

**Poznamka:** Tato komponenta NENI aktualne pouzivana v orchestratoru. Shipping state existuje v index.jsx
(`selectedShippingMethodId`), ale ShippingSelector neni importovana ani renderovana.

### 8.10 ExpressTierSelector

**Soubor:** `src/pages/test-kalkulacka/components/ExpressTierSelector.jsx` (99 r.)
**Export:** default function `ExpressTierSelector`

**Props:** `{ tiers, selectedTierId, onSelectTier, disabled }`

**Funkcionalita:**
- Zobrazuje express delivery tiers (serazene dle sort_order)
- Radio-button styl vyber
- Prirazka zobrazena jako procento nebo fixni castka
- Texty v anglictine (chybi i18n)

**Poznamka:** NENI aktualne pouzivana v orchestratoru. Express state existuje v index.jsx
(`selectedExpressTierId`), ale ExpressTierSelector neni importovana ani renderovana.

### 8.11 CouponInput

**Soubor:** `src/pages/test-kalkulacka/components/CouponInput.jsx` (153 r.)
**Export:** default function `CouponInput`

**Props:** `{ onApply, onRemove, appliedCoupon, validationError, disabled }`

**Funkcionalita:**
- Text input pro kuponovy kod (auto uppercase)
- Apply button s disabled state
- Zobrazeni aplikovaneho kuponu (percent/fixed/free shipping)
- Remove (X) tlacitko
- Enter key submit
- Texty v anglictine (chybi i18n)

**Poznamka:** NENI aktualne pouzivana v orchestratoru. Coupon state existuje v index.jsx
(`appliedCouponCode`), ale CouponInput neni importovana ani renderovana.

### 8.12 PostProcessingSelector

**Soubor:** `src/pages/test-kalkulacka/components/PostProcessingSelector.jsx` (99 r.)
**Export:** default function `PostProcessingSelector`

**Props:** `{ fees, selectedFeeIds, onToggleFee }`

**Funkcionalita:**
- Zobrazuje fees s kategorii `POST_PROCESSING` (active + selectable)
- Checkbox styl vyber (grid layout)
- Popis, processing days, cena
- Optional image URL

**Poznamka:** NENI aktualne pouzivana v orchestratoru.

### 8.13 PromoBar

**Soubor:** `src/pages/test-kalkulacka/components/PromoBar.jsx` (55 r.)
**Export:** default function `PromoBar`

**Props:** `{ promotion, onApply }`

**Funkcionalita:**
- Promoacni banner s textem a optional "Apply" tlacitkem
- Zobrazuje se pokud `promotion.banner_text` existuje

**Poznamka:** NENI aktualne pouzivana v orchestratoru.

### 8.14 UpsellPanel

**Soubor:** `src/pages/test-kalkulacka/components/UpsellPanel.jsx` (69 r.)
**Export:** default function `UpsellPanel`

**Props:** `{ currentTierId, tiers, onSelectTier, upsellMessage }`

**Funkcionalita:**
- Upsell nabidka na rychlejsi doruceni
- Zobrazuje se pokud je vybrany nejlevnejsi tier a existuje lepsi

**Poznamka:** NENI aktualne pouzivana v orchestratoru.

### 8.15 useDebouncedRecalculation (hook)

**Soubor:** `src/pages/test-kalkulacka/hooks/useDebouncedRecalculation.js` (40 r.)
**Export:** default function `useDebouncedRecalculation`

**API:**

```javascript
const { trigger, triggerSlider, cancel } = useDebouncedRecalculation(onRecalc, opts);
```

| Parametr | Default | Popis |
|----------|---------|-------|
| onRecalc | -- | Callback `(fileId) => void` |
| opts.defaultDelay | 500 | Debounce pro select/checkbox zmeny (ms) |
| opts.sliderDelay | 800 | Delsi debounce pro slider zmeny (ms) |

**Vracene metody:**
- `trigger(fileId, { delay? })` -- triggeruje recalc s defaultDelay
- `triggerSlider(fileId)` -- triggeruje recalc s sliderDelay
- `cancel()` -- zrusi pending timer

### 8.16 checkoutSchema (Zod)

**Soubor:** `src/pages/test-kalkulacka/schemas/checkoutSchema.js` (65 r.)
**Export:** named function `getCheckoutSchema(language)`

Generuje zod schema s lokalizovanymi error messages (CS/EN). Viz tabulka poli v sekci 8.7.

---

## 9. State management a data flow

### 9.1 Centralni state v orchestratoru (index.jsx)

Vsechny klicove state promenne jsou v hlavni komponente `TestKalkulacka`:

| State | Typ | Popis |
|-------|-----|-------|
| `currentStep` | Number (1-5) | Aktualni krok wizardu |
| `uploadedFiles` | Array | Vsechny nahrane modely |
| `selectedFileId` | Number | null | ID vybraneho modelu |
| `printConfigs` | Object | Konfigurace per model `{ [fileId]: config }` |
| `isProcessing` | Boolean | Single model processing flag |
| `sliceAllProcessing` | Boolean | Batch processing flag |
| `pricingConfig` | Object | Admin Pricing V3 |
| `feesConfig` | Object | Admin Fees V3 |
| `feeSelections` | Object | Fee UI selections |
| `expressConfig` | Object | Express pricing |
| `selectedExpressTierId` | String | null | Vybrany express tier |
| `shippingConfig` | Object | Shipping config |
| `selectedShippingMethodId` | String | null | Vybrany shipping method |
| `couponsConfig` | Object | Coupons config |
| `appliedCouponCode` | String | Aplikovany kupon |
| `batchProgress` | Object | `{ mode, done, total }` |
| `availablePresets` | Array | Slicer presety z backendu |
| `defaultPresetId` | String | null | Default preset ID |
| `selectedPresetIds` | Object | Per-model preset `{ [fileId]: presetId, __default: presetId }` |
| `presetsLoading` | Boolean | Preset loading state |
| `presetsError` | Error | null | Chyba presetu |
| `lastOrderResult` | Object | null | Posledni objednavka (pro step 5) |

### 9.2 Data flow diagram

```
                                     Admin Dashboard
                                          |
                                    localStorage
                                    (pricing:v3, fees:v3, express:v1, shipping:v1, coupons:v1)
                                          |
                                    storage event listener
                                          |
    User                            TestKalkulacka (orchestrator)
     |                                    |
     |-- upload files -->  FileUploadZone --> uploadedFiles state
     |                                    |
     |-- select file -->   Model list     --> selectedFileId
     |                                    |
     |-- config change --> PrintConfiguration --> printConfigs[fileId]
     |                                              |
     |                               handleConfigChange()
     |                                  |  (compare meaningful keys)
     |                                  |-- if changed: updateModelStatus(pending)
     |                                  |-- triggerRecalc(fileId) [debounced]
     |                                  |
     |                               doRecalc(fileId)
     |                                  |-- sliceModelLocal(file, { presetId })
     |                                  |-- on success: updateModelStatus(completed, result)
     |                                  |-- on failure: parseSlicerError() -> updateModelStatus(failed, error)
     |                                  |
     |                               ModelViewer
     |                                  |-- onSurfaceComputed(fileId, { surfaceMm2 })
     |                                  |-- updateModelStatus({ clientModelInfo })
     |                                  |-- surface patchovano do file.result.modelInfo
     |                                  |
     |                               PricingCalculator
     |                                  |-- calculateOrderQuote(uploadedFiles, configs, fees, ...)
     |                                  |-- zobrazuje quote.total, breakdown, per-model fees
     |                                  |
     |-- proceed to checkout -->  CheckoutForm
     |                                  |-- useForm + zodResolver
     |                                  |-- calculateOrderQuote (pro souhrn)
     |                                  |-- onSubmit: saveOrders() + saveOrderFiles()
     |                                  |-- onComplete(order)
     |                                  |
     |                               OrderConfirmation
     |                                  |-- zobrazuje order souhrn
     |                                  |-- onStartNew -> handleResetUpload()
```

### 9.3 Auto-step navigace

- **Step 1 -> 2:** Automaticky po 1 sekunde kdyz `uploadedFiles.length > 0`
- **Step 2 -> 3:** Automaticky po uspesnem slicingu (`handleSliceSelected` a `runBatchSlice`)
- **Step 3 -> 4:** Manualni klik "Prejit k objednavce" (vyzaduje vsechny modely completed)
- **Step 4 -> 5:** Automaticky po `handleCheckoutComplete`
- **Zpet:** Manualni klik "Zpet" (disable na step 1)

### 9.4 Bug fix patterns

**Bug 1 -- Auto-recalc:**
Problem: Zmena konfigurace nevyvolala automaticky re-slice.
Reseni: `useDebouncedRecalculation` hook + `handleConfigChange` porovnava meaningful keys
a triggeruje `doRecalc` s debounce (500ms select, 800ms slider).

**Bug 2 -- Per-model presets:**
Problem: Vsechny modely sdilely jeden preset; zmena presetu ovlivnila ostatni.
Reseni: `selectedPresetIds` je objekt `{ [fileId]: presetId }` s `__default` klicem.
Kazdy model ma vlastni preset assignment.

**Bug 3 -- Preset retry:**
Problem: Pokud slicing s presetem selhal, uzivatel musel rucne menit preset.
Reseni: `trySliceWithFallback(presetId)` automaticky retry bez presetu pri selhani.
Pouzito v `doRecalc`, `handleSliceSelected` a `runBatchSlice`.

**Bug 4 -- NaN safe:**
Problem: `Number(undefined)` = `NaN` se propagoval do UI.
Reseni: `safeN(v, fallback)` helper v PrintConfiguration vysledcich (radek 930).

---

## 10. Error handling

### 10.1 Slicer error classifier

**Soubor:** `src/utils/slicerErrorClassifier.js` (166 r.)

12 kategorii erroru s regex pattern matching:

| Kategorie | Severity | Priklad patternu |
|-----------|----------|-----------------|
| MESH_NON_MANIFOLD | error | `/non[- ]?manifold/i` |
| MESH_ZERO_VOLUME | error | `/zero[- ]?volume/i`, `/degenerate/i` |
| MESH_TOO_SMALL | warning | `/too small/i` |
| MESH_TOO_LARGE | warning | `/exceeds.*build.*volume/i` |
| MESH_SELF_INTERSECTING | error | `/self[- ]?intersect/i` |
| MESH_INVERTED_NORMALS | warning | `/inverted.*normal/i` |
| FILE_CORRUPT | error | `/can't.*read/i`, `/corrupt/i` |
| FILE_UNSUPPORTED | error | `/unsupported.*format/i` |
| CONFIG_MISSING | error | `/no.*\\.ini/i` |
| SLICER_NOT_FOUND | error | `/not configured/i`, `/ENOENT/i` |
| TIMEOUT | warning | `/timed? ?out/i` |
| NETWORK_ERROR | error | `/fetch.*failed/i`, `/ECONNREFUSED/i` |
| UNKNOWN | error | fallback pro nerozpoznane chyby |

Kazda kategorie ma CZ i EN user-friendly hlasku.

### 10.2 Error flow

```
sliceModelLocal() throws
  -> catch(err) v handleSliceSelected / runBatchSlice / doRecalc
    -> parseSlicerError(err)
      -> classifySlicerError(errorMessage, stderr)
        -> return { category, severity, userMessage, raw }
    -> updateModelStatus(fileId, { status: 'failed', error, errorCategory, errorSeverity, errorRaw })
```

### 10.3 ErrorBoundary

Obaluje `ModelViewer` a `STLCanvas`. Zachyti crashe Three.js (velke modely, koruptni geometrie).
Zobrazuje error panel s "Zkusit znovu" tlacitkem misto white-screen.

### 10.4 Pricing error handling

`PricingCalculator` ma try/catch kolem `calculateOrderQuote()`. Chyba se zobrazuje v `errorBox`.
`CheckoutForm` ma try/catch -- pri selhani `calculateOrderQuote()` vraci `null` (quote se nezobrazuje).

### 10.5 File storage error handling

`CheckoutForm.onSubmit` uklada objednavku do localStorage PRED pokusem o backend storage.
Pokud `saveOrderFiles()` selze, objednavka zustava v localStorage se `storage.status = 'failed'`.

---

## 11. Preklady (i18n)

### Pouzity system

- **Orchestrator (index.jsx):** Hardcoded ceske texty (stepper labels, status tooltips, breadcrumb)
- **PrintConfiguration:** `useLanguage()` pro fee formatting, preset labels, material paleta
- **CheckoutForm:** `useLanguage()` pro form labels, CTA, GDPR text (CS/EN)
- **OrderConfirmation:** `useLanguage()` pro vsechny texty (CS/EN)
- **PricingCalculator:** Hardcoded ceske texty (nadpisy, labels)
- **FileUploadZone:** Hardcoded ceske texty
- **ModelViewer:** Hardcoded ceske texty
- **Shipping/Express/Coupon/PostProcessing/Promo/Upsell:** Hardcoded anglicke texty

### Nesrovnalosti

1. **Orchestrator** -- stepper popisky v cestine bez `t()`: "Nahrani souboru", "Konfigurace", atd.
2. **PricingCalculator** -- "CENA A SOUHRN", "Rozpis objednavky", "Prepocitat vse" hardcoded CZ
3. **ShippingSelector, ExpressTierSelector, CouponInput** -- kompletne v anglictine
4. **PostProcessingSelector, PromoBar, UpsellPanel** -- kompletne v anglictine
5. **checkoutSchema** -- validacni hlasky lokalizovane pres `getCheckoutSchema(language)`

---

## 12. Pristupnost

### Dobra praxe

- `aria-busy` na GenerateButton pri loading stavu
- `aria-label` na fullscreen a remove tlacitka v ModelViewer
- `sr-only` span pro "Pridani Modelu" v model listu
- Semantic HTML: `<button>`, `<input>`, `<label>`, `<form>`
- Checkbox s popisem "Automaticke generovani podper"

### Problemy

- **Stepper** nema ARIA roles (`role="progressbar"` nebo `role="tablist"`)
- **Model list** -- `Button` pro vyber modelu, ale chybi `aria-selected` nebo `aria-pressed`
- **Slider (infill)** -- nativni `<input type="range">` (dobra zakladni pristupnost), ale chybi `aria-label`
- **Fee checkboxy** -- pouzivaji `ForgeCheckbox` s `onChange={() => {}}` a parent div `onClick` -- nesemanticky vzor
- **Fullscreen overlay** -- kliknuti mimo zavira, ale chybi `Escape` key handler
- **Color selection** -- buttony bez `aria-pressed`
- **Developer/Zakaznicky toggle** -- nema `aria-expanded` nebo `aria-pressed`

---

## 13. Performance

### Lazy loading

- **Orchestrator:** Import primy (NE lazy) v Routes.jsx -- nacte se s hlavnim bundlem
- **Three.js:** `STLLoader` nacten synchronne pres `useLoader`
- **Fullscreen model:** nacita geometrii znovu (druhy useLoader s stejnym URL -- three.js cachuje)

### Memoizace

| Misto | Technika | Ucel |
|-------|----------|------|
| `updateModelStatus` | `useCallback` | Stabilni reference pro child components |
| `handleSurfaceComputed` | `useCallback` | Prevence re-renderu ModelViewer |
| `doRecalc` | `useCallback` | Stabilni reference pro debounce hook |
| `handleConfigChange` | `useCallback` | Prevence re-renderu PrintConfiguration |
| `handleSliceSelected` | `useCallback` | Prevence zbytecnych reslicu |
| `runBatchSlice` | `useCallback` | Batch slicing stabilita |
| `handleSliceAll` | `useCallback` | Prevence duplicitnich batch slicu |
| `handleResliceFailed` | `useCallback` | Stabilita |
| `handleCheckoutComplete` | `useCallback` | Prevence step reset |
| `enabledMaterials` | `useMemo` | Filtrovani materialu |
| `materialOptions` | `useMemo` | Select options |
| `selectedMaterial` | `useMemo` | Vybrany material |
| `uiColors` | `useMemo` | Barvy pro vybrany material |
| `selectableFees` | `useMemo` | Filtrovani fees |
| `readyModels` | `useMemo` | Hotove modely pro pricing |
| `quoteState` | `useMemo` | Cenovy vypocet (narocny) |
| `quote` (CheckoutForm) | `useMemo` | Cenovy vypocet pro souhrn |
| `schema` (CheckoutForm) | `useMemo` | Zod schema per language |
| STL geometry centering | `useMemo` | Centrovani geometrie |

### PrintConfiguration key prop

`PrintConfiguration` ma `key={selectedFile.id}` -- pri zmene modelu se REMOUNTUJE.
Toto je zamerne pro reset lokalni state na novy `initialConfig`, ale zpusobovalo bug
s resetem slice results (opraveno v handleConfigChange compare logice).

### Surface computation guardrails

- Max 2M vertices, 1M trojuhelniku
- Time budget 140ms
- `requestIdleCallback` pro non-blocking
- Provede se jen jednou per model (cachovano v `clientModelInfoMeta`)

---

## 14. Bezpecnost

### File upload validace

- **Accept types:** `.stl`, `.obj` v dropzone; `.stl`, `.obj`, `.3mf` v hidden input
- **Max velikost:** 50 MB na soubor (dropzone)
- **Duplicity:** Kontrola dle nazvu souboru (`uploadedFiles.some(file => file.name === ...)`)
- **Object URL:** `URL.createObjectURL` s cleanup v useEffect (`URL.revokeObjectURL`)

### GDPR

- **Consent checkbox** je povinny (zod validace `refine(v => v === true)`)
- **Timestamp** ulozeny v objednavce (`gdpr_consent_at`)
- **Osobni udaje** ukladany jako snapshot (customer_snapshot, shipping_address)

### Znama rizika

- **`tenant_id: 'demo-tenant'`** hardcoded v CheckoutForm (radek 245) -- porusi tenant isolation
- **Console.log** s model daty v dev modu (chraneno `import.meta.env.DEV` guardem)
- **localStorage** neni sifrovany -- objednavky vcetne osobnich udaju jsou v plaintextu
- **File objects** v pameti -- velke STL soubory zustavaji v `uploadedFiles[].file` po celou dobu session

---

## 15. Konfigurace (admin-configurable parametry)

Vsechny parametry se nacitaji z localStorage (tenant-scoped) a jsou editovatelne v Admin panelu:

| Parametr | Admin stranka | Vliv na kalkulacku |
|----------|--------------|-------------------|
| Materials (name, key, price_per_gram, colors) | Admin Pricing | Select material, barvy, cena za gram |
| Rate per hour | Admin Pricing | Casova slozka ceny |
| Minimum billed minutes | Admin Pricing | Minimalni uctuovane minuty |
| Minimum price per model | Admin Pricing | Per-model minimalni cena |
| Minimum order total | Admin Pricing | Minimalni celkova cena objednavky |
| Rounding (step, mode, smart) | Admin Pricing | Zaokrouhleni cen |
| Markup (mode, value) | Admin Pricing | Prirazka (procento, fixni, min_flat) |
| Volume discounts | Admin Pricing | Mnozstevni slevy |
| Fees (MODEL + ORDER scope) | Admin Fees | Poplatky a sluzby |
| Express tiers | Admin Express | Expresni doruceni prirazky |
| Shipping methods | Admin Shipping | Metody doruceni |
| Coupons | Admin Coupons | Slevove kupony |
| Slicer presets | Admin Presets | Presety pro PrusaSlicer |

### Cross-tab sync

```javascript
useEffect(() => {
  const onStorage = (e) => {
    if (e.key.includes('pricing:v3')) setPricingConfig(loadPricingConfigV3());
    if (e.key.includes('fees:v3'))    setFeesConfig(loadFeesConfigV3());
    // ... express, shipping, coupons
  };
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}, []);
```

Admin zmena v jine zalosec se propsne do kalkulacky automaticky.

---

## 16. Souvisejici dokumenty

| Dokument | Cesta |
|----------|-------|
| CLAUDE.md (hlavni manual) | `Model_Pricer-V2-main/CLAUDE.md` |
| Phase 1 complete | `docs/claude/Planovane_Implementace/V3-PHASE1-COMPLETE.md` |
| Pricing Engine V3 | `src/lib/pricing/pricingEngineV3.js` |
| Slicer Error Classifier | `src/utils/slicerErrorClassifier.js` |
| Admin Pricing Storage | `src/utils/adminPricingStorage.js` |
| Admin Fees Storage | `src/utils/adminFeesStorage.js` |
| Admin Orders Storage | `src/utils/adminOrdersStorage.js` |
| Slicer API | `src/services/slicerApi.js` |
| Presets API | `src/services/presetsApi.js` |
| Storage API | `src/services/storageApi.js` |
| Routes | `src/Routes.jsx` |
| LanguageContext | `src/contexts/LanguageContext.jsx` |
| Forge design tokens | `src/styles/forge-tokens.css` |
| Widget kalkulacka | `src/pages/widget-kalkulacka/` (duplikat bez checkoutu) |
| Error Log | `docs/claude/Error_Log.md` |
| Design Error Log | `docs/claude/Design-Error_LOG.md` |

---

## 17. Zname omezeni

### Funkcni omezeni

1. **5 nepouzivaných komponent** -- ShippingSelector, ExpressTierSelector, CouponInput, PostProcessingSelector,
   PromoBar a UpsellPanel jsou naimportovany/existuji ale NEJSOU integrovany do orchestratoru.
   State pro shipping, express a coupons existuje, ale UI komponenty nejsou renderovany.

2. **Tenant ID hardcoded** -- CheckoutForm pouziva `tenant_id: 'demo-tenant'` misto `getTenantId()`.

3. **3MF v dropzone chybi** -- Hidden file input akceptuje `.3mf`, ale FileUploadZone dropzone ne.
   Uzivatel muze nahrat 3MF jen pres "Pridat model" button, ne pres drag&drop.

4. **Zadna file type validace na backendu** -- Frontend akceptuje soubory dle extension,
   ale nevaliduje skutecny obsah (magic bytes).

5. **Memory leak potencial** -- Velke File objekty zustavaji v pameti po celou session
   (v `uploadedFiles[].file`). Neni mechanismus pro uvolneni.

6. **Chybejici perzistence** -- Pokud uzivatel refreshne stranku, vsechny nahrane modely a konfigurace
   se ztrati. Zadny sessionStorage/localStorage backup.

### i18n omezeni

7. **Nekompletni lokalizace** -- Orchestrator, PricingCalculator a FileUploadZone maji
   hardcoded ceske texty. 5 dalsi komponent je kompletne v anglictine.

### Pristupnost omezeni

8. **Stepper bez ARIA** -- Wizard stepper nema `role="progressbar"` ani tab-like navigaci.
9. **Fee targeting nepristupny** -- Radio buttony a checkboxy pro fee targeting nemaji label propojeni.
10. **Fullscreen bez Escape** -- Kliknutim mimo zavira, ale chybi keyboard handler.

### Design omezeni

11. **PricingCalculator import nesrovnalost** -- Pouziva `{ Button }` (named) a `Icon` z jineho souboru
    nez ostatni komponenty. Pokud by se exporty zmenily, tato komponenta muze selhat jako prvni.

12. **Simulovany upload progress** -- FileUploadZone simuluje progress po 200ms inkrement po 10%.
    Skutecny upload probiha na backendu az pri slicingu, ne pri "nahrani". To muze matat uzivatele.
