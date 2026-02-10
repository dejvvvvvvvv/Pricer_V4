import React from 'react';
import Icon from '../../../components/AppIcon';

// Props: { fees, selectedFeeIds, onToggleFee }
// fees = array of fee objects where category === 'POST_PROCESSING'
// selectedFeeIds = Set of selected fee IDs
// onToggleFee = (feeId) => void

export default function PostProcessingSelector({ fees = [], selectedFeeIds = new Set(), onToggleFee }) {
  const postProcessingFees = fees.filter(f => f.category === 'POST_PROCESSING' && f.active && f.selectable);

  if (postProcessingFees.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
        <Icon name="Paintbrush" size={18} />
        Post-Processing Services
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {postProcessingFees.map(fee => {
          const isSelected = selectedFeeIds.has(fee.id);
          return (
            <button
              key={fee.id}
              onClick={() => onToggleFee(fee.id)}
              className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/30'
              }`}
            >
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
              }`}>
                {isSelected && <Icon name="Check" size={12} className="text-primary-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-foreground">{fee.name}</div>
                {fee.customer_description && (
                  <div className="text-xs text-muted-foreground mt-0.5">{fee.customer_description}</div>
                )}
                {fee.processing_days > 0 && (
                  <div className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                    <Icon name="Clock" size={10} />
                    +{fee.processing_days} days
                  </div>
                )}
                <div className="text-xs text-muted-foreground mt-1">
                  {fee.type === 'percent' ? `${fee.value}%` : `${fee.value} CZK`}
                </div>
              </div>
              {fee.image_url && (
                <img src={fee.image_url} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" loading="lazy" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
