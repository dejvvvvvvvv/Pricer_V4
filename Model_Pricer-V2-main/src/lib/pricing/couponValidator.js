// Coupon validation engine
function safeNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

const ERROR_CODES = {
  NOT_FOUND: 'COUPON_NOT_FOUND',
  EXPIRED: 'COUPON_EXPIRED',
  NOT_STARTED: 'COUPON_NOT_YET_ACTIVE',
  MAX_USES: 'COUPON_MAX_USES_REACHED',
  MIN_ORDER: 'COUPON_MIN_ORDER_NOT_MET',
  INACTIVE: 'COUPON_INACTIVE',
};

export { ERROR_CODES };

export function validateCoupon(code, couponsConfig, context = {}) {
  if (!code || !couponsConfig?.enabled) {
    return { valid: false, error: ERROR_CODES.NOT_FOUND, coupon: null };
  }

  const normalizedCode = String(code).trim().toUpperCase();
  const coupons = Array.isArray(couponsConfig.coupons) ? couponsConfig.coupons : [];

  const coupon = coupons.find(c => c && String(c.code).trim().toUpperCase() === normalizedCode);

  if (!coupon) {
    return { valid: false, error: ERROR_CODES.NOT_FOUND, coupon: null };
  }

  if (!coupon.active) {
    return { valid: false, error: ERROR_CODES.INACTIVE, coupon };
  }

  const now = new Date();

  if (coupon.starts_at && new Date(coupon.starts_at) > now) {
    return { valid: false, error: ERROR_CODES.NOT_STARTED, coupon };
  }

  if (coupon.expires_at && new Date(coupon.expires_at) <= now) {
    return { valid: false, error: ERROR_CODES.EXPIRED, coupon };
  }

  if (coupon.max_uses && safeNum(coupon.used_count, 0) >= safeNum(coupon.max_uses, Infinity)) {
    return { valid: false, error: ERROR_CODES.MAX_USES, coupon };
  }

  const orderTotal = safeNum(context.orderTotal, 0);
  if (coupon.min_order_total && orderTotal < safeNum(coupon.min_order_total, 0)) {
    return { valid: false, error: ERROR_CODES.MIN_ORDER, coupon, minRequired: safeNum(coupon.min_order_total, 0) };
  }

  return { valid: true, error: null, coupon };
}

export function calculateCouponDiscount(coupon, subtotal, settings = {}) {
  if (!coupon) return 0;

  const type = String(coupon.type || 'percent');
  const value = safeNum(coupon.value, 0);
  const maxPct = safeNum(settings.max_discount_percent, 100);

  if (type === 'percent') {
    const effectivePct = Math.min(value, maxPct);
    return (subtotal * effectivePct) / 100;
  }

  if (type === 'fixed') {
    return Math.min(value, subtotal);
  }

  // free_shipping — no monetary discount on subtotal
  return 0;
}
