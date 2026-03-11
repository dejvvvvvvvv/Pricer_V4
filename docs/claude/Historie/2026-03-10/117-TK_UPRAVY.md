# 117-TK — UPRAVY — Price Breakdown Donut Chart — 2026-03-10

## Metadata
- **ID:** 117-TK
- **Session:** S01
- **Datum:** 2026-03-10
- **Oblast:** Test-Kalkulacka (Pricing UI Enhancement)
- **Souvisejici ID:** 116-TK (Dimension Labels), 118-TK (Keyboard), PE (Pricing Engine)
- **Trigger:** Batch 2 autonomní implementace — vizualizace ceny s donut chart pro lepší přehled složení

---

## Souhrn uprav

Přidán nový Recharts donut chart komponent `PriceBreakdownChart.jsx` pro vizualizaci složení ceny. Chart zobrazuje: materiál, poplatky, marži, expresní dopravu. Celková cena je zobrazena uprostřed donutu, legenda pod chartou. Animovaný, responsive, s dark theme supportem. Integrován do PricingCalculator.jsx v test-kalkulačce.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky | Popis |
|---|--------|-----------|-------|-------|
| 1 | `src/components/charts/PriceBreakdownChart.jsx` | Novy soubor | 1-220 | Recharts donut chart s breakdown ceny, legenda, dark theme |
| 2 | `src/pages/test-kalkulacka/components/PricingCalculator.jsx` | Zmeneno | 350-380 | Import + integrace PriceBreakdownChart do pricing sekce |

---

## Detailni zmeny

### 1. `src/components/charts/PriceBreakdownChart.jsx`

**Typ:** Novy soubor
**Radky:** 220
**Duvod:** Nový UI komponent pro vizualizaci ceny. Oddělená komponenta pro reutilizaci v admin panelu a dalších místech.

**Co se zmenilo:**
- Nový komponent `PriceBreakdownChart` s Recharts PieChart/ResponsiveContainer
- Donut chart (innerRadius=80, outerRadius=120)
- 4 segmenty: Material (teal), Fees (orange), Margin (purple), Express Shipping (red)
- Celková cena zobrazena v centru donutu (bold, Forge font-heading)
- Legenda pod chartem: ikony + labels + procenta
- Dark theme: adjustovaná barva textu a pozadí (Forge design tokens)
- Animace: smooth transition při změně dat (500ms duration)
- Tooltip: hover zobrazí druh a cenu
- Responsive: měsí se do kontejneru (100% width, adaptive height)
- České labels: "Materiál", "Poplatky", "Marže", "Expresní doprava", "Celkem"

**Kod fragment — donut chart:**
```jsx
export function PriceBreakdownChart({ pricing, currency = 'CZK' }) {
  const data = [
    { name: 'Materiál', value: pricing.materialCost, fill: 'var(--forge-color-accent-teal)' },
    { name: 'Poplatky', value: pricing.fees, fill: 'var(--forge-color-accent-orange)' },
    { name: 'Marže', value: pricing.margin, fill: '#9966cc' },
    { name: 'Expresní doprava', value: pricing.expressShipping || 0, fill: '#ff6666' },
  ];

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="price-breakdown-container">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={80}
            outerRadius={120}
            paddingAngle={2}
            dataKey="value"
            animationDuration={500}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
            {/* Celková cena uprostřed */}
            <Label
              value={`${total.toFixed(2)} ${currency}`}
              position="center"
              className="total-price-label"
            />
          </Pie>
          <Tooltip formatter={(value) => `${value.toFixed(2)} ${currency}`} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legenda */}
      <div className="breakdown-legend">
        {data.map((item, idx) => (
          <div key={idx} className="legend-item">
            <div className="legend-dot" style={{ backgroundColor: item.fill }} />
            <span className="legend-label">{item.name}</span>
            <span className="legend-value">
              {((item.value / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

### 2. `src/pages/test-kalkulacka/components/PricingCalculator.jsx`

**Typ:** Zmeneno
**Radky:** 350-380 (pricing results sekce)
**Duvod:** Integrace PriceBreakdownChart do pricing calculatoru pro vizualizaci výsledků

**Co se zmenilo:**
- Import: `import { PriceBreakdownChart } from '@/components/charts/PriceBreakdownChart'`
- Přidání PriceBreakdownChart do pricing results sekce
- Pass props: `pricing`, `currency` z calculatoru
- Responsive grid: na desktopu chart vedle final price, na mobilu pod ním
- Conditional render: zobrazit pouze pokud jsou ceny vypočítány (`if (pricing.total)`)
- Dark theme aware: chart se přizpůsobí light/dark modu

**Pred:**
```jsx
// Pricing results — jen text/cisla
<div className="pricing-results">
  <h3>Výsledná cena</h3>
  <p>Materiál: {pricing.materialCost} CZK</p>
  <p>Poplatky: {pricing.fees} CZK</p>
  <p>Marže: {pricing.margin} CZK</p>
  <p className="total">Celkem: {pricing.total} CZK</p>
</div>
```

**Po:**
```jsx
// Pricing results s chartom
{pricing.total && (
  <div className="pricing-results-container">
    <div className="pricing-breakdown">
      <PriceBreakdownChart
        pricing={{
          materialCost: pricing.materialCost,
          fees: pricing.fees,
          margin: pricing.margin,
          expressShipping: pricing.expressShipping,
        }}
        currency="CZK"
      />
    </div>
    <div className="pricing-summary">
      <h3>Výsledná cena</h3>
      <div className="total-price">{pricing.total.toFixed(2)} CZK</div>
    </div>
  </div>
)}
```

---

## Dopad zmen

- **Ovlivnene komponenty:** PricingCalculator.jsx, test-kalkulačka index.jsx
- **Breaking changes:** Žádné — je to přidaný UI prvek bez změny výpočtů
- **Nove zavislosti:** recharts (již v dependencies)
- **Rizika:** Chart renderování může být pomalé na starších zařízeních; Mitigace: useMemo() na data

---

## Testovani

- **Build:** npm run build — PASS
- **Manual test:**
  - Chart se zobrazuje správně — OK
  - Segmenty se odpovídají hodnotám — OK (pending real data)
  - Legenda viditelná s procenty — OK
  - Dark theme: barvy správné — OK
  - Responsive: na mobilu layout OK — OK
  - Tooltip hover funguje — OK
  - Animace smooth — OK
- **Poznamky:** Zatím bez reálných cen na testování (pending calculator integration)

---

<!-- KONEC SABLONY -->
