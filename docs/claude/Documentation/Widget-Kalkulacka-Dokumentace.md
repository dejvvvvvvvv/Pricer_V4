# Widget-Kalkulacka -- Dokumentace

> Embeddable widget kalkulacka pro externi e-shopy s iframe/postMessage komunikaci.
> Widget je samostatna duplikovana implementace test-kalkulacky prizpusobena pro embedding.
> **Widget NEMA checkout flow (S02 neni portovany).**

---

## 1. Prehled

### URL a routing
| Route | Komponenta | Popis |
|-------|-----------|-------|
| `/w/:publicWidgetId` | `WidgetPublicPage` | Verejna embed route pro zakaznicke weby |
| `/widget/embed/:publicId` | `WidgetEmbed` | Alternativni Puck-based embed route |
| `/widget/preview/:publicId` | `WidgetPreview` | Nahled widgetu pro admina |
| `/admin/widget` | `AdminWidget` | Sprava widgetu v admin panelu |
| `/admin/widget/builder/:id` | `AdminWidgetBuilder` | Fullscreen WYSIWYG builder |

### Embed flow (zivotni cyklus)

```
1. Zakaznik vlozi <iframe src="https://app.modelpricer.com/w/abc123"> na svuj web
2. WidgetPublicPage se nacte, overi publicWidgetId
3. Kontrola: Je widget aktivni? (status !== 'disabled')
4. Kontrola: Je domena v whitelistu? (isDomainAllowedByWhitelist)
5. Nacte theme konfiguraci (widget.themeConfig + branding overrides)
6. Renderuje WidgetKalkulacka s embedded=true
7. Widget odesle MODELPRICER_WIDGET_READY pres postMessage
8. ResizeObserver sleduje vysku a posila MODELPRICER_RESIZE
9. Uzivatel nahraje model -> slicuje -> obdrzi cenu
10. Pri vypoctu ceny se odesle MODELPRICER_PRICE_CALCULATED
```

### Klicove vlastnosti
- Plne customizovatelny theme (56 vlastnosti) pres CSS custom properties
- Builder mode s click-to-select interakci pro WYSIWYG editaci
- Batch slicing vice modelu najednou
- Per-model preset management
- Domain whitelist bezpecnost
- PostMessage protokol pro komunikaci s rodicovskou strankou
- 3D nahled STL souboru s vypoctem povrchu

---

## 2. Technologie a jazyk

| Technologie | Pouziti |
|-------------|---------|
| React 19 | Zakladni framework, JSX komponenty |
| react-dropzone | Drag-and-drop upload souboru |
| @react-three/fiber | 3D nahled modelu (Three.js React wrapper) |
| @react-three/drei | Pomocne 3D komponenty (OrbitControls, Center) |
| three | STLLoader, geometrie, materialy |
| @measured/puck | Widget builder (alternativni embed varianta) |
| CSS Modules | GenerateButton styling (izolace) |
| CSS Custom Properties | Theme system (--widget-* promenne) |
| postMessage API | Cross-origin iframe komunikace |
| ResizeObserver | Automaticka vyska iframe |
| requestIdleCallback | Planovani tezkeho vypoctu povrchu |
| lucide-react | Ikony (Check v stepperu) |
| Intl.NumberFormat | Formatovani cen (cs-CZ, CZK) |

**Dulezite**: Widget pouziva theme CSS vars (`--widget-*`), NE Tailwind utility tridy pro theming.
Tailwind je pouzit pouze pro layout (grid, flex, spacing) — barvy jsou vzdy z CSS promennych.

---

## 3. Architektura souboru

```
src/pages/widget-kalkulacka/
  index.jsx                          -- Hlavni orchestrator (907 radku)
  utils/
    geomEstimate.js                  -- Odhad hmotnosti z objemu
  components/
    FileUploadZone.jsx               -- Drag-and-drop zona pro nahrani modelu
    ModelViewer.jsx                   -- 3D STL nahled + metriky + fullscreen
    PrintConfiguration.jsx           -- Konfigurace tisku (material, barva, kvalita, vypln, presety, fees)
    PricingCalculator.jsx            -- Cenovy souhrn + rozpis objednavky
    GenerateButton.jsx               -- CTA tlacitko "Spocitat cenu" (Uiverse styl)
    GenerateButton.module.css        -- CSS Modules pro GenerateButton
    WidgetHeader.jsx                 -- Hlavicka s logem, titulkem, tagline
    WidgetStepper.jsx                -- 3-krokovy progress indikator
    WidgetFooter.jsx                 -- "Powered by ModelPricer" paticka
    WidgetSkeleton.jsx               -- Loading skeleton s shimmer animaci
    ErrorBoundary.jsx                -- Error boundary pro 3D nahled
    PostProcessingSelector.jsx       -- Post-processing fees selektor (nepouzity v hlavnim flow)
    ExpressTierSelector.jsx          -- Express delivery tiers (nepouzity v hlavnim flow)
    UpsellPanel.jsx                  -- Upsell panel pro upgrade delivery (nepouzity v hlavnim flow)
    ShippingSelector.jsx             -- Selektor prepravnich metod (nepouzity v hlavnim flow)
    CouponInput.jsx                  -- Vstup pro slevovy kupon (nepouzity v hlavnim flow)
    PromoBar.jsx                     -- Promo banner (nepouzity v hlavnim flow)

src/pages/widget-public/
  WidgetPublicPage.jsx               -- Verejna route /w/:publicWidgetId (embed entrypoint)

src/pages/widget/
  WidgetEmbed.jsx                    -- Puck-based alternativni embed route
  WidgetPreview.jsx                  -- Admin preview widgetu

src/utils/
  widgetThemeStorage.js              -- Theme storage, CSS vars generovani, THEME_PROPERTIES
  adminBrandingWidgetStorage.js      -- Widget CRUD, domain whitelist, branding

src/pages/admin/
  AdminWidget.jsx                    -- Admin sprava widgetu
  AdminWidgetBuilder.jsx             -- WYSIWYG builder
```

