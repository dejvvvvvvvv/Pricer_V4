// Email trigger system
// Listens for order status changes and fires appropriate emails

import { sendTriggeredEmail } from './emailService.js';

const EVENT_MAP = {
  confirmed: 'order_confirmed',
  printing: 'order_printing',
  shipped: 'order_shipped',
  completed: 'order_completed',
  cancelled: 'order_cancelled',
};

export async function onOrderStatusChange({ orderId, newStatus, oldStatus, orderData, emailConfig }) {
  const event = EVENT_MAP[newStatus];
  if (!event) return null;

  try {
    const result = await sendTriggeredEmail({ event, orderData, emailConfig });
    return result;
  } catch (err) {
    console.error(`[triggers] Failed to send email for ${event}:`, err);
    return { success: false, error: err.message };
  }
}

export function getEventForStatus(status) {
  return EVENT_MAP[status] || null;
}
