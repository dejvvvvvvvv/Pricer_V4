import React from 'react';

/**
 * Forge-themed admin page header with breadcrumb trail and action buttons.
 *
 * @param {string} title - Page title (Space Grotesk 700)
 * @param {string} breadcrumb - Breadcrumb text (Space Mono uppercase, e.g. "ADMIN / PRICING")
 * @param {React.ReactNode} actions - Right-aligned action buttons or controls
 * @param {string} className - Additional CSS classes
 */
export default function ForgePageHeader({
  title,
  breadcrumb,
  actions,
  className = '',
}) {
  const containerStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '16px',
    flexWrap: 'wrap',
  };

  const leftStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    minWidth: 0,
  };

  const breadcrumbStyle = {
    fontFamily: 'var(--forge-font-tech)',
    fontWeight: 400,
    fontSize: 'var(--forge-text-xs)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--forge-text-muted)',
    margin: 0,
    lineHeight: 1.4,
  };

  const titleStyle = {
    fontFamily: 'var(--forge-font-heading)',
    fontWeight: 700,
    fontSize: 'var(--forge-text-2xl)',
    color: 'var(--forge-text-primary)',
    margin: 0,
    lineHeight: 1.2,
  };

  const actionsStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
  };

  return (
    <div className={`forge-page-header ${className}`} style={containerStyle}>
      <div style={leftStyle}>
        {breadcrumb && <p style={breadcrumbStyle}>{breadcrumb}</p>}
        <h1 style={titleStyle}>{title}</h1>
      </div>
      {actions && <div style={actionsStyle}>{actions}</div>}
    </div>
  );
}
