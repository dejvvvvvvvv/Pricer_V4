/**
 * BuilderTopBar - Top navigation bar for the Widget Builder V3.
 *
 * Three sections: left (back + editable name), center (device switcher),
 * right (undo/redo + reset + save).
 *
 * Pure presentational component - all state managed externally via props.
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Smartphone,
  Tablet,
  Monitor,
  Undo2,
  Redo2,
  Upload,
  Settings,
  DollarSign,
  ExternalLink,
} from 'lucide-react';

import '../styles/builder-tokens.css';

const DEVICE_MODES = [
  { id: 'mobile', icon: Smartphone, label: 'Mobile' },
  { id: 'tablet', icon: Tablet, label: 'Tablet' },
  { id: 'desktop', icon: Monitor, label: 'Desktop' },
];

const PREVIEW_STEPS = [
  { id: 1, icon: Upload, label: 'Upload' },
  { id: 2, icon: Settings, label: 'Konfigurace' },
  { id: 3, icon: DollarSign, label: 'Souhrn' },
];

const BuilderTopBar = ({
  widgetName,
  onWidgetNameChange,
  onBack,
  deviceMode,
  onDeviceModeChange,
  previewStep,
  onPreviewStepChange,
  publicWidgetId,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onReset,
  onSave,
  isDirty,
  saving,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(widgetName || '');
  const nameInputRef = useRef(null);

  // Sync draft when external widgetName changes while not editing
  useEffect(() => {
    if (!isEditingName) {
      setNameDraft(widgetName || '');
    }
  }, [widgetName, isEditingName]);

  // Focus the input when entering edit mode
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  const commitName = () => {
    const trimmed = nameDraft.trim();
    if (trimmed && trimmed !== widgetName) {
      onWidgetNameChange(trimmed);
    } else {
      setNameDraft(widgetName || '');
    }
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e) => {
    if (e.key === 'Enter') {
      commitName();
    } else if (e.key === 'Escape') {
      setNameDraft(widgetName || '');
      setIsEditingName(false);
    }
  };

  return (
    <div style={styles.bar}>
      {/* LEFT SECTION */}
      <div style={styles.leftSection}>
        <button
          onClick={onBack}
          style={styles.backButton}
          title="Zpet na seznam widgetu"
          aria-label="Zpet"
        >
          <ArrowLeft size={18} />
        </button>

        <span style={styles.title}>Widget Builder</span>

        <span style={styles.divider} />

        {isEditingName ? (
          <input
            ref={nameInputRef}
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={commitName}
            onKeyDown={handleNameKeyDown}
            style={styles.nameInput}
            maxLength={60}
            aria-label="Nazev widgetu"
          />
        ) : (
          <button
            onClick={() => setIsEditingName(true)}
            style={styles.nameDisplay}
            title="Klikni pro upravu nazvu"
            aria-label="Upravit nazev widgetu"
          >
            {widgetName || 'Bez nazvu'}
          </button>
        )}
      </div>

      {/* CENTER SECTION - device switcher + step switcher */}
      <div style={styles.centerSection}>
        <div style={styles.deviceGroup}>
          {DEVICE_MODES.map(({ id, icon: Icon, label }) => {
            const isActive = deviceMode === id;
            return (
              <button
                key={id}
                onClick={() => onDeviceModeChange(id)}
                style={{
                  ...styles.deviceButton,
                  ...(isActive ? styles.deviceButtonActive : {}),
                }}
                title={label}
                aria-label={label}
                aria-pressed={isActive}
              >
                <Icon
                  size={18}
                  color={isActive ? '#FFFFFF' : 'var(--builder-text-muted)'}
                />
              </button>
            );
          })}
        </div>

        <span style={styles.centerDivider} />

        <div style={styles.stepGroup}>
          {PREVIEW_STEPS.map(({ id, icon: StepIcon, label }) => {
            const isActive = previewStep === id;
            return (
              <button
                key={id}
                onClick={() => onPreviewStepChange?.(id)}
                style={{
                  ...styles.deviceButton,
                  ...(isActive ? styles.deviceButtonActive : {}),
                  paddingLeft: 8,
                  paddingRight: 10,
                  gap: 4,
                  width: 'auto',
                }}
                title={label}
                aria-label={`Krok ${id}: ${label}`}
                aria-pressed={isActive}
              >
                <StepIcon
                  size={14}
                  color={isActive ? '#FFFFFF' : 'var(--builder-text-muted)'}
                />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: isActive ? '#FFFFFF' : 'var(--builder-text-muted)',
                    fontFamily: 'var(--builder-font-body)',
                  }}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT SECTION */}
      <div style={styles.rightSection}>
        <button
          onClick={() => publicWidgetId && window.open('/w/' + publicWidgetId, '_blank')}
          disabled={!publicWidgetId}
          style={{
            ...styles.previewButton,
            ...(!publicWidgetId ? styles.iconButtonDisabled : {}),
          }}
          title="Otevrit nahled v novem tabu"
          aria-label="Nahled widgetu"
        >
          <ExternalLink size={14} />
          <span>Nahled</span>
        </button>

        <span style={styles.rightDivider} />

        <button
          onClick={onUndo}
          disabled={!canUndo}
          style={{
            ...styles.iconButton,
            ...(!canUndo ? styles.iconButtonDisabled : {}),
          }}
          title="Zpet (Undo)"
          aria-label="Undo"
        >
          <Undo2 size={16} />
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          style={{
            ...styles.iconButton,
            ...(!canRedo ? styles.iconButtonDisabled : {}),
          }}
          title="Vpred (Redo)"
          aria-label="Redo"
        >
          <Redo2 size={16} />
        </button>

        <span style={styles.rightDivider} />

        <button
          onClick={onReset}
          style={styles.resetButton}
          title="Resetovat zmeny"
          aria-label="Resetovat"
        >
          Resetovat
        </button>

        <button
          onClick={onSave}
          disabled={!isDirty || saving}
          style={{
            ...styles.saveButton,
            ...(!isDirty || saving ? styles.saveButtonDisabled : {}),
          }}
          aria-label="Ulozit"
        >
          {saving ? 'Ukladam...' : 'Ulozit'}
        </button>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Inline styles using CSS custom properties from builder-tokens.css  */
/* ------------------------------------------------------------------ */

const styles = {
  bar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 'var(--builder-topbar-height, 56px)',
    minHeight: 'var(--builder-topbar-height, 56px)',
    background: 'var(--builder-bg-topbar)',
    borderBottom: '1px solid var(--builder-border-subtle)',
    padding: '0 16px',
    gap: '12px',
    flexShrink: 0,
  },

  /* LEFT */
  leftSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    minWidth: 0,
    flex: '1 1 0%',
  },
  backButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 34,
    height: 34,
    borderRadius: 'var(--builder-radius-sm)',
    border: 'none',
    background: 'transparent',
    color: 'var(--builder-text-secondary)',
    cursor: 'pointer',
    transition: 'background var(--builder-transition-fast)',
    flexShrink: 0,
  },
  title: {
    fontFamily: 'var(--builder-font-heading)',
    fontWeight: 600,
    fontSize: 16,
    color: 'var(--builder-text-primary)',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  divider: {
    width: 1,
    height: 20,
    background: 'var(--builder-border-default)',
    flexShrink: 0,
  },
  nameDisplay: {
    fontFamily: 'var(--builder-font-code)',
    fontSize: 14,
    color: 'var(--builder-text-secondary)',
    background: 'transparent',
    border: '1px solid transparent',
    borderRadius: 'var(--builder-radius-sm)',
    padding: '4px 8px',
    cursor: 'pointer',
    transition: 'border-color var(--builder-transition-fast), background var(--builder-transition-fast)',
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    textAlign: 'left',
  },
  nameInput: {
    fontFamily: 'var(--builder-font-code)',
    fontSize: 14,
    color: 'var(--builder-text-primary)',
    background: 'var(--builder-bg-tertiary)',
    border: '1px solid var(--builder-border-focus)',
    borderRadius: 'var(--builder-radius-sm)',
    padding: '4px 8px',
    outline: 'none',
    minWidth: 120,
    maxWidth: 260,
  },

  /* CENTER */
  centerSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    gap: 8,
  },
  deviceGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    background: 'var(--builder-bg-secondary)',
    borderRadius: 'var(--builder-radius-md)',
    padding: 3,
  },
  centerDivider: {
    width: 1,
    height: 20,
    background: 'var(--builder-border-default)',
    flexShrink: 0,
  },
  stepGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    background: 'var(--builder-bg-secondary)',
    borderRadius: 'var(--builder-radius-md)',
    padding: 3,
  },
  deviceButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 34,
    height: 30,
    borderRadius: 'var(--builder-radius-sm)',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    transition: 'background var(--builder-transition-fast)',
  },
  deviceButtonActive: {
    background: 'var(--builder-accent-primary)',
  },

  /* RIGHT */
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flex: '1 1 0%',
    justifyContent: 'flex-end',
  },
  iconButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 'var(--builder-radius-sm)',
    border: 'none',
    background: 'transparent',
    color: 'var(--builder-text-secondary)',
    cursor: 'pointer',
    transition: 'background var(--builder-transition-fast)',
    flexShrink: 0,
  },
  iconButtonDisabled: {
    opacity: 0.3,
    cursor: 'not-allowed',
  },
  rightDivider: {
    width: 1,
    height: 20,
    background: 'var(--builder-border-default)',
    flexShrink: 0,
  },
  previewButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    fontFamily: 'var(--builder-font-body)',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--builder-text-secondary)',
    background: 'transparent',
    border: '1px solid var(--builder-border-default)',
    borderRadius: 'var(--builder-radius-sm)',
    padding: '5px 10px',
    cursor: 'pointer',
    transition: 'background var(--builder-transition-fast), border-color var(--builder-transition-fast)',
    whiteSpace: 'nowrap',
  },
  resetButton: {
    fontFamily: 'var(--builder-font-body)',
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--builder-text-secondary)',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '6px 10px',
    borderRadius: 'var(--builder-radius-sm)',
    transition: 'color var(--builder-transition-fast)',
    whiteSpace: 'nowrap',
  },
  saveButton: {
    fontFamily: 'var(--builder-font-body)',
    fontSize: 13,
    fontWeight: 600,
    color: '#FFFFFF',
    background: 'var(--builder-accent-success)',
    border: 'none',
    cursor: 'pointer',
    padding: '7px 16px',
    borderRadius: 'var(--builder-radius-sm)',
    transition: 'background var(--builder-transition-fast), opacity var(--builder-transition-fast)',
    whiteSpace: 'nowrap',
  },
  saveButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
};

export default BuilderTopBar;
