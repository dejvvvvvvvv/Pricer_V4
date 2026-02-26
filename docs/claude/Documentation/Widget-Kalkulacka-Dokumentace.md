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

## 7. Widget Builder V2 (WYSIWYG Editor)

### 7.1 Prehled

Fullscreen WYSIWYG editor pro vizualni upravu widgetu. Tri-panel layout s DnD podporou:
- **TopBar** — device switcher, step preview, undo/redo, reset, auto-save status
- **LeftPanel** (280px) — 4 taby: Styl, Bloky, Vrstvy, Globalni
- **Canvas** (flex) — zive nahledove okno s DevicePreviewFrame
- **RightPanel** (300px, conditional) — vlastnosti vybraneho elementu

**Route:** `/admin/widget/builder/:id`
**Renderovan MIMO AdminLayout** — plne fullscreen.

### 7.2 Architektura souboru

```
src/pages/admin/builder/
  BuilderPage.jsx                    -- Hlavni kompozice, DnD context, grid layout
  styles/
    builder-tokens.css               -- CSS custom properties pro builder UI
  hooks/
    useBuilderState.js               -- Top-level state hook (theme, layout, selection, auto-save)
    useUndoRedo.js                   -- Theme undo/redo stack (max 50)
    useElementSelection.js           -- Selected/hovered element tracking
    useLayoutState.js                -- Element ordering, visibility, custom blocks, undo
    useDragAndDrop.js                -- @dnd-kit event handlers
  config/
    elementRegistry.js               -- 10 core elements (metadata, flags, zones)
    blockLibrary.js                  -- 6 custom block types (text, image, divider, spacer, infobox, badge)
    presetLayouts.js                 -- 4 layout presety (classic, compact, wide, minimal)
    quickThemes.js                   -- Prednastavena barevna temata
    builderMockData.js               -- Realisticka mock data pro vsech 5 kroku
    onboardingSteps.js               -- 5-krokovy first-run walkthrough
  components/
    BuilderTopBar.jsx                -- Horni lista (device, steps, undo/redo, auto-save)
    BuilderLeftPanel.jsx             -- Levy panel se 4 taby
    BuilderRightPanel.jsx            -- Canvas wrapper
    DevicePreviewFrame.jsx           -- Mobile/Tablet/Desktop frame
    OnboardingOverlay.jsx            -- First-run overlay
    ElementToolbar.jsx               -- Floating toolbar nad vybranym elementem
    LayersPanel.jsx                  -- Photoshop-style vrstvy s DnD
    BlockLibrary.jsx                 -- Paleta custom bloku
    LayoutSwitcher.jsx               -- 4 preset layouty s potvrzenim
    DraggableElement.jsx             -- @dnd-kit sortable wrapper
    DragOverlayElement.jsx           -- Ghost element pri tazeni
    QuickThemeDropdown.jsx           -- Dropdown pro rychle tema presety
    BuilderColorPicker.jsx           -- Color picker pro theme barvy
    tabs/
      StyleTab.jsx                   -- Editor vlastnosti vybraneho elementu
      GlobalTab.jsx                  -- Typografie, zaobleni, tema, efekty, skeleton
```

### 7.3 Element Registry (10 core elementu)

| Element | Protected | Hideable | Draggable | Zone | Popis |
|---------|-----------|----------|-----------|------|-------|
| `background` | ano | ne | ne | full | Pozadi widgetu |
| `header` | ne | ano | ano | full | Logo + titulek + tagline |
| `steps` | ne | ano | ano | full | Progress stepper |
| `upload` | ano | ne | ano | left | Upload zona |
| `viewer` | ano | ano | ano | right | 3D nahled |
| `config` | ano | ne | ano | left | Print konfigurace |
| `fees` | ne | ano | ano | full | Poplatky/sluzby |
| `pricing` | ano | ne | ano | full | Cenovy souhrn |
| `cta` | ano | ne | ano | full | Call-to-action tlacitko |
| `footer` | ne | ano | ano | full | Powered by paticka |

### 7.4 Custom bloky (6 typu)

