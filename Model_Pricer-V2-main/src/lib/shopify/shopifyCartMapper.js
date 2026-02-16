/**
 * Shopify Cart Mapper
 *
 * Transforms pricing engine quote result into Shopify cart line items.
 * Supports two mapping modes:
 *   - per_variant: Each material+quality maps to a specific Shopify variant
 *   - universal: All models use a single Shopify variant, details in properties
 */

import { findVariantForConfig } from '../../utils/adminEcommerceStorage';

/**
 * Map a pricing engine quote result to Shopify cart line items.
 *
 * @param {{
 *   quoteResult: object,        // from calculateOrderQuote()
 *   variantMappings: Array,     // from adminEcommerceStorage
 *   fallbackVariantId: string,
 *   mappingMode: string,        // "per_variant" | "universal"
 *   feeHandling: string,        // "included_in_price" | "line_property" | "separate_variant"
 *   feeVariantId: string,
 *   uploadedFiles: Array,       // for model names
 *   currency: string,
 *   tenantId: string,
 * }}
 * @returns {{
 *   lineItems: Array<{ variantId: string, quantity: number, properties: object }>,
 *   unmappedModels: Array,
 *   feeLines: Array,
 *   warnings: Array<string>,
 *   totalCalculated: number,
 * }}
 */
