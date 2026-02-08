/*
  Admin Fees — Tenant-scoped Storage (V3)
  -------------------------------------
  Purpose:
  - Provide ONE tenant-scoped storage entrypoint for fee configuration.
  - Support negative values (discounts).
  - Prepare schema for upcoming features (apply-to-selected-models, charge basis).

  Notes:
  - Migration from legacy keys is implemented in CP2 (see migrateLegacyFeesToV3).
*/

import { readTenantJson, writeTenantJson } from './adminTenantStorage';

const NS_FEES_V3 = 'fees:v3';
const SCHEMA_VERSION = 3;

function nowIso() {
  return new Date().toISOString();
}

function safeNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function parseBool(v, fallback = false) {
  if (v === true || v === 1 || v === '1') return true;
  if (v === false || v === 0 || v === '0') return false;
  return fallback;
}

function uuid(prefix = 'id') {
  try {
    if (crypto?.randomUUID) return crypto.randomUUID();
  } catch {}
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

function canUseLocalStorage() {
  try {
    return typeof window !== 'undefined' && !!window.localStorage;
  } catch {
    return false;
  }
}

function safeReadJsonFromKey(storageKey) {
  try {
    if (!canUseLocalStorage()) return null;
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('[adminFeesStorage] Failed to read legacy key', storageKey, e);
    return null;
  }
}

function listLocalStorageKeysStartingWith(prefix) {
  if (!canUseLocalStorage()) return [];
  const out = [];
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(prefix)) out.push(k);
    }
  } catch (e) {
    console.warn('[adminFeesStorage] Failed to enumerate localStorage', e);
  }
  return out;
}

function normalizeConditions(conditions) {
  const arr = Array.isArray(conditions) ? conditions : [];
  return arr
    .map((c) => {
      const cc = c && typeof c === 'object' ? c : {};
      const rawKey = String(cc.key || '').trim();
      const rawOp = String(cc.op || cc.operator || '').trim();

      // Canonicalize legacy keys so the schema stays stable.
      // (AdminFees previously used "support_enabled"; new key is "supports_enabled".)
      const key = (() => {
        const k = rawKey;
        if (!k) return '';
        const map = {
          support_enabled: 'supports_enabled',
          supports_enabled: 'supports_enabled',
        };
        return map[k] || k;
      })();

      // Canonicalize operator to a compact set:
      // eq | neq | gt | gte | lt | lte | contains
      const op = (() => {
        const o = rawOp;
        if (!o) return '';
        const norm = String(o).trim().toLowerCase();
        const map = {
          '=': 'eq',
          '==': 'eq',
          equals: 'eq',
          eq: 'eq',

          '!=': 'neq',
          '<>': 'neq',
          not_equals: 'neq',
          neq: 'neq',

          '>': 'gt',
          gt: 'gt',
          g: 'gt',

          '>=': 'gte',
          gte: 'gte',

          '<': 'lt',
          lt: 'lt',
          l: 'lt',

          '<=': 'lte',
          lte: 'lte',

          contains: 'contains',
        };
        return map[norm] || norm;
      })();
      const value = cc.value;
      if (!key || !op) return null;
      return { key, op, value };
    })
    .filter(Boolean);
}

function normalizeFee(fee, idx = 0) {
  const f = fee && typeof fee === 'object' ? fee : {};

  const type = String(f.type || '').trim() || 'flat';
  const allowedTypes = ['flat', 'per_gram', 'per_minute', 'percent', 'per_cm3', 'per_cm2', 'per_piece'];
  const normalizedType = allowedTypes.includes(type) ? type : 'flat';

  const scope = String(f.scope || '').trim().toUpperCase() || 'MODEL';
  const normalizedScope = scope === 'ORDER' ? 'ORDER' : 'MODEL';

  const charge_basis = String(f.charge_basis || '').trim().toUpperCase() || 'PER_FILE';
  const normalizedChargeBasis = ['PER_PIECE', 'PER_FILE'].includes(charge_basis) ? charge_basis : 'PER_FILE';

  return {
    id: String(f.id || '').trim() || uuid('fee'),
    name: String(f.name || '').trim() || `Fee ${idx + 1}`,
    active: parseBool(f.active, true),

    type: normalizedType,
    value: safeNum(f.value, 0), // NOTE: can be negative (discounts)

    scope: normalizedScope,
    charge_basis: normalizedChargeBasis,

    required: parseBool(f.required, false),
    selectable: parseBool(f.selectable, true),
    selected_by_default: parseBool(f.selected_by_default, false),

    // P0: apply-to-selected-models toggle
    apply_to_selected_models_enabled: parseBool(f.apply_to_selected_models_enabled, false),

    category: String(f.category || '').trim() || '',
    description: String(f.description || '').trim() || '',
    conditions: normalizeConditions(f.conditions),

    // S06: Post-processing fields (optional, defaults if missing)
    icon: String(f.icon || '').trim() || '',
    processing_days: safeNum(f.processing_days, 0),
    customer_description: String(f.customer_description || '').trim() || '',
    image_url: String(f.image_url || '').trim() || '',
  };
}

