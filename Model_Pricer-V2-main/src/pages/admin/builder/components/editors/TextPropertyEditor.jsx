/**
 * TextPropertyEditor -- enhanced debounced text input with multi-line support.
 *
 * Features:
 *   - Single-line input or multi-line textarea
 *   - Character count display
 *   - Placeholder text support
 *   - Debounced onChange (300ms)
 *   - Reset to default button
 */
import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { RotateCcw } from 'lucide-react';

function TextPropertyEditor({
  label,
  labelCs,
  value,
  onChange,
  defaultValue,
  multiline = false,
  maxLength,
  placeholder,
}) {
  const [localValue, setLocalValue] = useState(value || '');
  const timerRef = useRef(null);
  const displayLabel = labelCs || label || '';

  // Sync external value changes into local state
  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  const handleChange = useCallback((e) => {
    const next = e.target.value;
    setLocalValue(next);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      onChange(next);
    }, 300);
  }, [onChange]);

  // Flush pending debounce on blur
  const handleBlur = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    onChange(localValue);
  }, [localValue, onChange]);

  const handleReset = useCallback(() => {
    const def = defaultValue || '';
    setLocalValue(def);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    onChange(def);
  }, [defaultValue, onChange]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const charCount = localValue.length;
  const showCharCount = multiline || maxLength;

  const inputProps = {
    value: localValue,
    onChange: handleChange,
    onBlur: handleBlur,
    spellCheck: false,
    'aria-label': displayLabel,
    placeholder: placeholder || '',
    maxLength: maxLength || undefined,
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.labelRow}>
        <span style={styles.label}>{displayLabel}</span>
        <div style={styles.labelActions}>
          {showCharCount && (
            <span style={styles.charCount}>
              {charCount}{maxLength ? `/${maxLength}` : ''}
            </span>
          )}
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

      {multiline ? (
        <textarea
          {...inputProps}
          rows={3}
          style={styles.textarea}
        />
      ) : (
        <input
          {...inputProps}
          type="text"
          style={styles.input}
        />
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
  labelActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  charCount: {
    fontFamily: 'var(--builder-font-code)',
    fontSize: 10,
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
  input: {
    width: '100%',
    fontFamily: 'var(--builder-font-body)',
    fontSize: 12,
    color: 'var(--builder-text-primary)',
    background: 'var(--builder-bg-elevated)',
    border: '1px solid var(--builder-border-default)',
    borderRadius: 'var(--builder-radius-sm)',
    padding: '6px 8px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color var(--builder-transition-fast)',
  },
  textarea: {
    width: '100%',
    fontFamily: 'var(--builder-font-body)',
    fontSize: 12,
    color: 'var(--builder-text-primary)',
    background: 'var(--builder-bg-elevated)',
    border: '1px solid var(--builder-border-default)',
    borderRadius: 'var(--builder-radius-sm)',
    padding: '6px 8px',
    outline: 'none',
    boxSizing: 'border-box',
    resize: 'vertical',
    minHeight: 56,
    lineHeight: 1.5,
    transition: 'border-color var(--builder-transition-fast)',
  },
};

export default memo(TextPropertyEditor);
