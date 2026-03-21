/**
 * BorderEditor -- border property editor with per-side or uniform editing.
 *
 * Features:
 *   - Width input (px)
 *   - Style dropdown: none, solid, dashed, dotted, double
 *   - Color picker
 *   - Per-side editing (top/right/bottom/left) or all at once
 *   - Border radius inputs (4 corners or uniform)
 *   - Reset to default
 */
import React, { useState, useCallback, memo } from 'react';
import { Link, Unlink, RotateCcw } from 'lucide-react';
import ColorPropertyEditor from './ColorPropertyEditor';

const BORDER_STYLES = [
  { value: 'none', label: 'None' },
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' },
  { value: 'double', label: 'Double' },
];

const SIDES = ['top', 'right', 'bottom', 'left'];
const CORNERS = ['topLeft', 'topRight', 'bottomRight', 'bottomLeft'];
const CORNER_LABELS = {
  topLeft: 'TL',
  topRight: 'TR',
  bottomRight: 'BR',
  bottomLeft: 'BL',
};

function BorderEditor({
  label,
  labelCs,
  borderWidth = 0,
  borderStyle = 'none',
  borderColor = '#000000',
  borderRadius = 0,
  onChange,
  defaultValue,
}) {
  const [linked, setLinked] = useState(true);
  const [radiusLinked, setRadiusLinked] = useState(true);
  const displayLabel = labelCs || label || 'Border';

  // Parse values: support both uniform and per-side
  const widthValues = typeof borderWidth === 'object'
    ? borderWidth
    : { top: borderWidth, right: borderWidth, bottom: borderWidth, left: borderWidth };

  const radiusValues = typeof borderRadius === 'object'
    ? borderRadius
    : { topLeft: borderRadius, topRight: borderRadius, bottomRight: borderRadius, bottomLeft: borderRadius };

  const handleWidthChange = useCallback((side, val) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    if (linked) {
      onChange('borderWidth', num);
    } else {
      onChange('borderWidth', { ...widthValues, [side]: num });
    }
  }, [linked, widthValues, onChange]);

  const handleStyleChange = useCallback((e) => {
    onChange('borderStyle', e.target.value);
  }, [onChange]);

  const handleColorChange = useCallback((color) => {
    onChange('borderColor', color);
  }, [onChange]);

  const handleRadiusChange = useCallback((corner, val) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    if (radiusLinked) {
      onChange('borderRadius', num);
    } else {
      onChange('borderRadius', { ...radiusValues, [corner]: num });
    }
  }, [radiusLinked, radiusValues, onChange]);

  const handleReset = useCallback(() => {
    if (!defaultValue) return;
    onChange('borderWidth', defaultValue.borderWidth || 0);
    onChange('borderStyle', defaultValue.borderStyle || 'none');
    onChange('borderColor', defaultValue.borderColor || '#000000');
    onChange('borderRadius', defaultValue.borderRadius || 0);
  }, [defaultValue, onChange]);

  return (
    <div style={styles.wrapper}>
      <div style={styles.headerRow}>
        <span style={styles.sectionLabel}>{displayLabel}</span>
        <button
          type="button"
          onClick={handleReset}
          style={styles.resetBtn}
          title="Reset border"
          aria-label="Reset border"
        >
          <RotateCcw size={11} />
        </button>
      </div>

      {/* Border Style */}
      <div style={styles.field}>
        <span style={styles.label}>Style</span>
        <select
          value={borderStyle}
          onChange={handleStyleChange}
          style={styles.select}
          aria-label="Border style"
        >
          {BORDER_STYLES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Border Width */}
      <div style={styles.field}>
        <div style={styles.labelRow}>
          <span style={styles.label}>Width</span>
          <button
            type="button"
            onClick={() => setLinked(!linked)}
            style={{
              ...styles.linkBtn,
              color: linked ? 'var(--builder-accent-primary)' : 'var(--builder-text-muted)',
            }}
            title={linked ? 'Edit per side' : 'Link all sides'}
            aria-label={linked ? 'Edit per side' : 'Link all sides'}
          >
            {linked ? <Link size={11} /> : <Unlink size={11} />}
          </button>
        </div>
        {linked ? (
          <div style={styles.inputRow}>
            <input
              type="number"
              min={0}
              max={20}
              value={typeof borderWidth === 'number' ? borderWidth : widthValues.top}
              onChange={(e) => handleWidthChange('top', e.target.value)}
              style={styles.numberInput}
              aria-label="Border width"
            />
            <span style={styles.unitText}>px</span>
          </div>
        ) : (
          <div style={styles.perSideGrid}>
            {SIDES.map((side) => (
              <div key={side} style={styles.perSideItem}>
                <span style={styles.sideLabel}>{side[0].toUpperCase()}</span>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={widthValues[side] || 0}
                  onChange={(e) => handleWidthChange(side, e.target.value)}
                  style={styles.smallInput}
                  aria-label={`Border width ${side}`}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Border Color */}
      <div style={styles.field}>
        <ColorPropertyEditor
          label="Color"
          value={borderColor}
          onChange={handleColorChange}
        />
      </div>

      {/* Border Radius */}
      <div style={styles.field}>
        <div style={styles.labelRow}>
          <span style={styles.label}>Radius</span>
          <button
            type="button"
            onClick={() => setRadiusLinked(!radiusLinked)}
            style={{
              ...styles.linkBtn,
              color: radiusLinked ? 'var(--builder-accent-primary)' : 'var(--builder-text-muted)',
            }}
            title={radiusLinked ? 'Edit per corner' : 'Link all corners'}
            aria-label={radiusLinked ? 'Edit per corner' : 'Link all corners'}
          >
            {radiusLinked ? <Link size={11} /> : <Unlink size={11} />}
          </button>
        </div>
        {radiusLinked ? (
          <div style={styles.inputRow}>
            <input
              type="range"
              min={0}
              max={48}
              value={typeof borderRadius === 'number' ? borderRadius : radiusValues.topLeft}
              onChange={(e) => handleRadiusChange('topLeft', e.target.value)}
              style={styles.slider}
              aria-label="Border radius"
            />
            <input
              type="number"
              min={0}
              max={48}
              value={typeof borderRadius === 'number' ? borderRadius : radiusValues.topLeft}
              onChange={(e) => handleRadiusChange('topLeft', e.target.value)}
              style={styles.smallInput}
              aria-label="Border radius value"
            />
            <span style={styles.unitText}>px</span>
          </div>
        ) : (
          <div style={styles.perSideGrid}>
            {CORNERS.map((corner) => (
              <div key={corner} style={styles.perSideItem}>
                <span style={styles.sideLabel}>{CORNER_LABELS[corner]}</span>
                <input
                  type="number"
                  min={0}
                  max={48}
                  value={radiusValues[corner] || 0}
                  onChange={(e) => handleRadiusChange(corner, e.target.value)}
                  style={styles.smallInput}
                  aria-label={`Border radius ${corner}`}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview */}
      <div style={styles.previewRow}>
        <div
          style={{
            ...styles.previewBox,
            borderWidth: typeof borderWidth === 'number' ? borderWidth : 1,
            borderStyle: borderStyle === 'none' ? 'solid' : borderStyle,
            borderColor: borderStyle === 'none' ? 'transparent' : borderColor,
            borderRadius: typeof borderRadius === 'number' ? borderRadius : 0,
          }}
        />
        <span style={styles.previewLabel}>Preview</span>
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
  labelRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontFamily: 'var(--builder-font-body)',
    fontSize: 12,
    color: 'var(--builder-text-secondary)',
    lineHeight: 1.3,
  },
  linkBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 18,
    height: 18,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    borderRadius: 3,
    padding: 0,
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
  inputRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  numberInput: {
    width: 52,
    fontFamily: 'var(--builder-font-code)',
    fontSize: 12,
    color: 'var(--builder-text-primary)',
    background: 'var(--builder-bg-elevated)',
    border: '1px solid var(--builder-border-default)',
    borderRadius: 'var(--builder-radius-sm)',
    padding: '4px 6px',
    textAlign: 'center',
    outline: 'none',
  },
  slider: {
    flex: 1,
    height: 4,
    accentColor: 'var(--builder-accent-primary)',
    cursor: 'pointer',
  },
  unitText: {
    fontFamily: 'var(--builder-font-code)',
    fontSize: 10,
    color: 'var(--builder-text-muted)',
  },
  perSideGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr',
    gap: 4,
  },
  perSideItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
  },
  sideLabel: {
    fontFamily: 'var(--builder-font-code)',
    fontSize: 9,
    color: 'var(--builder-text-muted)',
    textTransform: 'uppercase',
  },
  smallInput: {
    width: '100%',
    maxWidth: 44,
    fontFamily: 'var(--builder-font-code)',
    fontSize: 11,
    color: 'var(--builder-text-primary)',
    background: 'var(--builder-bg-elevated)',
    border: '1px solid var(--builder-border-default)',
    borderRadius: 3,
    padding: '3px 4px',
    textAlign: 'center',
    outline: 'none',
    boxSizing: 'border-box',
  },
  previewRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    paddingTop: 4,
  },
  previewBox: {
    width: 40,
    height: 28,
    background: 'var(--builder-bg-tertiary)',
    transition: 'all var(--builder-transition-fast)',
  },
  previewLabel: {
    fontFamily: 'var(--builder-font-code)',
    fontSize: 10,
    color: 'var(--builder-text-muted)',
  },
};

export default memo(BorderEditor);
