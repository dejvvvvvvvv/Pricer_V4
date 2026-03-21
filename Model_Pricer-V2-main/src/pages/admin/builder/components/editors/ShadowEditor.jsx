/**
 * ShadowEditor -- box-shadow and text-shadow editor.
 *
 * Features:
 *   - X offset, Y offset, blur, spread inputs
 *   - Color picker for shadow
 *   - Inset toggle
 *   - Multiple shadows support (add/remove)
 *   - Live preview
 *   - Reset to default
 */
import React, { useState, useCallback, memo } from 'react';
import { Plus, Trash2, RotateCcw } from 'lucide-react';
import ColorPropertyEditor from './ColorPropertyEditor';

const DEFAULT_SHADOW = {
  x: 0,
  y: 4,
  blur: 12,
  spread: 0,
  color: 'rgba(0,0,0,0.15)',
  inset: false,
};

function shadowToString(shadow) {
  const { x, y, blur, spread, color, inset } = shadow;
  const parts = [];
  if (inset) parts.push('inset');
  parts.push(`${x}px`, `${y}px`, `${blur}px`, `${spread}px`, color);
  return parts.join(' ');
}

function shadowsToString(shadows) {
  if (!shadows || shadows.length === 0) return 'none';
  return shadows.map(shadowToString).join(', ');
}

