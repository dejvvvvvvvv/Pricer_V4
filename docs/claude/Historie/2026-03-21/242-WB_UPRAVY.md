# 242-WB — UPRAVY — Widget-Builder — 2026-03-21

## Metadata
- **ID:** 242-WB
- **Session:** S04
- **Datum:** 2026-03-21
- **Oblast:** Widget-Builder
- **Souvisejici ID:** 233-WB, 234-WB, 235-WB, 236-WB, 237-WB, 238-WB, 239-WB, 240-WB, 241-WB, 243-WB
- **Trigger:** Wave 3.5 — Agent 9: CSS Class Integration — nahrazeni inline styles CSS tridami z WidgetBuilder.css

---

## Souhrn uprav

Agent 9 nahradil ~930 radku inline stylu (objekty styles) ve 6 souborech Widget Builderu CSS tridami s prefixem `wb-*`. Vsechny inline styles objekty byly odebranyo a nahrazeny className referencemi na tridy definovane v WidgetBuilder.css (vytvoreno ve Wave 3, ID 241-WB). Cilem bylo snizit bundle size, zlepsit maintainability a umoznit snadnejsi CSS overrides.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Popis |
|---|--------|-----------|-------|
| 1 | BuilderPage.jsx | Zmeneno | Import WidgetBuilder.css, nahrazeni inline styles `wb-*` tridami, ~80 radku styles objektu odebrano |
| 2 | BuilderTopBar.jsx | Zmeneno | Nahrazeni inline styles `wb-topbar__*` tridami, ~250 radku styles objektu odebrano |
| 3 | BuilderCanvas.jsx | Zmeneno | Nahrazeni inline styles `wb-canvas__*` tridami, ~250 radku styles objektu odebrano |
| 4 | BuilderLeftPanel.jsx | Zmeneno | Nahrazeni inline styles `wb-left__*` tridami, ~200 radku styles objektu odebrano |
| 5 | BuilderElementRenderer.jsx | Zmeneno | Nahrazeni inline styles `wb-element__*` tridami, ~50 radku odebrano |
| 6 | BuilderPropertyPanel.jsx | Zmeneno | Nahrazeni inline styles `wb-right__*` tridami, ~100 radku odebrano |

---

## Detailni zmeny

### 1. `BuilderPage.jsx`

**Typ:** Zmeneno
**Duvod:** Centralizace stylu do CSS souboru, odstraneni inline styles objektu

**Co se zmenilo:**
- Pridan import `WidgetBuilder.css` (vstupni bod pro vsechny CSS tridy)
- Vsechny `style={styles.xxx}` nahrazeny `className="wb-xxx"`
- Odebrany styles objekt (~80 radku)
- Zadna zmena logiky, jen prezentace

---

### 2. `BuilderTopBar.jsx`

**Typ:** Zmeneno
**Duvod:** Nejvetsi styles objekt v builderu — ~250 radku inline stylu

**Co se zmenilo:**
- Vsechny `style={styles.xxx}` nahrazeny `className="wb-topbar__xxx"`
- Odebrany styles objekt (~250 radku)
- BEM konvence: `wb-topbar__actions`, `wb-topbar__device-switcher`, `wb-topbar__undo-redo`

---

### 3. `BuilderCanvas.jsx`

**Typ:** Zmeneno
**Duvod:** Canvas styly presunute do CSS pro konzistenci s dot-grid a device frame styly

**Co se zmenilo:**
- Vsechny `style={styles.xxx}` nahrazeny `className="wb-canvas__xxx"`
- Odebrany styles objekt (~250 radku)
- Canvas wrapper, drop overlay, zoom container — vsechno pres CSS tridy

---

### 4. `BuilderLeftPanel.jsx`

**Typ:** Zmeneno
**Duvod:** Block palette a search styly do CSS

**Co se zmenilo:**
- Vsechny `style={styles.xxx}` nahrazeny `className="wb-left__xxx"`
- Odebrany styles objekt (~200 radku)
- Kategorie, block karty, search input — vsechno pres CSS tridy

---

### 5. `BuilderElementRenderer.jsx`

**Typ:** Zmeneno
**Duvod:** Element preview styly do CSS

**Co se zmenilo:**
- Vsechny `style={styles.xxx}` nahrazeny `className="wb-element__xxx"`
- Odebrany styles objekt (~50 radku)
- Selection, hover, drag, lock indikatory — vsechno pres CSS tridy

---

### 6. `BuilderPropertyPanel.jsx`

**Typ:** Zmeneno
**Duvod:** Pravy panel styly do CSS

**Co se zmenilo:**
- Vsechny `style={styles.xxx}` nahrazeny `className="wb-right__xxx"`
- Odebrany styles objekt (~100 radku)
- Tab navigace, editor wrapper, lock guard — vsechno pres CSS tridy

---

## Dopad zmen

- **Ovlivnene komponenty:** Vsech 6 Widget Builder komponent (vizualne beze zmeny, logika nezmenena)
- **Breaking changes:** Ne — CSS tridy uz existuji v WidgetBuilder.css (ID 241-WB)
- **Nove zavislosti:** Zadne
- **Rizika:** Minimalni — CSS tridy uz jsou definovane; pokud by nektera chybela, element by ztratil styling

---

## Testovani

- **Build:** Ceka na verifikaci
- **Manual test:** Ceka na browser testovani
- **Poznamky:** ~930 radku inline stylu odebrano, bundle by mel byt mensi

---
