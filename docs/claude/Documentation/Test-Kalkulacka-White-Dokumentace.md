# Test-Kalkulacka-White -- Dokumentace

> Svetla varianta test kalkulacky pro testovani white-label designu.
> Pouziva identickou business logiku jako puvodniho test-kalkulacka, ale s Tailwind-based
> light theme misto Forge dark theme. Slouzi jako reference pro white-label widget embedding.

---

## 1. Prehled

Test-Kalkulacka-White (`/test-kalkulacka-white`) je 5-krokovy wizard pro nahravani 3D modelu,
konfiguraci parametru tisku, vypocet ceny, checkout a potvrzeni objednavky. Stranka je
dostupna take pod aliasem `/model-upload` (301 redirect v Routes.jsx).

### 5 kroku wizardu

| Krok | Nazev | Ikona | Popis |
|------|-------|-------|-------|
| 1 | Nahrani souboru | Upload | Drag & drop zona pro STL/OBJ soubory (max 50 MB) |
| 2 | Konfigurace | Settings | Material, barva, kvalita, infill, podpery, mnozstvi, preset, fees |
| 3 | Kontrola a cena | Calculator | Cenova kalkulace pres pricingEngineV3, developer/zakaznicky pohled |
| 4 | Objednavka | ShoppingCart | Kontaktni formular (react-hook-form + zod), souhrn objednavky |
| 5 | Potvrzeni | CheckCircle | Cislo objednavky, souhrn, kontaktni udaje, tlacitko "Nova objednavka" |

### Klicove funkce

- Multi-model upload (vice souboru najednou)
- Per-model preset a konfigurace (Bug 2 fix: `selectedPresetIds[fileId]`)
- Automaticky re-slicing pri zmene konfigurace (Bug 1 fix: `useDebouncedRecalculation`)
- Batch slicing ("Spocitat vse") s progress barem
- Re-slice failed modelu
- Progresivni cenova kalkulace (castecny total pri nekompletnim slicovani)
- Developer vs zakaznicky pohled v PricingCalculator
- Checkout formular s GDPR souhlasem
- Ulozeni objednavky do localStorage (adminOrdersStorage)
- Express tiers, shipping, kupony (state pripraveny, UI komponenty existuji)
- Surface area vypocet v prohlizeci (STL only, guardrails)
- 3D nahled s OrbitControls a fullscreen modem
- ErrorBoundary kolem 3D vieweru (ochrana pred white-screen)

---

## 2. Technologie a jazyk

| Polozka | Hodnota |
|---------|---------|
| Framework | React 19 |
| Bundler | Vite |
| Jazyk | JavaScript + JSX |
| Styling | Tailwind CSS utility classes (svetly theme — `bg-background`, `text-foreground`, `bg-card`, atd.) |
| 3D rendering | @react-three/fiber + @react-three/drei + three.js (STLLoader) |
| Formulare | react-hook-form + @hookform/resolvers/zod |
| Validace | zod |
| Drag & drop | react-dropzone |
| Routing | React Router v6 (`/test-kalkulacka-white`, alias `/model-upload`) |
| i18n | `useLanguage()` hook z `LanguageContext.jsx` (CS/EN) |
| Pricing engine | `calculateOrderQuote()` z `pricingEngineV3.js` |
| Storage | localStorage pres tenant-scoped helpery |

---

## 3. Architektura souboru

```
src/pages/test-kalkulacka-white/
  index.jsx                           -- Hlavni orchestrator (~949 radku), 5-step wizard
  components/
    FileUploadZone.jsx                 -- Drag & drop upload zona (react-dropzone)
    ModelViewer.jsx                    -- 3D STL nahled (Canvas, OrbitControls, fullscreen)
    PrintConfiguration.jsx             -- Konfigurace tisku (material, kvalita, infill, fees)
    PricingCalculator.jsx              -- Cenova kalkulace + developer breakdown
    GenerateButton.jsx                 -- Fancy CTA tlacitko (Uiverse styl)
    GenerateButton.module.css          -- CSS Modules pro GenerateButton
    CheckoutForm.jsx                   -- Kontaktni formular (krok 4)
    OrderConfirmation.jsx              -- Potvrzeni objednavky (krok 5)
    ErrorBoundary.jsx                  -- Class-based error boundary
    ExpressTierSelector.jsx            -- Vyber delivery speed tieru (S09)
    ShippingSelector.jsx               -- Vyber dopravy (S04)
    CouponInput.jsx                    -- Zadani slevoveho kuponu (S10)
    UpsellPanel.jsx                    -- Upsell banner pro upgrade tieru
    PromoBar.jsx                       -- Promo banner s kuponovym kodem
    PostProcessingSelector.jsx         -- Vyber post-processing sluzeb
  hooks/
    useDebouncedRecalculation.js       -- Debounced auto-recalculation (500ms default, 800ms slider)
  schemas/
    checkoutSchema.js                  -- Zod schema pro checkout formular (CS/EN validace)
  utils/
    geomEstimate.js                    -- Odhad hmotnosti z objemu (perimetry + infill)
```

