import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Admin keyboard shortcuts hook.
 *
 * Supports two-key "G then X" navigation sequences and single-key shortcuts.
 * Ignores events when the user is typing in input fields.
 *
 * Navigation map (G then ...):
 *   D -> Dashboard, O -> Orders, P -> Pricing, A -> Analytics,
 *   B -> Branding, W -> Widget, S -> Model Storage
 *
 * Single keys:
 *   ? -> toggle shortcuts help overlay
 *   Esc -> close any open overlay
 *
 * @returns {{ showHelp: boolean, setShowHelp: Function, pendingG: boolean }}
 */
// Navigation targets for the "G then X" sequence — module-level constant,
// no dependency on component state so it does not need to live inside the hook.
const GO_TARGETS = {
  d: '/admin',
  o: '/admin/orders',
  p: '/admin/pricing',
  a: '/admin/analytics',
  b: '/admin/branding',
  w: '/admin/widget',
  s: '/admin/model-storage',
};

export function useAdminShortcuts() {
  const navigate = useNavigate();
  const [showHelp, setShowHelp] = useState(false);
  const [pendingG, setPendingG] = useState(false);
  const pendingGTimer = useRef(null);

  const clearPendingG = useCallback(() => {
    setPendingG(false);
    if (pendingGTimer.current) {
      clearTimeout(pendingGTimer.current);
      pendingGTimer.current = null;
    }
  }, []);

  useEffect(() => {
    const handler = (e) => {
      // Skip when typing in form elements
      const tag = e.target.tagName;
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        e.target.isContentEditable
      ) {
        return;
      }

      // Skip when modifier keys are held (let Ctrl+K etc. through normally)
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const key = e.key.toLowerCase();

      // --- Two-key sequence: G then X ---
      if (pendingG) {
        clearPendingG();
        const target = GO_TARGETS[key];
        if (target) {
          e.preventDefault();
          navigate(target);
        }
        return;
      }

      // Start "G" sequence
      if (key === 'g' && !e.shiftKey) {
        setPendingG(true);
        // Auto-expire after 1.5 seconds if no second key is pressed
        pendingGTimer.current = setTimeout(() => {
          setPendingG(false);
        }, 1500);
        return;
      }

      // --- Single-key shortcuts ---

      // "?" to toggle shortcuts help (Shift+/ on most keyboards)
      if (e.key === '?' || (e.shiftKey && key === '/')) {
        e.preventDefault();
        setShowHelp((prev) => !prev);
        return;
      }

      // Esc to close any open overlay
      if (key === 'escape') {
        if (showHelp) {
          e.preventDefault();
          setShowHelp(false);
        }
        // Note: CommandPalette handles its own Esc
      }
    };

    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
      if (pendingGTimer.current) clearTimeout(pendingGTimer.current);
    };
  }, [pendingG, showHelp, navigate, clearPendingG]);

  return { showHelp, setShowHelp, pendingG };
}
