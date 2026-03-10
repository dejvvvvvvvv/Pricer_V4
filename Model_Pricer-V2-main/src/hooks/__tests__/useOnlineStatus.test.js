import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOnlineStatus } from '../useOnlineStatus';

describe('useOnlineStatus', () => {
  let originalOnLine;

  beforeEach(() => {
    originalOnLine = navigator.onLine;
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'onLine', {
      value: originalOnLine,
      writable: true,
      configurable: true,
    });
  });

  it('should return true when navigator.onLine is true', () => {
    // Arrange
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
      configurable: true,
    });

    // Act
    const { result } = renderHook(() => useOnlineStatus());

    // Assert
    expect(result.current).toBe(true);
  });

  it('should return false when navigator.onLine is false', () => {
    // Arrange
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      writable: true,
      configurable: true,
    });

    // Act
    const { result } = renderHook(() => useOnlineStatus());

    // Assert
    expect(result.current).toBe(false);
  });

  it('should update to false on offline event', () => {
    // Arrange
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
      configurable: true,
    });
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);

    // Act
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    // Assert
    expect(result.current).toBe(false);
  });

  it('should update to true on online event', () => {
    // Arrange
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      writable: true,
      configurable: true,
    });
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(false);

    // Act
    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    // Assert
    expect(result.current).toBe(true);
  });

  it('should clean up event listeners on unmount', () => {
    // Arrange
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    // Act
    const { unmount } = renderHook(() => useOnlineStatus());

    // Assert — listeners were added
    expect(addSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(addSpy).toHaveBeenCalledWith('offline', expect.any(Function));

    // Act — unmount
    unmount();

    // Assert — listeners were removed
    expect(removeSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('offline', expect.any(Function));

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