function ShadowEditor({
  label,
  labelCs,
  value = [],
  onChange,
  defaultValue,
  isTextShadow = false,
}) {
  const displayLabel = labelCs || label || (isTextShadow ? 'Text Shadow' : 'Box Shadow');
  const shadows = Array.isArray(value) ? value : [];

  const handleUpdate = useCallback((index, field, val) => {
    const next = [...shadows];
    next[index] = { ...next[index], [field]: val };
    onChange(next);
  }, [shadows, onChange]);

  const handleAdd = useCallback(() => {
    onChange([...shadows, { ...DEFAULT_SHADOW }]);
  }, [shadows, onChange]);

  const handleRemove = useCallback((index) => {
    const next = shadows.filter((_, i) => i !== index);
    onChange(next);
  }, [shadows, onChange]);

  const handleReset = useCallback(() => {
    onChange(defaultValue || []);
  }, [defaultValue, onChange]);

  const previewShadow = shadowsToString(shadows);

  return (
    <div style={styles.wrapper}>
      <div style={styles.headerRow}>
        <span style={styles.sectionLabel}>{displayLabel}</span>
        <div style={styles.headerActions}>
          <button
            type="button"
            onClick={handleAdd}
            style={styles.addBtn}
            title="Add shadow"
            aria-label="Add shadow"
          >
            <Plus size={12} />
          </button>
          <button
            type="button"
            onClick={handleReset}
            style={styles.resetBtn}
            title="Reset shadows"
            aria-label="Reset shadows"
          >
            <RotateCcw size={11} />
          </button>
        </div>
      </div>

      {/* Shadow entries */}
      {shadows.length === 0 && (
        <span style={styles.emptyText}>No shadows. Click + to add.</span>
      )}

      {shadows.map((shadow, index) => (
        <div key={index} style={styles.shadowEntry}>
          <div style={styles.entryHeader}>
            <span style={styles.entryLabel}>Shadow {index + 1}</span>
            <button
              type="button"
              onClick={() => handleRemove(index)}
              style={styles.removeBtn}
              title="Remove shadow"
              aria-label="Remove shadow"
            >
              <Trash2 size={11} />
            </button>
          </div>

          {/* Offset row */}
          <div style={styles.row}>
            <div style={styles.fieldSmall}>
              <span style={styles.miniLabel}>X</span>
              <input
                type="number"
                value={shadow.x || 0}
                onChange={(e) => handleUpdate(index, 'x', parseInt(e.target.value, 10) || 0)}
                style={styles.numberInput}
                aria-label="X offset"
              />
            </div>
            <div style={styles.fieldSmall}>
              <span style={styles.miniLabel}>Y</span>
              <input
                type="number"
                value={shadow.y || 0}
                onChange={(e) => handleUpdate(index, 'y', parseInt(e.target.value, 10) || 0)}
                style={styles.numberInput}
                aria-label="Y offset"
              />
            </div>
            <div style={styles.fieldSmall}>
              <span style={styles.miniLabel}>Blur</span>
              <input
                type="number"
                min={0}
                value={shadow.blur || 0}
                onChange={(e) => handleUpdate(index, 'blur', Math.max(0, parseInt(e.target.value, 10) || 0))}
                style={styles.numberInput}
                aria-label="Blur"
              />
            </div>
            {!isTextShadow && (
              <div style={styles.fieldSmall}>
                <span style={styles.miniLabel}>Spread</span>
                <input
                  type="number"
                  value={shadow.spread || 0}
                  onChange={(e) => handleUpdate(index, 'spread', parseInt(e.target.value, 10) || 0)}
                  style={styles.numberInput}
                  aria-label="Spread"
                />
              </div>
            )}
          </div>

          {/* Color + inset row */}
          <div style={styles.row}>
            <div style={{ flex: 1 }}>
              <ColorPropertyEditor
                label="Color"
                value={shadow.color || '#000000'}
                onChange={(c) => handleUpdate(index, 'color', c)}
              />
            </div>
            {!isTextShadow && (
              <button
                type="button"
                onClick={() => handleUpdate(index, 'inset', !shadow.inset)}
                style={{
                  ...styles.insetBtn,
                  background: shadow.inset ? 'var(--builder-accent-primary)' : 'var(--builder-bg-elevated)',
                  color: shadow.inset ? '#FFFFFF' : 'var(--builder-text-secondary)',
                }}
                aria-label="Inset toggle"
                aria-pressed={shadow.inset}
              >
                Inset
              </button>
            )}
          </div>
        </div>
      ))}

      {/* Preview */}
      {shadows.length > 0 && (
        <div style={styles.previewRow}>
          <div
            style={{
              ...styles.previewBox,
              boxShadow: isTextShadow ? 'none' : previewShadow,
            }}
          >
            {isTextShadow && (
              <span style={{
                ...styles.previewText,
                textShadow: previewShadow,
              }}>
                Aa
              </span>
            )}
          </div>
          <span style={styles.previewLabel}>Preview</span>
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    fontFamily: 'var(--builder-font-body)',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--builder-text-secondary)',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
    height: 20,
    background: 'var(--builder-bg-elevated)',
    border: '1px solid var(--builder-border-default)',
    borderRadius: 3,
    cursor: 'pointer',
    color: 'var(--builder-accent-primary)',
    padding: 0,
  },
  resetBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 18,
    height: 18,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--builder-text-muted)',
    borderRadius: 3,
    padding: 0,
    opacity: 0.6,
  },
  emptyText: {
    fontFamily: 'var(--builder-font-body)',
    fontSize: 11,
    color: 'var(--builder-text-muted)',
    fontStyle: 'italic',
  },
  shadowEntry: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    padding: 8,
    background: 'var(--builder-bg-tertiary)',
    borderRadius: 'var(--builder-radius-sm)',
    border: '1px solid var(--builder-border-subtle)',
  },
  entryHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  entryLabel: {
    fontFamily: 'var(--builder-font-code)',
    fontSize: 10,
    color: 'var(--builder-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  removeBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 18,
    height: 18,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--builder-accent-error)',
    padding: 0,
  },
  row: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 6,
  },
  fieldSmall: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    flex: 1,
  },
  miniLabel: {
    fontFamily: 'var(--builder-font-code)',
    fontSize: 9,
    color: 'var(--builder-text-muted)',
    textTransform: 'uppercase',
  },
  numberInput: {
    width: '100%',
    fontFamily: 'var(--builder-font-code)',
    fontSize: 11,
    color: 'var(--builder-text-primary)',
    background: 'var(--builder-bg-elevated)',
    border: '1px solid var(--builder-border-default)',
    borderRadius: 3,
    padding: '3px 4px',
    textAlign: 'center',
    outline: 'none',
    boxSizing: 'border-box',
  },
  insetBtn: {
    fontFamily: 'var(--builder-font-body)',
    fontSize: 10,
    fontWeight: 500,
    border: '1px solid var(--builder-border-default)',
    borderRadius: 'var(--builder-radius-sm)',
    padding: '4px 8px',
    cursor: 'pointer',
    outline: 'none',
    transition: 'all var(--builder-transition-fast)',
    flexShrink: 0,
    alignSelf: 'flex-end',
  },
  previewRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    paddingTop: 4,
  },
  previewBox: {
    width: 48,
    height: 32,
    background: 'var(--builder-bg-elevated)',
    borderRadius: 'var(--builder-radius-sm)',
    border: '1px solid var(--builder-border-default)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'box-shadow var(--builder-transition-fast)',
  },
  previewText: {
    fontFamily: 'var(--builder-font-heading)',
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--builder-text-primary)',
  },
  previewLabel: {
    fontFamily: 'var(--builder-font-code)',
    fontSize: 10,
    color: 'var(--builder-text-muted)',
  },
};

export default memo(ShadowEditor);
