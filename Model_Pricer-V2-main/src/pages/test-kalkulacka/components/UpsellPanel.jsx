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
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <Icon name="Zap" size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-amber-800">
            {upsellMessage || `Need it faster? Upgrade to ${nextTier.name}!`}
          </p>
          <p className="text-xs text-amber-600 mt-1">
            Get your order in {nextTier.delivery_days} business days
            {nextTier.surcharge_type === 'percent' ? ` for just +${nextTier.surcharge_value}%` : ` for +${nextTier.surcharge_value} CZK`}
          </p>
          <button
            onClick={() => onSelectTier(nextTier.id)}
            className="mt-2 px-3 py-1.5 bg-amber-600 text-white text-xs font-medium rounded-md hover:bg-amber-700 transition-colors"
          >
            Upgrade to {nextTier.name}
          </button>
        </div>
      </div>
    </div>
  );
}
