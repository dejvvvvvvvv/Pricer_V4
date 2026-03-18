// Varianta A (demo-first): Analytics storage in localStorage.
// Works without backend. For future Variant B, replace these helpers with API calls.

import { appendAuditEntry } from './adminAuditLogStorage';
import { generateId } from './generateId';
import { storageAdapter } from '../lib/supabase/storageAdapter';
import { getStorageMode } from '../lib/supabase/featureFlags';
import { isSupabaseAvailable } from '../lib/supabase/client';
import { getTenantId, readTenantJson, writeTenantJson, deleteTenantJson } from './adminTenantStorage';
import { debug } from '@/lib/debug';

const NAMESPACE = 'analytics:events';

function nowIso() {
  return new Date().toISOString();
}

export const ANALYTICS_EVENT_TYPES = {
  WIDGET_VIEW: 'WIDGET_VIEW',
  MODEL_UPLOAD_STARTED: 'MODEL_UPLOAD_STARTED',
  MODEL_UPLOAD_COMPLETED: 'MODEL_UPLOAD_COMPLETED',
  SLICING_STARTED: 'SLICING_STARTED',
  SLICING_COMPLETED: 'SLICING_COMPLETED',
  PRICE_SHOWN: 'PRICE_SHOWN',
  ADD_TO_CART_CLICKED: 'ADD_TO_CART_CLICKED',
  ORDER_CREATED: 'ORDER_CREATED',
};

export function generateSessionId() {
  return generateId('sess');
}

export function getAnalyticsEvents(tenantIdOverride) {
  const data = readTenantJson(NAMESPACE, [], tenantIdOverride);
  return Array.isArray(data) ? data : [];
}

export function setAnalyticsEvents(events, tenantIdOverride) {
  writeTenantJson(NAMESPACE, events, tenantIdOverride);
}

export function clearAnalyticsAll(tenantIdOverride) {
  deleteTenantJson(NAMESPACE, tenantIdOverride);
}

export function trackAnalyticsEvent({
  tenantId = getTenantId(),
  widgetInstanceId = null,
  sessionId,
  eventType,
  timestamp = nowIso(),
  metadata = {},
}) {
  if (typeof window === 'undefined') return;

  const events = getAnalyticsEvents(tenantId);
  events.push({
    id: generateId('evt'),
    tenantId,
    widgetInstanceId,
    sessionId,
    eventType,
    timestamp,
    metadata,
  });
  // keep newest last, limit size for demo
  const MAX_EVENTS = 20000;
  const trimmed = events.length > MAX_EVENTS ? events.slice(events.length - MAX_EVENTS) : events;
  setAnalyticsEvents(trimmed, tenantId);

  // Fire-and-forget Supabase dual-write (writeTenantJson already handles dual-write,
  // but analytics uses insert-per-event for Supabase, not bulk JSON overwrite)
  const mode = getStorageMode(NAMESPACE);
  if ((mode === 'supabase' || mode === 'dual-write') && isSupabaseAvailable()) {
    storageAdapter.supabase.insert('analytics_events', {
      tenant_id: tenantId,
      event_type: eventType,
      widget_id: widgetInstanceId,
      session_id: sessionId,
      payload: metadata,
      created_at: timestamp,
    }).catch(err => debug('[analytics] Supabase insert failed:', err.message));
  }
}

function toMs(iso) {
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : 0;
}