export function mapQuoteToShopifyLines({
  quoteResult,
  variantMappings = [],
  fallbackVariantId = '',
  mappingMode = 'per_variant',
  feeHandling = 'included_in_price',
  feeVariantId = '',
  uploadedFiles = [],
  currency = 'CZK',
  tenantId,
}) {
  if (!quoteResult || !quoteResult.models) {
    return { lineItems: [], unmappedModels: [], feeLines: [], warnings: ['No quote data'], totalCalculated: 0 };
  }

  const warnings = [];
  const unmappedModels = [];
  const lineItems = [];
  const feeLines = [];

  const models = quoteResult.models || [];
  const orderFees = quoteResult.orderFees || [];

  // Calculate total order fees
  const orderFeesTotal = orderFees.reduce((sum, f) => sum + (f.amount || 0), 0);

  // ─── Map models to line items ──────────────────────────────

  if (mappingMode === 'universal') {
    // Universal mode: all models go to a single variant
    const variantId = fallbackVariantId;
    if (!variantId) {
      warnings.push('No universal variant ID configured');
      models.forEach(m => unmappedModels.push({ id: m.id, name: m.name, reason: 'no_universal_variant' }));
    } else {
      for (const model of models) {
        if (model.status !== 'completed') continue;

        const quantity = model.quantity || 1;
        const modelTotal = model.total || 0;
        const unitPrice = quantity > 0 ? (modelTotal / quantity) : 0;

        const properties = {
          'Model': model.name || 'Unknown',
          'Material': model.config?.material || model.base?.materialKey || '',
          'Quality': model.config?.quality || '',
          'Price': `${unitPrice.toFixed(2)} ${currency}`,
        };

        if (model.base?.filamentGrams) {
          properties['Weight'] = `${model.base.filamentGrams.toFixed(1)}g`;
        }

        // Fee handling for universal mode
        if (feeHandling === 'included_in_price') {
          // Distribute order fees proportionally
          const modelShare = models.length > 0 ? orderFeesTotal / models.length : 0;
          const adjustedPrice = unitPrice + (modelShare / quantity);
          properties['Price (incl. fees)'] = `${adjustedPrice.toFixed(2)} ${currency}`;
        } else if (feeHandling === 'line_property') {
          const modelFees = (model.fees || []).map(f => `${f.label}: ${f.amount?.toFixed(2)}`).join(', ');
          if (modelFees) properties['Fees'] = modelFees;
        }

        lineItems.push({
          variantId,
          quantity,
          properties,
        });
      }
    }
  } else {
    // Per-variant mode: lookup specific variant for each material+quality
    for (const model of models) {
      if (model.status !== 'completed') continue;

      const materialKey = model.config?.material || model.base?.materialKey || '';
      const qualityKey = model.config?.quality || 'standard';
      const quantity = model.quantity || 1;
      const modelTotal = model.total || 0;
      const unitPrice = quantity > 0 ? (modelTotal / quantity) : 0;

      // Find variant mapping
      const mapping = findVariantForConfig(materialKey, qualityKey, tenantId);

      if (!mapping) {
        // No mapping found and no fallback
        unmappedModels.push({
          id: model.id,
          name: model.name,
          material: materialKey,
          quality: qualityKey,
          reason: 'no_mapping',
        });
        continue;
      }

      const variantId = mapping.shopify_variant_id;
      if (!variantId) {
        unmappedModels.push({
          id: model.id,
          name: model.name,
          material: materialKey,
          quality: qualityKey,
          reason: 'empty_variant_id',
        });
        continue;
      }

      const properties = {
        'Model': model.name || 'Unknown',
      };

      if (model.base?.filamentGrams) {
        properties['Weight'] = `${model.base.filamentGrams.toFixed(1)}g`;
      }

      properties['Calculated Price'] = `${unitPrice.toFixed(2)} ${currency}`;

      // Fee handling
      if (feeHandling === 'included_in_price') {
        const modelShare = models.length > 0 ? orderFeesTotal / models.length : 0;
        const adjustedPrice = unitPrice + (modelShare / quantity);
        properties['Price (incl. fees)'] = `${adjustedPrice.toFixed(2)} ${currency}`;
      } else if (feeHandling === 'line_property') {
        const modelFees = (model.fees || []).map(f => `${f.label}: ${f.amount?.toFixed(2)}`).join(', ');
        if (modelFees) properties['Fees'] = modelFees;
      }

      // Volume discount info
      if (quoteResult.volumeDiscount?.enabled && quoteResult.volumeDiscount.totalSavings > 0) {
        properties['Volume Discount'] = `-${quoteResult.volumeDiscount.totalSavings.toFixed(2)} ${currency} (total)`;
      }

      lineItems.push({
        variantId,
        quantity,
        properties,
      });
    }
  }

  // ─── Fee handling: separate_variant ─────────────────────────

  if (feeHandling === 'separate_variant' && orderFeesTotal > 0) {
    if (!feeVariantId) {
      warnings.push('Fee handling set to separate_variant but no fee variant ID configured');
    } else {
      // Add order-level fees as a separate line item
      const feeProperties = {};
      orderFees.forEach(f => {
        feeProperties[f.label || 'Fee'] = `${(f.amount || 0).toFixed(2)} ${currency}`;
      });

      const feeLine = {
        variantId: feeVariantId,
        quantity: 1,
        properties: {
          'Type': 'Order Fees',
          ...feeProperties,
        },
      };

      feeLines.push(feeLine);
    }
  }

  // ─── Aggregate same-variant items (optional) ───────────────

  // For per_variant mode, aggregate models with same variant+material into one line
  // (keeping separate properties via concatenation)

  // ─── Calculate total ───────────────────────────────────────

  const totalCalculated = quoteResult.grandTotal || quoteResult.total || 0;

  // ─── Warnings ──────────────────────────────────────────────

  if (unmappedModels.length > 0) {
    warnings.push(`${unmappedModels.length} model(s) could not be mapped to Shopify variants`);
  }

  if (lineItems.length === 0 && unmappedModels.length > 0) {
    warnings.push('No items could be added to cart — check variant mappings');
  }

  return {
    lineItems: [...lineItems, ...feeLines],
    unmappedModels,
    feeLines,
    warnings,
    totalCalculated,
  };
}

/**
 * Build a cart note from template.
 * Supports placeholders: {modelCount}, {totalPrice}, {currency}
 */
export function buildCartNote(template, { modelCount = 0, totalPrice = 0, currency = 'CZK' } = {}) {
  if (!template) return '';
  return template
    .replace(/\{modelCount\}/g, String(modelCount))
    .replace(/\{totalPrice\}/g, totalPrice.toFixed(2))
    .replace(/\{currency\}/g, currency);
}
