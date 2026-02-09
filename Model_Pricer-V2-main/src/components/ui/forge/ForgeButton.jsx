import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Forge-themed button with primary, outline, and ghost variants.
 * Supports routing via `to` prop (renders Link) or plain button.
 */
export default function ForgeButton({
  variant = 'primary',
  to,
  size = 'md',
  children,
  className = '',
  onClick,
  fullWidth = false,
  ...props
}) {
  const sizeClasses = {
    sm: 'h-9 px-4 text-sm',
    md: 'h-11 px-6 text-base',
    lg: 'h-12 px-7 text-base',
  };

  const base = `inline-flex items-center justify-center font-medium rounded-[var(--forge-radius-sm)] forge-transition-micro ${sizeClasses[size] || sizeClasses.md} ${fullWidth ? 'w-full' : ''}`;

  const variantStyles = {
    primary: {
      backgroundColor: 'var(--forge-accent-primary)',
      color: '#08090C',
      fontFamily: 'var(--forge-font-heading)',
      border: 'none',
    },
    outline: {
      backgroundColor: 'transparent',
      color: 'var(--forge-text-secondary)',
      fontFamily: 'var(--forge-font-heading)',
      border: '1px solid var(--forge-border-active)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--forge-text-muted)',
      fontFamily: 'var(--forge-font-body)',
      border: 'none',
    },
  };

  const hoverHandlers = {
    primary: {
      onMouseEnter: (e) => {
        e.currentTarget.style.backgroundColor = 'var(--forge-accent-primary-h)';
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = 'var(--forge-shadow-glow)';
      },
      onMouseLeave: (e) => {
        e.currentTarget.style.backgroundColor = 'var(--forge-accent-primary)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      },
    },
    outline: {
      onMouseEnter: (e) => {
        e.currentTarget.style.backgroundColor = 'var(--forge-bg-elevated)';
        e.currentTarget.style.color = 'var(--forge-text-primary)';
      },
      onMouseLeave: (e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.color = 'var(--forge-text-secondary)';
      },
    },
    ghost: {
      onMouseEnter: (e) => {
        e.currentTarget.style.color = 'var(--forge-accent-primary)';
      },
      onMouseLeave: (e) => {
        e.currentTarget.style.color = 'var(--forge-text-muted)';
      },
    },
  };

  const style = variantStyles[variant] || variantStyles.primary;
  const handlers = hoverHandlers[variant] || hoverHandlers.primary;

  if (to) {
    return (
      <Link
        to={to}
        className={`${base} ${className}`}
        style={style}
        {...handlers}
        {...props}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      className={`${base} ${className}`}
      style={style}
      onClick={onClick}
      {...handlers}
      {...props}
    >
      {children}
    </button>
  );
}
