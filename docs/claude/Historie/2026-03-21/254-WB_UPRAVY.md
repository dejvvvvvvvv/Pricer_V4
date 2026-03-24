# 254-WB — UPRAVY — Widget-Builder P1 Bug Fixes (Agent Fix-1 + Fix-2) — 2026-03-21

## Metadata
- **ID:** 254-WB
- **Session:** S09
- **Datum:** 2026-03-21
- **Oblast:** Widget-Builder (P1 Bug Fixes)
- **Souvisejici ID:** 253-WB, 255-WB, 250-WB, 252-WB
- **Trigger:** P1 Bug Fix Wave — audit nalezl 19 P1 bugu, Agent Fix-1 a Fix-2 opravily 7 z nich

---

## Souhrn uprav

Agent Fix-1 opravil 3 P1 bugy (duplicitni Delete handler, chybejici layout undo, resize panel akcelerace). Agent Fix-2 opravil 4 P1 bugy v PropertyEditorFactory (FontEditor, BorderEditor, BackgroundEditor, Color opacity). Celkem 7 oprav v 5 souborech.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Popis |
|---|--------|-----------|-------|
| 1 | useElementSelection.js | Zmeneno | Odebrany Delete/Backspace keyboard handlery |
| 2 | useBuilderState.js | Zmeneno | Pridany unifiedUndo/unifiedRedo funkce |
| 3 | BuilderPage.jsx | Zmeneno | Keyboard shortcuts + UI buttons pouzivaji unified undo |
| 4 | PropertyEditorFactory.jsx | Zmeneno | FontEditor -> SelectPropertyEditor, odebran BorderEditor + BackgroundEditor |
| 5 | ColorPropertyEditor.jsx | Zmeneno | handleOpacityChange propaguje rgba pres onChange |

---

## Detailni zmeny

### 1. `useElementSelection.js`

**Typ:** Zmeneno
**Duvod:** Duplicitni Delete/Backspace handler — useElementSelection i BuilderPage oba reagovaly na Delete klavesu, zpusobovalo double-fire

**Co se zmenilo:**
- Odebrany Delete a Backspace keyboard event handlery z useElementSelection
- Delete/Backspace zustava POUZE v BuilderPage capture handleru (jedine misto)
- Pred: oba soubory reagovaly na Delete -> dva pokusy o smazani
- Po: jen BuilderPage reaguje -> jeden spravny delete

---

### 2. `useBuilderState.js`

**Typ:** Zmeneno
**Duvod:** Layout a theme mely separatni undo/redo stacky, uzivatel ocekaval jeden undo pro vsechno

**Co se zmenilo:**
- Pridany `unifiedUndo()` a `unifiedRedo()` funkce
- Logika: zkusi theme undo/redo prvni, pokud neni co vracet, zkusi layout undo/redo
- Exportovano pro pouziti v keyboard shortcuts i UI buttons
- Pred: Ctrl+Z undo jen pro layout, theme zmeny se nedaly vratit
- Po: Ctrl+Z vraci posledni zmenu bez ohledu na typ (theme i layout)

---

### 3. `BuilderPage.jsx`

**Typ:** Zmeneno
**Duvod:** ResizeHandle panel akcelerace — baseWidth useEffect pocital relativni delta, coz pri rychlem tazeni zpusobovalo exponencialni rust

**Co se zmenilo:**
- ResizeHandle nyni zachycuje `startWidth` na mousedown
- Pocita absolutni sirku (startWidth + deltaX) misto relativniho prirustku
- Odebrany baseWidth useEffect ktery zpusoboval akceleraci
- Keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z) prevedeny na unifiedUndo/unifiedRedo
- UI undo/redo tlacitka prevedena na unified varianty
- Pred: resize panel skocil/akceleroval, undo jen pro layout
- Po: resize je plynuly a linearni, undo funguje pro vsechno

---

### 4. `PropertyEditorFactory.jsx`

**Typ:** Zmeneno
**Duvod:** FontEditor, BorderEditor, BackgroundEditor nefungovaly spravne — block definice pouzivaji individualni properties (fontFamily, borderWidth...) ne nested objekty

**Co se zmenilo:**
- **FontEditor nahrazen SelectPropertyEditor:** Font family je dropdown s vyberem fontu, protoze font sub-properties (family, size, weight) jsou separatni block entries
- **BorderEditor odebrany:** case 'border' byl dead code — typ 'border' se v blocich nepouziva, properties jsou individualni (borderWidth, borderColor, borderStyle)
- **BackgroundEditor odebrany:** stejna situace jako border — typ 'background' neexistuje v blocich
- Pred: 3 broken editory (FontEditor renderoval nefunkcni sub-fields, Border+Background se nikdy nepouzily)
- Po: FontEditor je funkcni dropdown, zadny dead code

---

### 5. `ColorPropertyEditor.jsx`

**Typ:** Zmeneno
**Duvod:** Opacity slider menil hodnotu lokalne ale nepropagoval rgba barvu ven pres onChange

**Co se zmenilo:**
- `handleOpacityChange` nyni spravne propaguje vyslednou rgba barvu pres `onChange` callback
- Pred: opacity slider menil stav ale rodic nedostal novou barvu
- Po: zmena opacity okamzite propaguje rgba hodnotu nahoru

---

## Dopad zmen

- **Ovlivnene komponenty:** BuilderPage, BuilderTopBar (undo/redo buttons), vsechny property editory v pravo panelu, ResizeHandle
- **Breaking changes:** Ne — vsechny zmeny jsou zpetne kompatibilni
- **Nove zavislosti:** Zadne
- **Rizika:** Minimalni — unified undo/redo meni flow, ale fallback logika zajistuje zpetnou kompatibilitu

---

## Testovani

- **Build:** Nespecifikovano v kontextu
- **Manual test:** Audit + fix agenti
- **Poznamky:** Soucast vetsi P1 Bug Fix Wave (14 bugu celkem)

---
