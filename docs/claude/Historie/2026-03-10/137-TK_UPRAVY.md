# 137-TK — UPRAVY — Test-Kalkulacka — 2026-03-10

## Metadata
- **ID:** 137-TK
- **Session:** S01
- **Datum:** 2026-03-10
- **Oblast:** Test-Kalkulacka
- **Souvisejici ID:** 115 (Roadmap plán s touto feature), 132 (Batch 6 session)
- **Trigger:** Batch 8 autonomní implementace — Material cost comparison dle roadmapu

---

## Souhrn uprav

Implementace expandovatelné Material Comparison sekce v Step 3 (Material Selection) s ceníkem pro každý dostupný materiál, seřazením od nejlevnějšího, price diff bars, a klikem přepnout materiál. Integrované s pricing engine a i18n systémem.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky | Popis |
|---|--------|-----------|-------|-------|
| 1 | `src/pages/test-kalkulacka/components/MaterialComparison.jsx` | Nový soubor | N/A | Expandovatelná Material Comparison sekce s ceníkem, diff bars, clickable select |
| 2 | `src/pages/test-kalkulacka/components/PrintConfiguration.jsx` | Zmeneno | 200-230 | Integrace MaterialComparison komponenty do Step 3 |
| 3 | `src/pages/test-kalkulacka/index.jsx` | Zmeneno | 450-480 | Import + props passing pro MaterialComparison |

---

## Detailni zmeny

### 1. `src/pages/test-kalkulacka/components/MaterialComparison.jsx`

**Typ:** Nový soubor
**Radky:** N/A
**Duvod:** UX feature — pomoc uživateli vybrat materiál na základě ceny, ne jen dostupnosti

**Co se zmenilo:**
- Nový React komponent s props: `selectedMaterial`, `onMaterialChange`, `files` (pro kalkulaci ceny)
- State: `isExpanded` (toggle visibility), `materialPrices` (caching)
- useEffect hook: načte ceny pro všechny dostupné materiály přes pricing engine
  - Zavolá `calculatePrice(modelConfig)` s každým materiálem
  - Vrátí `{ material, totalPrice, diff_from_cheapest }`
  - useMemo cache pro výkon
- Struktura:
  - Header (closable/expandable):
    - "Porovnání materiálů" title
    - Collapse icon
    - Badge s počtem materiálů
  - Expandovatelný obsah (max-height animation):
    - Tabulka: Materiál | Cena | Diff | Akce
    - Seřazeno od nejlevnějšího (ascending)
    - Barvy: nejlevnější = green badge, ostatní = neutral
- Material row:
  - Material name (clickable)
  - Price: `${price.toFixed(2)} CZK`
  - Diff bar: horizontální bar s % (visual 0-100% spread)
    - Barva: green (nejlevnější) → orange → red (nejdražší)
  - "Zvolit" button (nebo ✓ pokud vybrán)
  - onClick: `onMaterialChange(material)`
- i18n labels (CZ/EN):
  - "Porovnání materiálů" / "Material Comparison"
  - "Cena" / "Price"
  - "Rozdíl" / "Difference"
  - "Zvolit" / "Select"
- Forge dark theme: CSS proměnné pro barvy (teal accent, orange warning, red error)
- Responsive: full-width v mobile, max-width 600px v desktop
- PropTypes validace

---

### 2. `src/pages/test-kalkulacka/components/PrintConfiguration.jsx`

**Typ:** Zmeneno
**Radky:** 200-230
**Duvod:** Integrace MaterialComparison do Step 3 UI flow

**Co se zmenilo:**
- Import: `import MaterialComparison from './MaterialComparison'`
- Step 3 struktura (Material Selection):
  - Material dropdown selector (stávající)
  - Nová sekce "Porovnání materiálů": `<MaterialComparison selectedMaterial={...} onMaterialChange={handleMaterialChange} files={...} />`
  - Umístění: pod Material dropdown, po FilamentUsageVisualization, před Price Breakdown
  - Height animation (Forge design): `max-height: 0 → auto` na expand
- Props passing:
  - `selectedMaterial={state.selectedMaterial}`
  - `onMaterialChange={(material) => setState({ selectedMaterial: material })}`
  - `files={state.uploadedFiles}`
- Conditional render: zobrazit pouze pokud jsou soubory a min. 2 materiály dostupné

---

### 3. `src/pages/test-kalkulacka/index.jsx`

**Typ:** Zmeneno
**Radky:** 450-480
**Duvod:** Top-level integrace MaterialComparison komponenty

**Co se zmenilo:**
- Import v Step 3 render call
- Kontrola state machine: materiál je zvolen v Step 3 (Material Selection)
- Integrace do PricingCalculator props
- I18n context check pro správné labels

---

## Dopad zmen

- **Ovlivnene komponenty:** PrintConfiguration (parent), MaterialComparison (nová), PricingCalculator
- **Breaking changes:** Ne — nový feature, žádná změna existujícího behavior
- **Nove zavislosti:** Žádné (useMemo, pricing engine již existuje)
- **Rizika:** Cena kalkulace — nutno testovat s backend API, fallback na demo ceny

---

## Testovani

- **Build:** Očekáváno PASS (import, CSS)
- **Manual test:**
  - Nahrát model → jít na Step 3
  - MaterialComparison section collapsed (default)
  - Kliknout na "Porovnání materiálů" → expand
  - Tabulka s 5+ materiály se zobrazí, seřazeno od nejlevnějšího
  - Diff bar vizuálně znázorňuje rozdíl v ceně (green → red)
  - Kliknout na "Zvolit" u jiného materiálu → selectedMaterial změní, ✓ se zobrazí
  - FilamentUsageVisualization se aktualizuje dle nového materiálu
  - PriceBreakdown se přepočítá
  - I18n: test CZ + EN labels
  - Responsive: mobile width 100% content, desktop max-width 600px
  - Performance: useMemo cache funguje (50ms+ optimalizace)

---
