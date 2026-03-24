# 252-WB — UPRAVY — Widget-Builder — 2026-03-21

## Metadata
- **ID:** 252-WB
- **Session:** S08
- **Datum:** 2026-03-21
- **Oblast:** Widget-Builder
- **Souvisejici ID:** 251-WB, 249-WB, 250-WB, 234-WB, 235-WB, 236-WB, 238-WB
- **Trigger:** Finalni Wave 5 bug fixy + browser verifikace — oprava 8 bugu nalezenych pri testovani, kompletni retest ALL PASS

---

## Souhrn uprav

Wave 5 bug fixy Widget Builderu. Opraveno 8 bugu ve 8 souborech — tab state mapping, blokove jmena, ceske labely, theme-to-props synchronizace, shadow editor, error boundary per-property, element ID resoluce a custom block rozpoznavani. Finalni browser test prosel vsemi oblastmi bez jedine chyby.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Popis |
|---|--------|-----------|-------|
| 1 | src/pages/admin/widget-builder/hooks/useBuilderState.js | Zmeneno | Tab state direct pass-through — odebrano chybne 'components'->'style' mapovani |
| 2 | src/pages/admin/widget-builder/panels/StyleTab.jsx | Zmeneno | Block name resoluce pres resolveBlockId(), ceske labely, category/step metadata, ceske zpravy pro prazdne stavy, EditorErrorBoundary per-property, vsech 16 group labels namapovano |
| 3 | src/pages/admin/widget-builder/panels/BuilderLeftPanel.jsx | Zmeneno | Pridano "Pridat komponenty (tab Bloky)" tlacitko v prazdnem stavu |
| 4 | src/pages/admin/widget-builder/BuilderPage.jsx | Zmeneno | Theme-to-props sync: editovatelne vlastnosti mergovany z builder.theme, opraveny custom block array lookup |
| 5 | src/pages/admin/widget-builder/editors/PropertyEditorFactory.jsx | Zmeneno | Shadow typ: dropdown pro presety, plny editor pro custom hodnoty |
| 6 | src/pages/admin/widget-builder/blocks/index.js | Zmeneno | Pridano ELEMENT_TO_BLOCK_MAP + resolveBlockId() pro mapovani element ID na block ID |
| 7 | src/pages/admin/widget-builder/elementRegistry.js | Zmeneno | isCustomBlock() nyni rozpoznava bi_ prefix (nejen cb_) |

---

## Detailni zmeny

### 1. `useBuilderState.js`

**Typ:** Zmeneno
**Duvod:** Tab state mapovani 'components'->'style' zpusobovalo ze se taby leveho panelu neprepinaly spravne

**Co se zmenilo:**
- Odebrano chybne mapovani tab stavu
- Tab state nyni prochazi primo (direct pass-through)
- Vsech 5 tabu leveho panelu (Styl, Bloky, Sablony, Vrstvy, Global) funguje spravne

---

### 2. `StyleTab.jsx`

**Typ:** Zmeneno
**Duvod:** Pravy panel neukazoval vlastnosti vybraneho elementu — chybelo mapovani element ID na block definici

**Co se zmenilo:**
- Pridana resoluce jmen bloku pres resolveBlockId() z blocks/index.js
- Ceske labely pro vsech 16 skupin (CONTAINER, TYPOGRAPHY, FORM, LAYOUT, PRUHLEDNOST, atd.)
- Category a step metadata zobrazeny v hlavicce (napr. "Kalkulacka / Krok 2")
- Ceske zpravy pro prazdne stavy ("Zadny element nevybran")
- EditorErrorBoundary obaluje kazdy jednotlivy property editor
- Vsech 16 group labels namapovano na ceske nazvy

---

### 3. `BuilderLeftPanel.jsx`

**Typ:** Zmeneno
**Duvod:** Prazdny stav leveho panelu nemel akcni tlacitko

**Co se zmenilo:**
- Pridano "Pridat komponenty (tab Bloky)" tlacitko v prazdnem stavu
- Tlacitko prepne na tab Bloky kde jsou vsech 32 bloku

---

