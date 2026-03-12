/**
 * Report Generator — admin report generation system
 *
 * Generates structured reports from order data in localStorage.
 * Supports: Monthly Revenue, Material Usage, Customer, Order Status reports.
 * Output: structured data, printable HTML, or CSV.
 *
 * Uses adminTenantStorage helpers (never direct localStorage).
 */

import { loadOrders, computeOrderTotals, extractOrderMaterials, ORDER_STATUSES, getStatusLabel } from './adminOrdersStorage';
import { readTenantJson, writeTenantJson } from './adminTenantStorage';
import { toCSV } from './exportData';

const NS_REPORT_SCHEDULES = 'reports:schedules:v1';
const NS_REPORT_HISTORY = 'reports:history:v1';

/* ── Helpers ──────────────────────────────────────────────────────────── */

function filterOrdersByDateRange(orders, from, to) {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  return orders.filter((o) => {
    const created = new Date(o.created_at || o.createdAt || '');
    return created >= fromDate && created <= toDate;
  });
}

function getDayKey(order) {
  return (order.created_at || order.createdAt || '').slice(0, 10);
}

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function formatDateCZ(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
}

function getCustomerKey(order) {
  const email = order.customer?.email || order.email || '';
  const name = order.customer?.name || order.customerName || '';
  return email || name || 'Neznamy zakaznik';
}

/* ── Report: Monthly Revenue ─────────────────────────────────────────── */

export function generateRevenueReport(from, to) {
  const allOrders = loadOrders();
  const filtered = filterOrdersByDateRange(allOrders, from, to);

  const dailyData = {};
  let totalRevenue = 0;
  let totalOrders = 0;

  for (const order of filtered) {
    const totals = computeOrderTotals(order);
    const dayKey = getDayKey(order);
    if (!dayKey) continue;

    if (!dailyData[dayKey]) {
      dailyData[dayKey] = { date: dayKey, revenue: 0, orders: 0 };
    }
    dailyData[dayKey].revenue += totals.total || 0;
    dailyData[dayKey].orders += 1;
    totalRevenue += totals.total || 0;
    totalOrders += 1;
  }

  const days = Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
  const avgDailyRevenue = days.length > 0 ? totalRevenue / days.length : 0;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Best and worst days
  let bestDay = null;
  let worstDay = null;
  for (const d of days) {
    if (!bestDay || d.revenue > bestDay.revenue) bestDay = d;
    if (!worstDay || d.revenue < worstDay.revenue) worstDay = d;
  }

  return {
    type: 'revenue',
    title: 'Mesicni report trzeb',
    from,
    to,
    generatedAt: new Date().toISOString(),
    summary: {
      totalRevenue: round2(totalRevenue),
      totalOrders,
      avgDailyRevenue: round2(avgDailyRevenue),
      avgOrderValue: round2(avgOrderValue),
      daysWithOrders: days.length,
      bestDay: bestDay ? { date: bestDay.date, revenue: round2(bestDay.revenue) } : null,
      worstDay: worstDay ? { date: worstDay.date, revenue: round2(worstDay.revenue) } : null,
    },
    daily: days.map((d) => ({
      date: d.date,
      dateFormatted: formatDateCZ(d.date),
      revenue: round2(d.revenue),
      orders: d.orders,
      avgOrderValue: d.orders > 0 ? round2(d.revenue / d.orders) : 0,
    })),
  };
}

/* ── Report: Material Usage ──────────────────────────────────────────── */

