import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mapQuoteToShopifyLines, buildCartNote } from '../shopifyCartMapper.js';

// ─── Mock adminEcommerceStorage ───────────────────────────────

vi.mock('../../../utils/adminEcommerceStorage', () => ({
  findVariantForConfig: vi.fn(),
}));

import { findVariantForConfig } from '../../../utils/adminEcommerceStorage';

// ─── Test fixtures ────────────────────────────────────────────

function makeModel({
  id = 'model-1',
  name = 'test-cube.stl',
  status = 'completed',
  quantity = 1,
  total = 150,
  material = 'PLA',
  quality = 'standard',
  filamentGrams = 25.5,
  fees = [],
} = {}) {
  return {
    id,
    name,
    status,
    quantity,
    total,
    config: { material, quality },
    base: { materialKey: material, filamentGrams },
    fees,
  };
}

function makeQuoteResult({
  models = [makeModel()],
  orderFees = [],
  grandTotal = 150,
  volumeDiscount = null,
} = {}) {
  return {
    models,
    orderFees,
    grandTotal,
    ...(volumeDiscount && { volumeDiscount }),
  };
}

beforeEach(() => {
  findVariantForConfig.mockReset();
});

// ═══════════════════════════════════════════════════════════════
// mapQuoteToShopifyLines — edge cases
// ═══════════════════════════════════════════════════════════════

describe('mapQuoteToShopifyLines — edge cases', () => {
  it('should return empty result with warning when quoteResult is null', () => {
    const result = mapQuoteToShopifyLines({ quoteResult: null });

    expect(result.lineItems).toEqual([]);
    expect(result.unmappedModels).toEqual([]);
    expect(result.warnings).toContain('No quote data');
    expect(result.totalCalculated).toBe(0);
  });

  it('should return empty result when quoteResult has no models', () => {
    const result = mapQuoteToShopifyLines({
      quoteResult: { models: null },
    });

    expect(result.lineItems).toEqual([]);
    expect(result.warnings).toContain('No quote data');
  });

  it('should skip models with non-completed status', () => {
    findVariantForConfig.mockReturnValue({
      shopify_variant_id: '999',
    });

    const result = mapQuoteToShopifyLines({
      quoteResult: makeQuoteResult({
        models: [
          makeModel({ id: 'm1', status: 'completed' }),
          makeModel({ id: 'm2', status: 'processing' }),
          makeModel({ id: 'm3', status: 'error' }),
        ],
      }),
      mappingMode: 'per_variant',
    });

    // Only 1 completed model should generate a line item
    expect(result.lineItems).toHaveLength(1);
  });
});

// ═══════════════════════════════════════════════════════════════
// mapQuoteToShopifyLines — per_variant mode
// ═══════════════════════════════════════════════════════════════

