import React, { useCallback, useEffect, useRef, useState } from 'react';

/**
 * ForgeTooltip — dark tooltip with arrow, auto-positioning, fade-in animation.
 *
 * Usage:
 *   <ForgeTooltip text="Helpful explanation" position="top">
 *     <button>Hover me</button>
 *   </ForgeTooltip>
 *
 * Props:
 *   text       — string | ReactNode (tooltip content)
 *   position   — 'top' | 'bottom' | 'left' | 'right' (default: 'top')
 *   learnMore  — { label, href } — optional "Learn more" link
 *   maxWidth   — number (default: 280)
 *   delay      — number ms before showing (default: 200)
 *   children   — trigger element (single child)
 */

const ARROW_SIZE = 6;
const VIEWPORT_PADDING = 8;

const tooltipStyles = {
  wrapper: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
  },
  tooltip: {
    position: 'fixed',
    zIndex: 99999,
    padding: '8px 12px',
    borderRadius: 'var(--forge-radius-sm, 4px)',
    backgroundColor: '#1C1F28',
    border: '1px solid var(--forge-border-active, #2A3040)',
    color: 'var(--forge-text-primary, #E8ECF1)',
    fontSize: '12px',
    lineHeight: '1.5',
    fontFamily: 'var(--forge-font-tech, monospace)',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.04)',
    pointerEvents: 'auto',
    opacity: 0,
    transition: 'opacity 150ms ease-in-out',
    wordWrap: 'break-word',
  },
  tooltipVisible: {
    opacity: 1,
  },
  arrow: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderStyle: 'solid',
  },
  learnMore: {
    display: 'inline-block',
    marginTop: '6px',
    fontSize: '11px',
    color: 'var(--forge-accent-primary, #00D4AA)',
    textDecoration: 'none',
    fontWeight: 500,
  },
};

function getArrowStyle(position) {
  const s = ARROW_SIZE;
  switch (position) {
    case 'top':
      return {
        ...tooltipStyles.arrow,
        bottom: -s,
        left: '50%',
        transform: 'translateX(-50%)',
        borderWidth: `${s}px ${s}px 0 ${s}px`,
        borderColor: '#1C1F28 transparent transparent transparent',
      };
    case 'bottom':
      return {
        ...tooltipStyles.arrow,
        top: -s,
        left: '50%',
        transform: 'translateX(-50%)',
        borderWidth: `0 ${s}px ${s}px ${s}px`,
        borderColor: 'transparent transparent #1C1F28 transparent',
      };
    case 'left':
      return {
        ...tooltipStyles.arrow,
        right: -s,
        top: '50%',
        transform: 'translateY(-50%)',
        borderWidth: `${s}px 0 ${s}px ${s}px`,
        borderColor: 'transparent transparent transparent #1C1F28',
      };
    case 'right':
      return {
        ...tooltipStyles.arrow,
        left: -s,
        top: '50%',
        transform: 'translateY(-50%)',
        borderWidth: `${s}px ${s}px ${s}px 0`,
        borderColor: 'transparent #1C1F28 transparent transparent',
      };
    default:
      return {};
  }
}

function calcPosition(triggerRect, tooltipRect, preferred) {
  const gap = ARROW_SIZE + 4;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const positions = {
    top: {
      top: triggerRect.top - tooltipRect.height - gap,
      left: triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2,
    },
    bottom: {
      top: triggerRect.bottom + gap,
      left: triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2,
    },
    left: {
      top: triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2,
      left: triggerRect.left - tooltipRect.width - gap,
    },
    right: {
      top: triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2,
      left: triggerRect.right + gap,
    },
  };

  // Check if preferred position fits in viewport
  const fitsInViewport = (pos) => {
    const coords = positions[pos];
    return (
      coords.top >= VIEWPORT_PADDING &&
      coords.left >= VIEWPORT_PADDING &&
      coords.top + tooltipRect.height <= vh - VIEWPORT_PADDING &&
      coords.left + tooltipRect.width <= vw - VIEWPORT_PADDING
    );
  };

  // Try preferred, then fallback order
  const fallbackOrder = ['top', 'bottom', 'right', 'left'];
  let chosen = preferred;
  if (!fitsInViewport(preferred)) {
    chosen = fallbackOrder.find(fitsInViewport) || preferred;
  }

  let coords = positions[chosen];

  // Clamp to viewport
  coords = {
    top: Math.max(VIEWPORT_PADDING, Math.min(coords.top, vh - tooltipRect.height - VIEWPORT_PADDING)),
    left: Math.max(VIEWPORT_PADDING, Math.min(coords.left, vw - tooltipRect.width - VIEWPORT_PADDING)),
  };

  return { ...coords, position: chosen };
}

export default function ForgeTooltip({
  text,
  position = 'top',
  learnMore,
  maxWidth = 280,
  delay = 200,
  children,
}) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, position });
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);
  const timerRef = useRef(null);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const result = calcPosition(triggerRect, tooltipRect, position);
    setCoords(result);
  }, [position]);

  const handleMouseEnter = useCallback(() => {
    timerRef.current = setTimeout(() => {
      setVisible(true);
    }, delay);
  }, [delay]);

  const handleMouseLeave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setVisible(false);
  }, []);

  useEffect(() => {
    if (visible) {
      // Delay one frame so the tooltip DOM is rendered for measurement
      requestAnimationFrame(updatePosition);
    }
  }, [visible, updatePosition]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!text) return children;

  return (
    <span
      ref={triggerRef}
      style={tooltipStyles.wrapper}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {children}
      {visible && (
        <div
          ref={tooltipRef}
          role="tooltip"
          style={{
            ...tooltipStyles.tooltip,
            ...(visible ? tooltipStyles.tooltipVisible : {}),
            maxWidth,
            top: coords.top,
            left: coords.left,
          }}
        >
          <div>{text}</div>
          {learnMore && (
            <a
              href={learnMore.href}
              target="_blank"
              rel="noopener noreferrer"
              style={tooltipStyles.learnMore}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {learnMore.label || 'Learn more'} &rarr;
            </a>
          )}
          <div style={getArrowStyle(coords.position)} />
        </div>
      )}
    </span>
  );
}
