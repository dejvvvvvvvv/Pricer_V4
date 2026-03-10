import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ForgeConfirmDialog, useConfirmDialog } from '../ForgeConfirmDialog.jsx';

// ---------------------------------------------------------------------------
// ForgeConfirmDialog component tests
// ---------------------------------------------------------------------------
describe('ForgeConfirmDialog', () => {
  const defaultProps = {
    open: true,
    title: 'Delete item?',
    message: 'This action cannot be undone.',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when open is false', () => {
    // Arrange & Act
    const { container } = render(
      <ForgeConfirmDialog {...defaultProps} open={false} />
    );

    // Assert
    expect(container.innerHTML).toBe('');
  });

  it('should render title and message when open', () => {
    // Arrange & Act
    render(<ForgeConfirmDialog {...defaultProps} />);

    // Assert
    expect(screen.getByText('Delete item?')).toBeInTheDocument();
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
  });

  it('should call onConfirm when confirm button is clicked', () => {
    // Arrange
    render(<ForgeConfirmDialog {...defaultProps} />);

    // Act
    fireEvent.click(screen.getByText('Confirm'));

    // Assert
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when cancel button is clicked', () => {
    // Arrange
    render(<ForgeConfirmDialog {...defaultProps} />);

    // Act
    fireEvent.click(screen.getByText('Cancel'));

    // Assert
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('should show destructive styling when destructive prop is true', () => {
    // Arrange & Act
    render(<ForgeConfirmDialog {...defaultProps} destructive={true} />);

    // Assert — confirm button uses error/red background
    const confirmBtn = screen.getByText('Confirm');
    expect(confirmBtn.style.backgroundColor).toBe('var(--forge-error)');
    // jsdom converts #fff to rgb(255, 255, 255)
    expect(confirmBtn.style.color).toBe('rgb(255, 255, 255)');
  });

  it('should show non-destructive styling by default', () => {
    // Arrange & Act
    render(<ForgeConfirmDialog {...defaultProps} />);

    // Assert — confirm button uses accent/primary background
    const confirmBtn = screen.getByText('Confirm');
    expect(confirmBtn.style.backgroundColor).toBe('var(--forge-accent-primary)');
    // jsdom converts #08090C to rgb(8, 9, 12)
    expect(confirmBtn.style.color).toBe('rgb(8, 9, 12)');
  });

  it('should render custom confirm and cancel labels', () => {
    // Arrange & Act
    render(
      <ForgeConfirmDialog
        {...defaultProps}
        confirmLabel="Yes, delete"
        cancelLabel="No, keep"
      />
    );

    // Assert
    expect(screen.getByText('Yes, delete')).toBeInTheDocument();
    expect(screen.getByText('No, keep')).toBeInTheDocument();
  });

  it('should have role="dialog" and aria-modal="true"', () => {
    // Arrange & Act
    render(<ForgeConfirmDialog {...defaultProps} />);

    // Assert
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('should show loading state when loading prop is true', () => {
    // Arrange & Act
    render(<ForgeConfirmDialog {...defaultProps} loading={true} />);

    // Assert — button text becomes "..." and is disabled
    const confirmBtn = screen.getByText('...');
    expect(confirmBtn).toBeDisabled();
    expect(confirmBtn.style.cursor).toBe('wait');
    expect(confirmBtn.style.opacity).toBe('0.7');
  });

  it('should call onCancel when Escape key is pressed', () => {
    // Arrange
    render(<ForgeConfirmDialog {...defaultProps} />);

    // Act — ForgeDialog listens for keydown on document
    fireEvent.keyDown(document, { key: 'Escape' });

    // Assert — ForgeDialog calls onClose (which is onCancel) on Escape
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// useConfirmDialog hook tests
// ---------------------------------------------------------------------------
describe('useConfirmDialog', () => {
  // Test harness component that exposes the hook's API
  function TestHarness({ onResult }) {
    const { confirm, ConfirmDialog } = useConfirmDialog();

    const handleClick = async () => {
      const result = await confirm({
        title: 'Are you sure?',
        message: 'This will remove the item.',
        confirmLabel: 'Remove',
        cancelLabel: 'Keep',
        destructive: true,
      });
      onResult(result);
    };

    return (
      <div>
        <button onClick={handleClick}>Open dialog</button>
        <ConfirmDialog />
      </div>
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show dialog with provided title and message when confirm() is called', () => {
    // Arrange
    const onResult = vi.fn();
    render(<TestHarness onResult={onResult} />);

    // Act — trigger confirm()
    fireEvent.click(screen.getByText('Open dialog'));

    // Assert — dialog is visible with correct content
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    expect(screen.getByText('This will remove the item.')).toBeInTheDocument();
    expect(screen.getByText('Remove')).toBeInTheDocument();
    expect(screen.getByText('Keep')).toBeInTheDocument();
  });

  it('should resolve with true when user clicks confirm', async () => {
    // Arrange
    const onResult = vi.fn();
    render(<TestHarness onResult={onResult} />);

    // Act — open dialog then click confirm
    fireEvent.click(screen.getByText('Open dialog'));
    fireEvent.click(screen.getByText('Remove'));

    // Assert — wait for promise microtask to resolve
    await vi.waitFor(() => {
      expect(onResult).toHaveBeenCalledWith(true);
    });
  });

  it('should resolve with false when user clicks cancel', async () => {
    // Arrange
    const onResult = vi.fn();
    render(<TestHarness onResult={onResult} />);

    // Act — open dialog then click cancel
    fireEvent.click(screen.getByText('Open dialog'));
    fireEvent.click(screen.getByText('Keep'));

    // Assert — wait for promise microtask to resolve
    await vi.waitFor(() => {
      expect(onResult).toHaveBeenCalledWith(false);
    });
  });
});
