import React from 'react';

/**
 * Sentry module name stored as a variable so Rollup/Vite cannot resolve it
 * statically — the build succeeds even when @sentry/react is not installed.
 */
const SENTRY_MODULE = '@sentry/' + 'react';

/**
 * Simple Error Boundary for the widget embed.
 * Uses Forge CSS vars (no Tailwind — widget does not load Tailwind).
 * Protects against crashes in the 3D preview and heavy model parsing.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('[Widget:ErrorBoundary]', error, info);

    // Report to Sentry if available (dynamic import — never blocks rendering)
    import(/* @vite-ignore */ SENTRY_MODULE)
      .then((Sentry) => {
        Sentry.withScope((scope) => {
          scope.setTag('errorBoundary', 'Widget');
          scope.setExtra('componentStack', info?.componentStack);
          Sentry.captureException(error);
        });
      })
      .catch(() => {
        // @sentry/react not installed — no-op
      });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (typeof this.props.onReset === 'function') {
      this.props.onReset();
    }
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const isDev = import.meta.env?.DEV;
    const message = this.state.error?.message || 'Neznama chyba';

    return (
      <div
        style={{
          padding: '16px',
          borderRadius: 'var(--forge-radius-md, 6px)',
          border: '1px solid rgba(255, 71, 87, 0.2)',
          backgroundColor: 'rgba(255, 71, 87, 0.06)',
          color: 'var(--forge-text-primary, #E8ECF1)',
          fontFamily: 'var(--forge-font-body, system-ui, sans-serif)',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--forge-font-heading, system-ui, sans-serif)',
            fontWeight: 600,
            fontSize: '14px',
            color: 'var(--forge-error, #FF4757)',
            marginBottom: '4px',
          }}
        >
          Neco se pokazilo
        </div>
        <div
          style={{
            fontSize: '13px',
            color: 'var(--forge-text-muted, #7A8291)',
            fontFamily: 'var(--forge-font-body, system-ui, sans-serif)',
            marginBottom: '12px',
          }}
        >
          Komponenta spadla. Zkuste to znovu.
        </div>
        {isDev && (
          <div
            style={{
              fontSize: '12px',
              fontFamily: 'var(--forge-font-mono, monospace)',
              backgroundColor: 'var(--forge-bg-elevated, #161920)',
              border: '1px solid rgba(255, 71, 87, 0.15)',
              borderRadius: 'var(--forge-radius-sm, 4px)',
              padding: '8px',
              marginBottom: '12px',
              overflow: 'auto',
              color: 'var(--forge-text-secondary, #9BA3B0)',
            }}
          >
            {message}
          </div>
        )}
        <button
          type="button"
          onClick={this.handleReset}
          style={{
            padding: '8px 14px',
            borderRadius: 'var(--forge-radius-sm, 4px)',
            border: '1px solid rgba(255, 71, 87, 0.2)',
            backgroundColor: 'var(--forge-bg-surface, #111318)',
            color: 'var(--forge-error, #FF4757)',
            fontSize: '12px',
            fontWeight: 600,
            fontFamily: 'var(--forge-font-tech, monospace)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            cursor: 'pointer',
            transition: 'background-color 150ms ease-out',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 71, 87, 0.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--forge-bg-surface, #111318)'; }}
        >
          Zkusit znovu
        </button>
      </div>
    );
  }
}
