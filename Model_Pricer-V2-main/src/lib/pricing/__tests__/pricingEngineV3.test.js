import { describe, it, expect } from 'vitest';
import { calculateOrderQuote, evaluateConditions } from '@/lib/pricing/pricingEngineV3.js';

// ---------------------------------------------------------------------------
// Helpers — build minimal valid inputs for calculateOrderQuote
// ---------------------------------------------------------------------------

function makeFile({
  id = 'file-0',
  name = 'test.stl',
  status = 'done',
  estimatedTimeSeconds = 3600,
  filamentGrams = 50,
  volumeMm3 = 5000,
  surfaceMm2 = null,
} = {}) {
  return {
    id,
    name,
    status,
    result: {
      metrics: {
        estimatedTimeSeconds,
        filamentGrams,
        ...(surfaceMm2 != null ? { surfaceMm2 } : {}),
      },
      modelInfo: {
        volumeMm3,
        sizeMm: { x: 20, y: 20, z: 20 },
        ...(surfaceMm2 != null ? { surfaceMm2 } : {}),
      },
    },
  };
}

function makePricingConfig({
  ratePerHour = 120,
  materials = [{ key: 'pla', price_per_gram: 0.5, enabled: true }],
  minimumBilledMinutes = 0,
  minimumPricePerModel = 0,
  minimumOrderTotal = 0,
  rounding = { enabled: false },
  markup = { enabled: false, mode: 'off' },
  volumeDiscounts = null,
} = {}) {
  return {
    rate_per_hour: ratePerHour,
    materials,
    minimum_billed_minutes: minimumBilledMinutes,
    minimum_price_per_model: minimumPricePerModel,
    minimum_order_total: minimumOrderTotal,
    rounding,
    markup,
    ...(volumeDiscounts ? { volume_discounts: volumeDiscounts } : {}),
  };
}

function makeFeesConfig(fees = []) {
  return { fees };
}

function makeFee({
  id = 'fee-1',
  name = 'Test Fee',
  scope = 'MODEL',
  type = 'flat',
  value = 10,
  active = true,
  required = true,
  selectable = false,
  conditions = [],
  charge_basis = 'PER_FILE',
  apply_to_selected_models_enabled = false,
} = {}) {
  return {
    id,
    name,
    scope,
    type,
    value,
    active,
    required,
    selectable,
    conditions,
    charge_basis,
    apply_to_selected_models_enabled,
  };
}

function basicQuote(overrides = {}) {
  const files = overrides.uploadedFiles || [makeFile()];
  const configs = overrides.printConfigs || { 'file-0': { material: 'pla', quantity: 1 } };
  return calculateOrderQuote({
    uploadedFiles: files,
    printConfigs: configs,
    pricingConfig: overrides.pricingConfig || makePricingConfig(),
    feesConfig: overrides.feesConfig || makeFeesConfig(),
    feeSelections: overrides.feeSelections || {},
    ...overrides,
  });
}

// ===========================================================================
// 1. evaluateConditions
// ===========================================================================

describe('evaluateConditions', () => {
  it('returns true when no conditions are provided', () => {
    expect(evaluateConditions([], {})).toBe(true);
    expect(evaluateConditions(null, {})).toBe(true);
    expect(evaluateConditions(undefined, {})).toBe(true);
  });

  it('evaluates simple equality (eq)', () => {
    const cond = [{ key: 'material', op: 'eq', value: 'pla' }];
    expect(evaluateConditions(cond, { material: 'pla' })).toBe(true);
    expect(evaluateConditions(cond, { material: 'abs' })).toBe(false);
  });

  it('evaluates case-insensitive string equality', () => {
    const cond = [{ key: 'material', op: 'eq', value: 'PLA' }];
    expect(evaluateConditions(cond, { material: 'pla' })).toBe(true);
  });

  it('evaluates neq operator', () => {
    const cond = [{ key: 'material', op: 'neq', value: 'pla' }];
    expect(evaluateConditions(cond, { material: 'abs' })).toBe(true);
    expect(evaluateConditions(cond, { material: 'pla' })).toBe(false);
  });

  it('evaluates numeric gt / gte / lt / lte', () => {
    expect(evaluateConditions([{ key: 'grams', op: 'gt', value: 10 }], { grams: 20 })).toBe(true);
    expect(evaluateConditions([{ key: 'grams', op: 'gt', value: 10 }], { grams: 5 })).toBe(false);

    expect(evaluateConditions([{ key: 'grams', op: 'gte', value: 10 }], { grams: 10 })).toBe(true);
    expect(evaluateConditions([{ key: 'grams', op: 'lt', value: 10 }], { grams: 5 })).toBe(true);
    expect(evaluateConditions([{ key: 'grams', op: 'lte', value: 10 }], { grams: 10 })).toBe(true);
  });

  it('evaluates contains operator', () => {
    const cond = [{ key: 'material', op: 'contains', value: 'la' }];
    expect(evaluateConditions(cond, { material: 'pla' })).toBe(true);
    expect(evaluateConditions(cond, { material: 'abs' })).toBe(false);
  });

  it('supports legacy operator aliases (=, !=, >, >=, <, <=)', () => {
    expect(evaluateConditions([{ key: 'x', op: '=', value: 5 }], { x: 5 })).toBe(true);
    expect(evaluateConditions([{ key: 'x', op: '!=', value: 5 }], { x: 3 })).toBe(true);
    expect(evaluateConditions([{ key: 'x', op: '>', value: 5 }], { x: 10 })).toBe(true);
    expect(evaluateConditions([{ key: 'x', op: '>=', value: 5 }], { x: 5 })).toBe(true);
    expect(evaluateConditions([{ key: 'x', op: '<', value: 5 }], { x: 3 })).toBe(true);
    expect(evaluateConditions([{ key: 'x', op: '<=', value: 5 }], { x: 5 })).toBe(true);
  });

  it('AND-combines multiple conditions (all must match)', () => {
    const cond = [
      { key: 'material', op: 'eq', value: 'pla' },
      { key: 'grams', op: 'gt', value: 10 },
    ];
    expect(evaluateConditions(cond, { material: 'pla', grams: 20 })).toBe(true);
    expect(evaluateConditions(cond, { material: 'pla', grams: 5 })).toBe(false);
    expect(evaluateConditions(cond, { material: 'abs', grams: 20 })).toBe(false);
  });

  it('handles boolean condition values (loose parsing)', () => {
    const cond = [{ key: 'supports_enabled', op: 'eq', value: true }];
    expect(evaluateConditions(cond, { supports_enabled: true })).toBe(true);
    expect(evaluateConditions(cond, { supports_enabled: 'true' })).toBe(true);
    expect(evaluateConditions(cond, { supports_enabled: false })).toBe(false);
  });

  it('returns false for unknown operator', () => {
    expect(evaluateConditions([{ key: 'x', op: 'UNKNOWN', value: 5 }], { x: 5 })).toBe(false);
  });
});

