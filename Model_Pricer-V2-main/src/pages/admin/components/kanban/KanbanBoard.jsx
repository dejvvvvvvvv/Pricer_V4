import React, { useCallback, useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  rectIntersection,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';
import KanbanFilters from './KanbanFilters';
import KanbanSettings from './KanbanSettings';
import { STATUS_ORDER, canTransition, checkOverdue } from './statusTransitions';
import { extractOrderMaterials } from '../../../../utils/adminOrdersStorage';
import { debug } from '@/lib/debug';
import Icon from '../../../../components/AppIcon';

/**
 * Custom collision detection: prefer pointerWithin (feels natural for columns),
 * fall back to rectIntersection for edge cases.
 */
function customCollisionDetection(args) {
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) return pointerCollisions;
  return rectIntersection(args);
}

export default function KanbanBoard({ orders = [], kanbanConfig, onStatusChange, onViewOrder, onConfigChange, isLoading = false }) {
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [filters, setFilters] = useState({});
  const [showSettings, setShowSettings] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Collect all unique materials from orders for filter dropdown
  const allMaterials = useMemo(() => {
    const set = new Set();
    for (const o of orders) {
      for (const m of extractOrderMaterials(o)) set.add(m);
    }
    return Array.from(set).sort();
  }, [orders]);

  // Filter orders based on kanban-specific filters
  const filteredOrders = useMemo(() => {
    let result = orders;

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(o => {
        const name = (o.customer_snapshot?.name || o.customer?.name || o.contact?.name || '').toLowerCase();
        const email = (o.customer_snapshot?.email || o.customer?.email || o.contact?.email || '').toLowerCase();
        const id = String(o.order_number || o.id || '').toLowerCase();
        return name.includes(q) || email.includes(q) || id.includes(q);
      });
    }

    if (filters.status) {
      result = result.filter(o => (o.status || 'NEW') === filters.status);
    }

    if (filters.material) {
      result = result.filter(o => extractOrderMaterials(o).includes(filters.material));
    }

    if (filters.priority) {
      result = result.filter(o => {
        const flags = o.flags || [];
        return flags.some(f => f.toUpperCase() === filters.priority.toUpperCase());
      });
    }

    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom).getTime();
      result = result.filter(o => new Date(o.created_at || 0).getTime() >= from);
    }

    if (filters.dateTo) {
      const to = new Date(filters.dateTo).getTime() + 86400000; // end of day
      result = result.filter(o => new Date(o.created_at || 0).getTime() <= to);
    }

    if (filters.overdueOnly) {
      result = result.filter(o => {
        const status = o.status || 'NEW';
        const updated = o.updated_at || o.updatedAt || o.created_at || o.createdAt;
        return checkOverdue(status, updated).overdue;
      });
    }

    return result;
  }, [orders, filters]);

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
      orders: filteredOrders
        .filter(o => (o.status || 'NEW') === status)
        .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()),
    }));
  }, [filteredOrders, kanbanConfig]);

  // Active order (for drag overlay)
  const activeOrder = useMemo(() => {
    if (!activeOrderId) return null;
    return orders.find(o => String(o.id) === String(activeOrderId)) || null;
  }, [activeOrderId, orders]);

  const activeOrderStatus = activeOrder ? (activeOrder.status || 'NEW') : null;

  const handleDragStart = useCallback((event) => {
    setActiveOrderId(event.active.id);
  }, []);

  const handleDragEnd = useCallback((event) => {
    setActiveOrderId(null);
    const { active, over } = event;
    if (!over || !active) return;

    const orderId = active.id;
    const newStatus = over.id;

    const order = orders.find(o => String(o.id) === String(orderId));
    if (!order) return;

    const currentStatus = order.status || 'NEW';
    if (currentStatus === newStatus) return;

    if (!canTransition(currentStatus, newStatus)) {
      debug(`[Kanban] Invalid transition: ${currentStatus} -> ${newStatus}`);
      return;
    }

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

  // Handle status change from card quick actions
  const handleCardStatusChange = useCallback((orderId, newStatus, currentStatus) => {
    if (!canTransition(currentStatus, newStatus)) return;
    const targetCol = columns.find(c => c.status === newStatus);
    if (targetCol && targetCol.wipLimit > 0 && targetCol.orders.length >= targetCol.wipLimit) return;
    onStatusChange?.(orderId, newStatus, currentStatus);
  }, [columns, onStatusChange]);

  // Summary stats
  const totalOrders = filteredOrders.length;
  const overdueCount = useMemo(() => {
    return filteredOrders.filter(o => {
      const status = o.status || 'NEW';
      const updated = o.updated_at || o.updatedAt || o.created_at || o.createdAt;
      return checkOverdue(status, updated).overdue;
    }).length;
  }, [filteredOrders]);

  return (
    <div>
      {/* Header bar with filters + settings */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '12px',
        marginBottom: '4px',
      }}>
        <div style={{ flex: 1 }}>
          <KanbanFilters
            filters={filters}
            onFiltersChange={setFilters}
            allMaterials={allMaterials}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '2px' }}>
          {/* Stats badges */}
          <span style={{
            fontSize: '11px',
            fontFamily: 'var(--forge-font-mono)',
            color: 'var(--forge-text-muted)',
          }}>
            {totalOrders} obj.
          </span>
          {overdueCount > 0 && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              fontSize: '10px',
              fontFamily: 'var(--forge-font-tech)',
              fontWeight: 600,
              padding: '2px 7px',
              borderRadius: '999px',
              backgroundColor: 'rgba(255, 71, 87, 0.12)',
              color: '#ef4444',
              border: '1px solid rgba(255, 71, 87, 0.25)',
            }}>
              <Icon name="AlertTriangle" size={10} />
              {overdueCount} zpozdeno
            </span>
          )}
          {/* Settings button */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            title="Nastaveni kanban"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '5px 8px',
              borderRadius: 'var(--forge-radius-md)',
              border: '1px solid var(--forge-border-default)',
              backgroundColor: showSettings ? 'var(--forge-bg-elevated)' : 'transparent',
              color: showSettings ? 'var(--forge-accent-primary)' : 'var(--forge-text-muted)',
              cursor: 'pointer',
              fontSize: '11px',
              fontFamily: 'var(--forge-font-tech)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              transition: 'all 120ms ease',
            }}
          >
            <Icon name="Settings" size={14} />
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <KanbanSettings
          kanbanConfig={kanbanConfig}
          onConfigChange={onConfigChange}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div style={{ display: 'flex', gap: '10px', paddingBottom: '16px', minHeight: '400px' }}>
          {STATUS_ORDER.slice(0, 5).map(status => (
            <div key={status} style={{
              width: '280px',
              minWidth: '280px',
              backgroundColor: 'var(--forge-bg-surface)',
              borderRadius: 'var(--forge-radius-lg)',
              border: '1.5px solid var(--forge-border-default)',
              padding: '10px 12px',
            }}>
              {/* Column header skeleton */}
              <div style={{
                height: '20px',
                borderRadius: 'var(--forge-radius-sm)',
                backgroundColor: 'var(--forge-bg-elevated)',
                marginBottom: '12px',
                animation: 'kanban-skeleton-shimmer 1.5s ease-in-out infinite',
              }} />
              {/* Card skeletons */}
              {[1, 2, 3].map(i => (
                <div key={i} style={{
                  height: '90px',
                  borderRadius: 'var(--forge-radius-md)',
                  backgroundColor: 'var(--forge-bg-elevated)',
                  marginBottom: '8px',
                  opacity: 1 - (i - 1) * 0.25,
                  animation: 'kanban-skeleton-shimmer 1.5s ease-in-out infinite',
                  animationDelay: `${i * 150}ms`,
                }} />
              ))}
            </div>
          ))}
          <style>{`
            @keyframes kanban-skeleton-shimmer {
              0%, 100% { opacity: 0.6; }
              50% { opacity: 1; }
            }
          `}</style>
        </div>
      )}

      {/* Kanban board */}
      {!isLoading && <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div
          style={{
            display: 'flex',
            gap: '10px',
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
              activeOrderStatus={activeOrderStatus}
              onViewOrder={onViewOrder}
              onStatusChange={handleCardStatusChange}
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
      </DndContext>}
    </div>
  );
}
