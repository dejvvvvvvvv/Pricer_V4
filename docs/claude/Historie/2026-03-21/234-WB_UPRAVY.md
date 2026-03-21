# 234-WB — UPRAVY — Widget-Builder (Block Definitions) — 2026-03-21

## Metadata
- **ID:** 234-WB
- **Session:** S01
- **Datum:** 2026-03-21
- **Oblast:** Widget-Builder
- **Souvisejici ID:** 233-WB, 235-WB, 236-WB
- **Trigger:** Widget Builder VvvebJs-inspired redesign — Agent 1: Block Definitions System

---

## Souhrn uprav

Vytvoreni kompletniho blokoveho systemu pro Widget Builder. 32 bloku ve 4 kategoriich (Calculator, Layout, Content, Form) s centralizovanym registrem, lookup funkcemi, zamcenymi elementy a defaultnimi layouty vcetne 4 preset sablon.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | src/pages/admin/builder/blocks/calculatorBlocks.js | Novy soubor | cele | 12 calculator bloku (6 LOCKED + 6 optional) |
| 2 | src/pages/admin/builder/blocks/layoutBlocks.js | Novy soubor | cele | 6 layout bloku (section, row, column, spacer, divider, card) |
| 3 | src/pages/admin/builder/blocks/contentBlocks.js | Novy soubor | cele | 8 content bloku (heading, text, image, button, badge, icon, alert, list) |
| 4 | src/pages/admin/builder/blocks/formBlocks.js | Novy soubor | cele | 6 form bloku (text-input, select-input, checkbox, radio-group, textarea, number-input) |
| 5 | src/pages/admin/builder/blocks/lockedElements.js | Novy soubor | cele | Lock/unlock/restyle constraints system |
| 6 | src/pages/admin/builder/blocks/defaultLayouts.js | Novy soubor | cele | Default layouts per step + 4 presety |
| 7 | src/pages/admin/builder/blocks/index.js | Novy soubor | cele | Block registry (32 bloku), lookup funkce |

---

## Detailni zmeny

### 1. `src/pages/admin/builder/blocks/calculatorBlocks.js`

**Typ:** Novy soubor
**Duvod:** Definice vsech bloku souvisejicich s kalkulaci ceny a modelem

**Co se zmenilo:**
- 12 bloku celkem: 6 LOCKED (upload-zone, model-viewer, print-config, price-breakdown, checkout-form, order-confirmation) + 6 optional
- Kazdy blok ma: id, type, category, label (EN+CS), icon, defaultProps, editableProps
- LOCKED bloky nelze smazat z layoutu, pouze restylovat

---

### 2. `src/pages/admin/builder/blocks/layoutBlocks.js`

**Typ:** Novy soubor
**Duvod:** Strukturalni bloky pro rozlozeni widgetu

**Co se zmenilo:**
- 6 layout bloku: section, row, column, spacer, divider, card
- Podporuji children (nested elementy) kde je to relevantni (section, row, column, card)
- Konfigurovatelne: padding, gap, background, border

---

### 3. `src/pages/admin/builder/blocks/contentBlocks.js`

**Typ:** Novy soubor
**Duvod:** Obsahove bloky pro texty, obrazky, tlacitka

**Co se zmenilo:**
- 8 content bloku: heading, text, image, button, badge, icon, alert, list
- Kazdy s bilingualni labels (EN + CS)
- Editovatelne vlastnosti specificky pro typ (heading level, image src, button variant, alert type)

---

### 4. `src/pages/admin/builder/blocks/formBlocks.js`

**Typ:** Novy soubor
**Duvod:** Formularove bloky pro uzivatelsky vstup

**Co se zmenilo:**
- 6 form bloku: text-input, select-input, checkbox-input, radio-group, textarea, number-input
- Konfigurovatelne: label, placeholder, required, validation
- Bilingualni labels

---

### 5. `src/pages/admin/builder/blocks/lockedElements.js`

**Typ:** Novy soubor
**Duvod:** System omezeni pro zamcene elementy

**Co se zmenilo:**
- Definice ktere elementy jsou zamcene (6 calculator bloku)
- Pravidla: canDelete=false, canMove=limited, canRestyle=true
- Helper funkce pro overeni zamku

---

### 6. `src/pages/admin/builder/blocks/defaultLayouts.js`

**Typ:** Novy soubor
**Duvod:** Predpripravene layouty pro kazdy krok + presety

**Co se zmenilo:**
- Default layout pro kazdy krok (step 1-5)
- 4 preset sablony: standard, compact, salesFocused, quickQuote
- Kazdy preset definuje jine rozlozeni bloku optimalizovane pro dany ucel

---

### 7. `src/pages/admin/builder/blocks/index.js`

**Typ:** Novy soubor
**Duvod:** Centralizovany registr vsech bloku

**Co se zmenilo:**
- Agregace vsech 32 bloku ze 4 kategorii
- Lookup funkce: getBlockById, getBlocksByCategory, getLockedBlocks
- Export vsech kategorii + registry

---

## Dopad zmen

- **Ovlivnene komponenty:** BuilderPage, BuilderCanvas, BuilderPropertyPanel — vsechny ctou z block registry
- **Breaking changes:** Ne — kompletne novy system, neovlivnuje existujici kod
- **Nove zavislosti:** Zadne — cisty JavaScript
- **Rizika:** Minimalni — izolovaný blokový system

---

## Testovani

- **Build:** Ceka na verifikaci
- **Manual test:** Ceka na Wave 2+ integraci
- **Poznamky:** Block registry je datovy soubor, funkcionalita se testuje az s BuilderCanvas

---