// ===========================================================================
// 2. Basic price calculation
// ===========================================================================

describe('calculateOrderQuote — basic calculation', () => {
  it('calculates base price from material cost + time cost', () => {
    // 50g * 0.5 CZK/g = 25 CZK material
    // 3600s => 60 min, rate 120/hr => 60 * (120/60) = 120 CZK time
    // total base = 145
    const result = basicQuote();
    expect(result.models).toHaveLength(1);

    const model = result.models[0];
    expect(model.base.materialCostPerPiece).toBeCloseTo(25);
    expect(model.base.timeCostPerPiece).toBeCloseTo(120);
    expect(model.base.basePerPiece).toBeCloseTo(145);
    expect(model.base.baseTotal).toBeCloseTo(145);
    expect(result.total).toBeCloseTo(145);
  });

  it('multiplies by quantity', () => {
    const result = basicQuote({
      printConfigs: { 'file-0': { material: 'pla', quantity: 3 } },
    });
    const model = result.models[0];
    expect(model.quantity).toBe(3);
    expect(model.base.baseTotal).toBeCloseTo(145 * 3);
    expect(result.total).toBeCloseTo(145 * 3);
  });

  it('returns currency field', () => {
    const result = basicQuote();
    expect(result.currency).toBe('CZK');
  });

  it('returns totals breakdown', () => {
    const result = basicQuote();
    expect(result.totals).toBeDefined();
    expect(result.totals.material).toBeCloseTo(25);
    expect(result.totals.time).toBeCloseTo(120);
  });

  it('returns simple breakdown (material, time, services, discount, markup)', () => {
    const result = basicQuote();
    expect(result.simple).toBeDefined();
    expect(result.simple.material).toBeCloseTo(25);
    expect(result.simple.time).toBeCloseTo(120);
    expect(result.simple.services).toBe(0);
    expect(result.simple.discount).toBe(0);
    expect(result.simple.markup).toBe(0);
  });
});

// ===========================================================================
// 3. Fee application (MODEL fees)
// ===========================================================================

