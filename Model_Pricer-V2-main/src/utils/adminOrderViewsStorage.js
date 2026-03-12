/*
  Admin Order Views — Tenant-scoped Storage (V1)
  -----------------------------------------------
  Purpose:
  - Provide ONE tenant-scoped storage entrypoint for saved order filter views.
  - Each view stores a named filter configuration (status, material, preset, flags, dates, sort).
  - Supports built-in views and user-created custom views.

  Namespace: order-views:v1
*/

import { readTenantJson, writeTenantJson } from './adminTenantStorage';
import { generateId } from './generateId';

const NS_ORDER_VIEWS = 'order-views:v1';

function nowIso() {
  return new Date().toISOString();
}

/**
 * Built-in views that are always available (cannot be deleted/edited).
 * Filters use arrays for Set-based fields (statusFilter, materialFilter, etc.).
 */
export const BUILTIN_VIEWS = [
  {
    id: '__all',
    name: 'Vsechny objednavky',
    builtin: true,
    filters: {},
  },
  {
    id: '__active',
    name: 'Aktivni',
    builtin: true,
    filters: {
      statusFilter: ['NEW', 'REVIEW', 'APPROVED', 'PRINTING', 'POSTPROCESS'],
    },
  },
  {
    id: '__completed',
    name: 'Dokoncene',
    builtin: true,
    filters: {
      statusFilter: ['DONE', 'SHIPPED'],
    },
  },
  {
    id: '__overdue',
    name: 'Po termine',
    builtin: true,
    filters: {
      flagFilter: ['OVERDUE'],
    },
  },
  {
    id: '__today',
    name: 'Dnes',
    builtin: true,
    filters: {
      // dateFrom/dateTo are computed dynamically at apply time
      _dynamic: 'today',
    },
  },
];

/**
 * Normalize a single view object.
 */
function normalizeView(v) {
  if (!v || typeof v !== 'object') return null;
  return {
    id: String(v.id || '').trim() || generateId('view'),
    name: String(v.name || '').trim() || 'Bez nazvu',
    builtin: !!v.builtin,
    filters: v.filters && typeof v.filters === 'object' ? v.filters : {},
    isDefault: !!v.isDefault,
    createdAt: v.createdAt || nowIso(),
  };
}

/**
 * Load all saved custom views from tenant storage.
 * @returns {{ views: Array, defaultViewId: string|null }}
 */
export function loadOrderViews() {
  const stored = readTenantJson(NS_ORDER_VIEWS, null);
  if (!stored || typeof stored !== 'object') {
    return { views: [], defaultViewId: null };
  }
  const rawViews = Array.isArray(stored.views) ? stored.views : [];
  const views = rawViews.map(normalizeView).filter(Boolean);
  return {
    views,
    defaultViewId: stored.defaultViewId || null,
  };
}

/**
 * Save custom views to tenant storage.
 */
export function saveOrderViews(views, defaultViewId = null) {
  const normalized = (Array.isArray(views) ? views : [])
    .map(normalizeView)
    .filter(Boolean)
    .filter((v) => !v.builtin); // never persist built-in views
  writeTenantJson(NS_ORDER_VIEWS, {
    views: normalized,
    defaultViewId: defaultViewId || null,
    updatedAt: nowIso(),
  });
}

/**
 * Add a new custom view.
 * @param {string} name - View name
 * @param {object} filters - Current filter state serialized
 * @returns {object} The newly created view
 */
export function addOrderView(name, filters) {
  const { views, defaultViewId } = loadOrderViews();
  const newView = normalizeView({
    id: generateId('view'),
    name,
    filters,
    isDefault: false,
    createdAt: nowIso(),
  });
  const next = [...views, newView];
  saveOrderViews(next, defaultViewId);
  return newView;
}

/**
 * Update an existing custom view.
 */
export function updateOrderView(viewId, updates) {
  const { views, defaultViewId } = loadOrderViews();
  const next = views.map((v) => {
    if (v.id !== viewId) return v;
    return normalizeView({ ...v, ...updates });
  });
  saveOrderViews(next, defaultViewId);
}

