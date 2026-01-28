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

    return (
      <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-red-800">
        <div className="font-semibold mb-1">Neco se pokazilo</div>
        <div className="text-sm opacity-90 mb-3">
          Komponenta spadla (casto to zpusobi velmi slozity model v 3D nahledu).
        </div>
        <div className="text-xs font-mono bg-white/60 border border-red-100 rounded p-2 mb-3 overflow-auto">
          {message}
        </div>
        <button
          type="button"
          onClick={this.handleReset}
          className="px-3 py-2 rounded-md border border-red-200 bg-white hover:bg-red-50"
        >
          Zkusit znovu
        </button>
      </div>
    );
  }
}
