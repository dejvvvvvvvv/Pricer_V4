/**
 * BuilderRightPanel - Right panel (preview area) for Widget Builder V3.
 *
 * Displays a "LIVE PREVIEW" badge in the top-right corner and centers
 * its children (typically a DevicePreviewFrame) using flexbox.
 *
 * Pure presentational component.
 */
import React from 'react';

const BuilderRightPanel = ({ children }) => {
  return (
    <div style={styles.panel}>
      {/* LIVE PREVIEW badge */}
      <div style={styles.badge}>
        <span style={styles.badgeLabel}>LIVE PREVIEW</span>
        <span style={styles.dot} />
        <span style={styles.liveText}>Live</span>
      </div>

      {/* Centered content area */}
      <div style={styles.content}>{children}</div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Inline styles using CSS custom properties from builder-tokens.css  */
/* ------------------------------------------------------------------ */

const styles = {
  panel: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: 'var(--builder-bg-tertiary)',
    minWidth: 0,
    overflow: 'hidden',
  },

  /* BADGE */
  badge: {
    position: 'absolute',
    top: 12,
    right: 16,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    zIndex: 2,
    pointerEvents: 'none',
    userSelect: 'none',
  },
  badgeLabel: {
    fontFamily: 'var(--builder-font-body)',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    color: 'var(--builder-text-muted)',
  },
  dot: {
    display: 'inline-block',
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: 'var(--builder-accent-success)',
    boxShadow: '0 0 6px rgba(16, 185, 129, 0.4)',
    flexShrink: 0,
  },
  liveText: {
    fontFamily: 'var(--builder-font-body)',
    fontSize: 11,
    fontWeight: 500,
    color: 'var(--builder-accent-success)',
  },

  /* CONTENT */
  content: {
    flex: '1 1 0%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    overflow: 'auto',
    overscrollBehavior: 'contain',
  },
};

export default BuilderRightPanel;
