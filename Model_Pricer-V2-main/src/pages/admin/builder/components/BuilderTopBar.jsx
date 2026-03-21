/**
 * BuilderTopBar -- VvvebJs-style top navigation bar.
 *
 * Layout:
 *   [Back] [Widget Name] | [Step 1] [Step 2] [Step 3] [Step 4] [Step 5] | [Mobile] [Tablet] [Desktop] | [Undo] [Redo] | [Preview] [Save]
 *
 * Features:
 *   - Back button navigates to /admin/widget
 *   - Editable widget name (click to edit, Enter/Escape to commit/cancel)
 *   - Step tabs with icons for switching calculator steps (1-5)
 *   - Device mode buttons with active indicator
 *   - Undo/redo buttons (disabled when stack empty)
 *   - Preview opens widget in new tab
 *   - Save with auto-save status indicator
 *
 * Pure presentational component -- all state managed externally via props.
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
  ShoppingCart,
  CheckCircle,
  ExternalLink,
  Loader2,
  Check,
  Save,
} from 'lucide-react';

import '../styles/builder-tokens.css';

const DEVICE_MODES = [
  { id: 'mobile', icon: Smartphone, label: 'Mobile (360px)', labelShort: 'Mobile' },
  { id: 'tablet', icon: Tablet, label: 'Tablet (768px)', labelShort: 'Tablet' },
  { id: 'desktop', icon: Monitor, label: 'Desktop (1280px)', labelShort: 'Desktop' },
];

const STEP_TABS = [
  { id: 1, icon: Upload, cs: 'Nahrani', en: 'Upload' },
  { id: 2, icon: Settings, cs: 'Konfigurace', en: 'Config' },
  { id: 3, icon: DollarSign, cs: 'Cena', en: 'Price' },
  { id: 4, icon: ShoppingCart, cs: 'Objednavka', en: 'Order' },
  { id: 5, icon: CheckCircle, cs: 'Potvrzeni', en: 'Confirm' },
];

const BuilderTopBar = ({
  // Widget info
  widgetName,
  onWidgetNameChange,
  onBack,
  // Steps
  currentStep = 1,
  onStepChange,
  // Device
  deviceMode = 'desktop',
  onDeviceModeChange,
  // Undo/redo
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  // Reset
  onReset,
  // Preview
  publicWidgetId,
  // Save
  autoSaveStatus = 'idle',
  onSave,
  isDirty = false,
}) => {
  // Editable name state
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
      {/* ---- LEFT: Back + Name ---- */}
      <div style={styles.leftSection}>
        <button
          onClick={onBack}
          style={styles.backButton}
          title="Zpet na seznam widgetu / Back to widget list"
          aria-label="Zpet"
        >
          <ArrowLeft size={18} />
        </button>

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
            aria-label="Nazev widgetu / Widget name"
          />
        ) : (
          <button
            onClick={() => setIsEditingName(true)}
            style={styles.nameDisplay}
            title="Klikni pro upravu nazvu / Click to edit name"
            aria-label="Upravit nazev widgetu"
          >
            {widgetName || 'Bez nazvu'}
          </button>
        )}

        {isDirty && (
          <span style={styles.dirtyDot} title="Neulozone zmeny / Unsaved changes" />
        )}
      </div>

      {/* ---- CENTER: Step tabs + Device switcher ---- */}
      <div style={styles.centerSection}>
        {/* Step tabs */}
        <div style={styles.stepGroup} role="tablist" aria-label="Kroky kalkulacky / Calculator steps">
          {STEP_TABS.map(({ id, icon: StepIcon, cs, en }) => {
            const isActive = currentStep === id;
            return (
              <button
                key={id}
                onClick={() => onStepChange?.(id)}
                style={{
                  ...styles.stepButton,
                  ...(isActive ? styles.stepButtonActive : {}),
                }}
                role="tab"
                aria-selected={isActive}
                aria-label={`Krok ${id}: ${cs} / Step ${id}: ${en}`}
                title={`${cs} / ${en}`}
              >
                <StepIcon
                  size={13}
                  color={isActive ? '#FFFFFF' : 'var(--builder-text-muted)'}
                />
                <span style={{
                  ...styles.stepLabel,
                  color: isActive ? '#FFFFFF' : 'var(--builder-text-muted)',
                }}>
                  {id}
                </span>
              </button>
            );
          })}
        </div>

        <span style={styles.centerDivider} />

        {/* Device mode switcher */}
        <div style={styles.deviceGroup} role="radiogroup" aria-label="Zarizeni / Device">
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
                role="radio"
                aria-checked={isActive}
                title={label}
                aria-label={label}
              >
                <Icon
                  size={16}
                  color={isActive ? '#FFFFFF' : 'var(--builder-text-muted)'}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* ---- RIGHT: Undo/Redo + Preview + Save ---- */}
      <div style={styles.rightSection}>
        {/* Undo / Redo */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          style={{
            ...styles.iconButton,
            ...(!canUndo ? styles.iconButtonDisabled : {}),
          }}
          title="Zpet (Ctrl+Z) / Undo"
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
          title="Vpred (Ctrl+Y) / Redo"
          aria-label="Redo"
        >
          <Redo2 size={16} />
        </button>

        <span style={styles.rightDivider} />

        {/* Preview button */}
        <button
          onClick={() => publicWidgetId && window.open('/w/' + publicWidgetId, '_blank')}
          disabled={!publicWidgetId}
          style={{
            ...styles.previewButton,
            ...(!publicWidgetId ? styles.iconButtonDisabled : {}),
          }}
          title="Otevrit nahled / Open preview"
          aria-label="Nahled widgetu / Preview widget"
        >
          <ExternalLink size={14} />
          <span>Nahled</span>
        </button>

        {/* Save button */}
        <button
          onClick={onSave}
          style={{
            ...styles.saveButton,
            ...(autoSaveStatus === 'saving' ? styles.saveButtonSaving : {}),
          }}
          title="Ulozit (Ctrl+S) / Save"
          aria-label="Ulozit / Save"
        >
          {autoSaveStatus === 'saving' ? (
            <Loader2
              size={14}
              color="#FFFFFF"
              style={{ animation: 'spin 1s linear infinite' }}
            />
          ) : autoSaveStatus === 'saved' ? (
            <Check size={14} color="#FFFFFF" />
          ) : (
            <Save size={14} color="#FFFFFF" />
          )}
          <span style={styles.saveLabel}>
            {autoSaveStatus === 'saving'
              ? 'Ukladam...'
              : autoSaveStatus === 'saved'
                ? 'Ulozeno'
                : 'Ulozit'}
          </span>
        </button>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Styles                                                              */
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
    padding: '0 12px',
    gap: 8,
    flexShrink: 0,
  },

  /* LEFT */
  leftSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
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
  divider: {
    width: 1,
    height: 20,
    background: 'var(--builder-border-default)',
    flexShrink: 0,
  },
  nameDisplay: {
    fontFamily: 'var(--builder-font-body)',
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--builder-text-primary)',
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
    maxWidth: 200,
  },
  nameInput: {
    fontFamily: 'var(--builder-font-body)',
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--builder-text-primary)',
    background: 'var(--builder-bg-tertiary)',
    border: '1px solid var(--builder-border-focus)',
    borderRadius: 'var(--builder-radius-sm)',
    padding: '4px 8px',
    outline: 'none',
    minWidth: 120,
    maxWidth: 200,
  },
  dirtyDot: {
    display: 'inline-block',
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: 'var(--builder-accent-warning)',
    flexShrink: 0,
  },

  /* CENTER */
  centerSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    gap: 8,
  },
  stepGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    background: 'var(--builder-bg-secondary)',
    borderRadius: 'var(--builder-radius-md)',
    padding: 3,
  },
  stepButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    width: 'auto',
    minWidth: 36,
    height: 30,
    paddingLeft: 8,
    paddingRight: 8,
    borderRadius: 'var(--builder-radius-sm)',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    transition: 'background var(--builder-transition-fast)',
  },
  stepButtonActive: {
    background: 'var(--builder-accent-primary)',
  },
  stepLabel: {
    fontFamily: 'var(--builder-font-body)',
    fontSize: 11,
    fontWeight: 700,
  },
  centerDivider: {
    width: 1,
    height: 20,
    background: 'var(--builder-border-default)',
    flexShrink: 0,
  },
  deviceGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
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
    gap: 6,
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
  saveButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    fontFamily: 'var(--builder-font-body)',
    fontSize: 12,
    fontWeight: 600,
    color: '#FFFFFF',
    background: 'var(--builder-accent-primary)',
    border: 'none',
    borderRadius: 'var(--builder-radius-sm)',
    padding: '6px 14px',
    cursor: 'pointer',
    transition: 'background var(--builder-transition-fast), opacity var(--builder-transition-fast)',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  saveButtonSaving: {
    opacity: 0.7,
    cursor: 'default',
  },
  saveLabel: {
    fontFamily: 'var(--builder-font-body)',
    fontSize: 12,
    fontWeight: 600,
  },
};

export default BuilderTopBar;
