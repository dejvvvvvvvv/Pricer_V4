// ForgeBreadcrumb — Automatic breadcrumb navigation from URL path
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const ROUTE_LABELS = {
  'admin': 'Admin',
  'dashboard': 'Dashboard',
  'pricing': 'Pricing',
  'fees': 'Fees',
  'parameters': 'Parameters',
  'presets': 'Presets',
  'orders': 'Orders',
  'branding': 'Branding',
  'widget': 'Widget',
  'analytics': 'Analytics',
  'team': 'Team',
  'integrations': 'Integrations',
  'shipping': 'Shipping',
  'express': 'Express',
  'emails': 'Emails',
  'coupons': 'Coupons',
  'payments': 'Payments',
  'account': 'Account',
  'migration': 'Migration',
  'model-storage': 'Model Storage',
};

export function ForgeBreadcrumb() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  // Don't render breadcrumb when there is only one segment (e.g. /admin root)
  if (segments.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      paddingBottom: '16px',
      fontSize: '0.8125rem',
      color: 'var(--forge-text-muted, #7A8291)',
      fontFamily: 'var(--forge-font-body)',
    }}>
      {segments.map((segment, i) => {
        const path = '/' + segments.slice(0, i + 1).join('/');
        const label = ROUTE_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
        const isLast = i === segments.length - 1;

        return (
          <React.Fragment key={path}>
            {i > 0 && (
              <span
                aria-hidden="true"
                style={{
                  color: 'var(--forge-text-muted, #7A8291)',
                  opacity: 0.5,
                  userSelect: 'none',
                }}
              >
                /
              </span>
            )}
            {isLast ? (
              <span
                style={{ color: 'var(--forge-text-primary, #E8EAED)' }}
                aria-current="page"
              >
                {label}
              </span>
            ) : (
              <Link
                to={path}
                style={{
                  color: 'var(--forge-text-muted, #7A8291)',
                  textDecoration: 'none',
                  transition: 'color 150ms ease-out',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--forge-text-secondary, #B0B7C3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--forge-text-muted, #7A8291)';
                }}
              >
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

export default ForgeBreadcrumb;
