import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useCopyToClipboard } from '../useCopyToClipboard.js';

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

describe('useCopyToClipboard', () => {
  let originalClipboard;

  beforeEach(() => {
    vi.useFakeTimers();
    originalClipboard = navigator.clipboard;

    // Mock navigator.clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();

    // Restore original clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      writable: true,
      configurable: true,
    });
  });

  it('should have copied as false initially', () => {
    // Arrange & Act
    const { result, unmount } = renderHook(() => useCopyToClipboard());

    // Assert
    expect(result.current.copied).toBe(false);
    expect(typeof result.current.copyToClipboard).toBe('function');
    unmount();
  });

  it('should call navigator.clipboard.writeText on copy', async () => {
    // Arrange
    const { result, unmount } = renderHook(() => useCopyToClipboard());

    // Act
    let success;
    await act(async () => {
      success = await result.current.copyToClipboard('hello world');
    });

    // Assert
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('hello world');
    expect(success).toBe(true);
    unmount();
  });

  it('should set copied to true after successful copy', async () => {
    // Arrange
    const { result, unmount } = renderHook(() => useCopyToClipboard());

    // Act
    await act(async () => {
      await result.current.copyToClipboard('test text');
    });

    // Assert
    expect(result.current.copied).toBe(true);
    unmount();
  });

  it('should reset copied to false after default delay (2000ms)', async () => {
    // Arrange
    const { result, unmount } = renderHook(() => useCopyToClipboard());

    // Act - copy
    await act(async () => {
      await result.current.copyToClipboard('test');
    });
    expect(result.current.copied).toBe(true);

    // Act - advance time past default delay
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Assert
    expect(result.current.copied).toBe(false);
    unmount();
  });

  it('should not reset copied before the delay elapses', async () => {
    // Arrange
    const { result, unmount } = renderHook(() => useCopyToClipboard());

    // Act - copy
    await act(async () => {
      await result.current.copyToClipboard('test');
    });

    // Act - advance time but not enough
    act(() => {
      vi.advanceTimersByTime(1999);
    });

    // Assert - still true
    expect(result.current.copied).toBe(true);

    // Act - advance the remaining 1ms
    act(() => {
      vi.advanceTimersByTime(1);
    });

    // Assert - now false
    expect(result.current.copied).toBe(false);
    unmount();
  });

  it('should return true on successful copy', async () => {
    // Arrange
    const { result, unmount } = renderHook(() => useCopyToClipboard());

    // Act
    let returnValue;
    await act(async () => {
      returnValue = await result.current.copyToClipboard('success');
    });

    // Assert
    expect(returnValue).toBe(true);
    unmount();
  });

  it('should fall back to textarea method when clipboard API fails', async () => {
    // Arrange - make clipboard API throw
    navigator.clipboard.writeText = vi.fn().mockRejectedValue(new Error('Not allowed'));

    // Define and mock document.execCommand (not available in jsdom)
    document.execCommand = vi.fn().mockReturnValue(true);
    const execCommandSpy = document.execCommand;

    const { result, unmount } = renderHook(() => useCopyToClipboard());

    // Act
    let success;
    await act(async () => {
      success = await result.current.copyToClipboard('fallback text');
    });

    // Assert
    expect(execCommandSpy).toHaveBeenCalledWith('copy');
    expect(success).toBe(true);
    expect(result.current.copied).toBe(true);
    unmount();
  });

  it('should fall back to textarea method when clipboard API is unavailable', async () => {
    // Arrange - remove clipboard API entirely
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    // Define and mock document.execCommand (not available in jsdom)
    document.execCommand = vi.fn().mockReturnValue(true);
    const execCommandSpy = document.execCommand;

    const { result, unmount } = renderHook(() => useCopyToClipboard());

    // Act
    let success;
    await act(async () => {
      success = await result.current.copyToClipboard('no clipboard api');
    });

    // Assert
    expect(execCommandSpy).toHaveBeenCalledWith('copy');
    expect(success).toBe(true);
    expect(result.current.copied).toBe(true);
    unmount();
  });

  it('should return false when all copy methods fail', async () => {
    // Arrange - clipboard API throws, execCommand returns false
    navigator.clipboard.writeText = vi.fn().mockRejectedValue(new Error('Denied'));
    document.execCommand = vi.fn().mockReturnValue(false);

    const { result, unmount } = renderHook(() => useCopyToClipboard());

    // Act
    let success;
    await act(async () => {
      success = await result.current.copyToClipboard('will fail');
    });

    // Assert
    expect(success).toBe(false);
    expect(result.current.copied).toBe(false);
    unmount();
  });

  it('should support custom reset delay', async () => {
    // Arrange
    const { result, unmount } = renderHook(() => useCopyToClipboard({ resetDelay: 5000 }));

    // Act - copy
    await act(async () => {
      await result.current.copyToClipboard('custom delay');
    });
    expect(result.current.copied).toBe(true);

    // Act - advance 2000ms (default) - should still be true
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.copied).toBe(true);

    // Act - advance to 5000ms total
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // Assert - now false
    expect(result.current.copied).toBe(false);
    unmount();
  });

  it('should clear previous timer when copying again before reset', async () => {
    // Arrange
    const { result, unmount } = renderHook(() => useCopyToClipboard({ resetDelay: 2000 }));

    // Act - first copy
    await act(async () => {
      await result.current.copyToClipboard('first');
    });
    expect(result.current.copied).toBe(true);

    // Act - advance 1500ms (still true)
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(result.current.copied).toBe(true);

    // Act - second copy resets the timer
    await act(async () => {
      await result.current.copyToClipboard('second');
    });

    // Act - advance 1500ms from second copy (total 3000ms from first)
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    // Assert - should still be true because second copy reset the timer
    expect(result.current.copied).toBe(true);

    // Act - advance remaining 500ms
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Assert - now false (2000ms after second copy)
    expect(result.current.copied).toBe(false);
    unmount();
  });

  it('should clean up timer on unmount', async () => {
    // Arrange
    const { result, unmount } = renderHook(() => useCopyToClipboard());

    // Act - copy and then unmount before timer fires
    await act(async () => {
      await result.current.copyToClipboard('unmount test');
    });

    // Unmount - should not throw when timer fires
    unmount();

    // This should not cause errors (timer was cleaned up)
    act(() => {
      vi.advanceTimersByTime(5000);
    });
  });
});
