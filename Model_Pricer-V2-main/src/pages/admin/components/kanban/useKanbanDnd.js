import { useState, useCallback } from 'react';
import { canTransition } from './statusTransitions';

export default function useKanbanDnd({ orders, onStatusChange }) {
  const [draggedOrderId, setDraggedOrderId] = useState(null);

  const handleDragStart = useCallback((orderId) => {
    setDraggedOrderId(orderId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedOrderId(null);
  }, []);

  const handleDrop = useCallback((orderId, newStatus) => {
    const order = (orders || []).find(o => String(o.id) === String(orderId));
    if (!order) return false;

    const currentStatus = order.status || 'new';
    if (!canTransition(currentStatus, newStatus)) return false;

    onStatusChange?.(orderId, newStatus, currentStatus);
    setDraggedOrderId(null);
    return true;
  }, [orders, onStatusChange]);

  return {
    draggedOrderId,
    handleDragStart,
    handleDragEnd,
    handleDrop,
  };
}
