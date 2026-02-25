import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const NotificationContext = createContext();

/**
 * Default auto-dismiss durations per toast type (ms).
 */
const DEFAULT_DURATIONS = {
  success: 4000,
  error: 8000,
  warning: 6000,
  info: 5000,
};

/**
 * Maximum number of toasts visible at the same time.
 */
const MAX_VISIBLE = 5;

/**
 * Hook to access the notification system.
 *
 * Returns:
 *   showSuccess(title, message)
 *   showError(title, message)
 *   showWarning(title, message)
 *   showInfo(title, message)
 *   dismiss(id)
 *   dismissAll()
 *   toasts  — current array of active toasts (used by ToastContainer)
 */
export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
}

/**
 * NotificationProvider — manages a queue of toast notifications.
 *
 * Place this high in the component tree (e.g. in App.jsx) so that every
 * page/component can call useNotification().
 */
export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counterRef = useRef(0);

  // ---- internal helpers ------------------------------------------------

  const addToast = useCallback((type, title, message) => {
    counterRef.current += 1;
    const id = counterRef.current;
    const duration = DEFAULT_DURATIONS[type] ?? DEFAULT_DURATIONS.info;

    setToasts((prev) => {
      // If we already hit the cap, drop the oldest toast(s)
      const next = prev.length >= MAX_VISIBLE ? prev.slice(1) : prev;
      return [...next, { id, type, title, message, duration }];
    });

    return id;
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  // ---- public convenience methods --------------------------------------

  const showSuccess = useCallback(
    (title, message) => addToast('success', title, message),
    [addToast],
  );

  const showError = useCallback(
    (title, message) => addToast('error', title, message),
    [addToast],
  );

  const showWarning = useCallback(
    (title, message) => addToast('warning', title, message),
    [addToast],
  );

  const showInfo = useCallback(
    (title, message) => addToast('info', title, message),
    [addToast],
  );

  // ---- context value (stable via useCallback) --------------------------

  const value = {
    toasts,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    dismiss,
    dismissAll,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export default NotificationProvider;
