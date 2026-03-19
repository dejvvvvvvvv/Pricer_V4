import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import ForgeCheckbox from '../../components/ui/forge/ForgeCheckbox';
import ForgeDialog from '../../components/ui/forge/ForgeDialog';
import AnalyticsCharts from './components/AnalyticsCharts';
import AnalyticsDashboardGrid from './components/AnalyticsDashboardGrid';
import {
  clearAnalyticsAll,
  computeOverview,
  filterSessionsByRange,
  findLostSessions,
  generateCsv,
  getAnalyticsSessions,
  logExportToAudit,
} from '../../utils/adminAnalyticsStorage';
import { readTenantJson, writeTenantJson } from '../../utils/adminTenantStorage';
import { loadOrders, computeOrderTotals, extractOrderMaterials } from '../../utils/adminOrdersStorage';
import { exportJSON, downloadFile } from '../../utils/exportData';
import { formatDateTime } from '../../utils/formatters';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  generateRevenueReport,
  generateMaterialReport,
  generateCustomerReport,
  generateOrderStatusReport,
  reportToCSV,
  reportToHTML,
  REPORT_TYPES,
  loadScheduledReports,
  toggleScheduledReport,
  checkScheduledReports,
  saveReportToHistory,
  loadReportHistory,
} from '../../utils/reportGenerator';

/* ── Helpers ──────────────────────────────────────────────────────────── */

function isoDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function isoNowEnd() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

