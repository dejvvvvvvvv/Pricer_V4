# Slicer Page — Dokumentace

> **Route:** `/slicer`
> **Stav:** Static UI Shell (pouze vizualni, bez funkcnosti)
> **Vytvoreno:** 2026-02-12
> **Design system:** Forge (dark theme)
> **Technologie:** React 19, JSX, inline styles, Forge CSS variables, lucide-react ikony

---

## 1) Prehled

Full-screen slicer rozhrani inspirovane FABSHIFT layoutem, ale pouzivajici **standardni Forge barevne schema** (#00D4AA teal accent, tmave pozadi). Stranka je **lazy-loaded** a bezi **mimo Header/Footer** wrapper (stejny pattern jako Widget Builder).

Vsechny panely, dropdowny, toggley, slidery a tlacitka jsou pritomne s **mock daty** — zadna realna funkcnost (PrusaSlicer integrace, 3D canvas atd.) se doplni pozdeji.

**Klicova rozhodnuti:**
- Existujici UI komponenty (`Select`, `Input`, `Button`, `Card`) jsou light-themed (bile pozadi, Tailwind) — pro slicer se **nepouzivaji**
- Vsechny komponenty pouzivaji **inline styles** s Forge CSS variables z `src/styles/forge-tokens.css`
- Kazdy komponent obsahuje vlastni `DarkSelect`, `DarkToggle`, `DarkSlider` helpery kde je treba (definovane inline, ne exportovane)
- Zadny novy CSS soubor — pouzivaji se existujici forge tokeny beze zmen

---

## 2) Souborovy strom

```
src/pages/slicer/
|
|-- index.jsx .......................... [ENTRY] Page entry, default export, lazy-loaded z Routes.jsx
|-- mockData.js ........................ [DATA]  Vsechna mock data (SLICER_MOCK objekt)
|
+-- components/
    |
    |  === CORE (grid areas — vzdy viditelne) ===
    |
    |-- SlicerLayout.jsx ............... CSS Grid shell, obaluje celou stranku
    |-- SlicerTopBar.jsx ............... Horni lista: logo FORGE, pill tabs, user avatar
    |-- SlicerLeftPanel.jsx ............ Levy panel: printer select, gizmo, tool buttons, XYZ pozice
    |-- SlicerViewport.jsx ............. Centralni viewport: grid pozadi + build plate kruh placeholder
    |-- SlicerRightPanel.jsx ........... Pravy panel: print settings — nejvetsi komponent (265 radku)
    |
    |  === FLOATING (position: absolute uvnitr Viewportu) ===
    |
    |-- SlicerMaterialsPanel.jsx ....... Floating center-top: 2 materialy, tab switcher, settings
    |-- SlicerObjectsPanel.jsx ......... Floating bottom-left: object tree + rozmery
    |-- SlicerSimulationBar.jsx ........ Floating bottom-center: play, cas, slider, speed buttons
    |-- SlicerSlicePanel.jsx ........... Floating bottom-right: AI/Manual radio + Slice button
    |
    |  === UTIL (znovupouzitelne/pomocne) ===
    |
    |-- SlicerPillTabs.jsx ............. Reusable pill-style tab switcher
    |-- SlicerAxisGizmo.jsx ............ SVG 80x80: X(cervena)/Y(zelena)/Z(modra) osy
```

### Modifikovane externi soubory

| Soubor | Zmena |
|--------|-------|
| `src/Routes.jsx` | Pridana `/slicer` route (lazy-loaded, `React.lazy`, mimo Header/Footer) |

### Nemodifikovane soubory:
- `src/styles/forge-tokens.css` — pouziva existujici tokeny beze zmen
- Zadne existujici UI komponenty
- Zadne nove CSS soubory

---

## 3) Souborove statistiky

| Soubor | Radky | Kategorie | Popis |
|--------|------:|-----------|-------|
| `SlicerRightPanel.jsx` | 265 | CORE | Nejvetsi — presets, infill, support, adhesion |
| `SlicerLeftPanel.jsx` | 181 | CORE | Printer select, axis gizmo, tool buttons, pozice |
| `SlicerMaterialsPanel.jsx` | 151 | FLOAT | Material sloty, tab switcher, enable/material/core |
| `SlicerSlicePanel.jsx` | 96 | FLOAT | Radio options (AI/Manual) + Slice button |
| `SlicerSimulationBar.jsx` | 93 | FLOAT | Playback: play, cas, slider, speed |
| `SlicerObjectsPanel.jsx` | 71 | FLOAT | Object tree + rozmery (length/width/height) |
| `SlicerTopBar.jsx` | 70 | CORE | Logo + Workshop/Viewer/Monitor tabs + user |
| `mockData.js` | 64 | DATA | SLICER_MOCK objekt se vsemi mock daty |
| `SlicerViewport.jsx` | 58 | CORE | Grid pozadi + build plate kruh |
| `SlicerPillTabs.jsx` | 38 | UTIL | Pill tabs (props: tabs, activeTab, onTabChange, size) |
| `index.jsx` | 26 | ENTRY | Importy vsech komponent + SlicerPage wrapper |
| `SlicerAxisGizmo.jsx` | 25 | UTIL | SVG 80x80 — X/Y/Z osy s kruhy a labely |
| `SlicerLayout.jsx` | 20 | CORE | CSS Grid shell |
| **Celkem** | **1158** | | **13 souboru** |

---

## 4) Layout (CSS Grid)

```
+----------------------------------------------------------+
|  TopBar (52px): Logo | Workshop/Viewer/Monitor | User    |
+--------+-----------------------------------+--------------+
| Left   |  Viewport (position: relative)    | Right Panel  |
| Panel  |                                   | (scrollable) |
| 260px  |  [MaterialsPanel]  abs top-center |    320px     |
|        |                                   |              |
|        |                                   |              |
|        |  [Objects] [SimBar] [SlicePanel]  |              |
|        |  abs bot-L   bot-C    bot-R       |              |
+--------+-----------------------------------+--------------+
```

**Grid definice** (`SlicerLayout.jsx`):
```css
display: grid;
grid-template-rows: 52px 1fr;
grid-template-columns: 260px 1fr 320px;
grid-template-areas: "topbar topbar topbar" "left viewport right";
height: 100vh;
overflow: hidden;
```

**Jak to funguje:**
- TopBar zabira celou sirku (3 sloupce)
- Levy panel (260px) a pravy panel (320px) maji fixni sirku
- Viewport vyplni zbytek (`1fr`)
- Floating panely jsou `position: absolute` uvnitr Viewportu (`position: relative`)

---

## 5) Forge Theme — barevne schema

Stranka pouziva **vylucne** existujici Forge CSS variables bez jakychkoli uprav.

### Pouzite barvy

| Ucel | CSS Variable | Hodnota |
|------|-------------|---------|
| Hlavni accent (tabs, toggles, slider, Slice btn) | `--forge-accent-primary` | `#00D4AA` (teal) |
| Hover accent | `--forge-accent-primary-h` | `#00F0C0` |
| Subtle accent pozadi | `--forge-accent-primary-ghost` | `rgba(0,212,170,0.06)` |
| Pozadi cele stranky | `--forge-bg-void` | `#08090C` |
| Pozadi panelu (left, right, floating) | `--forge-bg-surface` | `#0E1015` |
| Pozadi elevated prvku (karty, inputy, buttony) | `--forge-bg-elevated` | `#161920` |
| Overlay (dropdown options hover) | `--forge-bg-overlay` | `#1C1F28` |
| Text primarni | `--forge-text-primary` | `#E8ECF1` |
| Text sekundarni | `--forge-text-secondary` | `#9BA3B0` |
| Text muted (labely, hints) | `--forge-text-muted` | `#7A8291` |
| Bordery vsude | `--forge-border-default` | `#1E2230` |
| Viewport grid cary | `--forge-border-grid` | `#141720` |
| Shadows na floating panelech | `--forge-shadow-lg` | dark multi-layer shadow |

### Pouzite fonty

| Font variable | Kde se pouziva |
|---------------|---------------|
| `--forge-font-body` (IBM Plex Sans) | Vsechny labely, popisy, dropdown texty |
| `--forge-font-heading` (Space Grotesk) | Section titles ("Print Settings", "Materials", "FORGE") |
| `--forge-font-tech` (Space Mono) | Casy, rozmery, pozice XYZ, summary badges, speed buttons |

### Proc ne existujici UI komponenty?

Existujici `Select.jsx`, `Input.jsx`, `Button.jsx`, `Card.jsx` pouzivaji:
- **Tailwind classes** (`bg-white`, `text-black`, `border-input`)
- **Radix primitives** (`@radix-ui/react-slider`)
- **Light theme** (bile pozadi, cerne texty)

Pro dark slicer kontext by vyzadovaly rozsahle CSS override — jednodussi a cistsi bylo pouzit inline styles primo s Forge CSS variables.

---

## 6) Interni Helper Komponenty

Tyto komponenty jsou definovane **uvnitr** souboru kde se pouzivaji. Nejsou exportovane — jsou lokalni.

| Helper | Definovan v | Popis |
|--------|-------------|-------|
| `DarkSelect` | LeftPanel, MaterialsPanel, RightPanel | Dark dropdown — button s chevronem, absolute positioned options, hover efekty |
| `DarkToggle` | MaterialsPanel, RightPanel | Toggle switch — teal track kdyz ON, tmavy kdyz OFF, animovany knob |
| `DarkSlider` | RightPanel | `<input type="range">` s teal gradient fill |
| `DarkInput` | LeftPanel, RightPanel | Read-only input s `--forge-font-tech`, optional suffix ("mm") |
| `SectionDivider` | RightPanel | Tenka horizontalni cara s textem uprostred |
| `SectionHeader` | RightPanel | Nadpis sekce s optional teal badge a children slot (pro toggle) |
| `Tag` | RightPanel | Maly inline badge ("Fast 0.2 mm", "Infill 20%") |
| `RadioOption` | RightPanel | Custom radio s barevnym kruhem a teal ring kdyz selected |

**Poznamka:** `DarkSelect` a `DarkToggle` jsou duplikovane ve 3 resp. 2 souborech. Pri budoucim refactoru zvazit extrakci do sdileneho `SlicerFormElements.jsx`.

---

## 7) Mock Data (mockData.js)

Exportuje jediny objekt `SLICER_MOCK`. Vsechny komponenty importuji data z tohoto jednoho mista.

| Klic | Typ | Pouziva |
|------|-----|---------|
| `printer` | `{value, label}` | LeftPanel — aktualne vybrany printer |
| `printerOptions` | `Array<{value, label}>` | LeftPanel — dropdown options |
| `position` | `{x, y, z}` strings | LeftPanel — XYZ pozice s lock ikonami |
| `materials` | `Array<{name, spec, color}>` | MaterialsPanel — material sloty |
| `materialOptions` | `Array<{value, label}>` | MaterialsPanel — material dropdown |
| `printCoreOptions` | `Array<{value, label}>` | MaterialsPanel — print core dropdown |
| `presets` | `Array<{key, label, icon}>` | RightPanel — 4 preset karty |
| `selectedPreset` | `string` ("balanced") | RightPanel — ktera karta je selected |
| `resolutionOptions` | `Array<{value, label}>` | RightPanel — resolution dropdown |
| `infill` | `{density, pattern}` | RightPanel — infill slider + pattern select |
| `patternOptions` | `Array<{value, label}>` | RightPanel — pattern dropdown |
| `shell` | `{wall, topBottom}` strings | RightPanel — shell thickness inputs |
| `support` | `{enabled, type, placement}` | RightPanel — support toggle + selects |
| `supportTypeOptions` | `Array<{value, label}>` | RightPanel — support type dropdown |
| `placementOptions` | `Array<{value, label}>` | RightPanel — placement dropdown |
| `adhesion` | `{enabled}` | RightPanel — adhesion toggle |
| `object` | `{filename, dimensions}` | ObjectsPanel — nazev STL + rozmery |
| `simulation` | `{currentTime, totalTime, progress, speed, speeds}` | SimulationBar — playback controls |

---

## 8) Routing

```jsx
// v src/Routes.jsx — PRED catch-all route, MIMO Header/Footer wrapper:

const SlicerPage = React.lazy(() => import('./pages/slicer'));

<Route path="/slicer" element={
  <Suspense fallback={<div style={{
    width:'100vw', height:'100vh', display:'flex',
    alignItems:'center', justifyContent:'center',
    background:'var(--forge-bg-void, #08090C)',
    color:'var(--forge-text-primary, #E8ECF1)'
  }}>Loading Slicer...</div>}>
    <SlicerPage />
  </Suspense>
} />
```

**Dulezite vlastnosti:**
- **Lazy-loaded** = separatni chunk (~32 KB), nema vliv na main bundle
- **Mimo Header/Footer** = stejny pattern jako `/w/:publicWidgetId` a `/admin/widget/builder/:id`
- **Fallback:** tmave pozadi (#08090C) s "Loading Slicer..." textem aby nebyl bily flash
- **Pozice v Routes.jsx:** pred `<Route path="*">` catch-all (jinak by se nenaslo)

---

## 9) Zavislosti

### Externi (vsechny uz v projektu — zadne nove pridany):

| Balicek | Pouziti v slicer strance |
|---------|--------------------------|
| `react` | Komponenty, `useState`, hooks |
| `react-router-dom` | `<Route>` v Routes.jsx, `<Suspense>` |
| `lucide-react` | Ikony: Download, FlipHorizontal2, RotateCw, Maximize, ScanSearch, Lock, ChevronDown, ChevronUp, ChevronRight, Settings, Eye, Scale, Zap, Play, Trash2, Box, Check |

### Interni zavislosti:

| Soubor | Importuje |
|--------|-----------|
| `index.jsx` | Vsech 9 komponent (Layout, TopBar, LeftPanel, Viewport, RightPanel, MaterialsPanel, ObjectsPanel, SimulationBar, SlicePanel) |
| `SlicerTopBar.jsx` | `SlicerPillTabs` |
| `SlicerLeftPanel.jsx` | `SlicerAxisGizmo`, `mockData.js` |
| `SlicerMaterialsPanel.jsx` | `SlicerPillTabs`, `mockData.js` |
| `SlicerRightPanel.jsx` | `SlicerPillTabs`, `mockData.js` |
| `SlicerObjectsPanel.jsx` | `mockData.js` |
| `SlicerSimulationBar.jsx` | `mockData.js` |
| `SlicerSlicePanel.jsx` | `mockData.js` |

### Globalni CSS:
- `src/styles/forge-tokens.css` — importovano globalne v app entry, neni treba import v komponentach

---

## 10) Budouci TODO

Aktualne je stranka **pouze vizualni shell**. Planovana funkcnost:

| Oblast | Popis | Priorita |
|--------|-------|----------|
| 3D Viewer | Three.js / React Three Fiber canvas misto placeholder kruhu ve Viewportu | P1 |
| STL Upload | Drag & drop + file input pro nahrani modelu do viewportu | P1 |
| PrusaSlicer integrace | Backend volani — slicing, cas, material vypocet | P1 |
| Realna data | Napojeni na admin config (printery, materialy, presets) misto mock dat | P2 |
| Material DB | Databaze materialu z admin panelu | P2 |
| Stav komponent | Propojeni dropdownu/slideru tak aby menily stav (aktualne jen vizualni) | P2 |
| Simulace playback | Realny layer-by-layer playback ze slicer vystupu | P3 |
| Responsivita | Mobilni/tabletovy layout (aktualne jen desktop fixed grid) | P3 |
| Keyboard shortcuts | Ctrl+Z undo, Space play/pause, R rotate, S scale | P3 |
| Dark form components | Extrakce DarkSelect/DarkToggle/DarkSlider do sdileneho modulu | P3 |

---

## 11) Rychla reference pro budouci upravy

### Pridat novy floating panel do viewportu:
1. Vytvor `src/pages/slicer/components/SlicerNovyPanel.jsx`
2. Pouzij `position: absolute` + prislusne `top/bottom/left/right`
3. Pozadi: `var(--forge-bg-surface)`, border: `var(--forge-border-default)`, border-radius: `var(--forge-radius-lg)`
4. Importuj v `index.jsx` a vloz jako child `<SlicerViewport>`

### Zmenit mock data:
1. Uprav `src/pages/slicer/mockData.js` — vsechny komponenty importuji `SLICER_MOCK`

### Pridat novy tool button do leveho panelu:
1. Uprav pole `tools` v `SlicerLeftPanel.jsx` (cca radek 80)
2. Pridej `{ icon: LucideIkona, tip: 'Nazev' }`

### Zmenit grid layout (sirky panelu):
1. Uprav `SlicerLayout.jsx` — `gridTemplateColumns: '260px 1fr 320px'`
2. Zmen hodnoty 260px (levy) nebo 320px (pravy) podle potreby

### Nahradit placeholder real 3D canvasem:
1. `npm install @react-three/fiber @react-three/drei`
2. Uprav `SlicerViewport.jsx` — nahrad SVG kruh za `<Canvas>` z `@react-three/fiber`
3. Build plate kruh a grid ponech nebo presun do Three.js sceny

### Extrahovat sdilene dark form helpery:
1. Vytvor `src/pages/slicer/components/SlicerFormElements.jsx`
2. Presun `DarkSelect`, `DarkToggle`, `DarkSlider`, `DarkInput` a exportuj je
3. Aktualizuj importy v LeftPanel, MaterialsPanel, RightPanel

### Pridat novou sekci do RightPanel:
1. Pouzij `<SectionDivider text="Nazev" />` pro oddeleni
2. Pouzij `<SectionHeader title="Nazev">` s optional `badge` a children (toggle)
3. Pridej obsah (DarkSelect, DarkSlider, atd.)
