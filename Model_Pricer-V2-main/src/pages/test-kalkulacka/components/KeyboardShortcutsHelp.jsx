// src/pages/test-kalkulacka/components/KeyboardShortcutsHelp.jsx
import React, { useEffect, useRef } from 'react';
import Icon from '../../../components/AppIcon';

const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
const MOD = isMac ? '\u2318' : 'Ctrl';

const SHORTCUTS = [
  { keys: `${MOD}+Enter`, label: 'Spustit slicov\u00e1n\u00ed' },
  { keys: 'Escape', label: 'Zru\u0161it / zav\u0159\u00edt' },
  { keys: `${MOD}+S`, label: 'Exportovat souhrn ceny' },
  { keys: `${MOD}+U`, label: 'Nahr\u00e1t soubor' },
  { keys: '? / F1', label: 'Zobrazit kl\u00e1vesov\u00e9 zkratky' },
];

/**
 * Overlay modal showing available keyboard shortcuts.
 * Dismissable with Escape key or clicking outside / close button.
 */
const KeyboardShortcutsHelp = ({ open, onClose, onStartTour }) => {
  const overlayRef = useRef(null);
  const panelRef = useRef(null);

  // Focus trap: focus the panel when opened
  useEffect(() => {
    if (open && panelRef.current) {
      panelRef.current.focus();
    }
  }, [open]);

  // Close on click outside
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label="Kl\u00e1vesov\u00e9 zkratky"
      className="tk-shortcuts-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className="tk-shortcuts-panel"
        style={{
          backgroundColor: 'var(--forge-bg-surface)',
          border: '1px solid var(--forge-border-default)',
          borderRadius: 'var(--forge-radius-xl, 16px)',
          padding: '24px',
          minWidth: '320px',
          maxWidth: '420px',
          width: '90vw',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.4)',
          outline: 'none',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
        }}>
          <h2 style={{
            fontFamily: 'var(--forge-font-heading)',
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--forge-text-primary)',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <Icon name="Keyboard" size={18} style={{ color: 'var(--forge-accent-primary)' }} />
            Kl\u00e1vesov\u00e9 zkratky
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Zav\u0159\u00edt"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: 'var(--forge-text-muted)',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="X" size={18} />
          </button>
        </div>

        {/* Shortcut list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {SHORTCUTS.map(({ keys, label }) => (
            <div
              key={keys}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: 'var(--forge-radius-md, 8px)',
                backgroundColor: 'var(--forge-bg-elevated)',
              }}
            >
              <span style={{
                fontSize: '13px',
                color: 'var(--forge-text-secondary)',
                fontFamily: 'var(--forge-font-body)',
              }}>
                {label}
              </span>
              <kbd style={{
                fontFamily: 'var(--forge-font-tech, monospace)',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--forge-text-primary)',
                backgroundColor: 'var(--forge-bg-surface)',
                border: '1px solid var(--forge-border-active)',
                borderRadius: '4px',
                padding: '2px 8px',
                letterSpacing: '0.04em',
                whiteSpace: 'nowrap',
              }}>
                {keys}
              </kbd>
            </div>
          ))}
        </div>

        {/* Tour restart button */}
        {onStartTour && (
          <button
            type="button"
            onClick={onStartTour}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              width: '100%',
              marginTop: '16px',
              padding: '10px 14px',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--forge-accent-primary)',
              backgroundColor: 'transparent',
              border: '1px solid var(--forge-accent-primary)',
              borderRadius: 'var(--forge-radius-md, 8px)',
              cursor: 'pointer',
              fontFamily: 'var(--forge-font-body)',
              transition: 'background-color 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(20, 184, 166, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Icon name="HelpCircle" size={15} />
            Spustit pruvodce kalkulackou
          </button>
        )}

        {/* Footer hint */}
        <p style={{
          marginTop: '12px',
          fontSize: '11px',
          color: 'var(--forge-text-muted)',
          textAlign: 'center',
        }}>
          Stiskn\u011bte <kbd style={{
            fontFamily: 'var(--forge-font-tech, monospace)',
            fontSize: '10px',
            padding: '1px 4px',
            border: '1px solid var(--forge-border-active)',
            borderRadius: '3px',
            backgroundColor: 'var(--forge-bg-elevated)',
            color: 'var(--forge-text-secondary)',
          }}>Esc</kbd> pro zav\u0159en\u00ed
        </p>
      </div>
    </div>
  );
};

export default KeyboardShortcutsHelp;
