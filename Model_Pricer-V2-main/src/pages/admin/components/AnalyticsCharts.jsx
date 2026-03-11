import React, { useMemo, useRef, useCallback } from 'react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

/* ── Forge-compatible colors ──────────────────────────────────────────── */
const TEAL = '#00D4AA';
const TEAL_DARK = '#007A63';
const ORANGE = '#FF6B35';
const SKY = '#4DA8DA';
const PURPLE = '#6C63FF';
const YELLOW = '#FFB547';
const RED = '#FF4757';
const MUTED = '#7A8291';

const MATERIAL_COLORS = [TEAL, ORANGE, SKY, PURPLE, YELLOW, RED, '#10B981', '#F472B6'];

const CHART_BG = '#0E1015';
const CHART_GRID = '#1E2230';
const CHART_TEXT = '#7A8291';

/* ── Dark theme tooltip ──────────────────────────────────────────────── */
const darkTooltipStyle = {
  backgroundColor: '#161920',
  border: '1px solid #1E2230',
  borderRadius: 8,
  color: '#E8ECF1',
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
    ctx.fillStyle = CHART_BG;
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

/* ── Demo data generators ────────────────────────────────────────────── */
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
  // compute 7-day moving average
  for (let i = 0; i < data.length; i++) {
    const window = data.slice(Math.max(0, i - 6), i + 1);
    data[i].ma7 = Math.round(window.reduce((s, d) => s + d.aov, 0) / window.length);
  }
  return data;
}

function generateDemoPeakHours() {
  const days = ['Po', 'Ut', 'St', 'Ct', 'Pa', 'So', 'Ne'];
  const grid = [];
  for (let d = 0; d < 7; d++) {
    for (let h = 6; h < 24; h++) {
      let base = 0;
      if (d < 5) {
        // weekday
        if (h >= 9 && h <= 17) base = 3 + Math.floor(Math.random() * 6);
        else if (h >= 18 && h <= 22) base = 1 + Math.floor(Math.random() * 4);
        else base = Math.floor(Math.random() * 2);
      } else {
        // weekend
        if (h >= 10 && h <= 20) base = 1 + Math.floor(Math.random() * 3);
        else base = Math.floor(Math.random() * 1);
      }
      grid.push({ day: d, dayLabel: days[d], hour: h, count: base });
    }
  }
  return grid;
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
      // ISO week start (Monday)
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

function processMaterialPie(sessions) {
  const calc = sessions.filter((s) => s.has_price_shown);
  if (calc.length === 0) return null;

  const map = new Map();
  for (const s of calc) {
    const mat = s.summary?.material || 'Unknown';
    map.set(mat, (map.get(mat) || 0) + 1);
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }));
}

function processAOV(sessions) {
  const ordered = sessions.filter((s) => s.converted);
  if (ordered.length === 0) return null;

  const buckets = new Map();
  for (const s of ordered) {
    const day = new Date(s.last_event_at).toISOString().slice(0, 10);
    const arr = buckets.get(day) || [];
    arr.push(s.summary?.price_total || 0);
    buckets.set(day, arr);
  }

  const data = [...buckets.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, prices]) => ({
      date,
      label: shortDate(date + 'T00:00:00Z'),
      aov: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
    }));

  // 7-day moving average
  for (let i = 0; i < data.length; i++) {
    const w = data.slice(Math.max(0, i - 6), i + 1);
    data[i].ma7 = Math.round(w.reduce((s, d) => s + d.aov, 0) / w.length);
  }
  return data;
}

function processPeakHours(sessions) {
  const days = ['Po', 'Ut', 'St', 'Ct', 'Pa', 'So', 'Ne'];
  const grid = new Map();
  // init
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      grid.set(`${d}-${h}`, 0);
    }
  }

  const all = sessions.filter((s) => s.has_price_shown);
  if (all.length === 0) return null;

  for (const s of all) {
    const dt = new Date(s.last_event_at);
    const dayIdx = (dt.getDay() + 6) % 7; // Mon=0
    const hour = dt.getHours();
    const key = `${dayIdx}-${hour}`;
    grid.set(key, (grid.get(key) || 0) + 1);
  }

  const result = [];
  for (let d = 0; d < 7; d++) {
    for (let h = 6; h < 24; h++) {
      result.push({
        day: d,
        dayLabel: days[d],
        hour: h,
        count: grid.get(`${d}-${h}`) || 0,
      });
    }
  }
  return result;
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

