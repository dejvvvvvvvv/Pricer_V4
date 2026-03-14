// Demo-first storage helpers for Branding + Widget Instances.
//
// Phase (Varianta A):
// - Uses localStorage as the source of truth so Admin UI works without backend.
// - Shapes mirror the spec so later you can swap these helpers for real API calls.
//
// Migration (2026-03):
// - Migrated from direct localStorage (lsGet/lsSet) to readTenantJson/writeTenantJson
//   from adminTenantStorage, which provides tenant-scoped namespaced keys, idempotent
//   writes, and Supabase dual-write out of the box.
// - Modern key namespaces: branding:v1, widgets:v1, plan_features:v1
// - Legacy keys (modelpricer_branding__<id> etc.) are migrated on first read via
//   migrateLegacyBrandingWidgetKeys(tenantId) — call once per session.

// Single source of truth for widget theme defaults — re-exported for backward compatibility.
import { getDefaultWidgetTheme } from './widgetThemeStorage';
export { getDefaultWidgetTheme };

import { readTenantJson, writeTenantJson } from '@/utils/adminTenantStorage';

// Namespace constants for modern tenant-scoped keys.
// Resulting localStorage key: modelpricer:<tenantId>:<NS.*>
const NS = {
  branding: 'branding:v1',
  widgets: 'widgets:v1',
  plan: 'plan_features:v1',
};

// Legacy key builders — used ONLY for migration reads.
const LEGACY_KEY = {
  branding: (tenantId) => `modelpricer_branding__${tenantId}`,
  widgets: (tenantId) => `modelpricer_widgets__${tenantId}`,
  plan: (tenantId) => `modelpricer_plan_features__${tenantId}`,
};

function nowIso() {
  return new Date().toISOString();
}

function rand(n = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const array = new Uint8Array(n);
  crypto.getRandomValues(array);
  return Array.from(array, b => chars[b % chars.length]).join('');
}

// ---------------------------------------------------------------------------
// Legacy migration
// ---------------------------------------------------------------------------

/**
 * One-time migration of legacy localStorage keys to the modern tenant-namespaced
 * format used by readTenantJson/writeTenantJson.
 *
 * Safe to call multiple times — if the modern key already has data the legacy
 * key is skipped (no overwrite). Call this once during admin session init.
 *
 * @param {string} tenantId
 */
export function migrateLegacyBrandingWidgetKeys(tenantId) {
  if (typeof window === 'undefined' || !tenantId) return;

  const migrations = [
    { legacy: LEGACY_KEY.branding(tenantId), ns: NS.branding },
    { legacy: LEGACY_KEY.widgets(tenantId),  ns: NS.widgets },
    { legacy: LEGACY_KEY.plan(tenantId),      ns: NS.plan },
  ];

  for (const { legacy, ns } of migrations) {
    // Only migrate if modern key has no data yet.
    const alreadyMigrated = readTenantJson(ns, null, tenantId);
    if (alreadyMigrated !== null) continue;

    const raw = window.localStorage.getItem(legacy);
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);
      writeTenantJson(ns, parsed, tenantId);
    } catch {
      // Corrupt legacy data — skip silently.
    }
  }
}

// ---------------------------------------------------------------------------
// Plan features
// ---------------------------------------------------------------------------

export function getDefaultPlanFeatures() {
  return {
    plan_name: 'Starter',
    features: {
      can_hide_powered_by: false,
      max_widget_instances: 2,
      // Team & Access (G)
      max_users: 3,
      can_use_domain_whitelist: true,
    },
    updated_at: nowIso(),
  };
}

export function getPlanFeatures(tenantId) {
  const stored = readTenantJson(NS.plan, null, tenantId);
  if (stored) return stored;
  const seed = getDefaultPlanFeatures();
  writeTenantJson(NS.plan, seed, tenantId);
  return seed;
}

export function setPlanFeatures(tenantId, next) {
  const data = {
    ...next,
    updated_at: nowIso(),
  };
  writeTenantJson(NS.plan, data, tenantId);
  return data;
}

// ---------------------------------------------------------------------------
// Branding
// ---------------------------------------------------------------------------