describe('calculateOrderQuote — MODEL fees', () => {
  it('applies a flat MODEL fee', () => {
    const result = basicQuote({
      feesConfig: makeFeesConfig([
        makeFee({ id: 'f1', value: 20, type: 'flat', scope: 'MODEL' }),
      ]),
    });
    const model = result.models[0];
    const appliedFee = model.fees.find((f) => f.id === 'f1');
    expect(appliedFee.applied).toBe(true);
    expect(appliedFee.amount).toBe(20);
    // 145 base + 20 fee = 165
    expect(result.total).toBeCloseTo(165);
  });

  it('applies a percent MODEL fee (based on basePerPiece + non-percent fees)', () => {
    const result = basicQuote({
      feesConfig: makeFeesConfig([
        makeFee({ id: 'f1', value: 10, type: 'percent', scope: 'MODEL' }),
      ]),
    });
    // percent base = basePerPiece (145) + 0 non-percent = 145
    // 10% of 145 = 14.5
    const appliedFee = result.models[0].fees.find((f) => f.id === 'f1');
    expect(appliedFee.applied).toBe(true);
    expect(appliedFee.amount).toBeCloseTo(14.5);
    expect(result.total).toBeCloseTo(145 + 14.5);
  });

  it('applies per_gram MODEL fee', () => {
    const result = basicQuote({
      feesConfig: makeFeesConfig([
        makeFee({ id: 'f1', value: 0.2, type: 'per_gram', scope: 'MODEL' }),
      ]),
    });
    // 50g * 0.2 = 10
    const fee = result.models[0].fees.find((f) => f.id === 'f1');
    expect(fee.applied).toBe(true);
    expect(fee.amount).toBeCloseTo(10);
  });

  it('applies per_minute MODEL fee', () => {
    const result = basicQuote({
      feesConfig: makeFeesConfig([
        makeFee({ id: 'f1', value: 0.5, type: 'per_minute', scope: 'MODEL' }),
      ]),
    });
    // 60 min * 0.5 = 30
    const fee = result.models[0].fees.find((f) => f.id === 'f1');
    expect(fee.applied).toBe(true);
    expect(fee.amount).toBeCloseTo(30);
  });

  it('applies per_cm3 MODEL fee', () => {
    const result = basicQuote({
      feesConfig: makeFeesConfig([
        makeFee({ id: 'f1', value: 2, type: 'per_cm3', scope: 'MODEL' }),
      ]),
    });
    // 5000 mm3 / 1000 = 5 cm3, * 2 = 10
    const fee = result.models[0].fees.find((f) => f.id === 'f1');
    expect(fee.applied).toBe(true);
    expect(fee.amount).toBeCloseTo(10);
  });

  it('does not apply inactive fee', () => {
    const result = basicQuote({
      feesConfig: makeFeesConfig([
        makeFee({ id: 'f1', value: 100, active: false }),
      ]),
    });
    expect(result.total).toBeCloseTo(145);
  });

  it('does not apply selectable fee that is not selected', () => {
    const result = basicQuote({
      feesConfig: makeFeesConfig([
        makeFee({ id: 'f1', value: 100, selectable: true, required: false }),
      ]),
      feeSelections: { selectedFeeIds: new Set() },
    });
    const fee = result.models[0].fees.find((f) => f.id === 'f1');
    expect(fee.applied).toBe(false);
  });

  it('applies selectable fee when selected', () => {
    const result = basicQuote({
      feesConfig: makeFeesConfig([
        makeFee({ id: 'f1', value: 15, selectable: true, required: false }),
      ]),
      feeSelections: { selectedFeeIds: new Set(['f1']) },
    });
    const fee = result.models[0].fees.find((f) => f.id === 'f1');
    expect(fee.applied).toBe(true);
    expect(fee.amount).toBe(15);
  });

  it('applies PER_PIECE charge basis (amount * quantity)', () => {
    const result = basicQuote({
      printConfigs: { 'file-0': { material: 'pla', quantity: 3 } },
      feesConfig: makeFeesConfig([
        makeFee({ id: 'f1', value: 10, type: 'flat', charge_basis: 'PER_PIECE' }),
      ]),
    });
    const fee = result.models[0].fees.find((f) => f.id === 'f1');
    expect(fee.applied).toBe(true);
    // 10 per piece * 3 = 30
    expect(fee.amount).toBe(30);
  });

  it('skips per_cm2 fee when surface data is unavailable', () => {
    // Default makeFile has no surfaceMm2
    const result = basicQuote({
      feesConfig: makeFeesConfig([
        makeFee({ id: 'f1', value: 0.1, type: 'per_cm2', scope: 'MODEL' }),
      ]),
    });
    const fee = result.models[0].fees.find((f) => f.id === 'f1');
    expect(fee.applied).toBe(false);
    expect(fee.reason.surface_unavailable).toBe(true);
  });

  it('applies per_cm2 fee when surface data is available', () => {
    const result = basicQuote({
      uploadedFiles: [makeFile({ surfaceMm2: 5000 })],
      feesConfig: makeFeesConfig([
        makeFee({ id: 'f1', value: 0.1, type: 'per_cm2', scope: 'MODEL' }),
      ]),
    });
    const fee = result.models[0].fees.find((f) => f.id === 'f1');
    expect(fee.applied).toBe(true);
    // 5000 mm2 / 100 = 50 cm2 * 0.1 = 5
    expect(fee.amount).toBeCloseTo(5);
  });
});

// ===========================================================================
// 4. ORDER fees
// ===========================================================================

describe('calculateOrderQuote — ORDER fees', () => {
  it('applies a flat ORDER fee', () => {
    const result = basicQuote({
      feesConfig: makeFeesConfig([
        makeFee({ id: 'of1', value: 50, type: 'flat', scope: 'ORDER' }),
      ]),
    });
    const orderFee = result.orderFees.find((f) => f.id === 'of1');
    expect(orderFee.applied).toBe(true);
    expect(orderFee.amount).toBe(50);
    // 145 base + 50 order fee = 195
    expect(result.total).toBeCloseTo(195);
  });

  it('applies per_gram ORDER fee aggregated across models', () => {
    const files = [
      makeFile({ id: 'a', filamentGrams: 30 }),
      makeFile({ id: 'b', filamentGrams: 20 }),
    ];
    const result = basicQuote({
      uploadedFiles: files,
      printConfigs: {
        a: { material: 'pla', quantity: 1 },
        b: { material: 'pla', quantity: 1 },
      },
      feesConfig: makeFeesConfig([
        makeFee({ id: 'of1', value: 0.5, type: 'per_gram', scope: 'ORDER' }),
      ]),
    });
    // total grams = 30 + 20 = 50; 50 * 0.5 = 25
    const orderFee = result.orderFees.find((f) => f.id === 'of1');
    expect(orderFee.applied).toBe(true);
    expect(orderFee.amount).toBeCloseTo(25);
  });

  it('applies percent ORDER fee based on models total + non-percent order fees', () => {
    const result = basicQuote({
      feesConfig: makeFeesConfig([
        makeFee({ id: 'of1', value: 30, type: 'flat', scope: 'ORDER' }),
        makeFee({ id: 'of2', value: 10, type: 'percent', scope: 'ORDER' }),
      ]),
    });
    // models total = 145, flat order fee = 30 => percent base = 175
    // 10% of 175 = 17.5
    const pctFee = result.orderFees.find((f) => f.id === 'of2');
    expect(pctFee.applied).toBe(true);
    expect(pctFee.amount).toBeCloseTo(17.5);
  });
});

// ===========================================================================
// 5. Markup
// ===========================================================================