function processCustomerStats(sessions, cs) {
  const ordered = sessions.filter((s) => s.converted);
  if (ordered.length === 0) return null;

  // group by widget_instance_id as proxy for "customer"
  const customers = new Map();
  for (const s of ordered) {
    const cid = s.widget_instance_id || s.session_id;
    const arr = customers.get(cid) || [];
    arr.push(s);
    customers.set(cid, arr);
  }

  const totalCustomers = customers.size;
  const repeatCustomers = [...customers.values()].filter((arr) => arr.length > 1).length;
  const repeatRate = totalCustomers > 0 ? repeatCustomers / totalCustomers : 0;

  const totalItems = ordered.reduce((sum, s) => {
    return sum + 1; // each session = 1 order item in analytics
  }, 0);
  const avgItems = totalCustomers > 0 ? totalItems / totalCustomers : 0;

  return { totalCustomers, repeatRate, avgItems };
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
      title={cs ? 'Trend trzeb' : 'Revenue Trend'}
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
    </ChartCard>
  );
}

function MaterialPieChart({ data, isDemo, cs }) {
  const ref = useRef(null);
  const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data]);

  return (
    <ChartCard
      title={cs ? 'Popularita materialu' : 'Material Popularity'}
      isDemo={isDemo}
      exportLabel="material-popularity"
      chartRef={ref}
    >
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
            nameKey="name"
            label={({ name, value }) => `${name} (${Math.round((value / total) * 100)}%)`}
            labelLine={{ stroke: CHART_TEXT, strokeWidth: 1 }}
          >
            {data.map((_, idx) => (
              <Cell key={idx} fill={MATERIAL_COLORS[idx % MATERIAL_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={darkTooltipStyle}
            formatter={(v, name) => [`${v}x (${Math.round((v / total) * 100)}%)`, name]}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, color: CHART_TEXT, fontFamily: "'Space Mono', monospace" }}
            iconType="circle"
            iconSize={8}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function AOVChart({ data, isDemo, cs }) {
  const ref = useRef(null);

  return (
    <ChartCard
      title={cs ? 'Prumerna hodnota objednavky' : 'Average Order Value'}
      isDemo={isDemo}
      exportLabel="aov-trend"
      chartRef={ref}
    >
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
          <Line type="monotone" dataKey="ma7" stroke={TEAL} strokeWidth={2.5} dot={false} strokeDasharray="6 3" name={cs ? 'MA 7d' : 'MA 7d'} />
          <Legend
            wrapperStyle={{ fontSize: 12, color: CHART_TEXT, fontFamily: "'Space Mono', monospace" }}
            iconType="line"
            iconSize={12}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function PeakHoursChart({ data, isDemo, cs }) {
  const ref = useRef(null);
  const maxCount = useMemo(() => Math.max(1, ...data.map((d) => d.count)), [data]);

  const getColor = useCallback((count) => {
    if (count === 0) return '#161920';
    const intensity = count / maxCount;
    if (intensity < 0.25) return 'rgba(0,212,170,0.12)';
    if (intensity < 0.5) return 'rgba(0,212,170,0.28)';
    if (intensity < 0.75) return 'rgba(0,212,170,0.50)';
    return 'rgba(0,212,170,0.80)';
  }, [maxCount]);

  const hours = [];
  for (let h = 6; h < 24; h++) hours.push(h);
  const days = ['Po', 'Ut', 'St', 'Ct', 'Pa', 'So', 'Ne'];

  const gridMap = useMemo(() => {
    const m = {};
    for (const d of data) {
      m[`${d.day}-${d.hour}`] = d.count;
    }
    return m;
  }, [data]);

  return (
    <ChartCard
      title={cs ? 'Spickove hodiny' : 'Peak Hours'}
      isDemo={isDemo}
      exportLabel="peak-hours"
      chartRef={ref}
    >
      <div className="ac-heatmap" role="img" aria-label={cs ? 'Heatmapa objednavek podle dne a hodiny' : 'Order heatmap by day and hour'}>
        <div className="ac-heatmap-grid">
          {/* header row */}
          <div className="ac-hm-corner" />
          {hours.map((h) => (
            <div key={h} className="ac-hm-hlabel">{h}:00</div>
          ))}
          {/* data rows */}
          {days.map((dayLabel, dayIdx) => (
            <React.Fragment key={dayIdx}>
              <div className="ac-hm-dlabel">{dayLabel}</div>
              {hours.map((h) => {
                const count = gridMap[`${dayIdx}-${h}`] || 0;
                return (
                  <div
                    key={`${dayIdx}-${h}`}
                    className="ac-hm-cell"
                    style={{ backgroundColor: getColor(count) }}
                    title={`${dayLabel} ${h}:00 — ${count} ${cs ? 'kalkulaci' : 'calculations'}`}
                  />
                );
              })}
            </React.Fragment>
          ))}
        </div>
        <div className="ac-hm-legend">
          <span className="ac-hm-legend-label">{cs ? 'Mene' : 'Less'}</span>
          {[0, 0.12, 0.28, 0.5, 0.8].map((op, i) => (
            <div
              key={i}
              className="ac-hm-cell"
              style={{
                backgroundColor: op === 0 ? '#161920' : `rgba(0,212,170,${op})`,
                width: 14,
                height: 14,
              }}
            />
          ))}
          <span className="ac-hm-legend-label">{cs ? 'Vice' : 'More'}</span>
        </div>
      </div>
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
    </ChartCard>
  );
}

function CustomerStatsCards({ stats, isDemo, cs }) {
  if (!stats) return null;

  return (
    <div className="ac-stats-row">
      <div className="ac-stat-card">
        {isDemo && <span className="ac-demo-badge ac-demo-badge-sm">DEMO</span>}
        <div className="ac-stat-label">{cs ? 'Unikatni zakaznici' : 'Unique customers'}</div>
        <div className="ac-stat-value">{formatNum(stats.totalCustomers)}</div>
      </div>
      <div className="ac-stat-card">
        <div className="ac-stat-label">{cs ? 'Opakujici se zakaznici' : 'Repeat customer rate'}</div>
        <div className="ac-stat-value">{formatNum(stats.repeatRate * 100, 1)}%</div>
      </div>
      <div className="ac-stat-card">
        <div className="ac-stat-label">{cs ? 'Prumerne polozek / obj.' : 'Avg items / order'}</div>
        <div className="ac-stat-value">{formatNum(stats.avgItems, 1)}</div>
      </div>
    </div>
  );
}

/* ── Main exported component ─────────────────────────────────────────── */

export default function AnalyticsCharts({ sessions, cs }) {
  const [granularity, setGranularity] = React.useState('day');

  // Process real data, fallback to demo
  const revenueTrendData = useMemo(() => processRevenueTrend(sessions, granularity), [sessions, granularity]);
  const materialPieData = useMemo(() => processMaterialPie(sessions), [sessions]);
  const aovData = useMemo(() => processAOV(sessions), [sessions]);
  const peakHoursData = useMemo(() => processPeakHours(sessions), [sessions]);
  const funnelData = useMemo(() => processFunnel(sessions, cs), [sessions, cs]);
  const customerStats = useMemo(() => processCustomerStats(sessions, cs), [sessions, cs]);

  // Determine demo mode per chart
  const revenueIsDemo = !revenueTrendData;
  const materialIsDemo = !materialPieData;
  const aovIsDemo = !aovData;
  const peakIsDemo = !peakHoursData;
  const funnelIsDemo = !funnelData;
  const statsIsDemo = !customerStats;

  // Use demo fallback when no real data
  const revenueData = revenueTrendData || generateDemoRevenueTrend(30);
  const materialData = materialPieData || generateDemoMaterialPie();
  const aovChartData = aovData || generateDemoAOV(30);
  const peakData = peakHoursData || generateDemoPeakHours();
  const funnelChartData = funnelData || generateDemoFunnel(cs);
  const statsData = customerStats || { totalCustomers: 47, repeatRate: 0.23, avgItems: 1.8 };

  return (
    <div className="ac-container">
      <div className="ac-section-title">
        {cs ? 'Pokrocile grafy' : 'Advanced Charts'}
      </div>

      {/* Row 1: Revenue + Material Pie */}
      <div className="ac-grid-2">
        <RevenueTrendChart
          data={revenueData}
          granularity={granularity}
          setGranularity={setGranularity}
          isDemo={revenueIsDemo}
          cs={cs}
        />
        <MaterialPieChart
          data={materialData}
          isDemo={materialIsDemo}
          cs={cs}
        />
      </div>

      {/* Row 2: AOV + Peak Hours */}
      <div className="ac-grid-2">
        <AOVChart data={aovChartData} isDemo={aovIsDemo} cs={cs} />
        <PeakHoursChart data={peakData} isDemo={peakIsDemo} cs={cs} />
      </div>

      {/* Row 3: Funnel + Customer Stats */}
      <div className="ac-grid-2">
        <ConversionFunnelChart data={funnelChartData} isDemo={funnelIsDemo} cs={cs} />
        <ChartCard
          title={cs ? 'Statistiky zakazniku' : 'Customer Stats'}
          isDemo={statsIsDemo}
          exportLabel={null}
          chartRef={useRef(null)}
        >
          <CustomerStatsCards stats={statsData} isDemo={statsIsDemo} cs={cs} />
        </ChartCard>
      </div>

      <style>{`
        .ac-container { margin-top: 18px; }
        .ac-section-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--forge-text-primary, #E8ECF1);
          font-family: var(--forge-font-heading, 'Space Grotesk', system-ui, sans-serif);
          margin-bottom: 14px;
          letter-spacing: 0.02em;
        }
        .ac-grid-2 {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 12px;
        }
        @media (max-width: 900px) {
          .ac-grid-2 { grid-template-columns: 1fr; }
        }
        .ac-card {
          border: 1px solid var(--forge-border-default, #1E2230);
          background: var(--forge-bg-surface, #0E1015);
          border-radius: var(--forge-radius-xl, 12px);
          padding: 14px;
          box-shadow: var(--forge-shadow-sm);
        }
        .ac-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        .ac-card-title {
          font-size: 11px;
          color: var(--forge-text-secondary, #9BA3B0);
          font-weight: 600;
          font-family: var(--forge-font-tech, 'Space Mono', monospace);
          text-transform: uppercase;
          letter-spacing: 0.08em;
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
        .ac-demo-badge-sm {
          position: absolute;
          top: 8px;
          right: 8px;
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

        /* Heatmap */
        .ac-heatmap { padding: 4px 0; }
        .ac-heatmap-grid {
          display: grid;
          grid-template-columns: 32px repeat(18, 1fr);
          gap: 2px;
          max-width: 100%;
          overflow-x: auto;
        }
        .ac-hm-corner { }
        .ac-hm-hlabel {
          font-size: 9px;
          color: var(--forge-text-muted, #7A8291);
          text-align: center;
          font-family: var(--forge-font-tech, 'Space Mono', monospace);
          white-space: nowrap;
          overflow: hidden;
        }
        .ac-hm-dlabel {
          font-size: 10px;
          color: var(--forge-text-muted, #7A8291);
          font-family: var(--forge-font-tech, 'Space Mono', monospace);
          display: flex;
          align-items: center;
          padding-right: 4px;
        }
        .ac-hm-cell {
          aspect-ratio: 1;
          border-radius: 2px;
          min-width: 12px;
          min-height: 12px;
          transition: background-color 0.15s ease;
        }
        .ac-hm-legend {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-top: 8px;
          justify-content: flex-end;
        }
        .ac-hm-legend-label {
          font-size: 10px;
          color: var(--forge-text-muted, #7A8291);
          font-family: var(--forge-font-tech, 'Space Mono', monospace);
        }

        /* Customer stats */
        .ac-stats-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          padding: 6px 0;
        }
        @media (max-width: 600px) {
          .ac-stats-row { grid-template-columns: 1fr; }
        }
        .ac-stat-card {
          position: relative;
          border: 1px solid var(--forge-border-default, #1E2230);
          background: var(--forge-bg-elevated, #161920);
          border-radius: var(--forge-radius-lg, 8px);
          padding: 14px;
          text-align: center;
        }
        .ac-stat-label {
          font-size: 10px;
          color: var(--forge-text-muted, #7A8291);
          font-family: var(--forge-font-tech, 'Space Mono', monospace);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 6px;
        }
        .ac-stat-value {
          font-size: 24px;
          font-weight: 700;
          color: var(--forge-text-primary, #E8ECF1);
          font-family: var(--forge-font-mono, 'JetBrains Mono', monospace);
        }

        /* recharts overrides for dark theme */
        .ac-card .recharts-cartesian-grid-horizontal line,
        .ac-card .recharts-cartesian-grid-vertical line {
          stroke: var(--forge-border-default, #1E2230);
        }
        .ac-card .recharts-legend-item-text {
          color: var(--forge-text-secondary, #9BA3B0) !important;
        }
        .ac-card .recharts-default-tooltip {
          background: var(--forge-bg-elevated, #161920) !important;
          border: 1px solid var(--forge-border-default, #1E2230) !important;
        }
      `}</style>
    </div>
  );
}
