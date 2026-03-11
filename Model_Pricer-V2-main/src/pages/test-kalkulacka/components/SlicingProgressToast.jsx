// src/pages/test-kalkulacka/components/SlicingProgressToast.jsx
//
// Standalone slicing-progress toast system.
// Shows persistent, stacking toasts at bottom-right during slicing operations.
// Forge dark theme, aria-live for accessibility, optional completion sound.

import React, { useState, useEffect, useCallback, useRef } from 'react';

// ---------------------------------------------------------------------------
// Sound helper — subtle completion beep via Web Audio API
// ---------------------------------------------------------------------------

let audioCtxCache = null;

function getAudioCtx() {
  if (audioCtxCache) return audioCtxCache;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) audioCtxCache = new Ctx();
  } catch { /* unsupported */ }
  return audioCtxCache;
}

function playCompletionBeep() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// SlicingProgressToast (individual toast)
// ---------------------------------------------------------------------------

const DISMISS_DELAY_SUCCESS = 3000;

function SingleToast({ toast, onDismiss }) {
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef(null);

  // Auto-dismiss completed toasts
  useEffect(() => {
    if (toast.state === 'completed') {
      timerRef.current = setTimeout(() => {
        setExiting(true);
        setTimeout(() => onDismiss(toast.id), 300);
      }, DISMISS_DELAY_SUCCESS);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [toast.state, toast.id, onDismiss]);

  const handleClose = useCallback(() => {
    setExiting(true);
    setTimeout(() => onDismiss(toast.id), 300);
  }, [toast.id, onDismiss]);

  const stateLabel = {
    processing: 'Zpracovava se...',
    completed: 'Dokonceno',
    failed: 'Chyba',
  }[toast.state] || toast.state;

  const stateIcon = {
    processing: null, // animated spinner via CSS
    completed: '\u2713',
    failed: '\u2717',
  }[toast.state];

  // Progress percentage — for single file it pulses, for batch it tracks file count
  const progressPct = toast.state === 'completed'
    ? 100
    : toast.state === 'failed'
      ? 100
      : toast.batchTotal
        ? Math.round((toast.batchDone / toast.batchTotal) * 100)
        : null; // null = indeterminate

  return (
    <div
      className={`spt-toast spt-toast--${toast.state} ${exiting ? 'spt-toast--exit' : ''}`}
      role="status"
    >
      {/* Header row */}
      <div className="spt-toast__header">
        <div className="spt-toast__status">
          {toast.state === 'processing' && (
            <span className="spt-toast__spinner" aria-hidden="true" />
          )}
          {stateIcon && (
            <span className={`spt-toast__icon spt-toast__icon--${toast.state}`} aria-hidden="true">
              {stateIcon}
            </span>
          )}
          <span className="spt-toast__status-text">{stateLabel}</span>
        </div>
        <button
          className="spt-toast__close"
          onClick={handleClose}
          aria-label="Zavrit notifikaci"
          type="button"
        >
          &times;
        </button>
      </div>

      {/* File name */}
      <div className="spt-toast__filename" title={toast.fileName}>
        {toast.fileName}
      </div>

      {/* Batch indicator */}
      {toast.batchTotal > 1 && (
        <div className="spt-toast__batch">
          Soubor {toast.batchDone}/{toast.batchTotal}
        </div>
      )}

      {/* Progress bar */}
      <div className="spt-toast__bar-track">
        <div
          className={`spt-toast__bar-fill spt-toast__bar-fill--${toast.state} ${progressPct === null ? 'spt-toast__bar-fill--indeterminate' : ''}`}
          style={progressPct !== null ? { width: `${progressPct}%` } : undefined}
        />
      </div>

      {/* Error detail */}
      {toast.state === 'failed' && toast.errorMessage && (
        <div className="spt-toast__error">{toast.errorMessage}</div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SlicingProgressContainer — manages toast stack
// ---------------------------------------------------------------------------

/**
 * useSlicingToasts — hook that manages the slicing progress toast state.
 *
 * Returns:
 *   toasts        - current array of toast objects
 *   startSlice    - call when a single file starts slicing
 *   completeSlice - call when slicing succeeds
 *   failSlice     - call when slicing fails
 *   startBatch    - call when batch slicing starts (returns batchId)
 *   updateBatch   - call to update batch progress
 *   completeBatch - call when entire batch finishes
 *   dismiss       - manually dismiss a toast
 *   dismissAll    - dismiss all toasts
 *   soundEnabled  - whether completion sound is on
 *   toggleSound   - toggle completion sound
 */
export function useSlicingToasts() {
  const [toasts, setToasts] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const counterRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => !prev);
  }, []);

  // Single file starts slicing
  const startSlice = useCallback((fileId, fileName) => {
    counterRef.current += 1;
    const id = `slice-${counterRef.current}`;
    const toast = {
      id,
      fileId,
      fileName: fileName || 'Model',
      state: 'processing',
      batchTotal: 0,
      batchDone: 0,
      errorMessage: null,
      createdAt: Date.now(),
    };
    setToasts(prev => {
      // Replace existing toast for same fileId if any
      const filtered = prev.filter(t => t.fileId !== fileId);
      // Keep max 6 toasts visible
      const trimmed = filtered.length >= 6 ? filtered.slice(1) : filtered;
      return [...trimmed, toast];
    });
    return id;
  }, []);

  // Single file completed
  const completeSlice = useCallback((fileId) => {
    setToasts(prev =>
      prev.map(t =>
        t.fileId === fileId ? { ...t, state: 'completed' } : t
      )
    );
  }, []);

  // Single file failed
  const failSlice = useCallback((fileId, errorMessage) => {
    setToasts(prev =>
      prev.map(t =>
        t.fileId === fileId ? { ...t, state: 'failed', errorMessage } : t
      )
    );
  }, []);

  // Batch slicing start — creates a single batch toast
  const startBatch = useCallback((totalFiles, fileNames) => {
    counterRef.current += 1;
    const id = `batch-${counterRef.current}`;
    const toast = {
      id,
      fileId: `__batch_${id}`,
      fileName: fileNames?.[0] || 'Davkove zpracovani',
      state: 'processing',
      batchTotal: totalFiles,
      batchDone: 0,
      errorMessage: null,
      createdAt: Date.now(),
    };
    setToasts(prev => {
      // Remove any existing batch toasts
      const filtered = prev.filter(t => !t.fileId.startsWith('__batch_'));
      return [...filtered, toast];
    });
    return id;
  }, []);

  // Update batch progress
  const updateBatch = useCallback((batchId, done, currentFileName) => {
    setToasts(prev =>
      prev.map(t =>
        t.id === batchId
          ? { ...t, batchDone: done, fileName: currentFileName || t.fileName }
          : t
      )
    );
  }, []);

  // Complete batch
  const completeBatch = useCallback((batchId, hasErrors) => {
    setToasts(prev =>
      prev.map(t =>
        t.id === batchId
          ? {
              ...t,
              state: hasErrors ? 'failed' : 'completed',
              fileName: hasErrors ? 'Davka - nektere selhaly' : 'Davka dokoncena',
              errorMessage: hasErrors ? 'Nektere soubory se nepodařilo zpracovat' : null,
            }
          : t
      )
    );
  }, []);

  // Play sound on any toast completing (if enabled)
  const prevToastsRef = useRef(toasts);
  useEffect(() => {
    if (!soundEnabled) { prevToastsRef.current = toasts; return; }
    const prevMap = new Map(prevToastsRef.current.map(t => [t.id, t.state]));
    for (const t of toasts) {
      if (t.state === 'completed' && prevMap.get(t.id) !== 'completed') {
        playCompletionBeep();
        break; // one beep per render
      }
    }
    prevToastsRef.current = toasts;
  }, [toasts, soundEnabled]);

  return {
    toasts,
    startSlice,
    completeSlice,
    failSlice,
    startBatch,
    updateBatch,
    completeBatch,
    dismiss,
    dismissAll,
    soundEnabled,
    toggleSound,
  };
}

// ---------------------------------------------------------------------------
// SlicingProgressContainer — render component
// ---------------------------------------------------------------------------

export default function SlicingProgressContainer({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="spt-container" aria-live="polite" aria-relevant="additions removals">
      {toasts.map(toast => (
        <SingleToast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}

      <style>{slicingToastStyles}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles (scoped via .spt- prefix)
// ---------------------------------------------------------------------------

const slicingToastStyles = `
/* Container — fixed bottom-right stack */
.spt-container {
  position: fixed;
  bottom: 16px;
  right: 16px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
  max-height: calc(100vh - 32px);
  overflow-y: auto;
  scrollbar-width: none;
}
.spt-container::-webkit-scrollbar { display: none; }

/* Individual toast */
.spt-toast {
  pointer-events: auto;
  width: 320px;
  max-width: calc(100vw - 32px);
  background: var(--forge-bg-elevated, #161920);
  border: 1px solid var(--forge-border-default, #1E2230);
  border-radius: var(--forge-radius-lg, 8px);
  padding: 12px 14px;
  box-shadow: var(--forge-shadow-md, 0 4px 12px rgba(0,0,0,0.5));
  font-family: var(--forge-font-body, 'IBM Plex Sans', system-ui, sans-serif);
  font-size: var(--forge-text-sm, 0.75rem);
  color: var(--forge-text-primary, #E8ECF1);
  animation: spt-slide-in 0.3s var(--forge-ease-out-expo, cubic-bezier(0.16,1,0.3,1)) forwards;
  transform: translateX(100%);
  opacity: 0;
}

.spt-toast--exit {
  animation: spt-slide-out 0.3s ease-in forwards;
}

/* Completed flash */
.spt-toast--completed {
  border-color: var(--forge-success, #00D4AA);
  box-shadow: var(--forge-shadow-md, 0 4px 12px rgba(0,0,0,0.5)), 0 0 12px rgba(0, 212, 170, 0.2);
}

/* Failed indicator */
.spt-toast--failed {
  border-color: var(--forge-error, #FF4757);
  box-shadow: var(--forge-shadow-md, 0 4px 12px rgba(0,0,0,0.5)), 0 0 8px rgba(255, 71, 87, 0.15);
}

/* Header */
.spt-toast__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.spt-toast__status {
  display: flex;
  align-items: center;
  gap: 6px;
}

.spt-toast__status-text {
  font-family: var(--forge-font-tech, 'Space Mono', monospace);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--forge-text-secondary, #9BA3B0);
}

/* Close button */
.spt-toast__close {
  background: none;
  border: none;
  color: var(--forge-text-muted, #7A8291);
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  padding: 2px 4px;
  border-radius: 4px;
  transition: color 0.15s, background 0.15s;
}
.spt-toast__close:hover {
  color: var(--forge-text-primary, #E8ECF1);
  background: rgba(255, 255, 255, 0.06);
}
.spt-toast__close:focus-visible {
  outline: 2px solid var(--forge-accent-primary, #00D4AA);
  outline-offset: 1px;
}

/* Spinner */
.spt-toast__spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid var(--forge-border-active, #2A3040);
  border-top-color: var(--forge-accent-primary, #00D4AA);
  border-radius: 50%;
  animation: spt-spin 0.8s linear infinite;
}

/* Status icons */
.spt-toast__icon {
  font-weight: 700;
  font-size: 14px;
}
.spt-toast__icon--completed {
  color: var(--forge-success, #00D4AA);
}
.spt-toast__icon--failed {
  color: var(--forge-error, #FF4757);
}

/* File name */
.spt-toast__filename {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--forge-text-primary, #E8ECF1);
  font-size: 13px;
  margin-bottom: 4px;
  font-weight: 500;
}

/* Batch indicator */
.spt-toast__batch {
  font-family: var(--forge-font-tech, 'Space Mono', monospace);
  font-size: 11px;
  color: var(--forge-text-muted, #7A8291);
  margin-bottom: 4px;
}

/* Progress bar track */
.spt-toast__bar-track {
  width: 100%;
  height: 4px;
  background: var(--forge-bg-overlay, #1C1F28);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 4px;
}

/* Progress bar fill */
.spt-toast__bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.4s var(--forge-ease-out-expo, cubic-bezier(0.16,1,0.3,1));
  position: relative;
}

/* Processing — teal gradient with animated stripes */
.spt-toast__bar-fill--processing {
  background: linear-gradient(
    90deg,
    var(--forge-accent-primary, #00D4AA) 0%,
    var(--forge-accent-primary-h, #00F0C0) 50%,
    var(--forge-accent-primary, #00D4AA) 100%
  );
  background-size: 200% 100%;
  animation: spt-stripe-move 1.5s linear infinite;
}

/* Indeterminate — full width pulsing */
.spt-toast__bar-fill--indeterminate {
  width: 100% !important;
  animation: spt-indeterminate 1.8s ease-in-out infinite;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--forge-accent-primary, #00D4AA) 50%,
    transparent 100%
  );
  background-size: 200% 100%;
}

/* Completed — solid teal */
.spt-toast__bar-fill--completed {
  background: var(--forge-success, #00D4AA);
  animation: spt-flash-green 0.6s ease-out;
}

/* Failed — solid red */
.spt-toast__bar-fill--failed {
  background: var(--forge-error, #FF4757);
}

/* Error message */
.spt-toast__error {
  margin-top: 6px;
  font-size: 11px;
  color: var(--forge-error, #FF4757);
  line-height: 1.4;
  word-break: break-word;
}

/* Animations */
@keyframes spt-slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes spt-slide-out {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(120%);
    opacity: 0;
  }
}

@keyframes spt-spin {
  to { transform: rotate(360deg); }
}

@keyframes spt-stripe-move {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@keyframes spt-indeterminate {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@keyframes spt-flash-green {
  0% { box-shadow: 0 0 0 0 rgba(0, 212, 170, 0.5); }
  50% { box-shadow: 0 0 8px 2px rgba(0, 212, 170, 0.3); }
  100% { box-shadow: none; }
}
`;
