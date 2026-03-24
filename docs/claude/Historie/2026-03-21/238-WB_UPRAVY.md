# 238-WB — UPRAVY — Widget-Builder — 2026-03-21

## Metadata
- **ID:** 238-WB
- **Session:** S02
- **Datum:** 2026-03-21
- **Oblast:** Widget-Builder
- **Souvisejici ID:** 233-WB, 234-WB, 235-WB, 236-WB, 237-WB
- **Trigger:** Widget Builder Wave 2 Integration — propojeni Wave 1 core komponent do funkcniho builderu

---

## Souhrn uprav

Wave 2 propojila Wave 1 infrastrukturu: Agent 4 integroval canvas s levym panelem (block palette -> drag -> canvas rendering), Agent 5 integroval pravy panel s property editory (vyber elementu -> editace vlastnosti). Celkem 11 souboru (2 nove + 9 upravenych).

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Popis |
|---|--------|-----------|-------|
| 1 | BuilderElementRenderer.jsx | Novy soubor | 24 block type previews, selection highlight, hover, drag handles, resize handles, lock badges |
| 2 | BuilderCanvas.jsx | Zmeneno | Renders elementy ze state, drop indikatory mezi elementy, empty step state |
| 3 | BuilderLeftPanel.jsx | Zmeneno | Importuje 32 bloku z registry, 2-column grid, search, drag, step badges, lock ikony |
| 4 | BuilderPage.jsx | Zmeneno | Wires canvas s element daty, selection, hover, drag handlery + resolves selectedElement, handleStyleChange, handleReset |
| 5 | useLayoutState.js | Zmeneno | addElement, removeElement, updateElementStyle, reorderElements funkce |
| 6 | PropertyEditorFactory.jsx | Novy soubor | Factory dispatching do 12 editor typu |
| 7 | StyleTab.jsx | Zmeneno | Pouziva block editableProperties seskupene podle group field |
| 8 | ContentTab.jsx | Zmeneno | Zobrazuje text/boolean properties z block definice |
| 9 | AdvancedTab.jsx | Zmeneno | Responsive overrides, animace, custom CSS |
| 10 | BuilderPropertyPanel.jsx | Zmeneno | Prijima selectedElement, delete button s lock guard |

---

## Detailni zmeny

### Agent 4: Canvas + Left Panel Integration

### 1. `BuilderElementRenderer.jsx`

**Typ:** Novy soubor
**Duvod:** Vizualni renderovani bloku na canvasu s interakcnimi prvky

**Co se zmenilo:**
- 24 block type previews — kazdy typ bloku ma vlastni vizualni nahled
- Selection highlight — vizualni zvyrazneni vybraneho elementu
- Hover efekt pro interaktivni feedback
- Drag handles pro presun elementu
- Resize handles pro zmenu velikosti
- Lock badges pro LOCKED elementy (nelze smazat/presunout)

---

### 2. `BuilderCanvas.jsx`

**Typ:** Zmeneno
**Duvod:** Integrace s element state pro skutecne renderovani bloku

**Co se zmenilo:**
- Canvas nyni renderuje elementy ze stavu (misto statickeho obsahu)
- Drop indikatory mezi elementy pri drag operaci
- Empty step state — zobrazeni prazdneho stavu kdyz krok nema elementy
- Propojeni s BuilderElementRenderer pro kazdy element

---

### 3. `BuilderLeftPanel.jsx`

**Typ:** Zmeneno
**Duvod:** Propojeni block palette s registrem 32 bloku

**Co se zmenilo:**
- Import vsech 32 bloku z blocks/ registry (Wave 1 Agent 1)
- 2-sloupcovy grid pro kompaktni zobrazeni bloku
- Search/filtrovani bloku
- Drag initializace pro kazdy blok
- Step badges — ukazuji ve kterych krocich je blok dostupny
- Lock ikony pro LOCKED elementy

---

### 4. `BuilderPage.jsx`

**Typ:** Zmeneno
**Duvod:** Centralni wiring vsech komponent dohromady

**Co se zmenilo:**
- Agent 4: Canvas wiring — predava element data, selection state, hover state, drag handlery
- Agent 5: Right panel wiring — resolves selectedElement z ID, handleStyleChange, handleReset
- BuilderPage je nyni plne funkcni koordinator vsech 3 panelu

---

### 5. `useLayoutState.js`

**Typ:** Zmeneno
**Duvod:** CRUD operace pro elementy na canvasu

**Co se zmenilo:**
- addElement — pridani noveho elementu do aktualniho kroku
- removeElement — smazani elementu (s ochranou LOCKED)
- updateElementStyle — zmena CSS vlastnosti elementu
- reorderElements — zmena poradi elementu pri drag & drop

---

### Agent 5: Right Panel + Property Editors Integration

### 6. `PropertyEditorFactory.jsx`

**Typ:** Novy soubor
**Duvod:** Factory pattern pro dynamicke prirazeni spravneho editoru k typu property

**Co se zmenilo:**
- Dispatchuje do 12 typu editoru (Color, Text, Number, Boolean, Select, Spacing, Border, Shadow, Font, Background, Alignment, Opacity)
- Mapovani property type -> editor komponenta
- Predava hodnotu a onChange callback

---

### 7. `StyleTab.jsx`

**Typ:** Zmeneno
**Duvod:** Propojeni s block editableProperties

**Co se zmenilo:**
- Cte editableProperties z block definice vybraneho elementu
- Seskupuje properties podle group field (Typography, Layout, Spacing, Visual)
- Pouziva PropertyEditorFactory pro kazdy property

---

### 8. `ContentTab.jsx`

**Typ:** Zmeneno
**Duvod:** Zobrazeni obsahu editovatelnych vlastnosti

**Co se zmenilo:**
- Filtrace text a boolean properties z block definice
- Zobrazeni editoru pro textovy obsah a prepinace

---

### 9. `AdvancedTab.jsx`

**Typ:** Zmeneno
**Duvod:** Pokrocile nastaveni elementu

**Co se zmenilo:**
- Responsive overrides — per-breakpoint styly (desktop, tablet, mobile)
- Animace — fade in, slide in, atd.
- Custom CSS — moznost zadat raw CSS pro element

---

### 10. `BuilderPropertyPanel.jsx`

**Typ:** Zmeneno
**Duvod:** Integrace s vybranym elementem

**Co se zmenilo:**
- Prijima selectedElement prop (resolvovany objekt, ne jen ID)
- Delete button s lock guard — LOCKED elementy nelze smazat
- Propojeni tabu (Style, Content, Advanced) s daty vybraneho elementu

---

## Dopad zmen

- **Ovlivnene komponenty:** Widget Builder (cely builder je nyni funkcionalne propojeny)
- **Breaking changes:** Ne — Wave 2 rozsiruje Wave 1 bez zmeny API
- **Nove zavislosti:** Zadne (stale HTML5 DnD, zadne externi knihovny)
- **Rizika:** BuilderPage.jsx ma vice wiring logiky — pri Wave 3+ muze byt nutny refaktor

---

## Testovani

- **Build:** Ceka na verifikaci
- **Manual test:** Ceka na browser testovani
- **Poznamky:** Wave 2 je integracni vrstva — funkcni testovani vyzaduje vsechny soubory z Wave 1 + Wave 2 spolecne

---
