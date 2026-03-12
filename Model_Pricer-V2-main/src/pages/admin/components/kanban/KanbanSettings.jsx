import React, { useState, useEffect } from 'react';
import Icon from '../../../../components/AppIcon';
import { STATUS_ORDER, getStatusLabel, getStatusColor } from './statusTransitions';

/**
 * KanbanSettings — panel for configuring column visibility, WIP limits, and preferences.
 * Persists through kanbanConfig via onConfigChange callback.
 */
export default function KanbanSettings({ kanbanConfig, onConfigChange, onClose }) {
  const config = kanbanConfig || {};
  const configColumns = Array.isArray(config.columns) ? config.columns : [];

  // Build local state from config
  const [localColumns, setLocalColumns] = useState(() => {
    return STATUS_ORDER.map(status => {
      const existing = configColumns.find(c => c.id === status);
      return {
        id: status,
        label: getStatusLabel(status),
        color: getStatusColor(status),
        visible: existing ? existing.visible !== false : true,
        wip_limit: existing?.wip_limit || 0,
        sort_order: existing?.sort_order ?? STATUS_ORDER.indexOf(status),
      };
    });
  });

  const [dirty, setDirty] = useState(false);

  const toggleVisibility = (id) => {
    setLocalColumns(prev => prev.map(c => c.id === id ? { ...c, visible: !c.visible } : c));
    setDirty(true);
  };

  const setWipLimit = (id, value) => {
    const num = Math.max(0, Math.min(99, parseInt(value) || 0));
    setLocalColumns(prev => prev.map(c => c.id === id ? { ...c, wip_limit: num } : c));
    setDirty(true);
  };

  const handleSave = () => {
    const nextConfig = {
      ...(kanbanConfig || {}),
      columns: localColumns,
      updated_at: new Date().toISOString(),
    };
    onConfigChange?.(nextConfig);
    setDirty(false);
  };

  const handleReset = () => {
    setLocalColumns(STATUS_ORDER.map((status, idx) => ({
      id: status,
      label: getStatusLabel(status),
      color: getStatusColor(status),
      visible: true,
      wip_limit: status === 'PRINTING' ? 5 : status === 'POSTPROCESS' ? 3 : 0,
      sort_order: idx,
    })));
    setDirty(true);
  };

  const visibleCount = localColumns.filter(c => c.visible).length;

  return (
    <div style={{
      backgroundColor: 'var(--forge-bg-surface)',
      borderRadius: 'var(--forge-radius-lg)',
      border: '1px solid var(--forge-border-default)',
      padding: '16px',
      marginBottom: '12px',
      animation: 'kanban-settings-slide 180ms ease',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icon name="Settings" size={16} color="var(--forge-text-muted)" />
          <span style={{
            fontFamily: 'var(--forge-font-tech)',
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--forge-text-primary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Nastaveni kanban
          </span>
          <span style={{
            fontSize: '10px',
            fontFamily: 'var(--forge-font-mono)',
            color: 'var(--forge-text-muted)',
          }}>
            ({visibleCount}/{localColumns.length} sloupcu)
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleReset}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontFamily: 'var(--forge-font-tech)',
              color: 'var(--forge-text-muted)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              padding: '4px 8px',
            }}
          >
            <Icon name="RotateCcw" size={12} />
            Reset
          </button>
          {dirty && (
            <button
              onClick={handleSave}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontFamily: 'var(--forge-font-tech)',
                fontWeight: 600,
                color: '#fff',
                backgroundColor: 'var(--forge-accent-primary)',
                border: 'none',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                padding: '5px 12px',
                borderRadius: 'var(--forge-radius-sm)',
              }}
            >
              <Icon name="Save" size={12} />
              Ulozit
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '4px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--forge-text-muted)',
              borderRadius: 'var(--forge-radius-sm)',
            }}
          >
            <Icon name="X" size={16} />
          </button>
        </div>
      </div>

      {/* Column list */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '8px',
      }}>
        {localColumns.map(col => (
          <div
            key={col.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 10px',
              borderRadius: 'var(--forge-radius-md)',
              border: '1px solid var(--forge-border-default)',
              backgroundColor: col.visible ? 'var(--forge-bg-elevated)' : 'transparent',
              opacity: col.visible ? 1 : 0.5,
              transition: 'all 120ms ease',
            }}
          >
            {/* Color dot */}
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: col.color,
              flexShrink: 0,
            }} />

            {/* Label */}
            <span style={{
              flex: 1,
              fontSize: '12px',
              fontFamily: 'var(--forge-font-body)',
              fontWeight: 500,
              color: col.visible ? 'var(--forge-text-primary)' : 'var(--forge-text-muted)',
            }}>
              {col.label}
            </span>

            {/* WIP limit input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span style={{
                fontSize: '9px',
                fontFamily: 'var(--forge-font-tech)',
                color: 'var(--forge-text-muted)',
                textTransform: 'uppercase',
              }}>
                WIP
              </span>
              <input
                type="number"
                min="0"
                max="99"
                value={col.wip_limit || ''}
                placeholder="∞"
                onChange={e => setWipLimit(col.id, e.target.value)}
                style={{
                  width: '36px',
                  fontSize: '11px',
                  fontFamily: 'var(--forge-font-mono)',
                  border: '1px solid var(--forge-border-default)',
                  borderRadius: 'var(--forge-radius-sm)',
                  padding: '2px 4px',
                  textAlign: 'center',
                  backgroundColor: 'var(--forge-bg-surface)',
                  color: 'var(--forge-text-primary)',
                  outline: 'none',
                }}
              />
            </div>

            {/* Visibility toggle */}
            <button
              onClick={() => toggleVisibility(col.id)}
              title={col.visible ? 'Skryt sloupec' : 'Zobrazit sloupec'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: col.visible ? 'var(--forge-accent-primary)' : 'var(--forge-text-muted)',
              }}
            >
              <Icon name={col.visible ? 'Eye' : 'EyeOff'} size={14} />
            </button>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes kanban-settings-slide {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
