# 136-TK — UPRAVY — Test-Kalkulacka — 2026-03-10

## Metadata
- **ID:** 136-TK
- **Session:** S01
- **Datum:** 2026-03-10
- **Oblast:** Test-Kalkulacka
- **Souvisejici ID:** 115 (Roadmap plán s touto feature), 132 (Batch 6 session)
- **Trigger:** Batch 8 autonomní implementace — Filament usage visualization dle roadmapu

---

## Souhrn uprav

Implementace SVG-based filament usage visualization s animovaným naplněním cívky, statistikami (váha, délka, procento), a warningem pro 80%+ obsazenost nebo multi-spool situace. Přidána do Step 3 (Material Selection) kalkulačky.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky | Popis |
|---|--------|-----------|-------|-------|
| 1 | `src/pages/test-kalkulacka/components/FilamentUsageVisualization.jsx` | Nový soubor | N/A | SVG spool grafika s animovaným naplněním, statistikami, warningem |
| 2 | `src/pages/test-kalkulacka/components/PricingCalculator.jsx` | Zmeneno | 380-420 | Integrace FilamentUsageVisualization do Step 3 (Material) |

---

## Detailni zmeny

### 1. `src/pages/test-kalkulacka/components/FilamentUsageVisualization.jsx`

**Typ:** Nový soubor
**Radky:** N/A
**Duvod:** Vědecký přehled filamentu — vizualizace obsazenosti cívky s warningem na 80%+

**Co se zmenilo:**
- Nový React komponent s props: `files` (multi-file support), `selectedMaterial`
- SVG spool grafika:
  - Obrys cívky (CSS border + SVG ellipse)
  - Animované naplnění: `<rect>` s výškou basovanou na `percentUsed`
  - Gradient fill: light → dark dle threshold (80%+ = red)
  - Animation: `@keyframes fillAnimation` 0.6s ease-out na mount
- Statistiky (pod SVG):
  - Váha: `${totalWeight.toFixed(1)} g` (summa ze všech files)
  - Délka: `${totalLength.toFixed(0)} m` (summa)
  - Obsazenost: `${percentUsed.toFixed(1)} %` (váha / spool kapacita)
  - Spool kapacita: `${spoolCapacity} g` (configurable prop)
- Warning messages:
  - Pokud `percentUsed >= 80%`: "⚠️ Blízko kapacity cívky!"
  - Pokud více files + `totalWeight > spoolCapacity`: "⚠️ Vyžaduje více cívek!"
- Multi-file breakdown (expandovatelná):
  - Tabulka: Soubor | Material | Váha | Procento
  - Seřazeno sestupně podle váhy
- Forge dark theme: CSS proměnné pro barvy (--forge-accent, --forge-warning)
- Responsive: max-width 300px, center-aligned
- Typy: PropTypes validace pro files array, selectedMaterial object

---

### 2. `src/pages/test-kalkulacka/components/PricingCalculator.jsx`

**Typ:** Zmeneno
**Radky:** 380-420
**Duvod:** Integrace FilamentUsageVisualization do Step 3

**Co se zmenilo:**
- Import: `import FilamentUsageVisualization from './FilamentUsageVisualization'`
- Step 3 (Material Selection) struktura:
  - Material dropdown selector (stávající)
  - Nová sekce "Filament Obsazenost": `<FilamentUsageVisualization files={uploadedFiles} selectedMaterial={selectedMaterial} />`
  - Umístění: pod Material dropdown, před Price Breakdown
- Props passing: `files={state.uploadedFiles}`, `selectedMaterial={state.selectedMaterial}`
- Conditional render: zobrazit pouze pokud jsou soubory nahrány a material zvolen
- Czech labels + lokalizace (i18n context check)

---

## Dopad zmen

- **Ovlivnene komponenty:** PricingCalculator (parent), Step3 (Material selection), FilamentUsageVisualization (nová)
- **Breaking changes:** Ne — čistě nový feature, přidán do UI flow bez změny existujícího
- **Nove zavislosti:** Žádné (pure React, SVG, CSS)
- **Rizika:** Kalkulace váhy — nutno validovat s backend API (presetsApi), fallback na default kapacity

---

## Testovani

- **Build:** Očekáváno PASS (nový soubor, import)
- **Manual test:**
  - Nahrát model (1+ file)
  - Jít na Step 3 (Material)
  - FilamentUsageVisualization se zobrazí
  - SVG animation se spustí (naplnění cívky 0→%used)
  - Statistiky se spočítají správně (váha, délka, %)
  - Warning se zobrazí pokud >80%
  - Multi-file breakdown je viditelné a expandovatelné
  - Test s 2+ files: multi-spool warning
  - Theme (dark/light) se aplikuje na barvy
  - Responsive: mobile width max-width 300px

---
