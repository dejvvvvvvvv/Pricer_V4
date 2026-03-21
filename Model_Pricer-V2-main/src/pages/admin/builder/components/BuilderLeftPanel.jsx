/**
 * BuilderLeftPanel -- Left sidebar for Widget Builder.
 *
 * Component palette (VvvebJs-inspired) with:
 *   - Search field that filters components by name
 *   - 3 tabs: Components (draggable blocks), Blocks (pre-made sections), Layers (element tree)
 *   + Global tab (settings)
 *   - Components shown in 2-column grid with icon + name
 *   - Categories collapsible
 *   - Layers tab shows element hierarchy
 *
 * Pure presentational component. Tab content is passed via props.
 */
import React, { useState, useMemo, useCallback, memo } from 'react';
import {
  MousePointerClick, LayoutGrid, Layers, Settings2, Search, X,
} from 'lucide-react';

const TABS = [
  { id: 'style', label: 'Styl', icon: MousePointerClick },
  { id: 'blocks', label: 'Bloky', icon: LayoutGrid },
  { id: 'layers', label: 'Vrstvy', icon: Layers },
  { id: 'global', label: 'Globalni', icon: Settings2 },
];

/* Default placeholders for each tab */
const DefaultStylePlaceholder = () => (
  <div style={styles.placeholder}>
    <MousePointerClick
      size={32}
      color="var(--builder-text-muted)"
      style={{ marginBottom: 12 }}
    />
    <span style={styles.placeholderText}>
      Kliknete na element v nahledu pro editaci
    </span>
  </div>
);

const DefaultBlocksPlaceholder = () => (
  <div style={styles.placeholder}>
    <LayoutGrid
      size={32}
      color="var(--builder-text-muted)"
      style={{ marginBottom: 12 }}
    />
    <span style={styles.placeholderText}>Knihovna bloku</span>
  </div>
);

const DefaultLayersPlaceholder = () => (
  <div style={styles.placeholder}>
    <Layers
      size={32}
      color="var(--builder-text-muted)"
      style={{ marginBottom: 12 }}
    />
    <span style={styles.placeholderText}>Vrstvy elementu</span>
  </div>
);

const DefaultGlobalPlaceholder = () => (
  <div style={styles.placeholder}>
    <Settings2
      size={32}
      color="var(--builder-text-muted)"
      style={{ marginBottom: 12 }}
    />
    <span style={styles.placeholderText}>Globalni nastaveni</span>
  </div>
);

const PLACEHOLDER_MAP = {
  style: DefaultStylePlaceholder,
  blocks: DefaultBlocksPlaceholder,
  layers: DefaultLayersPlaceholder,
  global: DefaultGlobalPlaceholder,
};

function BuilderLeftPanel({
  activeTab = 'style',
  onTabChange,
  children,
  styleContent,
  blocksContent,
  layersContent,
  globalContent,
  // Legacy prop support
  elementsContent,
  // Search support
  searchQuery: externalSearchQuery,
  onSearchChange: externalOnSearchChange,
}) {
  // Internal search state (used if external not provided)
  const [internalSearch, setInternalSearch] = useState('');

  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearch;
  const onSearchChange = externalOnSearchChange || setInternalSearch;

  const showSearch = activeTab === 'blocks' || activeTab === 'style';

  const handleClearSearch = useCallback(() => {
    onSearchChange('');
  }, [onSearchChange]);

  /* Determine what to render in the content area */
  const contentMap = {
    style: styleContent,
    blocks: blocksContent,
    layers: layersContent,
    global: globalContent,
    elements: elementsContent,
  };

  const resolvedContent = children || contentMap[activeTab] || null;
  const FallbackPlaceholder = PLACEHOLDER_MAP[activeTab] || DefaultStylePlaceholder;

  return (
    <div style={styles.panel}>
      {/* SEARCH BAR (conditional) */}
      {showSearch && (
        <div style={styles.searchBar}>
          <Search
            size={13}
            color="var(--builder-text-muted)"
            style={{ flexShrink: 0 }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search..."
            style={styles.searchInput}
            aria-label="Search components"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              style={styles.clearSearchBtn}
              aria-label="Clear search"
            >
              <X size={12} />
            </button>
          )}
        </div>
      )}

      {/* TAB BAR */}
      <div style={styles.tabBar} role="tablist">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              style={{
                ...styles.tab,
                ...(isActive ? styles.tabActive : {}),
              }}
              role="tab"
              id={`blp-tab-${id}`}
              aria-selected={isActive}
              aria-controls={`blp-panel-${id}`}
            >
              <Icon
                size={14}
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
      </div>

      {/* CONTENT AREA */}
      <div
        style={styles.content}
        role="tabpanel"
        id={`blp-panel-${activeTab}`}
        aria-labelledby={`blp-tab-${activeTab}`}
      >
        {resolvedContent || <FallbackPlaceholder />}
      </div>
    </div>
  );
}

const styles = {
  panel: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: 'var(--builder-bg-secondary)',
    borderRight: '1px solid var(--builder-border-subtle)',
    minWidth: 0,
  },

  /* SEARCH BAR */
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 12px',
    borderBottom: '1px solid var(--builder-border-subtle)',
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'var(--builder-font-body)',
    fontSize: 12,
    color: 'var(--builder-text-primary)',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    padding: 0,
  },
  clearSearchBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 18,
    height: 18,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--builder-text-muted)',
    padding: 0,
    flexShrink: 0,
  },

  /* TAB BAR */
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
    fontSize: 12,
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

  /* CONTENT */
  content: {
    flex: '1 1 0%',
    overflowY: 'auto',
    overflowX: 'hidden',
    overscrollBehavior: 'contain',
    padding: '12px',
    scrollbarWidth: 'thin',
    scrollbarColor: 'var(--builder-scrollbar-thumb) var(--builder-scrollbar-track)',
  },

  /* PLACEHOLDER */
  placeholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    minHeight: 200,
    textAlign: 'center',
    padding: '24px 16px',
  },
  placeholderText: {
    fontFamily: 'var(--builder-font-body)',
    fontSize: 13,
    color: 'var(--builder-text-muted)',
    lineHeight: 1.5,
    maxWidth: 220,
  },
};

export default memo(BuilderLeftPanel);
