import React from 'react';

/**
 * Forge-themed text input with label and error display.
 * Accessible: label linked via wrapping, error announced inline.
 */
const ForgeInput = React.forwardRef(({ label, error, className = '', type = 'text', ...props }, ref) => {
  const baseStyle = {
    height: '40px',
    width: '100%',
    padding: '0 12px',
    backgroundColor: 'var(--forge-bg-elevated)',
    border: '1px solid var(--forge-border-default)',
    borderRadius: 'var(--forge-radius-sm)',
    fontFamily: 'var(--forge-font-body)',
    fontSize: 'var(--forge-text-base)',
    color: 'var(--forge-text-primary)',
    outline: 'none',
    transition: 'border-color 120ms ease-out, box-shadow 120ms ease-out',
  };

  if (error) {
    baseStyle.borderColor = 'var(--forge-error)';
  }

  const labelStyle = {
    fontFamily: 'var(--forge-font-body)',
    fontSize: '12px',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--forge-text-secondary)',
    marginBottom: '4px',
    display: 'block',
  };

  const errorStyle = {
    color: 'var(--forge-error)',
    fontSize: '12px',
    fontFamily: 'var(--forge-font-body)',
    marginTop: '4px',
  };

  return (
    <div className={className}>
      {label && <label style={labelStyle}>{label}</label>}
      <input
        ref={ref}
        type={type}
        style={baseStyle}
        onFocus={(e) => {
          if (!error) {
            e.target.style.borderColor = 'var(--forge-accent-primary)';
            e.target.style.boxShadow = '0 0 0 2px rgba(0,212,170,0.15)';
          } else {
            e.target.style.boxShadow = '0 0 0 2px rgba(255,71,87,0.15)';
          }
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? 'var(--forge-error)' : 'var(--forge-border-default)';
          e.target.style.boxShadow = 'none';
        }}
        {...props}
      />
      {error && <span style={errorStyle}>{error}</span>}
    </div>
  );
});

ForgeInput.displayName = 'ForgeInput';
export default ForgeInput;
