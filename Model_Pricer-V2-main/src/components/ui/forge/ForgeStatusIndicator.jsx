import React from 'react';

const STATUS_CONFIG = {
  idle: { label: 'IDLE', dotColor: '#5C6370' },
  heating: { label: 'HEATING', dotColor: '#FFB547' },
  printing: { label: 'PRINTING', dotColor: '#00D4AA' },
  complete: { label: 'COMPLETE', dotColor: '#00D4AA' },
  error: { label: 'ERROR', dotColor: '#FF4757' },
};

export default function ForgeStatusIndicator({ status = 'printing', className = '' }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.printing;
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-[var(--forge-radius-sm)] border border-[var(--forge-border-default)] bg-[var(--forge-bg-surface)] ${className}`}>
      <span
        className="forge-label-mono"
        style={{ fontFamily: 'var(--forge-font-tech)', fontSize: 'var(--forge-text-xs)', letterSpacing: '0.1em', color: 'var(--forge-text-muted)' }}
      >
        STATUS:
      </span>
      <span
        className="forge-pulse-dot"
        style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: config.dotColor, display: 'inline-block' }}
      />
      <span
        style={{ fontFamily: 'var(--forge-font-tech)', fontSize: 'var(--forge-text-xs)', letterSpacing: '0.1em', color: config.dotColor, fontWeight: 400 }}
      >
        {config.label}
      </span>
    </div>
  );
}