export function getDefaultBranding() {
  return {
    businessName: 'Moje 3D tiskárna',
    tagline: 'Rychlá kalkulace a objednávka',
    logo: null,
    primaryColor: '#2563EB',
    secondaryColor: '#10B981',
    backgroundColor: '#FFFFFF',
    fontFamily: 'Inter',
    showLogo: true,
    showBusinessName: true,
    showTagline: true,
    showPoweredBy: true,
    cornerRadius: 12,
    updated_at: nowIso(),
    updated_by: 'admin',
  };
}

export function getBranding(tenantId) {
  const stored = readTenantJson(NS.branding, null, tenantId);
  const plan = getPlanFeatures(tenantId);

  const base = stored || getDefaultBranding();

  // Enforce plan gating: if tenant cannot hide powered by, it must stay enabled.
  if (!plan?.features?.can_hide_powered_by) {
    if (base.showPoweredBy !== true) {
      const enforced = { ...base, showPoweredBy: true };
      writeTenantJson(NS.branding, enforced, tenantId);
      return enforced;
    }
  }

  if (!stored) writeTenantJson(NS.branding, base, tenantId);
  return base;
}

export function saveBranding(tenantId, brandingInput, updatedBy = 'admin') {
  const plan = getPlanFeatures(tenantId);

  const next = {
    ...brandingInput,
    updated_at: nowIso(),
    updated_by: updatedBy,
  };

  // Server-like enforcement (demo): powered-by gating.
  if (!plan?.features?.can_hide_powered_by) {
    next.showPoweredBy = true;
  }

  writeTenantJson(NS.branding, next, tenantId);
  return next;
}

export function resetBrandingToDefaults(tenantId) {
  const plan = getPlanFeatures(tenantId);
  const defaults = getDefaultBranding();
  if (!plan?.features?.can_hide_powered_by) {
    defaults.showPoweredBy = true;
  }
  writeTenantJson(NS.branding, defaults, tenantId);
  return defaults;
}

// ---------------------------------------------------------------------------
// Widgets
// ---------------------------------------------------------------------------

// getDefaultWidgetTheme is imported and re-exported from widgetThemeStorage.js (top of file).

export function getWidgets(tenantId) {
  const stored = readTenantJson(NS.widgets, null, tenantId);
  if (stored && Array.isArray(stored)) return stored;

  // Seed with a default widget instance so the page isn't empty.
  const seed = [
    {
      id: `w_${rand(10)}`,
      publicId: `wid_${rand(5)}${rand(5)}`,
      tenantId,
      name: 'Homepage',
      status: 'active',
      type: 'full_calculator',
      themeMode: 'auto',
      primaryColorOverride: null,
      widthMode: 'fixed',
      widthPx: 800,
      localeDefault: 'cs',
      configProfileId: null,
      themeConfig: getDefaultWidgetTheme(),
      domains: [],
      created_at: nowIso(),
      updated_at: nowIso(),
    },
  ];
  writeTenantJson(NS.widgets, seed, tenantId);
  return seed;
}

export function saveWidgets(tenantId, widgets) {
  const next = (Array.isArray(widgets) ? widgets : []).map((w) => ({
    ...w,
    tenantId,
    updated_at: nowIso(),
  }));
  writeTenantJson(NS.widgets, next, tenantId);
  return next;
}

export function createWidget(tenantId, input) {
  const plan = getPlanFeatures(tenantId);
  const current = getWidgets(tenantId);
  const max = plan?.features?.max_widget_instances ?? 1;
  if (current.length >= max) {
    const err = new Error('MAX_WIDGET_INSTANCES_REACHED');
    err.code = 'MAX_WIDGET_INSTANCES_REACHED';
    err.max = max;
    throw err;
  }

  const widget = {
    id: `w_${rand(12)}`,
    publicId: `wid_${rand(4)}${rand(4)}`,
    tenantId,
    name: input?.name?.trim() || `Widget ${current.length + 1}`,
    status: 'active',
    type: input?.type || 'full_calculator',
    themeMode: input?.themeMode || 'auto',
    primaryColorOverride: input?.primaryColorOverride ?? null,
    widthMode: input?.widthMode || 'fixed',
    widthPx: typeof input?.widthPx === 'number' ? input.widthPx : 800,
    localeDefault: input?.localeDefault || 'cs',
    configProfileId: input?.configProfileId ?? null,
    themeConfig: input?.themeConfig ?? getDefaultWidgetTheme(),
    domains: [],
    created_at: nowIso(),
    updated_at: nowIso(),
  };

  const next = [...current, widget];
  saveWidgets(tenantId, next);
  return widget;
}

