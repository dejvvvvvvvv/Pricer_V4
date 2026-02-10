import React, { useState } from 'react';

/**
 * Forge-themed horizontal tab navigation bar.
 *
 * Props:
 *  - tabs: Array of strings or { key, label } objects
 *  - activeTab: string (key or label of the active tab)
 *  - onTabChange: (key) => void
 *  - className: string
 */
export default function ForgeTabs({
  tabs = [],
  activeTab,
  onTabChange,
  className = '',
}) {
  const [hoveredTab, setHoveredTab] = useState(null);

  const normalizedTabs = tabs.map((tab) =>
    typeof tab === 'string' ? { key: tab, label: tab } : tab
  );

  const containerStyle = {
    display: 'flex',
    gap: 0,
    borderBottom: '1px solid var(--forge-border-default)',
  };

  const getTabStyle = (tab) => {
    const isActive = tab.key === activeTab;
    const isHovered = hoveredTab === tab.key && !isActive;

    let color;
    if (isActive) {
      color = 'var(--forge-accent-primary)';
    } else if (isHovered) {
      color = 'var(--forge-text-secondary)';
    } else {
      color = 'var(--forge-text-muted)';
    }

    return {
      fontFamily: 'var(--forge-font-tech)',
      fontSize: '13px',
      padding: '12px 16px',
      borderBottom: `2px solid ${isActive ? 'var(--forge-accent-primary)' : 'transparent'}`,
      marginBottom: '-1px',
      transition: 'color 120ms ease, border-bottom-color 120ms ease',
      color,
      background: 'none',
      border: 'none',
      borderBottomStyle: 'solid',
      borderBottomWidth: '2px',
      borderBottomColor: isActive ? 'var(--forge-accent-primary)' : 'transparent',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
    };
  };

  return (
    <div className={className} style={containerStyle}>
      {normalizedTabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          style={getTabStyle(tab)}
          onMouseEnter={() => setHoveredTab(tab.key)}
          onMouseLeave={() => setHoveredTab(null)}
          onClick={() => onTabChange && onTabChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
