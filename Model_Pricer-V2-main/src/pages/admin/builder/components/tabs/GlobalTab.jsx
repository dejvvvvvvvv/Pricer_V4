/**
 * GlobalTab -- global settings panel (third tab in left panel).
 *
 * Sections:
 *   1. Typografie (heading font, body font, preview)
 *   2. Zaobleni rohu (corner radius slider + preview)
 *   3. Quick Theme (QuickThemeDropdown)
 *   4. Efekty (card shadow select, global padding slider)
 *   5. Skeleton loading (base color, shimmer color)
 */
import React, { useMemo } from 'react';

import { FONT_OPTIONS } from '@/utils/widgetThemeStorage';
import { QUICK_THEMES, CUSTOM_THEME_ID } from '../../config/quickThemes';

import QuickThemeDropdown from '../QuickThemeDropdown';
import BuilderColorPicker from '../BuilderColorPicker';

/* ------------------------------------------------------------------ */
/* Reusable sub-components                                            */
/* ------------------------------------------------------------------ */

/** Section heading: uppercase, 11px, muted, bottom border */
function SectionHeading({ title }) {
  return <div style={styles.sectionHeading}>{title}</div>;
}

/** Label for a single field row */
function FieldLabel({ children }) {
  return <span style={styles.fieldLabel}>{children}</span>;
}

/** Dark-themed select dropdown */
function BuilderSelect({ value, onChange, options, ariaLabel }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={styles.select}
      aria-label={ariaLabel}
    >
      {options.map((opt) => {
        const optValue = typeof opt === 'string' ? opt : opt.value;
        const optLabel = typeof opt === 'string' ? opt : opt.label;
        return (
          <option key={optValue} value={optValue}>
            {optLabel}
          </option>
        );
      })}
    </select>
  );
}

