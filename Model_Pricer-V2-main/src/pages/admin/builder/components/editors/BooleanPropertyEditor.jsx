/**
 * BooleanPropertyEditor -- toggle switch with reset support.
 *
 * Features:
 *   - Custom toggle switch UI
 *   - Active: accent-primary background
 *   - Inactive: border-default background
 *   - Reset to default button
 *   - Keyboard accessible
 */
import React, { useCallback, memo } from 'react';
import { RotateCcw } from 'lucide-react';

function BooleanPropertyEditor({
  label,
  labelCs,
  value,
  onChange,
  defaultValue,
}) {
  const isOn = Boolean(value);
  const displayLabel = labelCs || label || '';

  const handleToggle = useCallback(() => {
    onChange(!isOn);
  }, [isOn, onChange]);

  const handleReset = useCallback(() => {
    if (defaultValue === undefined) return;
    onChange(Boolean(defaultValue));
  }, [defaultValue, onChange]);

  return (
    <div style={styles.wrapper}>
      <span style={styles.label}>{displayLabel}</span>

      <div style={styles.controls}>
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
        <button
          type="button"
          role="switch"
          aria-checked={isOn}
          aria-label={displayLabel}
          onClick={handleToggle}
          style={{
            ...styles.track,
            backgroundColor: isOn
              ? 'var(--builder-accent-primary)'
              : 'var(--builder-border-default)',
          }}
        >
          <span
            style={{
              ...styles.thumb,
              transform: isOn ? 'translateX(16px)' : 'translateX(0)',
            }}
          />
        </button>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  label: {
    fontFamily: 'var(--builder-font-body)',
    fontSize: 12,
    color: 'var(--builder-text-secondary)',
    lineHeight: 1.3,
    flex: 1,
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
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
  track: {
    position: 'relative',
    width: 36,
    height: 20,
    borderRadius: 10,
    border: 'none',
    cursor: 'pointer',
    padding: 2,
    outline: 'none',
    flexShrink: 0,
    transition: 'background-color var(--builder-transition-fast)',
  },
  thumb: {
    display: 'block',
    width: 16,
    height: 16,
    borderRadius: '50%',
    backgroundColor: '#FFFFFF',
    boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
    transition: 'transform var(--builder-transition-fast)',
    pointerEvents: 'none',
  },
};

export default memo(BooleanPropertyEditor);
