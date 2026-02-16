// Ecommerce integration storage helpers (Shopify, future: WooCommerce).
//
// Phase (Varianta A):
// - Uses localStorage as the source of truth.
// - Shapes mirror the spec so later you can swap for real API calls.
// - Supabase dual-write (fire-and-forget) when feature flag enabled.

import { storageAdapter } from '../lib/supabase/storageAdapter';
import { getStorageMode } from '../lib/supabase/featureFlags';
import { isSupabaseAvailable } from '../lib/supabase/client';
import { getTenantId } from './adminTenantStorage';

const KEY = {
  ecommerce: (tenantId) => `modelpricer_ecommerce__${tenantId}`,
};

function nowIso() {
  return new Date().toISOString();
}

function safeJsonParse(raw, fallback) {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function lsGet(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  return safeJsonParse(raw, fallback);
}

function lsSet(key, value) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function rand(n = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < n; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

// ─── Default Config ──────────────────────────────────────────

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

// ─── Full Config CRUD ────────────────────────────────────────

export function getEcommerceConfig(tenantId) {
  const tid = tenantId || getTenantId();
  const stored = lsGet(KEY.ecommerce(tid), null);
  if (stored) return stored;
  const seed = getDefaultEcommerceConfig();
  lsSet(KEY.ecommerce(tid), seed);
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
  lsSet(KEY.ecommerce(tid), data);

  // Fire-and-forget Supabase dual-write
  const mode = getStorageMode('ecommerce');
  if ((mode === 'supabase' || mode === 'dual-write') && isSupabaseAvailable()) {
    storageAdapter.supabase.writeConfig('tenant_configs', tid, 'ecommerce', data)
      .catch(err => console.warn('[ecommerce] Supabase write failed:', err.message));
  }

  return data;
}

// ─── Shopify Config Shortcuts ────────────────────────────────

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

// ─── Variant Mappings CRUD ───────────────────────────────────

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

// ─── Variant Lookup ──────────────────────────────────────────

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

// ─── Integration Meta ────────────────────────────────────────

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
