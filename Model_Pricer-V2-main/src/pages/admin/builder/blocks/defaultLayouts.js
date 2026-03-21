/**
 * defaultLayouts.js -- Default layout definitions per calculator step.
 *
 * Defines which blocks appear in each step by default, their order,
 * and whether the step allows layout customization.
 *
 * Steps:
 *   1 = Upload (file upload)
 *   2 = Config (model viewer + print configuration)
 *   3 = Pricing (price breakdown + optional add-ons)
 *   4 = Order (checkout form + shipping)
 *   5 = Confirmation (order success screen)
 */

// ---------------------------------------------------------------------------
// Default step layouts
// ---------------------------------------------------------------------------

export const DEFAULT_STEP_LAYOUTS = {
  1: {
    name: 'Upload',
    nameCs: 'Nahrani',
    elements: ['upload-zone'],
    customizable: true,
    description: 'File upload step. Users drag & drop 3D model files.',
    descriptionCs: 'Krok nahrani. Uzivatele pretahnout 3D soubory modelu.',
  },

  2: {
    name: 'Configuration',
    nameCs: 'Konfigurace',
    elements: ['model-viewer', 'print-config'],
    customizable: true,
    description: 'Configure print settings: material, quality, infill, quantity.',
    descriptionCs: 'Nastaveni tisku: material, kvalita, vypln, mnozstvi.',
  },

  3: {
    name: 'Pricing',
    nameCs: 'Cena',
    elements: ['price-breakdown', 'coupon-input', 'express-tier', 'upsell-panel', 'shopify-cart-button'],
    customizable: true,
    description: 'Price summary with optional add-ons, coupons, and upsells.',
    descriptionCs: 'Souhrn ceny s volitelnymi doplnky, kupony a doporucenymi.',
  },

  4: {
    name: 'Order',
    nameCs: 'Objednavka',
    elements: ['checkout-form', 'shipping-selector'],
    customizable: true,
    description: 'Customer details and shipping method selection.',
    descriptionCs: 'Udaje zakaznika a vyber zpusobu dopravy.',
  },

  5: {
    name: 'Confirmation',
    nameCs: 'Potvrzeni',
    elements: ['order-confirmation'],
    customizable: true,
    description: 'Order confirmation with order ID and delivery estimate.',
    descriptionCs: 'Potvrzeni objednavky s cislem a odhadem doruceni.',
  },
};

// ---------------------------------------------------------------------------
// Preset layout variants
// ---------------------------------------------------------------------------

/**
 * Named layout presets that rearrange elements across steps.
 * Each preset maps step numbers to element arrays.
 */
export const LAYOUT_PRESETS = {
  standard: {
    id: 'standard',
    name: 'Standard',
    nameCs: 'Standardni',
    description: 'Default layout with all elements.',
    descriptionCs: 'Vychozi rozlozeni se vsemi prvky.',
    steps: {
      1: ['upload-zone'],
      2: ['model-viewer', 'print-config'],
      3: ['price-breakdown', 'coupon-input', 'express-tier', 'upsell-panel', 'shopify-cart-button'],
      4: ['checkout-form', 'shipping-selector'],
      5: ['order-confirmation'],
    },
  },

  compact: {
    id: 'compact',
    name: 'Compact',
    nameCs: 'Kompaktni',
    description: 'Minimal layout without optional elements.',
    descriptionCs: 'Minimalni rozlozeni bez volitelnych prvku.',
    steps: {
      1: ['upload-zone'],
      2: ['model-viewer', 'print-config'],
      3: ['price-breakdown'],
      4: ['checkout-form'],
      5: ['order-confirmation'],
    },
  },

  salesFocused: {
    id: 'salesFocused',
    name: 'Sales Focused',
    nameCs: 'Prodejni',
    description: 'Layout optimized for conversions with upsells and promos.',
    descriptionCs: 'Rozlozeni optimalizovane pro konverze s doporucenymi a promo.',
    steps: {
      1: ['promo-bar', 'upload-zone'],
      2: ['model-viewer', 'print-config'],
      3: ['promo-bar', 'price-breakdown', 'express-tier', 'upsell-panel', 'coupon-input', 'shopify-cart-button'],
      4: ['checkout-form', 'shipping-selector'],
      5: ['order-confirmation'],
    },
  },

  quickQuote: {
    id: 'quickQuote',
    name: 'Quick Quote',
    nameCs: 'Rychla kalkulace',
    description: 'Upload + instant pricing, skip detailed config.',
    descriptionCs: 'Nahrani + okamzita cena, preskoceni detailni konfigurace.',
    steps: {
      1: ['upload-zone'],
      2: ['print-config'],
      3: ['price-breakdown', 'shopify-cart-button'],
      4: ['checkout-form'],
      5: ['order-confirmation'],
    },
  },
};

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

/**
 * Get the default element order for a given step.
 * @param {number} step - Step number 1-5.
 * @returns {string[]} Array of block IDs for the step.
 */
export function getDefaultStepElements(step) {
  const layout = DEFAULT_STEP_LAYOUTS[step];
  return layout ? [...layout.elements] : [];
}

/**
 * Get a layout preset by ID.
 * @param {string} presetId - Preset ID (e.g. 'standard', 'compact').
 * @returns {object|null} Layout preset or null.
 */
export function getLayoutPreset(presetId) {
  return LAYOUT_PRESETS[presetId] || null;
}

/**
 * Get all available step numbers.
 * @returns {number[]} Array of step numbers [1, 2, 3, 4, 5].
 */
export function getStepNumbers() {
  return Object.keys(DEFAULT_STEP_LAYOUTS).map(Number);
}

/**
 * Get step metadata (name, description).
 * @param {number} step - Step number 1-5.
 * @returns {{ name: string, nameCs: string, description: string, descriptionCs: string } | null}
 */
export function getStepInfo(step) {
  const layout = DEFAULT_STEP_LAYOUTS[step];
  if (!layout) return null;
  return {
    name: layout.name,
    nameCs: layout.nameCs,
    description: layout.description,
    descriptionCs: layout.descriptionCs,
  };
}

/**
 * Check if a step allows layout customization.
 * @param {number} step - Step number 1-5.
 * @returns {boolean}
 */
export function isStepCustomizable(step) {
  const layout = DEFAULT_STEP_LAYOUTS[step];
  return layout ? layout.customizable : false;
}

/**
 * Get all available layout preset IDs.
 * @returns {string[]}
 */
export function getAvailablePresetIds() {
  return Object.keys(LAYOUT_PRESETS);
}
