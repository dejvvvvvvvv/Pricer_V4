# 233-WB — KONVERZACE — Widget-Builder — 2026-03-21

## Metadata
- **ID:** 233-WB
- **Session:** S01
- **Datum:** 2026-03-21
- **Oblast:** Widget-Builder
- **Souvisejici ID:** 234-WB, 235-WB, 236-WB, 085-WB, 086-WB, 087-WB

---

## Tema session

Widget Builder VvvebJs-inspired redesign — Wave 1 (Core Infrastructure). Kompletni prepracovani Widget Builderu s novou 3-panelovou architekturou, blokovym systemem (32 bloku ve 4 kategoriich), HTML5 drag-and-drop bez externích knihoven, a pokrocilym property editor systemem s 7 novymi editory.

---

## Prubeh konverzace

### [1] Uzivatel
> Zadani: Widget Builder VvvebJs-inspired redesign, Wave 1 - Core Infrastructure. Tri paralelni agenti pro Block Definitions, Builder Page Layout a Property Editor System.

### [1] Claude
**Shrnuti odpovedi:**
- Spusteni 3 paralelnich agentu pro Wave 1:
  - Agent 1: Block Definitions System (7 souboru)
  - Agent 2: Builder Page Layout (8 souboru rewritten/created)
  - Agent 3: Property Editor System (10+ souboru)
- Celkem ~25 souboru vytvoreno/prepsano v `src/pages/admin/builder/`

**Akce provedene:**
- Agent 1: Vytvoreni 7 souboru s definicemi 32 bloku (4 kategorie: calculator, layout, content, form)
- Agent 2: Prepis BuilderPage.jsx na 3-panelovy VvvebJs layout, novy canvas system, HTML5 DnD
- Agent 3: 7 novych property editoru + prepis 5 existujicich + nove taby/panely

**Soubory zminene:**
- `src/pages/admin/builder/blocks/` (7 souboru)
- `src/pages/admin/builder/BuilderPage.jsx`
- `src/pages/admin/builder/BuilderTopBar.jsx`
- `src/pages/admin/builder/BuilderCanvas.jsx`
- `src/pages/admin/builder/useBuilderState.js`
- `src/pages/admin/builder/useDragAndDrop.js`
- `src/pages/admin/builder/useElementSelection.js`
- `src/pages/admin/builder/DevicePreviewFrame.jsx`
- `src/pages/admin/builder/builder-tokens.css`
- `src/pages/admin/builder/editors/` (10+ souboru)
- `src/pages/admin/builder/BuilderPropertyPanel.jsx`

---

## Rozhodnuti ucinena v teto session

| # | Rozhodnuti | Kontext/duvod | Kdo rozhodl |
|---|-----------|---------------|-------------|
| 1 | Bez externi DnD knihovny (HTML5 API) | Jednoduchost, mene zavislosti, dostatecna funkcionalita pro builder | Spolecne |
| 2 | Bez Tailwind v builderu (CSS-in-JS + forge tokens) | Builder pouziva vlastni design system, Tailwind by kolidoval s inline styles v builderem generovanem widgetu | Spolecne |
| 3 | 32 bloku ve 4 kategoriich | Calculator (12), Layout (6), Content (8), Form (6) — pokryva vse co widget potrebuje | Claude |
| 4 | 6 zamcenych elementu (LOCKED) | upload-zone, model-viewer, print-config, price-breakdown, checkout-form, order-confirmation — kriticke pro funkcnost, nelze smazat, jen restylovat | Claude |
| 5 | Bilingualni labels (EN + CS) | Konzistence s existujicim i18n systemem projektu | Claude |

---

## Otevrene otazky

- [ ] Wave 2+ implementace (dalsi vlny Widget Builderu)
- [ ] Testovani builderu v prohlizeci
- [ ] Build verifikace po Wave 1

---

## Navaznost

- **Predchozi:** 085-WB (Widget Builder vlny 1-3, 2026-02-26)
- **Nasledujici:** zatim zadny

---
