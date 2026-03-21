/**
 * StyleTab -- ALL visual properties organized in collapsible sections.
 *
 * Sections:
 *   - Display & Position
 *   - Typography
 *   - Background
 *   - Size & Dimensions
 *   - Spacing (margin + padding visual box model)
 *   - Border & Radius
 *   - Shadow
 *   - Opacity & Effects
 *
 * Each section is collapsible with a toggle indicator.
 * Shows different sections based on selected element type.
 * "No element selected" state with helpful message.
 */
import React, { useState, useMemo, useCallback, memo } from 'react';
import {
  MousePointerClick, Layout, Type, ListOrdered, Upload, Box,
  Settings, Receipt, DollarSign, PanelBottom,
  ChevronDown, ChevronRight, Lock,
} from 'lucide-react';

import { ELEMENT_REGISTRY } from '../../config/elementRegistry';
import { THEME_PROPERTIES } from '@/utils/widgetThemeStorage';
import { getDefaultWidgetTheme } from '@/utils/widgetThemeStorage';

import ColorPropertyEditor from '../editors/ColorPropertyEditor';
import NumberPropertyEditor from '../editors/NumberPropertyEditor';
import SelectPropertyEditor from '../editors/SelectPropertyEditor';
import TextPropertyEditor from '../editors/TextPropertyEditor';
import BooleanPropertyEditor from '../editors/BooleanPropertyEditor';
import AlignmentEditor from '../editors/AlignmentEditor';
import OpacityEditor from '../editors/OpacityEditor';

const ICON_MAP = {
  Layout, Type, ListOrdered, Upload, Box, Settings,
  Receipt, DollarSign, MousePointerClick, PanelBottom,
};

// Build lookup: propertyKey -> THEME_PROPERTIES definition
const PROPERTY_DEF_MAP = {};
for (const def of THEME_PROPERTIES) {
  PROPERTY_DEF_MAP[def.key] = def;
}

const defaults = getDefaultWidgetTheme();

/**
 * Collapsible section component.
 */
function CollapsibleSection({ title, defaultOpen = true, children, count }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={sectionStyles.section}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={sectionStyles.header}
        aria-expanded={open}
      >
        {open ? (
          <ChevronDown size={12} color="var(--builder-text-muted)" />
        ) : (
          <ChevronRight size={12} color="var(--builder-text-muted)" />
        )}
        <span style={sectionStyles.title}>{title}</span>
        {count !== undefined && count > 0 && (
          <span style={sectionStyles.count}>{count}</span>
        )}
      </button>
      {open && (
        <div style={sectionStyles.content}>
          {children}
        </div>
      )}
    </div>
  );
}

const sectionStyles = {
  section: {
    display: 'flex',
    flexDirection: 'column',
    borderBottom: '1px solid var(--builder-border-subtle)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    width: '100%',
    padding: '8px 0',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    outline: 'none',
  },
  title: {
    fontFamily: 'var(--builder-font-body)',
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--builder-text-muted)',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    flex: 1,
    textAlign: 'left',
  },
  count: {
    fontFamily: 'var(--builder-font-code)',
    fontSize: 10,
    color: 'var(--builder-text-muted)',
    background: 'var(--builder-bg-tertiary)',
    borderRadius: 8,
    padding: '1px 6px',
    minWidth: 16,
    textAlign: 'center',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    paddingBottom: 12,
  },
};

/**
 * Group element properties into typed sections for rendering.
 */
