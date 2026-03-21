/**
 * BackgroundEditor -- background property editor.
 *
 * Features:
 *   - Background color picker
 *   - Background image URL input
 *   - Background size: cover, contain, auto
 *   - Background position: center, top, bottom, left, right
 *   - Background repeat toggle
 *   - Gradient support (linear, direction, 2 color stops)
 *   - Reset to default
 */
import React, { useState, useCallback, memo } from 'react';
import { RotateCcw, Image } from 'lucide-react';
import ColorPropertyEditor from './ColorPropertyEditor';

const BG_SIZE_OPTIONS = [
  { value: 'cover', label: 'Cover' },
  { value: 'contain', label: 'Contain' },
  { value: 'auto', label: 'Auto' },
];

const BG_POSITION_OPTIONS = [
  { value: 'center', label: 'Center' },
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'top left', label: 'Top Left' },
  { value: 'top right', label: 'Top Right' },
  { value: 'bottom left', label: 'Bottom Left' },
  { value: 'bottom right', label: 'Bottom Right' },
];

const GRADIENT_DIRECTIONS = [
  { value: 'to right', label: 'Right' },
  { value: 'to left', label: 'Left' },
  { value: 'to bottom', label: 'Down' },
  { value: 'to top', label: 'Up' },
  { value: 'to bottom right', label: 'Diagonal' },
  { value: '45deg', label: '45 deg' },
  { value: '135deg', label: '135 deg' },
  { value: '180deg', label: '180 deg' },
];

const BG_MODES = [
  { id: 'color', label: 'Color' },
  { id: 'image', label: 'Image' },
  { id: 'gradient', label: 'Gradient' },
];

function BackgroundEditor({
  label,
  labelCs,
  bgColor = '#FFFFFF',
  bgImage = '',
  bgSize = 'cover',
  bgPosition = 'center',
  bgRepeat = false,
  gradientDirection = 'to right',
  gradientFrom = '#3B82F6',
  gradientTo = '#8B5CF6',
  onChange,
  defaultValue,
}) {
  const [mode, setMode] = useState(bgImage ? 'image' : 'color');
  const displayLabel = labelCs || label || 'Background';

  const handleChange = useCallback((field, value) => {
    onChange(field, value);
  }, [onChange]);

  const handleReset = useCallback(() => {
    if (!defaultValue) return;
    Object.entries(defaultValue).forEach(([key, val]) => {
      onChange(key, val);
    });
    setMode('color');
  }, [defaultValue, onChange]);

  return (
    <div style={styles.wrapper}>
      <div style={styles.headerRow}>
        <span style={styles.sectionLabel}>{displayLabel}</span>
        <button
          type="button"
          onClick={handleReset}
          style={styles.resetBtn}
          title="Reset background"
          aria-label="Reset background"
        >
          <RotateCcw size={11} />
        </button>
      </div>

      {/* Mode switcher */}
      <div style={styles.modeSwitcher}>
        {BG_MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            style={{
              ...styles.modeBtn,
              ...(mode === m.id ? styles.modeBtnActive : {}),
            }}
            aria-pressed={mode === m.id}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Color mode */}
      {mode === 'color' && (
        <ColorPropertyEditor
          label="Background color"
          value={bgColor}
          onChange={(c) => handleChange('bgColor', c)}
        />
      )}

      {/* Image mode */}
      {mode === 'image' && (
        <div style={styles.fields}>
          <div style={styles.field}>
            <span style={styles.label}>Image URL</span>
            <div style={styles.urlRow}>
              <Image size={14} color="var(--builder-text-muted)" style={{ flexShrink: 0 }} />
              <input
                type="text"
                value={bgImage}
                onChange={(e) => handleChange('bgImage', e.target.value)}
                placeholder="https://..."
                style={styles.textInput}
                aria-label="Background image URL"
              />
            </div>
          </div>

          <div style={styles.rowFields}>
            <div style={{ ...styles.field, flex: 1 }}>
              <span style={styles.label}>Size</span>
              <select
                value={bgSize}
                onChange={(e) => handleChange('bgSize', e.target.value)}
                style={styles.select}
                aria-label="Background size"
              >
                {BG_SIZE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div style={{ ...styles.field, flex: 1 }}>
              <span style={styles.label}>Position</span>
              <select
                value={bgPosition}
                onChange={(e) => handleChange('bgPosition', e.target.value)}
                style={styles.select}
                aria-label="Background position"
              >
                {BG_POSITION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={bgRepeat}
                onChange={(e) => handleChange('bgRepeat', e.target.checked)}
                style={styles.checkbox}
              />
              <span style={styles.label}>Repeat</span>
            </label>
          </div>
        </div>
      )}

      {/* Gradient mode */}
      {mode === 'gradient' && (
        <div style={styles.fields}>
          <div style={styles.field}>
            <span style={styles.label}>Direction</span>
            <select
              value={gradientDirection}
              onChange={(e) => handleChange('gradientDirection', e.target.value)}
              style={styles.select}
              aria-label="Gradient direction"
            >
              {GRADIENT_DIRECTIONS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>

          <div style={styles.rowFields}>
            <div style={{ ...styles.field, flex: 1 }}>
              <ColorPropertyEditor
                label="From"
                value={gradientFrom}
                onChange={(c) => handleChange('gradientFrom', c)}
              />
            </div>
            <div style={{ ...styles.field, flex: 1 }}>
              <ColorPropertyEditor
                label="To"
                value={gradientTo}
                onChange={(c) => handleChange('gradientTo', c)}
              />
            </div>
          </div>

          {/* Gradient preview */}
          <div
            style={{
              ...styles.gradientPreview,
              background: `linear-gradient(${gradientDirection}, ${gradientFrom}, ${gradientTo})`,
            }}
          />
        </div>
      )}
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
  modeSwitcher: {
    display: 'flex',
    gap: 0,
    borderRadius: 'var(--builder-radius-sm)',
    overflow: 'hidden',
    border: '1px solid var(--builder-border-default)',
  },
  modeBtn: {
    flex: 1,
    fontFamily: 'var(--builder-font-body)',
    fontSize: 11,
    fontWeight: 500,
    color: 'var(--builder-text-muted)',
    background: 'var(--builder-bg-elevated)',
    border: 'none',
    borderRight: '1px solid var(--builder-border-default)',
    padding: '5px 0',
    cursor: 'pointer',
    transition: 'all var(--builder-transition-fast)',
  },
  modeBtnActive: {
    color: 'var(--builder-text-primary)',
    background: 'var(--builder-accent-primary)',
    fontWeight: 600,
  },
  fields: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
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
  urlRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  textInput: {
    flex: 1,
    fontFamily: 'var(--builder-font-body)',
    fontSize: 12,
    color: 'var(--builder-text-primary)',
    background: 'var(--builder-bg-elevated)',
    border: '1px solid var(--builder-border-default)',
    borderRadius: 'var(--builder-radius-sm)',
    padding: '5px 8px',
    outline: 'none',
    boxSizing: 'border-box',
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
  checkboxRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    cursor: 'pointer',
  },
  checkbox: {
    accentColor: 'var(--builder-accent-primary)',
  },
  gradientPreview: {
    height: 28,
    borderRadius: 'var(--builder-radius-sm)',
    border: '1px solid var(--builder-border-default)',
    transition: 'background var(--builder-transition-fast)',
  },
};

export default memo(BackgroundEditor);
