// KeyboardShortcutsHelp — Modal overlay showing all admin keyboard shortcuts
import React, { useEffect, useRef } from 'react';
import Icon from '../../../components/AppIcon';

const SHORTCUT_GROUPS = [
  {
    label: 'NAVIGACE',
    icon: 'Navigation',
    shortcuts: [
      { keys: ['G', 'D'], description: 'Dashboard' },
      { keys: ['G', 'O'], description: 'Objednavky (Orders)' },
      { keys: ['G', 'P'], description: 'Pricing' },
      { keys: ['G', 'A'], description: 'Analytika' },
      { keys: ['G', 'B'], description: 'Branding' },
      { keys: ['G', 'W'], description: 'Widget' },
      { keys: ['G', 'S'], description: 'Uloziste modelu (Storage)' },
    ],
  },
  {
    label: 'AKCE',
    icon: 'Zap',
    shortcuts: [
      { keys: ['Ctrl', 'K'], description: 'Command Palette' },
      { keys: ['Ctrl', 'B'], description: 'Sbalit / rozbalit sidebar' },
    ],
  },
  {
    label: 'OBECNE',
    icon: 'Settings',
    shortcuts: [
      { keys: ['?'], description: 'Zobrazit klavesove zkratky' },
      { keys: ['Esc'], description: 'Zavrit modal / overlay' },
    ],
  },
];

const kbdStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '24px',
  height: '24px',
  padding: '0 7px',
  fontSize: '11px',
  fontFamily: 'var(--forge-font-tech)',
  fontWeight: 600,
  color: 'var(--forge-text-primary, #e8e9ed)',
  backgroundColor: 'var(--forge-bg-elevated, #22232d)',
  border: '1px solid var(--forge-border-default, #2a2b35)',
  borderRadius: '5px',
  lineHeight: '22px',
  boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
};

const thenStyle = {
  fontSize: '10px',
  color: 'var(--forge-text-muted, #7A8291)',
  fontFamily: 'var(--forge-font-tech)',
  margin: '0 2px',
};

export default function KeyboardShortcutsHelp({ open, onClose }) {
  const overlayRef = useRef(null);

  // Close on Esc
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [open, onClose]);

  // Lock scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9998,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(8, 9, 12, 0.6)',
        backdropFilter: 'blur(4px)',
        animation: 'ksh-fade-in 150ms ease-out',
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Klavesove zkratky"
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          margin: '0 16px',
          backgroundColor: 'var(--forge-bg-surface, #1a1b23)',
          border: '1px solid var(--forge-border-default, #2a2b35)',
          borderRadius: 'var(--forge-radius-lg, 12px)',
          boxShadow: '0 24px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)',
          overflow: 'hidden',
          animation: 'ksh-scale-in 150ms ease-out',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px 14px',
          borderBottom: '1px solid var(--forge-border-default, #2a2b35)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <Icon name="Keyboard" size={18} style={{ color: 'var(--forge-accent-primary, #00D4AA)' }} />
            <span style={{
              fontFamily: 'var(--forge-font-heading)',
              fontSize: '15px',
              fontWeight: 600,
              color: 'var(--forge-text-primary, #e8e9ed)',
            }}>
              Klavesove zkratky
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--forge-text-muted, #7A8291)',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: 'var(--forge-radius-sm, 6px)',
              transition: 'color 150ms',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--forge-text-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--forge-text-muted)'; }}
            aria-label="Zavrit"
          >
            <Icon name="X" size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{
          padding: '12px 20px 20px',
          maxHeight: '60vh',
          overflowY: 'auto',
          overscrollBehavior: 'contain',
        }}>
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.label} style={{ marginBottom: '16px' }}>
              {/* Group label */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: 'var(--forge-font-tech)',
                fontSize: '10px',
                fontWeight: 500,
                color: 'var(--forge-text-muted, #7A8291)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '8px',
                paddingBottom: '4px',
                borderBottom: '1px solid var(--forge-border-default, #2a2b35)',
              }}>
                <Icon name={group.icon} size={12} />
                {group.label}
              </div>

              {/* Shortcuts */}
              {group.shortcuts.map((shortcut, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 4px',
                    borderRadius: 'var(--forge-radius-sm, 6px)',
                  }}
                >
                  <span style={{
                    fontSize: '13px',
                    fontFamily: 'var(--forge-font-body)',
                    color: 'var(--forge-text-secondary, #a0a4b0)',
                  }}>
                    {shortcut.description}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
                    {shortcut.keys.map((key, ki) => (
                      <React.Fragment key={ki}>
                        {ki > 0 && <span style={thenStyle}>{shortcut.keys[0] === 'Ctrl' ? '+' : 'pak'}</span>}
                        <kbd style={kbdStyle}>{key}</kbd>
                      </React.Fragment>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '10px 20px',
          borderTop: '1px solid var(--forge-border-default, #2a2b35)',
          fontFamily: 'var(--forge-font-tech)',
          fontSize: '10px',
          color: 'var(--forge-text-muted, #7A8291)',
          textAlign: 'center',
        }}>
          Stiskni <kbd style={{ ...kbdStyle, minWidth: '18px', height: '18px', fontSize: '9px', lineHeight: '16px', padding: '0 4px' }}>Esc</kbd> pro zavreni
        </div>
      </div>

      <style>{`
        @keyframes ksh-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes ksh-scale-in {
          from { opacity: 0; transform: scale(0.96) translateY(-8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
