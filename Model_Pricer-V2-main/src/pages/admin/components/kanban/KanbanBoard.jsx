import React, { useMemo } from 'react';
import KanbanColumn from './KanbanColumn';
import { STATUS_ORDER, canTransition } from './statusTransitions';

export default function KanbanBoard({ orders = [], kanbanConfig, onStatusChange, onViewOrder }) {
  const columns = useMemo(() => {
    const config = kanbanConfig || {};
    const configColumns = Array.isArray(config.columns) ? config.columns : [];

    // Use config columns if available, otherwise default STATUS_ORDER
    const visibleStatuses = configColumns.length > 0
      ? configColumns.filter(c => c.visible !== false).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).map(c => c.id)
      : STATUS_ORDER;

    const wipLimits = {};
    for (const col of configColumns) {
      if (col?.id) wipLimits[col.id] = col.wip_limit || 0;
    }

    return visibleStatuses.map(status => ({
      status,
      wipLimit: wipLimits[status] || 0,
      orders: orders.filter(o => (o.status || 'new') === status),
    }));
  }, [orders, kanbanConfig]);

  const handleDrop = (orderId, newStatus) => {
    const order = orders.find(o => String(o.id) === String(orderId));
    if (!order) return;

    const currentStatus = order.status || 'new';
    if (currentStatus === newStatus) return;

    if (!canTransition(currentStatus, newStatus)) {
      console.warn(`[Kanban] Invalid transition: ${currentStatus} -> ${newStatus}`);
      return;
    }

    // Check WIP limit
    const targetCol = columns.find(c => c.status === newStatus);
    if (targetCol && targetCol.wipLimit > 0 && targetCol.orders.length >= targetCol.wipLimit) {
      console.warn(`[Kanban] WIP limit reached for ${newStatus}`);
      return;
    }

    onStatusChange?.(orderId, newStatus, currentStatus);
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: '400px' }}>
      {columns.map(col => (
        <KanbanColumn
          key={col.status}
          status={col.status}
          orders={col.orders}
          wipLimit={col.wipLimit}
          onDrop={handleDrop}
          onViewOrder={onViewOrder}
        />
      ))}
    </div>
  );
}
