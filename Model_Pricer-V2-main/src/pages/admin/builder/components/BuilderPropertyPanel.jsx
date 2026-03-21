/**
 * BuilderPropertyPanel -- the right-side property editor panel.
 *
 * Displays a tabbed interface (Content / Style / Advanced) for editing
 * properties of the selected element in the Widget Builder.
 *
 * Features:
 *   - 3 tabs: Content, Style, Advanced
 *   - Element name + type header with lock icon
 *   - "No element selected" state
 *   - Close button
 *   - Scrollable content area
 *
 * This replaces the inline StyleTab rendering that was previously
 * done directly in BuilderPage's right panel.
 */
import React, { useState, memo } from 'react';
import { FileText, Paintbrush, Settings2 } from 'lucide-react';

import ContentTab from './tabs/ContentTab';
import StyleTab from './tabs/StyleTab';
import AdvancedTab from './tabs/AdvancedTab';

const TABS = [
  { id: 'content', label: 'Content', icon: FileText },
  { id: 'style', label: 'Style', icon: Paintbrush },
  { id: 'advanced', label: 'Advanced', icon: Settings2 },
];

function BuilderPropertyPanel({
  selectedElementId,
  theme,
  onUpdateProperty,
  onClose,
}) {
  const [activeTab, setActiveTab] = useState('style');

  return (
    <div style={styles.panel}>
      {/* Tab bar */}
      <div style={styles.tabBar} role="tablist">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                ...styles.tab,
                ...(isActive ? styles.tabActive : {}),
              }}
              role="tab"
              id={`prop-tab-${id}`}
              aria-selected={isActive}
              aria-controls={`prop-panel-${id}`}
            >
              <Icon
                size={13}
                color={
                  isActive
                    ? 'var(--builder-text-primary)'
                    : 'var(--builder-text-muted)'
                }
                style={{ flexShrink: 0 }}
              />
              <span>{label}</span>
            </button>
          );
        })}

        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            style={styles.closeBtn}
            aria-label="Close properties panel"
            title="Close"
          >
            x
          </button>
        )}
      </div>

      {/* Content area */}
      <div
        style={styles.content}
        role="tabpanel"
        id={`prop-panel-${activeTab}`}
        aria-labelledby={`prop-tab-${activeTab}`}
      >
        {activeTab === 'content' && (
          <ContentTab
            selectedElementId={selectedElementId}
            theme={theme}
            onUpdateProperty={onUpdateProperty}
          />
        )}
        {activeTab === 'style' && (
          <StyleTab
            selectedElementId={selectedElementId}
            theme={theme}
            onUpdateProperty={onUpdateProperty}
          />
        )}
        {activeTab === 'advanced' && (
          <AdvancedTab
            selectedElementId={selectedElementId}
            theme={theme}
            onUpdateProperty={onUpdateProperty}
          />
        )}
      </div>
    </div>
  );
}

const styles = {
  panel: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minWidth: 0,
  },

  /* Tab bar */
  tabBar: {
    display: 'flex',
    alignItems: 'stretch',
    height: 'var(--builder-tab-height, 44px)',
    minHeight: 'var(--builder-tab-height, 44px)',
    borderBottom: '1px solid var(--builder-border-subtle)',
    flexShrink: 0,
    padding: '0 4px',
    gap: 0,
  },
  tab: {
    flex: '1 1 0%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    fontFamily: 'var(--builder-font-body)',
    fontSize: 11,
    fontWeight: 400,
    color: 'var(--builder-text-muted)',
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    padding: '0 4px',
    transition:
      'color var(--builder-transition-fast), border-color var(--builder-transition-fast)',
    whiteSpace: 'nowrap',
  },
  tabActive: {
    color: 'var(--builder-text-primary)',
    fontWeight: 600,
    borderBottomColor: 'var(--builder-accent-primary)',
  },
  closeBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: '100%',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--builder-text-muted)',
    fontSize: 16,
    fontFamily: 'var(--builder-font-body)',
    flexShrink: 0,
    borderLeft: '1px solid var(--builder-border-subtle)',
    transition: 'color var(--builder-transition-fast)',
  },

  /* Content */
  content: {
    flex: '1 1 0%',
    overflowY: 'auto',
    overflowX: 'hidden',
    overscrollBehavior: 'contain',
    padding: '12px',
    scrollbarWidth: 'thin',
    scrollbarColor: 'var(--builder-scrollbar-thumb) var(--builder-scrollbar-track)',
  },
};

export default memo(BuilderPropertyPanel);
