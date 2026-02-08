import React from 'react';
import Icon from '../../../../components/AppIcon';
import { STATUS_ORDER, getStatusLabel } from './statusTransitions';

export default function KanbanFilters({ filters = {}, onFiltersChange }) {
  const handleChange = (key, value) => {
    onFiltersChange?.({ ...filters, [key]: value });
  };

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <div className="flex items-center gap-2">
        <Icon name="Filter" size={16} className="text-gray-500" />
        <select
          value={filters.status || ''}
          onChange={e => handleChange('status', e.target.value)}
          className="text-sm border border-gray-300 rounded-md px-2 py-1.5 bg-white"
        >
          <option value="">All Statuses</option>
          {STATUS_ORDER.map(s => (
            <option key={s} value={s}>{getStatusLabel(s)}</option>
          ))}
        </select>
      </div>

      <input
        type="text"
        placeholder="Search customer..."
        value={filters.search || ''}
        onChange={e => handleChange('search', e.target.value)}
        className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white w-48"
      />

      <input
        type="date"
        value={filters.dateFrom || ''}
        onChange={e => handleChange('dateFrom', e.target.value)}
        className="text-sm border border-gray-300 rounded-md px-2 py-1.5 bg-white"
      />
      <span className="text-gray-400 text-sm">to</span>
      <input
        type="date"
        value={filters.dateTo || ''}
        onChange={e => handleChange('dateTo', e.target.value)}
        className="text-sm border border-gray-300 rounded-md px-2 py-1.5 bg-white"
      />

      {(filters.status || filters.search || filters.dateFrom || filters.dateTo) && (
        <button
          onClick={() => onFiltersChange?.({})}
          className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <Icon name="X" size={12} />
          Clear
        </button>
      )}
    </div>
  );
}
