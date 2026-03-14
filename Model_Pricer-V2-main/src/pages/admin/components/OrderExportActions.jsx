import React, { useCallback, useEffect, useRef, useState } from 'react';
import Icon from '../../../components/AppIcon';
import { useAuth } from '../../../context/AuthContext';
import { exportCSV, exportJSON, downloadFile } from '../../../utils/exportData';
import {
  ORDER_STATUSES,
  collectOrderFlags,
  computeOrderTotals,
  extractOrderMaterials,
  getStatusLabel,
  nowIso,
  appendOrderActivity,
  saveOrders,
} from '../../../utils/adminOrdersStorage';
import { generateOrderSummaryHTML, generatePackingSlipHTML } from '../../../utils/orderExportGenerator';
import { readCompanyData } from '../../../utils/adminCompanyStorage';
import { sanitizeHtmlAllowBasic } from '@/utils/sanitizeHtml';
import {
  EMAIL_TEMPLATE_TYPES,
  loadEmailTemplates,
  renderTemplatePreview,
  addEmailLogEntry,
} from '../../../utils/adminEmailStorage';
import { addNotification } from '../../../utils/adminNotificationStorage';
import { loadTags as loadOrderTags, bulkAddTag } from '../../../utils/adminOrderTagsStorage';

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

/**
 * Open a printable HTML document in a new window and trigger print dialog.
 */
function openPrintWindow(html, title = '') {
  const w = window.open('', '_blank', 'width=820,height=900');
  if (!w) return;
  w.document.write(html);
  w.document.close();
  setTimeout(() => w.print(), 350);
}

/**
 * Shared dropdown menu item style.
 */
const MENU_ITEM_STYLE = {
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
};

const DIVIDER_STYLE = { height: '1px', background: 'var(--forge-border-default)' };

const SECTION_LABEL_STYLE = {
  padding: '8px 14px 4px',
  fontSize: '10px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--forge-text-muted)',
  fontFamily: 'var(--forge-font-tech)',
};

function hoverIn(e) { e.currentTarget.style.background = 'var(--forge-bg-overlay)'; }
function hoverOut(e) { e.currentTarget.style.background = 'transparent'; }

// ============================================================
// Reusable dropdown wrapper
// ============================================================
function DropdownMenu({ trigger, children, align = 'left', minWidth = '210px' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

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

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      {trigger(() => setOpen((v) => !v))}
      {open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          [align === 'right' ? 'right' : 'left']: 0,
          marginTop: '4px',
          minWidth,
          backgroundColor: 'var(--forge-bg-surface)',
          border: '1px solid var(--forge-border-default)',
          borderRadius: 'var(--forge-radius-lg)',
          boxShadow: 'var(--forge-shadow-lg)',
          zIndex: 50,
          maxHeight: '360px',
          overflowY: 'auto',
        }}>
          {typeof children === 'function' ? children(() => setOpen(false)) : children}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Confirmation modal (inline, reusable)
// ============================================================
function BulkConfirmModal({ open, title, children, confirmText = 'Potvrdit', cancelText = 'Zrusit', onConfirm, onCancel, confirmDanger = false }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => { if (e.key === 'Escape' && onCancel) onCancel(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div ref={overlayRef} style={{
      position: 'fixed', inset: 0, background: 'rgba(8, 9, 12, 0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '18px', zIndex: 999,
    }} role="dialog" aria-modal="true">
      <div style={{
        backgroundColor: 'var(--forge-bg-surface)',
        borderRadius: 'var(--forge-radius-xl)',
        padding: '20px', width: '100%', maxWidth: '520px',
        boxShadow: 'var(--forge-shadow-lg)',
        border: '1px solid var(--forge-border-default)',
      }}>
        <div style={{
          fontFamily: 'var(--forge-font-heading)', fontWeight: 800,
          color: 'var(--forge-text-primary)', fontSize: '16px',
        }}>{title}</div>
        <div style={{ marginTop: '12px' }}>
          {children}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
          <button onClick={onCancel} type="button" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            border: '1px solid var(--forge-border-default)', backgroundColor: 'var(--forge-bg-elevated)',
            color: 'var(--forge-text-secondary)', borderRadius: 'var(--forge-radius-lg)',
            padding: '10px 14px', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
            fontFamily: 'var(--forge-font-body)',
          }}>{cancelText}</button>
          <button onClick={onConfirm} type="button" style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            border: `1px solid ${confirmDanger ? 'var(--forge-error)' : 'var(--forge-accent-primary)'}`,
            backgroundColor: confirmDanger ? 'var(--forge-error)' : 'var(--forge-accent-primary)',
            color: confirmDanger ? '#fff' : '#08090C', borderRadius: 'var(--forge-radius-lg)',
            padding: '10px 14px', fontWeight: 800, fontSize: '13px', cursor: 'pointer',
            fontFamily: 'var(--forge-font-body)',
          }}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Progress overlay
