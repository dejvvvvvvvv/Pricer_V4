import React, { useMemo, useRef, useCallback } from 'react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

/* ── Forge-compatible colors ──────────────────────────────────────────── */
const TEAL = '#00D4AA';
const ORANGE = '#FF6B35';
const SKY = '#4DA8DA';
const PURPLE = '#6C63FF';
const YELLOW = '#FFB547';
const RED = '#FF4757';
const MUTED = '#7A8291';

const MATERIAL_COLORS = [TEAL, ORANGE, SKY, PURPLE, YELLOW, RED, '#10B981', '#F472B6'];

const STATUS_COLORS = {
  NEW: TEAL,
  REVIEW: SKY,
  APPROVED: '#22C55E',
  PRINTING: ORANGE,
  POSTPROCESS: PURPLE,
  READY: YELLOW,
  SHIPPED: '#06B6D4',
  DONE: '#10B981',
  CANCELED: RED,
};

const CHART_GRID = '#1E2230';
const CHART_TEXT = '#7A8291';

/* ── Dark theme tooltip ──────────────────────────────────────────────── */
const darkTooltipStyle = {
  backgroundColor: 'var(--forge-bg-elevated)',
  border: '1px solid var(--forge-border-default)',
  borderRadius: 8,
  color: 'var(--forge-text-primary)',
  fontSize: 13,
  fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
};

/* ── Helpers ─────────────────────────────────────────────────────────── */
function formatKc(v) {
  if (v === null || v === undefined) return '-';
  return `${Number(v).toLocaleString('cs-CZ', { maximumFractionDigits: 0 })} Kc`;
}

