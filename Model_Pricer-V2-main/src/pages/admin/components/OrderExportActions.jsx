import React, { useCallback, useEffect, useRef, useState } from 'react';
import Icon from '../../../components/AppIcon';
import { exportCSV, exportJSON } from '../../../utils/exportData';
import {
  ORDER_STATUSES,
  collectOrderFlags,
  computeOrderTotals,
  extractOrderMaterials,
  getStatusLabel,
} from '../../../utils/adminOrdersStorage';

// ============================================================
// CSV column definitions for order export
// ============================================================
const CSV_COLUMNS = [
  { key: 'order_id', label: 'Order ID' },
  { key: 'created_at', label: 'Datum vytvoreni' },
  { key: 'status', label: 'Status' },
  { key: 'customer_name', label: 'Zakaznik' },
  { key: 'customer_email', label: 'Email' },
  { key: 'models_count', label: 'Pocet modelu' },
  { key: 'pieces', label: 'Kusy' },
  { key: 'materials', label: 'Material' },
  { key: 'print_time_min', label: 'Cas tisku (min)' },
  { key: 'weight_g', label: 'Hmotnost (g)' },
  { key: 'total_price', label: 'Celkova cena' },
  { key: 'file_names', label: 'Soubory' },
  { key: 'flags', label: 'Flags' },
];

/**
 * Flatten an order object into a plain row object suitable for CSV/JSON export.
 */
function flattenOrder(o) {
  const totals = computeOrderTotals(o);
  const fileNames = (o.models || [])
    .map((m) => m?.file_snapshot?.filename)
    .filter(Boolean)
    .join(' | ');

  return {
    order_id: o.id,
    created_at: o.created_at,
    status: o.status,
    customer_name: o.customer_snapshot?.name || '',
    customer_email: o.customer_snapshot?.email || '',
    models_count: (o.models || []).length,
    pieces: totals.sum_pieces,
    materials: extractOrderMaterials(o).join(', '),
    print_time_min: totals.sum_time_min,
    weight_g: totals.sum_weight_g,
    total_price: totals.total,
    file_names: fileNames,
    flags: collectOrderFlags(o).join(', '),
  };
}

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

// ============================================================
// ExportDropdown — "Export" button with CSV / JSON options
// ============================================================
export function ExportDropdown({ orders, selectedIds }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const dataToExport = useCallback(() => {
    if (selectedIds && selectedIds.size > 0) {
      return orders.filter((o) => selectedIds.has(o.id));
    }
    return orders;
  }, [orders, selectedIds]);

  const handleExportCSV = () => {
    const rows = dataToExport().map(flattenOrder);
    const date = todayDateString();
    exportCSV(rows, `objednavky_${date}.csv`, CSV_COLUMNS);
    setOpen(false);
  };

  const handleExportJSON = () => {
    const rows = dataToExport().map(flattenOrder);
    const date = todayDateString();
    exportJSON(rows, `objednavky_${date}.json`);
    setOpen(false);
  };

  const count = selectedIds && selectedIds.size > 0 ? selectedIds.size : orders.length;
  const label = selectedIds && selectedIds.size > 0 ? `Export (${count})` : 'Export';

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <Icon name="Download" size={16} />
        {label}
        <Icon name="ChevronDown" size={14} style={{ marginLeft: '2px', opacity: 0.6 }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '4px',
          minWidth: '180px',
          backgroundColor: 'var(--forge-bg-surface)',
          border: '1px solid var(--forge-border-default)',
          borderRadius: 'var(--forge-radius-lg)',
          boxShadow: 'var(--forge-shadow-lg)',
          zIndex: 50,
          overflow: 'hidden',
        }}>
          <button
            type="button"
            onClick={handleExportCSV}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              width: '100%',
              padding: '10px 14px',
              border: 'none',
              background: 'transparent',
              color: 'var(--forge-text-secondary)',
              fontFamily: 'var(--forge-font-body)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background var(--forge-duration-micro) ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--forge-bg-overlay)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <Icon name="FileText" size={15} />
            Export CSV
          </button>
          <div style={{ height: '1px', background: 'var(--forge-border-default)' }} />
          <button
            type="button"
            onClick={handleExportJSON}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              width: '100%',
              padding: '10px 14px',
              border: 'none',
              background: 'transparent',
              color: 'var(--forge-text-secondary)',
              fontFamily: 'var(--forge-font-body)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background var(--forge-duration-micro) ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--forge-bg-overlay)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <Icon name="Braces" size={15} />
            Export JSON
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// BulkActionsBar — appears when items are selected
// ============================================================
export function BulkActionsBar({ selectedIds, orders, onDeselectAll, onBulkStatusChange }) {
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const statusRef = useRef(null);

  useEffect(() => {
    if (!statusMenuOpen) return;
    function handleClick(e) {
      if (statusRef.current && !statusRef.current.contains(e.target)) {
        setStatusMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [statusMenuOpen]);

  if (!selectedIds || selectedIds.size === 0) return null;

  const count = selectedIds.size;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '10px 14px',
      background: 'rgba(0, 212, 170, 0.06)',
      border: '1px solid rgba(0, 212, 170, 0.2)',
      borderRadius: 'var(--forge-radius-lg)',
      marginBottom: '12px',
      flexWrap: 'wrap',
    }}>
      <span style={{
        fontSize: '13px',
        fontWeight: 700,
        color: 'var(--forge-accent-primary)',
        fontFamily: 'var(--forge-font-body)',
        whiteSpace: 'nowrap',
      }}>
        Vybrano: {count}
      </span>

      <button
        type="button"
        onClick={onDeselectAll}
        className="btn"
        style={{ padding: '6px 10px', fontSize: '12px' }}
      >
        <Icon name="X" size={14} />
        Zrusit vyber
      </button>

      {/* Bulk status change */}
      <div ref={statusRef} style={{ position: 'relative', display: 'inline-block' }}>
        <button
          type="button"
          onClick={() => setStatusMenuOpen((v) => !v)}
          className="btn"
          style={{ padding: '6px 10px', fontSize: '12px' }}
        >
          <Icon name="RefreshCcw" size={14} />
          Zmenit stav
          <Icon name="ChevronDown" size={12} style={{ marginLeft: '2px', opacity: 0.6 }} />
        </button>

        {statusMenuOpen && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: '4px',
            minWidth: '160px',
            backgroundColor: 'var(--forge-bg-surface)',
            border: '1px solid var(--forge-border-default)',
            borderRadius: 'var(--forge-radius-lg)',
            boxShadow: 'var(--forge-shadow-lg)',
            zIndex: 50,
            maxHeight: '260px',
            overflowY: 'auto',
          }}>
            {ORDER_STATUSES.map((s, idx) => (
              <React.Fragment key={s}>
                {idx > 0 && <div style={{ height: '1px', background: 'var(--forge-border-default)' }} />}
                <button
                  type="button"
                  onClick={() => {
                    onBulkStatusChange(s);
                    setStatusMenuOpen(false);
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px 14px',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--forge-text-secondary)',
                    fontFamily: 'var(--forge-font-body)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background var(--forge-duration-micro) ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--forge-bg-overlay)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  {getStatusLabel(s, 'cs')}
                </button>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Export selected */}
      <ExportDropdown orders={orders} selectedIds={selectedIds} />
    </div>
  );
}

export default ExportDropdown;
