import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import ForgeCheckbox from '../../components/ui/forge/ForgeCheckbox';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSortableData } from '../../hooks/useSortableData';
import {
  ORDER_FLAGS,
  ORDER_STATUSES,
  appendOrderActivity,
  collectOrderFlags,
  computeOrderTotals,
  extractOrderMaterials,
  extractOrderPresets,
  getFlagLabel,
  getOrderStorageStatus,
  getStatusLabel,
  loadOrders,
  nowIso,
  round2,
  saveOrders,
} from '../../utils/adminOrdersStorage';
import { formatDateTime, formatMoney, formatTime } from '../../utils/formatters';
import KanbanBoard from './components/kanban/KanbanBoard';
import { loadKanbanConfigV1, saveKanbanConfigV1 } from '../../utils/adminKanbanStorage';
import { addNotification } from '../../utils/adminNotificationStorage';
import { generateId } from '../../utils/generateId';
import { logActivity } from '../../utils/adminActivityLog';
import OrderDetailModal from './components/orders/OrderDetailModal';
import StorageStatusBadge from './components/orders/StorageStatusBadge';
import { ExportDropdown, BulkActionsBar } from './components/OrderExportActions';
import AdminOrderDetail from './AdminOrderDetail';
import PrintQueue from './components/orders/PrintQueue';
import OrderCalendar from './components/orders/OrderCalendar';
import QuickOrderForm from './components/orders/QuickOrderForm';
import {
  getAllViews,
  loadOrderViews,
  addOrderView,
  updateOrderView,
  deleteOrderView,
  setDefaultOrderView,
  serializeFilters,
  applyViewFilters,
  hasActiveFilters,
} from '../../utils/adminOrderViewsStorage';
import {
  loadTags as loadOrderTags,
  getAllOrderTagAssignments,
  addOrderTag,
  removeOrderTag,
  bulkAddTag,
} from '../../utils/adminOrderTagsStorage';
import { OrderTagChips } from './components/orders/OrderTagSelector';

// =====================================
// Admin Orders — Variant A (front-end demo)
// - Fully functional UI for presenting to customers
// - Persists in localStorage (no backend required)
// - Supports: list+filters, order detail, model detail, status/notes/audit,
//   simulated reprice/reslice with revision history
// =====================================

const PAGE_SIZE = 15;

const viewMenuItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  width: '100%',
  padding: '6px 12px',
  border: 'none',
  background: 'transparent',
  color: 'var(--forge-text-secondary)',
  fontSize: '12px',
  fontFamily: 'var(--forge-font-body)',
  cursor: 'pointer',
  textAlign: 'left',
  whiteSpace: 'nowrap',
};

/** Extract time in minutes from slicer_snapshot (supports seed format + calculator format) */
function getSlicerTimeMin(slicer) {
  if (!slicer) return 0;
  if (Number(slicer.time_min) > 0) return Number(slicer.time_min);
  if (Number(slicer.estimatedTimeSeconds) > 0) return Number(slicer.estimatedTimeSeconds) / 60;
  return 0;
}

/** Extract weight in grams from slicer_snapshot (supports seed format + calculator format) */
function getSlicerWeightG(slicer) {
  if (!slicer) return 0;
  return Number(slicer.weight_g) || Number(slicer.filamentGrams) || 0;
}

function Badge({ children, tone = 'gray' }) {
  const toneMap = {
    gray: { bg: 'var(--forge-bg-elevated)', color: 'var(--forge-text-secondary)', border: 'var(--forge-border-default)' },
    blue: { bg: 'rgba(0, 212, 170, 0.1)', color: 'var(--forge-accent-primary)', border: 'rgba(0, 212, 170, 0.25)' },
    green: { bg: 'rgba(0, 212, 170, 0.15)', color: 'var(--forge-success)', border: 'rgba(0, 212, 170, 0.3)' },
    red: { bg: 'rgba(255, 71, 87, 0.12)', color: 'var(--forge-error)', border: 'rgba(255, 71, 87, 0.3)' },
  };
  const t = toneMap[tone] || toneMap.gray;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '4px 10px',
      borderRadius: '999px',
      fontSize: '11px',
      fontFamily: 'var(--forge-font-tech)',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
      backgroundColor: t.bg,
      color: t.color,
      border: `1px solid ${t.border}`,
    }}>
      {children}
    </span>
  );
}

function PillButton({ active, onClick, children }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      type="button"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: `1px solid ${active ? 'var(--forge-accent-primary)' : 'var(--forge-border-default)'}`,
        background: active ? 'var(--forge-accent-primary)' : (hovered ? 'var(--forge-bg-overlay)' : 'var(--forge-bg-elevated)'),
        color: active ? 'var(--forge-bg-void)' : 'var(--forge-text-secondary)',
        borderRadius: '999px',
        padding: '2px 8px',
        fontSize: '10px',
        fontFamily: 'var(--forge-font-tech)',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.03em',
        cursor: 'pointer',
        transition: 'all var(--forge-duration-micro) ease',
      }}
    >
      {children}
    </button>
  );
}

function SortIcon({ active, direction }) {
  return (
    <span style={{ marginLeft: '4px', opacity: active ? 1 : 0.3, fontSize: '0.7em' }}>
      {direction === 'asc' ? '\u25B2' : '\u25BC'}
    </span>
  );
}

function SortableTh({ sortKey, currentSort, onSort, children }) {
  const active = currentSort && currentSort.key === sortKey;
  return (
    <th
      onClick={() => onSort(sortKey)}
      style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
    >
      {children}
      <SortIcon active={active} direction={active ? currentSort.direction : 'asc'} />
    </th>
  );
}