function formatNum(v, digits = 0) {
  if (v === null || v === undefined || Number.isNaN(v)) return '-';
  return Number(v).toLocaleString('cs-CZ', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function shortDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getDate()}.${d.getMonth() + 1}.`;
}

/** Export a DOM element as PNG via canvas */
function exportChartAsPng(containerRef, filename = 'chart.png') {
  if (!containerRef?.current) return;
  const svg = containerRef.current.querySelector('svg');
  if (!svg) return;

  const svgData = new XMLSerializer().serializeToString(svg);
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width * 2;
    canvas.height = img.height * 2;
    const ctx = canvas.getContext('2d');
    ctx.scale(2, 2);
    ctx.fillStyle = '#0E1015';
    ctx.fillRect(0, 0, img.width, img.height);
    ctx.drawImage(img, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
    });
    URL.revokeObjectURL(url);
  };
  img.src = url;
}

/* ── Demo data generators — DEMO: mock data only, all Math.random() calls below are for chart demo ── */
function generateDemoRevenueTrend(days = 30) {
  const data = [];
  const now = Date.now();
  const msDay = 86400000;
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now - i * msDay);
    data.push({
      date: d.toISOString().slice(0, 10),
      label: shortDate(d.toISOString()),
      revenue: Math.round(800 + Math.random() * 4000),
    });
  }
  return data;
}

function generateDemoMaterialPie() {
  return [
    { name: 'PLA', value: 42 },
    { name: 'PETG', value: 28 },
    { name: 'ABS', value: 15 },
    { name: 'ASA', value: 9 },
    { name: 'TPU', value: 6 },
  ];
}

function generateDemoStatusPie() {
  return [
    { name: 'New', value: 5, status: 'NEW' },
    { name: 'Printing', value: 8, status: 'PRINTING' },
    { name: 'Done', value: 12, status: 'DONE' },
    { name: 'Canceled', value: 2, status: 'CANCELED' },
    { name: 'Review', value: 3, status: 'REVIEW' },
  ];
}

function generateDemoAOV(days = 30) {
  const data = [];
  const now = Date.now();
  const msDay = 86400000;
  let avg = 450;
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now - i * msDay);
    avg += (Math.random() - 0.48) * 60;
    avg = Math.max(200, Math.min(800, avg));
    data.push({
      date: d.toISOString().slice(0, 10),
      label: shortDate(d.toISOString()),
      aov: Math.round(avg),
    });
  }
  for (let i = 0; i < data.length; i++) {
    const window = data.slice(Math.max(0, i - 6), i + 1);
    data[i].ma7 = Math.round(window.reduce((s, d) => s + d.aov, 0) / window.length);
  }
  return data;
}

function generateDemoPrintTime() {
  return [
    { range: '0-30 min', count: 12 },
    { range: '30-60 min', count: 18 },
    { range: '60-120 min', count: 8 },
    { range: '120-240 min', count: 5 },
    { range: '240+ min', count: 2 },
  ];
}

function generateDemoMaterialBar() {
  return [
    { name: 'PLA', count: 18 },
    { name: 'PETG', count: 12 },
    { name: 'ABS', count: 7 },
    { name: 'TPU', count: 4 },
    { name: 'ASA', count: 3 },
  ];
}

function generateDemoFunnel(cs) {
  return [
    { step: cs ? 'Nahrano modelu' : 'Models uploaded', value: 180 },
    { step: cs ? 'Slicovano' : 'Sliced', value: 156 },
    { step: cs ? 'Oceneno' : 'Quoted', value: 142 },
    { step: cs ? 'Objednano' : 'Ordered', value: 38 },
  ];
}

/* ── Data processing from analytics sessions ─────────────────────────── */

function processRevenueTrend(sessions, granularity = 'day') {
  const ordered = sessions.filter((s) => s.converted);
  if (ordered.length === 0) return null;

  const buckets = new Map();
  for (const s of ordered) {
    const d = new Date(s.last_event_at);
    let key;
    if (granularity === 'month') {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    } else if (granularity === 'week') {
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d);
      monday.setDate(diff);
      key = monday.toISOString().slice(0, 10);
    } else {
      key = d.toISOString().slice(0, 10);
    }
    buckets.set(key, (buckets.get(key) || 0) + (s.summary?.price_total || 0));
  }

  return [...buckets.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, revenue]) => ({
      date,
      label: granularity === 'month' ? date : shortDate(date + 'T00:00:00Z'),
      revenue: Math.round(revenue),
    }));
}

function processFunnel(sessions, cs) {
  const allEvents = [];
  for (const s of sessions) {
    for (const e of s.events || []) {
      allEvents.push(e.eventType);
    }
  }

  const uploaded = allEvents.filter((e) => e === 'MODEL_UPLOAD_COMPLETED').length;
  const sliced = allEvents.filter((e) => e === 'SLICING_COMPLETED').length;
  const quoted = allEvents.filter((e) => e === 'PRICE_SHOWN').length;
  const ordered = allEvents.filter((e) => e === 'ORDER_CREATED' || e === 'ADD_TO_CART_CLICKED').length;

  if (uploaded === 0 && sliced === 0 && quoted === 0 && ordered === 0) return null;

  return [
    { step: cs ? 'Nahrano modelu' : 'Models uploaded', value: uploaded },
    { step: cs ? 'Slicovano' : 'Sliced', value: sliced },
    { step: cs ? 'Oceneno' : 'Quoted', value: quoted },
    { step: cs ? 'Objednano' : 'Ordered', value: ordered },
  ];
}

/* ── Chart wrapper with export button ────────────────────────────────── */
function ChartCard({ title, children, isDemo, exportLabel, chartRef }) {
  return (
    <div className="ac-card" ref={chartRef}>
      <div className="ac-card-header">
        <div className="ac-card-title">
          {title}
          {isDemo && <span className="ac-demo-badge">DEMO</span>}
        </div>
        {exportLabel && (
          <button
            type="button"
            className="ac-export-btn"
            onClick={() => exportChartAsPng(chartRef, `${exportLabel}.png`)}
            aria-label={`Export ${title} as PNG`}
            title="Export PNG"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 1v8M3.5 5.5 7 9l3.5-3.5M1 11h12" />
            </svg>
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

/* ── Empty state ─────────────────────────────────────────────────────── */
function EmptyChart({ message }) {
  return (
    <div className="ac-empty">
      {message}
    </div>
  );
}

/* ── Individual chart components ─────────────────────────────────────── */

function RevenueTrendChart({ data, granularity, setGranularity, isDemo, cs }) {
  const ref = useRef(null);
  const granLabels = useMemo(() => ({
    day: cs ? 'Den' : 'Day',
    week: cs ? 'Tyden' : 'Week',
    month: cs ? 'Mesic' : 'Month',
  }), [cs]);

  return (
    <ChartCard
      title={cs ? 'Trzby v case' : 'Revenue Over Time'}
      isDemo={isDemo}
      exportLabel="revenue-trend"
      chartRef={ref}
    >
      <div className="ac-granularity">
        {['day', 'week', 'month'].map((g) => (
          <button
            key={g}
            type="button"
            className={`ac-gran-btn ${granularity === g ? 'active' : ''}`}
            onClick={() => setGranularity(g)}
          >
            {granLabels[g]}
          </button>
        ))}
      </div>
      {data.length === 0 ? (
        <EmptyChart message={cs ? 'Zadna data o trzbach' : 'No revenue data'} />
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="tealGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={TEAL} stopOpacity={0.35} />
                <stop offset="95%" stopColor={TEAL} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fill: CHART_TEXT, fontSize: 11 }} axisLine={{ stroke: CHART_GRID }} tickLine={false} />
            <YAxis tick={{ fill: CHART_TEXT, fontSize: 11 }} axisLine={{ stroke: CHART_GRID }} tickLine={false} tickFormatter={(v) => `${v} Kc`} />
            <Tooltip
              contentStyle={darkTooltipStyle}
              formatter={(v) => [formatKc(v), cs ? 'Trzby' : 'Revenue']}
              labelFormatter={(l) => l}
            />
            <Area type="monotone" dataKey="revenue" stroke={TEAL} fill="url(#tealGradient)" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: TEAL }} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

function OrdersByStatusChart({ data, isDemo, cs }) {
  const ref = useRef(null);
  const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data]);

  return (
    <ChartCard
      title={cs ? 'Objednavky podle stavu' : 'Orders by Status'}
      isDemo={isDemo}
      exportLabel="orders-by-status"
      chartRef={ref}
    >
      {data.length === 0 ? (
        <EmptyChart message={cs ? 'Zadne objednavky' : 'No orders'} />
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: '50%' }}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || MUTED} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={darkTooltipStyle}
                  formatter={(v, name) => [`${v} (${total > 0 ? Math.round((v / total) * 100) : 0}%)`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ width: '50%', display: 'flex', flexDirection: 'column', gap: 5 }}>
            {data.map((entry) => (
              <div key={entry.status} className="ac-legend-row">
                <div className="ac-legend-dot" style={{ backgroundColor: STATUS_COLORS[entry.status] || MUTED }} />
                <span className="ac-legend-name">{entry.name}</span>
                <span className="ac-legend-value">
                  {entry.value}
                  <span className="ac-legend-pct">
                    ({total > 0 ? Math.round((entry.value / total) * 100) : 0}%)
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </ChartCard>
  );
}

function TopMaterialsBarChart({ data, isDemo, cs }) {
  const ref = useRef(null);
  const maxCount = useMemo(() => Math.max(1, ...data.map((d) => d.count)), [data]);

  return (
    <ChartCard
      title={cs ? 'Nejpouzivanejsi materialy' : 'Most Popular Materials'}
      isDemo={isDemo}
      exportLabel="top-materials"
      chartRef={ref}
    >
      {data.length === 0 ? (
        <EmptyChart message={cs ? 'Zadna data o materialech' : 'No material data'} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
          {data.map((item, i) => {
            const barColor = MATERIAL_COLORS[i % MATERIAL_COLORS.length];
            const widthPct = Math.max((item.count / maxCount) * 100, 4);
            return (
              <div key={item.name} className="ac-bar-row">
                <div className="ac-bar-label">{item.name}</div>
                <div className="ac-bar-track">
                  <div
                    className="ac-bar-fill"
                    style={{ width: `${widthPct}%`, backgroundColor: barColor }}
                  />
                </div>
                <div className="ac-bar-count">{item.count}</div>
              </div>
            );
          })}
        </div>
      )}
    </ChartCard>
  );
}

function AOVChart({ data, isDemo, cs }) {
  const ref = useRef(null);

  return (
    <ChartCard
      title={cs ? 'Prumerna hodnota objednavky' : 'Average Order Value Trend'}
      isDemo={isDemo}
      exportLabel="aov-trend"
      chartRef={ref}
    >
      {data.length === 0 ? (
        <EmptyChart message={cs ? 'Zadna data' : 'No data'} />
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
            <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fill: CHART_TEXT, fontSize: 11 }} axisLine={{ stroke: CHART_GRID }} tickLine={false} />
            <YAxis tick={{ fill: CHART_TEXT, fontSize: 11 }} axisLine={{ stroke: CHART_GRID }} tickLine={false} tickFormatter={(v) => `${v} Kc`} />
            <Tooltip
              contentStyle={darkTooltipStyle}
              formatter={(v, name) => [formatKc(v), name === 'ma7' ? (cs ? 'Klouzavy prumer (7d)' : 'Moving avg (7d)') : 'AOV']}
              labelFormatter={(l) => l}
            />
            <Line type="monotone" dataKey="aov" stroke={ORANGE} strokeWidth={1.5} dot={false} name="AOV" />
            {data[0]?.ma7 !== undefined && (
              <Line type="monotone" dataKey="ma7" stroke={TEAL} strokeWidth={2.5} dot={false} strokeDasharray="6 3" name={cs ? 'MA 7d' : 'MA 7d'} />
            )}
            <Legend
              wrapperStyle={{ fontSize: 12, color: CHART_TEXT, fontFamily: "'Space Mono', monospace" }}
              iconType="line"
              iconSize={12}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

function PrintTimeChart({ data, isDemo, cs }) {
  const ref = useRef(null);

  return (
    <ChartCard
      title={cs ? 'Rozlozeni casu tisku' : 'Print Time Distribution'}
      isDemo={isDemo}
      exportLabel="print-time"
      chartRef={ref}
    >
      {data.length === 0 ? (
        <EmptyChart message={cs ? 'Zadna data' : 'No data'} />
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="ptGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={SKY} stopOpacity={0.9} />
                <stop offset="100%" stopColor={SKY} stopOpacity={0.4} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" />
            <XAxis
              dataKey="range"
              tick={{ fill: CHART_TEXT, fontSize: 11 }}
              axisLine={{ stroke: CHART_GRID }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: CHART_TEXT, fontSize: 11 }}
              axisLine={{ stroke: CHART_GRID }}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={darkTooltipStyle}
              formatter={(v) => [v, cs ? 'Objednavek' : 'Orders']}
            />
            <Bar
              dataKey="count"
              name={cs ? 'Objednavek' : 'Orders'}
              fill="url(#ptGradient)"
              radius={[4, 4, 0, 0]}
              barSize={36}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

function ConversionFunnelChart({ data, isDemo, cs }) {
  const ref = useRef(null);

  const dataWithPct = useMemo(() => {
    if (!data || data.length === 0) return [];
    const first = data[0].value || 1;
    return data.map((d, i) => ({
      ...d,
      pct: Math.round((d.value / first) * 100),
      dropPct: i > 0 ? Math.round(((data[i - 1].value - d.value) / data[i - 1].value) * 100) : null,
    }));
  }, [data]);

  const barColors = [TEAL, SKY, PURPLE, ORANGE];

  return (
    <ChartCard
      title={cs ? 'Konverzni trychtyr' : 'Conversion Funnel'}
      isDemo={isDemo}
      exportLabel="conversion-funnel"
      chartRef={ref}
    >
      {dataWithPct.length === 0 ? (
        <EmptyChart message={cs ? 'Zadna data' : 'No data'} />
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={dataWithPct} layout="vertical" margin={{ top: 10, right: 40, left: 10, bottom: 0 }}>
            <CartesianGrid stroke={CHART_GRID} strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={{ fill: CHART_TEXT, fontSize: 11 }} axisLine={{ stroke: CHART_GRID }} tickLine={false} />
            <YAxis
              type="category"
              dataKey="step"
              width={120}
              tick={{ fill: CHART_TEXT, fontSize: 12 }}
              axisLine={{ stroke: CHART_GRID }}
              tickLine={false}
            />
            <Tooltip
              contentStyle={darkTooltipStyle}
              formatter={(v, name, props) => {
                const pct = props.payload.pct;
                return [`${v} (${pct}%)`, props.payload.step];
              }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={28}
              label={({ x, y, width: w, height: h, value, pct }) => (
                <text x={x + w + 6} y={y + h / 2 + 4} fill={CHART_TEXT} fontSize={11} fontFamily="'Space Mono', monospace">
                  {pct}%
                </text>
              )}
            >
              {dataWithPct.map((_, idx) => (
                <Cell key={idx} fill={barColors[idx % barColors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

/* ── Main exported component ─────────────────────────────────────────── */

export default function AnalyticsCharts({ sessions, cs, orderMetrics, hasOrders }) {
  const [granularity, setGranularity] = React.useState('day');

  // Use order-based data if available, otherwise analytics sessions, otherwise demo
  const revenueData = useMemo(() => {
    if (hasOrders && orderMetrics?.revenueOverTime?.length > 0) {
      return orderMetrics.revenueOverTime;
    }
    const sessionBased = processRevenueTrend(sessions, granularity);
    return sessionBased || generateDemoRevenueTrend(30);
  }, [hasOrders, orderMetrics, sessions, granularity]);

  const revenueIsDemo = !hasOrders && !processRevenueTrend(sessions, granularity);

  const statusData = useMemo(() => {
    if (hasOrders && orderMetrics?.ordersByStatus?.length > 0) {
      return orderMetrics.ordersByStatus;
    }
    return generateDemoStatusPie();
  }, [hasOrders, orderMetrics]);
  const statusIsDemo = !hasOrders;

  const materialsData = useMemo(() => {
    if (hasOrders && orderMetrics?.topMaterials?.length > 0) {
      return orderMetrics.topMaterials;
    }
    return generateDemoMaterialBar();
  }, [hasOrders, orderMetrics]);
  const materialsIsDemo = !hasOrders;

  const aovData = useMemo(() => {
    if (hasOrders && orderMetrics?.aovOverTime?.length > 0) {
      return orderMetrics.aovOverTime;
    }
    return generateDemoAOV(30);
  }, [hasOrders, orderMetrics]);
  const aovIsDemo = !hasOrders;

  const printTimeData = useMemo(() => {
    if (hasOrders && orderMetrics?.printTimeDistribution?.length > 0) {
      return orderMetrics.printTimeDistribution;
    }
    return generateDemoPrintTime();
  }, [hasOrders, orderMetrics]);
  const printTimeIsDemo = !hasOrders;

  const funnelData = useMemo(() => processFunnel(sessions, cs), [sessions, cs]);
  const funnelIsDemo = !funnelData;
  const funnelChartData = funnelData || generateDemoFunnel(cs);

  return (
    <div className="ac-container">
      {/* Row 1: Revenue + Orders by Status */}
      <div className="ac-grid-2">
        <RevenueTrendChart
          data={revenueData}
          granularity={granularity}
          setGranularity={setGranularity}
          isDemo={revenueIsDemo}
          cs={cs}
        />
        <OrdersByStatusChart
          data={statusData}
          isDemo={statusIsDemo}
          cs={cs}
        />
      </div>

      {/* Row 2: Top Materials + AOV */}
      <div className="ac-grid-2">
        <TopMaterialsBarChart
          data={materialsData}
          isDemo={materialsIsDemo}
          cs={cs}
        />
        <AOVChart data={aovData} isDemo={aovIsDemo} cs={cs} />
      </div>

      {/* Row 3: Print Time + Funnel */}
      <div className="ac-grid-2">
        <PrintTimeChart
          data={printTimeData}
          isDemo={printTimeIsDemo}
          cs={cs}
        />
        <ConversionFunnelChart data={funnelChartData} isDemo={funnelIsDemo} cs={cs} />
      </div>

      <style>{`
        .ac-container { }
        .ac-grid-2 {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 14px;
        }
        @media (max-width: 900px) {
          .ac-grid-2 { grid-template-columns: 1fr; }
        }
        .ac-card {
          border: 1px solid var(--forge-border-default, #1E2230);
          background: var(--forge-bg-surface, #0E1015);
          border-radius: var(--forge-radius-xl, 12px);
          padding: 18px;
        }
        .ac-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .ac-card-title {
          font-size: 12px;
          color: var(--forge-text-secondary, #9BA3B0);
          font-weight: 600;
          font-family: var(--forge-font-tech, 'Space Mono', monospace);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .ac-demo-badge {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.12em;
          background: rgba(255,181,71,0.12);
          color: var(--forge-warning, #FFB547);
          border: 1px solid rgba(255,181,71,0.25);
        }
        .ac-export-btn {
          background: transparent;
          border: 1px solid var(--forge-border-default, #1E2230);
          border-radius: var(--forge-radius-md, 6px);
          color: var(--forge-text-muted, #7A8291);
          cursor: pointer;
          padding: 5px 7px;
          display: flex;
          align-items: center;
          transition: all 0.15s ease;
        }
        .ac-export-btn:hover {
          border-color: var(--forge-accent-primary, #00D4AA);
          color: var(--forge-accent-primary, #00D4AA);
        }
        .ac-granularity {
          display: flex;
          gap: 4px;
          margin-bottom: 10px;
        }
        .ac-gran-btn {
          padding: 4px 10px;
          border-radius: 999px;
          border: 1px solid var(--forge-border-default, #1E2230);
          background: transparent;
          color: var(--forge-text-muted, #7A8291);
          cursor: pointer;
          font-size: 11px;
          font-family: var(--forge-font-tech, 'Space Mono', monospace);
          letter-spacing: 0.04em;
          transition: all 0.15s ease;
        }
        .ac-gran-btn.active {
          background: var(--forge-accent-primary, #00D4AA);
          border-color: var(--forge-accent-primary, #00D4AA);
          color: var(--forge-bg-void, #08090C);
          font-weight: 600;
        }
        .ac-gran-btn:hover:not(.active) {
          border-color: var(--forge-border-active, #2A3040);
        }

        /* ── Empty state ──────────────────────────────────────────────── */
        .ac-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 200px;
          color: var(--forge-text-muted, #7A8291);
          font-size: 13px;
          font-style: italic;
        }

        /* ── Legend rows (status chart) ───────────────────────────────── */
        .ac-legend-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
        }
        .ac-legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .ac-legend-name {
          flex: 1;
          color: var(--forge-text-secondary, #9CA3AF);
        }
        .ac-legend-value {
          font-family: var(--forge-font-tech);
          color: var(--forge-text-primary);
          font-weight: 600;
          font-size: 11px;
        }
        .ac-legend-pct {
          color: var(--forge-text-muted);
          font-weight: 400;
          margin-left: 3px;
        }

        /* ── Bar chart rows (materials) ──────────────────────────────── */
        .ac-bar-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .ac-bar-label {
          width: 60px;
          font-size: 12px;
          color: var(--forge-text-secondary, #9CA3AF);
          text-align: right;
          flex-shrink: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .ac-bar-track {
          flex: 1;
          height: 22px;
          background: var(--forge-bg-elevated, #1A1D24);
          border-radius: 4px;
          overflow: hidden;
        }
        .ac-bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.6s ease-out;
          opacity: 0.85;
        }
        .ac-bar-count {
          width: 30px;
          font-size: 12px;
          font-family: var(--forge-font-tech);
          color: var(--forge-text-primary);
          font-weight: 600;
          text-align: right;
          flex-shrink: 0;
        }

        /* recharts overrides for dark theme */
        .ac-card .recharts-cartesian-grid-horizontal line,
        .ac-card .recharts-cartesian-grid-vertical line {
          stroke: var(--forge-border-default, #1E2230);
        }
        .ac-card .recharts-legend-item-text {
          color: var(--forge-text-secondary, #9BA3B0) !important;
        }
      `}</style>
    </div>
  );
}
