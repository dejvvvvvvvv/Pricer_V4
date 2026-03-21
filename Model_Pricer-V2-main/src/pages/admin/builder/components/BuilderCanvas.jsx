/**
 * BuilderCanvas -- center panel of the VvvebJs-style builder.
 *
 * Shows the live widget preview inside a device frame, with:
 *   - Click-to-select (blue outline)
 *   - Hover indicator (dashed outline)
 *   - Selected element resize handles (visual only, drag reorder via DnD)
 *   - Drag elements to reorder (HTML5 DnD)
 *   - "Drop here" placeholder when dragging from left panel
 *   - Device frame wrapper (phone/tablet/desktop mockup)
 *   - Zoom controls (50%, 75%, 100%, 125%, 150%)
 *   - "LIVE PREVIEW" badge
 *
 * Pure presentational component -- state managed externally via props.
 */
import React, { useRef, useCallback } from 'react';
import {
  Minus, Plus, Maximize2, ZoomIn,
} from 'lucide-react';

const DEVICE_DIMENSIONS = {
  mobile: { width: 360, maxHeight: 740, label: 'iPhone SE' },
  tablet: { width: 768, maxHeight: 1024, label: 'iPad' },
  desktop: { width: 1280, maxWidth: 1280, maxHeight: 'none', label: 'Desktop' },
};

const ZOOM_LEVELS = [50, 75, 100, 125, 150];

