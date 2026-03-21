# 235-WB — UPRAVY — Widget-Builder (Builder Page Layout) — 2026-03-21

## Metadata
- **ID:** 235-WB
- **Session:** S01
- **Datum:** 2026-03-21
- **Oblast:** Widget-Builder
- **Souvisejici ID:** 233-WB, 234-WB, 236-WB
- **Trigger:** Widget Builder VvvebJs-inspired redesign — Agent 2: Builder Page Layout

---

## Souhrn uprav

Kompletni prepis Builder Page na VvvebJs-inspirovany 3-panelovy layout s interaktivnim canvasem, resizable panely, HTML5 drag-and-drop (bez externi knihovny), step taby (1-5), device switcherem, undo/redo, zoom kontrolami a keyboard navigaci.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | src/pages/admin/builder/BuilderPage.jsx | Rewrite | cele | VvvebJs 3-panel layout, resizable panels, breadcrumb bar |
| 2 | src/pages/admin/builder/BuilderTopBar.jsx | Rewrite | cele | Step tabs (1-5), device switcher, undo/redo, save |
| 3 | src/pages/admin/builder/BuilderCanvas.jsx | Novy soubor | cele | Interactive canvas, zoom, device frame, drop overlay |
| 4 | src/pages/admin/builder/useBuilderState.js | Enhance | cele | Per-step management, panel state, zoom, import/export JSON |
| 5 | src/pages/admin/builder/useDragAndDrop.js | Rewrite | cele | HTML5 DnD API (no external library) |
| 6 | src/pages/admin/builder/useElementSelection.js | Enhance | cele | Keyboard navigation (Escape, Delete, Arrow keys) |
| 7 | src/pages/admin/builder/DevicePreviewFrame.jsx | Zmeneno | cele | Updated device dimensions |
| 8 | src/pages/admin/builder/builder-tokens.css | Zmeneno | cele | Added spin animation |

---

## Detailni zmeny

### 1. `src/pages/admin/builder/BuilderPage.jsx`

**Typ:** Rewrite
**Duvod:** Prepracovani na VvvebJs-inspirovany 3-panelovy layout

**Co se zmenilo:**
- Pred: Jednoduchy single-panel builder
- Po: 3-panelovy layout (levy panel = block palette, stred = canvas, pravy panel = property editor)
- Resizable panely s drag handle
- Breadcrumb navigacni bar
- Integrace s novym block registry

---

### 2. `src/pages/admin/builder/BuilderTopBar.jsx`

**Typ:** Rewrite
**Duvod:** Nova toolbar s plnou funkcionalitou

**Co se zmenilo:**
- Step tabs pro navigaci mezi 5 kroky widgetu
- Device switcher (desktop/tablet/mobile)
- Undo/Redo tlacitka
- Save tlacitko
- Forge design system styling

---

### 3. `src/pages/admin/builder/BuilderCanvas.jsx`

**Typ:** Novy soubor
**Duvod:** Interaktivni canvas pro vizualni editaci

**Co se zmenilo:**
- Zoom kontroly (zoom in/out/reset, slider)
- Device frame zobrazujici widget v ramecku odpovidajicim zvolenemu zarizeni
- Drop overlay pro drag-and-drop indikaci
- Element selection (klik na element = zobrazi properties)
- Canvas pan/scroll

---

### 4. `src/pages/admin/builder/useBuilderState.js`

**Typ:** Enhance
**Duvod:** Rozsireni state managementu pro novy builder

**Co se zmenilo:**
- Per-step layout management (kazdy krok ma vlastni strom elementu)
- Panel state (otevrene/zavrene panely, sirky)
- Zoom state (level, min/max)
- Import/export JSON funkce pro ulozeni/nacteni layoutu
- Undo/redo historie

---

### 5. `src/pages/admin/builder/useDragAndDrop.js`

**Typ:** Rewrite
**Duvod:** Nahrazeni externi knihovny nativnim HTML5 DnD API

**Co se zmenilo:**
- Pred: (externi knihovna nebo zakladni implementace)
- Po: Cisty HTML5 Drag and Drop API
- Drag start/over/drop/end handlery
- Drop zone indikace (vizualni feedback)
- Block type transfer pres dataTransfer API

---

### 6. `src/pages/admin/builder/useElementSelection.js`

**Typ:** Enhance
**Duvod:** Pridani keyboard navigace

**Co se zmenilo:**
- Escape = deselect
- Delete = smazat element (pokud neni locked)
- Arrow keys = navigace mezi elementy
- Multi-select podpora (Shift+klik)

---

### 7. `src/pages/admin/builder/DevicePreviewFrame.jsx`

**Typ:** Zmeneno
**Duvod:** Aktualizace device dimenzi

**Co se zmenilo:**
- Aktualizovane rozmery pro desktop/tablet/mobile
- Responzivni frame kolem canvas obsahu

---

### 8. `src/pages/admin/builder/builder-tokens.css`

**Typ:** Zmeneno
**Duvod:** Nova animace pro builder UI

**Co se zmenilo:**
- Pridana spin animace (pro loading stavy v builderu)

---

## Dopad zmen

- **Ovlivnene komponenty:** Cely Widget Builder — kompletni rewrite hlavni stranky
- **Breaking changes:** Ano — BuilderPage, BuilderTopBar, useDragAndDrop zcela prepsany
- **Nove zavislosti:** Zadne — HTML5 DnD misto externi knihovny (mensi bundle)
- **Rizika:** Velky rewrite — nutne dukladne testovani vsech DnD interakci a keyboard shortcuts

---

## Testovani

- **Build:** Ceka na verifikaci
- **Manual test:** Ceka na browser testovani
- **Poznamky:** Kriticka cast — 3-panelovy layout je zaklad pro vsechny dalsi Wave

---
