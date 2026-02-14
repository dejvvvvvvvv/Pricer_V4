import React from 'react';
import Icon from '../../../../components/AppIcon';

const STATUS_CONFIG = {
  complete: { icon: 'CheckCircle', color: 'var(--forge-success)', label: 'Ready', bg: 'rgba(0, 212, 170, 0.12)' },
  pending: { icon: 'Clock', color: 'var(--forge-warning, #F5A623)', label: 'Processing', bg: 'rgba(245, 166, 35, 0.12)' },
  failed: { icon: 'AlertCircle', color: 'var(--forge-error)', label: 'Error', bg: 'rgba(255, 71, 87, 0.12)' },
  partial: { icon: 'AlertTriangle', color: 'var(--forge-warning, #F5A623)', label: 'Partial', bg: 'rgba(245, 166, 35, 0.12)' },
};

export default function StorageStatusBadge({ status, compact = false }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  if (compact) {
    return (
      <span title={cfg.label} style={{ display: 'inline-flex', alignItems: 'center' }}>
        <Icon name={cfg.icon} size={16} style={{ color: cfg.color }} />
      </span>
    );
  }

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 10px',
      borderRadius: '999px',
      fontSize: '11px',
      fontFamily: 'var(--forge-font-tech)',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
      backgroundColor: cfg.bg,
      color: cfg.color,
      border: `1px solid ${cfg.color}33`,
    }}>
      <Icon name={cfg.icon} size={12} />
      {cfg.label}
    </span>
  );
}
