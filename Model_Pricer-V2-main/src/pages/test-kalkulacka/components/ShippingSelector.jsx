import React from 'react';
import Icon from '../../../components/AppIcon';

// Props: { methods, selectedMethodId, onSelectMethod, orderTotal, freeShippingThreshold, freeShippingEnabled, disabled }

export default function ShippingSelector({
  methods = [], selectedMethodId, onSelectMethod,
  orderTotal = 0, freeShippingThreshold = 0, freeShippingEnabled = false, disabled = false
}) {
  const activeMethods = methods.filter(m => m.active !== false).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  if (activeMethods.length === 0) return null;

  const qualifiesForFree = freeShippingEnabled && freeShippingThreshold > 0 && orderTotal >= freeShippingThreshold;
  const progressToFree = freeShippingEnabled && freeShippingThreshold > 0 && !qualifiesForFree
    ? Math.min(100, (orderTotal / freeShippingThreshold) * 100)
    : 0;
  const remaining = freeShippingEnabled && freeShippingThreshold > 0 ? Math.max(0, freeShippingThreshold - orderTotal) : 0;

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

  const progressBoxStyle = {
    marginBottom: '16px',
    padding: '12px',
    backgroundColor: 'rgba(0, 212, 170, 0.06)',
    border: '1px solid rgba(0, 212, 170, 0.15)',
    borderRadius: 'var(--forge-radius-sm)',
  };

  const successBoxStyle = {
    ...progressBoxStyle,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  return (
    <div style={cardStyle}>
      <h3 style={headingStyle}>
        <Icon name="Truck" size={18} style={{ color: 'var(--forge-text-muted)' }} />
        Shipping
      </h3>

      {/* Free shipping progress bar */}
      {freeShippingEnabled && freeShippingThreshold > 0 && !qualifiesForFree && (
        <div style={progressBoxStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--forge-accent-primary)', marginBottom: '6px' }}>
            <span>Free shipping progress</span>
            <span style={{ fontFamily: 'var(--forge-font-mono)', fontWeight: 600 }}>{Math.round(progressToFree)}%</span>
          </div>
          <div style={{ height: '4px', backgroundColor: 'var(--forge-bg-elevated)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', backgroundColor: 'var(--forge-accent-primary)', borderRadius: '2px', transition: 'width 300ms ease-out', width: `${progressToFree}%` }} />
          </div>
          <p style={{ fontSize: '11px', color: 'var(--forge-text-muted)', marginTop: '6px', fontFamily: 'var(--forge-font-body)' }}>
            Add <span style={{ fontFamily: 'var(--forge-font-mono)', fontWeight: 600, color: 'var(--forge-accent-primary)' }}>{remaining.toFixed(0)} CZK</span> more for free shipping!
          </p>
        </div>
      )}

      {qualifiesForFree && (
        <div style={successBoxStyle}>
          <Icon name="Check" size={16} style={{ color: 'var(--forge-success)' }} />
          <span style={{ fontSize: '13px', color: 'var(--forge-success)', fontWeight: 500, fontFamily: 'var(--forge-font-body)' }}>You qualify for free shipping!</span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {activeMethods.map(method => {
          const isSelected = method.id === selectedMethodId;
          const isFree = method.type === 'PICKUP' || (qualifiesForFree && method.type !== 'PICKUP');
          const price = isFree ? 0 : (method.price || 0);

          return (
            <button
              key={method.id}
              disabled={disabled}
              onClick={() => onSelectMethod(method.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                borderRadius: 'var(--forge-radius-sm)',
                border: isSelected ? '2px solid var(--forge-accent-primary)' : '2px solid var(--forge-border-default)',
                backgroundColor: isSelected ? 'rgba(0, 212, 170, 0.06)' : 'var(--forge-bg-elevated)',
                transition: 'all 150ms ease-out',
                textAlign: 'left',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                outline: 'none',
              }}
              onMouseEnter={(e) => {
                if (!isSelected && !disabled) e.currentTarget.style.borderColor = 'rgba(0, 212, 170, 0.3)';
              }}
              onMouseLeave={(e) => {
                if (!isSelected && !disabled) e.currentTarget.style.borderColor = 'var(--forge-border-default)';
              }}
            >
              <div style={{
                width: '16px', height: '16px', borderRadius: '50%',
                border: isSelected ? '2px solid var(--forge-accent-primary)' : '2px solid var(--forge-text-disabled)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                {isSelected && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--forge-accent-primary)' }} />}
              </div>
              <Icon name={method.type === 'PICKUP' ? 'MapPin' : 'Truck'} size={16} style={{ color: 'var(--forge-text-muted)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: '13px', color: 'var(--forge-text-primary)', fontFamily: 'var(--forge-font-body)' }}>{method.name}</div>
                {(method.delivery_days_min > 0 || method.delivery_days_max > 0) && (
                  <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-mono)', marginTop: '2px' }}>
                    {method.delivery_days_min === method.delivery_days_max
                      ? `${method.delivery_days_min} days`
                      : `${method.delivery_days_min}-${method.delivery_days_max} days`}
                  </div>
                )}
              </div>
              <span style={{
                fontSize: '13px', fontWeight: 600,
                fontFamily: 'var(--forge-font-mono)',
                color: price === 0 ? 'var(--forge-success)' : 'var(--forge-text-primary)',
              }}>
                {price === 0 ? 'Free' : `${price} CZK`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