// ============================================================
function ProgressOverlay({ open, title, current, total, onDone }) {
  if (!open) return null;
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  const done = current >= total;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(8, 9, 12, 0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '18px', zIndex: 999,
    }} role="dialog" aria-modal="true">
      <div style={{
        backgroundColor: 'var(--forge-bg-surface)',
        borderRadius: 'var(--forge-radius-xl)',
        padding: '24px', width: '100%', maxWidth: '420px',
        boxShadow: 'var(--forge-shadow-lg)',
        border: '1px solid var(--forge-border-default)',
        textAlign: 'center',
      }}>
        <div style={{
          fontFamily: 'var(--forge-font-heading)', fontWeight: 800,
          color: 'var(--forge-text-primary)', fontSize: '16px', marginBottom: '16px',
        }}>{title}</div>

        <div style={{
          width: '100%', height: '8px', borderRadius: '4px',
          background: 'var(--forge-bg-elevated)', overflow: 'hidden',
          marginBottom: '12px',
        }}>
          <div style={{
            width: `${pct}%`, height: '100%',
            background: done ? '#00D4AA' : 'var(--forge-accent-primary)',
            borderRadius: '4px',
            transition: 'width 0.3s ease',
          }} />
        </div>

        <div style={{
          fontFamily: 'var(--forge-font-tech)', fontSize: '12px',
          color: 'var(--forge-text-muted)', marginBottom: done ? '16px' : '0',
        }}>
          {done ? 'Hotovo!' : `${current} / ${total} (${pct}%)`}
        </div>

        {done && (
          <button onClick={onDone} type="button" style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid var(--forge-accent-primary)',
            backgroundColor: 'var(--forge-accent-primary)',
            color: '#08090C', borderRadius: 'var(--forge-radius-lg)',
            padding: '10px 18px', fontWeight: 800, fontSize: '13px', cursor: 'pointer',
            fontFamily: 'var(--forge-font-body)',
          }}>Zavrit</button>
        )}
      </div>
    </div>
  );
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

  const handleExportFullJSON = () => {
    const data = dataToExport();
    const date = todayDateString();
    exportJSON(data, `objednavky_plna-data_${date}.json`);
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
          minWidth: '210px',
          backgroundColor: 'var(--forge-bg-surface)',
          border: '1px solid var(--forge-border-default)',
          borderRadius: 'var(--forge-radius-lg)',
          boxShadow: 'var(--forge-shadow-lg)',
          zIndex: 50,
          overflow: 'hidden',
        }}>
          <div style={SECTION_LABEL_STYLE}>Tabulkovy export</div>
          <button type="button" onClick={handleExportCSV} style={MENU_ITEM_STYLE}
            onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
            <Icon name="FileText" size={15} />
            Export CSV
          </button>
          <div style={DIVIDER_STYLE} />
          <button type="button" onClick={handleExportJSON} style={MENU_ITEM_STYLE}
            onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
            <Icon name="Braces" size={15} />
            Export JSON (prehled)
          </button>
          <div style={DIVIDER_STYLE} />
          <div style={SECTION_LABEL_STYLE}>Plna data</div>
          <button type="button" onClick={handleExportFullJSON} style={MENU_ITEM_STYLE}
            onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
            <Icon name="Database" size={15} />
            Export JSON (kompletni)
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// TEAM MEMBERS — demo list (would come from team storage in production)
// ============================================================
const TEAM_MEMBERS = [
  { id: 'admin', name: 'Admin' },
  { id: 'operator1', name: 'Operator 1' },
  { id: 'operator2', name: 'Operator 2' },
  { id: 'manager', name: 'Manager' },
];

