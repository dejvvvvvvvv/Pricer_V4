import React from 'react';

/**
 * Small uppercase section label in Forge tech font.
 * Used for section markers like "ABOUT", "PROCESS", "PLANS", "FAQ".
 */
export default function ForgeSectionLabel({ text, className = '' }) {
  return (
    <span
      className={className}
      style={{
        fontFamily: 'var(--forge-font-tech)',
        fontSize: 'var(--forge-text-xs)',
        letterSpacing: '0.1em',
        color: 'var(--forge-text-muted)',
        textTransform: 'uppercase',
        display: 'inline-block',
      }}
    >
      {text}
    </span>
  );
}
