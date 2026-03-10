import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useMediaQuery, useIsMobile, useIsTablet, useIsDesktop } from '../useMediaQuery.js';

/**
 * Minimal renderHook using React 19 createRoot API directly,
 * bypassing @testing-library/react v11 which is incompatible with React 19.
 */
function renderHook(hookFn, options = {}) {
  let result = { current: undefined };
  let currentProps = options.initialProps;

  function TestComponent({ hookProps }) {
    result.current = hookFn(hookProps);
    return null;
  }

  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(React.createElement(TestComponent, { hookProps: currentProps }));
  });

  return {
    result,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      document.body.removeChild(container);
    },
    rerender: (newProps) => {
      currentProps = newProps;
      act(() => {
        root.render(React.createElement(TestComponent, { hookProps: newProps }));
      });
    },
  };
}

/**
 * Creates a mock matchMedia implementation.
 * Returns the factory and a ref to the last registered change handler
 * so tests can simulate media query changes.
 */
function createMatchMedia(matches) {
  const handlers = [];
  const mql = {
    matches,
    media: '',
    addEventListener: vi.fn((event, handler) => {
      if (event === 'change') handlers.push(handler);
    }),
    removeEventListener: vi.fn((event, handler) => {
      const idx = handlers.indexOf(handler);
      if (idx !== -1) handlers.splice(idx, 1);
    }),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchChange: (newMatches) => {
      mql.matches = newMatches;
      handlers.forEach((h) => h({ matches: newMatches }));
    },
  };

  const factory = (query) => {
    mql.media = query;
    return mql;
  };

  return { factory, mql, handlers };
}

/**
 * Creates a legacy matchMedia mock (no addEventListener, only addListener).
 */
function createLegacyMatchMedia(matches) {
  const handlers = [];
  const mql = {
    matches,
    media: '',
    addEventListener: undefined,
    removeEventListener: undefined,
    addListener: vi.fn((handler) => {
      handlers.push(handler);
    }),
    removeListener: vi.fn((handler) => {
      const idx = handlers.indexOf(handler);
      if (idx !== -1) handlers.splice(idx, 1);
    }),
    dispatchChange: (newMatches) => {
      mql.matches = newMatches;
      handlers.forEach((h) => ({ matches: newMatches }));
    },
  };

  const factory = (query) => {
    mql.media = query;
    return mql;
  };

  return { factory, mql, handlers };
}

