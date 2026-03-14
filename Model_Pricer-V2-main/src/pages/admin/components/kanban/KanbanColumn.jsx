import React, { useState, useMemo, memo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import KanbanCard from './KanbanCard';
import { getStatusColor, getStatusLabel, canTransition } from './statusTransitions';
import Icon from '../../../../components/AppIcon';
import { computeOrderTotals } from '../../../../utils/adminOrdersStorage';

const COLUMN_STYLES = `
  @keyframes kanban-col-pulse {
    0%, 100% { border-color: rgba(0, 212, 170, 0.4); }
    50% { border-color: rgba(0, 212, 170, 0.8); }
  }
`;

function KanbanColumn({
  status,
  orders = [],
  wipLimit = 0,
  activeOrderId,
  activeOrderStatus,
  onViewOrder,
  onStatusChange,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const { setNodeRef, isOver } = useDroppable({ id: status });

  const isOverWip = wipLimit > 0 && orders.length >= wipLimit;
  const color = getStatusColor(status);
  const label = getStatusLabel(status);

  // During drag: check if this column is a valid drop target
  const isValidDrop = activeOrderStatus
    ? canTransition(activeOrderStatus, status) && activeOrderStatus !== status
    : false;
  const isInvalidDrop = activeOrderStatus
    ? !canTransition(activeOrderStatus, status) && activeOrderStatus !== status
    : false;
  const isDragSource = activeOrderStatus === status;

  // Compute total value of orders in this column
  const columnTotal = useMemo(() => {
    let sum = 0;
    for (const o of orders) {
      try {
        const t = computeOrderTotals(o);
        sum += t?.total || 0;
      } catch {
        sum += o.totals_snapshot?.total || 0;
      }
    }
    return sum;
  }, [orders]);

  const formatMoney = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n) || n === 0) return '';
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k Kc`;
    return `${n.toFixed(0)} Kc`;
  };

  // Visual feedback for drag
  const getBorderColor = () => {
    if (isOver && isValidDrop) return 'var(--forge-accent-primary)';
    if (isOver && isInvalidDrop) return 'rgba(255, 71, 87, 0.5)';
    if (isValidDrop && activeOrderId) return `${color}60`;
    if (isInvalidDrop && activeOrderId) return 'rgba(255, 71, 87, 0.2)';
    return 'var(--forge-border-default)';
  };

  const getBoxShadow = () => {
    if (isOver && isValidDrop) return '0 0 24px rgba(0, 212, 170, 0.2), inset 0 0 0 1px rgba(0, 212, 170, 0.1)';
    if (isOver && isInvalidDrop) return '0 0 16px rgba(255, 71, 87, 0.15), inset 0 0 0 1px rgba(255, 71, 87, 0.08)';
    return 'none';
  };

  const getBackground = () => {
    if (isOver && isValidDrop) return 'rgba(0, 212, 170, 0.03)';
    if (isOver && isInvalidDrop) return 'rgba(255, 71, 87, 0.03)';
    if (isInvalidDrop && activeOrderId) return 'rgba(255, 71, 87, 0.02)';
    return 'var(--forge-bg-surface)';
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: collapsed ? '52px' : '280px',
        minWidth: collapsed ? '52px' : '280px',
        backgroundColor: getBackground(),
        borderRadius: 'var(--forge-radius-lg)',
        border: `1.5px solid ${getBorderColor()}`,
        transition: 'border-color 150ms ease, box-shadow 150ms ease, background-color 150ms ease, width 250ms ease, min-width 250ms ease',
        boxShadow: getBoxShadow(),
        opacity: (isInvalidDrop && activeOrderId && !isDragSource) ? 0.5 : 1,
      }}
    >
      {/* Column header */}
      <div
        style={{
          padding: collapsed ? '12px 6px' : '10px 12px',
          borderBottom: collapsed ? 'none' : '1px solid var(--forge-border-default)',
          display: 'flex',
          alignItems: collapsed ? 'center' : 'center',
          flexDirection: collapsed ? 'column' : 'row',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: collapsed ? '8px' : '4px',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={(e) => { if (e.target === e.currentTarget || collapsed) setCollapsed(!collapsed); }}
        title={collapsed ? `Rozbalit: ${label}` : `Sbalit: ${label}`}
      >
        {collapsed ? (
          <>
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: color,
              boxShadow: `0 0 6px ${color}44`,
              flexShrink: 0,
            }} />
            <span style={{
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              fontFamily: 'var(--forge-font-tech)',
              fontWeight: 600,
              fontSize: '10px',
              color: 'var(--forge-text-primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}>
              {label}
            </span>
            <span style={{
              fontSize: '10px',
              fontFamily: 'var(--forge-font-mono)',
              padding: '2px 0',
              color: isOverWip ? 'var(--forge-error)' : 'var(--forge-text-secondary)',
              fontWeight: 600,
            }}>
              {orders.length}
            </span>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: color,
                boxShadow: `0 0 6px ${color}44`,
                flexShrink: 0,
              }} />
              <span style={{
                fontFamily: 'var(--forge-font-tech)',
                fontWeight: 600,
                fontSize: '11px',
                color: 'var(--forge-text-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                {label}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              {/* Total value */}
              {columnTotal > 0 && (
                <span style={{
                  fontSize: '10px',
                  fontFamily: 'var(--forge-font-mono)',
                  color: 'var(--forge-text-muted)',
                }}>
                  {formatMoney(columnTotal)}
                </span>
              )}
              {/* Count / WIP */}
              <span style={{
                fontSize: '11px',
                fontFamily: 'var(--forge-font-mono)',
                padding: '2px 8px',
                borderRadius: '999px',
                backgroundColor: isOverWip ? 'rgba(255, 71, 87, 0.15)' : 'var(--forge-bg-elevated)',
                color: isOverWip ? 'var(--forge-error)' : 'var(--forge-text-secondary)',
                border: `1px solid ${isOverWip ? 'rgba(255, 71, 87, 0.3)' : 'var(--forge-border-default)'}`,
                fontWeight: 600,
              }}>
                {orders.length}{wipLimit > 0 ? `/${wipLimit}` : ''}
              </span>
              {/* Collapse icon */}
              <Icon
                name="ChevronLeft"
                size={14}
                color="var(--forge-text-muted)"
                style={{ flexShrink: 0 }}
              />
            </div>
          </>
        )}
      </div>

      {/* Cards area */}
      {!collapsed && (
        <div style={{
          flex: 1,
          padding: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          maxHeight: 'calc(100vh - 300px)',
          minHeight: '60px',
        }}>
          {/* Drop zone indicator when dragging */}
          {isOver && isValidDrop && orders.length === 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px 12px',
              borderRadius: 'var(--forge-radius-md)',
              border: '2px dashed var(--forge-accent-primary)',
              backgroundColor: 'rgba(0, 212, 170, 0.05)',
              animation: 'kanban-col-pulse 1.5s ease-in-out infinite',
            }}>
              <span style={{
                fontSize: '11px',
                fontFamily: 'var(--forge-font-tech)',
                color: 'var(--forge-accent-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                Pustit sem
              </span>
            </div>
          )}

          {/* Invalid drop indicator */}
          {isOver && isInvalidDrop && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '8px',
              borderRadius: 'var(--forge-radius-md)',
              backgroundColor: 'rgba(255, 71, 87, 0.06)',
              marginBottom: orders.length > 0 ? '4px' : '0',
            }}>
              <Icon name="Ban" size={12} color="#ef4444" />
              <span style={{
                fontSize: '10px',
                fontFamily: 'var(--forge-font-tech)',
                color: '#ef4444',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}>
                Nepovoleny prechod
              </span>
            </div>
          )}

          {orders.map(order => (
            <KanbanCard
              key={order.id}
              order={order}
              onView={onViewOrder}
              onStatusChange={onStatusChange}
              isDragging={String(order.id) === String(activeOrderId)}
            />
          ))}
          {orders.length === 0 && !isOver && (
            <div style={{
              textAlign: 'center',
              fontSize: '11px',
              fontFamily: 'var(--forge-font-tech)',
              color: 'var(--forge-text-muted)',
              padding: '32px 0',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Zadne objednavky
            </div>
          )}
        </div>
      )}

      <style>{COLUMN_STYLES}</style>
    </div>
  );
}

export default memo(KanbanColumn);