export function duplicateWidget(tenantId, widgetId) {
  const plan = getPlanFeatures(tenantId);
  const current = getWidgets(tenantId);
  const max = plan?.features?.max_widget_instances ?? 1;
  if (current.length >= max) {
    const err = new Error('MAX_WIDGET_INSTANCES_REACHED');
    err.code = 'MAX_WIDGET_INSTANCES_REACHED';
    err.max = max;
    throw err;
  }

  const src = current.find((w) => w.id === widgetId);
  if (!src) return null;

  const copy = {
    ...src,
    id: `w_${rand(12)}`,
    publicId: `wid_${rand(4)}${rand(4)}`,
    name: `${src.name} (kopie)`,
    status: 'active',
    created_at: nowIso(),
    updated_at: nowIso(),
    domains: (src.domains || []).map((d) => ({ ...d, id: `d_${rand(10)}` })),
  };

  const next = [...current, copy];
  saveWidgets(tenantId, next);
  return copy;
}

export function deleteWidget(tenantId, widgetId) {
  const current = getWidgets(tenantId);
  const next = current.filter((w) => w.id !== widgetId);
  saveWidgets(tenantId, next);
  return next;
}

export function toggleWidgetStatus(tenantId, widgetId, status) {
  const current = getWidgets(tenantId);
  const next = current.map((w) =>
    w.id === widgetId
      ? {
          ...w,
          status: status || (w.status === 'active' ? 'disabled' : 'active'),
          updated_at: nowIso(),
        }
      : w
  );
  saveWidgets(tenantId, next);
  return next.find((w) => w.id === widgetId);
}

export function updateWidget(tenantId, widgetId, patch) {
  const current = getWidgets(tenantId);
  const next = current.map((w) =>
    w.id === widgetId
      ? {
          ...w,
          ...patch,
          tenantId,
          updated_at: nowIso(),
        }
      : w
  );
  saveWidgets(tenantId, next);
  return next.find((w) => w.id === widgetId);
}

// Convenience helper used by Admin UI.
// Returns the domain whitelist list for a given widget instance.
// (In Varianta A we store domains directly on the widget object.)
export function getWidgetDomains(tenantId, widgetId) {
  const current = getWidgets(tenantId);
  const widget = current.find((w) => w.id === widgetId || w.publicId === widgetId);
  return widget ? widget.domains || [] : [];
}

export function validateDomainInput(domainInput) {
  const raw = (domainInput || '').trim();
  if (!raw) return { ok: false, reason: 'EMPTY' };
  if (raw.includes('://')) return { ok: false, reason: 'PROTOCOL_NOT_ALLOWED' };
  if (raw.includes('/')) return { ok: false, reason: 'PATH_NOT_ALLOWED' };
  if (raw.includes(' ')) return { ok: false, reason: 'SPACE_NOT_ALLOWED' };

  // Basic hostname validation (allows punycode and subdomains).
  // Rewritten without lookbehind (?<!-) for Safari < 16.4 compatibility.
  const host = raw.toLowerCase();
  if (host.length > 253) return { ok: false, reason: 'INVALID_HOSTNAME' };
  const labels = host.split('.');
  for (const label of labels) {
    if (label.length === 0 || label.length > 63) return { ok: false, reason: 'INVALID_HOSTNAME' };
    if (!/^[a-z0-9-]+$/.test(label)) return { ok: false, reason: 'INVALID_HOSTNAME' };
    if (label.startsWith('-') || label.endsWith('-')) return { ok: false, reason: 'INVALID_HOSTNAME' };
  }
  if (!host.includes('.')) return { ok: false, reason: 'MISSING_TLD' };
  return { ok: true, host };
}

export function addWidgetDomain(tenantId, widgetId, domain, allowSubdomains = false) {
  const plan = getPlanFeatures(tenantId);
  if (!plan?.features?.can_use_domain_whitelist) {
    const err = new Error('DOMAIN_WHITELIST_NOT_AVAILABLE');
    err.code = 'DOMAIN_WHITELIST_NOT_AVAILABLE';
    throw err;
  }

  const v = validateDomainInput(domain);
  if (!v.ok) {
    const err = new Error('INVALID_DOMAIN');
    err.code = 'INVALID_DOMAIN';
    err.reason = v.reason;
    throw err;
  }

  const current = getWidgets(tenantId);
  const widget = current.find((w) => w.id === widgetId);
  if (!widget) return null;

  const existing = (widget.domains || []).some((d) => d.domain === v.host);
  if (existing) {
    const err = new Error('DOMAIN_ALREADY_EXISTS');
    err.code = 'DOMAIN_ALREADY_EXISTS';
    throw err;
  }

  const nextDomain = {
    id: `d_${rand(10)}`,
    domain: v.host,
    allowSubdomains: !!allowSubdomains,
    isActive: true,
    created_at: nowIso(),
  };

  updateWidget(tenantId, widgetId, {
    domains: [...(widget.domains || []), nextDomain],
  });

  return nextDomain;
}

