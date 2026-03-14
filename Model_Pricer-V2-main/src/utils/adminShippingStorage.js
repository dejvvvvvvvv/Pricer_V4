/*
  Admin Shipping — Tenant-scoped Storage (V1)
  --------------------------------------------
  Purpose:
  - Provide ONE tenant-scoped storage entrypoint for shipping method configuration.
  - Support FIXED, WEIGHT_BASED, PICKUP and CUSTOM shipping types.
  - Shipping zones (CZ, SK, EU, CUSTOM) with per-zone per-method pricing overrides.
  - Weight-based pricing with predefined tiers.
  - Optional free-shipping threshold.
  - Optional price_per_kg surcharge on methods.

  Notes:
  - No legacy migration needed — this is a new namespace.
*/

import { readTenantJson, writeTenantJson } from './adminTenantStorage';
import { generateId } from './generateId';

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

// --- Default shipping zones ---
export const DEFAULT_ZONES = [
  { id: 'CZ', name: 'Ceska republika', name_en: 'Czech Republic', active: true },
  { id: 'SK', name: 'Slovensko', name_en: 'Slovakia', active: true },
  { id: 'EU', name: 'EU', name_en: 'EU', active: false },
];

// --- Default weight tier presets (grams) ---
export const DEFAULT_WEIGHT_TIERS = [
  { max_weight_g: 1000, price: 0 },   // 0-1 kg
  { max_weight_g: 5000, price: 0 },   // 1-5 kg
  { max_weight_g: 10000, price: 0 },  // 5-10 kg
  { max_weight_g: 999999, price: 0 }, // 10 kg+
];

function normalizeWeightTier(wt) {
  const w = wt && typeof wt === 'object' ? wt : {};
  return {
    max_weight_g: safeNum(w.max_weight_g, 0),
    price: safeNum(w.price, 0),
  };
}

function normalizeZone(zone) {
  const z = zone && typeof zone === 'object' ? zone : {};
  return {
    id: String(z.id || '').trim() || generateId('zone'),
    name: String(z.name || '').trim() || 'Zone',
    name_en: String(z.name_en || z.name || '').trim() || 'Zone',
    active: parseBool(z.active, true),
  };
}

function normalizeZonePricing(zp) {
  const z = zp && typeof zp === 'object' ? zp : {};
  return {
    zone_id: String(z.zone_id || '').trim(),
    price_override: z.price_override != null ? safeNum(z.price_override, null) : null,
    price_per_kg_override: z.price_per_kg_override != null ? safeNum(z.price_per_kg_override, null) : null,
    weight_tiers_override: Array.isArray(z.weight_tiers_override) ? z.weight_tiers_override.map(normalizeWeightTier) : null,
  };
}

function normalizeMethod(method, idx = 0) {
  const m = method && typeof method === 'object' ? method : {};

  const type = String(m.type || '').trim().toUpperCase() || 'FIXED';
  const allowedTypes = ['FIXED', 'WEIGHT_BASED', 'PICKUP', 'CUSTOM'];
  const normalizedType = allowedTypes.includes(type) ? type : 'FIXED';

  const weightTiersRaw = Array.isArray(m.weight_tiers) ? m.weight_tiers : [];
  const weightTiers = normalizedType === 'WEIGHT_BASED' ? weightTiersRaw.map(normalizeWeightTier) : [];

  const zonePricingRaw = Array.isArray(m.zone_pricing) ? m.zone_pricing : [];
  const zonePricing = zonePricingRaw.map(normalizeZonePricing).filter(zp => zp.zone_id);

  return {
    id: String(m.id || '').trim() || generateId('ship'),
    name: String(m.name || '').trim() || `Shipping ${idx + 1}`,
    type: normalizedType,
    price: safeNum(m.price, 0),
    price_per_kg: safeNum(m.price_per_kg, 0),
    weight_tiers: weightTiers,
    zone_pricing: zonePricing,
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
      { id: 'standard', name: 'Standardni doprava', type: 'FIXED', price: 99, price_per_kg: 0, delivery_days_min: 3, delivery_days_max: 5, active: true, sort_order: 0, description: '', weight_tiers: [], zone_pricing: [] },
      { id: 'express', name: 'Expresni doprava', type: 'FIXED', price: 199, price_per_kg: 0, delivery_days_min: 1, delivery_days_max: 2, active: true, sort_order: 1, description: '', weight_tiers: [], zone_pricing: [] },
      { id: 'pickup', name: 'Osobni odber', type: 'PICKUP', price: 0, price_per_kg: 0, delivery_days_min: 0, delivery_days_max: 0, active: true, sort_order: 2, description: 'Zdarma', weight_tiers: [], zone_pricing: [] },
    ],
    zones: DEFAULT_ZONES.map(normalizeZone),
    custom_zones: [],
    free_shipping_threshold: 0,
    free_shipping_enabled: false,
    updated_at: nowIso(),
  };
}

export function normalizeShippingConfigV1(input) {
  const src = input && typeof input === 'object' ? input : {};
  const methodsRaw = Array.isArray(src.methods) ? src.methods : [];
  const methods = methodsRaw.map(normalizeMethod);

  const zonesRaw = Array.isArray(src.zones) ? src.zones : DEFAULT_ZONES;
  const zones = zonesRaw.map(normalizeZone);

  const customZonesRaw = Array.isArray(src.custom_zones) ? src.custom_zones : [];
  const customZones = customZonesRaw.map(normalizeZone);

  return {
    schema_version: SCHEMA_VERSION,
    enabled: parseBool(src.enabled, true),
    methods,
    zones,
    custom_zones: customZones,
    free_shipping_threshold: safeNum(src.free_shipping_threshold, 0),
    free_shipping_enabled: parseBool(src.free_shipping_enabled, false),
    updated_at: String(src.updated_at || src.updatedAt || nowIso()),
  };
}

export function loadShippingConfigV1(tenantIdOverride) {
  const stored = readTenantJson(NS_SHIPPING_V1, null, tenantIdOverride);
  if (stored && typeof stored === 'object') {
    return normalizeShippingConfigV1(stored);
  }

  // No existing data — seed defaults and persist so the tenant key exists.
  const seeded = normalizeShippingConfigV1(getDefaultShippingConfigV1());
  writeTenantJson(NS_SHIPPING_V1, seeded, tenantIdOverride);
  return seeded;
}

export function saveShippingConfigV1(data) {
  const normalized = normalizeShippingConfigV1(data);
  const next = { ...normalized, updated_at: nowIso() };
  writeTenantJson(NS_SHIPPING_V1, next);
  return next;
}
