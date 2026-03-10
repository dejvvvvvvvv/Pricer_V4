import { useEffect } from 'react';
import { onNetworkError } from '@/lib/networkEvents';
import { useNotification } from '@/contexts/NotificationContext';

/**
 * Subscribes to global network error events (emitted by apiClient)
 * and surfaces them as toast notifications via NotificationContext.
 *
 * Must be rendered inside <NotificationProvider>.
 */
export default function NetworkErrorListener() {
  const { showError } = useNotification();

  useEffect(() => {
    const unsubscribe = onNetworkError(({ message }) => {
      showError('Connection Problem', message);
    });
    return unsubscribe;
  }, [showError]);

  return null;
}
