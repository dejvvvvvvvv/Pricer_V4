import React from 'react';
import ForgeTooltip from './ForgeTooltip';

/**
 * ForgeHelpIcon — small "?" circle that shows a tooltip on hover.
 *
 * Usage:
 *   <ForgeHelpIcon text="This setting controls..." />
 *   <ForgeHelpIcon text="..." learnMore={{ label: 'Docs', href: '/support' }} />
 *
 * Props:
 *   text       — string | ReactNode (tooltip content)
 *   position   — 'top' | 'bottom' | 'left' | 'right' (default: 'top')
 *   learnMore  — { label, href } — optional link in tooltip
 *   size       — number (default: 16)
 *   className  — additional CSS class
 */

const iconStyle = (size) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: size,
  height: size,
  minWidth: size,
  minHeight: size,
  borderRadius: '50%',
  border: '1px solid var(--forge-border-active, #2A3040)',
  backgroundColor: 'transparent',
  color: 'var(--forge-text-muted, #7A8291)',
  fontSize: Math.max(9, size - 6) + 'px',
  fontWeight: 600,
  fontFamily: 'var(--forge-font-tech, monospace)',
  lineHeight: 1,
  cursor: 'help',
  transition: 'border-color 150ms ease, color 150ms ease',
  userSelect: 'none',
  flexShrink: 0,
});

const hoverHandlers = {
  onMouseEnter: (e) => {
    e.currentTarget.style.borderColor = 'var(--forge-accent-primary, #00D4AA)';
    e.currentTarget.style.color = 'var(--forge-accent-primary, #00D4AA)';
  },
  onMouseLeave: (e) => {
    e.currentTarget.style.borderColor = 'var(--forge-border-active, #2A3040)';
    e.currentTarget.style.color = 'var(--forge-text-muted, #7A8291)';
  },
};

export default function ForgeHelpIcon({
  text,
  position = 'top',
  learnMore,
  size = 16,
  className = '',
}) {
  if (!text) return null;

  return (
    <ForgeTooltip text={text} position={position} learnMore={learnMore}>
      <span
        className={`forge-help-icon ${className}`}
        style={iconStyle(size)}
        tabIndex={0}
        role="img"
        aria-label="Help"
        {...hoverHandlers}
      >
        ?
      </span>
    </ForgeTooltip>
  );
}
