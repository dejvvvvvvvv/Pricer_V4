import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  onNetworkError,
  emitNetworkError,
  clearAllListeners,
} from '../networkEvents.js';

describe('networkEvents', () => {
  // emitNetworkError debounces within 2s using Date.now().
  // The module-level lastEmitTime persists across tests, so each test
  // must start with a fake time well past the previous test's emissions.
  // We use an incrementing base so tests never overlap.
  let testIndex = 0;

  beforeEach(() => {
    clearAllListeners();
    vi.useFakeTimers();
    // Each test starts 100s apart — far exceeding the 2s debounce
    testIndex += 1;
    vi.setSystemTime(testIndex * 100_000);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── onNetworkError + emitNetworkError ─────────────────────────────

  describe('emitNetworkError', () => {
    it('should call registered listener with the error object', () => {
      // Arrange
      const listener = vi.fn();
      onNetworkError(listener);
      const error = new Error('Connection refused');

      // Act
      emitNetworkError(error);

      // Assert
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(error);
    });

    it('should call multiple listeners with the same error', () => {
      // Arrange
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      const listener3 = vi.fn();
      onNetworkError(listener1);
      onNetworkError(listener2);
      onNetworkError(listener3);
      const error = { status: 500, message: 'Internal Server Error' };

      // Act
      emitNetworkError(error);

      // Assert
      expect(listener1).toHaveBeenCalledWith(error);
      expect(listener2).toHaveBeenCalledWith(error);
      expect(listener3).toHaveBeenCalledWith(error);
    });

    it('should not throw when emitting with no listeners', () => {
      // Act & Assert
      expect(() => emitNetworkError(new Error('no listeners'))).not.toThrow();
    });

    it('should handle listener errors gracefully without affecting other listeners', () => {
      // Arrange
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const listener1 = vi.fn();
      const throwingListener = vi.fn(() => {
        throw new Error('Listener crashed');
      });
      const listener3 = vi.fn();

      onNetworkError(listener1);
      onNetworkError(throwingListener);
      onNetworkError(listener3);

      const error = new Error('Network timeout');

      // Act
      emitNetworkError(error);

      // Assert — all listeners were called despite the throwing one
      expect(listener1).toHaveBeenCalledWith(error);
      expect(throwingListener).toHaveBeenCalledWith(error);
      expect(listener3).toHaveBeenCalledWith(error);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);

      consoleErrorSpy.mockRestore();
    });
  });

  // ── Unsubscribe ───────────────────────────────────────────────────

  describe('unsubscribe', () => {
    it('should remove the listener so it is not called on subsequent emits', () => {
      // Arrange
      const listener = vi.fn();
      const unsubscribe = onNetworkError(listener);

      // Act
      unsubscribe();
      emitNetworkError(new Error('should not reach listener'));

      // Assert
      expect(listener).not.toHaveBeenCalled();
    });

    it('should only remove the specific listener, not others', () => {
      // Arrange
      const listenerA = vi.fn();
      const listenerB = vi.fn();
      const unsubA = onNetworkError(listenerA);
      onNetworkError(listenerB);

      // Act
      unsubA();
      emitNetworkError(new Error('test'));

      // Assert
      expect(listenerA).not.toHaveBeenCalled();
      expect(listenerB).toHaveBeenCalledTimes(1);
    });

    it('should be safe to call unsubscribe multiple times', () => {
      // Arrange
      const listener = vi.fn();
      const unsubscribe = onNetworkError(listener);

      // Act & Assert — no error on double unsubscribe
      unsubscribe();
      expect(() => unsubscribe()).not.toThrow();
    });
  });

  // ── Debounce behavior ─────────────────────────────────────────────

  describe('debounce', () => {
    it('should drop rapid-fire emits within the 2s debounce window', () => {
      // Arrange
      const listener = vi.fn();
      onNetworkError(listener);

      // Act — emit twice in rapid succession (within 2s)
      emitNetworkError(new Error('first'));
      emitNetworkError(new Error('second — should be dropped'));

      // Assert
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ message: 'first' }));
    });

    it('should emit again after the debounce window passes', () => {
      // Arrange
      const listener = vi.fn();
      onNetworkError(listener);

      // Act — first emit
      emitNetworkError(new Error('first'));

      // Advance past debounce window
      vi.advanceTimersByTime(2001);

      // Second emit — should go through
      emitNetworkError(new Error('second'));

      // Assert
      expect(listener).toHaveBeenCalledTimes(2);
      expect(listener).toHaveBeenNthCalledWith(1, expect.objectContaining({ message: 'first' }));
      expect(listener).toHaveBeenNthCalledWith(2, expect.objectContaining({ message: 'second' }));
    });
  });

  // ── clearAllListeners ─────────────────────────────────────────────

  describe('clearAllListeners', () => {
    it('should remove all listeners', () => {
      // Arrange
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      onNetworkError(listener1);
      onNetworkError(listener2);

      // Act
      clearAllListeners();
      emitNetworkError(new Error('cleared'));

      // Assert
      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
    });
  });
});
