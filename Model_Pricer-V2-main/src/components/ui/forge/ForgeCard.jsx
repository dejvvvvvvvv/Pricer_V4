import React from 'react';

/**
 * Forge-themed card wrapper with default, elevated, and interactive variants.
 * Uses inline styles with --forge-* CSS custom properties.
 *
 * @param {'default'|'elevated'|'interactive'} variant - Visual variant
 * @param {React.ReactNode} children - Card content
 * @param {string} className - Additional CSS classes
 * @param {Function} onClick - Click handler (interactive variant gets cursor:pointer automatically)
 * @param {object} style - Additional inline styles
 */
export default function ForgeCard({
  variant = 'default',
  children,
  className = '',
  onClick,
  style,
  ...props
}) {
  const baseStyle = {
    backgroundColor: 'var(--forge-bg-surface)',
    border: '1px solid var(--forge-border-default)',
    borderRadius: 'var(--forge-radius-md)',
    padding: '24px',
    transition: 'background-color 120ms ease-out, border-color 120ms ease-out, box-shadow 120ms ease-out, transform 120ms ease-out',
  };

  const variantStyles = {
    default: {},
    elevated: {
      backgroundColor: 'var(--forge-bg-elevated)',
    },
    interactive: {
      cursor: 'pointer',
    },
  };

  const mergedStyle = {
    ...baseStyle,
    ...variantStyles[variant],
    ...style,
  };

  const hoverHandlers = variant === 'interactive'
    ? {
        onMouseEnter: (e) => {
          e.currentTarget.style.backgroundColor = 'var(--forge-bg-elevated)';
          e.currentTarget.style.borderColor = 'rgba(0,212,170,0.2)';
          e.currentTarget.style.boxShadow = 'var(--forge-shadow-glow)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        },
        onMouseLeave: (e) => {
          e.currentTarget.style.backgroundColor = 'var(--forge-bg-surface)';
          e.currentTarget.style.borderColor = 'var(--forge-border-default)';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.transform = 'translateY(0)';
        },
      }
    : {};

  return (
    <div
      className={`forge-card forge-card--${variant} ${className}`}
      style={mergedStyle}
      onClick={onClick}
      {...hoverHandlers}
      {...props}
    >
      {children}
    </div>
  );
}
