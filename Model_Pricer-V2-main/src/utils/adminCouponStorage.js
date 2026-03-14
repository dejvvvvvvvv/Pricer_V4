/*
  Admin Coupon — Tenant-scoped Storage (V1)
  ------------------------------------------
  Purpose:
  - Provide ONE tenant-scoped storage entrypoint for coupon management.
  - Coupon types: percent, fixed, free_shipping, combined (percent + free_shipping).
  - Rules: expiry, max uses (total), max uses per customer, min order, material filter, one-time.
  - Auto-generate and bulk-generate coupon codes.
  - Usage tracking: used_count, total_discount_given, last_used_at.
  - Validation + application helpers for checkout integration.

  Namespace: coupons:v1
  Also re-exports everything from adminCouponsStorage for backward compatibility.
*/

import { readTenantJson, writeTenantJson } from './adminTenantStorage';
import { generateId } from './generateId';

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

// ---------------------------------------------------------------------------
// Coupon normalization
// ---------------------------------------------------------------------------
const ALLOWED_TYPES = ['percent', 'fixed', 'free_shipping', 'combined'];
const ALLOWED_APPLIES_TO = ['all', 'materials', 'specific_models'];

function normalizeCoupon(coupon) {
  const c = coupon && typeof coupon === 'object' ? coupon : {};

  const type = String(c.type || '').trim() || 'percent';
  const normalizedType = ALLOWED_TYPES.includes(type) ? type : 'percent';

  const appliesTo = String(c.applies_to || '').trim() || 'all';
  const normalizedAppliesTo = ALLOWED_APPLIES_TO.includes(appliesTo) ? appliesTo : 'all';

  return {
    id: String(c.id || '').trim() || generateId('cpn'),
    code: String(c.code || '').trim().toUpperCase(),
    type: normalizedType,
    value: safeNum(c.value, 0),
    // For combined type: additional percent value
    combined_percent: safeNum(c.combined_percent, 0),
    min_order_total: safeNum(c.min_order_total, 0),
    max_uses: safeNum(c.max_uses, 0), // 0 = unlimited
    max_uses_per_customer: safeNum(c.max_uses_per_customer, 0), // 0 = unlimited
    one_time: parseBool(c.one_time, false),
    used_count: safeNum(c.used_count, 0),
    total_discount_given: safeNum(c.total_discount_given, 0),
    last_used_at: String(c.last_used_at || '').trim(),
    starts_at: String(c.starts_at || '').trim(),
    expires_at: String(c.expires_at || '').trim(),
    active: parseBool(c.active, true),
    created_at: String(c.created_at || '').trim() || nowIso(),
    applies_to: normalizedAppliesTo,
    // Material IDs this coupon applies to (only relevant when applies_to === 'materials')
    material_ids: Array.isArray(c.material_ids) ? c.material_ids : [],
    // Per-customer usage tracking: { customerId: count }
    customer_usage: c.customer_usage && typeof c.customer_usage === 'object' ? c.customer_usage : {},
  };
}

