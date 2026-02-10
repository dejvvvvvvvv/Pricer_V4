import React from 'react';
import Icon from '../../../components/AppIcon';

// Props: { currentTierId, tiers, onSelectTier, upsellMessage }

export default function UpsellPanel({ currentTierId, tiers = [], onSelectTier, upsellMessage }) {
  // Only show if current tier is the cheapest/default and there's a better option
  const activeTiers = tiers.filter(t => t.active !== false).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  if (activeTiers.length < 2) return null;

  const currentIdx = activeTiers.findIndex(t => t.id === currentTierId);
  if (currentIdx < 0 || currentIdx > 0) return null; // Only upsell from the cheapest tier

  const nextTier = activeTiers[1]; // The next faster tier
  if (!nextTier) return null;

  return (
    <div style={{
      backgroundColor: 'rgba(255, 107, 53, 0.08)',
      border: '1px solid rgba(255, 107, 53, 0.2)',
      borderRadius: 'var(--forge-radius-md)',
      padding: '16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <Icon name="Zap" size={20} style={{ color: 'var(--forge-accent-secondary)', flexShrink: 0, marginTop: '2px' }} />
        <div style={{ flex: 1 }}>
          <p style={{
            fontSize: '13px', fontWeight: 600,
            color: 'var(--forge-accent-secondary)',
            fontFamily: 'var(--forge-font-body)',
            margin: 0,
          }}>
            {upsellMessage || `Need it faster? Upgrade to ${nextTier.name}!`}
          </p>
          <p style={{
            fontSize: '11px', color: 'var(--forge-text-muted)',
            fontFamily: 'var(--forge-font-mono)',
            margin: '4px 0 0 0',
          }}>
            Get your order in {nextTier.delivery_days} business days
            {nextTier.surcharge_type === 'percent' ? ` for just +${nextTier.surcharge_value}%` : ` for +${nextTier.surcharge_value} CZK`}
          </p>
          <button
            onClick={() => onSelectTier(nextTier.id)}
            style={{
              marginTop: '10px',
              padding: '6px 14px',
              backgroundColor: 'var(--forge-accent-secondary)',
              color: '#08090C',
              fontSize: '11px',
              fontWeight: 700,
              fontFamily: 'var(--forge-font-tech)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              borderRadius: 'var(--forge-radius-sm)',
              border: 'none',
              cursor: 'pointer',
              transition: 'opacity 150ms ease-out',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
          >
            Upgrade to {nextTier.name}
          </button>
        </div>
      </div>
    </div>
  );
}