/** Horizontal slider with numeric readout */
function BuilderSlider({ value, min, max, unit, onChange, ariaLabel }) {
  const numericVal = typeof value === 'number' ? value : parseInt(value, 10) || min;

  return (
    <div style={styles.sliderRow}>
      <input
        type="range"
        min={min}
        max={max}
        value={numericVal}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        style={styles.rangeInput}
        aria-label={ariaLabel}
      />
      <span style={styles.sliderValue}>
        {numericVal}{unit || 'px'}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shadow options for the select                                      */
/* ------------------------------------------------------------------ */
const SHADOW_OPTIONS = [
  { value: 'none', label: 'Zadny' },
  { value: 'subtle', label: 'Jemny' },
  { value: 'medium', label: 'Stredni' },
  { value: 'strong', label: 'Silny' },
];

/* ------------------------------------------------------------------ */
/* Main component                                                     */
/* ------------------------------------------------------------------ */
export default function GlobalTab({ theme, onUpdateProperty, onApplyBulkTheme, isDirty }) {
  // Determine which quick theme is currently active (if any)
  const currentThemeId = useMemo(() => {
    if (!theme) return CUSTOM_THEME_ID;

    for (const qt of QUICK_THEMES) {
      // Simple heuristic: compare a few key colors to detect a match
      const t = qt.theme;
      if (
        theme.backgroundColor === t.backgroundColor &&
        theme.buttonPrimaryColor === t.buttonPrimaryColor &&
        theme.headerColor === t.headerColor &&
        theme.cardColor === t.cardColor
      ) {
        return qt.id;
      }
    }

    return CUSTOM_THEME_ID;
  }, [theme]);

  // Handle applying a quick theme (single undo entry via bulk setter)
  function handleApplyQuickTheme(themeEntry) {
    if (!themeEntry || !themeEntry.theme) return;

    if (onApplyBulkTheme) {
      // Merge with current theme so non-specified keys are preserved
      onApplyBulkTheme({ ...theme, ...themeEntry.theme });
    } else {
      // Fallback (less efficient, creates multiple undo entries)
      const entries = Object.entries(themeEntry.theme);
      for (const [key, val] of entries) {
        onUpdateProperty(key, val);
      }
    }
  }

  if (!theme) {
    return (
      <div style={styles.emptyState}>
        Tema neni k dispozici.
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      {/* =============================== */}
      {/* SECTION 1: Typografie           */}
      {/* =============================== */}
      <div style={styles.section}>
        <SectionHeading title="TYPOGRAFIE" />

        {/* Font nadpisu */}
        <div style={styles.field}>
          <FieldLabel>Font nadpisu</FieldLabel>
          <BuilderSelect
            value={theme.headingFontFamily || ''}
            onChange={(val) => onUpdateProperty('headingFontFamily', val)}
            options={FONT_OPTIONS}
            ariaLabel="Font nadpisu"
          />
          <div
            style={{
              ...styles.fontPreview,
              fontFamily: theme.headingFontFamily || 'inherit',
            }}
          >
            Ukazkovy nadpis Aa
          </div>
        </div>

        {/* Font body */}
        <div style={styles.field}>
          <FieldLabel>Font textu</FieldLabel>
          <BuilderSelect
            value={theme.fontFamily || ''}
            onChange={(val) => onUpdateProperty('fontFamily', val)}
            options={FONT_OPTIONS}
            ariaLabel="Font textu"
          />
          <div
            style={{
              ...styles.fontPreview,
              fontFamily: theme.fontFamily || 'inherit',
              fontSize: 12,
              fontWeight: 400,
            }}
          >
            Ukazkovy text odstavce lorem ipsum.
          </div>
        </div>
      </div>

      {/* =============================== */}
      {/* SECTION 2: Zaobleni rohu        */}
      {/* =============================== */}
      <div style={styles.section}>
        <SectionHeading title="ZAOBLENI ROHU" />

        <div style={styles.field}>
          <BuilderSlider
            value={theme.cornerRadius}
            min={0}
            max={24}
            unit="px"
            onChange={(val) => onUpdateProperty('cornerRadius', val)}
            ariaLabel="Zaobleni rohu"
          />
          {/* Small preview box */}
          <div style={styles.radiusPreviewRow}>
            <div
              style={{
                ...styles.radiusPreviewBox,
                borderRadius: theme.cornerRadius || 0,
              }}
            />
            <span style={styles.radiusPreviewLabel}>
              {theme.cornerRadius || 0}px
            </span>
          </div>
        </div>
      </div>

      {/* =============================== */}
      {/* SECTION 3: Quick Theme          */}
      {/* =============================== */}
      <div style={styles.section}>
        <SectionHeading title="PREDNASTAVENY TEMA" />

        <QuickThemeDropdown
          currentThemeId={currentThemeId}
          onApplyTheme={handleApplyQuickTheme}
          isDirty={isDirty}
        />
      </div>

      {/* =============================== */}
      {/* SECTION 4: Efekty               */}
      {/* =============================== */}
      <div style={styles.section}>
        <SectionHeading title="EFEKTY" />

        {/* Stin karet */}
        <div style={styles.field}>
          <FieldLabel>Stin karet</FieldLabel>
          <BuilderSelect
            value={theme.cardShadow || 'none'}
            onChange={(val) => onUpdateProperty('cardShadow', val)}
            options={SHADOW_OPTIONS}
            ariaLabel="Stin karet"
          />
        </div>

        {/* Globalni padding */}
        <div style={styles.field}>
          <FieldLabel>Globalni padding</FieldLabel>
          <BuilderSlider
            value={theme.globalPadding}
            min={8}
            max={48}
            unit="px"
            onChange={(val) => onUpdateProperty('globalPadding', val)}
            ariaLabel="Globalni padding"
          />
        </div>
      </div>

      {/* =============================== */}
      {/* SECTION 5: Skeleton loading     */}
      {/* =============================== */}
      <div style={styles.section}>
        <SectionHeading title="SKELETON LOADING" />

        <div style={styles.field}>
          <BuilderColorPicker
            label="Zakladni barva"
            value={theme.skeletonBaseColor || '#E5E7EB'}
            onChange={(val) => onUpdateProperty('skeletonBaseColor', val)}
          />
        </div>

        <div style={styles.field}>
          <BuilderColorPicker
            label="Shimmer barva"
            value={theme.skeletonShineColor || '#F3F4F6'}
            onChange={(val) => onUpdateProperty('skeletonShineColor', val)}
          />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */
const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },

  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },

  sectionHeading: {
    fontFamily: 'var(--builder-font-body)',
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--builder-text-muted)',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    paddingBottom: 8,
    marginBottom: 4,
    borderBottom: '1px solid var(--builder-border-subtle)',
  },

  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },

  fieldLabel: {
    fontFamily: 'var(--builder-font-body)',
    fontSize: 12,
    color: 'var(--builder-text-secondary)',
    lineHeight: 1.3,
  },

  /* Select */
  select: {
    width: '100%',
    fontFamily: 'var(--builder-font-body)',
    fontSize: 12,
    color: 'var(--builder-text-primary)',
    background: 'var(--builder-bg-elevated)',
    border: '1px solid var(--builder-border-default)',
    borderRadius: 'var(--builder-radius-sm)',
    padding: '6px 8px',
    outline: 'none',
    cursor: 'pointer',
    transition: 'border-color var(--builder-transition-fast)',
    appearance: 'auto',
  },

  /* Slider row */
  sliderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  rangeInput: {
    flex: 1,
    height: 4,
    cursor: 'pointer',
    accentColor: 'var(--builder-accent-primary)',
  },
  sliderValue: {
    fontFamily: 'var(--builder-font-code)',
    fontSize: 11,
    color: 'var(--builder-text-secondary)',
    minWidth: 38,
    textAlign: 'right',
    flexShrink: 0,
  },

  /* Font preview */
  fontPreview: {
    fontFamily: 'inherit',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--builder-text-primary)',
    background: 'var(--builder-bg-tertiary)',
    borderRadius: 'var(--builder-radius-sm)',
    padding: '6px 10px',
    marginTop: 2,
  },

  /* Radius preview */
  radiusPreviewRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  radiusPreviewBox: {
    width: 40,
    height: 28,
    background: 'var(--builder-accent-primary)',
    border: '1px solid var(--builder-border-default)',
    transition: 'border-radius var(--builder-transition-fast)',
  },
  radiusPreviewLabel: {
    fontFamily: 'var(--builder-font-code)',
    fontSize: 11,
    color: 'var(--builder-text-muted)',
  },

  /* Empty state */
  emptyState: {
    fontFamily: 'var(--builder-font-body)',
    fontSize: 13,
    color: 'var(--builder-text-muted)',
    textAlign: 'center',
    padding: '32px 16px',
  },
};
