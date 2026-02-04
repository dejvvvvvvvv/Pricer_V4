# MODELPRICER - WIDGET BUILDER V3: KOMPLETNI IMPLEMENTACNI PLAN

> **Zdroj pravdy:** `docs/claude/ModelPricer - Widget Design Report V3.md`
> **Cilovy soubor planu:** `docs/claude/Widget_Builder_Plan.md` (zkopirovat pri implementaci)
> **Datum:** 3.2.2026 | **Verze planu:** 1.0

---

## PREAMBULE: PRAVIDLA PRO IMPLEMENTACI

### POVINNE POUZITI AGENTU
**V KAZDE SEKCI JE EXPLICITNE ZAKAZANO NEPOOUZIVAT AGENTY.**
Kazdy krok musi byt delegovan na prislusneho agenta. Orchestrator (hlavni session) koordinuje, nekoduje primo.

### Agent mapa (pouzivani)
| Agent | Scope | Kdy |
|-------|-------|-----|
| `mp-storage-tenant` | Storage schema, migrace, tenant klice | Phase 0.1 |
| `mp-design-system` | CSS tokeny, barvy, fonty, UI primitiva | Phase 0.3, 0.4, 3.1 |
| `mp-admin-ui` | Admin stranky, builder UI, panely, taby | Phase 1-3, 5, 6 |
| `mp-widget-embed` | Widget kalkulacka, embed, postMessage | Phase 2.3, 4, 6.4, 7.2 |
| `mp-frontend-react` | Routing, lazy loading, React patterns | Phase 1.4 |
| `mp-i18n` | Preklady cs/en | Phase 7.4 |
| `mp-security-reviewer` | Domain whitelist, origin validace | Phase 7.1, 7.3 |
| `mp-code-reviewer` | Review kazde faze | Po kazde fazi |
| `mp-test-runner` | Build validace, smoke testy | Po kazde fazi |
| `mp-e2e-playwright` | E2E testy | Phase 8.2 |
| `mp-browser-test-planner` | Manualni test plany | Phase 8.5 |
| `mp-a11y` | WCAG audit | Phase 8.4 |
| `mp-performance` | Bundle size, render perf | Phase 8.3 |

### Soubory ktere se NESMI menit
- `src/pages/test-kalkulacka/*` (CLAUDE.md sekce 10)
- `src/lib/pricing/pricingEngineV3.js`
- `src/utils/adminTenantStorage.js` (pouze cist)

### Tenant pravidla
- Vsude pouzivat `getTenantId()` z `src/utils/adminTenantStorage.js`
- Storage klic pattern: `modelpricer:${tenantId}:${namespace}`
- Zadny hardcode tenant ID

---

## PHASE 0: ZAKLAD & INFRASTRUKTURA

**Cil:** Pripravit datovou vrstvu, stavove hooky a design tokeny pred jakoukoliv UI praci.
**POUZITI AGENTU JE POVINNE — ZAKAZANO IMPLEMENTOVAT BEZ AGENTU.**

---

### 0.1 Rozsirene theme storage schema

**Agent:** `mp-storage-tenant`
**Co:** Rozsirit `themeConfig` z 15 na ~50 vlastnosti pro vsechny editovatelne elementy.

**Soubory k modifikaci:**
- `src/utils/widgetThemeStorage.js` — rozsireni `getDefaultWidgetTheme()`, `THEME_PROPERTIES`, `themeToCssVars()`, `FONT_OPTIONS`
- `src/utils/adminBrandingWidgetStorage.js` — synchronizace duplicitni `getDefaultWidgetTheme()` (radek 144)

**Soucasny stav (15 vlastnosti):**
```
backgroundColor, cardColor, headerColor, textColor, mutedColor,
buttonPrimaryColor, buttonTextColor, buttonHoverColor,
inputBgColor, inputBorderColor, inputFocusColor,
summaryBgColor, borderColor, fontFamily, cornerRadius
```

**Nove vlastnosti k pridani:**

