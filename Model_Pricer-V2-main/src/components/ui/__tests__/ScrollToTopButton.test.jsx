import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import ScrollToTopButton from '../ScrollToTopButton.jsx';

describe('ScrollToTopButton', () => {
  let scrollToSpy;

  beforeEach(() => {
    // Mock window.scrollTo
    scrollToSpy = vi.fn();
    window.scrollTo = scrollToSpy;

    // Default scrollY to 0 (top of page)
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      configurable: true,
      value: 0,
    });
  });

  afterEach(() => {
    cleanup();
  });

  // ── Visibility ────────────────────────────────────────────────────

  it('should not render when scrollY is less than 400', () => {
    // Arrange & Act
    render(<ScrollToTopButton />);

    // Assert
    expect(screen.queryByRole('button', { name: /scroll to top/i })).not.toBeInTheDocument();
  });

  it('should become visible when scrolled past 400px', () => {
    // Arrange
    render(<ScrollToTopButton />);

    // Act — simulate scroll beyond threshold
    window.scrollY = 500;
    fireEvent.scroll(window);

    // Assert
    expect(screen.getByRole('button', { name: /scroll to top/i })).toBeInTheDocument();
  });

  it('should hide again when scrolled back above 400px', () => {
    // Arrange
    render(<ScrollToTopButton />);

    // Act — scroll down then back up
    window.scrollY = 600;
    fireEvent.scroll(window);
    expect(screen.getByRole('button', { name: /scroll to top/i })).toBeInTheDocument();

    window.scrollY = 100;
    fireEvent.scroll(window);

    // Assert
    expect(screen.queryByRole('button', { name: /scroll to top/i })).not.toBeInTheDocument();
  });

  // ── Click behavior ────────────────────────────────────────────────

  it('should call window.scrollTo with top 0 and smooth behavior when clicked', () => {
    // Arrange
    render(<ScrollToTopButton />);
    window.scrollY = 800;
    fireEvent.scroll(window);

    // Act
    fireEvent.click(screen.getByRole('button', { name: /scroll to top/i }));

    // Assert
    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  // ── Accessibility ─────────────────────────────────────────────────

  it('should have aria-label "Scroll to top" for accessibility', () => {
    // Arrange
    render(<ScrollToTopButton />);
    window.scrollY = 500;
    fireEvent.scroll(window);

    // Act & Assert
    const button = screen.getByRole('button', { name: /scroll to top/i });
    expect(button).toHaveAttribute('aria-label', 'Scroll to top');
  });

  // ── Cleanup ───────────────────────────────────────────────────────

  it('should clean up scroll event listener on unmount', () => {
    // Arrange
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = render(<ScrollToTopButton />);

    // Verify listener was added
    expect(addSpy).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });

    // Act
    unmount();

    // Assert — removeEventListener was called with the same handler reference
    const addedHandler = addSpy.mock.calls.find(c => c[0] === 'scroll')[1];
    expect(removeSpy).toHaveBeenCalledWith('scroll', addedHandler);

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
