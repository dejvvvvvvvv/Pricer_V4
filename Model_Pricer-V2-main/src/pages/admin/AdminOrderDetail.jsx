import React, { useCallback, useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import { debug } from '@/lib/debug';
import { Canvas, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls, Center } from '@react-three/drei';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { sanitizeHtmlAllowBasic } from '@/utils/sanitizeHtml';
import * as THREE from 'three';
import Icon from '../../components/AppIcon';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import StorageStatusBadge from './components/orders/StorageStatusBadge';
import OrderTagSelector from './components/orders/OrderTagSelector';
import { downloadFile, createZip, getDownloadUrl } from '../../services/storageApi';
import {
  ORDER_STATUSES,
  appendOrderActivity,
  collectOrderFlags,
  computeOrderTotals,
  extractOrderMaterials,
  getFlagLabel,
  getStatusLabel,
  loadOrders,
  nowIso,
  round2,
  saveOrders,
} from '../../utils/adminOrdersStorage';
import { formatDateTime, formatMoney, formatTime, formatSize } from '../../utils/formatters';
import { generateId } from '../../utils/generateId';
import { logActivity } from '../../utils/adminActivityLog';
import { generateInvoiceHTML, generateInvoiceNumber, getDueDate, formatInvoiceDate } from '../../utils/invoiceGenerator';
import { saveInvoice, getInvoice, updateInvoiceStatus } from '../../utils/invoiceStorage';
import { readCompanyData } from '../../utils/adminCompanyStorage';
import { loadEmailTemplates, EMAIL_TEMPLATE_TYPES, EMAIL_TEMPLATE_VARIABLES, loadAutoSendRules, addEmailLogEntry } from '../../utils/adminEmailStorage';
import { logEmailSent, getEmailLog } from '../../utils/emailSendLog';
import { generateOrderSummaryHTML, generatePackingSlipHTML } from '../../utils/orderExportGenerator';
import { exportJSON as downloadJSON } from '../../utils/exportData';
import { canTransition, getNextStatuses } from './components/kanban/statusTransitions';
import { STATUS_COLORS, getStatusColor } from '../../utils/orderConstants';

// ── Helpers ──

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
  return createPortal(
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
            color: destructive ? 'var(--forge-text-primary)' : 'var(--forge-bg-void)', borderRadius: 'var(--forge-radius-lg)',
            padding: '10px 14px', fontWeight: 800, fontSize: '13px', cursor: 'pointer',
            fontFamily: 'var(--forge-font-body)',
          }}>{confirmText}</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Auto-send status mapping (email trigger statuses -> order statuses) ──
const EMAIL_STATUS_TO_ORDER_STATUS = {
  confirmed: 'APPROVED',
  printing: 'PRINTING',
  ready: 'READY',
  shipped: 'SHIPPED',
  completed: 'DONE',
  cancelled: 'CANCELED',
  paid: null, // handled separately via invoice
  new: 'NEW',
};

function getAutoSendRuleForStatus(orderStatus) {
  const rules = loadAutoSendRules();
  for (const rule of rules) {
    if (!rule.enabled || !rule.status_trigger) continue;
    const mappedOrderStatus = EMAIL_STATUS_TO_ORDER_STATUS[rule.status_trigger.toLowerCase()];
    if (mappedOrderStatus && mappedOrderStatus === orderStatus) {
      return rule;
    }
  }
  return null;
}

// ── Estimated delivery helper ──
function addBusinessDays(startDate, days) {
  const d = new Date(startDate);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) added++;
  }
  return d;
}

function getEstimatedDelivery(order) {
  const createdAt = order.created_at ? new Date(order.created_at) : new Date();
  const express = order.express_snapshot || {};
  const deliveryDays = Number(express.delivery_days) || Number(express.days) || 5;
  const tierName = express.name || express.tier || null;
  const estimated = addBusinessDays(createdAt, deliveryDays);
  return { estimated, deliveryDays, tierName };
}

function formatCountdown(targetDate) {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();
  if (diff <= 0) return { text: 'Po terminu', overdue: true };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return { text: `${days}d ${hours}h`, overdue: false };
  return { text: `${hours}h`, overdue: false };
}

