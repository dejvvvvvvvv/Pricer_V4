import React from 'react';
import Icon from '../../../components/AppIcon';

// Props: { fees, selectedFeeIds, onToggleFee }
// fees = array of fee objects where category === 'POST_PROCESSING'
// selectedFeeIds = Set of selected fee IDs
// onToggleFee = (feeId) => void

export default function PostProcessingSelector({ fees = [], selectedFeeIds = new Set(), onToggleFee }) {
  const postProcessingFees = fees.filter(f => f.category === 'POST_PROCESSING' && f.active && f.selectable);

  if (postProcessingFees.length === 0) return null;

  const cardStyle = {
    backgroundColor: 'var(--forge-bg-surface)',
    border: '1px solid var(--forge-border-default)',
    borderRadius: 'var(--forge-radius-md)',
    padding: '16px',
  };

  const headingStyle = {
    fontFamily: 'var(--forge-font-tech)',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--forge-text-primary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
  };

  return (
    <div style={cardStyle}>
      <h3 style={headingStyle}>
        <Icon name="Paintbrush" size={18} style={{ color: 'var(--forge-text-muted)' }} />
        Post-Processing Services
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        {postProcessingFees.map(fee => {
          const isSelected = selectedFeeIds.has(fee.id);
          return (
            <button
              key={fee.id}
              onClick={() => onToggleFee(fee.id)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px',
                borderRadius: 'var(--forge-radius-sm)',
                border: isSelected ? '2px solid var(--forge-accent-primary)' : '2px solid var(--forge-border-default)',
                backgroundColor: isSelected ? 'rgba(0, 212, 170, 0.06)' : 'var(--forge-bg-elevated)',
                transition: 'all 150ms ease-out',
                textAlign: 'left',
                cursor: 'pointer',
                outline: 'none',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.borderColor = 'rgba(0, 212, 170, 0.3)';
              }}
              onMouseLeave={(e) => {
                if (!isSelected) e.currentTarget.style.borderColor = 'var(--forge-border-default)';
              }}
            >
              <div style={{
                width: '18px', height: '18px', borderRadius: 'var(--forge-radius-sm)',
                border: isSelected ? '2px solid var(--forge-accent-primary)' : '2px solid var(--forge-text-disabled)',
                backgroundColor: isSelected ? 'var(--forge-accent-primary)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px',
              }}>
                {isSelected && <Icon name="Check" size={12} style={{ color: '#08090C' }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: '13px', color: 'var(--forge-text-primary)', fontFamily: 'var(--forge-font-body)' }}>{fee.name}</div>
                {fee.customer_description && (
                  <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)', marginTop: '3px', fontFamily: 'var(--forge-font-body)' }}>{fee.customer_description}</div>
                )}
                {fee.processing_days > 0 && (
                  <div style={{ fontSize: '11px', color: 'var(--forge-accent-secondary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Icon name="Clock" size={10} />
                    +{fee.processing_days} days
                  </div>
                )}
                <div style={{ fontSize: '11px', color: 'var(--forge-text-muted)', marginTop: '4px', fontFamily: 'var(--forge-font-mono)' }}>
                  {fee.type === 'percent' ? `${fee.value}%` : `${fee.value} CZK`}
                </div>
              </div>
              {fee.image_url && (
                <img src={fee.image_url} alt="" style={{ width: '40px', height: '40px', borderRadius: 'var(--forge-radius-sm)', objectFit: 'cover', flexShrink: 0 }} loading="lazy" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
