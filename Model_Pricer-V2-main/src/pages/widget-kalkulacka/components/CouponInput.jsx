import React, { useState } from 'react';

export default function CouponInput({ onApply, onRemove, appliedCoupon = null, validationError = '', disabled = false }) {
  const [code, setCode] = useState('');
  const handleApply = () => { const c = code.trim().toUpperCase(); if (c) onApply(c); };

  if (appliedCoupon) {
    return (
      <div className="mp-widget-coupon-applied">
        <span className="mp-widget-coupon-code">{appliedCoupon.code}</span>
        <span className="mp-widget-coupon-value">
          {appliedCoupon.type === 'percent' ? `-${appliedCoupon.value}%` : `-${appliedCoupon.discount} CZK`}
        </span>
        <button onClick={onRemove} disabled={disabled} className="mp-widget-coupon-remove">&#10005;</button>
        <style>{`
          .mp-widget-coupon-applied { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: var(--mp-radius, 8px); margin: 8px 0; }
          .mp-widget-coupon-code { font-size: 13px; font-weight: 600; color: #15803d; flex: 1; }
          .mp-widget-coupon-value { font-size: 12px; color: #16a34a; }
          .mp-widget-coupon-remove { background: none; border: none; color: #16a34a; cursor: pointer; font-size: 14px; padding: 2px; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="mp-widget-coupon">
      <h4 className="mp-widget-section-title">Coupon Code</h4>
      <div className="mp-widget-coupon-row">
        <input type="text" value={code} onChange={e => setCode(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && handleApply()} placeholder="Enter code..."
          disabled={disabled} className="mp-widget-coupon-input" />
        <button onClick={handleApply} disabled={disabled || !code.trim()} className="mp-widget-coupon-btn">Apply</button>
      </div>
      {validationError && <div className="mp-widget-coupon-error">{validationError}</div>}
      <style>{`
        .mp-widget-coupon { margin: 12px 0; }
        .mp-widget-section-title { font-size: 14px; font-weight: 600; color: var(--mp-text, #1a1a1a); margin-bottom: 8px; }
        .mp-widget-coupon-row { display: flex; gap: 6px; }
        .mp-widget-coupon-input { flex: 1; padding: 6px 10px; border: 1px solid var(--mp-border, #d1d5db); border-radius: var(--mp-radius, 6px); font-size: 13px; background: var(--mp-bg, #fff); color: var(--mp-text, #1a1a1a); }
        .mp-widget-coupon-input:focus { outline: none; border-color: var(--mp-primary, #3b82f6); }
        .mp-widget-coupon-btn { padding: 6px 14px; background: var(--mp-primary, #3b82f6); color: #fff; border: none; border-radius: var(--mp-radius, 6px); font-size: 13px; font-weight: 500; cursor: pointer; }
        .mp-widget-coupon-btn:disabled { opacity: 0.5; }
        .mp-widget-coupon-error { font-size: 11px; color: #dc2626; margin-top: 4px; }
      `}</style>
    </div>
  );
}
