// Ecommerce integration storage helpers (Shopify, future: WooCommerce).
//
// Storage: tenant-scoped via readTenantJson/writeTenantJson from adminTenantStorage.
// Namespace: ecommerce:v1
// Legacy key: modelpricer_ecommerce__${tenantId} (migrated on first read)

import { getTenantId, readTenantJson, writeTenantJson } from './adminTenantStorage';

const NAMESPACE = 'ecommerce:v1';

function nowIso() {
  return new Date().toISOString();
}

function rand(n = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const array = new Uint8Array(n);
  crypto.getRandomValues(array);
  return Array.from(array, b => chars[b % chars.length]).join('');
}

// ─── Legacy Migration ─────────────────────────────────────────

/**
 * One-time migration from legacy key format to tenant-scoped namespace.
 * Idempotent: skips if new key already has data.
 * Legacy key: modelpricer_ecommerce__${tenantId}
 */
function migrateLegacyEcommerceKey(tenantId) {
  if (typeof window === 'undefined') return;

  // Skip if new key already has data (idempotent)
  const existing = readTenantJson(NAMESPACE, null, tenantId);
  if (existing !== null) return;

  // Attempt to read legacy key
  const legacyKey = `modelpricer_ecommerce__${tenantId}`;
  const raw = window.localStorage.getItem(legacyKey);
  if (!raw) return;

  let legacyData;
  try {
    legacyData = JSON.parse(raw);
  } catch {
    return;
  }

  if (!legacyData) return;

  // Write to new namespace (idempotent — already confirmed new key is empty)
  writeTenantJson(NAMESPACE, legacyData, tenantId);

  // Remove legacy key to avoid stale data
  try {
    window.localStorage.removeItem(legacyKey);
  } catch {
    // Non-fatal: legacy key will simply be ignored from now on
  }
}

// ─── Default Config ───────────────────────────────────────────

export function getDefaultEcommerceConfig() {
  return {
    shopify: {
      enabled: false,
      shop_domain: '',
      storefront_access_token: '',
      checkout_mode: 'cart_permalink',
      currency: 'CZK',
      redirect_to: 'checkout',
      cart_note_template: 'ModelPricer: {modelCount} modelu',
      mapping_mode: 'per_variant',
      variant_mappings: [],
      fallback_variant_id: '',
      fee_handling: 'included_in_price',
      fee_variant_id: '',
      updated_at: '',
    },
    integrations_meta: {
      last_test_at: null,
      test_result: null,
      orders_sent_count: 0,
    },
  };
}

// ─── Full Config CRUD ─────────────────────────────────────────

export function getEcommerceConfig(tenantId) {
  const tid = tenantId || getTenantId();

  // Migrate legacy key before first read (idempotent)
  if (tid) migrateLegacyEcommerceKey(tid);

  const stored = readTenantJson(NAMESPACE, null, tid);
  if (stored) return stored;

  const seed = getDefaultEcommerceConfig();
  writeTenantJson(NAMESPACE, seed, tid);
  return seed;
}

export function saveEcommerceConfig(config, tenantId) {
  const tid = tenantId || getTenantId();
  const data = {
    ...config,
    shopify: {
      ...config.shopify,
      updated_at: nowIso(),
    },
  };
  writeTenantJson(NAMESPACE, data, tid);
  return data;
}

// ─── Shopify Config Shortcuts ─────────────────────────────────

export function getShopifyConfig(tenantId) {
  const config = getEcommerceConfig(tenantId);
  return config.shopify || getDefaultEcommerceConfig().shopify;
}

export function saveShopifyConfig(shopifyConfig, tenantId) {
  const config = getEcommerceConfig(tenantId);
  return saveEcommerceConfig({
    ...config,
    shopify: {
      ...config.shopify,
      ...shopifyConfig,
      updated_at: nowIso(),
    },
  }, tenantId);
}

// ─── Variant Mappings CRUD ────────────────────────────────────

export function getVariantMappings(tenantId) {
  const shopify = getShopifyConfig(tenantId);
  return Array.isArray(shopify.variant_mappings) ? shopify.variant_mappings : [];
}

export function saveVariantMappings(mappings, tenantId) {
  const shopify = getShopifyConfig(tenantId);
  return saveShopifyConfig({
    ...shopify,
    variant_mappings: mappings,
  }, tenantId);
}

export function addVariantMapping(mapping, tenantId) {
  const current = getVariantMappings(tenantId);
  const newMapping = {
    id: `vm_${rand(10)}`,
    material_key: mapping.material_key || '',
    quality_key: mapping.quality_key || 'standard',
    shopify_variant_id: mapping.shopify_variant_id || '',
    shopify_product_title: mapping.shopify_product_title || '',
    price_sync_mode: mapping.price_sync_mode || 'use_calculator',
    active: mapping.active !== false,
  };
  const next = [...current, newMapping];
  saveVariantMappings(next, tenantId);
  return newMapping;
}

export function updateVariantMapping(id, patch, tenantId) {
  const current = getVariantMappings(tenantId);
  const next = current.map(m => m.id === id ? { ...m, ...patch } : m);
  saveVariantMappings(next, tenantId);
  return next.find(m => m.id === id) || null;
}

export function deleteVariantMapping(id, tenantId) {
  const current = getVariantMappings(tenantId);
  const next = current.filter(m => m.id !== id);
  saveVariantMappings(next, tenantId);
  return next;
}

// ─── Variant Lookup ───────────────────────────────────────────

/**
 * Find the best matching Shopify variant for a given material+quality combo.
 * Returns the variant mapping object, or null if none found.
 * Falls back to fallback_variant_id if no specific mapping exists.
 */
export function findVariantForConfig(materialKey, qualityKey, tenantId) {
  const shopify = getShopifyConfig(tenantId);
  const mappings = Array.isArray(shopify.variant_mappings) ? shopify.variant_mappings : [];

  // Exact match (material + quality, active only)
  const exact = mappings.find(
    m => m.active && m.material_key === materialKey && m.quality_key === qualityKey
  );
  if (exact) return exact;

  // Material-only match (quality wildcard)
  const materialOnly = mappings.find(
    m => m.active && m.material_key === materialKey && (!m.quality_key || m.quality_key === '')
  );
  if (materialOnly) return materialOnly;

  // Fallback variant
  if (shopify.fallback_variant_id) {
    return {
      id: 'fallback',
      material_key: materialKey,
      quality_key: qualityKey,
      shopify_variant_id: shopify.fallback_variant_id,
      shopify_product_title: 'Fallback',
      price_sync_mode: 'use_calculator',
      active: true,
    };
  }

  return null;
}

// ─── Integration Meta ─────────────────────────────────────────

export function updateIntegrationsMeta(patch, tenantId) {
  const config = getEcommerceConfig(tenantId);
  return saveEcommerceConfig({
    ...config,
    integrations_meta: {
      ...config.integrations_meta,
      ...patch,
    },
  }, tenantId);
}