describe('calculateOrderQuote — markup', () => {
  it('applies flat markup', () => {
    const result = basicQuote({
      pricingConfig: makePricingConfig({
        markup: { enabled: true, mode: 'flat', value: 50 },
      }),
    });
    expect(result.totals.markupAmount).toBeCloseTo(50);
    expect(result.total).toBeCloseTo(145 + 50);
  });

  it('applies percent markup', () => {
    const result = basicQuote({
      pricingConfig: makePricingConfig({
        markup: { enabled: true, mode: 'percent', value: 20 },
      }),
    });
    // 20% of 145 = 29
    expect(result.totals.markupAmount).toBeCloseTo(29);
    expect(result.total).toBeCloseTo(145 + 29);
  });

  it('applies min_flat markup (raises subtotal to minimum)', () => {
    const result = basicQuote({
      pricingConfig: makePricingConfig({
        markup: { enabled: true, mode: 'min_flat', value: 200, min_flat: 200 },
      }),
    });
    // subtotal = 145, min_flat target = 200 => markup = 55
    expect(result.totals.markupAmount).toBeCloseTo(55);
    expect(result.total).toBeCloseTo(200);
  });

  it('min_flat markup is zero when subtotal already exceeds target', () => {
    const result = basicQuote({
      pricingConfig: makePricingConfig({
        markup: { enabled: true, mode: 'min_flat', value: 100, min_flat: 100 },
      }),
    });
    // subtotal 145 > 100 => no markup
    expect(result.totals.markupAmount).toBe(0);
    expect(result.total).toBeCloseTo(145);
  });

  it('does not apply markup when disabled', () => {
    const result = basicQuote({
      pricingConfig: makePricingConfig({
        markup: { enabled: false, mode: 'percent', value: 50 },
      }),
    });
    expect(result.totals.markupAmount).toBe(0);
  });
});

// ===========================================================================
// 6. Minimum price enforcement
// ===========================================================================

describe('calculateOrderQuote — minimum prices', () => {
  it('enforces minimum_price_per_model', () => {
    const result = basicQuote({
      pricingConfig: makePricingConfig({ minimumPricePerModel: 200 }),
    });
    // base 145 < min 200 => raised to 200
    const model = result.models[0];
    expect(model.flags.min_price_per_model_applied).toBe(true);
    expect(model.totals.subtotalAfterMin).toBe(200);
    expect(result.total).toBeCloseTo(200);
  });

  it('does not enforce min per model when base exceeds it', () => {
    const result = basicQuote({
      pricingConfig: makePricingConfig({ minimumPricePerModel: 100 }),
    });
    expect(result.models[0].flags.min_price_per_model_applied).toBe(false);
    expect(result.total).toBeCloseTo(145);
  });

  it('enforces minimum_order_total', () => {
    const result = basicQuote({
      pricingConfig: makePricingConfig({ minimumOrderTotal: 300 }),
    });
    expect(result.flags.min_order_total_applied).toBe(true);
    expect(result.total).toBeCloseTo(300);
  });

  it('does not enforce min order total when total exceeds it', () => {
    const result = basicQuote({
      pricingConfig: makePricingConfig({ minimumOrderTotal: 50 }),
    });
    expect(result.flags.min_order_total_applied).toBe(false);
    expect(result.total).toBeCloseTo(145);
  });

  it('enforces minimum_billed_minutes', () => {
    // File has 3600s = 60 min. Set min to 120 min.
    const result = basicQuote({
      pricingConfig: makePricingConfig({ minimumBilledMinutes: 120 }),
    });
    const model = result.models[0];
    // billed minutes = max(60, 120) = 120
    expect(model.base.billedMinutes).toBe(120);
    // time cost = 120 * (120/60) = 240
    expect(model.base.timeCostPerPiece).toBeCloseTo(240);
  });
});

// ===========================================================================
// 7. Rounding
// ===========================================================================

describe('calculateOrderQuote — rounding', () => {
  it('rounds to nearest step (final)', () => {
    const result = basicQuote({
      pricingConfig: makePricingConfig({
        rounding: { enabled: true, step: 10, mode: 'nearest', smart_rounding_enabled: true },
      }),
    });
    // 145 rounded to nearest 10 = 150
    expect(result.total).toBe(150);
    expect(result.flags.rounding_final_applied).toBe(true);
  });

  it('rounds up to step', () => {
    const result = basicQuote({
      pricingConfig: makePricingConfig({
        rounding: { enabled: true, step: 10, mode: 'up', smart_rounding_enabled: true },
      }),
    });
    // 145 rounded up to 10 = 150
    expect(result.total).toBe(150);
  });

  it('does not round when rounding disabled', () => {
    const result = basicQuote({
      pricingConfig: makePricingConfig({
        rounding: { enabled: false, step: 10, mode: 'nearest' },
      }),
    });
    expect(result.total).toBeCloseTo(145);
    expect(result.flags.rounding_final_applied).toBe(false);
  });

  it('applies per-model rounding when smart_rounding disabled', () => {
    const result = basicQuote({
      pricingConfig: makePricingConfig({
        rounding: { enabled: true, step: 10, mode: 'nearest', smart_rounding_enabled: false },
      }),
    });
    const model = result.models[0];
    expect(model.flags.rounding_per_model_applied).toBe(true);
    // 145 rounded to nearest 10 = 150 per model, then also final rounding
    expect(model.totals.subtotalAfterPerModelRounding).toBe(150);
  });
});

// ===========================================================================
// 8. Volume discounts
// ===========================================================================

