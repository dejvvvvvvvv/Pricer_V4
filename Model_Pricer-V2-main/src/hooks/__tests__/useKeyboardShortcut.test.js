import { describe, it, expect, vi, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useKeyboardShortcut } from '../useKeyboardShortcut.js';

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
 * Helper to dispatch a keydown event on window.
 */
function fireKeydown(key, options = {}) {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ctrlKey: options.ctrlKey || false,
    metaKey: options.metaKey || false,
    shiftKey: options.shiftKey || false,
    altKey: options.altKey || false,
  });

  // Allow overriding event.target via Object.defineProperty
  if (options.target) {
    Object.defineProperty(event, 'target', {
      value: options.target,
      writable: false,
    });
  }

  window.dispatchEvent(event);
  return event;
}

describe('useKeyboardShortcut', () => {
  const containers = [];

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should call callback on matching key press', () => {
    // Arrange
    const callback = vi.fn();
    const { unmount } = renderHook(() => useKeyboardShortcut('s', callback));

    // Act
    fireKeydown('s');

    // Assert
    expect(callback).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('should not call callback on non-matching key press', () => {
    // Arrange
    const callback = vi.fn();
    const { unmount } = renderHook(() => useKeyboardShortcut('s', callback));

    // Act
    fireKeydown('a');
    fireKeydown('Escape');

    // Assert
    expect(callback).not.toHaveBeenCalled();
    unmount();
  });

  it('should require Ctrl when ctrlKey option is true', () => {
    // Arrange
    const callback = vi.fn();
    const { unmount } = renderHook(() => useKeyboardShortcut('s', callback, { ctrlKey: true }));

    // Act — without Ctrl, should not fire
    fireKeydown('s');
    expect(callback).not.toHaveBeenCalled();

    // Act — with Ctrl, should fire
    fireKeydown('s', { ctrlKey: true });
    expect(callback).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('should support metaKey as Ctrl equivalent', () => {
    // Arrange
    const callback = vi.fn();
    const { unmount } = renderHook(() => useKeyboardShortcut('s', callback, { ctrlKey: true }));

    // Act — with Meta (Cmd on Mac), should fire
    fireKeydown('s', { metaKey: true });

    // Assert
    expect(callback).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('should require Shift when shiftKey option is true', () => {
    // Arrange
    const callback = vi.fn();
    const { unmount } = renderHook(() => useKeyboardShortcut('n', callback, { shiftKey: true }));

    // Act — without Shift
    fireKeydown('n');
    expect(callback).not.toHaveBeenCalled();

    // Act — with Shift
    fireKeydown('n', { shiftKey: true });
    expect(callback).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('should require Alt when altKey option is true', () => {
    // Arrange
    const callback = vi.fn();
    const { unmount } = renderHook(() => useKeyboardShortcut('p', callback, { altKey: true }));

    // Act — without Alt
    fireKeydown('p');
    expect(callback).not.toHaveBeenCalled();

    // Act — with Alt
    fireKeydown('p', { altKey: true });
    expect(callback).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('should ignore events from INPUT elements by default', () => {
    // Arrange
    const callback = vi.fn();
    const { unmount } = renderHook(() => useKeyboardShortcut('s', callback));

    // Act
    const inputEl = document.createElement('input');
    fireKeydown('s', { target: inputEl });

    // Assert
    expect(callback).not.toHaveBeenCalled();
    unmount();
  });

  it('should ignore events from TEXTAREA elements by default', () => {
    // Arrange
    const callback = vi.fn();
    const { unmount } = renderHook(() => useKeyboardShortcut('s', callback));

    // Act
    const textarea = document.createElement('textarea');
    fireKeydown('s', { target: textarea });

    // Assert
    expect(callback).not.toHaveBeenCalled();
    unmount();
  });

  it('should ignore events from SELECT elements by default', () => {
    // Arrange
    const callback = vi.fn();
    const { unmount } = renderHook(() => useKeyboardShortcut('s', callback));

    // Act
    const select = document.createElement('select');
    fireKeydown('s', { target: select });

    // Assert
    expect(callback).not.toHaveBeenCalled();
    unmount();
  });

  it('should ignore events from contentEditable elements by default', () => {
    // Arrange
    const callback = vi.fn();
    const { unmount } = renderHook(() => useKeyboardShortcut('s', callback));

    // Act — jsdom does not implement isContentEditable, so we mock it on the target
    const div = document.createElement('div');
    div.contentEditable = 'true';
    Object.defineProperty(div, 'isContentEditable', { value: true });
    fireKeydown('s', { target: div });

    // Assert
    expect(callback).not.toHaveBeenCalled();
    unmount();
  });

  it('should allow events from inputs when allowInInputs is true', () => {
    // Arrange
    const callback = vi.fn();
    const { unmount } = renderHook(() => useKeyboardShortcut('Escape', callback, { allowInInputs: true }));

    // Act
    const inputEl = document.createElement('input');
    fireKeydown('Escape', { target: inputEl });

    // Assert
    expect(callback).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('should not call callback when disabled is true', () => {
    // Arrange
    const callback = vi.fn();
    const { unmount } = renderHook(() => useKeyboardShortcut('s', callback, { disabled: true }));

    // Act
    fireKeydown('s');

    // Assert
    expect(callback).not.toHaveBeenCalled();
    unmount();
  });

  it('should perform case-insensitive key matching', () => {
    // Arrange
    const callback = vi.fn();
    const { unmount } = renderHook(() => useKeyboardShortcut('s', callback));

    // Act — uppercase S
    fireKeydown('S');

    // Assert
    expect(callback).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('should call preventDefault on the event', () => {
    // Arrange
    const callback = vi.fn();
    const { unmount } = renderHook(() => useKeyboardShortcut('s', callback));

    // Act
    const preventSpy = vi.spyOn(KeyboardEvent.prototype, 'preventDefault');
    fireKeydown('s');

    // Assert
    expect(preventSpy).toHaveBeenCalled();
    unmount();
  });

  it('should clean up event listener on unmount', () => {
    // Arrange
    const callback = vi.fn();
    const { unmount } = renderHook(() => useKeyboardShortcut('s', callback));

    // Act
    unmount();
    fireKeydown('s');

    // Assert
    expect(callback).not.toHaveBeenCalled();
  });

  it('should pass the event object to the callback', () => {
    // Arrange
    const callback = vi.fn();
    const { unmount } = renderHook(() => useKeyboardShortcut('s', callback));

    // Act
    fireKeydown('s');

    // Assert
    expect(callback).toHaveBeenCalledWith(expect.any(KeyboardEvent));
    unmount();
  });
});
