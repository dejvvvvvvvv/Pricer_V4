# 255-WB — UPRAVY — Widget-Builder P1 Bug Fixes (Agent Fix-3) — 2026-03-21

## Metadata
- **ID:** 255-WB
- **Session:** S09
- **Datum:** 2026-03-21
- **Oblast:** Widget-Builder (P1 Bug Fixes)
- **Souvisejici ID:** 253-WB, 254-WB, 250-WB, 252-WB
- **Trigger:** P1 Bug Fix Wave — Agent Fix-3 opravil zbyvajicich 7 P1 bugu (+ 1 overeny jako ne-bug)

---

## Souhrn uprav

Agent Fix-3 opravil 7 P1 bugu (FloatingToolbar presun, Duplicate/Copy pro registry elementy, PropertyPanel null guard, LayerRow handleClick, TemplateGallery onStartFromScratch + confirmation overlay, Delete false toast). Overil ze Loader2 spin neni bug (keyframes existuji). Celkem 7 oprav + 1 ne-bug v 5 souborech.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Popis |
|---|--------|-----------|-------|
| 1 | BuilderCanvas.jsx | Zmeneno | FloatingToolbar rendering presunut sem (pristup ke canvasRef) |
| 2 | BuilderPage.jsx | Zmeneno | Duplicate/Copy pouziva resolveBlockId() + delete three-way branch |
| 3 | BuilderPropertyPanel.jsx | Zmeneno | Null guard — early return placeholder kdyz neni element vybrany |
| 4 | LayerRow.jsx | Zmeneno | Optional chaining onSelect?.() v handleClick |
| 5 | TemplateGallery.jsx | Zmeneno | Optional chaining onStartFromScratch?.() + createPortal confirmation overlay |

---

## Detailni zmeny

### 1. `BuilderCanvas.jsx`

**Typ:** Zmeneno
**Duvod:** FloatingToolbar potrebuje pristup ke canvasRef pro absolutni pozicovani, ale byla renderovana v BuilderPage kde canvasRef neni dostupny

**Co se zmenilo:**
- FloatingToolbar rendering presunut z BuilderPage do BuilderCanvas
- BuilderCanvas ma canvasRef — toolbar se nyni spravne pozicuje relativne ke canvas
- Pred: toolbar se renderoval v BuilderPage bez canvasRef -> spatne pozicovani
- Po: toolbar se renderuje v BuilderCanvas s canvasRef -> spravne pozicovani

---

### 2. `BuilderPage.jsx`

**Typ:** Zmeneno
**Duvod:** Duplicate/Copy nefungovalo pro registry elementy (LOCKED elementy s prefixem bi_/cb_) a Delete zobrazoval false "smazano" toast pro nesmazatelne elementy

**Co se zmenilo:**
- **Duplicate/Copy:** pridan `resolveBlockId()` volani pred `getBlockById()` — registry elementy maji ID s prefixem ktery se musi resolvovat na block ID
- **Delete three-way branch:**
  - Custom elementy (cb_ prefix) = toast "element smazan"
  - Hideable elementy (locked ale skrytelne) = toast "element skryt"
  - Ostatni (locked, neskrytelne) = warning toast "tento element nelze skryt"
- Pred: duplicate padal na registry elementech, delete zobrazoval "smazano" i pro elementy ktere smazat nelze
- Po: duplicate funguje pro vsechny typy, delete zobrazuje spravny toast podle typu

---

### 3. `BuilderPropertyPanel.jsx`

**Typ:** Zmeneno
**Duvod:** Panel padal s TypeError kdyz zadny element nebyl vybrany (selectedElement === null)

**Co se zmenilo:**
- Pridan early return s placeholder textem "Zadny element neni vybrany" kdyz selectedElement je null/undefined
- Pred: crash pri null selectedElement
- Po: graceful placeholder misto crashe

---

### 4. `LayerRow.jsx`

**Typ:** Zmeneno
**Duvod:** handleClick volal onSelect() bez overeni ze callback existuje

**Co se zmenilo:**
- `onSelect()` zmeneno na `onSelect?.()`  (optional chaining)
- Pred: potencialni TypeError pokud onSelect nebyl predan jako prop
- Po: bezpecne volani s optional chaining

---

### 5. `TemplateGallery.jsx`

**Typ:** Zmeneno
**Duvod:** onStartFromScratch volani bez optional chaining + confirmation overlay se renderoval do rodicovske komponenty (CSS transform problem)

**Co se zmenilo:**
- **Optional chaining:** `onStartFromScratch()` zmeneno na `onStartFromScratch?.()`
- **Confirmation overlay:** createPortal do `document.body` misto renderovani v rodicovske komponente
- Pred: potencialni TypeError + overlay mohla byt spatne pozicovana kvuli CSS transform na rodici
- Po: bezpecne volani + overlay vzdy fullscreen pres document.body portal

---

### Ne-bug: Loader2 spin

**Overeni:** `@keyframes spin` existuje v `builder-tokens.css`
- Audit to oznacil jako P1 ale pri overeni zjisteno ze animace funguje spravne
- Zadna zmena nutna

---

## Dopad zmen

- **Ovlivnene komponenty:** BuilderCanvas (nyni renderuje FloatingToolbar), BuilderPage (zmena delete logiky), BuilderPropertyPanel (null guard), LayerRow (bezpecnost), TemplateGallery (portal + bezpecnost)
- **Breaking changes:** Ne
- **Nove zavislosti:** Zadne (createPortal uz je importovan)
- **Rizika:** Minimalni — FloatingToolbar presun muze ovlivnit z-index/positioning, ale canvasRef pristup to vylepsuje

---

## Testovani

- **Build:** Nespecifikovano v kontextu
- **Manual test:** Agent Fix-3 overil vsechny opravy
- **Poznamky:** Loader2 spin overeny jako ne-bug (keyframes existuji v builder-tokens.css)

---
