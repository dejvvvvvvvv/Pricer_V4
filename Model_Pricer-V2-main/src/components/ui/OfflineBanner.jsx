import React from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Persistent banner shown at the bottom of the viewport when the user loses
 * internet connection. Disappears automatically when connectivity is restored.
 *
 * Accessibility: uses role="alert" so screen readers announce the status change.
 */
export default function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const { t } = useLanguage();

  if (isOnline) return null;

  const label = t('offlineBanner');

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '10px 16px',
        background: 'var(--forge-accent-orange, #FF8C42)',
        color: '#000',
        textAlign: 'center',
        fontSize: '0.875rem',
        fontWeight: 600,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="8" cy="8" r="7" />
        <path d="M8 4v5M8 11v1" />
      </svg>
      {label}
    </div>
  );
}
