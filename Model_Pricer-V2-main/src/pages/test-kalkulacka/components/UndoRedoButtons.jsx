import React, { useState, useRef, useCallback } from 'react';
import Icon from '../../../components/AppIcon';

/**
 * UndoRedoButtons — small icon buttons for undo/redo with tooltips.
 *
 * Props:
 * - canUndo {boolean}
 * - canRedo {boolean}
 * - onUndo {() => void}
 * - onRedo {() => void}
 * - undoTooltip {string|null} — e.g. "Zpet: Material -> PLA"
 * - redoTooltip {string|null} — e.g. "Vpred: Kvalita -> Standardni"
 */
const UndoRedoButtons = ({
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  undoTooltip,
  redoTooltip,
}) => {
  return (
    <div style={styles.container}>
      <UndoRedoBtn
        onClick={onUndo}
        disabled={!canUndo}
        tooltip={undoTooltip || 'Zpět'}
        ariaLabel="Zpět (Ctrl+Z)"
        icon="RotateCcw"
      />
      <UndoRedoBtn
        onClick={onRedo}
        disabled={!canRedo}
        tooltip={redoTooltip || 'Vpřed'}
        ariaLabel="Vpřed (Ctrl+Y)"
        icon="RotateCw"
      />
    </div>
  );
};

/**
 * Individual button with custom hover tooltip (not native title=, for better
 * styling and instant display).
 */
const UndoRedoBtn = ({ onClick, disabled, tooltip, ariaLabel, icon }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const timerRef = useRef(null);

  const handleMouseEnter = useCallback(() => {
    timerRef.current = setTimeout(() => setShowTooltip(true), 300);
  }, []);

  const handleMouseLeave = useCallback(() => {
    clearTimeout(timerRef.current);
    setShowTooltip(false);
  }, []);

  return (
    <div style={styles.btnWrapper}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
        style={{
          ...styles.btn,
          ...(disabled ? styles.btnDisabled : styles.btnEnabled),
        }}
      >
        <Icon name={icon} size={14} />
      </button>
      {showTooltip && !disabled && tooltip && (
        <div style={styles.tooltip} role="tooltip">
          {tooltip}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
  },
  btnWrapper: {
    position: 'relative',
    display: 'inline-flex',
  },
  btn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    padding: 0,
    border: '1px solid var(--forge-border-default, #2A2F3A)',
    borderRadius: 'var(--forge-radius-md, 6px)',
    background: 'var(--forge-bg-surface, #1A1F2E)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    color: 'var(--forge-text-secondary, #9CA3AF)',
  },
  btnEnabled: {
    opacity: 1,
    cursor: 'pointer',
  },
  btnDisabled: {
    opacity: 0.35,
    cursor: 'not-allowed',
    pointerEvents: 'none',
  },
  tooltip: {
    position: 'absolute',
    top: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    marginTop: '6px',
    padding: '4px 8px',
    fontSize: '11px',
    fontFamily: 'var(--forge-font-body, sans-serif)',
    color: 'var(--forge-text-primary, #F1F5F9)',
    background: 'var(--forge-bg-elevated, #252A3A)',
    border: '1px solid var(--forge-border-default, #2A2F3A)',
    borderRadius: 'var(--forge-radius-sm, 4px)',
    whiteSpace: 'nowrap',
    zIndex: 50,
    pointerEvents: 'none',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
  },
};

export default UndoRedoButtons;