describe('mapQuoteToShopifyLines — per_variant mode', () => {
  it('should map model to correct variant using findVariantForConfig', () => {
    findVariantForConfig.mockReturnValue({
      shopify_variant_id: '42001',
    });

    const result = mapQuoteToShopifyLines({
      quoteResult: makeQuoteResult({
        models: [makeModel({ material: 'PETG', quality: 'high', quantity: 3, total: 300 })],
      }),
      mappingMode: 'per_variant',
      currency: 'CZK',
    });

    expect(findVariantForConfig).toHaveBeenCalledWith('PETG', 'high', undefined);
    expect(result.lineItems).toHaveLength(1);
    expect(result.lineItems[0].variantId).toBe('42001');
    expect(result.lineItems[0].quantity).toBe(3);
    expect(result.lineItems[0].properties['Model']).toBe('test-cube.stl');
    expect(result.lineItems[0].properties['Calculated Price']).toBe('100.00 CZK');
  });

  it('should add unmapped model when no mapping exists', () => {
    findVariantForConfig.mockReturnValue(null);

    const result = mapQuoteToShopifyLines({
      quoteResult: makeQuoteResult({
        models: [makeModel({ id: 'orphan', name: 'orphan.stl', material: 'WOOD', quality: 'draft' })],
      }),
      mappingMode: 'per_variant',
    });

    expect(result.lineItems).toHaveLength(0);
    expect(result.unmappedModels).toHaveLength(1);
    expect(result.unmappedModels[0]).toMatchObject({
      id: 'orphan',
      name: 'orphan.stl',
      material: 'WOOD',
      quality: 'draft',
      reason: 'no_mapping',
    });
    expect(result.warnings.some(w => w.includes('could not be mapped'))).toBe(true);
  });

  it('should add unmapped model when mapping has empty variant_id', () => {
    findVariantForConfig.mockReturnValue({
      shopify_variant_id: '',
    });

    const result = mapQuoteToShopifyLines({
      quoteResult: makeQuoteResult({
        models: [makeModel({ id: 'empty-vid' })],
      }),
      mappingMode: 'per_variant',
    });

    expect(result.lineItems).toHaveLength(0);
    expect(result.unmappedModels[0].reason).toBe('empty_variant_id');
  });

  it('should include weight in properties when filamentGrams is available', () => {
    findVariantForConfig.mockReturnValue({ shopify_variant_id: '100' });

    const result = mapQuoteToShopifyLines({
      quoteResult: makeQuoteResult({
        models: [makeModel({ filamentGrams: 42.7 })],
      }),
      mappingMode: 'per_variant',
    });

    expect(result.lineItems[0].properties['Weight']).toBe('42.7g');
  });

  it('should include volume discount info when available', () => {
    findVariantForConfig.mockReturnValue({ shopify_variant_id: '100' });

    const result = mapQuoteToShopifyLines({
      quoteResult: makeQuoteResult({
        volumeDiscount: { enabled: true, totalSavings: 50 },
      }),
      mappingMode: 'per_variant',
      currency: 'EUR',
    });

    expect(result.lineItems[0].properties['Volume Discount']).toBe('-50.00 EUR (total)');
  });

  it('should NOT include volume discount when savings are zero', () => {
    findVariantForConfig.mockReturnValue({ shopify_variant_id: '100' });

    const result = mapQuoteToShopifyLines({
      quoteResult: makeQuoteResult({
        volumeDiscount: { enabled: true, totalSavings: 0 },
      }),
      mappingMode: 'per_variant',
    });

    expect(result.lineItems[0].properties['Volume Discount']).toBeUndefined();
  });

  it('should warn when all models are unmapped', () => {
    findVariantForConfig.mockReturnValue(null);

    const result = mapQuoteToShopifyLines({
      quoteResult: makeQuoteResult({
        models: [makeModel(), makeModel({ id: 'm2' })],
      }),
      mappingMode: 'per_variant',
    });

    expect(result.warnings.some(w => w.includes('No items could be added'))).toBe(true);
  });

  it('should handle multiple models with different mappings', () => {
    findVariantForConfig
      .mockReturnValueOnce({ shopify_variant_id: '501' })
      .mockReturnValueOnce({ shopify_variant_id: '502' });

    const result = mapQuoteToShopifyLines({
      quoteResult: makeQuoteResult({
        models: [
          makeModel({ id: 'm1', name: 'cube.stl', material: 'PLA', total: 100, quantity: 1 }),
          makeModel({ id: 'm2', name: 'sphere.stl', material: 'ABS', total: 200, quantity: 2 }),
        ],
        grandTotal: 300,
      }),
      mappingMode: 'per_variant',
    });

    expect(result.lineItems).toHaveLength(2);
    expect(result.lineItems[0].variantId).toBe('501');
    expect(result.lineItems[1].variantId).toBe('502');
    expect(result.totalCalculated).toBe(300);
  });
});

// ═══════════════════════════════════════════════════════════════
// mapQuoteToShopifyLines — universal mode
// ═══════════════════════════════════════════════════════════════

describe('mapQuoteToShopifyLines — universal mode', () => {
  it('should map all models to the same fallback variant', () => {
    const result = mapQuoteToShopifyLines({
      quoteResult: makeQuoteResult({
        models: [
          makeModel({ id: 'm1', name: 'a.stl', total: 100, quantity: 1 }),
          makeModel({ id: 'm2', name: 'b.stl', total: 200, quantity: 2 }),
        ],
      }),
      mappingMode: 'universal',
      fallbackVariantId: '9999',
      currency: 'CZK',
    });

    expect(result.lineItems).toHaveLength(2);
    expect(result.lineItems[0].variantId).toBe('9999');
    expect(result.lineItems[1].variantId).toBe('9999');
  });

  it('should include model details in properties', () => {
    const result = mapQuoteToShopifyLines({
      quoteResult: makeQuoteResult({
        models: [makeModel({ name: 'gear.stl', material: 'PETG', quality: 'high', total: 200, quantity: 2, filamentGrams: 35 })],
      }),
      mappingMode: 'universal',
      fallbackVariantId: '9999',
      currency: 'EUR',
    });

    const props = result.lineItems[0].properties;
    expect(props['Model']).toBe('gear.stl');
    expect(props['Material']).toBe('PETG');
    expect(props['Quality']).toBe('high');
    expect(props['Price']).toBe('100.00 EUR');
    expect(props['Weight']).toBe('35.0g');
  });

  it('should warn and add unmapped when no fallback variant configured', () => {
    const result = mapQuoteToShopifyLines({
      quoteResult: makeQuoteResult({
        models: [makeModel({ id: 'x1' }), makeModel({ id: 'x2' })],
      }),
      mappingMode: 'universal',
      fallbackVariantId: '',
    });

    expect(result.lineItems).toHaveLength(0);
    expect(result.unmappedModels).toHaveLength(2);
    expect(result.warnings.some(w => w.includes('No universal variant'))).toBe(true);
  });

  it('should skip non-completed models', () => {
    const result = mapQuoteToShopifyLines({
      quoteResult: makeQuoteResult({
        models: [
          makeModel({ status: 'completed' }),
          makeModel({ id: 'm2', status: 'error' }),
        ],
      }),
      mappingMode: 'universal',
      fallbackVariantId: '9999',
    });

    expect(result.lineItems).toHaveLength(1);
  });
});

