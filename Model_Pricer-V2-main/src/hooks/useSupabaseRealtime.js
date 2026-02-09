/*
  useSupabaseRealtime — subscribe to Supabase realtime changes.

  Listens for INSERT, UPDATE, DELETE events on a specific table
  and calls the onEvent callback. Automatically cleans up on unmount.

  Usage:
    useSupabaseRealtime('orders', {
      filter: 'tenant_id=eq.demo-tenant-uuid',
      onInsert: (payload) => refetch(),
      onUpdate: (payload) => refetch(),
      onDelete: (payload) => refetch(),
    });
*/

import { useEffect, useRef } from 'react';
import { supabase, isSupabaseAvailable } from '../lib/supabase/client';

/**
 * @param {string} table - Supabase table name
 * @param {Object} options
 * @param {string} options.filter - Postgres filter (e.g., 'tenant_id=eq.xxx')
 * @param {string} options.schema - Schema name (default: 'public')
 * @param {Function} options.onInsert - Called on INSERT events
 * @param {Function} options.onUpdate - Called on UPDATE events
 * @param {Function} options.onDelete - Called on DELETE events
 * @param {Function} options.onAny - Called on any event (receives type + payload)
 * @param {boolean} options.enabled - Whether to subscribe (default: true)
 */
export function useSupabaseRealtime(table, options = {}) {
  const {
    filter,
    schema = 'public',
    onInsert,
    onUpdate,
    onDelete,
    onAny,
    enabled = true,
  } = options;

  const channelRef = useRef(null);

  // Store callbacks in refs to avoid channel churn when callers
  // pass non-memoized functions (common React pattern)
  const onInsertRef = useRef(onInsert);
  const onUpdateRef = useRef(onUpdate);
  const onDeleteRef = useRef(onDelete);
  const onAnyRef = useRef(onAny);
  onInsertRef.current = onInsert;
  onUpdateRef.current = onUpdate;
  onDeleteRef.current = onDelete;
  onAnyRef.current = onAny;

  useEffect(() => {
    if (!enabled || !isSupabaseAvailable() || !supabase) return;

    const channelName = `realtime:${table}:${filter || 'all'}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema,
          table,
          ...(filter ? { filter } : {}),
        },
        (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;

          onAnyRef.current?.({ type: eventType, new: newRecord, old: oldRecord, payload });

          switch (eventType) {
            case 'INSERT':
              onInsertRef.current?.(newRecord, payload);
              break;
            case 'UPDATE':
              onUpdateRef.current?.(newRecord, oldRecord, payload);
              break;
            case 'DELETE':
              onDeleteRef.current?.(oldRecord, payload);
              break;
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [table, filter, schema, enabled]);
}

export default useSupabaseRealtime;
