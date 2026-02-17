/**
 * Element Registry — defines all editable widget elements for the builder.
 * Each element maps to a section of the widget preview and its editable properties.
 *
 * Extended for Widget Builder V2 with:
 *   - protected: boolean — cannot be removed from layout
 *   - hideable: boolean — can be toggled visible/hidden
 *   - draggable: boolean — can be reordered via DnD
 *   - zone: 'full' | 'left' | 'right' — layout zone for grid positioning
 */

export const ELEMENT_REGISTRY = {
  background: {
    id: 'background',
    label: { cs: 'Pozadi', en: 'Background' },
    icon: 'Layout',
    properties: ['backgroundColor', 'globalPadding'],
    editableTexts: [],
    protected: true,
    hideable: false,
    draggable: false,
    zone: 'full',
  },
  header: {
    id: 'header',
    label: { cs: 'Hlavicka', en: 'Header' },
    icon: 'Type',
    properties: [
      'headerBgColor', 'headerColor', 'headerLogoSize',
      'headerPadding', 'headerAlignment', 'headerTaglineVisible',
    ],
    editableTexts: ['textHeaderTitle', 'textHeaderTagline'],
    protected: false,
    hideable: true,
    draggable: true,
    zone: 'full',
  },
  steps: {
    id: 'steps',
    label: { cs: 'Navigace (kroky)', en: 'Steps Navigation' },
    icon: 'ListOrdered',
    properties: [
      'stepperActiveColor', 'stepperCompletedColor',
      'stepperInactiveColor', 'stepperProgressVisible',
    ],
    editableTexts: [],
    protected: false,
    hideable: true,
    draggable: true,
    zone: 'full',
  },
  upload: {
    id: 'upload',
    label: { cs: 'Upload zona', en: 'Upload Zone' },
    icon: 'Upload',
    properties: [
      'uploadBgColor', 'uploadBorderColor', 'uploadBorderHoverColor',
      'uploadIconColor', 'uploadBorderStyle',
    ],
    editableTexts: ['textUploadTitle', 'textUploadDescription', 'textUploadButton'],
    protected: true,
    hideable: false,
    draggable: true,
    zone: 'left',
  },
  viewer: {
    id: 'viewer',
    label: { cs: '3D Nahled', en: '3D Viewer' },
    icon: 'Box',
    properties: [],
    editableTexts: [],
    note: 'Container for 3D viewer — not styleable in builder.',
    protected: true,
    hideable: true,
    draggable: true,
    zone: 'right',
  },
  config: {
    id: 'config',
    label: { cs: 'Konfigurace', en: 'Configuration' },
    icon: 'Settings',
    properties: ['configBgColor', 'configLabelColor'],
    editableTexts: [],
    protected: true,
    hideable: false,
    draggable: true,
    zone: 'left',
  },
  fees: {
    id: 'fees',
    label: { cs: 'Doplnkove sluzby', en: 'Additional Services' },
    icon: 'Receipt',
    properties: ['feesBgColor', 'feesCheckboxColor'],
    editableTexts: [],
    protected: false,
    hideable: true,
    draggable: true,
    zone: 'left',
  },
  pricing: {
    id: 'pricing',
    label: { cs: 'Souhrn ceny', en: 'Price Summary' },
    icon: 'DollarSign',
    properties: [
      'summaryBgColor', 'summaryHeaderColor', 'summaryDividerColor',
      'summaryTotalBgColor', 'summaryTotalFontSize',
    ],
    editableTexts: [],
    protected: true,
    hideable: false,
    draggable: true,
    zone: 'right',
  },
  cta: {
    id: 'cta',
    label: { cs: 'CTA Tlacitko', en: 'CTA Button' },
    icon: 'MousePointerClick',
    properties: [
      'buttonPrimaryColor', 'buttonTextColor', 'buttonHoverColor',
      'buttonBorderRadius', 'buttonPaddingY', 'buttonFontSize', 'buttonShadow',
    ],
    editableTexts: ['textCtaButton'],
    protected: true,
    hideable: false,
    draggable: true,
    zone: 'right',
  },
  footer: {
    id: 'footer',
    label: { cs: 'Paticka', en: 'Footer' },
    icon: 'PanelBottom',
    properties: ['footerBgColor', 'footerTextColor', 'footerLinkColor'],
    editableTexts: [],
    protected: false,
    hideable: true,
    draggable: true,
    zone: 'full',
  },
};

/** Ordered list of element IDs for rendering in the element tree. */
export const ELEMENT_ORDER = [
  'background', 'header', 'steps', 'upload', 'viewer',
  'config', 'fees', 'pricing', 'cta', 'footer',
];

/** Default layout element order (excludes 'background' which is always rendered) */
export const DEFAULT_LAYOUT_ORDER = [
  'header', 'steps', 'upload', 'config', 'viewer', 'fees', 'pricing', 'cta', 'footer',
];

/** Set of protected element IDs — cannot be removed */
export const PROTECTED_ELEMENTS = new Set(
  Object.values(ELEMENT_REGISTRY).filter((e) => e.protected).map((e) => e.id),
);

/** Set of hideable element IDs — can be toggled visible/hidden */
export const HIDEABLE_ELEMENTS = new Set(
  Object.values(ELEMENT_REGISTRY).filter((e) => e.hideable).map((e) => e.id),
);

/**
 * Get an element definition by ID.
 * @param {string} id - Element ID from ELEMENT_REGISTRY
 * @returns {object|null} Element definition or null if not found
 */
export function getElement(id) {
  return ELEMENT_REGISTRY[id] || null;
}

/**
 * Get all property keys for a given element.
 * @param {string} elementId
 * @returns {string[]} Array of theme property keys
 */
export function getElementProperties(elementId) {
  const el = ELEMENT_REGISTRY[elementId];
  return el ? [...el.properties, ...el.editableTexts] : [];
}

/**
 * Check if an element has editable text fields.
 * @param {string} elementId
 * @returns {boolean}
 */
export function hasEditableTexts(elementId) {
  const el = ELEMENT_REGISTRY[elementId];
  return el ? el.editableTexts.length > 0 : false;
}

/**
 * Check if an element can be removed/deleted.
 * @param {string} elementId
 * @returns {boolean}
 */
export function isDeletable(elementId) {
  return !PROTECTED_ELEMENTS.has(elementId);
}

/**
 * Check if a given ID is a custom block (not in ELEMENT_REGISTRY).
 * @param {string} id
 * @returns {boolean}
 */
export function isCustomBlock(id) {
  return id?.startsWith('cb_') || false;
}
