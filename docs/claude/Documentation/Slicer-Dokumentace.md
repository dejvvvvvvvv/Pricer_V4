# Slicer — Dokumentace

> PrusaSlicer integrace pro slicovani 3D modelu. Full-screen rozhrani inspirovane
> FABSHIFT layoutem, pouzivajici Forge dark theme. Aktualne **static UI shell** —
> pouze vizualni, bez realne slicer funkcnosti.

---

## 1. Prehled (URL /slicer)

Slicer stranka (`/slicer`) je full-screen rozhrani pro budouci PrusaSlicer integraci. Obsahuje
kompletni vizualni shell se vsemi panely, ovladacimi prvky a mock daty, ale zadna realna
funkcnost (slicovani, 3D canvas, upload) zatim neni implementovana.

**Klicove charakteristiky:**
- **Full-screen layout** — bezi **mimo Header/Footer** wrapper (stejny pattern jako Widget Builder a Widget Public)
- **Lazy-loaded** — separatni chunk, nema vliv na main bundle
- **CSS Grid** — 3-sloupcovy layout s fixnimi panely a flexibilnim viewportem
- **Mock data** — vsechny hodnoty pochazi z jednoho `mockData.js` souboru
- **Inline styles** — zadne externi CSS soubory, pouziva Forge CSS variables primo

**Vizualni struktura (5 oblasti):**
1. **TopBar** — logo FORGE, pill tabs (Workshop/Viewer/Monitor), user avatar
2. **Left Panel** — vyber tiskany, axis gizmo (SVG), nastroje, XYZ pozice
3. **Viewport** — centralni oblast s grid pozadim a build plate kruhem
4. **Right Panel** — print settings (presets, resolution, infill, support, adhesion)
5. **Floating panely** — materials, objects, simulation bar, slice panel (uvnitr Viewportu)

---

## 2. Technologie a jazyk

| Polozka | Hodnota |
|---------|---------|
| Framework | React 19 |
| Bundler | Vite |
| Jazyk | JavaScript + JSX |
| Styling | Inline styles s Forge CSS variables z `forge-tokens.css` |
| CSS | **Zadny** vlastni CSS soubor — vylucne inline styles |
| Routing | React Router v6 (`/slicer` route, lazy-loaded) |
| i18n | **NEPOUZIVA** `useLanguage()` — vsechny texty hardcoded anglicky |
| Ikony | lucide-react (17 ikon) |
| State | Lokalni `useState` v kazde komponente, zadny globalni state |

### Proc nepouziva existujici UI komponenty

Existujici `Select.jsx`, `Input.jsx`, `Button.jsx`, `Card.jsx` pouzivaji:
- **Tailwind classes** (`bg-white`, `text-black`, `border-input`)
- **Radix primitives** (`@radix-ui/react-slider`)
- **Light theme** (bile pozadi, cerne texty)

Pro dark slicer kontext by vyzadovaly rozsahle CSS override. Proto vsechny komponenty pouzivaji
**inline styles** s Forge CSS variables.

---

## 3. Architektura souboru (hlavni + subkomponenty)

```
src/pages/slicer/
|
|-- index.jsx .......................... [ENTRY] 26 r. — Page entry, default export
|-- mockData.js ........................ [DATA]  64 r. — Vsechna mock data (SLICER_MOCK)
|
+-- components/
    |
    |  === CORE (grid areas — vzdy viditelne) ===
    |
    |-- SlicerLayout.jsx ............... 20 r. — CSS Grid shell (3 sloupce, 2 radky)
    |-- SlicerTopBar.jsx ............... 70 r. — Horni lista: logo, tabs, user avatar
    |-- SlicerLeftPanel.jsx ............ 181 r. — Printer select, gizmo, tools, XYZ pozice
    |-- SlicerViewport.jsx ............. 58 r. — Grid pozadi + build plate kruh + children
    |-- SlicerRightPanel.jsx ........... 265 r. — Print settings (nejvetsi komponenta)
    |
    |  === FLOATING (position: absolute uvnitr Viewportu) ===
    |
    |-- SlicerMaterialsPanel.jsx ....... 151 r. — Center-top: material sloty, tabs, settings
    |-- SlicerObjectsPanel.jsx ......... 71 r. — Bottom-left: object tree + rozmery
    |-- SlicerSimulationBar.jsx ........ 93 r. — Bottom-center: playback, slider, speed
    |-- SlicerSlicePanel.jsx ........... 96 r. — Bottom-right: AI/Manual radio + Slice btn
    |
    |  === UTIL (znovupouzitelne/pomocne) ===
    |
    |-- SlicerPillTabs.jsx ............. 38 r. — Reusable pill-style tab switcher
    |-- SlicerAxisGizmo.jsx ............ 25 r. — SVG 80x80: X/Y/Z osy s kruhy a labely
```

### Souhrn

| Metrika | Hodnota |
|---------|---------|
| Celkem souboru | 13 |
| Celkem radku | ~1158 |
| Komponenty (exportovane) | 11 |
| Interni helpery (neexportovane) | 8 |
| Nejvetsi soubor | SlicerRightPanel.jsx (265 r.) |
| Nejmensi soubor | SlicerLayout.jsx (20 r.) |

### Modifikovane externi soubory

| Soubor | Zmena |
|--------|-------|
| `src/Routes.jsx:38` | Pridana `/slicer` route — lazy-loaded, mimo Header/Footer |

### Nepouzivane externi zavislosti
- Zadne nove CSS soubory — pouziva existujici `forge-tokens.css` beze zmen
- Zadne existujici UI komponenty z `src/components/ui/`
- Zadne nove npm balicky