export function toggleWidgetDomain(tenantId, widgetId, domainId, isActive) {
  const current = getWidgets(tenantId);
  const widget = current.find((w) => w.id === widgetId);
  if (!widget) return null;
  const domains = (widget.domains || []).map((d) =>
    d.id === domainId ? { ...d, isActive: typeof isActive === 'boolean' ? isActive : !d.isActive } : d
  );
  updateWidget(tenantId, widgetId, { domains });
  return domains.find((d) => d.id === domainId);
}

export function deleteWidgetDomain(tenantId, widgetId, domainId) {
  const current = getWidgets(tenantId);
  const widget = current.find((w) => w.id === widgetId);
  if (!widget) return null;
  const domains = (widget.domains || []).filter((d) => d.id !== domainId);
  updateWidget(tenantId, widgetId, { domains });
  return domains;
}

export function isDomainAllowedByWhitelist(hostname, domains) {
  const host = (hostname || '').toLowerCase();
  const list = Array.isArray(domains) ? domains.filter((d) => d.isActive) : [];
  for (const d of list) {
    if (host === d.domain) return true;
    if (d.allowSubdomains && host.endsWith(`.${d.domain}`)) return true;
  }
  return false;
}

/**
 * Get widget by its public ID (for public widget route).
 *
 * Scans both modern keys (modelpricer:<tenantId>:widgets:v1) and legacy keys
 * (modelpricer_widgets__<tenantId>) during the transition period so existing
 * embedded widgets continue to resolve while legacy data is still present.
 *
 * @param {string} publicWidgetId — the widget's public identifier.
 * @param {string|null} scopeTenantId — when provided, only this tenant's
 *   widgets are searched (tenant-scoped lookup). When null, all tenants are
 *   scanned (demo/localStorage only; production should use Supabase RLS query).
 */
export function getWidgetByPublicId(publicWidgetId, scopeTenantId = null) {
  if (!publicWidgetId) return null;
  if (typeof window === 'undefined') return null;

  if (scopeTenantId) {
    // Fast path: scoped lookup — check modern key only (legacy was already migrated
    // for this tenant via migrateLegacyBrandingWidgetKeys if called at session start).
    const widgets = getWidgets(scopeTenantId);
    const match = widgets.find((w) => w.publicId === publicWidgetId);
    return match ? { widget: match, tenantId: scopeTenantId } : null;
  }

  // Public route lookup — scan all tenants present in localStorage.
  // Collect tenant IDs from both modern and legacy key formats.
  const tenantIds = new Set();

  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (!k) continue;

    // Modern format: modelpricer:<tenantId>:widgets:v1
    const modernMatch = k.match(/^modelpricer:([^:]+):widgets:v1$/);
    if (modernMatch) {
      tenantIds.add(modernMatch[1]);
      continue;
    }

    // Legacy format: modelpricer_widgets__<tenantId>
    if (k.startsWith('modelpricer_widgets__')) {
      tenantIds.add(k.slice('modelpricer_widgets__'.length));
    }
  }

  for (const tenantId of tenantIds) {
    const widgets = getWidgets(tenantId);
    const match = widgets.find((w) => w.publicId === publicWidgetId);
    if (match) {
      return { widget: match, tenantId };
    }
  }

  return null;
}

/**
 * Update widget theme configuration.
 */
export function updateWidgetTheme(tenantId, widgetId, themeConfig) {
  const current = getWidgets(tenantId);
  const widget = current.find((w) => w.id === widgetId);
  if (!widget) return null;

  const mergedTheme = {
    ...getDefaultWidgetTheme(),
    ...(widget.themeConfig || {}),
    ...themeConfig,
  };

  return updateWidget(tenantId, widgetId, { themeConfig: mergedTheme });
}