### Poznamka k nepouzitym komponentam

Komponenty `PostProcessingSelector`, `ExpressTierSelector`, `UpsellPanel`,
`ShippingSelector`, `CouponInput` a `PromoBar` jsou pripraveny pro budouci pouziti
v ramci e-commerce integrace. Aktualne nejsou importovany v `index.jsx` a pouzivaji
starsi CSS var konvenci (`--mp-*` misto `--widget-*`).

---

## 4. Import graf

```
index.jsx (WidgetKalkulacka)
  +-- react (useState, useEffect, useRef, useCallback, useMemo)
  +-- ../../components/AppIcon (Icon)
  +-- ../../components/ui/Button
  +-- ./components/FileUploadZone
  |     +-- react-dropzone
  |     +-- ../../../components/AppIcon
  |     +-- ../../../components/ui/Button
  +-- ./components/ModelViewer
  |     +-- @react-three/fiber (Canvas, useLoader)
  |     +-- @react-three/drei (OrbitControls, Center)
  |     +-- three (STLLoader, THREE)
  |     +-- ../../../components/AppIcon
  |     +-- ../../../components/ui/Button
  |     +-- ./ErrorBoundary
  +-- ./components/PrintConfiguration
  |     +-- ../../../components/AppIcon
  |     +-- ../../../components/ui/Input
  |     +-- ../../../components/ui/Select
  |     +-- ../../../components/ui/Checkbox
  |     +-- ../../../contexts/LanguageContext
  +-- ./components/PricingCalculator
  |     +-- ../../../components/ui/Button
  |     +-- ../../../components/ui/Card
  |     +-- ../../../components/ui/Icon
  |     +-- ../../../lib/pricing/pricingEngineV3 (calculateOrderQuote)
  +-- ./components/GenerateButton
  |     +-- ./GenerateButton.module.css
  +-- ./components/ErrorBoundary
  +-- ./components/WidgetHeader
  +-- ./components/WidgetStepper
  |     +-- lucide-react (Check)
  +-- ./components/WidgetFooter
  +-- ../../services/slicerApi (sliceModelLocal)
  +-- ../../services/presetsApi (fetchWidgetPresets)
  +-- ../../utils/adminPricingStorage (loadPricingConfigV3)
  +-- ../../utils/adminFeesStorage (loadFeesConfigV3)
  +-- ../../utils/widgetThemeStorage (themeToCssVars, getDefaultWidgetTheme)

WidgetPublicPage.jsx
  +-- ../widget-kalkulacka (WidgetKalkulacka)
  +-- ../widget-kalkulacka/components/WidgetSkeleton
  +-- ../../utils/adminBrandingWidgetStorage
  |     (getWidgetByPublicId, getBranding, isDomainAllowedByWhitelist, getDefaultWidgetTheme)
```

---

## 5. Design a vizual (theme CSS vars, NE Forge tokeny)

### Theme system

Widget pouziva vlastni theme system nezavisly na Forge design tokenech.
Theme konfigurace se uklada do localStorage pod klicem
`modelpricer:widget_theme:{tenantId}` a obsahuje 56 vlastnosti.

### CSS Custom Properties (--widget-*)

Hlavni promenne pouzivane ve vsech komponentach:

| CSS Promenna | Default | Popis |
|-------------|---------|-------|
| `--widget-bg` | `#FFFFFF` | Pozadi widgetu |
| `--widget-card` | `#F9FAFB` | Pozadi karet/sekci |
| `--widget-header` | `#1F2937` | Barva nadpisu |
| `--widget-text` | `#374151` | Barva bezneho textu |
| `--widget-muted` | `#6B7280` | Barva tlumeneho textu |
| `--widget-btn-primary` | `#2563EB` | Primarni barva tlacitek |
| `--widget-btn-text` | `#FFFFFF` | Barva textu tlacitek |
| `--widget-btn-hover` | `#1D4ED8` | Hover barva tlacitek |
| `--widget-input-bg` | `#FFFFFF` | Pozadi inputu |
| `--widget-input-border` | `#D1D5DB` | Ramecek inputu |
| `--widget-input-focus` | `#2563EB` | Focus barva inputu |
| `--widget-summary-bg` | `#F3F4F6` | Pozadi souhrnu |
| `--widget-border` | `#E5E7EB` | Ramecky obecne |
| `--widget-font` | `Inter, system-ui, sans-serif` | Hlavni font |
| `--widget-radius` | `12px` | Zaobleni rohu |

Rozsirene promenne (V3 Builder):

| CSS Promenna | Default | Popis |
|-------------|---------|-------|
| `--widget-header-bg` | `#FFFFFF` | Pozadi hlavicky |
| `--widget-header-logo-size` | `48px` | Velikost loga |
| `--widget-header-align` | `left` | Zarovnani hlavicky |
| `--widget-stepper-active` | `#3B82F6` | Aktivni krok stepperu |
| `--widget-stepper-completed` | `#10B981` | Dokonceny krok stepperu |
| `--widget-stepper-inactive` | `#E5E7EB` | Neaktivni krok stepperu |
| `--widget-heading-font` | `"DM Sans", system-ui` | Font nadpisu |
| `--widget-code-font` | `"JetBrains Mono", monospace` | Mono font |
| `--widget-footer-bg` | `transparent` | Pozadi paticky |
| `--widget-footer-text` | `#94A3B8` | Text paticky |
| `--widget-footer-link` | `#3B82F6` | Odkaz paticky |
| `--widget-skeleton-base` | `#E5E7EB` | Skeleton zaklad |
| `--widget-skeleton-shine` | `#F3F4F6` | Skeleton shimmer |

### Aplikace theme na container

