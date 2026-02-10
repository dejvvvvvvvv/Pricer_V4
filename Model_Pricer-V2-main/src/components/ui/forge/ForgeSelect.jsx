import React from 'react';

/**
 * Forge-themed select dropdown with label and error display.
 * Styled to match ForgeInput — dark elevated background, accent focus ring.
 * Props: label, error, options [{value, label}], value, onChange, className, disabled.
 */
const ForgeSelect = React.forwardRef(({ label, error, options = [], className = '', ...props }, ref) => {
  const baseStyle = {
    height: '40px',
    width: '100%',
    padding: '0 32px 0 12px',
    backgroundColor: 'var(--forge-bg-elevated)',
    border: '1px solid var(--forge-border-default)',
    borderRadius: 'var(--forge-radius-sm)',
    fontFamily: 'var(--forge-font-body)',
    fontSize: 'var(--forge-text-base)',
    color: 'var(--forge-text-primary)',
    outline: 'none',
    transition: 'border-color 120ms ease-out, box-shadow 120ms ease-out',
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    cursor: 'pointer',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%237a8599' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
  };

  if (error) {
    baseStyle.borderColor = 'var(--forge-error)';
  }

  if (props.disabled) {
    baseStyle.opacity = 0.5;
    baseStyle.cursor = 'not-allowed';
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
      <select
        ref={ref}
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
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span style={errorStyle}>{error}</span>}
    </div>
  );
});

ForgeSelect.displayName = 'ForgeSelect';
export default ForgeSelect;