describe('calculateOrderQuote — volume discounts', () => {
  const volumeTiers = [
    { min_qty: 1, value: 0, label: 'none' },
    { min_qty: 5, value: 10, label: '10% off' },
    { min_qty: 10, value: 20, label: '20% off' },
  ];

  it('applies percent volume discount per_model scope', () => {
    const result = basicQuote({
      printConfigs: { 'file-0': { material: 'pla', quantity: 5 } },
      pricingConfig: makePricingConfig({
        volumeDiscounts: {
          enabled: true,
          mode: 'percent',
          scope: 'per_model',
          tiers: volumeTiers,
        },
      }),
    });
    expect(result.flags.volume_discount_applied).toBe(true);
    // base per piece = 145, subtotal = 145*5 = 725
    // tier: min_qty 5 => 10% discount
    // per piece discount = 145 * 0.10 = 14.5, total savings = 14.5 * 5 = 72.5
    expect(result.volumeDiscount.totalSavings).toBeCloseTo(72.5);
    expect(result.total).toBeCloseTo(725 - 72.5);
  });

  it('does not apply volume discount when quantity below all tiers', () => {
    // Tiers start at min_qty 1 with value 0, so technically it matches but saves 0
    const result = basicQuote({
      printConfigs: { 'file-0': { material: 'pla', quantity: 1 } },
      pricingConfig: makePricingConfig({
        volumeDiscounts: {
          enabled: true,
          mode: 'percent',
          scope: 'per_model',
          tiers: [{ min_qty: 5, value: 10 }],
        },
      }),
    });
    expect(result.volumeDiscount.totalSavings).toBe(0);
  });

  it('uses per_order scope (sum of all model quantities)', () => {
    const files = [
      makeFile({ id: 'a', filamentGrams: 50, estimatedTimeSeconds: 3600 }),
      makeFile({ id: 'b', filamentGrams: 50, estimatedTimeSeconds: 3600 }),
    ];
    const result = basicQuote({
      uploadedFiles: files,
      printConfigs: {
        a: { material: 'pla', quantity: 3 },
        b: { material: 'pla', quantity: 3 },
      },
      pricingConfig: makePricingConfig({
        volumeDiscounts: {
          enabled: true,
          mode: 'percent',
          scope: 'per_order',
          tiers: [{ min_qty: 5, value: 15 }],
        },
      }),
    });
    // total order qty = 3 + 3 = 6 >= 5 => 15% off each
    expect(result.flags.volume_discount_applied).toBe(true);
    expect(result.volumeDiscount.totalSavings).toBeGreaterThan(0);
  });

  it('does not apply volume discount when disabled', () => {
    const result = basicQuote({
      printConfigs: { 'file-0': { material: 'pla', quantity: 10 } },
      pricingConfig: makePricingConfig({
        volumeDiscounts: {
          enabled: false,
          mode: 'percent',
          scope: 'per_model',
          tiers: volumeTiers,
        },
      }),
    });
    expect(result.volumeDiscount).toBeNull();
  });

  it('applies fixed_price volume discount', () => {
    const result = basicQuote({
      printConfigs: { 'file-0': { material: 'pla', quantity: 10 } },
      pricingConfig: makePricingConfig({
        volumeDiscounts: {
          enabled: true,
          mode: 'fixed_price',
          scope: 'per_model',
          tiers: [{ min_qty: 10, value: 100 }],
        },
      }),
    });
    // base per piece = 145, fixed price = 100 => savings per piece = 45, total savings = 45*10 = 450
    expect(result.volumeDiscount.totalSavings).toBeCloseTo(450);
  });
});

// ===========================================================================
// 9. Empty / null / undefined input handling
// ===========================================================================

