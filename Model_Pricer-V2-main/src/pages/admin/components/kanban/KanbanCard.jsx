import React, { useState, useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import Icon from '../../../../components/AppIcon';
import { computeOrderTotals, extractOrderMaterials } from '../../../../utils/adminOrdersStorage';

export default function KanbanCard({ order, onView, isDragging, isOverlay }) {
  const [isHovered, setIsHovered] = useState(false);

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: order?.id || '',
    disabled: isOverlay,
  });

  if (!order) return null;

  const totalModels = Array.isArray(order.models) ? order.models.length : 0;
  const computed = useMemo(() => {
    try { return computeOrderTotals(order); } catch { return null; }
  }, [order]);
  const totalAmount = computed?.total ?? order.totals_snapshot?.total ?? 0;
  const customerName = order.customer_snapshot?.name || order.customer?.name || order.contact?.name || 'Neznamy';
  const createdAt = order.created_at || order.createdAt;
  const materials = useMemo(() => extractOrderMaterials(order), [order]);

  const formatDate = (iso) => {
    try { return new Date(iso).toLocaleDateString('cs-CZ'); } catch { return ''; }
  };

  const formatMoney = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? `${n.toFixed(0)} Kc` : '0 Kc';
  };

  // Transform style for drag movement (only for inline card, not overlay)
  const dragStyle = transform && !isOverlay
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : {};

  return (
    <div
      ref={!isOverlay ? setNodeRef : undefined}
      {...(!isOverlay ? { ...attributes, ...listeners } : {})}
      onClick={(e) => {
        // Prevent click when dragging
        if (isDragging) return;
        onView?.(order);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: 'var(--forge-bg-elevated)',
        borderRadius: 'var(--forge-radius-lg)',
        border: '1px solid var(--forge-border-default)',
        padding: '12px',
        cursor: isOverlay ? 'grabbing' : 'grab',
        transition: isDragging || isOverlay ? 'none' : 'box-shadow 120ms ease, border-color 120ms ease, transform 120ms ease',
        opacity: isDragging && !isOverlay ? 0.35 : 1,
        boxShadow: isOverlay
          ? '0 12px 32px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(0, 212, 170, 0.25)'
          : (isHovered ? 'var(--forge-shadow-md)' : 'var(--forge-shadow-sm)'),
        borderColor: isOverlay
          ? 'var(--forge-accent-primary)'
          : (isHovered ? 'var(--forge-border-active)' : 'var(--forge-border-default)'),
        transform: isOverlay ? 'scale(1.03) rotate(1.5deg)' : undefined,
        touchAction: 'none',
        userSelect: 'none',
        ...dragStyle,
      }}
    >
      {/* Header: ID + Date */}
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

      {/* Customer name */}
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

      {/* Material badges */}
      {materials.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
          {materials.slice(0, 3).map(mat => (
            <span key={mat} style={{
              fontSize: '9px',
              fontFamily: 'var(--forge-font-tech)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              padding: '2px 6px',
              borderRadius: '999px',
              backgroundColor: 'rgba(0, 212, 170, 0.08)',
              color: 'var(--forge-accent-primary)',
              border: '1px solid rgba(0, 212, 170, 0.18)',
            }}>
              {mat}
            </span>
          ))}
          {materials.length > 3 && (
            <span style={{
              fontSize: '9px',
              fontFamily: 'var(--forge-font-tech)',
              color: 'var(--forge-text-muted)',
              padding: '2px 4px',
            }}>
              +{materials.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer: model count + price */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '12px',
        color: 'var(--forge-text-secondary)',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Icon name="Box" size={12} />
          {totalModels} {totalModels === 1 ? 'model' : 'modelu'}
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