### Celkovy pocet souboru: 19

| Typ | Pocet | Poznamka |
|-----|-------|----------|
| JSX komponenty | 15 | 1 hlavni + 14 komponent |
| JS hooks | 1 | useDebouncedRecalculation |
| JS schemas | 1 | checkoutSchema (zod) |
| JS utils | 1 | geomEstimate |
| CSS Modules | 1 | GenerateButton.module.css |

---

## 4. Import graf

### index.jsx (hlavni orchestrator) — externi importy

```
React (useState, useEffect, useRef, useCallback)
react-router-dom (useNavigate)

Sdilene komponenty:
  components/AppIcon                    -- Lucide ikony
  components/ui/Button                  -- Sdileny Button

Lokalni komponenty:
  ./components/FileUploadZone
  ./components/ModelViewer
  ./components/PrintConfiguration
  ./components/PricingCalculator
  ./components/GenerateButton
  ./components/ErrorBoundary
  ./components/CheckoutForm
  ./components/OrderConfirmation

Sluzby:
  services/slicerApi                    -- sliceModelLocal()
  services/presetsApi                   -- fetchWidgetPresets()

Storage helpery:
  utils/adminPricingStorage             -- loadPricingConfigV3()
  utils/adminFeesStorage                -- loadFeesConfigV3()
  utils/adminExpressStorage             -- loadExpressConfigV1()
  utils/adminShippingStorage            -- loadShippingConfigV1()
  utils/adminCouponsStorage             -- loadCouponsConfigV1()

Chybovy parser:
  utils/slicerErrorClassifier           -- parseSlicerError()

Lokalni hooks:
  ./hooks/useDebouncedRecalculation
```

### Komponenty — hlavni importy

| Komponenta | Klicove externi importy |
|------------|------------------------|
| FileUploadZone | react-dropzone, AppIcon, Button |
| ModelViewer | @react-three/fiber (Canvas, useLoader), @react-three/drei (OrbitControls, Center), three (STLLoader, THREE), AppIcon, Button, ErrorBoundary |
| PrintConfiguration | AppIcon, ui/Input, ui/Select, ui/Checkbox, LanguageContext |
| PricingCalculator | ui/Button, ui/Card, ui/Icon, pricingEngineV3 (calculateOrderQuote) |
| CheckoutForm | react-hook-form, @hookform/resolvers/zod, AppIcon, Button, ui/Input, ui/Checkbox, LanguageContext, checkoutSchema, pricingEngineV3, adminOrdersStorage |
| OrderConfirmation | AppIcon, Button, LanguageContext |
| GenerateButton | GenerateButton.module.css |
| ErrorBoundary | (zadne externi — cisty React class component) |
| ExpressTierSelector | AppIcon |
| ShippingSelector | AppIcon |
| CouponInput | AppIcon |
| UpsellPanel | AppIcon |
| PromoBar | AppIcon |
| PostProcessingSelector | AppIcon |

### Poznamka k importum

Nektere komponenty importuji `Icon` z ruznych cest:
- Vetsina: `../../../components/AppIcon` (alias pro lucide-react wrapper)
- PricingCalculator: `../../../components/ui/Icon` (jiny wrapper)

Toto je potencialni nekonzistence — viz sekce 17 "Zname omezeni".

---

## 5. Design a vizual (white theme vs dark Forge)

### Zakladni pristup

Test-kalkulacka-white pouziva **Tailwind CSS utility classes** s CSS custom properties
definovanymi v Tailwind theme (light mode). Na rozdil od puvodniho Forge dark theme
(tmave pozadi, neonove akcenty) je tato varianta navrzena jako "cisty, svetly" design
vhodny pro white-label embedding.

### Pouzivane Tailwind tokeny

| Token | Vyznam | Typicka svetla hodnota |
|-------|--------|----------------------|
| `bg-background` | Pozadi stranky | bila / svetle seda |
| `bg-card` | Pozadi karet | bila |
| `text-foreground` | Primarni text | tmave seda / cerna |
| `text-muted-foreground` | Sekundarni text | stredne seda |
| `border-border` | Ohraniceni | svetle seda |
| `bg-muted` / `bg-muted/30` | Pozadi muted oblasti | svetle seda s opacity |
| `bg-primary` | Primarni barva (CTA, stepper) | modra/fialova |
| `text-primary` | Text v primarni barve | modra/fialova |
| `text-primary-foreground` | Text na primarnim pozadi | bila |
| `text-destructive` | Chybovy text | cervena |
| `bg-destructive/5` | Chybove pozadi | cervena s nízkou opacity |

### Vizualni prvky

