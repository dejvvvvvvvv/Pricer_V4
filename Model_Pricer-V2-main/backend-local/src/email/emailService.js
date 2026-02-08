// Email Service - orchestrates rendering + sending
// Uses adapter pattern for provider flexibility

import { renderTemplate } from './templateRenderer.js';

const emailLog = [];
const MAX_LOG = 200;

function logEmail(entry) {
  emailLog.unshift({ ...entry, timestamp: new Date().toISOString() });
  if (emailLog.length > MAX_LOG) emailLog.length = MAX_LOG;
}

export function getEmailLog() {
  return [...emailLog];
}

export async function sendEmail({ to, subject, templateId, data, providerConfig }) {
  if (!to || !subject) {
    throw new Error('Missing required fields: to, subject');
  }

  // Render template
  let html = '';
  try {
    html = renderTemplate(templateId, data);
  } catch (err) {
    logEmail({ to, subject, templateId, status: 'failed', error: `Template error: ${err.message}` });
    throw err;
  }

  // Send via provider
  const provider = String(providerConfig?.provider || 'none');

  if (provider === 'none') {
    // Demo mode: just log it
    logEmail({ to, subject, templateId, status: 'demo', html: html.substring(0, 200) });
    return { success: true, mode: 'demo', message: 'Email logged (no provider configured)' };
  }

  if (provider === 'smtp') {
    // SMTP would use nodemailer - for now, simulate
    logEmail({ to, subject, templateId, status: 'sent', provider: 'smtp' });
    return { success: true, mode: 'smtp' };
  }

  if (provider === 'resend' || provider === 'sendgrid') {
    // API providers would use fetch - for now, simulate
    logEmail({ to, subject, templateId, status: 'sent', provider });
    return { success: true, mode: provider };
  }

  logEmail({ to, subject, templateId, status: 'failed', error: `Unknown provider: ${provider}` });
  throw new Error(`Unknown email provider: ${provider}`);
}

export async function sendTriggeredEmail({ event, orderData, emailConfig }) {
  if (!emailConfig || !Array.isArray(emailConfig.triggers)) return null;

  const trigger = emailConfig.triggers.find(t => t.event === event && t.enabled);
  if (!trigger) return null;

  const customerEmail = orderData?.customer?.email || orderData?.contact?.email;
  if (!customerEmail) return null;

  const subject = getSubjectForEvent(event, orderData);

  return sendEmail({
    to: customerEmail,
    subject,
    templateId: trigger.template_id || event,
    data: { order: orderData, event },
    providerConfig: emailConfig,
  });
}

function getSubjectForEvent(event, orderData) {
  const orderId = orderData?.id ? `#${String(orderData.id).slice(-6)}` : '';
  const subjects = {
    order_confirmed: `Order ${orderId} Confirmed`,
    order_printing: `Order ${orderId} is Being Printed`,
    order_shipped: `Order ${orderId} Has Been Shipped`,
    order_completed: `Order ${orderId} Completed`,
    order_cancelled: `Order ${orderId} Cancelled`,
  };
  return subjects[event] || `Order Update ${orderId}`;
}
