# 236-WB — UPRAVY — Widget-Builder (Property Editor System) — 2026-03-21

## Metadata
- **ID:** 236-WB
- **Session:** S01
- **Datum:** 2026-03-21
- **Oblast:** Widget-Builder
- **Souvisejici ID:** 233-WB, 234-WB, 235-WB
- **Trigger:** Widget Builder VvvebJs-inspired redesign — Agent 3: Property Editor System

---

## Souhrn uprav

Kompletni property editor system pro Widget Builder. 7 zcela novych editoru (Spacing, Border, Shadow, Font, Background, Alignment, Opacity), 5 prepsanych existujicich editoru (Color, Text, Number, Boolean, Select), nove taby (Content, Advanced, Style rewrite) a BuilderPropertyPanel jako pravy panel s 3 taby.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | src/pages/admin/builder/editors/SpacingEditor.jsx | Novy soubor | cele | Chrome DevTools-style box model editor |
| 2 | src/pages/admin/builder/editors/BorderEditor.jsx | Novy soubor | cele | Border width/style/color/radius |
| 3 | src/pages/admin/builder/editors/ShadowEditor.jsx | Novy soubor | cele | Box shadow s multiple shadows |
| 4 | src/pages/admin/builder/editors/FontEditor.jsx | Novy soubor | cele | Typography editor (15 font families) |
| 5 | src/pages/admin/builder/editors/BackgroundEditor.jsx | Novy soubor | cele | Color/Image/Gradient modes |
| 6 | src/pages/admin/builder/editors/AlignmentEditor.jsx | Novy soubor | cele | Text alignment toggle |
| 7 | src/pages/admin/builder/editors/OpacityEditor.jsx | Novy soubor | cele | Slider + number input |
| 8 | src/pages/admin/builder/editors/ColorPropertyEditor.jsx | Rewrite | cele | Preset palette, recent colors, opacity |
| 9 | src/pages/admin/builder/editors/TextPropertyEditor.jsx | Rewrite | cele | Multi-line, char count |
| 10 | src/pages/admin/builder/editors/NumberPropertyEditor.jsx | Rewrite | cele | Slider + buttons |
| 11 | src/pages/admin/builder/editors/BooleanPropertyEditor.jsx | Rewrite | cele | Reset button |
| 12 | src/pages/admin/builder/editors/SelectPropertyEditor.jsx | Rewrite | cele | Object/string options |
| 13 | src/pages/admin/builder/ContentTab.jsx | Novy soubor | cele | Content properties tab |
| 14 | src/pages/admin/builder/AdvancedTab.jsx | Novy soubor | cele | Custom CSS, responsive, animations |
| 15 | src/pages/admin/builder/StyleTab.jsx | Rewrite | cele | Collapsible sections |
| 16 | src/pages/admin/builder/BuilderPropertyPanel.jsx | Novy soubor | cele | Right panel with 3 tabs |

---

## Detailni zmeny

### 1. `src/pages/admin/builder/editors/SpacingEditor.jsx`

**Typ:** Novy soubor
**Duvod:** Vizualni editor pro margin/padding inspirovany Chrome DevTools

**Co se zmenilo:**
- Box model vizualizace (margin -> border -> padding -> content)
- Klikatelne pole pro editaci hodnot
- Linked/unlinked mode (vsechny strany najednou vs individualne)

---

### 2. `src/pages/admin/builder/editors/BorderEditor.jsx`

**Typ:** Novy soubor
**Duvod:** Kompletni editor okraju elementu

**Co se zmenilo:**
- Border width (per side)
- Border style (solid, dashed, dotted, double, none)
- Border color (integrace s ColorPropertyEditor)
- Border radius (per corner)

---

### 3. `src/pages/admin/builder/editors/ShadowEditor.jsx`

**Typ:** Novy soubor
**Duvod:** Editor stinu s podporou vice stinu

**Co se zmenilo:**
- Multiple shadow podpora (pridat/odebrat stiny)
- Kazdy stin: offset-x, offset-y, blur, spread, color, inset
- Preview stinu v realnem case

