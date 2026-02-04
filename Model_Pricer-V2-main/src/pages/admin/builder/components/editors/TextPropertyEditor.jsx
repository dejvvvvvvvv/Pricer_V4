/**
 * TextPropertyEditor -- debounced text input for editable text content.
 *
 * Uses local state + setTimeout(300ms) to avoid excessive re-renders
 * while still propagating changes to the parent.
 */
import React, { useState, useEffect, useRef } from 'react';

export default function TextPropertyEditor({ label, value, onChange }) {
  const [localValue, setLocalValue] = useState(value || '');
  const timerRef = useRef(null);

  // Sync external value changes into local state
  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  function handleChange(e) {
    const next = e.target.value;
    setLocalValue(next);

    // Debounce 300ms
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      onChange(next);
    }, 300);
  }

  // Flush pending debounce on blur
  function handleBlur() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    onChange(localValue);
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <div style={styles.wrapper}>
      <span style={styles.label}>{label}</span>

      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        style={styles.input}
        spellCheck={false}
        aria-label={label}
      />
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontFamily: 'var(--builder-font-body)',
    fontSize: 12,
    color: 'var(--builder-text-secondary)',
    lineHeight: 1.3,
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
};
