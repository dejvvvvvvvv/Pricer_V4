import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useDocumentTitle } from '../useDocumentTitle.js';

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

describe('useDocumentTitle', () => {
  let originalTitle;

  beforeEach(() => {
    originalTitle = document.title;
    document.title = 'Original Title';
  });

  afterEach(() => {
    document.title = originalTitle;
  });

  it('should set document.title with default suffix "ModelPricer"', () => {
    // Arrange & Act
    const { unmount } = renderHook(
      ({ title }) => useDocumentTitle(title),
      { initialProps: { title: 'Pricing Plans' } }
    );

    // Assert
    expect(document.title).toBe('Pricing Plans | ModelPricer');
    unmount();
  });

  it('should set document.title with a custom suffix', () => {
    // Arrange & Act
    const { unmount } = renderHook(
      ({ title, suffix }) => useDocumentTitle(title, suffix),
      { initialProps: { title: 'Dashboard', suffix: 'MyApp' } }
    );

    // Assert
    expect(document.title).toBe('Dashboard | MyApp');
    unmount();
  });

  it('should show only the suffix when title is empty string', () => {
    // Arrange & Act
    const { unmount } = renderHook(
      ({ title }) => useDocumentTitle(title),
      { initialProps: { title: '' } }
    );

    // Assert
    expect(document.title).toBe('ModelPricer');
    unmount();
  });

  it('should show only the suffix when title is null (falsy)', () => {
    // Arrange & Act
    const { unmount } = renderHook(
      ({ title }) => useDocumentTitle(title),
      { initialProps: { title: null } }
    );

    // Assert
    expect(document.title).toBe('ModelPricer');
    unmount();
  });

  it('should restore previous title on unmount', () => {
    // Arrange
    const { unmount } = renderHook(
      ({ title }) => useDocumentTitle(title),
      { initialProps: { title: 'Test Page' } }
    );
    expect(document.title).toBe('Test Page | ModelPricer');

    // Act
    unmount();

    // Assert
    expect(document.title).toBe('Original Title');
  });

  it('should update title when the title prop changes', () => {
    // Arrange
    const { rerender, unmount } = renderHook(
      ({ title }) => useDocumentTitle(title),
      { initialProps: { title: 'Page A' } }
    );
    expect(document.title).toBe('Page A | ModelPricer');

    // Act
    rerender({ title: 'Page B' });

    // Assert
    expect(document.title).toBe('Page B | ModelPricer');
    unmount();
  });

  it('should update title when the suffix prop changes', () => {
    // Arrange
    const { rerender, unmount } = renderHook(
      ({ title, suffix }) => useDocumentTitle(title, suffix),
      { initialProps: { title: 'Home', suffix: 'App1' } }
    );
    expect(document.title).toBe('Home | App1');

    // Act
    rerender({ title: 'Home', suffix: 'App2' });

    // Assert
    expect(document.title).toBe('Home | App2');
    unmount();
  });
});
