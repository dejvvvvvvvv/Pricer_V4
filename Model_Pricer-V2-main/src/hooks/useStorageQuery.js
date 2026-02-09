/*
  useStorageQuery — generic async read hook with cache.

  Reads data from the StorageAdapter (localStorage or Supabase based on feature flags).
  Provides loading, error, and data states.

  Usage:
    const { data, loading, error, refetch } = useStorageQuery('pricing:v3', fallbackData);
*/

import { useState, useEffect, useCallback, useRef } from 'react';
import { readTenantJsonAsync, getTenantId } from '../utils/adminTenantStorage';

// Simple in-memory cache to avoid re-fetching on re-renders
const queryCache = new Map();

/**
 * @param {string} namespace - Storage namespace (e.g., 'pricing:v3')
 * @param {*} fallback - Default value if no data found
 * @param {Object} options
 * @param {boolean} options.enabled - Whether to fetch (default: true)
 * @param {number} options.staleTime - Cache staleness in ms (default: 30000)
 * @param {Function} options.transform - Transform function applied to raw data
 */
export function useStorageQuery(namespace, fallback, options = {}) {
  const {
    enabled = true,
    staleTime = 30000,
    transform = null,
  } = options;

  // Store fallback and transform in refs to avoid infinite re-fetch loops
  // when callers pass inline objects/functions (e.g., `useStorageQuery('x', {})`)
  const fallbackRef = useRef(fallback);
  const transformRef = useRef(transform);
  fallbackRef.current = fallback;
  transformRef.current = transform;

  const [data, setData] = useState(() => {
    // Try to return cached data synchronously for instant render
    const cacheKey = `${getTenantId()}:${namespace}`;
    const cached = queryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < staleTime) {
      return transformRef.current ? transformRef.current(cached.data) : cached.data;
    }
    return fallbackRef.current;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);
  const fetchIdRef = useRef(0);

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    const fetchId = ++fetchIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const result = await readTenantJsonAsync(namespace, fallbackRef.current);

      // Only update if this is still the latest fetch and component is mounted
      if (fetchId === fetchIdRef.current && mountedRef.current) {
        const cacheKey = `${getTenantId()}:${namespace}`;
        queryCache.set(cacheKey, { data: result, timestamp: Date.now() });

        const transformed = transformRef.current ? transformRef.current(result) : result;
        setData(transformed);
        setLoading(false);
      }
    } catch (err) {
      if (fetchId === fetchIdRef.current && mountedRef.current) {
        console.warn(`[useStorageQuery] Error fetching ${namespace}:`, err);
        setError(err);
        setLoading(false);
      }
    }
  }, [namespace, enabled]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  const refetch = useCallback(() => {
    // Invalidate cache
    const cacheKey = `${getTenantId()}:${namespace}`;
    queryCache.delete(cacheKey);
    return fetchData();
  }, [fetchData, namespace]);

  return { data, loading, error, refetch };
}

/**
 * Invalidate the cache for a specific namespace.
 * Call after a mutation to ensure the next query fetches fresh data.
 */
export function invalidateStorageQuery(namespace) {
  const cacheKey = `${getTenantId()}:${namespace}`;
  queryCache.delete(cacheKey);
}

/**
 * Clear the entire query cache.
 */
export function clearStorageQueryCache() {
  queryCache.clear();
}

export default useStorageQuery;
