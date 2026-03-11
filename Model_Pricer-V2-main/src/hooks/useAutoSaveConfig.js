// src/hooks/useAutoSaveConfig.js
// Auto-saves print configuration to sessionStorage so users don't lose
// their selections when refreshing the page. Session-scoped (per tab).

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { debug } from '@/lib/debug';

const STORAGE_KEY = 'modelpricer:calc:config';
const SCHEMA_VERSION = 1;
const DEBOUNCE_MS = 500;

/**
 * Validate that restored data has the expected shape and schema version.
 * Returns null if data is invalid or from a different schema version.
 */
function validateSavedData(data) {
  if (!data || typeof data !== 'object') return null;
  if (data._schemaVersion !== SCHEMA_VERSION) return null;

  // printConfigs must be an object (keyed by fileId)
  if (data.printConfigs && typeof data.printConfigs !== 'object') return null;

  // selectedPresetIds must be an object
  if (data.selectedPresetIds && typeof data.selectedPresetIds !== 'object') return null;

  // feeSelections shape check
  if (data.feeSelections) {
    if (typeof data.feeSelections !== 'object') return null;
    // selectedFeeIds should be serialized as an array (Set is not JSON-serializable)
    if (data.feeSelections.selectedFeeIds && !Array.isArray(data.feeSelections.selectedFeeIds)) return null;
  }

  return data;
}

/**
 * Serialize state for sessionStorage.
 * Converts Set -> Array for JSON compatibility.
 */
function serializeState({ printConfigs, selectedPresetIds, feeSelections }) {
  const serializedFees = feeSelections
    ? {
        selectedFeeIds: feeSelections.selectedFeeIds instanceof Set
          ? Array.from(feeSelections.selectedFeeIds)
          : Array.isArray(feeSelections.selectedFeeIds)
            ? feeSelections.selectedFeeIds
            : [],
        feeTargetsById: feeSelections.feeTargetsById || {},
      }
    : null;

  return {
    _schemaVersion: SCHEMA_VERSION,
    _savedAt: new Date().toISOString(),
    printConfigs: printConfigs || {},
    selectedPresetIds: selectedPresetIds || {},
    feeSelections: serializedFees,
  };
}

/**
 * Deserialize saved state from sessionStorage.
 * Converts Array -> Set for feeSelections.
 */
function deserializeState(data) {
  const result = {
    printConfigs: data.printConfigs || {},
    selectedPresetIds: data.selectedPresetIds || {},
    feeSelections: null,
  };

  if (data.feeSelections) {
    result.feeSelections = {
      selectedFeeIds: new Set(data.feeSelections.selectedFeeIds || []),
      feeTargetsById: data.feeSelections.feeTargetsById || {},
    };
  }

  return result;
}

/**
 * Hook for auto-saving print configuration to sessionStorage.
 *
 * @returns {{
 *   savedConfig: object|null,
 *   saveConfig: (state: object) => void,
 *   clearConfig: () => void,
 *   lastSaved: Date|null,
 *   isRestored: boolean
 * }}
 */
export function useAutoSaveConfig() {
  const [lastSaved, setLastSaved] = useState(null);
  const [isRestored, setIsRestored] = useState(false);
  const debounceRef = useRef(null);

  // Load saved config once on mount
  const savedConfig = useMemo(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const validated = validateSavedData(parsed);
      if (!validated) {
        debug('[useAutoSaveConfig] Invalid or outdated saved data, ignoring');
        sessionStorage.removeItem(STORAGE_KEY);
        return null;
      }
      debug('[useAutoSaveConfig] Restored config from sessionStorage');
      return deserializeState(validated);
    } catch (e) {
      debug('[useAutoSaveConfig] Failed to parse saved config:', e);
      try { sessionStorage.removeItem(STORAGE_KEY); } catch (_) { /* noop */ }
      return null;
    }
  }, []); // Only on mount

  // Debounced save function
  const saveConfig = useCallback((state) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      try {
        const serialized = serializeState(state);
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
        setLastSaved(new Date());
        debug('[useAutoSaveConfig] Config auto-saved');
      } catch (e) {
        debug('[useAutoSaveConfig] Failed to save config:', e);
      }
    }, DEBOUNCE_MS);
  }, []);

  // Clear saved config (e.g. on order completion)
  const clearConfig = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      setLastSaved(null);
      debug('[useAutoSaveConfig] Config cleared');
    } catch (e) {
      debug('[useAutoSaveConfig] Failed to clear config:', e);
    }
  }, []);

  // Mark as restored after initial render
  const markRestored = useCallback(() => {
    setIsRestored(true);
  }, []);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return { savedConfig, saveConfig, clearConfig, lastSaved, isRestored, markRestored };
}

export default useAutoSaveConfig;
