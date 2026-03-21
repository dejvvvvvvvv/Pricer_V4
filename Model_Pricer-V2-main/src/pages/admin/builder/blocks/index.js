/**
 * blocks/index.js -- Block registry for the Widget Builder.
 *
 * Central entry point that aggregates all block categories, provides
 * lookup functions, and exposes category metadata for the block palette UI.
 *
 * Block categories:
 *   - calculator  (12 blocks: 6 locked core + 6 optional)
 *   - layout      (6 blocks: section, row, column, spacer, divider, card)
 *   - content     (8 blocks: heading, text, image, button, badge, icon, alert, list)
 *   - form        (6 blocks: text-input, select-input, checkbox, radio-group, textarea, number-input)
 *
 * Total: 32 blocks
 */

import { calculatorBlocks } from './calculatorBlocks';
import { layoutBlocks } from './layoutBlocks';
import { contentBlocks } from './contentBlocks';
import { formBlocks } from './formBlocks';
import {
  LOCKED_ELEMENT_IDS,
  canDeleteElement,
  canRepositionElement,
  canRestyleElement,
  isLockedElement,
  getElementConstraints,
} from './lockedElements';
import {
  DEFAULT_STEP_LAYOUTS,
  LAYOUT_PRESETS,
  getDefaultStepElements,
  getLayoutPreset,
  getStepNumbers,
  getStepInfo,
  isStepCustomizable,
  getAvailablePresetIds,
} from './defaultLayouts';

// ---------------------------------------------------------------------------
// Category definitions
// ---------------------------------------------------------------------------

/**
 * Block categories displayed in the builder palette.
 * Order matches the sidebar grouping.
 */
export const BLOCK_CATEGORIES = [
  {
    id: 'calculator',
    name: 'Calculator',
    nameCs: 'Kalkulacka',
    icon: 'Calculator',
    description: 'Core calculator components and optional add-ons.',
    descriptionCs: 'Zakladni komponenty kalkulacky a volitelne doplnky.',
  },
  {
    id: 'layout',
    name: 'Layout',
    nameCs: 'Rozlozeni',
    icon: 'Layout',
    description: 'Structural containers: sections, rows, columns.',
    descriptionCs: 'Strukturalni kontejnery: sekce, radky, sloupce.',
  },
  {
    id: 'content',
    name: 'Content',
    nameCs: 'Obsah',
    icon: 'Type',
    description: 'Text, images, buttons, badges, alerts.',
    descriptionCs: 'Text, obrazky, tlacitka, stitky, upozorneni.',
  },
  {
    id: 'form',
    name: 'Form',
    nameCs: 'Formulare',
    icon: 'FormInput',
    description: 'Form inputs: text fields, selects, checkboxes.',
    descriptionCs: 'Formularove vstupy: textova pole, vybery, checkboxy.',
  },
];

// ---------------------------------------------------------------------------
// Aggregated block list
// ---------------------------------------------------------------------------

/** All blocks from all categories in a single flat array. */
export const ALL_BLOCKS = [
  ...calculatorBlocks,
  ...layoutBlocks,
  ...contentBlocks,
  ...formBlocks,
];

// ---------------------------------------------------------------------------
// Lookup functions
// ---------------------------------------------------------------------------

/**
 * Find a block definition by its unique ID.
 * @param {string} id - Block ID (e.g. 'upload-zone', 'heading', 'text-input').
 * @returns {object|null} Block definition or null if not found.
 */
export function getBlockById(id) {
  return ALL_BLOCKS.find((b) => b.id === id) || null;
}

/**
 * Get all blocks belonging to a category.
 * @param {string} categoryId - Category ID ('calculator', 'layout', 'content', 'form').
 * @returns {object[]} Array of block definitions.
 */
export function getBlocksByCategory(categoryId) {
  return ALL_BLOCKS.filter((b) => b.category === categoryId);
}

