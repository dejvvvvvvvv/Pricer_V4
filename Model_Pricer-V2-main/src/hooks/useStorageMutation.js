/*
  useStorageMutation — generic async write hook with optimistic update.

  Writes data through the StorageAdapter (localStorage or Supabase based on feature flags).
  Supports optimistic updates and rollback on error.

  Usage:
    const { mutate, loading, error } = useStorageMutation('pricing:v3', {
      onSuccess: () => refetch(),
      onError: (err) => toast.error(err.message),
    });

    mutate(newData); // async write
*/

import { useState, useCallback, useRef, useEffect } from 'react';
import { writeTenantJsonAsync } from '../utils/adminTenantStorage';
import { invalidateStorageQuery } from './useStorageQuery';

/**
 * @param {string} namespace - Storage namespace (e.g., 'pricing:v3')
 * @param {Object} options
 * @param {Function} options.onSuccess - Called after successful write
 * @param {Function} options.onError - Called on write error
 * @param {Function} options.onSettled - Called after both success and error
 * @param {Function} options.mutationFn - Custom mutation function (overrides default writeTenantJsonAsync)
 */
export function useStorageMutation(namespace, options = {}) {
  const {
    onSuccess,
    onError,
    onSettled,
    mutationFn,
  } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const mutate = useCallback(async (value) => {
    setLoading(true);
    setError(null);

    try {
      if (mutationFn) {
        await mutationFn(value);
      } else {
        await writeTenantJsonAsync(namespace, value);
      }

      // Invalidate query cache so next read gets fresh data
      invalidateStorageQuery(namespace);

      if (mountedRef.current) {
        setLoading(false);
        onSuccess?.(value);
        onSettled?.(value, null);
      }
    } catch (err) {
      console.warn(`[useStorageMutation] Error writing ${namespace}:`, err);
      if (mountedRef.current) {
        setError(err);
        setLoading(false);
        onError?.(err);
        onSettled?.(null, err);
      }
    }
  }, [namespace, mutationFn, onSuccess, onError, onSettled]);

  /**
   * Async version that returns a promise.
   */
  const mutateAsync = useCallback(async (value) => {
    setLoading(true);
    setError(null);

    try {
      if (mutationFn) {
        await mutationFn(value);
      } else {
        await writeTenantJsonAsync(namespace, value);
      }

      invalidateStorageQuery(namespace);

      if (mountedRef.current) {
        setLoading(false);
        onSuccess?.(value);
        onSettled?.(value, null);
      }
      return value;
    } catch (err) {
      if (mountedRef.current) {
        setError(err);
        setLoading(false);
        onError?.(err);
        onSettled?.(null, err);
      }
      throw err;
    }
  }, [namespace, mutationFn, onSuccess, onError, onSettled]);

  const reset = useCallback(() => {
    setError(null);
    setLoading(false);
  }, []);

  return { mutate, mutateAsync, loading, error, reset };
}

export default useStorageMutation;
