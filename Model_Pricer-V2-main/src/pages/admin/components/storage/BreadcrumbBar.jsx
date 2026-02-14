import React from 'react';
import Icon from '../../../../components/AppIcon';

export default function BreadcrumbBar({ currentPath, onNavigate }) {
  const parts = currentPath ? currentPath.split('/').filter(Boolean) : [];

  const crumbs = [{ label: 'Root', path: '' }];
  let accumulated = '';
  for (const part of parts) {
    accumulated = accumulated ? `${accumulated}/${part}` : part;
    crumbs.push({ label: part, path: accumulated });
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      padding: '8px 0',
      flexWrap: 'wrap',
    }}>
      {crumbs.map((crumb, idx) => (
        <React.Fragment key={crumb.path}>
          {idx > 0 && (
            <Icon name="ChevronRight" size={12} style={{ color: 'var(--forge-text-muted)' }} />
          )}
          <button
            type="button"
            onClick={() => onNavigate(crumb.path)}
            style={{
              background: 'none',
              border: 'none',
              padding: '4px 8px',
              borderRadius: 'var(--forge-radius-sm)',
              cursor: 'pointer',
              fontSize: '13px',
              fontFamily: 'var(--forge-font-body)',
              fontWeight: idx === crumbs.length - 1 ? 600 : 400,
              color: idx === crumbs.length - 1 ? 'var(--forge-text-primary)' : 'var(--forge-text-secondary)',
              transition: 'background-color 120ms ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--forge-bg-elevated)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            {idx === 0 ? <Icon name="Home" size={14} /> : crumb.label}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}
