import React, { useCallback, useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  pointerWithin,
  rectIntersection,
} from '@dnd-kit/core';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';
import { STATUS_ORDER, canTransition } from './statusTransitions';
import { debug } from '@/lib/debug';

/**
 * Custom collision detection: prefer pointerWithin (feels natural for columns),
 * fall back to rectIntersection for edge cases.
 */
function customCollisionDetection(args) {
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) return pointerCollisions;
  return rectIntersection(args);
}

export default function KanbanBoard({ orders = [], kanbanConfig, onStatusChange, onViewOrder }) {
  const [activeOrderId, setActiveOrderId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px drag threshold to allow clicks
      },
    })
  );

  const columns = useMemo(() => {
    const config = kanbanConfig || {};
    const configColumns = Array.isArray(config.columns) ? config.columns : [];

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
      orders: orders
        .filter(o => (o.status || 'NEW') === status)
        .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()),
    }));
  }, [orders, kanbanConfig]);

  const activeOrder = useMemo(() => {
    if (!activeOrderId) return null;
    return orders.find(o => String(o.id) === String(activeOrderId)) || null;
  }, [activeOrderId, orders]);

  const handleDragStart = useCallback((event) => {
    setActiveOrderId(event.active.id);
  }, []);

  const handleDragEnd = useCallback((event) => {
    setActiveOrderId(null);
    const { active, over } = event;
    if (!over || !active) return;

    const orderId = active.id;
    // The droppable id is the column status
    const newStatus = over.id;

    const order = orders.find(o => String(o.id) === String(orderId));
    if (!order) return;

    const currentStatus = order.status || 'NEW';
    if (currentStatus === newStatus) return;

    if (!canTransition(currentStatus, newStatus)) {
      debug(`[Kanban] Invalid transition: ${currentStatus} -> ${newStatus}`);
      return;
    }

    // Check WIP limit
    const targetCol = columns.find(c => c.status === newStatus);
    if (targetCol && targetCol.wipLimit > 0 && targetCol.orders.length >= targetCol.wipLimit) {
      debug(`[Kanban] WIP limit reached for ${newStatus}`);
      return;
    }

    onStatusChange?.(orderId, newStatus, currentStatus);
  }, [orders, columns, onStatusChange]);

  const handleDragCancel = useCallback(() => {
    setActiveOrderId(null);
  }, []);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div
        style={{
          display: 'flex',
          gap: '12px',
          overflowX: 'auto',
          paddingBottom: '16px',
          minHeight: '400px',
        }}
      >
        {columns.map(col => (
          <KanbanColumn
            key={col.status}
            status={col.status}
            orders={col.orders}
            wipLimit={col.wipLimit}
            activeOrderId={activeOrderId}
            onViewOrder={onViewOrder}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{
        duration: 200,
        easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
      }}>
        {activeOrder ? (
          <KanbanCard order={activeOrder} isOverlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
