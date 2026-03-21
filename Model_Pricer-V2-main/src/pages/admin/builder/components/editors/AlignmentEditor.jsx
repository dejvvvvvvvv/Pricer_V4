/**
 * AlignmentEditor -- text alignment toggle group.
 *
 * Features:
 *   - 4 buttons: left, center, right, justify
 *   - Toggle group style (active button highlighted)
 *   - Accessible with aria-pressed
 *   - Reset to default
 */
import React, { useCallback, memo } from 'react';
import { AlignLeft, AlignCenter, AlignRight, AlignJustify, RotateCcw } from 'lucide-react';

const ALIGNMENTS = [
  { value: 'left', icon: AlignLeft, label: 'Left' },
  { value: 'center', icon: AlignCenter, label: 'Center' },
  { value: 'right', icon: AlignRight, label: 'Right' },
  { value: 'justify', icon: AlignJustify, label: 'Justify' },
];

function AlignmentEditor({
  label,
  labelCs,
  value = 'left',
  onChange,
  defaultValue,
}) {
  const displayLabel = labelCs || label || 'Text Align';

  const handleReset = useCallback(() => {
    onChange(defaultValue || 'left');
  }, [defaultValue, onChange]);

  return (
    <div style={styles.wrapper}>
      <div style={styles.labelRow}>
        <span style={styles.label}>{displayLabel}</span>
        {defaultValue !== undefined && (
          <button
            type="button"
            onClick={handleReset}
            style={styles.resetBtn}
            title="Reset alignment"
            aria-label="Reset alignment"
          >
            <RotateCcw size={11} />
          </button>
        )}
      </div>

      <div style={styles.buttonGroup} role="group" aria-label="Text alignment">
        {ALIGNMENTS.map((a) => {
          const Icon = a.icon;
          const isActive = value === a.value;
          return (
            <button
              key={a.value}
              type="button"
              onClick={() => onChange(a.value)}
              style={{
                ...styles.alignBtn,
                ...(isActive ? styles.alignBtnActive : {}),
              }}
              aria-pressed={isActive}
              aria-label={`Align ${a.label}`}
              title={a.label}
            >
              <Icon size={14} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  labelRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  label: {
    fontFamily: 'var(--builder-font-body)',
    fontSize: 12,
    color: 'var(--builder-text-secondary)',
    lineHeight: 1.3,
  },
  resetBtn: {
    display: 'inline-flex',
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
  buttonGroup: {
    display: 'flex',
    gap: 0,
    borderRadius: 'var(--builder-radius-sm)',
    overflow: 'hidden',
    border: '1px solid var(--builder-border-default)',
  },
  alignBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px 0',
    background: 'var(--builder-bg-elevated)',
    border: 'none',
    borderRight: '1px solid var(--builder-border-default)',
    cursor: 'pointer',
    color: 'var(--builder-text-muted)',
    transition: 'all var(--builder-transition-fast)',
  },
  alignBtnActive: {
    background: 'var(--builder-accent-primary)',
    color: '#FFFFFF',
  },
};

export default memo(AlignmentEditor);
