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

function uuid(prefix = 'id') {
  try {
    if (crypto?.randomUUID) return crypto.randomUUID();
  } catch {}
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

function normalizeTier(tier, idx = 0) {
  const t = tier && typeof tier === 'object' ? tier : {};

  const surchargeType = String(t.surcharge_type || '').trim() || 'percent';
  const normalizedSurchargeType = ['percent', 'fixed'].includes(surchargeType) ? surchargeType : 'percent';

  return {
    id: String(t.id || '').trim() || uuid('tier'),
    name: String(t.name || '').trim() || `Tier ${idx + 1}`,
    surcharge_type: normalizedSurchargeType,
    surcharge_value: safeNum(t.surcharge_value, 0),
    delivery_days: safeNum(t.delivery_days, 5),
    is_default: parseBool(t.is_default, false),
    sort_order: safeNum(t.sort_order, idx),
    active: parseBool(t.active, true),
  };
}

export function getDefaultExpressConfigV1() {
  return {
    schema_version: SCHEMA_VERSION,
    enabled: true,
    tiers: [
      { id: 'standard', name: 'Standard', surcharge_type: 'percent', surcharge_value: 0, delivery_days: 5, is_default: true, sort_order: 0, active: true },
      { id: 'express', name: 'Express', surcharge_type: 'percent', surcharge_value: 25, delivery_days: 2, is_default: false, sort_order: 1, active: true },
      { id: 'rush', name: 'Rush', surcharge_type: 'percent', surcharge_value: 50, delivery_days: 1, is_default: false, sort_order: 2, active: true },
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

export function loadExpressConfigV1() {
  const stored = readTenantJson(NS_EXPRESS_V1, null);
  if (stored && typeof stored === 'object') {
    return normalizeExpressConfigV1(stored);
  }

  // No existing data — seed defaults and persist so the tenant key exists.
  const seeded = normalizeExpressConfigV1(getDefaultExpressConfigV1());
  writeTenantJson(NS_EXPRESS_V1, seeded);
  return seeded;
}

export function saveExpressConfigV1(data) {
  const normalized = normalizeExpressConfigV1(data);
  const next = { ...normalized, updated_at: nowIso() };
  writeTenantJson(NS_EXPRESS_V1, next);
  return next;
}
