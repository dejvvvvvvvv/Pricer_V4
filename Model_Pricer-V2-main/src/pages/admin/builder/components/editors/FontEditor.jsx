/**
 * FontEditor -- typography property editor.
 *
 * Features:
 *   - Font family dropdown (common web fonts + system fonts)
 *   - Font size input with unit (px, rem, em)
 *   - Font weight dropdown (300-900)
 *   - Line height input
 *   - Letter spacing input
 *   - Text transform (none, uppercase, lowercase, capitalize)
 *   - Live preview
 *   - Reset to default
 */
import React, { useCallback, memo } from 'react';
import { RotateCcw } from 'lucide-react';

const FONT_FAMILIES = [
  { value: 'Inter, system-ui, sans-serif', label: 'Inter' },
  { value: 'Roboto, sans-serif', label: 'Roboto' },
  { value: 'Poppins, sans-serif', label: 'Poppins' },
  { value: '"Open Sans", sans-serif', label: 'Open Sans' },
  { value: 'Montserrat, sans-serif', label: 'Montserrat' },
  { value: 'Lato, sans-serif', label: 'Lato' },
  { value: 'Raleway, sans-serif', label: 'Raleway' },
  { value: '"Source Sans Pro", sans-serif', label: 'Source Sans Pro' },
  { value: '"IBM Plex Sans", system-ui, sans-serif', label: 'IBM Plex Sans' },
  { value: '"Space Grotesk", system-ui, sans-serif', label: 'Space Grotesk' },
  { value: '"DM Sans", sans-serif', label: 'DM Sans' },
  { value: 'Nunito, sans-serif', label: 'Nunito' },
  { value: '"JetBrains Mono", monospace', label: 'JetBrains Mono' },
  { value: 'system-ui, sans-serif', label: 'System UI' },
  { value: '"Segoe UI", sans-serif', label: 'Segoe UI' },
];

const FONT_WEIGHTS = [
  { value: 300, label: '300 - Light' },
  { value: 400, label: '400 - Regular' },
  { value: 500, label: '500 - Medium' },
  { value: 600, label: '600 - Semi Bold' },
  { value: 700, label: '700 - Bold' },
  { value: 800, label: '800 - Extra Bold' },
  { value: 900, label: '900 - Black' },
];

const TEXT_TRANSFORMS = [
  { value: 'none', label: 'None' },
  { value: 'uppercase', label: 'UPPERCASE' },
  { value: 'lowercase', label: 'lowercase' },
  { value: 'capitalize', label: 'Capitalize' },
];

const SIZE_UNITS = ['px', 'rem', 'em'];