/**
 * Delete a custom view.
 */
export function deleteOrderView(viewId) {
  const { views, defaultViewId } = loadOrderViews();
  const next = views.filter((v) => v.id !== viewId);
  const newDefault = defaultViewId === viewId ? null : defaultViewId;
  saveOrderViews(next, newDefault);
}

/**
 * Set a view as default (loads on page open).
 * Pass null to clear default.
 */
export function setDefaultOrderView(viewId) {
  const { views } = loadOrderViews();
  // Mark the view
  const next = views.map((v) => ({
    ...v,
    isDefault: v.id === viewId,
  }));
  saveOrderViews(next, viewId);
}

/**
 * Serialize current filter state from React state into a storable object.
 * Sets are converted to arrays.
 */
export function serializeFilters({
  statusFilter,
  materialFilter,
  presetFilter,
  flagFilter,
  dateFrom,
  dateTo,
  sortKey,
}) {
  const f = {};
  if (statusFilter && statusFilter.size > 0) f.statusFilter = Array.from(statusFilter);
  if (materialFilter && materialFilter.size > 0) f.materialFilter = Array.from(materialFilter);
  if (presetFilter && presetFilter.size > 0) f.presetFilter = Array.from(presetFilter);
  if (flagFilter && flagFilter.size > 0) f.flagFilter = Array.from(flagFilter);
  if (dateFrom) f.dateFrom = dateFrom;
  if (dateTo) f.dateTo = dateTo;
  if (sortKey && sortKey !== 'newest') f.sortKey = sortKey;
  return f;
}

/**
 * Apply a view's filters to the React state setters.
 * Handles dynamic views (e.g. "today").
 */
export function applyViewFilters(view, setters) {
  const {
    setStatusFilter,
    setMaterialFilter,
    setPresetFilter,
    setFlagFilter,
    setDateFrom,
    setDateTo,
    setSortKey,
    setQ,
  } = setters;

  const filters = view?.filters || {};

  // Clear search
  if (setQ) setQ('');

  // Handle dynamic views
  if (filters._dynamic === 'today') {
    const today = new Date().toISOString().slice(0, 10);
    setDateFrom(today);
    setDateTo(today);
    setStatusFilter(new Set());
    setMaterialFilter(new Set());
    setPresetFilter(new Set());
    setFlagFilter(new Set());
    setSortKey('newest');
    return;
  }

  // Apply stored filters
  setStatusFilter(new Set(Array.isArray(filters.statusFilter) ? filters.statusFilter : []));
  setMaterialFilter(new Set(Array.isArray(filters.materialFilter) ? filters.materialFilter : []));
  setPresetFilter(new Set(Array.isArray(filters.presetFilter) ? filters.presetFilter : []));
  setFlagFilter(new Set(Array.isArray(filters.flagFilter) ? filters.flagFilter : []));
  setDateFrom(filters.dateFrom || '');
  setDateTo(filters.dateTo || '');
  setSortKey(filters.sortKey || 'newest');
}

/**
 * Get all views (built-in + custom) in display order.
 */
export function getAllViews() {
  const { views, defaultViewId } = loadOrderViews();
  const allViews = [
    ...BUILTIN_VIEWS.map((v) => ({ ...v, isDefault: v.id === defaultViewId })),
    ...views.map((v) => ({ ...v, isDefault: v.id === defaultViewId })),
  ];
  return { allViews, defaultViewId };
}

/**
 * Check if current filter state has any active filters (useful for "Save as view" visibility).
 */
export function hasActiveFilters({
  statusFilter,
  materialFilter,
  presetFilter,
  flagFilter,
  dateFrom,
  dateTo,
  sortKey,
}) {
  return (
    (statusFilter && statusFilter.size > 0) ||
    (materialFilter && materialFilter.size > 0) ||
    (presetFilter && presetFilter.size > 0) ||
    (flagFilter && flagFilter.size > 0) ||
    !!dateFrom ||
    !!dateTo ||
    (sortKey && sortKey !== 'newest')
  );
}
