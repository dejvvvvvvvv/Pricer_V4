import React from 'react';

export default function PromoBar({ promotion, onApply }) {
  if (!promotion || !promotion.banner_text) return null;
  const bg = promotion.banner_color || '#3b82f6';
  return (
    <div className="mp-widget-promo" style={{ backgroundColor: bg }}>
      <span className="mp-widget-promo-text">{promotion.banner_text}</span>
      {promotion.coupon_code && onApply && (
        <button onClick={() => onApply(promotion.coupon_code)} className="mp-widget-promo-btn">Apply</button>
      )}
      <style>{`
        .mp-widget-promo { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: var(--mp-radius, 8px); color: #fff; margin: 8px 0; }
        .mp-widget-promo-text { flex: 1; font-size: 12px; font-weight: 500; }
        .mp-widget-promo-btn { padding: 3px 10px; background: rgba(255,255,255,0.2); color: #fff; border: none; border-radius: 4px; font-size: 11px; cursor: pointer; }
        .mp-widget-promo-btn:hover { background: rgba(255,255,255,0.3); }
      `}</style>
    </div>
  );
}
