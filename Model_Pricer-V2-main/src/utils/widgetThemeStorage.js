/**
 * Widget Theme Storage - manages CSS theme configuration for embeddable widgets.
 * Uses localStorage as source of truth (Varianta A demo).
 */

import { getTenantId } from './adminTenantStorage';

const THEME_KEY_PREFIX = 'modelpricer:widget_theme';

function getThemeKey(tenantId) {
  return `${THEME_KEY_PREFIX}:${tenantId}`;
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

/**
 * Default theme configuration for widget.
 * These values are used when no custom theme is set.
 */
export function getDefaultWidgetTheme() {
  return {
    // Background colors
    backgroundColor: '#FFFFFF',
    cardColor: '#F9FAFB',

    // Text colors
    headerColor: '#1F2937',
    textColor: '#374151',
    mutedColor: '#6B7280',

    // Button colors
    buttonPrimaryColor: '#2563EB',
    buttonTextColor: '#FFFFFF',
    buttonHoverColor: '#1D4ED8',

    // Input colors
    inputBgColor: '#FFFFFF',
    inputBorderColor: '#D1D5DB',
    inputFocusColor: '#2563EB',

    // Summary/result area
    summaryBgColor: '#F3F4F6',

    // Border & misc
    borderColor: '#E5E7EB',

    // Typography
    fontFamily: 'Inter, system-ui, sans-serif',

    // Dimensions
    cornerRadius: 12,

    // Metadata
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Get widget theme for current tenant.
 * Falls back to defaults if not set.
 */
export function getWidgetTheme(tenantIdOverride = null) {
  const tenantId = tenantIdOverride || getTenantId();
  const stored = lsGet(getThemeKey(tenantId), null);

  if (stored) {
    // Merge with defaults to ensure all keys exist
    return { ...getDefaultWidgetTheme(), ...stored };
  }

  return getDefaultWidgetTheme();
}

/**
 * Save widget theme for current tenant.
 * Merges with existing theme to preserve unset values.
 */
export function saveWidgetTheme(themeUpdate, tenantIdOverride = null) {
  const tenantId = tenantIdOverride || getTenantId();
  const existing = getWidgetTheme(tenantId);

  const next = {
    ...existing,
    ...themeUpdate,
    updatedAt: new Date().toISOString(),
  };

  lsSet(getThemeKey(tenantId), next);
  return next;
}

/**
 * Reset widget theme to defaults.
 */
export function resetWidgetTheme(tenantIdOverride = null) {
  const tenantId = tenantIdOverride || getTenantId();
  const defaults = getDefaultWidgetTheme();
  lsSet(getThemeKey(tenantId), defaults);
  return defaults;
}

/**
 * Generate CSS variables from theme config.
 * These can be injected into the widget container.
 */
export function themeToCssVars(theme) {
  const t = theme || getDefaultWidgetTheme();

  return {
    '--widget-bg': t.backgroundColor,
    '--widget-card': t.cardColor,
    '--widget-header': t.headerColor,
    '--widget-text': t.textColor,
    '--widget-muted': t.mutedColor,
    '--widget-btn-primary': t.buttonPrimaryColor,
    '--widget-btn-text': t.buttonTextColor,
    '--widget-btn-hover': t.buttonHoverColor,
    '--widget-input-bg': t.inputBgColor,
    '--widget-input-border': t.inputBorderColor,
    '--widget-input-focus': t.inputFocusColor,
    '--widget-summary-bg': t.summaryBgColor,
    '--widget-border': t.borderColor,
    '--widget-font': t.fontFamily,
    '--widget-radius': `${t.cornerRadius}px`,
  };
}

/**
 * Apply theme CSS variables to an element (or document root).
 */
export function applyThemeToDom(theme, element = null) {
  const vars = themeToCssVars(theme);
  const target = element || document.documentElement;

  Object.entries(vars).forEach(([key, value]) => {
    target.style.setProperty(key, value);
  });
}

/**
 * Generate inline style string from theme.
 * Useful for iframe injection.
 */
export function themeToInlineStyle(theme) {
  const vars = themeToCssVars(theme);
  return Object.entries(vars)
    .map(([key, value]) => `${key}: ${value}`)
    .join('; ');
}

/**
 * Validate HEX color format.
 */
export function isValidHex(color) {
  return /^#([0-9A-Fa-f]{3}){1,2}$/.test(color);
}

/**
 * Theme property definitions for UI builder.
 * Defines which properties are editable and their types.
 */
export const THEME_PROPERTIES = [
  { key: 'backgroundColor', label: 'Pozadi', type: 'color', category: 'background' },
  { key: 'cardColor', label: 'Karta (pozadi)', type: 'color', category: 'background' },
  { key: 'headerColor', label: 'Nadpis', type: 'color', category: 'text' },
  { key: 'textColor', label: 'Text', type: 'color', category: 'text' },
  { key: 'mutedColor', label: 'Tlumeny text', type: 'color', category: 'text' },
  { key: 'buttonPrimaryColor', label: 'Tlacitko (barva)', type: 'color', category: 'button' },
  { key: 'buttonTextColor', label: 'Tlacitko (text)', type: 'color', category: 'button' },
  { key: 'buttonHoverColor', label: 'Tlacitko (hover)', type: 'color', category: 'button' },
  { key: 'inputBgColor', label: 'Input (pozadi)', type: 'color', category: 'input' },
  { key: 'inputBorderColor', label: 'Input (ramecek)', type: 'color', category: 'input' },
  { key: 'inputFocusColor', label: 'Input (focus)', type: 'color', category: 'input' },
  { key: 'summaryBgColor', label: 'Souhrn (pozadi)', type: 'color', category: 'background' },
  { key: 'borderColor', label: 'Ramecky', type: 'color', category: 'border' },
  { key: 'fontFamily', label: 'Pismo', type: 'font', category: 'typography' },
  { key: 'cornerRadius', label: 'Zaobleni rohu', type: 'number', min: 0, max: 24, unit: 'px', category: 'dimensions' },
];

/**
 * Available font families for selection.
 */
export const FONT_OPTIONS = [
  { value: 'Inter, system-ui, sans-serif', label: 'Inter' },
  { value: 'system-ui, sans-serif', label: 'System UI' },
  { value: '"Segoe UI", sans-serif', label: 'Segoe UI' },
  { value: 'Roboto, sans-serif', label: 'Roboto' },
  { value: '"Open Sans", sans-serif', label: 'Open Sans' },
  { value: 'Lato, sans-serif', label: 'Lato' },
  { value: '"Source Sans Pro", sans-serif', label: 'Source Sans Pro' },
  { value: 'Nunito, sans-serif', label: 'Nunito' },
  { value: 'Poppins, sans-serif', label: 'Poppins' },
  { value: '"DM Sans", sans-serif', label: 'DM Sans' },
];
