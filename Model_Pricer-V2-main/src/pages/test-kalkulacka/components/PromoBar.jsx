import React from 'react';
import Icon from '../../../components/AppIcon';

// Props: { promotion, onApply }
// promotion = { banner_text, banner_color, coupon_code, type, value } or null

export default function PromoBar({ promotion, onApply }) {
  if (!promotion || !promotion.banner_text) return null;

  const bgColor = promotion.banner_color || '#3b82f6';

  return (
    <div
      className="rounded-xl p-3 flex items-center gap-3 text-white"
      style={{ backgroundColor: bgColor }}
    >
      <Icon name="Sparkles" size={18} className="flex-shrink-0" />
      <div className="flex-1 text-sm font-medium">
        {promotion.banner_text}
      </div>
      {promotion.coupon_code && onApply && (
        <button
          onClick={() => onApply(promotion.coupon_code)}
          className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-xs font-medium rounded-md transition-colors"
        >
          Apply
        </button>
      )}
    </div>
  );
}
