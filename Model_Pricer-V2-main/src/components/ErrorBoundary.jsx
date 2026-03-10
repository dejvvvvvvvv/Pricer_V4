
import React from 'react';

/**
 * Application-level Error Boundary.
 *
 * Props:
 *   - onReset   (function)  Optional callback after error state is cleared.
 *   - module    (string)    Optional label for console logging (e.g. "AdminRoutes").
 *   - children  (node)      React subtree to protect.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, showDetails: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    const label = this.props.module || 'General';
    console.error(`[ErrorBoundary:${label}]`, error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, showDetails: false });
    if (typeof this.props.onReset === 'function') {
      this.props.onReset();
    }
  };

  toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const isDev = import.meta.env?.DEV;
    const message = this.state.error?.message || 'Unknown error';

    /* ---- Forge-token inline styles ---- */

    const containerStyle = {
      padding: '24px',
      margin: '16px',
      borderRadius: 'var(--forge-radius-lg, 8px)',
      border: '1px solid rgba(255, 71, 87, 0.25)',
      backgroundColor: 'rgba(255, 71, 87, 0.06)',
      color: 'var(--forge-text-primary, #E8ECF1)',
      fontFamily: 'var(--forge-font-body, system-ui, sans-serif)',
    };

    const iconRowStyle = {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '8px',
    };

    const titleStyle = {
      fontFamily: 'var(--forge-font-heading, system-ui, sans-serif)',
      fontWeight: 600,
      fontSize: 'var(--forge-text-xl, 1.25rem)',
      color: 'var(--forge-error, #FF4757)',
      margin: 0,
    };

    const descStyle = {
      fontSize: 'var(--forge-text-base, 0.875rem)',
      color: 'var(--forge-text-muted, #7A8291)',
      fontFamily: 'var(--forge-font-body, system-ui, sans-serif)',
      marginBottom: '16px',
      lineHeight: 1.5,
    };

    const codeStyle = {
      fontSize: 'var(--forge-text-sm, 0.75rem)',
      fontFamily: 'var(--forge-font-mono, monospace)',
      backgroundColor: 'var(--forge-bg-elevated, #161920)',
      border: '1px solid rgba(255, 71, 87, 0.15)',
      borderRadius: 'var(--forge-radius-sm, 4px)',
      padding: '10px 12px',
      marginBottom: '16px',
      overflow: 'auto',
      maxHeight: '200px',
      color: 'var(--forge-text-secondary, #9BA3B0)',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
    };

    const btnBaseStyle = {
      padding: '8px 16px',
      borderRadius: 'var(--forge-radius-sm, 4px)',
      fontSize: 'var(--forge-text-sm, 0.75rem)',
      fontWeight: 600,
      fontFamily: 'var(--forge-font-tech, monospace)',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      cursor: 'pointer',
      transition: 'background-color 150ms ease-out',
      border: 'none',
    };

    const resetBtnStyle = {
      ...btnBaseStyle,
      backgroundColor: 'var(--forge-error, #FF4757)',
      color: '#fff',
    };

    const detailsBtnStyle = {
      ...btnBaseStyle,
      backgroundColor: 'transparent',
      color: 'var(--forge-text-muted, #7A8291)',
      border: '1px solid var(--forge-border-default, #1E2230)',
      marginLeft: '8px',
    };

    const btnRowStyle = {
      display: 'flex',
      alignItems: 'center',
      gap: '0',
    };

    return (
      <div style={containerStyle} role="alert">
        <div style={iconRowStyle}>
          <svg
            width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke="var(--forge-error, #FF4757)" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h3 style={titleStyle}>Something went wrong</h3>
        </div>

        <p style={descStyle}>
          An unexpected error occurred while rendering this section.
          You can try again or reload the page.
        </p>

        <div style={btnRowStyle}>
          <button
            type="button"
            onClick={this.handleReset}
            style={resetBtnStyle}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
          >
            Try Again
          </button>

          {isDev && (
            <button
              type="button"
              onClick={this.toggleDetails}
              style={detailsBtnStyle}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--forge-bg-elevated, #161920)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              aria-expanded={this.state.showDetails}
            >
              {this.state.showDetails ? 'Hide Details' : 'Show Details'}
            </button>
          )}
        </div>

        {isDev && this.state.showDetails && (
          <div style={{ ...codeStyle, marginTop: '12px', marginBottom: 0 }}>
            {message}
            {this.state.error?.stack && (
              <>
                {'\n\n--- Stack ---\n'}
                {this.state.error.stack}
              </>
            )}
          </div>
        )}
      </div>
    );
  }
}

export default ErrorBoundary;
