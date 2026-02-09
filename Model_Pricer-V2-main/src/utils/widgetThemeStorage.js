/**
 * Widget Theme Storage - manages CSS theme configuration for embeddable widgets.
 * Uses localStorage as source of truth (Varianta A demo).
 */

import { getTenantId } from './adminTenantStorage';
import { storageAdapter } from '../lib/supabase/storageAdapter';
import { getStorageMode } from '../lib/supabase/featureFlags';
import { isSupabaseAvailable } from '../lib/supabase/client';

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
 * Total: 56 properties (15 original + 41 new for Widget Builder V3).
 */
export function getDefaultWidgetTheme() {
  return {
    // === ORIGINAL 15 PROPERTIES ===

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

    // === NEW PROPERTIES (Widget Builder V3) ===

    // Header
    headerBgColor: '#FFFFFF',
    headerLogoSize: 48,
    headerPadding: 16,
    headerAlignment: 'left',
    headerTaglineVisible: true,

    // Upload zone
    uploadBgColor: '#FAFBFC',
    uploadBorderColor: '#E2E8F0',
    uploadBorderHoverColor: '#3B82F6',
    uploadIconColor: '#94A3B8',
    uploadBorderStyle: 'dashed',

    // Stepper
    stepperActiveColor: '#3B82F6',
    stepperCompletedColor: '#10B981',
    stepperInactiveColor: '#E5E7EB',
    stepperProgressVisible: true,

    // Config panel
    configBgColor: '#FFFFFF',
    configLabelColor: '#374151',

    // Fees section
    feesBgColor: '#F9FAFB',
    feesCheckboxColor: '#3B82F6',

    // Price summary
    summaryHeaderColor: '#1F2937',
    summaryDividerColor: '#E5E7EB',
    summaryTotalBgColor: '#EFF6FF',
    summaryTotalFontSize: 20,

    // CTA button
    buttonBorderRadius: 8,
    buttonPaddingY: 12,
    buttonFontSize: 16,
    buttonShadow: 'none',

    // Footer
    footerBgColor: 'transparent',
    footerTextColor: '#94A3B8',
    footerLinkColor: '#3B82F6',

    // Typography (extended)
    headingFontFamily: '"DM Sans", system-ui, sans-serif',
    codeFontFamily: '"JetBrains Mono", monospace',

    // Effects
    cardShadow: 'subtle',
    globalPadding: 24,

    // Loading skeleton
    skeletonBaseColor: '#E5E7EB',
    skeletonShineColor: '#F3F4F6',

    // Editable texts
    textHeaderTitle: '3D Tisk Kalkulacka',
    textHeaderTagline: 'Nahrajte 3D model a zjistete cenu tisku.',
    textUploadTitle: 'Nahrajte 3D model',
    textUploadDescription: 'Pretahnete STL nebo OBJ soubory',
    textUploadButton: 'Vybrat soubor',
    textCtaButton: 'Spocitat cenu',

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

  // Fire-and-forget Supabase dual-write
  const mode = getStorageMode('widget_theme');
  if ((mode === 'supabase' || mode === 'dual-write') && isSupabaseAvailable()) {
    storageAdapter.supabase.writeConfig('widget_configs', tenantId, 'widget_theme', next)
      .catch(err => console.warn('[widgetTheme] Supabase write failed:', err.message));
  }

  return next;
}

/**
 * Reset widget theme to defaults.
 */
export function resetWidgetTheme(tenantIdOverride = null) {
  const tenantId = tenantIdOverride || getTenantId();
  const defaults = getDefaultWidgetTheme();
  lsSet(getThemeKey(tenantId), defaults);

  // Fire-and-forget Supabase dual-write
  const mode = getStorageMode('widget_theme');
  if ((mode === 'supabase' || mode === 'dual-write') && isSupabaseAvailable()) {
    storageAdapter.supabase.writeConfig('widget_configs', tenantId, 'widget_theme', defaults)
      .catch(err => console.warn('[widgetTheme] Supabase write failed:', err.message));
  }

  return defaults;
}

/**
 * Generate CSS variables from theme config.
 * These can be injected into the widget container.
 */
export function themeToCssVars(theme) {
  const t = theme || getDefaultWidgetTheme();

  return {
    // === Original 15 CSS vars ===
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

    // === New CSS vars (Widget Builder V3) ===

    // Header
    '--widget-header-bg': t.headerBgColor,
    '--widget-header-logo-size': `${t.headerLogoSize}px`,
    '--widget-header-padding': `${t.headerPadding}px`,
    '--widget-header-align': t.headerAlignment,

    // Upload zone
    '--widget-upload-bg': t.uploadBgColor,
    '--widget-upload-border': t.uploadBorderColor,
    '--widget-upload-border-hover': t.uploadBorderHoverColor,
    '--widget-upload-icon': t.uploadIconColor,
    '--widget-upload-border-style': t.uploadBorderStyle,

    // Stepper
    '--widget-stepper-active': t.stepperActiveColor,
    '--widget-stepper-completed': t.stepperCompletedColor,
    '--widget-stepper-inactive': t.stepperInactiveColor,

    // Config panel
    '--widget-config-bg': t.configBgColor,
    '--widget-config-label': t.configLabelColor,

    // Fees section
    '--widget-fees-bg': t.feesBgColor,
    '--widget-fees-checkbox': t.feesCheckboxColor,

    // Price summary
    '--widget-summary-header': t.summaryHeaderColor,
    '--widget-summary-divider': t.summaryDividerColor,
    '--widget-summary-total-bg': t.summaryTotalBgColor,
    '--widget-summary-total-size': `${t.summaryTotalFontSize}px`,

    // CTA button
    '--widget-btn-radius': `${t.buttonBorderRadius}px`,
    '--widget-btn-padding-y': `${t.buttonPaddingY}px`,
    '--widget-btn-font-size': `${t.buttonFontSize}px`,

    // Footer
    '--widget-footer-bg': t.footerBgColor,
    '--widget-footer-text': t.footerTextColor,
    '--widget-footer-link': t.footerLinkColor,

    // Typography (extended)
    '--widget-heading-font': t.headingFontFamily,
    '--widget-code-font': t.codeFontFamily,

    // Effects
    '--widget-global-padding': `${t.globalPadding}px`,

    // Loading skeleton
    '--widget-skeleton-base': t.skeletonBaseColor,
    '--widget-skeleton-shine': t.skeletonShineColor,
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
  // === Original 15 properties ===
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

  // === New properties (Widget Builder V3) ===

  // Header
  { key: 'headerBgColor', label: 'Pozadi hlavicky', type: 'color', category: 'header' },
  { key: 'headerLogoSize', label: 'Velikost loga', type: 'number', min: 24, max: 80, unit: 'px', category: 'header' },
  { key: 'headerPadding', label: 'Padding hlavicky', type: 'number', min: 0, max: 48, unit: 'px', category: 'header' },
  { key: 'headerAlignment', label: 'Zarovnani', type: 'select', options: ['left', 'center'], category: 'header' },
  { key: 'headerTaglineVisible', label: 'Zobrazit tagline', type: 'boolean', category: 'header' },

  // Upload zone
  { key: 'uploadBgColor', label: 'Pozadi', type: 'color', category: 'upload' },
  { key: 'uploadBorderColor', label: 'Ramecek', type: 'color', category: 'upload' },
  { key: 'uploadBorderHoverColor', label: 'Ramecek (hover)', type: 'color', category: 'upload' },
  { key: 'uploadIconColor', label: 'Barva ikony', type: 'color', category: 'upload' },
  { key: 'uploadBorderStyle', label: 'Styl ramecku', type: 'select', options: ['solid', 'dashed', 'dotted'], category: 'upload' },

  // Stepper
  { key: 'stepperActiveColor', label: 'Aktivni krok', type: 'color', category: 'stepper' },
  { key: 'stepperCompletedColor', label: 'Dokonceny krok', type: 'color', category: 'stepper' },
  { key: 'stepperInactiveColor', label: 'Neaktivni krok', type: 'color', category: 'stepper' },
  { key: 'stepperProgressVisible', label: 'Progress bar', type: 'boolean', category: 'stepper' },

  // Config panel
  { key: 'configBgColor', label: 'Pozadi', type: 'color', category: 'config' },
  { key: 'configLabelColor', label: 'Barva labelu', type: 'color', category: 'config' },

  // Fees section
  { key: 'feesBgColor', label: 'Pozadi', type: 'color', category: 'fees' },
  { key: 'feesCheckboxColor', label: 'Barva checkboxu', type: 'color', category: 'fees' },

  // Price summary
  { key: 'summaryHeaderColor', label: 'Nadpis souhrnu', type: 'color', category: 'summary' },
  { key: 'summaryDividerColor', label: 'Oddelovaci cara', type: 'color', category: 'summary' },
  { key: 'summaryTotalBgColor', label: 'Zvyrazneni celkem', type: 'color', category: 'summary' },
  { key: 'summaryTotalFontSize', label: 'Velikost celkem', type: 'number', min: 14, max: 32, unit: 'px', category: 'summary' },

  // CTA button
  { key: 'buttonBorderRadius', label: 'Zaobleni', type: 'number', min: 0, max: 24, unit: 'px', category: 'cta' },
  { key: 'buttonPaddingY', label: 'Vertikalni padding', type: 'number', min: 4, max: 24, unit: 'px', category: 'cta' },
  { key: 'buttonFontSize', label: 'Velikost textu', type: 'number', min: 12, max: 24, unit: 'px', category: 'cta' },
  { key: 'buttonShadow', label: 'Stin', type: 'select', options: ['none', 'subtle', 'medium', 'strong'], category: 'cta' },

  // Footer
  { key: 'footerBgColor', label: 'Pozadi', type: 'color', category: 'footer' },
  { key: 'footerTextColor', label: 'Barva textu', type: 'color', category: 'footer' },
  { key: 'footerLinkColor', label: 'Barva odkazu', type: 'color', category: 'footer' },

  // Typography (extended)
  { key: 'headingFontFamily', label: 'Font nadpisu', type: 'font', category: 'typography' },
  { key: 'codeFontFamily', label: 'Font kodu', type: 'font', category: 'typography' },

  // Effects
  { key: 'cardShadow', label: 'Stin karet', type: 'select', options: ['none', 'subtle', 'medium', 'strong'], category: 'shadow' },
  { key: 'globalPadding', label: 'Globalni padding', type: 'number', min: 8, max: 48, unit: 'px', category: 'dimensions' },

  // Loading skeleton
  { key: 'skeletonBaseColor', label: 'Zaklad', type: 'color', category: 'skeleton' },
  { key: 'skeletonShineColor', label: 'Shimmer', type: 'color', category: 'skeleton' },

  // Editable text content
  { key: 'textHeaderTitle', label: 'Nadpis hlavicky', type: 'text', category: 'text-content' },
  { key: 'textHeaderTagline', label: 'Tagline', type: 'text', category: 'text-content' },
  { key: 'textUploadTitle', label: 'Nadpis uploadu', type: 'text', category: 'text-content' },
  { key: 'textUploadDescription', label: 'Popis uploadu', type: 'text', category: 'text-content' },
  { key: 'textUploadButton', label: 'Tlacitko upload', type: 'text', category: 'text-content' },
  { key: 'textCtaButton', label: 'CTA tlacitko', type: 'text', category: 'text-content' },
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
  { value: '"JetBrains Mono", monospace', label: 'JetBrains Mono' },
];