---

## 4. Import graf

### 4.1 Co kazdy soubor importuje

| Soubor | Importuje z | Co |
|--------|------------|-----|
| `index.jsx` | `./components/*` | SlicerLayout, SlicerTopBar, SlicerLeftPanel, SlicerViewport, SlicerRightPanel, SlicerMaterialsPanel, SlicerObjectsPanel, SlicerSimulationBar, SlicerSlicePanel |
| `SlicerTopBar.jsx` | `./SlicerPillTabs` | SlicerPillTabs (default) |
| `SlicerTopBar.jsx` | `react` | React, useState |
| `SlicerLeftPanel.jsx` | `lucide-react` | Download, FlipHorizontal2, RotateCw, Maximize, ScanSearch, Lock, ChevronDown |
| `SlicerLeftPanel.jsx` | `./SlicerAxisGizmo` | SlicerAxisGizmo (default) |
| `SlicerLeftPanel.jsx` | `../mockData` | SLICER_MOCK (named) |
| `SlicerRightPanel.jsx` | `lucide-react` | Settings, Eye, Scale, Zap, ChevronUp |
| `SlicerRightPanel.jsx` | `./SlicerPillTabs` | SlicerPillTabs (default) |
| `SlicerRightPanel.jsx` | `../mockData` | SLICER_MOCK (named) |
| `SlicerMaterialsPanel.jsx` | `lucide-react` | ChevronUp, ChevronDown |
| `SlicerMaterialsPanel.jsx` | `./SlicerPillTabs` | SlicerPillTabs (default) |
| `SlicerMaterialsPanel.jsx` | `../mockData` | SLICER_MOCK (named) |
| `SlicerObjectsPanel.jsx` | `lucide-react` | ChevronRight, ChevronDown, Trash2, Box |
| `SlicerObjectsPanel.jsx` | `../mockData` | SLICER_MOCK (named) |
| `SlicerSimulationBar.jsx` | `lucide-react` | Play |
| `SlicerSimulationBar.jsx` | `../mockData` | SLICER_MOCK (named) |
| `SlicerSlicePanel.jsx` | `lucide-react` | Check |
| `SlicerSlicePanel.jsx` | `../mockData` | SLICER_MOCK (named) |
| `SlicerViewport.jsx` | `react` | React |
| `SlicerLayout.jsx` | `react` | React |
| `SlicerAxisGizmo.jsx` | `react` | React |
| `SlicerPillTabs.jsx` | `react` | React |

### 4.2 Co importuje SlicerPage

| Soubor | Jak |
|--------|-----|
| `src/Routes.jsx` | `React.lazy(() => import('./pages/slicer'))` — lazy-loaded na route `/slicer` |

### 4.3 Vizualni graf zavislosti

```
Routes.jsx
  |
  +-- [lazy] index.jsx (SlicerPage)
                |
                +-- SlicerLayout.jsx
                +-- SlicerTopBar.jsx -------> SlicerPillTabs.jsx
                +-- SlicerLeftPanel.jsx ----> SlicerAxisGizmo.jsx, mockData.js
                +-- SlicerViewport.jsx
                |     |
                |     +-- SlicerMaterialsPanel.jsx --> SlicerPillTabs.jsx, mockData.js
                |     +-- SlicerObjectsPanel.jsx ----> mockData.js
                |     +-- SlicerSimulationBar.jsx ---> mockData.js
                |     +-- SlicerSlicePanel.jsx ------> mockData.js
                |
                +-- SlicerRightPanel.jsx ---> SlicerPillTabs.jsx, mockData.js
```

### 4.4 Pouzite lucide-react ikony (17 celkem)

| Ikona | Pouzita v |
|-------|-----------|
| Download | SlicerLeftPanel (tool: Import) |
| FlipHorizontal2 | SlicerLeftPanel (tool: Mirror) |
| RotateCw | SlicerLeftPanel (tool: Rotate) |
| Maximize | SlicerLeftPanel (tool: Scale) |
| ScanSearch | SlicerLeftPanel (tool: Measure) |
| Lock | SlicerLeftPanel (XYZ position ikony) |
| ChevronDown | SlicerLeftPanel, SlicerMaterialsPanel, SlicerObjectsPanel |
| ChevronUp | SlicerRightPanel, SlicerMaterialsPanel |
| ChevronRight | SlicerObjectsPanel |
| Settings | SlicerRightPanel (ikona v headeru + preset karta "Engineering") |
| Eye | SlicerRightPanel (preset karta "Visual") |
| Scale | SlicerRightPanel (preset karta "Balanced") |
| Zap | SlicerRightPanel (preset karta "Draft") |
| Play | SlicerSimulationBar (playback tlacitko) |
| Trash2 | SlicerObjectsPanel (mazani objektu) |
| Box | SlicerObjectsPanel (ikona STL souboru) |
| Check | SlicerSlicePanel (radio checkmark) |

---

## 5. Design a vizual (Forge compliance)

### 5.1 Layout (CSS Grid)

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

**Grid definice** (SlicerLayout.jsx):
```css
display: grid;
grid-template-rows: 52px 1fr;
grid-template-columns: 260px 1fr 320px;
grid-template-areas: "topbar topbar topbar" "left viewport right";
height: 100vh;
width: 100vw;
overflow: hidden;
```

**Jak to funguje:**
- TopBar zabira celou sirku (3 sloupce) pres `grid-area: topbar`
- Levy panel (260px) a pravy panel (320px) maji fixni sirku
- Viewport vyplni zbytek (`1fr`)
- Floating panely jsou `position: absolute` uvnitr Viewportu (`position: relative`)
- Viewport pouziva `overflow: hidden` — floating panely nepresahuji

