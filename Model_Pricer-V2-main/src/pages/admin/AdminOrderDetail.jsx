import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import { useLanguage } from '../../contexts/LanguageContext';
import StorageStatusBadge from './components/orders/StorageStatusBadge';
import { downloadFile, createZip } from '../../services/storageApi';
import {
  ORDER_STATUSES,
  appendOrderActivity,
  collectOrderFlags,
  computeOrderTotals,
  extractOrderMaterials,
  getFlagLabel,
  getStatusLabel,
  nowIso,
  round2,
  saveOrders,
} from '../../utils/adminOrdersStorage';

// ── Status colors ──
const STATUS_COLORS = {
  NEW:         { bg: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.30)' },
  REVIEW:      { bg: 'rgba(99, 102, 241, 0.12)', color: '#818cf8', border: 'rgba(99, 102, 241, 0.30)' },
  APPROVED:    { bg: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.30)' },
  PRINTING:    { bg: 'rgba(249, 115, 22, 0.12)', color: '#fb923c', border: 'rgba(249, 115, 22, 0.30)' },
  POSTPROCESS: { bg: 'rgba(234, 179, 8, 0.12)',  color: '#facc15', border: 'rgba(234, 179, 8, 0.30)' },
  READY:       { bg: 'rgba(0, 212, 170, 0.10)',   color: '#00d4aa', border: 'rgba(0, 212, 170, 0.25)' },
  SHIPPED:     { bg: 'rgba(20, 184, 166, 0.12)',  color: '#2dd4bf', border: 'rgba(20, 184, 166, 0.30)' },
  DONE:        { bg: 'rgba(34, 197, 94, 0.12)',   color: '#4ade80', border: 'rgba(34, 197, 94, 0.30)' },
  CANCELED:    { bg: 'rgba(239, 68, 68, 0.12)',   color: '#f87171', border: 'rgba(239, 68, 68, 0.30)' },
};

function getStatusColor(status) {
  return STATUS_COLORS[status] || STATUS_COLORS.NEW;
}

