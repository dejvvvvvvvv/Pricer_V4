// Valid status transitions for order management
// Aligned with ORDER_STATUSES from adminOrdersStorage.js
const STATUS_ORDER = ['NEW', 'REVIEW', 'APPROVED', 'PRINTING', 'POSTPROCESS', 'READY', 'SHIPPED', 'DONE', 'CANCELED'];

const ALLOWED_TRANSITIONS = {
  NEW: ['REVIEW', 'CANCELED'],
  REVIEW: ['APPROVED', 'CANCELED'],
  APPROVED: ['PRINTING', 'CANCELED'],
  PRINTING: ['POSTPROCESS', 'READY', 'CANCELED'],
  POSTPROCESS: ['READY', 'CANCELED'],
  READY: ['SHIPPED', 'CANCELED'],
  SHIPPED: ['DONE'],
  DONE: [],
  CANCELED: ['NEW'], // Allow reopen
};

export function canTransition(fromStatus, toStatus) {
  const allowed = ALLOWED_TRANSITIONS[fromStatus];
  if (!allowed) return false;
  return allowed.includes(toStatus);
}

export function getNextStatuses(currentStatus) {
  return ALLOWED_TRANSITIONS[currentStatus] || [];
}

export function getStatusColor(status) {
  const colors = {
    NEW: '#3b82f6',
    REVIEW: '#8b5cf6',
    APPROVED: '#a855f7',
    PRINTING: '#f59e0b',
    POSTPROCESS: '#06b6d4',
    READY: '#10b981',
    SHIPPED: '#6366f1',
    DONE: '#22c55e',
    CANCELED: '#ef4444',
  };
  return colors[status] || '#9ca3af';
}

export function getStatusLabel(status) {
  const labels = {
    NEW: 'Nova',
    REVIEW: 'Kontrola',
    APPROVED: 'Schvaleno',
    PRINTING: 'Tisk',
    POSTPROCESS: 'Postprocess',
    READY: 'Pripraveno',
    SHIPPED: 'Odeslano',
    DONE: 'Dokonceno',
    CANCELED: 'Zruseno',
  };
  return labels[status] || status;
}

export { STATUS_ORDER, ALLOWED_TRANSITIONS };
