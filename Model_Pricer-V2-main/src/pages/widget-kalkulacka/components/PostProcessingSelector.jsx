import React from 'react';

export default function PostProcessingSelector({ fees = [], selectedFeeIds = new Set(), onToggleFee }) {
  const postProcessingFees = fees.filter(f => f.category === 'POST_PROCESSING' && f.active && f.selectable);
  if (postProcessingFees.length === 0) return null;

  return (
    <div className="mp-widget-postprocessing">
      <h4 className="mp-widget-section-title">Post-Processing</h4>
      <div className="mp-widget-pp-grid">
        {postProcessingFees.map(fee => {
          const isSelected = selectedFeeIds.has(fee.id);
          return (
            <button
              key={fee.id}
              onClick={() => onToggleFee(fee.id)}
              className={`mp-widget-pp-card ${isSelected ? 'mp-widget-pp-card--selected' : ''}`}
            >
              <div className="mp-widget-pp-check">
                {isSelected && <span>&#10003;</span>}
              </div>
              <div className="mp-widget-pp-info">
                <div className="mp-widget-pp-name">{fee.name}</div>
                {fee.customer_description && <div className="mp-widget-pp-desc">{fee.customer_description}</div>}
                <div className="mp-widget-pp-price">
                  {fee.type === 'percent' ? `${fee.value}%` : `${fee.value} CZK`}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <style>{`
        .mp-widget-postprocessing { margin: 12px 0; }
        .mp-widget-section-title { font-size: 14px; font-weight: 600; color: var(--mp-text, #1a1a1a); margin-bottom: 8px; }
        .mp-widget-pp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .mp-widget-pp-card { display: flex; align-items: flex-start; gap: 8px; padding: 10px; border: 2px solid var(--mp-border, #e5e7eb); border-radius: var(--mp-radius, 8px); background: var(--mp-bg, #fff); cursor: pointer; text-align: left; transition: border-color 0.2s; }
        .mp-widget-pp-card:hover { border-color: var(--mp-primary, #3b82f6); }
        .mp-widget-pp-card--selected { border-color: var(--mp-primary, #3b82f6); background: color-mix(in srgb, var(--mp-primary, #3b82f6) 5%, transparent); }
        .mp-widget-pp-check { width: 18px; height: 18px; border: 2px solid var(--mp-border, #d1d5db); border-radius: 3px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 11px; color: #fff; }
        .mp-widget-pp-card--selected .mp-widget-pp-check { background: var(--mp-primary, #3b82f6); border-color: var(--mp-primary, #3b82f6); }
        .mp-widget-pp-name { font-size: 13px; font-weight: 500; color: var(--mp-text, #1a1a1a); }
        .mp-widget-pp-desc { font-size: 11px; color: var(--mp-muted, #6b7280); margin-top: 2px; }
        .mp-widget-pp-price { font-size: 11px; color: var(--mp-muted, #6b7280); margin-top: 4px; }
      `}</style>
    </div>
  );
}
