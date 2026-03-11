import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * useUndoRedo — per-key undo/redo state management hook with debouncing.
 *
 * Designed for the calculator's per-file printConfig undo/redo. Each key
 * (e.g., file ID) has its own independent past/future history stack.
 *
 * Features:
 * - Per-key history (switching files preserves each file's undo stack)
 * - Debounced recording (rapid changes like slider drags are batched)
 * - Max history limit (30 states per key by default)
 * - Change description for tooltips (compares two snapshots)
 *
 * @param {object} options
 * @param {number} [options.maxHistory=30]  Max undo steps per key
 * @param {number} [options.debounceMs=400] Debounce interval for recording
 * @returns {{
 *   recordState: (key: string, state: object) => void,
 *   undo: (key: string) => object|null,
 *   redo: (key: string) => object|null,
 *   canUndo: (key: string) => boolean,
 *   canRedo: (key: string) => boolean,
 *   clearHistory: (key: string) => void,
 *   clearAll: () => void,
 *   getUndoDescription: (key: string, labelMap?: object) => string|null,
 *   getRedoDescription: (key: string, labelMap?: object) => string|null,
 * }}
 */
export function useUndoRedo({ maxHistory = 30, debounceMs = 400 } = {}) {
  // Map<key, { past: state[], future: state[], current: state|null }>
  const historyRef = useRef(new Map());
  // Map<key, timeoutId> for debouncing
  const debounceRef = useRef(new Map());
  // Pending state waiting for debounce commit
  const pendingRef = useRef(new Map());

  // Render tick to recalculate canUndo/canRedo
  const [, forceRender] = useState(0);
  const bump = useCallback(() => forceRender((n) => n + 1), []);

  // Get or create history entry for a key
  const getEntry = useCallback((key) => {
    if (!historyRef.current.has(key)) {
      historyRef.current.set(key, { past: [], future: [], current: null });
    }
    return historyRef.current.get(key);
  }, []);

  // Cleanup debounce timers on unmount
  useEffect(() => {
    return () => {
      for (const timer of debounceRef.current.values()) {
        clearTimeout(timer);
      }
    };
  }, []);

  /**
   * Record a new state snapshot for the given key.
   * Debounced: rapid calls within debounceMs are merged into one undo step.
   */
  const recordState = useCallback((key, state) => {
    if (key == null) return;

    const entry = getEntry(key);

    // If this is the very first record, just set current — no undo entry
    if (entry.current === null) {
      entry.current = state;
      return;
    }

    // If the state is identical (shallow JSON compare), skip
    if (JSON.stringify(entry.current) === JSON.stringify(state)) return;

    // Clear any existing debounce timer for this key
    const existingTimer = debounceRef.current.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // If there is no pending state yet, save the CURRENT state as the
    // "before" snapshot. This way, when debounce fires, the undo stack
    // gets the state before the rapid-change sequence started.
    if (!pendingRef.current.has(key)) {
      pendingRef.current.set(key, entry.current);
    }

    // Always update current to latest
    entry.current = state;

    // Set new debounce timer
    const timer = setTimeout(() => {
      const beforeState = pendingRef.current.get(key);
      pendingRef.current.delete(key);
      debounceRef.current.delete(key);

      if (beforeState == null) return;

      // Push the "before" state onto the past stack
      entry.past.push(beforeState);

      // Enforce max history
      if (entry.past.length > maxHistory) {
        entry.past.splice(0, entry.past.length - maxHistory);
      }

      // New edit clears redo (branching)
      entry.future = [];

      bump();
    }, debounceMs);

    debounceRef.current.set(key, timer);
  }, [getEntry, maxHistory, debounceMs, bump]);

  /**
   * Flush any pending debounced state immediately (useful before undo).
   */
  const flushPending = useCallback((key) => {
    const existingTimer = debounceRef.current.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
      debounceRef.current.delete(key);
    }

    const beforeState = pendingRef.current.get(key);
    pendingRef.current.delete(key);

    if (beforeState == null) return;

    const entry = getEntry(key);
    entry.past.push(beforeState);
    if (entry.past.length > maxHistory) {
      entry.past.splice(0, entry.past.length - maxHistory);
    }
    entry.future = [];
  }, [getEntry, maxHistory]);

  /**
   * Undo — restore previous state for the given key.
   * Returns the restored state, or null if nothing to undo.
   */
  const undo = useCallback((key) => {
    if (key == null) return null;

    // Flush any pending debounced changes first
    flushPending(key);

    const entry = getEntry(key);
    if (entry.past.length === 0) return null;

    const previous = entry.past.pop();
    entry.future.unshift(entry.current);
    entry.current = previous;

    bump();
    return previous;
  }, [getEntry, flushPending, bump]);

  /**
   * Redo — restore next state for the given key.
   * Returns the restored state, or null if nothing to redo.
   */
  const redo = useCallback((key) => {
    if (key == null) return null;

    const entry = getEntry(key);
    if (entry.future.length === 0) return null;

    const next = entry.future.shift();
    entry.past.push(entry.current);
    entry.current = next;

    bump();
    return next;
  }, [getEntry, bump]);

  /**
   * Check if undo is available for the given key.
   */
  const canUndo = useCallback((key) => {
    if (key == null) return false;
    const entry = historyRef.current.get(key);
    if (!entry) return false;
    return entry.past.length > 0 || pendingRef.current.has(key);
  }, []);

  /**
   * Check if redo is available for the given key.
   */
  const canRedo = useCallback((key) => {
    if (key == null) return false;
    const entry = historyRef.current.get(key);
    if (!entry) return false;
    return entry.future.length > 0;
  }, []);

  /**
   * Clear history for a specific key (e.g., when a file is removed).
   */
  const clearHistory = useCallback((key) => {
    historyRef.current.delete(key);
    const timer = debounceRef.current.get(key);
    if (timer) {
      clearTimeout(timer);
      debounceRef.current.delete(key);
    }
    pendingRef.current.delete(key);
    bump();
  }, [bump]);

  /**
   * Clear all history (e.g., on full reset).
   */
  const clearAll = useCallback(() => {
    historyRef.current.clear();
    for (const timer of debounceRef.current.values()) {
      clearTimeout(timer);
    }
    debounceRef.current.clear();
    pendingRef.current.clear();
    bump();
  }, [bump]);

  /**
   * Describe the change that undo would revert TO.
   * Compares the current state with the top of the past stack.
   *
   * @param {string} key - The file/entry key
   * @param {object} [labelMap] - Map of field keys to Czech labels
   * @returns {string|null} e.g. "Zpet: Material -> PLA"
   */
  const getUndoDescription = useCallback((key, labelMap = DEFAULT_LABELS) => {
    if (key == null) return null;
    const entry = historyRef.current.get(key);
    if (!entry) return null;

    // If there's a pending debounce, the "before" is what we'd revert to
    const target = pendingRef.current.has(key)
      ? pendingRef.current.get(key)
      : (entry.past.length > 0 ? entry.past[entry.past.length - 1] : null);

    if (!target || !entry.current) return null;

    return describeChange(entry.current, target, labelMap, 'Zpět');
  }, []);

  /**
   * Describe the change that redo would apply.
   *
   * @param {string} key - The file/entry key
   * @param {object} [labelMap] - Map of field keys to Czech labels
   * @returns {string|null} e.g. "Vpred: Material -> ABS"
   */
  const getRedoDescription = useCallback((key, labelMap = DEFAULT_LABELS) => {
    if (key == null) return null;
    const entry = historyRef.current.get(key);
    if (!entry || entry.future.length === 0) return null;

    const target = entry.future[0];
    if (!target || !entry.current) return null;

    return describeChange(entry.current, target, labelMap, 'Vpřed');
  }, []);

  return {
    recordState,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    clearAll,
    getUndoDescription,
    getRedoDescription,
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────

const DEFAULT_LABELS = {
  material: 'Materiál',
  quality: 'Kvalita',
  infill: 'Výplň',
  supports: 'Podpory',
  quantity: 'Množství',
  color: 'Barva',
};

// Human-readable quality labels
const QUALITY_LABELS = {
  nozzle_08: 'Extra hrubý (0.8mm)',
  nozzle_06: 'Hrubý (0.6mm)',
  nozzle_04: 'Rychlý (0.4mm)',
  draft: 'Návrhový (0.3mm)',
  standard: 'Standardní (0.2mm)',
  fine: 'Jemný (0.15mm)',
  ultra: 'Ultra jemný (0.1mm)',
};

/**
 * Compare two state snapshots and describe the first meaningful difference.
 * Returns a string like "Zpet: Material -> PLA" or null.
 */
function describeChange(from, to, labelMap, prefix) {
  const trackedKeys = ['material', 'quality', 'infill', 'supports', 'quantity', 'color'];

  for (const key of trackedKeys) {
    const fromVal = from[key];
    const toVal = to[key];

    if (fromVal == null && toVal == null) continue;
    if (String(fromVal) === String(toVal)) continue;

    const label = labelMap[key] || key;
    const displayVal = formatValue(key, toVal);

    return `${prefix}: ${label} \u2192 ${displayVal}`;
  }

  return `${prefix}`;
}

/**
 * Format a config value for display in tooltip.
 */
function formatValue(key, value) {
  if (value == null) return '—';

  switch (key) {
    case 'material':
      return String(value).toUpperCase();
    case 'quality':
      return QUALITY_LABELS[value] || String(value);
    case 'infill':
      return `${value}%`;
    case 'supports':
      return value ? 'Zapnuto' : 'Vypnuto';
    case 'quantity':
      return `${value} ks`;
    case 'color':
      return String(value);
    default:
      return String(value);
  }
}

export default useUndoRedo;
