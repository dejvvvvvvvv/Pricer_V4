/**
 * Strip dangerous prototype pollution keys from parsed JSON objects.
 * Use after JSON.parse() on any user-provided/imported data.
 */
const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

export function stripDangerousKeys(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(stripDangerousKeys);

  const clean = {};
  for (const key of Object.keys(obj)) {
    if (DANGEROUS_KEYS.has(key)) continue;
    clean[key] = stripDangerousKeys(obj[key]);
  }
  return clean;
}

/**
 * Safe JSON.parse that strips prototype pollution keys.
 */
export function safeJsonParse(text) {
  const parsed = JSON.parse(text);
  return stripDangerousKeys(parsed);
}