| Blok | Kategorie | Default vlastnosti |
|------|-----------|-------------------|
| `text` | content | fontSize 14px, color #374151, padding 12px |
| `image` | content | width 100%, height auto, border-radius 8px |
| `divider` | layout | height 1px, color #E5E7EB, margin 8px 0 |
| `spacer` | layout | height 24px |
| `infobox` | content | padding 12px, background #F3F4F6, border-radius 8px |
| `badge` | content | fontSize 12px, padding 4px 8px, background #3B82F6 |

Custom bloky maji prefix `cb_` v ID a lze je smazat (na rozdil od core elementu).

### 7.5 Layout presety (4 presety)

| Preset | Popis | Skryte elementy | Specialni |
|--------|-------|-----------------|-----------|
| `classic` | Vsech 9 elementu | zadne | default |
| `compact` | 6 elementu | header, footer, fees | viewer height 300px |
| `wide` | Vsech 9 elementu | zadne | viewer height 500px, upload/viewer swap |
| `minimal` | 4 elementy | header, steps, viewer, fees, footer | pouze zakladni flow |

Prepnuti presetu vyzaduje potvrzeni (destructive action).

### 7.6 Auto-save system

**Vsechny zmeny se ukladaji automaticky** s debounce 800ms.

**Cyklus:**
```
Zmena (theme/layout/name) --> isDirty
  |
  +-- Debounce 800ms (reset pri dalsi zmene)
  |
  +-- "Ukladani..." (status v top bar)
  |
  +-- localStorage write (sync, ~0ms)
  |
  +-- "Ulozeno" (2s)
  |
  +-- Idle (prazdne)
```

**Implementace:**
- `useBuilderState.js` — `autoSaveStatus` state ('idle'|'saving'|'saved')
- `savedSnapshotRef` — JSON.stringify porovnani pro detekci zmen
- `isSavingRef` — guard proti re-trigger smycce (React re-render)
- `setTimeout(50)` pred localStorage write — umozni React vyrenderovat "Ukladani..."
- Undo/redo stacks se NERESETUJI po auto-save (uzivatel muze undo i po ulozeni)
- **Ctrl+S** — vynuti okamzite ulozeni (bypass debounce)

**TopBar indikator:**
- `autoSaveStatus === 'saving'` — spinner ikona + "Ukladani..." (muted)
- `autoSaveStatus === 'saved'` — check ikona + "Ulozeno" (zelena)
- `autoSaveStatus === 'idle'` — prazdne (nic se nezobrazuje)

**Zadne varovani o neulozeny zmenach** — vsechno se uklada automaticky.
QuickThemeDropdown a dalsi akce NEMAJI confirm dialog o zmenach.

### 7.7 Drag and Drop (@dnd-kit)

- **Knihovny:** `@dnd-kit/core`, `@dnd-kit/sortable`
- **Dve plochy:** LayersPanel (levy panel) + Canvas (preview)
- **Data flow:** `useDragAndDrop` (eventy) --> `useLayoutState.moveElement()` (stav)
- `DraggableElement` — sortable wrapper s GripVertical handle
- `DragOverlayElement` — ghost pri tazeni (pill s modrym rameckem)
- **Sensory:** PointerSensor (distance 5px), KeyboardSensor

### 7.8 Preview & Step Switcher

TopBar obsahuje 5 step preview tlacitek:
1. **Upload** — nahrani modelu
2. **Konfig.** — nastaveni tisku
3. **Prehled** — cenovy souhrn
4. **Obj.** — checkout (mock)
5. **Hotovo** — potvrzeni (mock)

Device switcher: Mobile / Tablet / Desktop — meni sirku preview frame.

### 7.9 Onboarding (First-run)

5-krokovy walkthrough pro nove uzivatele:
1. **Vitejte** — uvodni karta (full screen)
2. **Nahled widgetu** — highlight preview area
3. **Editor vlastnosti** — highlight levy panel
4. **Quick Themes** — highlight globalni tab
5. **Auto-save** — zmeny se ukladaji automaticky

