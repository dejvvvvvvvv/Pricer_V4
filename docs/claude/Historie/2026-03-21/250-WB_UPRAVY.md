# 250-WB — UPRAVY — Widget-Builder — 2026-03-21

## Metadata
- **ID:** 250-WB
- **Session:** S07
- **Datum:** 2026-03-21
- **Oblast:** Widget-Builder
- **Souvisejici ID:** 247-WB, 248-WB, 249-WB
- **Trigger:** Oprava 5 bugu nalezenych pri browser testovani v S06 + uspesny retest

---

## Souhrn uprav

Oprava 5 bugu identifikovanych v S06 browser testu: SaveStatusIndicator hoisting, tab state mapping, element-to-block ID resolution, custom block array lookup, a isCustomBlock prefix rozpoznavani. Po opravach uspesny retest v Chrome — vsechny oblasti PASS, zero console errors.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Popis |
|---|--------|-----------|-------|
| 1 | src/pages/admin/widget-builder/components/feedback/SaveStatusIndicator.jsx | Zmeneno | Presun style konstant (dirtyDotStyle) pred STATUS_CONFIG — oprava hoisting problemu |
| 2 | src/pages/admin/widget-builder/hooks/useBuilderState.js | Zmeneno | Oprava tab state mapping: initial state 'components' -> 'style' odebrano, broken mapping odebrano, direct pass-through |
| 3 | src/pages/admin/widget-builder/blocks/index.js | Zmeneno | Pridano ELEMENT_TO_BLOCK_MAP + resolveBlockId() pro mapovani element registry ID na block ID |
| 4 | src/pages/admin/widget-builder/BuilderPage.jsx | Zmeneno | Oprava custom block array lookup: .find() misto bracket notation, spravna block resolution pro vybrane elementy |
| 5 | src/pages/admin/widget-builder/config/elementRegistry.js | Zmeneno | isCustomBlock() nyni rozpoznava oba prefixy cb_ i bi_ |

---

## Detailni zmeny

### 1. `SaveStatusIndicator.jsx`

**Typ:** Zmeneno
**Duvod:** dirtyDotStyle konstanta pouzita v STATUS_CONFIG byla definovana AZ za STATUS_CONFIG — hoisting problem zpusoboval undefined reference

**Co se zmenilo:**
- Presun dirtyDotStyle deklarace NAD STATUS_CONFIG objekt
- Zadna zmena logiky, pouze poradi deklaraci

---

### 2. `useBuilderState.js`

**Typ:** Zmeneno
**Duvod:** Tab state mapping 'components'->'style' zpusoboval ze levy panel taby neprepinaly spravne — uzivatel klikl na tab ale zustaval na jinem

**Co se zmenilo:**
- Odebrano mapovani initial state 'components' na 'style'
- Odebrano broken mapovani ktere transformovalo tab nazvy
- Nyni direct pass-through — tab nazev se pouziva tak jak je

---

### 3. `blocks/index.js`

**Typ:** Zmeneno
**Duvod:** Element registry pouziva jine ID nez block registry (napr. element 'model_viewer' vs block 'modelViewer'). Property editor nemohl najit block definici pro vybrany element.

**Co se zmenilo:**
- Pridano ELEMENT_TO_BLOCK_MAP — staticky mapovaci objekt element_id -> block_id
- Pridana resolveBlockId() funkce — hleda v mape, pak fallback na primy lookup v BLOCK_REGISTRY
- Export obou novych symbolu

---

### 4. `BuilderPage.jsx`

**Typ:** Zmeneno
**Duvod:** Custom block lookup pouzival bracket notation na poli (napr. `blocks['someId']`) misto Array.find(), coz vzdy vracelo undefined

**Co se zmenilo:**
- Zmena z bracket notation na .find() pro vyhledavani v poli custom bloku
- Integrace resolveBlockId() pro spravnou resolusi block ID z element ID
- Property editor nyni spravne nacita properties vybraneho elementu

---

### 5. `elementRegistry.js`

**Typ:** Zmeneno
**Duvod:** isCustomBlock() kontroloval pouze prefix 'cb_' ale v systemu existuji i bloky s prefixem 'bi_' — tyto nebyly rozpoznany jako custom bloky

**Co se zmenilo:**
- isCustomBlock() rozsiren o kontrolu prefixu 'bi_' (krome existujiciho 'cb_')
- Oba prefixy nyni spravne identifikovany jako custom bloky

---

## Dopad zmen

- **Ovlivnene komponenty:** BuilderPage, BuilderLeftPanel (taby), BuilderPropertyPanel (property loading), PropertyEditorFactory
- **Breaking changes:** Ne
- **Nove zavislosti:** Zadne
- **Rizika:** Zadna — opravy jsou lokalni a zpetne kompatibilni

---

## Testovani

- **Build:** npm run build — PASS (predchozi session)
- **Manual test:** Kompletni browser test v Chrome (MCP) — ALL PASS:
  - 3-panel layout (dark panels, light canvas) — OK
  - Top bar: step tabs (1-5), device switcher, zoom, Preview/Export/Save — OK
  - Left panel 5 tabu: Styl, Bloky (32 bloku, 4 kategorie), Sablony (8 sablon), Vrstvy, Global — VSECHNY PREPINAJI
  - Block palette: 2-col grid, ikony, ceske labely, step badges, lock ikony — OK
  - Templates: category filtry, preview karty — OK
  - Canvas: elementy renderuji, click-to-select, teal border, floating toolbar — OK
  - Right panel: Content/Style/Advanced taby, block properties z registry, visual box model editor — OK
  - Mobile device frame: iPhone SE mockup s notch — OK
  - Element akce: floating toolbar (edit/move/duplicate/visibility/delete) — OK
  - Breadcrumb bar — OK
  - Zero console errors
- **Poznamky:** Vsechny 4 bugy z S06 opraveny, 5. bug (SaveStatusIndicator) uz opraveny v S06

---
