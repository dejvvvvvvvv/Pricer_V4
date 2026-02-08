/*
  Admin Shipping — Tenant-scoped Storage (V1)
  --------------------------------------------
  Purpose:
  - Provide ONE tenant-scoped storage entrypoint for shipping method configuration.
  - Support FIXED, WEIGHT_BASED and PICKUP shipping types.
  - Optional free-shipping threshold.

  Notes:
  - No legacy migration needed — this is a new namespace.
*/

import { readTenantJson, writeTenantJson } from './adminTenantStorage';

const NS_SHIPPING_V1 = 'shipping:v1';
const SCHEMA_VERSION = 1;

function nowIso() {
  return new Date().toISOString();
}

function safeNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function parseBool(v, fallback = false) {
  if (v === true || v === 1 || v === '1') return true;
  if (v === false || v === 0 || v === '0') return false;
  return fallback;
}

function uuid(prefix = 'id') {
  try {
    if (crypto?.randomUUID) return crypto.randomUUID();
  } catch {}
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

function normalizeWeightTier(wt) {
  const w = wt && typeof wt === 'object' ? wt : {};
  return {
    max_weight_g: safeNum(w.max_weight_g, 0),
    price: safeNum(w.price, 0),
  };
}

function normalizeMethod(method, idx = 0) {
  const m = method && typeof method === 'object' ? method : {};

  const type = String(m.type || '').trim().toUpperCase() || 'FIXED';
  const allowedTypes = ['FIXED', 'WEIGHT_BASED', 'PICKUP'];
  const normalizedType = allowedTypes.includes(type) ? type : 'FIXED';

  const weightTiersRaw = Array.isArray(m.weight_tiers) ? m.weight_tiers : [];
  const weightTiers = normalizedType === 'WEIGHT_BASED' ? weightTiersRaw.map(normalizeWeightTier) : [];

  return {
    id: String(m.id || '').trim() || uuid('ship'),
    name: String(m.name || '').trim() || `Shipping ${idx + 1}`,
    type: normalizedType,
    price: safeNum(m.price, 0),
    weight_tiers: weightTiers,
    delivery_days_min: safeNum(m.delivery_days_min, 0),
    delivery_days_max: safeNum(m.delivery_days_max, 0),
    active: parseBool(m.active, true),
    sort_order: safeNum(m.sort_order, idx),
    description: String(m.description || '').trim(),
  };
}

export function getDefaultShippingConfigV1() {
  return {
    schema_version: SCHEMA_VERSION,
    enabled: true,
    methods: [
      { id: 'standard', name: 'Standard Shipping', type: 'FIXED', price: 99, delivery_days_min: 3, delivery_days_max: 5, active: true, sort_order: 0, description: '', weight_tiers: [] },
      { id: 'pickup', name: 'Personal Pickup', type: 'PICKUP', price: 0, delivery_days_min: 0, delivery_days_max: 0, active: true, sort_order: 1, description: '', weight_tiers: [] },
    ],
    free_shipping_threshold: 0,
    free_shipping_enabled: false,
    updated_at: nowIso(),
  };
}

export function normalizeShippingConfigV1(input) {
  const src = input && typeof input === 'object' ? input : {};
  const methodsRaw = Array.isArray(src.methods) ? src.methods : [];
  const methods = methodsRaw.map(normalizeMethod);

  return {
    schema_version: SCHEMA_VERSION,
    enabled: parseBool(src.enabled, true),
    methods,
    free_shipping_threshold: safeNum(src.free_shipping_threshold, 0),
    free_shipping_enabled: parseBool(src.free_shipping_enabled, false),
    updated_at: String(src.updated_at || src.updatedAt || nowIso()),
  };
}

export function loadShippingConfigV1() {
  const stored = readTenantJson(NS_SHIPPING_V1, null);
  if (stored && typeof stored === 'object') {
    return normalizeShippingConfigV1(stored);
  }

  // No existing data — seed defaults and persist so the tenant key exists.
  const seeded = normalizeShippingConfigV1(getDefaultShippingConfigV1());
  writeTenantJson(NS_SHIPPING_V1, seeded);
  return seeded;
}

export function saveShippingConfigV1(data) {
  const normalized = normalizeShippingConfigV1(data);
  const next = { ...normalized, updated_at: nowIso() };
  writeTenantJson(NS_SHIPPING_V1, next);
  return next;
}
