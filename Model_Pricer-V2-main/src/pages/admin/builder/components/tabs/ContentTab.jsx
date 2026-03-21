/**
 * ContentTab -- content-specific properties of the selected element.
 *
 * Shows:
 *   - Text content (title, description, labels)
 *   - Visibility toggles for sub-elements
 *   - Content-specific configuration
 *   - Element info header
 *
 * When no element is selected, shows a placeholder prompt.
 */
import React, { useMemo, memo } from 'react';
import {
  MousePointerClick, Layout, Type, ListOrdered, Upload, Box,
  Settings, Receipt, DollarSign, PanelBottom,
} from 'lucide-react';

import { ELEMENT_REGISTRY } from '../../config/elementRegistry';
import { THEME_PROPERTIES } from '@/utils/widgetThemeStorage';
import TextPropertyEditor from '../editors/TextPropertyEditor';
import BooleanPropertyEditor from '../editors/BooleanPropertyEditor';

const ICON_MAP = {
  Layout, Type, ListOrdered, Upload, Box, Settings,
  Receipt, DollarSign, MousePointerClick, PanelBottom,
};

// Build property definition lookup
const PROPERTY_DEF_MAP = {};
for (const def of THEME_PROPERTIES) {
  PROPERTY_DEF_MAP[def.key] = def;
}

function ContentTab({
  selectedElementId,
  theme,
  onUpdateProperty,
}) {
  const element = selectedElementId
    ? ELEMENT_REGISTRY[selectedElementId]
    : null;

  // Gather text and boolean properties
  const contentProps = useMemo(() => {
    if (!element) return { texts: [], booleans: [] };

    const texts = [];
    const booleans = [];

    // Editable texts
    for (const key of element.editableTexts) {
      const def = PROPERTY_DEF_MAP[key];
      if (def) texts.push(def);
    }

    // Boolean properties (visibility toggles etc.)
    for (const key of element.properties) {
      const def = PROPERTY_DEF_MAP[key];
      if (def && def.type === 'boolean') {
        booleans.push(def);
      }
    }

    return { texts, booleans };
  }, [element]);

  // No element selected
  if (!element) {
    return (
      <div style={styles.placeholder}>
        <MousePointerClick
          size={32}
          color="var(--builder-text-muted)"
          style={{ marginBottom: 12 }}
        />
        <span style={styles.placeholderTitle}>No element selected</span>
        <span style={styles.placeholderText}>
          Click on an element in the canvas to edit its content properties.
        </span>
      </div>
    );
  }

  const IconComponent = ICON_MAP[element.icon] || Box;
  const hasContent = contentProps.texts.length > 0 || contentProps.booleans.length > 0;

  return (
    <div style={styles.wrapper}>
      {/* Element header */}
      <div style={styles.heading}>
        <IconComponent
          size={18}
          color="var(--builder-accent-primary)"
          style={{ flexShrink: 0 }}
        />
        <div style={styles.headingInfo}>
          <span style={styles.headingText}>{element.label.cs}</span>
          <span style={styles.headingSubtext}>{element.label.en}</span>
        </div>
      </div>

      {/* No content properties */}
      {!hasContent && (
        <div style={styles.emptyMessage}>
          This element has no editable content properties.
          Switch to the Style tab to edit visual properties.
        </div>
      )}

      {/* Text content */}
      {contentProps.texts.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>TEXT CONTENT</div>
          <div style={styles.editorList}>
            {contentProps.texts.map((def) => (
              <TextPropertyEditor
                key={def.key}
                label={def.label}
                value={theme[def.key] || ''}
                onChange={(val) => onUpdateProperty(def.key, val)}
                multiline={def.key.includes('Description') || def.key.includes('Tagline')}
                placeholder={`Enter ${def.label.toLowerCase()}...`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Visibility toggles */}
      {contentProps.booleans.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>VISIBILITY</div>
          <div style={styles.editorList}>
            {contentProps.booleans.map((def) => (
              <BooleanPropertyEditor
                key={def.key}
                label={def.label}
                value={Boolean(theme[def.key])}
                onChange={(val) => onUpdateProperty(def.key, val)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Element info */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>ELEMENT INFO</div>
        <div style={styles.infoGrid}>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>ID</span>
            <span style={styles.infoValue}>{element.id}</span>
          </div>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>Zone</span>
            <span style={styles.infoValue}>{element.zone}</span>
          </div>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>Protected</span>
            <span style={styles.infoValue}>{element.protected ? 'Yes' : 'No'}</span>
          </div>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>Draggable</span>
            <span style={styles.infoValue}>{element.draggable ? 'Yes' : 'No'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
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
  placeholderTitle: {
    fontFamily: 'var(--builder-font-body)',
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--builder-text-secondary)',
    marginBottom: 4,
  },
  placeholderText: {
    fontFamily: 'var(--builder-font-body)',
    fontSize: 12,
    color: 'var(--builder-text-muted)',
    lineHeight: 1.5,
    maxWidth: 220,
  },
  heading: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 12,
    borderBottom: '1px solid var(--builder-border-subtle)',
  },
  headingInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
  },
  headingText: {
    fontFamily: 'var(--builder-font-heading)',
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--builder-text-primary)',
  },
  headingSubtext: {
    fontFamily: 'var(--builder-font-body)',
    fontSize: 11,
    color: 'var(--builder-text-muted)',
  },
  emptyMessage: {
    fontFamily: 'var(--builder-font-body)',
    fontSize: 12,
    color: 'var(--builder-text-muted)',
    textAlign: 'center',
    padding: '16px 0',
    lineHeight: 1.5,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  sectionHeader: {
    fontFamily: 'var(--builder-font-body)',
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--builder-text-muted)',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    padding: '4px 0',
  },
  editorList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 6,
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    padding: '6px 8px',
    background: 'var(--builder-bg-tertiary)',
    borderRadius: 'var(--builder-radius-sm)',
  },
  infoLabel: {
    fontFamily: 'var(--builder-font-body)',
    fontSize: 10,
    color: 'var(--builder-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  infoValue: {
    fontFamily: 'var(--builder-font-code)',
    fontSize: 12,
    color: 'var(--builder-text-primary)',
  },
};

export default memo(ContentTab);
