/**
 * BuilderLeftPanel - Left sidebar panel for Widget Builder V2.
 *
 * Contains a 4-tab navigation bar (Styl / Bloky / Vrstvy / Globalni) and a
 * scrollable content area below.
 *
 * Pure presentational component - no hooks for data fetching.
 */
import React from 'react';
import { MousePointerClick, LayoutGrid, Layers, Settings2 } from 'lucide-react';

const TABS = [
  { id: 'style', label: 'Styl', icon: MousePointerClick },
  { id: 'blocks', label: 'Bloky', icon: LayoutGrid },
  { id: 'layers', label: 'Vrstvy', icon: Layers },
  { id: 'global', label: 'Globalni', icon: Settings2 },
];

/* Default placeholder for each tab when no content is provided */
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

const BuilderLeftPanel = ({
  activeTab = 'style',
  onTabChange,
  children,
  styleContent,
  blocksContent,
  layersContent,
  globalContent,
  // Legacy prop support
  elementsContent,
}) => {
  /* Determine what to render in the content area */
  const contentMap = {
    style: styleContent,
    blocks: blocksContent,
    layers: layersContent,
    global: globalContent,
    // Legacy fallback
    elements: elementsContent,
  };

  const resolvedContent = children || contentMap[activeTab] || null;
  const FallbackPlaceholder = PLACEHOLDER_MAP[activeTab] || DefaultStylePlaceholder;

  return (
    <div style={styles.panel}>
      {/* TAB BAR */}
      <div style={styles.tabBar}>
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
              aria-selected={isActive}
              role="tab"
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
      <div style={styles.content}>
        {resolvedContent || <FallbackPlaceholder />}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Inline styles using CSS custom properties from builder-tokens.css  */
/* ------------------------------------------------------------------ */

const styles = {
  panel: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: 'var(--builder-bg-secondary)',
    borderRight: '1px solid var(--builder-border-subtle)',
    minWidth: 0,
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
    /* dark scrollbar styling using builder tokens */
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

export default BuilderLeftPanel;