// ── Helpers ──
function formatDateTime(iso, locale = 'cs-CZ') {
  try {
    return new Date(iso).toLocaleString(locale, {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
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

function getSlicerTimeMin(slicer) {
  if (!slicer) return 0;
  if (Number(slicer.time_min) > 0) return Number(slicer.time_min);
  if (Number(slicer.estimatedTimeSeconds) > 0) return Number(slicer.estimatedTimeSeconds) / 60;
  return 0;
}

function getSlicerWeightG(slicer) {
  if (!slicer) return 0;
  return Number(slicer.weight_g) || Number(slicer.filamentGrams) || 0;
}

function formatSize(bytes) {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── StatusBadge ──
function StatusBadge({ status }) {
  const sc = getStatusColor(status);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '4px 12px', borderRadius: '999px',
      fontSize: '11px', fontFamily: 'var(--forge-font-tech)',
      fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
      backgroundColor: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
    }}>
      {getStatusLabel(status, 'cs')}
    </span>
  );
}

// ── ConfirmModal ──
function ConfirmModal({ open, title, message, confirmText = 'Potvrdit', cancelText = 'Zrusit', onConfirm, onCancel, destructive }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e) => { if (e.key === 'Escape' && onCancel) onCancel(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div ref={overlayRef} style={{
      position: 'fixed', inset: 0, background: 'rgba(8, 9, 12, 0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '18px', zIndex: 999,
    }} role="dialog" aria-modal="true">
      <div style={{
        backgroundColor: 'var(--forge-bg-surface)', borderRadius: 'var(--forge-radius-xl)',
        padding: '24px', width: '100%', maxWidth: '460px',
        boxShadow: 'var(--forge-shadow-lg)', border: '1px solid var(--forge-border-default)',
      }}>
        <div style={{
          fontFamily: 'var(--forge-font-heading)', fontWeight: 800,
          color: destructive ? 'var(--forge-error)' : 'var(--forge-text-primary)', fontSize: '16px',
        }}>{title}</div>
        <div style={{
          marginTop: '10px', color: 'var(--forge-text-secondary)',
          fontFamily: 'var(--forge-font-body)', fontSize: '14px', lineHeight: 1.5,
        }}>{message}</div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
          <button onClick={onCancel} type="button" className="od-btn">{cancelText}</button>
          <button onClick={onConfirm} type="button" style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            border: `1px solid ${destructive ? 'var(--forge-error)' : 'var(--forge-accent-primary)'}`,
            backgroundColor: destructive ? 'var(--forge-error)' : 'var(--forge-accent-primary)',
            color: destructive ? '#fff' : '#08090C', borderRadius: 'var(--forge-radius-lg)',
            padding: '10px 14px', fontWeight: 800, fontSize: '13px', cursor: 'pointer',
            fontFamily: 'var(--forge-font-body)',
          }}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}

// ── Status Timeline ──
function StatusTimeline({ order }) {
  const currentIdx = ORDER_STATUSES.indexOf(order.status);
  const isCanceled = order.status === 'CANCELED';

  // Build timeline from activity log — extract status changes
  const statusChanges = useMemo(() => {
    const changes = [];
    const activity = order.activity || [];
    // Walk in reverse (oldest first)
    for (let i = activity.length - 1; i >= 0; i--) {
      const a = activity[i];
      if (a.type === 'STATUS_CHANGE' && a.payload) {
        changes.push({
          status: a.payload.to,
          from: a.payload.from,
          timestamp: a.timestamp,
          userId: a.user_id || 'system',
        });
      }
    }
    return changes;
  }, [order.activity]);

  // Map of status -> earliest change timestamp
  const statusTimestampMap = useMemo(() => {
    const map = {};
    for (const ch of statusChanges) {
      if (!map[ch.status]) {
        map[ch.status] = ch;
      }
    }
    return map;
  }, [statusChanges]);

  // For canceled orders, show statuses up to the last status before cancelation, then CANCELED
  const visibleStatuses = isCanceled
    ? ORDER_STATUSES.filter(s => s !== 'CANCELED')
    : ORDER_STATUSES.filter(s => s !== 'CANCELED');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {visibleStatuses.map((status, idx) => {
        const statusIdx = ORDER_STATUSES.indexOf(status);
        const isPast = !isCanceled && statusIdx < currentIdx;
        const isCurrent = !isCanceled && statusIdx === currentIdx;
        const isFuture = !isCanceled && statusIdx > currentIdx;
        const changeInfo = statusTimestampMap[status];
        const sc = getStatusColor(status);
        const isLast = idx === visibleStatuses.length - 1;

        return (
          <div key={status} style={{ display: 'flex', gap: '12px', minHeight: '48px' }}>
            {/* Timeline line + dot */}
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              width: '24px', flexShrink: 0,
            }}>
              {/* Dot */}
              <div style={{
                width: isCurrent ? '14px' : '10px',
                height: isCurrent ? '14px' : '10px',
                borderRadius: '50%',
                backgroundColor: isCurrent ? sc.color : isPast ? sc.color : 'var(--forge-bg-overlay)',
                border: isCurrent
                  ? `3px solid ${sc.border}`
                  : isPast
                    ? 'none'
                    : '2px solid var(--forge-border-default)',
                boxShadow: isCurrent ? `0 0 8px ${sc.color}40` : 'none',
                flexShrink: 0,
                marginTop: '4px',
                transition: 'all 200ms ease',
              }} />
              {/* Line */}
              {!isLast && (
                <div style={{
                  width: '2px',
                  flex: 1,
                  minHeight: '20px',
                  backgroundColor: isPast ? 'var(--forge-accent-primary)' : 'var(--forge-border-default)',
                  opacity: isPast ? 0.4 : 0.25,
                  marginTop: '4px',
                }} />
              )}
            </div>

            {/* Content */}
            <div style={{
              flex: 1,
              paddingBottom: isLast ? 0 : '8px',
            }}>
              <div style={{
                fontSize: '13px',
                fontFamily: 'var(--forge-font-body)',
                fontWeight: isCurrent ? 700 : isPast ? 600 : 400,
                color: isCurrent ? sc.color : isPast ? 'var(--forge-text-primary)' : 'var(--forge-text-muted)',
              }}>
                {getStatusLabel(status, 'cs')}
                {isCurrent && (
                  <span style={{
                    marginLeft: '8px', fontSize: '10px',
                    fontFamily: 'var(--forge-font-tech)',
                    color: sc.color, textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}>Aktualni</span>
                )}
              </div>
              {changeInfo && (isPast || isCurrent) && (
                <div style={{
                  fontSize: '11px', fontFamily: 'var(--forge-font-tech)',
                  color: 'var(--forge-text-muted)', marginTop: '2px',
                }}>
                  {formatDateTime(changeInfo.timestamp)} — {changeInfo.userId}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Canceled status at the end if applicable */}
      {isCanceled && (
        <div style={{ display: 'flex', gap: '12px', minHeight: '48px' }}>
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            width: '24px', flexShrink: 0,
          }}>
            <div style={{
              width: '14px', height: '14px', borderRadius: '50%',
              backgroundColor: STATUS_COLORS.CANCELED.color,
              border: `3px solid ${STATUS_COLORS.CANCELED.border}`,
              boxShadow: `0 0 8px ${STATUS_COLORS.CANCELED.color}40`,
              flexShrink: 0, marginTop: '4px',
            }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '13px', fontFamily: 'var(--forge-font-body)',
              fontWeight: 700, color: STATUS_COLORS.CANCELED.color,
            }}>
              {getStatusLabel('CANCELED', 'cs')}
              <span style={{
                marginLeft: '8px', fontSize: '10px',
                fontFamily: 'var(--forge-font-tech)',
                color: STATUS_COLORS.CANCELED.color,
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>Aktualni</span>
            </div>
            {statusTimestampMap['CANCELED'] && (
              <div style={{
                fontSize: '11px', fontFamily: 'var(--forge-font-tech)',
                color: 'var(--forge-text-muted)', marginTop: '2px',
              }}>
                {formatDateTime(statusTimestampMap['CANCELED'].timestamp)} — {statusTimestampMap['CANCELED'].userId}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Card wrapper ──
function Card({ title, icon, children, style }) {
  return (
    <div style={{
      background: 'var(--forge-bg-surface)',
      borderRadius: 'var(--forge-radius-xl)',
      padding: '20px',
      border: '1px solid var(--forge-border-default)',
      boxShadow: 'var(--forge-shadow-sm)',
      ...style,
    }}>
      {title && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          marginBottom: '16px',
        }}>
          {icon && <Icon name={icon} size={14} style={{ color: 'var(--forge-text-muted)' }} />}
          <h3 style={{
            margin: 0, fontWeight: 800, color: 'var(--forge-text-primary)',
            fontFamily: 'var(--forge-font-tech)', fontSize: '12px',
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>{title}</h3>
        </div>
      )}
      {children}
    </div>
  );
}

// ── Main Component ──
export default function AdminOrderDetail({ orders, setOrders }) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const params = useParams();
  const orderId = params.id;

  const order = useMemo(() => orders.find((o) => o.id === orderId), [orders, orderId]);

  const [statusDraft, setStatusDraft] = useState(order?.status || 'NEW');
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [confirm, setConfirm] = useState(null);
  const statusDropdownRef = useRef(null);

  useEffect(() => {
    setStatusDraft(order?.status || 'NEW');
  }, [order?.status]);

  // Close status dropdown on outside click
  useEffect(() => {
    if (!statusDropdownOpen) return;
    function handleClick(e) {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target)) {
        setStatusDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [statusDropdownOpen]);

  if (!order) {
    return (
      <div className="od-page">
        <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
          <button className="od-btn" onClick={() => navigate('../')} type="button">
            <Icon name="ChevronLeft" size={16} /> Zpet na objednavky
          </button>
        </div>
        <Card>
          <div style={{ padding: '32px', color: 'var(--forge-text-muted)', textAlign: 'center', fontFamily: 'var(--forge-font-body)' }}>
            <Icon name="PackageX" size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <p>Objednavka nenalezena.</p>
          </div>
        </Card>
        <style>{orderDetailStyles}</style>
      </div>
    );
  }

  const totals = computeOrderTotals(order);
  const flags = collectOrderFlags(order);
  const materials = extractOrderMaterials(order);
  const customer = order.customer_snapshot || {};

  // Storage data
  const storage = order.storage || {};
  const storageStatus = storage.status || 'pending';
  const hasStorage = storageStatus === 'complete' && !!storage.storagePath;

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
        { timestamp: nowIso(), user_id: 'admin', type: 'STATUS_CHANGE', payload: { from: order.status, to: nextStatus } },
        ...(order.activity || []),
      ].slice(0, 200),
    };
    persist(updated, { timestamp: nowIso(), user_id: 'admin', type: 'STATUS_CHANGE', payload: { from: order.status, to: nextStatus } });
    setStatusDropdownOpen(false);
  }

  function cancelOrder() {
    changeStatus('CANCELED');
    setConfirm(null);
  }

  function addNote() {
    const text = noteDraft.trim();
    if (!text) return;
    const updated = {
      ...order,
      updated_at: nowIso(),
      notes: [
        { id: `n-${Date.now()}`, timestamp: nowIso(), user_id: 'admin', text },
        ...(order.notes || []),
      ].slice(0, 200),
      activity: [
        { timestamp: nowIso(), user_id: 'admin', type: 'NOTE_ADDED', payload: { length: text.length } },
        ...(order.activity || []),
      ].slice(0, 200),
    };
    persist(updated, { timestamp: nowIso(), user_id: 'admin', type: 'NOTE_ADDED', payload: { length: text.length } });
    setNoteDraft('');
  }

  function handlePrintSummary() {
    // Open print dialog with order summary
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;
    const models = order.models || [];
    const modelsHtml = models.map((m) => {
      const bd = m.price_breakdown_snapshot || {};
      return `<tr>
        <td>${m.file_snapshot?.filename || '-'}</td>
        <td>${m.material_snapshot?.name || '-'}</td>
        <td>${m.quantity || 1}</td>
        <td>${formatMoney(bd.model_total || 0)}</td>
      </tr>`;
    }).join('');

    printWindow.document.write(`<!DOCTYPE html>
    <html><head><title>Objednavka ${order.id}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 40px; color: #222; }
      h1 { font-size: 20px; margin-bottom: 4px; }
      .meta { color: #666; font-size: 13px; margin-bottom: 24px; }
      table { width: 100%; border-collapse: collapse; margin: 16px 0; }
      th, td { padding: 8px 12px; border: 1px solid #ddd; text-align: left; font-size: 13px; }
      th { background: #f5f5f5; font-weight: 700; }
      .totals { margin-top: 16px; }
      .totals div { display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px; }
      .totals .total { font-weight: 700; font-size: 16px; border-top: 2px solid #222; padding-top: 8px; margin-top: 8px; }
      .customer { margin: 16px 0; padding: 12px; background: #f9f9f9; border-radius: 4px; }
    </style></head><body>
    <h1>Objednavka ${order.id}</h1>
    <div class="meta">Vytvoreno: ${formatDateTime(order.created_at)} | Status: ${getStatusLabel(order.status, 'cs')}</div>
    <div class="customer">
      <strong>${customer.name || '-'}</strong><br/>
      ${customer.email || ''}${customer.phone ? ` | ${customer.phone}` : ''}
      ${customer.company ? `<br/>${customer.company}` : ''}
    </div>
    <table><thead><tr><th>Model</th><th>Material</th><th>Ks</th><th>Cena</th></tr></thead>
    <tbody>${modelsHtml}</tbody></table>
    <div class="totals">
      <div><span>Subtotal modely</span><span>${formatMoney(totals.subtotal_models)}</span></div>
      <div><span>Jednorazove poplatky</span><span>${formatMoney(totals.one_time_fees_total)}</span></div>
      <div><span>Doprava</span><span>${formatMoney(totals.shipping_total)}</span></div>
      <div class="total"><span>Celkem</span><span>${formatMoney(totals.total)}</span></div>
    </div>
    </body></html>`);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 300);
  }

  function handleOpenFolder() {
    const folderPath = storage.storagePath || '';
    navigate(`/admin/model-storage?path=${encodeURIComponent(folderPath)}`);
  }

  function handleDownloadZip() {
    if (!hasStorage) return;
    createZip([storage.storagePath]).catch(console.error);
  }

  async function handleDownloadFile(filePath) {
    try {
      const filename = filePath.split('/').pop() || 'download';
      const blobUrl = await downloadFile(filePath);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download failed:', err);
    }
  }

  const statusTone = order.status === 'CANCELED' ? 'red' : order.status === 'DONE' ? 'green' : 'blue';

  return (
    <div className="od-page">
      {/* ── Header ── */}
      <div className="od-header">
        <button className="od-btn" onClick={() => navigate('../')} type="button">
          <Icon name="ChevronLeft" size={16} /> Zpet
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h1 style={{
              margin: 0, fontSize: '24px', fontWeight: 900,
              color: 'var(--forge-text-primary)', fontFamily: 'var(--forge-font-heading)',
            }}>
              Objednavka {order.id}
            </h1>
            <StatusBadge status={order.status} />
          </div>
          <div style={{
            fontSize: '13px', color: 'var(--forge-text-muted)',
            marginTop: '4px', fontFamily: 'var(--forge-font-body)',
          }}>
            Vytvoreno: {formatDateTime(order.created_at)} | Modelu: {(order.models || []).length} | Materialy: {materials.join(', ') || '-'}
          </div>
        </div>

        {/* Action buttons */}
        <div className="od-header-actions">
          <button className="od-btn" onClick={handlePrintSummary} type="button" title="Tisk souhrnu">
            <Icon name="Printer" size={16} /> Tisk souhrnu
          </button>
          <button className="od-btn" type="button" title="Poslat zakaznikovi" style={{ opacity: 0.5, cursor: 'default' }}>
            <Icon name="Mail" size={16} /> Poslat zakaznikovi
          </button>
          {order.status !== 'CANCELED' && order.status !== 'DONE' && (
            <button
              className="od-btn od-btn-danger"
              onClick={() => setConfirm({ type: 'cancel' })}
              type="button"
            >
              <Icon name="XCircle" size={16} /> Zrusit objednavku
            </button>
          )}
        </div>
      </div>

      {/* Flags banner */}
      {flags.length > 0 && (
        <div className="od-banner-warning">
          <Icon name="AlertTriangle" size={18} />
          <div>
            <div style={{ fontWeight: 900, fontFamily: 'var(--forge-font-heading)' }}>Upozorneni</div>
            <div style={{ fontSize: '12px', marginTop: '2px', color: 'rgba(255,181,71,0.8)', fontFamily: 'var(--forge-font-body)' }}>
              {flags.map((f) => getFlagLabel(f, 'cs')).join(' / ')}
            </div>
          </div>
        </div>
      )}

      {/* ── Main Grid ── */}
      <div className="od-grid">
        {/* Left column: main content */}
        <div className="od-col-left">
          {/* Items table */}
          <Card title="Polozky objednavky" icon="Package">
            <div style={{ overflowX: 'auto' }}>
              <table className="od-table">
                <thead>
                  <tr>
                    <th>Model</th>
                    <th>Material</th>
                    <th>Kvalita</th>
                    <th>Ks</th>
                    <th>Cas tisku</th>
                    <th>Hmotnost</th>
                    <th>Cena/ks</th>
                    <th>Celkem</th>
                    {hasStorage && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {(order.models || []).map((m, idx) => {
                    const bd = m.price_breakdown_snapshot || {};
                    const qty = m.quantity || 1;
                    const unitPrice = Number(bd.model_total) || Number(bd.total) || Number(bd.totalPrice) || Number(m.totalPrice) || Number(m.price) || 0;
                    const slicer = m.slicer_snapshot || {};
                    return (
                      <tr key={m.id} className={idx % 2 === 0 ? 'od-row-even' : 'od-row-odd'}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Icon name="Box" size={14} style={{ color: 'var(--forge-text-muted)', flexShrink: 0 }} />
                            <span style={{
                              fontWeight: 600, color: 'var(--forge-text-primary)',
                              maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {m.file_snapshot?.filename || 'model'}
                            </span>
                          </div>
                        </td>
                        <td>{m.material_snapshot?.name || '-'}</td>
                        <td>{m.preset_snapshot?.name || '-'}</td>
                        <td style={{ fontFamily: 'var(--forge-font-tech)' }}>{qty}</td>
                        <td style={{ fontFamily: 'var(--forge-font-tech)' }}>{formatTime(getSlicerTimeMin(slicer))}</td>
                        <td style={{ fontFamily: 'var(--forge-font-tech)' }}>{round2(getSlicerWeightG(slicer))} g</td>
                        <td style={{ fontFamily: 'var(--forge-font-tech)' }}>{formatMoney(unitPrice)}</td>
                        <td style={{ fontFamily: 'var(--forge-font-tech)', fontWeight: 700, color: 'var(--forge-text-primary)' }}>
                          {formatMoney(unitPrice * qty)}
                        </td>
                        {hasStorage && (() => {
                          const filename = m.file_snapshot?.filename || '';
                          const manifestEntry = (storage.fileManifest || []).find(
                            (f) => f.type === 'model' && (f.filename === filename || f.filename === filename.replace(/[^a-zA-Z0-9._-]/g, '_'))
                          );
                          const basePath = (storage.storagePath || '').replace(/\/+$/, '');
                          const filePath = manifestEntry?.path || (manifestEntry ? `${basePath}/models/${manifestEntry.filename}` : '');
                          return (
                            <td style={{ padding: '10px' }}>
                              {manifestEntry && filePath && (
                                <button
                                  type="button"
                                  onClick={() => handleDownloadFile(filePath)}
                                  title="Stahnout model"
                                  style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: 'var(--forge-accent-primary)', padding: '4px',
                                  }}
                                >
                                  <Icon name="Download" size={14} />
                                </button>
                              )}
                            </td>
                          );
                        })()}
                      </tr>
                    );
                  })}
                  {(order.models || []).length === 0 && (
                    <tr><td colSpan={hasStorage ? 9 : 8} style={{ textAlign: 'center', padding: '24px', color: 'var(--forge-text-muted)' }}>Zadne polozky</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Storage section */}
          <Card title="Soubory a uloziste" icon="HardDrive">
            {/* Storage status + action buttons */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: '12px', padding: '12px 16px',
              background: 'var(--forge-bg-elevated)', borderRadius: 'var(--forge-radius-md)',
              border: '1px solid var(--forge-border-default)', flexWrap: 'wrap',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  fontSize: '11px', fontFamily: 'var(--forge-font-tech)',
                  color: 'var(--forge-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em',
                }}>Storage:</span>
                <StorageStatusBadge status={storageStatus} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {hasStorage && (
                  <>
                    <button
                      type="button"
                      onClick={handleOpenFolder}
                      className="od-btn-primary"
                      style={{ gap: '6px' }}
                    >
                      <Icon name="FolderOpen" size={14} />
                      Otevrit v Model Storage
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadZip}
                      className="od-btn"
                    >
                      <Icon name="Download" size={14} />
                      Stahnout ZIP
                    </button>
                  </>
                )}
                {!hasStorage && storage.storagePath && (
                  <button
                    type="button"
                    onClick={handleOpenFolder}
                    className="od-btn"
                  >
                    <Icon name="FolderOpen" size={14} />
                    Otevrit slozku
                  </button>
                )}
              </div>
            </div>

            {/* File manifest */}
            {hasStorage && storage.fileManifest?.length > 0 && (() => {
              const basePath = (storage.storagePath || '').replace(/\/+$/, '');
              const TYPE_SUBDIR = { model: 'models', gcode: 'gcode', preset: 'presets', meta: 'meta' };
              const visibleFiles = storage.fileManifest.filter(
                (f) => !f.filename?.toLowerCase().endsWith('.json')
              );
              if (visibleFiles.length === 0) return null;
              return (
                <div style={{ marginTop: '16px' }}>
                  <div style={{
                    fontSize: '11px', fontFamily: 'var(--forge-font-tech)',
                    color: 'var(--forge-text-muted)', textTransform: 'uppercase',
                    letterSpacing: '0.06em', marginBottom: '8px',
                  }}>
                    Manifest souboru ({visibleFiles.length} souboru)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {visibleFiles.map((file, idx) => {
                      const subdir = TYPE_SUBDIR[file.type] || file.type;
                      const dlPath = file.path || `${basePath}/${subdir}/${file.filename}`;
                      return (
                        <div key={idx} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '6px 10px', borderRadius: 'var(--forge-radius-sm)',
                          background: idx % 2 === 0 ? 'transparent' : 'var(--forge-bg-elevated)',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              fontSize: '10px', fontFamily: 'var(--forge-font-tech)',
                              color: 'var(--forge-accent-primary)', textTransform: 'uppercase', minWidth: '48px',
                            }}>{file.type}</span>
                            <span style={{
                              fontSize: '12px', fontFamily: 'var(--forge-font-body)',
                              color: 'var(--forge-text-primary)',
                            }}>{file.filename}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              fontSize: '11px', fontFamily: 'var(--forge-font-tech)',
                              color: 'var(--forge-text-muted)',
                            }}>{formatSize(file.sizeBytes)}</span>
                            <button
                              type="button"
                              onClick={() => handleDownloadFile(dlPath)}
                              title={`Stahnout ${file.filename}`}
                              style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: 'var(--forge-accent-primary)', padding: '4px',
                                display: 'inline-flex', alignItems: 'center',
                              }}
                            >
                              <Icon name="Download" size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* No storage data fallback */}
            {!order.storage && (
              <div style={{
                marginTop: '12px', padding: '16px', textAlign: 'center',
                color: 'var(--forge-text-muted)', fontSize: '13px', fontFamily: 'var(--forge-font-body)',
              }}>
                <Icon name="FolderX" size={24} style={{ opacity: 0.3, marginBottom: '8px', display: 'block', margin: '0 auto 8px' }} />
                Soubory objednavky nejsou v ulozisti.
              </div>
            )}
          </Card>

          {/* Pricing breakdown */}
          <Card title="Cenovy rozpad" icon="Calculator">
            <div className="od-breakdown">
              <div className="od-b-row"><span>Subtotal modely</span><span>{formatMoney(totals.subtotal_models)}</span></div>
              <div className="od-b-row"><span>Jednorazove poplatky</span><span>{formatMoney(totals.one_time_fees_total)}</span></div>
              <div className="od-b-row"><span>Doprava</span><span>{formatMoney(totals.shipping_total)}</span></div>
              {totals.min_order_delta !== 0 && (
                <div className="od-b-row"><span>Min. objednavka (dorovnani)</span><span>{formatMoney(totals.min_order_delta)}</span></div>
              )}
              {totals.rounding_delta !== 0 && (
                <div className="od-b-row"><span>Zaokrouhleni</span><span>{formatMoney(totals.rounding_delta)}</span></div>
              )}
              <div className="od-b-row od-b-total"><span>Celkem</span><span>{formatMoney(totals.total)}</span></div>
            </div>

            {/* Summary stats */}
            <div className="od-stats-row">
              <div className="od-stat">
                <div className="od-stat-label">Celkovy cas</div>
                <div className="od-stat-value">{formatTime(totals.sum_time_min)}</div>
              </div>
              <div className="od-stat">
                <div className="od-stat-label">Celkova hmotnost</div>
                <div className="od-stat-value">{round2(totals.sum_weight_g)} g</div>
              </div>
              <div className="od-stat">
                <div className="od-stat-label">Pocet kusu</div>
                <div className="od-stat-value">{totals.sum_pieces}</div>
              </div>
            </div>
          </Card>

          {/* Customer info */}
          <Card title="Zakaznik" icon="User">
            <div className="od-kv">
              <div className="od-kv-row">
                <span className="od-kv-label">Jmeno</span>
                <span className="od-kv-value">{customer.name || '-'}</span>
              </div>
              <div className="od-kv-row">
                <span className="od-kv-label">Email</span>
                <span className="od-kv-value">{customer.email || '-'}</span>
              </div>
              <div className="od-kv-row">
                <span className="od-kv-label">Telefon</span>
                <span className="od-kv-value">{customer.phone || '-'}</span>
              </div>
              <div className="od-kv-row">
                <span className="od-kv-label">Firma</span>
                <span className="od-kv-value">{customer.company || '-'}</span>
              </div>
            </div>

            {/* Shipping address */}
            {order.shipping_address && (order.shipping_address.street || order.shipping_address.city) && (
              <div style={{ marginTop: '16px' }}>
                <div style={{
                  fontSize: '11px', fontFamily: 'var(--forge-font-tech)',
                  color: 'var(--forge-text-muted)', textTransform: 'uppercase',
                  letterSpacing: '0.06em', marginBottom: '8px',
                }}>Dorucovaci adresa</div>
                <div style={{
                  padding: '12px 16px', background: 'var(--forge-bg-elevated)',
                  borderRadius: 'var(--forge-radius-md)', border: '1px solid var(--forge-border-default)',
                  fontFamily: 'var(--forge-font-body)', fontSize: '13px',
                  color: 'var(--forge-text-primary)', lineHeight: 1.6,
                }}>
                  <div>{order.shipping_address.street}</div>
                  <div>{order.shipping_address.city}{order.shipping_address.zip ? `, ${order.shipping_address.zip}` : ''}</div>
                  <div>{order.shipping_address.country || ''}</div>
                </div>
              </div>
            )}
          </Card>

          {/* Notes */}
          <Card title="Interni poznamky" icon="MessageSquare">
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <textarea
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="Napis interni poznamku..."
                className="od-textarea"
              />
              <button
                className="od-btn-primary"
                onClick={addNote}
                type="button"
                disabled={!noteDraft.trim()}
                style={{
                  alignSelf: 'flex-end',
                  opacity: noteDraft.trim() ? 1 : 0.5,
                  cursor: noteDraft.trim() ? 'pointer' : 'default',
                }}
              >
                <Icon name="Plus" size={14} /> Pridat
              </button>
            </div>

            {(order.notes || []).length === 0 ? (
              <div style={{ color: 'var(--forge-text-muted)', fontSize: '13px', fontFamily: 'var(--forge-font-body)' }}>
                Zatim zadne poznamky.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(order.notes || []).map((n, idx) => (
                  <div key={n.id || idx} style={{
                    padding: '10px 14px', background: 'var(--forge-bg-elevated)',
                    borderRadius: 'var(--forge-radius-md)',
                    borderLeft: '3px solid var(--forge-accent-primary)',
                  }}>
                    <p style={{
                      fontSize: '13px', color: 'var(--forge-text-primary)',
                      fontFamily: 'var(--forge-font-body)', margin: 0, whiteSpace: 'pre-wrap',
                    }}>{n.text}</p>
                    <div style={{
                      fontSize: '10px', color: 'var(--forge-text-muted)',
                      fontFamily: 'var(--forge-font-tech)', marginTop: '6px',
                      display: 'flex', gap: '8px',
                    }}>
                      <span>{n.timestamp ? formatDateTime(n.timestamp) : ''}</span>
                      <span>{n.user_id || ''}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right column: timeline + actions + activity */}
        <div className="od-col-right">
          {/* Status change */}
          <Card title="Zmena stavu" icon="RefreshCcw" style={{ position: 'sticky', top: '64px' }}>
            <div ref={statusDropdownRef} style={{ position: 'relative', marginBottom: '12px' }}>
              <button
                type="button"
                onClick={() => setStatusDropdownOpen(v => !v)}
                className="od-status-trigger"
              >
                <StatusBadge status={order.status} />
                <Icon name="ChevronDown" size={14} style={{
                  color: 'var(--forge-text-muted)',
                  transform: statusDropdownOpen ? 'rotate(180deg)' : 'rotate(0)',
                  transition: 'transform 150ms ease',
                }} />
              </button>

              {statusDropdownOpen && (
                <div className="od-status-dropdown" role="listbox">
                  {ORDER_STATUSES.map((s) => {
                    const sc = getStatusColor(s);
                    const isActive = s === order.status;
                    return (
                      <button
                        key={s} type="button" role="option" aria-selected={isActive}
                        onClick={() => changeStatus(s)}
                        className="od-status-option"
                        style={{
                          background: isActive ? 'var(--forge-bg-overlay)' : 'transparent',
                          fontWeight: isActive ? 600 : 400,
                        }}
                      >
                        <span style={{
                          width: '8px', height: '8px', borderRadius: '50%',
                          backgroundColor: sc.color, flexShrink: 0,
                        }} />
                        <span>{getStatusLabel(s, 'cs')}</span>
                        {isActive && (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginLeft: 'auto' }}>
                            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="var(--forge-accent-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>

          {/* Status timeline */}
          <Card title="Prubeh objednavky" icon="GitBranch">
            <StatusTimeline order={order} />
          </Card>

          {/* Activity log */}
          <Card title="Aktivita" icon="Activity">
            {(order.activity || []).length === 0 ? (
              <div style={{ color: 'var(--forge-text-muted)', fontSize: '13px', fontFamily: 'var(--forge-font-body)' }}>
                Zatim zadna aktivita.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {(order.activity || []).slice(0, 30).map((a, idx) => {
                  const isStatusChange = a.type === 'STATUS_CHANGE';
                  return (
                    <div key={`${a.timestamp}-${idx}`} style={{
                      display: 'flex', alignItems: 'flex-start', gap: '10px',
                      padding: '8px 0',
                      borderBottom: idx < Math.min((order.activity || []).length, 30) - 1
                        ? '1px solid var(--forge-border-default)' : 'none',
                    }}>
                      <div style={{
                        width: '6px', height: '6px', borderRadius: '50%',
                        backgroundColor: isStatusChange ? 'var(--forge-accent-primary)' : 'var(--forge-text-muted)',
                        flexShrink: 0, marginTop: '6px',
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '12px', fontFamily: 'var(--forge-font-body)',
                          color: 'var(--forge-text-primary)', fontWeight: 500,
                        }}>
                          {a.type === 'STATUS_CHANGE' && a.payload
                            ? `${getStatusLabel(a.payload.from, 'cs')} \u2192 ${getStatusLabel(a.payload.to, 'cs')}`
                            : a.type === 'NOTE_ADDED'
                              ? 'Poznamka pridana'
                              : a.type === 'REPRICE'
                                ? 'Prepocet ceny'
                                : a.type === 'RESLICE'
                                  ? 'Re-slice'
                                  : a.type
                          }
                        </div>
                        <div style={{
                          fontSize: '10px', fontFamily: 'var(--forge-font-tech)',
                          color: 'var(--forge-text-muted)', marginTop: '2px',
                        }}>
                          {a.timestamp ? formatDateTime(a.timestamp) : ''} {a.user_id ? `\u2014 ${a.user_id}` : ''}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {(order.activity || []).length > 30 && (
                  <div style={{
                    fontSize: '11px', color: 'var(--forge-text-muted)',
                    fontFamily: 'var(--forge-font-tech)', paddingTop: '8px',
                  }}>
                    ... a dalsich {(order.activity || []).length - 30} zaznamu
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Cancel confirm */}
      <ConfirmModal
        open={confirm?.type === 'cancel'}
        title="Zrusit objednavku"
        message="Opravdu chcete zrusit tuto objednavku? Tato akce zmeni stav na 'Zruseno'. Data objednavky zustanou zachovana."
        confirmText="Ano, zrusit objednavku"
        cancelText="Ne, ponechat"
        onConfirm={cancelOrder}
        onCancel={() => setConfirm(null)}
        destructive
      />

      <style>{orderDetailStyles}</style>
    </div>
  );
}

// ── Styles ──
const orderDetailStyles = `
  .od-page { max-width: 1300px; }

  .od-header {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }
  .od-header-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .od-grid {
    display: grid;
    grid-template-columns: 1.6fr 1fr;
    gap: 16px;
    align-items: start;
  }
  .od-col-left { display: flex; flex-direction: column; gap: 16px; }
  .od-col-right { display: flex; flex-direction: column; gap: 16px; }

  .od-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border: 1px solid var(--forge-border-default);
    background: var(--forge-bg-elevated);
    color: var(--forge-text-secondary);
    border-radius: var(--forge-radius-lg);
    padding: 8px 12px;
    font-weight: 600;
    font-size: 12px;
    cursor: pointer;
    font-family: var(--forge-font-body);
    transition: all var(--forge-duration-micro, 120ms) ease;
    white-space: nowrap;
  }
  .od-btn:hover {
    background: var(--forge-bg-overlay);
    border-color: var(--forge-border-active);
    color: var(--forge-text-primary);
  }
  .od-btn-danger {
    border-color: rgba(239, 68, 68, 0.3);
    color: var(--forge-error);
    background: rgba(239, 68, 68, 0.08);
  }
  .od-btn-danger:hover {
    background: rgba(239, 68, 68, 0.15);
    border-color: rgba(239, 68, 68, 0.5);
  }
  .od-btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border: 1px solid var(--forge-accent-primary);
    background: var(--forge-accent-primary);
    color: #08090C;
    border-radius: var(--forge-radius-lg);
    padding: 8px 12px;
    font-weight: 700;
    font-size: 12px;
    cursor: pointer;
    font-family: var(--forge-font-body);
    transition: all var(--forge-duration-micro, 120ms) ease;
    white-space: nowrap;
  }
  .od-btn-primary:hover {
    background: var(--forge-accent-primary-h);
    border-color: var(--forge-accent-primary-h);
  }

  .od-banner-warning {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    border: 1px solid rgba(255, 181, 71, 0.3);
    background: rgba(255, 181, 71, 0.08);
    color: var(--forge-warning);
    padding: 12px 16px;
    border-radius: var(--forge-radius-xl);
    margin-bottom: 16px;
  }

  /* Items table */
  .od-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 700px;
  }
  .od-table th {
    text-align: left;
    font-size: 10px;
    font-family: var(--forge-font-tech);
    color: var(--forge-text-muted);
    font-weight: 700;
    padding: 8px 10px;
    border-bottom: 2px solid var(--forge-border-default);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .od-table td {
    padding: 10px;
    border-bottom: 1px solid var(--forge-border-default);
    color: var(--forge-text-secondary);
    font-size: 13px;
    font-family: var(--forge-font-body);
  }
  .od-row-even { background: var(--forge-bg-surface); }
  .od-row-odd { background: var(--forge-bg-elevated); }
  .od-table tr:hover td { background: var(--forge-bg-overlay); }

  /* Breakdown */
  .od-breakdown { display: flex; flex-direction: column; gap: 6px; }
  .od-b-row {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    color: var(--forge-text-secondary);
    font-size: 13px;
    font-family: var(--forge-font-body);
  }
  .od-b-row span:last-child { font-family: var(--forge-font-tech); font-weight: 600; }
  .od-b-total {
    font-weight: 900 !important;
    color: var(--forge-accent-primary) !important;
    border-top: 1px dashed var(--forge-border-active);
    padding-top: 10px;
    margin-top: 8px;
    font-size: 15px !important;
  }
  .od-b-total span:last-child { font-weight: 900 !important; }

  .od-stats-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-top: 16px;
  }
  .od-stat {
    padding: 10px 12px;
    background: var(--forge-bg-elevated);
    border-radius: var(--forge-radius-md);
    border: 1px solid var(--forge-border-default);
  }
  .od-stat-label {
    font-size: 10px;
    font-family: var(--forge-font-tech);
    color: var(--forge-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .od-stat-value {
    font-size: 15px;
    font-weight: 800;
    color: var(--forge-text-primary);
    font-family: var(--forge-font-tech);
    margin-top: 2px;
  }

  /* KV */
  .od-kv { display: flex; flex-direction: column; gap: 0; }
  .od-kv-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid var(--forge-border-default);
  }
  .od-kv-row:last-child { border-bottom: none; }
  .od-kv-label {
    font-size: 11px;
    font-family: var(--forge-font-tech);
    color: var(--forge-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .od-kv-value {
    font-size: 14px;
    font-family: var(--forge-font-body);
    color: var(--forge-text-primary);
    font-weight: 600;
  }

  /* Textarea */
  .od-textarea {
    flex: 1;
    background: var(--forge-bg-elevated);
    border: 1px solid var(--forge-border-default);
    border-radius: var(--forge-radius-md);
    padding: 10px 12px;
    font-size: 13px;
    font-family: var(--forge-font-body);
    color: var(--forge-text-primary);
    resize: vertical;
    min-height: 70px;
    outline: none;
  }
  .od-textarea::placeholder { color: var(--forge-text-muted); }
  .od-textarea:focus {
    border-color: var(--forge-accent-primary);
  }

  /* Status dropdown */
  .od-status-trigger {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 12px;
    background: var(--forge-bg-elevated);
    border: 1px solid var(--forge-border-default);
    border-radius: var(--forge-radius-lg);
    cursor: pointer;
    transition: border-color 120ms ease;
  }
  .od-status-trigger:hover {
    border-color: var(--forge-border-active);
  }
  .od-status-dropdown {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    background: var(--forge-bg-surface);
    border: 1px solid var(--forge-border-default);
    border-radius: var(--forge-radius-lg);
    box-shadow: var(--forge-shadow-lg);
    padding: 4px 0;
    z-index: 50;
    overflow: hidden;
  }
  .od-status-option {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 12px;
    border: none;
    cursor: pointer;
    font-size: 13px;
    font-family: var(--forge-font-body);
    color: var(--forge-text-primary);
    text-align: left;
    transition: background-color 100ms ease;
  }
  .od-status-option:hover {
    background: var(--forge-bg-overlay) !important;
  }

  @media (max-width: 1050px) {
    .od-grid { grid-template-columns: 1fr; }
    .od-header { flex-direction: column; }
    .od-stats-row { grid-template-columns: 1fr; }
  }
`;
