import React, { useState, useMemo, memo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import Icon from '../../../../components/AppIcon';
import { computeOrderTotals, extractOrderMaterials } from '../../../../utils/adminOrdersStorage';
import { formatMoneyInt } from '../../../../utils/formatters';
import { getNextStatuses, getStatusLabel, getStatusColor, checkOverdue } from './statusTransitions';

/**
 * Format relative time since a date (e.g. "2h", "3d", "1 tyd")
 */
function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) return '';
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  return `${weeks} tyd`;
}

/**
 * Priority color based on order flags or total amount
 */
function getPriorityInfo(order) {
  const flags = order.flags || [];
  if (flags.includes('URGENT') || flags.includes('urgent')) {
    return { color: '#ef4444', label: 'Urgentni' };
  }
  if (flags.includes('VIP') || flags.includes('vip')) {
    return { color: '#f59e0b', label: 'VIP' };
  }
  if (flags.includes('RUSH') || flags.includes('rush')) {
    return { color: '#f97316', label: 'Expresni' };
  }
  return null;
}

const CARD_STYLES = `
  @keyframes kanban-fadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes kanban-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  .kanban-card:focus-visible {
    outline: 2px solid var(--forge-accent-primary);
    outline-offset: 2px;
  }
`;

function KanbanCard({ order, onView, onStatusChange, isDragging, isOverlay }) {
  const [isHovered, setIsHovered] = useState(false);

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: order?.id || '',
    disabled: isOverlay,
  });

  // All hooks must be called before any conditional return (Rules of Hooks)
  const computed = useMemo(() => {
    if (!order) return null;
    try { return computeOrderTotals(order); } catch { return null; }
  }, [order]);
  const materials = useMemo(() => order ? extractOrderMaterials(order) : [], [order]);
  const status = order?.status || 'NEW';
  const updatedAt = order?.updated_at || order?.updatedAt || order?.created_at || order?.createdAt;
  const nextStatuses = useMemo(() => getNextStatuses(status), [status]);
  const priority = useMemo(() => order ? getPriorityInfo(order) : null, [order]);
  const overdueInfo = useMemo(() => checkOverdue(status, updatedAt), [status, updatedAt]);

  if (!order) return null;

  const totalModels = Array.isArray(order.models) ? order.models.length : 0;
  const totalAmount = computed?.total ?? order.totals_snapshot?.total ?? 0;
  const customerName = order.customer_snapshot?.name || order.customer?.name || order.contact?.name || 'Neznamy';
  const customerEmail = order.customer_snapshot?.email || order.customer?.email || order.contact?.email || '';
  const createdAt = order.created_at || order.createdAt;
  const totalPieces = computed?.sum_pieces ?? (order.models || []).reduce((s, m) => s + (m.quantity || 1), 0);


  // Transform style for drag movement (only for inline card, not overlay)
  const dragStyle = transform && !isOverlay
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : {};

  const statusColor = getStatusColor(status);

  return (
    <div
      ref={!isOverlay ? setNodeRef : undefined}
      {...(!isOverlay ? { ...attributes, ...listeners } : {})}
      className="kanban-card"
      onClick={(e) => {
        if (isDragging) return;
        onView?.(order);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        backgroundColor: 'var(--forge-bg-elevated)',
        borderRadius: 'var(--forge-radius-lg)',
        border: `1px solid ${overdueInfo.overdue ? 'rgba(255, 71, 87, 0.4)' : 'var(--forge-border-default)'}`,
        padding: '0',
        cursor: isOverlay ? 'grabbing' : 'grab',
        transition: isDragging || isOverlay ? 'none' : 'box-shadow 150ms ease, border-color 150ms ease, transform 150ms ease',
        opacity: isDragging && !isOverlay ? 0.3 : 1,
        boxShadow: isOverlay
          ? '0 16px 40px rgba(0, 0, 0, 0.4), 0 0 0 2px rgba(0, 212, 170, 0.3)'
          : (isHovered ? 'var(--forge-shadow-md)' : 'var(--forge-shadow-sm)'),
        borderColor: isOverlay
          ? 'var(--forge-accent-primary)'
          : overdueInfo.overdue
            ? 'rgba(255, 71, 87, 0.4)'
            : (isHovered ? 'var(--forge-border-active)' : 'var(--forge-border-default)'),
        transform: isOverlay ? 'scale(1.04) rotate(1.5deg)' : undefined,
        touchAction: 'none',
        userSelect: 'none',
        overflow: 'hidden',
        ...dragStyle,
      }}
    >
      {/* Priority stripe at top */}
      {priority && (
        <div style={{
          height: '3px',
          background: priority.color,
          width: '100%',
        }} />
      )}

      <div style={{ padding: '10px 12px 10px 12px' }}>
        {/* Header: ID + time ago */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '6px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              fontSize: '10px',
              fontFamily: 'var(--forge-font-mono)',
              color: 'var(--forge-text-muted)',
            }}>
              #{String(order.order_number || order.id || '').slice(-6)}
            </span>
            {priority && (
              <span style={{
                fontSize: '8px',
                fontFamily: 'var(--forge-font-tech)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                padding: '1px 5px',
                borderRadius: '999px',
                backgroundColor: `${priority.color}18`,
                color: priority.color,
                border: `1px solid ${priority.color}30`,
              }}>
                {priority.label}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {overdueInfo.overdue && (
              <span title={`Ve stavu ${overdueInfo.hoursInStatus}h (limit ${overdueInfo.thresholdHours}h)`} style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
                fontSize: '9px',
                fontFamily: 'var(--forge-font-tech)',
                fontWeight: 600,
                color: '#ef4444',
                animation: 'kanban-pulse 2s ease-in-out infinite',
              }}>
                <Icon name="AlertTriangle" size={10} color="#ef4444" />
              </span>
            )}
            {createdAt && (
              <span style={{
                fontSize: '10px',
                fontFamily: 'var(--forge-font-mono)',
                color: overdueInfo.overdue ? '#ef4444' : 'var(--forge-text-muted)',
              }}>
                {timeAgo(createdAt)}
              </span>
            )}
          </div>
        </div>

        {/* Customer name + email */}
        <div style={{ marginBottom: '6px' }}>
          <div style={{
            fontFamily: 'var(--forge-font-body)',
            fontWeight: 600,
            fontSize: '13px',
            color: 'var(--forge-text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            lineHeight: 1.3,
          }}>
            {customerName}
          </div>
          {customerEmail && (
            <div style={{
              fontSize: '10px',
              fontFamily: 'var(--forge-font-mono)',
              color: 'var(--forge-text-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {customerEmail}
            </div>
          )}
        </div>

        {/* Material badges */}
        {materials.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginBottom: '8px' }}>
            {materials.slice(0, 3).map(mat => (
              <span key={mat} style={{
                fontSize: '9px',
                fontFamily: 'var(--forge-font-tech)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                padding: '1px 6px',
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
                padding: '1px 4px',
              }}>
                +{materials.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer: models/pieces + price */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: 'var(--forge-text-secondary)',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Icon name="Box" size={11} />
            {totalModels} {totalModels === 1 ? 'model' : 'modelu'}
            {totalPieces > totalModels && (
              <span style={{ color: 'var(--forge-text-muted)', fontSize: '10px' }}>
                ({totalPieces} ks)
              </span>
            )}
          </span>
          <span style={{
            fontFamily: 'var(--forge-font-mono)',
            fontWeight: 700,
            fontSize: '12px',
            color: 'var(--forge-accent-primary)',
          }}>
            {formatMoneyInt(totalAmount)}
          </span>
        </div>

        {/* Quick actions on hover */}
        {isHovered && !isOverlay && !isDragging && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: '8px',
              paddingTop: '8px',
              borderTop: '1px solid var(--forge-border-default)',
              animation: 'kanban-fadeIn 120ms ease',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Quick status change buttons */}
            {nextStatuses.slice(0, 2).map(ns => (
              <button
                key={ns}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onStatusChange?.(order.id, ns, status);
                }}
                title={`Presunout do: ${getStatusLabel(ns)}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  fontSize: '9px',
                  fontFamily: 'var(--forge-font-tech)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  padding: '3px 7px',
                  borderRadius: 'var(--forge-radius-sm)',
                  border: `1px solid ${getStatusColor(ns)}30`,
                  backgroundColor: `${getStatusColor(ns)}10`,
                  color: getStatusColor(ns),
                  cursor: 'pointer',
                  transition: 'all 100ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${getStatusColor(ns)}25`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = `${getStatusColor(ns)}10`;
                }}
              >
                <Icon name="ArrowRight" size={9} />
                {getStatusLabel(ns)}
              </button>
            ))}
            {/* Open detail button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onView?.(order);
              }}
              title="Otevrit detail"
              style={{
                marginLeft: 'auto',
                display: 'inline-flex',
                alignItems: 'center',
                padding: '3px 6px',
                borderRadius: 'var(--forge-radius-sm)',
                border: '1px solid var(--forge-border-default)',
                backgroundColor: 'var(--forge-bg-surface)',
                color: 'var(--forge-text-secondary)',
                cursor: 'pointer',
                transition: 'all 100ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--forge-accent-primary)';
                e.currentTarget.style.borderColor = 'var(--forge-accent-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--forge-text-secondary)';
                e.currentTarget.style.borderColor = 'var(--forge-border-default)';
              }}
            >
              <Icon name="ExternalLink" size={11} />
            </button>
          </div>
        )}
      </div>

      <style>{CARD_STYLES}</style>
    </div>
  );
}

export default memo(KanbanCard);