function ConfirmModal({ open, title, message, confirmText = 'Potvrdit', cancelText = 'Zrusit', onConfirm, onCancel }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const el = overlayRef.current;
    if (!el) return;
    const handleWheel = (e) => { e.preventDefault(); e.stopPropagation(); };
    const handleKeyDown = (e) => { if (e.key === 'Escape' && onCancel) onCancel(); };
    el.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      el.removeEventListener('wheel', handleWheel);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div ref={overlayRef} style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(8, 9, 12, 0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '18px',
      zIndex: 999,
    }} role="dialog" aria-modal="true">
      <div style={{
        backgroundColor: 'var(--forge-bg-surface)',
        borderRadius: 'var(--forge-radius-xl)',
        padding: '20px',
        width: '100%',
        maxWidth: '460px',
        boxShadow: 'var(--forge-shadow-lg)',
        border: '1px solid var(--forge-border-default)',
      }}>
        <div style={{
          fontFamily: 'var(--forge-font-heading)',
          fontWeight: 800,
          color: 'var(--forge-text-primary)',
          fontSize: '16px',
        }}>{title}</div>
        <div style={{
          marginTop: '10px',
          color: 'var(--forge-text-secondary)',
          fontFamily: 'var(--forge-font-body)',
          fontSize: '14px',
          lineHeight: 1.5,
        }}>{message}</div>
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
            border: '1px solid var(--forge-accent-primary)', backgroundColor: 'var(--forge-accent-primary)',
            color: 'var(--forge-bg-void)', borderRadius: 'var(--forge-radius-lg)',
            padding: '10px 14px', fontWeight: 800, fontSize: '13px', cursor: 'pointer',
            fontFamily: 'var(--forge-font-body)',
          }}>{confirmText}</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function OrdersList({ orders, setOrders, onSelectOrder }) {
  const { user: authUser } = useAuth();
  const currentUser = authUser?.email || authUser?.displayName || 'admin';
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState(() => new Set());
  const [materialFilter, setMaterialFilter] = useState(() => new Set());
  const [presetFilter, setPresetFilter] = useState(() => new Set());
  const [flagFilter, setFlagFilter] = useState(() => new Set());
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortKey, setSortKey] = useState('newest');
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState('table');
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [showQuickOrder, setShowQuickOrder] = useState(false);
  const [kanbanConfig, setKanbanConfig] = useState(null);
  // Saved views state
  const [savedViews, setSavedViews] = useState(() => getAllViews());
  const [activeViewId, setActiveViewId] = useState(null);
  const [showSaveViewInput, setShowSaveViewInput] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  const [editingViewId, setEditingViewId] = useState(null);
  const [editingViewName, setEditingViewName] = useState('');
  const [viewMenuOpenId, setViewMenuOpenId] = useState(null);
  const viewMenuRef = useRef(null);

  // Tag system state
  const [tagFilter, setTagFilter] = useState(() => new Set());
  const [allTags, setAllTags] = useState(() => loadOrderTags());
  const [tagAssignments, setTagAssignments] = useState(() => getAllOrderTagAssignments());
  const refreshTags = useCallback(() => {
    setAllTags(loadOrderTags());
    setTagAssignments(getAllOrderTagAssignments());
  }, []);

  const refreshViews = useCallback(() => setSavedViews(getAllViews()), []);

  useEffect(() => {
    try {
      const kc = loadKanbanConfigV1();
      setKanbanConfig(kc);
      if (kc?.view_preference === 'kanban') setViewMode('kanban');
      if (kc?.view_preference === 'print-queue') setViewMode('print-queue');
      if (kc?.view_preference === 'calendar') setViewMode('calendar');
    } catch {}
    // Apply default view on mount
    try {
      const { defaultViewId, allViews } = getAllViews();
      if (defaultViewId) {
        const defaultView = allViews.find((v) => v.id === defaultViewId);
        if (defaultView) {
          setActiveViewId(defaultViewId);
          applyViewFilters(defaultView, {
            setStatusFilter, setMaterialFilter, setPresetFilter,
            setFlagFilter, setDateFrom, setDateTo, setSortKey, setQ,
          });
        }
      }
    } catch {}
  }, []);

  const toggleView = (mode) => {
    setViewMode(mode);
    try {
      const kc = loadKanbanConfigV1();
      saveKanbanConfigV1({ ...kc, view_preference: mode });
    } catch {}
  };

  // Close view context menu on outside click
  useEffect(() => {
    if (!viewMenuOpenId) return;
    const handleClick = (e) => {
      if (viewMenuRef.current && !viewMenuRef.current.contains(e.target)) {
        setViewMenuOpenId(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [viewMenuOpenId]);

  const filterSetters = {
    setStatusFilter, setMaterialFilter, setPresetFilter,
    setFlagFilter, setDateFrom, setDateTo, setSortKey, setQ,
  };

  function handleApplyView(view) {
    setActiveViewId(view.id);
    applyViewFilters(view, filterSetters);
    setViewMenuOpenId(null);
  }

  function handleSaveNewView() {
    const trimmed = newViewName.trim();
    if (!trimmed) return;
    const filters = serializeFilters({ statusFilter, materialFilter, presetFilter, flagFilter, dateFrom, dateTo, sortKey });
    const created = addOrderView(trimmed, filters);
    setActiveViewId(created.id);
    setNewViewName('');
    setShowSaveViewInput(false);
    refreshViews();
  }

  function handleUpdateViewFilters(viewId) {
    const filters = serializeFilters({ statusFilter, materialFilter, presetFilter, flagFilter, dateFrom, dateTo, sortKey });
    updateOrderView(viewId, { filters });
    refreshViews();
    setViewMenuOpenId(null);
  }

  function handleRenameView(viewId) {
    const trimmed = editingViewName.trim();
    if (!trimmed) return;
    updateOrderView(viewId, { name: trimmed });
    setEditingViewId(null);
    setEditingViewName('');
    refreshViews();
    setViewMenuOpenId(null);
  }

  function handleDeleteView(viewId) {
    deleteOrderView(viewId);
    if (activeViewId === viewId) setActiveViewId(null);
    refreshViews();
    setViewMenuOpenId(null);
  }

  function handleSetDefault(viewId) {
    const currentDefault = savedViews.defaultViewId;
    setDefaultOrderView(currentDefault === viewId ? null : viewId);
    refreshViews();
    setViewMenuOpenId(null);
  }

  const currentHasFilters = hasActiveFilters({ statusFilter, materialFilter, presetFilter, flagFilter, dateFrom, dateTo, sortKey });

  const allMaterials = useMemo(() => {
    const set = new Set();
    for (const o of orders) for (const m of extractOrderMaterials(o)) set.add(m);
    return Array.from(set).sort();
  }, [orders]);

  const allPresets = useMemo(() => {
    const set = new Set();
    for (const o of orders) for (const p of extractOrderPresets(o)) set.add(p);
    return Array.from(set).sort();
  }, [orders]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const fromTs = dateFrom ? new Date(dateFrom).getTime() : null;
    const toTs = dateTo ? new Date(dateTo + 'T23:59:59.999').getTime() : null;

    const rows = orders.filter((o) => {
      // search
      if (query) {
        const hay = [
          o.id,
          o.customer_snapshot?.name,
          o.customer_snapshot?.email,
          ...(o.models || []).map((m) => m?.file_snapshot?.filename),
        ].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(query)) return false;
      }

      // date range
      const createdTs = new Date(o.created_at).getTime();
      if (fromTs != null && createdTs < fromTs) return false;
      if (toTs != null && createdTs > toTs) return false;

      // status
      if (statusFilter.size > 0 && !statusFilter.has(o.status)) return false;

      // material
      if (materialFilter.size > 0) {
        const mats = extractOrderMaterials(o);
        if (!mats.some((m) => materialFilter.has(m))) return false;
      }

      // preset
      if (presetFilter.size > 0) {
        const ps = extractOrderPresets(o);
        if (!ps.some((p) => presetFilter.has(p))) return false;
      }

      // flags
      if (flagFilter.size > 0) {
        const flags = collectOrderFlags(o);
        if (!flags.some((f) => flagFilter.has(f))) return false;
      }

      // tags
      if (tagFilter.size > 0) {
        const oTags = tagAssignments[o.id] || [];
        if (!oTags.some((t) => tagFilter.has(t))) return false;
      }

      return true;
    });

    // sorting
    const sorted = [...rows].sort((a, b) => {
      const ta = computeOrderTotals(a);
      const tb = computeOrderTotals(b);
      if (sortKey === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortKey === 'highest_price') return (tb.total || 0) - (ta.total || 0);
      if (sortKey === 'longest_time') return (tb.sum_time_min || 0) - (ta.sum_time_min || 0);
      return 0;
    });

    return sorted;
  }, [orders, q, statusFilter, materialFilter, presetFilter, flagFilter, tagFilter, tagAssignments, dateFrom, dateTo, sortKey]);

  // Column-header sorting: enrich filtered data with sortable fields
  const enrichedFiltered = useMemo(() => {
    return filtered.map((o) => {
      const totals = computeOrderTotals(o);
      return {
        ...o,
        _customerName: (o.customer_snapshot?.name || '').toLowerCase(),
        _total: totals.total || 0,
        _status: o.status || '',
      };
    });
  }, [filtered]);

  const { sortedData: columnSorted, sortConfig: columnSortConfig, requestSort: requestColumnSort } = useSortableData(enrichedFiltered);

  const pageCount = Math.max(1, Math.ceil(columnSorted.length / PAGE_SIZE));
  const pageItems = columnSorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [q, statusFilter, materialFilter, presetFilter, flagFilter, tagFilter, dateFrom, dateTo, sortKey, columnSortConfig?.key, columnSortConfig?.direction]);

  function toggleSet(setter, value) {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value); else next.add(value);
      return next;
    });
  }

  function clearFilters() {
    setQ('');
    setStatusFilter(new Set());
    setMaterialFilter(new Set());
    setPresetFilter(new Set());
    setFlagFilter(new Set());
    setTagFilter(new Set());
    setDateFrom('');
    setDateTo('');
    setSortKey('newest');
    setActiveViewId(null);
  }

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter.size > 0) count++;
    if (materialFilter.size > 0) count++;
    if (presetFilter.size > 0) count++;
    if (flagFilter.size > 0) count++;
    if (tagFilter.size > 0) count++;
    if (dateFrom) count++;
    if (dateTo) count++;
    if (sortKey !== 'newest') count++;
    return count;
  }, [statusFilter, materialFilter, presetFilter, flagFilter, tagFilter, dateFrom, dateTo, sortKey]);

  // Clear selection when filters change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [q, statusFilter, materialFilter, presetFilter, flagFilter, tagFilter, dateFrom, dateTo]);

  function toggleSelection(orderId) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId); else next.add(orderId);
      return next;
    });
  }

  function toggleSelectAll() {
    const pageOrderIds = pageItems.map((o) => o.id);
    const allSelected = pageOrderIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        for (const id of pageOrderIds) next.delete(id);
      } else {
        for (const id of pageOrderIds) next.add(id);
      }
      return next;
    });
  }

  function handleBulkStatusChange(newStatus) {
    if (selectedIds.size === 0) return;
    const selectedIdsCopy = new Set(selectedIds);
    setOrders((prev) => {
      const next = prev.map((o) => {
        if (!selectedIdsCopy.has(o.id) || o.status === newStatus) return o;
        return {
          ...o,
          status: newStatus,
          updated_at: nowIso(),
          activity: [
            { timestamp: nowIso(), user_id: currentUser, type: 'STATUS_CHANGE', payload: { from: o.status, to: newStatus } },
            ...(o.activity || []),
          ].slice(0, 200),
        };
      });
      saveOrders(next);
      let changedCount = 0;
      for (const id of selectedIdsCopy) {
        const orig = prev.find((o) => o.id === id);
        if (orig && orig.status !== newStatus) {
          appendOrderActivity(id, { timestamp: nowIso(), user_id: currentUser, type: 'STATUS_CHANGE', payload: { from: orig.status, to: newStatus } });
          changedCount++;
        }
      }
      if (changedCount > 0) {
        addNotification({
          type: 'order',
          title: `Zmena statusu: ${changedCount} objednavek`,
          description: `Status zmenen na "${getStatusLabel(newStatus)}"`,
        });
      }
      return next;
    });
    setSelectedIds(new Set());
  }

  const allPageSelected = pageItems.length > 0 && pageItems.every((o) => selectedIds.has(o.id));

  function handleDuplicateFromList(e, sourceOrder) {
    e.stopPropagation();
    const newId = generateId('ord');
    const newOrderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;
    const now = nowIso();
    const sourceLabel = sourceOrder.order_number || sourceOrder.id;

    const duplicated = {
      ...JSON.parse(JSON.stringify(sourceOrder)),
      id: newId,
      order_number: newOrderNumber,
      status: 'NEW',
      created_at: now,
      updated_at: now,
      notes: [
        {
          id: generateId('note'),
          text: `Duplikovano z objednavky #${sourceLabel}`,
          author: currentUser,
          created_at: now,
          type: 'text',
          category: 'internal',
          pinned: false,
        },
      ],
      activity: [
        {
          action: 'ORDER_DUPLICATED',
          actor: currentUser,
          timestamp: now,
          details: `Duplikovano z objednavky #${sourceLabel}`,
        },
      ],
    };
    delete duplicated.storage;
    delete duplicated.invoice;
    delete duplicated.payment;

    const updated = [duplicated, ...orders];
    setOrders(updated);
    saveOrders(updated);

    logActivity({
      action: `ORDER_DUPLICATED: ${newOrderNumber} (z ${sourceLabel})`,
      category: 'order',
      details: `${(sourceOrder.customer_snapshot || {}).name || '-'}, ${(sourceOrder.models || []).length} model(u)`,
      user: currentUser,
    });

    addNotification({
      type: 'order',
      title: `Objednavka duplikovana`,
      description: `Nova objednavka ${newOrderNumber} vytvorena z #${sourceLabel}`,
    });

    navigate(`./${newId}`);
  }

  return (
    <div className="orders">
      <div className="page-header">
        <div>
          <h1>{t('admin.orders.title') || 'Orders'}</h1>
          <p className="subtitle">Rychly prehled objednavek, filtru a audit logu. (Demo Varianta A)</p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="toggle-btn"
            style={{
              background: 'var(--forge-accent-primary, #00D4AA)',
              color: 'var(--forge-bg-void, #0A0E17)',
              fontWeight: 600,
              padding: '6px 14px',
              gap: '6px',
              display: 'inline-flex',
              alignItems: 'center',
              borderColor: 'transparent',
            }}
            onClick={() => setShowQuickOrder(true)}
          >
            <Icon name="Plus" size={14} />
            {t('admin.orders.newOrder')}
          </button>
          <div className="view-toggle">
            <button className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`} onClick={() => toggleView('table')} type="button" title="Tabulka">
              <Icon name="List" size={16} />
            </button>
            <button className={`toggle-btn ${viewMode === 'kanban' ? 'active' : ''}`} onClick={() => toggleView('kanban')} type="button" title="Kanban">
              <Icon name="Columns" size={16} />
            </button>
            <button className={`toggle-btn ${viewMode === 'print-queue' ? 'active' : ''}`} onClick={() => toggleView('print-queue')} type="button" title="Tiskova fronta">
              <Icon name="Printer" size={16} />
            </button>
            <button className={`toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`} onClick={() => toggleView('calendar')} type="button" title="Kalendar">
              <Icon name="Calendar" size={16} />
            </button>
          </div>
          <ExportDropdown orders={filtered} selectedIds={selectedIds} />
        </div>
      </div>

      <div className="panel sticky">
        <div className="filters">
          {/* Always-visible row: search + toggle + count + reset */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div className="search" style={{ flex: '1 1 220px', minWidth: 180 }}>
              <Icon name="Search" size={16} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Hledat: order ID, soubor, jmeno, email..."
              />
            </div>
            <button
              type="button"
              onClick={() => setFiltersExpanded((v) => !v)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                border: `1px solid ${activeFilterCount > 0 ? 'var(--forge-accent-primary)' : 'var(--forge-border-default)'}`,
                background: activeFilterCount > 0 ? 'rgba(0, 212, 170, 0.08)' : 'var(--forge-bg-elevated)',
                color: activeFilterCount > 0 ? 'var(--forge-accent-primary)' : 'var(--forge-text-secondary)',
                borderRadius: 'var(--forge-radius-lg)',
                padding: '6px 12px',
                fontSize: '11px',
                fontFamily: 'var(--forge-font-tech)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
                cursor: 'pointer',
                transition: 'all var(--forge-duration-micro) ease',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon name={filtersExpanded ? 'ChevronUp' : 'SlidersHorizontal'} size={14} />
              Filtry{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </button>
            <div style={{
              fontSize: '11px',
              fontFamily: 'var(--forge-font-tech)',
              color: 'var(--forge-text-muted)',
              whiteSpace: 'nowrap',
            }}>
              Zobrazeno: {filtered.length}
            </div>
            {activeFilterCount > 0 && (
              <button className="btn" onClick={clearFilters} type="button" style={{ padding: '4px 10px', fontSize: '11px' }}>
                <Icon name="X" size={12} /> Reset
              </button>
            )}
          </div>

          {/* Saved Views Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexWrap: 'wrap',
            marginTop: '8px',
            paddingTop: '8px',
            borderTop: '1px solid var(--forge-border-default)',
          }}>
            <span style={{
              fontSize: '10px',
              fontFamily: 'var(--forge-font-tech)',
              color: 'var(--forge-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}>Pohledy</span>

            {savedViews.allViews.map((view) => (
              <div key={view.id} style={{ position: 'relative', display: 'inline-flex' }}>
                {editingViewId === view.id ? (
                  <form
                    onSubmit={(e) => { e.preventDefault(); handleRenameView(view.id); }}
                    style={{ display: 'inline-flex', gap: '2px' }}
                  >
                    <input
                      autoFocus
                      value={editingViewName}
                      onChange={(e) => setEditingViewName(e.target.value)}
                      onBlur={() => { setEditingViewId(null); setEditingViewName(''); }}
                      onKeyDown={(e) => { if (e.key === 'Escape') { setEditingViewId(null); setEditingViewName(''); } }}
                      style={{
                        width: '110px',
                        padding: '2px 6px',
                        fontSize: '10px',
                        fontFamily: 'var(--forge-font-tech)',
                        border: '1px solid var(--forge-accent-primary)',
                        borderRadius: '999px',
                        background: 'var(--forge-bg-void)',
                        color: 'var(--forge-text-primary)',
                        outline: 'none',
                      }}
                    />
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleApplyView(view)}
                    onContextMenu={(e) => {
                      if (view.builtin) return;
                      e.preventDefault();
                      setViewMenuOpenId(viewMenuOpenId === view.id ? null : view.id);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      border: `1px solid ${activeViewId === view.id ? 'var(--forge-accent-primary)' : 'var(--forge-border-default)'}`,
                      background: activeViewId === view.id ? 'var(--forge-accent-primary)' : 'var(--forge-bg-elevated)',
                      color: activeViewId === view.id ? 'var(--forge-bg-void)' : 'var(--forge-text-secondary)',
                      borderRadius: '999px',
                      padding: '2px 8px',
                      fontSize: '10px',
                      fontFamily: 'var(--forge-font-tech)',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                      cursor: 'pointer',
                      transition: 'all var(--forge-duration-micro) ease',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {view.isDefault && <Icon name="Star" size={10} />}
                    {view.name}
                    {!view.builtin && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewMenuOpenId(viewMenuOpenId === view.id ? null : view.id);
                        }}
                        style={{ marginLeft: '2px', opacity: 0.6, cursor: 'pointer' }}
                      >
                        <Icon name="MoreVertical" size={10} />
                      </span>
                    )}
                  </button>
                )}

                {/* Context menu for custom views */}
                {viewMenuOpenId === view.id && !view.builtin && (
                  <div
                    ref={viewMenuRef}
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      marginTop: '4px',
                      background: 'var(--forge-bg-surface)',
                      border: '1px solid var(--forge-border-default)',
                      borderRadius: 'var(--forge-radius-lg)',
                      boxShadow: 'var(--forge-shadow-lg)',
                      zIndex: 50,
                      minWidth: '160px',
                      padding: '4px 0',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setEditingViewId(view.id);
                        setEditingViewName(view.name);
                        setViewMenuOpenId(null);
                      }}
                      style={viewMenuItemStyle}
                    >
                      <Icon name="Edit2" size={12} /> Prejmenovat
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateViewFilters(view.id)}
                      style={viewMenuItemStyle}
                    >
                      <Icon name="RefreshCw" size={12} /> Aktualizovat filtry
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetDefault(view.id)}
                      style={viewMenuItemStyle}
                    >
                      <Icon name="Star" size={12} /> {view.isDefault ? 'Zrusit vychozi' : 'Nastavit jako vychozi'}
                    </button>
                    <div style={{ height: '1px', background: 'var(--forge-border-default)', margin: '4px 0' }} />
                    <button
                      type="button"
                      onClick={() => handleDeleteView(view.id)}
                      style={{ ...viewMenuItemStyle, color: 'var(--forge-error)' }}
                    >
                      <Icon name="Trash2" size={12} /> Smazat
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Save as view button / input */}
            {showSaveViewInput ? (
              <form
                onSubmit={(e) => { e.preventDefault(); handleSaveNewView(); }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <input
                  autoFocus
                  value={newViewName}
                  onChange={(e) => setNewViewName(e.target.value)}
                  placeholder="Nazev pohledu..."
                  onKeyDown={(e) => { if (e.key === 'Escape') { setShowSaveViewInput(false); setNewViewName(''); } }}
                  style={{
                    width: '140px',
                    padding: '2px 8px',
                    fontSize: '10px',
                    fontFamily: 'var(--forge-font-tech)',
                    border: '1px solid var(--forge-accent-primary)',
                    borderRadius: '999px',
                    background: 'var(--forge-bg-void)',
                    color: 'var(--forge-text-primary)',
                    outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  disabled={!newViewName.trim()}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '2px',
                    border: '1px solid var(--forge-accent-primary)',
                    background: 'var(--forge-accent-primary)',
                    color: 'var(--forge-bg-void)',
                    borderRadius: '999px',
                    padding: '2px 8px',
                    fontSize: '10px',
                    fontFamily: 'var(--forge-font-tech)',
                    fontWeight: 700,
                    cursor: newViewName.trim() ? 'pointer' : 'not-allowed',
                    opacity: newViewName.trim() ? 1 : 0.5,
                  }}
                >
                  <Icon name="Check" size={10} /> Ulozit
                </button>
                <button
                  type="button"
                  onClick={() => { setShowSaveViewInput(false); setNewViewName(''); }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    border: '1px solid var(--forge-border-default)',
                    background: 'var(--forge-bg-elevated)',
                    color: 'var(--forge-text-secondary)',
                    borderRadius: '999px',
                    padding: '2px 6px',
                    fontSize: '10px',
                    cursor: 'pointer',
                  }}
                >
                  <Icon name="X" size={10} />
                </button>
              </form>
            ) : currentHasFilters ? (
              <button
                type="button"
                onClick={() => setShowSaveViewInput(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  border: '1px dashed var(--forge-border-default)',
                  background: 'transparent',
                  color: 'var(--forge-text-muted)',
                  borderRadius: '999px',
                  padding: '2px 8px',
                  fontSize: '10px',
                  fontFamily: 'var(--forge-font-tech)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all var(--forge-duration-micro) ease',
                }}
              >
                <Icon name="Plus" size={10} /> Ulozit pohled
              </button>
            ) : null}
          </div>

          {/* Collapsible filter body */}
          <div style={{
            maxHeight: filtersExpanded ? '400px' : '0px',
            overflow: 'hidden',
            transition: 'max-height 0.25s ease',
            marginTop: filtersExpanded ? '8px' : '0px',
          }}>
            {/* Row 1: STATUS + MATERIAL */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '10px', fontFamily: 'var(--forge-font-tech)', color: 'var(--forge-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Status</span>
                {ORDER_STATUSES.map((s) => (
                  <PillButton key={s} active={statusFilter.has(s)} onClick={() => toggleSet(setStatusFilter, s)}>
                    {getStatusLabel(s, language)}
                  </PillButton>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '10px', fontFamily: 'var(--forge-font-tech)', color: 'var(--forge-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Material</span>
                {allMaterials.length === 0 ? (
                  <span className="muted">--</span>
                ) : allMaterials.map((m) => (
                  <PillButton key={m} active={materialFilter.has(m)} onClick={() => toggleSet(setMaterialFilter, m)}>
                    {m}
                  </PillButton>
                ))}
              </div>
            </div>

            {/* Row 2: PRESET + FLAGS */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '10px', fontFamily: 'var(--forge-font-tech)', color: 'var(--forge-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Preset</span>
                {allPresets.length === 0 ? (
                  <span className="muted">--</span>
                ) : allPresets.map((p) => (
                  <PillButton key={p} active={presetFilter.has(p)} onClick={() => toggleSet(setPresetFilter, p)}>
                    {p}
                  </PillButton>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '10px', fontFamily: 'var(--forge-font-tech)', color: 'var(--forge-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Flags</span>
                {ORDER_FLAGS.map((f) => (
                  <PillButton key={f} active={flagFilter.has(f)} onClick={() => toggleSet(setFlagFilter, f)}>
                    {f}
                  </PillButton>
                ))}
              </div>
            </div>

            {/* Row 3: TAGS */}
            {allTags.length > 0 && (
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '10px', fontFamily: 'var(--forge-font-tech)', color: 'var(--forge-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Stitky</span>
                  {allTags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleSet(setTagFilter, tag.id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        border: `1px solid ${tagFilter.has(tag.id) ? tag.color : 'var(--forge-border-default)'}`,
                        background: tagFilter.has(tag.id) ? `${tag.color}20` : 'var(--forge-bg-elevated)',
                        color: tagFilter.has(tag.id) ? tag.color : 'var(--forge-text-secondary)',
                        borderRadius: '999px',
                        padding: '2px 8px',
                        fontSize: '10px',
                        fontFamily: 'var(--forge-font-tech)',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em',
                        cursor: 'pointer',
                        transition: 'all var(--forge-duration-micro) ease',
                      }}
                    >
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: tag.color, flexShrink: 0 }} />
                      {tag.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Row 4: Date range + Sort */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div className="date-range" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '10px', fontFamily: 'var(--forge-font-tech)', color: 'var(--forge-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Od</span>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div className="date-range" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '10px', fontFamily: 'var(--forge-font-tech)', color: 'var(--forge-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Do</span>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
              <div className="sort" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '10px', fontFamily: 'var(--forge-font-tech)', color: 'var(--forge-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Razeni</span>
                <select value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
                  <option value="newest">Nejnovejsi</option>
                  <option value="highest_price">Nejvyssi cena</option>
                  <option value="longest_time">Nejdelsi cas tisku</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BulkActionsBar
        selectedIds={selectedIds}
        orders={filtered}
        allOrders={orders}
        onDeselectAll={() => setSelectedIds(new Set())}
        onBulkStatusChange={handleBulkStatusChange}
        onBulkDelete={(ids) => {
          const next = orders.filter((o) => !ids.has(o.id));
          setOrders(next);
          saveOrders(next);
          addNotification({
            type: 'order',
            title: `Smazano: ${ids.size} objednavek`,
            description: 'Objednavky byly trvale odstraneny',
          });
          setSelectedIds(new Set());
        }}
        onOrdersUpdate={(updatedOrders) => {
          setOrders(updatedOrders);
          setSelectedIds(new Set());
          refreshTags();
        }}
      />

      {viewMode === 'calendar' ? (
        <OrderCalendar
          orders={filtered}
          onViewOrder={(orderId) => navigate(`./${orderId}`)}
          language={language}
        />
      ) : viewMode === 'print-queue' ? (
        <PrintQueue
          orders={orders}
          setOrders={setOrders}
          onViewOrder={(orderId) => navigate(`./${orderId}`)}
        />
      ) : viewMode === 'table' ? (
        <div className="panel">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '36px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={allPageSelected}
                      onChange={toggleSelectAll}
                      title="Vybrat vse na strance"
                      style={{ accentColor: 'var(--forge-accent-primary)', cursor: 'pointer' }}
                    />
                  </th>
                  <th>ORDER ID</th>
                  <SortableTh sortKey="created_at" currentSort={columnSortConfig} onSort={requestColumnSort}>CREATED</SortableTh>
                  <SortableTh sortKey="_customerName" currentSort={columnSortConfig} onSort={requestColumnSort}>CUSTOMER</SortableTh>
                  <th>MODELS / PCS</th>
                  <th>MATERIAL(S)</th>
                  <th>PRINT TIME</th>
                  <th>WEIGHT</th>
                  <SortableTh sortKey="_total" currentSort={columnSortConfig} onSort={requestColumnSort}>TOTAL</SortableTh>
                  <SortableTh sortKey="_status" currentSort={columnSortConfig} onSort={requestColumnSort}>STATUS</SortableTh>
                  <th>STITKY</th>
                  <th>FLAGS</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((o, idx) => {
                  const totals = computeOrderTotals(o);
                  const mats = extractOrderMaterials(o);
                  const flags = collectOrderFlags(o);
                  return (
                    <tr
                      key={o.id}
                      className={`${idx % 2 === 0 ? 'row-even' : 'row-odd'}${selectedIds.has(o.id) ? ' row-selected' : ''}`}
                      onClick={() => navigate(`./${o.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ textAlign: 'center', width: '36px' }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(o.id)}
                          onChange={() => toggleSelection(o.id)}
                          onClick={(e) => e.stopPropagation()}
                          style={{ accentColor: 'var(--forge-accent-primary)', cursor: 'pointer' }}
                        />
                      </td>
                      <td className="mono">{o.id}</td>
                      <td className="mono">{formatDateTime(o.created_at)}</td>
                      <td>
                        <div className="customer">
                          <div className="customer-name">{o.customer_snapshot?.name || '--'}</div>
                          <div className="customer-sub">{o.customer_snapshot?.email || ''}</div>
                        </div>
                      </td>
                      <td>
                        <div className="muted">{(o.models || []).length} / {totals.sum_pieces}</div>
                      </td>
                      <td>
                        <div className="muted">{mats.join(', ') || '--'}</div>
                      </td>
                      <td className="mono">{formatTime(totals.sum_time_min)}</td>
                      <td className="mono">{round2(totals.sum_weight_g)} g</td>
                      <td className="strong">{formatMoney(totals.total)}</td>
                      <td>
                        <Badge tone={o.status === 'CANCELED' ? 'red' : o.status === 'DONE' ? 'green' : 'blue'}>
                          {getStatusLabel(o.status, language)}
                        </Badge>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <OrderTagChips
                          orderId={o.id}
                          allTags={allTags}
                          assignments={tagAssignments}
                          size="small"
                          onRemove={(tagId) => {
                            removeOrderTag(o.id, tagId);
                            refreshTags();
                          }}
                        />
                      </td>
                      <td>
                        <div className="flags">
                          {flags.slice(0, 3).map((f) => (
                            <span key={f} title={getFlagLabel(f, language)} className="flag">
                              <Icon name="AlertTriangle" size={14} />
                            </span>
                          ))}
                          {flags.length > 3 ? <span className="muted">+{flags.length - 3}</span> : null}
                        </div>
                      </td>
                      <td className="actions">
                        <button className="btn-primary btn-small" onClick={(e) => { e.stopPropagation(); navigate(`./${o.id}`); }} type="button">
                          Detail
                        </button>
                        <button
                          className="btn-small"
                          onClick={(e) => handleDuplicateFromList(e, o)}
                          type="button"
                          title="Duplikovat objednavku"
                          style={{
                            marginLeft: '4px',
                            background: 'transparent',
                            border: '1px solid var(--forge-border-default)',
                            color: 'var(--forge-text-secondary)',
                            cursor: 'pointer',
                            borderRadius: 'var(--forge-radius-md)',
                            padding: '4px 8px',
                            fontSize: '12px',
                            fontFamily: 'var(--forge-font-body)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--forge-accent-primary)'; e.currentTarget.style.color = 'var(--forge-accent-primary)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--forge-border-default)'; e.currentTarget.style.color = 'var(--forge-text-secondary)'; }}
                        >
                          <Icon name="Copy" size={12} /> Duplikovat
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="empty">Zadne objednavky pro zvolene filtry.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          {pageCount > 1 && (
            <div className="pagination">
              <button className="btn" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} type="button">
                <Icon name="ChevronLeft" size={16} /> Predchozi
              </button>
              <div className="muted">Strana {page} / {pageCount}</div>
              <button className="btn" disabled={page >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))} type="button">
                Dalsi <Icon name="ChevronRight" size={16} />
              </button>
            </div>
          )}
        </div>
      ) : (
        <KanbanBoard
          orders={filtered}
          kanbanConfig={kanbanConfig}
          onViewOrder={(order) => navigate(`./${order?.id || order}`)}
          onStatusChange={(orderId, newStatus) => {
            const orig = orders.find(o => o.id === orderId);
            const next = orders.map(o => {
              if (o.id !== orderId) return o;
              return { ...o, status: newStatus, updated_at: nowIso(), activity: [{ timestamp: nowIso(), user_id: currentUser, type: 'STATUS_CHANGE', payload: { from: o.status, to: newStatus } }, ...(o.activity || [])].slice(0, 200) };
            });
            setOrders(next);
            saveOrders(next);
            if (orig && orig.status !== newStatus) {
              addNotification({
                type: 'order',
                title: `Objednavka #${(orig.order_number || orderId).toString().slice(-6)}`,
                description: `Status: ${getStatusLabel(orig.status)} → ${getStatusLabel(newStatus)}`,
              });
            }
          }}
          onConfigChange={(newConfig) => {
            const saved = saveKanbanConfigV1(newConfig);
            setKanbanConfig(saved);
          }}
        />
      )}

      <QuickOrderForm
        open={showQuickOrder}
        onClose={() => setShowQuickOrder(false)}
        onCreated={() => {
          setOrders(loadOrders());
          setShowQuickOrder(false);
        }}
      />

      <style>{`
        .orders { max-width: 1200px; }
        .page-header { display:flex; align-items:flex-end; justify-content:space-between; gap: 12px; margin-bottom: 18px; }
        h1 { margin: 0 0 6px 0; font-size: 28px; font-weight: 800; color: var(--forge-text-primary); font-family: var(--forge-font-heading); }
        .subtitle { margin: 0; font-size: 14px; color: var(--forge-text-muted); font-family: var(--forge-font-body); }
        .header-actions { display:flex; gap: 10px; }

        .panel { background: var(--forge-bg-surface); border-radius: var(--forge-radius-xl); padding: 16px; box-shadow: var(--forge-shadow-sm); margin-bottom: 16px; border: 1px solid var(--forge-border-default); }
        .panel.sticky { position: sticky; top: 64px; z-index: 2; }

        .filters { display:flex; flex-direction: column; gap: 12px; }
        .search { display:flex; align-items:center; gap: 8px; border: 1px solid var(--forge-border-default); border-radius: var(--forge-radius-lg); padding: 10px 12px; background: var(--forge-bg-elevated); color: var(--forge-text-muted); }
        .search input { border:none; outline:none; font-size: 14px; flex:1; background: transparent; color: var(--forge-text-primary); font-family: var(--forge-font-body); }
        .search input::placeholder { color: var(--forge-text-muted); }

        .filter-row { display:flex; flex-wrap: wrap; gap: 16px; }
        .filter-group { flex: 1; min-width: 220px; }
        .filter-label { font-size: 11px; font-family: var(--forge-font-tech); color: var(--forge-text-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.06em; }
        .pill-row { display:flex; flex-wrap: wrap; gap: 8px; }

        .date-range input, .sort select {
          border: 1px solid var(--forge-border-default);
          border-radius: var(--forge-radius-lg);
          padding: 8px 10px;
          font-size: 14px;
          background: var(--forge-bg-elevated);
          color: var(--forge-text-primary);
          font-family: var(--forge-font-body);
        }
        .right-actions { margin-left: auto; display:flex; align-items:center; gap: 10px; }
        .count { font-size: 12px; color: var(--forge-text-muted); font-family: var(--forge-font-mono); }

        .table-wrap { width: 100%; overflow: auto; }
        .table { width: 100%; border-collapse: collapse; min-width: 1050px; }
        th {
          text-align:left;
          font-size: 11px;
          font-family: var(--forge-font-tech);
          color: var(--forge-text-muted);
          font-weight: 700;
          padding: 10px 8px;
          border-bottom: 1px solid var(--forge-border-default);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        td { padding: 10px 8px; border-bottom: 1px solid var(--forge-border-default); vertical-align: top; color: var(--forge-text-secondary); }
        .row-even { background: var(--forge-bg-surface); }
        .row-odd { background: var(--forge-bg-elevated); }
        tr:hover td { background: var(--forge-bg-overlay); }
        .row-selected td { background: rgba(0, 212, 170, 0.06); }
        .mono { font-family: var(--forge-font-mono); font-size: 12px; color: var(--forge-text-secondary); }
        .muted { color: var(--forge-text-muted); font-size: 13px; }
        .strong { font-weight: 800; color: var(--forge-accent-primary); font-family: var(--forge-font-mono); }
        .actions { text-align:right; }
        .empty { text-align:center; padding: 24px; color: var(--forge-text-muted); }

        .customer-name { font-weight: 700; color: var(--forge-text-primary); font-size: 13px; }
        .customer-sub { font-size: 12px; color: var(--forge-text-muted); }

        .flags { display:flex; align-items:center; gap: 6px; }
        .flag { display:inline-flex; align-items:center; justify-content:center; width: 22px; height: 22px; border-radius: 6px; border:1px solid rgba(255,181,71,0.3); background: rgba(255,181,71,0.1); color: var(--forge-warning); }

        .btn { display:inline-flex; align-items:center; gap: 8px; border:1px solid var(--forge-border-default); background: var(--forge-bg-elevated); color: var(--forge-text-secondary); border-radius: var(--forge-radius-lg); padding: 10px 12px; font-weight: 700; font-size: 13px; cursor:pointer; font-family: var(--forge-font-body); transition: all var(--forge-duration-micro) ease; }
        .btn:hover:not(:disabled) { background: var(--forge-bg-overlay); border-color: var(--forge-border-active); color: var(--forge-text-primary); }
        .btn:disabled { opacity:.4; cursor:not-allowed; }
        .btn-primary { display:inline-flex; align-items:center; justify-content:center; border:1px solid var(--forge-accent-primary); background: var(--forge-accent-primary); color: var(--forge-bg-void); border-radius: var(--forge-radius-lg); padding: 10px 12px; font-weight: 800; font-size: 13px; cursor:pointer; font-family: var(--forge-font-body); transition: all var(--forge-duration-micro) ease; }
        .btn-primary:hover { background: var(--forge-accent-primary-h); border-color: var(--forge-accent-primary-h); }
        .btn-small { padding: 8px 10px; border-radius: var(--forge-radius-lg); }

        .pagination { display:flex; align-items:center; justify-content: space-between; gap: 10px; margin-top: 12px; }

        .view-toggle { display: flex; border: 1px solid var(--forge-border-default); border-radius: var(--forge-radius-lg); overflow: hidden; }
        .toggle-btn { border: none; background: var(--forge-bg-elevated); color: var(--forge-text-muted); padding: 8px 10px; cursor: pointer; display: flex; align-items: center; transition: all var(--forge-duration-micro) ease; }
        .toggle-btn:hover { background: var(--forge-bg-overlay); color: var(--forge-text-secondary); }
        .toggle-btn.active { background: rgba(0, 212, 170, 0.12); color: var(--forge-accent-primary); }
        .toggle-btn + .toggle-btn { border-left: 1px solid var(--forge-border-default); }

        @media (max-width: 900px) {
          .panel.sticky { position: relative; top: auto; }
        }
      `}</style>
    </div>
  );
}

