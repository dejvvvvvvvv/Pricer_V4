/*
  Admin Pricing (V3) tenant-scoped storage

  - Source of truth lives under: modelpricer:<tenantId>:pricing:v3
  - Includes a small best-effort migration from older demo keys.

  Public API:
    - loadPricingConfigV3()
    - savePricingConfigV3(config)

  MP_B3x1_PRICING_SCHEMA_v1:
    - normalizePricingConfigForEngine(config): ensures pricingEngineV3 root fields exist
    - normalizePricingConfigV3(config): broader normalizer used by pricingService and storage
    - normalizeMaterialKey(key): canonicalize material key
    - getDefaultPricingConfigV3(): fallback defaults (demo-safe)
    - getColorEffectivePrice(material, colorId): resolve per-color or material-default price
*/

import { getTenantId, readTenantJson, writeTenantJson } from './adminTenantStorage';

const NAMESPACE = 'pricing:v3';
const SCHEMA_VERSION = 3;

function nowIso() {
  return new Date().toISOString();
}

function safeParseJson(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function safeNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function clampMin0(n) {
  const v = safeNum(n, 0);
  return v < 0 ? 0 : v;
}

function parseBool(v, fallback = false) {
  if (v === true || v === 1 || v === '1') return true;
  if (v === false || v === 0 || v === '0') return false;
  return fallback;
}

function isObj(x) {
  return !!x && typeof x === 'object' && !Array.isArray(x);
}

export function normalizeMaterialKey(key) {
  const k = String(key || '')
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
  return k;
}

/**
 * Get the effective price per gram for a specific color of a material.
 * If the color has a price_per_gram override, use that; otherwise fall back to the material's default.
 * @param {object} material - Material object with price_per_gram and colors array
 * @param {string} colorId - The color ID to look up
 * @returns {number} Effective price per gram
 */
export function getColorEffectivePrice(material, colorId) {
  if (!material) return 0;
  const colors = Array.isArray(material.colors) ? material.colors : [];
  const color = colorId ? colors.find(c => c.id === colorId) : null;
  if (color && color.price_per_gram != null && Number.isFinite(Number(color.price_per_gram))) {
    return Math.max(0, Number(color.price_per_gram));
  }
  return Math.max(0, Number(material.price_per_gram) || 0);
}

function buildMaterialPricesFromMaterials(materials) {
  const map = {};
  (Array.isArray(materials) ? materials : []).forEach((m) => {
    if (m?.enabled !== false && m?.key) {
      const k = normalizeMaterialKey(m.key);
      if (k) map[k] = clampMin0(m.price_per_gram);
    }
  });
  return map;
}

function materialPricesToMaterialsV3(materialPrices) {
  const out = [];
  if (!materialPrices || typeof materialPrices !== 'object') return out;
  for (const [k, v] of Object.entries(materialPrices)) {
    const key = normalizeMaterialKey(k);
    if (!key) continue;
    out.push({
      id: `mat-${key}`,
      key,
      name: String(k).replace(/_/g, ' ').toUpperCase(),
      enabled: true,
      price_per_gram: clampMin0(v),
      colors: [],
    });
  }
  return out;
}

function ensureMaterials(cfg) {
  const c = isObj(cfg) ? cfg : {};
  if (Array.isArray(c.materials) && c.materials.length > 0) return c.materials;

  // Legacy compatibility: materialPrices map
  if (isObj(c.materialPrices)) {
    const mats = materialPricesToMaterialsV3(c.materialPrices);
    if (mats.length > 0) return mats;
  }

  return [];
}

function ensureDefaultMaterialKey(materials, candidate) {
  const mats = Array.isArray(materials) ? materials : [];
  const set = new Set(mats.map((m) => normalizeMaterialKey(m?.key || m?.name)).filter(Boolean));
  const cand = normalizeMaterialKey(candidate);
  if (cand && set.has(cand)) return cand;

  const firstEnabled = mats.find((m) => m?.enabled !== false && normalizeMaterialKey(m?.key || m?.name));
  if (firstEnabled) return normalizeMaterialKey(firstEnabled.key || firstEnabled.name);

  const firstAny = mats.find((m) => normalizeMaterialKey(m?.key || m?.name));
  if (firstAny) return normalizeMaterialKey(firstAny.key || firstAny.name);

  return 'pla';
}

const DEFAULT_TENANT_PRICING_RULES = {
  // time
  rate_per_hour: 150,

  // minimum billed time
  min_billed_minutes_enabled: false,
  min_billed_minutes_value: 30,

  // minimum prices
  min_price_per_model_enabled: false,
  min_price_per_model_value: 99,

  min_order_total_enabled: false,
  min_order_total_value: 199,

  // rounding
  rounding_enabled: false,
  rounding_step: 5,
  rounding_mode: 'nearest',
  smart_rounding_enabled: true,

  // markup
  markup_enabled: false,
  markup_mode: 'flat',
  markup_value: 20,
  markup_min_flat: 20,
};

const DEFAULT_MATERIALS = [
  {
    id: 'mat-pla',
    key: 'pla',
    name: 'PLA',
    enabled: true,
    price_per_gram: 0.6,
    colors: [
      { id: 'clr-white', name: 'White', hex: '#FFFFFF', price_per_gram: null },
    ],
  },
];

function normalizeTenantPricingRules(input) {
  const src = isObj(input) ? input : {};
  const next = { ...DEFAULT_TENANT_PRICING_RULES, ...src };

  next.rate_per_hour = clampMin0(next.rate_per_hour ?? src.timeRate ?? 0);

  next.min_billed_minutes_enabled = parseBool(next.min_billed_minutes_enabled, false);
  next.min_billed_minutes_value = clampMin0(next.min_billed_minutes_value);

  next.min_price_per_model_enabled = parseBool(next.min_price_per_model_enabled, false);
  next.min_price_per_model_value = clampMin0(next.min_price_per_model_value);

  next.min_order_total_enabled = parseBool(next.min_order_total_enabled, false);
  next.min_order_total_value = clampMin0(next.min_order_total_value);

  next.rounding_enabled = parseBool(next.rounding_enabled, false);
  next.rounding_step = Math.max(1, Math.floor(clampMin0(next.rounding_step || 1)));
  next.rounding_mode = next.rounding_mode === 'up' ? 'up' : 'nearest';
  next.smart_rounding_enabled = parseBool(next.smart_rounding_enabled, true);

  next.markup_enabled = parseBool(next.markup_enabled, false);
  next.markup_mode = ['flat', 'percent', 'min_flat'].includes(String(next.markup_mode || ''))
    ? String(next.markup_mode)
    : 'flat';
  next.markup_value = clampMin0(next.markup_value);
  next.markup_min_flat = clampMin0(next.markup_min_flat ?? next.markup_value);

  return next;
}

/**
 * Ensures pricingEngineV3-required root fields exist on the returned config.
 * This function does NOT remove legacy keys.
 */
export function normalizePricingConfigForEngine(input) {
  const cfg = isObj(input) ? input : {};
  const tenantPricingPresent = isObj(cfg.tenant_pricing);
  const tenantPricing = tenantPricingPresent ? normalizeTenantPricingRules(cfg.tenant_pricing) : null;

  const rootRounding = isObj(cfg.rounding) ? cfg.rounding : {};
  const rootMarkup = isObj(cfg.markup) ? cfg.markup : {};

  const rate_per_hour = clampMin0(
    (tenantPricingPresent ? tenantPricing?.rate_per_hour : undefined) ?? cfg.rate_per_hour ?? cfg.timeRate ?? 0
  );

  const minimum_billed_minutes = tenantPricingPresent
    ? (tenantPricing?.min_billed_minutes_enabled ? clampMin0(tenantPricing?.min_billed_minutes_value) : 0)
    : clampMin0(cfg.minimum_billed_minutes ?? 0);

  const minimum_price_per_model = tenantPricingPresent
    ? (tenantPricing?.min_price_per_model_enabled ? clampMin0(tenantPricing?.min_price_per_model_value) : 0)
    : clampMin0(cfg.minimum_price_per_model ?? 0);

  const minimum_order_total = tenantPricingPresent
    ? (tenantPricing?.min_order_total_enabled ? clampMin0(tenantPricing?.min_order_total_value) : 0)
    : clampMin0(cfg.minimum_order_total ?? 0);

  const rounding = {
    enabled: tenantPricingPresent ? !!tenantPricing?.rounding_enabled : parseBool(rootRounding.enabled, false),
    step: tenantPricingPresent
      ? Math.max(1, Math.floor(clampMin0(tenantPricing?.rounding_step ?? rootRounding.step ?? 1)))
      : Math.max(1, Math.floor(clampMin0(rootRounding.step ?? 1))),
    mode: tenantPricingPresent
      ? (tenantPricing?.rounding_mode ?? rootRounding.mode ?? 'nearest')
      : (rootRounding.mode ?? 'nearest'),
    smart_rounding_enabled: tenantPricingPresent ? !!tenantPricing?.smart_rounding_enabled : parseBool(rootRounding.smart_rounding_enabled, true),
  };

  rounding.mode = rounding.mode === 'up' ? 'up' : 'nearest';

  const markupEnabled = tenantPricingPresent ? !!tenantPricing?.markup_enabled : parseBool(rootMarkup.enabled, false);
  const markupMode = markupEnabled
    ? (tenantPricingPresent ? (tenantPricing?.markup_mode ?? rootMarkup.mode ?? 'percent') : (rootMarkup.mode ?? 'percent'))
    : 'off';

  const markupValue = tenantPricingPresent
    ? clampMin0(tenantPricing?.markup_value ?? rootMarkup.value ?? 0)
    : clampMin0(rootMarkup.value ?? 0);

  const markupMinFlat = tenantPricingPresent
    ? clampMin0(tenantPricing?.markup_min_flat ?? tenantPricing?.markup_value ?? rootMarkup.min_flat ?? rootMarkup.value ?? 0)
    : clampMin0(rootMarkup.min_flat ?? rootMarkup.value ?? 0);

  const markup = {
    enabled: markupEnabled,
    mode: ['flat', 'percent', 'min_flat', 'off'].includes(String(markupMode || '')) ? String(markupMode) : (markupEnabled ? 'percent' : 'off'),
    value: markupValue,
    ...(String(markupMode) === 'min_flat' ? { min_flat: markupMinFlat || markupValue } : (rootMarkup.min_flat != null ? { min_flat: markupMinFlat } : {})),
  };

  if (!markup.enabled) markup.mode = 'off';

  // Normalize color price_per_gram on materials (when called independently of normalizePricingConfigV3)
  const materials = Array.isArray(cfg.materials)
    ? cfg.materials.map((m) => {
        if (!isObj(m)) return m;
        if (!Array.isArray(m.colors) || m.colors.length === 0) return m;
        return {
          ...m,
          colors: m.colors.map((c) => ({
            ...c,
            price_per_gram: c?.price_per_gram != null && Number.isFinite(Number(c.price_per_gram)) ? Math.max(0, Number(c.price_per_gram)) : null,
          })),
        };
      })
    : cfg.materials;

  return {
    ...cfg,
    ...(tenantPricingPresent ? { tenant_pricing: tenantPricing } : null),
    ...(materials !== cfg.materials ? { materials } : null),

    // Engine root fields
    rate_per_hour,
    minimum_billed_minutes,
    minimum_price_per_model,
    minimum_order_total,
    rounding,
    markup,
  };
}

export function getDefaultPricingConfigV3() {
  const base = {
    schema_version: SCHEMA_VERSION,
    materials: DEFAULT_MATERIALS,
    default_material_key: 'pla',
    tenant_pricing: { ...DEFAULT_TENANT_PRICING_RULES },
    updated_at: nowIso(),
  };
  return normalizePricingConfigV3(base);
}

/**
 * Broader normalizer used across the app (pricingService + storage).
 * Keeps legacy keys; ensures materials/materialPrices/timeRate/tenant_pricing are present.
 */
export function normalizePricingConfigV3(input) {
  const src = isObj(input) ? input : {};

  const materialsRaw = ensureMaterials(src);
  let materials = (Array.isArray(materialsRaw) ? materialsRaw : []).map((m) => {
    const mm = isObj(m) ? m : {};
    const key = normalizeMaterialKey(mm.key || mm.name);
    return {
      ...mm,
      id: String(mm.id || (key ? `mat-${key}` : 'mat-unknown')),
      key,
      name: String(mm.name || key || '').trim() || (key ? key.toUpperCase() : 'MATERIAL'),
      enabled: mm.enabled !== false,
      price_per_gram: clampMin0(mm.price_per_gram ?? mm.price ?? 0),
      colors: (Array.isArray(mm.colors) ? mm.colors : []).map((c) => ({
        ...c,
        id: String(c?.id || ''),
        name: String(c?.name || ''),
        hex: String(c?.hex || '#000000'),
        price_per_gram: c?.price_per_gram != null && Number.isFinite(Number(c.price_per_gram)) ? Math.max(0, Number(c.price_per_gram)) : null,
      })),
    };
  });

  // Hard safety: never allow empty materials — the rest of the app expects at least 1.
  if (materials.length === 0) {
    materials = DEFAULT_MATERIALS;
  }

  const default_material_key = ensureDefaultMaterialKey(
    materials,
    src.default_material_key ?? src.defaultMaterialKey ?? src.default_material
  );

  const tenantPricingPresent = isObj(src.tenant_pricing);
  const tenant_pricing = tenantPricingPresent
    ? normalizeTenantPricingRules(src.tenant_pricing)
    : normalizeTenantPricingRules({ rate_per_hour: src.rate_per_hour ?? src.timeRate ?? DEFAULT_TENANT_PRICING_RULES.rate_per_hour });

  const materialPrices = buildMaterialPricesFromMaterials(materials);

  // S05: Volume discounts (backward compatible — missing field = disabled)
  const volume_discounts = isObj(src.volume_discounts)
    ? {
        enabled: parseBool(src.volume_discounts.enabled, false),
        mode: ['percent', 'fixed_price'].includes(src.volume_discounts.mode) ? src.volume_discounts.mode : 'percent',
        scope: ['per_model', 'per_order'].includes(src.volume_discounts.scope) ? src.volume_discounts.scope : 'per_model',
        tiers: Array.isArray(src.volume_discounts.tiers)
          ? src.volume_discounts.tiers
              .filter(t => t && safeNum(t.min_qty, 0) >= 1)
              .map(t => ({
                min_qty: Math.max(1, Math.floor(safeNum(t.min_qty, 1))),
                value: safeNum(t.value, 0),
                label: t.label ? String(t.label).trim() : undefined,
              }))
              .sort((a, b) => a.min_qty - b.min_qty)
          : [],
      }
    : { enabled: false, mode: 'percent', scope: 'per_model', tiers: [] };

  const normalized = {
    ...src,
    schema_version: safeNum(src.schema_version ?? src.schemaVersion, SCHEMA_VERSION),
    materials,
    default_material_key,

    // compatibility
    materialPrices: isObj(src.materialPrices) ? { ...src.materialPrices, ...materialPrices } : materialPrices,
    timeRate: clampMin0(src.timeRate ?? tenant_pricing.rate_per_hour),
    tenant_pricing,

    // S05: Volume discounts
    volume_discounts,

    updated_at: String(src.updated_at || src.updatedAt || nowIso()),
  };

  return normalizePricingConfigForEngine(normalized);
}

function migrateLegacyPricingConfigIfAny() {
  // IMPORTANT: This is best-effort only. Chat A is the primary owner of full migrations.
  // We migrate only if V3 namespace is empty.
  try {
    if (typeof window === 'undefined') return null;

    const legacyKeys = [
      // AdminPricing.jsx in some earlier versions
      'modelpricer_pricing_config__test-customer-1',
      // pricingService demo reader
      'admin_pricing_demo_v2:test-customer-1',
    ];

    for (const k of legacyKeys) {
      const raw = window.localStorage.getItem(k);
      if (!raw) continue;
      const parsed = safeParseJson(raw);
      if (!parsed) continue;

      const materialPrices = parsed.materialPrices || parsed?.config?.materialPrices || null;
      const tenant_pricing = parsed.tenant_pricing || parsed?.config?.tenant_pricing || null;
      const timeRate = parsed.timeRate ?? parsed?.config?.timeRate ?? tenant_pricing?.rate_per_hour ?? null;

      if (!materialPrices && !tenant_pricing) continue;

      return {
        schema_version: SCHEMA_VERSION,
        materials: materialPricesToMaterialsV3(materialPrices || {}),
        materialPrices: materialPrices && typeof materialPrices === 'object' ? materialPrices : undefined,
        timeRate: timeRate != null ? clampMin0(timeRate) : undefined,
        tenant_pricing: tenant_pricing && typeof tenant_pricing === 'object' ? tenant_pricing : undefined,
        migrated_from: k,
        migrated_at: nowIso(),
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Load pricing config from tenant-scoped V3 storage.
 * If missing, performs a small legacy migration attempt.
 *
 * CP2: Always returns a normalized config shape (incl. engine-root fields).
 */
export function loadPricingConfigV3() {
  const existing = readTenantJson(NAMESPACE, null);
  if (existing && typeof existing === 'object') {
    const normalized = normalizePricingConfigV3(existing);

    // Writeback only when shape is missing the engine-root fields.
    const tp = isObj(existing.tenant_pricing) ? existing.tenant_pricing : null;
    const tpRate = tp ? clampMin0(tp.rate_per_hour ?? tp.timeRate ?? 0) : null;
    const rootRate = clampMin0(existing.rate_per_hour ?? existing.timeRate ?? 0);

    const needsWriteback =
      existing.rate_per_hour == null ||
      existing.minimum_billed_minutes == null ||
      existing.minimum_price_per_model == null ||
      existing.minimum_order_total == null ||
      !isObj(existing.rounding) ||
      !isObj(existing.markup) ||
      (tpRate != null && tpRate > 0 && rootRate === 0);
    if (needsWriteback) writeTenantJson(NAMESPACE, normalized);
    return normalized;
  }

  const migrated = migrateLegacyPricingConfigIfAny();
  if (migrated) {
    const normalized = normalizePricingConfigV3(migrated);
    writeTenantJson(NAMESPACE, normalized);
    return normalized;
  }

  // Seed defaults so pricingEngine/pricingService never receive null.
  const seeded = getDefaultPricingConfigV3();
  writeTenantJson(NAMESPACE, seeded);
  return seeded;
}

/**
 * Save pricing config to tenant-scoped V3 storage.
 *
 * CP2: Always normalizes on save (idempotent, preserves legacy keys).
 */
export function savePricingConfigV3(config) {
  const tenantId = getTenantId();
  if (!tenantId) throw new Error('Missing tenantId');
  const normalized = normalizePricingConfigV3(config);
  const next = { ...normalized, updated_at: nowIso() };
  writeTenantJson(NAMESPACE, next);
  return next;
}