export function generateMaterialReport(from, to) {
  const allOrders = loadOrders();
  const filtered = filterOrdersByDateRange(allOrders, from, to);

  const materialData = {};

  for (const order of filtered) {
    const totals = computeOrderTotals(order);
    const materials = extractOrderMaterials(order);
    const perMaterialShare = materials.length > 0 ? (totals.total || 0) / materials.length : 0;

    for (const mat of materials) {
      if (!materialData[mat]) {
        materialData[mat] = { name: mat, orderCount: 0, revenue: 0, totalWeightG: 0, totalPieces: 0 };
      }
      materialData[mat].orderCount += 1;
      materialData[mat].revenue += perMaterialShare;
    }

    // Sum weight per model's material
    for (const m of order.models || []) {
      const matName = m?.material_snapshot?.name;
      if (!matName || !materialData[matName]) continue;
      const slicer = m?.slicer_snapshot || {};
      const weightG = Number(slicer.weight_g) || Number(slicer.filamentGrams) || 0;
      const qty = Number(m.quantity) || 1;
      materialData[matName].totalWeightG += weightG * qty;
      materialData[matName].totalPieces += qty;
    }
  }

  const materials = Object.values(materialData)
    .sort((a, b) => b.revenue - a.revenue)
    .map((m) => ({
      ...m,
      revenue: round2(m.revenue),
      totalWeightG: round2(m.totalWeightG),
      sharePercent: filtered.length > 0 ? round2((m.orderCount / filtered.length) * 100) : 0,
    }));

  return {
    type: 'material',
    title: 'Report pouziti materialu',
    from,
    to,
    generatedAt: new Date().toISOString(),
    summary: {
      totalMaterials: materials.length,
      totalOrders: filtered.length,
      mostUsed: materials[0] || null,
      highestRevenue: materials[0] || null,
    },
    materials,
  };
}

/* ── Report: Customer ────────────────────────────────────────────────── */

export function generateCustomerReport(from, to) {
  const allOrders = loadOrders();
  const filtered = filterOrdersByDateRange(allOrders, from, to);

  const customerData = {};

  for (const order of filtered) {
    const key = getCustomerKey(order);
    const totals = computeOrderTotals(order);

    if (!customerData[key]) {
      customerData[key] = {
        name: key,
        orderCount: 0,
        totalRevenue: 0,
        firstOrder: order.created_at || order.createdAt || '',
        lastOrder: order.created_at || order.createdAt || '',
      };
    }
    customerData[key].orderCount += 1;
    customerData[key].totalRevenue += totals.total || 0;

    const orderDate = order.created_at || order.createdAt || '';
    if (orderDate < customerData[key].firstOrder) customerData[key].firstOrder = orderDate;
    if (orderDate > customerData[key].lastOrder) customerData[key].lastOrder = orderDate;
  }

  const customers = Object.values(customerData)
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .map((c) => ({
      ...c,
      totalRevenue: round2(c.totalRevenue),
      avgOrderValue: c.orderCount > 0 ? round2(c.totalRevenue / c.orderCount) : 0,
      firstOrderFormatted: formatDateCZ(c.firstOrder),
      lastOrderFormatted: formatDateCZ(c.lastOrder),
      isReturning: c.orderCount > 1,
    }));

  const returning = customers.filter((c) => c.isReturning).length;
  const newCustomers = customers.length - returning;
  const totalRevenue = customers.reduce((s, c) => s + c.totalRevenue, 0);

  return {
    type: 'customer',
    title: 'Report zakazniku',
    from,
    to,
    generatedAt: new Date().toISOString(),
    summary: {
      totalCustomers: customers.length,
      newCustomers,
      returningCustomers: returning,
      totalRevenue: round2(totalRevenue),
      avgOrderValue: filtered.length > 0 ? round2(totalRevenue / filtered.length) : 0,
      top3: customers.slice(0, 3),
    },
    customers,
  };
}

/* ── Report: Order Status ────────────────────────────────────────────── */

