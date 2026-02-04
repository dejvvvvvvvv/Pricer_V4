/**
 * NumberPropertyEditor -- slider + number input.
 *
 * Shows: label with current value + unit, a range slider, and a small
 * number input for direct entry. Changes propagate immediately.
 */
import React from 'react';

export default function NumberPropertyEditor({
  label,
  value,
  min = 0,
  max = 100,
  unit = 'px',
  onChange,
}) {
  const numValue = typeof value === 'number' ? value : parseFloat(value) || min;

  function handleSliderChange(e) {
    onChange(Number(e.target.value));
  }

  function handleInputChange(e) {
    const parsed = parseFloat(e.target.value);
    if (!isNaN(parsed)) {
      const clamped = Math.min(max, Math.max(min, parsed));
      onChange(clamped);
    }
  }

  function handleInputBlur(e) {
    const parsed = parseFloat(e.target.value);
    if (isNaN(parsed)) {
      onChange(numValue);
    } else {
      const clamped = Math.min(max, Math.max(min, parsed));
      onChange(clamped);
    }
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.labelRow}>
        <span style={styles.label}>{label}</span>
        <span style={styles.valueDisplay}>
          {numValue}
          {unit}
        </span>
      </div>

      <div style={styles.controls}>
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={numValue}
          onChange={handleSliderChange}
          style={styles.slider}
          aria-label={label}
        />
        <input
          type="number"
          min={min}
          max={max}
          step={1}
          value={numValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          style={styles.numberInput}
          aria-label={`${label} hodnota`}
        />
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
  valueDisplay: {
    fontFamily: 'var(--builder-font-code)',
    fontSize: 11,
    color: 'var(--builder-text-muted)',
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
    transition: 'border-color var(--builder-transition-fast)',
  },
};
