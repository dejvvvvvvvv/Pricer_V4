import { useEffect, useCallback } from 'react';

/**
 * Hook for registering keyboard shortcuts.
 * Automatically ignores key events when the user is typing in form fields
 * (input, textarea, select, contentEditable).
 *
 * @param {string} key - Key to listen for (e.g., 's', 'Escape', 'n')
 * @param {Function} callback - Function to call when shortcut is triggered
 * @param {Object} [options] - Options
 * @param {boolean} [options.ctrlKey] - Require Ctrl/Cmd key
 * @param {boolean} [options.shiftKey] - Require Shift key
 * @param {boolean} [options.altKey] - Require Alt key
 * @param {boolean} [options.disabled] - Disable the shortcut
 * @param {boolean} [options.allowInInputs] - Allow shortcut even when typing in inputs (e.g., for Escape)
 */
export function useKeyboardShortcut(key, callback, options = {}) {
  const {
    ctrlKey = false,
    shiftKey = false,
    altKey = false,
    disabled = false,
    allowInInputs = false,
  } = options;

  const handler = useCallback((e) => {
    if (disabled) return;

    // Don't trigger when typing in inputs/textareas unless explicitly allowed
    if (!allowInInputs) {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) {
        return;
      }
    }

    const isCtrl = e.ctrlKey || e.metaKey;

    if (
      e.key.toLowerCase() === key.toLowerCase() &&
      (!ctrlKey || isCtrl) &&
      (!shiftKey || e.shiftKey) &&
      (!altKey || e.altKey)
    ) {
      e.preventDefault();
      callback(e);
    }
  }, [key, callback, ctrlKey, shiftKey, altKey, disabled, allowInInputs]);

  useEffect(() => {
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handler]);
}
