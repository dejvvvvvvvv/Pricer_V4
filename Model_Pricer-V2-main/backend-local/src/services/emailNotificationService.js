/**
 * Email Notification Service
 *
 * Automatically sends email notifications when order status changes.
 * Pure business logic — no Express dependency (no req/res/next).
 *
 * Architecture:
 *   orders route (PATCH /status) --> onOrderStatusChange()
 *     --> resolves template for new status
 *     --> renders email via rich Czech template modules
 *     --> sends via emailProvider (Resend / SMTP / demo)
 *     --> returns result (never throws)
 *
 * Graceful by design:
 *   - Never throws — email failure must not block order updates
 *   - Logs results with masked PII
 *   - Respects tenant-level notification preferences
 *
 * @module services/emailNotificationService
 */

import { createProvider } from '../email/emailProvider.js';
import { logInfo, logWarn, logError } from '../util/logger.js';

// ── Status-to-template mapping ──

/**
 * Maps normalized order status values to template module identifiers.
 * Only statuses listed here will trigger an email notification.
 *
 * Template modules live in: backend-local/src/email/templates/<id>.js
 * Each exports a render(data) function returning { subject, html, text }.
 */
const STATUS_TEMPLATE_MAP = {
  confirmed: 'order-confirmed',
  approved: 'order-confirmed',   // "approved" uses the same confirmation template
  printing: 'order-printing',
  shipped: 'order-shipped',
  completed: 'order-completed',
};

/**
 * Event names emitted for logging / future webhook use.
 * Aligns with the existing triggers.js EVENT_MAP convention.
 */
const STATUS_EVENT_MAP = {
  confirmed: 'order_confirmed',
  approved: 'order_confirmed',
  printing: 'order_printing',
  shipped: 'order_shipped',
  completed: 'order_completed',
};

// ── Default tenant email notification config ──

/**
 * Default notification configuration used when tenant has no explicit config.
 * Tenant can override any of these via their stored email config.
 *
 * @type {EmailNotificationConfig}
 */
const DEFAULT_NOTIFICATION_CONFIG = {
  enabled: true,
  notifications: {
    confirmed: true,
    approved: true,
    printing: true,
    shipped: true,
    completed: true,
  },
};

// ── PII masking ──

/**
 * Mask an email address for safe logging.
 * Example: "jan.novak@email.cz" --> "j***@email.cz"
 *
 * @param {string} email
 * @returns {string} Masked email or "(empty)" if falsy
 */
function maskEmail(email) {
  if (!email || typeof email !== 'string') return '(empty)';
  const atIdx = email.indexOf('@');
  if (atIdx <= 0) return '***';
  return email[0] + '***' + email.slice(atIdx);
}

// ── Template loading ──

/**
 * Dynamically import a template module by its identifier.
 * Template modules are in backend-local/src/email/templates/<templateId>.js
 *
 * @param {string} templateId - Template identifier (e.g. "order-confirmed")
 * @returns {Promise<{ render: Function } | null>} The template module or null on failure
 */
async function loadTemplateModule(templateId) {
  try {
    // Dynamic import relative to the email/templates directory
    const mod = await import(`../email/templates/${templateId}.js`);
    if (typeof mod.render !== 'function') {
      logWarn(`[email-notify] Template "${templateId}" has no render() export`);
      return null;
    }
    return mod;
  } catch (err) {
    logError(`[email-notify] Failed to load template "${templateId}":`, err.message);
    return null;
  }
}

// ── Template data builder ──

/**
 * Build template data from order object and tenant config.
 * Normalizes the various order field names into the format expected by templates.
 *
 * @param {Object} order - Order data from ordersStore
 * @param {Object} tenantConfig - Tenant branding/company info
 * @returns {Object} Data object ready for template render()
 */
function buildTemplateData(order, tenantConfig) {
  return {
    orderNumber: order.orderNumber || order.id || '',
    customerName: order.customerName || order.customer?.name || '',
    customerEmail: order.customerEmail || order.customer?.email || '',
    items: order.items || order.models || [],
    totalPrice: Number(order.totalPrice) || 0,
    currency: order.currency || 'CZK',
    trackingUrl: order.trackingUrl || order.trackingNumber || '',
    companyName: tenantConfig?.companyName || tenantConfig?.shopName || 'ModelPricer',
    companyLogo: tenantConfig?.companyLogo || tenantConfig?.logoUrl || '',
  };
}

