import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import Icon from '../../components/AppIcon';
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
  getStatusLabel,
  loadOrders,
  nowIso,
  round2,
  saveOrders,
} from '../../utils/adminOrdersStorage';

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
  return `${round2(amount).toFixed(2)} Kč`;
}

function formatTime(min) {
  const m = Math.max(0, Math.round(Number(min) || 0));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h <= 0) return `${r} min`;
  return `${h}h ${r}m`;
}

function Badge({ children, tone = 'gray' }) {
  return (
    <span className={`badge badge-${tone}`}>{children}</span>
  );
}

function PillButton({ active, onClick, children }) {
  return (
    <button
      className={`pill ${active ? 'pill-active' : ''}`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function ConfirmModal({ open, title, message, confirmText = 'Potvrdit', cancelText = 'Zrušit', onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal-title">{title}</div>
        <div className="modal-body">{message}</div>
        <div className="modal-actions">
          <button className="btn" onClick={onCancel} type="button">{cancelText}</button>
          <button className="btn-primary" onClick={onConfirm} type="button">{confirmText}</button>
        </div>
      </div>
    </div>
  );
}

function OrdersList({ orders, setOrders }) {
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
          <p className="subtitle">Rychlý přehled objednávek, filtrů a audit logu. (Demo Varianta A)</p>
        </div>
        <div className="header-actions">
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
              placeholder="Hledat: order ID, soubor, jméno, email…"
            />
          </div>

          <div className="filter-row">
            <div className="filter-group">
              <div className="filter-label">Status</div>
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
              <div className="filter-label">Material</div>
              <div className="pill-row">
                {allMaterials.length === 0 ? (
                  <span className="muted">—</span>
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
              <div className="filter-label">Preset</div>
              <div className="pill-row">
                {allPresets.length === 0 ? (
                  <span className="muted">—</span>
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
              <div className="filter-label">Flags</div>
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
              <div className="filter-label">Od</div>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="date-range">
              <div className="filter-label">Do</div>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>

            <div className="sort">
              <div className="filter-label">Řazení</div>
              <select value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
                <option value="newest">Nejnovější</option>
                <option value="highest_price">Nejvyšší cena</option>
                <option value="longest_time">Nejdelší čas tisku</option>
              </select>
            </div>

            <div className="right-actions">
              <button className="btn" onClick={clearFilters} type="button">
                <Icon name="X" size={16} /> Reset filtrů
              </button>
              <div className="count">Zobrazeno: {filtered.length}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Created</th>
                <th>Customer</th>
                <th>Models / Pieces</th>
                <th>Material(s)</th>
                <th>Print time</th>
                <th>Weight</th>
                <th>Total</th>
                <th>Status</th>
                <th>Flags</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((o) => {
                const totals = computeOrderTotals(o);
                const mats = extractOrderMaterials(o);
                const flags = collectOrderFlags(o);
                return (
                  <tr key={o.id}>
                    <td className="mono">{o.id}</td>
                    <td>{formatDateTime(o.created_at)}</td>
                    <td>
                      <div className="customer">
                        <div className="customer-name">{o.customer_snapshot?.name || '—'}</div>
                        <div className="customer-sub">{o.customer_snapshot?.email || ''}</div>
                      </div>
                    </td>
                    <td>
                      <div className="muted">{(o.models || []).length} / {totals.sum_pieces}</div>
                    </td>
                    <td>
                      <div className="muted">{mats.join(', ') || '—'}</div>
                    </td>
                    <td className="muted">{formatTime(totals.sum_time_min)}</td>
                    <td className="muted">{round2(totals.sum_weight_g)} g</td>
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
                      <button className="btn-primary btn-small" onClick={() => navigate(`./${o.id}`)} type="button">
                        Open
                      </button>
                    </td>
                  </tr>
                );
              })}

              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={11} className="empty">Žádné objednávky pro zvolené filtry.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <button className="btn" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} type="button">
            <Icon name="ChevronLeft" size={16} /> Předchozí
          </button>
          <div className="muted">Strana {page} / {pageCount}</div>
          <button className="btn" disabled={page >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))} type="button">
            Další <Icon name="ChevronRight" size={16} />
          </button>
        </div>
      </div>

      <style>{`
        .orders { max-width: 1200px; }
        .page-header { display:flex; align-items:flex-end; justify-content:space-between; gap: 12px; margin-bottom: 18px; }
        h1 { margin: 0 0 6px 0; font-size: 28px; font-weight: 800; color: #111827; }
        .subtitle { margin: 0; font-size: 14px; color: #6B7280; }
        .header-actions { display:flex; gap: 10px; }

        .panel { background: white; border-radius: 12px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 16px; }
        .panel.sticky { position: sticky; top: 64px; z-index: 2; }

        .filters { display:flex; flex-direction: column; gap: 12px; }
        .search { display:flex; align-items:center; gap: 8px; border: 1px solid #D1D5DB; border-radius: 10px; padding: 10px 12px; }
        .search input { border:none; outline:none; font-size: 14px; flex:1; }

        .filter-row { display:flex; flex-wrap: wrap; gap: 16px; }
        .filter-group { flex: 1; min-width: 220px; }
        .filter-label { font-size: 12px; color: #6B7280; margin-bottom: 6px; }
        .pill-row { display:flex; flex-wrap: wrap; gap: 8px; }
        .pill { border: 1px solid #E5E7EB; background: #F9FAFB; color:#374151; border-radius: 999px; padding: 6px 10px; font-size: 12px; cursor:pointer; transition: all .15s; }
        .pill:hover { background:#F3F4F6; }
        .pill-active { background: #EFF6FF; border-color:#2563EB; color:#1D4ED8; }

        .date-range input, .sort select { border: 1px solid #D1D5DB; border-radius: 10px; padding: 8px 10px; font-size: 14px; }
        .right-actions { margin-left: auto; display:flex; align-items:center; gap: 10px; }
        .count { font-size: 12px; color:#6B7280; }

        .table-wrap { width: 100%; overflow: auto; }
        .table { width: 100%; border-collapse: collapse; min-width: 1050px; }
        th { text-align:left; font-size: 12px; color:#6B7280; font-weight: 700; padding: 10px 8px; border-bottom: 1px solid #E5E7EB; }
        td { padding: 10px 8px; border-bottom: 1px solid #F3F4F6; vertical-align: top; }
        .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 12px; }
        .muted { color:#6B7280; font-size: 13px; }
        .strong { font-weight: 800; color:#111827; }
        .actions { text-align:right; }
        .empty { text-align:center; padding: 24px; color:#6B7280; }

        .customer-name { font-weight: 700; color:#111827; font-size: 13px; }
        .customer-sub { font-size: 12px; color:#6B7280; }

        .flags { display:flex; align-items:center; gap: 6px; }
        .flag { display:inline-flex; align-items:center; justify-content:center; width: 22px; height: 22px; border-radius: 6px; border:1px solid #FDE68A; background:#FFFBEB; color:#92400E; }

        .badge { display:inline-flex; align-items:center; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; border:1px solid transparent; }
        .badge-gray { background:#F3F4F6; color:#374151; }
        .badge-blue { background:#EFF6FF; color:#1D4ED8; border-color:#BFDBFE; }
        .badge-green { background:#ECFDF5; color:#065F46; border-color:#A7F3D0; }
        .badge-red { background:#FEF2F2; color:#991B1B; border-color:#FECACA; }

        .btn { display:inline-flex; align-items:center; gap: 8px; border:1px solid #D1D5DB; background:white; border-radius: 10px; padding: 10px 12px; font-weight: 700; font-size: 13px; cursor:pointer; }
        .btn:hover:not(:disabled) { background:#F9FAFB; }
        .btn:disabled { opacity:.5; cursor:not-allowed; }
        .btn-primary { display:inline-flex; align-items:center; justify-content:center; border:1px solid #2563EB; background:#2563EB; color:white; border-radius: 10px; padding: 10px 12px; font-weight: 800; font-size: 13px; cursor:pointer; }
        .btn-primary:hover { background:#1D4ED8; border-color:#1D4ED8; }
        .btn-small { padding: 8px 10px; border-radius: 9px; }

        .pagination { display:flex; align-items:center; justify-content: space-between; gap: 10px; margin-top: 12px; }

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
      <div className="panel">
        <div className="row">
          <button className="btn" onClick={() => navigate('../')} type="button">
            <Icon name="ChevronLeft" size={16} /> Zpět
          </button>
        </div>
        <div className="empty">Objednávka nenalezena.</div>
        <style>{`.panel{background:white;border-radius:12px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,.1)}.empty{padding:18px;color:#6B7280}`}</style>
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
          <Icon name="ChevronLeft" size={16} /> Zpět
        </button>
        <div className="title">
          <div className="h">Order {order.id}</div>
          <div className="sub">Vytvořeno: {formatDateTime(order.created_at)} • Modelů: {(order.models || []).length}</div>
        </div>
        <div className="right">
          <Badge tone={statusTone}>{getStatusLabel(order.status, language)}</Badge>
        </div>
      </div>

      {flags.length > 0 ? (
        <div className="banner">
          <Icon name="AlertTriangle" size={18} />
          <div>
            <div className="banner-title">Pozor: tento order má flags</div>
            <div className="banner-sub">{flags.map((f) => getFlagLabel(f, language)).join(' • ')}</div>
          </div>
        </div>
      ) : null}

      <div className="grid">
        <div className="left">
          <div className="panel">
            <div className="panel-title">Zákazník</div>
            <div className="kv">
              <div className="k">Jméno</div><div className="v">{order.customer_snapshot?.name || '—'}</div>
              <div className="k">Email</div><div className="v">{order.customer_snapshot?.email || '—'}</div>
              <div className="k">Telefon</div><div className="v">{order.customer_snapshot?.phone || '—'}</div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-title">Modely</div>
            <div className="models">
              {(order.models || []).map((m) => {
                const bd = m.price_breakdown_snapshot || {};
                return (
                  <div key={m.id} className="model-card">
                    <div className="model-top">
                      <div>
                        <div className="model-file">{m.file_snapshot?.filename || 'model'}</div>
                        <div className="model-sub">Material: {m.material_snapshot?.name || '—'} • Preset: {m.preset_snapshot?.name || '—'} • Qty: {m.quantity}</div>
                      </div>
                      <button className="btn-primary btn-small" onClick={() => navigate(`./${order.id}/model/${m.id}`)} type="button">
                        Detail
                      </button>
                    </div>

                    <div className="model-mid">
                      <div className="mini">
                        <div className="mini-k">Čas</div>
                        <div className="mini-v">{formatTime(m?.slicer_snapshot?.time_min || 0)}</div>
                      </div>
                      <div className="mini">
                        <div className="mini-k">Hmotnost</div>
                        <div className="mini-v">{round2(m?.slicer_snapshot?.weight_g || 0)} g</div>
                      </div>
                      <div className="mini">
                        <div className="mini-k">XYZ</div>
                        <div className="mini-v">{m?.slicer_snapshot?.dimensions_xyz?.x}×{m?.slicer_snapshot?.dimensions_xyz?.y}×{m?.slicer_snapshot?.dimensions_xyz?.z} mm</div>
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
            <div className="panel-title">Order totals</div>
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
            <div className="panel-title">Status & Actions</div>

            <div className="field">
              <div className="label">Status</div>
              <select value={statusDraft} onChange={(e) => setStatusDraft(e.target.value)}>
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>{getStatusLabel(s, language)}</option>
                ))}
              </select>
              <button className="btn-primary" onClick={() => changeStatus(statusDraft)} type="button">Uložit status</button>
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
              * Varianta A: akce jsou simulované (pro prezentaci UI).<br />
              Později napojíme na backend a PrusaSlicer jobs.
            </div>
          </div>

          <div className="panel">
            <div className="panel-title">Interní poznámky</div>
            <textarea value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} placeholder="Napiš interní poznámku…" />
            <button className="btn-primary" onClick={addNote} type="button">
              <Icon name="Plus" size={16} /> Přidat poznámku
            </button>

            <div className="notes">
              {(order.notes || []).length === 0 ? (
                <div className="muted">Zatím žádné poznámky.</div>
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
            <div className="panel-title">Audit log</div>
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
        title={confirm?.type === 'reslice' ? 'Re-slice objednávky' : 'Reprice objednávky'}
        message={confirm?.type === 'reslice'
          ? 'V demo režimu vytvořím nový slicer snapshot a automaticky spustím reprice. Chceš pokračovat?'
          : 'V demo režimu vytvořím novou cenovou revizi (reprice). Chceš pokračovat?'
        }
        confirmText="Ano, pokračovat"
        onConfirm={onConfirmAction}
        onCancel={() => setConfirm(null)}
      />

      <style>{`
        .detail { max-width: 1200px; }
        .header { display:flex; align-items:center; gap: 12px; margin-bottom: 12px; }
        .title { flex:1; }
        .h { font-size: 22px; font-weight: 900; color:#111827; }
        .sub { font-size: 13px; color:#6B7280; margin-top: 2px; }

        .grid { display:grid; grid-template-columns: 1.6fr 1fr; gap: 14px; }
        .panel { background:white; border-radius: 12px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,.1); margin-bottom: 14px; }
        .panel.sticky { position: sticky; top: 64px; }
        .panel-title { font-weight: 900; color:#111827; margin-bottom: 10px; }

        .kv { display:grid; grid-template-columns: 120px 1fr; gap: 8px 12px; }
        .k { color:#6B7280; font-size: 12px; }
        .v { color:#111827; font-weight: 700; font-size: 13px; }

        .models { display:flex; flex-direction: column; gap: 12px; }
        .model-card { border: 1px solid #E5E7EB; border-radius: 12px; padding: 14px; }
        .model-top { display:flex; align-items:flex-start; justify-content: space-between; gap: 10px; margin-bottom: 10px; }
        .model-file { font-weight: 900; color:#111827; }
        .model-sub { color:#6B7280; font-size: 12px; margin-top: 2px; }
        .model-mid { display:grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 10px; }
        .mini { border: 1px solid #F3F4F6; background:#F9FAFB; border-radius: 10px; padding: 10px; }
        .mini-k { font-size: 11px; color:#6B7280; }
        .mini-v { font-size: 12px; font-weight: 800; color:#111827; margin-top: 2px; }

        .breakdown { display:flex; flex-direction: column; gap: 6px; }
        .b-row { display:flex; justify-content: space-between; gap: 10px; color:#374151; font-size: 13px; }
        .b-row.total { font-weight: 900; color:#111827; border-top: 1px dashed #E5E7EB; padding-top: 8px; margin-top: 6px; }

        .field { display:flex; flex-direction: column; gap: 8px; }
        .label { font-size: 12px; color:#6B7280; }
        select { border: 1px solid #D1D5DB; border-radius: 10px; padding: 10px; font-weight: 700; }
        .action-row { display:flex; gap: 10px; margin-top: 12px; }
        .hint { margin-top: 12px; font-size: 12px; color:#6B7280; line-height: 1.35; }

        textarea { border: 1px solid #D1D5DB; border-radius: 10px; padding: 10px; min-height: 90px; resize: vertical; }
        .notes { margin-top: 12px; display:flex; flex-direction: column; gap: 10px; }
        .note { border: 1px solid #F3F4F6; background:#F9FAFB; border-radius: 10px; padding: 10px; }
        .note-top { display:flex; justify-content: space-between; gap: 10px; }
        .note-text { margin-top: 6px; font-size: 13px; color:#111827; white-space: pre-wrap; }

        .audit { display:flex; flex-direction: column; gap: 8px; }
        .audit-row { display:grid; grid-template-columns: 1fr 1fr auto; gap: 10px; align-items:center; border-bottom: 1px solid #F3F4F6; padding-bottom: 8px; }
        .audit-type { font-weight: 800; color:#111827; }

        .banner { display:flex; gap: 10px; align-items:flex-start; border: 1px solid #FDE68A; background:#FFFBEB; color:#92400E; padding: 12px; border-radius: 12px; margin-bottom: 12px; }
        .banner-title { font-weight: 900; }
        .banner-sub { font-size: 12px; margin-top: 2px; }

        .badge { display:inline-flex; align-items:center; padding: 6px 10px; border-radius: 999px; font-weight: 900; font-size: 12px; }
        .badge-blue { background:#EFF6FF; color:#1D4ED8; border:1px solid #BFDBFE; }
        .badge-green { background:#ECFDF5; color:#065F46; border:1px solid #A7F3D0; }
        .badge-red { background:#FEF2F2; color:#991B1B; border:1px solid #FECACA; }

        .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 12px; }
        .muted { color:#6B7280; font-size: 12px; }

        .btn { display:inline-flex; align-items:center; gap: 8px; border:1px solid #D1D5DB; background:white; border-radius: 10px; padding: 10px 12px; font-weight: 800; font-size: 13px; cursor:pointer; }
        .btn:hover { background:#F9FAFB; }
        .btn-primary { display:inline-flex; align-items:center; justify-content:center; gap: 8px; border:1px solid #2563EB; background:#2563EB; color:white; border-radius: 10px; padding: 10px 12px; font-weight: 900; font-size: 13px; cursor:pointer; }
        .btn-primary:hover { background:#1D4ED8; border-color:#1D4ED8; }
        .btn-small { padding: 8px 10px; }

        @media (max-width: 1050px) {
          .grid { grid-template-columns: 1fr; }
          .panel.sticky { position: relative; top: auto; }
        }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.45); display:flex; align-items:center; justify-content:center; padding: 18px; z-index: 999; }
        .modal { background:white; border-radius: 14px; padding: 16px; width: 100%; max-width: 460px; box-shadow: 0 8px 30px rgba(0,0,0,.2); }
        .modal-title { font-weight: 900; color:#111827; font-size: 16px; }
        .modal-body { margin-top: 8px; color:#374151; font-size: 14px; line-height: 1.4; }
        .modal-actions { display:flex; justify-content:flex-end; gap: 10px; margin-top: 14px; }
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
          <Icon name="ChevronLeft" size={16} /> Zpět na order
        </button>
        <div className="title">
          <div className="h">Model {model.id}</div>
          <div className="sub">{model.file_snapshot?.filename} • Order {order.id}</div>
        </div>
      </div>

      <div className="grid">
        <div className="panel">
          <div className="panel-title">Soubor & slicer snapshot</div>
          <div className="kv">
            <div className="k">Filename</div><div className="v">{model.file_snapshot?.filename}</div>
            <div className="k">Size</div><div className="v">{Math.round((model.file_snapshot?.size || 0) / 1024)} KB</div>
            <div className="k">Uploaded</div><div className="v">{formatDateTime(model.file_snapshot?.uploaded_at)}</div>
            <div className="k">Time</div><div className="v">{formatTime(model.slicer_snapshot?.time_min)}</div>
            <div className="k">Weight</div><div className="v">{round2(model.slicer_snapshot?.weight_g)} g</div>
            <div className="k">XYZ</div><div className="v">{model.slicer_snapshot?.dimensions_xyz?.x}×{model.slicer_snapshot?.dimensions_xyz?.y}×{model.slicer_snapshot?.dimensions_xyz?.z} mm</div>
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
          <div className="panel-title">Resolved config snapshot</div>
          <div className="row">
            <label className="toggle">
              <input type="checkbox" checked={showOnlyChanged} onChange={(e) => setShowOnlyChanged(e.target.checked)} />
              <span>Jen změněné (source != default)</span>
            </label>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Value</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {shownRows.map((r) => (
                  <tr key={r.key}>
                    <td className="mono">{r.key}</td>
                    <td>{String(r.value)}</td>
                    <td><Badge tone={r.source === 'widget' ? 'blue' : r.source === 'preset' ? 'green' : 'gray'}>{r.source}</Badge></td>
                  </tr>
                ))}
                {shownRows.length === 0 ? (
                  <tr><td colSpan={3} className="empty">Žádné záznamy pro zvolený filtr.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="muted" style={{ marginTop: 10 }}>
            * Snapshot slouží pro reprodukovatelnost a debug.
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">Price breakdown</div>
          <div className="breakdown">
            <div className="b-row"><span>Material</span><span>{formatMoney(bd.material_cost || 0)}</span></div>
            <div className="b-row"><span>Time</span><span>{formatMoney(bd.time_cost || 0)}</span></div>
            <div className="b-row"><span>Fees</span><span>{formatMoney(bd.fees_total || 0)}</span></div>
            <div className="b-row total"><span>Total (1 ks)</span><span>{formatMoney(bd.model_total || 0)}</span></div>
            <div className="b-row"><span>Quantity</span><span>{model.quantity}</span></div>
            <div className="b-row total"><span>Total (qty)</span><span>{formatMoney((bd.model_total || 0) * (Number(model.quantity) || 1))}</span></div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">Revision history (demo)</div>
          <div className="rev">
            <div className="rev-col">
              <div className="rev-h">Slicer revisions</div>
              {(model.revisions?.slicer || []).slice(0, 10).map((r) => (
                <div key={r.id} className="rev-item">
                  <div className="mono">{r.id}</div>
                  <div className="muted">{formatDateTime(r.created_at)} • {r.reason}</div>
                </div>
              ))}
            </div>
            <div className="rev-col">
              <div className="rev-h">Price revisions</div>
              {(model.revisions?.price || []).slice(0, 10).map((r) => (
                <div key={r.id} className="rev-item">
                  <div className="mono">{r.id}</div>
                  <div className="muted">{formatDateTime(r.created_at)} • {r.reason}</div>
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
          ? 'V demo režimu vytvořím nový slicer snapshot a automaticky spustím reprice. Chceš pokračovat?'
          : 'V demo režimu vytvořím novou cenovou revizi. Chceš pokračovat?'
        }
        confirmText="Ano, pokračovat"
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
        .h { font-size: 22px; font-weight: 900; color:#111827; }
        .sub { font-size: 13px; color:#6B7280; margin-top: 2px; }

        .grid { display:grid; grid-template-columns: 1fr; gap: 14px; }
        @media (min-width: 1100px) {
          .grid { grid-template-columns: 1.15fr 1.2fr; }
        }

        .panel { background:white; border-radius: 12px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,.1); }
        .panel-title { font-weight: 900; color:#111827; margin-bottom: 10px; }

        .kv { display:grid; grid-template-columns: 140px 1fr; gap: 8px 12px; }
        .k { color:#6B7280; font-size: 12px; }
        .v { color:#111827; font-weight: 800; font-size: 13px; }

        .actions { display:flex; gap: 10px; margin-top: 12px; flex-wrap: wrap; }

        .table-wrap { overflow:auto; }
        .table { width: 100%; border-collapse: collapse; min-width: 520px; }
        th { text-align:left; font-size: 12px; color:#6B7280; font-weight: 800; padding: 10px 8px; border-bottom: 1px solid #E5E7EB; }
        td { padding: 10px 8px; border-bottom: 1px solid #F3F4F6; }
        .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 12px; }
        .empty { text-align:center; padding: 18px; color:#6B7280; }

        .toggle { display:flex; gap: 10px; align-items:center; font-weight: 800; color:#374151; font-size: 13px; }

        .breakdown { display:flex; flex-direction: column; gap: 6px; }
        .b-row { display:flex; justify-content: space-between; gap: 10px; color:#374151; font-size: 13px; }
        .b-row.total { font-weight: 900; color:#111827; border-top: 1px dashed #E5E7EB; padding-top: 8px; margin-top: 6px; }

        .rev { display:grid; grid-template-columns: 1fr; gap: 12px; }
        @media (min-width: 900px) { .rev { grid-template-columns: 1fr 1fr; } }
        .rev-h { font-weight: 900; color:#111827; margin-bottom: 8px; }
        .rev-item { border: 1px solid #F3F4F6; background:#F9FAFB; border-radius: 10px; padding: 10px; margin-bottom: 10px; }

        .muted { color:#6B7280; font-size: 12px; }

        .btn { display:inline-flex; align-items:center; gap: 8px; border:1px solid #D1D5DB; background:white; border-radius: 10px; padding: 10px 12px; font-weight: 800; font-size: 13px; cursor:pointer; }
        .btn:hover { background:#F9FAFB; }

        .badge { display:inline-flex; align-items:center; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 900; border:1px solid transparent; }
        .badge-gray { background:#F3F4F6; color:#374151; }
        .badge-blue { background:#EFF6FF; color:#1D4ED8; border-color:#BFDBFE; }
        .badge-green { background:#ECFDF5; color:#065F46; border-color:#A7F3D0; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.45); display:flex; align-items:center; justify-content:center; padding: 18px; z-index: 999; }
        .modal { background:white; border-radius: 14px; padding: 16px; width: 100%; max-width: 460px; box-shadow: 0 8px 30px rgba(0,0,0,.2); }
        .modal-title { font-weight: 900; color:#111827; font-size: 16px; }
        .modal-body { margin-top: 8px; color:#374151; font-size: 14px; line-height: 1.4; }
        .modal-actions { display:flex; justify-content:flex-end; gap: 10px; margin-top: 14px; }
        .btn-primary { display:inline-flex; align-items:center; justify-content:center; gap: 8px; border:1px solid #2563EB; background:#2563EB; color:white; border-radius: 10px; padding: 10px 12px; font-weight: 900; font-size: 13px; cursor:pointer; }
      `}</style>
    </div>
  );
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const data = loadOrders();
    setOrders(data);
  }, []);

  return (
    <Routes>
      <Route index element={<OrdersList orders={orders} setOrders={setOrders} />} />
      <Route path=":id" element={<OrderDetail orders={orders} setOrders={setOrders} />} />
      <Route path=":id/model/:modelId" element={<ModelDetail orders={orders} setOrders={setOrders} />} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
}