// ═══════════════════════════════════════════════════════════════
// mapQuoteToShopifyLines — fee handling
// ═══════════════════════════════════════════════════════════════

describe('mapQuoteToShopifyLines — fee handling', () => {
  const orderFees = [
    { label: 'Shipping', amount: 80 },
    { label: 'Rush fee', amount: 50 },
  ];

  describe('included_in_price', () => {
    it('should add adjusted price with fees distributed per model (universal)', () => {
      const result = mapQuoteToShopifyLines({
        quoteResult: makeQuoteResult({
          models: [
            makeModel({ id: 'm1', total: 100, quantity: 1 }),
            makeModel({ id: 'm2', total: 200, quantity: 1 }),
          ],
          orderFees,
        }),
        mappingMode: 'universal',
        fallbackVariantId: '9999',
        feeHandling: 'included_in_price',
        currency: 'CZK',
      });

      // Total order fees = 130, distributed equally among 2 models = 65 each
      // m1: unit price 100, + 65/1 = 165
      // m2: unit price 200, + 65/1 = 265
      expect(result.lineItems[0].properties['Price (incl. fees)']).toBe('165.00 CZK');
      expect(result.lineItems[1].properties['Price (incl. fees)']).toBe('265.00 CZK');
    });

    it('should add adjusted price with fees distributed per model (per_variant)', () => {
      findVariantForConfig.mockReturnValue({ shopify_variant_id: '100' });

      const result = mapQuoteToShopifyLines({
        quoteResult: makeQuoteResult({
          models: [makeModel({ total: 100, quantity: 2 })],
          orderFees: [{ label: 'Shipping', amount: 60 }],
        }),
        mappingMode: 'per_variant',
        feeHandling: 'included_in_price',
        currency: 'CZK',
      });

      // unit price = 100/2 = 50, fee share = 60/1 model = 60, adjusted = 50 + 60/2 = 80
      expect(result.lineItems[0].properties['Price (incl. fees)']).toBe('80.00 CZK');
    });
  });

  describe('line_property', () => {
    it('should add model-level fees as line property (universal)', () => {
      const result = mapQuoteToShopifyLines({
        quoteResult: makeQuoteResult({
          models: [makeModel({
            total: 100,
            fees: [
              { label: 'Small part fee', amount: 15 },
              { label: 'Color change', amount: 10 },
            ],
          })],
        }),
        mappingMode: 'universal',
        fallbackVariantId: '9999',
        feeHandling: 'line_property',
      });

      expect(result.lineItems[0].properties['Fees']).toBe('Small part fee: 15.00, Color change: 10.00');
    });

    it('should not add Fees property when model has no fees', () => {
      const result = mapQuoteToShopifyLines({
        quoteResult: makeQuoteResult({
          models: [makeModel({ fees: [] })],
        }),
        mappingMode: 'universal',
        fallbackVariantId: '9999',
        feeHandling: 'line_property',
      });

      expect(result.lineItems[0].properties['Fees']).toBeUndefined();
    });

    it('should add model-level fees as line property (per_variant)', () => {
      findVariantForConfig.mockReturnValue({ shopify_variant_id: '100' });

      const result = mapQuoteToShopifyLines({
        quoteResult: makeQuoteResult({
          models: [makeModel({
            fees: [{ label: 'Support removal', amount: 25 }],
          })],
        }),
        mappingMode: 'per_variant',
        feeHandling: 'line_property',
      });

      expect(result.lineItems[0].properties['Fees']).toBe('Support removal: 25.00');
    });
  });

  describe('separate_variant', () => {
    it('should add order fees as separate line item', () => {
      findVariantForConfig.mockReturnValue({ shopify_variant_id: '100' });

      const result = mapQuoteToShopifyLines({
        quoteResult: makeQuoteResult({
          models: [makeModel()],
          orderFees,
        }),
        mappingMode: 'per_variant',
        feeHandling: 'separate_variant',
        feeVariantId: 'fee-variant-001',
        currency: 'CZK',
      });

      // lineItems includes both regular items and fee lines
      expect(result.feeLines).toHaveLength(1);
      expect(result.feeLines[0].variantId).toBe('fee-variant-001');
      expect(result.feeLines[0].quantity).toBe(1);
      expect(result.feeLines[0].properties['Type']).toBe('Order Fees');
      expect(result.feeLines[0].properties['Shipping']).toBe('80.00 CZK');
      expect(result.feeLines[0].properties['Rush fee']).toBe('50.00 CZK');
    });

    it('should warn when fee_variant_id is not configured', () => {
      findVariantForConfig.mockReturnValue({ shopify_variant_id: '100' });

      const result = mapQuoteToShopifyLines({
        quoteResult: makeQuoteResult({
          models: [makeModel()],
          orderFees,
        }),
        mappingMode: 'per_variant',
        feeHandling: 'separate_variant',
        feeVariantId: '',
      });

      expect(result.feeLines).toHaveLength(0);
      expect(result.warnings.some(w => w.includes('no fee variant ID'))).toBe(true);
    });

    it('should not add fee line when there are no order fees', () => {
      findVariantForConfig.mockReturnValue({ shopify_variant_id: '100' });

      const result = mapQuoteToShopifyLines({
        quoteResult: makeQuoteResult({
          models: [makeModel()],
          orderFees: [],
        }),
        mappingMode: 'per_variant',
        feeHandling: 'separate_variant',
        feeVariantId: 'fee-variant-001',
      });

      expect(result.feeLines).toHaveLength(0);
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// mapQuoteToShopifyLines — totalCalculated
// ═══════════════════════════════════════════════════════════════

describe('mapQuoteToShopifyLines — totalCalculated', () => {
  it('should use grandTotal from quote result', () => {
    findVariantForConfig.mockReturnValue({ shopify_variant_id: '100' });

    const result = mapQuoteToShopifyLines({
      quoteResult: { models: [makeModel()], orderFees: [], grandTotal: 999 },
      mappingMode: 'per_variant',
    });

    expect(result.totalCalculated).toBe(999);
  });

  it('should fall back to total when grandTotal is missing', () => {
    findVariantForConfig.mockReturnValue({ shopify_variant_id: '100' });

    const result = mapQuoteToShopifyLines({
      quoteResult: { models: [makeModel()], orderFees: [], total: 555 },
      mappingMode: 'per_variant',
    });

    expect(result.totalCalculated).toBe(555);
  });

  it('should return 0 when neither grandTotal nor total exists', () => {
    findVariantForConfig.mockReturnValue({ shopify_variant_id: '100' });

    const result = mapQuoteToShopifyLines({
      quoteResult: { models: [makeModel()], orderFees: [] },
      mappingMode: 'per_variant',
    });

    expect(result.totalCalculated).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════
// buildCartNote
// ═══════════════════════════════════════════════════════════════

describe('buildCartNote', () => {
  it('should replace {modelCount} placeholder', () => {
    const note = buildCartNote('Order with {modelCount} models', { modelCount: 3 });
    expect(note).toBe('Order with 3 models');
  });

  it('should replace {totalPrice} placeholder with 2 decimal places', () => {
    const note = buildCartNote('Total: {totalPrice}', { totalPrice: 1234.5 });
    expect(note).toBe('Total: 1234.50');
  });

  it('should replace {currency} placeholder', () => {
    const note = buildCartNote('Price in {currency}', { currency: 'EUR' });
    expect(note).toBe('Price in EUR');
  });

  it('should replace all placeholders in one template', () => {
    const note = buildCartNote(
      'ModelPricer: {modelCount} modelu, {totalPrice} {currency}',
      { modelCount: 5, totalPrice: 2500, currency: 'CZK' }
    );
    expect(note).toBe('ModelPricer: 5 modelu, 2500.00 CZK');
  });

  it('should replace multiple occurrences of the same placeholder', () => {
    const note = buildCartNote('{currency} - {currency}', { currency: 'USD' });
    expect(note).toBe('USD - USD');
  });

  it('should return empty string when template is empty', () => {
    expect(buildCartNote('')).toBe('');
  });

  it('should return empty string when template is null', () => {
    expect(buildCartNote(null)).toBe('');
  });

  it('should return empty string when template is undefined', () => {
    expect(buildCartNote(undefined)).toBe('');
  });

  it('should use defaults when params object is omitted', () => {
    const note = buildCartNote('{modelCount} models, {totalPrice} {currency}');
    expect(note).toBe('0 models, 0.00 CZK');
  });
});