function bucketDayISO(ms) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export function buildSessionsFromEvents(events) {
  const fallbackTenantId = getTenantId();
  const bySession = new Map();
  for (const e of events) {
    if (!e.sessionId) continue;
    const arr = bySession.get(e.sessionId) || [];
    arr.push(e);
    bySession.set(e.sessionId, arr);
  }

  const sessions = [];
  for (const [sessionId, evts] of bySession.entries()) {
    evts.sort((a, b) => toMs(a.timestamp) - toMs(b.timestamp));
    const first = evts[0];
    const last = evts[evts.length - 1];

    const hasPriceShown = evts.some((x) => x.eventType === ANALYTICS_EVENT_TYPES.PRICE_SHOWN);
    const hasAddToCart = evts.some((x) => x.eventType === ANALYTICS_EVENT_TYPES.ADD_TO_CART_CLICKED);
    const hasOrderCreated = evts.some((x) => x.eventType === ANALYTICS_EVENT_TYPES.ORDER_CREATED);
    const converted = hasAddToCart || hasOrderCreated;

    const slicingCompleted = [...evts].reverse().find((x) => x.eventType === ANALYTICS_EVENT_TYPES.SLICING_COMPLETED);
    const priceShown = [...evts].reverse().find((x) => x.eventType === ANALYTICS_EVENT_TYPES.PRICE_SHOWN);

    const status = slicingCompleted?.metadata?.result_status === 'fail' ? 'failed' : 'success';

    const material = priceShown?.metadata?.material || slicingCompleted?.metadata?.material || '—';
    const preset = priceShown?.metadata?.preset || slicingCompleted?.metadata?.preset || '—';

    const weight_g = Number(
      priceShown?.metadata?.weight_grams ?? priceShown?.metadata?.weight_g ?? priceShown?.metadata?.material_used ??
      slicingCompleted?.metadata?.weight_grams ?? slicingCompleted?.metadata?.weight_g ?? slicingCompleted?.metadata?.material_used ?? 0
    ) || 0;
    const print_time_seconds = Number(
      priceShown?.metadata?.print_time_seconds ?? priceShown?.metadata?.print_time ??
      slicingCompleted?.metadata?.print_time_seconds ?? slicingCompleted?.metadata?.print_time ?? 0
    ) || 0;
    const price_total = Number(priceShown?.metadata?.price_total ?? 0) || 0;
    const currency = priceShown?.metadata?.currency || 'CZK';

    const fees_selected = Array.isArray(priceShown?.metadata?.fees_selected) ? priceShown.metadata.fees_selected : [];

    const dropOffEvent = evts[evts.length - 1]?.eventType || '—';

    sessions.push({
      session_id: sessionId,
      tenant_id: first.tenantId || fallbackTenantId,
      widget_instance_id: first.widgetInstanceId || null,
      started_at: first.timestamp,
      last_event_at: last.timestamp,
      status,
      has_price_shown: hasPriceShown,
      converted,
      conversion_type: hasOrderCreated ? 'order' : hasAddToCart ? 'add_to_cart' : null,
      summary: {
        material,
        preset,
        weight_g,
        print_time_seconds,
        price_total,
        currency,
        fees_selected,
      },
      drop_off_step: dropOffEvent,
      events: evts,
    });
  }

  sessions.sort((a, b) => toMs(b.last_event_at) - toMs(a.last_event_at));
  return sessions;
}

export function getAnalyticsSessions() {
  const events = getAnalyticsEvents();
  return buildSessionsFromEvents(events);
}

export function filterSessionsByRange(sessions, { fromISO, toISO }) {
  const fromMs = fromISO ? toMs(fromISO) : 0;
  const toMsVal = toISO ? toMs(toISO) : Date.now();
  return sessions.filter((s) => {
    const t = toMs(s.last_event_at);
    return t >= fromMs && t <= toMsVal;
  });
}

export function computeOverview({ fromISO, toISO }) {
  const sessions = filterSessionsByRange(getAnalyticsSessions(), { fromISO, toISO });

  const calcSessions = sessions.filter((s) => s.has_price_shown);
  const orderSessions = sessions.filter((s) => s.converted);

  const calculations = calcSessions.length;
  const orders = orderSessions.length;
  const conversion_rate = calculations > 0 ? orders / calculations : 0;

  const sumCalcPrice = calcSessions.reduce((a, s) => a + (s.summary?.price_total || 0), 0);
  const sumCalcTimeSec = calcSessions.reduce((a, s) => a + (s.summary?.print_time_seconds || 0), 0);
  const sumCalcWeight = calcSessions.reduce((a, s) => a + (s.summary?.weight_g || 0), 0);

  const avg_price = calculations > 0 ? sumCalcPrice / calculations : 0;
  const avg_time_min = calculations > 0 ? (sumCalcTimeSec / calculations) / 60 : 0;
  const avg_weight_g = calculations > 0 ? sumCalcWeight / calculations : 0;

  const revenue_estimate = orderSessions.reduce((a, s) => a + (s.summary?.price_total || 0), 0);
  const avg_order_value = orders > 0 ? revenue_estimate / orders : 0;

  // Daily buckets for PRICE_SHOWN and conversions
  const dayMap = new Map();
  for (const s of sessions) {
    const day = bucketDayISO(toMs(s.last_event_at));
    const prev = dayMap.get(day) || { day, calculations: 0, orders: 0 };
    if (s.has_price_shown) prev.calculations += 1;
    if (s.converted) prev.orders += 1;
    dayMap.set(day, prev);
  }

  const days = [...dayMap.values()]
    .sort((a, b) => (a.day < b.day ? -1 : 1))
    .map((d) => ({ date: d.day, calculations: d.calculations, orders: d.orders }));

  const calculations_per_day = days.map((d) => ({ date: d.date, value: d.calculations }));
  const orders_per_day = days.map((d) => ({ date: d.date, value: d.orders }));

  // Top breakdowns
  function topCounts(field) {
    const m = new Map();
    for (const s of calcSessions) {
      const k = s.summary?.[field] || '—';
      m.set(k, (m.get(k) || 0) + 1);
    }
    return [...m.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([k, v]) => ({ key: k, count: v }));
  }

  function topWithConversion(field) {
    const calcMap = new Map();
    const orderMap = new Map();
    for (const s of calcSessions) {
      const k = s.summary?.[field] || '—';
      calcMap.set(k, (calcMap.get(k) || 0) + 1);
      if (s.converted) orderMap.set(k, (orderMap.get(k) || 0) + 1);
    }
    return [...calcMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([k, count]) => ({
        key: k,
        count,
        conversion_rate: count > 0 ? (orderMap.get(k) || 0) / count : 0,
      }));
  }

  const topMaterials = topCounts('material');
  const topPresets = topWithConversion('preset');

  // Fees usage
  const feeMap = new Map();
  for (const s of calcSessions) {
    for (const fid of s.summary?.fees_selected || []) {
      feeMap.set(fid, (feeMap.get(fid) || 0) + 1);
    }
  }
  const topFees = [...feeMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([k, v]) => ({ key: k, count: v }));

  return {
    metrics: {
      calculations,
      orders,
      conversion_rate,
      avg_price,
      avg_time_min,
      avg_weight_g,
      revenue_estimate,
      avg_order_value,
    },
    series: {
      days,
      calculations_per_day,
      orders_per_day,
    },
    top: {
      materials: topMaterials,
      presets: topPresets,
      fees: topFees,
    },
  };
}