export function generateOrderStatusReport(from, to) {
  const allOrders = loadOrders();
  const filtered = filterOrdersByDateRange(allOrders, from, to);

  const statusCounts = {};
  for (const st of ORDER_STATUSES) {
    statusCounts[st] = 0;
  }

  const statusTimes = {};

  for (const order of filtered) {
    const status = order.status || 'NEW';
    statusCounts[status] = (statusCounts[status] || 0) + 1;

    // Compute time in current status from activity log
    const activity = order.activity || [];
    if (activity.length > 0) {
      const sorted = [...activity].sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || ''));
      for (let i = 0; i < sorted.length - 1; i++) {
        const st1 = sorted[i].to_status || sorted[i].toStatus;
        if (!st1) continue;
        const t1 = new Date(sorted[i].timestamp || sorted[i].created_at || '');
        const t2 = new Date(sorted[i + 1].timestamp || sorted[i + 1].created_at || '');
        const diffMin = (t2 - t1) / 60000;
        if (diffMin > 0 && diffMin < 525600) { // max 1 year
          if (!statusTimes[st1]) statusTimes[st1] = [];
          statusTimes[st1].push(diffMin);
        }
      }
    }
  }

  // Conversion funnel
  const funnel = ORDER_STATUSES.map((st) => ({
    status: st,
    statusLabel: getStatusLabel(st, 'cs'),
    count: statusCounts[st] || 0,
    percent: filtered.length > 0 ? round2(((statusCounts[st] || 0) / filtered.length) * 100) : 0,
  }));

  // Average processing time per status
  const avgTimes = ORDER_STATUSES.map((st) => {
    const times = statusTimes[st] || [];
    const avg = times.length > 0 ? times.reduce((s, t) => s + t, 0) / times.length : 0;
    return {
      status: st,
      statusLabel: getStatusLabel(st, 'cs'),
      avgMinutes: round2(avg),
      avgHours: round2(avg / 60),
      sampleCount: times.length,
    };
  });

  const completedOrders = (statusCounts.DONE || 0) + (statusCounts.SHIPPED || 0);
  const canceledOrders = statusCounts.CANCELED || 0;
  const completionRate = filtered.length > 0 ? round2((completedOrders / filtered.length) * 100) : 0;
  const cancelRate = filtered.length > 0 ? round2((canceledOrders / filtered.length) * 100) : 0;

  return {
    type: 'orderStatus',
    title: 'Report stavu objednavek',
    from,
    to,
    generatedAt: new Date().toISOString(),
    summary: {
      totalOrders: filtered.length,
      completedOrders,
      canceledOrders,
      completionRate,
      cancelRate,
      activeOrders: filtered.length - completedOrders - canceledOrders,
    },
    funnel,
    avgProcessingTimes: avgTimes,
  };
}

/* ── CSV Export ───────────────────────────────────────────────────────── */

export function reportToCSV(report) {
  switch (report.type) {
    case 'revenue':
      return toCSV(report.daily, [
        { key: 'dateFormatted', label: 'Datum' },
        { key: 'revenue', label: 'Trzby (Kc)' },
        { key: 'orders', label: 'Objednavky' },
        { key: 'avgOrderValue', label: 'Prum. objednavka (Kc)' },
      ]);

    case 'material':
      return toCSV(report.materials, [
        { key: 'name', label: 'Material' },
        { key: 'orderCount', label: 'Pocet objednavek' },
        { key: 'revenue', label: 'Trzby (Kc)' },
        { key: 'totalWeightG', label: 'Hmotnost (g)' },
        { key: 'totalPieces', label: 'Kusu' },
        { key: 'sharePercent', label: 'Podil (%)' },
      ]);

    case 'customer':
      return toCSV(report.customers, [
        { key: 'name', label: 'Zakaznik' },
        { key: 'orderCount', label: 'Objednavek' },
        { key: 'totalRevenue', label: 'Trzby (Kc)' },
        { key: 'avgOrderValue', label: 'Prum. objednavka (Kc)' },
        { key: 'firstOrderFormatted', label: 'Prvni objednavka' },
        { key: 'lastOrderFormatted', label: 'Posledni objednavka' },
        { key: 'isReturning', label: 'Vracejici se' },
      ]);

    case 'orderStatus':
      return toCSV(report.funnel, [
        { key: 'statusLabel', label: 'Status' },
        { key: 'count', label: 'Pocet' },
        { key: 'percent', label: 'Podil (%)' },
      ]);

    default:
      return '';
  }
}

