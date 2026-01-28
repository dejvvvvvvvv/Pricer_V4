/*
  Very small localStorage-based persistence used by Admin UI.
  This keeps the front-end fully functional for demos without requiring backend.

  NOTE (2026-01): We now use this helper as the single entrypoint for tenant-scoped
  config (pricing:v3, fees:v3, ...). Make it safe in non-browser contexts.
*/

function canUseLocalStorage() {
  try {
    return typeof window !== 'undefined' && !!window.localStorage;
  } catch {
    return false;
  }
}

export function getTenantId() {
  // Keep it simple for now. Later this should come from auth/tenant context.
  if (!canUseLocalStorage()) return 'demo-tenant';
  return window.localStorage.getItem('modelpricer:tenant_id') || 'demo-tenant';
}

function buildKey(tenantId, namespace) {
  return `modelpricer:${tenantId}:${namespace}`;
}

export function readTenantJson(namespace, fallback) {
  if (!canUseLocalStorage()) return fallback;
  const tenantId = getTenantId();
  const storageKey = buildKey(tenantId, namespace);
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('[adminTenantStorage] Failed to read/parse', storageKey, e);
    return fallback;
  }
}

export function writeTenantJson(namespace, value) {
  if (!canUseLocalStorage()) return;
  const tenantId = getTenantId();
  const storageKey = buildKey(tenantId, namespace);
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(value));
  } catch (e) {
    console.warn('[adminTenantStorage] Failed to write', storageKey, e);
  }
}

export function appendTenantLog(namespace, entry, maxItems = 100) {
  const list = readTenantJson(namespace, []);
  const next = [entry, ...list].slice(0, maxItems);
  writeTenantJson(namespace, next);
  return next;
}
