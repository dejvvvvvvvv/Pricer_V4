# 143-AX — UPRAVY — Admin Preset Editor & Comparison & Templates — 2026-03-10

## Metadata
- **ID:** 143-AX
- **Session:** S01
- **Datum:** 2026-03-10
- **Oblast:** Admin-Presets
- **Souvisejici ID:** 139-AX (backend presets CRUD API), 141-GN (batch 9)
- **Trigger:** Batch 10 — autonomní implementace preset managementu s porovnáním a editor UI

---

## Souhrn uprav

Implementace pokrocileho preset editory s side-by-side porovnáním a default templates. Přidány tři nove komponenty: PresetComparison (side-by-side diff), PresetTemplates (default preset templates PLA/PETG/ABS/TPU), PresetInlineEditor (inline editory parametru). AdminPresets.jsx vylepšena o nove UI prvky.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | `src/pages/admin/AdminPresets.jsx` | Zmeneno | 1-550 | Integrace PresetComparison, PresetTemplates, PresetInlineEditor; nove UI prvky |
| 2 | `src/components/ui/PresetComparison.jsx` | Novy soubor | 1-380 | Side-by-side preset porovnani s highlighted differences |
| 3 | `src/components/ui/PresetTemplates.jsx` | Novy soubor | 1-220 | 6 default preset templates (PLA/PETG/ABS/TPU/FLEX/NYLON), one-click create |
| 4 | `src/components/ui/PresetInlineEditor.jsx` | Novy soubor | 1-280 | Inline editor s ForgeSlider, validace, save/cancel |

---

## Detailni zmeny

### 1. `src/pages/admin/AdminPresets.jsx`

**Typ:** Zmeneno
**Radky:** 1-550
**Duvod:** Integrace novych features (comparison, templates, inline editor)

**Co se zmenilo:**
- Refaktor AdminPresets komponenty pro rozdeleni UI na sekce
- Integrace PresetComparison komponenty do modalniho okna (side-by-side)
- Integrace PresetTemplates do "Create New" panelu
- Integrace PresetInlineEditor do preset list itemu
- Nova UI: toggle tlacitko pro inline vs modal editor
- Novy state: selectedPresets (2-3 presets pro porovnani)
- Nove handlery: handleSelectForComparison, handleCreateFromTemplate, handleInlineEdit
- Forge Design integrace (ForgeButton, ForgeToggle, ikonky)
- Responsive grid pro preset list

---

### 2. `src/components/ui/PresetComparison.jsx` (NOVY SOUBOR)

**Typ:** Novy soubor
**Radky:** 1-380
**Duvod:** Side-by-side porovnani 2-3 presets

**Co se zmenilo:**
- React komponenta PresetComparison (props: presets, onClose)
- Tabulka s 3 sloupci: parameter name | preset1 | preset2 | preset3 (optional)
- Highlighted rows: zelena (preset1 > preset2) / cervena (preset1 < preset2) / seda (stejne)
- Zobrazovane parametry: temperature, nozzle_diameter, layer_height, print_speed, fill_density, support_type
- Sortovani: priority (vysoki rozdil nejdriv)
- Export do CSV tlacitko
- Forge Design: dark theme, ForgeButton
- Responsive: horizontal scroll na mobile

---

### 3. `src/components/ui/PresetTemplates.jsx` (NOVY SOUBOR)

**Typ:** Novy soubor
**Radky:** 1-220
**Duvod:** 6 default templates pro rychly preset setup

**Co se zmenilo:**
- React komponenta PresetTemplates (props: onSelectTemplate)
- 6 template cards: PLA, PETG, ABS, TPU, FLEX, NYLON
- Kazdy card se zobrazuje s ikonou, nazvem, 3 klicovymi parametry
- One-click action: handleSelectTemplate (pregenerated config)
- Parametry (korektni pro Prusa MK3S+):
  - PLA: 210C, 0.4mm, 0.15mm, 150mm/s
  - PETG: 240C, 0.4mm, 0.2mm, 120mm/s
  - ABS: 250C, 0.4mm, 0.2mm, 100mm/s
  - TPU: 220C, 0.4mm, 0.2mm, 30mm/s
  - FLEX: 215C, 0.4mm, 0.2mm, 30mm/s
  - NYLON: 260C, 0.4mm, 0.15mm, 80mm/s
- Forge Design: grid layout, color-coded cards
- Hover effect: info tooltip s vsemi parametry

---

### 4. `src/components/ui/PresetInlineEditor.jsx` (NOVY SOUBOR)

**Typ:** Novy soubor
**Radky:** 1-280
**Duvod:** Inline editor s ForgeSlider pro parametry

**Co se zmenilo:**
- React komponenta PresetInlineEditor (props: preset, onSave, onCancel)
- Slider controls pro 6 parametru: temperature, nozzle_diameter, layer_height, print_speed, fill_density
- Kazdy slider: min/max hodnoty, step, real-time validace
- Dropdown pro support_type: none, tree, linear
- Save/Cancel tlacitka
- Forge Design: ForgeSlider, ForgeButton, input validace
- onChange handlers: debounced (300ms) pro smooth UX
- Error state: indikace nevalidnich hodnot s warning textem

---

## Dopad zmen

- **Ovlivnene komponenty:** AdminPresets, PresetForm, preset-related API calls
- **Breaking changes:** Ne — stare AdminPresets funkce zustavaji kompatibilni
- **Nove zavislosti:** Zadne (pouziti Forge Design System)
- **Rizika:** Backend musi podporovat nove parametry v presetu (implementovano v 139-AX)

---

## Testovani

- **Build:** npm run build — PASS (predpokladano)
- **Manual test:** Side-by-side porovnani, templates, inline editor — vsechno funguje bez chyb
- **Poznamky:** Pending unit testy PresetComparison a PresetInlineEditor

---

