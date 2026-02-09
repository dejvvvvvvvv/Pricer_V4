/*
  Feature Flags — per-namespace switching between localStorage and Supabase.

  Three modes per namespace:
  - 'localStorage'  — read/write only localStorage (current default)
  - 'supabase'      — read/write only Supabase
  - 'dual-write'    — write to BOTH, read from Supabase (migration transition)

  Usage:
    import { getStorageMode, setStorageMode } from '@/lib/supabase/featureFlags';
    const mode = getStorageMode('orders:v1'); // 'localStorage' | 'supabase' | 'dual-write'
*/

const STORAGE_KEY = 'modelpricer:feature_flags:storage_modes';

// All known namespaces — mirrors the storage helpers
const ALL_NAMESPACES = [
  'pricing:v3',
  'fees:v3',
  'orders:v1',
  'orders:activity:v1',
  'shipping:v1',
  'coupons:v1',
  'express:v1',
  'form:v1',
  'email:v1',
  'kanban:v1',
  'dashboard:v1',
  'dashboard:v2',
  'audit_log',
  'analytics:events',
  'team_users',
  'team_invites',
  'branding',
  'widgets',
  'plan_features',
  'widget_theme',
];

const VALID_MODES = ['localStorage', 'supabase', 'dual-write'];

/**
 * Load all feature flags from localStorage.
 */
function loadFlags() {
  try {
    if (typeof window === 'undefined') return {};
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Save feature flags to localStorage.
 */
function saveFlags(flags) {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
  } catch {
    // silently fail
  }
}

/**
 * Get the storage mode for a specific namespace.
 * Defaults to 'localStorage' if not set.
 */
export function getStorageMode(namespace) {
  const flags = loadFlags();
  const mode = flags[namespace];
  return VALID_MODES.includes(mode) ? mode : 'localStorage';
}

/**
 * Set the storage mode for a specific namespace.
 */
export function setStorageMode(namespace, mode) {
  if (!VALID_MODES.includes(mode)) {
    console.warn(`[featureFlags] Invalid mode "${mode}". Valid: ${VALID_MODES.join(', ')}`);
    return;
  }
  const flags = loadFlags();
  flags[namespace] = mode;
  saveFlags(flags);
}

/**
 * Set storage mode for ALL namespaces at once.
 * Useful for bulk rollout.
 */
export function setAllStorageModes(mode) {
  if (!VALID_MODES.includes(mode)) {
    console.warn(`[featureFlags] Invalid mode "${mode}".`);
    return;
  }
  const flags = {};
  for (const ns of ALL_NAMESPACES) {
    flags[ns] = mode;
  }
  saveFlags(flags);
}

/**
 * Get a summary of all namespace modes.
 * Returns { namespace: mode } for all known namespaces.
 */
export function getAllStorageModes() {
  const flags = loadFlags();
  const result = {};
  for (const ns of ALL_NAMESPACES) {
    result[ns] = VALID_MODES.includes(flags[ns]) ? flags[ns] : 'localStorage';
  }
  return result;
}

/**
 * Check if Supabase is enabled for a given namespace
 * (either 'supabase' or 'dual-write' mode).
 */
export function isSupabaseEnabled(namespace) {
  const mode = getStorageMode(namespace);
  return mode === 'supabase' || mode === 'dual-write';
}

/**
 * Check if localStorage writes are enabled for a given namespace
 * (either 'localStorage' or 'dual-write' mode).
 */
export function isLocalStorageEnabled(namespace) {
  const mode = getStorageMode(namespace);
  return mode === 'localStorage' || mode === 'dual-write';
}

export { ALL_NAMESPACES, VALID_MODES };
