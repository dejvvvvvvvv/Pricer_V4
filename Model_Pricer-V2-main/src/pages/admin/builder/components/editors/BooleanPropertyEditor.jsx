/**
 * BooleanPropertyEditor -- custom toggle switch.
 *
 * Active state: --builder-accent-primary background.
 * Inactive state: --builder-border-default background.
 */
import React from 'react';

export default function BooleanPropertyEditor({ label, value, onChange }) {
  const isOn = Boolean(value);

  function handleToggle() {
    onChange(!isOn);
  }

  return (
    <div style={styles.wrapper}>
      <span style={styles.label}>{label}</span>

      <button
        type="button"
        role="switch"
        aria-checked={isOn}
        aria-label={label}
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
