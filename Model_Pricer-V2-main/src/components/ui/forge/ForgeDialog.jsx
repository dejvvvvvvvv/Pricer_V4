import React, { useEffect, useCallback } from 'react';

/**
 * Forge-themed modal dialog with dark overlay, header with close button,
 * scrollable body, and optional footer.
 *
 * @param {boolean} open - Whether the dialog is visible
 * @param {Function} onClose - Called when overlay or close button is clicked, or Escape is pressed
 * @param {string} title - Dialog title displayed in the header
 * @param {React.ReactNode} children - Dialog body content
 * @param {React.ReactNode} footer - Optional footer content (typically action buttons)
 * @param {string} maxWidth - Max width of the dialog container (default '540px')
 */
export default function ForgeDialog({
  open,
  onClose,
  title,
  children,
  footer,
  maxWidth = '540px',
}) {
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(8,9,12,0.85)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  };

  const containerStyle = {
    backgroundColor: 'var(--forge-bg-surface)',
    border: '1px solid var(--forge-border-default)',
    borderRadius: '8px',
    boxShadow: 'var(--forge-shadow-lg)',
    maxWidth,
    width: '100%',
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  };

  const headerStyle = {
    padding: '20px 24px',
    borderBottom: '1px solid var(--forge-border-default)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  };

  const titleStyle = {
    fontFamily: 'var(--forge-font-heading)',
    fontWeight: 600,
    fontSize: 'var(--forge-text-xl)',
    color: 'var(--forge-text-primary)',
    margin: 0,
    lineHeight: 1.3,
  };

  const closeButtonStyle = {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: 'var(--forge-radius-sm)',
    color: 'var(--forge-text-muted)',
    cursor: 'pointer',
    padding: 0,
    transition: 'color 120ms ease-out, background-color 120ms ease-out',
  };

  const bodyStyle = {
    padding: '24px',
    maxHeight: 'calc(85vh - 140px)',
    overflowY: 'auto',
    overscrollBehavior: 'contain',
    flex: 1,
  };

  const footerStyle = {
    padding: '16px 24px',
    borderTop: '1px solid var(--forge-border-default)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '8px',
    flexShrink: 0,
  };

  return (
    <div
      style={overlayStyle}
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div style={containerStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <h2 style={titleStyle}>{title}</h2>
          <button
            style={closeButtonStyle}
            onClick={onClose}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--forge-text-primary)';
              e.currentTarget.style.backgroundColor = 'var(--forge-bg-overlay)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--forge-text-muted)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            aria-label="Close dialog"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M4 4L12 12M12 4L4 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={bodyStyle}>{children}</div>

        {/* Footer */}
        {footer && <div style={footerStyle}>{footer}</div>}
      </div>
    </div>
  );
}
