import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

// Mock useOnlineStatus before importing the component
vi.mock('@/hooks/useOnlineStatus', () => ({
  useOnlineStatus: vi.fn(),
}));

// Mock LanguageContext
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key) => {
      const translations = {
        offlineBanner: 'You are offline. Some features may be unavailable.',
      };
      return translations[key] || key;
    },
  }),
}));

import OfflineBanner from '../OfflineBanner';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

describe('OfflineBanner', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should not render when online', () => {
    // Arrange
    useOnlineStatus.mockReturnValue(true);

    // Act
    const { container } = render(<OfflineBanner />);

    // Assert
    expect(container.innerHTML).toBe('');
  });

  it('should render banner when offline', () => {
    // Arrange
    useOnlineStatus.mockReturnValue(false);

    // Act
    render(<OfflineBanner />);

    // Assert
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(
      screen.getByText('You are offline. Some features may be unavailable.')
    ).toBeInTheDocument();
  });

  it('should have role="alert" for accessibility', () => {
    // Arrange
    useOnlineStatus.mockReturnValue(false);

    // Act
    render(<OfflineBanner />);

    // Assert
    const banner = screen.getByRole('alert');
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveAttribute('aria-live', 'assertive');
  });

  it('should display translated message text', () => {
    // Arrange
    useOnlineStatus.mockReturnValue(false);

    // Act
    render(<OfflineBanner />);

    // Assert
    expect(
      screen.getByText('You are offline. Some features may be unavailable.')
    ).toBeVisible();
  });
});
