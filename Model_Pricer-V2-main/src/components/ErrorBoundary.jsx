
import React from 'react';

/**
 * Sentry module name stored as a variable so Rollup/Vite cannot resolve it
 * statically — the build succeeds even when @sentry/react is not installed.
 */
const SENTRY_MODULE = '@sentry/' + 'react';

/**
 * Application-level Error Boundary.
 *
 * Props:
 *   - onReset   (function)  Optional callback after error state is cleared.
 *   - module    (string)    Optional label for console logging (e.g. "AdminRoutes").
 *   - fullPage  (boolean)   If true, renders a centered full-page error instead of inline card.
 *   - children  (node)      React subtree to protect.
 *
 * Bilingual (CS/EN) — detects from <html lang> or defaults to Czech.
 */

const TEXTS = {
  cs: {
    title: 'Neco se pokazilo',
    description: 'Doslo k neocekavane chybe pri zobrazovani teto sekce. Muzete to zkusit znovu nebo obnovit stranku.',
    descriptionFull: 'Doslo k neocekavane chybe. Zkuste obnovit stranku nebo se vracte na hlavni stranku.',
    tryAgain: 'Zkusit znovu',
    reload: 'Obnovit stranku',
    goHome: 'Zpet na hlavni stranku',
    report: 'Nahlasit chybu',
    showDetails: 'Zobrazit detaily',
    hideDetails: 'Skryt detaily',
    reportSubject: 'Hlaseni chyby - ModelPricer',
    reportBody: 'Popis chyby:\n\nModul: {module}\nChyba: {error}\nURL: {url}\nCas: {time}\n\n--- Stack ---\n{stack}',
  },
  en: {
    title: 'Something went wrong',
    description: 'An unexpected error occurred while rendering this section. You can try again or reload the page.',
    descriptionFull: 'An unexpected error occurred. Try reloading the page or go back to the home page.',
    tryAgain: 'Try Again',
    reload: 'Reload Page',
    goHome: 'Back to Home',
    report: 'Report Error',
    showDetails: 'Show Details',
    hideDetails: 'Hide Details',
    reportSubject: 'Error Report - ModelPricer',
    reportBody: 'Error description:\n\nModule: {module}\nError: {error}\nURL: {url}\nTime: {time}\n\n--- Stack ---\n{stack}',
  },
};

