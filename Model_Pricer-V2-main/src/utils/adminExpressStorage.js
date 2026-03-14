/*
  Admin Express Delivery — Tenant-scoped Storage (V1)
  ---------------------------------------------------
  Purpose:
  - Provide ONE tenant-scoped storage entrypoint for express/rush delivery tiers.
  - Each tier defines a surcharge (percent or fixed) and estimated delivery days.
  - Supports upsell messaging in the calculator UI.

  Notes:
  - No legacy migration needed — this is a new namespace.
*/

import { readTenantJson, writeTenantJson } from './adminTenantStorage';
import { generateId } from './generateId';

const NS_EXPRESS_V1 = 'express:v1';
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

function normalizeTier(tier, idx = 0) {
  const t = tier && typeof tier === 'object' ? tier : {};

  const surchargeType = String(t.surcharge_type || '').trim() || 'percent';
  const normalizedSurchargeType = ['percent', 'fixed'].includes(surchargeType) ? surchargeType : 'percent';

  return {
    id: String(t.id || '').trim() || generateId('tier'),
    name: String(t.name || '').trim() || `Tier ${idx + 1}`,
    surcharge_type: normalizedSurchargeType,
    surcharge_value: Math.max(0, safeNum(t.surcharge_value, 0)),
    delivery_days: Math.max(0, safeNum(t.delivery_days, 5)),
    is_default: parseBool(t.is_default, false),
    sort_order: safeNum(t.sort_order, idx),
    active: parseBool(t.active, true),
    // V1.1 fields — min order threshold, cutoff time, internal note
    min_order_value: Math.max(0, safeNum(t.min_order_value, 0)),
    cutoff_time: String(t.cutoff_time || '').trim(),
    description: String(t.description || '').trim(),
  };
}

export function getDefaultExpressConfigV1() {
  return {
    schema_version: SCHEMA_VERSION,
    enabled: true,
    tiers: [
      { id: 'standard', name: 'Standard', surcharge_type: 'percent', surcharge_value: 0, delivery_days: 5, is_default: true, sort_order: 0, active: true, min_order_value: 0, cutoff_time: '', description: '' },
      { id: 'express', name: 'Express', surcharge_type: 'percent', surcharge_value: 25, delivery_days: 2, is_default: false, sort_order: 1, active: true, min_order_value: 0, cutoff_time: '', description: '' },
      { id: 'rush', name: 'Rush', surcharge_type: 'percent', surcharge_value: 50, delivery_days: 1, is_default: false, sort_order: 2, active: true, min_order_value: 500, cutoff_time: '14:00', description: '' },
    ],
    upsell_enabled: true,
    upsell_message: '',
    updated_at: nowIso(),
  };
}

export function normalizeExpressConfigV1(input) {
  const src = input && typeof input === 'object' ? input : {};
  const tiersRaw = Array.isArray(src.tiers) ? src.tiers : [];
  const tiers = tiersRaw.map(normalizeTier);

  return {
    schema_version: SCHEMA_VERSION,
    enabled: parseBool(src.enabled, true),
    tiers,
    upsell_enabled: parseBool(src.upsell_enabled, true),
    upsell_message: String(src.upsell_message || '').trim(),
    updated_at: String(src.updated_at || src.updatedAt || nowIso()),
  };
}

export function loadExpressConfigV1(tenantIdOverride) {
  const stored = readTenantJson(NS_EXPRESS_V1, null, tenantIdOverride);
  if (stored && typeof stored === 'object') {
    return normalizeExpressConfigV1(stored);
  }

  // No existing data — seed defaults and persist so the tenant key exists.
  const seeded = normalizeExpressConfigV1(getDefaultExpressConfigV1());
  writeTenantJson(NS_EXPRESS_V1, seeded, tenantIdOverride);
  return seeded;
}

/**
 * Validate express config before save. Returns array of error strings (empty = valid).
 */
export function validateExpressConfigV1(data) {
  const errors = [];
  const tiers = Array.isArray(data?.tiers) ? data.tiers : [];

  if (tiers.length === 0) {
    errors.push('NO_TIERS');
  }

  const names = new Set();
  for (const tier of tiers) {
    const name = String(tier.name || '').trim();
    if (!name) {
      errors.push('EMPTY_NAME');
    } else if (names.has(name.toLowerCase())) {
      errors.push('DUPLICATE_NAME:' + name);
    }
    names.add(name.toLowerCase());

    if (Number(tier.surcharge_value) < 0) {
      errors.push('NEGATIVE_SURCHARGE:' + name);
    }
    if (Number(tier.delivery_days) < 0) {
      errors.push('NEGATIVE_DAYS:' + name);
    }
    if (Number(tier.min_order_value) < 0) {
      errors.push('NEGATIVE_MIN_ORDER:' + name);
    }
    // cutoff_time format: empty or HH:MM
    const ct = String(tier.cutoff_time || '').trim();
    if (ct && !/^\d{1,2}:\d{2}$/.test(ct)) {
      errors.push('INVALID_CUTOFF:' + name);
    }
  }

  return errors;
}

export function saveExpressConfigV1(data) {
  const normalized = normalizeExpressConfigV1(data);
  const next = { ...normalized, updated_at: nowIso() };
  writeTenantJson(NS_EXPRESS_V1, next);
  return next;
}