Theme CSS promenne se aplikuji primo na container element pres `useEffect`:

```javascript
useEffect(() => {
  const container = containerRef.current;
  if (!container) return;
  Object.entries(cssVars).forEach(([key, value]) => {
    container.style.setProperty(key, value);
  });
}, [cssVars]);
```

### Theme priorita (WidgetPublicPage)

```
1. getDefaultWidgetTheme()           -- zakladni defaults (56 vlastnosti)
2. widget.themeConfig                -- custom konfigurace widgetu
3. branding.primaryColor             -- branding override (barva tlacitek)
4. branding.fontFamily               -- branding override (font)
5. branding.cornerRadius             -- branding override (zaobleni)
6. widget.primaryColorOverride       -- finalni override barvy tlacitek
```

### Nepouzite starsi komponenty -- --mp-* konvence

Komponenty `PostProcessingSelector`, `ExpressTierSelector`, `UpsellPanel`,
`ShippingSelector`, `CouponInput` a `PromoBar` pouzivaji starsi CSS var konvenci
s prefixem `--mp-*` (napr. `--mp-primary`, `--mp-border`, `--mp-bg`).
Tyto promenne NEJSOU kompatibilni s hlavnim `--widget-*` systemem.

---

## 6. Datovy model

### Model souboru (uploadedFiles array)

```javascript
{
  id: number,                   // Date.now() + Math.random()
  name: string,                 // nazev souboru (napr. "model.stl")
  size: number,                 // velikost v bytes
  type: string,                 // MIME typ
  file: File,                   // nativni File objekt
  uploadedAt: Date,             // datum nahrani
  status: 'pending' | 'processing' | 'completed' | 'failed',
  result: {                     // vysledek slicingu (null pokud neni hotovo)
    totalPrice: number,
    price: number,
    time: number,               // cas tisku v sekundach
    material: number,           // hmotnost materialu v gramech
    layers: number,             // pocet vrstev
    metrics: {
      estimatedTimeSeconds: number,
      filamentGrams: number,
    },
    modelInfo: {
      sizeMm: { x, y, z },     // rozmery v mm
      volumeMm3: number,       // objem v mm3
      surfaceMm2: number,      // povrch v mm2 (patchovany z clientModelInfo)
      surfaceCm2: number,      // povrch v cm2
    },
  },
  error: string | null,         // chybova zprava
  clientModelInfo: {            // frontendove metriky (surface area)
    surfaceMm2: number,
    surfaceCm2: number,
  },
  clientModelInfoMeta: {        // metadata o vypoctu
    surface: {
      reason: string,
      vertexCount: number,
      triangleCount: number,
      ms: number,
    },
  },
}
```

### Konfigurace tisku (printConfigs)

```javascript
// Klic = model ID, hodnota = konfigurace
{
  [modelId]: {
    material: string,           // 'pla', 'abs', 'petg', 'tpu', ...
    color: string | null,       // ID barvy
    quality: string,            // 'nozzle_08'|'nozzle_06'|'nozzle_04'|'draft'|'standard'|'fine'|'ultra'
    infill: number,             // 10-100 (procenta)
    quantity: number,           // 1-100
    supports: boolean,          // automaticke podpory
  }
}
```

### Fee selections

```javascript
{
  selectedFeeIds: Set<string>,       // ID aktivnich poplatku
  feeTargetsById: {                  // cileni poplatku na konkretni modely
    [feeId]: {
      mode: 'SELECTED',
      modelIds: string[],
      uiMode: string,
    }
  }
}
```

### Widget konfigurace (z adminBrandingWidgetStorage)

```javascript
{
  id: string,
  publicId: string,             // verejne ID pro URL
  name: string,
  status: 'active' | 'disabled',
  domains: [                    // domain whitelist
    {
      domain: string,           // napr. "example.com"
      isActive: boolean,
      allowSubdomains: boolean,
    }
  ],
  themeConfig: object,          // custom theme vlastnosti
  primaryColorOverride: string, // override barvy tlacitek
  widthMode: 'responsive' | 'fixed',
  widthPx: number,
}
```

### Quote vysledek (z pricingEngineV3)

```javascript
{
  total: number,                // celkova cena
  simple: {
    material: number,           // cena za material
    time: number,               // cena za cas tisku
    services: number,           // cena za sluzby
    discount: number,           // slevy
  },
  flags: {
    volume_discount_applied: boolean,
  },
  volumeDiscount: {
    mode: 'percent' | 'fixed',
    totalSavings: number,
    details: [{ modelId, applied, tier }],
  },
  models: [{                    // per-model rozpis
    id: string,
    name: string,
    quantity: number,
    base: {
      materialKey: string,
      billedMinutes: number,
    },
    totals: {
      subtotalAfterPerModelRounding: number,
    },
  }],
  orderFees: [{                 // objednavkove poplatky
    id: string,
    name: string,
    applied: boolean,
    amount: number,
    required: boolean,
  }],
}
```

---

## 8. UI komponenty -- detailni popis

### 8.1 WidgetKalkulacka (index.jsx) -- hlavni orchestrator

**Soubor:** `src/pages/widget-kalkulacka/index.jsx` (907 radku)

Hlavni komponenta cele widget kalkulacky. Ridi stav vsech modelu, konfiguraci,
slicing, theme a postMessage komunikaci.

**Props:**
| Prop | Typ | Default | Popis |
|------|-----|---------|-------|
| `theme` | object | null | Theme konfigurace (null = defaults) |
| `builderMode` | boolean | false | Zapne click-to-select pro builder |
| `forceStep` | number | null | Vynuti zobrazeni konkretniho kroku (builder) |
| `onElementSelect` | function | - | Callback pri kliku na element v builderu |
| `onElementHover` | function | - | Callback pri hoveru v builderu |
| `selectedElementId` | string | null | Aktualne vybrany element (builder) |
| `hoveredElementId` | string | null | Aktualne hoverovany element (builder) |
| `onTextEditStart` | function | - | Callback pri double-click pro editaci textu |
| `embedded` | boolean | false | Rezim embeddingu (skryva navigaci) |
| `showHeader` | boolean | null | Explicitni zobrazeni hlavicky |
| `publicWidgetId` | string | null | Verejne ID widgetu |
| `onQuoteCalculated` | function | - | Callback po vypoctu ceny |

