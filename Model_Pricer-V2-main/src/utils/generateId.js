/**
 * Generate a unique ID using crypto API with Math.random fallback.
 * @param {string} [prefix] - Optional prefix for the ID
 * @returns {string}
 */
export function generateId(prefix = '') {
  const id = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
  return prefix ? `${prefix}_${id}` : id;
}
