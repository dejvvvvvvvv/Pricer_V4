import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';

// Props: { onApply, onRemove, appliedCoupon, validationError, disabled }
// appliedCoupon = { code, type, value, discount } or null
// onApply = (code) => void
// onRemove = () => void

export default function CouponInput({ onApply, onRemove, appliedCoupon = null, validationError = '', disabled = false }) {
  const [code, setCode] = useState('');

  const handleApply = () => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed) onApply(trimmed);
  };

  if (appliedCoupon) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-3">
        <Icon name="Tag" size={16} className="text-green-600 flex-shrink-0" />
        <div className="flex-1">
          <div className="text-sm font-medium text-green-700">
            {appliedCoupon.code}
          </div>
          <div className="text-xs text-green-600">
            {appliedCoupon.type === 'percent' ? `-${appliedCoupon.value}%` :
             appliedCoupon.type === 'fixed' ? `-${appliedCoupon.discount} CZK` : 'Free shipping'}
          </div>
        </div>
        <button onClick={onRemove} className="text-green-600 hover:text-green-800 p-1" disabled={disabled}>
          <Icon name="X" size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
        <Icon name="Tag" size={18} />
        Coupon Code
      </h3>
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && handleApply()}
          placeholder="Enter code..."
          disabled={disabled}
          className="flex-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          onClick={handleApply}
          disabled={disabled || !code.trim()}
          className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          Apply
        </button>
      </div>
      {validationError && (
        <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
          <Icon name="AlertCircle" size={12} />
          {validationError}
        </p>
      )}
    </div>
  );
}
