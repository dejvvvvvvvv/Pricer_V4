// Demo-first storage helpers for Branding + Widget Instances.
//
// Phase (Varianta A):
// - Uses localStorage as the source of truth so Admin UI works without backend.
// - Shapes mirror the spec so later you can swap these helpers for real API calls.

const KEY = {
  branding: (tenantId) => `modelpricer_branding__${tenantId}`,
  widgets: (tenantId) => `modelpricer_widgets__${tenantId}`,
  plan: (tenantId) => `modelpricer_plan_features__${tenantId}`,
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
  const stored = lsGet(KEY.plan(tenantId), null);
  if (stored) return stored;
  const seed = getDefaultPlanFeatures();
  lsSet(KEY.plan(tenantId), seed);
  return seed;
}

export function setPlanFeatures(tenantId, next) {
  const data = {
    ...next,
    updated_at: nowIso(),
  };
  lsSet(KEY.plan(tenantId), data);
  return data;
}

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
  const stored = lsGet(KEY.branding(tenantId), null);
  const plan = getPlanFeatures(tenantId);

  const base = stored || getDefaultBranding();

  // Enforce plan gating: if tenant cannot hide powered by, it must stay enabled.
  if (!plan?.features?.can_hide_powered_by) {
    if (base.showPoweredBy !== true) {
      const enforced = { ...base, showPoweredBy: true };
      lsSet(KEY.branding(tenantId), enforced);
      return enforced;
    }
  }

  if (!stored) lsSet(KEY.branding(tenantId), base);
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

  lsSet(KEY.branding(tenantId), next);
  return next;
}

export function resetBrandingToDefaults(tenantId) {
  const plan = getPlanFeatures(tenantId);
  const defaults = getDefaultBranding();
  if (!plan?.features?.can_hide_powered_by) {
    defaults.showPoweredBy = true;
  }
  lsSet(KEY.branding(tenantId), defaults);
  return defaults;
}

/**
 * Default widget theme configuration.
 */
export function getDefaultWidgetTheme() {
  return {
    backgroundColor: '#FFFFFF',
    cardColor: '#F9FAFB',
    headerColor: '#1F2937',
    textColor: '#374151',
    mutedColor: '#6B7280',
    buttonPrimaryColor: '#2563EB',
    buttonTextColor: '#FFFFFF',
    buttonHoverColor: '#1D4ED8',
    inputBgColor: '#FFFFFF',
    inputBorderColor: '#D1D5DB',
    inputFocusColor: '#2563EB',
    summaryBgColor: '#F3F4F6',
    borderColor: '#E5E7EB',
    fontFamily: 'Inter, system-ui, sans-serif',
    cornerRadius: 12,
  };
}

export function getWidgets(tenantId) {
  const stored = lsGet(KEY.widgets(tenantId), null);
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
  lsSet(KEY.widgets(tenantId), seed);
  return seed;
}

export function saveWidgets(tenantId, widgets) {
  const next = (Array.isArray(widgets) ? widgets : []).map((w) => ({
    ...w,
    tenantId,
    updated_at: nowIso(),
  }));
  lsSet(KEY.widgets(tenantId), next);
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
  const host = raw.toLowerCase();
  const re = /^(?=.{1,253}$)(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))*$/;
  if (!re.test(host)) return { ok: false, reason: 'INVALID_HOSTNAME' };
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
 * Searches all tenants (for demo; in production this would be a server lookup).
 */
export function getWidgetByPublicId(publicWidgetId) {
  if (!publicWidgetId) return null;

  // In demo mode, we need to scan all known tenants
  // This is simplified - in production, the server would handle this lookup
  const allKeys = Object.keys(localStorage).filter((k) => k.startsWith('modelpricer_widgets__'));

  for (const key of allKeys) {
    const tenantId = key.replace('modelpricer_widgets__', '');
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