### 5.2 Pouzite Forge barvy

| Ucel | CSS Variable | Hodnota | Kde |
|------|-------------|---------|-----|
| Hlavni accent | `--forge-accent-primary` | `#00D4AA` | Tabs, toggles, slider, Slice btn, gizmo Y |
| Hover accent | `--forge-accent-primary-h` | `#00F0C0` | Slice btn hover |
| Ghost pozadi | `--forge-accent-primary-ghost` | `rgba(0,212,170,0.06)` | Selected dropdown items, slice method bg |
| Cele pozadi | `--forge-bg-void` | `#08090C` | Pozadi stranky, viewport |
| Panely | `--forge-bg-surface` | `#0E1015` | Left, right, floating panely, topbar |
| Elevated | `--forge-bg-elevated` | `#161920` | Inputy, buttony, dropdown bg, speed btns |
| Overlay | `--forge-bg-overlay` | `#1C1F28` | Dropdown hover, toggle OFF, slider bg |
| Text primarni | `--forge-text-primary` | `#E8ECF1` | Vsechny hlavni texty |
| Text sekundarni | `--forge-text-secondary` | `#9BA3B0` | Tool buttons, toggle labely, user avatar |
| Text muted | `--forge-text-muted` | `#7A8291` | Labely, hinty, section divider text |
| Bordery | `--forge-border-default` | `#1E2230` | Vsechny panely, inputy, dropdown |
| Grid cary | `--forge-border-grid` | `#141720` | Viewport background grid |
| Shadow | `--forge-shadow-lg` | Dark multi-layer | Floating panely |
| Shadow (md) | `--forge-shadow-md` | Dark multi-layer | Dropdown menus |

### 5.3 Pouzite fonty

| Font variable | Kde se pouziva | Priklady |
|---------------|---------------|----------|
| `--forge-font-body` (IBM Plex Sans) | Vsechny labely, popisy, dropdown texty, toggle labely | DarkSelect texty, section labely |
| `--forge-font-heading` (Space Grotesk) | Section titles, panel headery | "FORGE", "Print Settings", "Materials", "Objects", "Position" |
| `--forge-font-tech` (Space Mono) | Casy, rozmery, pozice XYZ, summary badges, speed buttons | XYZ hodnoty, "11:27:12", "Fast 0.2 mm", "1x/5x/100x" |

### 5.4 Pouzite radii

| Token | Hodnota | Kde |
|-------|---------|-----|
| `--forge-radius-sm` | `4px` | DarkInput bordery |
| `--forge-radius-md` | `6px` | DarkSelect, tool buttons, radio options, Slice btn |
| `--forge-radius-lg` | `8px` | Floating panely, preset karty |

### 5.5 Viewport grid pozadi

