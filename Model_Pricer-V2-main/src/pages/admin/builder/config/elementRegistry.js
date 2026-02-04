/**
 * Element Registry — defines all editable widget elements for the builder.
 * Each element maps to a section of the widget preview and its editable properties.
 */

export const ELEMENT_REGISTRY = {
  background: {
    id: 'background',
    label: { cs: 'Pozadi', en: 'Background' },
    icon: 'Layout',
    properties: ['backgroundColor', 'globalPadding'],
    editableTexts: [],
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
  },
  viewer: {
    id: 'viewer',
    label: { cs: '3D Nahled', en: '3D Viewer' },
    icon: 'Box',
    properties: [],
    editableTexts: [],
    note: 'Container for 3D viewer — not styleable in builder.',
  },
  config: {
    id: 'config',
    label: { cs: 'Konfigurace', en: 'Configuration' },
    icon: 'Settings',
    properties: ['configBgColor', 'configLabelColor'],
    editableTexts: [],
  },
  fees: {
    id: 'fees',
    label: { cs: 'Doplnkove sluzby', en: 'Additional Services' },
    icon: 'Receipt',
    properties: ['feesBgColor', 'feesCheckboxColor'],
    editableTexts: [],
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
  },
  footer: {
    id: 'footer',
    label: { cs: 'Paticka', en: 'Footer' },
    icon: 'PanelBottom',
    properties: ['footerBgColor', 'footerTextColor', 'footerLinkColor'],
    editableTexts: [],
  },
};

/** Ordered list of element IDs for rendering in the element tree. */
export const ELEMENT_ORDER = [
  'background', 'header', 'steps', 'upload', 'viewer',
  'config', 'fees', 'pricing', 'cta', 'footer',
];

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
