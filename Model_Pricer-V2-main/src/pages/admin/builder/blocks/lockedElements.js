/**
 * lockedElements.js -- Locked element configuration for the Widget Builder.
 *
 * Defines which elements cannot be deleted, repositioned, or restyled.
 * LOCKED elements are critical calculator components that must always exist
 * for the widget to function. Removing them would break the calculator flow.
 *
 * Three constraint levels:
 *   1. LOCKED_DELETE   -- cannot be removed (but can be moved & restyled)
 *   2. FIXED_POSITION  -- cannot be moved (but can be restyled)
 *   3. LOCKED_RESTYLE  -- cannot be restyled (currently unused; all can be restyled)
 */

// ---------------------------------------------------------------------------
// Element constraint sets
// ---------------------------------------------------------------------------

/**
 * Elements that CANNOT be deleted.
 * These are the six core functional blocks required for the calculator to work.
 */
export const LOCKED_ELEMENT_IDS = [
  'upload-zone',
  'model-viewer',
  'print-config',
  'price-breakdown',
  'checkout-form',
  'order-confirmation',
];

/**
 * Elements that CANNOT be repositioned within their step.
 * Currently empty -- all elements can be reordered.
 * Reserved for future use if certain elements must remain in a fixed position.
 */
export const FIXED_POSITION_IDS = [];

/**
 * Elements that can be repositioned and restyled but NOT deleted.
 * Superset that includes all locked elements.
 */
export const LOCKED_DELETE_IDS = [...LOCKED_ELEMENT_IDS];

/**
 * Elements that CANNOT be restyled.
 * Currently empty -- all elements support visual customization.
 * Reserved for future use if certain elements must remain unstyled.
 */
export const LOCKED_RESTYLE_IDS = [];

// ---------------------------------------------------------------------------
// Constraint checker functions
// ---------------------------------------------------------------------------

/**
 * Check if an element can be deleted.
 * @param {string} elementId - Block or element ID.
 * @returns {boolean} true if the element can be deleted.
 */
export function canDeleteElement(elementId) {
  return !LOCKED_DELETE_IDS.includes(elementId);
}

/**
 * Check if an element can be repositioned within its step.
 * @param {string} elementId - Block or element ID.
 * @returns {boolean} true if the element can be moved.
 */
export function canRepositionElement(elementId) {
  return !FIXED_POSITION_IDS.includes(elementId);
}

/**
 * Check if an element can be restyled (colors, fonts, sizes, etc.).
 * @param {string} elementId - Block or element ID.
 * @returns {boolean} true if the element can be restyled.
 */
export function canRestyleElement(elementId) {
  return !LOCKED_RESTYLE_IDS.includes(elementId);
}

/**
 * Check if an element is a locked core calculator block.
 * @param {string} elementId - Block or element ID.
 * @returns {boolean} true if the element is locked (cannot be deleted).
 */
export function isLockedElement(elementId) {
  return LOCKED_ELEMENT_IDS.includes(elementId);
}

/**
 * Get a human-readable constraint summary for an element.
 * Useful for tooltips / UI indicators.
 * @param {string} elementId
 * @returns {{ canDelete: boolean, canReposition: boolean, canRestyle: boolean, isLocked: boolean }}
 */
export function getElementConstraints(elementId) {
  return {
    canDelete: canDeleteElement(elementId),
    canReposition: canRepositionElement(elementId),
    canRestyle: canRestyleElement(elementId),
    isLocked: isLockedElement(elementId),
  };
}
