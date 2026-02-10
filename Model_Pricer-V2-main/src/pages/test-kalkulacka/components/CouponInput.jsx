import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';

// Props: { onApply, onRemove, appliedCoupon, validationError, disabled }
// appliedCoupon = { code, type, value, discount } or null
// onApply = (code) => void
// onRemove = () => void

export default function CouponInput({ onApply, onRemove, appliedCoupon = null, validationError = '', disabled = false }) {
  const [code, setCode] = useState('');

  const handleApply = () => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed) onApply(trimmed);
  };

  if (appliedCoupon) {
    return (
      <div style={{
        backgroundColor: 'rgba(0, 212, 170, 0.06)',
        border: '1px solid rgba(0, 212, 170, 0.15)',
        borderRadius: 'var(--forge-radius-md)',
        padding: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <Icon name="Tag" size={16} style={{ color: 'var(--forge-accent-primary)', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--forge-accent-primary)', fontFamily: 'var(--forge-font-mono)' }}>
            {appliedCoupon.code}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-mono)', marginTop: '2px' }}>
            {appliedCoupon.type === 'percent' ? `-${appliedCoupon.value}%` :
             appliedCoupon.type === 'fixed' ? `-${appliedCoupon.discount} CZK` : 'Free shipping'}
          </div>
        </div>
        <button
          onClick={onRemove}
          disabled={disabled}
          style={{
            background: 'none', border: 'none', padding: '4px',
            color: 'var(--forge-text-muted)', cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'color 150ms ease-out',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--forge-error)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--forge-text-muted)'; }}
        >
          <Icon name="X" size={14} />
        </button>
      </div>
    );
  }

  const cardStyle = {
    backgroundColor: 'var(--forge-bg-surface)',
    border: '1px solid var(--forge-border-default)',
    borderRadius: 'var(--forge-radius-md)',
    padding: '16px',
  };

  const headingStyle = {
    fontFamily: 'var(--forge-font-tech)',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--forge-text-primary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
  };

  const inputStyle = {
    flex: 1,
    padding: '0 12px',
    height: '40px',
    backgroundColor: 'var(--forge-bg-elevated)',
    border: '1px solid var(--forge-border-default)',
    borderRadius: 'var(--forge-radius-sm)',
    fontSize: '13px',
    fontFamily: 'var(--forge-font-mono)',
    fontWeight: 600,
    color: 'var(--forge-text-primary)',
    outline: 'none',
    letterSpacing: '0.05em',
    transition: 'border-color 120ms ease-out, box-shadow 120ms ease-out',
    boxSizing: 'border-box',
  };

  const btnStyle = {
    padding: '0 16px',
    height: '40px',
    backgroundColor: 'var(--forge-accent-primary)',
    color: '#08090C',
    fontSize: '12px',
    fontWeight: 700,
    fontFamily: 'var(--forge-font-tech)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderRadius: 'var(--forge-radius-sm)',
    border: 'none',
    cursor: disabled || !code.trim() ? 'not-allowed' : 'pointer',
    opacity: disabled || !code.trim() ? 0.5 : 1,
    transition: 'opacity 150ms ease-out, transform 150ms ease-out',
  };

  return (
    <div style={cardStyle}>
      <h3 style={headingStyle}>
        <Icon name="Tag" size={18} style={{ color: 'var(--forge-text-muted)' }} />
        Coupon Code
      </h3>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && handleApply()}
          placeholder="ENTER CODE..."
          disabled={disabled}
          style={inputStyle}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--forge-accent-primary)';
            e.target.style.boxShadow = '0 0 0 2px rgba(0,212,170,0.15)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'var(--forge-border-default)';
            e.target.style.boxShadow = 'none';
          }}
        />
        <button
          onClick={handleApply}
          disabled={disabled || !code.trim()}
          style={btnStyle}
        >
          Apply
        </button>
      </div>
      {validationError && (
        <p style={{
          fontSize: '11px', color: 'var(--forge-error)', marginTop: '8px',
          display: 'flex', alignItems: 'center', gap: '4px',
          fontFamily: 'var(--forge-font-body)',
        }}>
          <Icon name="AlertCircle" size={12} />
          {validationError}
        </p>
      )}
    </div>
  );
}
