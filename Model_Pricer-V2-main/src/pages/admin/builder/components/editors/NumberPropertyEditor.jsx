/**
 * NumberPropertyEditor -- enhanced number input with slider, +/- buttons, and unit.
 *
 * Features:
 *   - Slider + number input (dual control)
 *   - Min/max validation
 *   - Unit display (px, %, rem, em)
 *   - Increment/decrement buttons
 *   - Optional slider-only mode
 *   - Reset to default button
 *   - Step configuration
 */
import React, { useState, useCallback, memo } from 'react';
import { RotateCcw, Minus, Plus } from 'lucide-react';

function NumberPropertyEditor({
  label,
  labelCs,
  value,
  min = 0,
  max = 100,
  step = 1,
  unit = 'px',
  onChange,
  defaultValue,
  sliderOnly = false,
}) {
  const numValue = typeof value === 'number' ? value : parseFloat(value) || min;
  const [rawInput, setRawInput] = useState(null);
  const displayLabel = labelCs || label || '';

  const clamp = useCallback((v) => {
    return Math.min(max, Math.max(min, v));
  }, [min, max]);

  const handleSliderChange = useCallback((e) => {
    setRawInput(null);
    onChange(Number(e.target.value));
  }, [onChange]);

  const handleInputChange = useCallback((e) => {
    const raw = e.target.value;
    setRawInput(raw);
  }, []);

  const handleInputBlur = useCallback(() => {
    if (rawInput === null) return;
    const parsed = parseFloat(rawInput);
    const final = isNaN(parsed) ? numValue : clamp(parsed);
    setRawInput(null);
    onChange(final);
  }, [rawInput, numValue, clamp, onChange]);

  const handleInputKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = clamp(numValue + step);
      setRawInput(null);
      onChange(next);
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = clamp(numValue - step);
      setRawInput(null);
      onChange(next);
    }
  }, [numValue, step, clamp, onChange]);

  const handleIncrement = useCallback(() => {
    const next = clamp(numValue + step);
    setRawInput(null);
    onChange(next);
  }, [numValue, step, clamp, onChange]);

  const handleDecrement = useCallback(() => {
    const next = clamp(numValue - step);
    setRawInput(null);
    onChange(next);
  }, [numValue, step, clamp, onChange]);

  const handleReset = useCallback(() => {
    if (defaultValue === undefined) return;
    const def = typeof defaultValue === 'number' ? defaultValue : parseFloat(defaultValue) || min;
    setRawInput(null);
    onChange(clamp(def));
  }, [defaultValue, min, clamp, onChange]);

  const displayValue = rawInput !== null ? rawInput : String(numValue);

  return (
    <div style={styles.wrapper}>
      {/* Label row */}
      <div style={styles.labelRow}>
        <span style={styles.label}>{displayLabel}</span>
        <div style={styles.labelRight}>
          <span style={styles.valueDisplay}>
            {numValue}{unit}
          </span>
          {defaultValue !== undefined && (
            <button
              type="button"
              onClick={handleReset}
              style={styles.resetBtn}
              title="Reset to default"
              aria-label="Reset to default"
            >
              <RotateCcw size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Slider */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={numValue}
        onChange={handleSliderChange}
        style={styles.slider}
        aria-label={displayLabel}
      />

      {/* Number input with +/- buttons (hidden in sliderOnly mode) */}
      {!sliderOnly && (
        <div style={styles.inputRow}>
          <button
            type="button"
            onClick={handleDecrement}
            style={styles.stepBtn}
            disabled={numValue <= min}
            aria-label="Decrease"
          >
            <Minus size={12} />
          </button>
          <input
            type="text"
            inputMode="decimal"
            value={displayValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            style={styles.numberInput}
            aria-label={`${displayLabel} value`}
          />
          <span style={styles.unitLabel}>{unit}</span>
          <button
            type="button"
            onClick={handleIncrement}
            style={styles.stepBtn}
            disabled={numValue >= max}
            aria-label="Increase"
          >
            <Plus size={12} />
          </button>
        </div>
      )}
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
  slider: {
    width: '100%',
    height: 4,
    appearance: 'auto',
    cursor: 'pointer',
    accentColor: 'var(--builder-accent-primary)',
  },
  inputRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  stepBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
    background: 'var(--builder-bg-elevated)',
    border: '1px solid var(--builder-border-default)',
    borderRadius: 'var(--builder-radius-sm)',
    cursor: 'pointer',
    color: 'var(--builder-text-secondary)',
    padding: 0,
    flexShrink: 0,
    transition: 'background var(--builder-transition-fast)',
  },
  numberInput: {
    flex: 1,
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
    transition: 'border-color var(--builder-transition-fast)',
  },
  unitLabel: {
    fontFamily: 'var(--builder-font-code)',
    fontSize: 10,
    color: 'var(--builder-text-muted)',
    minWidth: 18,
    flexShrink: 0,
  },
};

export default memo(NumberPropertyEditor);
