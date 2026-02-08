import React from 'react';
import Icon from '../../../../components/AppIcon';

export default function KanbanCard({ order, onView, isDragging }) {
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
      className={`bg-white rounded-lg border border-gray-200 p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-mono text-gray-500">#{String(order.id || '').slice(-6)}</span>
        {createdAt && <span className="text-[10px] text-gray-400">{formatDate(createdAt)}</span>}
      </div>
      <div className="font-medium text-sm text-gray-900 mb-1 truncate">{customerName}</div>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Icon name="Box" size={12} />
          {totalModels} {totalModels === 1 ? 'model' : 'models'}
        </span>
        <span className="font-medium text-gray-700">{formatMoney(totalAmount)}</span>
      </div>
    </div>
  );
}
