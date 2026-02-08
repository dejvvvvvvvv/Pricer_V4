import React from 'react';

export default function ExpressTierSelector({ tiers = [], selectedTierId, onSelectTier, disabled = false }) {
  const activeTiers = tiers.filter(t => t.active !== false).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  if (activeTiers.length === 0) return null;

  return (
    <div className="mp-widget-express">
      <h4 className="mp-widget-section-title">Delivery Speed</h4>
      <div className="mp-widget-express-list">
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
              className={`mp-widget-express-card ${isSelected ? 'mp-widget-express-card--selected' : ''}`}
            >
              <div className={`mp-widget-radio ${isSelected ? 'mp-widget-radio--selected' : ''}`}>
                {isSelected && <div className="mp-widget-radio-dot" />}
              </div>
              <div className="mp-widget-express-info">
                <div className="mp-widget-express-name">{tier.name}</div>
                <div className="mp-widget-express-days">{tier.delivery_days > 0 ? `${tier.delivery_days} business days` : 'Standard'}</div>
              </div>
              <span className="mp-widget-express-price" style={{ color: tier.surcharge_value > 0 ? '#d97706' : '#16a34a' }}>{surchargeLabel}</span>
            </button>
          );
        })}
      </div>
      <style>{`
        .mp-widget-express { margin: 12px 0; }
        .mp-widget-section-title { font-size: 14px; font-weight: 600; color: var(--mp-text, #1a1a1a); margin-bottom: 8px; }
        .mp-widget-express-list { display: flex; flex-direction: column; gap: 6px; }
        .mp-widget-express-card { display: flex; align-items: center; gap: 10px; padding: 10px; border: 2px solid var(--mp-border, #e5e7eb); border-radius: var(--mp-radius, 8px); background: var(--mp-bg, #fff); cursor: pointer; text-align: left; transition: border-color 0.2s; }
        .mp-widget-express-card:hover { border-color: var(--mp-primary, #3b82f6); }
        .mp-widget-express-card--selected { border-color: var(--mp-primary, #3b82f6); background: color-mix(in srgb, var(--mp-primary, #3b82f6) 5%, transparent); }
        .mp-widget-radio { width: 16px; height: 16px; border: 2px solid var(--mp-border, #d1d5db); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .mp-widget-radio--selected { border-color: var(--mp-primary, #3b82f6); }
        .mp-widget-radio-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--mp-primary, #3b82f6); }
        .mp-widget-express-info { flex: 1; }
        .mp-widget-express-name { font-size: 13px; font-weight: 500; color: var(--mp-text, #1a1a1a); }
        .mp-widget-express-days { font-size: 11px; color: var(--mp-muted, #6b7280); }
        .mp-widget-express-price { font-size: 13px; font-weight: 500; }
      `}</style>
    </div>
  );
}