/* ── Printable HTML ──────────────────────────────────────────────────── */

function htmlWrapper(title, from, to, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 32px; color: #1a1a2e; max-width: 900px; margin: 0 auto; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    .subtitle { color: #666; font-size: 13px; margin-bottom: 24px; }
    .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 24px; }
    .summary-item { border: 1px solid #e0e0e0; border-radius: 8px; padding: 14px; }
    .summary-label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.06em; }
    .summary-value { font-size: 24px; font-weight: 700; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
    th, td { padding: 8px 10px; border-bottom: 1px solid #e0e0e0; text-align: left; }
    th { font-size: 11px; color: #888; text-transform: uppercase; font-weight: 600; }
    .text-right { text-align: right; }
    .footer { margin-top: 32px; font-size: 11px; color: #aaa; border-top: 1px solid #e0e0e0; padding-top: 12px; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <div class="subtitle">Obdobi: ${formatDateCZ(from)} - ${formatDateCZ(to)} | Vygenerovano: ${formatDateCZ(new Date().toISOString())}</div>
  ${bodyHtml}
  <div class="footer">ModelPricer — automaticky generovany report</div>
</body>
</html>`;
}

function summaryCard(label, value) {
  return `<div class="summary-item"><div class="summary-label">${label}</div><div class="summary-value">${value}</div></div>`;
}

export function reportToHTML(report) {
  const fmtKc = (n) => `${Number(n || 0).toLocaleString('cs-CZ')} Kc`;
  const fmtNum = (n) => Number(n || 0).toLocaleString('cs-CZ');

  switch (report.type) {
    case 'revenue': {
      const s = report.summary;
      const summaryHtml = `<div class="summary-grid">
        ${summaryCard('Celkove trzby', fmtKc(s.totalRevenue))}
        ${summaryCard('Objednavek', fmtNum(s.totalOrders))}
        ${summaryCard('Prum. denne', fmtKc(s.avgDailyRevenue))}
        ${summaryCard('Prum. objednavka', fmtKc(s.avgOrderValue))}
        ${s.bestDay ? summaryCard('Nejlepsi den', `${formatDateCZ(s.bestDay.date)} (${fmtKc(s.bestDay.revenue)})`) : ''}
      </div>`;

      const rows = report.daily.map((d) =>
        `<tr><td>${d.dateFormatted}</td><td class="text-right">${fmtKc(d.revenue)}</td><td class="text-right">${d.orders}</td><td class="text-right">${fmtKc(d.avgOrderValue)}</td></tr>`
      ).join('');

      const tableHtml = `<table>
        <thead><tr><th>Datum</th><th class="text-right">Trzby</th><th class="text-right">Objednavky</th><th class="text-right">Prum. hodnota</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="4">Zadna data</td></tr>'}</tbody>
      </table>`;

      return htmlWrapper(report.title, report.from, report.to, summaryHtml + tableHtml);
    }

    case 'material': {
      const s = report.summary;
      const summaryHtml = `<div class="summary-grid">
        ${summaryCard('Materialu', fmtNum(s.totalMaterials))}
        ${summaryCard('Objednavek', fmtNum(s.totalOrders))}
        ${s.mostUsed ? summaryCard('Nejpouzivanejsi', s.mostUsed.name) : ''}
      </div>`;

      const rows = report.materials.map((m) =>
        `<tr><td>${m.name}</td><td class="text-right">${m.orderCount}</td><td class="text-right">${fmtKc(m.revenue)}</td><td class="text-right">${fmtNum(m.totalWeightG)} g</td><td class="text-right">${m.sharePercent}%</td></tr>`
      ).join('');

      const tableHtml = `<table>
        <thead><tr><th>Material</th><th class="text-right">Objednavek</th><th class="text-right">Trzby</th><th class="text-right">Hmotnost</th><th class="text-right">Podil</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="5">Zadna data</td></tr>'}</tbody>
      </table>`;

      return htmlWrapper(report.title, report.from, report.to, summaryHtml + tableHtml);
    }

    case 'customer': {
      const s = report.summary;
      const summaryHtml = `<div class="summary-grid">
        ${summaryCard('Zakazniku', fmtNum(s.totalCustomers))}
        ${summaryCard('Novych', fmtNum(s.newCustomers))}
        ${summaryCard('Vracejicich se', fmtNum(s.returningCustomers))}
        ${summaryCard('Celkove trzby', fmtKc(s.totalRevenue))}
        ${summaryCard('Prum. objednavka', fmtKc(s.avgOrderValue))}
      </div>`;

      const rows = report.customers.map((c) =>
        `<tr><td>${c.name}</td><td class="text-right">${c.orderCount}</td><td class="text-right">${fmtKc(c.totalRevenue)}</td><td class="text-right">${fmtKc(c.avgOrderValue)}</td><td>${c.isReturning ? 'Ano' : 'Ne'}</td></tr>`
      ).join('');

      const tableHtml = `<table>
        <thead><tr><th>Zakaznik</th><th class="text-right">Objednavek</th><th class="text-right">Trzby</th><th class="text-right">Prum. hodnota</th><th>Vracejici se</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="5">Zadna data</td></tr>'}</tbody>
      </table>`;

      return htmlWrapper(report.title, report.from, report.to, summaryHtml + tableHtml);
    }

    case 'orderStatus': {
      const s = report.summary;
      const summaryHtml = `<div class="summary-grid">
        ${summaryCard('Celkem objednavek', fmtNum(s.totalOrders))}
        ${summaryCard('Dokonceno', fmtNum(s.completedOrders))}
        ${summaryCard('Zruseno', fmtNum(s.canceledOrders))}
        ${summaryCard('Mira dokonceni', `${s.completionRate}%`)}
        ${summaryCard('Mira zruseni', `${s.cancelRate}%`)}
      </div>`;

      const funnelRows = report.funnel.map((f) =>
        `<tr><td>${f.statusLabel}</td><td class="text-right">${f.count}</td><td class="text-right">${f.percent}%</td></tr>`
      ).join('');

      const funnelHtml = `<h3>Konverzni trychtyr</h3><table>
        <thead><tr><th>Status</th><th class="text-right">Pocet</th><th class="text-right">Podil</th></tr></thead>
        <tbody>${funnelRows}</tbody>
      </table>`;

      const timeRows = report.avgProcessingTimes
        .filter((t) => t.sampleCount > 0)
        .map((t) =>
          `<tr><td>${t.statusLabel}</td><td class="text-right">${t.avgHours.toFixed(1)} h</td><td class="text-right">${t.sampleCount}</td></tr>`
        ).join('');

      const timeHtml = timeRows ? `<h3>Prumerna doba zpracovani</h3><table>
        <thead><tr><th>Status</th><th class="text-right">Prum. doba</th><th class="text-right">Vzorku</th></tr></thead>
        <tbody>${timeRows}</tbody>
      </table>` : '';

      return htmlWrapper(report.title, report.from, report.to, summaryHtml + funnelHtml + timeHtml);
    }

    default:
      return htmlWrapper('Report', '', '', '<p>Neznamy typ reportu</p>');
  }
}

/* ── Scheduled reports ───────────────────────────────────────────────── */

export function loadScheduledReports() {
  return readTenantJson(NS_REPORT_SCHEDULES, []);
}

export function saveScheduledReports(schedules) {
  writeTenantJson(NS_REPORT_SCHEDULES, schedules);
}

export function addScheduledReport(reportType) {
  const schedules = loadScheduledReports();
  const existing = schedules.find((s) => s.reportType === reportType);
  if (existing) return schedules;

  const updated = [
    ...schedules,
    {
      reportType,
      enabled: true,
      createdAt: new Date().toISOString(),
      lastGenerated: null,
    },
  ];
  saveScheduledReports(updated);
  return updated;
}

export function removeScheduledReport(reportType) {
  const schedules = loadScheduledReports().filter((s) => s.reportType !== reportType);
  saveScheduledReports(schedules);
  return schedules;
}

export function toggleScheduledReport(reportType) {
  const schedules = loadScheduledReports();
  const idx = schedules.findIndex((s) => s.reportType === reportType);
  if (idx === -1) return addScheduledReport(reportType);
  schedules[idx].enabled = !schedules[idx].enabled;
  saveScheduledReports(schedules);
  return schedules;
}

/**
 * Check if any scheduled reports should be auto-generated.
 * Returns reports that are due (monthly, generates on first visit after month-end).
 */
export function checkScheduledReports() {
  const schedules = loadScheduledReports();
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const dueReports = [];

  for (const schedule of schedules) {
    if (!schedule.enabled) continue;

    // Check if last generated was in the current month
    const lastMonth = schedule.lastGenerated
      ? schedule.lastGenerated.slice(0, 7)
      : null;

    if (lastMonth === currentMonth) continue;

    // Generate report for previous month
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const prevMonthStart = new Date(prevMonthEnd.getFullYear(), prevMonthEnd.getMonth(), 1, 0, 0, 0);

    // Only generate if we are past the 1st of the current month
    if (now.getDate() >= 1) {
      let report = null;
      const from = prevMonthStart.toISOString();
      const to = prevMonthEnd.toISOString();

      switch (schedule.reportType) {
        case 'revenue': report = generateRevenueReport(from, to); break;
        case 'material': report = generateMaterialReport(from, to); break;
        case 'customer': report = generateCustomerReport(from, to); break;
        case 'orderStatus': report = generateOrderStatusReport(from, to); break;
      }

      if (report) {
        report.autoGenerated = true;
        dueReports.push(report);

        // Update last generated
        schedule.lastGenerated = now.toISOString();
      }
    }
  }

  if (dueReports.length > 0) {
    saveScheduledReports(schedules);

    // Save to history
    const history = readTenantJson(NS_REPORT_HISTORY, []);
    const updated = [
      ...dueReports.map((r) => ({
        type: r.type,
        title: r.title,
        from: r.from,
        to: r.to,
        generatedAt: r.generatedAt,
        autoGenerated: true,
      })),
      ...history,
    ].slice(0, 50);
    writeTenantJson(NS_REPORT_HISTORY, updated);
  }

  return dueReports;
}

export function loadReportHistory() {
  return readTenantJson(NS_REPORT_HISTORY, []);
}

export function saveReportToHistory(report) {
  const history = readTenantJson(NS_REPORT_HISTORY, []);
  const updated = [
    {
      type: report.type,
      title: report.title,
      from: report.from,
      to: report.to,
      generatedAt: report.generatedAt,
      autoGenerated: false,
    },
    ...history,
  ].slice(0, 50);
  writeTenantJson(NS_REPORT_HISTORY, updated);
}

/* ── Report type metadata ────────────────────────────────────────────── */

export const REPORT_TYPES = [
  { id: 'revenue', label: 'Mesicni trzby', description: 'Trzby po dnech, celkove soucty, prumery' },
  { id: 'material', label: 'Pouziti materialu', description: 'Ktere materialy se pouzivaji, mnozstvi, trzby' },
  { id: 'customer', label: 'Zakaznici', description: 'Top zakaznici, novi vs vracejici se, prum. objednavka' },
  { id: 'orderStatus', label: 'Stavy objednavek', description: 'Konverzni trychtyr, prumerna doba zpracovani' },
];
