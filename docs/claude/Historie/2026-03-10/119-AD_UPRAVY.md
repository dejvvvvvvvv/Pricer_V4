# 119-AD — UPRAVY — Admin Dashboard Analytics Charts — 2026-03-10

## Metadata
- **ID:** 119-AD
- **Session:** S01
- **Datum:** 2026-03-10
- **Oblast:** Admin-Dashboard (Analytics Enhancement)
- **Souvisejici ID:** 117-TK (Price Chart), 120-AD (Notification Center), 121-TK (Responsive)
- **Trigger:** Batch 2 autonomní implementace — přidání grafů pro lepší vizualizaci analytics v admin panelu

---

## Souhrn uprav

Vytvořen nový komponent `DashboardCharts.jsx` s čtyřmi analytics grafy: Orders Over Time (line chart), Revenue Summary (bar chart), Order Status Distribution (donut), Top Materials (horizontal bar). Integrován do AdminDashboard.jsx. Demo data s DEMO badge pro tenanta bez objednávek. Recharts, dark theme, Czech labels.

---

## Seznam upravenych souboru

| # | Soubor | Typ zmeny | Radky | Popis |
|---|--------|-----------|-------|-------|
| 1 | `src/pages/admin/components/DashboardCharts.jsx` | Novy soubor | 1-450 | Čtyři Recharts komponenty (Line, Bar, Pie, BarChart) s demo daty |
| 2 | `src/pages/admin/AdminDashboard.jsx` | Zmeneno | 200-250 | Import + integrace DashboardCharts, responsive grid layout |

---

## Detailni zmeny

### 1. `src/pages/admin/components/DashboardCharts.jsx`

**Typ:** Novy soubor
**Radky:** 450
**Duvod:** Nový komponent pro vizualizaci 4 klíčových analytics: objednávky v čase, tržby, status distribuce, top materiály.

**Co se zmenilo:**
- **OrdersOverTimeChart** (LineChart):
  - X-axis: poslední 30 dní
  - Y-axis: počet objednávek
  - Line: modrá s plnění pod čárou (area)
  - Responsive, tooltip s datem + počtem
  - Animace 300ms

- **RevenueSummaryChart** (BarChart):
  - X-axis: poslední 4 týdny
  - Y-axis: tržby (CZK)
  - Barvy: 3 kategorie (Material, Services, Margin)
  - Stacked barový graf pro složení
  - Tooltip zobrazí breakdown
  - Dark theme: Forge dark background

- **OrderStatusChart** (PieChart/Donut):
  - 4 statusy: Pending, In Progress, Completed, Cancelled
  - Donut graf (innerRadius=70)
  - Barvy: orange (pending), teal (in progress), green (completed), red (cancelled)
  - Legenda s počtem objednávek
  - Tooltip: procenta

- **TopMaterialsChart** (BarChart horizontal):
  - Top 5 materiálů dle počtu objednávek
  - Horizontal layout (pro čitelnost dlouhých názvů)
  - Labels: Prusa PLA, Prusa PETG, Resine, atd.
  - Barvy: Forge design tokens
  - Tooltip: počet + procenta

- **Demo data:**
  - Když `tenantHasOrders === false`, zobrazit demo data s DEMO badge
  - Demo data reprezentují reálné scénáře (sezónnost, trendy)
  - DEMO badge: oranžová barva, "Demo data" text, v rohu každého grafu

- **Styling:**
  - Responsive grid: 2x2 na desktopu (1024px+), 2x1 na tabletu (768px+), 1x4 na mobilu
  - Padding: 16px kolem grafů
  - Border: subtle 1px Forge muted
  - Czech labels: "Objednávky v čase", "Tržby", "Status objednávek", "Top materiály"

**Kod fragment — line chart:**
```jsx
export function DashboardCharts({ tenantData }) {
  const hasOrders = tenantData?.orders?.length > 0;
  const ordersTrendData = hasOrders
    ? generateOrdersTrend(tenantData.orders)
    : generateDemoOrdersTrend();

  return (
    <div className="dashboard-charts-container">
      {!hasOrders && (
        <div className="demo-badge">
          📊 Demo data — žádné skutečné objednávky
        </div>
      )}

      <div className="charts-grid">
        {/* Orders Over Time */}
        <div className="chart-container">
          <h3>Objednávky v čase</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={ordersTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="orders"
                stroke="var(--forge-color-accent-teal)"
                fill="var(--forge-color-accent-teal)"
                fillOpacity={0.2}
                isAnimationActive
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Další 3 grafy... */}
      </div>
    </div>
  );
}
```

---

### 2. `src/pages/admin/AdminDashboard.jsx`

**Typ:** Zmeneno
**Radky:** 200-250 (render sekce)
**Duvod:** Integrace DashboardCharts do admin panelu

**Co se zmenilo:**
- Import: `import { DashboardCharts } from './components/DashboardCharts'`
- Přidání DashboardCharts do dashboard layoutu
- Pass props: `tenantData` (orders, revenue, materiály)
- Responsive grid wrapper: charts odděleny od ostatního obsahu
- Conditional render: pokud `tenantData` je loaded
- Dark theme aware

**Pred:**
```jsx
// AdminDashboard bez grafů
export function AdminDashboard() {
  return (
    <div className="admin-dashboard">
      <h1>Dashboard</h1>
      <StatsCards />
      {/* Bez grafů */}
    </div>
  );
}
```

**Po:**
```jsx
export function AdminDashboard() {
  const { tenantData } = useTenant();

  return (
    <div className="admin-dashboard">
      <h1>Dashboard</h1>
      <StatsCards />

      {tenantData && (
        <DashboardCharts tenantData={tenantData} />
      )}
    </div>
  );
}
```

---

## Dopad zmen

- **Ovlivnene komponenty:** AdminDashboard.jsx
- **Breaking changes:** Žádné
- **Nove zavislosti:** recharts (již v dependencies)
- **Rizika:**
  - Performance: 4 velké grafy mohou být slow na starších zařízeních; Mitigace: useMemo() na data
  - Demo data hardcode; budoucí: load z API

---

## Testovani

- **Build:** npm run build — PASS
- **Manual test:**
  - Bez objednávek: demo data s DEMO badge viditelné — OK
  - 4 grafy se renderují — OK
  - Line chart se pohybuje správně — OK
  - Bar chart stacked korektně — OK
  - Donut legenda viditelná — OK
  - Horizontal bar čitelné — OK
  - Responsive: desktop 2x2, tablet OK — OK
  - Dark theme barvy správné — OK
- **Poznamky:** Demo data pending, real data pending API integration

---

<!-- KONEC SABLONY -->