describe('calculateOrderQuote — defensive input handling', () => {
  it('handles empty uploadedFiles array', () => {
    const result = calculateOrderQuote({
      uploadedFiles: [],
      printConfigs: {},
      pricingConfig: makePricingConfig(),
      feesConfig: makeFeesConfig(),
    });
    expect(result.models).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.grandTotal).toBe(0);
  });

  it('handles null uploadedFiles', () => {
    const result = calculateOrderQuote({
      uploadedFiles: null,
      printConfigs: {},
      pricingConfig: makePricingConfig(),
      feesConfig: makeFeesConfig(),
    });
    expect(result.models).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('handles undefined pricingConfig', () => {
    const result = calculateOrderQuote({
      uploadedFiles: [makeFile()],
      printConfigs: { 'file-0': { material: 'pla', quantity: 1 } },
      pricingConfig: undefined,
      feesConfig: makeFeesConfig(),
    });
    // No pricing config => rate_per_hour = 0, material price = 0 => total = 0
    expect(result.total).toBe(0);
  });

  it('handles undefined feesConfig', () => {
    const result = calculateOrderQuote({
      uploadedFiles: [makeFile()],
      printConfigs: { 'file-0': { material: 'pla', quantity: 1 } },
      pricingConfig: makePricingConfig(),
      feesConfig: undefined,
    });
    expect(result.total).toBeCloseTo(145);
  });

  it('handles missing printConfigs for a file (defaults)', () => {
    const result = calculateOrderQuote({
      uploadedFiles: [makeFile()],
      printConfigs: {},
      pricingConfig: makePricingConfig(),
      feesConfig: makeFeesConfig(),
    });
    // quantity defaults to 1, material defaults to pla
    expect(result.models[0].quantity).toBe(1);
    expect(result.total).toBeCloseTo(145);
  });

  it('handles file with no result/metrics', () => {
    const bareFile = { id: 'bare', name: 'empty.stl' };
    const result = calculateOrderQuote({
      uploadedFiles: [bareFile],
      printConfigs: { bare: { material: 'pla', quantity: 1 } },
      pricingConfig: makePricingConfig(),
      feesConfig: makeFeesConfig(),
    });
    // No metrics => 0g, 0s => 0 cost
    expect(result.models[0].base.materialCostPerPiece).toBe(0);
    expect(result.models[0].base.timeCostPerPiece).toBe(0);
    expect(result.total).toBe(0);
  });
});

// ===========================================================================
// 10. NaN prevention
// ===========================================================================

describe('calculateOrderQuote — NaN prevention', () => {
  it('handles NaN in filamentGrams', () => {
    const file = makeFile();
    file.result.metrics.filamentGrams = NaN;
    const result = basicQuote({ uploadedFiles: [file] });
    expect(Number.isFinite(result.total)).toBe(true);
    expect(result.models[0].base.materialCostPerPiece).toBe(0);
  });

  it('handles string values in metrics', () => {
    const file = makeFile();
    file.result.metrics.filamentGrams = 'not_a_number';
    file.result.metrics.estimatedTimeSeconds = 'bad';
    const result = basicQuote({ uploadedFiles: [file] });
    expect(Number.isFinite(result.total)).toBe(true);
    expect(result.total).toBe(0);
  });

  it('handles negative quantity (clamps to 1)', () => {
    const result = basicQuote({
      printConfigs: { 'file-0': { material: 'pla', quantity: -5 } },
    });
    expect(result.models[0].quantity).toBe(1);
  });

  it('handles Infinity in rate_per_hour', () => {
    const result = basicQuote({
      pricingConfig: makePricingConfig({ ratePerHour: Infinity }),
    });
    // safeNum / clampMin0 should handle Infinity => treated as not finite => 0
    expect(Number.isFinite(result.total)).toBe(true);
  });

  it('total is never NaN', () => {
    const result = calculateOrderQuote({
      uploadedFiles: [makeFile()],
      printConfigs: { 'file-0': { material: 'pla', quantity: NaN } },
      pricingConfig: { rate_per_hour: NaN, materials: [{ key: 'pla', price_per_gram: NaN }] },
      feesConfig: { fees: [{ id: 'x', scope: 'MODEL', type: 'flat', value: NaN, active: true, required: true }] },
    });
    expect(Number.isNaN(result.total)).toBe(false);
    expect(Number.isFinite(result.total)).toBe(true);
  });
});

// ===========================================================================
// 11. Multiple models
// ===========================================================================

describe('calculateOrderQuote — multiple models', () => {
  it('calculates totals across multiple files', () => {
    const files = [
      makeFile({ id: 'a', filamentGrams: 30, estimatedTimeSeconds: 1800 }),
      makeFile({ id: 'b', filamentGrams: 70, estimatedTimeSeconds: 7200 }),
    ];
    const result = basicQuote({
      uploadedFiles: files,
      printConfigs: {
        a: { material: 'pla', quantity: 1 },
        b: { material: 'pla', quantity: 2 },
      },
    });
    expect(result.models).toHaveLength(2);

    // Model A: 30*0.5 + 30*(120/60) = 15 + 60 = 75
    const mA = result.models[0];
    expect(mA.base.materialCostPerPiece).toBeCloseTo(15);
    expect(mA.base.timeCostPerPiece).toBeCloseTo(60);
    expect(mA.base.baseTotal).toBeCloseTo(75);

    // Model B: 70*0.5 + 120*(120/60) = 35 + 240 = 275 per piece, * 2 = 550
    const mB = result.models[1];
    expect(mB.base.materialCostPerPiece).toBeCloseTo(35);
    expect(mB.base.timeCostPerPiece).toBeCloseTo(240);
    expect(mB.base.baseTotal).toBeCloseTo(550);

    // Total: 75 + 550 = 625
    expect(result.total).toBeCloseTo(625);
  });

  it('uses correct material for each model', () => {
    const files = [
      makeFile({ id: 'a', filamentGrams: 100 }),
      makeFile({ id: 'b', filamentGrams: 100 }),
    ];
    const pc = makePricingConfig({
      materials: [
        { key: 'pla', price_per_gram: 0.5, enabled: true },
        { key: 'abs', price_per_gram: 1.0, enabled: true },
      ],
    });
    const result = basicQuote({
      uploadedFiles: files,
      printConfigs: {
        a: { material: 'pla', quantity: 1 },
        b: { material: 'abs', quantity: 1 },
      },
      pricingConfig: pc,
    });
    expect(result.models[0].base.pricePerGram).toBeCloseTo(0.5);
    expect(result.models[1].base.pricePerGram).toBeCloseTo(1.0);
    // material cost: a=50, b=100
    expect(result.models[0].base.materialCostPerPiece).toBeCloseTo(50);
    expect(result.models[1].base.materialCostPerPiece).toBeCloseTo(100);
  });
});

// ===========================================================================
// 12. Edge cases
// ===========================================================================

describe('calculateOrderQuote — edge cases', () => {
  it('handles zero weight (0g filament)', () => {
    const file = makeFile({ filamentGrams: 0, estimatedTimeSeconds: 3600 });
    const result = basicQuote({ uploadedFiles: [file] });
    expect(result.models[0].base.materialCostPerPiece).toBe(0);
    // time cost still applies
    expect(result.models[0].base.timeCostPerPiece).toBeCloseTo(120);
    expect(result.total).toBeCloseTo(120);
  });

  it('handles zero time (0s estimated)', () => {
    const file = makeFile({ filamentGrams: 50, estimatedTimeSeconds: 0 });
    const result = basicQuote({ uploadedFiles: [file] });
    expect(result.models[0].base.timeCostPerPiece).toBe(0);
    expect(result.models[0].base.materialCostPerPiece).toBeCloseTo(25);
    expect(result.total).toBeCloseTo(25);
  });

  it('handles very large values without overflow', () => {
    const file = makeFile({ filamentGrams: 1e6, estimatedTimeSeconds: 1e7 });
    const result = basicQuote({ uploadedFiles: [file] });
    expect(Number.isFinite(result.total)).toBe(true);
    expect(result.total).toBeGreaterThan(0);
  });

  it('total is never negative (clamped to zero)', () => {
    // Large negative discount via negative fee won't exist in practice, but volume discounts could push below 0
    // Use fixed_price volume discount set to 0 to try to get negative total
    const result = basicQuote({
      printConfigs: { 'file-0': { material: 'pla', quantity: 5 } },
      pricingConfig: makePricingConfig({
        volumeDiscounts: {
          enabled: true,
          mode: 'fixed_price',
          scope: 'per_model',
          tiers: [{ min_qty: 1, value: 0 }],
        },
      }),
    });
    expect(result.total).toBeGreaterThanOrEqual(0);
  });

  it('grandTotal includes shipping', () => {
    const result = basicQuote({
      shippingConfig: {
        enabled: true,
        methods: [{ id: 'std', name: 'Standard', type: 'FIXED', price: 99, active: true }],
      },
      selectedShippingMethodId: 'std',
    });
    expect(result.grandTotal).toBeCloseTo(145 + 99);
    expect(result.shipping.cost).toBe(99);
  });

  it('handles unknown material key (falls back to 0 price_per_gram)', () => {
    const result = basicQuote({
      printConfigs: { 'file-0': { material: 'unknown_material', quantity: 1 } },
    });
    expect(result.models[0].base.pricePerGram).toBe(0);
    expect(result.models[0].base.materialCostPerPiece).toBe(0);
  });

  it('handles file without id (generates file-N id)', () => {
    const file = { name: 'test.stl', result: { metrics: { filamentGrams: 50, estimatedTimeSeconds: 3600 }, modelInfo: { volumeMm3: 5000 } } };
    const result = calculateOrderQuote({
      uploadedFiles: [file],
      printConfigs: { 'file-0': { material: 'pla', quantity: 1 } },
      pricingConfig: makePricingConfig(),
      feesConfig: makeFeesConfig(),
    });
    expect(result.models[0].id).toBe('file-0');
  });
});

// ===========================================================================
// 13. Express surcharge
// ===========================================================================

describe('calculateOrderQuote — express surcharge', () => {
  it('applies percent express surcharge', () => {
    const result = basicQuote({
      expressConfig: {
        enabled: true,
        tiers: [{ id: 'fast', surcharge_type: 'percent', surcharge_value: 50, active: true }],
      },
      selectedExpressTierId: 'fast',
    });
    // 50% of 145 = 72.5
    expect(result.flags.express_applied).toBe(true);
    expect(result.express.surchargeTotal).toBeCloseTo(72.5);
    expect(result.total).toBeCloseTo(145 + 72.5);
  });

  it('applies fixed express surcharge', () => {
    const result = basicQuote({
      expressConfig: {
        enabled: true,
        tiers: [{ id: 'fast', surcharge_type: 'fixed', surcharge_value: 100, active: true }],
      },
      selectedExpressTierId: 'fast',
    });
    expect(result.express.surchargeTotal).toBe(100);
  });

  it('does not apply express when not enabled', () => {
    const result = basicQuote({
      expressConfig: { enabled: false },
      selectedExpressTierId: 'fast',
    });
    expect(result.express).toBeNull();
  });
});

// ===========================================================================
// 14. Coupon discount
// ===========================================================================

describe('calculateOrderQuote — coupon discount', () => {
  it('applies percent coupon', () => {
    const result = basicQuote({
      couponsConfig: {
        enabled: true,
        coupons: [{ code: 'SAVE10', type: 'percent', value: 10, active: true }],
      },
      appliedCouponCode: 'SAVE10',
    });
    // 10% of 145 = 14.5
    expect(result.flags.coupon_applied).toBe(true);
    expect(result.coupon.discount).toBeCloseTo(14.5);
    expect(result.total).toBeCloseTo(145 - 14.5);
  });

  it('applies fixed coupon (capped at subtotal)', () => {
    const result = basicQuote({
      couponsConfig: {
        enabled: true,
        coupons: [{ code: 'FLAT200', type: 'fixed', value: 200, active: true }],
      },
      appliedCouponCode: 'FLAT200',
    });
    // fixed 200, but subtotal is 145, so capped at 145
    expect(result.coupon.discount).toBeCloseTo(145);
  });

  it('is case-insensitive for coupon code', () => {
    const result = basicQuote({
      couponsConfig: {
        enabled: true,
        coupons: [{ code: 'SAVE10', type: 'percent', value: 10, active: true }],
      },
      appliedCouponCode: 'save10',
    });
    expect(result.coupon).not.toBeNull();
    expect(result.coupon.code).toBe('SAVE10');
  });

  it('does not apply expired coupon', () => {
    const result = basicQuote({
      couponsConfig: {
        enabled: true,
        coupons: [{ code: 'OLD', type: 'percent', value: 50, active: true, expires_at: '2020-01-01' }],
      },
      appliedCouponCode: 'OLD',
    });
    expect(result.coupon).toBeNull();
    expect(result.flags.coupon_applied).toBe(false);
  });
});

// ===========================================================================
// 15. Shipping
// ===========================================================================

describe('calculateOrderQuote — shipping', () => {
  it('applies fixed shipping', () => {
    const result = basicQuote({
      shippingConfig: {
        enabled: true,
        methods: [{ id: 's1', name: 'Post', type: 'FIXED', price: 49, active: true }],
      },
      selectedShippingMethodId: 's1',
    });
    expect(result.shipping.cost).toBe(49);
    expect(result.grandTotal).toBeCloseTo(145 + 49);
  });

  it('pickup shipping is free', () => {
    const result = basicQuote({
      shippingConfig: {
        enabled: true,
        methods: [{ id: 's1', name: 'Pickup', type: 'PICKUP', active: true }],
      },
      selectedShippingMethodId: 's1',
    });
    expect(result.shipping.cost).toBe(0);
    expect(result.grandTotal).toBeCloseTo(145);
  });

  it('applies free shipping threshold', () => {
    const result = basicQuote({
      shippingConfig: {
        enabled: true,
        free_shipping_enabled: true,
        free_shipping_threshold: 100,
        methods: [{ id: 's1', name: 'Post', type: 'FIXED', price: 49, active: true }],
      },
      selectedShippingMethodId: 's1',
    });
    // total 145 >= threshold 100 => free shipping
    expect(result.shipping.freeShippingApplied).toBe(true);
    expect(result.shipping.cost).toBe(0);
    expect(result.flags.free_shipping_applied).toBe(true);
  });

  it('does not apply shipping when not enabled', () => {
    const result = basicQuote({
      shippingConfig: { enabled: false },
      selectedShippingMethodId: 's1',
    });
    expect(result.shipping).toBeNull();
  });
});

// ===========================================================================
// 16. Flags and metadata
// ===========================================================================

describe('calculateOrderQuote — flags', () => {
  it('returns all expected flags', () => {
    const result = basicQuote();
    const flags = result.flags;
    expect(flags).toHaveProperty('min_order_total_applied');
    expect(flags).toHaveProperty('rounding_final_applied');
    expect(flags).toHaveProperty('clamped_to_zero');
    expect(flags).toHaveProperty('volume_discount_applied');
    expect(flags).toHaveProperty('express_applied');
    expect(flags).toHaveProperty('coupon_applied');
    expect(flags).toHaveProperty('shipping_applied');
    expect(flags).toHaveProperty('free_shipping_applied');
  });

  it('returns model-level flags', () => {
    const result = basicQuote();
    const mFlags = result.models[0].flags;
    expect(mFlags).toHaveProperty('min_price_per_model_applied');
    expect(mFlags).toHaveProperty('rounding_per_model_applied');
  });
});

// ===========================================================================
// 17. Tenant pricing config normalization (nested tenant_pricing)
// ===========================================================================

describe('calculateOrderQuote — tenant_pricing normalization', () => {
  it('reads rate_per_hour from nested tenant_pricing', () => {
    const result = basicQuote({
      pricingConfig: {
        materials: [{ key: 'pla', price_per_gram: 0.5, enabled: true }],
        tenant_pricing: {
          rate_per_hour: 240,
        },
      },
    });
    // rate 240/hr => 60 min * (240/60) = 240 time cost
    // material: 50 * 0.5 = 25
    expect(result.models[0].base.ratePerHour).toBeCloseTo(240);
    expect(result.total).toBeCloseTo(25 + 240);
  });

  it('reads rounding config from nested tenant_pricing', () => {
    const result = basicQuote({
      pricingConfig: {
        rate_per_hour: 120,
        materials: [{ key: 'pla', price_per_gram: 0.5, enabled: true }],
        tenant_pricing: {
          rounding_enabled: true,
          rounding_step: 10,
          rounding_mode: 'up',
          smart_rounding_enabled: true,
        },
      },
    });
    // 145 rounded up to 10 = 150
    expect(result.total).toBe(150);
  });

  it('reads markup from nested tenant_pricing', () => {
    const result = basicQuote({
      pricingConfig: {
        rate_per_hour: 120,
        materials: [{ key: 'pla', price_per_gram: 0.5, enabled: true }],
        tenant_pricing: {
          markup_enabled: true,
          markup_mode: 'percent',
          markup_value: 10,
        },
      },
    });
    // 10% of 145 = 14.5
    expect(result.totals.markupAmount).toBeCloseTo(14.5);
  });
});

// ===========================================================================
// 18. Conditional MODEL fees
// ===========================================================================

describe('calculateOrderQuote — conditional fees', () => {
  it('applies fee only when condition matches', () => {
    const result = basicQuote({
      feesConfig: makeFeesConfig([
        makeFee({
          id: 'cond-fee',
          value: 20,
          conditions: [{ key: 'material', op: 'eq', value: 'abs' }],
        }),
      ]),
    });
    // Material is PLA, condition says ABS => not applied
    const fee = result.models[0].fees.find((f) => f.id === 'cond-fee');
    expect(fee.applied).toBe(false);
  });

  it('applies fee when material matches condition', () => {
    const result = basicQuote({
      printConfigs: { 'file-0': { material: 'abs', quantity: 1 } },
      pricingConfig: makePricingConfig({
        materials: [
          { key: 'pla', price_per_gram: 0.5, enabled: true },
          { key: 'abs', price_per_gram: 0.8, enabled: true },
        ],
      }),
      feesConfig: makeFeesConfig([
        makeFee({
          id: 'abs-fee',
          value: 30,
          conditions: [{ key: 'material', op: 'eq', value: 'abs' }],
        }),
      ]),
    });
    const fee = result.models[0].fees.find((f) => f.id === 'abs-fee');
    expect(fee.applied).toBe(true);
    expect(fee.amount).toBe(30);
  });
});
