import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import ForgeCheckbox from '../../components/ui/forge/ForgeCheckbox';
import { useLanguage } from '../../contexts/LanguageContext';
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
import KanbanBoard from './components/kanban/KanbanBoard';
import { loadKanbanConfigV1, saveKanbanConfigV1 } from '../../utils/adminKanbanStorage';
import OrderDetailModal from './components/orders/OrderDetailModal';
import StorageStatusBadge from './components/orders/StorageStatusBadge';

// =====================================
// Admin Orders — Variant A (front-end demo)
// - Fully functional UI for presenting to customers
// - Persists in localStorage (no backend required)
// - Supports: list+filters, order detail, model detail, status/notes/audit,
//   simulated reprice/reslice with revision history
// =====================================

const PAGE_SIZE = 15;

function formatDateTime(iso, locale = 'cs-CZ') {
  try {
    return new Date(iso).toLocaleString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function formatMoney(amount) {
  return `${round2(amount).toFixed(2)} Kc`;
}

function formatTime(min) {
  const m = Math.max(0, Math.round(Number(min) || 0));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h <= 0) return `${r} min`;
  return `${h}h ${r}m`;
}

function Badge({ children, tone = 'gray' }) {
  const toneMap = {
    gray: { bg: 'var(--forge-bg-elevated)', color: 'var(--forge-text-secondary)', border: 'var(--forge-border-default)' },
    blue: { bg: 'rgba(0, 212, 170, 0.1)', color: 'var(--forge-accent-primary)', border: 'rgba(0, 212, 170, 0.25)' },
    green: { bg: 'rgba(0, 212, 170, 0.15)', color: '#00D4AA', border: 'rgba(0, 212, 170, 0.3)' },
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
        color: active ? '#08090C' : 'var(--forge-text-secondary)',
        borderRadius: '999px',
        padding: '6px 12px',
        fontSize: '11px',
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

function ConfirmModal({ open, title, message, confirmText = 'Potvrdit', cancelText = 'Zrusit', onConfirm, onCancel }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const el = overlayRef.current;
    if (!el) return;
    const handleWheel = (e) => { e.preventDefault(); e.stopPropagation(); };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
      document.body.style.overflow = '';
    };
  }, [open]);

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
            color: '#08090C', borderRadius: 'var(--forge-radius-lg)',
            padding: '10px 14px', fontWeight: 800, fontSize: '13px', cursor: 'pointer',
            fontFamily: 'var(--forge-font-body)',
          }}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}