---

### 4. `src/pages/admin/builder/editors/FontEditor.jsx`

**Typ:** Novy soubor
**Duvod:** Typograficky editor

**Co se zmenilo:**
- 15 font families na vyber
- Font size, line-height, letter-spacing
- Font weight, font style (italic/normal)
- Text transform (uppercase, lowercase, capitalize)

---

### 5. `src/pages/admin/builder/editors/BackgroundEditor.jsx`

**Typ:** Novy soubor
**Duvod:** Editor pozadi s vice mody

**Co se zmenilo:**
- 3 mody: Color (solid), Image (URL + pozice + size), Gradient (linear/radial + color stops)
- Preview pozadi v realnem case
- Prepinani mezi mody

---

### 6. `src/pages/admin/builder/editors/AlignmentEditor.jsx`

**Typ:** Novy soubor
**Duvod:** Toggle pro zarovnani textu

**Co se zmenilo:**
- 4 moznosti: left, center, right, justify
- Toggle button group s ikonami

---

### 7. `src/pages/admin/builder/editors/OpacityEditor.jsx`

**Typ:** Novy soubor
**Duvod:** Editor pruhlednosti

**Co se zmenilo:**
- Slider (0-100%)
- Number input pro presnou hodnotu
- Preview s sachovnicovym pozadim

---

### 8-12. Rewritten Editors

**ColorPropertyEditor.jsx:** Preset palette (10+ barev), recent colors historie, opacity slider, hex/rgb vstup
**TextPropertyEditor.jsx:** Multi-line podpora (textarea vs input), char count, placeholder
**NumberPropertyEditor.jsx:** Kombinace slider + stepper buttons + primy vstup, min/max/step
**BooleanPropertyEditor.jsx:** Toggle switch + reset button pro navrat k defaultu
**SelectPropertyEditor.jsx:** Podpora string i object options, search/filter pro dlouhe seznamy

---

### 13. `src/pages/admin/builder/ContentTab.jsx`

**Typ:** Novy soubor
**Duvod:** Tab pro editaci obsahu bloku

**Co se zmenilo:**
- Zobrazuje content-specific vlastnosti vybraneho bloku
- Dynamicky generovane pole podle block definice (editableProps)

---

### 14. `src/pages/admin/builder/AdvancedTab.jsx`

**Typ:** Novy soubor
**Duvod:** Pokrocile nastaveni pro power users

**Co se zmenilo:**
- Custom CSS editor (textarea pro vlastni CSS)
- Responsive nastaveni (skryti na urcitych zarizeni)
- Animace (fade-in, slide-up, atd.)

---

### 15. `src/pages/admin/builder/StyleTab.jsx`

**Typ:** Rewrite
**Duvod:** Prepracovani na collapsible sections

**Co se zmenilo:**
- Pred: Flat seznam vlastnosti
- Po: Collapsible sekce (Spacing, Typography, Background, Border, Shadow, Opacity)
- Kazda sekce obsahuje prislusny specializovany editor

---

### 16. `src/pages/admin/builder/BuilderPropertyPanel.jsx`

**Typ:** Novy soubor
**Duvod:** Pravy panel builderu s 3 taby

**Co se zmenilo:**
- 3 taby: Content, Style, Advanced
- Zobrazuje property panel pro aktualne vybrany element
- Prazdny stav kdyz neni nic vybrano

---

## Dopad zmen

- **Ovlivnene komponenty:** Widget Builder pravy panel, vsechny block editace
- **Breaking changes:** Ano — 5 existujicich editoru prepsano (Color, Text, Number, Boolean, Select)
- **Nove zavislosti:** Zadne
- **Rizika:** Hodne noveho UI kodu — nutne testovani vsech editoru v prohlizeci

---

## Testovani

- **Build:** Ceka na verifikaci
- **Manual test:** Ceka na browser testovani
- **Poznamky:** Editory jsou kriticke pro UX — kazdy musi fungovat plynule

---
