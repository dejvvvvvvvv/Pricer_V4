import React from 'react';
import Icon from '../../../components/AppIcon';

// Props: { tiers, selectedTierId, onSelectTier, disabled }
// tiers = array of tier objects from express config
// selectedTierId = string
// onSelectTier = (tierId) => void

export default function ExpressTierSelector({ tiers = [], selectedTierId, onSelectTier, disabled = false }) {
  const activeTiers = tiers.filter(t => t.active !== false).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  if (activeTiers.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
        <Icon name="Zap" size={18} />
        Delivery Speed
      </h3>
      <div className="flex flex-col gap-2">
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
              className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/30'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                isSelected ? 'border-primary' : 'border-muted-foreground/30'
              }`}>
                {isSelected && <div className="w-2 h-2 rounded-full bg-primary" />}
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm text-foreground">{tier.name}</div>
                <div className="text-xs text-muted-foreground">
                  {tier.delivery_days > 0 ? `${tier.delivery_days} business days` : 'Standard delivery'}
                </div>
              </div>
              <span className={`text-sm font-medium ${tier.surcharge_value > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                {surchargeLabel}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
