import React from 'react';

/**
 * Forge-themed small status badge pill.
 * Different from ForgeStatusIndicator (which has a dot + label layout).
 * This is a compact inline pill for table cells, lists, and metadata.
 *
 * @param {'active'|'pending'|'error'|'inactive'} status - Badge variant
 * @param {React.ReactNode} children - Badge text content
 */
export default function ForgeStatusBadge({
  status = 'active',
  children,
}) {
  const statusStyles = {
    active: {
      backgroundColor: 'rgba(0,212,170,0.12)',
      color: 'var(--forge-success)',
    },
    pending: {
      backgroundColor: 'rgba(255,181,71,0.12)',
      color: 'var(--forge-warning)',
    },
    error: {
      backgroundColor: 'rgba(255,71,87,0.12)',
      color: 'var(--forge-error)',
    },
    inactive: {
      backgroundColor: 'var(--forge-bg-overlay)',
      color: 'var(--forge-text-muted)',
    },
  };

  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 8px',
    borderRadius: '999px',
    fontFamily: 'var(--forge-font-mono)',
    fontSize: '11px',
    fontWeight: 500,
    lineHeight: 1.4,
    whiteSpace: 'nowrap',
    ...(statusStyles[status] || statusStyles.inactive),
  };

  return (
    <span style={baseStyle}>
      {children}
    </span>
  );
}