function normalizePromotion(promo) {
  const p = promo && typeof promo === 'object' ? promo : {};
  const type = String(p.type || '').trim() || 'percent';
  const allowedTypes = ['percent', 'fixed'];
  const normalizedType = allowedTypes.includes(type) ? type : 'percent';

  return {
    id: String(p.id || '').trim() || generateId('promo'),
    name: String(p.name || '').trim(),
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

// ---------------------------------------------------------------------------
// Config-level CRUD (backward compatible with adminCouponsStorage)
// ---------------------------------------------------------------------------
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

export function loadCouponsConfigV1(tenantIdOverride) {
  const stored = readTenantJson(NS_COUPONS_V1, null, tenantIdOverride);
  if (stored && typeof stored === 'object') {
    return normalizeCouponsConfigV1(stored);
  }
  const seeded = normalizeCouponsConfigV1(getDefaultCouponsConfigV1());
  writeTenantJson(NS_COUPONS_V1, seeded, tenantIdOverride);
  return seeded;
}

export function saveCouponsConfigV1(data) {
  const normalized = normalizeCouponsConfigV1(data);
  const next = { ...normalized, updated_at: nowIso() };
  writeTenantJson(NS_COUPONS_V1, next);
  return next;
}

// ---------------------------------------------------------------------------
// Individual coupon CRUD
// ---------------------------------------------------------------------------
/**
 * Load all coupons (array) from the config.
 */
export function loadCoupons() {
  const cfg = loadCouponsConfigV1();
  return cfg.coupons || [];
}

/**
 * Save (add or update) a single coupon.
 * If coupon with matching id exists, it is replaced; otherwise appended.
 */
export function saveCoupon(coupon) {
  const cfg = loadCouponsConfigV1();
  const normalized = normalizeCoupon(coupon);
  const idx = cfg.coupons.findIndex((c) => c.id === normalized.id);
  if (idx >= 0) {
    cfg.coupons[idx] = normalized;
  } else {
    cfg.coupons.push(normalized);
  }
  saveCouponsConfigV1(cfg);
  return normalized;
}

/**
 * Delete a coupon by id.
 */
export function deleteCoupon(couponId) {
  const cfg = loadCouponsConfigV1();
  cfg.coupons = cfg.coupons.filter((c) => c.id !== couponId);
  saveCouponsConfigV1(cfg);
}

/**
 * Validate a coupon code against order context.
 * Returns { valid, coupon, error }.
 */
export function validateCoupon(code, orderTotal, customerId, materialIds) {
  if (!code || typeof code !== 'string') {
    return { valid: false, coupon: null, error: 'NO_CODE' };
  }

  const cfg = loadCouponsConfigV1();
  if (!cfg.enabled) {
    return { valid: false, coupon: null, error: 'SYSTEM_DISABLED' };
  }

  const upperCode = code.trim().toUpperCase();
  const coupon = cfg.coupons.find((c) => c.code === upperCode);
  if (!coupon) {
    return { valid: false, coupon: null, error: 'NOT_FOUND' };
  }

  if (!coupon.active) {
    return { valid: false, coupon, error: 'INACTIVE' };
  }

  const now = new Date();
  if (coupon.starts_at) {
    const start = new Date(coupon.starts_at);
    if (now < start) {
      return { valid: false, coupon, error: 'NOT_YET_VALID' };
    }
  }

  if (coupon.expires_at) {
    const end = new Date(coupon.expires_at);
    if (now > end) {
      return { valid: false, coupon, error: 'EXPIRED' };
    }
  }

  if (coupon.max_uses > 0 && coupon.used_count >= coupon.max_uses) {
    return { valid: false, coupon, error: 'MAX_USES_REACHED' };
  }

  if (coupon.max_uses_per_customer > 0 && customerId) {
    const custUsage = coupon.customer_usage?.[customerId] || 0;
    if (custUsage >= coupon.max_uses_per_customer) {
      return { valid: false, coupon, error: 'MAX_USES_PER_CUSTOMER' };
    }
  }

  if (coupon.one_time && coupon.used_count > 0) {
    return { valid: false, coupon, error: 'ALREADY_USED' };
  }

  const total = safeNum(orderTotal, 0);
  if (coupon.min_order_total > 0 && total < coupon.min_order_total) {
    return { valid: false, coupon, error: 'MIN_ORDER_NOT_MET' };
  }

  if (coupon.applies_to === 'materials' && Array.isArray(materialIds) && coupon.material_ids.length > 0) {
    const hasMatch = materialIds.some((mid) => coupon.material_ids.includes(mid));
    if (!hasMatch) {
      return { valid: false, coupon, error: 'MATERIAL_NOT_ELIGIBLE' };
    }
  }

  return { valid: true, coupon, error: null };
}

/**
 * Apply a coupon to an order. Increments usage counters and records discount.
 * Returns the updated coupon.
 */
export function applyCoupon(code, orderId, discountAmount, customerId) {
  const cfg = loadCouponsConfigV1();
  const upperCode = (code || '').trim().toUpperCase();
  const idx = cfg.coupons.findIndex((c) => c.code === upperCode);
  if (idx < 0) return null;

  cfg.coupons[idx] = {
    ...cfg.coupons[idx],
    used_count: (cfg.coupons[idx].used_count || 0) + 1,
    total_discount_given: (cfg.coupons[idx].total_discount_given || 0) + safeNum(discountAmount, 0),
    last_used_at: nowIso(),
  };

  // Per-customer tracking
  if (customerId) {
    const cu = { ...(cfg.coupons[idx].customer_usage || {}) };
    cu[customerId] = (cu[customerId] || 0) + 1;
    cfg.coupons[idx].customer_usage = cu;
  }

  saveCouponsConfigV1(cfg);
  return cfg.coupons[idx];
}

// ---------------------------------------------------------------------------
// Code generation helpers
// ---------------------------------------------------------------------------
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I,O,0,1 to avoid confusion

/**
 * Generate a random coupon code.
 * @param {string} [prefix] - Optional prefix (e.g. 'SAVE10')
 * @param {number} [length] - Random part length (default 4)
 */
export function generateCouponCode(prefix = '', length = 4) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  const random = Array.from(array, b => CODE_CHARS[b % CODE_CHARS.length]).join('');
  return prefix ? `${prefix.toUpperCase()}-${random}` : random;
}

/**
 * Bulk generate N coupon objects with auto-generated codes.
 * Returns array of new coupon objects (not yet saved).
 */
export function bulkGenerateCoupons(count, template = {}) {
  const existing = loadCoupons();
  const existingCodes = new Set(existing.map((c) => c.code));
  const result = [];

  for (let i = 0; i < count && i < 100; i++) {
    let code;
    let attempts = 0;
    do {
      code = generateCouponCode(template.codePrefix || '', template.codeLength || 4);
      attempts++;
    } while ((existingCodes.has(code) || result.some((r) => r.code === code)) && attempts < 50);

    result.push(
      normalizeCoupon({
        ...template,
        id: generateId('cpn'),
        code,
        created_at: nowIso(),
        used_count: 0,
        total_discount_given: 0,
        last_used_at: '',
        customer_usage: {},
      }),
    );
  }

  return result;
}
