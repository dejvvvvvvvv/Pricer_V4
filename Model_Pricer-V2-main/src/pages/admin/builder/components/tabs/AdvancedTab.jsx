/**
 * AdvancedTab -- advanced element properties.
 *
 * Features:
 *   - Custom CSS class input
 *   - Custom inline CSS textarea
 *   - Element ID display
 *   - Visibility conditions
 *   - Responsive overrides (different values per device)
 *   - Animation settings (optional)
 *
 * When no element is selected, shows placeholder.
 */
import React, { useState, useCallback, memo } from 'react';
import {
  MousePointerClick, Box, Code, Eye, Smartphone, Monitor, Tablet,
  ChevronDown, ChevronRight,
} from 'lucide-react';

import { ELEMENT_REGISTRY } from '../../config/elementRegistry';

/**
 * Collapsible section component (matches StyleTab pattern).
 */
function CollapsibleSection({ title, icon: Icon, defaultOpen = false, children }) {
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
        {Icon && <Icon size={13} color="var(--builder-text-muted)" />}
        <span style={sectionStyles.title}>{title}</span>
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
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    paddingBottom: 12,
  },
};

const ANIMATION_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'fadeIn', label: 'Fade In' },
  { value: 'slideUp', label: 'Slide Up' },
  { value: 'slideDown', label: 'Slide Down' },
  { value: 'slideLeft', label: 'Slide Left' },
  { value: 'slideRight', label: 'Slide Right' },
  { value: 'zoomIn', label: 'Zoom In' },
  { value: 'bounce', label: 'Bounce' },
];

const VISIBILITY_CONDITIONS = [
  { value: 'always', label: 'Always visible' },
  { value: 'desktop', label: 'Desktop only' },
  { value: 'tablet', label: 'Tablet only' },
  { value: 'mobile', label: 'Mobile only' },
  { value: 'not-mobile', label: 'Desktop + Tablet' },
  { value: 'not-desktop', label: 'Tablet + Mobile' },
];

