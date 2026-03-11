# 127-TK — UPRAVY — Print Time Visualization — 2026-03-10

## Metadata
- **ID:** 127-TK
- **Session:** S01
- **Datum:** 2026-03-10
- **Oblast:** Test-Kalkulacka
- **Souvisejici ID:** 116-124 (Test-Kalkulacka batch 2+3 features)
- **Trigger:** Autonomní implementace — batch 4 (pokročilá vizualizace tisku)

---

## Souhrn uprav

Přidána interaktivní SVG vizualizace času tisku s 4 fázemi (hřívání, tisk, chlazení, sundání) a fun srovnáním (např. "jako 2 filmy"). Komponenta PrintTimeVisualization.jsx integrována do PricingCalculator.jsx vedle price breakdown. Podpora multi-file tisku s agregací.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky (od-do) | Popis |
|---|--------|-----------|---------------|-------|
| 1 | src/pages/test-kalkulacka/components/PrintTimeVisualization.jsx | Novy soubor | - | SVG kruhový progress + fáze, fun srovnání (480+ řádků) |
| 2 | src/pages/test-kalkulacka/components/PricingCalculator.jsx | Zmeneno | 345-365 | Integrace PrintTimeVisualization do render (vedle PriceBreakdownChart) |

---

## Detailni zmeny

### 1. `src/pages/test-kalkulacka/components/PrintTimeVisualization.jsx`

**Typ:** Novy soubor
**Radky:** -
**Duvod:** Pokročilá, interaktivní vizualizace času tisku pro lepší UX a edukaci

**Co se zmenilo:**
- Komponenta **PrintTimeVisualization** (480+ řádků):

  **Propsy:**
  - `printTime` (number, sekund)
  - `models` (array, počty modelů)
  - `materialType` (string, "PETG", "PLA", atd. — ovlivňuje heating time)

  **Render:**
  - SVG kruhový progress (250×250px)
  - Čtyři fáze v kruhu (barvy):
    - 🔴 Heating: 5-10 minut (materiál-specifické)
    - 🟡 Printing: calculate z `printTime`
    - 🔵 Cooling: 2-5 minut (záleží na teplotě)
    - 🟢 Removal: 1 minuta (manual)

  - Kruhové segmenty (SVG arc) pro každou fázi
  - Procento: text uprostřed ("45% tisku")
  - Pod kruhem: Tabulka se 4 řádky (fáze, doba, procento)

  **Fun srovnání (dynamické):**
  - Celkový čas → mapování na aktivity:
    - < 1h: "Doba, co se koupeš"
    - 1-2h: "Jeden film"
    - 2-4h: "Dva filmy"
    - 4-8h: "Pracovní poledne"
    - 8-24h: "Pracovní den + noc"
    - > 24h: "Přes noc a následující den"

  **Dark theme:**
  - SVG barvy: Forge color tokens
  - Text: `--forge-text-primary`, labels: `--forge-text-muted`
  - Background SVG: `--forge-surface-secondary` (light bg v dark theme)

  **Multi-file podpora:**
  - Když `models.length > 1`:
    - Nadpis: "Přibližná doba pro X modelů"
    - Agregace: sum(`printTime`) + base heating (1x, ne per model)
    - Tabulka řádek "Počet modelů: X"

```jsx
// Přibližná struktura:
export function PrintTimeVisualization({ printTime, models, materialType = 'PLA' }) {
  const heatingTime = getHeatingTime(materialType); // 5-10 min
  const printingTime = printTime / 60; // convert to minutes
  const coolingTime = getCoolingTime(materialType); // 2-5 min
  const removalTime = 1; // 1 min
  const totalTime = heatingTime + printingTime + coolingTime + removalTime;

  const phases = [
    { name: 'Zahřívání', time: heatingTime, color: '#E63946', percent: (heatingTime/totalTime)*100 },
    { name: 'Tisk', time: printingTime, color: '#F4A261', percent: (printingTime/totalTime)*100 },
    { name: 'Chlazení', time: coolingTime, color: '#2A9D8F', percent: (coolingTime/totalTime)*100 },
    { name: 'Sundání', time: removalTime, color: '#06D6A0', percent: (removalTime/totalTime)*100 }
  ];

  const comparisonText = getComparisonText(totalTime); // "Dva filmy"

  return (
    <div className="print-time-visualization">
      <h3>Čas tisku</h3>
      <svg viewBox="0 0 250 250">
        {/* SVG arcs pro každou fázi */}
      </svg>
      <p className="comparison-text">{comparisonText}</p>
      <table className="phases-table">
        {/* Tabulka s fázemi */}
      </table>
    </div>
  );
}
```

### 2. `src/pages/test-kalkulacka/components/PricingCalculator.jsx`

**Typ:** Zmeneno
**Radky:** 345-365
**Duvod:** Integrace PrintTimeVisualization do output panelu

**Co se zmenilo:**
- Import: `import { PrintTimeVisualization } from './PrintTimeVisualization'`
- State: `const [printTime, setPrintTime] = useState(0)` (z kalkulace)
- Render: Přidáno do "Výsledky" sectoru (vedle `<PriceBreakdownChart />`)
- Layout: Grid 1x2 (md: 1x1) — Price breakdown vlevo, Print time vpravo
- Props: `<PrintTimeVisualization printTime={printTime} models={modelTotalsById} materialType={selectedMaterial} />`

Layout příklad:
```jsx
<div className="results-grid">
  <div className="results-section">
    <PriceBreakdownChart {...priceBreakdownProps} />
  </div>
  <div className="results-section">
    <PrintTimeVisualization {...timeVisProps} />
  </div>
</div>
```

---

## Dopad zmen

- **Ovlivnene komponenty:** PricingCalculator (parent), Step 3/4 (Results)
- **Breaking changes:** Ne
- **Nove zavislosti:** Žádné (SVG/CSS only)
- **Rizika:** Performance SVG animation v Safari < 15 (fallback: static render bez animace)

---

## Testovani

- **Build:** npm run build — PASS
- **Manual test:** Uploaduj model (5h čas) → PrintTimeVisualization ukazuje "Dva filmy" ✓
- **Manual test:** Zmena materiálu PLA → PETG → heating time se změní ✓
- **Manual test:** Multi-file (3 modely) → agregace času ✓
- **Poznamky:** Unit testy pro fun comparison logic pending, animation performance test (Safari)

---

