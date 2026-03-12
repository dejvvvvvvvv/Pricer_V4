/*
  Admin Settings — Tenant-scoped Storage (V1)
  --------------------------------------------
  Purpose:
  - Store admin panel preferences per tenant.
  - Covers: general, order, notification, display and data-management settings.
  - Namespace: settings:v1

  Notes:
  - Uses adminTenantStorage helpers — never direct localStorage.
  - Schema is versioned for future migration.
*/

import { readTenantJson, writeTenantJson } from './adminTenantStorage';

const NS_SETTINGS_V1 = 'settings:v1';
const SCHEMA_VERSION = 1;

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

export function getDefaultSettings() {
  return {
    schema_version: SCHEMA_VERSION,

    // General
    currency: 'CZK',
    language: 'cs',
    timezone: 'Europe/Prague',
    dateFormat: 'DD.MM.YYYY',
    decimalSeparator: ',',

    // Orders
    orderAutoNumber: true,
    orderNumberPrefix: 'ORD',
    orderNumberFormat: '{PREFIX}-{YYYY}-{NNNN}',
    orderDefaultStatus: 'NEW',
    orderAutoArchiveDays: 90,

    // Notifications
    emailNotifications: true,
    soundNotifications: false,
    desktopNotifications: false,

    // Display
    defaultAdminView: 'dashboard',
    itemsPerPage: 25,
    dateDisplayFormat: 'relative',
    compactMode: false,

    updated_at: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Normalize (merge incoming data with defaults, strip unknown keys)
// ---------------------------------------------------------------------------

export function normalizeSettings(input) {
  const defaults = getDefaultSettings();
  const src = input && typeof input === 'object' ? input : {};

  return {
    schema_version: SCHEMA_VERSION,

    // General
    currency: validOption(src.currency, ['CZK', 'EUR', 'USD'], defaults.currency),
    language: validOption(src.language, ['cs', 'en'], defaults.language),
    timezone: typeof src.timezone === 'string' && src.timezone.trim() ? src.timezone.trim() : defaults.timezone,
    dateFormat: validOption(src.dateFormat, ['DD.MM.YYYY', 'YYYY-MM-DD', 'MM/DD/YYYY'], defaults.dateFormat),
    decimalSeparator: validOption(src.decimalSeparator, [',', '.'], defaults.decimalSeparator),

    // Orders
    orderAutoNumber: toBool(src.orderAutoNumber, defaults.orderAutoNumber),
    orderNumberPrefix: sanitizePrefix(src.orderNumberPrefix, defaults.orderNumberPrefix),
    orderNumberFormat: typeof src.orderNumberFormat === 'string' && src.orderNumberFormat.trim()
      ? src.orderNumberFormat.trim()
      : defaults.orderNumberFormat,
    orderDefaultStatus: validOption(
      src.orderDefaultStatus,
      ['NEW', 'REVIEW', 'APPROVED'],
      defaults.orderDefaultStatus,
    ),
    orderAutoArchiveDays: clampInt(src.orderAutoArchiveDays, 0, 365, defaults.orderAutoArchiveDays),

    // Notifications
    emailNotifications: toBool(src.emailNotifications, defaults.emailNotifications),
    soundNotifications: toBool(src.soundNotifications, defaults.soundNotifications),
    desktopNotifications: toBool(src.desktopNotifications, defaults.desktopNotifications),

    // Display
    defaultAdminView: validOption(src.defaultAdminView, ['dashboard', 'orders'], defaults.defaultAdminView),
    itemsPerPage: validOption(src.itemsPerPage, [10, 25, 50, 100], defaults.itemsPerPage),
    dateDisplayFormat: validOption(src.dateDisplayFormat, ['relative', 'absolute'], defaults.dateDisplayFormat),
    compactMode: toBool(src.compactMode, defaults.compactMode),

    updated_at: typeof src.updated_at === 'string' ? src.updated_at : new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export function loadSettings() {
  const stored = readTenantJson(NS_SETTINGS_V1, null);
  if (stored && typeof stored === 'object') {
    return normalizeSettings(stored);
  }
  // Seed defaults
  const defaults = normalizeSettings(getDefaultSettings());
  writeTenantJson(NS_SETTINGS_V1, defaults);
  return defaults;
}

export function saveSettings(data) {
  const normalized = normalizeSettings(data);
  const next = { ...normalized, updated_at: new Date().toISOString() };
  writeTenantJson(NS_SETTINGS_V1, next);
  return next;
}

export function resetSettings() {
  const defaults = normalizeSettings(getDefaultSettings());
  const next = { ...defaults, updated_at: new Date().toISOString() };
  writeTenantJson(NS_SETTINGS_V1, next);
  return next;
}

// ---------------------------------------------------------------------------
// Option lists (exported for UI)
// ---------------------------------------------------------------------------

export const CURRENCY_OPTIONS = [
  { value: 'CZK', label: 'CZK (Kc)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'USD', label: 'USD ($)' },
];

export const LANGUAGE_OPTIONS = [
  { value: 'cs', label: 'Cestina' },
  { value: 'en', label: 'English' },
];

export const TIMEZONE_OPTIONS = [
  { value: 'Europe/Prague', label: 'Europe/Prague (CET)' },
  { value: 'Europe/London', label: 'Europe/London (GMT)' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin (CET)' },
  { value: 'America/New_York', label: 'America/New_York (EST)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)' },
];

export const DATE_FORMAT_OPTIONS = [
  { value: 'DD.MM.YYYY', label: '31.12.2026' },
  { value: 'YYYY-MM-DD', label: '2026-12-31' },
  { value: 'MM/DD/YYYY', label: '12/31/2026' },
];

export const DECIMAL_SEPARATOR_OPTIONS = [
  { value: ',', label: 'Carka (1 234,56)' },
  { value: '.', label: 'Tecka (1,234.56)' },
];

export const ORDER_STATUS_OPTIONS = [
  { value: 'NEW', label: 'Nova' },
  { value: 'REVIEW', label: 'Ke kontrole' },
  { value: 'APPROVED', label: 'Schvalena' },
];

export const ITEMS_PER_PAGE_OPTIONS = [
  { value: 10, label: '10' },
  { value: 25, label: '25' },
  { value: 50, label: '50' },
  { value: 100, label: '100' },
];

export const DATE_DISPLAY_OPTIONS = [
  { value: 'relative', label: 'Relativni (pred 2 hodinami)' },
  { value: 'absolute', label: 'Absolutni (12.03.2026 14:30)' },
];

export const DEFAULT_VIEW_OPTIONS = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'orders', label: 'Objednavky' },
];

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function toBool(v, fallback) {
  if (v === true || v === 1 || v === '1') return true;
  if (v === false || v === 0 || v === '0') return false;
  return fallback;
}

function validOption(v, allowed, fallback) {
  return allowed.includes(v) ? v : fallback;
}

function clampInt(v, min, max, fallback) {
  const n = parseInt(v, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function sanitizePrefix(v, fallback) {
  if (typeof v !== 'string') return fallback;
  const trimmed = v.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 10);
  return trimmed || fallback;
}
