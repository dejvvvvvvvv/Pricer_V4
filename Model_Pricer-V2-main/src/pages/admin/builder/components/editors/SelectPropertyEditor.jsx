/**
 * SelectPropertyEditor -- dark-styled dropdown with reset support.
 *
 * Features:
 *   - Label and select element
 *   - Supports both string[] and {value,label}[] options
 *   - Immediate onChange propagation
 *   - Reset to default button
 */
import React, { useCallback, memo } from 'react';
import { RotateCcw } from 'lucide-react';

function SelectPropertyEditor({
  label,
  labelCs,
  value,
  options = [],
  onChange,
  defaultValue,
}) {
  const displayLabel = labelCs || label || '';

  const handleChange = useCallback((e) => {
    onChange(e.target.value);
  }, [onChange]);

  const handleReset = useCallback(() => {
    if (defaultValue === undefined) return;
    onChange(defaultValue);
  }, [defaultValue, onChange]);

  return (
    <div style={styles.wrapper}>
      <div style={styles.labelRow}>
        <span style={styles.label}>{displayLabel}</span>
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

      <select
        value={value || ''}
        onChange={handleChange}
        style={styles.select}
        aria-label={displayLabel}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  label: {
    fontFamily: 'var(--builder-font-body)',
    fontSize: 12,
    color: 'var(--builder-text-secondary)',
    lineHeight: 1.3,
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
    appearance: 'auto',
    transition: 'border-color var(--builder-transition-fast)',
  },
};

export default memo(SelectPropertyEditor);
