// Shipping calculation utility
function safeNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function calculateShipping(method, orderWeightG, orderTotal, shippingConfig) {
  if (!method) return { cost: 0, freeShippingApplied: false };

  const type = String(method.type || 'FIXED');
  let cost = 0;

  if (type === 'PICKUP') {
    cost = 0;
  } else if (type === 'FIXED') {
    cost = safeNum(method.price, 0);
  } else if (type === 'WEIGHT_BASED') {
    const tiers = Array.isArray(method.weight_tiers)
      ? [...method.weight_tiers].sort((a, b) => safeNum(a.max_weight_g, 0) - safeNum(b.max_weight_g, 0))
      : [];
    const matched = tiers.find(t => orderWeightG <= safeNum(t.max_weight_g, Infinity));
    cost = matched ? safeNum(matched.price, 0) : (tiers.length > 0 ? safeNum(tiers[tiers.length - 1].price, 0) : 0);
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
