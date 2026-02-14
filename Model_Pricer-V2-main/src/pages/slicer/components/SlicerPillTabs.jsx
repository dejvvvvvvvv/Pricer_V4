import React from 'react';

export default function SlicerPillTabs({ tabs, activeTab, onTabChange, size = 'md' }) {
  const isSmall = size === 'sm';
  return (
    <div style={{
      display: 'flex',
      gap: '4px',
      background: 'var(--forge-bg-elevated, #161920)',
      borderRadius: '20px',
      padding: '3px',
    }}>
      {tabs.map(tab => {
        const isActive = tab === activeTab;
        return (
          <button
            key={tab}
            onClick={() => onTabChange?.(tab)}
            style={{
              padding: isSmall ? '4px 12px' : '6px 16px',
              borderRadius: '16px',
              border: 'none',
              cursor: 'pointer',
              fontSize: isSmall ? '11px' : '13px',
              fontWeight: 500,
              fontFamily: 'var(--forge-font-body)',
              transition: 'all 150ms ease',
              background: isActive ? 'var(--forge-accent-primary, #00D4AA)' : 'transparent',
              color: isActive ? '#08090C' : 'var(--forge-text-secondary, #9BA3B0)',
            }}
          >
            {tab}
          </button>
        );
      })}
    </div>
  );
}