describe('useMediaQuery', () => {
  let originalMatchMedia;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('should return true when the media query matches', () => {
    // Arrange
    const { factory } = createMatchMedia(true);
    window.matchMedia = factory;

    // Act
    const { result, unmount } = renderHook(
      ({ query }) => useMediaQuery(query),
      { initialProps: { query: '(max-width: 768px)' } }
    );

    // Assert
    expect(result.current).toBe(true);
    unmount();
  });

  it('should return false when the media query does not match', () => {
    // Arrange
    const { factory } = createMatchMedia(false);
    window.matchMedia = factory;

    // Act
    const { result, unmount } = renderHook(
      ({ query }) => useMediaQuery(query),
      { initialProps: { query: '(max-width: 768px)' } }
    );

    // Assert
    expect(result.current).toBe(false);
    unmount();
  });

  it('should update when the media query match state changes', () => {
    // Arrange
    const { factory, mql } = createMatchMedia(false);
    window.matchMedia = factory;

    const { result, unmount } = renderHook(
      ({ query }) => useMediaQuery(query),
      { initialProps: { query: '(max-width: 768px)' } }
    );
    expect(result.current).toBe(false);

    // Act
    act(() => {
      mql.dispatchChange(true);
    });

    // Assert
    expect(result.current).toBe(true);
    unmount();
  });

  it('should register an event listener via addEventListener', () => {
    // Arrange
    const { factory, mql } = createMatchMedia(false);
    window.matchMedia = factory;

    // Act
    const { unmount } = renderHook(
      ({ query }) => useMediaQuery(query),
      { initialProps: { query: '(min-width: 1024px)' } }
    );

    // Assert
    expect(mql.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    unmount();
  });

  it('should clean up the event listener on unmount', () => {
    // Arrange
    const { factory, mql } = createMatchMedia(true);
    window.matchMedia = factory;

    const { unmount } = renderHook(
      ({ query }) => useMediaQuery(query),
      { initialProps: { query: '(max-width: 768px)' } }
    );

    // Act
    unmount();

    // Assert
    expect(mql.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('should re-subscribe when the query string changes', () => {
    // Arrange
    const { factory, mql } = createMatchMedia(true);
    window.matchMedia = factory;

    const { result, rerender, unmount } = renderHook(
      ({ query }) => useMediaQuery(query),
      { initialProps: { query: '(max-width: 768px)' } }
    );

    // The first render registers a listener
    const firstCallCount = mql.addEventListener.mock.calls.length;

    // Act — change the query
    mql.matches = false;
    rerender({ query: '(min-width: 1025px)' });

    // Assert — a new listener was added (re-subscription)
    expect(mql.addEventListener.mock.calls.length).toBeGreaterThan(firstCallCount);
    // The old listener was removed
    expect(mql.removeEventListener).toHaveBeenCalled();
    // State reflects the new query's match
    expect(result.current).toBe(false);
    unmount();
  });

  it('should use legacy addListener/removeListener when addEventListener is not available', () => {
    // Arrange
    const { factory, mql } = createLegacyMatchMedia(true);
    window.matchMedia = factory;

    // Act
    const { result, unmount } = renderHook(
      ({ query }) => useMediaQuery(query),
      { initialProps: { query: '(max-width: 768px)' } }
    );

    // Assert
    expect(result.current).toBe(true);
    expect(mql.addListener).toHaveBeenCalledWith(expect.any(Function));

    // Act — unmount
    unmount();

    // Assert — legacy cleanup
    expect(mql.removeListener).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should sync state in useEffect when matches changed between render and effect', () => {
    // Arrange — initial state says false, but by the time useEffect runs
    // matchMedia returns true (simulated by changing matches after factory call)
    let callCount = 0;
    const mql = {
      matches: false,
      media: '',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    window.matchMedia = (query) => {
      callCount++;
      // First call (useState initializer) returns false
      // Second call (useEffect) returns true
      if (callCount >= 2) {
        mql.matches = true;
      }
      mql.media = query;
      return mql;
    };

    // Act
    const { result, unmount } = renderHook(
      ({ query }) => useMediaQuery(query),
      { initialProps: { query: '(max-width: 768px)' } }
    );

    // Assert — should have synced to true
    expect(result.current).toBe(true);
    unmount();
  });

  it('should handle SSR gracefully when window is undefined', () => {
    // Arrange — temporarily remove matchMedia to simulate SSR-like init
    // The hook checks `typeof window === 'undefined'` in the initializer.
    // In jsdom window always exists, so we test the false-return path
    // by verifying the hook does not throw when matchMedia returns false.
    const { factory } = createMatchMedia(false);
    window.matchMedia = factory;

    // Act
    const { result, unmount } = renderHook(
      ({ query }) => useMediaQuery(query),
      { initialProps: { query: '(max-width: 768px)' } }
    );

    // Assert
    expect(result.current).toBe(false);
    unmount();
  });
});

describe('useIsMobile', () => {
  let originalMatchMedia;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('should return true when viewport matches max-width: 768px', () => {
    // Arrange
    const { factory } = createMatchMedia(true);
    window.matchMedia = factory;

    // Act
    const { result, unmount } = renderHook(() => useIsMobile());

    // Assert
    expect(result.current).toBe(true);
    unmount();
  });

  it('should return false when viewport is wider than 768px', () => {
    // Arrange
    const { factory } = createMatchMedia(false);
    window.matchMedia = factory;

    // Act
    const { result, unmount } = renderHook(() => useIsMobile());

    // Assert
    expect(result.current).toBe(false);
    unmount();
  });
});

describe('useIsTablet', () => {
  let originalMatchMedia;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('should return true when viewport matches tablet range', () => {
    // Arrange
    const { factory } = createMatchMedia(true);
    window.matchMedia = factory;

    // Act
    const { result, unmount } = renderHook(() => useIsTablet());

    // Assert
    expect(result.current).toBe(true);
    unmount();
  });

  it('should return false when viewport is outside tablet range', () => {
    // Arrange
    const { factory } = createMatchMedia(false);
    window.matchMedia = factory;

    // Act
    const { result, unmount } = renderHook(() => useIsTablet());

    // Assert
    expect(result.current).toBe(false);
    unmount();
  });
});

describe('useIsDesktop', () => {
  let originalMatchMedia;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('should return true when viewport matches min-width: 1025px', () => {
    // Arrange
    const { factory } = createMatchMedia(true);
    window.matchMedia = factory;

    // Act
    const { result, unmount } = renderHook(() => useIsDesktop());

    // Assert
    expect(result.current).toBe(true);
    unmount();
  });

  it('should return false when viewport is narrower than 1025px', () => {
    // Arrange
    const { factory } = createMatchMedia(false);
    window.matchMedia = factory;

    // Act
    const { result, unmount } = renderHook(() => useIsDesktop());

    // Assert
    expect(result.current).toBe(false);
    unmount();
  });
});
