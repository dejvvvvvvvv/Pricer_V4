import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { useLocation } from 'react-router-dom';
import { ForgeBreadcrumb } from '../ForgeBreadcrumb.jsx';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: vi.fn(),
    Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>,
  };
});

describe('ForgeBreadcrumb', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return null for single-segment paths like /admin', () => {
    // Arrange
    useLocation.mockReturnValue({ pathname: '/admin' });

    // Act
    const { container } = render(<ForgeBreadcrumb />);

    // Assert
    expect(container.innerHTML).toBe('');
  });

  it('should render breadcrumb for /admin/pricing with "Admin / Pricing"', () => {
    // Arrange
    useLocation.mockReturnValue({ pathname: '/admin/pricing' });

    // Act
    render(<ForgeBreadcrumb />);

    // Assert
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Pricing')).toBeInTheDocument();
  });

  it('should render three levels for /admin/orders/detail', () => {
    // Arrange
    useLocation.mockReturnValue({ pathname: '/admin/orders/detail' });

    // Act
    render(<ForgeBreadcrumb />);

    // Assert
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Orders')).toBeInTheDocument();
    expect(screen.getByText('Detail')).toBeInTheDocument();
  });

  it('should set aria-current="page" on the last segment', () => {
    // Arrange
    useLocation.mockReturnValue({ pathname: '/admin/pricing' });

    // Act
    render(<ForgeBreadcrumb />);

    // Assert
    const lastSegment = screen.getByText('Pricing');
    expect(lastSegment).toHaveAttribute('aria-current', 'page');
  });

  it('should render non-last segments as links', () => {
    // Arrange
    useLocation.mockReturnValue({ pathname: '/admin/pricing' });

    // Act
    render(<ForgeBreadcrumb />);

    // Assert
    const adminLink = screen.getByText('Admin');
    expect(adminLink.tagName).toBe('A');
    expect(adminLink).toHaveAttribute('href', '/admin');
  });

  it('should map known routes correctly via ROUTE_LABELS', () => {
    // Arrange
    useLocation.mockReturnValue({ pathname: '/admin/model-storage' });

    // Act
    render(<ForgeBreadcrumb />);

    // Assert — "model-storage" maps to "Model Storage"
    expect(screen.getByText('Model Storage')).toBeInTheDocument();
  });

  it('should capitalize unknown segments as fallback', () => {
    // Arrange
    useLocation.mockReturnValue({ pathname: '/admin/some-unknown-page' });

    // Act
    render(<ForgeBreadcrumb />);

    // Assert — unknown segment shows raw text with first char uppercased
    expect(screen.getByText('Some-unknown-page')).toBeInTheDocument();
  });

  it('should have nav element with aria-label="Breadcrumb"', () => {
    // Arrange
    useLocation.mockReturnValue({ pathname: '/admin/fees' });

    // Act
    render(<ForgeBreadcrumb />);

    // Assert
    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(nav).toBeInTheDocument();
  });
});
