import React, { useState, useRef, useCallback } from 'react';

/**
 * Forge-themed horizontal tab navigation bar.
 * Accessible: role="tablist" / role="tab", aria-selected, roving tabindex,
 * Left/Right arrow key navigation per WAI-ARIA Tabs pattern.
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
  const tabListRef = useRef(null);

  const normalizedTabs = tabs.map((tab) =>
    typeof tab === 'string' ? { key: tab, label: tab } : tab
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (!tabListRef.current) return;

      const tabButtons = Array.from(
        tabListRef.current.querySelectorAll('[role="tab"]')
      );
      const currentIndex = tabButtons.indexOf(e.currentTarget);
      if (currentIndex === -1) return;

      let nextIndex = -1;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextIndex = (currentIndex + 1) % tabButtons.length;
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        nextIndex = (currentIndex - 1 + tabButtons.length) % tabButtons.length;
      } else if (e.key === 'Home') {
        e.preventDefault();
        nextIndex = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        nextIndex = tabButtons.length - 1;
      }

      if (nextIndex >= 0) {
        tabButtons[nextIndex].focus();
        if (onTabChange) {
          onTabChange(normalizedTabs[nextIndex].key);
        }
      }
    },
    [normalizedTabs, onTabChange]
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
    <div
      ref={tabListRef}
      className={className}
      style={containerStyle}
      role="tablist"
    >
      {normalizedTabs.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            style={getTabStyle(tab)}
            onMouseEnter={() => setHoveredTab(tab.key)}
            onMouseLeave={() => setHoveredTab(null)}
            onClick={() => onTabChange && onTabChange(tab.key)}
            onKeyDown={handleKeyDown}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
