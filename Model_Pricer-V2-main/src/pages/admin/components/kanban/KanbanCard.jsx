import React, { useState } from 'react';
import Icon from '../../../../components/AppIcon';

export default function KanbanCard({ order, onView, isDragging }) {
  const [isHovered, setIsHovered] = useState(false);

  if (!order) return null;

  const totalModels = Array.isArray(order.models) ? order.models.length : 0;
  const totalAmount = order.total ?? order.totals?.grandTotal ?? 0;
  const customerName = order.customer?.name || order.contact?.name || 'Unknown';
  const createdAt = order.created_at || order.createdAt;

  const formatDate = (iso) => {
    try { return new Date(iso).toLocaleDateString('cs-CZ'); } catch { return ''; }
  };

  const formatMoney = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? `${n.toFixed(0)} CZK` : '0 CZK';
  };

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', order.id || '');
        e.dataTransfer.effectAllowed = 'move';
      }}
      onClick={() => onView?.(order)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: 'var(--forge-bg-elevated)',
        borderRadius: 'var(--forge-radius-lg)',
        border: '1px solid var(--forge-border-default)',
        padding: '12px',
        cursor: 'grab',
        transition: 'box-shadow var(--forge-duration-micro) ease, border-color var(--forge-duration-micro) ease',
        opacity: isDragging ? 0.5 : 1,
        boxShadow: isHovered ? 'var(--forge-shadow-md)' : 'var(--forge-shadow-sm)',
        borderColor: isHovered ? 'var(--forge-border-active)' : 'var(--forge-border-default)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{
          fontSize: '11px',
          fontFamily: 'var(--forge-font-mono)',
          color: 'var(--forge-text-muted)',
        }}>
          #{String(order.id || '').slice(-6)}
        </span>
        {createdAt && (
          <span style={{
            fontSize: '10px',
            fontFamily: 'var(--forge-font-mono)',
            color: 'var(--forge-text-muted)',
          }}>
            {formatDate(createdAt)}
          </span>
        )}
      </div>
      <div style={{
        fontFamily: 'var(--forge-font-body)',
        fontWeight: 600,
        fontSize: '13px',
        color: 'var(--forge-text-primary)',
        marginBottom: '6px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {customerName}
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '12px',
        color: 'var(--forge-text-secondary)',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Icon name="Box" size={12} />
          {totalModels} {totalModels === 1 ? 'model' : 'models'}
        </span>
        <span style={{
          fontFamily: 'var(--forge-font-mono)',
          fontWeight: 600,
          color: 'var(--forge-accent-primary)',
        }}>
          {formatMoney(totalAmount)}
        </span>
      </div>
    </div>
  );
}
