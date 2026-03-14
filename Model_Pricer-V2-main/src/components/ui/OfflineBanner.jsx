import React, { useEffect, useRef, useState } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Banner shown at the bottom of the viewport when the user loses
 * internet connection. Disappears automatically when connectivity is restored.
 * Shows a brief "back online" confirmation for 2.5 seconds after reconnecting.
 *
 * Accessibility: uses role="alert" so screen readers announce the status change.
 */
export default function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const { t } = useLanguage();

  // Track whether the user was previously offline so we can show a "back online" flash.
  const wasOfflineRef = useRef(false);
  const [showOnlineFlash, setShowOnlineFlash] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      wasOfflineRef.current = true;
      setShowOnlineFlash(false);
    } else if (wasOfflineRef.current) {
      // Just came back online after being offline — show flash.
      setShowOnlineFlash(true);
      const timer = setTimeout(() => {
        setShowOnlineFlash(false);
        wasOfflineRef.current = false;
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  // Offline state
  if (!isOnline) {
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
        {t('offlineBanner')}
      </div>
    );
  }

  // Brief "back online" confirmation flash
  if (showOnlineFlash) {
    return (
      <div
        role="status"
        aria-live="polite"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '10px 16px',
          background: 'var(--forge-accent-primary, #2EDBA4)',
          color: 'var(--forge-bg-void, #08090C)',
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
          <polyline points="2,9 6,13 14,4" />
        </svg>
        {t('onlineBanner')}
      </div>
    );
  }

  return null;
}
