import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import KanbanCard from './KanbanCard';
import { getStatusColor, getStatusLabel } from './statusTransitions';

export default function KanbanColumn({ status, orders = [], wipLimit = 0, activeOrderId, onViewOrder }) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  const isOverWip = wipLimit > 0 && orders.length >= wipLimit;
  const color = getStatusColor(status);
  const label = getStatusLabel(status);

  return (
    <div
      ref={setNodeRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '280px',
        minWidth: '280px',
        backgroundColor: 'var(--forge-bg-surface)',
        borderRadius: 'var(--forge-radius-lg)',
        border: `1.5px solid ${isOver ? 'var(--forge-accent-primary)' : 'var(--forge-border-default)'}`,
        transition: 'border-color 150ms ease, box-shadow 150ms ease',
        boxShadow: isOver ? '0 0 20px rgba(0, 212, 170, 0.15), inset 0 0 0 1px rgba(0, 212, 170, 0.08)' : 'none',
      }}
    >
      {/* Column header */}
      <div style={{
        padding: '12px',
        borderBottom: '1px solid var(--forge-border-default)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: color,
            boxShadow: `0 0 6px ${color}44`,
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{
            fontSize: '11px',
            fontFamily: 'var(--forge-font-mono)',
            padding: '2px 8px',
            borderRadius: '999px',
            backgroundColor: isOverWip ? 'rgba(255, 71, 87, 0.15)' : 'var(--forge-bg-elevated)',
            color: isOverWip ? 'var(--forge-error)' : 'var(--forge-text-secondary)',
            border: `1px solid ${isOverWip ? 'rgba(255, 71, 87, 0.3)' : 'var(--forge-border-default)'}`,
          }}>
            {orders.length}{wipLimit > 0 ? `/${wipLimit}` : ''}
          </span>
        </div>
      </div>

      {/* Cards area */}
      <div style={{
        flex: 1,
        padding: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        overflowY: 'auto',
        overscrollBehavior: 'contain',
        maxHeight: 'calc(100vh - 280px)',
        minHeight: '60px',
      }}>
        {orders.map(order => (
          <KanbanCard
            key={order.id}
            order={order}
            onView={onViewOrder}
            isDragging={String(order.id) === String(activeOrderId)}
          />
        ))}
        {orders.length === 0 && (
          <div style={{
            textAlign: 'center',
            fontSize: '12px',
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
    </div>
  );
}
