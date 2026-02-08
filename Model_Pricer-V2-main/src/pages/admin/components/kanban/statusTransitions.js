// Valid status transitions for order management
const STATUS_ORDER = ['new', 'confirmed', 'printing', 'post_processing', 'ready', 'shipped', 'completed', 'cancelled'];

const ALLOWED_TRANSITIONS = {
  new: ['confirmed', 'cancelled'],
  confirmed: ['printing', 'cancelled'],
  printing: ['post_processing', 'ready', 'cancelled'],
  post_processing: ['ready', 'cancelled'],
  ready: ['shipped', 'cancelled'],
  shipped: ['completed'],
  completed: [],
  cancelled: ['new'], // Allow reopen
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
    new: '#3b82f6',
    confirmed: '#8b5cf6',
    printing: '#f59e0b',
    post_processing: '#06b6d4',
    ready: '#10b981',
    shipped: '#6366f1',
    completed: '#22c55e',
    cancelled: '#ef4444',
  };
  return colors[status] || '#9ca3af';
}

export function getStatusLabel(status) {
  const labels = {
    new: 'New',
    confirmed: 'Confirmed',
    printing: 'Printing',
    post_processing: 'Post-Processing',
    ready: 'Ready',
    shipped: 'Shipped',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };
  return labels[status] || status;
}

export { STATUS_ORDER, ALLOWED_TRANSITIONS };
