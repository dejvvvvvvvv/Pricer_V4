/**
 * orderConstants.js — Shared order status UI constants
 *
 * Single source of truth for STATUS_COLORS and STATUS_LABELS.
 * Used by: AdminOrderDetail, OrderDetailModal
 */

export const STATUS_COLORS = {
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

export const STATUS_LABELS = {
  NEW:         { cs: 'Nova',        en: 'New' },
  REVIEW:      { cs: 'Ke kontrole', en: 'Review' },
  APPROVED:    { cs: 'Schvalena',   en: 'Approved' },
  PRINTING:    { cs: 'Tisk',        en: 'Printing' },
  POSTPROCESS: { cs: 'Povrch',      en: 'Post-processing' },
  READY:       { cs: 'Pripravena',  en: 'Ready' },
  SHIPPED:     { cs: 'Odeslana',    en: 'Shipped' },
  DONE:        { cs: 'Dokoncena',   en: 'Done' },
  CANCELED:    { cs: 'Zrusena',     en: 'Canceled' },
};

/** Returns STATUS_COLORS entry for the given status, falls back to NEW. */
export function getStatusColor(status) {
  return STATUS_COLORS[status] || STATUS_COLORS.NEW;
}
