/**
 * StyleTab -- property editors for the currently selected widget element.
 *
 * Groups properties from the element's definition into sections:
 *   BARVY (colors), ROZMERY (dimensions), STYL (selects),
 *   TEXTY (editable texts), PREPINACE (booleans).
 *
 * When no element is selected, shows a placeholder prompt.
 */
import React, { useMemo } from 'react';
import {
  MousePointerClick,
  Layout,
  Type,
  ListOrdered,
  Upload,
  Box,
  Settings,
  Receipt,
  DollarSign,
  PanelBottom,
} from 'lucide-react';

import { ELEMENT_REGISTRY } from '../../config/elementRegistry';
import { THEME_PROPERTIES } from '@/utils/widgetThemeStorage';

import ColorPropertyEditor from '../editors/ColorPropertyEditor';
import NumberPropertyEditor from '../editors/NumberPropertyEditor';
import SelectPropertyEditor from '../editors/SelectPropertyEditor';
import TextPropertyEditor from '../editors/TextPropertyEditor';
import BooleanPropertyEditor from '../editors/BooleanPropertyEditor';

// Map icon names to components (same as ElementsTab)
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

// Build a lookup map: propertyKey -> THEME_PROPERTIES definition
const PROPERTY_DEF_MAP = {};
for (const def of THEME_PROPERTIES) {
  PROPERTY_DEF_MAP[def.key] = def;
}

/**
 * Group element properties into typed sections for rendering.
 */
function groupProperties(element) {
  const groups = {
    colors: [],    // BARVY
    numbers: [],   // ROZMERY
    selects: [],   // STYL
    texts: [],     // TEXTY
    booleans: [],  // PREPINACE
  };

  // Style/dimension/color properties from element.properties
  for (const key of element.properties) {
    const def = PROPERTY_DEF_MAP[key];
    if (!def) continue;

    switch (def.type) {
      case 'color':
        groups.colors.push(def);
        break;
      case 'number':
        groups.numbers.push(def);
        break;
      case 'select':
        groups.selects.push(def);
        break;
      case 'boolean':
        groups.booleans.push(def);
        break;
      default:
        break;
    }
  }

  // Editable text properties from element.editableTexts
  for (const key of element.editableTexts) {
    const def = PROPERTY_DEF_MAP[key];
    if (def) {
      groups.texts.push(def);
    }
  }

  return groups;
}

/** Section header component (uppercase, muted, small) */
function SectionHeader({ title }) {
  return <div style={styles.sectionHeader}>{title}</div>;
}

export default function StyleTab({
  selectedElementId,
  theme,
  onUpdateProperty,
}) {
  // Resolve the element definition
  const element = selectedElementId
    ? ELEMENT_REGISTRY[selectedElementId]
    : null;

  // Group properties into sections (memoized for performance)
  const groups = useMemo(() => {
    if (!element) return null;
    return groupProperties(element);
  }, [element]);

  // --- No element selected: show placeholder ---
  if (!element) {
    return (
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
  }

  const IconComponent = ICON_MAP[element.icon] || Box;
  const hasAnyProperties =
    groups.colors.length > 0 ||
    groups.numbers.length > 0 ||
    groups.selects.length > 0 ||
    groups.texts.length > 0 ||
    groups.booleans.length > 0;

  return (
    <div style={styles.wrapper}>
      {/* Element heading */}
      <div style={styles.heading}>
        <IconComponent
          size={18}
          color="var(--builder-accent-primary)"
          style={{ flexShrink: 0 }}
        />
        <span style={styles.headingText}>{element.label.cs}</span>
      </div>

      {/* No editable properties message */}
      {!hasAnyProperties && (
        <div style={styles.emptyMessage}>
          Tento element nema editovatelne vlastnosti.
        </div>
      )}

      {/* BARVY (colors) */}
      {groups.colors.length > 0 && (
        <div style={styles.section}>
          <SectionHeader title="BARVY" />
          <div style={styles.editorList}>
            {groups.colors.map((def) => (
              <ColorPropertyEditor
                key={def.key}
                label={def.label}
                value={theme[def.key] || '#000000'}
                onChange={(val) => onUpdateProperty(def.key, val)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ROZMERY (numbers / dimensions) */}
      {groups.numbers.length > 0 && (
        <div style={styles.section}>
          <SectionHeader title="ROZMERY" />
          <div style={styles.editorList}>
            {groups.numbers.map((def) => (
              <NumberPropertyEditor
                key={def.key}
                label={def.label}
                value={theme[def.key]}
                min={def.min ?? 0}
                max={def.max ?? 100}
                unit={def.unit || 'px'}
                onChange={(val) => onUpdateProperty(def.key, val)}
              />
            ))}
          </div>
        </div>
      )}

      {/* STYL (selects) */}
      {groups.selects.length > 0 && (
        <div style={styles.section}>
          <SectionHeader title="STYL" />
          <div style={styles.editorList}>
            {groups.selects.map((def) => (
              <SelectPropertyEditor
                key={def.key}
                label={def.label}
                value={theme[def.key]}
                options={def.options || []}
                onChange={(val) => onUpdateProperty(def.key, val)}
              />
            ))}
          </div>
        </div>
      )}

      {/* TEXTY (editable texts) */}
      {groups.texts.length > 0 && (
        <div style={styles.section}>
          <SectionHeader title="TEXTY" />
          <div style={styles.editorList}>
            {groups.texts.map((def) => (
              <TextPropertyEditor
                key={def.key}
                label={def.label}
                value={theme[def.key] || ''}
                onChange={(val) => onUpdateProperty(def.key, val)}
              />
            ))}
          </div>
        </div>
      )}

      {/* PREPINACE (booleans) */}
      {groups.booleans.length > 0 && (
        <div style={styles.section}>
          <SectionHeader title="PREPINACE" />
          <div style={styles.editorList}>
            {groups.booleans.map((def) => (
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
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },

  /* Placeholder (no selection) */
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

  /* Element heading */
  heading: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 12,
    borderBottom: '1px solid var(--builder-border-subtle)',
  },
  headingText: {
    fontFamily: 'var(--builder-font-heading)',
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--builder-text-primary)',
  },

  /* Empty message */
  emptyMessage: {
    fontFamily: 'var(--builder-font-body)',
    fontSize: 12,
    color: 'var(--builder-text-muted)',
    textAlign: 'center',
    padding: '16px 0',
  },

  /* Section */
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
};
