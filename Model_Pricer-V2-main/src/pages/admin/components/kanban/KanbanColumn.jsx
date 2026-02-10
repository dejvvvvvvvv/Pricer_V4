import React, { useState } from 'react';
import KanbanCard from './KanbanCard';
import { getStatusColor, getStatusLabel } from './statusTransitions';

export default function KanbanColumn({ status, orders = [], wipLimit = 0, onDrop, onViewOrder }) {
  const [isDragOver, setIsDragOver] = useState(false);

  const isOverWip = wipLimit > 0 && orders.length >= wipLimit;
  const color = getStatusColor(status);
  const label = getStatusLabel(status);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const orderId = e.dataTransfer.getData('text/plain');
    if (orderId && onDrop) onDrop(orderId, status);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '280px',
        minWidth: '280px',
        backgroundColor: 'var(--forge-bg-surface)',
        borderRadius: 'var(--forge-radius-lg)',
        border: `1px solid ${isDragOver ? 'var(--forge-accent-primary)' : 'var(--forge-border-default)'}`,
        transition: 'border-color var(--forge-duration-micro) ease, background-color var(--forge-duration-micro) ease',
        ...(isDragOver ? { boxShadow: '0 0 16px rgba(0, 212, 170, 0.1)' } : {}),
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
        maxHeight: 'calc(100vh - 280px)',
      }}>
        {orders.map(order => (
          <KanbanCard key={order.id} order={order} onView={onViewOrder} />
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
            No orders
          </div>
        )}
      </div>
    </div>
  );
}
