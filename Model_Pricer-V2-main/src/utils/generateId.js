/**
 * Generate a unique ID using crypto.randomUUID().
 * @param {string} [prefix] - Optional prefix for the ID
 * @returns {string}
 */
export function generateId(prefix = '') {
  const id = crypto.randomUUID();
  return prefix ? `${prefix}_${id}` : id;
}
