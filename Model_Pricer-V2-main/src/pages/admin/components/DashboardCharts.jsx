import React, { useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { loadOrders, computeOrderTotals, extractOrderMaterials } from '../../../utils/adminOrdersStorage';

/* ── Forge-compatible colors ──────────────────────────────────────────── */
const TEAL = '#00D4AA';
const TEAL_DARK = '#007A63';
const ORANGE = '#FF6B35';
const SKY = '#4DA8DA';
const PURPLE = '#9B59B6';
const RED = '#EF4444';
const MUTED = '#7A8291';

const STATUS_COLORS = {
  NEW: TEAL,
  REVIEW: SKY,
  APPROVED: '#22C55E',
  PRINTING: ORANGE,
  POSTPROCESS: PURPLE,
  READY: '#FACC15',
  SHIPPED: '#06B6D4',
  DONE: '#10B981',
  CANCELED: RED,
};

const STATUS_LABELS_CS = {
  NEW: 'Nova',
  REVIEW: 'Kontrola',
  APPROVED: 'Schvaleno',
  PRINTING: 'Tiskne se',
  POSTPROCESS: 'Postprocess',
  READY: 'Pripraveno',
  SHIPPED: 'Odeslano',
  DONE: 'Hotovo',
  CANCELED: 'Zruseno',
};

const STATUS_LABELS_EN = {
  NEW: 'New',
  REVIEW: 'Review',
  APPROVED: 'Approved',
  PRINTING: 'Printing',
  POSTPROCESS: 'Postprocess',
  READY: 'Ready',
  SHIPPED: 'Shipped',
  DONE: 'Done',
  CANCELED: 'Canceled',
};

/* ── Demo data generator — DEMO: mock data only, all Math.random() calls below are for chart demo ── */
function generateDemoOrdersOverTime() {
  const data = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const label = `${d.getDate()}.${d.getMonth() + 1}.`;
    data.push({
      date: label,
      count: Math.floor(Math.random() * 8) + 1,
    });
  }
  return data;
}

function generateDemoRevenue() {
  const data = [];
  const now = new Date();
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    data.push({
      week: `${weekStart.getDate()}.${weekStart.getMonth() + 1}.`,
      revenue: Math.floor(Math.random() * 15000) + 2000,
    });
  }
  return data;
}

function generateDemoStatusDistribution() {
  return [
    { name: 'Nova', value: 5, status: 'NEW' },
    { name: 'Tiskne se', value: 8, status: 'PRINTING' },
    { name: 'Hotovo', value: 12, status: 'DONE' },
    { name: 'Zruseno', value: 2, status: 'CANCELED' },
    { name: 'Kontrola', value: 3, status: 'REVIEW' },
  ];
}

function generateDemoMaterials() {
  return [
    { name: 'PLA', count: 18 },
    { name: 'PETG', count: 12 },
    { name: 'ABS', count: 7 },
    { name: 'TPU', count: 4 },
    { name: 'ASA', count: 3 },
  ];
}

/* ── Data processing from real orders ─────────────────────────────────── */
function processOrdersOverTime(orders) {
  const now = new Date();
  const buckets = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = `${d.getDate()}.${d.getMonth() + 1}.`;
    buckets[key] = { date: label, count: 0 };
  }

  for (const order of orders) {
    const created = order.created_at || order.createdAt;
    if (!created) continue;
    const dayKey = new Date(created).toISOString().slice(0, 10);
    if (buckets[dayKey]) {
      buckets[dayKey].count += 1;
    }
  }

  return Object.values(buckets);
}

function processRevenue(orders) {
  const now = new Date();
  const weeks = [];

  for (let i = 7; i >= 0; i--) {
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - i * 7);
    weekEnd.setHours(23, 59, 59, 999);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    let revenue = 0;
    for (const order of orders) {
      const created = order.created_at || order.createdAt;
      if (!created) continue;
      const orderDate = new Date(created);
      if (orderDate >= weekStart && orderDate <= weekEnd) {
        const totals = computeOrderTotals(order);
        revenue += totals.total || 0;
      }
    }

    weeks.push({
      week: `${weekStart.getDate()}.${weekStart.getMonth() + 1}.`,
      revenue: Math.round(revenue),
    });
  }

  return weeks;
}

function processStatusDistribution(orders, language) {
  const statusMap = {};
  const labels = language === 'cs' ? STATUS_LABELS_CS : STATUS_LABELS_EN;

  for (const order of orders) {
    const status = order.status || 'NEW';
    if (!statusMap[status]) {
      statusMap[status] = { name: labels[status] || status, value: 0, status };
    }
    statusMap[status].value += 1;
  }

  return Object.values(statusMap).filter(s => s.value > 0);
}

