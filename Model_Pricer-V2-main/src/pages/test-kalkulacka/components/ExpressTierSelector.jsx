import React from 'react';
import Icon from '../../../components/AppIcon';

// Props: { tiers, selectedTierId, onSelectTier, disabled }
// tiers = array of tier objects from express config
// selectedTierId = string
// onSelectTier = (tierId) => void

export default function ExpressTierSelector({ tiers = [], selectedTierId, onSelectTier, disabled = false }) {
  const activeTiers = tiers.filter(t => t.active !== false).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  if (activeTiers.length === 0) return null;

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

  return (
    <div style={cardStyle}>
      <h3 style={headingStyle}>
        <Icon name="Zap" size={18} style={{ color: 'var(--forge-accent-secondary)' }} />
        Delivery Speed
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {activeTiers.map(tier => {
          const isSelected = tier.id === selectedTierId;
          const surchargeLabel = tier.surcharge_value > 0
            ? (tier.surcharge_type === 'percent' ? `+${tier.surcharge_value}%` : `+${tier.surcharge_value} CZK`)
            : 'Included';

          return (
            <button
              key={tier.id}
              disabled={disabled}
              onClick={() => onSelectTier(tier.id)}
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
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: '13px', color: 'var(--forge-text-primary)', fontFamily: 'var(--forge-font-body)' }}>{tier.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-mono)', marginTop: '2px' }}>
                  {tier.delivery_days > 0 ? `${tier.delivery_days} business days` : 'Standard delivery'}
                </div>
              </div>
              <span style={{
                fontSize: '13px', fontWeight: 600,
                fontFamily: 'var(--forge-font-mono)',
                color: tier.surcharge_value > 0 ? 'var(--forge-accent-secondary)' : 'var(--forge-success)',
              }}>
                {surchargeLabel}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
