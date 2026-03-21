/**
 * OpacityEditor -- opacity slider with precise number input.
 *
 * Features:
 *   - Slider 0-1 with step 0.05
 *   - Number input for precise values
 *   - Live preview (opacity bar)
 *   - Reset to default
 */
import React, { useCallback, memo } from 'react';
import { RotateCcw } from 'lucide-react';

function OpacityEditor({
  label,
  labelCs,
  value = 1,
  onChange,
  defaultValue = 1,
}) {
  const displayLabel = labelCs || label || 'Opacity';
  const numValue = typeof value === 'number' ? value : parseFloat(value) || 1;
  const clamped = Math.min(1, Math.max(0, numValue));

  const handleSliderChange = useCallback((e) => {
    onChange(parseFloat(e.target.value));
  }, [onChange]);

  const handleInputChange = useCallback((e) => {
    const parsed = parseFloat(e.target.value);
    if (!isNaN(parsed)) {
      onChange(Math.min(1, Math.max(0, parsed)));
    }
  }, [onChange]);

  const handleReset = useCallback(() => {
    onChange(defaultValue);
  }, [defaultValue, onChange]);

  const percent = Math.round(clamped * 100);

  return (
    <div style={styles.wrapper}>
      <div style={styles.labelRow}>
        <span style={styles.label}>{displayLabel}</span>
        <div style={styles.labelRight}>
          <span style={styles.valueDisplay}>{percent}%</span>
          {defaultValue !== undefined && (
            <button
              type="button"
              onClick={handleReset}
              style={styles.resetBtn}
              title="Reset opacity"
              aria-label="Reset opacity"
            >
              <RotateCcw size={11} />
            </button>
          )}
        </div>
      </div>

      <div style={styles.controls}>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={clamped}
          onChange={handleSliderChange}
          style={styles.slider}
          aria-label={displayLabel}
        />
        <input
          type="number"
          min={0}
          max={1}
          step={0.05}
          value={clamped.toFixed(2)}
          onChange={handleInputChange}
          style={styles.numberInput}
          aria-label={`${displayLabel} value`}
        />
      </div>

      {/* Opacity preview bar */}
      <div style={styles.previewTrack}>
        {/* Checkerboard background to show transparency */}
        <div style={styles.checkerboard} />
        <div
          style={{
            ...styles.previewFill,
            width: `${percent}%`,
          }}
        />
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontFamily: 'var(--builder-font-body)',
    fontSize: 12,
    color: 'var(--builder-text-secondary)',
    lineHeight: 1.3,
  },
  labelRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  valueDisplay: {
    fontFamily: 'var(--builder-font-code)',
    fontSize: 11,
    color: 'var(--builder-text-muted)',
  },
  resetBtn: {
    display: 'inline-flex',
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
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  slider: {
    flex: 1,
    height: 4,
    appearance: 'auto',
    cursor: 'pointer',
    accentColor: 'var(--builder-accent-primary)',
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
    boxSizing: 'border-box',
  },
  previewTrack: {
    position: 'relative',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    border: '1px solid var(--builder-border-default)',
  },
  checkerboard: {
    position: 'absolute',
    inset: 0,
    background: `repeating-conic-gradient(
      var(--builder-bg-tertiary) 0% 25%,
      var(--builder-bg-elevated) 0% 50%
    ) 50% / 8px 8px`,
  },
  previewFill: {
    position: 'relative',
    height: '100%',
    background: 'var(--builder-accent-primary)',
    transition: 'width var(--builder-transition-fast)',
    borderRadius: 4,
  },
};

export default memo(OpacityEditor);