Stav ulozeny v localStorage pod `modelpricer:${tenantId}:builder:onboarding_complete`.

### 7.10 Persistence

**Co se uklada:**
- `themeConfig` — 56+ vlastnosti (barvy, fonty, texty, velikosti)
- `layoutConfig` — elementOrder, hiddenElements, customBlocks, sizeOverrides, activePresetId
- `name` — nazev widgetu

**Kam:**
- `modelpricer_widgets__${tenantId}` v localStorage
- Volitelne: Supabase dual-write (fire-and-forget)

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
z jinych tabu/oken. Od 2026-02-26 predava `tenantId` do storage helperu pro spravnou
tenant izolaci:

```javascript
useEffect(() => {
  const onStorage = (e) => {
    if (!e?.key) return;
    if (e.key.includes('pricing:v3')) setPricingConfig(loadPricingConfigV3(tenantId));
    if (e.key.includes('fees:v3')) setFeesConfig(loadFeesConfigV3(tenantId));
  };
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}, [tenantId]);
```

**Zmena oproti predchozi verzi:**
- `loadPricingConfigV3()` a `loadFeesConfigV3()` nyni prijimaji `tenantId` parameter
- Dependency array zmenen z `[]` na `[tenantId]` -- listener se preregistruje pri zmene tenanta

### 9.6 PostMessage protokol -- 6 message types

Widget a public embed komunikuji s rodicovskou strankou pres `window.parent.postMessage`.
Vsechny zpravy maji `publicWidgetId` pro identifikaci widgetu.

**Target origin**: Z `document.referrer` pokud existuje (bezpecnejsi nez `'*'`), jinak fallback na `'*'`.

| Zprava | Smer | Kdy | Data | Ucel |
|--------|------|-----|------|------|
| `MODELPRICER_WIDGET_READY` | Widget -> Parent | Po mount | `{ type, publicWidgetId, version }` | Handshake s rodicovskou strankou |
| `MODELPRICER_RESIZE` | Widget -> Parent | Pri zmene vysky (ResizeObserver) | `{ type, height }` | Auto-resize iframe (doporucene) |
| `MODELPRICER_WIDGET_HEIGHT` | Widget -> Parent | Resize (legacy WidgetEmbed) | `{ type, publicId, height }` | Auto-resize iframe (alternativni) |
| `MODELPRICER_PRICE_CALCULATED` | Widget -> Parent | Po slicingu | `{ type, publicWidgetId, data: { total, currency } }` | Notifikace o cenove kalkulaci |
| `MODELPRICER_QUOTE_CREATED` | Widget -> Parent | Pri vytvoreni quote (WidgetPublicPage) | `{ type, publicWidgetId, quote }` | Odeslani uplne quote s modely |
| `MODELPRICER_SHOPIFY_CHECKOUT_URL` | Widget -> Parent | Pri Shopify integraci | `{ type, url }` | Checkout URL pro redirect |

**Synchronizace mezi widget-kalkulacka a widget.js:**
- `src/pages/widget-kalkulacka/index.jsx` odesila zpravy v embedded modu
- `public/widget.js` (public embed) posloucha `MODELPRICER_RESIZE`, `MODELPRICER_SHOPIFY_*`
- Oba rezim pouzivaji konzistentni message types (ne hardcoded stringy)

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

## 10. Security -- iframe sandbox, origin validace, Shopify URL validace

### 10.1 Iframe Sandbox (public embed)

**WidgetPublicPage** je vzdy servovana v iframe pres embed kod. Bezpecnost je zajistena:

1. **Domain whitelist validation**: Je domena rodicovske stranky v `widget.domains` whitelistu?
2. **Origin check z document.referrer**: Target origin se vypocitava z `document.referrer` (ne hardcoded `'*'`)
3. **Localhost bypass pro vyvoj**: `['localhost', '127.0.0.1']` jsou vzdy povoleny

**Target origin validace:**
```javascript
function getTargetOrigin() {
  try {
    if (document.referrer) {
      return new URL(document.referrer).origin;
    }
  } catch {
    // Invalid referrer
  }
  return '*'; // Fallback pokud je referrer nedostupny
}
```

