import React from 'react';

export default function UpsellPanel({ currentTierId, tiers = [], onSelectTier, upsellMessage }) {
  const activeTiers = tiers.filter(t => t.active !== false).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  if (activeTiers.length < 2) return null;
  const currentIdx = activeTiers.findIndex(t => t.id === currentTierId);
  if (currentIdx < 0 || currentIdx > 0) return null;
  const nextTier = activeTiers[1];
  if (!nextTier) return null;

  return (
    <div className="mp-widget-upsell">
      <div className="mp-widget-upsell-content">
        <div className="mp-widget-upsell-text">
          {upsellMessage || `Need it faster? Upgrade to ${nextTier.name}!`}
        </div>
        <button onClick={() => onSelectTier(nextTier.id)} className="mp-widget-upsell-btn">
          Upgrade to {nextTier.name}
        </button>
      </div>
      <style>{`
        .mp-widget-upsell { background: #fffbeb; border: 1px solid #fde68a; border-radius: var(--mp-radius, 8px); padding: 10px 12px; margin: 8px 0; }
        .mp-widget-upsell-text { font-size: 12px; color: #92400e; }
        .mp-widget-upsell-btn { margin-top: 6px; padding: 4px 10px; background: #d97706; color: #fff; font-size: 11px; font-weight: 500; border: none; border-radius: 4px; cursor: pointer; }
        .mp-widget-upsell-btn:hover { background: #b45309; }
      `}</style>
    </div>
  );
}