function OrderDetail({ orders, setOrders }) {
  const { user: authUser } = useAuth();
  const currentUser = authUser?.email || authUser?.displayName || 'admin';
  const { language } = useLanguage();
  const navigate = useNavigate();
  const params = useParams();
  const orderId = params.id;

  const order = useMemo(() => orders.find((o) => o.id === orderId), [orders, orderId]);

  const [statusDraft, setStatusDraft] = useState(order?.status || 'NEW');
  const [noteDraft, setNoteDraft] = useState('');
  const [confirm, setConfirm] = useState(null); // {type}

  useEffect(() => {
    setStatusDraft(order?.status || 'NEW');
  }, [order?.status]);

  if (!order) {
    return (
      <div style={{
        background: 'var(--forge-bg-surface)',
        borderRadius: 'var(--forge-radius-xl)',
        padding: '16px',
        boxShadow: 'var(--forge-shadow-sm)',
        border: '1px solid var(--forge-border-default)',
      }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
          <button className="btn" onClick={() => navigate('../')} type="button">
            <Icon name="ChevronLeft" size={16} /> Zpet
          </button>
        </div>
        <div style={{ padding: '18px', color: 'var(--forge-text-muted)', textAlign: 'center', fontFamily: 'var(--forge-font-body)' }}>
          Objednavka nenalezena.
        </div>
        <style>{`
          .btn { display:inline-flex; align-items:center; gap: 8px; border:1px solid var(--forge-border-default); background: var(--forge-bg-elevated); color: var(--forge-text-secondary); border-radius: var(--forge-radius-lg); padding: 10px 12px; font-weight: 700; font-size: 13px; cursor:pointer; font-family: var(--forge-font-body); }
          .btn:hover { background: var(--forge-bg-overlay); }
        `}</style>
      </div>
    );
  }

  const totals = computeOrderTotals(order);
  const flags = collectOrderFlags(order);

  function persist(nextOrder, activityEntry) {
    const next = orders.map((o) => (o.id === nextOrder.id ? nextOrder : o));
    setOrders(next);
    saveOrders(next);

    if (activityEntry) {
      appendOrderActivity(nextOrder.id, activityEntry);
    }
  }

  function changeStatus(nextStatus) {
    if (nextStatus === order.status) return;
    const updated = {
      ...order,
      status: nextStatus,
      updated_at: nowIso(),
      activity: [
        {
          timestamp: nowIso(),
          user_id: currentUser,
          type: 'STATUS_CHANGE',
          payload: { from: order.status, to: nextStatus },
        },
        ...(order.activity || []),
      ].slice(0, 200),
    };
    persist(updated, { timestamp: nowIso(), user_id: currentUser, type: 'STATUS_CHANGE', payload: { from: order.status, to: nextStatus } });
  }

  function addNote() {
    const text = noteDraft.trim();
    if (!text) return;
    const updated = {
      ...order,
      updated_at: nowIso(),
      notes: [
        {
          id: `n-${Date.now()}`,
          timestamp: nowIso(),
          user_id: currentUser,
          text,
        },
        ...(order.notes || []),
      ].slice(0, 200),
      activity: [
        {
          timestamp: nowIso(),
          user_id: currentUser,
          type: 'NOTE_ADDED',
          payload: { length: text.length },
        },
        ...(order.activity || []),
      ].slice(0, 200),
    };
    persist(updated, { timestamp: nowIso(), user_id: currentUser, type: 'NOTE_ADDED', payload: { length: text.length } });
    setNoteDraft('');
  }

  function simulateReprice(targetOrder) {
    // Create a price revision for each model; demo only
    const updatedModels = (targetOrder.models || []).map((m) => {
      const prev = m.price_breakdown_snapshot || {};
      const factor = 0.95 + Math.random() * 0.12; // DEMO: mock data only — price drift simulation
      const next = {
        ...prev,
        material_cost: round2((prev.material_cost || 0) * factor),
        time_cost: round2((prev.time_cost || 0) * factor),
      };
      next.fees_total = prev.fees_total || 0;
      next.model_subtotal = round2((next.material_cost || 0) + (next.time_cost || 0) + (next.fees_total || 0));
      next.model_total = next.model_subtotal;

      const revId = `p${(m.revisions?.price?.length || 0)}`;
      return {
        ...m,
        price_breakdown_snapshot: next,
        revisions: {
          ...(m.revisions || { price: [], slicer: [] }),
          price: [
            {
              id: revId,
              created_at: nowIso(),
              reason: 'reprice',
              price_breakdown_snapshot: next,
            },
            ...(m.revisions?.price || []),
          ].slice(0, 30),
        },
      };
    });

    const updated = {
      ...targetOrder,
      models: updatedModels,
      updated_at: nowIso(),
      activity: [
        {
          timestamp: nowIso(),
          user_id: currentUser,
          type: 'REPRICE',
          payload: { note: 'Simulated reprice in demo (Variant A)' },
        },
        ...(targetOrder.activity || []),
      ].slice(0, 200),
    };

    return updated;
  }

  function simulateReslice(targetOrder) {
    const updatedModels = (targetOrder.models || []).map((m) => {
      const prev = m.slicer_snapshot || {};
      const factor = 0.92 + Math.random() * 0.18; // DEMO: mock data only — slicer drift simulation
      const next = {
        ...prev,
        time_min: Math.max(1, Math.round((prev.time_min || 0) * factor)),
        weight_g: round2(Math.max(0.1, (prev.weight_g || 0) * (0.97 + Math.random() * 0.06))), // DEMO: mock data only
      };
      const revId = `s${(m.revisions?.slicer?.length || 0)}`;
      return {
        ...m,
        slicer_snapshot: next,
        revisions: {
          ...(m.revisions || { price: [], slicer: [] }),
          slicer: [
            {
              id: revId,
              created_at: nowIso(),
              reason: 'reslice',
              slicer_snapshot: next,
            },
            ...(m.revisions?.slicer || []),
          ].slice(0, 30),
        },
      };
    });

    let updated = {
      ...targetOrder,
      models: updatedModels,
      updated_at: nowIso(),
      activity: [
        {
          timestamp: nowIso(),
          user_id: currentUser,
          type: 'RESLICE',
          payload: { note: 'Simulated reslice in demo (Variant A)' },
        },
        ...(targetOrder.activity || []),
      ].slice(0, 200),
    };

    // auto reprice after reslice
    updated = simulateReprice(updated);
    return updated;
  }

  function onAction(type) {
    setConfirm({ type });
  }

  function onConfirmAction() {
    if (!confirm) return;
    if (confirm.type === 'reprice') {
      const updated = simulateReprice(order);
      persist(updated, { timestamp: nowIso(), user_id: currentUser, type: 'REPRICE', payload: { demo: true } });
    }
    if (confirm.type === 'reslice') {
      const updated = simulateReslice(order);
      persist(updated, { timestamp: nowIso(), user_id: currentUser, type: 'RESLICE', payload: { demo: true } });
    }
    setConfirm(null);
  }

  const statusTone = order.status === 'CANCELED' ? 'red' : order.status === 'DONE' ? 'green' : 'blue';

  return (
    <div className="detail">
      <div className="header">
        <button className="btn" onClick={() => navigate('../')} type="button">
          <Icon name="ChevronLeft" size={16} /> Zpet
        </button>
        <div className="title">
          <div className="h">Order {order.id}</div>
          <div className="sub">Vytvoreno: {formatDateTime(order.created_at)} / Modelu: {(order.models || []).length}</div>
        </div>
        <div className="right">
          <Badge tone={statusTone}>{getStatusLabel(order.status, language)}</Badge>
        </div>
      </div>

      {flags.length > 0 ? (
        <div className="banner">
          <Icon name="AlertTriangle" size={18} />
          <div>
            <div className="banner-title">Pozor: tento order ma flags</div>
            <div className="banner-sub">{flags.map((f) => getFlagLabel(f, language)).join(' / ')}</div>
          </div>
        </div>
      ) : null}

      <div className="grid">
        <div className="left">
          <div className="panel">
            <div className="panel-title">ZAKAZNIK</div>
            <div className="kv">
              <div className="k">Jmeno</div><div className="v">{order.customer_snapshot?.name || '--'}</div>
              <div className="k">Email</div><div className="v">{order.customer_snapshot?.email || '--'}</div>
              <div className="k">Telefon</div><div className="v">{order.customer_snapshot?.phone || '--'}</div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-title">MODELY</div>
            <div className="models">
              {(order.models || []).map((m) => {
                const bd = m.price_breakdown_snapshot || {};
                return (
                  <div key={m.id} className="model-card">
                    <div className="model-top">
                      <div>
                        <div className="model-file">{m.file_snapshot?.filename || 'model'}</div>
                        <div className="model-sub">Material: {m.material_snapshot?.name || '--'} / Preset: {m.preset_snapshot?.name || '--'} / Qty: {m.quantity}</div>
                      </div>
                      <button className="btn-primary btn-small" onClick={() => navigate(`./${order.id}/model/${m.id}`)} type="button">
                        Detail
                      </button>
                    </div>

                    <div className="model-mid">
                      <div className="mini">
                        <div className="mini-k">CAS</div>
                        <div className="mini-v">{formatTime(getSlicerTimeMin(m?.slicer_snapshot))}</div>
                      </div>
                      <div className="mini">
                        <div className="mini-k">HMOTNOST</div>
                        <div className="mini-v">{round2(getSlicerWeightG(m?.slicer_snapshot))} g</div>
                      </div>
                      <div className="mini">
                        <div className="mini-k">XYZ</div>
                        <div className="mini-v">{m?.slicer_snapshot?.dimensions_xyz?.x}x{m?.slicer_snapshot?.dimensions_xyz?.y}x{m?.slicer_snapshot?.dimensions_xyz?.z} mm</div>
                      </div>
                    </div>

                    <div className="breakdown">
                      <div className="b-row"><span>Material</span><span>{formatMoney(bd.material_cost || 0)}</span></div>
                      <div className="b-row"><span>Time</span><span>{formatMoney(bd.time_cost || 0)}</span></div>
                      <div className="b-row"><span>Fees</span><span>{formatMoney(bd.fees_total || 0)}</span></div>
                      <div className="b-row total"><span>Model total (1 ks)</span><span>{formatMoney(bd.model_total || 0)}</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="panel">
            <div className="panel-title">ORDER TOTALS</div>
            <div className="breakdown">
              <div className="b-row"><span>Subtotal models</span><span>{formatMoney(totals.subtotal_models)}</span></div>
              <div className="b-row"><span>One-time fees</span><span>{formatMoney(totals.one_time_fees_total)}</span></div>
              <div className="b-row"><span>Shipping</span><span>{formatMoney(totals.shipping_total)}</span></div>
              <div className="b-row"><span>Min order delta</span><span>{formatMoney(totals.min_order_delta)}</span></div>
              <div className="b-row"><span>Rounding delta</span><span>{formatMoney(totals.rounding_delta)}</span></div>
              <div className="b-row total"><span>Total</span><span>{formatMoney(totals.total)}</span></div>
            </div>
          </div>
        </div>

        <div className="right">
          <div className="panel sticky">
            <div className="panel-title">STATUS & ACTIONS</div>

            <div className="field">
              <div className="label">STATUS</div>
              <select value={statusDraft} onChange={(e) => setStatusDraft(e.target.value)}>
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>{getStatusLabel(s, language)}</option>
                ))}
              </select>
              <button className="btn-primary" onClick={() => changeStatus(statusDraft)} type="button">Ulozit status</button>
            </div>

            <div className="action-row">
              <button className="btn" onClick={() => onAction('reprice')} type="button">
                <Icon name="RefreshCcw" size={16} /> Reprice
              </button>
              <button className="btn" onClick={() => onAction('reslice')} type="button">
                <Icon name="Repeat" size={16} /> Re-slice
              </button>
            </div>

            <div className="hint">
              * Varianta A: akce jsou simulovane (pro prezentaci UI).<br />
              Pozdeji napojime na backend a PrusaSlicer jobs.
            </div>
          </div>

          <div className="panel">
            <div className="panel-title">INTERNI POZNAMKY</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <textarea value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} placeholder="Napis interni poznamku..." />
              <button className="btn-primary" onClick={addNote} type="button" style={{ alignSelf: 'flex-start' }}>
                <Icon name="Plus" size={16} /> Pridat poznamku
              </button>
            </div>

            <div className="notes">
              {(order.notes || []).length === 0 ? (
                <div className="muted">Zatim zadne poznamky.</div>
              ) : (order.notes || []).map((n) => (
                <div key={n.id} className="note">
                  <div className="note-top">
                    <span className="mono">{formatDateTime(n.timestamp)}</span>
                    <span className="muted">{n.user_id}</span>
                  </div>
                  <div className="note-text">{n.text}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-title">AUDIT LOG</div>
            <div className="audit">
              {(order.activity || []).slice(0, 50).map((a, idx) => (
                <div key={`${a.timestamp}-${idx}`} className="audit-row">
                  <div className="mono">{formatDateTime(a.timestamp)}</div>
                  <div className="audit-type">{a.type}</div>
                  <div className="muted">{a.user_id}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={Boolean(confirm)}
        title={confirm?.type === 'reslice' ? 'Re-slice objednavky' : 'Reprice objednavky'}
        message={confirm?.type === 'reslice'
          ? 'V demo rezimu vytvorim novy slicer snapshot a automaticky spustim reprice. Chces pokracovat?'
          : 'V demo rezimu vytvorim novou cenovou revizi (reprice). Chces pokracovat?'
        }
        confirmText="Ano, pokracovat"
        onConfirm={onConfirmAction}
        onCancel={() => setConfirm(null)}
      />

      <style>{`
        .detail { max-width: 1200px; }
        .header { display:flex; align-items:center; gap: 12px; margin-bottom: 12px; }
        .title { flex:1; }
        .h { font-size: 22px; font-weight: 900; color: var(--forge-text-primary); font-family: var(--forge-font-heading); }
        .sub { font-size: 13px; color: var(--forge-text-muted); margin-top: 2px; font-family: var(--forge-font-body); }

        .grid { display:grid; grid-template-columns: 1.6fr 1fr; gap: 14px; }
        .panel { background: var(--forge-bg-surface); border-radius: var(--forge-radius-xl); padding: 16px; box-shadow: var(--forge-shadow-sm); margin-bottom: 14px; border: 1px solid var(--forge-border-default); }
        .panel.sticky { position: sticky; top: 64px; }
        .panel-title { font-weight: 800; color: var(--forge-text-primary); margin-bottom: 10px; font-family: var(--forge-font-tech); font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; }

        .kv { display:grid; grid-template-columns: 120px 1fr; gap: 8px 12px; }
        .k { color: var(--forge-text-muted); font-size: 12px; font-family: var(--forge-font-tech); text-transform: uppercase; letter-spacing: 0.04em; }
        .v { color: var(--forge-text-primary); font-weight: 700; font-size: 13px; font-family: var(--forge-font-body); }

        .models { display:flex; flex-direction: column; gap: 12px; }
        .model-card { border: 1px solid var(--forge-border-default); border-radius: var(--forge-radius-xl); padding: 14px; background: var(--forge-bg-elevated); }
        .model-top { display:flex; align-items:flex-start; justify-content: space-between; gap: 10px; margin-bottom: 10px; }
        .model-file { font-weight: 800; color: var(--forge-text-primary); font-family: var(--forge-font-body); }
        .model-sub { color: var(--forge-text-muted); font-size: 12px; margin-top: 2px; font-family: var(--forge-font-body); }
        .model-mid { display:grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 10px; }
        .mini { border: 1px solid var(--forge-border-default); background: var(--forge-bg-surface); border-radius: var(--forge-radius-lg); padding: 10px; }
        .mini-k { font-size: 10px; color: var(--forge-text-muted); font-family: var(--forge-font-tech); text-transform: uppercase; letter-spacing: 0.06em; }
        .mini-v { font-size: 13px; font-weight: 800; color: var(--forge-text-primary); margin-top: 2px; font-family: var(--forge-font-mono); }

        .breakdown { display:flex; flex-direction: column; gap: 6px; }
        .b-row { display:flex; justify-content: space-between; gap: 10px; color: var(--forge-text-secondary); font-size: 13px; font-family: var(--forge-font-body); }
        .b-row span:last-child { font-family: var(--forge-font-mono); }
        .b-row.total { font-weight: 900; color: var(--forge-accent-primary); border-top: 1px dashed var(--forge-border-active); padding-top: 8px; margin-top: 6px; }

        .field { display:flex; flex-direction: column; gap: 8px; }
        .label { font-size: 11px; color: var(--forge-text-muted); font-family: var(--forge-font-tech); text-transform: uppercase; letter-spacing: 0.06em; }
        select { border: 1px solid var(--forge-border-default); border-radius: var(--forge-radius-lg); padding: 10px; font-weight: 700; background: var(--forge-bg-elevated); color: var(--forge-text-primary); font-family: var(--forge-font-body); }
        .action-row { display:flex; gap: 10px; margin-top: 12px; }
        .hint { margin-top: 12px; font-size: 12px; color: var(--forge-text-muted); line-height: 1.35; font-family: var(--forge-font-body); }

        textarea { border: 1px solid var(--forge-border-default); border-radius: var(--forge-radius-lg); padding: 10px; min-height: 90px; resize: vertical; background: var(--forge-bg-elevated); color: var(--forge-text-primary); font-family: var(--forge-font-body); font-size: 13px; }
        textarea::placeholder { color: var(--forge-text-muted); }
        .notes { margin-top: 12px; display:flex; flex-direction: column; gap: 10px; }
        .note { border: 1px solid var(--forge-border-default); background: var(--forge-bg-elevated); border-radius: var(--forge-radius-lg); padding: 10px; }
        .note-top { display:flex; justify-content: space-between; gap: 10px; }
        .note-text { margin-top: 6px; font-size: 13px; color: var(--forge-text-primary); white-space: pre-wrap; font-family: var(--forge-font-body); }

        .audit { display:flex; flex-direction: column; gap: 8px; }
        .audit-row { display:grid; grid-template-columns: 1fr 1fr auto; gap: 10px; align-items:center; border-bottom: 1px solid var(--forge-border-default); padding-bottom: 8px; }
        .audit-type { font-weight: 800; color: var(--forge-text-primary); font-family: var(--forge-font-tech); font-size: 12px; text-transform: uppercase; }

        .banner { display:flex; gap: 10px; align-items:flex-start; border: 1px solid rgba(255,181,71,0.3); background: rgba(255,181,71,0.08); color: var(--forge-warning); padding: 12px; border-radius: var(--forge-radius-xl); margin-bottom: 12px; }
        .banner-title { font-weight: 900; font-family: var(--forge-font-heading); }
        .banner-sub { font-size: 12px; margin-top: 2px; color: rgba(255,181,71,0.8); font-family: var(--forge-font-body); }

        .mono { font-family: var(--forge-font-mono); font-size: 12px; color: var(--forge-text-secondary); }
        .muted { color: var(--forge-text-muted); font-size: 12px; }

        .btn { display:inline-flex; align-items:center; gap: 8px; border:1px solid var(--forge-border-default); background: var(--forge-bg-elevated); color: var(--forge-text-secondary); border-radius: var(--forge-radius-lg); padding: 10px 12px; font-weight: 700; font-size: 13px; cursor:pointer; font-family: var(--forge-font-body); transition: all var(--forge-duration-micro) ease; }
        .btn:hover { background: var(--forge-bg-overlay); border-color: var(--forge-border-active); color: var(--forge-text-primary); }
        .btn-primary { display:inline-flex; align-items:center; justify-content:center; gap: 8px; border:1px solid var(--forge-accent-primary); background: var(--forge-accent-primary); color: var(--forge-bg-void); border-radius: var(--forge-radius-lg); padding: 10px 12px; font-weight: 800; font-size: 13px; cursor:pointer; font-family: var(--forge-font-body); transition: all var(--forge-duration-micro) ease; }
        .btn-primary:hover { background: var(--forge-accent-primary-h); border-color: var(--forge-accent-primary-h); }
        .btn-small { padding: 8px 10px; }

        @media (max-width: 1050px) {
          .grid { grid-template-columns: 1fr; }
          .panel.sticky { position: relative; top: auto; }
        }
      `}</style>
    </div>
  );
}

function ModelDetail({ orders, setOrders }) {
  const { user: authUser } = useAuth();
  const currentUser = authUser?.email || authUser?.displayName || 'admin';
  const { language } = useLanguage();
  const navigate = useNavigate();
  const params = useParams();
  const orderId = params.id;
  const modelId = params.modelId;

  const order = useMemo(() => orders.find((o) => o.id === orderId), [orders, orderId]);
  const model = useMemo(() => order?.models?.find((m) => m.id === modelId), [order, modelId]);

  const [showOnlyChanged, setShowOnlyChanged] = useState(true);
  const [confirm, setConfirm] = useState(null);

  if (!order || !model) {
    return <Navigate to="../" replace />;
  }

  function persist(nextOrder, activityEntry) {
    const next = orders.map((o) => (o.id === nextOrder.id ? nextOrder : o));
    setOrders(next);
    saveOrders(next);

    if (activityEntry) {
      appendOrderActivity(nextOrder.id, activityEntry);
    }
  }

  function simulateRepriceModel() {
    const updatedModels = order.models.map((m) => {
      if (m.id !== model.id) return m;
      const prev = m.price_breakdown_snapshot || {};
      const factor = 0.95 + Math.random() * 0.12; // DEMO: mock data only — price drift simulation
      const next = {
        ...prev,
        material_cost: round2((prev.material_cost || 0) * factor),
        time_cost: round2((prev.time_cost || 0) * factor),
      };
      next.fees_total = prev.fees_total || 0;
      next.model_subtotal = round2((next.material_cost || 0) + (next.time_cost || 0) + (next.fees_total || 0));
      next.model_total = next.model_subtotal;
      const revId = `p${(m.revisions?.price?.length || 0)}`;
      return {
        ...m,
        price_breakdown_snapshot: next,
        revisions: {
          ...(m.revisions || { price: [], slicer: [] }),
          price: [
            { id: revId, created_at: nowIso(), reason: 'reprice_model', price_breakdown_snapshot: next },
            ...(m.revisions?.price || []),
          ].slice(0, 30),
        },
      };
    });

    const updated = {
      ...order,
      models: updatedModels,
      updated_at: nowIso(),
      activity: [
        { timestamp: nowIso(), user_id: currentUser, type: 'REPRICE_MODEL', payload: { model_id: model.id } },
        ...(order.activity || []),
      ].slice(0, 200),
    };

    persist(updated, { timestamp: nowIso(), user_id: currentUser, type: 'REPRICE_MODEL', payload: { model_id: model.id } });
  }

  function simulateResliceModel() {
    const updatedModels = order.models.map((m) => {
      if (m.id !== model.id) return m;
      const prev = m.slicer_snapshot || {};
      const factor = 0.92 + Math.random() * 0.18; // DEMO: mock data only — slicer drift simulation
      const next = {
        ...prev,
        time_min: Math.max(1, Math.round((prev.time_min || 0) * factor)),
        weight_g: round2(Math.max(0.1, (prev.weight_g || 0) * (0.97 + Math.random() * 0.06))), // DEMO: mock data only
      };
      const revId = `s${(m.revisions?.slicer?.length || 0)}`;
      return {
        ...m,
        slicer_snapshot: next,
        revisions: {
          ...(m.revisions || { price: [], slicer: [] }),
          slicer: [
            { id: revId, created_at: nowIso(), reason: 'reslice_model', slicer_snapshot: next },
            ...(m.revisions?.slicer || []),
          ].slice(0, 30),
        },
      };
    });

    let updated = {
      ...order,
      models: updatedModels,
      updated_at: nowIso(),
      activity: [
        { timestamp: nowIso(), user_id: currentUser, type: 'RESLICE_MODEL', payload: { model_id: model.id } },
        ...(order.activity || []),
      ].slice(0, 200),
    };

    // auto reprice
    // reuse model reprice right after reslice
    const factor = 0.95 + Math.random() * 0.12; // DEMO: mock data only — auto-reprice after reslice
    updated = {
      ...updated,
      models: updated.models.map((m) => {
        if (m.id !== model.id) return m;
        const prev = m.price_breakdown_snapshot || {};
        const next = {
          ...prev,
          material_cost: round2((prev.material_cost || 0) * factor),
          time_cost: round2((prev.time_cost || 0) * factor),
        };
        next.fees_total = prev.fees_total || 0;
        next.model_subtotal = round2((next.material_cost || 0) + (next.time_cost || 0) + (next.fees_total || 0));
        next.model_total = next.model_subtotal;
        const revId = `p${(m.revisions?.price?.length || 0)}`;
        return {
          ...m,
          price_breakdown_snapshot: next,
          revisions: {
            ...(m.revisions || { price: [], slicer: [] }),
            price: [
              { id: revId, created_at: nowIso(), reason: 'auto_reprice_after_reslice', price_breakdown_snapshot: next },
              ...(m.revisions?.price || []),
            ].slice(0, 30),
          },
        };
      }),
    };

    persist(updated, { timestamp: nowIso(), user_id: currentUser, type: 'RESLICE_MODEL', payload: { model_id: model.id } });
  }

  const resolved = model.resolved_config_snapshot || {};
  const values = resolved.resolved_values || {};
  const meta = resolved.resolved_meta || {};

  const rows = Object.entries(values).map(([key, value]) => ({
    key,
    value,
    source: meta[key] || 'default',
  }));

  const shownRows = showOnlyChanged
    ? rows.filter((r) => r.source !== 'default')
    : rows;

  const bd = model.price_breakdown_snapshot || {};

  return (
    <div className="model-detail">
      <div className="header">
        <button className="btn" onClick={() => navigate(`../${order.id}`)} type="button">
          <Icon name="ChevronLeft" size={16} /> Zpet na order
        </button>
        <div className="title">
          <div className="h">Model {model.id}</div>
          <div className="sub">{model.file_snapshot?.filename} / Order {order.id}</div>
        </div>
      </div>

      <div className="grid">
        <div className="panel">
          <div className="panel-title">SOUBOR & SLICER SNAPSHOT</div>
          <div className="kv">
            <div className="k">Filename</div><div className="v">{model.file_snapshot?.filename}</div>
            <div className="k">Size</div><div className="v">{Math.round((model.file_snapshot?.size || 0) / 1024)} KB</div>
            <div className="k">Uploaded</div><div className="v">{formatDateTime(model.file_snapshot?.uploaded_at)}</div>
            <div className="k">Time</div><div className="v">{formatTime(getSlicerTimeMin(model.slicer_snapshot))}</div>
            <div className="k">Weight</div><div className="v">{round2(getSlicerWeightG(model.slicer_snapshot))} g</div>
            <div className="k">XYZ</div><div className="v">{model.slicer_snapshot?.dimensions_xyz?.x}x{model.slicer_snapshot?.dimensions_xyz?.y}x{model.slicer_snapshot?.dimensions_xyz?.z} mm</div>
          </div>

          <div className="actions">
            <button className="btn" onClick={() => setConfirm('reprice')} type="button">
              <Icon name="RefreshCcw" size={16} /> Reprice model
            </button>
            <button className="btn" onClick={() => setConfirm('reslice')} type="button">
              <Icon name="Repeat" size={16} /> Re-slice model
            </button>
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">RESOLVED CONFIG SNAPSHOT</div>
          <div className="row">
            <ForgeCheckbox
              checked={showOnlyChanged}
              onChange={(e) => setShowOnlyChanged(e.target.checked)}
              label="Jen zmenene (source != default)"
            />
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>PARAMETER</th>
                  <th>VALUE</th>
                  <th>SOURCE</th>
                </tr>
              </thead>
              <tbody>
                {shownRows.map((r, idx) => (
                  <tr key={r.key} className={idx % 2 === 0 ? 'row-even' : 'row-odd'}>
                    <td className="mono">{r.key}</td>
                    <td style={{ fontFamily: 'var(--forge-font-mono)', color: 'var(--forge-text-primary)' }}>{String(r.value)}</td>
                    <td><Badge tone={r.source === 'widget' ? 'blue' : r.source === 'preset' ? 'green' : 'gray'}>{r.source}</Badge></td>
                  </tr>
                ))}
                {shownRows.length === 0 ? (
                  <tr><td colSpan={3} className="empty">Zadne zaznamy pro zvoleny filtr.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="muted" style={{ marginTop: 10 }}>
            * Snapshot slouzi pro reprodukovatelnost a debug.
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">PRICE BREAKDOWN</div>
          <div className="breakdown">
            <div className="b-row"><span>Material</span><span>{formatMoney(bd.material_cost || 0)}</span></div>
            <div className="b-row"><span>Time</span><span>{formatMoney(bd.time_cost || 0)}</span></div>
            <div className="b-row"><span>Fees</span><span>{formatMoney(bd.fees_total || 0)}</span></div>
            <div className="b-row total"><span>Total (1 ks)</span><span>{formatMoney(bd.model_total || 0)}</span></div>
            <div className="b-row"><span>Quantity</span><span style={{ fontFamily: 'var(--forge-font-mono)' }}>{model.quantity}</span></div>
            <div className="b-row total"><span>Total (qty)</span><span>{formatMoney((bd.model_total || 0) * (Number(model.quantity) || 1))}</span></div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">REVISION HISTORY (DEMO)</div>
          <div className="rev">
            <div className="rev-col">
              <div className="rev-h">SLICER REVISIONS</div>
              {(model.revisions?.slicer || []).slice(0, 10).map((r) => (
                <div key={r.id} className="rev-item">
                  <div className="mono">{r.id}</div>
                  <div className="muted">{formatDateTime(r.created_at)} / {r.reason}</div>
                </div>
              ))}
            </div>
            <div className="rev-col">
              <div className="rev-h">PRICE REVISIONS</div>
              {(model.revisions?.price || []).slice(0, 10).map((r) => (
                <div key={r.id} className="rev-item">
                  <div className="mono">{r.id}</div>
                  <div className="muted">{formatDateTime(r.created_at)} / {r.reason}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirm != null}
        title={confirm === 'reslice' ? 'Re-slice modelu' : 'Reprice modelu'}
        message={confirm === 'reslice'
          ? 'V demo rezimu vytvorim novy slicer snapshot a automaticky spustim reprice. Chces pokracovat?'
          : 'V demo rezimu vytvorim novou cenovou revizi. Chces pokracovat?'
        }
        confirmText="Ano, pokracovat"
        onConfirm={() => {
          if (confirm === 'reslice') simulateResliceModel();
          if (confirm === 'reprice') simulateRepriceModel();
          setConfirm(null);
        }}
        onCancel={() => setConfirm(null)}
      />

      <style>{`
        .model-detail { max-width: 1200px; }
        .header { display:flex; align-items:center; gap: 12px; margin-bottom: 12px; }
        .title { flex:1; }
        .h { font-size: 22px; font-weight: 900; color: var(--forge-text-primary); font-family: var(--forge-font-heading); }
        .sub { font-size: 13px; color: var(--forge-text-muted); margin-top: 2px; font-family: var(--forge-font-body); }

        .grid { display:grid; grid-template-columns: 1fr; gap: 14px; }
        @media (min-width: 1100px) {
          .grid { grid-template-columns: 1.15fr 1.2fr; }
        }

        .panel { background: var(--forge-bg-surface); border-radius: var(--forge-radius-xl); padding: 16px; box-shadow: var(--forge-shadow-sm); border: 1px solid var(--forge-border-default); }
        .panel-title { font-weight: 800; color: var(--forge-text-primary); margin-bottom: 10px; font-family: var(--forge-font-tech); font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; }

        .kv { display:grid; grid-template-columns: 140px 1fr; gap: 8px 12px; }
        .k { color: var(--forge-text-muted); font-size: 11px; font-family: var(--forge-font-tech); text-transform: uppercase; letter-spacing: 0.04em; }
        .v { color: var(--forge-text-primary); font-weight: 800; font-size: 13px; font-family: var(--forge-font-mono); }

        .actions { display:flex; gap: 10px; margin-top: 12px; flex-wrap: wrap; }

        .table-wrap { overflow:auto; }
        .table { width: 100%; border-collapse: collapse; min-width: 520px; }
        th { text-align:left; font-size: 11px; font-family: var(--forge-font-tech); color: var(--forge-text-muted); font-weight: 700; padding: 10px 8px; border-bottom: 1px solid var(--forge-border-default); text-transform: uppercase; letter-spacing: 0.06em; }
        td { padding: 10px 8px; border-bottom: 1px solid var(--forge-border-default); color: var(--forge-text-secondary); }
        .row-even { background: var(--forge-bg-surface); }
        .row-odd { background: var(--forge-bg-elevated); }
        tr:hover td { background: var(--forge-bg-overlay); }
        .mono { font-family: var(--forge-font-mono); font-size: 12px; color: var(--forge-text-secondary); }
        .empty { text-align:center; padding: 18px; color: var(--forge-text-muted); }

        .toggle { display:flex; gap: 10px; align-items:center; font-weight: 700; color: var(--forge-text-secondary); font-size: 13px; font-family: var(--forge-font-body); cursor: pointer; }
        .toggle input { accent-color: var(--forge-accent-primary); }

        .breakdown { display:flex; flex-direction: column; gap: 6px; }
        .b-row { display:flex; justify-content: space-between; gap: 10px; color: var(--forge-text-secondary); font-size: 13px; font-family: var(--forge-font-body); }
        .b-row span:last-child { font-family: var(--forge-font-mono); }
        .b-row.total { font-weight: 900; color: var(--forge-accent-primary); border-top: 1px dashed var(--forge-border-active); padding-top: 8px; margin-top: 6px; }

        .rev { display:grid; grid-template-columns: 1fr; gap: 12px; }
        @media (min-width: 900px) { .rev { grid-template-columns: 1fr 1fr; } }
        .rev-h { font-weight: 800; color: var(--forge-text-primary); margin-bottom: 8px; font-family: var(--forge-font-tech); font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; }
        .rev-item { border: 1px solid var(--forge-border-default); background: var(--forge-bg-elevated); border-radius: var(--forge-radius-lg); padding: 10px; margin-bottom: 10px; }

        .muted { color: var(--forge-text-muted); font-size: 12px; }

        .btn { display:inline-flex; align-items:center; gap: 8px; border:1px solid var(--forge-border-default); background: var(--forge-bg-elevated); color: var(--forge-text-secondary); border-radius: var(--forge-radius-lg); padding: 10px 12px; font-weight: 700; font-size: 13px; cursor:pointer; font-family: var(--forge-font-body); transition: all var(--forge-duration-micro) ease; }
        .btn:hover { background: var(--forge-bg-overlay); border-color: var(--forge-border-active); color: var(--forge-text-primary); }

        .badge { display:inline-flex; align-items:center; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; border:1px solid transparent; font-family: var(--forge-font-tech); text-transform: uppercase; letter-spacing: 0.04em; }

        .btn-primary { display:inline-flex; align-items:center; justify-content:center; gap: 8px; border:1px solid var(--forge-accent-primary); background: var(--forge-accent-primary); color: var(--forge-bg-void); border-radius: var(--forge-radius-lg); padding: 10px 12px; font-weight: 800; font-size: 13px; cursor:pointer; font-family: var(--forge-font-body); transition: all var(--forge-duration-micro) ease; }
        .btn-primary:hover { background: var(--forge-accent-primary-h); border-color: var(--forge-accent-primary-h); }
      `}</style>
    </div>
  );
}

export default function AdminOrders() {
  const { user: authUser } = useAuth();
  const currentUser = authUser?.email || authUser?.displayName || 'admin';
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  useEffect(() => {
    const data = loadOrders();
    setOrders(data);
  }, []);

  const selectedOrder = selectedOrderId ? orders.find((o) => o.id === selectedOrderId) || null : null;

  const handleSaveNote = (note) => {
    if (!selectedOrder) return;
    const updated = orders.map((o) => {
      if (o.id !== selectedOrder.id) return o;
      return {
        ...o,
        notes: [...(o.notes || []), note],
        activity: [...(o.activity || []), { timestamp: note.created_at, user_id: currentUser, type: 'NOTE_ADDED', payload: { text: note.text } }],
        updated_at: note.created_at,
      };
    });
    setOrders(updated);
    saveOrders(updated);
  };

  return (
    <>
      <Routes>
        <Route index element={<OrdersList orders={orders} setOrders={setOrders} onSelectOrder={setSelectedOrderId} />} />
        <Route path=":id" element={<AdminOrderDetail orders={orders} setOrders={setOrders} />} />
        <Route path=":id/model/:modelId" element={<ModelDetail orders={orders} setOrders={setOrders} />} />
        <Route path="*" element={<Navigate to="." replace />} />
      </Routes>

      <OrderDetailModal
        open={!!selectedOrder}
        order={selectedOrder}
        onClose={() => setSelectedOrderId(null)}
        onSaveNote={handleSaveNote}
        onUpdateOrders={setOrders}
        onStatusChange={(orderId, newStatus) => {
          const next = orders.map((o) => {
            if (o.id !== orderId) return o;
            return {
              ...o,
              status: newStatus,
              updated_at: nowIso(),
              activity: [
                {
                  timestamp: nowIso(),
                  user_id: currentUser,
                  type: 'STATUS_CHANGE',
                  payload: { from: o.status, to: newStatus },
                },
                ...(o.activity || []),
              ].slice(0, 200),
            };
          });
          setOrders(next);
          saveOrders(next);
          appendOrderActivity(orderId, {
            timestamp: nowIso(),
            user_id: currentUser,
            type: 'STATUS_CHANGE',
            payload: { from: selectedOrder?.status, to: newStatus },
          });
        }}
      />
    </>
  );
}
