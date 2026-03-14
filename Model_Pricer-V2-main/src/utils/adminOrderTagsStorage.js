/**
 * adminOrderTagsStorage.js
 *
 * Tenant-scoped storage for order tags (predefined + custom).
 * Stores tag definitions and per-order tag assignments.
 *
 * Namespaces:
 *   - `order-tags:v1`        — tag definitions (predefined + custom)
 *   - `order-tag-assignments:v1` — map of orderId -> tagId[]
 */

import { readTenantJson, writeTenantJson } from './adminTenantStorage';

// ── Namespace constants ──
const NS_TAGS = 'order-tags:v1';
const NS_ASSIGNMENTS = 'order-tag-assignments:v1';

// ── Predefined tags (shipped with the app) ──
export const PREDEFINED_TAGS = [
  { id: 'urgent',        label: 'Urgentni',         color: '#FF4757', icon: 'Zap',           predefined: true },
  { id: 'vip',           label: 'VIP',              color: '#FFB547', icon: 'Crown',         predefined: true },
  { id: 'repeat',        label: 'Opakujici zakaznik', color: '#00D4AA', icon: 'Repeat',     predefined: true },
  { id: 'sample',        label: 'Vzorek',           color: '#5B8DEF', icon: 'FlaskConical',  predefined: true },
  { id: 'wholesale',     label: 'Velkoobchod',      color: '#A855F7', icon: 'Building2',     predefined: true },
  { id: 'review_needed', label: 'K revizi',         color: '#F97316', icon: 'Eye',           predefined: true },
  { id: 'priority',      label: 'Priorita',         color: '#EC4899', icon: 'ArrowUpCircle', predefined: true },
  { id: 'on_hold',       label: 'Pozastaveno',      color: '#6B7280', icon: 'PauseCircle',   predefined: true },
];

/**
 * Load all tag definitions (predefined + custom).
 * Merges predefined tags with any saved custom tags.
 * @returns {Array<{id: string, label: string, color: string, icon?: string, predefined?: boolean}>}
 */
export function loadTags() {
  const saved = readTenantJson(NS_TAGS, null);
  if (!saved || !Array.isArray(saved)) {
    return [...PREDEFINED_TAGS];
  }
  // Merge: ensure predefined tags are always present, custom tags are appended
  const predefinedIds = new Set(PREDEFINED_TAGS.map((t) => t.id));
  const customTags = saved.filter((t) => !predefinedIds.has(t.id));
  // Allow saved overrides (e.g. admin renamed a predefined tag label)
  const predefinedMerged = PREDEFINED_TAGS.map((pt) => {
    const override = saved.find((s) => s.id === pt.id);
    return override ? { ...pt, ...override, predefined: true } : pt;
  });
  return [...predefinedMerged, ...customTags];
}

/**
 * Save all tag definitions (replaces existing).
 * @param {Array} tags
 */
export function saveTags(tags) {
  writeTenantJson(NS_TAGS, tags);
}

/**
 * Create a new custom tag.
 * @param {string} label
 * @param {string} color - hex color
 * @returns {Object} the created tag
 */
export function createTag(label, color) {
  const tags = loadTags();
  const id = `custom_${crypto.randomUUID()}`;
  const newTag = { id, label, color, icon: 'Tag', predefined: false };
  tags.push(newTag);
  saveTags(tags);
  return newTag;
}

/**
 * Delete a tag by id. Only custom tags can be deleted.
 * Also removes the tag from all order assignments.
 * @param {string} tagId
 * @returns {boolean} true if deleted
 */
export function deleteTag(tagId) {
  const tags = loadTags();
  const tag = tags.find((t) => t.id === tagId);
  if (!tag || tag.predefined) return false;

  const filtered = tags.filter((t) => t.id !== tagId);
  saveTags(filtered);

  // Clean up assignments
  const assignments = readTenantJson(NS_ASSIGNMENTS, {});
  let changed = false;
  for (const orderId of Object.keys(assignments)) {
    const orderTags = assignments[orderId];
    if (Array.isArray(orderTags) && orderTags.includes(tagId)) {
      assignments[orderId] = orderTags.filter((t) => t !== tagId);
      changed = true;
    }
  }
  if (changed) {
    writeTenantJson(NS_ASSIGNMENTS, assignments);
  }
  return true;
}

/**
 * Get tag IDs assigned to a specific order.
 * @param {string} orderId
 * @returns {string[]} tag IDs
 */
export function getOrderTags(orderId) {
  const assignments = readTenantJson(NS_ASSIGNMENTS, {});
  return Array.isArray(assignments[orderId]) ? assignments[orderId] : [];
}

/**
 * Set tag IDs for a specific order (replaces existing).
 * @param {string} orderId
 * @param {string[]} tagIds
 */
export function setOrderTags(orderId, tagIds) {
  const assignments = readTenantJson(NS_ASSIGNMENTS, {});
  assignments[orderId] = Array.isArray(tagIds) ? [...new Set(tagIds)] : [];
  writeTenantJson(NS_ASSIGNMENTS, assignments);
}

/**
 * Add a single tag to an order (if not already present).
 * @param {string} orderId
 * @param {string} tagId
 */
export function addOrderTag(orderId, tagId) {
  const current = getOrderTags(orderId);
  if (current.includes(tagId)) return;
  setOrderTags(orderId, [...current, tagId]);
}

/**
 * Remove a single tag from an order.
 * @param {string} orderId
 * @param {string} tagId
 */
export function removeOrderTag(orderId, tagId) {
  const current = getOrderTags(orderId);
  setOrderTags(orderId, current.filter((t) => t !== tagId));
}

/**
 * Get all order-tag assignments (map of orderId -> tagIds[]).
 * @returns {Object<string, string[]>}
 */
export function getAllOrderTagAssignments() {
  return readTenantJson(NS_ASSIGNMENTS, {});
}

/**
 * Bulk set tags for multiple orders.
 * @param {string[]} orderIds
 * @param {string} tagId
 */
export function bulkAddTag(orderIds, tagId) {
  const assignments = readTenantJson(NS_ASSIGNMENTS, {});
  for (const orderId of orderIds) {
    const current = Array.isArray(assignments[orderId]) ? assignments[orderId] : [];
    if (!current.includes(tagId)) {
      assignments[orderId] = [...current, tagId];
    }
  }
  writeTenantJson(NS_ASSIGNMENTS, assignments);
}

/**
 * Bulk remove a tag from multiple orders.
 * @param {string[]} orderIds
 * @param {string} tagId
 */
export function bulkRemoveTag(orderIds, tagId) {
  const assignments = readTenantJson(NS_ASSIGNMENTS, {});
  for (const orderId of orderIds) {
    const current = Array.isArray(assignments[orderId]) ? assignments[orderId] : [];
    assignments[orderId] = current.filter((t) => t !== tagId);
  }
  writeTenantJson(NS_ASSIGNMENTS, assignments);
}

/**
 * Find tag definition by id.
 * @param {string} tagId
 * @returns {Object|undefined}
 */
export function getTagById(tagId) {
  return loadTags().find((t) => t.id === tagId);
}