function processTopMaterials(orders) {
  const materialCounts = {};

  for (const order of orders) {
    const materials = extractOrderMaterials(order);
    for (const mat of materials) {
      materialCounts[mat] = (materialCounts[mat] || 0) + 1;
    }
  }

  return Object.entries(materialCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

/* ── Shared styles ────────────────────────────────────────────────────── */
const cardStyle = {
  background: 'var(--forge-bg-surface, #111827)',
  border: '1px solid var(--forge-border-default, #1E293B)',
  borderRadius: 'var(--forge-radius-md, 8px)',
  padding: '20px',
  minHeight: 280,
};

const titleStyle = {
  margin: '0 0 4px 0',
  fontSize: 15,
  fontWeight: 600,
  fontFamily: 'var(--forge-font-heading, Inter, sans-serif)',
  color: 'var(--forge-text-primary, #E8EAED)',
};

const subtitleStyle = {
  margin: '0 0 16px 0',
  fontSize: 11,
  fontFamily: 'var(--forge-font-tech, "JetBrains Mono", monospace)',
  color: 'var(--forge-text-muted, #7A8291)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};

const emptyStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 180,
  color: 'var(--forge-text-muted, #7A8291)',
  fontSize: 13,
  fontFamily: 'var(--forge-font-body, Inter, sans-serif)',
  fontStyle: 'italic',
};

const demoBadgeStyle = {
  display: 'inline-block',
  fontSize: 10,
  fontFamily: 'var(--forge-font-tech, "JetBrains Mono", monospace)',
  color: ORANGE,
  background: `${ORANGE}15`,
  padding: '2px 8px',
  borderRadius: 4,
  marginLeft: 8,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};

const tooltipStyle = {
  background: 'var(--forge-bg-elevated, #1A1D24)',
  border: '1px solid var(--forge-border-default, #2A2D35)',
  borderRadius: 'var(--forge-radius-md, 8px)',
  padding: '8px 12px',
  fontSize: 12,
  fontFamily: 'var(--forge-font-body, Inter, sans-serif)',
  color: 'var(--forge-text-primary, #E8EAED)',
  boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
};

/* ── Custom Tooltip ───────────────────────────────────────────────────── */
function ChartTooltipContent({ active, payload, label, suffix = '' }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={tooltipStyle}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {payload.map((entry, i) => (
        <div key={i} style={{ color: entry.color || TEAL, fontSize: 11 }}>
          {entry.name}: {entry.value}{suffix}
        </div>
      ))}
    </div>
  );
}

/* ── Chart: Orders Over Time ──────────────────────────────────────────── */
function OrdersOverTimeChart({ data, isDemo, language }) {
  if (!data?.length) {
    return <div style={emptyStyle}>{language === 'cs' ? 'Zadna data' : 'No data'}</div>;
  }

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <h4 style={titleStyle}>
          {language === 'cs' ? 'Objednavky v case' : 'Orders Over Time'}
        </h4>
        {isDemo && <span style={demoBadgeStyle}>demo</span>}
      </div>
      <p style={subtitleStyle}>
        {language === 'cs' ? 'Poslednich 30 dni' : 'Last 30 days'}
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--forge-border-default, #1E293B)" />
          <XAxis
            dataKey="date"
            tick={{ fill: MUTED, fontSize: 10, fontFamily: 'var(--forge-font-tech)' }}
            axisLine={{ stroke: 'var(--forge-border-default, #1E293B)' }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: MUTED, fontSize: 10, fontFamily: 'var(--forge-font-tech)' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<ChartTooltipContent suffix="" />} />
          <Line
            type="monotone"
            dataKey="count"
            name={language === 'cs' ? 'Objednavky' : 'Orders'}
            stroke={TEAL}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: TEAL, stroke: '#fff', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Chart: Revenue Summary ───────────────────────────────────────────── */
function RevenueSummaryChart({ data, isDemo, language }) {
  if (!data?.length) {
    return <div style={emptyStyle}>{language === 'cs' ? 'Zadna data' : 'No data'}</div>;
  }

  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);
  const fmtTotal = new Intl.NumberFormat(language === 'cs' ? 'cs-CZ' : 'en-US', {
    maximumFractionDigits: 0,
  }).format(totalRevenue);

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h4 style={titleStyle}>
            {language === 'cs' ? 'Trzby' : 'Revenue'}
          </h4>
          {isDemo && <span style={demoBadgeStyle}>demo</span>}
        </div>
        <div style={{
          fontSize: 18,
          fontWeight: 700,
          fontFamily: 'var(--forge-font-heading)',
          color: TEAL,
        }}>
          {fmtTotal} Kc
        </div>
      </div>
      <p style={subtitleStyle}>
        {language === 'cs' ? 'Poslednich 8 tydnu' : 'Last 8 weeks'}
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={TEAL} stopOpacity={0.9} />
              <stop offset="100%" stopColor={TEAL_DARK} stopOpacity={0.6} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--forge-border-default, #1E293B)" />
          <XAxis
            dataKey="week"
            tick={{ fill: MUTED, fontSize: 10, fontFamily: 'var(--forge-font-tech)' }}
            axisLine={{ stroke: 'var(--forge-border-default, #1E293B)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: MUTED, fontSize: 10, fontFamily: 'var(--forge-font-tech)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<ChartTooltipContent suffix=" Kc" />} />
          <Bar
            dataKey="revenue"
            name={language === 'cs' ? 'Trzby' : 'Revenue'}
            fill="url(#revenueGradient)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Chart: Status Distribution (Donut) ───────────────────────────────── */
function StatusDistributionChart({ data, isDemo, language }) {
  if (!data?.length) {
    return <div style={emptyStyle}>{language === 'cs' ? 'Zadna data' : 'No data'}</div>;
  }

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <h4 style={titleStyle}>
          {language === 'cs' ? 'Stavy objednavek' : 'Order Status'}
        </h4>
        {isDemo && <span style={demoBadgeStyle}>demo</span>}
      </div>
      <p style={subtitleStyle}>
        {language === 'cs' ? 'Rozlozeni podle stavu' : 'Distribution by status'}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: '50%', height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius="50%"
                outerRadius="85%"
                paddingAngle={2}
                dataKey="value"
                animationDuration={600}
                stroke="none"
              >
                {data.map((entry) => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || MUTED} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ width: '50%', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {data.map((entry) => (
            <div key={entry.status} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12,
              fontFamily: 'var(--forge-font-body)',
              color: 'var(--forge-text-secondary, #9CA3AF)',
            }}>
              <div style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: STATUS_COLORS[entry.status] || MUTED,
                flexShrink: 0,
              }} />
              <span style={{ flex: 1 }}>{entry.name}</span>
              <span style={{
                fontFamily: 'var(--forge-font-tech)',
                color: 'var(--forge-text-primary)',
                fontWeight: 600,
                fontSize: 11,
              }}>
                {entry.value}
                <span style={{ color: MUTED, fontWeight: 400, marginLeft: 2 }}>
                  ({total > 0 ? Math.round((entry.value / total) * 100) : 0}%)
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Chart: Top Materials ─────────────────────────────────────────────── */
function TopMaterialsChart({ data, isDemo, language }) {
  if (!data?.length) {
    return <div style={emptyStyle}>{language === 'cs' ? 'Zadna data' : 'No data'}</div>;
  }

  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <h4 style={titleStyle}>
          {language === 'cs' ? 'Top materialy' : 'Top Materials'}
        </h4>
        {isDemo && <span style={demoBadgeStyle}>demo</span>}
      </div>
      <p style={subtitleStyle}>
        {language === 'cs' ? 'Nejpouzivanejsi materialy' : 'Most used materials'}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
        {data.map((item, i) => {
          const barColors = [TEAL, SKY, ORANGE, PURPLE, '#22C55E', '#FACC15', '#EF4444', '#06B6D4'];
          const barColor = barColors[i % barColors.length];
          const widthPct = Math.max((item.count / maxCount) * 100, 4);

          return (
            <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 70,
                fontSize: 12,
                fontFamily: 'var(--forge-font-body)',
                color: 'var(--forge-text-secondary, #9CA3AF)',
                textAlign: 'right',
                flexShrink: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {item.name}
              </div>
              <div style={{
                flex: 1,
                height: 20,
                background: 'var(--forge-bg-elevated, #1A1D24)',
                borderRadius: 4,
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${widthPct}%`,
                  height: '100%',
                  background: barColor,
                  borderRadius: 4,
                  transition: 'width 0.6s ease-out',
                  opacity: 0.85,
                }} />
              </div>
              <div style={{
                width: 32,
                fontSize: 12,
                fontFamily: 'var(--forge-font-tech)',
                color: 'var(--forge-text-primary)',
                fontWeight: 600,
                textAlign: 'right',
                flexShrink: 0,
              }}>
                {item.count}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main DashboardCharts component ───────────────────────────────────── */
export default function DashboardCharts({ language = 'cs' }) {
  const { ordersOverTime, revenueData, statusData, materialsData, isDemo } = useMemo(() => {
    const orders = loadOrders();
    const hasRealData = orders.length > 0;

    if (!hasRealData) {
      return {
        ordersOverTime: generateDemoOrdersOverTime(),
        revenueData: generateDemoRevenue(),
        statusData: generateDemoStatusDistribution(),
        materialsData: generateDemoMaterials(),
        isDemo: true,
      };
    }

    return {
      ordersOverTime: processOrdersOverTime(orders),
      revenueData: processRevenue(orders),
      statusData: processStatusDistribution(orders, language),
      materialsData: processTopMaterials(orders),
      isDemo: false,
    };
  }, [language]);

  return (
    <div className="dashboard-charts-section">
      <h3 style={{
        fontFamily: 'var(--forge-font-heading)',
        color: 'var(--forge-text-primary)',
        fontSize: 18,
        fontWeight: 600,
        margin: '0 0 16px 0',
      }}>
        {language === 'cs' ? 'Analyticke prehled' : 'Analytics Overview'}
      </h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: 16,
      }}>
        <OrdersOverTimeChart data={ordersOverTime} isDemo={isDemo} language={language} />
        <RevenueSummaryChart data={revenueData} isDemo={isDemo} language={language} />
        <StatusDistributionChart data={statusData} isDemo={isDemo} language={language} />
        <TopMaterialsChart data={materialsData} isDemo={isDemo} language={language} />
      </div>

      <style>{`
        .dashboard-charts-section {
          margin-top: 24px;
          margin-bottom: 8px;
        }

        @media (max-width: 860px) {
          .dashboard-charts-section > div {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