export default function BuilderCanvas({
  // Device
  deviceMode = 'desktop',
  // Zoom
  zoom = 100,
  onZoomChange,
  // DnD
  isDragging = false,
  dropIndicatorIndex = -1,
  onCanvasDragOver,
  onCanvasDragLeave,
  onCanvasDrop,
  // Content
  children,
}) {
  const canvasRef = useRef(null);

  // Zoom in/out
  const handleZoomIn = useCallback(() => {
    if (!onZoomChange) return;
    const currentIdx = ZOOM_LEVELS.indexOf(zoom);
    if (currentIdx < ZOOM_LEVELS.length - 1) {
      onZoomChange(ZOOM_LEVELS[currentIdx + 1]);
    }
  }, [zoom, onZoomChange]);

  const handleZoomOut = useCallback(() => {
    if (!onZoomChange) return;
    const currentIdx = ZOOM_LEVELS.indexOf(zoom);
    if (currentIdx > 0) {
      onZoomChange(ZOOM_LEVELS[currentIdx - 1]);
    }
  }, [zoom, onZoomChange]);

  const handleZoomReset = useCallback(() => {
    onZoomChange?.(100);
  }, [onZoomChange]);

  // Device dimensions
  const dims = DEVICE_DIMENSIONS[deviceMode] || DEVICE_DIMENSIONS.desktop;
  const isDesktop = deviceMode === 'desktop';

  // Scale factor
  const scale = zoom / 100;

  return (
    <div style={styles.wrapper}>
      {/* LIVE PREVIEW badge */}
      <div style={styles.badge}>
        <span style={styles.badgeLabel}>LIVE PREVIEW</span>
        <span style={styles.dot} />
        <span style={styles.liveText}>Live</span>
      </div>

      {/* Canvas area */}
      <div
        ref={canvasRef}
        style={styles.canvasArea}
        onDragOver={onCanvasDragOver}
        onDragLeave={onCanvasDragLeave}
        onDrop={onCanvasDrop}
      >
        {/* Drop indicator overlay */}
        {isDragging && (
          <div style={styles.dropOverlay}>
            <div style={styles.dropOverlayInner}>
              <ZoomIn size={20} color="var(--builder-accent-primary)" />
              <span style={styles.dropOverlayText}>Sem pretahnete blok</span>
              <span style={styles.dropOverlayTextEn}>Drop block here</span>
            </div>
          </div>
        )}

        {/* Device frame + content */}
        <div
          style={{
            ...styles.deviceFrame,
            width: isDesktop ? '100%' : dims.width,
            maxWidth: isDesktop ? (dims.maxWidth || 1280) : dims.width,
            maxHeight: isDesktop ? 'none' : dims.maxHeight,
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
          }}
        >
          {/* Device chrome for mobile/tablet */}
          {!isDesktop && (
            <div style={styles.deviceChrome}>
              <div style={styles.deviceNotch} />
              <span style={styles.deviceLabel}>{dims.label}</span>
            </div>
          )}

          {/* Widget content */}
          <div style={styles.deviceContent}>
            {children}
          </div>
        </div>
      </div>

      {/* Zoom controls bar */}
      <div style={styles.zoomBar}>
        <button
          onClick={handleZoomOut}
          disabled={zoom <= ZOOM_LEVELS[0]}
          style={{
            ...styles.zoomBtn,
            ...(zoom <= ZOOM_LEVELS[0] ? styles.zoomBtnDisabled : {}),
          }}
          title="Oddadit / Zoom out"
          aria-label="Zoom out"
        >
          <Minus size={14} />
        </button>

        <button
          onClick={handleZoomReset}
          style={styles.zoomLevel}
          title="Resetovat priblizeni / Reset zoom"
          aria-label="Reset zoom"
        >
          {zoom}%
        </button>

        <button
          onClick={handleZoomIn}
          disabled={zoom >= ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
          style={{
            ...styles.zoomBtn,
            ...(zoom >= ZOOM_LEVELS[ZOOM_LEVELS.length - 1] ? styles.zoomBtnDisabled : {}),
          }}
          title="Priblizit / Zoom in"
          aria-label="Zoom in"
        >
          <Plus size={14} />
        </button>

        <span style={styles.zoomDivider} />

        <button
          onClick={handleZoomReset}
          style={styles.zoomBtn}
          title="Prizpusobit / Fit to screen"
          aria-label="Fit to screen"
        >
          <Maximize2 size={14} />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */

const styles = {
  wrapper: {
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
    gap: 8,
    zIndex: 5,
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

  /* CANVAS AREA */
  canvasArea: {
    flex: '1 1 0%',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: 24,
    paddingTop: 40,
    overflow: 'auto',
    overscrollBehavior: 'contain',
    position: 'relative',
    scrollbarWidth: 'thin',
    scrollbarColor: 'var(--builder-scrollbar-thumb) transparent',
  },

  /* DROP OVERLAY */
  dropOverlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0, 212, 170, 0.05)',
    border: '2px dashed var(--builder-accent-primary)',
    borderRadius: 'var(--builder-radius-lg)',
    zIndex: 10,
    pointerEvents: 'none',
  },
  dropOverlayInner: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  dropOverlayText: {
    fontFamily: 'var(--builder-font-body)',
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--builder-accent-primary)',
  },
  dropOverlayTextEn: {
    fontFamily: 'var(--builder-font-body)',
    fontSize: 12,
    fontWeight: 400,
    color: 'var(--builder-text-muted)',
  },

  /* DEVICE FRAME */
  deviceFrame: {
    background: '#FFFFFF',
    borderRadius: 'var(--builder-radius-lg, 12px)',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.35)',
    overflow: 'hidden',
    transition: 'width 300ms ease, max-width 300ms ease, transform 200ms ease',
    margin: '0 auto',
    minWidth: 0,
  },

  /* Device chrome (mobile/tablet top bar) */
  deviceChrome: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 28,
    background: '#F8F8F8',
    borderBottom: '1px solid #E5E7EB',
    flexShrink: 0,
  },
  deviceNotch: {
    width: 80,
    height: 6,
    borderRadius: 3,
    background: '#D1D5DB',
  },
  deviceLabel: {
    fontFamily: 'var(--builder-font-body)',
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: 500,
    position: 'absolute',
    right: 12,
  },

  /* Device content */
  deviceContent: {
    overflowY: 'auto',
    overflowX: 'hidden',
    overscrollBehavior: 'contain',
    scrollbarWidth: 'thin',
    scrollbarColor: '#D1D5DB transparent',
  },

  /* ZOOM BAR */
  zoomBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: '6px 12px',
    borderTop: '1px solid var(--builder-border-subtle)',
    background: 'var(--builder-bg-secondary)',
    flexShrink: 0,
  },
  zoomBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--builder-text-secondary)',
    borderRadius: 'var(--builder-radius-sm)',
    transition: 'background var(--builder-transition-fast)',
  },
  zoomBtnDisabled: {
    opacity: 0.3,
    cursor: 'not-allowed',
  },
  zoomLevel: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
    height: 28,
    fontFamily: 'var(--builder-font-code)',
    fontSize: 12,
    fontWeight: 500,
    color: 'var(--builder-text-primary)',
    background: 'var(--builder-bg-tertiary)',
    border: '1px solid var(--builder-border-default)',
    borderRadius: 'var(--builder-radius-sm)',
    cursor: 'pointer',
    padding: '0 8px',
  },
  zoomDivider: {
    width: 1,
    height: 16,
    background: 'var(--builder-border-default)',
    margin: '0 4px',
    flexShrink: 0,
  },
};
