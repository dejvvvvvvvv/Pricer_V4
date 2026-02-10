import React, { useEffect, useState, useRef } from 'react';

/**
 * Forge-themed toast notification with left colored border,
 * auto-dismiss progress bar, and close button.
 *
 * @param {'info'|'success'|'warning'|'error'} type - Toast type, determines left border color
 * @param {string} title - Bold title text
 * @param {string} message - Description text
 * @param {Function} onDismiss - Called when toast is dismissed (auto or manual)
 * @param {number} duration - Auto-dismiss duration in ms (default 5000, 0 to disable)
 */
export default function ForgeToast({
  type = 'info',
  title,
  message,
  onDismiss,
  duration = 5000,
}) {
  const [progress, setProgress] = useState(100);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const rafRef = useRef(null);

  const typeColors = {
    success: 'var(--forge-success)',
    error: 'var(--forge-error)',
    warning: 'var(--forge-warning)',
    info: 'var(--forge-info)',
  };

  const borderColor = typeColors[type] || typeColors.info;

  useEffect(() => {
    if (duration <= 0) return;

    startTimeRef.current = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    timerRef.current = setTimeout(() => {
      if (onDismiss) onDismiss();
    }, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [duration, onDismiss]);

  const containerStyle = {
    backgroundColor: 'var(--forge-bg-elevated)',
    border: '1px solid var(--forge-border-default)',
    borderRadius: 'var(--forge-radius-md)',
    boxShadow: 'var(--forge-shadow-md)',
    borderLeft: `3px solid ${borderColor}`,
    position: 'relative',
    overflow: 'hidden',
    minWidth: '300px',
    maxWidth: '420px',
  };

  const contentStyle = {
    padding: '12px 40px 12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  };

  const titleStyle = {
    fontFamily: 'var(--forge-font-body)',
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--forge-text-primary)',
    margin: 0,
    lineHeight: 1.4,
  };

  const messageStyle = {
    fontFamily: 'var(--forge-font-body)',
    fontSize: '13px',
    color: 'var(--forge-text-secondary)',
    margin: 0,
    lineHeight: 1.4,
  };

  const closeButtonStyle = {
    position: 'absolute',
    top: '8px',
    right: '8px',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: 'var(--forge-radius-sm)',
    color: 'var(--forge-text-muted)',
    cursor: 'pointer',
    padding: 0,
    transition: 'color 120ms ease-out',
  };

  const progressBarContainerStyle = {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '2px',
    backgroundColor: 'var(--forge-bg-overlay)',
  };

  const progressBarStyle = {
    height: '100%',
    width: `${progress}%`,
    backgroundColor: borderColor,
    transition: 'width 100ms linear',
  };

  return (
    <div style={containerStyle} role="alert">
      <div style={contentStyle}>
        {title && <p style={titleStyle}>{title}</p>}
        {message && <p style={messageStyle}>{message}</p>}
      </div>

      {/* Close button */}
      <button
        style={closeButtonStyle}
        onClick={onDismiss}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--forge-text-primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--forge-text-muted)';
        }}
        aria-label="Dismiss notification"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M2 2L10 10M10 2L2 10"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {/* Auto-dismiss progress bar */}
      {duration > 0 && (
        <div style={progressBarContainerStyle}>
          <div style={progressBarStyle} />
        </div>
      )}
    </div>
  );
}
