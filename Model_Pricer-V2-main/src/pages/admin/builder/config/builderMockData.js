/**
 * builderMockData.js — Complete mock data for Widget Builder preview.
 *
 * Provides realistic mock data for all 5 wizard steps so the builder
 * can render each step without crashes or missing properties.
 *
 * Used by widget-kalkulacka when builderMode=true && forceStep >= 2.
 */

/** Mock uploaded file with complete result data */
export const MOCK_FILE = {
  id: 'mock-1',
  name: 'ukazka-model.stl',
  size: 1024000,
  type: 'model/stl',
  uploadedAt: new Date('2026-01-15T10:30:00'),
  status: 'completed',
  error: null,
  result: {
    ok: true,
    totalPrice: 245,
    currency: 'CZK',
    printTime: 7200,
    printTimeFormatted: '2h 0min',
    materialUsed: 32.5,
    materialUsedFormatted: '32.5g',
    layerCount: 420,
    layerHeight: 0.2,
    filamentLength: 10850,
    infill: 20,
    supportMaterial: false,
    modelInfo: {
      volumeCm3: 12.5,
      volumeMm3: 12500,
      surfaceCm2: 85.3,
      surfaceMm2: 8530,
      boundingBox: { x: 50, y: 30, z: 40 },
      dimensions: { width: 50, depth: 30, height: 40 },
      triangleCount: 15420,
    },
    priceBreakdown: {
      baseMaterialCost: 98,
      timeCost: 72,
      setupFee: 25,
      markupAmount: 50,
      totalBeforeFees: 245,
    },
  },
  clientModelInfo: {
    surfaceMm2: 8530,
    surfaceCm2: 85.3,
  },
  clientModelInfoMeta: {
    surface: { method: 'three.js', triangles: 15420 },
  },
};

/** Second mock file for multi-model preview */
export const MOCK_FILE_2 = {
  ...MOCK_FILE,
  id: 'mock-2',
  name: 'drzak-telefonu.3mf',
  size: 2048000,
  result: {
    ...MOCK_FILE.result,
    totalPrice: 189,
    printTime: 5400,
    printTimeFormatted: '1h 30min',
    materialUsed: 24.8,
    materialUsedFormatted: '24.8g',
    modelInfo: {
      ...MOCK_FILE.result.modelInfo,
      volumeCm3: 9.8,
      volumeMm3: 9800,
      surfaceCm2: 62.1,
      surfaceMm2: 6210,
      boundingBox: { x: 75, y: 40, z: 12 },
      dimensions: { width: 75, depth: 40, height: 12 },
    },
    priceBreakdown: {
      baseMaterialCost: 74,
      timeCost: 54,
      setupFee: 25,
      markupAmount: 36,
      totalBeforeFees: 189,
    },
  },
};

/** Mock print configuration */
export const MOCK_PRINT_CONFIG = {
  material: 'pla',
  color: null,
  quality: 'standard',
  infill: 20,
  quantity: 1,
  supports: false,
};

/** Mock preset list */
export const MOCK_PRESETS = [
  { id: 'preset-default', name: 'Standard PLA', description: 'Standardni nastaveni pro PLA' },
  { id: 'preset-quality', name: 'Vysoka kvalita', description: 'Jemnejsi vrstvy, pomalejsi tisk' },
  { id: 'preset-draft', name: 'Draft', description: 'Rychly tisk, nizsi kvalita' },
];

/** Mock fee selections */
export const MOCK_FEE_SELECTIONS = {
  selectedFeeIds: new Set(),
  feeTargetsById: {},
};

/** Mock order/checkout data for step 4 */
export const MOCK_ORDER_DATA = {
  customerName: 'Jan Novak',
  customerEmail: 'jan@example.com',
  customerPhone: '+420 123 456 789',
  shippingAddress: {
    street: 'Hlavni 123',
    city: 'Praha',
    zip: '110 00',
    country: 'CZ',
  },
  notes: '',
};

/** Mock order confirmation for step 5 */
export const MOCK_CONFIRMATION = {
  orderId: 'ORD-2026-00042',
  status: 'confirmed',
  estimatedDelivery: '3-5 pracovnich dnu',
  totalPrice: 245,
  currency: 'CZK',
  itemCount: 1,
};

/**
 * Get complete mock data for a given builder preview step.
 * @param {number} step - Step number (1-5)
 * @returns {object} Mock data appropriate for the step
 */
export function getMockDataForStep(step) {
  switch (step) {
    case 1:
      return {
        files: [],
        selectedFile: null,
        printConfigs: {},
      };
    case 2:
      return {
        files: [MOCK_FILE],
        selectedFile: MOCK_FILE,
        printConfigs: { [MOCK_FILE.id]: MOCK_PRINT_CONFIG },
      };
    case 3:
      return {
        files: [MOCK_FILE, MOCK_FILE_2],
        selectedFile: MOCK_FILE,
        printConfigs: {
          [MOCK_FILE.id]: MOCK_PRINT_CONFIG,
          [MOCK_FILE_2.id]: MOCK_PRINT_CONFIG,
        },
      };
    case 4:
      return {
        files: [MOCK_FILE],
        selectedFile: MOCK_FILE,
        printConfigs: { [MOCK_FILE.id]: MOCK_PRINT_CONFIG },
        orderData: MOCK_ORDER_DATA,
      };
    case 5:
      return {
        files: [MOCK_FILE],
        selectedFile: MOCK_FILE,
        printConfigs: { [MOCK_FILE.id]: MOCK_PRINT_CONFIG },
        confirmation: MOCK_CONFIRMATION,
      };
    default:
      return {
        files: [MOCK_FILE],
        selectedFile: MOCK_FILE,
        printConfigs: { [MOCK_FILE.id]: MOCK_PRINT_CONFIG },
      };
  }
}