// ── Notification config resolver ──

/**
 * Merge tenant notification config with defaults.
 * Returns the effective config for deciding whether to send.
 *
 * @param {Object} [tenantConfig] - Tenant config object (may contain emailNotifications)
 * @returns {EmailNotificationConfig} Merged notification config
 */
function resolveNotificationConfig(tenantConfig) {
  const tenantEmailConfig = tenantConfig?.emailNotifications || tenantConfig?.emailConfig || {};

  const enabled = tenantEmailConfig.enabled !== undefined
    ? Boolean(tenantEmailConfig.enabled)
    : DEFAULT_NOTIFICATION_CONFIG.enabled;

  const notifications = {
    ...DEFAULT_NOTIFICATION_CONFIG.notifications,
    ...(tenantEmailConfig.notifications || {}),
  };

  return { enabled, notifications };
}

// ── Provider config resolver ──

/**
 * Extract email provider configuration from tenant config.
 *
 * @param {Object} [tenantConfig]
 * @returns {{ provider: string, from?: string, replyTo?: string }}
 */
function resolveProviderConfig(tenantConfig) {
  return {
    provider: tenantConfig?.emailProvider || tenantConfig?.emailConfig?.provider || process.env.EMAIL_PROVIDER || 'none',
    from: tenantConfig?.emailFrom || tenantConfig?.emailConfig?.from || process.env.EMAIL_FROM || undefined,
    replyTo: tenantConfig?.emailReplyTo || tenantConfig?.emailConfig?.replyTo || undefined,
  };
}

// ── Main entry point ──

/**
 * Handle an order status change by sending the appropriate email notification.
 *
 * This is the main entry point called by the orders route after a successful
 * status transition. It is designed to NEVER throw — all errors are caught
 * and returned in the result object.
 *
 * @param {Object} order - Full order object (from ordersStore)
 * @param {string} order.id - Order UUID
 * @param {string} order.orderNumber - Display order number (e.g. "ORD-00001")
 * @param {string} order.customerEmail - Customer email address
 * @param {string} order.customerName - Customer display name
 * @param {Array}  [order.items] - Order items
 * @param {number} [order.totalPrice] - Total price
 * @param {string} [order.currency] - Currency code
 * @param {string} [order.trackingUrl] - Tracking URL (for shipped status)
 * @param {string} oldStatus - Previous normalized status
 * @param {string} newStatus - New normalized status
 * @param {Object} [tenantConfig] - Tenant branding/company/email configuration
 * @param {string} [tenantConfig.companyName] - Company display name
 * @param {string} [tenantConfig.companyLogo] - Company logo URL
 * @param {string} [tenantConfig.emailProvider] - Email provider (resend/smtp/none)
 * @param {Object} [tenantConfig.emailNotifications] - Notification preferences
 * @param {boolean} [tenantConfig.emailNotifications.enabled] - Global toggle
 * @param {Object} [tenantConfig.emailNotifications.notifications] - Per-status toggles
 * @returns {Promise<EmailNotificationResult>} Result object (never throws)
 */
