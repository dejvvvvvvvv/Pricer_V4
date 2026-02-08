import React from 'react';

export default function ShippingSelector({ methods = [], selectedMethodId, onSelectMethod, orderTotal = 0, freeShippingThreshold = 0, freeShippingEnabled = false, disabled = false }) {
  const activeMethods = methods.filter(m => m.active !== false).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  if (activeMethods.length === 0) return null;
  const qualifiesForFree = freeShippingEnabled && freeShippingThreshold > 0 && orderTotal >= freeShippingThreshold;
  const remaining = freeShippingEnabled && freeShippingThreshold > 0 ? Math.max(0, freeShippingThreshold - orderTotal) : 0;
  const progress = freeShippingEnabled && freeShippingThreshold > 0 ? Math.min(100, (orderTotal / freeShippingThreshold) * 100) : 0;

  return (
    <div className="mp-widget-shipping">
      <h4 className="mp-widget-section-title">Shipping</h4>
      {freeShippingEnabled && freeShippingThreshold > 0 && !qualifiesForFree && (
        <div className="mp-widget-shipping-progress">
          <div className="mp-widget-shipping-bar">
            <div className="mp-widget-shipping-bar-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="mp-widget-shipping-remaining">Add {remaining.toFixed(0)} CZK for free shipping</span>
        </div>
      )}
      {qualifiesForFree && <div className="mp-widget-shipping-free">&#10003; Free shipping!</div>}
      <div className="mp-widget-shipping-list">
        {activeMethods.map(method => {
          const isSelected = method.id === selectedMethodId;
          const isFree = method.type === 'PICKUP' || qualifiesForFree;
          const price = isFree ? 0 : (method.price || 0);
          return (
            <button key={method.id} disabled={disabled} onClick={() => onSelectMethod(method.id)}
              className={`mp-widget-express-card ${isSelected ? 'mp-widget-express-card--selected' : ''}`}>
              <div className={`mp-widget-radio ${isSelected ? 'mp-widget-radio--selected' : ''}`}>
                {isSelected && <div className="mp-widget-radio-dot" />}
              </div>
              <div className="mp-widget-express-info">
                <div className="mp-widget-express-name">{method.name}</div>
                {(method.delivery_days_min > 0 || method.delivery_days_max > 0) && (
                  <div className="mp-widget-express-days">{method.delivery_days_min}-{method.delivery_days_max} days</div>
                )}
              </div>
              <span style={{ fontSize: '13px', fontWeight: 500, color: price === 0 ? '#16a34a' : 'var(--mp-text, #1a1a1a)' }}>
                {price === 0 ? 'Free' : `${price} CZK`}
              </span>
            </button>
          );
        })}
      </div>
      <style>{`
        .mp-widget-shipping { margin: 12px 0; }
        .mp-widget-section-title { font-size: 14px; font-weight: 600; color: var(--mp-text, #1a1a1a); margin-bottom: 8px; }
        .mp-widget-shipping-progress { margin-bottom: 8px; }
        .mp-widget-shipping-bar { height: 6px; background: #d1fae5; border-radius: 3px; overflow: hidden; }
        .mp-widget-shipping-bar-fill { height: 100%; background: #22c55e; border-radius: 3px; transition: width 0.3s; }
        .mp-widget-shipping-remaining { font-size: 11px; color: #16a34a; }
        .mp-widget-shipping-free { font-size: 12px; color: #16a34a; font-weight: 500; margin-bottom: 8px; }
        .mp-widget-shipping-list { display: flex; flex-direction: column; gap: 6px; }
        .mp-widget-express-card { display: flex; align-items: center; gap: 10px; padding: 10px; border: 2px solid var(--mp-border, #e5e7eb); border-radius: var(--mp-radius, 8px); background: var(--mp-bg, #fff); cursor: pointer; text-align: left; transition: border-color 0.2s; }
        .mp-widget-express-card:hover { border-color: var(--mp-primary, #3b82f6); }
        .mp-widget-express-card--selected { border-color: var(--mp-primary, #3b82f6); background: color-mix(in srgb, var(--mp-primary, #3b82f6) 5%, transparent); }
        .mp-widget-radio { width: 16px; height: 16px; border: 2px solid var(--mp-border, #d1d5db); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .mp-widget-radio--selected { border-color: var(--mp-primary, #3b82f6); }
        .mp-widget-radio-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--mp-primary, #3b82f6); }
        .mp-widget-express-info { flex: 1; }
        .mp-widget-express-name { font-size: 13px; font-weight: 500; color: var(--mp-text, #1a1a1a); }
        .mp-widget-express-days { font-size: 11px; color: var(--mp-muted, #6b7280); }
      `}</style>
    </div>
  );
}
