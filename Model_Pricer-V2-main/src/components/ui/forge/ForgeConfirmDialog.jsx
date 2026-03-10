import React, { useState, useCallback, useRef } from 'react';
import ForgeDialog from './ForgeDialog';

/**
 * Reusable confirmation dialog built on top of ForgeDialog.
 *
 * @param {boolean} open - Whether the dialog is visible
 * @param {string} title - Dialog title
 * @param {string} message - Confirmation message body
 * @param {string} [confirmLabel='Confirm'] - Text for the confirm button
 * @param {string} [cancelLabel='Cancel'] - Text for the cancel button
 * @param {boolean} [destructive=false] - When true, confirm button uses error/red styling
 * @param {boolean} [loading=false] - When true, confirm button shows loading state
 * @param {Function} onConfirm - Called when user confirms
 * @param {Function} onCancel - Called when user cancels (overlay click, Escape, cancel button)
 */
export function ForgeConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}) {
  const cancelBtnStyle = {
    height: '38px',
    padding: '0 20px',
    borderRadius: 'var(--forge-radius-sm)',
    border: '1px solid var(--forge-border-active)',
    backgroundColor: 'transparent',
    color: 'var(--forge-text-secondary)',
    fontFamily: 'var(--forge-font-heading)',
    fontSize: 'var(--forge-text-base)',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 120ms ease-out, color 120ms ease-out',
  };

  const confirmBtnBase = {
    height: '38px',
    padding: '0 20px',
    borderRadius: 'var(--forge-radius-sm)',
    border: 'none',
    fontFamily: 'var(--forge-font-heading)',
    fontSize: 'var(--forge-text-base)',
    fontWeight: 500,
    cursor: loading ? 'wait' : 'pointer',
    opacity: loading ? 0.7 : 1,
    transition: 'background-color 120ms ease-out, transform 120ms ease-out, box-shadow 120ms ease-out',
  };

  const confirmBtnStyle = destructive
    ? {
        ...confirmBtnBase,
        backgroundColor: 'var(--forge-error)',
        color: '#fff',
      }
    : {
        ...confirmBtnBase,
        backgroundColor: 'var(--forge-accent-primary)',
        color: '#08090C',
      };

  const messageStyle = {
    fontFamily: 'var(--forge-font-body)',
    fontSize: 'var(--forge-text-base)',
    color: 'var(--forge-text-secondary)',
    lineHeight: 1.6,
    margin: 0,
  };

  const footer = (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
      <button
        style={cancelBtnStyle}
        onClick={onCancel}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--forge-bg-elevated)';
          e.currentTarget.style.color = 'var(--forge-text-primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = 'var(--forge-text-secondary)';
        }}
      >
        {cancelLabel}
      </button>
      <button
        style={confirmBtnStyle}
        onClick={onConfirm}
        disabled={loading}
        onMouseEnter={(e) => {
          if (loading) return;
          if (destructive) {
            e.currentTarget.style.backgroundColor = '#e63e4d';
          } else {
            e.currentTarget.style.backgroundColor = 'var(--forge-accent-primary-h)';
            e.currentTarget.style.boxShadow = 'var(--forge-shadow-glow)';
          }
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          if (destructive) {
            e.currentTarget.style.backgroundColor = 'var(--forge-error)';
          } else {
            e.currentTarget.style.backgroundColor = 'var(--forge-accent-primary)';
            e.currentTarget.style.boxShadow = 'none';
          }
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        {loading ? '...' : confirmLabel}
      </button>
    </div>
  );

  return (
    <ForgeDialog
      open={open}
      onClose={onCancel}
      title={title}
      footer={footer}
      maxWidth="440px"
    >
      <p style={messageStyle}>{message}</p>
    </ForgeDialog>
  );
}

/**
 * Hook for imperative confirmation dialogs.
 *
 * Usage:
 *   const { confirm, ConfirmDialog } = useConfirmDialog();
 *
 *   // In an event handler:
 *   const ok = await confirm({
 *     title: 'Delete item?',
 *     message: 'This action cannot be undone.',
 *     confirmLabel: 'Delete',
 *     destructive: true,
 *   });
 *   if (!ok) return;
 *   // proceed with deletion...
 *
 *   // In JSX (render once, anywhere in the component):
 *   return <div>...your UI... <ConfirmDialog /></div>;
 */
export function useConfirmDialog() {
  const [state, setState] = useState({
    open: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    destructive: false,
  });

  // Store resolve callback in a ref so it survives re-renders
  const resolveRef = useRef(null);

  const confirm = useCallback(({
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    destructive = false,
  }) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({
        open: true,
        title,
        message,
        confirmLabel,
        cancelLabel,
        destructive,
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setState((s) => ({ ...s, open: false }));
    if (resolveRef.current) {
      resolveRef.current(true);
      resolveRef.current = null;
    }
  }, []);

  const handleCancel = useCallback(() => {
    setState((s) => ({ ...s, open: false }));
    if (resolveRef.current) {
      resolveRef.current(false);
      resolveRef.current = null;
    }
  }, []);

  const ConfirmDialog = useCallback(
    () => (
      <ForgeConfirmDialog
        open={state.open}
        title={state.title}
        message={state.message}
        confirmLabel={state.confirmLabel}
        cancelLabel={state.cancelLabel}
        destructive={state.destructive}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    ),
    [state, handleConfirm, handleCancel]
  );

  return { confirm, ConfirmDialog };
}

export default ForgeConfirmDialog;