export async function onOrderStatusChange(order, oldStatus, newStatus, tenantConfig) {
  const logPrefix = '[email-notify]';

  try {
    // 1. Check if there is a template for this status
    const templateId = STATUS_TEMPLATE_MAP[newStatus];
    if (!templateId) {
      logInfo(`${logPrefix} No template for status "${newStatus}" — skipping`);
      return {
        sent: false,
        reason: 'no_template_for_status',
        status: newStatus,
      };
    }

    // 2. Check if order has a customer email
    const customerEmail = order?.customerEmail || order?.customer?.email;
    if (!customerEmail) {
      logWarn(`${logPrefix} Order ${order?.orderNumber || order?.id || '?'} has no customer email — skipping`);
      return {
        sent: false,
        reason: 'no_customer_email',
        orderId: order?.id,
      };
    }

    // 3. Check tenant notification preferences
    const notifConfig = resolveNotificationConfig(tenantConfig);

    if (!notifConfig.enabled) {
      logInfo(`${logPrefix} Email notifications disabled for tenant — skipping`);
      return {
        sent: false,
        reason: 'notifications_disabled',
        orderId: order?.id,
      };
    }

    if (notifConfig.notifications[newStatus] === false) {
      logInfo(`${logPrefix} Notification for status "${newStatus}" disabled — skipping`);
      return {
        sent: false,
        reason: 'status_notification_disabled',
        status: newStatus,
        orderId: order?.id,
      };
    }

    // 4. Load the template module
    const templateModule = await loadTemplateModule(templateId);
    if (!templateModule) {
      logError(`${logPrefix} Template module "${templateId}" not available — skipping`);
      return {
        sent: false,
        reason: 'template_load_failed',
        templateId,
        orderId: order?.id,
      };
    }

    // 5. Build template data and render
    const templateData = buildTemplateData(order, tenantConfig);
    let rendered;
    try {
      rendered = templateModule.render(templateData);
    } catch (renderErr) {
      logError(`${logPrefix} Template render error for "${templateId}":`, renderErr.message);
      return {
        sent: false,
        reason: 'template_render_failed',
        templateId,
        error: renderErr.message,
        orderId: order?.id,
      };
    }

    if (!rendered || !rendered.html) {
      logError(`${logPrefix} Template "${templateId}" returned empty HTML`);
      return {
        sent: false,
        reason: 'template_empty',
        templateId,
        orderId: order?.id,
      };
    }

    // 6. Send via provider
    const providerConfig = resolveProviderConfig(tenantConfig);
    const provider = createProvider(providerConfig);

    const sendResult = await provider.send({
      to: customerEmail,
      from: providerConfig.from,
      subject: rendered.subject || `Order update: ${order.orderNumber || ''}`,
      html: rendered.html,
      text: rendered.text || undefined,
      replyTo: providerConfig.replyTo,
    });

    const event = STATUS_EVENT_MAP[newStatus] || 'order_updated';
    logInfo(
      `${logPrefix} Email sent: event=${event}, to=${maskEmail(customerEmail)}, ` +
      `order=${order.orderNumber || order.id}, template=${templateId}, ` +
      `provider=${provider.type}, messageId=${sendResult.messageId || 'n/a'}`
    );

    return {
      sent: true,
      templateId,
      event,
      provider: provider.type,
      messageId: sendResult.messageId || undefined,
      orderId: order?.id,
    };

  } catch (err) {
    // Catch-all: email must NEVER break order flow
    logError(
      `${logPrefix} Unexpected error for order ${order?.orderNumber || order?.id || '?'}: ${err.message}`
    );
    return {
      sent: false,
      reason: 'unexpected_error',
      error: err.message,
      orderId: order?.id,
    };
  }
}

/**
 * Get the default notification configuration.
 * Useful for admin UI to show defaults when tenant has no custom config.
 *
 * @returns {EmailNotificationConfig} Default config (deep copy)
 */
export function getDefaultNotificationConfig() {
  return {
    enabled: DEFAULT_NOTIFICATION_CONFIG.enabled,
    notifications: { ...DEFAULT_NOTIFICATION_CONFIG.notifications },
  };
}

/**
 * Check if a given status would trigger an email notification.
 * Does NOT check tenant config — only checks if a template mapping exists.
 *
 * @param {string} status - Normalized order status
 * @returns {boolean}
 */
export function hasTemplateForStatus(status) {
  return Boolean(STATUS_TEMPLATE_MAP[status]);
}

/**
 * Get the list of statuses that have email templates.
 *
 * @returns {string[]} Array of status strings
 */
export function getNotifiableStatuses() {
  return Object.keys(STATUS_TEMPLATE_MAP);
}

// ── Type definitions (JSDoc only) ──

/**
 * @typedef {Object} EmailNotificationConfig
 * @property {boolean} enabled - Global toggle for email notifications
 * @property {Object.<string, boolean>} notifications - Per-status notification toggles
 */

/**
 * @typedef {Object} EmailNotificationResult
 * @property {boolean} sent - Whether the email was actually sent
 * @property {string} [reason] - Why email was not sent (when sent=false)
 * @property {string} [templateId] - Template used
 * @property {string} [event] - Event name (e.g. "order_confirmed")
 * @property {string} [provider] - Provider used (resend/smtp/none/demo)
 * @property {string} [messageId] - Provider message ID
 * @property {string} [error] - Error message if failed
 * @property {string} [status] - Order status that triggered the notification
 * @property {string} [orderId] - Order ID
 */