export function getDefaultFeesConfigV3() {
  return {
    schema_version: SCHEMA_VERSION,
    fees: [],
    updated_at: nowIso(),
  };
}

export function normalizeFeesConfigV3(input) {
  const src = input && typeof input === 'object' ? input : {};
  const feesRaw = Array.isArray(src.fees) ? src.fees : [];
  const fees = feesRaw.map(normalizeFee);
  return {
    schema_version: SCHEMA_VERSION,
    fees,
    updated_at: String(src.updated_at || src.updatedAt || nowIso()),
  };
}

export function loadFeesConfigV3() {
  const stored = readTenantJson(NS_FEES_V3, null);
  if (stored && typeof stored === 'object') {
    return normalizeFeesConfigV3(stored);
  }

  // CP2: Legacy migration runs on first load if tenant V3 entry doesn't exist.
  // Migration is idempotent because we only run it when V3 is missing.
  const mig = migrateLegacyFeesToV3();
  if (mig?.migrated && mig?.data) {
    writeTenantJson(NS_FEES_V3, mig.data);
    return normalizeFeesConfigV3(mig.data);
  }

  // No legacy found => seed defaults and persist (so the tenant key exists).
  const seeded = normalizeFeesConfigV3(getDefaultFeesConfigV3());
  writeTenantJson(NS_FEES_V3, seeded);
  return seeded;
}

export function saveFeesConfigV3(data) {
  const normalized = normalizeFeesConfigV3(data);
  const next = { ...normalized, updated_at: nowIso() };
  writeTenantJson(NS_FEES_V3, next);
  return next;
}

// CP2 will implement this. Keep export now so imports are stable.
export function migrateLegacyFeesToV3() {
  // Migration notes:
  // - Legacy source we support:
  //   1) AdminFees page local key: modelpricer_fees_config__{customerId}
  // - We try to auto-detect customerId by enumerating localStorage keys.
  // - If multiple keys exist, prefer test-customer-1.

  if (!canUseLocalStorage()) {
    return { migrated: false, source: null, data: null, notes: 'No window/localStorage available.' };
  }

  const preferredCustomerId = 'test-customer-1';
  const adminPrefix = 'modelpricer_fees_config__';

  const adminKeys = listLocalStorageKeysStartingWith(adminPrefix);
  if (!adminKeys.length) {
    return { migrated: false, source: null, data: null, notes: 'No legacy fees config found.' };
  }

  const pickKey = (keys, prefix, preferredId) => {
    if (!keys.length) return null;
    if (preferredId) {
      const exact = `${prefix}${preferredId}`;
      if (keys.includes(exact)) return exact;
    }
    if (keys.length > 1) console.warn('[adminFeesStorage] Multiple legacy keys found for', prefix, keys);
    return keys[0];
  };

  const adminKey = pickKey(adminKeys, adminPrefix, preferredCustomerId);
  const parsed = adminKey ? safeReadJsonFromKey(adminKey) : null;
  if (!parsed) {
    return { migrated: false, source: adminKey, data: null, notes: 'Legacy key present but empty/unreadable.' };
  }

  // AdminFees stores { fees: [...] } (sometimes also includes updated_at)
  const feesArray = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.fees) ? parsed.fees : [];
  const migrated = normalizeFeesConfigV3({ fees: feesArray, updated_at: parsed.updated_at || nowIso() });

  return {
    migrated: true,
    source: adminKey,
    data: { ...migrated, updated_at: nowIso() },
    notes: 'Migrated from AdminFees legacy localStorage key.',
  };
}