function OrdersList({ orders, setOrders, onSelectOrder }) {
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

  useEffect(() => {
    try {
      const kc = loadKanbanConfigV1();
      if (kc?.view_preference === 'kanban') setViewMode('kanban');
    } catch {}
  }, []);

  const toggleView = (mode) => {
    setViewMode(mode);
    try {
      const kc = loadKanbanConfigV1();
      saveKanbanConfigV1({ ...kc, view_preference: mode });
    } catch {}
  };

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
    const toTs = dateTo ? new Date(dateTo).getTime() : null;

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
  }, [orders, q, statusFilter, materialFilter, presetFilter, flagFilter, dateFrom, dateTo, sortKey]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [q, statusFilter, materialFilter, presetFilter, flagFilter, dateFrom, dateTo, sortKey]);

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
    setDateFrom('');
    setDateTo('');
    setSortKey('newest');
  }

  function exportCsv() {
    const headers = [
      'order_id',
      'created_at',
      'status',
      'customer_name',
      'customer_email',
      'models_count',
      'pieces',
      'materials',
      'print_time_min',
      'weight_g',
      'total_price',
      'flags',
    ];

    const rows = filtered.map((o) => {
      const totals = computeOrderTotals(o);
      return [
        o.id,
        o.created_at,
        o.status,
        o.customer_snapshot?.name || '',
        o.customer_snapshot?.email || '',
        (o.models || []).length,
        totals.sum_pieces,
        extractOrderMaterials(o).join('|'),
        totals.sum_time_min,
        totals.sum_weight_g,
        totals.total,
        collectOrderFlags(o).join('|'),
      ];
    });

    const csv = [headers.join(','), ...rows.map((r) => r.map((v) => {
      const s = String(v ?? '');
      if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
      return s;
    }).join(','))].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="orders">
      <div className="page-header">
        <div>
          <h1>{t('admin.orders.title') || 'Orders'}</h1>
          <p className="subtitle">Rychly prehled objednavek, filtru a audit logu. (Demo Varianta A)</p>
        </div>
        <div className="header-actions">
          <div className="view-toggle">
            <button className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`} onClick={() => toggleView('table')} type="button">
              <Icon name="List" size={16} />
            </button>
            <button className={`toggle-btn ${viewMode === 'kanban' ? 'active' : ''}`} onClick={() => toggleView('kanban')} type="button">
              <Icon name="Columns" size={16} />
            </button>
          </div>
          <button className="btn" onClick={exportCsv} type="button">
            <Icon name="Download" size={16} /> Export CSV
          </button>
        </div>
      </div>

      <div className="panel sticky">
        <div className="filters">
          <div className="search">
            <Icon name="Search" size={18} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Hledat: order ID, soubor, jmeno, email..."
            />
          </div>

          <div className="filter-row">
            <div className="filter-group">
              <div className="filter-label">STATUS</div>
              <div className="pill-row">
                {ORDER_STATUSES.map((s) => (
                  <PillButton
                    key={s}
                    active={statusFilter.has(s)}
                    onClick={() => toggleSet(setStatusFilter, s)}
                  >
                    {getStatusLabel(s, language)}
                  </PillButton>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <div className="filter-label">MATERIAL</div>
              <div className="pill-row">
                {allMaterials.length === 0 ? (
                  <span className="muted">--</span>
                ) : allMaterials.map((m) => (
                  <PillButton
                    key={m}
                    active={materialFilter.has(m)}
                    onClick={() => toggleSet(setMaterialFilter, m)}
                  >
                    {m}
                  </PillButton>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <div className="filter-label">PRESET</div>
              <div className="pill-row">
                {allPresets.length === 0 ? (
                  <span className="muted">--</span>
                ) : allPresets.map((p) => (
                  <PillButton
                    key={p}
                    active={presetFilter.has(p)}
                    onClick={() => toggleSet(setPresetFilter, p)}
                  >
                    {p}
                  </PillButton>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <div className="filter-label">FLAGS</div>
              <div className="pill-row">
                {ORDER_FLAGS.map((f) => (
                  <PillButton
                    key={f}
                    active={flagFilter.has(f)}
                    onClick={() => toggleSet(setFlagFilter, f)}
                  >
                    {f}
                  </PillButton>
                ))}
              </div>
            </div>
          </div>

          <div className="filter-row" style={{ marginTop: 12 }}>
            <div className="date-range">
              <div className="filter-label">OD</div>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="date-range">
              <div className="filter-label">DO</div>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>

            <div className="sort">
              <div className="filter-label">RAZENI</div>
              <select value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
                <option value="newest">Nejnovejsi</option>
                <option value="highest_price">Nejvyssi cena</option>
                <option value="longest_time">Nejdelsi cas tisku</option>
              </select>
            </div>

            <div className="right-actions">
              <button className="btn" onClick={clearFilters} type="button">
                <Icon name="X" size={16} /> Reset filtru
              </button>
              <div className="count">Zobrazeno: {filtered.length}</div>
            </div>
          </div>
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="panel">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ORDER ID</th>
                  <th>CREATED</th>
                  <th>CUSTOMER</th>
                  <th>MODELS / PCS</th>
                  <th>MATERIAL(S)</th>
                  <th>PRINT TIME</th>
                  <th>WEIGHT</th>
                  <th>TOTAL</th>
                  <th>STATUS</th>
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
                    <tr key={o.id} className={idx % 2 === 0 ? 'row-even' : 'row-odd'}>
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
                        <button className="btn-primary btn-small" onClick={() => onSelectOrder?.(o.id)} type="button">
                          Open
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="empty">Zadne objednavky pro zvolene filtry.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button className="btn" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} type="button">
              <Icon name="ChevronLeft" size={16} /> Predchozi
            </button>
            <div className="muted">Strana {page} / {pageCount}</div>
            <button className="btn" disabled={page >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))} type="button">
              Dalsi <Icon name="ChevronRight" size={16} />
            </button>
          </div>
        </div>
      ) : (
        <KanbanBoard
          orders={filtered}
          onOrderClick={(orderId) => navigate(`./${orderId}`)}
          onStatusChange={(orderId, newStatus) => {
            const next = orders.map(o => {
              if (o.id !== orderId) return o;
              return { ...o, status: newStatus, updated_at: nowIso(), activity: [{ timestamp: nowIso(), user_id: 'admin', type: 'STATUS_CHANGE', payload: { from: o.status, to: newStatus } }, ...(o.activity || [])].slice(0, 200) };
            });
            setOrders(next);
            saveOrders(next);
          }}
        />
      )}

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
        .btn-primary { display:inline-flex; align-items:center; justify-content:center; border:1px solid var(--forge-accent-primary); background: var(--forge-accent-primary); color: #08090C; border-radius: var(--forge-radius-lg); padding: 10px 12px; font-weight: 800; font-size: 13px; cursor:pointer; font-family: var(--forge-font-body); transition: all var(--forge-duration-micro) ease; }
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
          user_id: 'admin',
          type: 'STATUS_CHANGE',
          payload: { from: order.status, to: nextStatus },
        },
        ...(order.activity || []),
      ].slice(0, 200),
    };
    persist(updated, { timestamp: nowIso(), user_id: 'admin', type: 'STATUS_CHANGE', payload: { from: order.status, to: nextStatus } });
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
          user_id: 'admin',
          text,
        },
        ...(order.notes || []),
      ].slice(0, 200),
      activity: [
        {
          timestamp: nowIso(),
          user_id: 'admin',
          type: 'NOTE_ADDED',
          payload: { length: text.length },
        },
        ...(order.activity || []),
      ].slice(0, 200),
    };
    persist(updated, { timestamp: nowIso(), user_id: 'admin', type: 'NOTE_ADDED', payload: { length: text.length } });
    setNoteDraft('');
  }

  function simulateReprice(targetOrder) {
    // Create a price revision for each model; demo only
    const updatedModels = (targetOrder.models || []).map((m) => {
      const prev = m.price_breakdown_snapshot || {};
      const factor = 0.95 + Math.random() * 0.12; // small drift
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
          user_id: 'admin',
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
      const factor = 0.92 + Math.random() * 0.18;
      const next = {
        ...prev,
        time_min: Math.max(1, Math.round((prev.time_min || 0) * factor)),
        weight_g: round2(Math.max(0.1, (prev.weight_g || 0) * (0.97 + Math.random() * 0.06))),
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
          user_id: 'admin',
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
      persist(updated, { timestamp: nowIso(), user_id: 'admin', type: 'REPRICE', payload: { demo: true } });
    }
    if (confirm.type === 'reslice') {
      const updated = simulateReslice(order);
      persist(updated, { timestamp: nowIso(), user_id: 'admin', type: 'RESLICE', payload: { demo: true } });
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
                        <div className="mini-v">{formatTime(m?.slicer_snapshot?.time_min || 0)}</div>
                      </div>
                      <div className="mini">
                        <div className="mini-k">HMOTNOST</div>
                        <div className="mini-v">{round2(m?.slicer_snapshot?.weight_g || 0)} g</div>
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
            <textarea value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} placeholder="Napis interni poznamku..." />
            <button className="btn-primary" onClick={addNote} type="button">
              <Icon name="Plus" size={16} /> Pridat poznamku
            </button>

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
        .btn-primary { display:inline-flex; align-items:center; justify-content:center; gap: 8px; border:1px solid var(--forge-accent-primary); background: var(--forge-accent-primary); color: #08090C; border-radius: var(--forge-radius-lg); padding: 10px 12px; font-weight: 800; font-size: 13px; cursor:pointer; font-family: var(--forge-font-body); transition: all var(--forge-duration-micro) ease; }
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
      const factor = 0.95 + Math.random() * 0.12;
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
        { timestamp: nowIso(), user_id: 'admin', type: 'REPRICE_MODEL', payload: { model_id: model.id } },
        ...(order.activity || []),
      ].slice(0, 200),
    };

    persist(updated, { timestamp: nowIso(), user_id: 'admin', type: 'REPRICE_MODEL', payload: { model_id: model.id } });
  }

  function simulateResliceModel() {
    const updatedModels = order.models.map((m) => {
      if (m.id !== model.id) return m;
      const prev = m.slicer_snapshot || {};
      const factor = 0.92 + Math.random() * 0.18;
      const next = {
        ...prev,
        time_min: Math.max(1, Math.round((prev.time_min || 0) * factor)),
        weight_g: round2(Math.max(0.1, (prev.weight_g || 0) * (0.97 + Math.random() * 0.06))),
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
        { timestamp: nowIso(), user_id: 'admin', type: 'RESLICE_MODEL', payload: { model_id: model.id } },
        ...(order.activity || []),
      ].slice(0, 200),
    };

    // auto reprice
    // reuse model reprice right after reslice
    const factor = 0.95 + Math.random() * 0.12;
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

    persist(updated, { timestamp: nowIso(), user_id: 'admin', type: 'RESLICE_MODEL', payload: { model_id: model.id } });
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
            <div className="k">Time</div><div className="v">{formatTime(model.slicer_snapshot?.time_min)}</div>
            <div className="k">Weight</div><div className="v">{round2(model.slicer_snapshot?.weight_g)} g</div>
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

        .btn-primary { display:inline-flex; align-items:center; justify-content:center; gap: 8px; border:1px solid var(--forge-accent-primary); background: var(--forge-accent-primary); color: #08090C; border-radius: var(--forge-radius-lg); padding: 10px 12px; font-weight: 800; font-size: 13px; cursor:pointer; font-family: var(--forge-font-body); transition: all var(--forge-duration-micro) ease; }
        .btn-primary:hover { background: var(--forge-accent-primary-h); border-color: var(--forge-accent-primary-h); }
      `}</style>
    </div>
  );
}

export default function AdminOrders() {
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
        activity: [...(o.activity || []), { timestamp: note.created_at, user_id: 'admin', type: 'NOTE_ADDED', payload: { text: note.text } }],
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
        <Route path=":id" element={<OrderDetail orders={orders} setOrders={setOrders} />} />
        <Route path=":id/model/:modelId" element={<ModelDetail orders={orders} setOrders={setOrders} />} />
        <Route path="*" element={<Navigate to="." replace />} />
      </Routes>

      <OrderDetailModal
        open={!!selectedOrder}
        order={selectedOrder}
        onClose={() => setSelectedOrderId(null)}
        onSaveNote={handleSaveNote}
        onUpdateOrders={setOrders}
      />
    </>
  );
}
