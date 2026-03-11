import { useState, useCallback, useRef } from 'react';
import { generateId } from '../utils/generateId';

const STORAGE_KEY = 'modelpricer:pricing-history';
const MAX_ENTRIES = 20;

/**
 * Hook for tracking pricing calculation history within a session.
 * Stores entries in sessionStorage, auto-trims to MAX_ENTRIES.
 */
export function usePricingHistory() {
  const [history, setHistory] = useState(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Ref to avoid stale closures
  const historyRef = useRef(history);
  historyRef.current = history;

  const persist = useCallback((entries) => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // sessionStorage full or unavailable — silent fail
    }
  }, []);

  /**
   * Add a new pricing entry.
   * @param {object} config - { material, quality, infill, supports, quantity, modelCount }
   * @param {object} result - { total, breakdown: { material, time, services, discount, markup } }
   */
  const addEntry = useCallback((config, result) => {
    if (!config || !result) return;

    const entry = {
      id: generateId('ph'),
      timestamp: Date.now(),
      config: {
        material: config.material || '—',
        quality: config.quality || '—',
        infill: config.infill ?? 0,
        supports: !!config.supports,
        quantity: config.quantity ?? 1,
        modelCount: config.modelCount ?? 1,
      },
      result: {
        total: Number(result.total) || 0,
        breakdown: {
          material: Number(result.breakdown?.material) || 0,
          time: Number(result.breakdown?.time) || 0,
          services: Number(result.breakdown?.services) || 0,
          discount: Number(result.breakdown?.discount) || 0,
          markup: Number(result.breakdown?.markup) || 0,
        },
      },
    };

    const updated = [entry, ...historyRef.current].slice(0, MAX_ENTRIES);
    historyRef.current = updated;
    setHistory(updated);
    persist(updated);
  }, [persist]);

  const clearHistory = useCallback(() => {
    historyRef.current = [];
    setHistory([]);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // silent
    }
  }, []);

  /**
   * Compare two entries by ID. Returns null if either not found.
   * @param {string} id1
   * @param {string} id2
   * @returns {{ entry1, entry2, diff } | null}
   */
  const compareEntries = useCallback((id1, id2) => {
    const entry1 = historyRef.current.find((e) => e.id === id1);
    const entry2 = historyRef.current.find((e) => e.id === id2);
    if (!entry1 || !entry2) return null;

    const diff = {
      total: entry2.result.total - entry1.result.total,
      material: entry2.result.breakdown.material - entry1.result.breakdown.material,
      time: entry2.result.breakdown.time - entry1.result.breakdown.time,
      services: entry2.result.breakdown.services - entry1.result.breakdown.services,
      discount: entry2.result.breakdown.discount - entry1.result.breakdown.discount,
      markup: entry2.result.breakdown.markup - entry1.result.breakdown.markup,
    };

    return { entry1, entry2, diff };
  }, []);

  return {
    history,
    addEntry,
    clearHistory,
    compareEntries,
    entryCount: history.length,
  };
}
