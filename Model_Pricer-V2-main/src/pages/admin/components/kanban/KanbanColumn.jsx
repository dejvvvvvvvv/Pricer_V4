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
      className={`flex flex-col w-[280px] min-w-[280px] bg-gray-50 rounded-lg border ${
        isDragOver ? 'border-blue-400 bg-blue-50/30' : 'border-gray-200'
      }`}
    >
      <div className="p-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
          <span className="font-medium text-sm text-gray-900">{label}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${
            isOverWip ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-600'
          }`}>
            {orders.length}{wipLimit > 0 ? `/${wipLimit}` : ''}
          </span>
        </div>
      </div>
      <div className="flex-1 p-2 flex flex-col gap-2 overflow-y-auto max-h-[calc(100vh-280px)]">
        {orders.map(order => (
          <KanbanCard key={order.id} order={order} onView={onViewOrder} />
        ))}
        {orders.length === 0 && (
          <div className="text-center text-xs text-gray-400 py-8">
            No orders
          </div>
        )}
      </div>
    </div>
  );
}
