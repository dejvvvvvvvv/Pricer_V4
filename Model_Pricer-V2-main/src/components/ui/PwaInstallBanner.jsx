import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { LanguageContext } from '@/contexts/LanguageContext';

/**
 * Subtle, dismissible banner shown when the browser fires the
 * `beforeinstallprompt` event (PWA install available).
 *
 * - Only shows once per session (sessionStorage guard).
 * - Positioned at the top of the viewport, below any fixed header.
 * - Styled with Forge dark theme tokens.
 *
 * NOTE: This component is rendered outside LanguageProvider in App.jsx,
 * so we use useContext directly with a fallback instead of useLanguage().
 */
export default function PwaInstallBanner() {
  const langCtx = useContext(LanguageContext);
  const t = (cs, en) => (langCtx?.language === 'en' ? en : cs);
  const [visible, setVisible] = useState(false);
  const deferredPromptRef = useRef(null);

  useEffect(() => {
    // Don't show if already dismissed this session
    if (sessionStorage.getItem('pwa-install-dismissed')) return;

    const handler = (e) => {
      // Prevent the default mini-infobar on mobile
      e.preventDefault();
      deferredPromptRef.current = e;
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = useCallback(async () => {
    const prompt = deferredPromptRef.current;
    if (!prompt) return;

    prompt.prompt();
    await prompt.userChoice;
    deferredPromptRef.current = null;
    setVisible(false);
    sessionStorage.setItem('pwa-install-dismissed', '1');
  }, []);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    sessionStorage.setItem('pwa-install-dismissed', '1');
  }, []);

  if (!visible) return null;

  return (
    <div
      role="banner"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        padding: '8px 16px',
        background: 'var(--forge-surface-2, #14161A)',
        borderBottom: '1px solid var(--forge-border, #23262D)',
        fontSize: '0.875rem',
        color: 'var(--forge-text-primary, #E4E7EC)',
        fontFamily: 'var(--forge-font-body, system-ui, sans-serif)',
      }}
    >
      {/* Download icon */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="var(--forge-accent-teal, #2DD4BF)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M8 2v9M4 8l4 4 4-4" />
        <path d="M2 14h12" />
      </svg>

      <span>{t('Nainstalovat aplikaci pro rychlejší přístup', 'Install app for faster access')}</span>

      <button
        onClick={handleInstall}
        style={{
          padding: '4px 12px',
          borderRadius: '6px',
          border: 'none',
          background: 'var(--forge-accent-teal, #2DD4BF)',
          color: '#08090C',
          fontSize: '0.8125rem',
          fontWeight: 600,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
        aria-label={t('Nainstalovat', 'Install')}
      >
        {t('Nainstalovat', 'Install')}
      </button>

      <button
        onClick={handleDismiss}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4px',
          border: 'none',
          background: 'transparent',
          color: 'var(--forge-text-muted, #7A8291)',
          cursor: 'pointer',
          borderRadius: '4px',
        }}
        aria-label={t('Zavřít', 'Dismiss')}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M2 2l10 10M12 2L2 12" />
        </svg>
      </button>
    </div>
  );
}