Viewport pouziva `repeating-linear-gradient` pro horizontalni a vertikalni grid cary s roztecou 50px
a barvou `--forge-border-grid` (#141720). Uprostred je build plate kruh (300x300px) s teal
obrysem (opacity 0.4) a radialnim gradientem. V centru kruhu je 8px tecka.

---

## 6. Datovy model (slicer job, results)

### 6.1 Aktualni stav — Mock data

Vsechna data pochazi z jednoho exportu `SLICER_MOCK` v souboru `mockData.js`. Zadna realna
data se neziskavaji z backendu.

### 6.2 SLICER_MOCK — kompletni schema

```javascript
SLICER_MOCK = {
  // === Printer ===
  printer:         { value: string, label: string },
  printerOptions:  Array<{ value: string, label: string }>,

  // === Position ===
  position:        { x: string, y: string, z: string },

  // === Materials ===
  materials:       Array<{ name: string, spec: string, color: string }>,
  materialOptions: Array<{ value: string, label: string }>,
  printCoreOptions: Array<{ value: string, label: string }>,

  // === Presets ===
  presets:         Array<{ key: string, label: string, icon: string }>,
  selectedPreset:  string,

  // === Print Settings ===
  resolutionOptions: Array<{ value: string, label: string }>,
  infill:          { density: number, pattern: string },
  patternOptions:  Array<{ value: string, label: string }>,
  shell:           { wall: string, topBottom: string },

  // === Support ===
  support:         { enabled: boolean, type: string, placement: string },
  supportTypeOptions: Array<{ value: string, label: string }>,
  placementOptions:   Array<{ value: string, label: string }>,

  // === Adhesion ===
  adhesion:        { enabled: boolean },

  // === Object ===
  object:          { filename: string, dimensions: { length: number, width: number, height: number } },

  // === Simulation ===
  simulation:      { currentTime: string, totalTime: string, progress: number,
                     speed: string, speeds: Array<string> },
}
```

### 6.3 Mock hodnoty (aktualni)

| Klic | Aktualni hodnota | Pouziva |
|------|-------------------|---------|
| `printer` | Bambu Lab P1S | LeftPanel |
| `printerOptions` | Bambu Lab P1S, X1C, Prusa MK4 | LeftPanel dropdown |
| `position` | X: -0.0144, Y: 1.0386, Z: 0 | LeftPanel XYZ inputy |
| `materials` | Black ABS (AA 0.8), White PLA (AA 0.25) | MaterialsPanel sloty |
| `presets` | Balanced, Visual, Engineering, Draft | RightPanel karty |
| `selectedPreset` | "balanced" | RightPanel (zvyraznena karta) |
| `infill.density` | 20 (%) | RightPanel slider |
| `infill.pattern` | "triangles" | RightPanel select |
| `shell` | wall: 0.8mm, topBottom: 1.2mm | RightPanel inputy |
| `support` | enabled: true, Normal, Everywhere | RightPanel toggle+selects |
| `adhesion` | enabled: true | RightPanel toggle |
| `object.filename` | UMS7_Man_with_gun.stl | ObjectsPanel |
| `object.dimensions` | 216 x 178 x 229 mm | ObjectsPanel |
| `simulation` | 11:27:12 / 22:54:25, 50%, 100x | SimulationBar |

### 6.4 Budouci datovy model — slicer job

Pri implementaci realne slicer funkcnosti bude potreba:

```
SlicerJob = {
  id: string,
  status: 'pending' | 'slicing' | 'done' | 'error',
  inputFile: File/URL,
  printer: string,
  materials: Array,
  settings: { resolution, infill, support, adhesion, ... },
  result: {
    gcode: URL,
    estimatedTime: number,   // sekundy
    materialUsage: number,   // gramy
    layers: number,
    previewImages: Array<URL>,
  },
  error?: string,
}
```

---

## 7. API Endpointy (POST /api/slice, GET /api/slice/:id)

### 7.1 Aktualni stav

**Zadne API endpointy nejsou implementovany.** Stranka je ciste staticka s mock daty.

### 7.2 Planovane endpointy

| Metoda | Endpoint | Popis | Stav |
|--------|----------|-------|------|
| `POST` | `/api/slice` | Odeslani modelu ke slicovani | Neni implementovano |
| `GET` | `/api/slice/:id` | Ziskani statusu a vysledku slicer jobu | Neni implementovano |
| `GET` | `/api/slice/:id/gcode` | Download vygenerovaneho G-code | Neni implementovano |
| `GET` | `/api/printers` | Seznam dostupnych tiskaren z admin config | Neni implementovano |
| `GET` | `/api/materials` | Seznam materialu z admin config | Neni implementovano |

### 7.3 Predpokladany flow (po implementaci)

```
1. Uzivatel nahra STL soubor (drag & drop / file input)
2. Frontend posle POST /api/slice s modelem a nastavenim
3. Backend spusti PrusaSlicer CLI
4. Frontend polluje GET /api/slice/:id pro status
5. Po dokonceni se zobrazi vysledky (cas, material, preview)
6. Uzivatel muze stahnout G-code
```

---

## 8. UI komponenty — detailni popis

### 8.1 SlicerLayout (CORE)

**Soubor:** `src/pages/slicer/components/SlicerLayout.jsx` (20 r.)
**Props:** `children`
**Funkce:** CSS Grid shell obalujici celou stranku. Definuje `100vh` x `100vw` layout
s `overflow: hidden`.

### 8.2 SlicerTopBar (CORE)

**Soubor:** `src/pages/slicer/components/SlicerTopBar.jsx` (70 r.)
**Props:** zadne
**State:** `activeTab` (useState, default "Workshop")
**Funkce:** Horni navigacni lista s 3 castmi:
- **Vlevo:** FORGE logo (zeleny ctverec "F" + text "FORGE")
- **Uprostred:** SlicerPillTabs s taby Workshop / Viewer / Monitor
- **Vpravo:** User avatar kruh ("A") + "Admin" text

### 8.3 SlicerLeftPanel (CORE)

**Soubor:** `src/pages/slicer/components/SlicerLeftPanel.jsx` (181 r.)
**Props:** zadne
**State:** DarkSelect interni `open` state
**Funkce:** Levy bocni panel (260px sirka) se 4 sekcemi:
1. **Printer selector** — DarkSelect s tiskarnovymi options z mock dat
2. **Axis gizmo** — SlicerAxisGizmo SVG (X cervena, Y zelena, Z modra)
3. **Tool buttons** — 5 ikon (Import, Mirror, Rotate, Scale, Measure) s hover efektem
4. **Position** — 3 read-only DarkInput pro X/Y/Z s lock ikonami a "mm" suffix

**Interni helpery:**
- `DarkSelect` — custom dropdown s button, chevron, absolute positioned options
- `DarkInput` — read-only input s optional icon, suffix, tech font

### 8.4 SlicerViewport (CORE)

**Soubor:** `src/pages/slicer/components/SlicerViewport.jsx` (58 r.)
**Props:** `children` (floating panely)
**Funkce:** Centralni viewport oblast s:
- Grid pozadi (repeating-linear-gradient, 50px roztecy)
- Build plate kruh (300x300px, teal obrys, opacity 0.4, radialni gradient)
- Centrum crosshair (8px tecka, teal, opacity 0.3)
- `position: relative` — floating panely jsou `position: absolute` uvnitr

### 8.5 SlicerRightPanel (CORE)

**Soubor:** `src/pages/slicer/components/SlicerRightPanel.jsx` (265 r.)
**Props:** zadne
**State:** `presetTab` (useState, default "Recommended")
**Funkce:** Pravy bocni panel (320px, scrollable) s print settings:

1. **Header** — Settings ikona + "Print Settings" nadpis + chevron
2. **Summary tags** — 4 Tag badges: "Fast 0.2 mm", "Infill 20%", "Support ON", "Adhesion ON"
3. **Recommended/Custom tabs** — SlicerPillTabs (sm size)
4. **Preset cards** — 4x1 grid (Balanced, Visual, Engineering, Draft) s ikonami
5. **Resolution** — DarkSelect (Draft/Normal/Fine)
6. **"Settings" divider** — SectionDivider
7. **Infill** — SectionHeader s badge "20%", DarkSlider (0-100), pattern DarkSelect, wall/topBottom DarkInputy
8. **Support** — SectionHeader s DarkToggle, type DarkSelect, RadioOption pro material, placement DarkSelect
9. **Adhesion** — SectionHeader s DarkToggle

**Interni helpery (8):**
- `DarkSelect` — dropdown (duplikat z LeftPanel, MaterialsPanel)
- `DarkToggle` — toggle switch (duplikat z MaterialsPanel)
- `DarkSlider` — range input s teal gradient fill
- `DarkInput` — read-only input s suffix
- `SectionDivider` — horizontalni cara s textem uprostred
- `SectionHeader` — nadpis s optional badge a children slot
- `Tag` — maly inline badge (pill)
- `RadioOption` — custom radio s barevnym kruhem

### 8.6 SlicerMaterialsPanel (FLOATING)

**Soubor:** `src/pages/slicer/components/SlicerMaterialsPanel.jsx` (151 r.)
**Pozice:** `position: absolute; top: 12px; left: 50%; transform: translateX(-50%);` (center-top)
**Sirka:** 340px
**State:** `activeTab` ("Material 1"), `expanded` (true)
**Funkce:** Collapsible panel se 3 castmi:
1. **Header** — zelena tecka + "Materials" nadpis + expand/collapse chevron
2. **Material sloty** — 2 radky s barevnym kruhem, nazvem, spec textem
3. **Tabs** — SlicerPillTabs "Material 1" / "Material 2" (sm)
4. **Settings** — Enable toggle, Material dropdown, Print core dropdown

### 8.7 SlicerObjectsPanel (FLOATING)

**Soubor:** `src/pages/slicer/components/SlicerObjectsPanel.jsx` (71 r.)
**Pozice:** `position: absolute; bottom: 60px; left: 12px;` (bottom-left)
**Sirka:** 260px
**State:** `expanded` (true)
**Funkce:** Collapsible panel se stromem objektu:
1. **Header** — expand/collapse button + "Objects" nadpis
2. **File row** — chevron + Box ikona (teal) + nazev souboru + Trash2 ikona
3. **Dimensions** — 3 radky: length/width/height v mm (tech font)

### 8.8 SlicerSimulationBar (FLOATING)

**Soubor:** `src/pages/slicer/components/SlicerSimulationBar.jsx` (93 r.)
**Pozice:** `position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%);` (bottom-center)
**State:** `speed` (useState, default z mock dat "100x")
**Funkce:** Horizontalni bar s playback ovladanim:
1. **Label** — "Simulation" text
2. **Play button** — kruhovy button s Play ikonou (teal)
3. **Current time** — tech font (11:27:12)
4. **Slider** — range input (0-100) s teal gradient
5. **Total time** — tech font (22:54:25)
6. **Speed label** — "SPEED:" text
7. **Speed buttons** — 5 pill buttons (1x, 5x, 10x, 50x, 100x) — aktivni ma teal pozadi

### 8.9 SlicerSlicePanel (FLOATING)

**Soubor:** `src/pages/slicer/components/SlicerSlicePanel.jsx` (96 r.)
**Pozice:** `position: absolute; bottom: 12px; right: 12px;` (bottom-right)
**Sirka:** 280px
**State:** `method` (useState, default "auto")
**Funkce:** Panel pro vyber metody slicovani:
1. **Header** — "Select slicing method" nadpis
2. **Subheader** — "Selected object: UMS7_Man_with_gun.stl"
3. **Radio: AI Auto-Slice** — button s kruhem (checkmark kdyz selected)
4. **Radio: Manual slicing** — button s kruhem
5. **Slice button** — zeleny (teal) primary CTA, full-width, hover efekt

### 8.10 SlicerPillTabs (UTIL)

**Soubor:** `src/pages/slicer/components/SlicerPillTabs.jsx` (38 r.)
**Props:** `tabs: string[]`, `activeTab: string`, `onTabChange: (tab) => void`, `size: 'md'|'sm'`
**Funkce:** Znovupouzitelny tab switcher s pill stylem. Aktivni tab ma teal pozadi.
Pouzivan ve 3 komponentach: TopBar, MaterialsPanel, RightPanel.

### 8.11 SlicerAxisGizmo (UTIL)

**Soubor:** `src/pages/slicer/components/SlicerAxisGizmo.jsx` (25 r.)
**Props:** zadne
**Funkce:** SVG 80x80 s 3 osami:
- **Z osa** — nahoru, modra (#4DA8DA)
- **Y osa** — doleva-dolu, zelena (#00D4AA)
- **X osa** — doprava-dolu, cervena (#FF4757)
Kazda osa ma caru, kruh s pruhlednosti a pismeno.

---

## 9. State management a data flow

### 9.1 Prehled

Stranka pouziva **vylucne lokalni state** (`useState`). Zadny globalni state, context, ani Redux.
Zadna komunikace mezi komponentami (krome parent-child composition v `index.jsx`).

### 9.2 State per komponent

| Komponenta | State | Default | Ucel |
|------------|-------|---------|------|
| SlicerTopBar | `activeTab` | `"Workshop"` | Aktivni tab (Workshop/Viewer/Monitor) |
| SlicerLeftPanel | DarkSelect.`open` | `false` | Otevreni printer dropdown |
| SlicerRightPanel | `presetTab` | `"Recommended"` | Aktivni tab (Recommended/Custom) |
| SlicerRightPanel | DarkSelect.`open` (3x) | `false` | Resolution, Pattern, Placement/Type dropdown |
| SlicerRightPanel | DarkToggle.`on` (2x) | z mock dat | Support/Adhesion toggle |
| SlicerMaterialsPanel | `activeTab` | `"Material 1"` | Aktivni material tab |
| SlicerMaterialsPanel | `expanded` | `true` | Panel rozbaleny/sbaleny |
| SlicerMaterialsPanel | DarkSelect.`open` (2x) | `false` | Material/PrintCore dropdown |
| SlicerMaterialsPanel | DarkToggle.`on` | `true` | Enable toggle |
| SlicerObjectsPanel | `expanded` | `true` | Panel rozbaleny/sbaleny |
| SlicerSimulationBar | `speed` | `"100x"` | Vybrana rychlost simulace |
| SlicerSlicePanel | `method` | `"auto"` | Vybrana metoda (auto/manual) |

### 9.3 Data flow

```
mockData.js (SLICER_MOCK)
    |
    +---> SlicerLeftPanel       (printer, printerOptions, position)
    +---> SlicerMaterialsPanel  (materials, materialOptions, printCoreOptions)
    +---> SlicerRightPanel      (presets, selectedPreset, resolutionOptions, infill,
    |                            patternOptions, shell, support, supportTypeOptions,
    |                            placementOptions, adhesion)
    +---> SlicerObjectsPanel    (object — filename, dimensions)
    +---> SlicerSimulationBar   (simulation — times, progress, speeds)
    +---> SlicerSlicePanel      (object.filename)
```

**Data tece jednosmerne:** mockData.js -> komponenty. Zadna komponenta nemeni mock data.
State zmeny (dropdown otevreni, toggle prepnuti) jsou pouze vizualni a nemaji vliv na
ostatni komponenty ani na mock data.

---

## 10. Error handling (slicer errors, timeouts)

### 10.1 Aktualni stav

**Zadny error handling neni implementovan.** Stranka je staticka s mock daty — neni co selhavat.

### 10.2 Potencialni chybove stavy (pro budouci implementaci)

| Kategorie | Scenar | Doporucena strategie |
|-----------|--------|---------------------|
| Upload | Neplatny format souboru (ne STL/OBJ/3MF) | Validace pred odeslanim, error toast |
| Upload | Soubor prilis velky | Frontend size limit + server validace |
| Upload | Poskozeny soubor | Backend detekce + user-friendly zprava |
| Slicing | PrusaSlicer timeout | Polling s timeoutem, retry option |
| Slicing | PrusaSlicer crash | Error status z API, "Try again" CTA |
| Slicing | Nevalidni nastaveni | Frontend validace pred odeslanim |
| Network | API nedostupne | Retry s exponential backoff, offline stav |
| Render | 3D canvas error (WebGL) | Fallback na 2D preview |

### 10.3 Aktualne chybejici guardy

- DarkSelect options `onClick` zavre dropdown ale neaktualizuje `value` (jen vizualni uzavreni)
- DarkSlider pouziva `defaultValue` misto rizenych hodnot — zmena slideru se neprojevuje nikde
- DarkInput vsude `readOnly` — nelze editovat
- Zadna validace mock dat (predpoklada se spravny format)

---

## 11. Preklady (i18n)

### 11.1 Aktualni stav

**useLanguage() neni pouzit.** Vsechny texty jsou hardcoded anglicky:

| Komponenta | Hardcoded texty |
|------------|-----------------|
| SlicerTopBar | "FORGE", "Workshop", "Viewer", "Monitor", "Admin" |
| SlicerLeftPanel | "Printer", "Position", "Import", "Mirror", "Rotate", "Scale", "Measure", "X", "Y", "Z" |
| SlicerRightPanel | "Print Settings", "Fast 0.2 mm", "Infill 20%", "Support ON", "Adhesion ON", "Recommended", "Custom", "Resolution", "Settings", "Infill", "Density", "Pattern", "Wall", "Top/Bottom", "Support", "Support type", "Print with:", "Placement", "Adhesion" |
| SlicerMaterialsPanel | "Materials", "Material 1", "Material 2", "Settings", "Enable", "Material", "Print core" |
| SlicerObjectsPanel | "Objects" |
| SlicerSimulationBar | "Simulation", "SPEED:" |
| SlicerSlicePanel | "Select slicing method", "Selected object:", "AI Auto-Slice", "Manual slicing", "Slice" |

### 11.2 Doporuceni pro budouci i18n

1. Importovat `useLanguage()` z `../../contexts/LanguageContext`
2. Pridat prekladove klice do `LanguageContext.jsx` pod novy namespace `slicer.*`
3. Nahradit vsechny hardcoded stringy za `t('slicer.xxx')`
4. Prioritni stringy pro preklad: user-facing labely (Print Settings, Materials, Support)
5. Technicke labely (X, Y, Z, mm) mohou zustat anglicky

---

## 12. Pristupnost

### 12.1 Aktualni stav — problemy

| # | Problem | Kde | Zavaznost |
|---|---------|-----|-----------|
| A1 | **DarkSelect nema ARIA atributy** | LeftPanel, RightPanel, MaterialsPanel | Vysoka |
| A2 | **DarkSelect neni ovladatelny klavesnici** | Vsechny 3 soubory | Vysoka |
| A3 | **DarkToggle nema role="switch" ani aria-checked** | RightPanel, MaterialsPanel | Vysoka |
| A4 | **DarkSlider nema aria-label ani aria-valuetext** | RightPanel | Stredni |
| A5 | **Tool buttons maji jen `title`, ne `aria-label`** | LeftPanel | Stredni |
| A6 | **RadioOption neni `role="radio"`** | RightPanel | Vysoka |
| A7 | **SlicerSlicePanel radio buttons nemaji `role="radiogroup"`** | SlicerSlicePanel | Stredni |
| A8 | **Floating panely nemaji landmark roles** | Vsechny floating panely | Nizka |
| A9 | **SVG AxisGizmo nema `aria-label` ani `role="img"`** | SlicerAxisGizmo | Nizka |
| A10 | **Collapse/expand buttony nemaji `aria-expanded`** | MaterialsPanel, ObjectsPanel | Stredni |
| A11 | **Focus trap chybi** — dropdown otevreny ale Tab nefokusuje options | Vsechny DarkSelect | Vysoka |
| A12 | **Escape key nezavre dropdown** | Vsechny DarkSelect | Stredni |

### 12.2 Doporucene opravy (prioritizovane)

**P0 (okamzite):**
1. Pridat `role="listbox"` na DarkSelect options container, `role="option"` na options
2. Pridat `onKeyDown` handler pro Escape (zavreni), Arrow Up/Down (navigace)
3. Pridat `role="switch"` a `aria-checked={on}` na DarkToggle button
4. Pridat `role="radiogroup"` na SlicerSlicePanel wrapper, `role="radio"` a `aria-checked` na options

**P1 (brzy):**
5. Pridat `aria-label` na tool buttons (misto jen `title`)
6. Pridat `aria-expanded` na collapse buttony v MaterialsPanel a ObjectsPanel
7. Pridat `aria-label` na DarkSlider
8. Implementovat click-outside zavruci pro DarkSelect dropdowny

---

## 13. Performance

### 13.1 Bundle size

- Stranka je **lazy-loaded** pres `React.lazy` — separatni chunk
- Odhadovana velikost: ~32 KB (JS, pred gzip)
- Nema vliv na initial page load ostatnich stranek

### 13.2 Rendering

- **Zadne tezke vypocty** — ciste staticke renderovani s mock daty
- **Zadne re-rendery** — state zmeny jsou lokalni (dropdown open/close)
- **Zadne API volani** — 0 network requestu po nacteni
- **Zadne animace** krome CSS `transition: 150ms` na hover efektech

### 13.3 Mozne budouci bottlenecky

| Oblast | Riziko | Mitigace |
|--------|--------|----------|
| 3D canvas (Three.js/R3F) | Vysoke — WebGL rendering, velke meshe | requestAnimationFrame, LOD, frustum culling |
| STL parsing | Stredni — velke soubory (100+ MB) | Web Worker pro parsing |
| Slicer polling | Nizke — jednoduche HTTP requesty | Exponential backoff, cancelation |
| State updates | Nizke aktualne, stredni po napojeni na real data | useMemo/useCallback kde potreba |

### 13.4 Lazy loading suspense fallback

```jsx
<Suspense fallback={
  <div style={{
    width: '100vw', height: '100vh',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--forge-bg-void, #08090C)',
    color: 'var(--forge-text-primary, #E8ECF1)'
  }}>Loading Slicer...</div>
}>
  <SlicerPage />
</Suspense>
```

Fallback pouziva tmave pozadi (#08090C) aby nedoslo k bilemu flash pred nactenim tmave stranky.

---

## 14. Bezpecnost (file upload validace)

### 14.1 Aktualni stav

**Zadna bezpecnostni opatreni nejsou nutna** — stranka je ciste staticka, neprijima vstup od uzivatele
(mimo lokalni state zmeny), nekomunikuje se serverem.

### 14.2 Budouci bezpecnostni pozadavky (pri implementaci uploadu)

| Oblast | Pozadavek | Priorita |
|--------|-----------|----------|
| File type validace | Prijmout pouze STL, OBJ, 3MF, STEP | P0 |
| File size limit | Max 100 MB na klientu pred uploadem | P0 |
| Magic bytes | Overit skutecny typ souboru (ne jen priponu) | P1 |
| Sanitizace nazvu | Odstranit nebezpecne znaky z nazvu souboru | P0 |
| MIME type | Overit MIME type pri uploadu | P1 |
| Antivirus | Server-side sken nahranecho souboru | P2 |
| Rate limiting | Max 10 uploadu za minutu per session | P1 |
| Temporary storage | Automaticky mazat nahrane soubory po 24h | P1 |
| CORS | Omezit upload endpoint na vlastni domenu | P0 |

### 14.3 Poznamenani k PrusaSlicer CLI

PrusaSlicer CLI bezi na serveru — vstupy musi byt sanitizovany aby se zabranilo:
- Path traversal (nazvy souboru s `../`)
- Command injection (specialni znaky v nastaveni)
- Resource exhaustion (nekonecne slicovani, obri soubory)

---

## 15. Interni Helper Komponenty — prehled duplikaci

Tyto komponenty jsou definovane **uvnitr** souboru kde se pouzivaji. Nejsou exportovane.

| Helper | Definovan v | Duplikovan? | Popis |
|--------|-------------|-------------|-------|
| `DarkSelect` | LeftPanel, MaterialsPanel, RightPanel | **ANO (3x)** | Dropdown s button, chevron, absolute options, hover |
| `DarkToggle` | MaterialsPanel, RightPanel | **ANO (2x)** | Toggle switch — teal ON, tmavy OFF, animovany knob |
| `DarkSlider` | RightPanel | Ne | `<input type="range">` s teal gradient fill |
| `DarkInput` | LeftPanel, RightPanel | **ANO (2x)** | Read-only input, tech font, optional suffix |
| `SectionDivider` | RightPanel | Ne | Cara s textem uprostred |
| `SectionHeader` | RightPanel | Ne | Nadpis s optional badge + children |
| `Tag` | RightPanel | Ne | Maly inline badge/pill |
| `RadioOption` | RightPanel | Ne | Custom radio s barevnym kruhem |

**Doporuceni:** Extrahovat duplikovane helpery do sdileneho `SlicerFormElements.jsx`:
- `DarkSelect` (3 kopie)
- `DarkToggle` (2 kopie)
- `DarkInput` (2 kopie)

---

## 16. Souvisejici dokumenty

| Dokument | Cesta | Relevance |
|----------|-------|-----------|
| Puvodni Slicer dokument | `docs/claude/Documentation/Slicer_Page.md` | Zaklad pro tuto dokumentaci |
| Routes.jsx | `src/Routes.jsx:38,49-59` | Lazy-loaded route definice |
| Forge tokens | `src/styles/forge-tokens.css` | Vsechny CSS variables pouzivane na strance |
| CLAUDE.md | `Model_Pricer-V2-main/CLAUDE.md` | Projektove konvence a pravidla |
| MEMORY.md | `.claude/projects/.../memory/MEMORY.md` | Hot spots, pasti |
| Design Error Log | `docs/claude/Design-Error_LOG.md` | Log design chyb |

---

## 17. Zname omezeni

### 17.1 Funkcni omezeni

| # | Omezeni | Dopad | Priorita rieseni |
|---|---------|-------|-------------------|
| L1 | **Pouze vizualni shell** — zadna realna funkcnost | Stranka je nepouzitelna pro end-usery | P1 |
| L2 | **Mock data** — zadne napojeni na backend/admin config | Hodnoty neodpovidaji realite | P1 |
| L3 | **Dropdowny nemeni hodnotu** — DarkSelect `onClick` zavre dropdown ale nevolava callback | Vizualni-only interakce | P2 |
| L4 | **Slider nemeni state** — `defaultValue` misto rizeneho `value` | Posun slideru se neprojevuje v UI | P2 |
| L5 | **DarkToggle lokalni state** — prepnuti nemeni parent ani mock data | Toggle je izolovan | P2 |
| L6 | **Zadny 3D canvas** — viewport obsahuje jen SVG placeholder | Uzivatel nevidi model | P1 |
| L7 | **Zadny file upload** — neni drag & drop ani file input | Nelze nahrat model | P1 |

### 17.2 Design omezeni

| # | Omezeni | Dopad |
|---|---------|-------|
| D1 | **Zadna responsivita** — fixed grid 260px/1fr/320px, jen desktop | Mobile/tablet nepouzitelne |
| D2 | **Duplikovane interni komponenty** — DarkSelect 3x, DarkToggle 2x, DarkInput 2x | Maintenance burden |
| D3 | **Zadne i18n** — vsechny texty hardcoded anglicky | Cesky uzivatel vidi EN |
| D4 | **Zadne keyboard shortcuts** — Ctrl+Z, Space, R, S atd. | Power users omezeni |
| D5 | **Floating panely se mohou prekryvat** na malych viewportech | Vizualni kolize |

### 17.3 Pristupnostni omezeni (WCAG violations)

Viz sekce 12 vyse — 12 identifikovanych problemu (A1-A12).

### 17.4 Budouci roadmap

| Oblast | Popis | Priorita |
|--------|-------|----------|
| 3D Viewer | Three.js / React Three Fiber canvas | P1 |
| STL Upload | Drag & drop + file input | P1 |
| PrusaSlicer integrace | Backend CLI volani | P1 |
| Real data | Napojeni na admin config (printery, materialy) | P2 |
| State propojeni | Dropdowny/slidery meniji centralni state | P2 |
| Simulace playback | Layer-by-layer z slicer vystupu | P3 |
| Responsivita | Mobile/tablet layout | P3 |
| Keyboard shortcuts | Power user zkratky | P3 |
| Dark form extraction | DarkSelect/DarkToggle/DarkSlider do sdileneho modulu | P3 |

---

## Appendix: Rychla reference pro budouci upravy

### Pridat novy floating panel do viewportu
1. Vytvor `src/pages/slicer/components/SlicerNovyPanel.jsx`
2. Pouzij `position: absolute` + prislusne `top/bottom/left/right`
3. Pozadi: `var(--forge-bg-surface)`, border: `var(--forge-border-default)`, border-radius: `var(--forge-radius-lg)`
4. Importuj v `index.jsx` a vloz jako child `<SlicerViewport>`

### Zmenit mock data
1. Uprav `src/pages/slicer/mockData.js` — vsechny komponenty importuji `SLICER_MOCK`

### Pridat novy tool button do leveho panelu
1. Uprav pole `tools` v `SlicerLeftPanel.jsx` (radek ~103)
2. Pridej `{ icon: LucideIkona, tip: 'Nazev' }`

### Zmenit grid layout (sirky panelu)
1. Uprav `SlicerLayout.jsx` — `gridTemplateColumns: '260px 1fr 320px'`
2. Zmen hodnoty 260px (levy) nebo 320px (pravy) podle potreby

### Nahradit placeholder real 3D canvasem
1. `npm install @react-three/fiber @react-three/drei`
2. Uprav `SlicerViewport.jsx` — nahrad SVG za `<Canvas>` z `@react-three/fiber`
3. Build plate kruh presun do Three.js sceny

### Extrahovat sdilene dark form helpery
1. Vytvor `src/pages/slicer/components/SlicerFormElements.jsx`
2. Presun a exportuj: `DarkSelect`, `DarkToggle`, `DarkSlider`, `DarkInput`
3. Aktualizuj importy v LeftPanel, MaterialsPanel, RightPanel

### Pridat novou sekci do RightPanel
1. `<SectionDivider text="Nazev" />` pro oddeleni
2. `<SectionHeader title="Nazev" badge="value">` s optional children (toggle)
3. Pridej obsah (DarkSelect, DarkSlider, atd.)
