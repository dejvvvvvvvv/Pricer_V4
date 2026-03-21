/**
 * SpacingEditor -- visual box model editor (margin + padding).
 *
 * Renders a nested box diagram similar to Chrome DevTools:
 *
 *        [margin-top]
 *  [m-l] +----------+ [m-r]
 *        |[pad-top]  |
 *   [p-l]| ELEMENT   |[p-r]
 *        |[pad-bot]  |
 *        +----------+
 *        [margin-bot]
 *
 * Features:
 *   - Click on any edge to edit value
 *   - Linked/unlinked mode (all same vs individual)
 *   - Unit selector: px, rem, em, %
 *   - Reset to default
 */
import React, { useState, useCallback, memo } from 'react';
import { Link, Unlink, RotateCcw } from 'lucide-react';

const UNITS = ['px', 'rem', 'em', '%'];

const SIDES = ['top', 'right', 'bottom', 'left'];

function SpacingEditor({
  label,
  labelCs,
  marginValues = { top: 0, right: 0, bottom: 0, left: 0 },
  paddingValues = { top: 0, right: 0, bottom: 0, left: 0 },
  onMarginChange,
  onPaddingChange,
  defaultMargin,
  defaultPadding,
}) {
  const [linked, setLinked] = useState(false);
  const [unit, setUnit] = useState('px');
  const [editingSide, setEditingSide] = useState(null); // 'margin-top', 'padding-left', etc.
  const displayLabel = labelCs || label || 'Spacing';

  const handleMarginChange = useCallback((side, val) => {
    const num = parseFloat(val) || 0;
    if (linked) {
      const uniform = { top: num, right: num, bottom: num, left: num };
      onMarginChange(uniform);
    } else {
      onMarginChange({ ...marginValues, [side]: num });
    }
  }, [linked, marginValues, onMarginChange]);

  const handlePaddingChange = useCallback((side, val) => {
    const num = parseFloat(val) || 0;
    if (linked) {
      const uniform = { top: num, right: num, bottom: num, left: num };
      onPaddingChange(uniform);
    } else {
      onPaddingChange({ ...paddingValues, [side]: num });
    }
  }, [linked, paddingValues, onPaddingChange]);

  const handleReset = useCallback(() => {
    const defMargin = defaultMargin || { top: 0, right: 0, bottom: 0, left: 0 };
    const defPadding = defaultPadding || { top: 0, right: 0, bottom: 0, left: 0 };
    onMarginChange(defMargin);
    onPaddingChange(defPadding);
  }, [defaultMargin, defaultPadding, onMarginChange, onPaddingChange]);

  const renderInput = useCallback((type, side) => {
    const values = type === 'margin' ? marginValues : paddingValues;
    const handler = type === 'margin' ? handleMarginChange : handlePaddingChange;
    const key = `${type}-${side}`;
    const isEditing = editingSide === key;

    return (
      <input
        type="text"
        inputMode="decimal"
        value={values[side] || 0}
        onChange={(e) => handler(side, e.target.value)}
        onFocus={() => setEditingSide(key)}
        onBlur={() => setEditingSide(null)}
        style={{
          ...styles.edgeInput,
          ...(isEditing ? styles.edgeInputFocus : {}),
        }}
        aria-label={`${type} ${side}`}
      />
    );
  }, [marginValues, paddingValues, handleMarginChange, handlePaddingChange, editingSide]);

  return (
    <div style={styles.wrapper}>
      <div style={styles.headerRow}>
        <span style={styles.label}>{displayLabel}</span>
        <div style={styles.headerControls}>
          {/* Unit selector */}
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            style={styles.unitSelect}
            aria-label="Unit"
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
          {/* Link/unlink */}
          <button
            type="button"
            onClick={() => setLinked(!linked)}
            style={{
              ...styles.linkBtn,
              color: linked ? 'var(--builder-accent-primary)' : 'var(--builder-text-muted)',
            }}
            title={linked ? 'Unlink sides' : 'Link all sides'}
            aria-label={linked ? 'Unlink sides' : 'Link all sides'}
          >
            {linked ? <Link size={12} /> : <Unlink size={12} />}
          </button>
          {/* Reset */}
          <button
            type="button"
            onClick={handleReset}
            style={styles.resetBtn}
            title="Reset spacing"
            aria-label="Reset spacing"
          >
            <RotateCcw size={11} />
          </button>
        </div>
      </div>

      {/* Visual box model */}
      <div style={styles.boxModel}>
        {/* Margin label */}
        <span style={styles.boxLabel}>margin</span>

        {/* Margin top */}
        <div style={styles.marginTop}>
          {renderInput('margin', 'top')}
        </div>

        {/* Middle row: margin-left | padding box | margin-right */}
        <div style={styles.middleRow}>
          <div style={styles.marginSide}>
            {renderInput('margin', 'left')}
          </div>

          {/* Padding box */}
          <div style={styles.paddingBox}>
            <span style={styles.paddingLabel}>padding</span>

            {/* Padding top */}
            <div style={styles.paddingTop}>
              {renderInput('padding', 'top')}
            </div>

            {/* Padding middle: left | element | right */}
            <div style={styles.paddingMiddle}>
              <div style={styles.paddingSide}>
                {renderInput('padding', 'left')}
              </div>
              <div style={styles.elementBox}>
                <span style={styles.elementText}>Element</span>
              </div>
              <div style={styles.paddingSide}>
                {renderInput('padding', 'right')}
              </div>
            </div>

            {/* Padding bottom */}
            <div style={styles.paddingBottom}>
              {renderInput('padding', 'bottom')}
            </div>
          </div>

          <div style={styles.marginSide}>
            {renderInput('margin', 'right')}
          </div>
        </div>

        {/* Margin bottom */}
        <div style={styles.marginBottom}>
          {renderInput('margin', 'bottom')}
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  headerRow: {
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
  headerControls: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  unitSelect: {
    fontFamily: 'var(--builder-font-code)',
    fontSize: 10,
    color: 'var(--builder-text-primary)',
    background: 'var(--builder-bg-elevated)',
    border: '1px solid var(--builder-border-default)',
    borderRadius: 3,
    padding: '2px 4px',
    outline: 'none',
    cursor: 'pointer',
  },
  linkBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
    height: 20,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    borderRadius: 3,
    padding: 0,
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

  /* Box model visual */
  boxModel: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: 'rgba(249, 115, 22, 0.08)',
    border: '1px dashed rgba(249, 115, 22, 0.3)',
    borderRadius: 'var(--builder-radius-sm)',
    padding: '4px',
    gap: 2,
  },
  boxLabel: {
    position: 'absolute',
    top: 2,
    left: 6,
    fontFamily: 'var(--builder-font-code)',
    fontSize: 9,
    color: 'rgba(249, 115, 22, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  marginTop: {
    display: 'flex',
    justifyContent: 'center',
    paddingTop: 10,
  },
  marginBottom: {
    display: 'flex',
    justifyContent: 'center',
  },
  middleRow: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  },
  marginSide: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    flexShrink: 0,
  },
  paddingBox: {
    position: 'relative',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: 'rgba(34, 197, 94, 0.08)',
    border: '1px dashed rgba(34, 197, 94, 0.3)',
    borderRadius: 4,
    padding: '4px',
    gap: 2,
  },
  paddingLabel: {
    position: 'absolute',
    top: 2,
    left: 6,
    fontFamily: 'var(--builder-font-code)',
    fontSize: 9,
    color: 'rgba(34, 197, 94, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  paddingTop: {
    display: 'flex',
    justifyContent: 'center',
    paddingTop: 8,
  },
  paddingBottom: {
    display: 'flex',
    justifyContent: 'center',
  },
  paddingMiddle: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  },
  paddingSide: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    flexShrink: 0,
  },
  elementBox: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(59, 130, 246, 0.12)',
    border: '1px solid rgba(59, 130, 246, 0.25)',
    borderRadius: 3,
    padding: '8px 4px',
    minHeight: 24,
  },
  elementText: {
    fontFamily: 'var(--builder-font-code)',
    fontSize: 9,
    color: 'rgba(59, 130, 246, 0.7)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  edgeInput: {
    width: 28,
    height: 20,
    fontFamily: 'var(--builder-font-code)',
    fontSize: 10,
    color: 'var(--builder-text-primary)',
    background: 'var(--builder-bg-elevated)',
    border: '1px solid var(--builder-border-default)',
    borderRadius: 3,
    textAlign: 'center',
    outline: 'none',
    padding: '0 2px',
    boxSizing: 'border-box',
    transition: 'border-color var(--builder-transition-fast)',
  },
  edgeInputFocus: {
    borderColor: 'var(--builder-accent-primary)',
  },
};

export default memo(SpacingEditor);