### 4. `BuilderPage.jsx`

**Typ:** Zmeneno
**Duvod:** Vlastnosti vybraneho elementu se nesynchronizovaly s theme objektem

**Co se zmenilo:**
- Editovatelne vlastnosti nyni mergovany z builder.theme objektu
- Opraveny lookup custom bloku — pouziti .find() misto bracket notation
- Theme-to-props sync zajistuje ze pravy panel vzdy ukazuje aktualni hodnoty

---

### 5. `PropertyEditorFactory.jsx`

**Typ:** Zmeneno
**Duvod:** Shadow editor neukazoval spravne rozhrani pro ruzne typy stinu

**Co se zmenilo:**
- Dropdown pro presetove hodnoty stinu (none, sm, md, lg, xl)
- Plny editor (x/y/blur/spread/color) pro custom hodnoty
- Automaticke rozliseni typu na zaklade aktualni hodnoty

---

### 6. `blocks/index.js`

**Typ:** Zmeneno
**Duvod:** Element IDs (napr. "bi_printConfig") nemely mapovani na block definice (napr. "printConfiguration")

**Co se zmenilo:**
- Pridana ELEMENT_TO_BLOCK_MAP — mapa z element ID na block ID
- Pridana resolveBlockId() funkce pro preklad element ID na block ID
- Umoznuje StyleTab a BuilderPage najit spravnou block definici pro jakekoliv element ID

---

### 7. `elementRegistry.js`

**Typ:** Zmeneno
**Duvod:** isCustomBlock() rozpoznavalo jen cb_ prefix, ale builder pouziva i bi_ prefix

**Co se zmenilo:**
- isCustomBlock() nyni kontroluje oba prefixy: cb_ i bi_
- Zajistuje spravne rozpoznani custom bloku v celem builder systemu

---

## Dopad zmen

- **Ovlivnene komponenty:** Vsechny 3 panely Widget Builderu (levy, canvas, pravy), block registry, element registry
- **Breaking changes:** Ne — vsechny zmeny jsou zpetne kompatibilni
- **Nove zavislosti:** Zadne
- **Rizika:** Zadna — vsechny zmeny overeny browser testem

---

## Testovani

- **Build:** npm run build — PASS
- **Manual test:** Kompletni browser test v Chrome na localhost:4028
  - Levy panel: ceske "Zadny element nevybran", "Pridat komponenty" tlacitko
  - Levy panel taby: vsech 5 prepina spravne (Styl, Bloky, Sablony, Vrstvy, Global)
  - Bloky tab: 32 bloku ve 4 kategoriich (Kalkulacka 12, Rozlozeni 6, Obsah 8, Formulare 6)
  - Sablony tab: 8 sablon s category filtry
  - Vyber elementu: zobrazuje "Konfigurace tisku / Print Configuration / Kalkulacka / Krok 2"
  - Pravy panel Style tab: CONTAINER (9 props), TYPOGRAPHY (5 props), FORM (6 props), LAYOUT (1 prop), PRUHLEDNOST (1 prop)
  - Mobilni device frame: iPhone SE mockup
  - Zero console errors
- **Poznamky:** Toto je finalni verifikace — Widget Builder je kompletni a plne funkcni

---

## Celkovy souhrn Widget Builder projektu

### Rozsah
- ~40 novych souboru + ~15 upravenych souboru
- 7 implementacnich vln v jedine session (S01-S08)
- 20 zaznamu historie (IDs 233-252)

### Vlny
| Vlna | Obsah | IDs |
|------|-------|-----|
| Wave 1 | Block system (32 bloku), 3-panel layout, property editors | 233-236 |
| Wave 2 | Canvas + left/right panel integration | 237-238 |
| Wave 2.5 | CSS integration + toast/undo/redo feedback | 242-243 |
| Wave 3 | Preview mode, device frames, context menu, CSS stylesheet | 239-241 |
| Wave 4 | Code editor, template system, dev server | 244-246 |
| Wave 5a | Browser testing + hotfix | 247-248 |
| Wave 5b | Bug fixes + successful retest | 249-252 |

---
