import React from 'react';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';

/**
 * Reusable copy-to-clipboard button using Forge design tokens.
 *
 * @param {Object}  props
 * @param {string}  props.text         - Text to copy
 * @param {string}  [props.label]      - Button label (default: "Copy")
 * @param {string}  [props.copiedLabel]- Label after copy (default: "Copied!")
 * @param {Object}  [props.style]      - Additional inline styles
 * @param {string}  [props.className]  - Additional CSS class
 */
export function CopyButton({ text, label = 'Copy', copiedLabel = 'Copied!', style = {}, className = '' }) {
  const { copyToClipboard, copied } = useCopyToClipboard();

  return (
    <button
      onClick={() => copyToClipboard(text)}
      className={className}
      style={{
        padding: '6px 12px',
        borderRadius: 'var(--forge-radius-sm, 4px)',
        border: '1px solid var(--forge-border, #2a2d35)',
        background: copied
          ? 'var(--forge-accent-primary, #00D4AA)'
          : 'var(--forge-bg-elevated, #1e2028)',
        color: copied
          ? 'var(--forge-bg-primary, #13151a)'
          : 'var(--forge-text-primary, #E8EAED)',
        cursor: 'pointer',
        fontSize: '0.75rem',
        fontWeight: 500,
        fontFamily: 'var(--forge-font-body)',
        transition: 'all 0.2s',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        ...style,
      }}
      aria-label={copied ? copiedLabel : label}
    >
      {copied ? (
        <>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 7l3 3 5-5" />
          </svg>
          {copiedLabel}
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="4" y="4" width="8" height="8" rx="1.5" />
            <path d="M2 10V2.5A.5.5 0 012.5 2H10" />
          </svg>
          {label}
        </>
      )}
    </button>
  );
}

export default CopyButton;