function FontEditor({
  label,
  labelCs,
  fontFamily = 'Inter, system-ui, sans-serif',
  fontSize = 14,
  fontSizeUnit = 'px',
  fontWeight = 400,
  lineHeight = 1.5,
  letterSpacing = 0,
  textTransform = 'none',
  onChange,
  defaultValue,
}) {
  const displayLabel = labelCs || label || 'Typography';

  const handleChange = useCallback((field, value) => {
    onChange(field, value);
  }, [onChange]);

  const handleReset = useCallback(() => {
    if (!defaultValue) return;
    Object.entries(defaultValue).forEach(([key, val]) => {
      onChange(key, val);
    });
  }, [defaultValue, onChange]);

  return (
    <div style={styles.wrapper}>
      <div style={styles.headerRow}>
        <span style={styles.sectionLabel}>{displayLabel}</span>
        {defaultValue && (
          <button
            type="button"
            onClick={handleReset}
            style={styles.resetBtn}
            title="Reset typography"
            aria-label="Reset typography"
          >
            <RotateCcw size={11} />
          </button>
        )}
      </div>

      {/* Font Family */}
      <div style={styles.field}>
        <span style={styles.label}>Font family</span>
        <select
          value={fontFamily}
          onChange={(e) => handleChange('fontFamily', e.target.value)}
          style={styles.select}
          aria-label="Font family"
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>

      {/* Font Size + Unit */}
      <div style={styles.rowFields}>
        <div style={{ ...styles.field, flex: 1 }}>
          <span style={styles.label}>Size</span>
          <div style={styles.inputWithUnit}>
            <input
              type="number"
              min={8}
              max={72}
              value={fontSize}
              onChange={(e) => handleChange('fontSize', parseInt(e.target.value, 10) || 14)}
              style={styles.numberInput}
              aria-label="Font size"
            />
            <select
              value={fontSizeUnit}
              onChange={(e) => handleChange('fontSizeUnit', e.target.value)}
              style={styles.unitSelect}
              aria-label="Font size unit"
            >
              {SIZE_UNITS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ ...styles.field, flex: 1 }}>
          <span style={styles.label}>Weight</span>
          <select
            value={fontWeight}
            onChange={(e) => handleChange('fontWeight', parseInt(e.target.value, 10))}
            style={styles.select}
            aria-label="Font weight"
          >
            {FONT_WEIGHTS.map((w) => (
              <option key={w.value} value={w.value}>{w.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Line Height + Letter Spacing */}
      <div style={styles.rowFields}>
        <div style={{ ...styles.field, flex: 1 }}>
          <span style={styles.label}>Line height</span>
          <input
            type="number"
            min={0.5}
            max={3}
            step={0.1}
            value={lineHeight}
            onChange={(e) => handleChange('lineHeight', parseFloat(e.target.value) || 1.5)}
            style={styles.numberInput}
            aria-label="Line height"
          />
        </div>

        <div style={{ ...styles.field, flex: 1 }}>
          <span style={styles.label}>Letter spacing</span>
          <div style={styles.inputWithUnit}>
            <input
              type="number"
              min={-5}
              max={20}
              step={0.5}
              value={letterSpacing}
              onChange={(e) => handleChange('letterSpacing', parseFloat(e.target.value) || 0)}
              style={styles.numberInput}
              aria-label="Letter spacing"
            />
            <span style={styles.unitLabel}>px</span>
          </div>
        </div>
      </div>

      {/* Text Transform */}
      <div style={styles.field}>
        <span style={styles.label}>Text transform</span>
        <select
          value={textTransform}
          onChange={(e) => handleChange('textTransform', e.target.value)}
          style={styles.select}
          aria-label="Text transform"
        >
          {TEXT_TRANSFORMS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Font Preview */}
      <div
        style={{
          ...styles.preview,
          fontFamily: fontFamily || 'inherit',
          fontSize: fontSize || 14,
          fontWeight: fontWeight || 400,
          lineHeight: lineHeight || 1.5,
          letterSpacing: `${letterSpacing || 0}px`,
          textTransform: textTransform || 'none',
        }}
      >
        The quick brown fox Aa 123
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    fontFamily: 'var(--builder-font-body)',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--builder-text-secondary)',
  },
  resetBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 18,
    height: 18,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--builder-text-muted)',
    borderRadius: 3,
    padding: 0,
    opacity: 0.6,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  rowFields: {
    display: 'flex',
    gap: 8,
  },
  label: {
    fontFamily: 'var(--builder-font-body)',
    fontSize: 11,
    color: 'var(--builder-text-muted)',
    lineHeight: 1.3,
  },
  select: {
    width: '100%',
    fontFamily: 'var(--builder-font-body)',
    fontSize: 12,
    color: 'var(--builder-text-primary)',
    background: 'var(--builder-bg-elevated)',
    border: '1px solid var(--builder-border-default)',
    borderRadius: 'var(--builder-radius-sm)',
    padding: '5px 8px',
    outline: 'none',
    cursor: 'pointer',
    appearance: 'auto',
  },
  inputWithUnit: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  numberInput: {
    width: '100%',
    fontFamily: 'var(--builder-font-code)',
    fontSize: 12,
    color: 'var(--builder-text-primary)',
    background: 'var(--builder-bg-elevated)',
    border: '1px solid var(--builder-border-default)',
    borderRadius: 'var(--builder-radius-sm)',
    padding: '4px 6px',
    textAlign: 'center',
    outline: 'none',
    boxSizing: 'border-box',
  },
  unitSelect: {
    fontFamily: 'var(--builder-font-code)',
    fontSize: 10,
    color: 'var(--builder-text-primary)',
    background: 'var(--builder-bg-elevated)',
    border: '1px solid var(--builder-border-default)',
    borderRadius: 3,
    padding: '4px 4px',
    outline: 'none',
    cursor: 'pointer',
    flexShrink: 0,
  },
  unitLabel: {
    fontFamily: 'var(--builder-font-code)',
    fontSize: 10,
    color: 'var(--builder-text-muted)',
    flexShrink: 0,
  },
  preview: {
    fontFamily: 'inherit',
    color: 'var(--builder-text-primary)',
    background: 'var(--builder-bg-tertiary)',
    borderRadius: 'var(--builder-radius-sm)',
    padding: '8px 10px',
    marginTop: 2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
};

export default memo(FontEditor);
