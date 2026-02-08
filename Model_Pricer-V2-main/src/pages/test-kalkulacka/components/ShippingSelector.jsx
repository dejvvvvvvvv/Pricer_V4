import React from 'react';
import Icon from '../../../components/AppIcon';

// Props: { methods, selectedMethodId, onSelectMethod, orderTotal, freeShippingThreshold, freeShippingEnabled, disabled }

export default function ShippingSelector({
  methods = [], selectedMethodId, onSelectMethod,
  orderTotal = 0, freeShippingThreshold = 0, freeShippingEnabled = false, disabled = false
}) {
  const activeMethods = methods.filter(m => m.active !== false).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  if (activeMethods.length === 0) return null;

  const qualifiesForFree = freeShippingEnabled && freeShippingThreshold > 0 && orderTotal >= freeShippingThreshold;
  const progressToFree = freeShippingEnabled && freeShippingThreshold > 0 && !qualifiesForFree
    ? Math.min(100, (orderTotal / freeShippingThreshold) * 100)
    : 0;
  const remaining = freeShippingEnabled && freeShippingThreshold > 0 ? Math.max(0, freeShippingThreshold - orderTotal) : 0;

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
        <Icon name="Truck" size={18} />
        Shipping
      </h3>

      {/* Free shipping progress bar */}
      {freeShippingEnabled && freeShippingThreshold > 0 && !qualifiesForFree && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex justify-between text-xs text-green-700 mb-1">
            <span>Free shipping progress</span>
            <span>{Math.round(progressToFree)}%</span>
          </div>
          <div className="h-2 bg-green-200 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all duration-300" style={{ width: `${progressToFree}%` }} />
          </div>
          <p className="text-xs text-green-600 mt-1">
            Add {remaining.toFixed(0)} CZK more for free shipping!
          </p>
        </div>
      )}

      {qualifiesForFree && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <Icon name="Check" size={16} className="text-green-600" />
          <span className="text-sm text-green-700 font-medium">You qualify for free shipping!</span>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {activeMethods.map(method => {
          const isSelected = method.id === selectedMethodId;
          const isFree = method.type === 'PICKUP' || (qualifiesForFree && method.type !== 'PICKUP');
          const price = isFree ? 0 : (method.price || 0);

          return (
            <button
              key={method.id}
              disabled={disabled}
              onClick={() => onSelectMethod(method.id)}
              className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                isSelected ? 'border-primary' : 'border-muted-foreground/30'
              }`}>
                {isSelected && <div className="w-2 h-2 rounded-full bg-primary" />}
              </div>
              <Icon name={method.type === 'PICKUP' ? 'MapPin' : 'Truck'} size={16} className="text-muted-foreground flex-shrink-0" />
              <div className="flex-1">
                <div className="font-medium text-sm text-foreground">{method.name}</div>
                {(method.delivery_days_min > 0 || method.delivery_days_max > 0) && (
                  <div className="text-xs text-muted-foreground">
                    {method.delivery_days_min === method.delivery_days_max
                      ? `${method.delivery_days_min} days`
                      : `${method.delivery_days_min}-${method.delivery_days_max} days`}
                  </div>
                )}
              </div>
              <span className={`text-sm font-medium ${price === 0 ? 'text-green-600' : 'text-foreground'}`}>
                {price === 0 ? 'Free' : `${price} CZK`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
