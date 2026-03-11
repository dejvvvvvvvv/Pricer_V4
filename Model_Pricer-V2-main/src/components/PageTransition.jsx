/**
 * PageTransition — Wraps page content with a CSS fade-in animation on mount.
 *
 * Uses CSS-only animation by default (page-fade-in from animations.css).
 * For complex cases (AnimatePresence, exit animations), framer-motion can be
 * imported lazily by the consumer.
 *
 * Respects prefers-reduced-motion via the CSS animation definition.
 *
 * @param {React.ReactNode} children — Page content to wrap
 * @param {string} [className] — Additional CSS classes
 * @param {object} [style] — Additional inline styles
 * @param {'fade'|'slide-right'|'slide-left'|'scale'} [variant='fade'] — Animation type
 */
import React from 'react';
import '../styles/animations.css';

const variantClassMap = {
  fade: 'page-fade-in',
  'slide-right': 'slide-in-right',
  'slide-left': 'slide-in-left',
  scale: 'scale-fade-in',
};

export default function PageTransition({
  children,
  className = '',
  style,
  variant = 'fade',
}) {
  const animClass = variantClassMap[variant] || 'page-fade-in';

  return (
    <div className={`${animClass} ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}
