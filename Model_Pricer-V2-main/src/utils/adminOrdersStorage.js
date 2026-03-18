/*
  Admin Orders — Variant A (front-end demo)
  ----------------------------------------
  Persists Orders in localStorage so the Admin UI is fully usable for demos.

  Notes:
  - This file intentionally has *no* backend dependency.
  - Data model mirrors the specification (snapshots, activity log, notes, flags).
*/

import { appendTenantLog, readTenantJson, writeTenantJson } from './adminTenantStorage';

const NS_ORDERS = 'orders:v1';
const NS_ACTIVITY = 'orders:activity:v1';

export const ORDER_STATUSES = [
  'NEW',
  'REVIEW',
  'APPROVED',
  'PRINTING',
  'POSTPROCESS',
  'READY',
  'SHIPPED',
  'DONE',
  'CANCELED',
];

export const ORDER_FLAGS = [
  'OUT_OF_BOUNDS',
  'SLICER_FAILED',
  'MISSING_SLICER_DATA',
  'INVALID_CONFIG',
];

export function nowIso() {
  return new Date().toISOString();
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function computeFeesTotal(fees = []) {
  return round2(fees.reduce((sum, f) => sum + (Number(f.amount) || 0), 0));
}

export function computeOrderTotals(order) {
  const models = order.models || [];
  let subtotalModels = 0;
  let timeSum = 0;
  let weightSum = 0;
  let piecesSum = 0;

  for (const m of models) {
    const qty = Number(m.quantity) || 1;
    piecesSum += qty;

    // Support both seed format (time_min, weight_g) and calculator format (estimatedTimeSeconds, filamentGrams)
    const slicer = m?.slicer_snapshot || {};
    const timeMin = Number(slicer.time_min) || (Number(slicer.estimatedTimeSeconds) > 0 ? Number(slicer.estimatedTimeSeconds) / 60 : 0);
    const weightG = Number(slicer.weight_g) || Number(slicer.filamentGrams) || 0;
    timeSum += timeMin * qty;
    weightSum += weightG * qty;

    // Support both seed format (price_breakdown_snapshot.model_total) and calculator format (various fallbacks)
    const base = m.price_breakdown_snapshot || {};
    const modelPrice = Number(base.model_total) || Number(base.total) || Number(base.totalPrice)
      || Number(m.totalPrice) || Number(m.price) || 0;
    subtotalModels += modelPrice * qty;
  }

  // --- Authoritative source: totals_snapshot from pricing engine ---
  // If the order has a totals_snapshot with a valid total, use it as the single source of truth.
  // The pricing engine already computed the correct total including all fees, discounts, surcharges, etc.
  const ts = order.totals_snapshot;
  if (ts?.total != null && Number(ts.total) > 0) {
    const oneTimeFees = computeFeesTotal(order.one_time_fees || []);
    return {
      subtotal_models: Number(ts.subtotal_models) || Number(ts.models_total) || round2(subtotalModels),
      one_time_fees_total: oneTimeFees,
      shipping_total: Number(ts.shipping_total) || 0,
      min_order_delta: Number(ts.min_order_delta) || 0,
      rounding_delta: Number(ts.rounding_delta) || 0,
      express_surcharge_total: Number(ts.express_surcharge_total) || 0,
      coupon_discount_total: Number(ts.coupon_discount_total) || 0,
      volume_discount_total: Number(ts.volume_discount_total) || 0,
      order_fees_total: Number(ts.order_fees_total) || 0,
      markup_amount: Number(ts.markup_amount) || 0,
      subtotal_before_markup: Number(ts.subtotal_before_markup) || 0,
      total: round2(Number(ts.total)),
      sum_time_min: round2(timeSum),
      sum_weight_g: round2(weightSum),
      sum_pieces: piecesSum,
    };
  }

  // --- Fallback: compute total from parts (legacy orders without totals_snapshot) ---
  const oneTimeFeesTotal = computeFeesTotal(order.one_time_fees || []);
  const minOrderDelta = Number(ts?.min_order_delta || 0);
  const roundingDelta = Number(ts?.rounding_delta || 0);
  const shippingTotal = Number(ts?.shipping_total || 0);
  const expressSurchargeTotal = Number(ts?.express_surcharge_total) || 0;
  const couponDiscountTotal = Number(ts?.coupon_discount_total) || 0;
  const volumeDiscountTotal = Number(ts?.volume_discount_total) || 0;
  const orderFeesTotal = Number(ts?.order_fees_total) || 0;
  const markupAmount = Number(ts?.markup_amount) || 0;
  const subtotalBeforeMarkup = Number(ts?.subtotal_before_markup) || 0;

  const total = round2(
    subtotalModels + oneTimeFeesTotal + shippingTotal + minOrderDelta + roundingDelta
    + expressSurchargeTotal + couponDiscountTotal + volumeDiscountTotal
    + orderFeesTotal + markupAmount
  );

  return {
    subtotal_models: round2(subtotalModels),
    one_time_fees_total: oneTimeFeesTotal,
    shipping_total: shippingTotal,
    min_order_delta: minOrderDelta,
    rounding_delta: roundingDelta,
    express_surcharge_total: expressSurchargeTotal,
    coupon_discount_total: couponDiscountTotal,
    volume_discount_total: volumeDiscountTotal,
    order_fees_total: orderFeesTotal,
    markup_amount: markupAmount,
    subtotal_before_markup: subtotalBeforeMarkup,
    total: total,
    sum_time_min: round2(timeSum),
    sum_weight_g: round2(weightSum),
    sum_pieces: piecesSum,
  };
}

export function extractOrderMaterials(order) {
  const set = new Set();
  for (const m of order.models || []) {
    const name = m?.material_snapshot?.name;
    if (name) set.add(name);
  }
  return Array.from(set);
}

export function extractOrderPresets(order) {
  const set = new Set();
  for (const m of order.models || []) {
    const name = m?.preset_snapshot?.name;
    if (name) set.add(name);
  }
  return Array.from(set);
}

export function collectOrderFlags(order) {
  const set = new Set(order.flags || []);
  for (const m of order.models || []) {
    for (const f of m.flags || []) set.add(f);
  }
  return Array.from(set);
}

export function loadOrders() {
  const data = readTenantJson(NS_ORDERS, { orders: [] });
  return deepClone(data.orders || []);
}

export function saveOrders(orders) {
  writeTenantJson(NS_ORDERS, { orders: deepClone(orders) });
}

export function appendOrderActivity(orderId, entry) {
  // global activity log (optional)
  appendTenantLog(NS_ACTIVITY, { order_id: orderId, ...entry });
}

export function getStatusLabel(status, language = 'cs') {
  const map = {
    NEW: language === 'cs' ? 'Nová' : 'New',
    REVIEW: language === 'cs' ? 'Kontrola' : 'Review',
    APPROVED: language === 'cs' ? 'Schváleno' : 'Approved',
    PRINTING: language === 'cs' ? 'Tiskne se' : 'Printing',
    POSTPROCESS: language === 'cs' ? 'Postprocess' : 'Postprocess',
    READY: language === 'cs' ? 'Připraveno' : 'Ready',
    SHIPPED: language === 'cs' ? 'Odesláno' : 'Shipped',
    DONE: language === 'cs' ? 'Hotovo' : 'Done',
    CANCELED: language === 'cs' ? 'Zrušeno' : 'Canceled',
  };
  return map[status] || status;
}

export function getOrderStoragePath(order) {
  return order?.storage?.storagePath || null;
}

export function getOrderStorageStatus(order) {
  return order?.storage?.status || 'pending';
}

export function getFlagLabel(flag, language = 'cs') {
  const map = {
    OUT_OF_BOUNDS: language === 'cs' ? 'Mimo limity tiskárny' : 'Out of bounds',
    SLICER_FAILED: language === 'cs' ? 'Slicer selhal' : 'Slicer failed',
    MISSING_SLICER_DATA: language === 'cs' ? 'Chybí slicer data' : 'Missing slicer data',
    INVALID_CONFIG: language === 'cs' ? 'Neplatná konfigurace' : 'Invalid config',
  };
  return map[flag] || flag;
}