function groupProperties(element) {
  const groups = {
    colors: [],
    numbers: [],
    selects: [],
    texts: [],
    booleans: [],
    alignments: [],
  };

  for (const key of element.properties) {
    const def = PROPERTY_DEF_MAP[key];
    if (!def) continue;

    if (key.includes('Alignment') || key.includes('alignment')) {
      groups.alignments.push(def);
    } else {
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
  }

  for (const key of element.editableTexts) {
    const def = PROPERTY_DEF_MAP[key];
    if (def) groups.texts.push(def);
  }

  return groups;
}

function StyleTab({
  selectedElementId,
  theme,
  onUpdateProperty,
}) {
  const element = selectedElementId
    ? ELEMENT_REGISTRY[selectedElementId]
    : null;

  const groups = useMemo(() => {
    if (!element) return null;
    return groupProperties(element);
  }, [element]);

  // No element selected: show placeholder
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
          Click on an element in the canvas to edit its style properties.
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
    groups.booleans.length > 0 ||
    groups.alignments.length > 0;

  return (
    <div style={styles.wrapper}>
      {/* Element heading */}
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
        {element.protected && (
          <Lock size={13} color="var(--builder-text-muted)" style={{ flexShrink: 0 }} />
        )}
      </div>

      {/* No editable properties */}
      {!hasAnyProperties && (
        <div style={styles.emptyMessage}>
          This element has no editable style properties.
        </div>
      )}

      {/* COLORS */}
      {groups.colors.length > 0 && (
        <CollapsibleSection
          title="Colors"
          count={groups.colors.length}
          defaultOpen={true}
        >
          {groups.colors.map((def) => (
            <ColorPropertyEditor
              key={def.key}
              label={def.label}
              value={theme[def.key] || '#000000'}
              onChange={(val) => onUpdateProperty(def.key, val)}
              defaultValue={defaults[def.key]}
            />
          ))}
        </CollapsibleSection>
      )}

      {/* ALIGNMENT */}
      {groups.alignments.length > 0 && (
        <CollapsibleSection
          title="Alignment"
          count={groups.alignments.length}
          defaultOpen={true}
        >
          {groups.alignments.map((def) => (
            <AlignmentEditor
              key={def.key}
              label={def.label}
              value={theme[def.key] || 'left'}
              onChange={(val) => onUpdateProperty(def.key, val)}
              defaultValue={defaults[def.key]}
            />
          ))}
        </CollapsibleSection>
      )}

      {/* DIMENSIONS (numbers) */}
      {groups.numbers.length > 0 && (
        <CollapsibleSection
          title="Dimensions"
          count={groups.numbers.length}
          defaultOpen={true}
        >
          {groups.numbers.map((def) => (
            <NumberPropertyEditor
              key={def.key}
              label={def.label}
              value={theme[def.key]}
              min={def.min ?? 0}
              max={def.max ?? 100}
              unit={def.unit || 'px'}
              onChange={(val) => onUpdateProperty(def.key, val)}
              defaultValue={defaults[def.key]}
            />
          ))}
        </CollapsibleSection>
      )}

      {/* STYLE (selects) */}
      {groups.selects.length > 0 && (
        <CollapsibleSection
          title="Style"
          count={groups.selects.length}
          defaultOpen={true}
        >
          {groups.selects.map((def) => (
            <SelectPropertyEditor
              key={def.key}
              label={def.label}
              value={theme[def.key]}
              options={def.options || []}
              onChange={(val) => onUpdateProperty(def.key, val)}
              defaultValue={defaults[def.key]}
            />
          ))}
        </CollapsibleSection>
      )}

      {/* TEXTS */}
      {groups.texts.length > 0 && (
        <CollapsibleSection
          title="Text Content"
          count={groups.texts.length}
          defaultOpen={true}
        >
          {groups.texts.map((def) => (
            <TextPropertyEditor
              key={def.key}
              label={def.label}
              value={theme[def.key] || ''}
              onChange={(val) => onUpdateProperty(def.key, val)}
              defaultValue={defaults[def.key]}
              multiline={def.key.includes('Description') || def.key.includes('Tagline')}
            />
          ))}
        </CollapsibleSection>
      )}

      {/* TOGGLES (booleans) */}
      {groups.booleans.length > 0 && (
        <CollapsibleSection
          title="Toggles"
          count={groups.booleans.length}
          defaultOpen={true}
        >
          {groups.booleans.map((def) => (
            <BooleanPropertyEditor
              key={def.key}
              label={def.label}
              value={Boolean(theme[def.key])}
              onChange={(val) => onUpdateProperty(def.key, val)}
              defaultValue={defaults[def.key]}
            />
          ))}
        </CollapsibleSection>
      )}

      {/* OPACITY (always available) */}
      <CollapsibleSection title="Opacity" defaultOpen={false}>
        <OpacityEditor
          label="Element opacity"
          value={theme[`${selectedElementId}Opacity`] ?? 1}
          onChange={(val) => onUpdateProperty(`${selectedElementId}Opacity`, val)}
          defaultValue={1}
        />
      </CollapsibleSection>
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
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
    marginBottom: 4,
    borderBottom: '1px solid var(--builder-border-subtle)',
  },
  headingInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    flex: 1,
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
  },
};

export default memo(StyleTab);