export function findLostSessions({ fromISO, toISO, olderThanMinutes = 30 }) {
  const sessions = filterSessionsByRange(getAnalyticsSessions(), { fromISO, toISO });
  const cutoffMs = Date.now() - olderThanMinutes * 60 * 1000;
  return sessions.filter((s) => {
    if (!s.has_price_shown) return false;
    if (s.converted) return false;
    return toMs(s.last_event_at) < cutoffMs;
  });
}

function csvEscape(v) {
  let s = String(v ?? '');
  // Prevent formula injection in spreadsheet apps
  if (/^[=+\-@\t\r]/.test(s)) {
    s = "'" + s;
  }
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function generateCsv({ type, fromISO, toISO }) {
  const sessions = filterSessionsByRange(getAnalyticsSessions(), { fromISO, toISO });

  if (type === 'calculations') {
    const rows = sessions
      .filter((s) => s.has_price_shown)
      .map((s) => [
        s.session_id,
        s.started_at,
        s.last_event_at,
        s.summary.material,
        s.summary.preset,
        s.summary.weight_g,
        s.summary.print_time_seconds,
        s.summary.price_total,
        s.summary.currency,
        s.converted ? 'yes' : 'no',
      ]);
    const header = ['session_id', 'started_at', 'last_event_at', 'material', 'preset', 'weight_g', 'print_time_s', 'price_total', 'currency', 'converted'];
    return [header.join(','), ...rows.map((r) => r.map(csvEscape).join(','))].join('\n');
  }

  if (type === 'lost') {
    const rows = sessions
      .filter((s) => s.has_price_shown && !s.converted)
      .map((s) => [
        s.session_id,
        s.last_event_at,
        s.summary.material,
        s.summary.preset,
        s.summary.price_total,
        s.summary.currency,
        s.drop_off_step,
      ]);
    const header = ['session_id', 'last_event_at', 'material', 'preset', 'price_total', 'currency', 'drop_off_step'];
    return [header.join(','), ...rows.map((r) => r.map(csvEscape).join(','))].join('\n');
  }

  if (type === 'orders') {
    const rows = sessions
      .filter((s) => s.converted)
      .map((s) => [
        s.session_id,
        s.last_event_at,
        s.summary.material,
        s.summary.preset,
        s.summary.price_total,
        s.summary.currency,
        s.conversion_type,
      ]);
    const header = ['session_id', 'last_event_at', 'material', 'preset', 'price_total', 'currency', 'conversion_type'];
    return [header.join(','), ...rows.map((r) => r.map(csvEscape).join(','))].join('\n');
  }

  // default
  const header = ['message'];
  return [header.join(','), 'unknown export type'].join('\n');
}

export function logExportToAudit({ actor, type, fromISO, toISO }) {
  try {
    appendAuditEntry({
      actor,
      action: 'EXPORT_GENERATED',
      entity_type: 'analytics',
      entity_id: null,
      summary: `Export generated: ${type}`,
      diff: { type, fromISO, toISO },
      metadata: { type, fromISO, toISO },
    });
  } catch {
    // ignore in demo
  }
}

