// Pricing service used by the public calculator.
//
// CP3 (Tenant Storage Unification):
// - pricingService now reads PricingConfigV3 via tenant-scoped storage helpers.
// - Existing calculatePrice API is preserved for callers.

import {
  loadPricingConfigV3,
  normalizePricingConfigV3,
  normalizeMaterialKey as normalizeMaterialKeyStorage,
} from '../utils/adminPricingStorage';

const DEFAULT_MATERIAL_PRICES = {
  pla: 0.5,
  abs: 0.8,
  petg: 0.6,
  tpu: 1.2,
  wood: 1.5,
  carbon: 2.0,
};

const DEFAULT_RATE_PER_HOUR = 100;

const POST_PROCESSING_PRICES = {
  sanding: 50,
  painting: 100,
  assembly: 150,
  drilling: 80,
};

function clampMin0(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, num);
}

function roundToStep(value, step, mode) {
  if (!step || step <= 0) return value;
  const ratio = value / step;
  if (mode === 'up') return Math.ceil(ratio) * step;
  return Math.round(ratio) * step;
}

/**
 * Normalizes material keys for matching ("PLA" -> "pla", "PETG Black" -> "petg_black").
 * Exported for consistency across the app.
 */
export function normalizeMaterialKey(input) {
  return normalizeMaterialKeyStorage(input);
}

/**
 * Returns the price per gram for a material key, using V3 config as the source of truth.
 * Fallback order:
 * 1) pricingConfig.materials[].price_per_gram (match by key)
 * 2) pricingConfig.materialPrices map (legacy compatibility)
 * 3) DEFAULT_MATERIAL_PRICES
 */
export function getMaterialPricePerGram(pricingConfig, materialKey) {
  const key = normalizeMaterialKey(materialKey || 'pla');

  // V3 preferred
  const mats = Array.isArray(pricingConfig?.materials) ? pricingConfig.materials : [];
  const direct = mats.find((m) => normalizeMaterialKey(m?.key || m?.name) === key);
  if (direct && Number.isFinite(Number(direct.price_per_gram))) {
    return clampMin0(direct.price_per_gram);
  }

  // Legacy map fallback
  const map = pricingConfig?.materialPrices && typeof pricingConfig.materialPrices === 'object' ? pricingConfig.materialPrices : null;
  if (map && Number.isFinite(Number(map[key]))) {
    return clampMin0(map[key]);
  }

  // Defaults
  return clampMin0(DEFAULT_MATERIAL_PRICES[key] ?? DEFAULT_MATERIAL_PRICES.pla);
}

function resolvePricingConfigV3(overrides) {
  // Backward compatibility:
  // - Overrides might be already V3 ({schema_version:3,...})
  // - Or legacy ({materialPrices, tenant_pricing, ...})
  if (overrides && typeof overrides === 'object') {
    try {
      return normalizePricingConfigV3(overrides);
    } catch {
      // fallthrough
    }
  }
  return loadPricingConfigV3();
}

/**
 * @typedef {Object} PricingConfig
 * @property {string} material
 * @property {number} materialGrams
 * @property {number} printTimeSeconds
 * @property {number} quantity
 * @property {boolean} expressDelivery
 * @property {string[]} postProcessing
 */

/**
 * @typedef {Object} PricingResult
 * @property {number} total
 * @property {Object[]} breakdown
 * @property {boolean} [min_price_per_model_applied]
 * @property {boolean} [min_order_total_applied]
 */

/**
 * Calculates price using the requested order:
 * base -> fees -> markup -> minima -> rounding
 *
 * @param {PricingConfig} config
 * @param {Object} [overrides] Optional: PricingConfigV3 or legacy config shape
 * @returns {PricingResult}
 */
