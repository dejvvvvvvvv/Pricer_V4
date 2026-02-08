/*
  Admin Coupons & Promotions — Tenant-scoped Storage (V1)
  -------------------------------------------------------
  Purpose:
  - Provide ONE tenant-scoped storage entrypoint for coupon and promotion configuration.
  - Coupons: manual codes entered by customer (percent, fixed, free_shipping).
  - Promotions: auto-applied or banner-displayed deals.
  - Settings: stacking rules, max discount cap.

  Notes:
  - No legacy migration needed — this is a new namespace.
*/

import { readTenantJson, writeTenantJson } from './adminTenantStorage';

const NS_COUPONS_V1 = 'coupons:v1';
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

function normalizeCoupon(coupon, idx = 0) {
  const c = coupon && typeof coupon === 'object' ? coupon : {};

  const type = String(c.type || '').trim() || 'percent';
  const allowedTypes = ['percent', 'fixed', 'free_shipping'];
  const normalizedType = allowedTypes.includes(type) ? type : 'percent';

  const appliesTo = String(c.applies_to || '').trim() || 'all';
  const allowedAppliesTo = ['all', 'category', 'specific_models'];
  const normalizedAppliesTo = allowedAppliesTo.includes(appliesTo) ? appliesTo : 'all';

  return {
    id: String(c.id || '').trim() || uuid('cpn'),
    code: String(c.code || '').trim().toUpperCase(),
    type: normalizedType,
    value: safeNum(c.value, 0),
    min_order_total: safeNum(c.min_order_total, 0),
    max_uses: safeNum(c.max_uses, 0), // 0 = unlimited
    used_count: safeNum(c.used_count, 0),
    starts_at: String(c.starts_at || '').trim(),
    expires_at: String(c.expires_at || '').trim(),
    active: parseBool(c.active, true),
    created_at: String(c.created_at || '').trim() || nowIso(),
    applies_to: normalizedAppliesTo,
  };
}

function normalizePromotion(promo, idx = 0) {
  const p = promo && typeof promo === 'object' ? promo : {};

  const type = String(p.type || '').trim() || 'percent';
  const allowedTypes = ['percent', 'fixed'];
  const normalizedType = allowedTypes.includes(type) ? type : 'percent';

  return {
    id: String(p.id || '').trim() || uuid('promo'),
    name: String(p.name || '').trim() || `Promotion ${idx + 1}`,
    type: normalizedType,
    value: safeNum(p.value, 0),
    banner_text: String(p.banner_text || '').trim(),
    banner_color: String(p.banner_color || '').trim() || '#3b82f6',
    starts_at: String(p.starts_at || '').trim(),
    expires_at: String(p.expires_at || '').trim(),
    auto_apply: parseBool(p.auto_apply, false),
    active: parseBool(p.active, true),
    coupon_code: String(p.coupon_code || '').trim().toUpperCase(),
  };
}

function normalizeSettings(settings) {
  const s = settings && typeof settings === 'object' ? settings : {};
  return {
    allow_stacking: parseBool(s.allow_stacking, false),
    max_discount_percent: safeNum(s.max_discount_percent, 100),
  };
}

export function getDefaultCouponsConfigV1() {
  return {
    schema_version: SCHEMA_VERSION,
    enabled: false,
    coupons: [],
    promotions: [],
    settings: { allow_stacking: false, max_discount_percent: 100 },
    updated_at: nowIso(),
  };
}

export function normalizeCouponsConfigV1(input) {
  const src = input && typeof input === 'object' ? input : {};
  const couponsRaw = Array.isArray(src.coupons) ? src.coupons : [];
  const coupons = couponsRaw.map(normalizeCoupon);
  const promotionsRaw = Array.isArray(src.promotions) ? src.promotions : [];
  const promotions = promotionsRaw.map(normalizePromotion);

  return {
    schema_version: SCHEMA_VERSION,
    enabled: parseBool(src.enabled, false),
    coupons,
    promotions,
    settings: normalizeSettings(src.settings),
    updated_at: String(src.updated_at || src.updatedAt || nowIso()),
  };
}

export function loadCouponsConfigV1() {
  const stored = readTenantJson(NS_COUPONS_V1, null);
  if (stored && typeof stored === 'object') {
    return normalizeCouponsConfigV1(stored);
  }

  // No existing data — seed defaults and persist so the tenant key exists.
  const seeded = normalizeCouponsConfigV1(getDefaultCouponsConfigV1());
  writeTenantJson(NS_COUPONS_V1, seeded);
  return seeded;
}

export function saveCouponsConfigV1(data) {
  const normalized = normalizeCouponsConfigV1(data);
  const next = { ...normalized, updated_at: nowIso() };
  writeTenantJson(NS_COUPONS_V1, next);
  return next;
}
