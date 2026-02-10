import React from 'react';

/**
 * Forge-themed toggle switch.
 * 44x22px track, 16px thumb. Uses CSS variables for FORGE palette.
 * Props: checked, onChange, label, disabled, className.
 */
export default function ForgeToggle({ checked = false, onChange, label, disabled = false, className = '' }) {
  const trackStyle = {
    position: 'relative',
    width: '44px',
    height: '22px',
    borderRadius: '11px',
    backgroundColor: checked ? 'var(--forge-accent-primary)' : 'var(--forge-border-active)',
    transition: 'background-color 150ms ease-out',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    flexShrink: 0,
    border: 'none',
    outline: 'none',
    padding: 0,
  };

  const thumbStyle = {
    position: 'absolute',
    top: '3px',
    left: checked ? '25px' : '3px',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    backgroundColor: checked ? '#ffffff' : 'var(--forge-text-muted)',
    transition: 'left 150ms ease-out, background-color 150ms ease-out',
    pointerEvents: 'none',
  };

  const wrapperStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  };

  const labelStyle = {
    fontFamily: 'var(--forge-font-body)',
    fontSize: 'var(--forge-text-base)',
    color: 'var(--forge-text-secondary)',
    userSelect: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
  };

  const handleClick = () => {
    if (!disabled && onChange) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div className={className} style={wrapperStyle}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label || 'Toggle'}
        disabled={disabled}
        style={trackStyle}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onFocus={(e) => {
          e.currentTarget.style.boxShadow = '0 0 0 2px rgba(0,212,170,0.25)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <span style={thumbStyle} />
      </button>
      {label && (
        <span style={labelStyle} onClick={handleClick}>
          {label}
        </span>
      )}
    </div>
  );
}
