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

// How many hours an order can stay in a status before it's considered overdue
const OVERDUE_THRESHOLDS_HOURS = {
  NEW: 4,
  REVIEW: 8,
  APPROVED: 24,
  PRINTING: 72,
  POSTPROCESS: 48,
  READY: 24,
  SHIPPED: 168, // 7 days
  DONE: 0, // never overdue
  CANCELED: 0,
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

/**
 * Check if an order is overdue based on how long it has been in its current status.
 * @param {string} status - current status
 * @param {string} updatedAt - ISO date string of last status change (or created_at)
 * @returns {{ overdue: boolean, hoursInStatus: number, thresholdHours: number }}
 */
export function checkOverdue(status, updatedAt) {
  const threshold = OVERDUE_THRESHOLDS_HOURS[status] || 0;
  if (threshold <= 0) return { overdue: false, hoursInStatus: 0, thresholdHours: 0 };

  const now = Date.now();
  const updated = new Date(updatedAt || 0).getTime();
  const hoursInStatus = Math.max(0, (now - updated) / (1000 * 60 * 60));

  return {
    overdue: hoursInStatus >= threshold,
    hoursInStatus: Math.round(hoursInStatus),
    thresholdHours: threshold,
  };
}

export { STATUS_ORDER, ALLOWED_TRANSITIONS, OVERDUE_THRESHOLDS_HOURS };