**Builder mode specialita:**
Widget pouziva `useRef` (ne `useMemo`) pro `BUILDER_MOCK` data aby se zabranilo
nestabilnim referencim ktere zpusobuji white screen. Toto je znamy fix
dokumentovany v MEMORY.md.

**StyleableWrapper:**
Vnitrni komponenta ktera obaluje kazdy element v builder mode a pridava:
- Klikaci interakci (select)
- Hover zvyrazneni (dashed border)
- Selection handles (modre rohy)
- Tooltip "Klikni pro editaci"
- Double-click pro text editing

**Element IDs v builder mode:**
`header`, `steps`, `upload`, `config`, `cta`, `viewer`, `pricing`, `filelist`, `footer`

### 8.2 FileUploadZone

**Soubor:** `src/pages/widget-kalkulacka/components/FileUploadZone.jsx`

Drag-and-drop zona pro nahrani 3D modelu. Pouziva knihovnu `react-dropzone`.

**Podporovane formaty:** STL, OBJ
**Maximalni velikost:** 50 MB na soubor
**Vice souboru:** Ano (multiple=true)
**Simulovany upload progress:** 10% kazdych 200ms (vizualni efekt, ne skutecny upload)

Obsahuje tri sekce:
1. Drop zona s ikonou a textem
2. Upload progress bary (behem simulovaneho nahravani)
3. Seznam nahranych souboru (pokud prop `uploadedFiles` existuje)
4. Informacni box o podporovanych formatech

### 8.3 ModelViewer

**Soubor:** `src/pages/widget-kalkulacka/components/ModelViewer.jsx`

3D nahled STL modelu s Three.js. Zahrnuje:

- **STLCanvas**: WebGL canvas s OrbitControls a auto-rotaci
- **STLModel**: Nacte STL geometrii, vycentruje a volitelne spocita povrch
- **FullScreenViewer**: Modalni cela obrazovka s auto-rotaci a svetly
- **Metriky**: Rozmery (mm), objem (cm3), povrch (cm2), cas tisku, hmotnost

**Omezeni 3D nahledu:**
- Max 12 MB pro preview (`MAX_PREVIEW_MB`)
- Max 2M vertexu / 1M trojuhelniku pro vypocet povrchu
- Max 140ms casovy budget pro surface computation
- Pouze STL soubory (OBJ nema preview)
- Wheel event zachycen aby neovlivnil parent scroll

**Vypocet povrchu (computeSurfaceMm2FromGeometry):**
Prochazi vsechny trojuhelniky geometrie, pocita plochu pres cross product.
Pouziva `requestIdleCallback` pro non-blocking scheduling.
Vysledek je patchovan do `result.modelInfo.surfaceMm2` modelu.

### 8.4 PrintConfiguration

**Soubor:** `src/pages/widget-kalkulacka/components/PrintConfiguration.jsx`

Konfiguracni panel rozdeleny do 6 karet:

1. **Slicing preset selektor** -- vyber preset profilu (z `fetchWidgetPresets`)
2. **Rychle predvolby** -- Basic/Middle/Pro s prednastavenymi parametry
3. **Material a barva** -- selektor materialu + barevna paleta (z pricingConfig)
4. **Kvalita tisku** -- layer height (0.1-0.8mm), infill slider (10-100%), podpory
5. **Mnozstvi** -- pocet kusu (1-100)
6. **Dodatecne sluzby** -- checkboxy pro volitelne fees s targetingem
7. **Status/Vysledky** -- slicer vysledky (cas, hmotnost, vrstvy, teplota)

**Kvalitni presety:**
| Key | Name | Quality | Infill | Supports |
|-----|------|---------|--------|----------|
| `basic` | Basic | nozzle_06 (0.6mm) | 15% | false |
| `middle` | Middle | standard (0.2mm) | 20% | true |
| `pro` | Pro | fine (0.15mm) | 30% | true |

**Kvalitni vrstvy:**
| Value | Label | Popis |
|-------|-------|-------|
| `nozzle_08` | Extra hruby (0.8mm) | Extremne rychly tisk |
| `nozzle_06` | Hruby (0.6mm) | Rychly tisk pro velke modely |
| `nozzle_04` | Rychly (0.4mm) | Urychleny tisk |
| `draft` | Navrhovy (0.3mm) | Overeni konceptu |
| `standard` | Standardni (0.2mm) | Vyvazeny pomer |
| `fine` | Jemny (0.15mm) | Vysoka kvalita |
| `ultra` | Ultra jemny (0.1mm) | Nejvyssi kvalita |

### 8.5 PricingCalculator

**Soubor:** `src/pages/widget-kalkulacka/components/PricingCalculator.jsx`

Cenovy souhrn zobrazujici:
- Akce tlacitka (Prepocitat vse, Prepocitat vybrany)
- Informace o stavu slicingu (x/y hotovo)
- Celkovou cenu s rozpisem (material, cas, sluzby, sleva)
- Volume discount informace (pokud aplikovane)
- Per-model rozpis objednavky
- Objednavkove poplatky

Pouziva `calculateOrderQuote` z pricingEngineV3 pro vypocet.
Ceny formatovany pres `Intl.NumberFormat('cs-CZ', { currency: 'CZK' })`.

### 8.6 GenerateButton

**Soubor:** `src/pages/widget-kalkulacka/components/GenerateButton.jsx`