export function calculatePrice(config, overrides = undefined) {
  const qty = Math.max(1, Math.floor(clampMin0(config.quantity) || 1));
  const materialKey = normalizeMaterialKey(config.material || 'pla');

  const pricingCfg = resolvePricingConfigV3(overrides);

  const ratePerHour = clampMin0(pricingCfg.rate_per_hour ?? DEFAULT_RATE_PER_HOUR);

  // ----- BASE (per model)
  const pricePerGram = getMaterialPricePerGram(pricingCfg, materialKey);
  const grams = clampMin0(config.materialGrams);
  const baseMaterial = grams * pricePerGram;

  const timeSeconds = clampMin0(config.printTimeSeconds);
  const timeMinutes = timeSeconds / 60;
  const minBilled = clampMin0(pricingCfg.minimum_billed_minutes);
  const billedMinutes = minBilled > 0 ? Math.max(timeMinutes, minBilled) : timeMinutes;
  const billedHours = billedMinutes / 60;
  const baseTime = billedHours * ratePerHour;

  // ----- FEES (per model) – demo only (hardcoded)
  const postProcessingFee = (config.postProcessing || []).reduce((sum, id) => sum + clampMin0(POST_PROCESSING_PRICES[id] || 0), 0);

  // Express: keep previous behaviour (adds +50% of subtotal)
  const subtotalBeforeExpress = baseMaterial + baseTime + postProcessingFee;
  const expressFee = config.expressDelivery ? subtotalBeforeExpress * 0.5 : 0;

  const fees = postProcessingFee + expressFee;

  // ----- MARKUP (per model)
  let markup = 0;
  const markupCfg = pricingCfg?.markup && typeof pricingCfg.markup === 'object' ? pricingCfg.markup : null;
  if (markupCfg?.enabled) {
    const mode = markupCfg.mode || 'flat';
    const v = clampMin0(markupCfg.value);
    const basePlusFees = baseMaterial + baseTime + fees;

    if (mode === 'percent') {
      markup = basePlusFees * (v / 100);
    } else if (mode === 'min_flat') {
      // keep previous behaviour
      markup = Math.max(v, 0);
    } else {
      // flat
      markup = v;
    }
  }

  let perModel = baseMaterial + baseTime + fees + markup;

  // ----- MINIMA
  let minPriceApplied = false;
  const minPerModel = clampMin0(pricingCfg.minimum_price_per_model);
  if (minPerModel > 0 && perModel < minPerModel) {
    perModel = minPerModel;
    minPriceApplied = true;
  }

  let total = perModel * qty;

  let minOrderApplied = false;
  const minOrder = clampMin0(pricingCfg.minimum_order_total);
  if (minOrder > 0 && total < minOrder) {
    total = minOrder;
    minOrderApplied = true;
  }

  // ----- ROUNDING
  const roundingCfg = pricingCfg?.rounding && typeof pricingCfg.rounding === 'object' ? pricingCfg.rounding : null;
  if (roundingCfg?.enabled) {
    const step = clampMin0(roundingCfg.step) || 1;
    const mode = roundingCfg.mode === 'up' ? 'up' : 'nearest';

    if (roundingCfg.smart_rounding_enabled !== false) {
      total = roundToStep(total, step, mode);
    } else {
      perModel = roundToStep(perModel, step, mode);
      total = perModel * qty;

      if (minOrder > 0 && total < minOrder) total = minOrder;
    }
  }

  const breakdown = [
    { label: 'Materiál', amount: baseMaterial * qty },
    { label: 'Čas tisku', amount: baseTime * qty },
  ];

  if (postProcessingFee !== 0) breakdown.push({ label: 'Dodatečné služby', amount: postProcessingFee * qty });
  if (expressFee !== 0) breakdown.push({ label: 'Expres', amount: expressFee * qty });
  if (markup !== 0) breakdown.push({ label: 'Přirážka', amount: markup * qty });

  if (minPriceApplied) breakdown.push({ label: 'Minimum za model', amount: 0 });
  if (minOrderApplied) breakdown.push({ label: 'Minimum objednávky', amount: 0 });

  if (roundingCfg?.enabled) breakdown.push({ label: 'Zaokrouhlení', amount: 0 });

  return {
    total,
    breakdown,
    min_price_per_model_applied: minPriceApplied,
    min_order_total_applied: minOrderApplied,
  };
}

export function formatPrice(amount) {
  return `${Math.round(clampMin0(amount))} Kč`;
}

export function formatTime(seconds) {
  const s = Math.floor(clampMin0(seconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);

  if (hours == 0) return `${minutes} min`;
  return `${hours}h ${minutes}min`;
}
