/**
 * BuilderLeftPanel - Left sidebar panel for Widget Builder V3.
 *
 * Contains a 3-tab navigation bar (Styl / Elementy / Globalni) and a
 * scrollable content area below. Content can be provided via dedicated
 * render props (styleContent, elementsContent, globalContent) or via
 * children as a fallback override.
 *
 * Pure presentational component - no hooks for data fetching.
 */
import React from 'react';
import { MousePointerClick, Layers, Settings2 } from 'lucide-react';

const TABS = [
  { id: 'style', label: 'Styl', icon: MousePointerClick },
  { id: 'elements', label: 'Elementy', icon: Layers },
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

const DefaultElementsPlaceholder = () => (
  <div style={styles.placeholder}>
    <Layers
      size={32}
      color="var(--builder-text-muted)"
      style={{ marginBottom: 12 }}
    />
    <span style={styles.placeholderText}>Seznam elementu</span>
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
  elements: DefaultElementsPlaceholder,
  global: DefaultGlobalPlaceholder,
};

const BuilderLeftPanel = ({
  activeTab = 'style',
  onTabChange,
  children,
  styleContent,
  elementsContent,
  globalContent,
}) => {
  /* Determine what to render in the content area */
  const contentMap = {
    style: styleContent,
    elements: elementsContent,
    global: globalContent,
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
    gap: '6px',
    fontFamily: 'var(--builder-font-body)',
    fontSize: 13,
    fontWeight: 400,
    color: 'var(--builder-text-muted)',
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    padding: '0 8px',
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
