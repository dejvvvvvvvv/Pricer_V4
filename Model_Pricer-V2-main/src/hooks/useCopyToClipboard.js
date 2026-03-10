import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Hook for copying text to clipboard with automatic reset of copied state.
 *
 * @param {Object} [options]
 * @param {number} [options.resetDelay=2000] - Time in ms before `copied` resets to false.
 * @returns {{ copied: boolean, copyToClipboard: (text: string) => Promise<boolean> }}
 */
export function useCopyToClipboard(options = {}) {
  const { resetDelay = 2000 } = options;
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const copyToClipboard = useCallback(async (text) => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    try {
      // Try modern Clipboard API first
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        timerRef.current = setTimeout(() => {
          setCopied(false);
          timerRef.current = null;
        }, resetDelay);
        return true;
      }

      // Fallback: textarea method
      return fallbackCopyTextToClipboard(text, setCopied, timerRef, resetDelay);
    } catch {
      // Clipboard API failed, try fallback
      try {
        return fallbackCopyTextToClipboard(text, setCopied, timerRef, resetDelay);
      } catch {
        setCopied(false);
        return false;
      }
    }
  }, [resetDelay]);

  return { copied, copyToClipboard };
}

/**
 * Fallback copy method using a temporary textarea and document.execCommand.
 */
function fallbackCopyTextToClipboard(text, setCopied, timerRef, resetDelay) {
  const textarea = document.createElement('textarea');
  textarea.value = text;

  // Prevent scrolling to bottom
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.top = '-9999px';

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  let success = false;
  try {
    success = document.execCommand('copy');
  } catch {
    success = false;
  }

  document.body.removeChild(textarea);

  if (success) {
    setCopied(true);
    timerRef.current = setTimeout(() => {
      setCopied(false);
      timerRef.current = null;
    }, resetDelay);
  } else {
    setCopied(false);
  }

  return success;
}

export default useCopyToClipboard;
