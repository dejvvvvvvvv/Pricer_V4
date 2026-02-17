/**
 * presetLayouts.js — 4 preset layout configurations for the Widget Builder.
 *
 * Each preset defines element order, hidden elements, and optional size overrides.
 * Theme (colors, fonts) is NOT affected by layout presets.
 */

export const PRESET_LAYOUTS = [
  {
    id: 'classic',
    name: { cs: 'Klasicky', en: 'Classic' },
    description: { cs: 'Standardni rozlozeni se vsemi prvky', en: 'Standard layout with all elements' },
    layout: {
      elementOrder: ['header', 'steps', 'upload', 'config', 'viewer', 'fees', 'pricing', 'cta', 'footer'],
      hiddenElements: [],
      customBlocks: [],
      sizeOverrides: {},
    },
  },
  {
    id: 'compact',
    name: { cs: 'Kompaktni', en: 'Compact' },
    description: { cs: 'Minimalizovane bez hlavicky a paticky', en: 'Minimized without header and footer' },
    layout: {
      elementOrder: ['steps', 'upload', 'config', 'viewer', 'pricing', 'cta'],
      hiddenElements: ['header', 'footer', 'fees'],
      customBlocks: [],
      sizeOverrides: { viewer: { height: 300 } },
    },
  },
  {
    id: 'wide',
    name: { cs: 'Siroky', en: 'Wide' },
    description: { cs: 'Roztazene rozlozeni pro velke obrazovky', en: 'Expanded layout for large screens' },
    layout: {
      elementOrder: ['header', 'steps', 'upload', 'viewer', 'config', 'fees', 'pricing', 'cta', 'footer'],
      hiddenElements: [],
      customBlocks: [],
      sizeOverrides: { viewer: { height: 500 } },
    },
  },
  {
    id: 'minimal',
    name: { cs: 'Minimalni', en: 'Minimal' },
    description: { cs: 'Jen zaklad — upload, nastaveni, cena', en: 'Essentials only — upload, config, price' },
    layout: {
      elementOrder: ['upload', 'config', 'pricing', 'cta'],
      hiddenElements: ['header', 'steps', 'footer', 'fees', 'viewer'],
      customBlocks: [],
      sizeOverrides: {},
    },
  },
];

/**
 * Get a preset layout by ID.
 * @param {string} presetId
 * @returns {object|null}
 */
export function getPresetLayout(presetId) {
  return PRESET_LAYOUTS.find((p) => p.id === presetId) || null;
}

/**
 * Default layout config used when no layoutConfig exists on a widget.
 * Matches the 'classic' preset.
 */
export function getDefaultLayoutConfig() {
  const classic = getPresetLayout('classic');
  return {
    ...classic.layout,
    activePresetId: 'classic',
    version: 1,
  };
}
