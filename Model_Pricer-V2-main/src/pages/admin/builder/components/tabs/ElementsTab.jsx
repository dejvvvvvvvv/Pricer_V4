/**
 * ElementsTab -- tree-like element list for Widget Builder V3.
 *
 * Renders all widget elements from ELEMENT_REGISTRY in ELEMENT_ORDER.
 * Clicking a row selects the element and switches to the Style tab.
 * The 'viewer' element is visually dimmed with a "Non-editable" badge.
 */
import React from 'react';
import {
  Layout,
  Type,
  ListOrdered,
  Upload,
  Box,
  Settings,
  Receipt,
  DollarSign,
  MousePointerClick,
  PanelBottom,
} from 'lucide-react';

import {
  ELEMENT_REGISTRY,
  ELEMENT_ORDER,
} from '../../config/elementRegistry';

// Map icon name strings from the registry to actual lucide-react components
const ICON_MAP = {
  Layout,
  Type,
  ListOrdered,
  Upload,
  Box,
  Settings,
  Receipt,
  DollarSign,
  MousePointerClick,
  PanelBottom,
};

/**
 * Determine a representative "primary color" for an element by looking
 * at the first color-type property in the element's properties list.
 * Falls back to a neutral grey.
 */
function getElementPrimaryColor(element, theme) {
  if (!theme || !element.properties.length) return '#64748B';

  // Find first property whose key ends with "Color" or "Bg"
  for (const key of element.properties) {
    const val = theme[key];
    if (val && typeof val === 'string' && val.startsWith('#')) {
      return val;
    }
  }

  return '#64748B';
}

export default function ElementsTab({
  selectedElementId,
  onSelectElement,
  onSwitchToStyle,
  theme,
}) {
  return (
    <div style={styles.list}>
      {ELEMENT_ORDER.map((elementId) => {
        const element = ELEMENT_REGISTRY[elementId];
        if (!element) return null;

        const IconComponent = ICON_MAP[element.icon] || Box;
        const isActive = selectedElementId === elementId;
        const isViewer = elementId === 'viewer';
        const primaryColor = getElementPrimaryColor(element, theme);

        function handleClick() {
          if (isViewer) return; // viewer is non-editable
          onSelectElement(elementId);
          onSwitchToStyle();
        }

        return (
          <button
            key={elementId}
            type="button"
            onClick={handleClick}
            disabled={isViewer}
            style={{
              ...styles.row,
              ...(isActive ? styles.rowActive : {}),
              ...(isViewer ? styles.rowDisabled : {}),
            }}
            aria-selected={isActive}
            aria-disabled={isViewer}
            title={isViewer ? 'Tento element nelze editovat' : element.label.cs}
          >
            {/* Active indicator dot */}
            <span
              style={{
                ...styles.activeDot,
                backgroundColor: isActive
                  ? 'var(--builder-accent-success)'
                  : 'transparent',
              }}
            />

            {/* Icon */}
            <IconComponent
              size={16}
              color={
                isViewer
                  ? 'var(--builder-text-muted)'
                  : isActive
                    ? 'var(--builder-text-primary)'
                    : 'var(--builder-text-secondary)'
              }
              style={{ flexShrink: 0 }}
            />

            {/* Label */}
            <span
              style={{
                ...styles.label,
                color: isViewer
                  ? 'var(--builder-text-muted)'
                  : isActive
                    ? 'var(--builder-text-primary)'
                    : 'var(--builder-text-secondary)',
              }}
            >
              {element.label.cs}
            </span>

            {/* Non-editable badge for viewer */}
            {isViewer && <span style={styles.badge}>Non-editable</span>}

            {/* Color dot (skip for viewer) */}
            {!isViewer && (
              <span
                style={{
                  ...styles.colorDot,
                  backgroundColor: primaryColor,
                }}
                title={primaryColor}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

const styles = {
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    padding: '8px 10px',
    background: 'transparent',
    border: 'none',
    borderRadius: 'var(--builder-radius-sm)',
    cursor: 'pointer',
    fontFamily: 'var(--builder-font-body)',
    fontSize: 13,
    transition: 'background-color var(--builder-transition-fast)',
    textAlign: 'left',
    outline: 'none',
  },
  rowActive: {
    backgroundColor: 'var(--builder-hover-bg)',
  },
  rowDisabled: {
    cursor: 'default',
    opacity: 0.5,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    flexShrink: 0,
    transition: 'background-color var(--builder-transition-fast)',
  },
  label: {
    flex: 1,
    fontFamily: 'var(--builder-font-body)',
    fontSize: 13,
    lineHeight: 1.3,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  badge: {
    fontFamily: 'var(--builder-font-body)',
    fontSize: 10,
    color: 'var(--builder-text-muted)',
    background: 'var(--builder-bg-elevated)',
    border: '1px solid var(--builder-border-default)',
    borderRadius: 'var(--builder-radius-sm)',
    padding: '1px 6px',
    whiteSpace: 'nowrap',
    lineHeight: 1.4,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    flexShrink: 0,
    border: '1px solid var(--builder-border-default)',
  },
};