// ============================================================
// ORDER TAGS — loaded from tenant-scoped storage
// ============================================================

// ============================================================
// BulkActionsBar — full-featured toolbar when items are selected
// ============================================================
export function BulkActionsBar({
  selectedIds,
  orders,
  allOrders,
  onDeselectAll,
  onBulkStatusChange,
  onBulkDelete,
  onOrdersUpdate,
}) {
  const { user: authUser } = useAuth();
  const currentUser = authUser?.email || authUser?.displayName || 'admin';
  const [statusModal, setStatusModal] = useState(false);
  const [statusDraft, setStatusDraft] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [statusProgress, setStatusProgress] = useState({ open: false, current: 0, total: 0 });

  const [deleteModal, setDeleteModal] = useState(false);

  const [assignModal, setAssignModal] = useState(false);
  const [assignTo, setAssignTo] = useState('');

  const [tagModal, setTagModal] = useState(false);
  const [selectedTag, setSelectedTag] = useState('');

  const [emailModal, setEmailModal] = useState(false);
  const [emailTemplate, setEmailTemplate] = useState('');
  const [emailPreview, setEmailPreview] = useState(null);
  const [emailProgress, setEmailProgress] = useState({ open: false, current: 0, total: 0 });

  const [invoiceProgress, setInvoiceProgress] = useState({ open: false, current: 0, total: 0 });

  if (!selectedIds || selectedIds.size === 0) return null;

  const count = selectedIds.size;
  const selectedOrders = orders.filter((o) => selectedIds.has(o.id));

  // --- Batch status change with progress ---
  // TODO: Replace simulation (setTimeout) with real API call when backend is available
  const handleBatchStatusChange = () => {
    if (!statusDraft) return;
    setStatusModal(false);
    const toChange = selectedOrders.filter((o) => o.status !== statusDraft);
    if (toChange.length === 0) return;

    setStatusProgress({ open: true, current: 0, total: toChange.length });
    let idx = 0;

    const processNext = () => {
      if (idx >= toChange.length) {
        // All done — persist
        const updatedAll = (allOrders || orders).map((o) => {
          if (!selectedIds.has(o.id) || o.status === statusDraft) return o;
          const activity = [
            {
              timestamp: nowIso(), user_id: currentUser, type: 'STATUS_CHANGE',
              payload: { from: o.status, to: statusDraft, bulk: true, note: statusNote || undefined },
            },
            ...(o.activity || []),
          ].slice(0, 200);
          return { ...o, status: statusDraft, updated_at: nowIso(), activity };
        });
        saveOrders(updatedAll);
        if (onOrdersUpdate) onOrdersUpdate(updatedAll);

        addNotification({
          type: 'order',
          title: `Hromadna zmena statusu: ${toChange.length} objednavek`,
          description: `Status zmenen na "${getStatusLabel(statusDraft, 'cs')}"${statusNote ? ` — ${statusNote}` : ''}`,
        });

        for (const o of toChange) {
          appendOrderActivity(o.id, {
            timestamp: nowIso(), user_id: currentUser, type: 'STATUS_CHANGE',
            payload: { from: o.status, to: statusDraft, bulk: true },
          });
        }
        return;
      }
      idx++;
      setStatusProgress((p) => ({ ...p, current: idx }));
      setTimeout(processNext, 60);
    };

    setTimeout(processNext, 100);
  };

  // --- Batch assign ---
  const handleBatchAssign = () => {
    if (!assignTo) return;
    setAssignModal(false);
    const member = TEAM_MEMBERS.find((m) => m.id === assignTo);
    const updatedAll = (allOrders || orders).map((o) => {
      if (!selectedIds.has(o.id)) return o;
      const activity = [
        {
          timestamp: nowIso(), user_id: currentUser, type: 'ASSIGNED',
          payload: { assigned_to: assignTo, assigned_name: member?.name || assignTo, bulk: true },
        },
        ...(o.activity || []),
      ].slice(0, 200);
      return { ...o, assigned_to: assignTo, updated_at: nowIso(), activity };
    });
    saveOrders(updatedAll);
    if (onOrdersUpdate) onOrdersUpdate(updatedAll);

    addNotification({
      type: 'order',
      title: `Prirazeno: ${count} objednavek`,
      description: `Prirazeno: ${member?.name || assignTo}`,
    });
    onDeselectAll();
  };

  // --- Batch tag ---
  const allTags = loadOrderTags();

  const handleBatchTag = () => {
    if (!selectedTag) return;
    setTagModal(false);
    const tag = allTags.find((t) => t.id === selectedTag);
    // Update tag assignments in storage
    bulkAddTag(Array.from(selectedIds), selectedTag);
    // Also update order objects for in-memory consistency
    const updatedAll = (allOrders || orders).map((o) => {
      if (!selectedIds.has(o.id)) return o;
      const existingTags = o.tags || [];
      if (existingTags.includes(selectedTag)) return o;
      const activity = [
        {
          timestamp: nowIso(), user_id: currentUser, type: 'TAG_ADDED',
          payload: { tag: selectedTag, label: tag?.label || selectedTag, bulk: true },
        },
        ...(o.activity || []),
      ].slice(0, 200);
      return { ...o, tags: [...existingTags, selectedTag], updated_at: nowIso(), activity };
    });
    saveOrders(updatedAll);
    if (onOrdersUpdate) onOrdersUpdate(updatedAll);

    addNotification({
      type: 'order',
      title: `Stitek pridan: ${count} objednavek`,
      description: `Stitek: ${tag?.label || selectedTag}`,
    });
    onDeselectAll();
  };

  // --- Batch packing slips ---
  const handleBatchPackingSlips = () => {
    const company = readCompanyData();
    const combinedHtml = selectedOrders.map((o) =>
      generatePackingSlipHTML(o, company)
        .replace('<!DOCTYPE html>', '')
        .replace(/<html[\s\S]*?<body>/, '')
        .replace(/<\/body>[\s\S]*?<\/html>/, '')
    ).join('<div style="page-break-before: always;"></div>');

    const wrapperHtml = `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="utf-8" />
  <title>Dodaci listy — ${count} objednavek</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1f2937; background: #fff; padding: 40px; max-width: 800px; margin: 0 auto; line-height: 1.5; }
    @media print { body { padding: 20px; } .no-print { display: none !important; } }
    table { width: 100%; border-collapse: collapse; }
    .label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--forge-text-secondary, #9BA3B0); margin-bottom: 6px; }
    .th { padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7280; border-bottom: 2px solid #e5e7eb; background: #f9fafb; }
    .th-center { text-align: center; }
    .td { padding: 10px 12px; font-size: 13px; color: #1f2937; border-bottom: 1px solid #e5e7eb; }
    .td-muted { color: #4b5563; }
    .td-center { text-align: center; }
    .td-bold { font-weight: 600; }
    .checkbox { display: inline-block; width: 16px; height: 16px; border: 2px solid var(--forge-text-secondary, #9BA3B0); border-radius: 3px; vertical-align: middle; margin-right: 8px; }
  </style>
</head>
<body>
  ${combinedHtml}
</body>
</html>`;

    openPrintWindow(wrapperHtml, `Dodaci listy — ${count} objednavek`);
  };

  // --- Batch invoices ---
  const handleBatchInvoices = () => {
    if (selectedOrders.length === 0) return;
    const company = readCompanyData();
    setInvoiceProgress({ open: true, current: 0, total: selectedOrders.length });
    let idx = 0;
    const invoiceHtmlParts = [];

    const processNext = () => {
      if (idx >= selectedOrders.length) {
        // Combine and download all as single HTML
        const combinedBody = invoiceHtmlParts.join('<div style="page-break-before: always;"></div>');
        const fullHtml = `<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="utf-8" />
  <title>Faktury — ${count} objednavek</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1f2937; background: #fff; padding: 40px; max-width: 800px; margin: 0 auto; line-height: 1.5; }
    @media print { body { padding: 20px; } }
    table { width: 100%; border-collapse: collapse; }
    .label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--forge-text-secondary, #9BA3B0); margin-bottom: 6px; }
    .th { padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7280; border-bottom: 2px solid #e5e7eb; background: #f9fafb; }
    .th-right { text-align: right; }
    .th-center { text-align: center; }
    .td { padding: 10px 12px; font-size: 13px; color: #1f2937; border-bottom: 1px solid #e5e7eb; }
    .td-muted { color: #4b5563; }
    .td-right { text-align: right; font-variant-numeric: tabular-nums; }
    .td-center { text-align: center; }
    .td-bold { font-weight: 600; }
  </style>
</head>
<body>
  ${combinedBody}
</body>
</html>`;

        const date = todayDateString();
        downloadFile(fullHtml, `faktury_${date}_${count}ks.html`, 'text/html;charset=utf-8;');

        addNotification({
          type: 'order',
          title: `Faktury vygenerovany: ${count}`,
          description: `Stazeny jako HTML soubor`,
        });
        return;
      }

      const order = selectedOrders[idx];
      const html = generateOrderSummaryHTML(order, company);
      const bodyContent = html
        .replace('<!DOCTYPE html>', '')
        .replace(/<html[\s\S]*?<body>/, '')
        .replace(/<\/body>[\s\S]*?<\/html>/, '');
      invoiceHtmlParts.push(bodyContent);

      idx++;
      setInvoiceProgress((p) => ({ ...p, current: idx }));
      setTimeout(processNext, 40);
    };

    setTimeout(processNext, 100);
  };

  // --- Batch email ---
  const handleEmailPreview = () => {
    if (!emailTemplate) return;
    const templates = loadEmailTemplates();
    const tpl = templates[emailTemplate];
    if (!tpl) return;

    // Preview using first selected order's data
    const firstOrder = selectedOrders[0];
    const previewData = {};
    if (firstOrder) {
      const totals = computeOrderTotals(firstOrder);
      previewData.customerName = firstOrder.customer_snapshot?.name || 'Zakaznik';
      previewData.customerEmail = firstOrder.customer_snapshot?.email || '';
      previewData.orderId = firstOrder.id || '';
      previewData.orderDate = firstOrder.created_at
        ? new Date(firstOrder.created_at).toLocaleDateString('cs-CZ')
        : '';
      previewData.totalPrice = `${totals.total.toFixed(2)} Kc`;
      previewData.itemCount = String((firstOrder.models || []).length);
      previewData.statusText = getStatusLabel(firstOrder.status, 'cs');
    }

    const rendered = renderTemplatePreview(tpl.body, tpl.subject);
    setEmailPreview(rendered);
  };

  // TODO: Replace simulation (setTimeout + addEmailLogEntry with status:'sent') with real API call when backend is available
  const handleBatchEmail = () => {
    if (!emailTemplate) return;
    setEmailModal(false);
    const templates = loadEmailTemplates();
    const tpl = templates[emailTemplate];
    if (!tpl) return;

    const recipients = selectedOrders.filter((o) => o.customer_snapshot?.email);
    if (recipients.length === 0) return;
    setEmailProgress({ open: true, current: 0, total: recipients.length });
    let idx = 0;

    const processNext = () => {
      if (idx >= recipients.length) {
        addNotification({
          type: 'email',
          title: `Email odeslan: ${recipients.length} zakazniku`,
          description: `Sablona: ${EMAIL_TEMPLATE_TYPES.find((t) => t.id === emailTemplate)?.label_cs || emailTemplate}`,
        });
        return;
      }

      const order = recipients[idx];
      addEmailLogEntry({
        template: emailTemplate,
        recipient: order.customer_snapshot?.email || '',
        subject: tpl.subject.replace(/\{\{orderId\}\}/g, order.id || ''),
        orderId: order.id,
        status: 'sent',
      });

      idx++;
      setEmailProgress((p) => ({ ...p, current: idx }));
      setTimeout(processNext, 80);
    };

    setTimeout(processNext, 100);
  };

  // --- Batch delete ---
  const handleBatchDelete = () => {
    setDeleteModal(false);
    if (onBulkDelete) {
      onBulkDelete(selectedIds);
    } else {
      // Fallback: delete from allOrders
      const updatedAll = (allOrders || orders).filter((o) => !selectedIds.has(o.id));
      saveOrders(updatedAll);
      if (onOrdersUpdate) onOrdersUpdate(updatedAll);
      addNotification({
        type: 'order',
        title: `Smazano: ${count} objednavek`,
        description: 'Objednavky byly trvale odstraneny',
      });
      onDeselectAll();
    }
  };

  const btnStyle = {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    border: '1px solid var(--forge-border-default)', background: 'var(--forge-bg-elevated)',
    color: 'var(--forge-text-secondary)', borderRadius: 'var(--forge-radius-lg)',
    padding: '6px 10px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
    fontFamily: 'var(--forge-font-body)', transition: 'all var(--forge-duration-micro) ease',
    whiteSpace: 'nowrap',
  };

  const btnDangerStyle = {
    ...btnStyle,
    border: '1px solid rgba(255, 71, 87, 0.3)',
    color: 'var(--forge-error)',
    background: 'rgba(255, 71, 87, 0.06)',
  };

  return (
    <>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 14px',
        background: 'rgba(0, 212, 170, 0.06)',
        border: '1px solid rgba(0, 212, 170, 0.2)',
        borderRadius: 'var(--forge-radius-lg)',
        marginBottom: '12px',
        flexWrap: 'wrap',
      }}>
        {/* Selection count */}
        <span style={{
          fontSize: '13px', fontWeight: 700,
          color: 'var(--forge-accent-primary)',
          fontFamily: 'var(--forge-font-body)', whiteSpace: 'nowrap',
        }}>
          Vybrano: {count}
        </span>

        {/* Deselect */}
        <button type="button" onClick={onDeselectAll} style={btnStyle}
          onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
          <Icon name="X" size={14} />
          Zrusit vyber
        </button>

        <div style={{ width: '1px', height: '20px', background: 'var(--forge-border-default)', margin: '0 2px' }} />

        {/* Status change */}
        <button type="button" onClick={() => { setStatusDraft(''); setStatusNote(''); setStatusModal(true); }}
          style={btnStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
          <Icon name="RefreshCcw" size={14} />
          Zmenit stav
        </button>

        {/* Assign */}
        <button type="button" onClick={() => { setAssignTo(''); setAssignModal(true); }}
          style={btnStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
          <Icon name="UserPlus" size={14} />
          Priradit
        </button>

        {/* Tag */}
        <button type="button" onClick={() => { setSelectedTag(''); setTagModal(true); }}
          style={btnStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
          <Icon name="Tag" size={14} />
          Pridat stitek
        </button>

        <div style={{ width: '1px', height: '20px', background: 'var(--forge-border-default)', margin: '0 2px' }} />

        {/* Print packing slips */}
        <button type="button" onClick={handleBatchPackingSlips}
          style={btnStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
          <Icon name="Printer" size={14} />
          Dodaci listy
        </button>

        {/* Export selected */}
        <ExportDropdown orders={orders} selectedIds={selectedIds} />

        {/* Generate invoices */}
        <button type="button" onClick={handleBatchInvoices}
          style={btnStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
          <Icon name="FileText" size={14} />
          Generovat faktury
        </button>

        {/* Bulk email */}
        <button type="button" onClick={() => { setEmailTemplate(''); setEmailPreview(null); setEmailModal(true); }}
          style={btnStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
          <Icon name="Mail" size={14} />
          Hromadny email
        </button>

        <div style={{ flex: '1 1 0', minWidth: '4px' }} />

        {/* Delete */}
        <button type="button" onClick={() => setDeleteModal(true)}
          style={btnDangerStyle} onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 71, 87, 0.12)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 71, 87, 0.06)'; }}>
          <Icon name="Trash2" size={14} />
          Smazat ({count})
        </button>
      </div>

      {/* === MODALS === */}

      {/* Status change modal */}
      <BulkConfirmModal
        open={statusModal}
        title={`Zmena statusu — ${count} objednavek`}
        confirmText={`Zmenit stav (${count})`}
        onConfirm={handleBatchStatusChange}
        onCancel={() => setStatusModal(false)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '12px', fontFamily: 'var(--forge-font-tech)', color: 'var(--forge-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
              Novy status
            </div>
            <select value={statusDraft} onChange={(e) => setStatusDraft(e.target.value)} style={{
              width: '100%', border: '1px solid var(--forge-border-default)',
              borderRadius: 'var(--forge-radius-lg)', padding: '10px',
              fontWeight: 700, background: 'var(--forge-bg-elevated)',
              color: 'var(--forge-text-primary)', fontFamily: 'var(--forge-font-body)',
            }}>
              <option value="">-- Vyber status --</option>
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>{getStatusLabel(s, 'cs')}</option>
              ))}
            </select>
          </div>
          <div>
            <div style={{ fontSize: '12px', fontFamily: 'var(--forge-font-tech)', color: 'var(--forge-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
              Poznamka (nepovinne)
            </div>
            <textarea
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder="Poznamka ke zmene statusu..."
              style={{
                width: '100%', border: '1px solid var(--forge-border-default)',
                borderRadius: 'var(--forge-radius-lg)', padding: '10px',
                minHeight: '60px', resize: 'vertical',
                background: 'var(--forge-bg-elevated)', color: 'var(--forge-text-primary)',
                fontFamily: 'var(--forge-font-body)', fontSize: '13px',
              }}
            />
          </div>
          <div style={{ fontSize: '12px', color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-body)' }}>
            Bude zmeneno {count} objednavek. Zmena se zapise do audit logu.
          </div>
        </div>
      </BulkConfirmModal>

      {/* Status progress */}
      <ProgressOverlay
        open={statusProgress.open}
        title="Zmena statusu..."
        current={statusProgress.current}
        total={statusProgress.total}
        onDone={() => { setStatusProgress({ open: false, current: 0, total: 0 }); onDeselectAll(); }}
      />

      {/* Assign modal */}
      <BulkConfirmModal
        open={assignModal}
        title={`Prirazeni — ${count} objednavek`}
        confirmText={`Priradit (${count})`}
        onConfirm={handleBatchAssign}
        onCancel={() => setAssignModal(false)}
      >
        <div>
          <div style={{ fontSize: '12px', fontFamily: 'var(--forge-font-tech)', color: 'var(--forge-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
            Priradit clenu tymu
          </div>
          <select value={assignTo} onChange={(e) => setAssignTo(e.target.value)} style={{
            width: '100%', border: '1px solid var(--forge-border-default)',
            borderRadius: 'var(--forge-radius-lg)', padding: '10px',
            fontWeight: 700, background: 'var(--forge-bg-elevated)',
            color: 'var(--forge-text-primary)', fontFamily: 'var(--forge-font-body)',
          }}>
            <option value="">-- Vyber clena tymu --</option>
            {TEAM_MEMBERS.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      </BulkConfirmModal>

      {/* Tag modal */}
      <BulkConfirmModal
        open={tagModal}
        title={`Pridat stitek — ${count} objednavek`}
        confirmText={`Pridat stitek (${count})`}
        onConfirm={handleBatchTag}
        onCancel={() => setTagModal(false)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '12px', fontFamily: 'var(--forge-font-tech)', color: 'var(--forge-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Vyber stitek
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {allTags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => setSelectedTag(tag.id)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  border: `2px solid ${selectedTag === tag.id ? tag.color : 'var(--forge-border-default)'}`,
                  background: selectedTag === tag.id ? `${tag.color}15` : 'var(--forge-bg-elevated)',
                  color: selectedTag === tag.id ? tag.color : 'var(--forge-text-secondary)',
                  borderRadius: '999px', padding: '6px 12px',
                  fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'var(--forge-font-body)',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: tag.color, flexShrink: 0,
                }} />
                {tag.label}
              </button>
            ))}
          </div>
        </div>
      </BulkConfirmModal>

      {/* Email modal */}
      <BulkConfirmModal
        open={emailModal}
        title={`Hromadny email — ${count} objednavek`}
        confirmText={`Odeslat (${selectedOrders.filter((o) => o.customer_snapshot?.email).length})`}
        onConfirm={handleBatchEmail}
        onCancel={() => setEmailModal(false)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '12px', fontFamily: 'var(--forge-font-tech)', color: 'var(--forge-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
              Email sablona
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select value={emailTemplate} onChange={(e) => { setEmailTemplate(e.target.value); setEmailPreview(null); }} style={{
                flex: 1, border: '1px solid var(--forge-border-default)',
                borderRadius: 'var(--forge-radius-lg)', padding: '10px',
                fontWeight: 700, background: 'var(--forge-bg-elevated)',
                color: 'var(--forge-text-primary)', fontFamily: 'var(--forge-font-body)',
              }}>
                <option value="">-- Vyber sablonu --</option>
                {EMAIL_TEMPLATE_TYPES.filter((t) => t.id !== 'custom').map((t) => (
                  <option key={t.id} value={t.id}>{t.label_cs}</option>
                ))}
              </select>
              <button type="button" onClick={handleEmailPreview} disabled={!emailTemplate} style={{
                ...btnStyle, opacity: emailTemplate ? 1 : 0.4,
              }}>
                <Icon name="Eye" size={14} />
                Nahled
              </button>
            </div>
          </div>

          {emailPreview && (
            <div style={{
              border: '1px solid var(--forge-border-default)',
              borderRadius: 'var(--forge-radius-lg)',
              background: 'var(--forge-bg-elevated)',
              padding: '12px', maxHeight: '200px', overflowY: 'auto',
            }}>
              <div style={{ fontSize: '11px', fontFamily: 'var(--forge-font-tech)', color: 'var(--forge-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                Predmet: {emailPreview.subject}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--forge-text-secondary)', fontFamily: 'var(--forge-font-body)' }}
                dangerouslySetInnerHTML={{ __html: sanitizeHtmlAllowBasic(emailPreview.body) }} />
            </div>
          )}

          <div style={{ fontSize: '12px', color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-body)' }}>
            Email bude odeslan {selectedOrders.filter((o) => o.customer_snapshot?.email).length} zakaznikum.
            {selectedOrders.filter((o) => !o.customer_snapshot?.email).length > 0 && (
              <span style={{ color: 'var(--forge-warning)' }}>
                {' '}({selectedOrders.filter((o) => !o.customer_snapshot?.email).length} objednavek nema email.)
              </span>
            )}
            {' '}Kazdy email bude zalogovan.
          </div>
        </div>
      </BulkConfirmModal>

      {/* Email progress */}
      <ProgressOverlay
        open={emailProgress.open}
        title="Odesilani emailu..."
        current={emailProgress.current}
        total={emailProgress.total}
        onDone={() => { setEmailProgress({ open: false, current: 0, total: 0 }); onDeselectAll(); }}
      />

      {/* Invoice progress */}
      <ProgressOverlay
        open={invoiceProgress.open}
        title="Generovani faktur..."
        current={invoiceProgress.current}
        total={invoiceProgress.total}
        onDone={() => { setInvoiceProgress({ open: false, current: 0, total: 0 }); onDeselectAll(); }}
      />

      {/* Delete confirmation */}
      <BulkConfirmModal
        open={deleteModal}
        title={`Smazat ${count} objednavek?`}
        confirmText={`Smazat (${count})`}
        confirmDanger
        onConfirm={handleBatchDelete}
        onCancel={() => setDeleteModal(false)}
      >
        <div style={{ color: 'var(--forge-text-secondary)', fontFamily: 'var(--forge-font-body)', fontSize: '14px', lineHeight: 1.5 }}>
          Tato akce je <strong style={{ color: 'var(--forge-error)' }}>nevratna</strong>. Vybrane objednavky budou trvale smazany vcetne vsech modelu, poznamek a audit logu.
        </div>
      </BulkConfirmModal>
    </>
  );
}

export default ExportDropdown;
