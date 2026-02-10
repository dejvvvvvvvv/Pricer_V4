import React from 'react';

/**
 * Simple Error Boundary to avoid "white screen" when a component crashes.
 * (In this page it mainly protects the 3D preview / heavy model parsing.)
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
    // Keep it silent for users, but log for dev.
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (typeof this.props.onReset === 'function') {
      this.props.onReset();
    }
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const message = this.state.error?.message || 'Neznama chyba';

    const containerStyle = {
      padding: '16px',
      borderRadius: 'var(--forge-radius-md)',
      border: '1px solid rgba(255, 71, 87, 0.2)',
      backgroundColor: 'rgba(255, 71, 87, 0.06)',
      color: 'var(--forge-text-primary)',
    };

    const titleStyle = {
      fontFamily: 'var(--forge-font-heading)',
      fontWeight: 600,
      fontSize: '14px',
      color: 'var(--forge-error)',
      marginBottom: '4px',
    };

    const descStyle = {
      fontSize: '13px',
      color: 'var(--forge-text-muted)',
      fontFamily: 'var(--forge-font-body)',
      marginBottom: '12px',
    };

    const codeStyle = {
      fontSize: '12px',
      fontFamily: 'var(--forge-font-mono)',
      backgroundColor: 'var(--forge-bg-elevated)',
      border: '1px solid rgba(255, 71, 87, 0.15)',
      borderRadius: 'var(--forge-radius-sm)',
      padding: '8px',
      marginBottom: '12px',
      overflow: 'auto',
      color: 'var(--forge-text-secondary)',
    };

    const btnStyle = {
      padding: '8px 14px',
      borderRadius: 'var(--forge-radius-sm)',
      border: '1px solid rgba(255, 71, 87, 0.2)',
      backgroundColor: 'var(--forge-bg-surface)',
      color: 'var(--forge-error)',
      fontSize: '12px',
      fontWeight: 600,
      fontFamily: 'var(--forge-font-tech)',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      cursor: 'pointer',
      transition: 'background-color 150ms ease-out',
    };

    return (
      <div style={containerStyle}>
        <div style={titleStyle}>Neco se pokazilo</div>
        <div style={descStyle}>
          Komponenta spadla (casto to zpusobi velmi slozity model v 3D nahledu).
        </div>
        <div style={codeStyle}>
          {message}
        </div>
        <button
          type="button"
          onClick={this.handleReset}
          style={btnStyle}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 71, 87, 0.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--forge-bg-surface)'; }}
        >
          Zkusit znovu
        </button>
      </div>
    );
  }
}
