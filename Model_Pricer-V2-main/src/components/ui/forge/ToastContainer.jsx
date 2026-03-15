import React, { useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import ForgeToast from './ForgeToast';
import { useNotification } from '@/contexts/NotificationContext';

/**
 * ToastContainer — renders all active toasts from NotificationContext.
 *
 * Fixed position top-right, z-index 9999, max-width 420px.
 * Uses framer-motion for smooth enter/exit animations.
 */
export default function ToastContainer() {
  const { toasts, dismiss } = useNotification();

  const handleDismiss = useCallback(
    (id) => () => dismiss(id),
    [dismiss],
  );

  const containerStyle = {
    position: 'fixed',
    top: '16px',
    right: '16px',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxWidth: '420px',
    width: '100%',
    pointerEvents: 'none',
  };

  return createPortal(
    <div style={containerStyle} aria-live="polite" aria-label="Notifications">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{ pointerEvents: 'auto' }}
          >
            <ForgeToast
              type={toast.type}
              title={toast.title}
              message={toast.message}
              duration={toast.duration}
              onDismiss={handleDismiss(toast.id)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
}
