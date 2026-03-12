// Shipping calculation utility
function safeNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Calculate shipping cost for a given method, weight, order total and optional zone.
 *
 * @param {object} method          - Shipping method config
 * @param {number} orderWeightG    - Total order weight in grams
 * @param {number} orderTotal      - Order subtotal (for free shipping check)
 * @param {object} shippingConfig  - Full shipping config (for free_shipping_* fields)
 * @param {string} [zoneId]        - Optional zone ID to apply zone pricing overrides
 * @returns {{ cost: number, freeShippingApplied: boolean }}
 */
export function calculateShipping(method, orderWeightG, orderTotal, shippingConfig, zoneId) {
  if (!method) return { cost: 0, freeShippingApplied: false };

  const type = String(method.type || 'FIXED');

  // Resolve zone overrides if applicable
  let price = safeNum(method.price, 0);
  let pricePerKg = safeNum(method.price_per_kg, 0);
  let weightTiers = Array.isArray(method.weight_tiers) ? method.weight_tiers : [];

  if (zoneId && Array.isArray(method.zone_pricing)) {
    const zp = method.zone_pricing.find(z => z.zone_id === zoneId);
    if (zp) {
      if (zp.price_override != null) price = safeNum(zp.price_override, price);
      if (zp.price_per_kg_override != null) pricePerKg = safeNum(zp.price_per_kg_override, pricePerKg);
      if (Array.isArray(zp.weight_tiers_override)) weightTiers = zp.weight_tiers_override;
    }
  }

  let cost = 0;

  if (type === 'PICKUP') {
    cost = 0;
  } else if (type === 'FIXED' || type === 'CUSTOM') {
    cost = price;
    // Add weight surcharge
    if (pricePerKg > 0 && orderWeightG > 0) {
      cost += pricePerKg * (orderWeightG / 1000);
    }
  } else if (type === 'WEIGHT_BASED') {
    const tiers = [...weightTiers].sort((a, b) => safeNum(a.max_weight_g, 0) - safeNum(b.max_weight_g, 0));
    const matched = tiers.find(t => orderWeightG <= safeNum(t.max_weight_g, Infinity));
    cost = matched ? safeNum(matched.price, 0) : (tiers.length > 0 ? safeNum(tiers[tiers.length - 1].price, 0) : 0);
    // Add additional per-kg surcharge if set
    if (pricePerKg > 0 && orderWeightG > 0) {
      cost += pricePerKg * (orderWeightG / 1000);
    }
  }

  // Free shipping check
  const sc = shippingConfig || {};
  let freeShippingApplied = false;
  if (sc.free_shipping_enabled && safeNum(sc.free_shipping_threshold, 0) > 0 && orderTotal >= safeNum(sc.free_shipping_threshold, 0)) {
    freeShippingApplied = true;
    cost = 0;
  }

  return { cost: Math.max(0, cost), freeShippingApplied };
}

export function getDeliveryEstimate(method, expressTier) {
  const baseMin = safeNum(method?.delivery_days_min, 0);
  const baseMax = safeNum(method?.delivery_days_max, 0);
  const expressAdjust = safeNum(expressTier?.delivery_days, 0);

  // If express tier has specific delivery days, use those instead
  if (expressAdjust > 0 && expressTier) {
    return { min: Math.max(1, expressAdjust - 1), max: expressAdjust + 1 };
  }

  return { min: baseMin, max: baseMax };
}