function getLang() {
  try {
    const htmlLang = document.documentElement?.lang;
    if (htmlLang && htmlLang.startsWith('en')) return 'en';
  } catch {
    // SSR or no document
  }
  return 'cs';
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, showDetails: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    const label = this.props.module || 'General';
    console.error(`[ErrorBoundary:${label}]`, error, errorInfo);
    this.setState({ errorInfo });

    // Report to Sentry if available (dynamic import — never blocks rendering)
    import(/* @vite-ignore */ SENTRY_MODULE)
      .then((Sentry) => {
        Sentry.withScope((scope) => {
          scope.setTag('errorBoundary', label);
          scope.setExtra('componentStack', errorInfo?.componentStack);
          Sentry.captureException(error);
        });
      })
      .catch(() => {
        // @sentry/react not installed — no-op
      });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false });
    if (typeof this.props.onReset === 'function') {
      this.props.onReset();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReport = () => {
    const lang = getLang();
    const t = TEXTS[lang];
    const module = this.props.module || 'General';
    const errorMsg = this.state.error?.message || 'Unknown';
    const stack = this.state.error?.stack || '';
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const time = new Date().toISOString();

    const body = t.reportBody
      .replace('{module}', module)
      .replace('{error}', errorMsg)
      .replace('{url}', url)
      .replace('{time}', time)
      .replace('{stack}', stack);

    const mailto = `mailto:support@modelpricer.com?subject=${encodeURIComponent(t.reportSubject)}&body=${encodeURIComponent(body)}`;
    window.open(mailto, '_blank');
  };

  toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const isDev = import.meta.env?.DEV;
    const message = this.state.error?.message || 'Unknown error';
    const isFullPage = this.props.fullPage;
    const lang = getLang();
    const t = TEXTS[lang];

    /* ---- Forge-token inline styles ---- */

    const fullPageWrapper = {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'var(--forge-bg-void, #08090C)',
    };

    const containerStyle = {
      padding: isFullPage ? '48px 40px' : '24px',
      margin: isFullPage ? '0 auto' : '16px',
      maxWidth: isFullPage ? '560px' : 'none',
      width: isFullPage ? '100%' : 'auto',
      borderRadius: 'var(--forge-radius-lg, 8px)',
      border: '1px solid rgba(255, 71, 87, 0.25)',
      backgroundColor: isFullPage
        ? 'var(--forge-bg-surface, #111318)'
        : 'rgba(255, 71, 87, 0.06)',
      color: 'var(--forge-text-primary, #E8ECF1)',
      fontFamily: 'var(--forge-font-body, system-ui, sans-serif)',
      textAlign: isFullPage ? 'center' : 'left',
    };

    const iconStyle = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: isFullPage ? 'center' : 'flex-start',
      gap: '10px',
      marginBottom: isFullPage ? '16px' : '8px',
    };

    const errorCodeStyle = isFullPage ? {
      fontFamily: 'var(--forge-font-mono, monospace)',
      fontSize: 'clamp(48px, 10vw, 80px)',
      fontWeight: 700,
      color: 'var(--forge-error, #FF4757)',
      opacity: 0.15,
      lineHeight: 1,
      letterSpacing: '-0.04em',
      userSelect: 'none',
      marginBottom: '-8px',
    } : null;

    const titleStyle = {
      fontFamily: 'var(--forge-font-heading, system-ui, sans-serif)',
      fontWeight: 700,
      fontSize: isFullPage
        ? 'var(--forge-text-2xl, 1.5rem)'
        : 'var(--forge-text-xl, 1.25rem)',
      color: isFullPage
        ? 'var(--forge-text-primary, #E8ECF1)'
        : 'var(--forge-error, #FF4757)',
      margin: 0,
    };

    const descStyle = {
      fontSize: 'var(--forge-text-base, 0.875rem)',
      color: 'var(--forge-text-muted, #7A8291)',
      fontFamily: 'var(--forge-font-body, system-ui, sans-serif)',
      marginBottom: '24px',
      marginTop: '8px',
      lineHeight: 1.6,
      maxWidth: isFullPage ? '420px' : 'none',
      marginLeft: isFullPage ? 'auto' : undefined,
      marginRight: isFullPage ? 'auto' : undefined,
    };

    const codeStyle = {
      fontSize: 'var(--forge-text-sm, 0.75rem)',
      fontFamily: 'var(--forge-font-mono, monospace)',
      backgroundColor: 'var(--forge-bg-elevated, #161920)',
      border: '1px solid rgba(255, 71, 87, 0.15)',
      borderRadius: 'var(--forge-radius-sm, 4px)',
      padding: '10px 12px',
      overflow: 'auto',
      maxHeight: '200px',
      color: 'var(--forge-text-secondary, #9BA3B0)',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      textAlign: 'left',
    };

    const btnBaseStyle = {
      padding: '10px 20px',
      borderRadius: 'var(--forge-radius-sm, 4px)',
      fontSize: 'var(--forge-text-sm, 0.75rem)',
      fontWeight: 600,
      fontFamily: 'var(--forge-font-tech, monospace)',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      cursor: 'pointer',
      transition: 'all 150ms ease-out',
      border: 'none',
      textDecoration: 'none',
    };

    const primaryBtnStyle = {
      ...btnBaseStyle,
      backgroundColor: 'var(--forge-accent-primary, #2EDBA4)',
      color: 'var(--forge-bg-void, #08090C)',
    };

    const errorBtnStyle = {
      ...btnBaseStyle,
      backgroundColor: 'var(--forge-error, #FF4757)',
      color: '#fff',
    };

    const outlineBtnStyle = {
      ...btnBaseStyle,
      backgroundColor: 'transparent',
      color: 'var(--forge-text-muted, #7A8291)',
      border: '1px solid var(--forge-border-default, #1E2230)',
    };

    const ghostBtnStyle = {
      ...btnBaseStyle,
      backgroundColor: 'transparent',
      color: 'var(--forge-text-muted, #7A8291)',
      border: 'none',
      padding: '8px 12px',
      fontSize: '0.7rem',
    };

    const btnRowStyle = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: isFullPage ? 'center' : 'flex-start',
      gap: '8px',
      flexWrap: 'wrap',
    };

    const dividerStyle = {
      borderTop: '1px solid var(--forge-border-default, #1E2230)',
      marginTop: '20px',
      paddingTop: '16px',
      display: 'flex',
      justifyContent: isFullPage ? 'center' : 'flex-start',
      gap: '16px',
      flexWrap: 'wrap',
    };

    const errorIcon = (
      <svg
        width={isFullPage ? 28 : 22}
        height={isFullPage ? 28 : 22}
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--forge-error, #FF4757)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    );

    const content = (
      <div style={containerStyle} role="alert">
        {isFullPage && (
          <div style={errorCodeStyle} aria-hidden="true">!</div>
        )}

        <div style={iconStyle}>
          {!isFullPage && errorIcon}
          <h3 style={titleStyle}>{t.title}</h3>
        </div>

        <p style={descStyle}>
          {isFullPage ? t.descriptionFull : t.description}
        </p>

        <div style={btnRowStyle}>
          {isFullPage ? (
            <>
              <button
                type="button"
                onClick={this.handleReload}
                style={primaryBtnStyle}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
              >
                {t.reload}
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                style={outlineBtnStyle}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--forge-bg-elevated, #161920)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                {t.goHome}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={this.handleReset}
                style={errorBtnStyle}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
              >
                {t.tryAgain}
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                style={outlineBtnStyle}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--forge-bg-elevated, #161920)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                {t.reload}
              </button>
            </>
          )}
        </div>

        <div style={dividerStyle}>
          <button
            type="button"
            onClick={this.handleReport}
            style={ghostBtnStyle}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--forge-text-secondary, #9BA3B0)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--forge-text-muted, #7A8291)'; }}
          >
            {/* mail icon */}
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              aria-hidden="true"
              style={{ verticalAlign: 'middle', marginRight: '6px', marginTop: '-2px' }}
            >
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M22 7l-10 7L2 7" />
            </svg>
            {t.report}
          </button>

          {isDev && (
            <button
              type="button"
              onClick={this.toggleDetails}
              style={ghostBtnStyle}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--forge-text-secondary, #9BA3B0)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--forge-text-muted, #7A8291)'; }}
              aria-expanded={this.state.showDetails}
            >
              {this.state.showDetails ? t.hideDetails : t.showDetails}
            </button>
          )}

          {!isFullPage && (
            <button
              type="button"
              onClick={this.handleGoHome}
              style={ghostBtnStyle}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--forge-text-secondary, #9BA3B0)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--forge-text-muted, #7A8291)'; }}
            >
              {t.goHome}
            </button>
          )}
        </div>

        {isDev && this.state.showDetails && (
          <div style={{ ...codeStyle, marginTop: '12px' }}>
            <strong>Module:</strong> {this.props.module || 'General'}{'\n'}
            <strong>Error:</strong> {message}
            {this.state.error?.stack && (
              <>
                {'\n\n--- Stack ---\n'}
                {this.state.error.stack}
              </>
            )}
            {this.state.errorInfo?.componentStack && (
              <>
                {'\n\n--- Component Stack ---\n'}
                {this.state.errorInfo.componentStack}
              </>
            )}
          </div>
        )}
      </div>
    );

    if (isFullPage) {
      return <div style={fullPageWrapper}>{content}</div>;
    }

    return content;
  }
}

export default ErrorBoundary;
