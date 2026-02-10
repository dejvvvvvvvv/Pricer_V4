import React from 'react';
import Icon from '../../../components/AppIcon';

// Props: { promotion, onApply }
// promotion = { banner_text, banner_color, coupon_code, type, value } or null

export default function PromoBar({ promotion, onApply }) {
  if (!promotion || !promotion.banner_text) return null;

  return (
    <div style={{
      borderRadius: 'var(--forge-radius-md)',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      backgroundColor: 'rgba(0, 212, 170, 0.08)',
      border: '1px solid rgba(0, 212, 170, 0.2)',
    }}>
      <Icon name="Sparkles" size={18} style={{ color: 'var(--forge-accent-primary)', flexShrink: 0 }} />
      <div style={{
        flex: 1,
        fontSize: '13px',
        fontWeight: 500,
        color: 'var(--forge-accent-primary)',
        fontFamily: 'var(--forge-font-body)',
      }}>
        {promotion.banner_text}
      </div>
      {promotion.coupon_code && onApply && (
        <button
          onClick={() => onApply(promotion.coupon_code)}
          style={{
            padding: '4px 12px',
            backgroundColor: 'var(--forge-accent-primary)',
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
          Apply
        </button>
      )}
    </div>
  );
}