### 10.2 Domain whitelist -- presne bezpecnostni pravidla

- Admin prida domenu (napr. "firma.cz") s `allowSubdomains` flagemm
- WidgetPublicPage ziska hostname z `document.referrer` a overuje:
  - Presna shoda: `hostname === domain`
  - Wildcard subdomeny: `hostname.endsWith('.domain')` pokud `allowSubdomains === true`
- Validace domeny zakazuje: protokoly (http://), cesty (/), mezery

### 10.3 Shopify URL validace (Varianta A)

Pri Shopify integraci se kontroluje:
- Nur domeny s `.myshopify.com` jsou povoleny (bezpecnostni vyfiltraci)
- Cart/checkout URL jsou pouze pro cteni (postMessage pro odkaz, ne API promenlivost)
- Storefront API token je ulozeny v localStorage (admin-scoped, ne v DB)

### 10.4 PostMessage security

- Zjisteni target origin z `document.referrer` (spravnejsi nez `'*'`)
- Vzdy kontrolovat `e.origin` na prijimaci strane (public/widget.js)
- Zpravu pouzivat jen data z vlastniho widgetu (kontrola `publicWidgetId`)

---

## 11. Error handling

### 11.1 Vrstvy error handlingu

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

### Implementovane features (Session 2026-02-26)

- **WidgetStepper:** `role="navigation"`, `role="list"`, `role="progressbar"` s `aria-valuenow/min/max`
- **FileUploadZone:** `role="button"`, `focus-visible` na dragover, keyboard support (Enter/Space)
- **PrintConfiguration:** `role="form"`, `aria-label` na range sliders, color selektor s radiogroup
- **BatchProgressBar:** `role="progressbar"`, `aria-valuenow/min/max`, animovany progress fill

### Nedostatky

- Range slider (infill) mohla by mit vice detailniho `aria-valuetext` (napr. "Infill 20%")
- FullScreenViewer nema focus trap (modalni overlay)
- Chybi skip-link nebo landmark role (main, nav) pro screen reader navigaci
- Nepouzite komponenty (PostProcessing, Express, Shipping, Coupon) nemaji zadne
  ARIA atributy

---

## 12. Loading states -- WidgetSkeleton

### 12.1 WidgetSkeleton komponenta

Pri prvnim nacitani widgetu (jeste se nacita pricing config) se zobrazuje `WidgetSkeleton`:

```javascript
{loading ? <WidgetSkeleton /> : <WidgetKalkulacka ... />}
```

**Komponenty v skeleton:**
- Header skeleton (blokovy text efekt)
- Upload zone skeleton (pule placeholder)
- Stepper skeleton (5 krokovych pul)
- Price summary skeleton (radky pul)

**Animace:** `shimmer` keyframe s posunutym gradientem zleva doprava (~2s smycka).

### 12.2 Kde se pouziva

- `WidgetPublicPage.jsx` — pri nacitani widget configu
- `AdminWidgetBuilder.jsx` — pri nacitani theme configu
- Vzdy po mount nebo pri zmene `loading` state

---

## 13. Batch progress -- BatchProgressBar

### 13.1 BatchProgressBar komponenta

Pri batch slicingu vice modelu zobrazuje se progress bar:

```javascript
<BatchProgressBar
  current={slicedCount}
  total={uploadedFiles.length}
  label={`Slicovani: ${slicedCount}/${uploadedFiles.length}`}
/>
```

**Vlastnosti:**
- `role="progressbar"` s `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- Animovany fill bar (linearne prepocet)
- Label se zmeny pri kazde zmene procentualni hodnoty
- Barva: Forge teal (`--forge-accent-primary`)

### 13.2 Integraci s WidgetKalkulacka

V `WidgetKalkulacka` je progress bar zobrazena v `step2` (Konfigurace) pres `useMemo`:
- Spocita se `slicedCount` z `uploadedFiles` (pocet se statusem 'sliced')
- Progress bar je viditelna jen kdyz `uploadedFiles.length > 1` (vice modelu = batch)

---

## 14. Cross-tenant pricing fix -- tenantId prop a tenant izolace

### 14.1 Problem a reseni

Widget bezi v iframe na cizim webu a musi nacitat pricing/fees konfiguraci spravneho tenanta.
Bez explicitniho `tenantId` prop by widget pouzil defaultni tenant z `getTenantId()`, coz
v embedded modu muze ukazovat na spatna data.

**Reseni (2026-02-26):** `tenantId` je nyni explicitni prop komponenty `WidgetKalkulacka`:

```javascript
// Destructured props -- tenantId = undefined (line 221)
export const WidgetKalkulacka = ({
  embedded = false,
  showHeader = null,
  publicWidgetId = null,
  onQuoteCalculated,
  shopifyConfig = null,
  layoutConfig = null,
  tenantId = undefined,   // <-- tenant override prop
}) => {
```

**Pouziti pro nacitani pricing/fees (lines 233-234):**
```javascript
const [pricingConfig, setPricingConfig] = useState(() => loadPricingConfigV3(tenantId));
const [feesConfig, setFeesConfig] = useState(() => loadFeesConfigV3(tenantId));
```

Kdyz `tenantId` je `undefined`, storage helpery pouziji defaultni `getTenantId()`.
Kdyz `tenantId` je explicitne nastaven (napr. z `WidgetPublicPage`), pouzije se override.

**V embedded modu se tenantId ziskava z:**
1. `tenantId` prop predany z `WidgetPublicPage` (preferovany zdroj)
2. `getWidgetConfig().tenantId` (vzdy dostupna v WidgetPublicPage)
3. Fallback na 'default' (pouze pro preview)

### 14.2 Storage event listener s tenantId (lines 373-381)

Storage event listener byl aktualizovan aby pouzival `tenantId` override pri reloadu
konfigurace pri zmenach v jinych tabech:

```javascript
useEffect(() => {
  const onStorage = (e) => {
    if (!e?.key) return;
    if (e.key.includes('pricing:v3')) setPricingConfig(loadPricingConfigV3(tenantId));
    if (e.key.includes('fees:v3')) setFeesConfig(loadFeesConfigV3(tenantId));
  };
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}, [tenantId]);  // <-- dependency array zahrnuje tenantId
```

**Klicova zmena:** Dependency array `[tenantId]` zajistuje, ze pri zmene tenanta se listener
preregistruje s aktualnim `tenantId`. Predchozi verze mela prazdny dependency array `[]`.

### 14.3 Tenant izolace -- architektura

```
WidgetPublicPage (resolves tenantId from publicWidgetId)
  |
  +-- getWidgetByPublicId(publicWidgetId)
  |     --> vrati widget config vcetne tenantId
  |
  +-- predava tenantId jako prop
  |
  v
WidgetKalkulacka({ tenantId, embedded: true, ... })
  |
  +-- loadPricingConfigV3(tenantId) --> localStorage key: modelpricer:{tenantId}:pricing:v3
  +-- loadFeesConfigV3(tenantId)    --> localStorage key: modelpricer:{tenantId}:fees:v3
  +-- storage event listener        --> reaguje na zmeny se spravnym tenantId
```

**Bezpecnostni aspekty:**
- `tenantId` je vzdy tenant-scoped (nikdy hardcoded)
- WidgetPublicPage ziskava tenantId z `getWidgetByPublicId()` (lookup v localStorage)
- Kazdy tenant ma svou pricing/fees konfiguraci zcela separatne
- V budouci Supabase migraci bude tenant izolace vynucena na DB urovni (RLS policies)
- Widget v iframe nema pristup k localStorage hostitelskeho webu (same-origin policy)

---

## 15. Default theme -- Forge teal (#00D4AA)

### 15.1 Theme barvy (aktualizovane)

Widget pouziva Forge design system theme (NE Tailwind):

| Vlastnost | Defaultni barva | Ucel |
|-----------|-----------------|------|
| `buttonPrimaryColor` | `#00D4AA` (Forge teal) | CTA tlacitka (byla `#2563EB` - modra) |
| `buttonHoverColor` | `#00A88A` | Tmavsi teal na hover |
| `backgroundColor` | `#FFFFFF` | Svetle pozadi (den) |
| `headerColor` | `#1F2937` | Tmave nadpisy |
| `textColor` | `#374151` | Hlavni text |
| `mutedColor` | `#6B7280` | Sekundarni text |

### 15.2 Zmena z modre na teal

**Puvodni (deprecated):**
```css
--widget-btn-primary: #2563EB; /* Modra */
```

**Nova (Forge brand):**
```css
--widget-btn-primary: #00D4AA; /* Teal */
```

Zmena se aplikuje v `getDefaultWidgetTheme()` a pri branding auto-apply.

---

## 16. StyleableWrapper extraction -- performance

### 16.1 Extrakce do module scope

`StyleableWrapper` komponenta (je-li pouzivana) by mela byt extractnuta ze `WidgetKalkulacka`:

**Puvodni (inefficient):**
```javascript
// Uvnitr WidgetKalkulacka
const StyleableWrapper = ({ children, theme }) => { ... };
```

**Nova (memo, module scope):**
```javascript
// styles/StyleableWrapper.jsx (separate file)
const StyleableWrapper = React.memo(({ children, theme }) => { ... });
```

**Duvod:** Memo prevenca re-renderu pri zmene parent stavu (pokud content se nemenila).

---

## 17. Performance

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

## 18. Bezpecnost -- domain whitelist, iframe sandbox, URL validace

### 18.1 Domain whitelist mechanismus

Widget whitelist se overuje v `WidgetPublicPage`:

```javascript
// 1. Nacist widget config z publicWidgetId
const { widget, tenantId } = getWidgetByPublicId(publicWidgetId);

// 2. Overit stav widgetu
if (widget.status === 'disabled') return <ErrorState />;

// 3. Overit domain (z document.referrer)
const hostname = new URL(document.referrer).hostname;
if (!isDomainAllowedByWhitelist(hostname, widget.domains)) {
  return <ErrorState reason="DOMAIN_NOT_WHITELISTED" />;
}
```

**Vyjimka pro localhost:** `['localhost', '127.0.0.1']` jsou vzdy povoleny pro vyvoj.

### 18.2 Shopify URL validace

Pri Shopify integraci (Varianta A) se prijima checkbox_urls ze ShopifyCartButton:

```javascript
// Nur .myshopify.com domeny
if (!checkoutUrl?.includes('.myshopify.com')) {
  throw new Error('Invalid Shopify domain');
}
```

- URL se validuje pred poslanim na rodicovskou stranku pres postMessage
- Nikdy nenastavy se bezpecnostne rizikove parametry (API keys apod.)

### 18.3 IFrame sandbox (public/embed)

Embed kod vklada widget do iframe:
```html
<iframe src="https://app.modelpricer.com/w/wid_1234abcd"
  style="width: 100%; border: none; min-height: 600px;"
  title="3D Print Calculator"
  allow="clipboard-write">
</iframe>
```

- **Clipboard write** je povoleno (kopie embed kodu z buttonu)
- **Sandbox** neni pouzito (widget potrebuje plny JS pristup)

---

## 19. Zname omezeni a budouci rozsireni

---

## 20. Souvisejici dokumenty

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

## 21. Zname omezeni

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

*Dokumentace aktualizovana 2026-02-26. Zdrojove soubory: 907 radku (index.jsx),
17 komponent, 427 radku (widgetThemeStorage.js), 225 radku (WidgetPublicPage.jsx).
Widget Builder V2: 460 radku (BuilderPage.jsx), 486 radku (useBuilderState.js), 11 komponent.
Session 2026-02-26: PostMessage protokol (6 typu), Security (iframe sandbox, origin validation),
Loading states (WidgetSkeleton), Batch progress (BatchProgressBar), Accessibility (ARIA roles),
StyleableWrapper extraction, Cross-tenant pricing fix (tenantId prop), Default theme (Forge teal #00D4AA).*