function AdvancedTab({
  selectedElementId,
  theme,
  onUpdateProperty,
}) {
  const element = selectedElementId
    ? ELEMENT_REGISTRY[selectedElementId]
    : null;

  const advancedKey = (suffix) => `${selectedElementId}_${suffix}`;

  const handleAdvancedChange = useCallback((suffix, value) => {
    onUpdateProperty(advancedKey(suffix), value);
  }, [selectedElementId, onUpdateProperty]);

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
          Click on an element in the canvas to configure advanced properties.
        </span>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      {/* Element ID */}
      <div style={styles.heading}>
        <Box size={16} color="var(--builder-accent-primary)" style={{ flexShrink: 0 }} />
        <span style={styles.headingText}>{element.label.cs}</span>
        <span style={styles.idBadge}>{element.id}</span>
      </div>

      {/* Custom CSS Class */}
      <CollapsibleSection title="CSS Class" icon={Code} defaultOpen={true}>
        <div style={styles.field}>
          <span style={styles.label}>Custom class name</span>
          <input
            type="text"
            value={theme[advancedKey('cssClass')] || ''}
            onChange={(e) => handleAdvancedChange('cssClass', e.target.value)}
            placeholder="e.g. my-custom-element"
            style={styles.textInput}
            spellCheck={false}
            aria-label="CSS class"
          />
          <span style={styles.hint}>
            Add custom CSS classes for external styling.
          </span>
        </div>
      </CollapsibleSection>

      {/* Custom Inline CSS */}
      <CollapsibleSection title="Custom CSS" icon={Code} defaultOpen={false}>
        <div style={styles.field}>
          <span style={styles.label}>Inline CSS overrides</span>
          <textarea
            value={theme[advancedKey('customCss')] || ''}
            onChange={(e) => handleAdvancedChange('customCss', e.target.value)}
            placeholder={'padding: 12px;\nmargin-top: 8px;\nborder: 1px solid #ccc;'}
            style={styles.textarea}
            spellCheck={false}
            rows={4}
            aria-label="Custom inline CSS"
          />
          <span style={styles.hint}>
            CSS properties applied directly to the element. One property per line.
          </span>
        </div>
      </CollapsibleSection>

      {/* Visibility Conditions */}
      <CollapsibleSection title="Visibility" icon={Eye} defaultOpen={false}>
        <div style={styles.field}>
          <span style={styles.label}>Show condition</span>
          <select
            value={theme[advancedKey('visibility')] || 'always'}
            onChange={(e) => handleAdvancedChange('visibility', e.target.value)}
            style={styles.select}
            aria-label="Visibility condition"
          >
            {VISIBILITY_CONDITIONS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <span style={styles.hint}>
            Control when this element is visible based on device type.
          </span>
        </div>
      </CollapsibleSection>

      {/* Responsive Overrides */}
      <CollapsibleSection title="Responsive" defaultOpen={false}>
        <div style={styles.responsiveGrid}>
          {/* Desktop */}
          <div style={styles.responsiveDevice}>
            <div style={styles.deviceHeader}>
              <Monitor size={13} color="var(--builder-text-muted)" />
              <span style={styles.deviceLabel}>Desktop</span>
            </div>
            <input
              type="text"
              value={theme[advancedKey('desktopOverride')] || ''}
              onChange={(e) => handleAdvancedChange('desktopOverride', e.target.value)}
              placeholder="CSS overrides..."
              style={styles.smallTextInput}
              aria-label="Desktop CSS override"
            />
          </div>

          {/* Tablet */}
          <div style={styles.responsiveDevice}>
            <div style={styles.deviceHeader}>
              <Tablet size={13} color="var(--builder-text-muted)" />
              <span style={styles.deviceLabel}>Tablet</span>
            </div>
            <input
              type="text"
              value={theme[advancedKey('tabletOverride')] || ''}
              onChange={(e) => handleAdvancedChange('tabletOverride', e.target.value)}
              placeholder="CSS overrides..."
              style={styles.smallTextInput}
              aria-label="Tablet CSS override"
            />
          </div>

          {/* Mobile */}
          <div style={styles.responsiveDevice}>
            <div style={styles.deviceHeader}>
              <Smartphone size={13} color="var(--builder-text-muted)" />
              <span style={styles.deviceLabel}>Mobile</span>
            </div>
            <input
              type="text"
              value={theme[advancedKey('mobileOverride')] || ''}
              onChange={(e) => handleAdvancedChange('mobileOverride', e.target.value)}
              placeholder="CSS overrides..."
              style={styles.smallTextInput}
              aria-label="Mobile CSS override"
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* Animation */}
      <CollapsibleSection title="Animation" defaultOpen={false}>
        <div style={styles.field}>
          <span style={styles.label}>Entry animation</span>
          <select
            value={theme[advancedKey('animation')] || 'none'}
            onChange={(e) => handleAdvancedChange('animation', e.target.value)}
            style={styles.select}
            aria-label="Animation"
          >
            {ANIMATION_OPTIONS.map((a) => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </div>

        <div style={styles.field}>
          <span style={styles.label}>Duration (ms)</span>
          <input
            type="number"
            min={0}
            max={3000}
            step={50}
            value={theme[advancedKey('animDuration')] || 300}
            onChange={(e) => handleAdvancedChange('animDuration', parseInt(e.target.value, 10) || 300)}
            style={styles.numberInput}
            aria-label="Animation duration"
          />
        </div>

        <div style={styles.field}>
          <span style={styles.label}>Delay (ms)</span>
          <input
            type="number"
            min={0}
            max={5000}
            step={50}
            value={theme[advancedKey('animDelay')] || 0}
            onChange={(e) => handleAdvancedChange('animDelay', parseInt(e.target.value, 10) || 0)}
            style={styles.numberInput}
            aria-label="Animation delay"
          />
        </div>
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
  headingText: {
    fontFamily: 'var(--builder-font-heading)',
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--builder-text-primary)',
    flex: 1,
  },
  idBadge: {
    fontFamily: 'var(--builder-font-code)',
    fontSize: 10,
    color: 'var(--builder-text-muted)',
    background: 'var(--builder-bg-tertiary)',
    border: '1px solid var(--builder-border-default)',
    borderRadius: 'var(--builder-radius-sm)',
    padding: '2px 6px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  label: {
    fontFamily: 'var(--builder-font-body)',
    fontSize: 12,
    color: 'var(--builder-text-secondary)',
    lineHeight: 1.3,
  },
  hint: {
    fontFamily: 'var(--builder-font-body)',
    fontSize: 10,
    color: 'var(--builder-text-muted)',
    lineHeight: 1.4,
    fontStyle: 'italic',
  },
  textInput: {
    width: '100%',
    fontFamily: 'var(--builder-font-code)',
    fontSize: 12,
    color: 'var(--builder-text-primary)',
    background: 'var(--builder-bg-elevated)',
    border: '1px solid var(--builder-border-default)',
    borderRadius: 'var(--builder-radius-sm)',
    padding: '6px 8px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    fontFamily: 'var(--builder-font-code)',
    fontSize: 11,
    color: 'var(--builder-text-primary)',
    background: 'var(--builder-bg-elevated)',
    border: '1px solid var(--builder-border-default)',
    borderRadius: 'var(--builder-radius-sm)',
    padding: '6px 8px',
    outline: 'none',
    boxSizing: 'border-box',
    resize: 'vertical',
    minHeight: 64,
    lineHeight: 1.5,
  },
  select: {
    width: '100%',
    fontFamily: 'var(--builder-font-body)',
    fontSize: 12,
    color: 'var(--builder-text-primary)',
    background: 'var(--builder-bg-elevated)',
    border: '1px solid var(--builder-border-default)',
    borderRadius: 'var(--builder-radius-sm)',
    padding: '5px 8px',
    outline: 'none',
    cursor: 'pointer',
    appearance: 'auto',
  },
  numberInput: {
    width: 80,
    fontFamily: 'var(--builder-font-code)',
    fontSize: 12,
    color: 'var(--builder-text-primary)',
    background: 'var(--builder-bg-elevated)',
    border: '1px solid var(--builder-border-default)',
    borderRadius: 'var(--builder-radius-sm)',
    padding: '4px 8px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  responsiveGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  responsiveDevice: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: 8,
    background: 'var(--builder-bg-tertiary)',
    borderRadius: 'var(--builder-radius-sm)',
    border: '1px solid var(--builder-border-subtle)',
  },
  deviceHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  deviceLabel: {
    fontFamily: 'var(--builder-font-body)',
    fontSize: 11,
    fontWeight: 500,
    color: 'var(--builder-text-secondary)',
  },
  smallTextInput: {
    width: '100%',
    fontFamily: 'var(--builder-font-code)',
    fontSize: 11,
    color: 'var(--builder-text-primary)',
    background: 'var(--builder-bg-elevated)',
    border: '1px solid var(--builder-border-default)',
    borderRadius: 3,
    padding: '4px 6px',
    outline: 'none',
    boxSizing: 'border-box',
  },
};

export default memo(AdvancedTab);