// ── Status Change Note Dialog ──
function StatusChangeNoteDialog({ open, fromStatus, toStatus, onConfirm, onCancel, language }) {
  const cs = language === 'cs';
  const { t } = useLanguage();
  const [note, setNote] = useState('');
  const textareaRef = useRef(null);
  const overlayRef = useRef(null);

  // Auto-send rule check
  const autoSendRule = useMemo(() => getAutoSendRuleForStatus(toStatus), [toStatus]);

  useEffect(() => {
    if (!open) { setNote(''); return; }
    document.body.style.overflow = 'hidden';
    setTimeout(() => textareaRef.current?.focus(), 50);
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onCancel) onCancel();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onCancel]);

  if (!open) return null;

  const fromSc = getStatusColor(fromStatus);
  const toSc = getStatusColor(toStatus);

  return createPortal(
    <div ref={overlayRef} style={{
      position: 'fixed', inset: 0, background: 'rgba(8, 9, 12, 0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '18px', zIndex: 999,
    }} role="dialog" aria-modal="true" onClick={(e) => { if (e.target === overlayRef.current) onCancel(); }}>
      <div style={{
        backgroundColor: 'var(--forge-bg-surface)', borderRadius: 'var(--forge-radius-xl)',
        padding: '24px', width: '100%', maxWidth: '480px',
        boxShadow: 'var(--forge-shadow-lg)', border: '1px solid var(--forge-border-default)',
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{
          fontFamily: 'var(--forge-font-heading)', fontWeight: 800,
          color: 'var(--forge-text-primary)', fontSize: '16px', marginBottom: '4px',
        }}>{t('admin.orderDetail.statusChangeTitle', 'Zmena stavu')}</div>

        {/* Status transition visual */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '12px 14px', marginTop: '10px', marginBottom: '14px',
          background: 'var(--forge-bg-elevated)', borderRadius: 'var(--forge-radius-md)',
          border: '1px solid var(--forge-border-default)',
        }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', padding: '3px 10px',
            borderRadius: '999px', fontSize: '11px', fontFamily: 'var(--forge-font-tech)',
            fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
            backgroundColor: fromSc.bg, color: fromSc.color, border: `1px solid ${fromSc.border}`,
          }}>{getStatusLabel(fromStatus, cs ? 'cs' : 'en')}</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M10 5l3 3-3 3" stroke="var(--forge-text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{
            display: 'inline-flex', alignItems: 'center', padding: '3px 10px',
            borderRadius: '999px', fontSize: '11px', fontFamily: 'var(--forge-font-tech)',
            fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
            backgroundColor: toSc.bg, color: toSc.color, border: `1px solid ${toSc.border}`,
          }}>{getStatusLabel(toStatus, cs ? 'cs' : 'en')}</span>
        </div>

        {/* Auto-send email indicator */}
        {autoSendRule && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 12px', marginBottom: '14px',
            background: 'rgba(59, 130, 246, 0.08)', borderRadius: 'var(--forge-radius-md)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
          }}>
            <Icon name="Mail" size={14} style={{ color: 'var(--forge-info)', flexShrink: 0 }} />
            <span style={{
              fontSize: '12px', fontFamily: 'var(--forge-font-body)',
              color: 'var(--forge-info)',
            }}>
              {t('admin.orderDetail.autoEmailWillSend', 'Email bude automaticky odeslan')} ({EMAIL_TEMPLATE_TYPES.find(tpl => tpl.id === autoSendRule.template_id)?.[cs ? 'label_cs' : 'label_en'] || autoSendRule.template_id})
            </span>
          </div>
        )}

        {/* Note textarea */}
        <div style={{
          fontSize: '13px', fontFamily: 'var(--forge-font-body)',
          color: 'var(--forge-text-secondary)', marginBottom: '8px',
        }}>
          {t('admin.orderDetail.whyChangeStatus', 'Proc menite stav?')} <span style={{ color: 'var(--forge-text-muted)', fontSize: '11px' }}>({t('admin.orderDetail.optional', 'volitelne')})</span>
        </div>
        <textarea
          ref={textareaRef}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t('admin.orderDetail.statusNotePlaceholder', 'Napr. zakaznik pozadal o urychleni, material dodan...')}
          style={{
            width: '100%', minHeight: '80px', resize: 'vertical',
            padding: '10px 12px', fontSize: '13px', fontFamily: 'var(--forge-font-body)',
            color: 'var(--forge-text-primary)', background: 'var(--forge-bg-elevated)',
            border: '1px solid var(--forge-border-default)', borderRadius: 'var(--forge-radius-md)',
            outline: 'none', boxSizing: 'border-box',
          }}
          onFocus={(e) => { e.target.style.borderColor = 'var(--forge-accent-primary)'; }}
          onBlur={(e) => { e.target.style.borderColor = 'var(--forge-border-default)'; }}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
          <button onClick={onCancel} type="button" className="od-btn">{t('admin.orderDetail.cancel', 'Zrusit')}</button>
          <button onClick={() => onConfirm(note.trim())} type="button" style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid var(--forge-accent-primary)',
            backgroundColor: 'var(--forge-accent-primary)',
            color: 'var(--forge-bg-void)', borderRadius: 'var(--forge-radius-lg)',
            padding: '10px 14px', fontWeight: 800, fontSize: '13px', cursor: 'pointer',
            fontFamily: 'var(--forge-font-body)', gap: '6px',
          }}>
            <Icon name="Check" size={14} /> {t('admin.orderDetail.confirmChange', 'Potvrdit zmenu')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Status Timeline ──
function StatusTimeline({ order }) {
  const currentIdx = ORDER_STATUSES.indexOf(order.status);
  const isCanceled = order.status === 'CANCELED';
  const isDone = order.status === 'DONE';

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
          note: a.payload.note || null,
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

  // Estimated delivery
  const delivery = useMemo(() => getEstimatedDelivery(order), [order]);
  const countdown = useMemo(() => {
    if (isDone || isCanceled) return null;
    return formatCountdown(delivery.estimated);
  }, [delivery, isDone, isCanceled]);

  // For canceled orders, show statuses up to the last status before cancelation, then CANCELED
  const visibleStatuses = ORDER_STATUSES.filter(s => s !== 'CANCELED');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {/* Estimated delivery banner */}
      {!isCanceled && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', marginBottom: '14px',
          background: isDone
            ? 'rgba(34, 197, 94, 0.08)'
            : countdown?.overdue
              ? 'rgba(239, 68, 68, 0.08)'
              : 'rgba(59, 130, 246, 0.06)',
          borderRadius: 'var(--forge-radius-md)',
          border: `1px solid ${isDone
            ? 'rgba(34, 197, 94, 0.2)'
            : countdown?.overdue
              ? 'rgba(239, 68, 68, 0.2)'
              : 'rgba(59, 130, 246, 0.15)'}`,
        }}>
          <div>
            <div style={{
              fontSize: '10px', fontFamily: 'var(--forge-font-tech)',
              color: 'var(--forge-text-muted)', textTransform: 'uppercase',
              letterSpacing: '0.06em', marginBottom: '2px',
            }}>
              {isDone ? 'Doruceno' : 'Odhadovane doruceni'}
              {delivery.tierName && (
                <span style={{ marginLeft: '6px', color: 'var(--forge-accent-primary)' }}>
                  ({delivery.tierName})
                </span>
              )}
            </div>
            <div style={{
              fontSize: '13px', fontWeight: 700,
              fontFamily: 'var(--forge-font-body)',
              color: isDone ? 'var(--forge-success)' : 'var(--forge-text-primary)',
            }}>
              {delivery.estimated.toLocaleDateString('cs-CZ', {
                weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
              })}
            </div>
          </div>
          {!isDone && countdown && (
            <div style={{
              textAlign: 'right',
            }}>
              <div style={{
                fontSize: '10px', fontFamily: 'var(--forge-font-tech)',
                color: 'var(--forge-text-muted)', textTransform: 'uppercase',
                letterSpacing: '0.06em', marginBottom: '2px',
              }}>Zbyva</div>
              <div style={{
                fontSize: '15px', fontWeight: 800,
                fontFamily: 'var(--forge-font-tech)',
                color: countdown.overdue ? 'var(--forge-error)' : 'var(--forge-accent-primary)',
              }}>
                {countdown.text}
              </div>
            </div>
          )}
        </div>
      )}

      {visibleStatuses.map((status, idx) => {
        const statusIdx = ORDER_STATUSES.indexOf(status);
        const isPast = !isCanceled && statusIdx < currentIdx;
        const isCurrent = !isCanceled && statusIdx === currentIdx;
        const changeInfo = statusTimestampMap[status];
        const sc = getStatusColor(status);
        const isLast = idx === visibleStatuses.length - 1 && !isCanceled;

        return (
          <div key={status} style={{ display: 'flex', gap: '12px', minHeight: '52px' }}>
            {/* Timeline line + dot */}
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              width: '24px', flexShrink: 0,
            }}>
              {/* Dot */}
              <div style={{
                width: isCurrent ? '16px' : isPast ? '12px' : '10px',
                height: isCurrent ? '16px' : isPast ? '12px' : '10px',
                borderRadius: '50%',
                backgroundColor: isCurrent ? sc.color : isPast ? sc.color : 'var(--forge-bg-overlay)',
                border: isCurrent
                  ? `3px solid ${sc.border}`
                  : isPast
                    ? `2px solid ${sc.color}60`
                    : '2px solid var(--forge-border-default)',
                boxShadow: isCurrent ? `0 0 10px ${sc.color}50, 0 0 20px ${sc.color}20` : 'none',
                flexShrink: 0,
                marginTop: '4px',
                transition: 'all 200ms ease',
              }} />
              {/* Line */}
              {!isLast && (
                <div style={{
                  width: '2px',
                  flex: 1,
                  minHeight: '24px',
                  background: isPast
                    ? `linear-gradient(to bottom, ${sc.color}60, ${getStatusColor(visibleStatuses[idx + 1] || status).color}40)`
                    : 'var(--forge-border-default)',
                  opacity: isPast ? 0.7 : 0.25,
                  marginTop: '4px',
                  borderRadius: '1px',
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
                    background: `${sc.color}15`,
                    padding: '1px 6px', borderRadius: '4px',
                  }}>Aktualni</span>
                )}
                {isPast && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginLeft: '6px', verticalAlign: 'middle' }}>
                    <path d="M2.5 6L5 8.5L9.5 3.5" stroke={sc.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
                  </svg>
                )}
              </div>
              {changeInfo && (isPast || isCurrent) && (
                <div style={{
                  fontSize: '11px', fontFamily: 'var(--forge-font-tech)',
                  color: 'var(--forge-text-muted)', marginTop: '3px',
                }}>
                  {formatDateTime(changeInfo.timestamp)} — {changeInfo.userId}
                </div>
              )}
              {/* Status change note */}
              {changeInfo?.note && (isPast || isCurrent) && (
                <div style={{
                  marginTop: '4px', padding: '6px 10px',
                  background: 'var(--forge-bg-elevated)',
                  borderRadius: 'var(--forge-radius-sm)',
                  borderLeft: `2px solid ${sc.color}60`,
                  fontSize: '11px', fontFamily: 'var(--forge-font-body)',
                  color: 'var(--forge-text-secondary)', lineHeight: 1.4,
                  fontStyle: 'italic',
                }}>
                  {changeInfo.note}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Canceled status at the end if applicable */}
      {isCanceled && (
        <div style={{ display: 'flex', gap: '12px', minHeight: '52px' }}>
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            width: '24px', flexShrink: 0,
          }}>
            <div style={{
              width: '16px', height: '16px', borderRadius: '50%',
              backgroundColor: STATUS_COLORS.CANCELED.color,
              border: `3px solid ${STATUS_COLORS.CANCELED.border}`,
              boxShadow: `0 0 10px ${STATUS_COLORS.CANCELED.color}50`,
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
                background: `${STATUS_COLORS.CANCELED.color}15`,
                padding: '1px 6px', borderRadius: '4px',
              }}>Aktualni</span>
            </div>
            {statusTimestampMap['CANCELED'] && (
              <div style={{
                fontSize: '11px', fontFamily: 'var(--forge-font-tech)',
                color: 'var(--forge-text-muted)', marginTop: '3px',
              }}>
                {formatDateTime(statusTimestampMap['CANCELED'].timestamp)} — {statusTimestampMap['CANCELED'].userId}
              </div>
            )}
            {statusTimestampMap['CANCELED']?.note && (
              <div style={{
                marginTop: '4px', padding: '6px 10px',
                background: 'var(--forge-bg-elevated)',
                borderRadius: 'var(--forge-radius-sm)',
                borderLeft: `2px solid ${STATUS_COLORS.CANCELED.color}60`,
                fontSize: '11px', fontFamily: 'var(--forge-font-body)',
                color: 'var(--forge-text-secondary)', lineHeight: 1.4,
                fontStyle: 'italic',
              }}>
                {statusTimestampMap['CANCELED'].note}
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

// ── SVG Mini Charts ──
const CHART_COLORS = ['#00D4AA', '#4A9EFF', '#FF6B35', '#9B59B6', '#fbbf24', '#2dd4bf', '#f87171', '#818cf8'];

function MiniPieChart({ segments, size = 120, label }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total <= 0) return null;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 6;
  let cumulativeAngle = -Math.PI / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label}>
      {segments.map((seg, i) => {
        const pct = seg.value / total;
        const angle = pct * 2 * Math.PI;
        const x1 = cx + r * Math.cos(cumulativeAngle);
        const y1 = cy + r * Math.sin(cumulativeAngle);
        cumulativeAngle += angle;
        const x2 = cx + r * Math.cos(cumulativeAngle);
        const y2 = cy + r * Math.sin(cumulativeAngle);
        const largeArc = angle > Math.PI ? 1 : 0;
        if (pct < 0.005) return null;
        if (segments.length === 1) {
          return <circle key={i} cx={cx} cy={cy} r={r} fill={seg.color} opacity={0.85} />;
        }
        return (
          <path key={i} d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`}
            fill={seg.color} opacity={0.85} />
        );
      })}
      <circle cx={cx} cy={cy} r={r * 0.55} fill="var(--forge-bg-surface, #12141A)" />
      {label && (
        <text x={cx} y={cy + 4} textAnchor="middle" dominantBaseline="middle"
          fill="var(--forge-text-primary)" fontSize="11" fontWeight="700"
          fontFamily="var(--forge-font-mono)">{label}</text>
      )}
    </svg>
  );
}

function MiniBarChart({ items, height = 140 }) {
  if (!items || items.length === 0) return null;
  const maxVal = Math.max(...items.map(i => i.value), 1);
  const barWidth = Math.min(32, Math.max(14, Math.floor(180 / items.length)));
  const gap = 4;
  const totalW = items.length * (barWidth + gap);

  return (
    <svg width={totalW} height={height} viewBox={`0 0 ${totalW} ${height}`} style={{ display: 'block', margin: '0 auto' }}>
      {items.map((item, i) => {
        const barH = Math.max(2, (item.value / maxVal) * (height - 24));
        const x = i * (barWidth + gap);
        const y = height - 14 - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barWidth} height={barH} rx={3}
              fill={item.color || CHART_COLORS[i % CHART_COLORS.length]} opacity={0.8} />
            <text x={x + barWidth / 2} y={height - 2} textAnchor="middle"
              fill="var(--forge-text-muted)" fontSize="8" fontFamily="var(--forge-font-tech)">
              {item.label?.slice(0, 5)}
            </text>
            <text x={x + barWidth / 2} y={y - 3} textAnchor="middle"
              fill="var(--forge-text-secondary)" fontSize="8" fontFamily="var(--forge-font-mono)">
              {item.displayValue || Math.round(item.value)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function ChartLegend({ items }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px', marginTop: '6px' }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
          <span style={{ fontSize: '10px', fontFamily: 'var(--forge-font-body)', color: 'var(--forge-text-muted)' }}>
            {item.name}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Order Statistics Panel ──
function OrderStatsPanel({ order, totals }) {
  const [view, setView] = useState('totals');
  const [selectedModel, setSelectedModel] = useState(0);
  const [checkedModels, setCheckedModels] = useState({});
  const models = order.models || [];

  const modelData = useMemo(() => models.map((m, idx) => {
    const bd = m.price_breakdown_snapshot || {};
    const slicer = m.slicer_snapshot || {};
    const qty = m.quantity || 1;
    const timeMin = getSlicerTimeMin(slicer);
    const weightG = getSlicerWeightG(slicer);
    const unitPrice = Number(bd.model_total) || Number(bd.total) || Number(bd.totalPrice) || Number(m.totalPrice) || Number(m.price) || 0;
    return {
      idx, name: m.file_snapshot?.filename || `Model ${idx + 1}`,
      material: m.material_snapshot?.name || '-', qty, timeMin, weightG, unitPrice,
      totalPrice: unitPrice * qty, totalTime: timeMin * qty, totalWeight: weightG * qty,
    };
  }), [models]);

  if (models.length === 0) return null;

  const tabStyle = (active) => ({
    flex: 1, padding: '5px 6px', fontSize: '10px', fontFamily: 'var(--forge-font-tech)',
    fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em',
    border: 'none', borderRadius: 'var(--forge-radius-sm)', cursor: 'pointer',
    transition: 'all 120ms ease', textAlign: 'center',
    background: active ? 'var(--forge-bg-surface)' : 'transparent',
    color: active ? 'var(--forge-accent-teal)' : 'var(--forge-text-muted)',
    boxShadow: active ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
  });

  const renderTotals = () => {
    const costSegments = [];
    if (totals.subtotal_models > 0) costSegments.push({ name: 'Modely', value: totals.subtotal_models, color: '#00D4AA' });
    if (totals.one_time_fees_total > 0) costSegments.push({ name: 'Poplatky', value: totals.one_time_fees_total, color: '#FF6B35' });
    if (totals.shipping_total > 0) costSegments.push({ name: 'Doprava', value: totals.shipping_total, color: '#4A9EFF' });

    const timeItems = modelData.map((m, i) => ({
      label: m.name, value: m.totalTime, color: CHART_COLORS[i % CHART_COLORS.length],
      displayValue: formatTime(m.totalTime),
    }));

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '10px', fontFamily: 'var(--forge-font-tech)', color: 'var(--forge-text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Rozlozeni nakladu</div>
          <MiniPieChart segments={costSegments} size={100} label={`${round2(totals.total)} Kc`} />
          <ChartLegend items={costSegments} />
        </div>
        {timeItems.length > 1 && (
          <div>
            <div style={{ fontSize: '10px', fontFamily: 'var(--forge-font-tech)', color: 'var(--forge-text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px', textAlign: 'center' }}>Cas tisku (per model)</div>
            <MiniBarChart items={timeItems} height={100} />
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          {[
            { label: 'Celk. cas', value: formatTime(totals.sum_time_min) },
            { label: 'Celk. hmotnost', value: `${round2(totals.sum_weight_g)} g` },
            { label: 'Pocet kusu', value: totals.sum_pieces },
            { label: 'Prumer/ks', value: `${round2(totals.total / Math.max(totals.sum_pieces, 1))} Kc` },
          ].map((s, i) => (
            <div key={i} style={{
              padding: '6px 8px', background: 'var(--forge-bg-elevated)', borderRadius: 'var(--forge-radius-sm)',
              border: '1px solid var(--forge-border-default)',
            }}>
              <div style={{ fontSize: '9px', fontFamily: 'var(--forge-font-tech)', color: 'var(--forge-text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
              <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--forge-font-tech)',
                color: 'var(--forge-text-primary)', marginTop: '1px' }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderIndividual = () => {
    const m = modelData[selectedModel] || modelData[0];
    if (!m) return null;
    const segments = [
      { name: 'Material', value: m.totalWeight, color: '#00D4AA' },
      { name: 'Cas', value: m.totalTime, color: '#4A9EFF' },
    ];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {models.length > 1 && (
          <select value={selectedModel} onChange={(e) => setSelectedModel(Number(e.target.value))}
            style={{
              width: '100%', padding: '6px 8px', fontSize: '11px', fontFamily: 'var(--forge-font-body)',
              background: 'var(--forge-bg-elevated)', color: 'var(--forge-text-primary)',
              border: '1px solid var(--forge-border-default)', borderRadius: 'var(--forge-radius-sm)', outline: 'none',
            }}>
            {modelData.map((md, i) => <option key={i} value={i}>{md.name}</option>)}
          </select>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
          <MiniPieChart segments={segments} size={80} label={`${m.qty}x`} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {[
              { label: 'Cas', value: formatTime(m.totalTime), color: '#4A9EFF' },
              { label: 'Hmotnost', value: `${round2(m.totalWeight)} g`, color: '#00D4AA' },
              { label: 'Cena', value: formatMoney(m.totalPrice), color: '#FF6B35' },
              { label: 'Material', value: m.material },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <span style={{ fontSize: '10px', fontFamily: 'var(--forge-font-body)', color: s.color || 'var(--forge-text-muted)' }}>{s.label}</span>
                <span style={{ fontSize: '10px', fontFamily: 'var(--forge-font-mono)', color: 'var(--forge-text-primary)', fontWeight: 600 }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderComparison = () => {
    const checked = Object.keys(checkedModels).filter(k => checkedModels[k]).map(Number);
    const selected = checked.length >= 2 ? checked : modelData.map((_, i) => i);
    const compared = selected.map(i => modelData[i]).filter(Boolean);
    const priceItems = compared.map((m, i) => ({
      label: m.name, value: m.totalPrice, color: CHART_COLORS[i % CHART_COLORS.length],
      displayValue: `${round2(m.totalPrice)}`,
    }));
    const weightItems = compared.map((m, i) => ({
      label: m.name, value: m.totalWeight, color: CHART_COLORS[i % CHART_COLORS.length],
      displayValue: `${round2(m.totalWeight)}g`,
    }));
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {models.length > 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: '80px', overflowY: 'auto' }}>
            {modelData.map((m, i) => (
              <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px',
                fontFamily: 'var(--forge-font-body)', color: 'var(--forge-text-secondary)', cursor: 'pointer' }}>
                <input type="checkbox" checked={checkedModels[i] ?? true}
                  onChange={(e) => setCheckedModels(p => ({ ...p, [i]: e.target.checked }))}
                  style={{ width: 12, height: 12, accentColor: 'var(--forge-accent-teal)' }} />
                {m.name.slice(0, 20)}
              </label>
            ))}
          </div>
        )}
        <div>
          <div style={{ fontSize: '10px', fontFamily: 'var(--forge-font-tech)', color: 'var(--forge-text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px', textAlign: 'center' }}>Cena</div>
          <MiniBarChart items={priceItems} height={90} />
        </div>
        <div>
          <div style={{ fontSize: '10px', fontFamily: 'var(--forge-font-tech)', color: 'var(--forge-text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px', textAlign: 'center' }}>Hmotnost</div>
          <MiniBarChart items={weightItems} height={90} />
        </div>
      </div>
    );
  };

  return (
    <Card title="Statistiky objednavky" icon="BarChart3">
      <div style={{
        display: 'flex', gap: '2px', marginBottom: '12px',
        background: 'var(--forge-bg-elevated)', borderRadius: 'var(--forge-radius-md)', padding: '2px',
      }}>
        <button type="button" onClick={() => setView('totals')} style={tabStyle(view === 'totals')}>Celkove</button>
        <button type="button" onClick={() => setView('individual')} style={tabStyle(view === 'individual')}>Individualni</button>
        {models.length > 1 && (
          <button type="button" onClick={() => setView('comparison')} style={tabStyle(view === 'comparison')}>Porovnani</button>
        )}
      </div>
      {view === 'totals' && renderTotals()}
      {view === 'individual' && renderIndividual()}
      {view === 'comparison' && renderComparison()}
    </Card>
  );
}

// ── Viewer Error Boundary (catches R3F useLoader crashes) ──
class ViewerErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.warn('[ViewerErrorBoundary] 3D viewer crashed:', error?.message || error);
  }

  render() {
    if (this.state.hasError) {
      const h = this.props.height || 300;
      return (
        <div style={{
          height: h, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px',
          background: 'var(--forge-bg-elevated)', borderRadius: 'var(--forge-radius-md)',
          border: '1px solid var(--forge-border-default)',
          color: 'var(--forge-text-muted)', fontSize: '12px', fontFamily: 'var(--forge-font-body)',
        }}>
          <span>Nelze nacist nahled modelu</span>
          <button type="button" onClick={() => this.setState({ hasError: false })}
            style={{
              padding: '4px 12px', fontSize: '11px', fontFamily: 'var(--forge-font-body)',
              background: 'var(--forge-bg-card)', border: '1px solid var(--forge-border-default)',
              borderRadius: 'var(--forge-radius-sm)', color: 'var(--forge-text-secondary)',
              cursor: 'pointer',
            }}>
            Zkusit znovu
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Inline 3D Model Viewer (simplified for admin order detail) ──
function InlineModelScene({ url }) {
  const geometry = useLoader(STLLoader, url);
  const meshRef = useRef();
  const { camera } = useThree();

  useEffect(() => {
    if (!geometry) return;
    geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    const c = new THREE.Vector3();
    box.getCenter(c);
    const sz = new THREE.Vector3();
    box.getSize(sz);
    const maxDim = Math.max(sz.x, sz.y, sz.z);
    camera.position.set(c.x + maxDim, c.y + maxDim * 0.6, c.z + maxDim);
    camera.lookAt(c);
  }, [geometry, camera]);

  return (
    <Center>
      <mesh ref={meshRef} geometry={geometry}>
        <meshStandardMaterial color="#00D4AA" metalness={0.15} roughness={0.45} />
      </mesh>
    </Center>
  );
}

function InlineModelViewer({ url, height = 300 }) {
  const [error, setError] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  if (!url) return (
    <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--forge-bg-elevated)', borderRadius: 'var(--forge-radius-md)',
      color: 'var(--forge-text-muted)', fontSize: '12px', fontFamily: 'var(--forge-font-body)' }}>
      Model neni dostupny
    </div>
  );

  if (error) return (
    <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--forge-bg-elevated)', borderRadius: 'var(--forge-radius-md)',
      color: 'var(--forge-text-muted)', fontSize: '12px', fontFamily: 'var(--forge-font-body)' }}>
      Nelze nacist nahled modelu
    </div>
  );

  const canvasContent = (h) => (
    <div style={{ position: 'relative', height: h, borderRadius: 'var(--forge-radius-md)', overflow: 'hidden',
      background: 'var(--forge-bg-void, #08090C)', border: '1px solid var(--forge-border-default)' }}>
      <Canvas camera={{ fov: 45, near: 0.1, far: 10000 }}
        onCreated={({ gl }) => { gl.setClearColor('#08090C'); }}
        style={{ borderRadius: 'var(--forge-radius-md)' }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <directionalLight position={[-3, -3, 2]} intensity={0.3} />
        <Suspense fallback={null}>
          <InlineModelScene url={url} />
        </Suspense>
        <OrbitControls enableDamping dampingFactor={0.1} />
      </Canvas>
      <div style={{ position: 'absolute', top: 6, right: 6, display: 'flex', gap: '4px', zIndex: 10 }}>
        <button type="button" onClick={() => setIsFullScreen(true)} title="Fullscreen"
          style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.5)',
            border: '1px solid var(--forge-border-default)', color: 'var(--forge-text-primary)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="Maximize2" size={12} />
        </button>
      </div>
    </div>
  );

  return (
    <>
      <Suspense fallback={
        <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--forge-bg-elevated)', borderRadius: 'var(--forge-radius-md)',
          color: 'var(--forge-text-muted)', fontSize: '12px' }}>
          Nacitani modelu...
        </div>
      }>
        {canvasContent(height)}
      </Suspense>
      {isFullScreen && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(8,9,12,0.9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setIsFullScreen(false)}>
          <div style={{ width: '90vw', height: '90vh', position: 'relative' }}
            onClick={(e) => e.stopPropagation()}>
            {canvasContent('90vh')}
            <button type="button" onClick={() => setIsFullScreen(false)}
              style={{ position: 'absolute', top: 12, right: 12, width: 36, height: 36,
                borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: '1px solid var(--forge-border-active)',
                color: 'var(--forge-text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20 }}>
              <Icon name="X" size={16} />
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

// ── Build Plate View (simplified top-down) ──
function BuildPlateScene({ url }) {
  const geometry = useLoader(STLLoader, url);
  const meshRef = useRef();
  const { camera } = useThree();

  useEffect(() => {
    if (!geometry) return;
    geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    const c = new THREE.Vector3();
    box.getCenter(c);
    const sz = new THREE.Vector3();
    box.getSize(sz);
    const maxDim = Math.max(sz.x, sz.y, sz.z);
    camera.position.set(c.x, c.y + maxDim * 2, c.z + maxDim * 0.3);
    camera.lookAt(c);
  }, [geometry, camera]);

  return (
    <group>
      <gridHelper args={[250, 25, '#1a3a2a', '#1a2a20']} rotation={[0, 0, 0]} position={[0, -0.1, 0]} />
      <Center>
        <mesh ref={meshRef} geometry={geometry}>
          <meshStandardMaterial color="#00D4AA" metalness={0.15} roughness={0.45} transparent opacity={0.9} />
        </mesh>
      </Center>
    </group>
  );
}

function BuildPlateViewer({ url, height = 300 }) {
  if (!url) return (
    <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--forge-bg-elevated)', borderRadius: 'var(--forge-radius-md)',
      color: 'var(--forge-text-muted)', fontSize: '12px', fontFamily: 'var(--forge-font-body)' }}>
      Build plate neni dostupny
    </div>
  );

  return (
    <Suspense fallback={
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--forge-bg-elevated)', borderRadius: 'var(--forge-radius-md)',
        color: 'var(--forge-text-muted)', fontSize: '12px' }}>
        Nacitani...
      </div>
    }>
      <div style={{ height, borderRadius: 'var(--forge-radius-md)', overflow: 'hidden', position: 'relative',
        background: 'var(--forge-bg-void, #08090C)', border: '1px solid var(--forge-border-default)' }}>
        <Canvas camera={{ fov: 45, near: 0.1, far: 10000 }}
          onCreated={({ gl }) => { gl.setClearColor('#08090C'); }}
          style={{ borderRadius: 'var(--forge-radius-md)' }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 8, 5]} intensity={0.8} />
          <directionalLight position={[-3, 2, -2]} intensity={0.3} />
          <Suspense fallback={null}>
            <BuildPlateScene url={url} />
          </Suspense>
          <OrbitControls enableDamping dampingFactor={0.1} maxPolarAngle={Math.PI / 2.1} />
        </Canvas>
        <div style={{ position: 'absolute', bottom: 6, left: 8, fontSize: '9px', fontFamily: 'var(--forge-font-tech)',
          color: 'var(--forge-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', pointerEvents: 'none' }}>
          Build Plate
        </div>
      </div>
    </Suspense>
  );
}

// ── Collapsible Item Row with Viewer ──
function ExpandableModelRow({ m, idx, hasStorage, storage, onDownload }) {
  const [expanded, setExpanded] = useState(false);
  const [blobUrl, setBlobUrl] = useState(null);
  const [blobLoading, setBlobLoading] = useState(false);
  const [blobError, setBlobError] = useState(null);
  const bd = m.price_breakdown_snapshot || {};
  const qty = m.quantity || 1;
  const unitPrice = Number(bd.model_total) || Number(bd.total) || Number(bd.totalPrice) || Number(m.totalPrice) || Number(m.price) || 0;
  const slicer = m.slicer_snapshot || {};
  const filename = m.file_snapshot?.filename || '';
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const isViewable = ext === 'stl';

  // Raw storage path for download button
  const modelFilePath = useMemo(() => {
    if (!hasStorage || !storage?.fileManifest) return null;
    const manifestEntry = (storage.fileManifest || []).find(
      (f) => f.type === 'model' && (f.filename === filename || f.filename === filename.replace(/[^a-zA-Z0-9._-]/g, '_'))
    );
    if (!manifestEntry) return null;
    const basePath = (storage.storagePath || '').replace(/\/+$/, '');
    return manifestEntry.path || `${basePath}/models/${manifestEntry.filename}`;
  }, [hasStorage, storage, filename]);

  const modelUrl = modelFilePath ? getDownloadUrl(modelFilePath) : null;

  // Fetch file with auth headers when expanded — useLoader can't send auth headers
  useEffect(() => {
    if (!expanded || !modelFilePath || blobUrl) return;
    let cancelled = false;
    setBlobLoading(true);
    setBlobError(null);
    downloadFile(modelFilePath)
      .then((url) => { if (!cancelled) { setBlobUrl(url); setBlobLoading(false); } })
      .catch((err) => { if (!cancelled) { setBlobError(err.message || 'Nelze nacist model'); setBlobLoading(false); } });
    return () => { cancelled = true; };
  }, [expanded, modelFilePath, blobUrl]);

  // Revoke blob URL on unmount to prevent memory leak
  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  const dlManifestEntry = hasStorage ? (storage.fileManifest || []).find(
    (f) => f.type === 'model' && (f.filename === filename || f.filename === filename.replace(/[^a-zA-Z0-9._-]/g, '_'))
  ) : null;
  const basePath = (storage?.storagePath || '').replace(/\/+$/, '');
  const dlFilePath = dlManifestEntry?.path || (dlManifestEntry ? `${basePath}/models/${dlManifestEntry.filename}` : '');

  return (
    <>
      <tr className={idx % 2 === 0 ? 'od-row-even' : 'od-row-odd'}
        onClick={() => isViewable && modelUrl && setExpanded(v => !v)}
        style={{ cursor: isViewable && modelUrl ? 'pointer' : 'default' }}>
        <td>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isViewable && modelUrl ? (
              <Icon name={expanded ? 'ChevronDown' : 'ChevronRight'} size={12}
                style={{ color: 'var(--forge-text-muted)', flexShrink: 0, transition: 'transform 150ms ease' }} />
            ) : (
              <Icon name="Box" size={14} style={{ color: 'var(--forge-text-muted)', flexShrink: 0 }} />
            )}
            <span style={{
              fontWeight: 600, color: 'var(--forge-text-primary)',
              maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {filename || 'model'}
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
        {hasStorage && (
          <td style={{ padding: '10px' }} onClick={(e) => e.stopPropagation()}>
            {dlManifestEntry && dlFilePath && (
              <button type="button" onClick={() => onDownload(dlFilePath)} title="Stahnout model"
                style={{ background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--forge-accent-primary)', padding: '4px' }}>
                <Icon name="Download" size={14} />
              </button>
            )}
          </td>
        )}
      </tr>
      {expanded && isViewable && modelUrl && (
        <tr>
          <td colSpan={hasStorage ? 9 : 8} style={{ padding: '12px 16px', background: 'var(--forge-bg-elevated)' }}>
            {blobLoading && (
              <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--forge-bg-elevated)', borderRadius: 'var(--forge-radius-md)',
                color: 'var(--forge-text-muted)', fontSize: '12px', fontFamily: 'var(--forge-font-body)' }}>
                Nacitani modelu...
              </div>
            )}
            {blobError && (
              <div style={{ height: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '12px', background: 'var(--forge-bg-elevated)', borderRadius: 'var(--forge-radius-md)',
                border: '1px solid var(--forge-border-default)',
                color: 'var(--forge-text-muted)', fontSize: '12px', fontFamily: 'var(--forge-font-body)' }}>
                <span>Nelze nacist nahled modelu</span>
                <span style={{ fontSize: '10px', opacity: 0.6 }}>{blobError}</span>
                <button type="button" onClick={() => { setBlobUrl(null); setBlobError(null); }}
                  style={{ padding: '6px 16px', borderRadius: 'var(--forge-radius-sm)', fontSize: '11px',
                    fontFamily: 'var(--forge-font-tech)', background: 'var(--forge-bg-surface)',
                    border: '1px solid var(--forge-border-default)', color: 'var(--forge-text-secondary)',
                    cursor: 'pointer' }}>
                  Zkusit znovu
                </button>
              </div>
            )}
            {blobUrl && !blobLoading && !blobError && (
              <ViewerErrorBoundary height={300}>
                <div className="od-viewer-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '10px', fontFamily: 'var(--forge-font-tech)', color: 'var(--forge-text-muted)',
                      textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Build Plate</div>
                    <BuildPlateViewer url={blobUrl} height={300} />
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', fontFamily: 'var(--forge-font-tech)', color: 'var(--forge-text-muted)',
                      textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>3D Nahled</div>
                    <InlineModelViewer url={blobUrl} height={300} />
                  </div>
                </div>
              </ViewerErrorBoundary>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

// ── Main Component ──
export default function AdminOrderDetail({ orders, setOrders }) {
  const { user: authUser } = useAuth();
  const currentUser = authUser?.email || authUser?.displayName || 'admin';
  const { language, t } = useLanguage();
  const cs = language === 'cs';
  const navigate = useNavigate();
  const params = useParams();
  const orderId = params.id;

  const order = useMemo(() => orders.find((o) => o.id === orderId), [orders, orderId]);

  const [statusDraft, setStatusDraft] = useState(order?.status || 'NEW');
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [noteType, setNoteType] = useState('text'); // text | status | email | file
  const [noteCategory, setNoteCategory] = useState('internal'); // internal | customer
  const [noteSearch, setNoteSearch] = useState('');
  const [expandedNotes, setExpandedNotes] = useState({});
  const [confirm, setConfirm] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const statusDropdownRef = useRef(null);

  // Status change note dialog state
  const [statusChangeDialog, setStatusChangeDialog] = useState(null); // { from, to }

  // Invoice state
  const [invoice, setInvoice] = useState(() => getInvoice(orderId));
  const [invoicePreviewOpen, setInvoicePreviewOpen] = useState(false);

  // Email state
  const [emailMenuOpen, setEmailMenuOpen] = useState(false);
  const [emailPreview, setEmailPreview] = useState(null); // { templateId, subject, body, recipientEmail }
  const [emailSentLog, setEmailSentLog] = useState(() => getEmailLog(orderId));
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [copyLinkFeedback, setCopyLinkFeedback] = useState(false);
  const emailMenuRef = useRef(null);

  const copyToClipboard = useCallback((text, fieldKey) => {
    if (!text || text === '-') return;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(fieldKey);
      setTimeout(() => setCopiedField(null), 1500);
    }).catch(() => {});
  }, []);

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

  // Close email menu on outside click
  useEffect(() => {
    if (!emailMenuOpen) return;
    function handleClick(e) {
      if (emailMenuRef.current && !emailMenuRef.current.contains(e.target)) {
        setEmailMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [emailMenuOpen]);

  // NOTE: This useMemo MUST be before the early return to keep hook count stable.
  const filteredNotes = useMemo(() => {
    let notes = order?.notes || [];
    if (noteSearch.trim()) {
      const q = noteSearch.trim().toLowerCase();
      notes = notes.filter(n => (n.text || '').toLowerCase().includes(q));
    }
    // Sort: pinned first, then by timestamp desc (already stored newest-first)
    const pinned = notes.filter(n => n.pinned);
    const unpinned = notes.filter(n => !n.pinned);
    return [...pinned, ...unpinned];
  }, [order?.notes, noteSearch]);

  if (!order) {
    return (
      <div className="od-page">
        <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
          <button className="od-btn" onClick={() => navigate('../')} type="button">
            <Icon name="ChevronLeft" size={16} /> {t('admin.orderDetail.backToOrders', 'Zpet na objednavky')}
          </button>
        </div>
        <Card>
          <div style={{ padding: '32px', color: 'var(--forge-text-muted)', textAlign: 'center', fontFamily: 'var(--forge-font-body)' }}>
            <Icon name="PackageX" size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <p>{t('admin.orderDetail.notFound', 'Objednavka nenalezena.')}</p>
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

  function initiateStatusChange(nextStatus) {
    if (nextStatus === order.status) return;
    if (!canTransition(order.status, nextStatus)) return;
    setStatusDropdownOpen(false);
    setStatusChangeDialog({ from: order.status, to: nextStatus });
  }

  function confirmStatusChange(note) {
    if (!statusChangeDialog) return;
    const { from, to } = statusChangeDialog;
    const payload = { from, to };
    if (note) payload.note = note;
    const ts = nowIso();
    const updated = {
      ...order,
      status: to,
      updated_at: ts,
      activity: [
        { timestamp: ts, user_id: currentUser, type: 'STATUS_CHANGE', payload },
        ...(order.activity || []),
      ].slice(0, 200),
    };
    persist(updated, { timestamp: ts, user_id: currentUser, type: 'STATUS_CHANGE', payload });

    // Check auto-send email rule
    const autoRule = getAutoSendRuleForStatus(to);
    if (autoRule) {
      const templates = loadEmailTemplates();
      const tpl = templates[autoRule.template_id];
      if (tpl) {
        const vars = buildEmailVariables();
        vars.statusText = getStatusLabel(to, 'cs');
        const rendered = renderTemplate(tpl.body, tpl.subject, vars);
        logEmailSent(order.id, {
          templateId: autoRule.template_id,
          templateName: EMAIL_TEMPLATE_TYPES.find(t => t.id === autoRule.template_id)?.label_cs || autoRule.template_id,
          recipientEmail: (order.customer_snapshot || {}).email || '',
          subject: rendered.subject,
          hasInvoice: false,
          autoTriggered: true,
          triggerStatus: to,
        });
        addEmailLogEntry({
          template: autoRule.template_id,
          recipient: (order.customer_snapshot || {}).email || '',
          subject: rendered.subject,
          orderId: order.id,
          status: 'sent',
        });
        setEmailSentLog(getEmailLog(order.id));
      }
    }

    setStatusChangeDialog(null);
  }

  function cancelOrder() {
    setConfirm(null);
    initiateStatusChange('CANCELED');
  }

  function addNote(textOverride) {
    const text = (textOverride || noteDraft).trim();
    if (!text) return;
    const newNote = {
      id: `n-${Date.now()}`,
      timestamp: nowIso(),
      user_id: currentUser,
      text,
      type: noteType,
      category: noteCategory,
      pinned: false,
    };
    const updated = {
      ...order,
      updated_at: nowIso(),
      notes: [
        newNote,
        ...(order.notes || []),
      ].slice(0, 200),
      activity: [
        { timestamp: nowIso(), user_id: currentUser, type: 'NOTE_ADDED', payload: { length: text.length, noteType, category: noteCategory } },
        ...(order.activity || []),
      ].slice(0, 200),
    };
    persist(updated, { timestamp: nowIso(), user_id: currentUser, type: 'NOTE_ADDED', payload: { length: text.length, noteType, category: noteCategory } });
    setNoteDraft('');
    setNoteType('text');
  }

  function toggleNotePin(noteId) {
    const notes = (order.notes || []).map(n =>
      n.id === noteId ? { ...n, pinned: !n.pinned } : n
    );
    const updated = { ...order, updated_at: nowIso(), notes };
    persist(updated);
  }

  // ── Duplicate / Reorder ──
  function handleDuplicateOrder(isReorder = false) {
    const newId = generateId('ord');
    const newOrderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;
    const now = nowIso();
    const sourceLabel = order.order_number || order.id;
    const actionLabel = isReorder ? 'REORDER' : 'ORDER_DUPLICATED';
    const noteText = isReorder
      ? `Opakovana objednavka z #${sourceLabel}`
      : `Duplikovano z objednavky #${sourceLabel}`;

    const duplicated = {
      ...JSON.parse(JSON.stringify(order)),
      id: newId,
      order_number: newOrderNumber,
      status: 'NEW',
      created_at: now,
      updated_at: now,
      notes: [
        {
          id: generateId('note'),
          text: noteText,
          author: currentUser,
          created_at: now,
          type: 'text',
          category: 'internal',
          pinned: false,
        },
      ],
      activity: [
        {
          action: actionLabel,
          actor: currentUser,
          timestamp: now,
          details: noteText,
        },
      ],
      invoice: undefined,
      payment: undefined,
    };

    // Remove storage data from duplicate (files are not copied)
    delete duplicated.storage;

    const existing = loadOrders();
    saveOrders([duplicated, ...existing]);
    setOrders([duplicated, ...existing]);

    logActivity({
      action: `${actionLabel}: ${newOrderNumber} (z ${sourceLabel})`,
      category: 'order',
      details: `${(order.customer_snapshot || {}).name || '-'}, ${(order.models || []).length} model(u)`,
      user: currentUser,
    });

    navigate(`../${newId}`);
  }

  function deleteNote(noteId) {
    const notes = (order.notes || []).filter(n => n.id !== noteId);
    const updated = { ...order, updated_at: nowIso(), notes };
    persist(updated);
  }

  function toggleNoteExpand(noteId) {
    setExpandedNotes(prev => ({ ...prev, [noteId]: !prev[noteId] }));
  }

  const NOTE_QUICK_TEMPLATES = [
    'Kontaktovan zakaznik',
    'Cekame na potvrzeni',
    'Material objednan',
    'Model potrebuje opravu',
    'Expedovano',
  ];

  const NOTE_TYPE_CONFIG = {
    text:   { icon: 'MessageSquare', label: 'Text', color: 'var(--forge-accent-primary)' },
    status: { icon: 'RefreshCw',     label: 'Status', color: '#818cf8' },
    email:  { icon: 'Mail',          label: 'Email', color: '#fb923c' },
    file:   { icon: 'Paperclip',     label: 'Soubor', color: '#4ade80' },
  };

  function handlePrintSummary() {
    const companyData = readCompanyData();
    const html = generateOrderSummaryHTML(order, companyData);
    const w = window.open('', '_blank', 'width=820,height=900');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 350);
  }

  function handlePrintPackingSlip() {
    const companyData = readCompanyData();
    const html = generatePackingSlipHTML(order, companyData);
    const w = window.open('', '_blank', 'width=820,height=900');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 350);
  }

  function handleExportOrderJSON() {
    downloadJSON([order], `objednavka_${order.id || 'detail'}.json`);
  }

  function handleCopyOrderLink() {
    const url = `${window.location.origin}/admin/orders/${order.id}`;
    navigator.clipboard.writeText(url).catch(() => {});
    setCopyLinkFeedback(true);
    setTimeout(() => setCopyLinkFeedback(false), 2000);
  }

  function handleOpenFolder() {
    const folderPath = storage.storagePath || '';
    navigate(`/admin/model-storage?path=${encodeURIComponent(folderPath)}`);
  }

  function handleDownloadZip() {
    if (!hasStorage) return;
    createZip([storage.storagePath]).catch((e) => debug('[AdminOrderDetail] ZIP download failed', e));
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
      debug('[AdminOrderDetail] File download failed', err);
    }
  }

  // ── Invoice handlers ──
  function handleGenerateInvoice() {
    const companyData = readCompanyData();
    const invNumber = generateInvoiceNumber(order.id);
    const issueDateIso = new Date().toISOString();
    const dueDateIso = getDueDate(issueDateIso, 14);

    const html = generateInvoiceHTML(order, companyData, invNumber, {
      issueDate: issueDateIso,
      dueDate: dueDateIso,
    });

    const saved = saveInvoice(order.id, {
      invoiceNumber: invNumber,
      issueDate: issueDateIso,
      dueDate: dueDateIso,
      status: 'issued',
      htmlContent: html,
      totalAmount: totals.total,
    });

    setInvoice(saved);

    // Log in activity
    const updated = {
      ...order,
      updated_at: nowIso(),
      activity: [
        { timestamp: nowIso(), user_id: currentUser, type: 'INVOICE_CREATED', payload: { invoiceNumber: invNumber } },
        ...(order.activity || []),
      ].slice(0, 200),
    };
    persist(updated);
  }

  function handleTogglePaid() {
    if (!invoice) return;
    const nextStatus = invoice.status === 'paid' ? 'issued' : 'paid';
    const updated = updateInvoiceStatus(order.id, nextStatus);
    if (updated) setInvoice({ ...updated });

    // Log in activity
    const orderUpdated = {
      ...order,
      updated_at: nowIso(),
      activity: [
        { timestamp: nowIso(), user_id: currentUser, type: 'INVOICE_STATUS', payload: { status: nextStatus } },
        ...(order.activity || []),
      ].slice(0, 200),
    };
    persist(orderUpdated);
  }

  function handlePreviewInvoice() {
    if (!invoice?.htmlContent) return;
    setInvoicePreviewOpen(true);
  }

  function handlePrintInvoice() {
    if (!invoice?.htmlContent) return;
    const printWindow = window.open('', '_blank', 'width=820,height=900');
    if (!printWindow) return;
    printWindow.document.write(invoice.htmlContent);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 400);
  }

  // ── Email handlers ──
  function buildEmailVariables() {
    const customer = order.customer_snapshot || {};
    return {
      customerName: customer.name || '-',
      customerEmail: customer.email || '-',
      orderId: order.id || '-',
      orderDate: formatInvoiceDate(order.created_at),
      totalPrice: `${round2(totals.total).toFixed(2)} Kc`,
      itemCount: String((order.models || []).length),
      trackingUrl: '',
      companyName: readCompanyData().companyName || 'ModelPricer',
      statusText: getStatusLabel(order.status, 'cs'),
    };
  }

  function renderTemplate(htmlBody, subject, vars) {
    const replace = (str) =>
      str.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || `{{${key}}}`);
    return { body: replace(htmlBody || ''), subject: replace(subject || '') };
  }

  function handleSelectTemplate(templateId) {
    const templates = loadEmailTemplates();
    const tpl = templates[templateId];
    if (!tpl) return;

    const vars = buildEmailVariables();
    const rendered = renderTemplate(tpl.body, tpl.subject, vars);
    const tplType = EMAIL_TEMPLATE_TYPES.find(t => t.id === templateId);

    setEmailPreview({
      templateId,
      templateName: tplType?.label_cs || templateId,
      subject: rendered.subject,
      body: rendered.body,
      recipientEmail: (order.customer_snapshot || {}).email || '',
    });
    setEmailMenuOpen(false);
  }

  function handleSendEmail() {
    if (!emailPreview) return;

    const entry = logEmailSent(order.id, {
      templateId: emailPreview.templateId,
      templateName: emailPreview.templateName,
      recipientEmail: emailPreview.recipientEmail,
      subject: emailPreview.subject,
      hasInvoice: false,
    });
    addEmailLogEntry({
      template: emailPreview.templateId,
      recipient: emailPreview.recipientEmail,
      subject: emailPreview.subject,
      orderId: order.id,
      status: 'sent',
    });

    setEmailSentLog(getEmailLog(order.id));
    setEmailPreview(null);
    setEmailSuccess(true);
    setTimeout(() => setEmailSuccess(false), 3000);

    // Log in activity
    const updated = {
      ...order,
      updated_at: nowIso(),
      activity: [
        { timestamp: nowIso(), user_id: currentUser, type: 'EMAIL_SENT', payload: { template: emailPreview.templateId, recipient: emailPreview.recipientEmail } },
        ...(order.activity || []),
      ].slice(0, 200),
    };
    persist(updated);
  }

  const statusTone = order.status === 'CANCELED' ? 'red' : order.status === 'DONE' ? 'green' : 'blue';

  return (
    <div className="od-page">
      {/* ── Header ── */}
      <div className="od-header">
        <button className="od-btn" onClick={() => navigate('../')} type="button">
          <Icon name="ChevronLeft" size={16} /> {t('admin.orderDetail.back', 'Zpet')}
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h1 style={{
              margin: 0, fontSize: '24px', fontWeight: 900,
              color: 'var(--forge-text-primary)', fontFamily: 'var(--forge-font-heading)',
            }}>
              {t('admin.orderDetail.title', 'Objednavka')} {order.id}
            </h1>
            <StatusBadge status={order.status} />
          </div>
          <div style={{
            fontSize: '13px', color: 'var(--forge-text-muted)',
            marginTop: '4px', fontFamily: 'var(--forge-font-body)',
          }}>
            {t('admin.orderDetail.created', 'Vytvoreno')}: {formatDateTime(order.created_at)} | {t('admin.orderDetail.models', 'Modelu')}: {(order.models || []).length} | {t('admin.orderDetail.materials', 'Materialy')}: {materials.join(', ') || '-'}
          </div>
        </div>

        {/* Action buttons */}
        <div className="od-header-actions">
          <button className="od-btn" onClick={handlePrintSummary} type="button" title={t('admin.orderDetail.printSummary', 'Tisk souhrnu')}>
            <Icon name="Printer" size={16} /> {t('admin.orderDetail.printSummary', 'Tisk souhrnu')}
          </button>
          <div ref={emailMenuRef} style={{ position: 'relative' }}>
            <button className="od-btn" type="button" title={t('admin.orderDetail.sendEmail', 'Odeslat email')} onClick={() => setEmailMenuOpen(v => !v)}>
              <Icon name="Mail" size={16} /> {t('admin.orderDetail.sendEmail', 'Odeslat email')}
              <Icon name="ChevronDown" size={12} style={{ marginLeft: '2px', color: 'var(--forge-text-muted)', transform: emailMenuOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 150ms ease' }} />
            </button>
            {emailMenuOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 4px)', right: 0, minWidth: '220px',
                background: 'var(--forge-bg-surface)', border: '1px solid var(--forge-border-default)',
                borderRadius: 'var(--forge-radius-lg)', boxShadow: 'var(--forge-shadow-lg)',
                padding: '4px 0', zIndex: 60,
              }}>
                <div style={{
                  padding: '6px 12px', fontSize: '10px', fontFamily: 'var(--forge-font-tech)',
                  color: 'var(--forge-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>Vyberte sablonu</div>
                {EMAIL_TEMPLATE_TYPES.map(t => (
                  <button
                    key={t.id} type="button"
                    onClick={() => handleSelectTemplate(t.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                      padding: '8px 12px', border: 'none', background: 'transparent',
                      cursor: 'pointer', fontSize: '13px', fontFamily: 'var(--forge-font-body)',
                      color: 'var(--forge-text-primary)', textAlign: 'left',
                      transition: 'background-color 100ms ease',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--forge-bg-overlay)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Icon name={t.icon || 'Mail'} size={14} style={{ color: 'var(--forge-text-muted)' }} />
                    {t.label_cs}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="od-btn" onClick={handlePrintPackingSlip} type="button" title={t('admin.orderDetail.packingSlip', 'Dodaci list')}>
            <Icon name="ClipboardList" size={16} /> {t('admin.orderDetail.packingSlip', 'Dodaci list')}
          </button>
          <button className="od-btn" onClick={handleExportOrderJSON} type="button" title="Export JSON">
            <Icon name="Braces" size={16} /> Export JSON
          </button>
          <button className="od-btn" onClick={handleCopyOrderLink} type="button" title={t('admin.orderDetail.copyLink', 'Kopirovat odkaz')}>
            <Icon name={copyLinkFeedback ? 'Check' : 'Link'} size={16} />
            {copyLinkFeedback ? t('admin.orderDetail.copied', 'Zkopirovano') : t('admin.orderDetail.link', 'Odkaz')}
          </button>
          <button className="od-btn" onClick={() => handleDuplicateOrder(false)} type="button" title={t('admin.orderDetail.duplicate', 'Duplikovat objednavku')}>
            <Icon name="Copy" size={16} /> {t('admin.orderDetail.duplicate', 'Duplikovat')}
          </button>
          {(order.status === 'DONE' || order.status === 'SHIPPED') && (
            <button className="od-btn" onClick={() => handleDuplicateOrder(true)} type="button" title={t('admin.orderDetail.reorder', 'Objednat znovu')} style={{ borderColor: 'var(--forge-accent-primary)', color: 'var(--forge-accent-primary)' }}>
              <Icon name="RefreshCw" size={16} /> {t('admin.orderDetail.reorder', 'Objednat znovu')}
            </button>
          )}
          {order.status !== 'CANCELED' && order.status !== 'DONE' && (
            <button
              className="od-btn od-btn-danger"
              onClick={() => setConfirm({ type: 'cancel' })}
              type="button"
            >
              <Icon name="XCircle" size={16} /> {t('admin.orderDetail.cancelOrder', 'Zrusit objednavku')}
            </button>
          )}
        </div>
      </div>

      {/* Flags banner */}
      {flags.length > 0 && (
        <div className="od-banner-warning">
          <Icon name="AlertTriangle" size={18} />
          <div>
            <div style={{ fontWeight: 900, fontFamily: 'var(--forge-font-heading)' }}>{t('admin.orderDetail.warnings', 'Upozorneni')}</div>
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
          <Card title={t('admin.orderDetail.sectionItems', 'Polozky objednavky')} icon="Package">
            <div style={{ overflowX: 'auto' }}>
              <table className="od-table">
                <thead>
                  <tr>
                    <th>{t('admin.orderDetail.colModel', 'Model')}</th>
                    <th>{t('admin.orderDetail.colMaterial', 'Material')}</th>
                    <th>{t('admin.orderDetail.colQuality', 'Kvalita')}</th>
                    <th>{t('admin.orderDetail.colQty', 'Ks')}</th>
                    <th>{t('admin.orderDetail.colPrintTime', 'Cas tisku')}</th>
                    <th>{t('admin.orderDetail.colWeight', 'Hmotnost')}</th>
                    <th>{t('admin.orderDetail.colPricePerPc', 'Cena/ks')}</th>
                    <th>{t('admin.orderDetail.colTotal', 'Celkem')}</th>
                    {hasStorage && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {(order.models || []).map((m, idx) => (
                    <ExpandableModelRow
                      key={m.id}
                      m={m}
                      idx={idx}
                      hasStorage={hasStorage}
                      storage={storage}
                      onDownload={handleDownloadFile}
                    />
                  ))}
                  {(order.models || []).length === 0 && (
                    <tr><td colSpan={hasStorage ? 9 : 8} style={{ textAlign: 'center', padding: '24px', color: 'var(--forge-text-muted)' }}>{t('admin.orderDetail.noItems', 'Zadne polozky')}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Storage section */}
          <Card title={t('admin.orderDetail.sectionStorage', 'Soubory a uloziste')} icon="HardDrive">
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
                      {t('admin.orderDetail.openInStorage', 'Otevrit v Model Storage')}
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadZip}
                      className="od-btn"
                    >
                      <Icon name="Download" size={14} />
                      {t('admin.orderDetail.downloadZip', 'Stahnout ZIP')}
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
                    {t('admin.orderDetail.openFolder', 'Otevrit slozku')}
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
                {t('admin.orderDetail.noStorageFiles', 'Soubory objednavky nejsou v ulozisti.')}
              </div>
            )}
          </Card>

          {/* Pricing breakdown */}
          <Card title={t('admin.orderDetail.sectionPricing', 'Cenovy rozpad')} icon="Calculator">
            <div className="od-breakdown">
              <div className="od-b-row"><span>{t('admin.orderDetail.subtotalModels', 'Subtotal modely')}</span><span>{formatMoney(totals.subtotal_models)}</span></div>
              <div className="od-b-row"><span>{t('admin.orderDetail.oneTimeFees', 'Jednorazove poplatky')}</span><span>{formatMoney(totals.one_time_fees_total)}</span></div>
              <div className="od-b-row"><span>{t('admin.orderDetail.shipping', 'Doprava')}</span><span>{formatMoney(totals.shipping_total)}</span></div>
              {totals.min_order_delta !== 0 && (
                <div className="od-b-row"><span>{t('admin.orderDetail.minOrderAdjust', 'Min. objednavka (dorovnani)')}</span><span>{formatMoney(totals.min_order_delta)}</span></div>
              )}
              {totals.rounding_delta !== 0 && (
                <div className="od-b-row"><span>{t('admin.orderDetail.rounding', 'Zaokrouhleni')}</span><span>{formatMoney(totals.rounding_delta)}</span></div>
              )}
              <div className="od-b-row od-b-total"><span>{t('admin.orderDetail.total', 'Celkem')}</span><span>{formatMoney(totals.total)}</span></div>
            </div>

            {/* Summary stats */}
            <div className="od-stats-row">
              <div className="od-stat">
                <div className="od-stat-label">{t('admin.orderDetail.totalTime', 'Celkovy cas')}</div>
                <div className="od-stat-value">{formatTime(totals.sum_time_min)}</div>
              </div>
              <div className="od-stat">
                <div className="od-stat-label">{t('admin.orderDetail.totalWeight', 'Celkova hmotnost')}</div>
                <div className="od-stat-value">{round2(totals.sum_weight_g)} g</div>
              </div>
              <div className="od-stat">
                <div className="od-stat-label">{t('admin.orderDetail.totalPieces', 'Pocet kusu')}</div>
                <div className="od-stat-value">{totals.sum_pieces}</div>
              </div>
            </div>
          </Card>

          {/* Invoice section */}
          <Card title={t('admin.orderDetail.sectionInvoice', 'Faktura')} icon="FileText">
            {!invoice ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '16px 0' }}>
                <Icon name="FileText" size={32} style={{ opacity: 0.2, color: 'var(--forge-text-muted)' }} />
                <div style={{ fontSize: '13px', color: 'var(--forge-text-muted)', fontFamily: 'var(--forge-font-body)', textAlign: 'center' }}>
                  {t('admin.orderDetail.noInvoice', 'Pro tuto objednavku zatim nebyla vystavena faktura.')}
                </div>
                <button className="od-btn-primary" type="button" onClick={handleGenerateInvoice}>
                  <Icon name="FilePlus" size={14} /> {t('admin.orderDetail.createInvoice', 'Vystavit fakturu')}
                </button>
              </div>
            ) : (
              <div>
                {/* Invoice info grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                  <div style={{ padding: '8px 12px', background: 'var(--forge-bg-elevated)', borderRadius: 'var(--forge-radius-sm)', border: '1px solid var(--forge-border-default)' }}>
                    <div style={{ fontSize: '10px', fontFamily: 'var(--forge-font-tech)', color: 'var(--forge-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Cislo faktury</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--forge-text-primary)', fontFamily: 'var(--forge-font-tech)', marginTop: '2px' }}>{invoice.invoiceNumber}</div>
                  </div>
                  <div style={{ padding: '8px 12px', background: 'var(--forge-bg-elevated)', borderRadius: 'var(--forge-radius-sm)', border: '1px solid var(--forge-border-default)' }}>
                    <div style={{ fontSize: '10px', fontFamily: 'var(--forge-font-tech)', color: 'var(--forge-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Castka</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--forge-accent-primary)', fontFamily: 'var(--forge-font-tech)', marginTop: '2px' }}>{round2(invoice.totalAmount || 0).toFixed(2)} Kc</div>
                  </div>
                  <div style={{ padding: '8px 12px', background: 'var(--forge-bg-elevated)', borderRadius: 'var(--forge-radius-sm)', border: '1px solid var(--forge-border-default)' }}>
                    <div style={{ fontSize: '10px', fontFamily: 'var(--forge-font-tech)', color: 'var(--forge-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Datum vystaveni</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--forge-text-primary)', fontFamily: 'var(--forge-font-body)', marginTop: '2px' }}>{formatInvoiceDate(invoice.issueDate)}</div>
                  </div>
                  <div style={{ padding: '8px 12px', background: 'var(--forge-bg-elevated)', borderRadius: 'var(--forge-radius-sm)', border: '1px solid var(--forge-border-default)' }}>
                    <div style={{ fontSize: '10px', fontFamily: 'var(--forge-font-tech)', color: 'var(--forge-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Splatnost</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--forge-text-primary)', fontFamily: 'var(--forge-font-body)', marginTop: '2px' }}>{formatInvoiceDate(invoice.dueDate)}</div>
                  </div>
                </div>

                {/* Status toggle */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', background: invoice.status === 'paid'
                    ? 'rgba(34, 197, 94, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                  borderRadius: 'var(--forge-radius-md)',
                  border: `1px solid ${invoice.status === 'paid' ? 'rgba(34, 197, 94, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
                  marginBottom: '12px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon name={invoice.status === 'paid' ? 'CheckCircle2' : 'Clock'} size={16}
                      style={{ color: invoice.status === 'paid' ? 'var(--forge-success)' : 'var(--forge-warning)' }} />
                    <span style={{
                      fontSize: '13px', fontWeight: 700, fontFamily: 'var(--forge-font-body)',
                      color: invoice.status === 'paid' ? 'var(--forge-success)' : 'var(--forge-warning)',
                    }}>
                      {invoice.status === 'paid' ? t('admin.orderDetail.paid', 'Zaplaceno') : t('admin.orderDetail.unpaid', 'Nezaplaceno')}
                    </span>
                    {invoice.paidAt && invoice.status === 'paid' && (
                      <span style={{ fontSize: '11px', fontFamily: 'var(--forge-font-tech)', color: 'var(--forge-text-muted)' }}>
                        ({formatInvoiceDate(invoice.paidAt)})
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleTogglePaid}
                    className="od-btn"
                    style={{ padding: '5px 10px', fontSize: '11px' }}
                  >
                    {invoice.status === 'paid' ? t('admin.orderDetail.markUnpaid', 'Oznacit jako nezaplaceno') : t('admin.orderDetail.markPaid', 'Oznacit jako zaplaceno')}
                  </button>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button className="od-btn" type="button" onClick={handlePreviewInvoice}>
                    <Icon name="Eye" size={14} /> Nahled
                  </button>
                  <button className="od-btn-primary" type="button" onClick={handlePrintInvoice}>
                    <Icon name="Download" size={14} /> Stahnout PDF
                  </button>
                  <button className="od-btn" type="button" onClick={handleGenerateInvoice}>
                    <Icon name="RefreshCw" size={14} /> Pregenerovat
                  </button>
                </div>
              </div>
            )}
          </Card>

          {/* Email send log */}
          {emailSentLog.length > 0 && (
            <Card title="Odeslane emaily" icon="Send">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {emailSentLog.map((e) => (
                  <div key={e.id} style={{
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                    padding: '8px 12px', background: 'var(--forge-bg-elevated)',
                    borderRadius: 'var(--forge-radius-sm)', border: '1px solid var(--forge-border-default)',
                  }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, fontFamily: 'var(--forge-font-body)', color: 'var(--forge-text-primary)' }}>
                        {e.templateName || e.templateId}
                      </div>
                      <div style={{ fontSize: '11px', fontFamily: 'var(--forge-font-tech)', color: 'var(--forge-text-muted)', marginTop: '2px' }}>
                        {e.recipientEmail} — {e.subject}
                      </div>
                    </div>
                    <div style={{ fontSize: '10px', fontFamily: 'var(--forge-font-tech)', color: 'var(--forge-text-muted)', whiteSpace: 'nowrap', flexShrink: 0, marginLeft: '8px' }}>
                      {formatDateTime(e.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Customer info */}
          <Card title="Zakaznik" icon="User">
            <div className="od-kv">
              {[
                { key: 'name', label: 'Jmeno', value: customer.name },
                { key: 'email', label: 'Email', value: customer.email },
                { key: 'phone', label: 'Telefon', value: customer.phone },
                { key: 'company', label: 'Firma', value: customer.company },
              ].map(({ key, label, value }) => (
                <div key={key} className="od-kv-row od-kv-copyable" onClick={() => copyToClipboard(value || '-', `cust-${key}`)}>
                  <div>
                    <span className="od-kv-label">{label}</span>
                    <span className="od-kv-value" style={{ display: 'block', marginTop: '2px' }}>{value || '-'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); copyToClipboard(value || '-', `cust-${key}`); }}
                    className="od-copy-btn"
                    title="Kopirovat"
                  >
                    {copiedField === `cust-${key}` ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--forge-accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    )}
                  </button>
                </div>
              ))}
            </div>

            {/* Shipping address */}
            {order.shipping_address && (order.shipping_address.street || order.shipping_address.city) && (
              <div style={{ marginTop: '16px' }}>
                <div style={{
                  fontSize: '11px', fontFamily: 'var(--forge-font-tech)',
                  color: 'var(--forge-text-muted)', textTransform: 'uppercase',
                  letterSpacing: '0.06em', marginBottom: '8px',
                }}>Dorucovaci adresa</div>
                <div className="od-kv">
                  {[
                    { key: 'street', label: 'Ulice', value: order.shipping_address.street },
                    { key: 'city', label: 'Mesto', value: order.shipping_address.city },
                    { key: 'zip', label: 'PSC', value: order.shipping_address.zip },
                    { key: 'country', label: 'Stat', value: order.shipping_address.country },
                  ].filter(f => f.value).map(({ key, label, value }) => (
                    <div key={key} className="od-kv-row od-kv-copyable" onClick={() => copyToClipboard(value, `addr-${key}`)}>
                      <div>
                        <span className="od-kv-label">{label}</span>
                        <span className="od-kv-value" style={{ display: 'block', marginTop: '2px' }}>{value}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); copyToClipboard(value, `addr-${key}`); }}
                        className="od-copy-btn"
                        title="Kopirovat"
                      >
                        {copiedField === `addr-${key}` ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--forge-accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Company info (if business purchase) */}
            {order.is_company_purchase && order.company_info && (
              <div style={{ marginTop: '16px', padding: '16px', backgroundColor: 'var(--forge-bg-elevated)', borderRadius: 'var(--forge-radius-sm)', border: '1px solid var(--forge-border-default)' }}>
                <div style={{
                  fontSize: '11px', fontFamily: 'var(--forge-font-tech)',
                  color: 'var(--forge-text-muted)', textTransform: 'uppercase',
                  letterSpacing: '0.06em', marginBottom: '8px',
                }}>{t('orderDetail.companyInfo', 'Firemni udaje')}</div>
                <div className="od-kv">
                  {[
                    { key: 'name', label: t('orderDetail.companyName', 'Firma'), value: order.company_info.name },
                    { key: 'ico', label: 'ICO', value: order.company_info.ico },
                    { key: 'dic', label: 'DIC', value: order.company_info.dic },
                  ].filter(f => f.value).map(({ key, label, value }) => (
                    <div key={key} className="od-kv-row od-kv-copyable" onClick={() => copyToClipboard(value, `company-${key}`)}>
                      <div>
                        <span className="od-kv-label">{label}</span>
                        <span className="od-kv-value" style={{ display: 'block', marginTop: '2px' }}>{value}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); copyToClipboard(value, `company-${key}`); }}
                        className="od-copy-btn"
                        title="Kopirovat"
                      >
                        {copiedField === `company-${key}` ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--forge-accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Billing address (if different from shipping) */}
            {order.billing_address && !order.billing_address_same_as_shipping && (
              <div style={{ marginTop: '16px' }}>
                <div style={{
                  fontSize: '11px', fontFamily: 'var(--forge-font-tech)',
                  color: 'var(--forge-text-muted)', textTransform: 'uppercase',
                  letterSpacing: '0.06em', marginBottom: '8px',
                }}>{t('orderDetail.billingAddress', 'Fakturacni adresa')}</div>
                <div className="od-kv">
                  {[
                    { key: 'street', label: 'Ulice', value: order.billing_address.street },
                    { key: 'city', label: 'Mesto', value: order.billing_address.city },
                    { key: 'zip', label: 'PSC', value: order.billing_address.zip },
                    { key: 'country', label: 'Stat', value: order.billing_address.country },
                  ].filter(f => f.value).map(({ key, label, value }) => (
                    <div key={key} className="od-kv-row od-kv-copyable" onClick={() => copyToClipboard(value, `billing-${key}`)}>
                      <div>
                        <span className="od-kv-label">{label}</span>
                        <span className="od-kv-value" style={{ display: 'block', marginTop: '2px' }}>{value}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); copyToClipboard(value, `billing-${key}`); }}
                        className="od-copy-btn"
                        title="Kopirovat"
                      >
                        {copiedField === `billing-${key}` ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--forge-accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

        </div>

        {/* Right column: timeline + actions + stats + notes + activity */}
        <div className="od-col-right">
          {/* Order statistics charts */}
          <OrderStatsPanel order={order} totals={totals} />

          {/* Status change */}
          <Card title={t('admin.orderDetail.sectionStatus', 'Zmena stavu')} icon="RefreshCcw" style={{ position: 'sticky', top: '64px' }}>
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
                    const isAllowed = isActive || canTransition(order.status, s);
                    const nextAllowed = getNextStatuses(order.status);
                    const isNextStep = nextAllowed.includes(s);

                    let disabledReason = '';
                    if (!isAllowed && !isActive) {
                      disabledReason = `Nelze prejit z "${getStatusLabel(order.status, 'cs')}" na "${getStatusLabel(s, 'cs')}"`;
                    }

                    return (
                      <button
                        key={s} type="button" role="option" aria-selected={isActive}
                        onClick={() => isAllowed && !isActive ? initiateStatusChange(s) : undefined}
                        disabled={!isAllowed || isActive}
                        className="od-status-option"
                        title={disabledReason || undefined}
                        style={{
                          background: isActive ? 'var(--forge-bg-overlay)' : 'transparent',
                          fontWeight: isActive ? 600 : isNextStep ? 500 : 400,
                          opacity: isAllowed ? 1 : 0.35,
                          cursor: isAllowed && !isActive ? 'pointer' : 'default',
                          pointerEvents: isAllowed && !isActive ? 'auto' : isActive ? 'none' : 'auto',
                        }}
                      >
                        <span style={{
                          width: '8px', height: '8px', borderRadius: '50%',
                          backgroundColor: isAllowed ? sc.color : 'var(--forge-text-muted)',
                          flexShrink: 0,
                        }} />
                        <span style={{ color: isAllowed ? undefined : 'var(--forge-text-muted)' }}>
                          {getStatusLabel(s, 'cs')}
                        </span>
                        {isActive && (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginLeft: 'auto' }}>
                            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="var(--forge-accent-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                        {isNextStep && !isActive && (
                          <span style={{
                            marginLeft: 'auto', fontSize: '9px',
                            fontFamily: 'var(--forge-font-tech)',
                            color: 'var(--forge-accent-primary)',
                            textTransform: 'uppercase', letterSpacing: '0.04em',
                          }}>Dalsi</span>
                        )}
                        {!isAllowed && !isActive && (
                          <Icon name="Lock" size={10} style={{ marginLeft: 'auto', color: 'var(--forge-text-muted)', opacity: 0.5 }} />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>

          {/* Tags */}
          <Card title={t('admin.orderDetail.sectionTags', 'Stitky')} icon="Tag">
            <OrderTagSelector orderId={order.id} />
          </Card>

          {/* Status timeline */}
          <Card title={t('admin.orderDetail.sectionTimeline', 'Prubeh objednavky')} icon="GitBranch">
            <StatusTimeline order={order} />
          </Card>

          {/* Notes (Enhanced) */}
          <Card title={t('admin.orderDetail.sectionNotes', 'Poznamky')} icon="MessageSquare">
            {/* Note type selector + category */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              {Object.entries(NOTE_TYPE_CONFIG).map(([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setNoteType(key)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    padding: '4px 10px', borderRadius: '999px', fontSize: '11px',
                    fontFamily: 'var(--forge-font-tech)', fontWeight: 600, cursor: 'pointer',
                    border: noteType === key ? `1px solid ${cfg.color}` : '1px solid var(--forge-border-default)',
                    background: noteType === key ? `${cfg.color}15` : 'transparent',
                    color: noteType === key ? cfg.color : 'var(--forge-text-muted)',
                    transition: 'all 120ms ease',
                  }}
                >
                  <Icon name={cfg.icon} size={12} />
                  {cfg.label}
                </button>
              ))}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => setNoteCategory('internal')}
                  style={{
                    padding: '4px 8px', borderRadius: '999px', fontSize: '10px',
                    fontFamily: 'var(--forge-font-tech)', fontWeight: 700, cursor: 'pointer',
                    border: noteCategory === 'internal' ? '1px solid #f59e0b' : '1px solid var(--forge-border-default)',
                    background: noteCategory === 'internal' ? 'rgba(245, 158, 11, 0.12)' : 'transparent',
                    color: noteCategory === 'internal' ? 'var(--forge-warning)' : 'var(--forge-text-muted)',
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                  }}
                >
                  {t('admin.orderDetail.noteInternal', 'Interni')}
                </button>
                <button
                  type="button"
                  onClick={() => setNoteCategory('customer')}
                  style={{
                    padding: '4px 8px', borderRadius: '999px', fontSize: '10px',
                    fontFamily: 'var(--forge-font-tech)', fontWeight: 700, cursor: 'pointer',
                    border: noteCategory === 'customer' ? '1px solid #22d3ee' : '1px solid var(--forge-border-default)',
                    background: noteCategory === 'customer' ? 'rgba(34, 211, 238, 0.12)' : 'transparent',
                    color: noteCategory === 'customer' ? 'var(--forge-info)' : 'var(--forge-text-muted)',
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                  }}
                >
                  {t('admin.orderDetail.noteCustomer', 'Zakaznik')}
                </button>
              </div>
            </div>

            {/* Textarea + add button */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <textarea
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder={noteType === 'text' ? 'Napis poznamku...' : noteType === 'status' ? 'Poznamka ke zmene stavu...' : noteType === 'email' ? 'Poznamka k emailu...' : 'Poznamka k souboru...'}
                className="od-textarea"
                onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); addNote(); } }}
              />
              <button
                className="od-btn-primary"
                onClick={() => addNote()}
                type="button"
                disabled={!noteDraft.trim()}
                style={{
                  alignSelf: 'flex-end',
                  opacity: noteDraft.trim() ? 1 : 0.5,
                  cursor: noteDraft.trim() ? 'pointer' : 'default',
                }}
              >
                <Icon name="Plus" size={14} /> {t('admin.orderDetail.addNote', 'Pridat')}
              </button>
            </div>

            {/* Quick templates */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', flexWrap: 'wrap' }}>
              {NOTE_QUICK_TEMPLATES.map((tpl) => (
                <button
                  key={tpl}
                  type="button"
                  onClick={() => setNoteDraft(tpl)}
                  style={{
                    padding: '3px 8px', borderRadius: 'var(--forge-radius-md)',
                    fontSize: '11px', fontFamily: 'var(--forge-font-body)',
                    border: '1px solid var(--forge-border-default)',
                    background: 'var(--forge-bg-elevated)',
                    color: 'var(--forge-text-muted)', cursor: 'pointer',
                    transition: 'all 120ms ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--forge-border-active)'; e.currentTarget.style.color = 'var(--forge-text-primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--forge-border-default)'; e.currentTarget.style.color = 'var(--forge-text-muted)'; }}
                >
                  {tpl}
                </button>
              ))}
            </div>

            {/* Search notes */}
            {(order.notes || []).length > 2 && (
              <div style={{ marginBottom: '10px', position: 'relative' }}>
                <Icon name="Search" size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--forge-text-muted)', pointerEvents: 'none' }} />
                <input
                  type="text"
                  value={noteSearch}
                  onChange={(e) => setNoteSearch(e.target.value)}
                  placeholder="Hledat v poznAmkach..."
                  style={{
                    width: '100%', padding: '7px 10px 7px 30px',
                    background: 'var(--forge-bg-elevated)', border: '1px solid var(--forge-border-default)',
                    borderRadius: 'var(--forge-radius-md)', fontSize: '12px',
                    fontFamily: 'var(--forge-font-body)', color: 'var(--forge-text-primary)',
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
                {noteSearch && (
                  <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', fontFamily: 'var(--forge-font-tech)', color: 'var(--forge-text-muted)' }}>
                    {filteredNotes.length} / {(order.notes || []).length}
                  </span>
                )}
              </div>
            )}

            {/* Notes list */}
            {filteredNotes.length === 0 ? (
              <div style={{ color: 'var(--forge-text-muted)', fontSize: '13px', fontFamily: 'var(--forge-font-body)' }}>
                {noteSearch ? t('admin.orderDetail.notesNoMatch', 'Zadne poznamky neodpovidaji hledani.') : t('admin.orderDetail.notesEmpty', 'Zatim zadne poznamky.')}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {filteredNotes.map((n) => {
                  const typeConf = NOTE_TYPE_CONFIG[n.type] || NOTE_TYPE_CONFIG.text;
                  const isInternal = (n.category || 'internal') === 'internal';
                  const catColor = isInternal ? 'var(--forge-warning)' : 'var(--forge-info)';
                  const catLabel = isInternal ? 'Interni' : 'Zakaznik';
                  const isLong = (n.text || '').length > 200;
                  const isExpanded = expandedNotes[n.id];
                  const displayText = isLong && !isExpanded ? n.text.slice(0, 200) + '...' : n.text;

                  return (
                    <div key={n.id} style={{
                      padding: '10px 14px', background: n.pinned ? 'rgba(245, 158, 11, 0.05)' : 'var(--forge-bg-elevated)',
                      borderRadius: 'var(--forge-radius-md)',
                      borderLeft: `3px solid ${typeConf.color}`,
                      border: n.pinned ? '1px solid rgba(245, 158, 11, 0.2)' : undefined,
                      borderLeftWidth: '3px', borderLeftStyle: 'solid', borderLeftColor: typeConf.color,
                      position: 'relative',
                    }}>
                      {/* Header row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <Icon name={typeConf.icon} size={13} style={{ color: typeConf.color, flexShrink: 0 }} />
                        <span style={{ fontSize: '10px', fontFamily: 'var(--forge-font-tech)', color: typeConf.color, fontWeight: 700, textTransform: 'uppercase' }}>
                          {typeConf.label}
                        </span>
                        <span style={{
                          fontSize: '9px', fontFamily: 'var(--forge-font-tech)', fontWeight: 700,
                          padding: '1px 6px', borderRadius: '999px', textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          background: isInternal ? 'rgba(245, 158, 11, 0.12)' : 'rgba(34, 211, 238, 0.12)',
                          color: catColor, border: `1px solid ${catColor}30`,
                        }}>
                          {catLabel}
                        </span>
                        {n.pinned && (
                          <Icon name="Pin" size={11} style={{ color: 'var(--forge-warning)', flexShrink: 0 }} />
                        )}
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: '2px' }}>
                          <button
                            type="button"
                            title={n.pinned ? 'Odepnout' : 'Pripnout'}
                            onClick={() => toggleNotePin(n.id)}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px',
                              color: n.pinned ? 'var(--forge-warning)' : 'var(--forge-text-muted)',
                              opacity: n.pinned ? 1 : 0.5,
                              transition: 'opacity 120ms ease',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                            onMouseLeave={(e) => { if (!n.pinned) e.currentTarget.style.opacity = '0.5'; }}
                          >
                            <Icon name="Pin" size={12} />
                          </button>
                          <button
                            type="button"
                            title="Smazat"
                            onClick={() => deleteNote(n.id)}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px',
                              color: 'var(--forge-text-muted)', opacity: 0.4,
                              transition: 'opacity 120ms ease, color 120ms ease',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--forge-error)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.4'; e.currentTarget.style.color = 'var(--forge-text-muted)'; }}
                          >
                            <Icon name="Trash2" size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Note content */}
                      <p style={{
                        fontSize: '13px', color: 'var(--forge-text-primary)',
                        fontFamily: 'var(--forge-font-body)', margin: 0, whiteSpace: 'pre-wrap',
                      }}>{displayText}</p>
                      {isLong && (
                        <button
                          type="button"
                          onClick={() => toggleNoteExpand(n.id)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--forge-accent-primary)', fontSize: '11px',
                            fontFamily: 'var(--forge-font-tech)', padding: '2px 0', marginTop: '2px',
                          }}
                        >
                          {isExpanded ? 'Zobrazit mene' : 'Zobrazit vice'}
                        </button>
                      )}

                      {/* Footer */}
                      <div style={{
                        fontSize: '10px', color: 'var(--forge-text-muted)',
                        fontFamily: 'var(--forge-font-tech)', marginTop: '6px',
                        display: 'flex', gap: '8px',
                      }}>
                        <span>{n.timestamp ? formatDateTime(n.timestamp) : ''}</span>
                        <span>{n.user_id || ''}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
                                  : a.type === 'INVOICE_CREATED'
                                    ? `Faktura vystavena (${a.payload?.invoiceNumber || ''})`
                                    : a.type === 'INVOICE_STATUS'
                                      ? `Faktura: ${a.payload?.status === 'paid' ? 'zaplaceno' : 'nezaplaceno'}`
                                      : a.type === 'EMAIL_SENT'
                                        ? `Email odeslan: ${a.payload?.template || ''} \u2192 ${a.payload?.recipient || ''}`
                                        : a.type
                          }
                          {/* Status change note inline */}
                          {a.type === 'STATUS_CHANGE' && a.payload?.note && (
                            <div style={{
                              marginTop: '3px', padding: '4px 8px',
                              background: 'var(--forge-bg-elevated)',
                              borderRadius: 'var(--forge-radius-sm)',
                              borderLeft: '2px solid var(--forge-accent-primary)',
                              fontSize: '11px', fontFamily: 'var(--forge-font-body)',
                              color: 'var(--forge-text-muted)', fontStyle: 'italic',
                              fontWeight: 400,
                            }}>
                              {a.payload.note}
                            </div>
                          )}
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

      {/* Email success toast */}
      {emailSuccess && createPortal(
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000,
          background: 'rgba(34, 197, 94, 0.95)', color: 'var(--forge-text-primary)',
          padding: '12px 20px', borderRadius: 'var(--forge-radius-lg)',
          boxShadow: 'var(--forge-shadow-lg)',
          display: 'flex', alignItems: 'center', gap: '8px',
          fontFamily: 'var(--forge-font-body)', fontSize: '13px', fontWeight: 600,
          animation: 'fadeIn 200ms ease',
        }}>
          <Icon name="CheckCircle2" size={16} /> Email uspesne odeslan (simulovano)
        </div>,
        document.body
      )}

      {/* Email preview modal */}
      {emailPreview && createPortal(
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(8, 9, 12, 0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '18px', zIndex: 999,
        }} role="dialog" aria-modal="true" onClick={() => setEmailPreview(null)}>
          <div style={{
            backgroundColor: 'var(--forge-bg-surface)', borderRadius: 'var(--forge-radius-xl)',
            padding: '0', width: '100%', maxWidth: '640px', maxHeight: '85vh', overflow: 'hidden',
            boxShadow: 'var(--forge-shadow-lg)', border: '1px solid var(--forge-border-default)',
            display: 'flex', flexDirection: 'column',
          }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid var(--forge-border-default)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 800, fontFamily: 'var(--forge-font-heading)', color: 'var(--forge-text-primary)' }}>
                  Nahled emailu
                </div>
                <div style={{ fontSize: '12px', fontFamily: 'var(--forge-font-tech)', color: 'var(--forge-text-muted)', marginTop: '2px' }}>
                  {emailPreview.templateName}
                </div>
              </div>
              <button type="button" onClick={() => setEmailPreview(null)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--forge-text-muted)', padding: '4px',
              }}>
                <Icon name="X" size={18} />
              </button>
            </div>

            {/* Email meta */}
            <div style={{ padding: '12px 20px', background: 'var(--forge-bg-elevated)', borderBottom: '1px solid var(--forge-border-default)' }}>
              <div style={{ fontSize: '12px', fontFamily: 'var(--forge-font-body)', color: 'var(--forge-text-secondary)', marginBottom: '4px' }}>
                <strong>Komu:</strong> {emailPreview.recipientEmail || '(neuveden)'}
              </div>
              <div style={{ fontSize: '12px', fontFamily: 'var(--forge-font-body)', color: 'var(--forge-text-secondary)' }}>
                <strong>Predmet:</strong> {emailPreview.subject}
              </div>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
              <div
                style={{ fontSize: '14px', fontFamily: 'var(--forge-font-body)', color: 'var(--forge-text-primary)', lineHeight: 1.6 }}
                dangerouslySetInnerHTML={{ __html: sanitizeHtmlAllowBasic(emailPreview.body) }}
              />
            </div>

            {/* Footer */}
            <div style={{
              padding: '12px 20px', borderTop: '1px solid var(--forge-border-default)',
              display: 'flex', justifyContent: 'flex-end', gap: '8px',
            }}>
              <button className="od-btn" type="button" onClick={() => setEmailPreview(null)}>{t('admin.orderDetail.cancel', 'Zrusit')}</button>
              <button className="od-btn-primary" type="button" onClick={handleSendEmail}>
                <Icon name="Send" size={14} /> {t('admin.orderDetail.sendSimulated', 'Odeslat (simulovano)')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Invoice preview modal */}
      {invoicePreviewOpen && invoice?.htmlContent && createPortal(
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(8, 9, 12, 0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '18px', zIndex: 999,
        }} role="dialog" aria-modal="true" onClick={() => setInvoicePreviewOpen(false)}>
          <div style={{
            backgroundColor: '#fff', borderRadius: 'var(--forge-radius-xl)',
            width: '100%', maxWidth: '850px', maxHeight: '90vh', overflow: 'hidden',
            boxShadow: 'var(--forge-shadow-lg)', display: 'flex', flexDirection: 'column',
          }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{
              padding: '12px 20px', borderBottom: '1px solid #e5e7eb',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: '#f9fafb',
            }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>
                Nahled faktury {invoice.invoiceNumber}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="od-btn" type="button" onClick={handlePrintInvoice} style={{ fontSize: '11px', padding: '5px 10px' }}>
                  <Icon name="Download" size={12} /> PDF
                </button>
                <button type="button" onClick={() => setInvoicePreviewOpen(false)} style={{
                  background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '4px',
                }}>
                  <Icon name="X" size={18} />
                </button>
              </div>
            </div>
            {/* Content */}
            <div style={{ flex: 1, overflow: 'auto' }}>
              <iframe
                title="Invoice Preview"
                srcDoc={invoice.htmlContent}
                style={{ width: '100%', height: '100%', minHeight: '600px', border: 'none' }}
              />
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Status change note dialog */}
      <StatusChangeNoteDialog
        open={!!statusChangeDialog}
        fromStatus={statusChangeDialog?.from || 'NEW'}
        toStatus={statusChangeDialog?.to || 'NEW'}
        onConfirm={confirmStatusChange}
        onCancel={() => setStatusChangeDialog(null)}
        language={language}
      />

      {/* Cancel confirm */}
      <ConfirmModal
        open={confirm?.type === 'cancel'}
        title={t('admin.orderDetail.cancelOrder', 'Zrusit objednavku')}
        message={t('admin.orderDetail.cancelOrderMsg', "Opravdu chcete zrusit tuto objednavku? Tato akce zmeni stav na 'Zruseno'. Data objednavky zustanou zachovana.")}
        confirmText={t('admin.orderDetail.cancelOrderConfirm', 'Ano, zrusit objednavku')}
        cancelText={t('admin.orderDetail.cancelOrderNo', 'Ne, ponechat')}
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
    padding: 8px 12px;
    border-bottom: 1px solid var(--forge-border-default);
    border-radius: var(--forge-radius-sm);
    transition: background-color 100ms ease;
  }
  .od-kv-row:last-child { border-bottom: none; }
  .od-kv-copyable { cursor: pointer; }
  .od-kv-copyable:hover {
    background: var(--forge-bg-secondary, var(--forge-bg-elevated));
  }
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
  .od-copy-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--forge-text-muted);
    opacity: 0;
    transition: opacity 150ms ease, color 150ms ease;
    border-radius: var(--forge-radius-sm);
    flex-shrink: 0;
  }
  .od-copy-btn:hover {
    color: var(--forge-text-primary);
  }
  .od-kv-copyable:hover .od-copy-btn {
    opacity: 1;
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
  .od-status-option:hover:not(:disabled) {
    background: var(--forge-bg-overlay) !important;
  }
  .od-status-option:disabled {
    cursor: not-allowed !important;
  }
  .od-status-option:disabled:hover {
    background: transparent !important;
  }

  /* Expandable row cursor hint */
  .od-table tr[style*="cursor: pointer"]:hover td {
    background: rgba(0, 212, 170, 0.04) !important;
  }

  @media (max-width: 1050px) {
    .od-grid { grid-template-columns: 1fr; }
    .od-header { flex-direction: column; }
    .od-stats-row { grid-template-columns: 1fr; }
    .od-viewer-grid { grid-template-columns: 1fr !important; }
  }
`;