function isoStartOfYear() {
  const d = new Date();
  d.setMonth(0, 1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function isoStartOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}


function formatNumber(n, digits = 0) {
  if (n === null || n === undefined || Number.isNaN(n)) return '-';
  return Number(n).toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatKc(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return '-';
  return `${formatNumber(n, 0)} Kc`;
}

function downloadTextFile({ filename, content, mime = 'text/plain;charset=utf-8' }) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ── Period helpers ───────────────────────────────────────────────────── */

function getDateRangeForPeriod(period) {
  switch (period) {
    case 'today': return { from: isoStartOfToday(), to: isoNowEnd() };
    case '7': return { from: isoDaysAgo(7), to: isoNowEnd() };
    case '30': return { from: isoDaysAgo(30), to: isoNowEnd() };
    case 'year': return { from: isoStartOfYear(), to: isoNowEnd() };
    case 'all': return { from: '2020-01-01T00:00:00.000Z', to: isoNowEnd() };
    default: return { from: isoDaysAgo(30), to: isoNowEnd() };
  }
}

/* ── Shared sub-components ────────────────────────────────────────────── */

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      className={`aa-tab ${active ? 'active' : ''}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function PeriodButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      className={`aa-period-btn ${active ? 'active' : ''}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function MiniSeriesTable({ title, series, headerDate, headerCount, noDataText }) {
  const safeSeries = Array.isArray(series) ? series : [];
  return (
    <div className="aa-card">
      <div className="aa-card-title">{title}</div>
      <div className="aa-table-wrap">
        <table className="aa-table">
          <thead>
            <tr>
              <th>{headerDate || 'Datum'}</th>
              <th style={{ textAlign: 'right' }}>{headerCount || 'Pocet'}</th>
            </tr>
          </thead>
          <tbody>
            {safeSeries.length === 0 ? (
              <tr><td colSpan={2} className="aa-muted">{noDataText || 'No data'}</td></tr>
            ) : (
              safeSeries.map((row) => (
                <tr key={row.date}>
                  <td>{row.date}</td>
                  <td style={{ textAlign: 'right' }}>{formatNumber(row.value)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Order-based metrics computation ─────────────────────────────────── */

function computeOrderMetrics(orders, fromISO, toISO) {
  const from = new Date(fromISO);
  const to = new Date(toISO);

  const filtered = orders.filter((o) => {
    const created = new Date(o.created_at || o.createdAt || '');
    return created >= from && created <= to;
  });

  let totalRevenue = 0;
  let totalOrders = filtered.length;
  const statusCounts = {};
  const materialCounts = {};
  const dailyRevenue = {};
  const dailyOrders = {};
  let totalPrintTimeMin = 0;
  let totalWeightG = 0;
  let activeOrders = 0;

  const activeStatuses = new Set(['NEW', 'REVIEW', 'APPROVED', 'PRINTING', 'POSTPROCESS', 'READY']);

  for (const order of filtered) {
    const totals = computeOrderTotals(order);
    totalRevenue += totals.total || 0;
    totalPrintTimeMin += totals.sum_time_min || 0;
    totalWeightG += totals.sum_weight_g || 0;

    const status = order.status || 'NEW';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
    if (activeStatuses.has(status)) activeOrders++;

    const materials = extractOrderMaterials(order);
    for (const mat of materials) {
      materialCounts[mat] = (materialCounts[mat] || 0) + 1;
    }

    const dayKey = (order.created_at || order.createdAt || '').slice(0, 10);
    if (dayKey) {
      dailyRevenue[dayKey] = (dailyRevenue[dayKey] || 0) + (totals.total || 0);
      dailyOrders[dayKey] = (dailyOrders[dayKey] || 0) + 1;
    }
  }

  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Compute previous period for trend
  const periodMs = to.getTime() - from.getTime();
  const prevFrom = new Date(from.getTime() - periodMs);
  const prevTo = new Date(from.getTime());

  const prevFiltered = orders.filter((o) => {
    const created = new Date(o.created_at || o.createdAt || '');
    return created >= prevFrom && created < prevTo;
  });

  let prevRevenue = 0;
  for (const order of prevFiltered) {
    const totals = computeOrderTotals(order);
    prevRevenue += totals.total || 0;
  }

  const revenueTrend = prevRevenue > 0
    ? ((totalRevenue - prevRevenue) / prevRevenue) * 100
    : (totalRevenue > 0 ? 100 : 0);

  const ordersTrend = prevFiltered.length > 0
    ? ((totalOrders - prevFiltered.length) / prevFiltered.length) * 100
    : (totalOrders > 0 ? 100 : 0);

  const prevAvg = prevFiltered.length > 0 ? prevRevenue / prevFiltered.length : 0;
  const avgTrend = prevAvg > 0
    ? ((avgOrderValue - prevAvg) / prevAvg) * 100
    : (avgOrderValue > 0 ? 100 : 0);

  // Revenue over time (sorted)
  const revenueOverTime = Object.entries(dailyRevenue)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, revenue]) => ({
      date,
      label: formatShortDate(date),
      revenue: Math.round(revenue),
    }));

  // Orders by status
  const ordersByStatus = Object.entries(statusCounts).map(([status, count]) => ({
    status,
    name: status,
    value: count,
  }));

  // Top materials
  const topMaterials = Object.entries(materialCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));

  // Average order value trend
  const aovOverTime = Object.entries(dailyRevenue)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date]) => {
      const dayOrders = dailyOrders[date] || 1;
      const dayRev = dailyRevenue[date] || 0;
      return {
        date,
        label: formatShortDate(date),
        aov: Math.round(dayRev / dayOrders),
      };
    });

  // Print time distribution
  const printTimeBuckets = { '0-30': 0, '30-60': 0, '60-120': 0, '120-240': 0, '240+': 0 };
  for (const order of filtered) {
    const totals = computeOrderTotals(order);
    const timeMin = totals.sum_time_min || 0;
    if (timeMin <= 30) printTimeBuckets['0-30']++;
    else if (timeMin <= 60) printTimeBuckets['30-60']++;
    else if (timeMin <= 120) printTimeBuckets['60-120']++;
    else if (timeMin <= 240) printTimeBuckets['120-240']++;
    else printTimeBuckets['240+']++;
  }

  const printTimeDistribution = Object.entries(printTimeBuckets)
    .filter(([, count]) => count > 0)
    .map(([range, count]) => ({ range: `${range} min`, count }));

  // Orders over time (sorted)
  const ordersOverTime = Object.entries(dailyOrders)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({
      date,
      label: formatShortDate(date),
      orders: count,
    }));

  // Top customers by revenue
  const customerMap = {};
  for (const order of filtered) {
    const email = order.customer_snapshot?.email || order.customer?.email || 'unknown';
    const totals2 = computeOrderTotals(order);
    if (!customerMap[email]) customerMap[email] = { email, revenue: 0, orders: 0 };
    customerMap[email].revenue += totals2.total || 0;
    customerMap[email].orders += 1;
  }
  const topCustomers = Object.values(customerMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Top models by order count
  const modelMap = {};
  for (const order of filtered) {
    for (const m of order.models || []) {
      const name = m.file_name || m.name || m.fileName || 'unknown';
      modelMap[name] = (modelMap[name] || 0) + (Number(m.quantity) || 1);
    }
  }
  const topModels = Object.entries(modelMap)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  // Revenue by material
  const materialRevenue = {};
  for (const order of filtered) {
    for (const m of order.models || []) {
      const matName = m.material_snapshot?.name || 'unknown';
      const qty = Number(m.quantity) || 1;
      const price = Number(m.price_breakdown_snapshot?.model_total || m.totalPrice || m.price || 0);
      materialRevenue[matName] = (materialRevenue[matName] || 0) + (price * qty);
    }
  }
  const revenueByMaterial = Object.entries(materialRevenue)
    .sort(([,a], [,b]) => b - a)
    .map(([name, revenue]) => ({ name, revenue: Math.round(revenue) }));

  // Today metrics (independent of period selector — uses full orders array)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayFiltered = orders.filter(o => {
    const created = new Date(o.created_at || o.createdAt || '');
    return created >= todayStart;
  });
  let todayRevenue = 0;
  for (const order of todayFiltered) {
    todayRevenue += computeOrderTotals(order).total || 0;
  }
  const todayOrders = todayFiltered.length;

  return {
    totalRevenue,
    totalOrders,
    avgOrderValue,
    activeOrders,
    revenueTrend,
    ordersTrend,
    avgTrend,
    totalPrintTimeMin,
    totalWeightG,
    revenueOverTime,
    ordersByStatus,
    topMaterials,
    aovOverTime,
    printTimeDistribution,
    ordersOverTime,
    topCustomers,
    topModels,
    revenueByMaterial,
    todayRevenue,
    todayOrders,
  };
}

function formatShortDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getDate()}.${d.getMonth() + 1}.`;
}

/* ── Main Component ──────────────────────────────────────────────────── */

export default function AdminAnalytics() {
  const { language, t } = useLanguage();
  const cs = language === 'cs';
  const { user: authUser } = useAuth();

  const ui = useMemo(() => ({
    title: t('admin.analytics.title', 'Analytics'),
    subtitle: t('admin.analytics.subtitle', 'Revenue, orders and activity overview.'),
    refresh: t('admin.analytics.refresh', 'Refresh'),
    // Period labels
    today: t('admin.analytics.period.today', 'Today'),
    thisWeek: t('admin.analytics.period.thisWeek', 'This week'),
    thisMonth: t('admin.analytics.period.thisMonth', 'This month'),
    thisYear: t('admin.analytics.period.thisYear', 'This year'),
    allTime: t('admin.analytics.period.allTime', 'All time'),
    // Tab labels
    tabCharts: t('admin.analytics.tab.charts', 'Charts'),
    tabOverview: t('admin.analytics.tab.overview', 'Detailed Overview'),
    tabCalculations: t('admin.analytics.tab.calculations', 'Calculations'),
    tabOrders: t('admin.analytics.tab.orders', 'Orders'),
    tabLost: t('admin.analytics.tab.lost', 'Lost'),
    tabExports: t('admin.analytics.tab.exports', 'Exports'),
    // Summary cards
    totalRevenue: t('admin.analytics.summary.totalRevenue', 'Total Revenue'),
    totalOrders: t('admin.analytics.summary.totalOrders', 'Total Orders'),
    avgOrder: t('admin.analytics.summary.avgOrder', 'Avg Order Value'),
    activeOrdersLabel: t('admin.analytics.summary.activeOrders', 'Active Orders'),
    vsPrev: t('admin.analytics.summary.vsPrev', 'vs previous period'),
    noOrders: t('admin.analytics.empty.title', 'No orders yet'),
    noOrdersHint: t('admin.analytics.empty.hint', 'Orders will appear once created via the calculator or admin panel.'),
    // Overview tab
    calculations: t('admin.analytics.overview.calculations', 'Calculations'),
    orders: t('admin.analytics.overview.orders', 'Orders'),
    conversion: t('admin.analytics.overview.conversion', 'Conversion'),
    conversionSub: t('admin.analytics.overview.conversionSub', 'orders / calculations'),
    avgPrice: t('admin.analytics.overview.avgPrice', 'Average price'),
    avgTime: t('admin.analytics.overview.avgTime', 'Average time'),
    avgWeight: t('admin.analytics.overview.avgWeight', 'Average weight'),
    noData: t('admin.analytics.overview.noData', 'No data'),
    date: t('admin.analytics.overview.date', 'Date'),
    count: t('admin.analytics.overview.count', 'Count'),
    calcsPerDay: t('admin.analytics.overview.calcsPerDay', 'Calculations / day'),
    ordersPerDay: t('admin.analytics.overview.ordersPerDay', 'Orders / day'),
    topMaterials: t('admin.analytics.overview.topMaterials', 'Top materials'),
    topPresets: t('admin.analytics.overview.topPresets', 'Top presets'),
    topFees: t('admin.analytics.overview.topFees', 'Top fees'),
    chosen: t('admin.analytics.overview.chosen', 'Chosen'),
    material: t('admin.analytics.overview.material', 'Material'),
    preset: t('admin.analytics.preset', 'Preset'),
    // Calculations tab
    searchPlaceholder: t('admin.analytics.calcs.searchPlaceholder', 'Search session / file / material / preset'),
    onlyFailed: t('admin.analytics.calcs.onlyFailed', 'Only failed'),
    calcSessions: t('admin.analytics.calcs.sessions', 'Calculation sessions'),
    file: t('admin.analytics.calcs.file', 'File'),
    time: t('admin.analytics.calcs.time', 'Time'),
    weight: t('admin.analytics.calcs.weight', 'Weight'),
    price: t('admin.analytics.calcs.price', 'Price'),
    converted: t('admin.analytics.calcs.converted', 'Converted'),
    status: t('admin.analytics.status', 'Status'),
    detail: t('admin.analytics.calcs.detail', 'Detail'),
    noCalcs: t('admin.analytics.calcs.noData', 'No calculations in this period'),
    // Orders sub-tab
    revenue: t('admin.analytics.orders.revenue', 'Est. revenue'),
    avgOrderValue: t('admin.analytics.orders.avgOrderValue', 'Avg order value'),
    note: t('admin.analytics.orders.note', 'Note'),
    ordersNote: t('admin.analytics.orders.noteText', 'Orders are tracked from calculator checkout events.'),
    // Lost tab
    lostTitle: t('admin.analytics.lost.title', 'Lost calculations (PRICE_SHOWN without conversion, > 30 min)'),
    lastActivity: t('admin.analytics.lost.lastActivity', 'Last activity'),
    dropOff: t('admin.analytics.lost.dropOff', 'Drop-off'),
    noLost: t('admin.analytics.lost.noData', 'No lost calculations'),
    // Exports
    csvExport: t('admin.analytics.exports.csvExport', 'CSV export'),
    exportType: t('admin.analytics.exports.exportType', 'Export type'),
    exportCalcs: t('admin.analytics.exports.calculations', 'Calculations'),
    exportLost: t('admin.analytics.exports.lost', 'Lost calculations'),
    exportOverview: t('admin.analytics.exports.overview', 'Overview summary'),
    generate: t('admin.analytics.exports.generate', 'Generate & Download CSV'),
    generateJson: t('admin.analytics.exports.generateJson', 'Download JSON'),
    exportNote: t('admin.analytics.exports.note', 'Export is generated from stored analytics data.'),
    // Session detail
    sessionDetail: t('admin.analytics.session.detail', 'Session detail'),
    summary: t('admin.analytics.session.summary', 'Summary'),
    timeline: t('admin.analytics.session.timeline', 'Timeline'),
    lastEvent: t('admin.analytics.session.lastEvent', 'Last event'),
    printTime: t('admin.analytics.calcs.printTime', 'Print time'),
    noMetadata: t('admin.analytics.session.noMetadata', '(no metadata)'),
    hint: t('admin.analytics.overview.hint', 'Data is collected from calculator sessions and orders.'),
  }), [t]);

  const [tab, setTab] = useState('charts');
  const [period, setPeriod] = useState('30');
  const [refreshKey, setRefreshKey] = useState(0);
  const [onlyFailed, setOnlyFailed] = useState(false);
  const [q, setQ] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [exportType, setExportType] = useState('calculations');

  // Reports tab state
  const [reportType, setReportType] = useState('revenue');
  const [reportFrom, setReportFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [reportTo, setReportTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [generatedReport, setGeneratedReport] = useState(null);
  const [scheduledReports, setScheduledReports] = useState(() => loadScheduledReports());
  const [autoReports, setAutoReports] = useState([]);
  const [reportHistory, setReportHistory] = useState(() => loadReportHistory());

  // One-time cleanup of stale/fake analytics events from localStorage.
  // Runs once per tenant, then sets a flag so it never runs again.
  useEffect(() => {
    const CLEANUP_KEY = 'analytics:v2:cleaned';
    try {
      const cleaned = readTenantJson(CLEANUP_KEY, false);
      if (!cleaned) {
        clearAnalyticsAll();
        writeTenantJson(CLEANUP_KEY, true);
        setRefreshKey((k) => k + 1);
      }
    } catch (_e) {
      // ignore — non-critical
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { fromISO, toISO } = useMemo(() => getDateRangeForPeriod(period), [period]);

  // Load all orders once
  const allOrders = useMemo(() => loadOrders(), [refreshKey]);

  // Compute order-based metrics for selected period
  const orderMetrics = useMemo(
    () => computeOrderMetrics(allOrders, fromISO, toISO),
    [allOrders, fromISO, toISO]
  );

  // Analytics sessions (widget analytics data)
  const sessions = useMemo(() => {
    const all = getAnalyticsSessions();
    const ranged = filterSessionsByRange(all, { fromISO, toISO });
    return [...ranged].sort((a, b) => (b.last_event_at || '').localeCompare(a.last_event_at || ''));
  }, [fromISO, toISO, refreshKey]);

  const overview = useMemo(() => computeOverview({ fromISO, toISO }), [fromISO, toISO, refreshKey]);

  const calculations = useMemo(() => {
    const base = sessions.filter((s) => s.has_price_shown);
    const filtered = onlyFailed ? base.filter((s) => s.status === 'failed') : base;
    const qLower = q.trim().toLowerCase();
    if (!qLower) return filtered;
    return filtered.filter((s) =>
      [s.session_id, s.summary?.file_name, s.summary?.material, s.summary?.preset]
        .filter(Boolean)
        .some((x) => String(x).toLowerCase().includes(qLower))
    );
  }, [sessions, onlyFailed, q]);

  const lost = useMemo(() => {
    return findLostSessions({ fromISO, toISO, olderThanMinutes: 30 })
      .sort((a, b) => (b.last_event_at || '').localeCompare(a.last_event_at || ''));
  }, [fromISO, toISO, refreshKey]);

  const selectedSession = useMemo(() => {
    if (!selectedSessionId) return null;
    return sessions.find((s) => s.session_id === selectedSessionId) || null;
  }, [selectedSessionId, sessions]);

  function forceRefresh() {
    setRefreshKey((k) => k + 1);
  }

  function handleExport() {
    const csv = generateCsv({ type: exportType, fromISO, toISO });
    const filename = `analytics_${exportType}_${new Date().toISOString().slice(0, 10)}.csv`;
    logExportToAudit({
      actor: { email: authUser?.email || 'unknown', role: authUser?.role || 'admin' },
      type: exportType,
      fromISO,
      toISO,
    });
    downloadTextFile({ filename, content: csv, mime: 'text/csv;charset=utf-8' });
    forceRefresh();
  }

  function handleExportJson() {
    let data;
    let filename;
    if (exportType === 'calculations') {
      data = sessions.filter((s) => s.has_price_shown);
      filename = 'analytics_calculations';
    } else if (exportType === 'lost') {
      data = lost;
      filename = 'analytics_lost';
    } else {
      data = overview;
      filename = 'analytics_overview';
    }
    logExportToAudit({
      actor: { email: authUser?.email || 'unknown', role: authUser?.role || 'admin' },
      type: `${exportType}_json`,
      fromISO,
      toISO,
    });
    exportJSON(data, `${filename}_${new Date().toISOString().slice(0, 10)}.json`);
    forceRefresh();
  }

  // Check scheduled reports on mount
  useEffect(() => {
    const due = checkScheduledReports();
    if (due.length > 0) {
      setAutoReports(due);
      setReportHistory(loadReportHistory());
      setScheduledReports(loadScheduledReports());
    }
  }, []);

  function handleGenerateReport() {
    const from = new Date(reportFrom + 'T00:00:00').toISOString();
    const to = new Date(reportTo + 'T23:59:59').toISOString();
    let report = null;
    switch (reportType) {
      case 'revenue': report = generateRevenueReport(from, to); break;
      case 'material': report = generateMaterialReport(from, to); break;
      case 'customer': report = generateCustomerReport(from, to); break;
      case 'orderStatus': report = generateOrderStatusReport(from, to); break;
    }
    if (report) {
      setGeneratedReport(report);
      saveReportToHistory(report);
      setReportHistory(loadReportHistory());
    }
  }

  function handleDownloadCSV() {
    if (!generatedReport) return;
    const csv = reportToCSV(generatedReport);
    const filename = `report_${generatedReport.type}_${reportFrom}_${reportTo}.csv`;
    downloadFile(csv, filename, 'text/csv;charset=utf-8;');
  }

  function handleDownloadPDF() {
    if (!generatedReport) return;
    const html = reportToHTML(generatedReport);
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => win.print(), 300);
    }
  }

  function handleToggleSchedule(typeId) {
    const updated = toggleScheduledReport(typeId);
    setScheduledReports(updated);
  }

  function renderTrendIndicator(value) {
    if (!value || value === 0) return null;
    const isUp = value > 0;
    return (
      <span className={`aa-trend ${isUp ? 'up' : 'down'}`}>
        {isUp ? '+' : ''}{formatNumber(value, 1)}%
      </span>
    );
  }

  const hasOrders = allOrders.length > 0;

  return (
    <div className="aa-analytics">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="aa-header">
        <div>
          <h1 className="aa-title">{ui.title}</h1>
          <p className="aa-subtitle">{ui.subtitle}</p>
        </div>
        <div className="aa-header-actions">
          <button type="button" className="aa-btn" onClick={forceRefresh}>
            {ui.refresh}
          </button>
        </div>
      </div>

      {/* ── Period Selector ─────────────────────────────────────────────── */}
      <div className="aa-period-bar">
        <PeriodButton active={period === 'today'} onClick={() => setPeriod('today')}>{ui.today}</PeriodButton>
        <PeriodButton active={period === '7'} onClick={() => setPeriod('7')}>{ui.thisWeek}</PeriodButton>
        <PeriodButton active={period === '30'} onClick={() => setPeriod('30')}>{ui.thisMonth}</PeriodButton>
        <PeriodButton active={period === 'year'} onClick={() => setPeriod('year')}>{ui.thisYear}</PeriodButton>
        <PeriodButton active={period === 'all'} onClick={() => setPeriod('all')}>{ui.allTime}</PeriodButton>
      </div>

      {/* ── Summary Cards ───────────────────────────────────────────────── */}
      {hasOrders ? (
        <div className="aa-summary-grid">
          <div className="aa-summary-card">
            <div className="aa-summary-label">{ui.totalRevenue}</div>
            <div className="aa-summary-value">{formatKc(orderMetrics.totalRevenue)}</div>
            <div className="aa-summary-trend">
              {renderTrendIndicator(orderMetrics.revenueTrend)}
              <span className="aa-summary-vs">{ui.vsPrev}</span>
            </div>
            {orderMetrics.todayRevenue > 0 && (
              <div className="aa-summary-today">
                {cs ? 'Dnes' : 'Today'}: {formatKc(orderMetrics.todayRevenue)}
              </div>
            )}
          </div>
          <div className="aa-summary-card">
            <div className="aa-summary-label">{ui.totalOrders}</div>
            <div className="aa-summary-value">{formatNumber(orderMetrics.totalOrders)}</div>
            <div className="aa-summary-trend">
              {renderTrendIndicator(orderMetrics.ordersTrend)}
              <span className="aa-summary-vs">{ui.vsPrev}</span>
            </div>
            {orderMetrics.todayOrders > 0 && (
              <div className="aa-summary-today">
                {cs ? 'Dnes' : 'Today'}: {formatNumber(orderMetrics.todayOrders)}
              </div>
            )}
          </div>
          <div className="aa-summary-card">
            <div className="aa-summary-label">{ui.avgOrder}</div>
            <div className="aa-summary-value">{formatKc(orderMetrics.avgOrderValue)}</div>
            <div className="aa-summary-trend">
              {renderTrendIndicator(orderMetrics.avgTrend)}
              <span className="aa-summary-vs">{ui.vsPrev}</span>
            </div>
          </div>
          <div className="aa-summary-card">
            <div className="aa-summary-label">{ui.activeOrdersLabel}</div>
            <div className="aa-summary-value">{formatNumber(orderMetrics.activeOrders)}</div>
            <div className="aa-summary-sub">
              {t('admin.analytics.summary.inProgress', 'in progress')}
            </div>
          </div>
        </div>
      ) : (
        <div className="aa-empty-banner">
          <div className="aa-empty-title">{ui.noOrders}</div>
          <div className="aa-empty-hint">{ui.noOrdersHint}</div>
        </div>
      )}

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div className="aa-tabs">
        <TabButton active={tab === 'charts'} onClick={() => setTab('charts')}>{ui.tabCharts}</TabButton>
        <TabButton active={tab === 'overview'} onClick={() => setTab('overview')}>{ui.tabOverview}</TabButton>
        <TabButton active={tab === 'calculations'} onClick={() => setTab('calculations')}>{ui.tabCalculations}</TabButton>
        <TabButton active={tab === 'orders'} onClick={() => setTab('orders')}>{ui.tabOrders}</TabButton>
        <TabButton active={tab === 'lost'} onClick={() => setTab('lost')}>{ui.tabLost}</TabButton>
        <TabButton active={tab === 'exports'} onClick={() => setTab('exports')}>{ui.tabExports}</TabButton>
        <TabButton active={tab === 'reports'} onClick={() => setTab('reports')}>{t('admin.analytics.tab.reports', 'Reports')}</TabButton>
      </div>

      {/* ── Tab: Charts (DEFAULT) — Drag & Drop Dashboard Grid ─────────── */}
      {tab === 'charts' && (
        <div className="aa-section">
          <AnalyticsDashboardGrid
            orderMetrics={orderMetrics}
            sessions={sessions}
            cs={cs}
            hasOrders={hasOrders}
          />
        </div>
      )}

      {/* ── Tab: Detailed Overview ──────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="aa-section">
          <div className="aa-stat-grid">
            <div className="aa-stat-card">
              <div className="aa-stat-label">{ui.calculations}</div>
              <div className="aa-stat-value">{formatNumber(overview.metrics.calculations)}</div>
              <div className="aa-stat-sub">PRICE_SHOWN</div>
            </div>
            <div className="aa-stat-card">
              <div className="aa-stat-label">{ui.orders}</div>
              <div className="aa-stat-value">{formatNumber(overview.metrics.orders)}</div>
              <div className="aa-stat-sub">ORDER / ADD_TO_CART</div>
            </div>
            <div className="aa-stat-card">
              <div className="aa-stat-label">{ui.conversion}</div>
              <div className="aa-stat-value">{formatNumber(overview.metrics.conversion_rate * 100, 1)}%</div>
              <div className="aa-stat-sub">{ui.conversionSub}</div>
            </div>
            <div className="aa-stat-card">
              <div className="aa-stat-label">{ui.avgPrice}</div>
              <div className="aa-stat-value">{formatKc(overview.metrics.avg_price)}</div>
            </div>
            <div className="aa-stat-card">
              <div className="aa-stat-label">{ui.avgTime}</div>
              <div className="aa-stat-value">{formatNumber(overview.metrics.avg_time_min, 1)} min</div>
            </div>
            <div className="aa-stat-card">
              <div className="aa-stat-label">{ui.avgWeight}</div>
              <div className="aa-stat-value">{formatNumber(overview.metrics.avg_weight_g, 1)} g</div>
            </div>
          </div>

          <div className="aa-grid-2">
            <MiniSeriesTable
              title={ui.calcsPerDay}
              series={overview.series.calculations_per_day}
              headerDate={ui.date}
              headerCount={ui.count}
              noDataText={ui.noData}
            />
            <MiniSeriesTable
              title={ui.ordersPerDay}
              series={overview.series.orders_per_day}
              headerDate={ui.date}
              headerCount={ui.count}
              noDataText={ui.noData}
            />
          </div>

          <div className="aa-grid-3">
            <div className="aa-card">
              <div className="aa-card-title">{ui.topMaterials}</div>
              <div className="aa-table-wrap">
                <table className="aa-table">
                  <thead><tr><th>{ui.material}</th><th style={{ textAlign: 'right' }}>{ui.count}</th></tr></thead>
                  <tbody>
                    {overview.top.materials.length === 0 ? (
                      <tr><td colSpan={2} className="aa-muted">{ui.noData}</td></tr>
                    ) : (
                      overview.top.materials.map((r) => (
                        <tr key={r.key}><td>{r.key}</td><td style={{ textAlign: 'right' }}>{formatNumber(r.count)}</td></tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="aa-card">
              <div className="aa-card-title">{ui.topPresets}</div>
              <div className="aa-table-wrap">
                <table className="aa-table">
                  <thead><tr><th>{ui.preset}</th><th style={{ textAlign: 'right' }}>{ui.count}</th><th style={{ textAlign: 'right' }}>{ui.conversion}</th></tr></thead>
                  <tbody>
                    {overview.top.presets.length === 0 ? (
                      <tr><td colSpan={3} className="aa-muted">{ui.noData}</td></tr>
                    ) : (
                      overview.top.presets.map((r) => (
                        <tr key={r.key}>
                          <td>{r.key}</td>
                          <td style={{ textAlign: 'right' }}>{formatNumber(r.count)}</td>
                          <td style={{ textAlign: 'right' }}>{formatNumber(r.conversion_rate * 100, 1)}%</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="aa-card">
              <div className="aa-card-title">{ui.topFees}</div>
              <div className="aa-table-wrap">
                <table className="aa-table">
                  <thead><tr><th>Fee</th><th style={{ textAlign: 'right' }}>{ui.chosen}</th></tr></thead>
                  <tbody>
                    {overview.top.fees.length === 0 ? (
                      <tr><td colSpan={2} className="aa-muted">{ui.noData}</td></tr>
                    ) : (
                      overview.top.fees.map((r) => (
                        <tr key={r.key}><td>{r.key}</td><td style={{ textAlign: 'right' }}>{formatNumber(r.count)}</td></tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="aa-hint">{ui.hint}</div>
        </div>
      )}

      {/* ── Tab: Calculations ───────────────────────────────────────────── */}
      {tab === 'calculations' && (
        <div className="aa-section">
          <div className="aa-filterbar">
            <input
              className="aa-input"
              placeholder={ui.searchPlaceholder}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <ForgeCheckbox
              checked={onlyFailed}
              onChange={(e) => setOnlyFailed(e.target.checked)}
              label={ui.onlyFailed}
            />
          </div>

          <div className="aa-card">
            <div className="aa-card-title">{ui.calcSessions}</div>
            <div className="aa-table-wrap">
              <table className="aa-table">
                <thead>
                  <tr>
                    <th>{ui.date}</th>
                    <th>{ui.file}</th>
                    <th>{ui.material}</th>
                    <th>{ui.preset}</th>
                    <th style={{ textAlign: 'right' }}>{ui.printTime}</th>
                    <th style={{ textAlign: 'right' }}>{ui.weight}</th>
                    <th style={{ textAlign: 'right' }}>{ui.price}</th>
                    <th style={{ textAlign: 'center' }}>{ui.converted}</th>
                    <th style={{ textAlign: 'center' }}>{ui.status}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {calculations.length === 0 ? (
                    <tr><td colSpan={10} className="aa-muted">{ui.noCalcs}</td></tr>
                  ) : (
                    calculations.map((s) => (
                      <tr key={s.session_id}>
                        <td>{formatDateTime(s.last_event_at)}</td>
                        <td>{s.summary?.file_name || 'unknown'}</td>
                        <td>{s.summary?.material || '-'}</td>
                        <td>{s.summary?.preset || '-'}</td>
                        <td style={{ textAlign: 'right' }}>{formatNumber((s.summary?.print_time_seconds || 0) / 60, 1)} min</td>
                        <td style={{ textAlign: 'right' }}>{formatNumber(s.summary?.weight_g, 1)} g</td>
                        <td style={{ textAlign: 'right' }}>{formatNumber(s.summary?.price_total, 0)} Kc</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`aa-pill ${s.converted ? 'ok' : ''}`}>{s.converted ? 'YES' : 'NO'}</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`aa-pill ${s.status === 'success' ? 'ok' : 'warn'}`}>{s.status}</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="aa-link" onClick={() => setSelectedSessionId(s.session_id)}>{ui.detail}</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Orders ─────────────────────────────────────────────────── */}
      {tab === 'orders' && (
        <div className="aa-section">
          {/* Stat cards from real orders */}
          <div className="aa-stat-grid aa-stat-grid-3">
            <div className="aa-stat-card">
              <div className="aa-stat-label">{ui.totalRevenue}</div>
              <div className="aa-stat-value">{formatKc(orderMetrics.totalRevenue)}</div>
            </div>
            <div className="aa-stat-card">
              <div className="aa-stat-label">{ui.totalOrders}</div>
              <div className="aa-stat-value">{formatNumber(orderMetrics.totalOrders)}</div>
            </div>
            <div className="aa-stat-card">
              <div className="aa-stat-label">{ui.avgOrder}</div>
              <div className="aa-stat-value">{formatKc(orderMetrics.avgOrderValue)}</div>
            </div>
          </div>

          {/* Status breakdown */}
          {orderMetrics.ordersByStatus.length > 0 && (
            <div className="aa-card" style={{ marginBottom: 14 }}>
              <div className="aa-card-title">{cs ? 'Rozlozeni podle stavu' : 'Status Breakdown'}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 0' }}>
                {orderMetrics.ordersByStatus.map(({ status, value }) => (
                  <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 90, fontSize: 12, color: 'var(--forge-text-secondary)' }}>{status}</span>
                    <div style={{ flex: 1, height: 20, background: 'var(--forge-bg-elevated, #1A1D24)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        width: `${orderMetrics.totalOrders > 0 ? (value / orderMetrics.totalOrders * 100) : 0}%`,
                        height: '100%',
                        borderRadius: 4,
                        backgroundColor: ({
                          NEW: '#00D4AA', REVIEW: '#4DA8DA', APPROVED: '#22C55E', PRINTING: '#FF6B35',
                          POSTPROCESS: '#6C63FF', READY: '#FFB547', SHIPPED: '#06B6D4', DONE: '#10B981', CANCELED: '#FF4757'
                        })[status] || '#7A8291',
                        transition: 'width 0.4s ease'
                      }} />
                    </div>
                    <span style={{ width: 30, fontSize: 12, fontFamily: 'var(--forge-font-tech)', color: 'var(--forge-text-primary)', fontWeight: 600, textAlign: 'right' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent orders table */}
          <div className="aa-card">
            <div className="aa-card-title">{cs ? 'Posledni objednavky' : 'Recent Orders'}</div>
            <div className="aa-table-wrap">
              <table className="aa-table">
                <thead>
                  <tr>
                    <th>{cs ? 'Datum' : 'Date'}</th>
                    <th>{cs ? 'Zakaznik' : 'Customer'}</th>
                    <th>{cs ? 'Material' : 'Material'}</th>
                    <th style={{ textAlign: 'right' }}>{cs ? 'Modely' : 'Models'}</th>
                    <th style={{ textAlign: 'right' }}>{cs ? 'Celkem' : 'Total'}</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const recentOrders = [...allOrders]
                      .filter(o => {
                        const created = new Date(o.created_at || o.createdAt || '');
                        return created >= new Date(fromISO) && created <= new Date(toISO);
                      })
                      .sort((a, b) => (b.created_at || b.createdAt || '').localeCompare(a.created_at || a.createdAt || ''))
                      .slice(0, 20);

                    if (recentOrders.length === 0) {
                      return (
                        <tr><td colSpan={6} className="aa-muted">{cs ? 'Zatim zadne objednavky v tomto obdobi' : 'No orders in this period'}</td></tr>
                      );
                    }

                    return recentOrders.map(order => {
                      const email = order.customer_snapshot?.email || order.customer?.email || '-';
                      const materials = (order.models || []).map(m => m.material_snapshot?.name).filter(Boolean);
                      const uniqueMats = [...new Set(materials)].join(', ') || '-';
                      const modelCount = (order.models || []).length;
                      const orderTotals = computeOrderTotals(order);
                      return (
                        <tr key={order.id || order.order_id}>
                          <td>{formatDateTime(order.created_at || order.createdAt)}</td>
                          <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</td>
                          <td style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{uniqueMats}</td>
                          <td style={{ textAlign: 'right' }}>{modelCount}</td>
                          <td style={{ textAlign: 'right' }}>{formatKc(orderTotals.total)}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={`aa-pill ${order.status === 'DONE' ? 'ok' : order.status === 'CANCELED' ? 'warn' : ''}`}>{order.status || 'NEW'}</span>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Lost ───────────────────────────────────────────────────── */}
      {tab === 'lost' && (
        <div className="aa-section">
          <div className="aa-card">
            <div className="aa-card-title">{ui.lostTitle}</div>
            <div className="aa-table-wrap">
              <table className="aa-table">
                <thead>
                  <tr>
                    <th>{ui.lastActivity}</th>
                    <th>{ui.material}</th>
                    <th>{ui.preset}</th>
                    <th style={{ textAlign: 'right' }}>{ui.price}</th>
                    <th style={{ textAlign: 'right' }}>{ui.time}</th>
                    <th style={{ textAlign: 'right' }}>{ui.weight}</th>
                    <th>{ui.dropOff}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {lost.length === 0 ? (
                    <tr><td colSpan={8} className="aa-muted">{ui.noLost}</td></tr>
                  ) : (
                    lost.map((s) => (
                      <tr key={s.session_id}>
                        <td>{formatDateTime(s.last_event_at)}</td>
                        <td>{s.summary?.material || '-'}</td>
                        <td>{s.summary?.preset || '-'}</td>
                        <td style={{ textAlign: 'right' }}>{formatNumber(s.summary?.price_total, 0)} Kc</td>
                        <td style={{ textAlign: 'right' }}>{formatNumber((s.summary?.print_time_seconds || 0) / 60, 1)} min</td>
                        <td style={{ textAlign: 'right' }}>{formatNumber(s.summary?.weight_g, 1)} g</td>
                        <td>{s.drop_off_step || '-'}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="aa-link" onClick={() => setSelectedSessionId(s.session_id)}>{ui.detail}</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Exports ────────────────────────────────────────────────── */}
      {tab === 'exports' && (
        <div className="aa-section">
          <div className="aa-card">
            <div className="aa-card-title">{ui.csvExport}</div>
            <div className="aa-export-row">
              <div>
                <label className="aa-field-label">{ui.exportType}</label>
                <select className="aa-select" value={exportType} onChange={(e) => setExportType(e.target.value)}>
                  <option value="calculations">{ui.exportCalcs}</option>
                  <option value="lost">{ui.exportLost}</option>
                  <option value="overview">{ui.exportOverview}</option>
                </select>
              </div>
              <button type="button" className="aa-btn" onClick={handleExport}>{ui.generate}</button>
              <button type="button" className="aa-btn aa-btn-ghost" onClick={handleExportJson}>{ui.generateJson}</button>
            </div>
            <p className="aa-muted" style={{ marginTop: 10 }}>{ui.exportNote}</p>
          </div>
        </div>
      )}

      {/* ── Tab: Reports ────────────────────────────────────────────────── */}
      {tab === 'reports' && (
        <div className="aa-section">
          {/* Auto-generated reports notification */}
          {autoReports.length > 0 && (
            <div className="aa-card" style={{ marginBottom: 14, borderColor: 'var(--forge-accent-primary)' }}>
              <div className="aa-card-title" style={{ color: 'var(--forge-accent-primary)' }}>
                {t('admin.analytics.reports.autoTitle', 'Auto-generated reports')}
              </div>
              <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--forge-text-secondary)' }}>
                {t('admin.analytics.reports.autoDesc', '{count} scheduled report(s) were auto-generated for the previous month.').replace('{count}', autoReports.length)}
              </p>
              {autoReports.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  className="aa-link"
                  onClick={() => setGeneratedReport(r)}
                  style={{ marginRight: 8 }}
                >
                  {r.title}
                </button>
              ))}
            </div>
          )}

          {/* Report configuration */}
          <div className="aa-card" style={{ marginBottom: 14 }}>
            <div className="aa-card-title">{t('admin.analytics.reports.generateTitle', 'Generate Report')}</div>
            <div className="aa-rpt-config">
              <div>
                <label className="aa-field-label">{t('admin.analytics.reports.reportType', 'Report type')}</label>
                <select
                  className="aa-select"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                >
                  {REPORT_TYPES.map((rt) => (
                    <option key={rt.id} value={rt.id}>{rt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="aa-field-label">{t('admin.analytics.reports.from', 'From')}</label>
                <input
                  type="date"
                  className="aa-input"
                  value={reportFrom}
                  onChange={(e) => setReportFrom(e.target.value)}
                  style={{ width: 160 }}
                />
              </div>
              <div>
                <label className="aa-field-label">{t('admin.analytics.reports.to', 'To')}</label>
                <input
                  type="date"
                  className="aa-input"
                  value={reportTo}
                  onChange={(e) => setReportTo(e.target.value)}
                  style={{ width: 160 }}
                />
              </div>
              <div style={{ alignSelf: 'flex-end' }}>
                <button type="button" className="aa-btn aa-btn-primary" onClick={handleGenerateReport}>
                  {t('admin.analytics.reports.generate', 'Generate report')}
                </button>
              </div>
            </div>
            <p className="aa-muted" style={{ marginTop: 10, fontSize: 12 }}>
              {REPORT_TYPES.find((rt) => rt.id === reportType)?.description || ''}
            </p>
          </div>

          {/* Report preview */}
          {generatedReport && (
            <div className="aa-card" style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div className="aa-card-title" style={{ marginBottom: 0 }}>{generatedReport.title}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="aa-btn" onClick={handleDownloadCSV}>
                    {t('admin.analytics.reports.downloadCsv', 'Download CSV')}
                  </button>
                  <button type="button" className="aa-btn" onClick={handleDownloadPDF}>
                    {t('admin.analytics.reports.printPdf', 'Print / PDF')}
                  </button>
                </div>
              </div>

              {/* Revenue report preview */}
              {generatedReport.type === 'revenue' && (
                <>
                  <div className="aa-stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                    <div className="aa-stat-card">
                      <div className="aa-stat-label">{t('admin.analytics.revenue.totalRevenue', 'Total revenue')}</div>
                      <div className="aa-stat-value">{formatKc(generatedReport.summary.totalRevenue)}</div>
                    </div>
                    <div className="aa-stat-card">
                      <div className="aa-stat-label">{t('admin.analytics.revenue.orders', 'Orders')}</div>
                      <div className="aa-stat-value">{formatNumber(generatedReport.summary.totalOrders)}</div>
                    </div>
                    <div className="aa-stat-card">
                      <div className="aa-stat-label">{t('admin.analytics.revenue.avgDaily', 'Avg daily')}</div>
                      <div className="aa-stat-value">{formatKc(generatedReport.summary.avgDailyRevenue)}</div>
                    </div>
                    <div className="aa-stat-card">
                      <div className="aa-stat-label">{t('admin.analytics.revenue.avgOrder', 'Avg order')}</div>
                      <div className="aa-stat-value">{formatKc(generatedReport.summary.avgOrderValue)}</div>
                    </div>
                  </div>
                  <div className="aa-table-wrap" style={{ marginTop: 12 }}>
                    <table className="aa-table">
                      <thead>
                        <tr>
                          <th>{t('admin.analytics.revenue.colDate', 'Date')}</th>
                          <th style={{ textAlign: 'right' }}>{t('admin.analytics.revenue.colRevenue', 'Revenue')}</th>
                          <th style={{ textAlign: 'right' }}>{t('admin.analytics.revenue.colOrders', 'Orders')}</th>
                          <th style={{ textAlign: 'right' }}>{t('admin.analytics.revenue.colAvgValue', 'Avg value')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {generatedReport.daily.length === 0 ? (
                          <tr><td colSpan={4} className="aa-muted">{t('admin.analytics.revenue.noData', 'No data')}</td></tr>
                        ) : (
                          generatedReport.daily.map((d) => (
                            <tr key={d.date}>
                              <td>{d.dateFormatted}</td>
                              <td style={{ textAlign: 'right' }}>{formatKc(d.revenue)}</td>
                              <td style={{ textAlign: 'right' }}>{d.orders}</td>
                              <td style={{ textAlign: 'right' }}>{formatKc(d.avgOrderValue)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* Material report preview */}
              {generatedReport.type === 'material' && (
                <>
                  <div className="aa-stat-grid aa-stat-grid-3">
                    <div className="aa-stat-card">
                      <div className="aa-stat-label">{t('admin.analytics.material.count', 'Materials')}</div>
                      <div className="aa-stat-value">{generatedReport.summary.totalMaterials}</div>
                    </div>
                    <div className="aa-stat-card">
                      <div className="aa-stat-label">{t('admin.analytics.material.orders', 'Orders')}</div>
                      <div className="aa-stat-value">{generatedReport.summary.totalOrders}</div>
                    </div>
                    <div className="aa-stat-card">
                      <div className="aa-stat-label">{t('admin.analytics.material.mostUsed', 'Most used')}</div>
                      <div className="aa-stat-value" style={{ fontSize: 16 }}>{generatedReport.summary.mostUsed?.name || '-'}</div>
                    </div>
                  </div>
                  <div className="aa-table-wrap" style={{ marginTop: 12 }}>
                    <table className="aa-table">
                      <thead>
                        <tr>
                          <th>{t('admin.analytics.material.colMaterial', 'Material')}</th>
                          <th style={{ textAlign: 'right' }}>{t('admin.analytics.material.colOrders', 'Orders')}</th>
                          <th style={{ textAlign: 'right' }}>{t('admin.analytics.material.colRevenue', 'Revenue')}</th>
                          <th style={{ textAlign: 'right' }}>{t('admin.analytics.material.colWeight', 'Weight')}</th>
                          <th style={{ textAlign: 'right' }}>{t('admin.analytics.material.colShare', 'Share')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {generatedReport.materials.length === 0 ? (
                          <tr><td colSpan={5} className="aa-muted">{t('admin.analytics.material.noData', 'No data')}</td></tr>
                        ) : (
                          generatedReport.materials.map((m) => (
                            <tr key={m.name}>
                              <td>{m.name}</td>
                              <td style={{ textAlign: 'right' }}>{m.orderCount}</td>
                              <td style={{ textAlign: 'right' }}>{formatKc(m.revenue)}</td>
                              <td style={{ textAlign: 'right' }}>{formatNumber(m.totalWeightG, 0)} g</td>
                              <td style={{ textAlign: 'right' }}>{m.sharePercent}%</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* Customer report preview */}
              {generatedReport.type === 'customer' && (
                <>
                  <div className="aa-stat-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                    <div className="aa-stat-card">
                      <div className="aa-stat-label">{t('admin.analytics.customer.count', 'Customers')}</div>
                      <div className="aa-stat-value">{generatedReport.summary.totalCustomers}</div>
                    </div>
                    <div className="aa-stat-card">
                      <div className="aa-stat-label">{t('admin.analytics.customer.new', 'New')}</div>
                      <div className="aa-stat-value">{generatedReport.summary.newCustomers}</div>
                    </div>
                    <div className="aa-stat-card">
                      <div className="aa-stat-label">{t('admin.analytics.customer.returning', 'Returning')}</div>
                      <div className="aa-stat-value">{generatedReport.summary.returningCustomers}</div>
                    </div>
                    <div className="aa-stat-card">
                      <div className="aa-stat-label">{t('admin.analytics.customer.totalRevenue', 'Total revenue')}</div>
                      <div className="aa-stat-value">{formatKc(generatedReport.summary.totalRevenue)}</div>
                    </div>
                    <div className="aa-stat-card">
                      <div className="aa-stat-label">{t('admin.analytics.customer.avgOrder', 'Avg order')}</div>
                      <div className="aa-stat-value">{formatKc(generatedReport.summary.avgOrderValue)}</div>
                    </div>
                  </div>
                  <div className="aa-table-wrap" style={{ marginTop: 12 }}>
                    <table className="aa-table">
                      <thead>
                        <tr>
                          <th>{t('admin.analytics.customer.colCustomer', 'Customer')}</th>
                          <th style={{ textAlign: 'right' }}>{t('admin.analytics.customer.colOrders', 'Orders')}</th>
                          <th style={{ textAlign: 'right' }}>{t('admin.analytics.customer.colRevenue', 'Revenue')}</th>
                          <th style={{ textAlign: 'right' }}>{t('admin.analytics.customer.colAvgValue', 'Avg value')}</th>
                          <th>{t('admin.analytics.customer.colReturning', 'Returning')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {generatedReport.customers.length === 0 ? (
                          <tr><td colSpan={5} className="aa-muted">{t('admin.analytics.customer.noData', 'No data')}</td></tr>
                        ) : (
                          generatedReport.customers.map((c) => (
                            <tr key={c.name}>
                              <td>{c.name}</td>
                              <td style={{ textAlign: 'right' }}>{c.orderCount}</td>
                              <td style={{ textAlign: 'right' }}>{formatKc(c.totalRevenue)}</td>
                              <td style={{ textAlign: 'right' }}>{formatKc(c.avgOrderValue)}</td>
                              <td>
                                <span className={`aa-pill ${c.isReturning ? 'ok' : ''}`}>
                                  {c.isReturning ? t('admin.analytics.customer.yes', 'Yes') : t('admin.analytics.customer.no', 'No')}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* Order status report preview */}
              {generatedReport.type === 'orderStatus' && (
                <>
                  <div className="aa-stat-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                    <div className="aa-stat-card">
                      <div className="aa-stat-label">{t('admin.analytics.orderStatus.total', 'Total')}</div>
                      <div className="aa-stat-value">{generatedReport.summary.totalOrders}</div>
                    </div>
                    <div className="aa-stat-card">
                      <div className="aa-stat-label">{t('admin.analytics.orderStatus.completed', 'Completed')}</div>
                      <div className="aa-stat-value">{generatedReport.summary.completedOrders}</div>
                    </div>
                    <div className="aa-stat-card">
                      <div className="aa-stat-label">{t('admin.analytics.orderStatus.canceled', 'Canceled')}</div>
                      <div className="aa-stat-value">{generatedReport.summary.canceledOrders}</div>
                    </div>
                    <div className="aa-stat-card">
                      <div className="aa-stat-label">{t('admin.analytics.orderStatus.completionRate', 'Completion rate')}</div>
                      <div className="aa-stat-value">{generatedReport.summary.completionRate}%</div>
                    </div>
                    <div className="aa-stat-card">
                      <div className="aa-stat-label">{t('admin.analytics.orderStatus.cancelRate', 'Cancel rate')}</div>
                      <div className="aa-stat-value">{generatedReport.summary.cancelRate}%</div>
                    </div>
                  </div>

                  <div className="aa-grid-2" style={{ marginTop: 12 }}>
                    <div className="aa-card">
                      <div className="aa-card-title">{t('admin.analytics.orderStatus.funnel', 'Conversion funnel')}</div>
                      <div className="aa-table-wrap">
                        <table className="aa-table">
                          <thead>
                            <tr>
                              <th>Status</th>
                              <th style={{ textAlign: 'right' }}>{t('admin.analytics.orderStatus.colCount', 'Count')}</th>
                              <th style={{ textAlign: 'right' }}>{t('admin.analytics.orderStatus.colShare', 'Share')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {generatedReport.funnel.map((f) => (
                              <tr key={f.status}>
                                <td>{f.statusLabel}</td>
                                <td style={{ textAlign: 'right' }}>{f.count}</td>
                                <td style={{ textAlign: 'right' }}>{f.percent}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="aa-card">
                      <div className="aa-card-title">{t('admin.analytics.orderStatus.avgProcessing', 'Avg processing time')}</div>
                      <div className="aa-table-wrap">
                        <table className="aa-table">
                          <thead>
                            <tr>
                              <th>Status</th>
                              <th style={{ textAlign: 'right' }}>{t('admin.analytics.orderStatus.colAvgTime', 'Avg time')}</th>
                              <th style={{ textAlign: 'right' }}>{t('admin.analytics.orderStatus.colSamples', 'Samples')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {generatedReport.avgProcessingTimes.filter((t) => t.sampleCount > 0).length === 0 ? (
                              <tr><td colSpan={3} className="aa-muted">{t('admin.analytics.orderStatus.insufficient', 'Insufficient data')}</td></tr>
                            ) : (
                              generatedReport.avgProcessingTimes
                                .filter((t) => t.sampleCount > 0)
                                .map((t) => (
                                  <tr key={t.status}>
                                    <td>{t.statusLabel}</td>
                                    <td style={{ textAlign: 'right' }}>{t.avgHours.toFixed(1)} h</td>
                                    <td style={{ textAlign: 'right' }}>{t.sampleCount}</td>
                                  </tr>
                                ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Scheduled reports & history */}
          <div className="aa-grid-2">
            <div className="aa-card">
              <div className="aa-card-title">{t('admin.analytics.reports.scheduledTitle', 'Scheduled monthly reports')}</div>
              <p className="aa-muted" style={{ fontSize: 12, margin: '0 0 12px' }}>
                {t('admin.analytics.reports.scheduledDesc', 'Checked reports auto-generate on first visit after month-end.')}
              </p>
              {REPORT_TYPES.map((rt) => {
                const isScheduled = scheduledReports.some((s) => s.reportType === rt.id && s.enabled);
                return (
                  <div key={rt.id} className="aa-schedule-row">
                    <ForgeCheckbox
                      checked={isScheduled}
                      onChange={() => handleToggleSchedule(rt.id)}
                      label={rt.label}
                    />
                    <span className="aa-muted" style={{ fontSize: 11 }}>{rt.description}</span>
                  </div>
                );
              })}
            </div>

            <div className="aa-card">
              <div className="aa-card-title">{t('admin.analytics.reports.historyTitle', 'Report history')}</div>
              <div className="aa-table-wrap">
                <table className="aa-table">
                  <thead>
                    <tr>
                      <th>{t('admin.analytics.reports.colDate', 'Date')}</th>
                      <th>{t('admin.analytics.reports.colType', 'Type')}</th>
                      <th>{t('admin.analytics.reports.colPeriod', 'Period')}</th>
                      <th>{t('admin.analytics.reports.colAuto', 'Auto')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportHistory.length === 0 ? (
                      <tr><td colSpan={4} className="aa-muted">{t('admin.analytics.reports.noHistory', 'No reports yet')}</td></tr>
                    ) : (
                      reportHistory.slice(0, 10).map((rh, i) => (
                        <tr key={i}>
                          <td>{formatDateTime(rh.generatedAt)}</td>
                          <td>{rh.title}</td>
                          <td style={{ fontSize: 12 }}>
                            {rh.from?.slice(0, 10)} - {rh.to?.slice(0, 10)}
                          </td>
                          <td>
                            {rh.autoGenerated && (
                              <span className="aa-pill ok">{t('admin.analytics.reports.colAuto', 'Auto')}</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Session Detail Dialog ───────────────────────────────────────── */}
      <ForgeDialog
        open={!!selectedSession}
        onClose={() => setSelectedSessionId(null)}
        title={ui.sessionDetail}
        maxWidth="1000px"
      >
        {selectedSession && (
          <>
            <div className="aa-muted" style={{ marginBottom: 12, fontSize: 13 }}>
              {selectedSession.session_id}
            </div>
            <div className="aa-detail-grid">
              <div className="aa-card">
                <div className="aa-card-title">{ui.summary}</div>
                <div className="aa-kv">
                  <div className="aa-k">{ui.lastEvent}</div><div className="aa-v">{formatDateTime(selectedSession.last_event_at)}</div>
                  <div className="aa-k">{ui.material}</div><div className="aa-v">{selectedSession.summary?.material || '-'}</div>
                  <div className="aa-k">{ui.preset}</div><div className="aa-v">{selectedSession.summary?.preset || '-'}</div>
                  <div className="aa-k">{ui.price}</div><div className="aa-v">{formatNumber(selectedSession.summary?.price_total, 0)} Kc</div>
                  <div className="aa-k">{ui.printTime}</div><div className="aa-v">{formatNumber((selectedSession.summary?.print_time_seconds || 0) / 60, 1)} min</div>
                  <div className="aa-k">{ui.weight}</div><div className="aa-v">{formatNumber(selectedSession.summary?.weight_g, 1)} g</div>
                  <div className="aa-k">{ui.converted}</div><div className="aa-v">{selectedSession.converted ? 'YES' : 'NO'}</div>
                  <div className="aa-k">{ui.status}</div><div className="aa-v">{selectedSession.status}</div>
                </div>
              </div>

              <div className="aa-card">
                <div className="aa-card-title">{ui.timeline}</div>
                <div className="aa-timeline">
                  {selectedSession.events.map((e) => (
                    <div key={e.id} className="aa-timeline-item">
                      <div className="aa-tl-dot" />
                      <div className="aa-tl-content">
                        <div className="aa-tl-top">
                          <span className="aa-tl-type">{e.event_type}</span>
                          <span className="aa-muted">{formatDateTime(e.timestamp)}</span>
                        </div>
                        {e.metadata && Object.keys(e.metadata).length ? (
                          <pre className="aa-json">{JSON.stringify(e.metadata, null, 2)}</pre>
                        ) : (
                          <div className="aa-muted">{ui.noMetadata}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </ForgeDialog>

      <style>{`
        .aa-analytics {
          padding: 24px 28px;
          background: var(--forge-bg-void);
          min-height: 100vh;
        }

        /* ── Header ─────────────────────────────────────────────────────── */
        .aa-header {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: flex-start;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }
        .aa-title {
          font-size: 24px;
          margin: 0 0 4px 0;
          color: var(--forge-text-primary);
          font-family: var(--forge-font-heading);
          font-weight: 700;
        }
        .aa-subtitle {
          margin: 0;
          color: var(--forge-text-muted);
          font-size: 14px;
        }
        .aa-header-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        /* ── Period Selector ────────────────────────────────────────────── */
        .aa-period-bar {
          display: flex;
          gap: 4px;
          margin-bottom: 20px;
          background: var(--forge-bg-surface);
          border: 1px solid var(--forge-border-default);
          border-radius: var(--forge-radius-lg);
          padding: 4px;
          width: fit-content;
        }
        .aa-period-btn {
          padding: 7px 14px;
          border-radius: var(--forge-radius-md);
          border: none;
          background: transparent;
          color: var(--forge-text-muted);
          cursor: pointer;
          font-weight: 500;
          font-size: 13px;
          font-family: var(--forge-font-tech);
          letter-spacing: 0.02em;
          transition: all 0.15s ease;
        }
        .aa-period-btn:hover {
          color: var(--forge-text-primary);
          background: var(--forge-bg-elevated);
        }
        .aa-period-btn.active {
          background: var(--forge-accent-primary);
          color: var(--forge-bg-void);
          font-weight: 600;
        }

        /* ── Summary Cards ──────────────────────────────────────────────── */
        .aa-summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 24px;
        }
        @media (max-width: 1000px) {
          .aa-summary-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .aa-summary-grid { grid-template-columns: 1fr; }
        }
        .aa-summary-card {
          background: var(--forge-bg-surface);
          border: 1px solid var(--forge-border-default);
          border-radius: var(--forge-radius-xl);
          padding: 18px 20px;
        }
        .aa-summary-label {
          font-size: 11px;
          color: var(--forge-text-muted);
          font-family: var(--forge-font-tech);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 8px;
        }
        .aa-summary-value {
          font-size: 28px;
          font-weight: 700;
          color: var(--forge-text-primary);
          font-family: var(--forge-font-mono, 'JetBrains Mono', monospace);
          line-height: 1.1;
        }
        .aa-summary-trend {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 8px;
        }
        .aa-trend {
          font-size: 12px;
          font-weight: 600;
          font-family: var(--forge-font-tech);
          padding: 2px 6px;
          border-radius: 4px;
        }
        .aa-trend.up {
          color: var(--forge-success, #00D4AA);
          background: rgba(0, 212, 170, 0.1);
        }
        .aa-trend.down {
          color: var(--forge-error, #EF4444);
          background: rgba(239, 68, 68, 0.1);
        }
        .aa-summary-vs {
          font-size: 11px;
          color: var(--forge-text-muted);
          font-family: var(--forge-font-tech);
        }
        .aa-summary-sub {
          font-size: 12px;
          color: var(--forge-text-muted);
          margin-top: 8px;
          font-family: var(--forge-font-tech);
        }
        .aa-summary-today {
          font-size: 11px;
          color: var(--forge-text-muted, #7A8291);
          font-family: var(--forge-font-tech, 'Space Mono', monospace);
          margin-top: 4px;
        }

        /* ── Empty banner ───────────────────────────────────────────────── */
        .aa-empty-banner {
          background: var(--forge-bg-surface);
          border: 1px solid var(--forge-border-default);
          border-radius: var(--forge-radius-xl);
          padding: 32px 24px;
          text-align: center;
          margin-bottom: 24px;
        }
        .aa-empty-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--forge-text-secondary);
          font-family: var(--forge-font-heading);
          margin-bottom: 6px;
        }
        .aa-empty-hint {
          font-size: 13px;
          color: var(--forge-text-muted);
        }

        /* ── Tabs ───────────────────────────────────────────────────────── */
        .aa-tabs {
          display: flex;
          gap: 2px;
          margin-bottom: 20px;
          border-bottom: 1px solid var(--forge-border-default);
          padding-bottom: 0;
        }
        .aa-tab {
          padding: 10px 16px;
          border: none;
          border-bottom: 2px solid transparent;
          background: transparent;
          color: var(--forge-text-muted);
          cursor: pointer;
          font-weight: 500;
          font-family: var(--forge-font-tech);
          letter-spacing: 0.02em;
          font-size: 13px;
          transition: all 0.15s ease;
        }
        .aa-tab:hover {
          color: var(--forge-text-primary);
        }
        .aa-tab.active {
          color: var(--forge-accent-primary);
          border-bottom-color: var(--forge-accent-primary);
          font-weight: 600;
        }

        /* ── Section & Cards ────────────────────────────────────────────── */
        .aa-section { margin-top: 0; }
        .aa-card {
          border: 1px solid var(--forge-border-default);
          background: var(--forge-bg-surface);
          border-radius: var(--forge-radius-xl);
          padding: 16px;
        }
        .aa-card-title {
          font-size: 11px;
          margin-bottom: 12px;
          color: var(--forge-text-secondary);
          font-weight: 600;
          font-family: var(--forge-font-tech);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        /* ── Stat grid (overview tab) ───────────────────────────────────── */
        .aa-stat-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }
        .aa-stat-grid-3 {
          grid-template-columns: repeat(3, 1fr);
        }
        @media (max-width: 1100px) {
          .aa-stat-grid { grid-template-columns: repeat(2, 1fr); }
        }
        .aa-stat-card {
          border: 1px solid var(--forge-border-default);
          background: var(--forge-bg-surface);
          border-radius: var(--forge-radius-xl);
          padding: 14px;
        }
        .aa-stat-label {
          font-size: 11px;
          color: var(--forge-text-muted);
          font-family: var(--forge-font-tech);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .aa-stat-value {
          font-size: 22px;
          margin-top: 6px;
          color: var(--forge-text-primary);
          font-weight: 700;
          font-family: var(--forge-font-mono, 'JetBrains Mono', monospace);
        }
        .aa-stat-sub {
          font-size: 12px;
          color: var(--forge-text-muted);
          margin-top: 6px;
          font-family: var(--forge-font-tech);
        }

        /* ── Grids ──────────────────────────────────────────────────────── */
        .aa-grid-2 {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 12px;
        }
        .aa-grid-3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 12px;
        }
        @media (max-width: 1100px) {
          .aa-grid-2, .aa-grid-3 { grid-template-columns: 1fr; }
        }

        /* ── Tables ─────────────────────────────────────────────────────── */
        .aa-table-wrap { overflow: auto; }
        .aa-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .aa-table th, .aa-table td {
          padding: 10px;
          border-bottom: 1px solid var(--forge-border-default);
        }
        .aa-table th {
          text-align: left;
          font-weight: 600;
          color: var(--forge-text-muted);
          font-family: var(--forge-font-tech);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .aa-table td { color: var(--forge-text-secondary); }

        /* ── Shared elements ────────────────────────────────────────────── */
        .aa-muted { color: var(--forge-text-muted); }
        .aa-hint {
          margin-top: 12px;
          color: var(--forge-text-muted);
          font-size: 13px;
        }
        .aa-filterbar {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }
        .aa-input, .aa-select {
          padding: 10px 12px;
          border-radius: var(--forge-radius-md);
          border: 1px solid var(--forge-border-default);
          background: var(--forge-bg-elevated);
          color: var(--forge-text-primary);
          outline: none;
          font-size: 13px;
        }
        .aa-input { width: 300px; max-width: 100%; }
        .aa-input:focus, .aa-select:focus {
          border-color: var(--forge-accent-primary);
        }
        .aa-field-label {
          display: block;
          font-size: 11px;
          color: var(--forge-text-secondary);
          margin-bottom: 6px;
          font-family: var(--forge-font-tech);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        /* ── Buttons ────────────────────────────────────────────────────── */
        .aa-btn {
          padding: 9px 16px;
          border-radius: var(--forge-radius-md);
          border: 1px solid var(--forge-border-default);
          background: var(--forge-bg-elevated);
          color: var(--forge-text-primary);
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
          transition: all 0.15s ease;
        }
        .aa-btn:hover {
          background: var(--forge-bg-overlay);
          border-color: var(--forge-border-active);
        }
        .aa-btn-ghost { background: transparent; }

        /* ── Pills ──────────────────────────────────────────────────────── */
        .aa-pill {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 999px;
          border: 1px solid var(--forge-border-default);
          font-size: 11px;
          color: var(--forge-text-secondary);
          font-weight: 500;
          font-family: var(--forge-font-tech);
        }
        .aa-pill.ok {
          border-color: rgba(0, 212, 170, 0.3);
          background: rgba(0, 212, 170, 0.08);
          color: var(--forge-success);
        }
        .aa-pill.warn {
          border-color: rgba(255, 181, 71, 0.3);
          background: rgba(255, 181, 71, 0.08);
          color: var(--forge-warning);
        }

        .aa-link {
          background: transparent;
          border: none;
          color: var(--forge-accent-primary);
          cursor: pointer;
          padding: 6px 8px;
          border-radius: var(--forge-radius-md);
          font-weight: 500;
          font-size: 13px;
        }
        .aa-link:hover { background: rgba(0, 212, 170, 0.08); }

        .aa-export-row {
          display: flex;
          gap: 12px;
          align-items: flex-end;
          flex-wrap: wrap;
        }

        /* ── Detail dialog ──────────────────────────────────────────────── */
        .aa-detail-grid {
          display: grid;
          grid-template-columns: 380px 1fr;
          gap: 12px;
        }
        @media (max-width: 900px) {
          .aa-detail-grid { grid-template-columns: 1fr; }
        }
        .aa-kv {
          display: grid;
          grid-template-columns: 140px 1fr;
          gap: 8px 12px;
          font-size: 13px;
        }
        .aa-k {
          color: var(--forge-text-muted);
          font-family: var(--forge-font-tech);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .aa-v { color: var(--forge-text-primary); }

        /* ── Timeline ───────────────────────────────────────────────────── */
        .aa-timeline {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .aa-timeline-item {
          display: flex;
          gap: 10px;
        }
        .aa-tl-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          margin-top: 6px;
          background: var(--forge-accent-primary);
          box-shadow: 0 0 0 4px rgba(0, 212, 170, 0.15);
          flex-shrink: 0;
        }
        .aa-tl-content { flex: 1; }
        .aa-tl-top {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: center;
        }
        .aa-tl-type {
          font-weight: 600;
          color: var(--forge-text-primary);
          font-family: var(--forge-font-tech);
        }
        .aa-json {
          margin: 8px 0 0 0;
          padding: 10px;
          border-radius: var(--forge-radius-lg);
          background: var(--forge-bg-elevated);
          border: 1px solid var(--forge-border-default);
          font-size: 12px;
          overflow: auto;
          color: var(--forge-text-secondary);
          font-family: var(--forge-font-mono);
        }

        /* ── Reports tab ──────────────────────────────────────────────── */
        .aa-rpt-config {
          display: flex;
          gap: 14px;
          align-items: flex-start;
          flex-wrap: wrap;
        }
        .aa-btn-primary {
          background: var(--forge-accent-primary);
          color: var(--forge-bg-void);
          border-color: var(--forge-accent-primary);
          font-weight: 700;
        }
        .aa-btn-primary:hover {
          opacity: 0.9;
          background: var(--forge-accent-primary);
          border-color: var(--forge-accent-primary);
        }
        .aa-schedule-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 0;
          border-bottom: 1px solid var(--forge-border-default);
        }
        .aa-schedule-row:last-child {
          border-bottom: none;
        }
        @media (max-width: 800px) {
          .aa-rpt-config { flex-direction: column; }
          .aa-stat-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}