**Header (5):**
- `headerBgColor` (#FFFFFF) — pozadi hlavicky
- `headerLogoSize` (48) — velikost loga v px (40-80)
- `headerPadding` (16) — padding hlavicky v px
- `headerAlignment` ('left') — zarovnani: 'left' | 'center'
- `headerTaglineVisible` (true) — zobrazit tagline

**Upload zona (5):**
- `uploadBgColor` (#FAFBFC) — pozadi upload zony
- `uploadBorderColor` (#E2E8F0) — border v default stavu
- `uploadBorderHoverColor` (#3B82F6) — border pri hoveru
- `uploadIconColor` (#94A3B8) — barva ikony
- `uploadBorderStyle` ('dashed') — 'solid' | 'dashed' | 'dotted'

**Stepper (4):**
- `stepperActiveColor` (#3B82F6) — aktivni krok
- `stepperCompletedColor` (#10B981) — dokonceny krok
- `stepperInactiveColor` (#E5E7EB) — neaktivni krok
- `stepperProgressVisible` (true) — zobrazit progress bar

**Konfigurace panel (2):**
- `configBgColor` (#FFFFFF) — pozadi konfiguracniho panelu
- `configLabelColor` (#374151) — barva labelu

**Fees sekce (2):**
- `feesBgColor` (#F9FAFB) — pozadi fees sekce
- `feesCheckboxColor` (#3B82F6) — barva checkboxu

**Souhrn ceny (4):**
- `summaryHeaderColor` (#1F2937) — nadpis souhrnu
- `summaryDividerColor` (#E5E7EB) — oddelovaci cara
- `summaryTotalBgColor` (#EFF6FF) — zvyrazneni celkem
- `summaryTotalFontSize` (20) — velikost celkove ceny

**CTA tlacitko (4):**
- `buttonBorderRadius` (8) — zaobleni tlacitka
- `buttonPaddingY` (12) — vertikalni padding
- `buttonFontSize` (16) — velikost textu
- `buttonShadow` ('none') — 'none' | 'subtle' | 'medium' | 'strong'

**Footer (3):**
- `footerBgColor` ('transparent') — pozadi paticky
- `footerTextColor` (#94A3B8) — barva textu
- `footerLinkColor` (#3B82F6) — barva odkazu

**Typografie (2):**
- `headingFontFamily` ('"DM Sans", system-ui, sans-serif') — font nadpisu
- `codeFontFamily` ('"JetBrains Mono", monospace') — font kodu

**Stiny (2):**
- `cardShadow` ('subtle') — 'none' | 'subtle' | 'medium' | 'strong'
- `globalPadding` (24) — globalni padding widgetu

**Loading skeleton (2):**
- `skeletonBaseColor` (#E5E7EB) — zakladni barva skeletonu
- `skeletonShineColor` (#F3F4F6) — shimmer barva

**Editovatelne texty (6):**
- `textHeaderTitle` ('3D Tisk Kalkulacka') — nadpis hlavicky
- `textHeaderTagline` ('Nahrajte 3D model a zjistete cenu tisku.') — tagline
- `textUploadTitle` ('Nahrajte 3D model') — nadpis upload zony
- `textUploadDescription` ('Pretahnete STL nebo OBJ soubory') — popis
- `textUploadButton` ('Vybrat soubor') — text tlacitka
- `textCtaButton` ('Spocitat cenu') — text CTA

**CELKEM: 15 (soucasne) + 41 (nove) = 56 vlastnosti**

**Migrace:** `getDefaultWidgetTheme()` pridava nove klice s default hodnotami. Spread pattern `{ ...defaults, ...stored }` zajisti zpetnou kompatibilitu.

**DULEZITE:** Odstranit duplicitni `getDefaultWidgetTheme()` v `adminBrandingWidgetStorage.js` (radek 144-162). Misto toho importovat z `widgetThemeStorage.js`.

**Rozsireni `themeToCssVars()`:**
Kazda nova vlastnost → CSS promenna `--widget-{kebab-case}`:
```javascript
'--widget-header-bg': t.headerBgColor,
'--widget-header-logo-size': `${t.headerLogoSize}px`,
'--widget-upload-bg': t.uploadBgColor,
'--widget-stepper-active': t.stepperActiveColor,
// ... atd pro vsechny
```

**Rozsireni `THEME_PROPERTIES[]`:**
Nove category hodnoty: `'header'`, `'upload'`, `'stepper'`, `'config'`, `'fees'`, `'summary'`, `'cta'`, `'footer'`, `'skeleton'`, `'shadow'`, `'text-content'`

**Rozsireni `FONT_OPTIONS[]`:**
Pridat: `{ value: '"DM Sans", system-ui, sans-serif', label: 'DM Sans' }` — jiz existuje na radku 211!
Pridat: `{ value: '"JetBrains Mono", monospace', label: 'JetBrains Mono' }`

**Verifikace:**
1. `getDefaultWidgetTheme()` vraci objekt s 56 klici
2. `themeToCssVars()` generuje CSS vars pro vsech 56 klicu
3. Existujici widgety se spravne nacitaji (zpetna kompatibilita)
4. `npm run build` projde

**Rizika:**
- P0: Duplicitni definice v `adminBrandingWidgetStorage.js` — MUSI se synchronizovat
- P1: Velky objekt v localStorage — sledovat velikost (< 10 KB na widget)

---

### 0.2 Builder state management hooky

**Agent:** `mp-admin-ui`
**Co:** Custom hooky pro spravu stavu builderu.

**Soubory k vytvoreni:**

**`src/pages/admin/builder/hooks/useUndoRedo.js`**
```
Interface:
- state: object — aktualni theme stav
- setState(newState): void — nastavi novy stav, prida do undo stacku
- undo(): void — vrati posledni zmenu
- redo(): void — obnovi vracenou zmenu
- canUndo: boolean
- canRedo: boolean
- reset(state): void — reset na zadany stav
- isDirty: boolean — porovnani s originalem
- historyLength: number — pocet kroku v undo stacku

Implementace:
- Max 50 kroku v undo stacku (FIFO)
- Shallow compare pro isDirty (JSON.stringify porovnani originu)
- useRef pro aktualni stav (zabrani stale closures)
```

**`src/pages/admin/builder/hooks/useElementSelection.js`**
```
Interface:
- selectedElementId: string | null
- hoveredElementId: string | null
- selectElement(id): void
- hoverElement(id): void
- clearSelection(): void
- clearHover(): void
- isSelected(id): boolean
- isHovered(id): boolean
```

**`src/pages/admin/builder/hooks/useBuilderState.js`**
```
Kompozice vsech hooku:
- useUndoRedo(initialTheme, 50)
- useElementSelection()
- useState pro: deviceMode, activeTab, editingTextId, widgetName, saving

Interface:
{
  // Theme
  theme, updateThemeProperty(key, value), undo, redo, canUndo, canRedo,
  isDirty, resetToOriginal, resetToDefaults,

  // Selection
  selectedElementId, hoveredElementId, selectElement, hoverElement,
  clearSelection, isSelected, isHovered,

  // Device
  deviceMode, setDeviceMode, // 'mobile' | 'tablet' | 'desktop'

  // Tabs
  activeTab, setActiveTab, // 'style' | 'elements' | 'global'

  // Text editing
  editingTextId, setEditingTextId,

  // Widget meta
  widget, widgetName, setWidgetName,

  // Persistence
  save(), saving, loadWidget(id),

  // Keyboard shortcuts
  // Ctrl+Z → undo, Ctrl+Y/Ctrl+Shift+Z → redo (registrace v useEffect)
}
```

**Verifikace:**
1. Undo/redo po 5 zmenach — vsechny se spravne vraci
2. isDirty = false po resetu na original
3. Ctrl+Z/Ctrl+Y funguji
4. Element selection spravne trackuje hover/click
5. Zadne memory leaky (cleanup event listeneru)

---

### 0.3 Design tokeny pro tmave builder tema

**Agent:** `mp-design-system`
**Co:** CSS custom properties oddelene od widget theme — builder ma vlastni vizualni jazyk.

**Soubor k vytvoreni:** `src/pages/admin/builder/styles/builder-tokens.css`

**Obsah (barvy z Design Report V3 sekce 3.2):**
```css
/* === BUILDER DARK THEME TOKENS === */

/* Surfaces */
--builder-bg-primary: #0F1117;      /* hlavni pozadi */
--builder-bg-secondary: #1A1D23;    /* levy panel */
--builder-bg-tertiary: #2A2D35;     /* preview oblast */
--builder-bg-elevated: #1E2128;     /* karty, sekce */
--builder-bg-topbar: #12141A;       /* horni bar */
--builder-hover-bg: #262A33;        /* hover stav */

/* Text */
--builder-text-primary: #F1F5F9;    /* hlavni text */
--builder-text-secondary: #94A3B8;  /* sekundarni text */
--builder-text-muted: #64748B;      /* tlumeny text */

/* Borders */
--builder-border-default: #2E3340;
--builder-border-subtle: #23262E;
--builder-border-focus: #3B82F6;

/* Accents */
--builder-accent-primary: #3B82F6;  /* modra */
--builder-accent-hover: #2563EB;
--builder-accent-success: #10B981;  /* zelena */
--builder-accent-warning: #F59E0B;  /* oranzova */
--builder-accent-error: #EF4444;    /* cervena */

/* Selection/Interaction */
--builder-selection-outline: #3B82F6;
--builder-hover-outline: rgba(59, 130, 246, 0.5);
--builder-active-overlay: rgba(59, 130, 246, 0.12);
--builder-hover-overlay: rgba(255, 255, 255, 0.04);

/* Layout dimensions */
--builder-left-panel-width: 35%;
--builder-right-panel-width: 65%;
--builder-topbar-height: 56px;
--builder-tab-height: 44px;

/* Typography */
--builder-font-heading: 'DM Sans', system-ui, sans-serif;
--builder-font-body: 'Inter', system-ui, sans-serif;
--builder-font-code: 'JetBrains Mono', monospace;

/* Radii */
--builder-radius-sm: 6px;
--builder-radius-md: 8px;
--builder-radius-lg: 12px;

/* Shadows */
--builder-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
--builder-shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
--builder-shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.5);
```

**Verifikace:**
1. Vsechny barvy odpovidaji Design Report V3 sekce 3.2
2. Kontrast: `#F1F5F9` na `#1A1D23` = 11.7:1 (WCAG AAA)
3. Kontrast: `#94A3B8` na `#1A1D23` = 5.6:1 (WCAG AA)
4. CSS soubor se spravne importuje v builderu

---

### 0.4 Font loading (DM Sans, JetBrains Mono)

**Agent:** `mp-design-system`
**Co:** Pridat Google Fonts pro DM Sans a JetBrains Mono.

**Soubor k modifikaci:** `index.html` (v rootu projektu)

**Pridat do `<head>`:**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@600;700&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet">
```

**POZN:** Inter jiz je v projektu (pouziva se globalne).

**Verifikace:** Fonty se nacitaji bez FOUT, overit v DevTools Network tab.

---

### 0.5 Phase 0 QUALITY GATE

**Agent:** `mp-code-reviewer` → review vsech zmenenych souboru
**Agent:** `mp-test-runner` → `npm run build` musi projit

---

## PHASE 1: BUILDER SHELL & LAYOUT

**Cil:** Sestavit vizualni kostru noveho builderu (prazdne panely, tmave tema, spravny layout).
**POUZITI AGENTU JE POVINNE — ZAKAZANO IMPLEMENTOVAT BEZ AGENTU.**

---

### 1.1 Top Bar komponenta

**Agent:** `mp-admin-ui`
**Soubor:** `src/pages/admin/builder/components/BuilderTopBar.jsx`

**Rozlozeni (flex, 3 bloky):**
- **Levy:** `<ArrowLeft>` ikona (navigace na `/admin/widget`) + "Widget Builder" label (DM Sans 600, 16px) + editable widget name (inline input pri kliknuti, JetBrains Mono 14px)
- **Stred:** Device toggle — 3 ikony (Smartphone/Tablet/Monitor z lucide-react), aktivni = `--builder-accent-primary`, neaktivni = `--builder-text-muted`
- **Pravy:** Quick Theme dropdown + Undo (`<Undo2>`) / Redo (`<Redo2>`) ikony s disabled stavem + "Resetovat" (ghost button) + "Ulozit" (zeleny primary `#10B981`, disabled kdyz !isDirty)

**Styling:**
- Pozadi: `--builder-bg-topbar` (#12141A)
- Vyska: `--builder-topbar-height` (56px)
- Border-bottom: 1px solid `--builder-border-subtle`
- Padding: 0 16px

**Props:**
```
widgetName, onWidgetNameChange, onBack,
deviceMode, onDeviceModeChange,
canUndo, canRedo, onUndo, onRedo,
onReset, onSave, isDirty, saving,
quickThemeId, onQuickThemeChange
```

---

### 1.2 Left Panel se 3 taby

**Agent:** `mp-admin-ui`
**Soubory:**
- `src/pages/admin/builder/components/BuilderLeftPanel.jsx`
- `src/pages/admin/builder/components/tabs/StyleTab.jsx` (placeholder)
- `src/pages/admin/builder/components/tabs/ElementsTab.jsx` (placeholder)
- `src/pages/admin/builder/components/tabs/GlobalTab.jsx` (placeholder)

**BuilderLeftPanel layout:**
- Tab bar: 3 taby ("Styl" / "Elementy" / "Globalni") na vrchu
- Aktivni tab: spodni border `--builder-accent-primary`, text `--builder-text-primary`
- Neaktivni: text `--builder-text-muted`
- Pod taby: scrollovatelny obsah (overflow-y: auto)
- Pozadi: `--builder-bg-secondary` (#1A1D23)

**Placeholder taby:**
- StyleTab: "Kliknete na element v nahledu pro editaci" (prazdny stav)
- ElementsTab: Staticka stromova struktura (naplni se v Phase 2)
- GlobalTab: Prazdne sekce pro font, radius, jazyk, logo, themes

---

### 1.3 Right Panel s preview kontejnerem

**Agent:** `mp-admin-ui`
**Soubory:**
- `src/pages/admin/builder/components/BuilderRightPanel.jsx`
- `src/pages/admin/builder/components/DevicePreviewFrame.jsx`

**BuilderRightPanel:**
- Pozadi: `--builder-bg-tertiary` (#2A2D35)
- V hornim pravem rohu: "LIVE PREVIEW" label + zelena tecka + "Live" status text
- Obsah: `<DevicePreviewFrame>` s `<WidgetKalkulacka>` uvnitr

**DevicePreviewFrame:**
- Centruje preview do rozmeru zarizeni
- Rozmery:
  - `mobile`: 375px sirka, max-height 812px
  - `tablet`: 768px sirka, max-height 1024px
  - `desktop`: 100% sirky panelu (max 1200px)
- Vizual: Bile zaoblene okno (radius 12px) s jemnym stinem simulujicim zarizeni
- Vnitrni obsah scrollovatelny pokud presahne vysku
- Transition pri zmene device mode: `width 300ms ease` (framer-motion)

**WidgetKalkulacka integrace:**
```jsx
<WidgetKalkulacka
  theme={builderState.theme}
  builderMode={true}
  onElementSelect={builderState.selectElement}
  embedded={false}
/>
```

---

### 1.4 Hlavni builder layout + routing zmena

**Agent:** `mp-admin-ui` (layout) + `mp-frontend-react` (routing)

**Soubor k PREPSANI:** `src/pages/admin/AdminWidgetBuilder.jsx`
Nova verze bude tenky wrapper importujici `BuilderPage`:
```jsx
import BuilderPage from './builder/BuilderPage';
export default function AdminWidgetBuilder() {
  return <BuilderPage />;
}
```

**Soubor k VYTVORENI:** `src/pages/admin/builder/BuilderPage.jsx`
```
Hlavni kompozice:
1. Nacte widget podle :id z URL (useParams)
2. Inicializuje useBuilderState(widgetId, tenantId)
3. Renderuje CSS Grid layout:
   - grid-template-rows: 56px 1fr
   - grid-template-columns: 35% 65%
   - height: 100vh, overflow: hidden
4. BuilderTopBar (span oba sloupce)
5. BuilderLeftPanel (levy sloupec)
6. BuilderRightPanel (pravy sloupec)
7. Import builder-tokens.css
```

**KRITICKA ZMENA v `src/Routes.jsx` (radek 78):**
Builder route se PRESUNE ven z `<AdminLayout>` vnoreni aby builder zabrala CELOU obrazovku bez admin sidebaru.

**PRED:**
```jsx
<Route path="/admin" element={<AdminLayout />}>
  ...
  <Route path="widget/builder/:id" element={<AdminWidgetBuilder />} />
  ...
</Route>
```

**PO:**
```jsx
{/* Widget Builder - fullscreen, no admin sidebar */}
<Route path="/admin/widget/builder/:id" element={<AdminWidgetBuilder />} />

<Route path="/admin" element={<AdminLayout />}>
  ...
  {/* widget/builder/:id REMOVED from here */}
  ...
</Route>
```

**DULEZITE:** Route musi byt PRED wildcard `<Route path="*" ...>` na radku 40.
Umisteni: na radku 38, hned za `/w/:publicWidgetId`.

**Verifikace:**
1. `/admin/widget/builder/w_xxx` nacte builder BEZ admin sidebaru, BEZ Header/Footer
2. `/admin/widget` stale funguje s admin sidebarem
3. Vsechny ostatni admin routy funguji
4. Builder layout je 35/65 na celou obrazovku
5. Top bar zobrazuje spravne prvky

---

### 1.5 Phase 1 QUALITY GATE

**Agent:** `mp-code-reviewer` + `mp-test-runner`
- `npm run build` musi projit
- Vizualni kontrola: builder stranka se nacte, tmave tema, 3-panelovy layout

---

## PHASE 2: ELEMENT SYSTEM & SELECTION

**Cil:** Umoznit klikani na elementy v preview a editaci jejich vlastnosti.
**POUZITI AGENTU JE POVINNE — ZAKAZANO IMPLEMENTOVAT BEZ AGENTU.**

---

### 2.1 Element registr

**Agent:** `mp-admin-ui`
**Soubor:** `src/pages/admin/builder/config/elementRegistry.js`

**Definice vsech editovatelnych elementu:**

```javascript
export const ELEMENT_REGISTRY = {
  background: {
    id: 'background',
    label: { cs: 'Pozadi', en: 'Background' },
    icon: 'Layout',
    properties: ['backgroundColor', 'globalPadding'],
    editableTexts: [],
  },
  header: {
    id: 'header',
    label: { cs: 'Hlavicka', en: 'Header' },
    icon: 'Type',
    properties: [
      'headerBgColor', 'headerColor', 'headerLogoSize',
      'headerPadding', 'headerAlignment', 'headerTaglineVisible'
    ],
    editableTexts: ['textHeaderTitle', 'textHeaderTagline'],
  },
  steps: {
    id: 'steps',
    label: { cs: 'Navigace (kroky)', en: 'Steps Navigation' },
    icon: 'ListOrdered',
    properties: [
      'stepperActiveColor', 'stepperCompletedColor',
      'stepperInactiveColor', 'stepperProgressVisible'
    ],
    editableTexts: [],
  },
  upload: {
    id: 'upload',
    label: { cs: 'Upload zona', en: 'Upload Zone' },
    icon: 'Upload',
    properties: [
      'uploadBgColor', 'uploadBorderColor', 'uploadBorderHoverColor',
      'uploadIconColor', 'uploadBorderStyle'
    ],
    editableTexts: ['textUploadTitle', 'textUploadDescription', 'textUploadButton'],
  },
  viewer: {
    id: 'viewer',
    label: { cs: '3D Nahled', en: '3D Viewer' },
    icon: 'Box',
    properties: [], // NEEDITOVATELNY vizualne (dle reportu)
    editableTexts: [],
    note: 'Kontejner 3D vieweru se NESTYLUJE v builderu.',
  },
  config: {
    id: 'config',
    label: { cs: 'Konfigurace', en: 'Configuration' },
    icon: 'Settings',
    properties: ['configBgColor', 'configLabelColor'],
    editableTexts: [],
  },
  fees: {
    id: 'fees',
    label: { cs: 'Doplnkove sluzby', en: 'Additional Services' },
    icon: 'Receipt',
    properties: ['feesBgColor', 'feesCheckboxColor'],
    editableTexts: [],
  },
  pricing: {
    id: 'pricing',
    label: { cs: 'Souhrn ceny', en: 'Price Summary' },
    icon: 'DollarSign',
    properties: [
      'summaryBgColor', 'summaryHeaderColor', 'summaryDividerColor',
      'summaryTotalBgColor', 'summaryTotalFontSize'
    ],
    editableTexts: [],
  },
  cta: {
    id: 'cta',
    label: { cs: 'CTA Tlacitko', en: 'CTA Button' },
    icon: 'MousePointerClick',
    properties: [
      'buttonPrimaryColor', 'buttonTextColor', 'buttonHoverColor',
      'buttonBorderRadius', 'buttonPaddingY', 'buttonFontSize', 'buttonShadow'
    ],
    editableTexts: ['textCtaButton'],
  },
  footer: {
    id: 'footer',
    label: { cs: 'Paticka', en: 'Footer' },
    icon: 'AlignEndHorizontal',
    properties: ['footerBgColor', 'footerTextColor', 'footerLinkColor'],
    editableTexts: [],
  },
};

export const ELEMENT_ORDER = [
  'background', 'header', 'steps', 'upload', 'viewer',
  'config', 'fees', 'pricing', 'cta', 'footer'
];
```

---

### 2.2 Element tree (Tab 2 — Elements)

**Agent:** `mp-admin-ui`
**Soubor:** `src/pages/admin/builder/components/tabs/ElementsTab.jsx`

**Vizual:** Seznam polozek s ikonami (lucide-react), nazvy a stavovou teckou.
- Klik na polozku → `selectElement(id)` + prepne na Tab 1 (Style)
- Aktivni element: zelena tecka vlevo, svetlejsi pozadi
- Hoverovany: `--builder-hover-bg`
- Kazda polozka: `[Ikona] [Nazev] [•]` (• = barevna tecka primary barvy elementu)
- 3D Viewer polozka ma badge "Needitovatelny" (seda, disabled vizual)

---

### 2.3 Click-to-select v preview (rozsireni StyleableWrapper)

**Agent:** `mp-widget-embed`
**Soubor k modifikaci:** `src/pages/widget-kalkulacka/index.jsx` (radky 494-512)

**Soucasny stav `StyleableWrapper`:**
- Pouze hover outline (dashed blue) a onClick
- Chybi: selection outline, handles, hover tracking, double-click

**Rozsireni:**

**Nove props na `WidgetKalkulacka` (zachovat zpetnou kompatibilitu — vsechny optional):**
```
onElementHover: func        // (elementId | null) → void
onTextEditStart: func       // (elementId) → void
selectedElementId: string   // pro highlighting
hoveredElementId: string    // pro hover outline
```

**Rozsirena `StyleableWrapper`:**
```
- Hover: 2px dashed rgba(59, 130, 246, 0.5) + tooltip "Klikni pro editaci"
- Selected: 2px solid #3B82F6 + 4 male handle ctverecky v rozich
- Click: stopPropagation + onElementSelect(id)
- DoubleClick: pokud element ma editableTexts → onTextEditStart(id)
- onMouseEnter/Leave: onElementHover(id) / onElementHover(null)
```

**Nove CSS tridy (pridat do widget-kalkulacka stylu):**
```css
.selection-handles .handle {
  position: absolute;
  width: 8px; height: 8px;
  background: #3B82F6;
  border: 1px solid white;
  border-radius: 2px;
}
.handle-tl { top: -4px; left: -4px; }
.handle-tr { top: -4px; right: -4px; }
.handle-bl { bottom: -4px; left: -4px; }
.handle-br { bottom: -4px; right: -4px; }
```

**KRITICKE:** Nove props NESMEJOU byt povinne — `WidgetPublicPage` je nema a nesmí se rozbít.

---

### 2.4 Element property editor (Tab 1 — Style)

**Agent:** `mp-admin-ui`
**Soubory:**
- `src/pages/admin/builder/components/tabs/StyleTab.jsx`
- `src/pages/admin/builder/components/editors/ColorPropertyEditor.jsx`
- `src/pages/admin/builder/components/editors/NumberPropertyEditor.jsx`
- `src/pages/admin/builder/components/editors/SelectPropertyEditor.jsx`
- `src/pages/admin/builder/components/editors/TextPropertyEditor.jsx`
- `src/pages/admin/builder/components/editors/ShadowPropertyEditor.jsx`

**StyleTab logika:**
1. Pokud `selectedElementId === null`: zobraz zprávu "Kliknete na element v nahledu"
2. Pokud vybran: nacti `ELEMENT_REGISTRY[selectedElementId]`
3. Zobraz:
   - Nadpis: ikona + nazev elementu
   - Sekce "BARVY": vsechny `type: 'color'` properties → `ColorPropertyEditor`
   - Sekce "ROZMERY": vsechny `type: 'number'` properties → `NumberPropertyEditor`
   - Sekce "STYL": `type: 'select'` properties (shadow, border style) → `SelectPropertyEditor`
   - Sekce "TEXTY": editableTexts → `TextPropertyEditor`

**Kazdy editor ma:**
- Label (cs/en z THEME_PROPERTIES)
- Tmave pozadi inputu (`--builder-bg-elevated`)
- Okamzita zmena v theme pres `updateThemeProperty(key, value)`

---

### 2.5 Text editing v builderu

**Agent:** `mp-admin-ui`
**Soubor:** `src/pages/admin/builder/components/InlineTextEditor.jsx`

**Mechanismus:**
- Double-click na element v preview → `onTextEditStart(elementId)`
- Builder zobrazi overlay nad elementem s `contentEditable` divem
- Obsah = aktualni text z theme (napr. `theme.textHeaderTitle`)
- Blur nebo Enter → ulozi do theme
- Escape → zrusi editaci

**Alternativa (jednodussi):** Text editing POUZE v levem panelu (StyleTab sekce TEXTY), NE inline v preview. Inline je nice-to-have ale slozity na implementaci (contentEditable problemy).

**Doporuceni:** Implementovat OBOJI:
1. TextPropertyEditor v levem panelu (POVINNE) — textove inputy
2. Inline editing v preview (NICE-TO-HAVE) — pokud cas dovoli

---

### 2.6 Phase 2 QUALITY GATE

**Agent:** `mp-code-reviewer` + `mp-test-runner`
- Klik na element v preview → levy panel zobrazi vlastnosti
- Zmena barvy → live preview se aktualizuje
- Widget public stranka neni rozbita (zpetna kompatibilita)

---

## PHASE 3: POKROCILE KOMPONENTY

**Cil:** Color picker, device toggle, quick themes, globalni nastaveni.
**POUZITI AGENTU JE POVINNE — ZAKAZANO IMPLEMENTOVAT BEZ AGENTU.**

---

### 3.1 Advanced color picker

**Agent:** `mp-design-system` (komponenta) + `mp-admin-ui` (integrace)
**Soubor:** `src/pages/admin/builder/components/BuilderColorPicker.jsx`

**POZN:** Stavajici `src/components/ui/ColorPicker.jsx` se NEMENI. Novy picker je specificky pro builder.

**Funkce (z Design Report V3 sekce 3.4):**
1. **Gradient picker oblast** — react-colorful `HexColorPicker` (jiz v projektu)
2. **Hue slider** — soucasti react-colorful
3. **Opacity slider** — `HexAlphaColorPicker` z react-colorful (pokud potreba alpha)
4. **HEX/RGB input** — tab prepinac mezi HEX (#FF0000) a RGB (255, 0, 0)
5. **8-color history** — posledne pouzite barvy, localStorage key: `modelpricer:${tenantId}:builder:color_history`
6. **Preset palety** — 4 sady barev (Blue, Green, Grey, Custom)
7. **Eyedropper** — `window.EyeDropper` API (Chrome 95+, fallback: skryt)
8. **Live preview** — kruhovy nahled aktualni barvy
9. **Apply/Cancel** — "Pouzit" zeleny + "Zrusit" ghost

**Vizual:** Popover s tmavym pozadim (`--builder-bg-elevated` #1E2128). Rozmery cca 260px sirka.

**Verifikace:**
1. HEX/RGB prepinani funguje
2. History se uklada a nacita
3. Eyedropper funguje v Chrome
4. Apply/Cancel spravne propaguji/rusi zmeny

---

### 3.2 Device preview toggle

**Agent:** `mp-admin-ui`
**Integrovano v:** `BuilderTopBar.jsx` (Phase 1.1) + `DevicePreviewFrame.jsx` (Phase 1.3)

**Vizual:** 3 ikony (Smartphone/Tablet/Monitor), aktivni = zeleny podklad, neaktivni = `--builder-text-muted`.
**Rozmery:** mobile 375px, tablet 768px, desktop 100%.
**Animace:** sirka preview kontejneru se meni s `transition: width 300ms ease`.

---

### 3.3 Quick Theme system

**Agent:** `mp-admin-ui` + `mp-design-system` (barvy)
**Soubory:**
- `src/pages/admin/builder/config/quickThemes.js`
- `src/pages/admin/builder/components/QuickThemeDropdown.jsx`

**5 presetu (z Design Report V3 sekce 3.2):**

1. **"Modern Dark"** — bg: #1A1A2E, primary: #3B82F6, text: #EAEAEA, card: #16213E
2. **"Clean Light"** — bg: #FAFBFC, primary: #059669, text: #1F2937, card: #FFFFFF
3. **"Professional Blue"** — bg: #F0F4F8, primary: #1E40AF, text: #1E293B, card: #FFFFFF
4. **"Warm Neutral"** — bg: #F5F0EB, primary: #D97706, text: #292524, card: #FEFDFB
5. **"Custom"** — zadrzi soucasny stav, nema preset

**Kazdy preset je kompletni theme objekt (vsech 56 vlastnosti).**

**QuickThemeDropdown vizual:** Tmava dropdown, kazda polozka ma 3 barevne krouzky (bg, primary, text) + nazev. Pokud isDirty, dialog: "Neulozene zmeny budou ztraceny. Pokracovat?"

---

### 3.4 Global settings panel (Tab 3 — Globalni)

**Agent:** `mp-admin-ui`
**Soubor:** `src/pages/admin/builder/components/tabs/GlobalTab.jsx`

**Obsah:**
1. **Font heading** — dropdown (DM Sans default, Inter, Poppins, Roboto...)
2. **Font body** — dropdown (Inter default, system-ui, Open Sans...)
3. **Corner radius** — slider 0-24px + ciselny input + live preview
4. **Jazyk widgetu** — cs/en dropdown (nastavi `localeDefault` na widgetu)
5. **Logo** — upload zona (drag & drop, max 2MB, JPG/PNG/SVG), nahled, tlacitko smazat
6. **Logo URL** — input pro klikaci URL loga
7. **Quick Theme** — prepinac (viz Phase 3.3, taky zobrazeny zde i v top baru)
8. **Loading skeleton** — toggle on/off
9. **Powered by** — toggle zobrazit/skryt (disablovany pokud plan nedovoluje skryt)

**Logo storage:** Base64 v `branding.logo` via `getBranding()` / `saveBranding()` z `adminBrandingWidgetStorage.js`.

---

### 3.5 Phase 3 QUALITY GATE

**Agent:** `mp-code-reviewer` + `mp-test-runner`

---

## PHASE 4: VYLEPSENI WIDGET KALKULACKY

**Cil:** Vizualni a funkcni vylepseni widgetu dle Design Report V3 sekce 5.
**POUZITI AGENTU JE POVINNE — ZAKAZANO IMPLEMENTOVAT BEZ AGENTU.**

---

### 4.1 Header komponenta

**Agent:** `mp-widget-embed`
**Soubor:** `src/pages/widget-kalkulacka/components/WidgetHeader.jsx`
**Modifikace:** `src/pages/widget-kalkulacka/index.jsx` — nahrazeni inline headeru (radky 537-550)

**Vizual (z reportu sekce 5.1):**
- Logo firmy (klikaci URL na homepage, velikost z `headerLogoSize`)
- Nazev firmy (bold, `headingFontFamily`, barva `headerColor`)
- Tagline (mensi, `mutedColor`, skryvatelny `headerTaglineVisible`)
- Pozadi: `headerBgColor`, padding: `headerPadding`
- Zarovnani: `headerAlignment` (left/center)

**Data:** Logo, companyName, tagline z branding konfigurace (predavano pres props z `WidgetPublicPage` nebo `BuilderPage`).

**Texty:** Pouziva `textHeaderTitle` a `textHeaderTagline` z theme (pokud nastaveny, jinak fallback na branding).

---

### 4.2 Stepper redesign

**Agent:** `mp-widget-embed`
**Soubor:** `src/pages/widget-kalkulacka/components/WidgetStepper.jsx`
**Modifikace:** `src/pages/widget-kalkulacka/index.jsx` — nahrazeni inline stepperu (radky 553-589)

**Vizual (z reportu sekce 5.2):**
- 3 kroky: "Nahrani modelu" > "Nastaveni" > "Souhrn a cena"
- Kazdy krok: cislo v kruhu + nazev + ikona
- Stavy: dokonceny (zelena fajfka, `stepperCompletedColor`), aktivni (modra tecka, `stepperActiveColor`), neaktivni (sedy kruh, `stepperInactiveColor`)
- Spojovaci linka: plna pro dokoncene, dashed pro budouci
- Progress bar pod steppery: vizualni postup v % (skryvatelny `stepperProgressVisible`)
- **BEZ animovanych prechodu** (rozhodnuti z V2)

---

### 4.3 Upload zone redesign

**Agent:** `mp-widget-embed`
**Modifikace:** `src/pages/widget-kalkulacka/components/FileUploadZone.jsx`

**5 vizualnich stavu (z reportu sekce 5.3):**
1. **Default:** ikona + text + tlacitko, border `uploadBorderColor`, styl `uploadBorderStyle`
2. **Hover/Drag-over:** zvyrazneni ohraniceni `uploadBorderHoverColor`, zmena pozadi
3. **Loading:** progress bar s procentem
4. **Success:** zelena fajfka + nazev souboru + velikost
5. **Error:** cerveny border + chybova zprava + "Zkusit znovu"

**Texty z theme:** `textUploadTitle`, `textUploadDescription`, `textUploadButton`
**Barvy z theme:** `uploadBgColor`, `uploadBorderColor`, `uploadIconColor`

---

### 4.4 Loading skeleton

**Agent:** `mp-widget-embed`
**Soubor:** `src/pages/widget-kalkulacka/components/WidgetSkeleton.jsx`
**Modifikace:** `src/pages/widget-public/WidgetPublicPage.jsx` (radky 162-169 — nahradit spinner)

**Vizual (z reportu sekce 5.8):**
- Sede bloky imitujici layout: header blok, stepper linka, upload obdelnik, sidebar blok
- Shimmer animace (`@keyframes shimmer` — jiz existuje v tailwind.config.js)
- Barvy: `skeletonBaseColor`, `skeletonShineColor`

**Zobrazeni:** Kdyz `loading === true` v `WidgetPublicPage`, misto spinneru zobrazit `<WidgetSkeleton />`.

---

### 4.5 Souhrn ceny s breakdown

**Agent:** `mp-widget-embed`
**Modifikace:** `src/pages/widget-kalkulacka/components/PricingCalculator.jsx`

**Vylepseni (z reportu sekce 5.6):**
- Struktura: Material + Cas tisku + Fees = Celkem bez DPH + DPH = CELKEM
- Vizualni hierarchie: velka celkova cena nahore, detaily pod ni
- Barvy z theme: `summaryBgColor`, `summaryHeaderColor`, `summaryDividerColor`, `summaryTotalBgColor`
- Font size celkove ceny: `summaryTotalFontSize`

---

### 4.6 Footer s "Powered by"

**Agent:** `mp-widget-embed`
**Soubor:** `src/pages/widget-kalkulacka/components/WidgetFooter.jsx`
**Modifikace:** `src/pages/widget-kalkulacka/index.jsx` — pridat na konec

**Vizual (z reportu sekce 5.7):**
- "Powered by ModelPricer" centrovany text
- Viditelnost rizena `showPoweredBy` (plan gating — Starter/Pro: povinne, Business: moznost skryt)
- Barvy: `footerBgColor`, `footerTextColor`, `footerLinkColor`

---

### 4.7 Theme aplikace na vsechny elementy

**Agent:** `mp-widget-embed`
- Vsechny nove komponenty MUSI pouzivat `var(--widget-*)` CSS variables
- Overit ze zmena v builderu → okamzity efekt v preview
- Overit vsech 5 Quick Theme presetu na vsech elementech

---

### 4.8 Phase 4 QUALITY GATE

**Agent:** `mp-code-reviewer` + `mp-test-runner`
- Widget kalkulacka se renderuje se vsemi novymi komponentami
- Public widget stranka funguje (zpetna kompatibilita)
- Builder preview funguje s novymi elementy

---

## PHASE 5: ADMIN WIDGET STRANKA REDESIGN

**Cil:** Reorganizace `/admin/widget` z chaotickeho 3-sloupcoveho na cisty 2-sloupcovy layout.
**POUZITI AGENTU JE POVINNE — ZAKAZANO IMPLEMENTOVAT BEZ AGENTU.**

---

### 5.1 2-column layout

**Agent:** `mp-admin-ui`
**Soubor k REFAKTORU:** `src/pages/admin/AdminWidget.jsx` (1236 radku)

**Novy layout:**
- **Levy sloupec (35%):** Seznam widgetu s kartami
- **Pravy sloupec (65%):** Detail vybraneho widgetu s taby
- **Horni bar:** "Widget Code" nadpis + plan badge + "Vytvorit widget" CTA

**ODEBRAT:** `WidgetPreview` komponenta (radky 62-113) — preview je nyni VYLUCNE v builderu.

---

### 5.2 Widget cards redesign

**Agent:** `mp-admin-ui`

**Kazda karta (z reportu sekce 4.2):**
- Barevny prouzek vlevo (4px, barva = widget primaryColor, zelena active / seda disabled)
- Nazev widgetu (tucne, DM Sans 600)
- Status badge: zelena "Active" / seda "Disabled"
- Widget ID (maly text, JetBrains Mono)
- Typ (Full/Compact) + pocet domen
- Quick actions ikony: Builder (palette), Copy embed, Duplikovat, Disable, Smazat
- Hover efekt: jemny stin + elevation
- Aktivni widget: modry border levy

---

### 5.3 Detail taby

**Agent:** `mp-admin-ui`
**Soubory:**
- `src/pages/admin/components/WidgetConfigTab.jsx`
- `src/pages/admin/components/WidgetEmbedTab.jsx`
- `src/pages/admin/components/WidgetDomainsTab.jsx`
- `src/pages/admin/components/WidgetSettingsTab.jsx`

**TAB 1 — Konfigurace:**
- Nazev widgetu (input)
- Typ: Full Calculator / Price Only (dropdown)
- Theme mode: auto/light/dark
- Primary color override (color picker)
- Sirka: auto / fixed px
- Jazyk: cs / en

**TAB 2 — Embed kod:**
- Iframe snippet (Varianta A) v textarea s monospace fontem
- "Kopirovat" tlacitko s feedback "Zkopirovano!"
- Instrukce: "Vlozte tento kod na vasi webovou stranku"

**TAB 3 — Domeny:**
- Seznam domen s toggle enabled/disabled
- "Pridat domenu" formular + podpora wildcard (`*.firma.cz`)
- Checkbox "Povolit subdomeny"
- Smazani domeny

**TAB 4 — Nastaveni:**
- Enable/Disable toggle
- Navigace do builderu (velke CTA tlacitko)
- Duplikovat widget
- Smazat widget (s potvrzenim)
- ShopID info

---

### 5.4 Phase 5 QUALITY GATE

**Agent:** `mp-code-reviewer` + `mp-test-runner`

---

## PHASE 6: ONBOARDING & POLISH

**Cil:** Prvni-spusteni pruvodce, finalizace undo/redo, embed kod.
**POUZITI AGENTU JE POVINNE — ZAKAZANO IMPLEMENTOVAT BEZ AGENTU.**

---

### 6.1 Walkthrough overlay (5 kroku)

**Agent:** `mp-admin-ui`
**Soubory:**
- `src/pages/admin/builder/components/OnboardingOverlay.jsx`
- `src/pages/admin/builder/config/onboardingSteps.js`

**5 kroku (z reportu sekce 3.5):**
1. "Vitejte ve Widget Builderu!" — celkovy prehled, overlay pres celou stranku
2. "Preview panel" — zvyrazneni praveho panelu, tooltip "Kliknete na libovolny element"
3. "Editor panel" — zvyrazneni leveho panelu, tooltip "Upravte barvy, rozmery a texty"
4. "Quick Theme" — zvyrazneni Quick Theme dropdownu v top baru
5. "Ulozeni" — zvyrazneni Save tlacitka, "Nezapomente ulozit zmeny"

**Vizual:** Polopruhledny overlay (rgba(0,0,0,0.6)) s vyrizlym oknem kolem zvyrazneneho elementu. Tooltip bublina (bile pozadi, stin) s textem + cislem kroku + "Preskocit" / "Dalsi" tlacitky.

**Storage:** `modelpricer:${tenantId}:builder:onboarding_complete` = true/false. Jednou zobrazit, pak uz ne (moznost resetovat v nastaveni).

---

### 6.2 Branding auto-apply

**Agent:** `mp-admin-ui`

**Logika v `BuilderPage.jsx` pri mount:**
```
Pokud widget.themeConfig je null NEBO je default (vsechny hodnoty === defaults):
  1. Nacti branding z getBranding(tenantId)
  2. Aplikuj: primaryColor → buttonPrimaryColor, logo → header, companyName → textHeaderTitle
  3. Nastav theme ale NEULOZ automaticky (isDirty = true, uzivatel musi potvrdit)
```

---

### 6.3 Undo/Redo finalizace

**Agent:** `mp-admin-ui`
- Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z klavesove zkratky
- Toast notifikace "Vraceno" / "Obnoveno"
- Tooltip na Undo/Redo tlacitkach: "X kroku zpet k dispozici"

---

### 6.4 Embed kod sjednoceni

**Agent:** `mp-widget-embed` + `mp-admin-ui`
**Soubor:** `src/pages/admin/AdminWidget.jsx` — funkce `buildEmbedCode()` (radek 42-60)

**Sjednotit na format z AdminWidgetBuilder (iframe Varianta A):**
```html
<!-- ModelPricer Widget: {name} -->
<iframe
  src="{origin}/w/{publicId}"
  style="width: 100%; border: none; min-height: 600px;"
  title="3D Print Calculator"
  allow="clipboard-write"
></iframe>
<script>
  window.addEventListener('message', function(e) {
    if (e.data?.type === 'MODELPRICER_RESIZE') {
      var iframe = document.querySelector('iframe[src*="{publicId}"]');
      if (iframe && e.data.height) {
        iframe.style.height = e.data.height + 'px';
      }
    }
  });
</script>
```

**ODEBRAT:** Stary format s `<div>` a data atributy.

---

### 6.5 Phase 6 QUALITY GATE

**Agent:** `mp-code-reviewer` + `mp-test-runner`

---

## PHASE 7: SECURITY & INTEGRACE

**Cil:** Zprisneni bezpecnosti, i18n, postMessage.
**POUZITI AGENTU JE POVINNE — ZAKAZANO IMPLEMENTOVAT BEZ AGENTU.**

---

### 7.1 Domain whitelist vylepseni

**Agent:** `mp-security-reviewer` (review) + `mp-storage-tenant` (implementace)
**Soubor:** `src/utils/adminBrandingWidgetStorage.js`

**Zmeny:**
- Wildcard podpora: `*.example.com` pattern
- Lepsi validace: trailing dots, double dots, IP adresy
- Chybove hlasky v cs/en

---

### 7.2 PostMessage protokol update

**Agent:** `mp-widget-embed`
**Soubory:** `src/pages/widget-kalkulacka/index.jsx`, `src/pages/widget-public/WidgetPublicPage.jsx`

**Soucasne eventy (zachovat):**
- `MODELPRICER_RESIZE`
- `MODELPRICER_WIDGET_READY` (radek 116)
- `MODELPRICER_QUOTE_CREATED` (radek 151 WidgetPublicPage)

**Nove eventy (z reportu sekce 7.1):**
- `MODELPRICER_PRICE_CALCULATED` — emituje se pri kazdem prepoctu ceny s detailnimi daty
- `MODELPRICER_ADD_TO_CART` — emituje se pri kliknuti na CTA tlacitko
- `MODELPRICER_ERROR` — emituje se pri chybe (nacitani, slicing, validace)

**Format:**
```javascript
window.parent.postMessage({
  type: 'MODELPRICER_PRICE_CALCULATED',
  publicWidgetId,
  data: { total, currency, breakdown: [...] }
}, targetOrigin);
```

---

### 7.3 Origin validace

**Agent:** `mp-security-reviewer` + `mp-widget-embed`

**Soucasny stav:** Vsude `window.parent.postMessage(data, '*')` — bezpecnostni riziko.

**Zmena:** Pouzit specifikovanou origin misto wildcard:
```javascript
// Zjistit povoleny origin z referrer nebo z konfigurace
const getTargetOrigin = () => {
  try {
    return new URL(document.referrer).origin;
  } catch {
    return '*'; // fallback pro primy pristup
  }
};
```

**Kde zmenit:**
- `widget-kalkulacka/index.jsx` radek 98 (`MODELPRICER_RESIZE`)
- `widget-kalkulacka/index.jsx` radek 116 (`MODELPRICER_WIDGET_READY`)
- `WidgetPublicPage.jsx` radek 151 (`MODELPRICER_QUOTE_CREATED`)

---

### 7.4 i18n pro vsechny nove stringy

**Agent:** `mp-i18n`
**Soubor:** `src/contexts/LanguageContext.jsx`

**Nove klice (priblizne 40-50):**
```
admin.widget.builder.title = Widget Builder
admin.widget.builder.tabs.style = Styl / Style
admin.widget.builder.tabs.elements = Elementy / Elements
admin.widget.builder.tabs.global = Globalni / Global
admin.widget.builder.save = Ulozit / Save
admin.widget.builder.reset = Resetovat / Reset
admin.widget.builder.undo = Zpet / Undo
admin.widget.builder.redo = Vpred / Redo
admin.widget.builder.unsaved = Mate neulozene zmeny / You have unsaved changes
admin.widget.builder.device.mobile = Mobil / Mobile
admin.widget.builder.device.tablet = Tablet / Tablet
admin.widget.builder.device.desktop = Desktop / Desktop
admin.widget.builder.selectElement = Kliknete na element v nahledu / Click an element in preview
admin.widget.builder.onboarding.step1.title = Vitejte ve Widget Builderu! / Welcome to Widget Builder!
admin.widget.builder.onboarding.step1.text = ... / ...
admin.widget.builder.onboarding.step2.title = ... / ...
// ... dalsi kroky onboardingu
admin.widget.builder.quickTheme.modernDark = Modern Dark
admin.widget.builder.quickTheme.cleanLight = Clean Light
admin.widget.builder.quickTheme.professionalBlue = Professional Blue
admin.widget.builder.quickTheme.warmNeutral = Warm Neutral
admin.widget.builder.quickTheme.custom = Vlastni / Custom
admin.widget.page.title = Widget Code
admin.widget.page.subtitle = Sprava widgetu a embed kodu / Widget and embed code management
admin.widget.page.tabs.config = Konfigurace / Configuration
admin.widget.page.tabs.embed = Embed kod / Embed Code
admin.widget.page.tabs.domains = Domeny / Domains
admin.widget.page.tabs.settings = Nastaveni / Settings
```

---

### 7.5 Phase 7 QUALITY GATE

**Agent:** `mp-code-reviewer` + `mp-test-runner` + `mp-security-reviewer`

---

## PHASE 8: TESTOVANI & KVALITA

**Cil:** Kompletni overeni vsech implementovanych funkci.
**POUZITI AGENTU JE POVINNE — ZAKAZANO IMPLEMENTOVAT BEZ AGENTU.**

---

### 8.1 Code review (kompletni)

**Agent:** `mp-code-reviewer`
**Checklist:**
- [ ] Import/export konzistence (default vs named)
- [ ] Zpetna kompatibilita (WidgetPublicPage, existujici widgety)
- [ ] State management spravnost (memory leaks, cleanup)
- [ ] Tenant storage — zadny hardcode tenantId
- [ ] CSS custom properties — vsechny deklarovane a pouzite
- [ ] Accessibility — ARIA labely na interaktivnich prvcich

---

### 8.2 E2E testy

**Agent:** `mp-e2e-playwright`
**Soubory:**
- `e2e/builder/builder-basic.spec.js`
- `e2e/builder/builder-theme.spec.js`
- `e2e/admin/widget-page.spec.js`

**Kriticke flow:**
1. Otevreni builderu z admin widget stranky
2. Zmena barvy elementu → live preview se aktualizuje
3. Ulozeni tematu → reload → tema perzistuje
4. Undo/redo (3 zmeny → 3x undo → 3x redo)
5. Quick theme prepnuti → vsechny barvy se zmeni
6. Device preview (mobile/tablet/desktop)
7. Element selection (klik na upload zonu → levy panel zobrazi vlastnosti)
8. Admin widget stranka: vytvoreni widgetu → kopirovani embed kodu
9. Widget public: nacitani s loading skeleton → zobrazeni kalkulacky

---

### 8.3 Performance audit

**Agent:** `mp-performance`
- Re-render pocet pri zmene 1 barvy (cil: max 2-3 re-rendery)
- Bundle velikost builderu (cil: < 200KB gzip, lazy-loaded)
- Undo/redo stack memory (cil: max 5MB pro 50 kroku)
- First paint builderu (cil: < 1s)

---

### 8.4 Accessibility audit

**Agent:** `mp-a11y`
- Keyboard navigace v builderu (Tab order, focus management)
- Kontrast textu na tmavy pozadi (WCAG AA: 4.5:1 pro normalni text)
- ARIA labely na color pickeru, sliderech, togglech
- Focus trap v onboarding overlay
- Screen reader: element selection oznameni

---

### 8.5 Browser test plan

**Agent:** `mp-browser-test-planner`
**Soubor:** `docs/claude/BROWSER_TEST_WIDGET_BUILDER_V3.md`

Detailni krok-za-krokem instrukce pro manualni testovani v Chrome extension.

---

## SOUHRNNA TABULKA SOUBORU

### Nove soubory k VYTVORENI (33):

| # | Soubor | Phase | Agent |
|---|--------|-------|-------|
| 1 | `src/pages/admin/builder/hooks/useUndoRedo.js` | 0.2 | mp-admin-ui |
| 2 | `src/pages/admin/builder/hooks/useElementSelection.js` | 0.2 | mp-admin-ui |
| 3 | `src/pages/admin/builder/hooks/useBuilderState.js` | 0.2 | mp-admin-ui |
| 4 | `src/pages/admin/builder/styles/builder-tokens.css` | 0.3 | mp-design-system |
| 5 | `src/pages/admin/builder/BuilderPage.jsx` | 1.4 | mp-admin-ui |
| 6 | `src/pages/admin/builder/components/BuilderTopBar.jsx` | 1.1 | mp-admin-ui |
| 7 | `src/pages/admin/builder/components/BuilderLeftPanel.jsx` | 1.2 | mp-admin-ui |
| 8 | `src/pages/admin/builder/components/BuilderRightPanel.jsx` | 1.3 | mp-admin-ui |
| 9 | `src/pages/admin/builder/components/DevicePreviewFrame.jsx` | 1.3 | mp-admin-ui |
| 10 | `src/pages/admin/builder/components/tabs/StyleTab.jsx` | 2.4 | mp-admin-ui |
| 11 | `src/pages/admin/builder/components/tabs/ElementsTab.jsx` | 2.2 | mp-admin-ui |
| 12 | `src/pages/admin/builder/components/tabs/GlobalTab.jsx` | 3.4 | mp-admin-ui |
| 13 | `src/pages/admin/builder/config/elementRegistry.js` | 2.1 | mp-admin-ui |
| 14 | `src/pages/admin/builder/components/editors/ColorPropertyEditor.jsx` | 2.4 | mp-admin-ui |
| 15 | `src/pages/admin/builder/components/editors/NumberPropertyEditor.jsx` | 2.4 | mp-admin-ui |
| 16 | `src/pages/admin/builder/components/editors/SelectPropertyEditor.jsx` | 2.4 | mp-admin-ui |
| 17 | `src/pages/admin/builder/components/editors/TextPropertyEditor.jsx` | 2.4 | mp-admin-ui |
| 18 | `src/pages/admin/builder/components/editors/ShadowPropertyEditor.jsx` | 2.4 | mp-admin-ui |
| 19 | `src/pages/admin/builder/components/InlineTextEditor.jsx` | 2.5 | mp-admin-ui |
| 20 | `src/pages/admin/builder/components/BuilderColorPicker.jsx` | 3.1 | mp-design-system |
| 21 | `src/pages/admin/builder/config/quickThemes.js` | 3.3 | mp-admin-ui |
| 22 | `src/pages/admin/builder/components/QuickThemeDropdown.jsx` | 3.3 | mp-admin-ui |
| 23 | `src/pages/widget-kalkulacka/components/WidgetHeader.jsx` | 4.1 | mp-widget-embed |
| 24 | `src/pages/widget-kalkulacka/components/WidgetStepper.jsx` | 4.2 | mp-widget-embed |
| 25 | `src/pages/widget-kalkulacka/components/WidgetFooter.jsx` | 4.6 | mp-widget-embed |
| 26 | `src/pages/widget-kalkulacka/components/WidgetSkeleton.jsx` | 4.4 | mp-widget-embed |
| 27 | `src/pages/admin/components/WidgetConfigTab.jsx` | 5.3 | mp-admin-ui |
| 28 | `src/pages/admin/components/WidgetEmbedTab.jsx` | 5.3 | mp-admin-ui |
| 29 | `src/pages/admin/components/WidgetDomainsTab.jsx` | 5.3 | mp-admin-ui |
| 30 | `src/pages/admin/components/WidgetSettingsTab.jsx` | 5.3 | mp-admin-ui |
| 31 | `src/pages/admin/builder/components/OnboardingOverlay.jsx` | 6.1 | mp-admin-ui |
| 32 | `src/pages/admin/builder/config/onboardingSteps.js` | 6.1 | mp-admin-ui |
| 33 | `docs/claude/Widget_Builder_Plan.md` | — | kopie tohoto planu |

### Soubory k MODIFIKACI (11):

| # | Soubor | Phase | Agent | Rozsah |
|---|--------|-------|-------|--------|
| 1 | `src/utils/widgetThemeStorage.js` | 0.1 | mp-storage-tenant | VELKY |
| 2 | `src/utils/adminBrandingWidgetStorage.js` | 0.1, 7.1 | mp-storage-tenant | STREDNI |
| 3 | `src/pages/admin/AdminWidgetBuilder.jsx` | 1.4 | mp-admin-ui | KOMPLETNI PREPIS |
| 4 | `src/Routes.jsx` | 1.4 | mp-frontend-react | MALY (1 route) |
| 5 | `src/pages/widget-kalkulacka/index.jsx` | 2.3, 4.* | mp-widget-embed | VELKY |
| 6 | `src/pages/widget-kalkulacka/components/FileUploadZone.jsx` | 4.3 | mp-widget-embed | STREDNI |
| 7 | `src/pages/widget-kalkulacka/components/PricingCalculator.jsx` | 4.5 | mp-widget-embed | STREDNI |
| 8 | `src/pages/widget-public/WidgetPublicPage.jsx` | 4.4, 7.2, 7.3 | mp-widget-embed | STREDNI |
| 9 | `src/pages/admin/AdminWidget.jsx` | 5.* | mp-admin-ui | VELKY REFACTOR |
| 10 | `src/contexts/LanguageContext.jsx` | 7.4 | mp-i18n | STREDNI |
| 11 | `index.html` | 0.4 | mp-design-system | MALY |

### Soubory ktere se NESMI menit:

| Soubor | Duvod |
|--------|-------|
| `src/pages/test-kalkulacka/*` | CLAUDE.md sekce 10 |
| `src/lib/pricing/pricingEngineV3.js` | Pricing engine — mimo scope |
| `src/utils/adminTenantStorage.js` | Entrypoint — nemen bez duvodu |

---

## SPRINT PLAN (doporucene poradi implementace)

### Sprint 1: ZAKLAD + BUILDER SHELL (Phase 0 + 1)
**Paralelni agenti:**
- `mp-storage-tenant` → Phase 0.1 (schema)
- `mp-design-system` → Phase 0.3 + 0.4 (tokeny + fonty)
- Po dokonceni: `mp-admin-ui` → Phase 0.2 (hooky)
- `mp-admin-ui` → Phase 1.1-1.3 (builder komponenty)
- `mp-frontend-react` → Phase 1.4 (routing)
- `mp-admin-ui` → Phase 1.4 (BuilderPage)
- QUALITY GATE: `mp-code-reviewer` + `mp-test-runner`

### Sprint 2: ELEMENT SYSTEM (Phase 2)
**Paralelni agenti:**
- `mp-admin-ui` → Phase 2.1, 2.2, 2.4, 2.5 (registr, tree, editor, texty)
- `mp-widget-embed` → Phase 2.3 (StyleableWrapper rozsireni)
- QUALITY GATE: `mp-code-reviewer` + `mp-test-runner`

### Sprint 3: POKROCILE FUNKCE (Phase 3 + 4)
**Paralelni agenti:**
- `mp-design-system` → Phase 3.1 (color picker)
- `mp-admin-ui` → Phase 3.2, 3.3, 3.4 (device, themes, global)
- `mp-widget-embed` → Phase 4.1-4.7 (widget vylepseni)
- QUALITY GATE: `mp-code-reviewer` + `mp-test-runner`

### Sprint 4: ADMIN + ONBOARDING (Phase 5 + 6)
**Paralelni agenti:**
- `mp-admin-ui` → Phase 5.1-5.3 (admin redesign)
- `mp-admin-ui` → Phase 6.1, 6.2, 6.3 (onboarding, branding, undo)
- `mp-widget-embed` → Phase 6.4 (embed kod)
- QUALITY GATE: `mp-code-reviewer` + `mp-test-runner`

### Sprint 5: SECURITY + TESTING (Phase 7 + 8)
**Paralelni agenti:**
- `mp-security-reviewer` → Phase 7.1, 7.3 (review)
- `mp-storage-tenant` → Phase 7.1 (domain implementace)
- `mp-widget-embed` → Phase 7.2, 7.3 (postMessage)
- `mp-i18n` → Phase 7.4 (preklady)
- `mp-code-reviewer` → Phase 8.1 (finalni review)
- `mp-e2e-playwright` → Phase 8.2 (testy)
- `mp-performance` → Phase 8.3 (audit)
- `mp-a11y` → Phase 8.4 (pristupnost)
- `mp-browser-test-planner` → Phase 8.5 (manual test plan)

---

## VERIFIKACE (End-to-End)

### Jak overit ze vse funguje:

1. **`npm run build`** — musi projit bez chyb
2. **`npm run dev`** — spustit na localhost:4028
3. **Builder flow:**
   - Navigovat na `/admin/widget`
   - Vytvorit novy widget
   - Kliknout na Builder ikonu → otevrit builder
   - Zmenit barvu pozadi → preview se aktualizuje
   - Kliknout na element v preview → levy panel zobrazi vlastnosti
   - Zmenit text headeru → text v preview se zmeni
   - Prepnout Quick Theme → vsechny barvy se zmeni
   - Prepnout device (mobile/tablet/desktop) → preview meni sirku
   - Undo 3x → Redo 3x → stav odpovida
   - Ulozit → reload → zmeny perzistuji
4. **Admin widget flow:**
   - 2-sloupcovy layout (widget karty vlevo, detail vpravo)
   - Taby: Konfigurace, Embed kod, Domeny, Nastaveni
   - Kopirovani embed kodu → spravny iframe format
5. **Widget public flow:**
   - Otevrit `/w/{publicId}` → loading skeleton → kalkulacka
   - Novy header s logem a nazvem
   - Redesignovany stepper s progress barem
   - Upload zona s 5 stavy
   - Footer "Powered by ModelPricer"
6. **Security:**
   - PostMessage pouziva specifikovanou origin (ne `*`)
   - Domain whitelist blokuje nepovolene domeny

---

## KONEC PLANU

**Tento plan je jediny zdroj pravdy pro implementaci Widget Builder V3.**
**Vsechny detaily vychazi z Design Report V3 (`docs/claude/ModelPricer - Widget Design Report V3.md`).**
**Pri implementaci VZDY pouzivat specifikovane agenty — je zakazano implementovat bez nich.**
