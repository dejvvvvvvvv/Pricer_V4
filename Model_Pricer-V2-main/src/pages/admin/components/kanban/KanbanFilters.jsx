import React from 'react';
import Icon from '../../../../components/AppIcon';
import { STATUS_ORDER, getStatusLabel } from './statusTransitions';

const inputStyle = {
  fontSize: '13px',
  fontFamily: 'var(--forge-font-body)',
  border: '1px solid var(--forge-border-default)',
  borderRadius: 'var(--forge-radius-md)',
  padding: '6px 10px',
  backgroundColor: 'var(--forge-bg-elevated)',
  color: 'var(--forge-text-primary)',
  outline: 'none',
};

const selectStyle = {
  ...inputStyle,
};

export default function KanbanFilters({ filters = {}, onFiltersChange }) {
  const handleChange = (key, value) => {
    onFiltersChange?.({ ...filters, [key]: value });
  };

  const hasAnyFilter = filters.status || filters.search || filters.dateFrom || filters.dateTo;

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Icon name="Filter" size={16} style={{ color: 'var(--forge-text-muted)' }} />
        <select
          value={filters.status || ''}
          onChange={e => handleChange('status', e.target.value)}
          style={selectStyle}
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
        style={{ ...inputStyle, width: '192px' }}
      />

      <input
        type="date"
        value={filters.dateFrom || ''}
        onChange={e => handleChange('dateFrom', e.target.value)}
        style={inputStyle}
      />
      <span style={{
        color: 'var(--forge-text-muted)',
        fontSize: '12px',
        fontFamily: 'var(--forge-font-tech)',
        textTransform: 'uppercase',
      }}>
        to
      </span>
      <input
        type="date"
        value={filters.dateTo || ''}
        onChange={e => handleChange('dateTo', e.target.value)}
        style={inputStyle}
      />

      {hasAnyFilter && (
        <button
          onClick={() => onFiltersChange?.({})}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            fontFamily: 'var(--forge-font-tech)',
            color: 'var(--forge-text-secondary)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            padding: '4px 8px',
            borderRadius: 'var(--forge-radius-sm)',
            transition: 'color var(--forge-duration-micro) ease',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--forge-accent-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--forge-text-secondary)'}
        >
          <Icon name="X" size={12} />
          Clear
        </button>
      )}
    </div>
  );
}