| Prvek | Styl |
|-------|------|
| Stepper (5 kroku) | Kruhove ikony s `border-2`, aktivni = `bg-primary`, neaktivni = `border-border` |
| Karty | `bg-card border border-border rounded-xl p-6` |
| Upload zona | `border-2 border-dashed rounded-xl p-8`, drag active = `border-primary bg-primary/5` |
| GenerateButton | CSS Modules, tmave pozadi (#1C1A1C), hover gradient (purple #683FEA -> #A47CF3) |
| Progress bar | `h-1.5 bg-border rounded-full`, fill `bg-primary` |
| Error state | `border-red-200 bg-red-50 text-red-800` |
| 3D nahled | Canvas v `bg-muted/30 rounded-xl`, model barva #1E90FF |
| Model list | Tlacitka s ikonami stavu (Loader spin, Clock, CheckCircle, XCircle) |

### GenerateButton — specialni styl

GenerateButton je jediny prvek ktery pouziva CSS Modules (`GenerateButton.module.css`)
misto Tailwind trid. Ma 3 velikostni varianty:

| Varianta | Sirka | Vyska | Font size |
|----------|-------|-------|-----------|
| default | 13em | 4.25em | medium |
| top | 10.4em | 3.4em | 0.95rem |
| compact | 8.5em | 2.8em | 0.9rem |

Hover efekt: gradient purple (#683FEA -> #A47CF3) + box-shadow s #9917FF glow.

### Porovnani s Forge dark theme (test-kalkulacka)

| Aspekt | test-kalkulacka (Forge) | test-kalkulacka-white |
|--------|------------------------|----------------------|
| Pozadi | Tmave (`--forge-bg-void`, `--forge-bg-surface`) | Svetle (Tailwind `bg-background`) |
| Text | Svetly (`--forge-text-primary`) | Tmavy (`text-foreground`) |
| Karty | Dark surface + glow border | Bila + seda border |
| Akcentova barva | Teal (#00D4AA) + Orange (#FF6B35) | Primary (modra/fialova) |
| CSS system | Forge CSS tokens + inline styles | Tailwind utility classes |
| Typography | Forge fonty (heading, body, tech) | Tailwind default font stack |

---

## 6. Datovy model

### Hlavni state v index.jsx

| State | Typ | Popis |
|-------|-----|-------|
| `currentStep` | number (1-5) | Aktualni krok wizardu |
| `uploadedFiles` | Array<ModelObject> | Nahrane 3D modely |
| `selectedFileId` | number \| null | ID aktualne vybraneho modelu |
| `printConfigs` | Object<fileId, PrintConfig> | Konfigurace tisku per model |
| `isProcessing` | boolean | Zda probiha slicing vybraneho modelu |
| `sliceAllProcessing` | boolean | Zda probiha batch slicing |
| `pricingConfig` | Object | Pricing konfigurace (loadPricingConfigV3) |
| `feesConfig` | Object | Fees konfigurace (loadFeesConfigV3) |
| `feeSelections` | Object | Vybrane fees + targets per fee |
| `expressConfig` | Object | Express pricing konfigurace (S09) |
| `selectedExpressTierId` | string \| null | Vybrany express tier |
| `shippingConfig` | Object | Shipping konfigurace (S04) |
| `selectedShippingMethodId` | string \| null | Vybrana metoda dopravy |
| `couponsConfig` | Object | Kupony konfigurace (S10) |
| `appliedCouponCode` | string | Aplikovany kuponovy kod |
| `batchProgress` | Object | Progress batch slicingu (`{ mode, done, total }`) |
| `availablePresets` | Array | Presety z backendu |
| `defaultPresetId` | string \| null | Vychozi preset |
| `selectedPresetIds` | Object<fileId, presetId> | Per-model preset vyber |
| `presetsLoading` | boolean | Zda se nacitaji presety |
| `presetsError` | Error \| null | Chyba pri nacitani presetu |
| `lastOrderResult` | Object \| null | Posledni odeslana objednavka (pro krok 5) |

### ModelObject (polozka v uploadedFiles)

```javascript
{
  id: number,                    // Date.now() + Math.random()
  name: string,                  // nazev souboru
  size: number,                  // velikost v bytech
  type: string,                  // MIME typ
  file: File,                    // puvodni File objekt
  uploadedAt: Date,              // cas nahrani
  status: 'pending' | 'processing' | 'completed' | 'failed',
  result: Object | null,         // vysledek slicovani
  error: string | null,          // chybova zprava
  errorCategory: string,         // klasifikace chyby (z parseSlicerError)
  errorSeverity: string,         // zavaznost ('warning' | 'error')
  errorRaw: string,              // surova chybova zprava
  clientModelInfo: {             // browser-computed (STL only)
    surfaceMm2: number,
    surfaceCm2: number,
  },
  clientModelInfoMeta: {         // meta o surface vypoctu
    surface: { reason, vertexCount, triangleCount, ms }
  },
}
```

### PrintConfig (polozka v printConfigs)

```javascript
{
  material: string,     // 'pla', 'abs', 'petg', 'tpu', ...
  color: string | null, // ID barvy
  quality: string,      // 'nozzle_08'|'nozzle_06'|'nozzle_04'|'draft'|'standard'|'fine'|'ultra'
  infill: number,       // 10-100 (procenta)
  quantity: number,     // 1-100
  supports: boolean,    // zda pouzit podpery
}
```

### FeeSelections

```javascript
{
  selectedFeeIds: Set<string>,     // mnozina ID vybranych fees
  feeTargetsById: {                // per-fee targeting
    [feeId]: {
      mode: 'SELECTED',
      modelIds: string[],
      uiMode: 'ALL' | 'THIS' | 'SELECTED'
    }
  }
}
```

### Order objekt (generovany v CheckoutForm, ulozeny do localStorage)

```javascript
{
  id: string,                      // 'ORD-YYYYMMDD-HHMM-RAND'
  tenant_id: 'demo-tenant',
  created_at: string,              // ISO timestamp
  status: 'NEW',
  customer_snapshot: {
    name, email, phone, company, note,
    gdpr_consent: true,
    gdpr_consent_at: string
  },
  models: [{
    id: string,
    file_snapshot: { filename, size, uploaded_at },
    quantity: number,
    material_snapshot: { material_id, name },
    config_snapshot: PrintConfig,
    slicer_snapshot: Object
  }],
  totals_snapshot: { total, currency, simple },
  flags: [],
  notes: [{ text, created_at }],
  activity: [{ timestamp, user_id, type, payload }],
  updated_at: string
}
```

---

## 8. UI komponenty

### 8.1 FileUploadZone

- **Ucel:** Drag & drop zona pro nahravani 3D modelu
- **Props:** `onFilesUploaded`, `uploadedFiles`, `onRemoveFile`
- **Knihovna:** react-dropzone
- **Podporovane formaty:** `.stl`, `.obj` (accept konfigurace v dropzone)
- **Max velikost:** 50 MB na soubor
- **Chystane formaty v UI textu:** STL, OBJ
- **Upload progress:** Simulovany (interval 200ms, po 10% inkrementech)
- **Deferred state update:** `setTimeout(() => onFilesUploaded(...), 0)` — zabranuji React warningu o setState behem renderovani

### 8.2 ModelViewer

- **Ucel:** 3D nahled STL modelu + metriky ze sliceru
- **Props:** `selectedFile`, `onRemove`, `onSurfaceComputed`
- **3D engine:** @react-three/fiber Canvas + STLLoader
- **Guardrails:**
  - Max preview: 12 MB (`MAX_PREVIEW_MB`)
  - Max vertices: 2,000,000
  - Max triangles: 1,000,000
  - Time budget: 140ms pro surface vypocet
- **Surface vypocet:** Idle-scheduled (requestIdleCallback), cross product trianglu
- **Fullscreen:** Overlay s `z-[9999]`, backdrop blur, auto-rotate
- **Wheel scroll prevention:** `passive: false` listener na canvas wrapperu
- **URL management:** `URL.createObjectURL` + cleanup v useEffect
- **Zobrazovane metriky:**
  - Rozmery (mm)
  - Objem (cm3) — ze slicer resultu
  - Povrch (cm2) — z browser vypoctu nebo slicer resultu
  - Cas tisku (formatDuration)
  - Material (g)
- **Nepodporovane formaty:** Zobrazi placeholder text ("Nahled je dostupny jen pro STL soubory")

### 8.3 PrintConfiguration

- **Ucel:** Hlavni konfiguracni panel (krok 2, viditelny i v kroku 3)
- **Props:** 18 props vcetne `selectedFile`, `onConfigChange`, `pricingConfig`, `feesConfig`, `feeSelections`, `availablePresets`, atd.
- **Sekce:**
  1. Slicing preset selector (z backendu, Bug 3 fix s retry)
  2. Rychle predvolby (Basic / Middle / Pro)
  3. Material a barva (dynamicky z AdminPricing)
  4. Kvalita tisku (7 urovni od 0.8mm do 0.1mm) + infill slider + podpery
  5. Mnozstvi (1-100)
  6. Dodatecne sluzby (selectable fees z AdminFees)
  7. Vysledky slicingu / odhad tisku
- **Quality presets:**
  | Preset | Kvalita | Infill | Podpery |
  |--------|---------|--------|---------|
  | Basic | nozzle_06 (0.6mm) | 15% | Ne |
  | Middle | standard (0.2mm) | 20% | Ano |
  | Pro | fine (0.15mm) | 30% | Ano |
- **Kvalita vrstvy (7 urovni):**
  | Hodnota | Label | Popis |
  |---------|-------|-------|
  | nozzle_08 | Extra hruby (0.8mm) | Extremne rychly tisk |
  | nozzle_06 | Hruby (0.6mm) | Rychly tisk pro velke modely |
  | nozzle_04 | Rychly (0.4mm) | Urychleny tisk |
  | draft | Navrhovy (0.3mm) | Nejrychlejsi, nizka kvalita |
  | standard | Standardni (0.2mm) | Vyvazeny |
  | fine | Jemny (0.15mm) | Vysoka kvalita |
  | ultra | Ultra jemny (0.1mm) | Nejvyssi kvalita |
- **Fee targeting:** Pokud fee ma `apply_to_selected_models_enabled` a je vice modelu, uzivatel muze volit "Vsechny modely", "Tento model" nebo "Vybrane modely"
- **Material validace:** Automaticka korekce pokud vybrany material neni v enabledMaterials
- **Fallback barvy:** 8 UI-only barev (bila, cerna, cervena, modra, zelena, zluta, oranzova, fialova) pokud material nema definovane barvy

### 8.4 PricingCalculator

- **Ucet:** Cenovy souhrn + developer breakdown
- **Props:** 16 props vcetne `uploadedFiles`, `pricingConfig`, `feesConfig`, atd.
- **Pricing engine:** `calculateOrderQuote()` z `pricingEngineV3.js`
- **Pipeline:** base -> fees -> markup -> minima -> rounding
- **Dva rezimy:**
  - **Zakaznicky** (default): Celkova cena, material/cas/sluzby/sleva/markup, rozpis per model, order fees
  - **Developer:** Raw totals, per-model base breakdown (filamentGrams, billedMinutes, costs), MATCH/NO MATCH pro kazdou fee vcetne conditions vyhodnoceni
- **Progresivni cenova kalkulace:** Pokud nektere modely jeste nejsou completed, zobrazuje "Prubeznou cenu" z hotovych modelu
- **Volume discount:** Vizualni zvyrazneni v zelene karte s detail per-tier
- **Format:** `Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK' })`
- **Flags:** `min_order_total_applied`, `clamped_to_zero`, `volume_discount_applied`, `min_price_per_model_applied`

### 8.5 CheckoutForm

- **Ucet:** Kontaktni formular (krok 4)
- **Validace:** react-hook-form + zod (dynamicke schema dle jazyka)
- **Pole:**
  | Pole | Typ | Povinne | Validace |
  |------|-----|---------|----------|
  | name | text | ano | 2-100 znaku |
  | email | email | ano | validni email |
  | phone | tel | ne | max 20 znaku |
  | company | text | ne | max 100 znaku |
  | note | textarea | ne | max 1000 znaku |
  | gdprConsent | checkbox | ano | musi byt true |
- **Cislo objednavky:** `ORD-YYYYMMDDHHMM-RAND` (4 nahodne cislice)
- **Ulozeni:** `loadOrders()` + `orders.unshift(order)` + `saveOrders(orders)` do localStorage
- **Souhrn:** Prava strana zobrazuje seznam modelu a cenovou rekapitulaci

### 8.6 OrderConfirmation

- **Ucet:** Potvrzeni objednavky (krok 5)
- **Props:** `order`, `onStartNew`
- **Zobrazuje:** Cislo objednavky, dekujici zprava, seznam modelu, celkova cena, kontaktni udaje
- **Akce:** "Nova objednavka" — resetuje cely wizard

### 8.7 GenerateButton

- **Ucet:** Fancy CTA tlacitko pro slicing akce
- **Styl:** CSS Modules (GenerateButton.module.css), tmave pozadi + purple gradient hover
- **3 velikosti:** default, top (~20% mensi), compact (~35% mensi)
- **Ikona:** SVG sparkle (hvezdicka), pri hoveru bila + scale 1.2
- **Loading state:** Text se zmeni na "Pocitam..."
- **Disabled:** Opacity 0.6, bez hover efektu

### 8.8 ErrorBoundary

- **Ucet:** Class-based React error boundary
- **Chrani:** Predevsim 3D Canvas (slozite modely mohou crashnout renderer)
- **UI:** Cerveny box s chybovou zpravou + tlacitko "Zkusit znovu"
- **Callback:** Volitelny `onReset` prop

### 8.9 ExpressTierSelector

- **Ucet:** Vyber rychlosti doruceni
- **Props:** `tiers`, `selectedTierId`, `onSelectTier`, `disabled`
- **UI:** Radio-button styl karty, priplatek v amber/green

### 8.10 ShippingSelector

- **Ucet:** Vyber metody dopravy
- **Props:** `methods`, `selectedMethodId`, `onSelectMethod`, `orderTotal`, `freeShippingThreshold`, `freeShippingEnabled`, `disabled`
- **UI:** Radio-button karty, progress bar k free shipping, ikony (Truck / MapPin)

### 8.11 CouponInput

- **Ucet:** Zadani slevoveho kuponu
- **Props:** `onApply`, `onRemove`, `appliedCoupon`, `validationError`, `disabled`
- **Stavy:** Nezadan (input + Apply button), Aplikovan (zelena karta s kodem a slevou)
- **Auto uppercase:** Vstup se automaticky prevedene na uppercase

### 8.12 UpsellPanel

- **Ucet:** Upsell banner pro upgrade na rychlejsi tier
- **Logika:** Zobrazi se pouze pokud je vybran nejlevnejsi tier a existuje alespon 1 dalsi
- **UI:** Amber pozadi, Zap ikona, tlacitko "Upgrade to X"

### 8.13 PromoBar

- **Ucet:** Propagacni banner
- **Props:** `promotion` (banner_text, banner_color, coupon_code), `onApply`
- **UI:** Zaobleny bar s custom barvou pozadi, Sparkles ikona

### 8.14 PostProcessingSelector

- **Ucet:** Vyber post-processing sluzeb (z fees s kategorii POST_PROCESSING)
- **Props:** `fees`, `selectedFeeIds`, `onToggleFee`
- **UI:** Grid checkbox karet s popisem, cenou, processing_days, volitelnym obrazkem

---

## 9. State management a data flow

### Datovy tok (shora dolu)

```
index.jsx (orchestrator)
  |
  |-- localStorage -> loadPricingConfigV3(), loadFeesConfigV3(), loadExpressConfigV1(),
  |                   loadShippingConfigV1(), loadCouponsConfigV1()
  |
  |-- fetchWidgetPresets() -> availablePresets, defaultPresetId
  |
  |-- FileUploadZone -> handleFilesUploaded -> uploadedFiles[]+
  |
  |-- PrintConfiguration -> handleConfigChange -> printConfigs{}
  |       |                                          |
  |       |-- (zmena materialu/kvality/infill/podper) |
  |       |       |                                   |
  |       |       v                                   |
  |       |-- useDebouncedRecalculation               |
  |       |       |                                   |
  |       |       v (500ms/800ms debounce)            |
  |       |-- doRecalc(fileId)                        |
  |               |                                   |
  |               v                                   |
  |           sliceModelLocal(file, { presetId })     |
  |               |                                   |
  |               v                                   |
  |           updateModelStatus(fileId, result)       |
  |                                                   |
  |-- PricingCalculator                               |
  |       |                                           |
  |       v                                           |
  |   calculateOrderQuote({                           |
  |     uploadedFiles (completed only),               |
  |     printConfigs,                                 |
  |     pricingConfig, feesConfig, feeSelections,     |
  |     expressConfig, shippingConfig, couponsConfig  |
  |   })                                              |
  |       |                                           |
  |       v                                           |
  |   quote (total, models, orderFees, volumeDiscount)|
  |                                                   |
  |-- CheckoutForm                                    |
  |       |                                           |
  |       v                                           |
  |   onSubmit -> generateOrderNumber()               |
  |            -> saveOrders(orders) [localStorage]    |
  |            -> onComplete(order)                    |
  |                                                   |
  |-- OrderConfirmation                               |
          |                                           |
          v                                           |
      onStartNew -> handleResetUpload()               |
```

### Auto-sync z localStorage

`window.addEventListener('storage', ...)` v index.jsx sleduje zmeny z jinych tabu:
- `pricing:v3` -> setPricingConfig
- `fees:v3` -> setFeesConfig
- `express:v1` -> setExpressConfig
- `shipping:v1` -> setShippingConfig
- `coupons:v1` -> setCouponsConfig

### Fee selections seeding

Pri zmene `feesConfig` se automaticky:
1. Prunou fees ktere uz nejsou `active + selectable`
2. Pridaji fees s `selected_by_default`

### Preset assignment

- Pri nahrani modelu: priradi se `__default` preset nebo `defaultPresetId` nebo prvni dostupny
- Per-model: `selectedPresetIds[fileId]` — zmena pres PrintConfiguration
- Fallback: Pokud slicing s presetem selze, zkusi se bez presetu

---

## 10. Error handling

### Urovne chyboveho zpracovani

| Uroven | Mechanismus | Kde |
|--------|-------------|-----|
| Slicer chyby | `parseSlicerError()` klasifikace | index.jsx (doRecalc, handleSliceSelected, runBatchSlice) |
| 3D render crash | ErrorBoundary (class component) | Kolem ModelViewer Canvas |
| Formularove chyby | zod validace + react-hook-form | CheckoutForm |
| Preset loading | try/catch + retry button | loadPresets() v index.jsx |
| Config validace | Safe defaults (DEFAULT_PRINT_CONFIG) | index.jsx, PrintConfiguration |
| NaN ochrana | `Number.isFinite()` guardy (Bug 4 fix) | PrintConfiguration, PricingCalculator |

### Slicer error klasifikace (parseSlicerError)

Kazda slicer chyba je klasifikovana na:
- `userMessage` — lokalizovana zprava pro uzivatele
- `category` — typ chyby (napr. 'MESH_ERROR', 'TIMEOUT', 'UNKNOWN')
- `severity` — 'warning' nebo 'error'
- `raw` — surova chybova zprava (tooltip)

### Retry strategie

1. **Slicing s presetem:** Pokud selze, automaticky retry bez presetu
2. **Preset loading:** Manualni retry tlacitko v PrintConfiguration
3. **Batch failed:** Tlacitko "Reslice failed" pro opakovaní slicovani pouze selhanuch modelu

### ErrorBoundary chování

- Zachyti render error v potomcich (predevsim @react-three/fiber Canvas)
- Zobrazi cerveny box s error message + "Zkusit znovu" tlacitko
- Loguje do console.error (dev only informace)
- Podpora `onReset` callbacku

---

## 11. Preklady (i18n)

### Mechanismus

Stranky pouzivaji `useLanguage()` hook z `LanguageContext.jsx`. Inline prekladova funkce:
```javascript
const t = (cs, en) => (language === 'en' ? en : cs);
```

### Pokryti prekladu per komponenta

| Komponenta | CS/EN | Poznamka |
|------------|-------|----------|
| index.jsx | Castecne CS-only | Stepper tituly, tooltip texty, tlacitka — prevazan cesky |
| FileUploadZone | CS-only | "Nahrajte 3D modely", "Pustete soubory zde" |
| ModelViewer | CS-only | "Nahled modelu", "Rozmery", "Cas tisku" |
| PrintConfiguration | Smisene | Material/kvalita/infill labely CS, fee value labels CS/EN |
| PricingCalculator | CS-only | "Cena a souhrn", "Prubezna cena", "Developer" |
| CheckoutForm | CS/EN | Vsechna pole a validace maji oba jazyky |
| OrderConfirmation | CS/EN | Vsechny texty maji oba jazyky |
| GenerateButton | CS-only | "Spocitat cenu", "Pocitam..." |
| ErrorBoundary | CS-only | "Neco se pokazilo" |
| ExpressTierSelector | EN-only | "Delivery Speed", "business days" |
| ShippingSelector | EN-only | "Shipping", "Free shipping progress" |
| CouponInput | EN-only | "Coupon Code", "Apply" |
| UpsellPanel | EN-only | "Need it faster? Upgrade to..." |
| PromoBar | Dynamicky | Text z promotion objektu |
| PostProcessingSelector | EN-only | "Post-Processing Services" |

### Zname jazykove problemy

Komponenty ExpressTierSelector, ShippingSelector, CouponInput, UpsellPanel a PostProcessingSelector
jsou **pouze anglicky** — nemaji pristup k `useLanguage()` a vsechny texty jsou hardcoded v EN.
Toto je nekonzistence oproti CheckoutForm a OrderConfirmation ktere maji plnou CS/EN podporu.

---

## 12. Pristupnost

### Implementovane

| Prvek | Implementace |
|-------|-------------|
| Stepper ikony | Vizualni stav (barva) ale bez ARIA roles |
| Upload zona | react-dropzone spravuje `<input>` s korektnimi atributy |
| Model list buttons | `title` atribut s tooltip textem stavu |
| Fullscreen close | `aria-label="Zavrit cele okno"` |
| Model remove | `aria-label="Odstranit model"` |
| Fullscreen open | `aria-label="Cela obrazovka"` |
| Add model | `<span className="sr-only">Pridani Modelu</span>` |
| GenerateButton | `aria-busy` atribut pri loading |
| ErrorBoundary | Srozumitelna chybova zprava + reset button |
| GDPR checkbox | `htmlFor="gdpr-consent"` propojeni s labelem |

### Chybejici / nedostatecne

| Problem | Dopad | WCAG |
|---------|-------|------|
| Stepper nema `role="progressbar"` ani `aria-current="step"` | Screen reader nevi v jakem kroku uzivatel je | 1.3.1 Info and Relationships |
| Infill slider nema `aria-label` ani `aria-valuetext` | Screen reader neoznamí hodnotu infill | 1.3.1, 4.1.2 |
| Batch progress bar nema `role="progressbar"` + `aria-valuenow` | Postup neni oznamovan | 1.3.1 |
| Model list checkmark ikony nemaji `aria-hidden="true"` | Mozna matouci oznameni | 1.3.1 |
| Color picker buttons nemaji `aria-pressed` | Screen reader nevi ktera barva je vybrana | 4.1.2 Name, Role, Value |
| Fee checkboxy: `<Checkbox>` wrapper — zavisi na implementaci | Pokud neni nativni `<input type="checkbox">`, muze chybet role | 4.1.2 |
| Keyboard navigation v 3D vieweru | OrbitControls nemuze byt ovladan klavesnici | 2.1.1 Keyboard |
| Document title se nemeni mezi kroky | Uzivatel nevi v jakem kroku je | 2.4.2 Page Titled |

---

## 16. Souvisejici dokumenty

| Dokument | Cesta | Popis |
|----------|-------|-------|
| MEMORY.md | `.claude/projects/.../memory/MEMORY.md` | Klicove cesty, konvence, Phase 1 implementace |
| CLAUDE.md | `Model_Pricer-V2-main/CLAUDE.md` | Hlavni provozni manual (20 sekci) |
| Routes.jsx | `Model_Pricer-V2-main/src/Routes.jsx` | Routovani — `/test-kalkulacka-white`, `/model-upload` alias |
| pricingEngineV3.js | `Model_Pricer-V2-main/src/lib/pricing/pricingEngineV3.js` | Cenovy pipeline (base->fees->markup->minima->rounding) |
| adminPricingStorage.js | `Model_Pricer-V2-main/src/utils/adminPricingStorage.js` | Pricing config localStorage helper |
| adminFeesStorage.js | `Model_Pricer-V2-main/src/utils/adminFeesStorage.js` | Fees config localStorage helper |
| adminOrdersStorage.js | `Model_Pricer-V2-main/src/utils/adminOrdersStorage.js` | Orders localStorage helper |
| slicerApi.js | `Model_Pricer-V2-main/src/services/slicerApi.js` | sliceModelLocal() — lokalni slicing |
| presetsApi.js | `Model_Pricer-V2-main/src/services/presetsApi.js` | fetchWidgetPresets() — nacitani presetu |
| slicerErrorClassifier.js | `Model_Pricer-V2-main/src/utils/slicerErrorClassifier.js` | Klasifikace slicer chyb |
| LanguageContext.jsx | `Model_Pricer-V2-main/src/contexts/LanguageContext.jsx` | CS/EN prekladovy slovnik |
| Design-Error_LOG.md | `docs/claude/Design-Error_LOG.md` | Log design chyb a nesrovnalosti |

---

## 17. Zname omezeni

### 17.1 Jazykova nekonzistence (i18n)

**Zavaznost:** Stredni

Komponenty ExpressTierSelector, ShippingSelector, CouponInput, UpsellPanel a PostProcessingSelector
jsou pouze v anglictine. Nemaji pristup k `useLanguage()` a vsechny labely jsou hardcoded EN.
To je v rozporu s CheckoutForm, OrderConfirmation a PrintConfiguration ktere maji CS/EN podporu.

**Doporuceni:** Pridat `useLanguage()` do vsech 5 komponent a prelozit texty.

### 17.2 Icon import nekonzistence

**Zavaznost:** Nizka (funkcne nemá dopad)

PricingCalculator importuje `Icon` z `../../../components/ui/Icon`, zatimco ostatni komponenty
importuji z `../../../components/AppIcon`. Obe cesty fungují, ale je to nekonzistentni.

**Doporuceni:** Sjednotit na jednu cestu (preferovane `AppIcon`).

### 17.3 Upload progress je simulovany

**Zavaznost:** Nizka

FileUploadZone simuluje upload progress pres `setInterval` s 200ms kroky po 10%.
Skutecny upload probiha lokalne (File objekt je pouzit primo), neni zadny sit'ovy prenos.
Simulace muze byt matouci pro uzivatele.

### 17.4 Express/Shipping/Coupons UI nepripojeno v index.jsx

**Zavaznost:** Stredni

State pro express (`selectedExpressTierId`), shipping (`selectedShippingMethodId`) a coupons
(`appliedCouponCode`) existuje v index.jsx, ale komponenty ExpressTierSelector, ShippingSelector
a CouponInput **nejsou renderovany** v JSX index.jsx. State je pouze predavan do PricingCalculator
pro cenovy vypocet. Uzivatel nema jak vybrat express tier, shipping metodu ani zadat kupon.

**Doporuceni:** Pridat ExpressTierSelector, ShippingSelector a CouponInput do JSX
v pravam sloupci (krok 3), nebo do CheckoutForm (krok 4).

### 17.5 Komentare v index.jsx odkazuji na `test-kalkulacka`

**Zavaznost:** Nizka

Komentar na radku 1 index.jsx rika `// src/pages/test-kalkulacka/index.jsx` — coz neodpovida
skutecne ceste `src/pages/test-kalkulacka-white/index.jsx`. Take console.log/warn/error
zpravy pouzivaji prefix `[test-kalkulacka]` misto `[test-kalkulacka-white]`.

**Doporuceni:** Aktualizovat komentare a log prefixy na spravnou cestu.

### 17.6 Hardcoded tenant_id v CheckoutForm

**Zavaznost:** Stredni

Radek `tenant_id: 'demo-tenant'` v CheckoutForm (radek 105) je hardcoded misto pouziti
`getTenantId()` z `adminTenantStorage.js`. To porušuje invariant #3 z CLAUDE.md.

**Doporuceni:** Nahradit za `getTenantId()` import.

### 17.7 GenerateButton tmave pozadi v svetlem theme

**Zavaznost:** Nizka (design rozhodnuti)

GenerateButton ma tmave pozadi (#1C1A1C) i ve white theme variante. To muze byt zamerne
(contrast button), ale vizualne vyrazne kontrastuje s okolnim svetlym UI.

### 17.8 Surface area budget limit

**Zavaznost:** Nizka

Surface area vypocet ma time budget 140ms. Pro slozite modely (>1M trojuhelniku) muze
vypocet byt prerusen s vysledkem `surfaceMm2: null`. To znamena ze per_cm2 fees nebudou
aplikovany na tyto modely.

### 17.9 Duplicitni FileUploadZone accept vs hidden input accept

**Zavaznost:** Nizka

FileUploadZone pouziva react-dropzone s accept konfiguraci pro `.stl` a `.obj`.
Skryty `<input>` v index.jsx ma `accept=".stl,.obj,.3mf"` — zahrnuje i `.3mf` ktery
FileUploadZone neprijima. Nekonzistence v podporovanych formatech.

### 17.10 UpsellPanel a PromoBar nejsou pouzity

**Zavaznost:** Informacni

Komponenty UpsellPanel a PromoBar jsou definovany ale nikde renderovany v index.jsx.
Jsou pripraveny pro budouci pouziti.