CTA tlacitko inspirovane Uiverse.io designem (od AlimurtuzaCodes).
Pouziva CSS Modules (`GenerateButton.module.css`) pro izolaci stylu.

**Velikosti:**
| Size | Sirka | Vyska | Font |
|------|-------|-------|------|
| `default` | 13em | 4.25em | medium |
| `top` | 10.4em | 3.4em | 0.95rem |
| `compact` | 8.5em | 2.8em | 0.9rem |

Hover efekt: gradient (#A47CF3 -> #683FEA) + glow (#9917FF).
Themed varianta pouziva `--widget-btn-bg` a `--widget-btn-hover` CSS vars.

### 8.7 WidgetHeader

**Soubor:** `src/pages/widget-kalkulacka/components/WidgetHeader.jsx`

Hlavicka widgetu s:
- Volitelnym logem (base64 URI nebo URL, klikatelne)
- Titulek (default: "Kalkulacka 3D tisku")
- Tagline (volitelne skrytelny)
- Zarovnani: left nebo center
- Builder mode podpora (click-to-select)

### 8.8 WidgetStepper

**Soubor:** `src/pages/widget-kalkulacka/components/WidgetStepper.jsx`

3-krokovy progress indikator:

| Krok | ID | Label |
|------|----|-------|
| 1 | 1 | Nahrani modelu |
| 2 | 2 | Nastaveni |
| 3 | 3 | Souhrn a cena |

Stavy kroku:
- **completed** -- zeleny kruh s checkmarkem (#10B981)
- **active** -- modry kruh s cislem (#3B82F6)
- **inactive** -- prazdny kruh se sedym rameckem (#E5E7EB)

Volitelny progress bar pod kroky (stepperProgressVisible).

### 8.9 WidgetFooter

**Soubor:** `src/pages/widget-kalkulacka/components/WidgetFooter.jsx`

Paticka "Powered by ModelPricer" s odkazem na modelpricer.com.
V builder mode je odkaz nahrazen neinteraktivnim spanem.
Lze skryt pres `showPoweredBy=false`.

### 8.10 WidgetSkeleton

**Soubor:** `src/pages/widget-kalkulacka/components/WidgetSkeleton.jsx`

Loading skeleton s shimmer animaci ktery napodobuje layout widgetu:
- Placeholder pro logo + titulek + tagline
- Tri kruhy stepperu s propojovaci carou
- Grid: upload zona (vlevo) + konfigruacni bloky (vpravo)

Pouziva injektovane `@keyframes widgetSkeletonShimmer` animace.
Barvy pres `--widget-skeleton-base` a `--widget-skeleton-shine`.

### 8.11 ErrorBoundary

**Soubor:** `src/pages/widget-kalkulacka/components/ErrorBoundary.jsx`

React class component Error Boundary. Chrani predevsim 3D nahled pred pady.
Zobrazi chybovou zpravu s tlacitkem "Zkusit znovu" ktere resetuje stav.

---

## 9. State management a data flow

### 9.1 State v hlavnim orchestratoru (index.jsx)

| State | Typ | Popis |
|-------|-----|-------|
| `currentStep` | number | Aktualni krok (1-3) |
| `uploadedFiles` | array | Pole vsech nahranych modelu |
| `selectedFileId` | number/null | ID vybraneho modelu |
| `printConfigs` | object | Konfigurace tisku per model |
| `isProcessing` | boolean | Zpracovani probiha (nepouzivano aktivne) |
| `sliceAllProcessing` | boolean | Batch slicing probiha |
| `pricingConfig` | object | Pricing konfigurace z localStorage |
| `feesConfig` | object | Fees konfigurace z localStorage |
| `feeSelections` | object | Vybrane fees a jejich cileni |
| `batchProgress` | object | Postup batch slicingu {mode, done, total} |
| `availablePresets` | array | Dostupne slicing presety |
| `defaultPresetId` | string/null | ID defaultniho presetu |
| `selectedPresetIds` | object | Vybrane presety per model + __default |
| `presetsLoading` | boolean | Nacitani presetu probiha |
| `presetsError` | Error/null | Chyba pri nacitani presetu |

### 9.2 Data flow diagram

```
                   localStorage
                   (pricing:v3, fees:v3)
                        |
                        v
  WidgetKalkulacka (orchestrator)
        |
        +-- effectiveTheme (from theme prop or getDefaultWidgetTheme)
        |     |
        |     +-- themeToCssVars() --> CSS vars na container
        |
        +-- uploadedFiles state
        |     |
        |     +-- FileUploadZone --> handleFilesUploaded
        |     |     (react-dropzone -> simulovany progress -> pridani do pole)
        |     |
        |     +-- ModelViewer (selectedFile)
        |     |     +-- STLCanvas -> STLModel -> handleSurfaceComputed
        |     |     +-- updateModelStatus (patch surface data)
        |     |
        |     +-- PrintConfiguration (selectedFile, currentConfig)
        |     |     +-- handleConfigChange -> setPrintConfigs + reset result
        |     |
        |     +-- file list (vyber, smazani)
        |
        +-- handleSliceSelected / handleSliceAll / handleResliceFailed
        |     |
        |     +-- sliceModelLocal (services/slicerApi)
        |     |     +-- trySliceWithFallback (preset fallback logika)
        |     |
        |     +-- updateModelStatus (completed/failed)
        |     +-- postMessage (MODELPRICER_PRICE_CALCULATED / MODELPRICER_ERROR)
        |     +-- onQuoteCalculated callback
        |
        +-- PricingCalculator
              +-- calculateOrderQuote (pricingEngineV3)
              +-- zobrazeni celkove ceny a rozpisu
```

### 9.3 Auto-advance logika

1. Po nahrani prvniho souboru: `currentStep 1 -> 2` (s 1s zpozdenim)
2. Po uspesnem slicingu: `currentStep -> 3` (pokud < 3)
3. Pri smazani vsech souboru: reset na krok 1

### 9.4 Preset fallback logika

```javascript
const trySliceWithFallback = async (presetId) => {
  try {
    return await sliceModelLocal(file, { presetId });
  } catch (e) {
    if (presetId) {
      // Preset selhal -> zkus bez presetu
      setSelectedPresetIds(prev => ({ ...prev, [fileId]: null }));
      return await sliceModelLocal(file, { presetId: null });
    }
    throw e;
  }
};
```

### 9.5 Storage sync

Widget posloucha `storage` event pro synchronizaci pricing a fees konfigurace
z jinych tabu/oken:

```javascript
useEffect(() => {
  const onStorage = (e) => {
    if (!e?.key) return;
    if (e.key.includes('pricing:v3')) setPricingConfig(loadPricingConfigV3());
    if (e.key.includes('fees:v3')) setFeesConfig(loadFeesConfigV3());
  };
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}, []);
```

### 9.6 PostMessage protokol

Widget komunikuje s rodicovskou strankou pres `window.parent.postMessage`.
Vsechny zpravy maji `publicWidgetId` pro identifikaci widgetu.

**Target origin**: Z `document.referrer` (pokud existuje), jinak `'*'`.

| Zprava | Smer | Kdy | Data |
|--------|------|-----|------|
| `MODELPRICER_WIDGET_READY` | Widget -> Parent | Po mount | `{ type, publicWidgetId }` |
| `MODELPRICER_RESIZE` | Widget -> Parent | Pri zmene vysky | `{ type, publicWidgetId, height }` |
| `MODELPRICER_PRICE_CALCULATED` | Widget -> Parent | Po slicingu | `{ type, publicWidgetId, data: { total, currency } }` |
| `MODELPRICER_ERROR` | Widget -> Parent | Pri chybe slicingu | `{ type, publicWidgetId, data: { message, code } }` |
| `MODELPRICER_QUOTE_CREATED` | Widget -> Parent | Pri vytvoreni quote (WidgetPublicPage) | `{ type, publicWidgetId, quote }` |
| `MODELPRICER_WIDGET_HEIGHT` | Widget -> Parent | Resize (WidgetEmbed) | `{ type, publicId, height }` |

### 9.7 Theme loading flow

```
WidgetPublicPage mount
  |
  +-- useParams() -> publicWidgetId
  +-- referrerOrigin (z document.referrer nebo window.location.hostname)
  |
  +-- useEffect: Load widget config
  |     +-- getWidgetByPublicId(publicWidgetId) -> { widget, tenantId }
  |     +-- Check: widget.status !== 'disabled'
  |     +-- Check: isDomainAllowedByWhitelist(referrerOrigin, widget.domains)
  |     +-- getBranding(tenantId) -> branding
  |
  +-- useMemo: Build effectiveTheme
  |     +-- getDefaultWidgetTheme() [zaklad]
  |     +-- merge widget.themeConfig
  |     +-- apply branding overrides (primaryColor, fontFamily, cornerRadius)
  |     +-- apply widget.primaryColorOverride
  |
  +-- Render: <WidgetKalkulacka theme={effectiveTheme} embedded={true} />
```

---

## 10. Error handling

### 10.1 Vrstvy error handlingu

| Vrstva | Mechanismus | Popis |
|--------|------------|-------|
| React rendering | `ErrorBoundary` | Chyta pady 3D nahledu (ModelViewer) |
| Slicing | try/catch v handleSliceSelected | Zachyti chybu a nastavi status='failed' |
| Batch slicing | try/catch per model | Pokracuje dal i kdyz jeden model selze |
| Preset loading | try/catch + presetsError state | Zobrazeni chyby + retry tlacitko |
| Widget loading | error state v WidgetPublicPage | Zobrazeni error karty |
| Domain validation | isDomainAllowedByWhitelist | Chybova stranka s popisem |
| Pricing calculation | try/catch v PricingCalculator | quoteState.error zobrazeni |
| Surface computation | guardrails (max vertices, time budget) | Graceful degradation (null vysledek) |

### 10.2 Error states v modelu

| Status | Zobrazeni | Ikona |
|--------|-----------|-------|
| `pending` | "Ceka na zpracovani" | Clock |
| `processing` | "Vypocet..." + spinner | Loader (animate-spin) |
| `completed` | "Hotovo" | CheckCircle (zelena) |
| `failed` | "Vypocet se nezdaril" + chybova zprava | XCircle (cervena) |

### 10.3 WidgetPublicPage error stavy

| Chyba | Zprava |
|-------|--------|
| Chybejici publicWidgetId | "Chybi ID widgetu" |
| Widget nenalezen | "Widget nenalezen" |
| Widget deaktivovan | "Widget je deaktivovan" |
| Domena neni povolena | "Domena X neni povolena pro tento widget" |
| Obecna chyba | "Chyba pri nacitani widgetu" |

---

## 11. Preklady (i18n)

Widget pouziva `useLanguage()` z `LanguageContext` pro zakladni CS/EN podporu
v ramci `PrintConfiguration` komponenty.

**Prekladane retezce (PrintConfiguration):**
- Preset label: "Preset pro slicovani" / "Slicing preset"
- No presets: "Zadne presety nejsou k dispozici..." / "No presets available..."
- Preset failed: "Presety se nepodarilo nacist..." / "Failed to load presets..."
- Preset placeholder: "Vyber preset..." / "Select preset..."
- Fee values: "Kc/g" / "CZK/g", "Kc/min" / "CZK/min" atd.
- Retry: "Zkusit znovu" / "Retry"
- No services: "Zadne volitelne sluzby..." / "No selectable services configured."
- Fallback barvy: "Bila"/"White", "Cerna"/"Black" atd.

**Prekladane retezce (formatFeeValue):**
| Typ fee | CS | EN |
|---------|----|----|
| percent | +X% | +X% |
| per_gram | +X Kc/g | +X CZK/g |
| per_minute | +X Kc/min | +X CZK/min |
| per_cm3 | +X Kc/cm3 | +X CZK/cm3 |
| per_cm2 | +X Kc/cm2 | +X CZK/cm2 |
| per_piece | +X Kc/kus | +X CZK/piece |
| flat | +X Kc | +X CZK |

**Neprekladane retezce (hardcoded CS):**
Vetsina UI textu v ostatnich komponentach je hardcoded v cestine:
- "Nahrani modelu", "Nastaveni", "Souhrn a cena" (stepper)
- "Spocitat cenu", "Spocitat vse", "Reslice failed" (CTA)
- "Nahrane modely" (file list)
- "Cena a souhrn", "Celkem", "Rozpis objednavky" (PricingCalculator)
- "Nahled modelu", "Rozmery", "Objem", "Povrch" (ModelViewer)
- "Material a barva", "Kvalita tisku", "Mnozstvi" (PrintConfiguration)
- Vsechny texty v WidgetHeader/Footer/Skeleton

---

## 12. Pristupnost

### Implementovane funkce

| Funkce | Komponenta | Detail |
|--------|-----------|--------|
| `aria-busy` | GenerateButton | Signalizuje loading stav |
| `aria-hidden` | GenerateButton SVG | Dekorativni ikona skryta pro screen readery |
| `aria-label` | ModelViewer tlacitka | "Cela obrazovka", "Odstranit model", "Zavrit cele okno" |
| `title` atribut | File list tlacitka | Status tooltip pro kazdy model |
| keyboard navigation | FileUploadZone | Dropzone reaguje na keyboard (react-dropzone) |
| `accept` atribut | Hidden file input | `.stl,.obj,.3mf` filtrovani |
| semantic HTML | WidgetHeader | `<h1>` pro titulek |
| `target="_blank" rel="noopener noreferrer"` | WidgetFooter, WidgetHeader | Bezpecne externi odkazy |

### Nedostatky

- Range slider (infill) nema explicitni `aria-label` nebo `aria-valuetext`
- Color selektor nema `aria-pressed` nebo `role="radiogroup"`
- Stepper nema `role="progressbar"` ani `aria-current="step"`
- Batch progress nema `role="progressbar"` ani `aria-valuenow`
- FullScreenViewer nema focus trap (modalni overlay)
- Chybi skip-link nebo landmark role pro screen reader navigaci
- Nepouzite komponenty (PostProcessing, Express, Shipping, Coupon) nemaji zadne
  ARIA atributy

---

## 13. Performance

### Optimalizace

| Technika | Kde | Popis |
|----------|-----|-------|
| `useMemo` | CSS vars | `themeToCssVars` se prepocita jen pri zmene theme |
| `useMemo` | PricingCalculator | `calculateOrderQuote` jen pri zmene vstupnich dat |
| `useMemo` | ModelViewer geometrie | Centering se provadi jednou |
| `useCallback` | handleSliceSelected, handleConfigChange | Stabilni reference pro deti |
| `useRef` | BUILDER_MOCK | Stabilni reference misto useMemo (fix white screen) |
| `requestIdleCallback` | Surface computation | Non-blocking vypocet povrchu |
| Time budget | Surface computation | Max 140ms, preruseni pri prekroceni |
| Vertex limit | Surface computation | Max 2M vertexu, 1M trojuhelniku |
| File size limit | 3D preview | Max 12 MB pro nahled |
| `dpr={[1, 1.5]}` | STL Canvas | Omezeny device pixel ratio |
| `ResizeObserver` | iframe resize | Efektivni sledovani zmeny vysky |
| lazy import | WidgetPublicPage | V Routes.jsx neni lazy (mohl by byt) |
| Wheel interception | STL Canvas | Zabraneni nechtenu scrollovani parent |
| `URL.createObjectURL` / `revokeObjectURL` | ModelViewer | Spravna sprava pameti pro blob URL |

### Zname performance problemy

1. **Batch slicing je sekvencni** -- modely se slicuji jeden po druhem, ne paralelne
2. **Pricing prepocet pri kazde zmene** -- PricingCalculator prepocitava quote
   pri kazde zmene uploadedFiles/printConfigs/feeSelections (mohlo by throttlovat)
3. **Cela PrintConfiguration se re-renderuje** -- neni memorizovana

---

## 14. Bezpecnost (origin whitelist, postMessage validace)

### 14.1 Domain whitelist

WidgetPublicPage provadi kontrolu domeny pri nacitani widgetu:

```javascript
// Ziskani referrer origin
const referrerOrigin = useMemo(() => {
  try {
    if (window.parent !== window) {
      const ref = document.referrer;
      if (ref) {
        return new URL(ref).hostname;
      }
    }
    return window.location.hostname;
  } catch {
    return window.location.hostname;
  }
}, []);

// Kontrola whitelistu
const domains = Array.isArray(w.domains) ? w.domains : [];
const hasWhitelist = domains.some((d) => d.isActive);
if (hasWhitelist) {
  const isAllowed = isDomainAllowedByWhitelist(referrerOrigin, domains);
  const isLocalDev = ['localhost', '127.0.0.1', ''].includes(referrerOrigin);
  if (!isAllowed && !isLocalDev) {
    setError(`Domena "${referrerOrigin}" neni povolena...`);
  }
}
```

**isDomainAllowedByWhitelist implementace:**

```javascript
export function isDomainAllowedByWhitelist(hostname, domains) {
  const host = (hostname || '').toLowerCase();
  const list = Array.isArray(domains) ? domains.filter((d) => d.isActive) : [];
  for (const d of list) {
    if (host === d.domain) return true;
    if (d.allowSubdomains && host.endsWith(`.${d.domain}`)) return true;
  }
  return false;
}
```

### 14.2 PostMessage target origin

Widget urcuje target origin z `document.referrer`:

```javascript
function getTargetOrigin() {
  try {
    if (document.referrer) {
      return new URL(document.referrer).origin;
    }
  } catch {
    // Invalid referrer URL
  }
  return '*'; // Fallback pro primy pristup
}
```

### 14.3 Bezpecnostni prehled

| Aspekt | Stav | Poznamka |
|--------|------|----------|
| Domain whitelist | Implementovano | Kontrola pres isDomainAllowedByWhitelist |
| Subdomain podpora | Implementovano | `allowSubdomains` flag |
| localhost vyjimka | Implementovano | Dev-only bypass pro localhost/127.0.0.1 |
| postMessage target origin | Castecne | Pouziva document.referrer, fallback na '*' |
| Widget status check | Implementovano | Deaktivovane widgety se nenacitaji |
| File upload validace | Castecne | MIME typ + pripona + max size 50MB |
| XSS v theme | Neni relevantni | Theme hodnoty jsou barvy/cisla, ne HTML |

### 14.4 Zname bezpecnostni slabiny

1. **Fallback na `'*'` v getTargetOrigin** -- pokud document.referrer neni k dispozici
   (napr. pri Referrer-Policy: no-referrer), postMessage se posila s `'*'` target
   origin, coz znamena ze jakakoliv stranka muze prijmat zpravy.

2. **Widget NEPRIJIMA postMessage** -- aktualne widget pouze POSILA zpravy, ale
   neposlecha na prichozi zpravy od parenta. Pokud se v budoucnu prida prijem
   zprav, bude nutne validovat `event.origin`.

3. **getWidgetByPublicId skenuje vsechny tenanty** -- v demo modu prochazi
   vsechny klice v localStorage, coz je neefektivni a neskalovatene.
   V produkci bude reseno serverovym lookupem.

4. **Localhost bypass** -- localhost, 127.0.0.1 a prazdny string jsou vzdy
   povoleny, coz muze byt riziko pokud se pouzije i v produkci.

---

## 16. Souvisejici dokumenty

| Dokument | Cesta |
|----------|-------|
| CLAUDE.md (sekce 11 - widget pravidla) | `Model_Pricer-V2-main/CLAUDE.md` |
| MEMORY.md | `.claude/projects/.../memory/MEMORY.md` |
| AGENT_MAP (mp-mid-frontend-widget) | `docs/claude/AGENT_MAP.md` |
| Pricing engine | `src/lib/pricing/pricingEngineV3.js` |
| Widget theme storage | `src/utils/widgetThemeStorage.js` |
| Branding/widget storage | `src/utils/adminBrandingWidgetStorage.js` |
| Pricing storage | `src/utils/adminPricingStorage.js` |
| Fees storage | `src/utils/adminFeesStorage.js` |
| Slicer API | `src/services/slicerApi.js` |
| Presets API | `src/services/presetsApi.js` |
| Routes | `src/Routes.jsx` |
| Phase 1 kompletni popis | `docs/claude/Planovane_Implementace/V3-PHASE1-COMPLETE.md` |

---

## 17. Zname omezeni

### Funkcionalni omezeni

1. **Zadny checkout flow** -- Widget NEMA checkout (S02 neni portovany z test-kalkulacky).
   Uzivatel ziska cenu, ale nemuze rovnou objednat.

2. **Zadny prijem postMessage** -- Widget pouze posila zpravy, neprijima prikazy
   od rodicovske stranky (napr. zmena theme za behu, vynuceny reset).

3. **Pouze STL preview** -- OBJ a 3MF soubory nemaji 3D nahled, pouze slicing.

4. **Batch slicing sekvencni** -- Vice modelu se slicuje postupne, ne paralelne.

5. **Tenant resolution demo-only** -- `getWidgetByPublicId` skenuje localStorage,
   v produkci bude nutny serverovy lookup.

6. **Nepouzite komponenty** -- PostProcessingSelector, ExpressTierSelector,
   UpsellPanel, ShippingSelector, CouponInput a PromoBar jsou pripraveny ale
   NEINTEGROVANY do hlavniho flow. Pouzivaji starsi `--mp-*` CSS var konvenci.

### Technicke omezeni

7. **Builder BUILDER_MOCK musi byt useRef** -- pouziti useMemo zpusobi white
   screen kvuli nestabilni referenci (dokumentovano v MEMORY.md).

8. **Surface computation guardrails** -- pro modely s vice nez 2M vertexu nebo
   1M trojuhelniku se povrch nevypocita. Casovy limit 140ms.

9. **3D preview limit 12MB** -- vetsi STL soubory nemaji 3D nahled.

10. **Hardcoded cestina** -- vetsina UI textu je v cestine bez i18n wrapperu,
    pouze PrintConfiguration ma CS/EN podporu.

11. **CSS var nekonzistence** -- hlavni komponenty pouzivaji `--widget-*`,
    nepouzite komponenty pouzivaji `--mp-*`, coz by pri integraci zpusobilo
    vizualni nekonzistence.

12. **Pricing config z localStorage** -- Widget cte pricing/fees konfiguraci
    z localStorage aktualniho tenanta, coz funguje v demo modu ale ne v
    produkci (embed na cizim webu nema pristup k localStorage hostitele).

13. **File ID generovani** -- `Date.now() + Math.random()` muze mit kolize
    pri nahrodni vice souboru v jedne milisekunde (nizke riziko).

14. **Referrer-Policy: no-referrer** -- pokud rodic nastavi tuto policy,
    `document.referrer` bude prazdny a domain whitelist neprobehne korektne.
    Zaroven postMessage pujde na `'*'`.

---

*Dokumentace vygenerovana 2026-02-13. Zdrojove soubory: 907 radku (index.jsx),
17 komponent, 427 radku (widgetThemeStorage.js), 225 radku (WidgetPublicPage.jsx).*