/**
 * Get all blocks assigned to a specific calculator step.
 * Blocks with step === null are "floating" and can appear in any step.
 * @param {number} step - Step number 1-5.
 * @returns {object[]} Array of block definitions for the step.
 */
export function getBlocksByStep(step) {
  return ALL_BLOCKS.filter((b) => b.step === step);
}

/**
 * Get all blocks that can appear in any step (step === null).
 * These are layout, content, and form blocks plus the promo-bar.
 * @returns {object[]}
 */
export function getFloatingBlocks() {
  return ALL_BLOCKS.filter((b) => b.step === null);
}

/**
 * Check if a block is locked (cannot be deleted).
 * Convenience wrapper around lockedElements.isLockedElement.
 * @param {string} id - Block ID.
 * @returns {boolean}
 */
export function isLockedBlock(id) {
  return isLockedElement(id);
}

/**
 * Get the default props for a block by ID.
 * @param {string} id - Block ID.
 * @returns {object|null} Default props or null.
 */
export function getBlockDefaultProps(id) {
  const block = getBlockById(id);
  return block ? { ...block.defaultProps } : null;
}

/**
 * Get editable properties for a block by ID.
 * @param {string} id - Block ID.
 * @returns {object[]} Array of editable property definitions.
 */
export function getBlockEditableProperties(id) {
  const block = getBlockById(id);
  return block ? block.editableProperties : [];
}

/**
 * Get editable properties grouped by their `group` field.
 * @param {string} id - Block ID.
 * @returns {Record<string, object[]>} Map of group name to properties.
 */
export function getBlockPropertiesByGroup(id) {
  const props = getBlockEditableProperties(id);
  const groups = {};
  for (const prop of props) {
    const groupKey = prop.group || 'other';
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(prop);
  }
  return groups;
}

/**
 * Create a new block instance from a block definition.
 * Generates a unique instance ID using crypto.randomUUID().
 * @param {string} blockId - Block definition ID.
 * @param {number} [position] - Optional position in the element order.
 * @returns {object|null} Block instance or null if blockId not found.
 */
export function createBlockInstance(blockId, position = 0) {
  const block = getBlockById(blockId);
  if (!block) return null;

  return {
    instanceId: `bi_${crypto.randomUUID()}`,
    blockId: block.id,
    type: block.id,
    position,
    props: { ...block.defaultProps },
    visible: true,
    locked: block.locked,
  };
}

/**
 * Get a human-readable category label.
 * @param {string} categoryId - Category ID.
 * @param {string} [lang='en'] - Language code ('en' or 'cs').
 * @returns {string} Category name.
 */
export function getCategoryLabel(categoryId, lang = 'en') {
  const cat = BLOCK_CATEGORIES.find((c) => c.id === categoryId);
  if (!cat) return categoryId;
  return lang === 'cs' ? cat.nameCs : cat.name;
}

/**
 * Get a human-readable block name.
 * @param {string} blockId - Block ID.
 * @param {string} [lang='en'] - Language code ('en' or 'cs').
 * @returns {string} Block name.
 */
export function getBlockLabel(blockId, lang = 'en') {
  const block = getBlockById(blockId);
  if (!block) return blockId;
  return lang === 'cs' ? block.nameCs : block.name;
}

// ---------------------------------------------------------------------------
// Re-exports
// ---------------------------------------------------------------------------

// Block arrays
export { calculatorBlocks } from './calculatorBlocks';
export { layoutBlocks } from './layoutBlocks';
export { contentBlocks } from './contentBlocks';
export { formBlocks } from './formBlocks';

// Locked elements
export {
  LOCKED_ELEMENT_IDS,
  canDeleteElement,
  canRepositionElement,
  canRestyleElement,
  isLockedElement,
  getElementConstraints,
};

// Default layouts
export {
  DEFAULT_STEP_LAYOUTS,
  LAYOUT_PRESETS,
  getDefaultStepElements,
  getLayoutPreset,
  getStepNumbers,
  getStepInfo,
  isStepCustomizable,
  getAvailablePresetIds,
};
