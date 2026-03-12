import React, { useState } from 'react';
import Icon from '../../../../components/AppIcon';
import { STATUS_ORDER, getStatusLabel, getStatusColor } from './statusTransitions';

const inputStyle = {
  fontSize: '13px',
  fontFamily: 'var(--forge-font-body)',
  border: '1px solid var(--forge-border-default)',
  borderRadius: 'var(--forge-radius-md)',
  padding: '6px 10px',
  backgroundColor: 'var(--forge-bg-elevated)',
  color: 'var(--forge-text-primary)',
  outline: 'none',
  transition: 'border-color 120ms ease',
};

const selectStyle = {
  ...inputStyle,
  cursor: 'pointer',
};

const btnStyle = {
  display: 'inline-flex',
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
  transition: 'color 120ms ease',
};

export default function KanbanFilters({
  filters = {},
  onFiltersChange,
  allMaterials = [],
  allPriorities = ['URGENT', 'VIP', 'RUSH'],
}) {
  const [expanded, setExpanded] = useState(false);

  const handleChange = (key, value) => {
    onFiltersChange?.({ ...filters, [key]: value });
  };

  const hasAnyFilter = filters.status || filters.search || filters.dateFrom || filters.dateTo || filters.material || filters.priority;
  const activeFilterCount = [filters.status, filters.search, filters.dateFrom || filters.dateTo, filters.material, filters.priority].filter(Boolean).length;

  return (
    <div style={{ marginBottom: '12px' }}>
      {/* Main filter row */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '10px',
      }}>
        {/* Search by customer name */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          border: '1px solid var(--forge-border-default)',
          borderRadius: 'var(--forge-radius-md)',
          padding: '5px 10px',
          backgroundColor: 'var(--forge-bg-elevated)',
          flex: '1 1 180px',
          maxWidth: '260px',
        }}>
          <Icon name="Search" size={14} style={{ color: 'var(--forge-text-muted)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Hledat zakaznika..."
            value={filters.search || ''}
            onChange={e => handleChange('search', e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              fontSize: '13px',
              fontFamily: 'var(--forge-font-body)',
              flex: 1,
              background: 'transparent',
              color: 'var(--forge-text-primary)',
              minWidth: 0,
            }}
          />
          {filters.search && (
            <button
              onClick={() => handleChange('search', '')}
              style={{ ...btnStyle, padding: '0', fontSize: '10px' }}
            >
              <Icon name="X" size={12} />
            </button>
          )}
        </div>

        {/* Status filter */}
        <select
          value={filters.status || ''}
          onChange={e => handleChange('status', e.target.value)}
          style={{
            ...selectStyle,
            borderColor: filters.status ? getStatusColor(filters.status) + '60' : 'var(--forge-border-default)',
          }}
        >
          <option value="">Vsechny stavy</option>
          {STATUS_ORDER.map(s => (
            <option key={s} value={s}>{getStatusLabel(s)}</option>
          ))}
        </select>

        {/* Material filter */}
        {allMaterials.length > 0 && (
          <select
            value={filters.material || ''}
            onChange={e => handleChange('material', e.target.value)}
            style={selectStyle}
          >
            <option value="">Vsechny materialy</option>
            {allMaterials.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        )}

        {/* Expand/collapse advanced filters */}
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            ...btnStyle,
            color: expanded ? 'var(--forge-accent-primary)' : 'var(--forge-text-muted)',
          }}
          title={expanded ? 'Skryt filtry' : 'Vice filtru'}
        >
          <Icon name="SlidersHorizontal" size={14} />
          <span>Filtry</span>
          {activeFilterCount > 0 && (
            <span style={{
              fontSize: '10px',
              fontFamily: 'var(--forge-font-mono)',
              fontWeight: 700,
              padding: '1px 5px',
              borderRadius: '999px',
              backgroundColor: 'rgba(0, 212, 170, 0.15)',
              color: 'var(--forge-accent-primary)',
            }}>
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Clear all */}
        {hasAnyFilter && (
          <button
            onClick={() => onFiltersChange?.({})}
            style={btnStyle}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--forge-accent-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--forge-text-secondary)'}
          >
            <Icon name="X" size={12} />
            Smazat vse
          </button>
        )}
      </div>

      {/* Expanded filters row */}
      {expanded && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '10px',
          marginTop: '10px',
          paddingTop: '10px',
          borderTop: '1px solid var(--forge-border-default)',
          animation: 'kanban-filter-expand 150ms ease',
        }}>
          {/* Date range */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Icon name="Calendar" size={14} style={{ color: 'var(--forge-text-muted)' }} />
            <input
              type="date"
              value={filters.dateFrom || ''}
              onChange={e => handleChange('dateFrom', e.target.value)}
              style={{ ...inputStyle, fontSize: '12px', padding: '5px 8px' }}
              title="Od data"
            />
            <span style={{
              color: 'var(--forge-text-muted)',
              fontSize: '11px',
              fontFamily: 'var(--forge-font-tech)',
            }}>
              —
            </span>
            <input
              type="date"
              value={filters.dateTo || ''}
              onChange={e => handleChange('dateTo', e.target.value)}
              style={{ ...inputStyle, fontSize: '12px', padding: '5px 8px' }}
              title="Do data"
            />
          </div>

          {/* Priority filter */}
          <select
            value={filters.priority || ''}
            onChange={e => handleChange('priority', e.target.value)}
            style={selectStyle}
          >
            <option value="">Vsechny priority</option>
            {allPriorities.map(p => (
              <option key={p} value={p}>{
                p === 'URGENT' ? 'Urgentni' :
                p === 'VIP' ? 'VIP' :
                p === 'RUSH' ? 'Expresni' : p
              }</option>
            ))}
          </select>

          {/* Overdue only toggle */}
          <label style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontFamily: 'var(--forge-font-tech)',
            color: filters.overdueOnly ? '#ef4444' : 'var(--forge-text-secondary)',
            cursor: 'pointer',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            userSelect: 'none',
          }}>
            <input
              type="checkbox"
              checked={!!filters.overdueOnly}
              onChange={e => handleChange('overdueOnly', e.target.checked)}
              style={{ accentColor: '#ef4444', cursor: 'pointer' }}
            />
            <Icon name="AlertTriangle" size={12} />
            Jen zpozdene
          </label>
        </div>
      )}

      <style>{`
        @keyframes kanban-filter-expand {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
