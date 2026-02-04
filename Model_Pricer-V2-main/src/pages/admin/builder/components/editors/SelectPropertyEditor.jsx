/**
 * SelectPropertyEditor -- dark-styled dropdown.
 *
 * Renders a label and a <select> element populated from options[].
 * Changes propagate immediately.
 */
import React from 'react';

export default function SelectPropertyEditor({
  label,
  value,
  options = [],
  onChange,
}) {
  function handleChange(e) {
    onChange(e.target.value);
  }

  return (
    <div style={styles.wrapper}>
      <span style={styles.label}>{label}</span>

      <select
        value={value || ''}
        onChange={handleChange}
        style={styles.select}
        aria-label={label}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
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
